CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.fm_pnl_fact_manual (
  month_id varchar(7) NOT NULL,
  line varchar(40) NOT NULL,
  label text NOT NULL,
  amount numeric(14,2) NOT NULL,
  sort int NOT NULL DEFAULT 0,
  note text NOT NULL DEFAULT '',
  updated_at timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (month_id, line)
);

INSERT INTO t_p93118852_lineaschool_initiati.fm_pnl_fact_manual (month_id, line, label, amount, sort, note) VALUES
 ('2025-09','revenue','Выручка (проведённые занятия)',76880.00,10,'Признаётся по проведённым урокам'),
 ('2025-09','acquiring','Комиссии с авансов (доля месяца)',4557.51,20,'Средняя ставка 5,93% (19 166,68 / 323 320) × выручка 76 880. Остаток 14 609,17 переносится на следующие месяцы'),
 ('2025-09','teachers','Педагоги',7809.09,30,'Шишаева 7 000 (20 уроков, перевод 15.10 со счёта ИП) + Яновец 809,09 (2 из 11 уроков × 4 450, оплата с личной карты в октябре). Самозанятые — без взносов и НДФЛ'),
 ('2025-09','methodists','Методисты',0.00,35,'В сентябре не начислялось'),
 ('2025-09','advertising','Реклама',26472.00,40,'Яндекс Директ 25 000 + Авито 1 472'),
 ('2025-09','software_site','ПО: сайт',9500.00,50,'Подписка 1 000 + разработка 8 500, расход месяца'),
 ('2025-09','software_lessons','ПО: ведение уроков',6160.00,60,'Альфа CRM 3 000 + WordWall 1 245 + Zoom 1 915'),
 ('2025-09','cash_register','Касса (доля месяца)',1757.19,70,'Тариф 15 000 / 12 = 1 250 + накопитель 18 259 / 36 = 507,19'),
 ('2025-09','bank_fees','Комиссия банка',98.00,80,'Комиссии за переводы'),
 ('2025-09','tax_usn','Налог УСН',937.00,90,'За 3 кв. 2025 (сентябрь), оплачен 02.10.2025'),
 ('2025-09','owner_insurance','Взносы ИП за себя',4904.23,100,'За сентябрь, оплачены 02.10.2025'),
 ('2025-09','net_profit','Чистая прибыль',14684.98,200,'Итог')
ON CONFLICT (month_id, line) DO UPDATE SET label=EXCLUDED.label, amount=EXCLUDED.amount, sort=EXCLUDED.sort, note=EXCLUDED.note, updated_at=now();