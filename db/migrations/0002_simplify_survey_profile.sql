alter table surveys
  drop column if exists tiktok_handle,
  drop column if exists other_social_url,
  drop column if exists post_secondary,
  drop column if exists hide_post_secondary;
