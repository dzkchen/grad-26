alter table surveys
  add column approved_at timestamptz;

update surveys
  set approved_at = submitted_at
  where approved_at is null;

create index surveys_approved_submitted_idx
  on surveys (submitted_at desc, id desc)
  where approved_at is not null;
