#!/usr/bin/env python3
"""
dss_alert.py — upozorenje na recepciji kad ista kartica/osoba uđe DRUGI PUT ISTI DAN.

Radi na DSS računaru (samo čita DSS bazu, ništa ne mijenja). Svake 2 sekunde
pogleda nove zapise u ac_door_access_record. Ako je ista osoba (bilo kojom svojom
karticom) već ušla danas, iskoči crveni prozor preko svega, uz zvuk, i ostaje dok
ga radnica ne zatvori. Opciono i narandžasto upozorenje kad uđe osoba kojoj je
članarina istekla.

Pravila:
  - "Danas" = kalendarski dan po vremenu DSS računara.
  - Dva provlačenja u razmaku manjem od ALERT_DEBOUNCE_SECONDS (default 120 s)
    se računaju kao jedan ulazak (npr. vrata se nisu odmah otvorila).
  - Ako je poznata kolona sa rezultatom otvaranja (DSS_ALERT_OK_COL), broje se
    samo propušteni ulasci; odbijeni se ne broje kao ulazak.

Pokretanje:
    pythonw dss_alert.py          (bez crnog prozora; ovo pokreće Task Scheduler pri prijavi)
    python  dss_alert.py --test   prikaže probno upozorenje (provjera zvuka i prozora)
    python  dss_alert.py --inspect ispiše kolone tabele ulazaka i zadnja 3 zapisa

Env varijable: iste DSS_DB_* kao dss_sync.py (DSS_DB_PASSWORD je obavezna), plus:
    ALERT_POLL_SECONDS       (default 2)
    ALERT_DEBOUNCE_SECONDS   (default 120)
    ALERT_EXPIRED            1 = upozori i na isteklu članarinu (default 1)
    DSS_ALERT_OK_COL         kolona rezultata (npr. OPEN_RESULT); prazno = broje se sva provlačenja
    DSS_ALERT_OK_VALUES      vrijednosti koje znače "propušten" (default "1")
"""

import os
import sys
import json
import queue
import socket
import logging
import argparse
import threading
import time
from pathlib import Path
from datetime import datetime, date

try:
    import pymysql
    import pymysql.cursors
except ImportError:
    print("Nedostaje paket 'pymysql'. Instaliraj sa: pip install pymysql", file=sys.stderr)
    sys.exit(1)

import tkinter as tk

try:
    import winsound  # samo Windows
except ImportError:  # pragma: no cover
    winsound = None


def env(name, default=None):
    return os.environ.get(name, default)


DB_HOST = env("DSS_DB_HOST", "127.0.0.1")
DB_PORT = int(env("DSS_DB_PORT", "3306"))
DB_USER = env("DSS_DB_USER", "gymapp_reader")
DB_PASSWORD = env("DSS_DB_PASSWORD", "")
DB_NAME = env("DSS_DB_NAME", "dss")

TABLE_RECORD = "ac_door_access_record"
TABLE_PERSON = env("DSS_PERSON_TABLE", "ac_person")
CARD_TABLE = env("DSS_CARD_TABLE", "ac_person_card")
CARD_NUMBER_COL = env("DSS_CARD_NUMBER_COL", "CARD_NUMBER")
CARD_PERSON_COL = env("DSS_CARD_PERSON_COL", "PERSON_ID")

POLL = float(env("ALERT_POLL_SECONDS", "2"))
DEBOUNCE = float(env("ALERT_DEBOUNCE_SECONDS", "120"))
ALERT_EXPIRED = env("ALERT_EXPIRED", "1") == "1"
OK_COL = env("DSS_ALERT_OK_COL", "").strip()
OK_VALUES = {v.strip() for v in env("DSS_ALERT_OK_VALUES", "1").split(",") if v.strip()}

HERE = Path(__file__).parent
LOG_FILE = Path(env("DSS_ALERT_LOG_FILE", str(HERE / "dss_alert.log")))
LOCK_PORT = int(env("DSS_ALERT_LOCK_PORT", "47365"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.FileHandler(LOG_FILE, encoding="utf-8")]
    + ([logging.StreamHandler(sys.stdout)] if sys.stdout else []),
)
log = logging.getLogger("dss_alert")


# ---------------------------------------------------------------------------
# Vrijeme
# ---------------------------------------------------------------------------

def to_dt(v):
    """DSS vrijeme (datetime / epoch s ili ms / tekst) -> lokalni datetime ili None."""
    if v is None or v == "":
        return None
    if isinstance(v, datetime):
        return v.replace(tzinfo=None)
    if isinstance(v, date):
        return datetime(v.year, v.month, v.day)
    if isinstance(v, (int, float)) or (isinstance(v, str) and v.strip().isdigit()):
        n = float(v)
        if n <= 0:
            return None
        if n > 1e11:
            n /= 1000.0
        return datetime.fromtimestamp(n)
    s = str(v).strip().replace("T", " ")[:19]
    try:
        return datetime.strptime(s, "%Y-%m-%d %H:%M:%S")
    except ValueError:
        return None


