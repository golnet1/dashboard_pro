# Dashboard Pro - Продвинутый дашборд для MajorDoMo

## 📋 Описание

**Dashboard Pro** - современный модуль дашборда для системы умного дома MajorDoMo, созданный на основе анализа MBoard Pro. Модуль предоставляет интуитивный интерфейс для мониторинга и управления системой с использованием Vue.js 3 и WebSocket для real-time обновлений.

## ✨ Возможности

### 🔹 Основные функции
- **Real-time мониторинг** - обновление данных через WebSocket
- **Статистика системы** - объекты, сценарии, модули, ресурсы
- **PHP консоль** - выполнение кода прямо из интерфейса
- **Список объектов** - просмотр всех объектов системы
- **Лог событий** - последние события в системе
- **Адаптивный дизайн** - работает на всех устройствах

### 🔹 Технические особенности
- ✅ Vue.js 3 Composition API
- ✅ WebSocket интеграция
- ✅ RESTful API (15+ endpoints)
- ✅ Адаптивный UI с современным дизайном
- ✅ Автоматическое переподключение WebSocket
- ✅ Обработка ошибок и loading states

## 📁 Структура модуля

```
dashboard_pro/
├── modules/
│   └── dashboard_pro/
│       └── dashboard_pro.class.php    # Backend PHP класс
├── templates/
│   └── dashboard_pro/
│       ├── dashboard_pro.html         # Vue.js frontend
│       └── css/                       # Стили (опционально)
├── img/
│   └── modules/
│       └── dashboard_pro.png          # Иконка модуля
└── README.md                          # Документация
```

## 🚀 Установка

### Способ 1: Через интерфейс MajorDoMo
1. Скопируйте папку `dashboard_pro` в корень вашего MajorDoMo
2. Перейдите в **Панель управления → Модули**
3. Нажмите **"Установить новый модуль"**
4. Выберите `dashboard_pro`
5. Нажмите **"Установить"**

### Способ 2: Вручную
```bash
# Linux/Mac
cp -r dashboard_pro /path/to/majordomo/modules/

# Windows
xcopy dashboard_pro C:\path\to\majordomo\modules\dashboard_pro /E /I
```

Затем активируйте модуль через админ-панель MajorDoMo.

## 🔧 Конфигурация

### Настройки по умолчанию

Модуль автоматически создает следующие настройки:

```php
// Настройки дашборда
dashboard_pro_settings = {
    "theme": "light",
    "language": "ru",
    "refresh_interval": 5000,
    "websocket_enabled": true,
    "layout": "grid",
    "columns": 3
}

// Конфигурация виджетов
dashboard_pro_widgets = []
```

### Изменение настроек

Через API:
```javascript
// Сохранение настроек
await axios.post('/api.php/module/dashboard_pro/settings', {
    data: {
        theme: 'dark',
        refresh_interval: 10000
    }
});

// Загрузка настроек
const settings = await axios.get('/api.php/module/dashboard_pro/settings');
```

## 📡 API Reference

Модуль предоставляет 15+ API endpoints для взаимодействия с frontend.

### Базовый URL
```
/api.php/module/dashboard_pro/
```

### Endpoints

#### 📊 Объекты системы

**GET /objects** - Получить список всех объектов
```javascript
const objects = await axios.get('/api.php/module/dashboard_pro/objects');
// Возвращает: [{ ID, TITLE, DESCRIPTION, LOCATION_ID, PROPERTIES: [...] }]
```

**GET /properties?object_id=1** - Получить свойства объекта
```javascript
const properties = await axios.get('/api.php/module/dashboard_pro/properties?object_id=1');
// Возвращает: [{ ID, TITLE, VALUE, TYPE, KEEP_HISTORY }]
```

**GET /methods?object_id=1** - Получить методы объекта
```javascript
const methods = await axios.get('/api.php/module/dashboard_pro/methods?object_id=1');
// Возвращает: [{ ID, TITLE, EXECUTED, SCRIPT_ID }]
```

