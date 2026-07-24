-- Items Menu Schema

CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('food', 'drink')),
    price INTEGER NOT NULL CHECK (price >= 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_active_item_name_type UNIQUE (name, type)
);

-- Create index for faster querying
CREATE INDEX IF NOT EXISTS idx_items_name_type ON items(name, type);
