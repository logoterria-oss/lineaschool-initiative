-- Промт 15. Дашборд: состояние, уведомления (только в интерфейсе), статусы источников данных.
CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.fm_dashboard_state (
    id SMALLINT PRIMARY KEY DEFAULT 1,
    last_updated TIMESTAMP NULL,
    current_month VARCHAR(7) NULL,
    active_scenario VARCHAR(4) NULL,
    active_tax_regime VARCHAR(8) NULL,
    active_credit_option VARCHAR(4) NULL
);
INSERT INTO t_p93118852_lineaschool_initiati.fm_dashboard_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.fm_notifications (
    id SERIAL PRIMARY KEY,
    key VARCHAR(120) NOT NULL UNIQUE,
    type VARCHAR(40) NOT NULL,
    priority VARCHAR(8) NOT NULL CHECK (priority IN ('high','medium','low')),
    message TEXT NOT NULL,
    action_url VARCHAR(60) NOT NULL DEFAULT '',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    read_at TIMESTAMP NULL,
    snoozed_until TIMESTAMP NULL,
    dismissed_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.fm_data_sources (
    source VARCHAR(40) PRIMARY KEY,
    label VARCHAR(120) NOT NULL,
    provides VARCHAR(200) NOT NULL DEFAULT '',
    last_updated TIMESTAMP NULL,
    status VARCHAR(8) NOT NULL DEFAULT 'missing' CHECK (status IN ('ok','stale','missing','manual')),
    note VARCHAR(300) NOT NULL DEFAULT '',
    checked_at TIMESTAMP NOT NULL DEFAULT now()
);