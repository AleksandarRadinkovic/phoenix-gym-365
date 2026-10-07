-- 004_backfill_payments.sql
-- Uplate od prije povezivanja panela: DSS ne čuva stari datum važenja, ali čuva početak
-- trenutne članarine (INITIAL_TIME -> gym_members.valid_from). Za svakog člana čija je
-- članarina počela u zadnjih 90 dana upisuje se stavka 'uplata' na dan početka.
-- Jedan upit (DO blok) jer Neon konzola ne prima više naredbi odjednom. Sigurno ponovo pokrenuti.
DO $mig$ BEGIN
  ALTER TABLE gym_renewals DROP CONSTRAINT IF EXISTS gym_renewals_kind_check;
  ALTER TABLE gym_renewals ADD CONSTRAINT gym_renewals_kind_check CHECK (kind IN ('produzenje', 'nova', 'uplata'));
  INSERT INTO gym_renewals (dss_person_id, full_name, person_code, kind, previous_until, new_until, renewed_at)
  SELECT m.dss_person_id, m.full_name, m.person_code, 'uplata', NULL, m.valid_until, m.valid_from
  FROM gym_members m
  WHERE NOT m.deleted
    AND m.valid_from >= now() - interval '90 days'
    AND m.valid_from <= now()
    AND m.valid_until > m.valid_from
    AND m.valid_until < m.valid_from + interval '400 days'
    AND NOT EXISTS (SELECT 1 FROM gym_renewals g WHERE g.dss_person_id = m.dss_person_id AND g.new_until = m.valid_until);
END $mig$;
