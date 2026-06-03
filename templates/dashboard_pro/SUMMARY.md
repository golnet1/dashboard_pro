# Dashboard Pro — сводка изменений (2026-06-01)

## Структура JS-файлов

```
js/
  api.js          — dpAPI() — обёртка fetch для API
  auth.js         — Auth: авторизация (reactive refs + функции)
  sidebar.js      — Sidebar: левая панель (навигация, группы)
  widgets/
    relay.js      — виджет Реле
    value.js      — виджет Значение
    button.js     — виджет Кнопка
  app.js          — основной Vue 3 компонент (всё остальное)
```

Порядок подключения в `index.html`:
Vue → api.js → auth.js → sidebar.js → relay.js → value.js → button.js → app.js

## Авторизация (`js/auth.js`)

Глобальный объект `Auth` с refs:
- `authenticated` — залогинен или нет
- `authChecking` — проверка авторизации (спиннер)
- `login`, `password` — поля формы
- `loginError`, `loginLoading` — ошибка/состояние загрузки

Функции принимают `onAuth(res)` колбэк (вызывается после успеха):
- `checkAuth(onAuth)` — проверка сессии
- `doLogin(onAuth)` — вход
- `testAPI()` — проверка соединения
- `doLogout()` — выход (сбрасывает только auth-состояние)

app.js оборачивает `doLogin`/`initAuth`, добавляя инициализацию `user`, `loadData`, `checkNotifications`.

## Sidebar (`js/sidebar.js`)

Глобальный объект `Sidebar` с refs:
- `currentPanel` — выбранная панель (`null` = начальная панель)
- `sidebarOpen`, `sidebarMini` — состояние сайдбара (мобильный/десктоп)
- `expandedGroups` — раскрытые группы в сайдбаре

Функции:
- `childPanels(panels, groupName)` — дочерние панели (с filter)
- `toggleGroup(name)` — раскрыть/свернуть группу
- `selectPanel(p)` — выбрать панель
- `selectHomePanel()` — начальная панель
- `toggleSidebar()` — раскрыть/свернуть сайдбар

## Типы панелей

- **Группа** (`panelType: 'group'`) — контейнер для панелей. Не может содержать виджеты.
- **Панель Dashboard** (`panelType: 'panel'`) — содержит виджеты.

Правила:
- Группы не могут быть вложены (parentGroup всегда 'root')
- Панели с виджетами нельзя переключить в группу (ошибка)
- Если parentGroup указывает на не-группу или несуществующую панель → сбрасывается в 'root'

## Индексация

- `panelForm` ref — все поля формы (title, icon, iconType, hideNav, panelType, parentGroup, infoObject, infoProperty, и т.д.)
- `createPanel()` — создание/редактирование панели (сохраняет в panels, вызывает savePanels)
- `editPanel(p)` — открыть форму редактирования + выбрать панель
- `deletePanel()` — удалить + переключиться на другую
- `movePanel(dir)` — переместить в списке (±1)
- `openPanelForm(p)` — заполнить форму из данных панели (или сброс для новой)

## Домашняя панель / Начальная панель

Показывается когда `currentPanel === null`:
- Заголовок "Начальная панель" с иконкой дома
- Сетка карточек рутовых панелей (все группы + панели без parentGroup)
- Клик по любой карточке → `selectPanel(p)` (даже для группы)

При выборе группы:
- Показывается заголовок группы и сетка её дочерних панелей
- Группа раскрывается в сайдбаре
- Клик по дочерней панели → `selectPanel(p)` — обычный вид панели с виджетами

## Иконки (`iconCategories`)

Массив категорий с FA-классами. 18 категорий + "Все" (собирается из остальных).
Только иконки из Font Awesome 6 Free (отфильтровано ~87 несуществующих).
- `filteredIconCategories` — поиск по категориям
- `filteredIcons` — фильтр по категории + поиск
- `paginatedIcons` — пагинация по 24 шт.

## Выбор иконки

Модальное окно `showIconPicker`:
- Левая панель: категории (с поиском)
- Правая панель: сетка иконок (с поиском, пагинацией)
- Клик → `panelForm.icon = ic; showIconPicker = false`

## Сохранение

- `savePanels()` — POST panels + settings
- Автосохранение при каждом изменении (create/edit/delete/move panel)
- `showAbout` — модалка "О модуле"

## Виджеты

- `addWidget(type)` — создать + сразу открыть редактор
- `editWidgetForm` — форма редактирования
- `saveEditWidget()` — сохранить
- `removeWidget(idx)` — удалить
- `widgetTypeComponent(type)` — компонент для рендера

## Чат

- `toggleChat()` — открыть/закрыть
- `loadChat()` — загрузить историю
- `sendChat()` — отправить сообщение

## Уведомления

- `checkNotifications()` — каждые 10с
- `markNotificationsRead()` — отметить прочитанными

## WebSocket

- `initWebSocket()` — WS-соединение для статусов

## Развёртывание

Сервер: root@dom
Путь: `/var/www/html/templates/dashboard_pro/`

```bash
rsync index.html root@dom:/var/www/html/templates/dashboard_pro/index.html
rsync js/app.js root@dom:/var/www/html/templates/dashboard_pro/js/app.js
rsync js/auth.js root@dom:/var/www/html/templates/dashboard_pro/js/auth.js
rsync js/sidebar.js root@dom:/var/www/html/templates/dashboard_pro/js/sidebar.js
rsync css/app.css root@dom:/var/www/html/templates/dashboard_pro/css/app.css
```
