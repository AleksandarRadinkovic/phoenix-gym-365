#!/usr/bin/env python3
"""
dss_sync.py — DSS Express (Dahua) -> Vercel KV -> Phoenix Gym panel.

Svaki prolaz radi dvije stvari:
  1. ULASCI: novi zapisi iz ac_door_access_record (iznad zadnjeg poslatog ID-a)
     -> red gym:access:queue
  2. OSOBE: sve osobe sa karticama i važenjem (EXPIRE_TIME). Šalju se samo
     osobe kojima se nešto promijenilo od prošlog prolaza (ime, kartica, važenje)
     -> red gym:members:queue. Panel iz promjene važenja prepoznaje PRODUŽENJE.

Vremena se šalju kao lokalno vrijeme DSS računara (bez zone); panel ih tumači
kao Europe/Sarajevo.

Veza KARTICA -> OSOBA se podešava env varijablama (vidi CARD_* ispod) — DSS
Express zna čuvati kartice u različitim tabelama zavisno od verzije.

Pokretanje:
    python dss_sync.py               jedan prolaz (ovo pokreće Task Scheduler)
    python dss_sync.py --inspect     ispiše šta bi se slalo, ne šalje ništa
    python dss_sync.py --members-full  ponovo pošalje SVE osobe (bez produženja)
    python dss_sync.py --reset-from N  postavi zadnji ID ulaza na N
"""

import os
import sys
import json
import time
import hashlib
import logging
import argparse
from pathlib import Path
from datetime import datetime, date, timezone

try:
    import pymysql
    import pymysql.cursors
except ImportError:
    print("Nedostaje paket 'pymysql'. Instaliraj sa: pip install pymysql", file=sys.stderr)
    sys.exit(1)

try:
    import requests
except ImportError:
    print("Nedostaje paket 'requests'. Instaliraj sa: pip install requests", file=sys.stderr)
    sys.exit(1)


def env(name, default=None, required=False):
    val = os.environ.get(name, default)
    if required and not val:
        print(f"GREŠKA: nedostaje obavezna varijabla {name}", file=sys.stderr)
        sys.exit(1)
    return val


DB_HOST = env("DSS_DB_HOST", "127.0.0.1")
DB_PORT = int(env("DSS_DB_PORT", "3306"))
DB_USER = env("DSS_DB_USER", "gymapp_reader")
DB_PASSWORD = env("DSS_DB_PASSWORD", required=True)
DB_NAME = env("DSS_DB_NAME", "dss")

TABLE_RECORD = "ac_door_access_record"
TABLE_PERSON = env("DSS_PERSON_TABLE", "ac_person")

# Veza kartica -> osoba (tabela, kolona sa brojem kartice, kolona sa ID-em osobe iz ac_person.ID)
# Potvrđeno dijagnostikom 2026-10-07: ac_person_card pokriva ~92% kartica iz ulazaka.
CARD_TABLE = env("DSS_CARD_TABLE", "ac_person_card")
CARD_NUMBER_COL = env("DSS_CARD_NUMBER_COL", "CARD_NUMBER")
CARD_PERSON_COL = env("DSS_CARD_PERSON_COL", "PERSON_ID")
# Kolona u ac_person na koju pokazuje CARD_PERSON_COL (ID ili PERSON_ID).
# Ako nije zadano, skripta sama provjeri koja se poklapa.
PERSON_KEY_COL = env("DSS_PERSON_KEY_COL", "")

KV_REST_API_URL = env("KV_REST_API_URL", required=True).rstrip("/")
KV_REST_API_TOKEN = env("KV_REST_API_TOKEN", required=True)
KV_QUEUE_KEY = env("KV_QUEUE_KEY", "gym:access:queue")
KV_MEMBER_QUEUE_KEY = env("KV_MEMBER_QUEUE_KEY", "gym:members:queue")

BATCH_SIZE = int(env("DSS_SYNC_BATCH_SIZE", "500"))