#### 🎯 Работа со свойствами

**GET /getProperty?object=Room1&property=temperature** - Получить значение свойства
```javascript
const response = await axios.get('/api.php/module/dashboard_pro/getProperty', {
    params: { object: 'Room1', property: 'temperature' }
});
// Возвращает: { value: 22.5 }
```

**POST /setProperty** - Установить значение свойства
```javascript
await axios.post('/api.php/module/dashboard_pro/setProperty', {
    object: 'Room1',
    property: 'temperature',
    value: 23.5
});
// Возвращает: { success: true, value: 23.5 }
```

#### ⚙️ Методы и сценарии

**POST /callMethod** - Вызвать метод объекта
```javascript
await axios.post('/api.php/module/dashboard_pro/callMethod', {
    object: 'Light1',
    method: 'turnOn',
    params: { brightness: 80 }
});
// Возвращает: { success: true }
```

**GET /scripts** - Получить список сценариев
```javascript
const scripts = await axios.get('/api.php/module/dashboard_pro/scripts');
// Возвращает: [{ ID, TITLE, CODE, IS_ACTIVE }]
```

**POST /runScript** - Выполнить сценарий
```javascript
await axios.post('/api.php/module/dashboard_pro/runScript', {
    script: 'MorningRoutine',
    params: { delay: 5 }
});
// Возвращает: { success: true }
```

#### 💻 Консоль

**POST /console** - Выполнить PHP код
```javascript
const result = await axios.post('/api.php/module/dashboard_pro/console', {
    command: 'echo gg("site_title");'
});
// Возвращает: [{ code: "...", result: "..." }]
```

#### 📍 Локации и устройства

**GET /locations** - Получить список локаций
```javascript
const locations = await axios.get('/api.php/module/dashboard_pro/locations');
// Возвращает: [{ ID, TITLE, PARENT_ID }]
```

**GET /devices** - Получить список устройств
```javascript
const devices = await axios.get('/api.php/module/dashboard_pro/devices');
// Возвращает: [{ ID, TITLE, TYPE, LINKED_OBJECT, STATUS }]
```

#### 📝 События

**GET /events?limit=50** - Получить последние события
```javascript
const events = await axios.get('/api.php/module/dashboard_pro/events?limit=20');
// Возвращает: [{ ID, TITLE, DETAILS, ADDED, ... }]
```

#### ⚙️ Настройки и виджеты

**GET /settings** - Получить настройки дашборда
```javascript
const settings = await axios.get('/api.php/module/dashboard_pro/settings');
```

**POST /settings** - Сохранить настройки
```javascript
await axios.post('/api.php/module/dashboard_pro/settings', {
    data: { theme: 'dark', language: 'en' }
});
```

**GET /widgets** - Получить конфигурацию виджетов
```javascript
const widgets = await axios.get('/api.php/module/dashboard_pro/widgets');
```

**POST /widgets** - Сохранить конфигурацию виджетов
```javascript
await axios.post('/api.php/module/dashboard_pro/widgets', {
    data: [
        { id: 'widget1', type: 'chart', position: { x: 0, y: 0 } }
    ]
});
```

#### 🖥️ Системная информация

**GET /system** - Получить информацию о системе
```javascript
const system = await axios.get('/api.php/module/dashboard_pro/system');
// Возвращает: { 
//   php_version: "7.4",
//   mysql_version: "5.7",
//   memory_usage: 2097152,
//   uptime: "5d 3h 22m",
//   modules_count: 45,
//   objects_count: 120,
//   scripts_count: 35
// }
```

**GET /ping** - Проверка связи
```javascript
const ping = await axios.get('/api.php/module/dashboard_pro/ping');
// Возвращает: { status: "ok", timestamp: 1234567890, server_time: "..." }
```

## 🔌 WebSocket Integration

### Подключение

