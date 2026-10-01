# Карта проекта (читать первой — экономит поиск)

Стек: React + Vite (src/), Python cloud functions (backend/<имя>/index.py), PostgreSQL.
Схема БД: `t_p93118852_lineaschool_initiati` (в коде — env `MAIN_DB_SCHEMA`).
CRM: AlfaCRM S20 (`https://11086.s20.online`), ключи `S20_X_APP_KEY`, `S20_API_KEY`.
URL функций — `backend/func2url.json` (во фронте часто захардкожены или через `func2url`).

## Страницы (src/App.tsx → src/pages/*)
| Путь | Страница |
|---|---|
| `/`, `/lineastudies` | Лендинг (Index, LineaStudies) |
| `/price_2026-2027`, `/pay/:slug` | Прайс и оплата (pricing2026/, pay/, usePayment.ts) |
| `/anketa`, `/anketa/:id` | Анкета родителя (questionnaire/) |
| `/diag_form`, `/diag/:serial` | Первичная диагностика: форма и заключение (DiagForm/, diag/) |
| `/interim_diag_form`, `/interim_diag/:id` | Промежуточная диагностика (interimDiag/, interimConclusion/) |
| `/booking/:token` | Запись родителя в окна/группы (booking/, backend slot-bookings) |
| `/admin/*` | Кабинеты: head-workspace (руководитель), admin-workspace, teacher-lk, schedule, students, staff, settings |
| `/admin/report/*` | Отчёты: fact-income, advance-income, retention, student-dynamics, subscription-margin, unit-margin |

## Бэкенд-функции (backend/)
- **Деньги**: `save-payment-lead` (заявка перед оплатой), `payment-init` (Т-Банк), `mail-payment-sync` (оплаты из писем банка), `get-payment-leads`, `add-manual-payment`, `delete-payment-lead`, `payment-blocklist`, `report-lock` (закрытые месяцы), `payment-report`, `recurring-payments`
- **Отчёты**: `fact-income` (проведено × цена, кэш `fact_income_cache`), `retention-report`, `student-dynamics`, `subscription-margin`, `unit-margin`, `dropouts`
- **Расписание/запись**: `s20-schedule` (всё расписание из CRM), `slot-bookings` (+`week_slots.py`, `name_match.py`), `teacher-schedule`, `admin-shifts`, `shift-crm-check`
- **Ученики/CRM**: `students-table` (самая большая), `crm-sync-cache` (`crm_customers_cache`), `crm-note-city`, `city-search`, `lead-processor`, `leads-manage`
- **Диагностики**: `save-diag-report`, `get-diag-report`, `admin-reports`, `diag-students`, `diag-writing-samples`, `past-diagnostics`, `questionnaire`
- **Персонал**: `staff-auth`, `staff-manage`, `teacher-rates`, `supervisions`, `violations`, `work-log`, `support-ticket`
- **Прочее**: `interactions-api` (окно взаимодействия, MAX/Telegram), `reviews`, `letterhead-docs`, `font-proxy`, `image-proxy`

## Ключевые таблицы
`payment_leads` (оплаты: name, crm_name, plan, amount, paid_at, transaction_id), `slot_bookings` (брони),
`speech_therapy_reports` (бланки диагностик), `leads` (заявки на диагностику), `crm_customers_cache`,
`fact_income_cache`, `staff`/`staff_sessions`, `closed_months`, `payment_blocklist`.

## Правила
- Не трогать: `browser-extension/` (отдельное расширение), `public/` видео отзывов (используются в TestimonialsSection).
- Деловые правила — в NOTES.md.