HERE = Path(__file__).parent
STATE_FILE = Path(env("DSS_SYNC_STATE_FILE", str(HERE / "dss_sync_state.json")))
MEMBER_STATE_FILE = Path(env("DSS_MEMBER_STATE_FILE", str(HERE / "dss_members_state.json")))
LOG_FILE = Path(env("DSS_SYNC_LOG_FILE", str(HERE / "dss_sync.log")))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.FileHandler(LOG_FILE, encoding="utf-8"), logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("dss_sync")


# ---------------------------------------------------------------------------
# Pomoćno
# ---------------------------------------------------------------------------

def load_json(path, default):
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception as e:
            log.warning("Ne mogu pročitati %s: %s", path, e)
    return default


def save_json(path, data):
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    tmp.replace(path)


def ts(v):
    """datetime/date/epoch -> 'YYYY-MM-DDTHH:MM:SS' (lokalno), ili None."""
    if v is None or v == "":
        return None
    if isinstance(v, datetime):
        if v.year < 1971:
            return None
        return v.replace(tzinfo=None, microsecond=0).isoformat()
    if isinstance(v, date):
        return datetime(v.year, v.month, v.day).isoformat()
    if isinstance(v, (int, float)):
        n = float(v)
        if n <= 0:
            return None
        if n > 1e11:  # milisekunde
            n = n / 1000.0
        return datetime.fromtimestamp(n).replace(microsecond=0).isoformat()
    s = str(v).strip()
    if not s or s.startswith("0000"):
        return None
    if s.isdigit():
        return ts(int(s))
    return s.replace(" ", "T")[:19]


def connect_db():
    return pymysql.connect(
        host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASSWORD, database=DB_NAME,
        cursorclass=pymysql.cursors.DictCursor, connect_timeout=10, read_timeout=60,
    )


def columns(cur, table):
    cur.execute(f"SHOW COLUMNS FROM `{table}`")
    return [r["Field"] for r in cur.fetchall()]


def pick(cols, *candidates):
    upper = {c.upper(): c for c in cols}
    for c in candidates:
        if c.upper() in upper:
            return upper[c.upper()]
    return None


# ---------------------------------------------------------------------------
# Vercel KV (Upstash REST)
# ---------------------------------------------------------------------------

def kv_push(key, payloads):
    if not payloads:
        return
    headers = {"Authorization": f"Bearer {KV_REST_API_TOKEN}", "Content-Type": "application/json"}
    for i in range(0, len(payloads), 200):
        chunk = payloads[i:i + 200]
        commands = [["RPUSH", key, json.dumps(p, ensure_ascii=False, default=str)] for p in chunk]
        resp = requests.post(f"{KV_REST_API_URL}/pipeline", headers=headers, data=json.dumps(commands), timeout=30)
        resp.raise_for_status()
        errors = [r for r in resp.json() if isinstance(r, dict) and r.get("error")]
        if errors:
            raise RuntimeError(f"Vercel KV greške: {errors[:3]}")


def resolve_person_key(cur):
    """Na koju kolonu ac_person pokazuje ac_person_card.PERSON_ID? Poredi se kao tekst (bez numeričkih poklapanja)."""
    global PERSON_KEY_COL
    if PERSON_KEY_COL:
        return PERSON_KEY_COL
    best, best_n = "ID", -1
    for col in ("ID", "PERSON_ID"):
        cur.execute(
            f"SELECT COUNT(*) AS n FROM `{CARD_TABLE}` c JOIN `{TABLE_PERSON}` p "
            f"ON CAST(p.`{col}` AS CHAR) = CAST(c.`{CARD_PERSON_COL}` AS CHAR)"
        )
        n = cur.fetchone()["n"]
        log.info("Veza kartica->osoba preko ac_person.%s: %d poklapanja", col, n)
        if n > best_n:
            best, best_n = col, n
    PERSON_KEY_COL = best
    return best


# ---------------------------------------------------------------------------
# 1) Ulasci
# ---------------------------------------------------------------------------

