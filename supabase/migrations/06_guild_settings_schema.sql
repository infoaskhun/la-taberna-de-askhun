-- Guild settings schema to dynamically link Discord channels per server/guild

CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id VARCHAR(255) PRIMARY KEY, -- Supports multi-server portability
    taberna_channel_id VARCHAR(255),
    templo_channel_id VARCHAR(255),
    ranking_thread_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
