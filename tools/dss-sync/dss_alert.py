#!/usr/bin/env python3
"""
dss_alert.py — upozorenje na recepciji za SUMNJIVE ulaske (ista osoba ulazi više puta).

Radi na DSS računaru (samo čita DSS bazu, ništa ne mijenja). Svake 2 sekunde pogleda
nove zapise u ac_door_access_record i primjenjuje ista pravila kao panel
(src/lib/gym/visits.ts):

  - Sva provlačenja u roku od ALERT_DEBOUNCE_SECONDS (120 s) od početka ulaska su isti
    ulazak (vrata nisu pročitala karticu iz prve).
  - Ulazak je SUMNJIV ako je prethodni ulazak iste osobe (bilo kojom njenom karticom):
      a) u istom "danu teretane" (dan traje od 05:00 do 05:00), ili
      b) prije manje od ALERT_MIN_GAP_HOURS (10) sati, npr. 23:00 pa 07:00.
  - Broje se samo propušteni ulasci (OPEN_TYPE_LEVEL = 1); odbijena kartica nije ulazak.

Kada niko nije na pultu (ALERT_QUIET_FROM 22:00 – ALERT_QUIET_TO 07:00) ništa ne iskače:
sumnjivi ulasci se pamte (i preko restarta) i ujutro iskoči JEDAN prozor sa spiskom.
Isto važi za ulaske koji su se desili dok je računar spavao / bio ugašen — čim se upali,
skripta pročita sve propušteno i pokaže spisak.

Osoblje (radnice) se izuzima: u dss_alert_ignore.txt jedno ime ili broj kartice po redu.

Pokretanje:
    pythonw dss_alert.py           (bez crnog prozora; ovo pokreće Task Scheduler pri prijavi)
    python  dss_alert.py --test    probno upozorenje + probni jutarnji spisak
    python  dss_alert.py --inspect kolone tabele ulazaka i zadnja 3 zapisa

Env varijable: iste DSS_DB_* kao dss_sync.py (DSS_DB_PASSWORD je obavezna), plus:
    ALERT_POLL_SECONDS (2), ALERT_DEBOUNCE_SECONDS (120), ALERT_MIN_GAP_HOURS (10),
    ALERT_DAY_START_HOUR (5), ALERT_QUIET_FROM (22), ALERT_QUIET_TO (7),
    ALERT_EXPIRED (1 = upozori i na isteklu članarinu),
    DSS_ALERT_OK_COL (OPEN_TYPE_LEVEL), DSS_ALERT_OK_VALUES ("1")
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
from datetime import datetime, date, timedelta

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
MIN_GAP_HOURS = float(env("ALERT_MIN_GAP_HOURS", "10"))
DAY_START_HOUR = int(env("ALERT_DAY_START_HOUR", "5"))
QUIET_FROM = int(env("ALERT_QUIET_FROM", "22"))
QUIET_TO = int(env("ALERT_QUIET_TO", "7"))
LAG_SECONDS = float(env("ALERT_LAG_SECONDS", "300"))  # stariji zapis = propušten (računar spavao)
OK_COL = env("DSS_ALERT_OK_COL", "OPEN_TYPE_LEVEL").strip()  # 1 = propušten, 2 = odbijen
OK_VALUES = {v.strip() for v in env("DSS_ALERT_OK_VALUES", "1").split(",") if v.strip()}

HERE = Path(__file__).parent
LOG_FILE = Path(env("DSS_ALERT_LOG_FILE", str(HERE / "dss_alert.log")))
LOCK_PORT = int(env("DSS_ALERT_LOCK_PORT", "47365"))
STATE_FILE = Path(env("DSS_ALERT_STATE_FILE", str(HERE / "dss_alert_state.json")))
IGNORE_FILE = Path(env("DSS_ALERT_IGNORE_FILE", str(HERE / "dss_alert_ignore.txt")))

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


def gym_day(t):
    """Dan teretane: ulazak u 00:30 pripada prethodnom danu (dan počinje u 05:00)."""
    return (t - timedelta(hours=DAY_START_HOUR)).date()


def is_quiet(now=None):
    h = (now or datetime.now()).hour
    if QUIET_FROM == QUIET_TO:
        return False
    if QUIET_FROM > QUIET_TO:
        return h >= QUIET_FROM or h < QUIET_TO
    return QUIET_FROM <= h < QUIET_TO


def fmt_gap(seconds):
    m = int(round(seconds / 60))
    if m < 60:
        return f"{m} min"
    h, r = divmod(m, 60)
    return f"{h} h {r} min" if r else f"{h} h"


def load_json(path, default):
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except Exception:
        return default


def save_json(path, data):
    tmp = Path(str(path) + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=1, default=str), encoding="utf-8")
    os.replace(tmp, path)


def load_ignore():
    try:
        lines = IGNORE_FILE.read_text(encoding="utf-8-sig").splitlines()
    except FileNotFoundError:
        return set()
    return {x.strip().lower() for x in lines if x.strip() and not x.strip().startswith("#")}


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
        self.visits = {}  # ključ osobe -> lista početaka ulazaka (zadnjih ~2 dana)
        self.ok_col = OK_COL or None
        self.last_people_refresh = 0.0
        state = load_json(STATE_FILE, {})
        self.saved_last_id = int(state.get("last_id") or 0)
        self.pending = list(state.get("pending") or [])  # sumnjivi ulasci za jutarnji spisak
        self.ignore = load_ignore()

    def save_state(self):
        try:
            save_json(STATE_FILE, {"last_id": self.last_id, "pending": self.pending, "updated": datetime.now().isoformat()})
        except Exception:
            log.exception("Ne mogu snimiti stanje")

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
        """Početno stanje: istorija zadnjih ~36 h bez upozorenja, pa sve propušteno od zadnjeg rada."""
        conn = self.ensure_conn()
        with conn.cursor() as cur:
            self.detect_ok_col(cur)
            self.refresh_people(cur)
            cur.execute(f"SELECT MAX(ID) AS m FROM `{TABLE_RECORD}`")
            max_id = int(cur.fetchone()["m"] or 0)
            # nastavak od zadnjeg obrađenog zapisa (računar spavao / bio ugašen), ali ne dalje od ~36 h
            resume = self.saved_last_id if 0 < self.saved_last_id <= max_id and max_id - self.saved_last_id < 5000 else max_id
            rows = self.fetch(cur, max(0, resume - 8000), 8000)
        since = datetime.now() - timedelta(hours=36)
        for r in rows:
            if int(r["id"]) > resume:
                break
            t = to_dt(r["t"])
            if t and t >= since and self.is_ok(r):
                self.process(r, t, alert=False)
        self.last_id = resume
        log.info("Start: zadnji ID %s (nastavljam od %s), osoba %d, kartica %d, osoba sa ulascima u 36 h: %d, "
                 "na čekanju za spisak: %d, izuzeto: %d (kolona rezultata: %s)",
                 max_id, resume, len(self.person_info), len(self.card_to_person), len(self.visits),
                 len(self.pending), len(self.ignore), self.ok_col or "nema")

    def ignored(self, card, name):
        return bool(self.ignore) and ((card or "").strip().lower() in self.ignore or (name or "").strip().lower() in self.ignore)

    def process(self, r, t, alert=True):
        key, pid = self.person_key_for(r["card"])
        starts = self.visits.setdefault(key, [])
        if starts and 0 <= (t - starts[-1]).total_seconds() < DEBOUNCE:
            return  # ponovljen sken istog ulaska
        prev = starts[-1] if starts else None
        starts.append(t)
        cutoff = t - timedelta(hours=48)
        while starts and starts[0] < cutoff:
            starts.pop(0)
        if not alert:
            return

        info = self.person_info.get(pid or "", {})
        name = info.get("name") or f"Kartica {r['card']}"
        if self.ignored(r["card"], info.get("name")):
            return
        exp = info.get("expire")
        today = [x for x in starts if gym_day(x) == gym_day(t)]
        lag = (datetime.now() - t).total_seconds()

        a = None
        if prev is not None:
            same_day = gym_day(prev) == gym_day(t)
            gap = (t - prev).total_seconds()
            if same_day or gap < MIN_GAP_HOURS * 3600:
                times = [] if same_day else [f"{prev.strftime('%d.%m.')} {prev.strftime('%H:%M')}"]
                times += [x.strftime("%H:%M") for x in today]
                reason = (f"{len(today)}. ulazak istog dana · {fmt_gap(gap)} nakon ulaska u {prev.strftime('%H:%M')}"
                          if same_day else
                          f"samo {fmt_gap(gap)} nakon ulaska u {prev.strftime('%H:%M')} prethodnog dana")
                a = {"kind": "repeat", "name": name, "card": r["card"], "count": len(today), "same_day": same_day,
                     "times": times, "reason": reason, "at": t.strftime("%d.%m. %H:%M")}
        if a is None and ALERT_EXPIRED and exp and exp < t:
            a = {"kind": "expired", "name": name, "card": r["card"], "expired": exp.strftime("%d.%m.%Y."),
                 "reason": f"članarina istekla {exp.strftime('%d.%m.%Y.')}", "at": t.strftime("%d.%m. %H:%M")}
        if a is None:
            return

        if is_quiet() or lag > LAG_SECONDS:
            self.pending.append(a)
            self.save_state()
            log.info("NA ČEKANJU (%s): %s — %s", "noć" if is_quiet() else "propušteno", name, a["reason"])
        else:
            self.out.put(a)
            log.info("UPOZORENJE: %s (kartica %s) — %s", name, r["card"], a["reason"])

    def poll_once(self):
        conn = self.ensure_conn()
        with conn.cursor() as cur:
            if time.time() - self.last_people_refresh > 300:
                self.refresh_people(cur)
                self.ignore = load_ignore()
            rows = self.fetch(cur, self.last_id, 500)
            if rows and any(self.person_key_for(r["card"])[1] is None for r in rows):
                self.refresh_people(cur)  # nova kartica dodijeljena u međuvremenu
        for r in rows:
            self.last_id = max(self.last_id, int(r["id"]))
            t = to_dt(r["t"])
            if t and self.is_ok(r):
                self.process(r, t, alert=True)
        if rows:
            self.save_state()
        # jutro (ili računar se probudio): jedan prozor sa svim što je čekalo
        if self.pending and not is_quiet():
            self.out.put({"kind": "summary", "items": self.pending})
            log.info("Prikazujem spisak %d ulazaka sa čekanja", len(self.pending))
            self.pending = []
            self.save_state()

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
        wake_display()
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

    def place(self, w):
        """Centrirano na ekranu; svaki sljedeći prozor malo niže da se vide svi."""
        w.update_idletasks()
        off = 40 * (len(self.open) - 1)
        ww, wh = w.winfo_reqwidth(), w.winfo_reqheight()
        x = max(0, (w.winfo_screenwidth() - ww) // 2 + off)
        y = max(0, (w.winfo_screenheight() - wh) // 3 + off)
        w.geometry(f"{ww}x{wh}+{x}+{y}")

    def window(self, bg, title):
        w = tk.Toplevel(self.root)
        w.title(title)
        w.configure(bg=bg)
        w.attributes("-topmost", True)
        w.resizable(False, False)
        w.protocol("WM_DELETE_WINDOW", lambda: self.close(w))
        return w

    def finish(self, w, bg, beeps):
        tk.Button(
            w, text="U REDU", font=("Segoe UI", 16, "bold"), bg="white", fg=bg, activebackground="#f4f4f5",
            relief="flat", padx=36, pady=8, command=lambda: self.close(w),
        ).pack(pady=(4, 26))
        self.open.append(w)
        self.place(w)
        w.after(80, lambda: self.place(w))  # Windows ponekad ignoriše prvo pozicioniranje
        w.lift()
        w.focus_force()
        self.keep_on_top(w)
        self.beep(beeps)

    def show(self, a):
        if a["kind"] == "summary":
            return self.show_summary(a["items"])
        repeat = a["kind"] == "repeat"
        bg = "#b91c1c" if repeat else "#c2410c"
        w = self.window(bg, "PHOENIX — upozorenje")
        if repeat:
            title = f"{a['count']}. ULAZAK DANAS" if a.get("same_day") else "SUMNJIV ULAZAK"
        else:
            title = "ISTEKLA ČLANARINA"
        tk.Label(w, text="⚠  " + title, font=("Segoe UI", 26, "bold"), fg="white", bg=bg).pack(padx=40, pady=(28, 6))
        tk.Label(w, text=a["name"], font=("Segoe UI", 30, "bold"), fg="white", bg=bg).pack(padx=40)
        tk.Label(w, text=f"Kartica {a['card']}", font=("Segoe UI", 13), fg="#fee2e2", bg=bg).pack(pady=(2, 12))
        if repeat:
            box = tk.Frame(w, bg=bg)
            box.pack(padx=40, pady=(0, 6))
            tk.Label(box, text="Ulasci:", font=("Segoe UI", 15, "bold"), fg="white", bg=bg).pack(anchor="w")
            n = len(a["times"])
            for i, tm in enumerate(a["times"], 1):
                last = i == n
                label = f"{i}.  {tm}" + ("   ← SADA" if last else "")
                tk.Label(box, text=label, font=("Segoe UI", 16, "bold" if last else "normal"), fg="white", bg=bg).pack(anchor="w")
        tk.Label(w, text=a["reason"], font=("Segoe UI", 13), fg="#fee2e2", bg=bg, wraplength=560, justify="center").pack(padx=40, pady=(6, 18))
        self.finish(w, bg, 3 if repeat else 2)

    def show_summary(self, items):
        bg = "#7c2d12"
        w = self.window(bg, "PHOENIX — sumnjivi ulasci dok niko nije bio na pultu")
        tk.Label(w, text=f"⚠  SUMNJIVI ULASCI ({len(items)})", font=("Segoe UI", 24, "bold"), fg="white", bg=bg).pack(padx=40, pady=(24, 2))
        tk.Label(w, text="Dok niko nije bio na pultu (noću) ili dok je računar bio ugašen / spavao",
                 font=("Segoe UI", 12), fg="#fed7aa", bg=bg).pack(padx=40, pady=(0, 12))
        frame = tk.Frame(w, bg=bg)
        frame.pack(padx=24, pady=(0, 12), fill="both", expand=True)
        txt = tk.Text(frame, width=70, height=min(16, max(4, len(items) * 2 + 1)), font=("Segoe UI", 12),
                      bg="#431407", fg="white", relief="flat", wrap="word", padx=12, pady=8)
        sb = tk.Scrollbar(frame, command=txt.yview)
        txt.configure(yscrollcommand=sb.set)
        txt.pack(side="left", fill="both", expand=True)
        if len(items) > 7:
            sb.pack(side="right", fill="y")
        txt.tag_configure("name", font=("Segoe UI", 13, "bold"))
        for a in items:
            txt.insert("end", f"{a.get('at', '')}  ", ())
            txt.insert("end", a["name"], ("name",))
            detail = "  ·  ".join(a.get("times") or [])
            txt.insert("end", f"\n      {a['reason']}" + (f"   (ulasci: {detail})" if detail else "") + "\n")
        txt.configure(state="disabled")
        self.finish(w, bg, 2)

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

def wake_display():
    """Ekran na recepciji se gasi nakon 15 min — upali ga kad iskoči upozorenje (računar ne spava, samo monitor)."""
    try:
        import ctypes
        ctypes.windll.kernel32.SetThreadExecutionState(0x00000002)  # ES_DISPLAY_REQUIRED: resetuje tajmer ekrana
        ctypes.windll.user32.mouse_event(0x0001, 1, 0, 0, 0)  # mali pomak miša budi monitor
        ctypes.windll.user32.mouse_event(0x0001, -1, 0, 0, 0)
    except Exception:
        pass


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
        now = datetime.now().strftime("%H:%M")
        q.put({"kind": "repeat", "name": "Probni Član", "card": "12345678", "count": 3, "same_day": True,
               "times": ["09:14", "13:02", now], "reason": f"3. ulazak istog dana · 4 h nakon ulaska u 13:02"})
        q.put({"kind": "summary", "items": [
            {"name": "Probni Član", "at": "19.11. 23:05", "reason": "samo 8 h nakon ulaska u 15:10 prethodnog dana",
             "times": ["19.11. 15:10", "23:05"]},
            {"name": "Drugi Član", "at": "20.11. 00:40", "reason": "2. ulazak istog dana · 3 h 10 min nakon ulaska u 21:30",
             "times": ["21:30", "00:40"]},
        ]})
        root.after(20000, root.destroy)
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
