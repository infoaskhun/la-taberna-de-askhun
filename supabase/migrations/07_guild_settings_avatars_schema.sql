-- Migration to add gram and grum avatar URLs in guild_settings

ALTER TABLE guild_settings ADD COLUMN IF NOT EXISTS gram_avatar_url VARCHAR(1000);
ALTER TABLE guild_settings ADD COLUMN IF NOT EXISTS grum_avatar_url VARCHAR(1000);