```javascript
const ws = new WebSocket('ws://your-server.com');

ws.onopen = () => {
    console.log('WebSocket подключен');
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleWebSocketMessage(data);
};

ws.onerror = (error) => {
    console.error('WebSocket ошибка:', error);
};

ws.onclose = () => {
    console.log('WebSocket отключен');
    // Попытка переподключения
    setTimeout(() => connectWebSocket(), 5000);
};
```

### Команды сервера

Сервер может отправлять следующие команды через WebSocket:

#### ViewNotify - Показать уведомление
```json
{
    "COMMAND": "ViewNotify",
    "NOTIFY": {
        "text": "Температура повышена!",
        "icon": "warning",
        "color": "#f59e0b"
    }
}
```

#### UpdateWidget - Обновить виджет
```json
{
    "COMMAND": "UpdateWidget",
    "WIDGET_ID": "temperature_widget",
    "DATA": {
        "value": 23.5,
        "unit": "°C",
        "trend": "up"
    }
}
```

### Отправка команд с backend

```php
// PHP код в модуле
$this->sendNotification('Дверь открыта!', 'door', '#ef4444');

$this->updateWidget('temp_sensor', [
    'value' => 22.5,
    'unit' => '°C'
]);
```

## 🎨 Расширение модуля

### Добавление нового API endpoint

В файле `dashboard_pro.class.php`:

```php
function api($params) {
    // ... существующие endpoints ...
    
    // Новый endpoint
    if ($params['request'][0] == 'myCustomEndpoint') {
        // Ваша логика
        $data = $this->getCustomData();
        return $data;
    }
    
    return ['error' => 'Unknown API endpoint'];
}

function getCustomData() {
    // Получение данных
    return SQLSelect("SELECT * FROM my_table");
}
```

### Создание нового виджета

1. Добавьте HTML в `dashboard_pro.html`:
```html
<div class="widget">
    <div class="widget-header">
        <span class="widget-title">Мой виджет</span>
    </div>
    <div class="widget-content">
        {{ customData }}
    </div>
</div>
```

2. Добавьте логику в Vue setup():
```javascript
const customData = ref(null);

async function loadCustomData() {
    const response = await axios.get(apiBase + 'myCustomEndpoint');
    customData.value = response.data;
}

onMounted(() => {
    loadCustomData();
});
```

### Стилизация

Добавьте свои стили в `<style>` секцию или подключите внешний CSS файл:

```html
<link rel="stylesheet" href="/templates/dashboard_pro/css/custom.css">
```

## 🔐 Безопасность

### Важные замечания

⚠️ **PHP Консоль** - мощный инструмент, который может выполнять любой PHP код. Используйте с осторожностью!

Рекомендации:
1. Ограничьте доступ к модулю только для администраторов
2. Не используйте консоль в production без необходимости
3. Регулярно проверяйте логи выполнения
4. Используйте валидацию входных данных

### Валидация входных данных

```php
// Всегда проверяйте входные параметры
$object_id = (int)$params['object_id'];
$object_name = escapeshellarg($params['object']);

// Проверяйте права доступа
if (!checkAccess('dashboard_pro')) {
    return ['error' => 'Access denied'];
}
```

## 📊 Мониторинг и логи

### Логирование действий

```php
// В методах модуля
DebMes("Dashboard Pro: вызван метод " . $method_name, 'dashboard_pro');

// Просмотр логов
// Панель управления → Система → Логи
```

### Отслеживание ошибок

Все ошибки автоматически логируются. Для просмотра:
1. Откройте браузер Console (F12)
2. Проверьте логи MajorDoMo
3. Используйте endpoint `/events` для системных событий

## 🔄 Обновление модуля

### Процедура обновления

1. Скачайте новую версию
2. Замените файлы модуля
3. Очистите кэш браузера (Ctrl+F5)
4. Проверьте работоспособность

### Миграция данных

При изменении структуры базы данных:

```php
function install($data = '') {
    parent::install();
    
    // Проверка существования таблицы
    $table_exists = SQLSelectOne("SHOW TABLES LIKE 'dashboards'");
    
    if (!$table_exists) {
        // Создание новой таблицы
        SQLExec("CREATE TABLE dashboards (...)");
    } else {
        // Миграция существующих данных
        SQLExec("ALTER TABLE dashboards ADD COLUMN new_field VARCHAR(255)");
    }
}
```

