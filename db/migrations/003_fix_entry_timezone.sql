-- 003_fix_entry_timezone.sql
-- Pokrenuti NAKON što je novi kod (koji upisuje tz_fixed = true) objavljen.
-- Stare zapise reinterpretira kao lokalno vrijeme (Europe/Sarajevo). Sigurno ponovo pokrenuti.
UPDATE gym_entries
SET event_time = (event_time AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Sarajevo',
    tz_fixed = true
WHERE NOT tz_fixed;
