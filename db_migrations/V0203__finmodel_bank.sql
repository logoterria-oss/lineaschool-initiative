-- Банковский факт для Cash Flow: счета, операции (выписки 1С и T-API), остатки, правила разноски, ручные итоги месяца.
CREATE TABLE t_p93118852_lineaschool_initiati.fm_bank_accounts (
    account VARCHAR(20) PRIMARY KEY,
    bank VARCHAR(16) NOT NULL CHECK (bank IN ('tbank','loko','other')),
    label VARCHAR(120) NOT NULL DEFAULT '',
    kind VARCHAR(12) NOT NULL DEFAULT 'business' CHECK (kind IN ('business','personal')),
    use_in_cf BOOLEAN NOT NULL DEFAULT true,
    api BOOLEAN NOT NULL DEFAULT false,
    last_sync_at TIMESTAMP NULL,
    last_sync_error TEXT NOT NULL DEFAULT '',
    last_import_at TIMESTAMP NULL
);

CREATE TABLE t_p93118852_lineaschool_initiati.fm_bank_balances (
    account VARCHAR(20) NOT NULL REFERENCES t_p93118852_lineaschool_initiati.fm_bank_accounts(account),
    date DATE NOT NULL,
    balance_end NUMERIC(14,2) NOT NULL,
    source VARCHAR(8) NOT NULL DEFAULT 'file',
    PRIMARY KEY (account, date)
);

CREATE TABLE t_p93118852_lineaschool_initiati.fm_bank_rules (
    id SERIAL PRIMARY KEY,
    sort INTEGER NOT NULL DEFAULT 100,
    direction VARCHAR(3) NOT NULL DEFAULT 'any' CHECK (direction IN ('in','out','any')),
    field VARCHAR(16) NOT NULL CHECK (field IN ('purpose','counterparty','inn','account')),
    pattern VARCHAR(300) NOT NULL,
    category VARCHAR(16) NOT NULL,
    label VARCHAR(200) NOT NULL DEFAULT '',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE t_p93118852_lineaschool_initiati.fm_bank_operations (
    id SERIAL PRIMARY KEY,
    uid VARCHAR(250) NOT NULL UNIQUE,
    account VARCHAR(20) NOT NULL REFERENCES t_p93118852_lineaschool_initiati.fm_bank_accounts(account),
    op_date DATE NOT NULL,
    doc_date DATE NULL,
    doc_number VARCHAR(40) NOT NULL DEFAULT '',
    direction VARCHAR(3) NOT NULL CHECK (direction IN ('in','out')),
    amount NUMERIC(14,2) NOT NULL,
    counterparty VARCHAR(300) NOT NULL DEFAULT '',
    counterparty_inn VARCHAR(20) NOT NULL DEFAULT '',
    counterparty_account VARCHAR(30) NOT NULL DEFAULT '',
    purpose TEXT NOT NULL DEFAULT '',
    source VARCHAR(8) NOT NULL CHECK (source IN ('file','api')),
    category VARCHAR(16) NOT NULL DEFAULT 'uncategorized',
    category_source VARCHAR(8) NOT NULL DEFAULT 'none' CHECK (category_source IN ('rule','manual','none')),
    rule_id INTEGER NULL,
    imported_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX fm_bank_operations_date_idx ON t_p93118852_lineaschool_initiati.fm_bank_operations (op_date);

CREATE TABLE t_p93118852_lineaschool_initiati.fm_cashflow_fact_manual (
    month_id VARCHAR(7) NOT NULL,
    line VARCHAR(16) NOT NULL,
    amount NUMERIC(14,2) NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (month_id, line)
);

ALTER TABLE t_p93118852_lineaschool_initiati.fm_cashflow_monthly ADD COLUMN IF NOT EXISTS other NUMERIC(14,2) NOT NULL DEFAULT 0;

INSERT INTO t_p93118852_lineaschool_initiati.fm_bank_accounts (account, bank, label, kind, use_in_cf, api) VALUES
 ('40802810800008649860', 'tbank', 'Т-Бизнес, счёт ИП', 'business', true, true),
 ('40802810200203879002', 'loko', 'Локо-Банк, счёт ИП', 'business', true, false),
 ('40817810300065693797', 'tbank', 'Личный счёт Т-Банк', 'personal', false, false);

INSERT INTO t_p93118852_lineaschool_initiati.fm_bank_rules (sort, direction, field, pattern, category, label) VALUES
 (10, 'any', 'account', '40802810200203879002', 'transfer', 'Перевод между своими счетами (Локо)'),
 (11, 'any', 'account', '40802810800008649860', 'transfer', 'Перевод между своими счетами (Т-Бизнес)'),
 (12, 'out', 'account', '40817810300065693797', 'payout', 'Перевод на личный счёт собственника'),
 (20, 'in', 'purpose', 'Получение кредита', 'other', 'Получение кредита'),
 (21, 'out', 'purpose', 'Погашение комиссии', 'interest', 'Кредит: проценты (комиссия)'),
 (22, 'out', 'purpose', 'Погашение процентов', 'interest', 'Кредит: проценты'),
 (23, 'out', 'purpose', 'Погашение основного долга', 'body', 'Кредит: тело'),
 (24, 'out', 'purpose', 'Погашение кредита', 'body', 'Кредит: тело'),
 (30, 'in', 'purpose', 'C_718225', 'revenue', 'Эквайринг: оплаты родителей (за вычетом комиссии)'),
 (31, 'in', 'purpose', 'реестру операций', 'revenue', 'Эквайринг: оплаты родителей'),
 (40, 'out', 'purpose', 'эквайринг', 'variable', 'Эквайринг: удержания'),
 (41, 'out', 'purpose', 'самозанят', 'variable', 'Комиссия за выплаты самозанятым'),
 (42, 'out', 'purpose', 'согласно реестру', 'variable', 'Выплаты педагогам по реестру'),
 (50, 'out', 'inn', '7727406020', 'tax', 'ФНС: единый налоговый платёж'),
 (51, 'out', 'purpose', 'Единый налоговый платеж', 'tax', 'Единый налоговый платёж'),
 (60, 'out', 'inn', '5038130248', 'ano', 'Оплата АНО'),
 (70, 'out', 'purpose', 'DIRECT', 'fixed', 'Реклама (Яндекс Директ)'),
 (71, 'out', 'purpose', 'poehali.dev', 'fixed', 'Разработка (poehali.dev)'),
 (72, 'out', 'purpose', 'REG.RU', 'fixed', 'Домены и хостинг'),
 (73, 'out', 'purpose', 'Плата за обслуживание', 'fixed', 'Обслуживание счёта'),
 (74, 'out', 'purpose', 'SMS-банк', 'fixed', 'SMS-банк'),
 (75, 'out', 'purpose', 'Комиссия за внешний', 'fixed', 'Комиссия банка за перевод');