def fetch_new_records(cur, last_id):
    cur.execute(
        f"""
        SELECT r.ID AS record_id,
               r.CARD_NUMBER AS card_number,
               r.SWIPE_TIME AS event_time,
               r.DEVICE_NAME AS door_name,
               r.ENTEROREXIT AS enter_or_exit,
               p.FIRST_NAME AS first_name,
               p.LAST_NAME AS last_name,
               p.PERSON_ID AS person_code
        FROM `{TABLE_RECORD}` r
        LEFT JOIN (
            SELECT `{CARD_NUMBER_COL}` AS cn, MAX(CAST(`{CARD_PERSON_COL}` AS CHAR)) AS pid
            FROM `{CARD_TABLE}` GROUP BY `{CARD_NUMBER_COL}`
        ) c ON c.cn = r.CARD_NUMBER
        LEFT JOIN `{TABLE_PERSON}` p ON CAST(p.`{PERSON_KEY_COL}` AS CHAR) = c.pid
        WHERE r.ID > %s
        ORDER BY r.ID ASC
        LIMIT %s
        """,
        (last_id, BATCH_SIZE),
    )
    return cur.fetchall()


def sync_entries(cur, state, dry=False):
    last_id = state.get("last_id", 0)
    total = 0
    while True:
        rows = fetch_new_records(cur, last_id)
        if not rows:
            break
        payloads = []
        for r in rows:
            name = " ".join(x for x in [r.get("first_name"), r.get("last_name")] if x) or None
            payloads.append({
                "record_id": r["record_id"],
                "card_number": r["card_number"],
                "event_time": ts(r["event_time"]),
                "door_name": r["door_name"],
                "enter_or_exit": r["enter_or_exit"],
                "person_name": name,
                "person_code": r.get("person_code"),
                "synced_at": datetime.now(timezone.utc).isoformat(),
            })
        if dry:
            log.info("[inspect] %d novih ulazaka, primjer: %s", len(payloads), payloads[0])
            return len(payloads)
        kv_push(KV_QUEUE_KEY, payloads)
        last_id = max(r["record_id"] for r in rows)
        state["last_id"] = last_id
        state["last_sync_at"] = datetime.now(timezone.utc).isoformat()
        save_json(STATE_FILE, state)
        total += len(rows)
        if len(rows) < BATCH_SIZE:
            break
    log.info("Ulasci: poslano %d (last_id=%s)", total, last_id)
    return total


# ---------------------------------------------------------------------------
# 2) Osobe + važenje
# ---------------------------------------------------------------------------

def fetch_members(cur):
    pcols = columns(cur, TABLE_PERSON)
    c_first = pick(pcols, "FIRST_NAME")
    c_last = pick(pcols, "LAST_NAME")
    c_name = pick(pcols, "PERSON_NAME", "NAME", "FULL_NAME")
    c_code = pick(pcols, "PERSON_ID", "PERSON_CODE", "CODE")
    c_from = pick(pcols, "INITIAL_TIME", "START_TIME", "VALID_START_TIME", "BEGIN_TIME", "EFFECTIVE_TIME", "VALID_FROM")
    c_until = pick(pcols, "EXPIRE_TIME", "END_TIME", "VALID_END_TIME", "VALID_TO", "INVALID_TIME")
    c_upd = pick(pcols, "UPDATE_TIME", "MODIFY_TIME", "LAST_MODIFY_TIME", "UPDATED_AT")
    c_del = pick(pcols, "IS_DELETE", "IS_DELETED", "DELETED", "DEL_FLAG")
    if not c_until:
        raise RuntimeError(f"U {TABLE_PERSON} nema kolone za važenje (EXPIRE_TIME). Kolone: {pcols}")

    sel = [f"CAST(p.`{PERSON_KEY_COL}` AS CHAR) AS pid", "p.`ID` AS dss_id"]
    for alias, col in (("first_name", c_first), ("last_name", c_last), ("full_name", c_name), ("person_code", c_code),
                       ("valid_from", c_from), ("valid_until", c_until), ("updated", c_upd), ("is_del", c_del)):
        sel.append(f"p.`{col}` AS {alias}" if col else f"NULL AS {alias}")

    cur.execute(f"SELECT {', '.join(sel)} FROM `{TABLE_PERSON}` p")
    people = {str(r["pid"]): r for r in cur.fetchall()}

    cur.execute(f"SELECT CAST(`{CARD_PERSON_COL}` AS CHAR) AS pid, `{CARD_NUMBER_COL}` AS cn FROM `{CARD_TABLE}` "
                f"WHERE `{CARD_NUMBER_COL}` IS NOT NULL AND `{CARD_NUMBER_COL}` <> ''")
    cards = {}
    for r in cur.fetchall():
        cards.setdefault(str(r["pid"]), set()).add(str(r["cn"]).strip())

    out = {}
    for pid, r in people.items():
        if r.get("is_del") in (1, "1", True):
            continue
        out[pid] = {
            "dss_person_id": pid,
            "person_code": None if r.get("person_code") is None else str(r["person_code"]),
            "first_name": r.get("first_name"),
            "last_name": r.get("last_name"),
            "full_name": r.get("full_name"),
            "cards": sorted(cards.get(pid, set())),
            "valid_from": ts(r.get("valid_from")),
            "valid_until": ts(r.get("valid_until")),
            "dss_updated_at": ts(r.get("updated")),
        }
    return out


