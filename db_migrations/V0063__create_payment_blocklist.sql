-- Blocklist of payments that must not be re-created by the bank mail sync.
CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.payment_blocklist (
    id SERIAL PRIMARY KEY,
    order_id TEXT,
    transaction_id TEXT,
    name TEXT,
    reason TEXT DEFAULT 'manual',
    blocked_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payment_blocklist_order ON t_p93118852_lineaschool_initiati.payment_blocklist (order_id);
CREATE INDEX IF NOT EXISTS idx_payment_blocklist_tx ON t_p93118852_lineaschool_initiati.payment_blocklist (transaction_id);