def visits(times):
    """Broj ulazaka: provlačenja bliža od DEBOUNCE sekundi se broje kao jedan."""
    n, last = 0, None
    for t in sorted(times):
        if last is None or (t - last).total_seconds() >= DEBOUNCE:
            n += 1
        last = t
    return n


# ---------------------------------------------------------------------------
# Baza (samo čitanje)
# ---------------------------------------------------------------------------

def connect_db():
    return pymysql.connect(
        host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASSWORD, database=DB_NAME,
        cursorclass=pymysql.cursors.DictCursor, connect_timeout=10, read_timeout=30, autocommit=True,
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


class Watcher:
    """Prati nove ulaske i javlja upozorenja u red za prikaz."""

    def __init__(self, out_queue):
        self.out = out_queue
        self.conn = None
        self.last_id = None
        self.person_key = None
        self.card_to_person = {}  # broj kartice -> id osobe
        self.person_info = {}  # id osobe -> {"name", "expire"}
        self.today = None
        self.seen = {}  # ključ osobe -> lista vremena ulazaka danas
        self.alerted = set()  # (ključ, record_id) već prikazani
        self.ok_col = OK_COL or None
        self.last_people_refresh = 0.0

    # --- veza / osobe -------------------------------------------------------

    def ensure_conn(self):
        if self.conn is None or not self.conn.open:
            self.conn = connect_db()
            log.info("Spojen na DSS bazu %s:%s", DB_HOST, DB_PORT)
        return self.conn

    def resolve_person_key(self, cur):
        if self.person_key:
            return self.person_key
        forced = env("DSS_PERSON_KEY_COL", "")
        if forced:
            self.person_key = forced
            return forced
        best, best_n = "ID", -1
        for col in ("ID", "PERSON_ID"):
            cur.execute(
                f"SELECT COUNT(*) AS n FROM `{CARD_TABLE}` c JOIN `{TABLE_PERSON}` p "
                f"ON CAST(p.`{col}` AS CHAR) = CAST(c.`{CARD_PERSON_COL}` AS CHAR)"
            )
            n = cur.fetchone()["n"]
            if n > best_n:
                best, best_n = col, n
        self.person_key = best
        return best

    def refresh_people(self, cur):
        key = self.resolve_person_key(cur)
        pcols = columns(cur, TABLE_PERSON)
        c_first = pick(pcols, "FIRST_NAME")
        c_last = pick(pcols, "LAST_NAME")
        c_name = pick(pcols, "PERSON_NAME", "NAME", "FULL_NAME")
        c_exp = pick(pcols, "EXPIRE_TIME", "END_TIME", "VALID_END_TIME", "VALID_TO")
        sel = [f"CAST(`{key}` AS CHAR) AS pid"]
        for alias, col in (("first", c_first), ("last", c_last), ("full", c_name), ("exp", c_exp)):
            sel.append(f"`{col}` AS {alias}" if col else f"NULL AS {alias}")
        cur.execute(f"SELECT {', '.join(sel)} FROM `{TABLE_PERSON}`")
        info = {}
        for r in cur.fetchall():
            name = (r.get("full") or " ".join(x for x in (r.get("first"), r.get("last")) if x) or "").strip()
            info[str(r["pid"])] = {"name": name or None, "expire": to_dt(r.get("exp"))}
        cur.execute(
            f"SELECT CAST(`{CARD_PERSON_COL}` AS CHAR) AS pid, `{CARD_NUMBER_COL}` AS cn FROM `{CARD_TABLE}` "
            f"WHERE `{CARD_NUMBER_COL}` IS NOT NULL AND `{CARD_NUMBER_COL}` <> ''"
        )
        cards = {str(r["cn"]).strip(): str(r["pid"]) for r in cur.fetchall()}
        self.person_info, self.card_to_person = info, cards
        self.last_people_refresh = time.time()

    def detect_ok_col(self, cur):
        if self.ok_col:
            cols = columns(cur, TABLE_RECORD)
            if self.ok_col not in cols:
                log.warning("Kolona %s ne postoji u %s — brojim sva provlačenja", self.ok_col, TABLE_RECORD)
                self.ok_col = None

    # --- ulasci -------------------------------------------------------------

    def fetch(self, cur, after_id, limit):
        extra = f", `{self.ok_col}` AS ok" if self.ok_col else ""
        cur.execute(
            f"SELECT ID AS id, CARD_NUMBER AS card, SWIPE_TIME AS t{extra} "
            f"FROM `{TABLE_RECORD}` WHERE ID > %s ORDER BY ID ASC LIMIT %s",
            (after_id, limit),
        )
        return cur.fetchall()

    def is_ok(self, r):
        if not self.ok_col:
            return True
        return str(r.get("ok")).strip() in OK_VALUES

    def person_key_for(self, card):
        card = (card or "").strip()
        pid = self.card_to_person.get(card)
        return (f"p:{pid}" if pid else f"c:{card}"), pid

    def start(self):
        """Početno stanje: zapamti današnje ulaske, ne upozoravaj za stare."""
        conn = self.ensure_conn()
        with conn.cursor() as cur:
            self.detect_ok_col(cur)
            self.refresh_people(cur)
            cur.execute(f"SELECT MAX(ID) AS m FROM `{TABLE_RECORD}`")
            max_id = int(cur.fetchone()["m"] or 0)
            # današnji ulasci su sigurno među zadnjih ~5000 zapisa
            rows = self.fetch(cur, max(0, max_id - 5000), 5000)
        self.today = date.today()
        for r in rows:
            t = to_dt(r["t"])
            if t and t.date() == self.today and self.is_ok(r):
                self.remember(r, t, alert=False)
        self.last_id = max_id
        log.info("Start: zadnji ID %s, osoba %d, kartica %d, danas već %d osoba ušlo (kolona rezultata: %s)",
                 max_id, len(self.person_info), len(self.card_to_person), len(self.seen), self.ok_col or "nema")

    def remember(self, r, t, alert=True):
        key, pid = self.person_key_for(r["card"])
        times = self.seen.setdefault(key, [])
        earlier = [x for x in times if (t - x).total_seconds() >= DEBOUNCE]
        duplicate_swipe = any(0 <= (t - x).total_seconds() < DEBOUNCE for x in times)
        times.append(t)
        if not alert:
            return
        info = self.person_info.get(pid or "", {})
        name = info.get("name") or f"Kartica {r['card']}"
        if earlier and not duplicate_swipe:
            n = visits(times)
            self.out.put({
                "kind": "repeat",
                "name": name,
                "card": r["card"],
                "first": min(earlier).strftime("%H:%M"),
                "now": t.strftime("%H:%M"),
                "count": n,
            })
            log.info("UPOZORENJE drugi ulazak: %s (kartica %s) prvi %s, sada %s",
                     name, r["card"], min(earlier).strftime("%H:%M"), t.strftime("%H:%M"))
        elif not earlier and not duplicate_swipe and ALERT_EXPIRED:
            exp = info.get("expire")
            if exp and exp < t:
                self.out.put({
                    "kind": "expired",
                    "name": name,
                    "card": r["card"],
                    "expired": exp.strftime("%d.%m.%Y."),
                    "now": t.strftime("%H:%M"),
                })
                log.info("UPOZORENJE istekla članarina: %s (isteklo %s)", name, exp.strftime("%d.%m.%Y."))

    def poll_once(self):
        conn = self.ensure_conn()
        with conn.cursor() as cur:
            if time.time() - self.last_people_refresh > 300:
                self.refresh_people(cur)
            rows = self.fetch(cur, self.last_id, 500)
            if rows and any(self.person_key_for(r["card"])[1] is None for r in rows):
                # nova kartica dodijeljena u međuvremenu
                self.refresh_people(cur)
        for r in rows:
            self.last_id = max(self.last_id, int(r["id"]))
            t = to_dt(r["t"])
            if not t or not self.is_ok(r):
                continue
            if t.date() != self.today:
                if t.date() > self.today:
                    self.today = t.date()
                    self.seen.clear()
                else:
                    continue  # zakasnio zapis od juče
            self.remember(r, t, alert=True)

    def run(self, stop):
        backoff = 5
        while not stop.is_set():
            try:
                if self.last_id is None:
                    self.start()
                self.poll_once()
                backoff = 5
                stop.wait(POLL)
            except Exception:
                log.exception("Greška pri čitanju DSS baze, pokušavam ponovo za %ds", backoff)
                try:
                    if self.conn:
                        self.conn.close()
                except Exception:
                    pass
                self.conn = None
                stop.wait(backoff)
                backoff = min(60, backoff * 2)


# ---------------------------------------------------------------------------
# Prikaz
# ---------------------------------------------------------------------------

class AlertUI:
    def __init__(self, root, in_queue):
        self.root = root
        self.q = in_queue
        self.open = []
        root.withdraw()
        root.after(300, self.pump)

    def pump(self):
        try:
            while True:
                self.show(self.q.get_nowait())
        except queue.Empty:
            pass
        self.root.after(300, self.pump)

    def beep(self, repeats=3):
        if not winsound:
            self.root.bell()
            return

        def play():
            for _ in range(repeats):
                try:
                    winsound.PlaySound("SystemExclamation", winsound.SND_ALIAS)
                except Exception:
                    winsound.MessageBeep()
                time.sleep(0.4)

        threading.Thread(target=play, daemon=True).start()

    def show(self, a):
        repeat = a["kind"] == "repeat"
        bg = "#b91c1c" if repeat else "#c2410c"
        w = tk.Toplevel(self.root)
        w.title("PHOENIX — upozorenje")
        w.configure(bg=bg)
        w.attributes("-topmost", True)
        w.resizable(False, False)

        title = f"{a['count']}. ULAZAK DANAS" if repeat else "ISTEKLA ČLANARINA"
        detail = (
            f"Prvi ulazak: {a['first']}     Sada: {a['now']}"
            if repeat
            else f"Članarina istekla: {a['expired']}     Sada: {a['now']}"
        )
        tk.Label(w, text="⚠  " + title, font=("Segoe UI", 26, "bold"), fg="white", bg=bg).pack(padx=40, pady=(28, 6))
        tk.Label(w, text=a["name"], font=("Segoe UI", 30, "bold"), fg="white", bg=bg).pack(padx=40)
        tk.Label(w, text=f"Kartica {a['card']}", font=("Segoe UI", 13), fg="#fee2e2", bg=bg).pack(pady=(2, 10))
        tk.Label(w, text=detail, font=("Segoe UI", 16), fg="white", bg=bg).pack(padx=40, pady=(0, 20))
        btn = tk.Button(
            w, text="U REDU", font=("Segoe UI", 16, "bold"), bg="white", fg=bg, activebackground="#f4f4f5",
            relief="flat", padx=36, pady=8, command=lambda: self.close(w),
        )
        btn.pack(pady=(0, 28))
        w.protocol("WM_DELETE_WINDOW", lambda: self.close(w))

        # centrirano, svako sljedeće malo niže da se vide sva
        w.update_idletasks()
        off = 40 * len(self.open)
        x = (w.winfo_screenwidth() - w.winfo_width()) // 2 + off
        y = (w.winfo_screenheight() - w.winfo_height()) // 3 + off
        w.geometry(f"+{x}+{y}")
        self.open.append(w)
        w.lift()
        w.focus_force()
        self.keep_on_top(w)
        self.beep(3 if repeat else 2)

    def keep_on_top(self, w):
        # neki programi (DSS klijent) znaju preuzeti fokus — vraćamo prozor na vrh
        if w in self.open:
            try:
                w.attributes("-topmost", True)
                w.lift()
            except tk.TclError:
                return
            self.root.after(3000, lambda: self.keep_on_top(w))

    def close(self, w):
        if w in self.open:
            self.open.remove(w)
        w.destroy()


# ---------------------------------------------------------------------------

def single_instance():
    """Samo jedna kopija skripte u isto vrijeme (Task Scheduler + ručno pokretanje)."""
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.bind(("127.0.0.1", LOCK_PORT))
    except OSError:
        return None
    return s


def inspect():
    conn = connect_db()
    with conn.cursor() as cur:
        print("Kolone", TABLE_RECORD, ":", columns(cur, TABLE_RECORD))
        cur.execute(f"SELECT * FROM `{TABLE_RECORD}` ORDER BY ID DESC LIMIT 3")
        for r in cur.fetchall():
            print({k: (str(v)[:30] if v is not None else None) for k, v in r.items() if "NAME" not in k.upper()})
    conn.close()


def main():
    ap = argparse.ArgumentParser(description="Upozorenje na drugi ulazak istog dana")
    ap.add_argument("--test", action="store_true", help="Prikaži probno upozorenje")
    ap.add_argument("--inspect", action="store_true", help="Ispiši kolone i zadnje zapise ulazaka")
    args = ap.parse_args()

    if args.inspect:
        inspect()
        return

    q = queue.Queue()
    root = tk.Tk()
    ui = AlertUI(root, q)

    if args.test:
        q.put({"kind": "repeat", "name": "Probni Član", "card": "12345678", "first": "09:14", "now": datetime.now().strftime("%H:%M"), "count": 2})
        root.after(15000, root.destroy)
        root.mainloop()
        return

    if not DB_PASSWORD:
        print("GREŠKA: nedostaje DSS_DB_PASSWORD", file=sys.stderr)
        sys.exit(1)

    lock = single_instance()
    if lock is None:
        log.info("Skripta već radi — izlazim.")
        return

    stop = threading.Event()
    watcher = Watcher(q)
    threading.Thread(target=watcher.run, args=(stop,), daemon=True).start()
    log.info("dss_alert pokrenut (provjera svakih %ss, razmak za dupli sken %ss)", POLL, DEBOUNCE)
    try:
        root.mainloop()
    finally:
        stop.set()


if __name__ == "__main__":
    main()
