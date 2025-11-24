# OpenDyslexic - Расширение для браузера

Расширение для Chrome/Edge/Firefox, которое меняет шрифт на всех сайтах на OpenDyslexic для упрощения чтения людям с дислексией.

## Возможности

- ✅ Замена шрифта на OpenDyslexic на всех сайтах
- ✅ Поддержка русского и английского языков
- ✅ Простое включение/выключение через popup
- ✅ Сохранение настроек
- ✅ Поддержка всех начертаний (Regular, Bold, Italic, Bold-Italic)

## Установка шрифтов

### ВАЖНО: Необходимо скачать файлы шрифтов

Расширение требует файлы шрифта OpenDyslexic. Выполните следующие шаги:

1. Скачайте шрифт OpenDyslexic с официального сайта: https://opendyslexic.org/
2. Создайте папку `fonts` в директории `browser-extension/`
3. Поместите туда следующие файлы (конвертируйте TTF в WOFF2/WOFF если нужно):
   - `OpenDyslexic-Regular.woff2`
   - `OpenDyslexic-Regular.woff`
   - `OpenDyslexic-Bold.woff2`
   - `OpenDyslexic-Bold.woff`
   - `OpenDyslexic-Italic.woff2`
   - `OpenDyslexic-Italic.woff`
   - `OpenDyslexic-Bold-Italic.woff2`
   - `OpenDyslexic-Bold-Italic.woff`

### Конвертация шрифтов

Если у вас есть только TTF файлы, конвертируйте их онлайн:
- https://cloudconvert.com/ttf-to-woff2
- https://cloudconvert.com/ttf-to-woff

## Установка расширения

### Chrome / Edge

1. Откройте браузер и перейдите:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`

2. Включите "Режим разработчика" (Developer mode) в правом верхнем углу

3. Нажмите "Загрузить распакованное расширение" (Load unpacked)

4. Выберите папку `browser-extension`

5. Расширение установлено! Нажмите на иконку расширения и включите шрифт

### Firefox

1. Откройте Firefox и перейдите: `about:debugging#/runtime/this-firefox`

2. Нажмите "Загрузить временное дополнение" (Load Temporary Add-on)

3. Выберите файл `manifest.json` из папки `browser-extension`

4. Расширение установлено!

## Использование

1. Нажмите на иконку расширения в панели инструментов браузера
2. Включите переключатель "Включить шрифт"
3. Страница автоматически перезагрузится с новым шрифтом
4. Для отключения - нажмите переключатель снова

## Создание иконок

Создайте иконки для расширения в папке `browser-extension/icons/`:
- `icon16.png` - 16x16 пикселей
- `icon32.png` - 32x32 пикселей
- `icon48.png` - 48x48 пикселей
- `icon128.png` - 128x128 пикселей

Иконка должна отражать тематику чтения/книги/дислексии.

## Публикация в магазинах расширений

### Chrome Web Store
1. Создайте ZIP архив папки `browser-extension`
2. Зарегистрируйтесь как разработчик: https://chrome.google.com/webstore/devconsole
3. Оплатите разовый взнос $5
4. Загрузите расширение

### Edge Add-ons
1. Создайте ZIP архив папки `browser-extension`
2. Зарегистрируйтесь: https://partner.microsoft.com/dashboard
3. Загрузите расширение (бесплатно)

### Firefox Add-ons
1. Создайте ZIP архив папки `browser-extension`
2. Зарегистрируйтесь: https://addons.mozilla.org/developers/
3. Загрузите расширение (бесплатно)

## Лицензия

OpenDyslexic шрифт распространяется под лицензией Creative Commons Attribution 3.0.
Подробнее: https://opendyslexic.org/

## Поддержка

Если у вас есть вопросы или предложения, создайте issue в репозитории проекта.