## 🐛 Troubleshooting

###常见问题

**WebSocket не подключается**
- Проверьте URL WebSocket сервера в настройках MajorDoMo
- Убедитесь, что порт открыт в фаерволе
- Проверьте консоль браузера на ошибки

**API возвращает ошибку 404**
- Убедитесь, что модуль установлен и активирован
- Проверьте путь к API endpoint
- Перезагрузите веб-сервер

**Данные не обновляются**
- Проверьте соединение с базой данных
- Увеличьте интервал обновления в настройках
- Проверьте логи на ошибки выполнения запросов

**Vue.js не загружается**
- Проверьте подключение к интернету (CDN)
- Или скачайте Vue.js локально
- Очистите кэш браузера

## 📝 Примеры использования

### Пример 1: Мониторинг температуры

```javascript
// Создание виджета температуры
async function createTemperatureWidget() {
    const temp = await axios.get('/api.php/module/dashboard_pro/getProperty', {
        params: { object: 'LivingRoom', property: 'temperature' }
    });
    
    return {
        title: 'Температура в гостиной',
        value: temp.data.value,
        unit: '°C',
        icon: 'thermometer-half'
    };
}
```

### Пример 2: Управление освещением

```javascript
// Включение света
async function turnOnLight(room) {
    await axios.post('/api.php/module/dashboard_pro/callMethod', {
        object: room + 'Light',
        method: 'turnOn'
    });
    
    // Показ уведомления
    showNotification('Свет в ' + room + ' включен', 'lightbulb', '#fbbf24');
}
```

### Пример 3: Автоматизация

```javascript
// Утренняя автоматизация
async function morningRoutine() {
    // Включить свет
    await turnOnLight('Kitchen');
    
    // Установить температуру
    await axios.post('/api.php/module/dashboard_pro/setProperty', {
        object: 'Thermostat',
        property: 'targetTemperature',
        value: 22
    });
    
    // Запустить сценарий
    await axios.post('/api.php/module/dashboard_pro/runScript', {
        script: 'PlayMorningMusic'
    });
}
```

## 🤝 Вклад в развитие

### Как помочь проекту

1. **Сообщайте об ошибках** - создавайте Issues на GitHub
2. **Предлагайте улучшения** - Pull Requests приветствуются
3. **Документируйте** - помогайте улучшать документацию
4. **Тестируйте** - проверяйте новые функции

### Разработка

```bash
# Клонирование репозитория
git clone https://github.com/yourusername/dashboard_pro.git

# Внесение изменений
# ...

# Тестирование
# Загрузите модуль в тестовый MajorDoMo

# Отправка PR
git push origin feature/my-feature
```

## 📄 Лицензия

Этот модуль распространяется под лицензией MIT. Смотрите файл LICENSE для подробностей.

## 👥 Авторы

- **Основан на анализе**: MBoard Pro by Sergejey
- **Разработан**: с помощью AI Assistant
- **Сообщество**: MajorDoMo Community

## 📞 Поддержка

- **Форум MajorDoMo**: https://mjdm.ru/forum/
- **GitHub Issues**: [Сообщить об ошибке](https://github.com/yourusername/dashboard_pro/issues)
- **Email**: your-email@example.com

## 🔗 Полезные ссылки

- [MajorDoMo Official](https://mjdm.ru/)
- [Vue.js Documentation](https://vuejs.org/)
- [WebSocket Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [MBoard Pro Analysis](./MBOARD_MODIFICATION_GUIDE.md)
- [Vue.js Quick Reference](./VUE_JS_QUICK_REFERENCE.md)

---

**Версия**: 1.0.0  
**Дата выпуска**: 2026-04-22  
**Совместимость**: MajorDoMo 0.47+

Made with ❤️ for MajorDoMo Community
