# Окно взаимодействия — запуск отдельного проекта

Памятка для переноса окна взаимодействия в отдельный проект на poehali.dev
с последующим переездом на свой сервер.

Аккаунты сотрудников остаются в основном проекте и НЕ копируются.
Новый проект спрашивает у основного «кто это по токену» — данные всегда живые.

---

## 1. Промт для первого запроса в новом проекте

Скопировать целиком и отправить первым сообщением:

```
Сделай рабочее приложение «Окно взаимодействия» — внутренний чат для сотрудников
школы. Это НЕ лендинг и НЕ визитка: никаких секций «о нас», «преимущества»,
«отзывы», «цены», футеров с контактами. Только рабочий интерфейс.

Стек: React + TypeScript + Vite + Tailwind + shadcn/ui, бэкенд — Python
Cloud Functions, база PostgreSQL. Иконки только через компонент Icon
(lucide-react).

ЧТО ДОЛЖНО ПОЛУЧИТЬСЯ

Одна страница на весь экран, три колонки:
1. Слева — список диалогов: имя, последнее сообщение, время, счётчик
   непрочитанных, поиск по имени и телефону, фильтр «Все чаты / Только мои».
2. По центру — переписка: сообщения входящие слева, исходящие справа,
   поле ввода снизу, переключатель канала Max / Telegram.
3. Справа — карточка клиента: телефон, Telegram, ФИО ученика, статус в CRM,
   ответственный сотрудник со сменой из выпадающего списка.

Писать в диалог может только ответственный за него сотрудник или руководитель.

ВХОД СОТРУДНИКОВ

Экран входа: телефон + пароль. Свою базу пользователей НЕ создавай.
Проверяй вход через внешний сервис (адрес и ключ дам следующим сообщением) —
он возвращает токен и данные сотрудника. Токен храни в localStorage под
ключом staff_token и шли в заголовке X-Auth-Token во все запросы к бэкенду.

БАЗА ДАННЫХ

Две таблицы: диалоги и сообщения. Точную структуру дам следующим сообщением —
пока просто создай их по смыслу, потом поправим.

ВАЖНО

- Пока не пиши интеграции с Max/Telegram — сначала интерфейс и вход.
- Данные бери из базы, не из моков, но если база пустая — покажи пустой
  список, а не выдуманные диалоги.
- Не придумывай функции, которых я не просила.

Начни с интерфейса и экрана входа. Когда сделаешь — покажи, что получилось.
```

Дальше отправлять по одному блоку из разделов ниже.

---

## 2. Куда вставлять готовый код

Чтобы новый проект не переизобретал логику, второй порцией отдаём готовые
файлы. Порядок важен: сначала структура базы, потом бэкенд, потом интерфейс.

### Шаг 1. Структура таблиц

Написать: «Создай миграцию с такими таблицами» и приложить:

```sql
CREATE TABLE IF NOT EXISTS interaction_dialogs (
    id SERIAL PRIMARY KEY,
    channel VARCHAR(20) NOT NULL DEFAULT 'max',
    chat_id VARCHAR(255) NOT NULL,
    client_name VARCHAR(255),
    phone VARCHAR(50),
    assignee VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'lead',
    unread INTEGER NOT NULL DEFAULT 0,
    last_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    crm_status VARCHAR(20),
    crm_name VARCHAR(255),
    crm_label VARCHAR(255),
    crm_checked_at TIMESTAMP WITH TIME ZONE,
    child_name VARCHAR(255),
    max_chat_id VARCHAR(255),
    max_user_id VARCHAR(255),
    tg_chat_id VARCHAR(255),
    tg_username VARCHAR(255),
    hidden BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (channel, chat_id)
);

CREATE TABLE IF NOT EXISTS interaction_messages (
    id SERIAL PRIMARY KEY,
    dialog_id INTEGER NOT NULL REFERENCES interaction_dialogs(id),
    direction VARCHAR(3) NOT NULL,
    channel VARCHAR(20) NOT NULL DEFAULT 'max',
    text TEXT,
    author VARCHAR(255),
    is_transcript BOOLEAN NOT NULL DEFAULT false,
    wappi_message_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interaction_messages_dialog ON interaction_messages(dialog_id);
CREATE INDEX IF NOT EXISTS idx_interaction_dialogs_last ON interaction_dialogs(last_time DESC);
CREATE INDEX IF NOT EXISTS idx_interaction_dialogs_tg_chat_id ON interaction_dialogs (tg_chat_id);
```

