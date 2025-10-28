-- Create payment_leads table to store customer contact information
CREATE TABLE IF NOT EXISTS payment_leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    plan VARCHAR(255) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    order_id VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_leads_order_id ON payment_leads(order_id);
CREATE INDEX idx_payment_leads_created_at ON payment_leads(created_at DESC);
