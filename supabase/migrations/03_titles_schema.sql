-- Titles Schema

-- Create titles catalog table
CREATE TABLE IF NOT EXISTS titles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    cost INTEGER NOT NULL CHECK (cost >= 0),
    required_title_id INTEGER REFERENCES titles(id) ON DELETE SET NULL,
    role_id VARCHAR(255) NOT NULL, -- Discord Role ID
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_titles progression bridge table
CREATE TABLE IF NOT EXISTS user_titles (
    user_id VARCHAR(255) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title_id INTEGER NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, title_id)
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_user_titles_user_id ON user_titles(user_id);