### Шаг 2. Бэкенд окна

Написать: «Вот готовый код функции окна из старого проекта, перенеси его
целиком, ничего не упрощая» — и приложить содержимое файла
`backend/interactions-api/index.py` из основного проекта.

### Шаг 3. Интерфейс

Написать: «Вот готовые компоненты интерфейса, используй их вместо своих» —
и приложить файлы из основного проекта:

- `src/lib/interactionsApi.ts` — все запросы к бэкенду
- `src/components/interaction/InteractionWindow.tsx` — главный экран
- `src/components/interaction/ChatPanel.tsx` — переписка
- `src/components/interaction/DialogList.tsx` — список диалогов
- `src/components/interaction/DialogSidebar.tsx` — карточка клиента
- `src/components/interaction/NewDialogModal.tsx` — новый диалог
- `src/components/interaction/interactionShared.tsx` — общие мелочи

В `interactionsApi.ts` заменить `API_URL` на адрес функции нового проекта.

---

## 3. Вход через основной проект

Отправить в новый проект:

```
Экран входа делай так. Телефон и пароль отправляй POST-запросом на адрес
основного проекта:

https://functions.poehali.dev/9046cb93-23f6-47d3-9bde-4fe3735dd754

Тело: {"action": "login", "phone": "<телефон>", "password": "<пароль>"}
В ответ придёт {"ok": true, "token": "...", "staff": {...}}.
Токен сохрани в localStorage под ключом staff_token.

Проверка токена делается ТОЛЬКО на бэкенде (ключ нельзя показывать в браузере).
Сделай функцию, которая шлёт на тот же адрес:
  заголовки: X-Service-Key: <секрет INTERACTION_SERVICE_KEY>,
             X-Auth-Token: <токен сотрудника>
  тело: {"action": "verify_session"}
Ответ: {"ok": true, "staff": {"full_name", "role", "job_title",
        "can_use_interaction"}}.
Если can_use_interaction = false — доступ в окно закрыт.

Список ответственных бери тем же способом, действие "service_assignees".
Кэшируй его в памяти на 5 минут.

Секрет INTERACTION_SERVICE_KEY добавь в проект — значение дам отдельно.
```

Значение `INTERACTION_SERVICE_KEY` должно совпадать с секретом в основном
проекте.

---

## 4. Секреты для нового проекта

Для полноценной работы понадобятся (значения взять из основного проекта):

| Секрет | Зачем |
|---|---|
| `INTERACTION_SERVICE_KEY` | связь с основным проектом (вход, сотрудники) |
| `WAPPI_API_TOKEN` | приём и отправка сообщений |
| `WAPPI_PROFILE_ID` | профиль Max |
| `WAPPI_TG_PROFILE_ID` | профиль Telegram |
| `S20_API_KEY`, `S20_X_APP_KEY`, `ALFACRM_EMAIL` | статусы клиентов из CRM |

---

## 5. Тестирование — без боевых каналов

Пока идут тесты, НЕ переключать рабочие вебхуки Max и Telegram: рабочая
переписка должна продолжать идти в текущее окно.

- Завести тестового бота в Telegram и тестовый профиль в Wappi.
- Их вебхуки направить на функцию нового проекта:
  `<адрес функции нового проекта>?action=tg-webhook` и `?action=webhook`.

Что проверить: вход сотрудника, закрытый доступ для роли без прав, приём
входящего, отправка исходящего, смена ответственного, статус из CRM,
счётчик непрочитанных.

---

## 6. Переключение на боевой режим (одним заходом)

Делать в тихое время, все шаги подряд:

1. Выгрузить `interaction_dialogs` и `interaction_messages` из основного проекта.
2. Залить в базу нового проекта (или своего сервера).
3. Переключить вебхуки Max и Telegram на новый адрес.
4. Проверить приём и отправку.

Разносить эти шаги во времени нельзя — сообщения разъедутся по двум базам.

Неделю подержать старое окно доступным на чтение — на случай отката.

---

## 7. Что остаётся в основном проекте

Навсегда: аккаунты сотрудников, админка, отчёты, ученики, вся остальная база.

Новый сервис обращается сюда только за проверкой входа и списком
ответственных — это единицы вызовов в день.
