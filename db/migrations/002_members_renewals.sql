-- 002_members_renewals.sql
-- Osobe i važenje kartica iz DSS-a + evidencija produženja članarina.
-- Pokreće se jednom (Vercel -> Storage -> Neon -> Query). Sigurno ponovo pokrenuti.

CREATE TABLE IF NOT EXISTS gym_members (
  dss_person_id  text PRIMARY KEY,
  person_code    text,
  full_name      text,
  valid_from     timestamptz,
  valid_until    timestamptz,
  deleted        boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gym_members_valid_until_idx ON gym_members (valid_until);

CREATE TABLE IF NOT EXISTS gym_member_cards (
  card_number    text PRIMARY KEY,
  dss_person_id  text NOT NULL REFERENCES gym_members (dss_person_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS gym_member_cards_person_idx ON gym_member_cards (dss_person_id);

CREATE TABLE IF NOT EXISTS gym_renewals (
  id              bigserial PRIMARY KEY,
  dss_person_id   text NOT NULL,
  full_name       text,
  person_code     text,
  kind            text NOT NULL CHECK (kind IN ('produzenje', 'nova')),
  previous_until  timestamptz,
  new_until       timestamptz,
  renewed_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gym_renewals_renewed_at_idx ON gym_renewals (renewed_at DESC);
CREATE INDEX IF NOT EXISTS gym_renewals_person_idx ON gym_renewals (dss_person_id);

-- Ulasci: brže pretrage po kartici i vremenu
CREATE INDEX IF NOT EXISTS gym_entries_card_time_idx ON gym_entries (card_number, event_time);
CREATE INDEX IF NOT EXISTS gym_entries_event_time_idx ON gym_entries (event_time);

-- Ispravka vremena: DSS šalje lokalno vrijeme bez zone, a stari kod ga je upisivao kao UTC
-- (+2h ljeti / +1h zimi). Novi kod upisuje ispravno i postavlja tz_fixed = true.
ALTER TABLE gym_entries ADD COLUMN IF NOT EXISTS tz_fixed boolean NOT NULL DEFAULT false;