def fingerprint(m):
    keep = {k: m[k] for k in ("person_code", "first_name", "last_name", "full_name", "cards", "valid_from", "valid_until")}
    return hashlib.sha1(json.dumps(keep, sort_keys=True, ensure_ascii=False, default=str).encode()).hexdigest()[:16]


def sync_members(cur, full=False, dry=False):
    prev = load_json(MEMBER_STATE_FILE, None)
    baseline = prev is None or full
    prev = prev or {}
    members = fetch_members(cur)

    payloads, new_state = [], {}
    for pid, m in members.items():
        fp = fingerprint(m)
        new_state[pid] = fp
        if baseline or prev.get(pid) != fp:
            payloads.append({**m, "baseline": baseline})
    for pid in prev:
        if pid not in members:
            payloads.append({"dss_person_id": pid, "deleted": True})

    if dry:
        with_cards = sum(1 for m in members.values() if m["cards"])
        log.info("[inspect] osoba: %d (sa karticom: %d), za slanje: %d, baseline=%s",
                 len(members), with_cards, len(payloads), baseline)
        for p in payloads[:3]:
            log.info("[inspect] primjer: %s", {**p, "first_name": "***", "last_name": "***", "full_name": "***"})
        return len(payloads)

    kv_push(KV_MEMBER_QUEUE_KEY, payloads)
    save_json(MEMBER_STATE_FILE, new_state)
    log.info("Osobe: poslano %d promjena od %d osoba%s", len(payloads), len(members), " (početno slanje)" if baseline else "")
    return len(payloads)


# ----------------------------------------------------------------------------

def run_once(full_members=False, dry=False):
    state = load_json(STATE_FILE, {"last_id": 0})
    conn = connect_db()
    try:
        with conn.cursor() as cur:
            resolve_person_key(cur)
            try:
                sync_members(cur, full=full_members, dry=dry)
            except Exception:
                log.exception("Greška pri sinhronizaciji osoba (ulasci se i dalje šalju)")
            sync_entries(cur, state, dry=dry)
    finally:
        conn.close()


def main():
    ap = argparse.ArgumentParser(description="DSS Express -> Vercel KV sinhronizacija")
    ap.add_argument("--inspect", action="store_true", help="Pokaži šta bi se slalo, ne šalji ništa")
    ap.add_argument("--members-full", action="store_true", help="Ponovo pošalji sve osobe (bez bilježenja produženja)")
    ap.add_argument("--loop", action="store_true")
    ap.add_argument("--interval", type=int, default=int(env("DSS_SYNC_INTERVAL_SECONDS", "60")))
    ap.add_argument("--reset-from", type=int, default=None)
    args = ap.parse_args()

    if args.reset_from is not None:
        state = load_json(STATE_FILE, {"last_id": 0})
        state["last_id"] = args.reset_from
        save_json(STATE_FILE, state)
        print(f"last_id postavljen na {args.reset_from}")
        return

    if args.loop:
        while True:
            try:
                run_once()
            except Exception:
                log.exception("Greška u ciklusu, nastavljam za %ds", args.interval)
            time.sleep(args.interval)
    try:
        run_once(full_members=args.members_full, dry=args.inspect)
    except Exception:
        log.exception("Greška pri sinhronizaciji")
        sys.exit(1)


if __name__ == "__main__":
    main()
