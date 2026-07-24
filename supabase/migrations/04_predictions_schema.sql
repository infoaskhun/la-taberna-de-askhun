-- Predictions Schema

-- Create predictions table
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    reward INTEGER NOT NULL CHECK (reward >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed', 'resolved', 'cancelled')),
    created_by VARCHAR(255) NOT NULL REFERENCES profiles(id),
    winner_option_id INTEGER, -- Updated when resolved
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Create prediction_options table
CREATE TABLE IF NOT EXISTS prediction_options (
    id SERIAL PRIMARY KEY,
    prediction_id INTEGER NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create prediction_votes table (Primary Key user_id + prediction_id ensures one vote per user)
CREATE TABLE IF NOT EXISTS prediction_votes (
    prediction_id INTEGER NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    option_id INTEGER NOT NULL REFERENCES prediction_options(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (prediction_id, user_id)
);

-- Add foreign key constraint to winner_option_id in predictions referencing prediction_options
ALTER TABLE predictions ADD CONSTRAINT fk_winner_option FOREIGN KEY (winner_option_id) REFERENCES prediction_options(id) ON DELETE SET NULL;

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_prediction_options_prediction_id ON prediction_options(prediction_id);
CREATE INDEX IF NOT EXISTS idx_prediction_votes_prediction_id ON prediction_votes(prediction_id);
CREATE INDEX IF NOT EXISTS idx_prediction_votes_user_id ON prediction_votes(user_id);
