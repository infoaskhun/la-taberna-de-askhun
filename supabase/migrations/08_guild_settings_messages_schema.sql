-- Migration to add dynamic tavern failure messages in guild_settings

ALTER TABLE guild_settings ADD COLUMN IF NOT EXISTS gram_msg_not_found VARCHAR(1000);
ALTER TABLE guild_settings ADD COLUMN IF NOT EXISTS gram_msg_no_money VARCHAR(1000);
ALTER TABLE guild_settings ADD COLUMN IF NOT EXISTS grum_msg_not_found VARCHAR(1000);
ALTER TABLE guild_settings ADD COLUMN IF NOT EXISTS grum_msg_no_money VARCHAR(1000);
