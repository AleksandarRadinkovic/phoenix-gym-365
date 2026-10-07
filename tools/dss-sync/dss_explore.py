#!/usr/bin/env python3
"""
dss_explore.py — jednokratna dijagnostika DSS Express baze (samo čitanje).
Traži u kojoj tabeli je veza KARTICA -> OSOBA i kako izgleda važenje članarine.
Lična imena/telefoni se NE ispisuju (maskirani su).

Pokretanje na DSS računaru:  python dss_explore.py
Rezultat se ispiše na ekran i snimi u dss_explore_output.txt
"""
import os, sys, re
from pathlib import Path
import pymysql, pymysql.cursors

OUT = Path(__file__).parent / "dss_explore_output.txt"
lines = []
def p(*a):
    s = " ".join(str(x) for x in a)
    print(s); lines.append(s)

SENSITIVE = re.compile(r"NAME|TEL|PHONE|MAIL|ADDRESS|ID_?NO|ID_?NUM|CERT|PASSWORD|PHOTO|PIC|FACE|FINGER|BIRTH|REMARK|MEMO", re.I)

def mask(row):
    out = {}
    for k, v in row.items():
        if v is None:
            out[k] = None
        elif isinstance(v, (bytes, bytearray)):
            out[k] = f"<bin {len(v)}B>"
        elif SENSITIVE.search(k) and not k.upper().endswith("_ID"):
            out[k] = "***"
        else:
            s = str(v)
            out[k] = s[:40]
    return out

conn = pymysql.connect(
    host=os.environ.get("DSS_DB_HOST", "127.0.0.1"),
    port=int(os.environ.get("DSS_DB_PORT", "3306")),
    user=os.environ.get("DSS_DB_USER", "gymapp_reader"),
    password=os.environ["DSS_DB_PASSWORD"],
    database=os.environ.get("DSS_DB_NAME", "dss"),
    cursorclass=pymysql.cursors.DictCursor,
    connect_timeout=10, read_timeout=120,
)
cur = conn.cursor()

def q(sql, args=None):
    cur.execute(sql, args)
    return cur.fetchall()

# 1) Sve tabele koje liče na kartice/osobe/važenje/logove
tables = [list(r.values())[0] for r in q("SHOW TABLES")]
p("UKUPNO TABELA:", len(tables))
interesting = [t for t in tables if re.search(r"card|person|auth|valid|member|operat|log", t, re.I)]
p("\n== Zanimljive tabele (ime: broj redova) ==")
counts = {}
for t in interesting:
    try:
        c = q(f"SELECT COUNT(*) AS c FROM `{t}`")[0]["c"]
    except Exception as e:
        c = f"ERR {e.__class__.__name__}"
    counts[t] = c
    p(f"  {t}: {c}")

# 2) Kolone svih tabela koje imaju neku CARD kolonu
p("\n== Tabele sa kolonom koja sadrži 'CARD' ==")
card_tables = {}
for t in tables:
    try:
        cols = q(f"SHOW COLUMNS FROM `{t}`")
    except Exception:
        continue
    names = [c["Field"] for c in cols]
    cc = [n for n in names if "CARD" in n.upper() and ("NO" in n.upper() or "NUM" in n.upper() or n.upper() == "CARD")]
    if cc:
        card_tables[t] = (cc, names)
        p(f"  {t}  card_kolone={cc}")
        p(f"     sve kolone: {names}")

# 3) Koliko zadnjih 2000 kartica iz ulazaka se nađe u kojoj tabeli
recent = [r["CARD_NUMBER"] for r in q(
    "SELECT DISTINCT CARD_NUMBER FROM ac_door_access_record WHERE CARD_NUMBER IS NOT NULL AND CARD_NUMBER<>'' ORDER BY ID DESC LIMIT 2000")]
p(f"\n== Pokrivenost: {len(recent)} različitih kartica iz zadnjih ulazaka ==")
if recent:
    p("  primjer formata kartice iz ulazaka:", recent[:3])
    for t, (cc, _) in card_tables.items():
        if t == "ac_door_access_record":
            continue
        for col in cc:
            try:
                ph = ",".join(["%s"] * len(recent))
                hit = q(f"SELECT COUNT(DISTINCT `{col}`) AS c FROM `{t}` WHERE `{col}` IN ({ph})", recent)[0]["c"]
                sample = q(f"SELECT `{col}` AS v FROM `{t}` WHERE `{col}` IS NOT NULL LIMIT 3")
                p(f"  {t}.{col}: pogodaka {hit}/{len(recent)}   primjer vrijednosti: {[s['v'] for s in sample]}")
            except Exception as e:
                p(f"  {t}.{col}: ERR {e}")

# 4) Kolone zapisa ulaska + zadnji zapis (maskirano)
p("\n== ac_door_access_record kolone + zadnji zapis ==")
p("  ", [c["Field"] for c in q("SHOW COLUMNS FROM ac_door_access_record")])
for r in q("SELECT * FROM ac_door_access_record ORDER BY ID DESC LIMIT 2"):
    p("  ", mask(r))

# 5) ac_person: kolone, važenje
p("\n== ac_person kolone ==")
pcols = q("SHOW COLUMNS FROM ac_person")
for c in pcols:
    p(f"  {c['Field']}  {c['Type']}")
pnames = [c["Field"] for c in pcols]
p("\n== ac_person zadnje izmijenjene 3 osobe (maskirano) ==")
order = next((c for c in ("UPDATE_TIME", "MODIFY_TIME", "LAST_MODIFY_TIME", "CREATE_TIME") if c in pnames), "ID")
for r in q(f"SELECT * FROM ac_person ORDER BY `{order}` DESC LIMIT 3"):
    p("  ", mask(r))
if "EXPIRE_TIME" in pnames:
    st = q("""SELECT COUNT(*) AS ukupno,
                     SUM(EXPIRE_TIME >= NOW()) AS vazi_jos,
                     SUM(EXPIRE_TIME < NOW()) AS isteklo,
                     SUM(EXPIRE_TIME IS NULL) AS bez_datuma,
                     MIN(EXPIRE_TIME) AS min_exp, MAX(EXPIRE_TIME) AS max_exp
              FROM ac_person""")[0]
    p("\n== EXPIRE_TIME statistika ==", {k: str(v) for k, v in st.items()})

# 6) Ako postoje tabele sa logom operacija — kolone + zadnji red (za istoriju produženja)
p("\n== Tabele logova/operacija (kolone) ==")
for t in tables:
    if re.search(r"operat|oper_log|sys_log|audit", t, re.I):
        try:
            cols = [c["Field"] for c in q(f"SHOW COLUMNS FROM `{t}`")]
            p(f"  {t} ({counts.get(t, '?')}): {cols}")
        except Exception as e:
            p(f"  {t}: ERR {e}")

conn.close()
OUT.write_text("\n".join(lines), encoding="utf-8")
p(f"\nSnimljeno u {OUT}")
