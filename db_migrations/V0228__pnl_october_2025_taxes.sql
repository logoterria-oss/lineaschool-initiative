INSERT INTO t_p93118852_lineaschool_initiati.fm_pnl_fact_manual (month_id, line, label, amount, sort, note) VALUES
 ('2025-10','tax_usn','Налог УСН 6% (после уменьшения на взносы)',12900.50,210,'6% × поступления 347 440 = 20 846,40 − взносы месяца 7 945,90. ИП без работников уменьшает УСН на 100% взносов'),
 ('2025-10','owner_insurance','Взносы ИП за себя',7945.90,220,'Фиксированные 53 658 / 12 = 4 471,50 + 1% с дохода сверх 300 000: 347 440 × 1% = 3 474,40 (порог пройден в сентябре)'),
 ('2025-10','net_profit','Чистая прибыль',144365.76,300,'Прибыль до налогов 165 212,16 − налоговая нагрузка 20 846,40 (= 6% от поступлений)')
ON CONFLICT (month_id, line) DO UPDATE SET label=EXCLUDED.label, amount=EXCLUDED.amount, sort=EXCLUDED.sort, note=EXCLUDED.note, updated_at=now();