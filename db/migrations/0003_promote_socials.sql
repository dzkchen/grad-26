alter table surveys
  add column if not exists linkedin text
  check (linkedin is null or char_length(linkedin) <= 200);

update surveys
  set linkedin = answers->>'linkedin'
  where linkedin is null and answers ? 'linkedin';

update surveys
  set answers = answers - 'linkedin'
  where answers ? 'linkedin';
