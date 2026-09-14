-- Отзывы, которые присылает мессенджер по API.
--
-- Два направления: «Что улучшить» (обратная связь о школе) и
-- «Бесплатный урок за отзыв» (акция). Структура полей ещё
-- уточняется, поэтому всё присланное целиком храним в payload —
-- ничего не потеряется, когда добавим новые поля.
CREATE TABLE IF NOT EXISTS t_p93118852_lineaschool_initiati.reviews (
    id          SERIAL PRIMARY KEY,
    -- 'improve' — «Что улучшить», 'free_lesson' — «Бесплатный урок за отзыв»
    kind        VARCHAR(30) NOT NULL DEFAULT 'improve',
    author_name TEXT NOT NULL DEFAULT '',
    phone       TEXT NOT NULL DEFAULT '',
    text        TEXT NOT NULL DEFAULT '',
    rating      INTEGER,
    -- Всё присланное как есть: поля мессенджера ещё меняются
    payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- 'new' | 'approved' | 'rejected' — модерацию добавим позже
    status      VARCHAR(20) NOT NULL DEFAULT 'new',
    source      VARCHAR(50) NOT NULL DEFAULT 'messenger',
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_kind_created_idx
    ON t_p93118852_lineaschool_initiati.reviews (kind, created_at DESC);
