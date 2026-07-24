-- Initial Database Schema for La Taberna de Askhun

-- Create profiles table (Users)
CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(255) PRIMARY KEY, -- Discord User ID
    balance INTEGER NOT NULL DEFAULT 0,
    total_spent INTEGER NOT NULL DEFAULT 0,
    welcome_received BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table (Economy History Ledger)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type VARCHAR(100) NOT NULL, -- e.g., 'welcome', 'food', 'drink', 'title', 'admin_give', 'admin_remove', 'prediction_reward'
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on transactions user_id for performance optimization
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
