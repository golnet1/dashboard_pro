// Единый конфиг полей виджетов
// Добавление нового поля: одна строка в нужном типе + табе
window.W = window.W || {};

W.fields = {
  // ---- Общие поля (доступны всем типам) ----
  _common: {
    main: [
      { key: 'title', label: 'Название', type: 'text' },
      { key: 'subtitle', label: 'Подзаголовок', type: 'text', placeholder: 'Описание виджета' },
      { key: 'icon', label: 'Иконка', type: 'icon' },
      { key: 'unit', label: 'Единица', type: 'text', placeholder: 'Вт, °C, %' },
    ],
    methods: [],
    advanced: [
      { key: 'background', label: 'Подсветка иконки', type: 'checkbox' },
      { key: 'round', label: 'Круглая иконка', type: 'checkbox', showIf: { background: true } },
      { key: 'view_history', label: 'История изменений', type: 'checkbox' },
      { key: 'history_color', label: 'Цвет истории', type: 'color', showIf: { view_history: true } },
    ],
    position: [
      { key: 'x', label: 'X (px)', type: 'number' },
      { key: 'y', label: 'Y (px)', type: 'number' },
      { key: 'width', label: 'Ширина (px)', type: 'number' },
      { key: 'height', label: 'Высота (px)', type: 'number' },
    ],
  },

  // ---- Поля по типам виджетов ----
  types: {
    relay: {
      main: [],
      params: [],
    },
    dimmer: {
      main: [],
      params: [
        { key: 'help', type: 'info', text: 'Параметры уровня яркости' },
        { key: 'level_min', label: 'Мин', type: 'number', row: 'range' },
        { key: 'level_max', label: 'Макс', type: 'number', row: 'range' },
        { key: 'level_step', label: 'Шаг', type: 'number', row: 'range' },
      ],
    },
    value: {
      main: [],
      params: [
        { key: 'aliasLabels', label: 'Псевдонимы (JSON)', type: 'text', placeholder: '{"1":"Вкл","0":"Выкл"}' },
      ],
    },
    slider: {
      main: [],
      params: [
        { key: 'min', label: 'Мин', type: 'number', row: 'range' },
        { key: 'max', label: 'Макс', type: 'number', row: 'range' },
        { key: 'step', label: 'Шаг', type: 'number', step: 'any', row: 'range' },
        { key: 'prepend_icon', label: 'Иконка слева', type: 'icon_picker', placeholder: 'fas fa-minus', row: 'icons' },
        { key: 'append_icon', label: 'Иконка справа', type: 'icon_picker', placeholder: 'fas fa-plus', row: 'icons' },
      ],
    },
    button: {
      main: [],
      params: [
        { key: 'buttonText', label: 'Текст кнопки', type: 'text', default: 'Выполнить' },
        { key: 'value', label: 'Значение', type: 'text', default: '1' },
        { key: 'method', label: 'Метод', type: 'text', placeholder: 'method_name' },
        { key: 'command', label: 'Команда', type: 'text', placeholder: 'Команда (если есть)' },
        { key: 'hold', label: 'Удержание (сек)', type: 'number', default: 1 },
      ],
    },
    select: {
      main: [],
      params: [
        { key: 'help', type: 'info', text: 'Формат: [{"label":"...", "value":"...", "icon":"..."}]' },
        { key: 'options', label: 'Варианты (JSON)', type: 'textarea', rows: 4, placeholder: '[{"label":"Вкл","value":"1","icon":"fas fa-check"}]' },
      ],
    },
    text: {
      main: [],
      params: [
        { key: 'help', type: 'info', text: 'Если указан объект — отображается его значение, иначе статический текст' },
        { key: 'text', label: 'Статический текст', type: 'textarea', rows: 3 },
      ],
    },
    clock: {
      main: [],
      params: [
        { key: 'locale', label: 'Формат времени', type: 'text', default: 'ru-RU', placeholder: 'ru-RU' },
        { key: 'sizeTime', label: 'Размер времени (px)', type: 'number', default: 48 },
        { key: 'sizeDate', label: 'Размер даты (px)', type: 'number', default: 16 },
        { key: 'viewTime', label: 'Показывать время', type: 'checkbox', default: true },
        { key: 'viewDate', label: 'Показывать дату', type: 'checkbox', default: true },
      ],
    },
    iframe: {
      main: [],
      params: [
        { key: 'url', label: 'URL', type: 'text', placeholder: 'https://example.com' },
      ],
    },
    image: {
      main: [],
      params: [
        { key: 'url', label: 'URL изображения', type: 'text', placeholder: 'https://example.com/image.jpg' },
        { key: 'help', type: 'info', text: 'Можно использовать {value} в URL — подставится значение объекта' },
        { key: 'timeout', label: 'Обновление (сек)', type: 'number', default: 0, placeholder: '0 — без обновления' },
      ],
    },
    panellink: {
      main: [],
      params: [
        { key: 'panel', label: 'Панель', type: 'panel_select' },
        { key: 'icon', label: 'Своя иконка', type: 'text', placeholder: 'fas fa-link' },
        { key: 'image', label: 'Своё изображение', type: 'text', placeholder: 'URL' },
      ],
    },
    rgb: {
      main: [],
      params: [
        { key: 'object_color', label: 'Объект цвета', type: 'object' },
      ],
    },
    progressbar: {
      main: [],
      params: [
        { key: 'level_min', label: 'Мин', type: 'number', row: 'range' },
        { key: 'level_max', label: 'Макс', type: 'number', row: 'range' },
        { key: 'striped', label: 'Полосатый', type: 'checkbox' },
        { key: 'rounded', label: 'Скруглённый', type: 'checkbox' },
        { key: 'color_progress', label: 'Цвет прогресса', type: 'text', default: 'primary', placeholder: 'primary / #ff0000' },
      ],
    },
    gauge: {
      main: [],
      params: [
        { key: 'minValue', label: 'Мин', type: 'number', row: 'range' },
        { key: 'maxValue', label: 'Макс', type: 'number', row: 'range' },
        { key: 'round', label: 'Округление', type: 'number', placeholder: '0' },
        { key: 'doughnut', label: 'Пончик (кольцо)', type: 'checkbox' },
        { key: 'colors', label: 'Цвета градиента (JSON)', type: 'textarea', rows: 2, placeholder: '[{"color":"#a9d70b"},{"color":"#f9c802"},{"color":"#ff0000"}]' },
      ],
    },
    test: {
      main: [],
      params: [],
    },
    unknown: {
      main: [],
      params: [],
    },
    sendtext: {
      main: [],
      params: [
        { key: 'url', label: 'URL (используйте {text})', type: 'text', placeholder: '/command.php?qry=<text>' },
        { key: 'autosend', label: 'Отправлять после голоса', type: 'checkbox' },
      ],
    },
    analogclock: {
      main: [],
      params: [],
    },
    status: {
      main: [],
      params: [
        { key: 'object_status', label: 'Объект статуса', type: 'object' },
        { key: 'statuses', label: 'Статусы (JSON)', type: 'textarea', rows: 3, placeholder: '[{"status":"0","title":"Выкл","icon":"fas fa-power-off","color":"#ef4444"},{"status":"1","title":"Вкл","icon":"fas fa-check","color":"#22c55e"}]' },
      ],
    },
    datepicker: {
      main: [],
      params: [],
    },
    timepicker: {
      main: [],
      params: [],
    },
    roundslider: {
      main: [],
      params: [
        { key: 'min', label: 'Мин', type: 'number', default: 0, row: 'range' },
        { key: 'max', label: 'Макс', type: 'number', default: 100, row: 'range' },
        { key: 'step', label: 'Шаг', type: 'number', default: 1, row: 'range' },
        { key: 'unit', label: 'Единица', type: 'text', placeholder: '%' },
      ],
    },
    graph: {
      main: [],
      params: [
        { key: 'days', label: 'Дней истории', type: 'number', default: 1 },
      ],
    },
    bargraph: {
      main: [],
      params: [
        { key: 'days', label: 'Дней истории', type: 'number', default: 1 },
      ],
    },
    weather: {
      main: [],
      params: [
        { key: 'api_key', label: 'API Key (OpenWeatherMap)', type: 'text' },
        { key: 'city_id', label: 'City ID', type: 'text', placeholder: 'ID города' },
        { key: 'lat', label: 'Широта', type: 'text', placeholder: '55.75', row: 'coord' },
        { key: 'lon', label: 'Долгота', type: 'text', placeholder: '37.62', row: 'coord' },
        { key: 'help', type: 'info', text: 'Укажите API Key и City ID, или координаты' },
      ],
    },
    table: {
      main: [
        { key: 'url', label: 'URL (JSON)', type: 'text', placeholder: 'https://api.example.com/data' },
        { key: 'query', label: 'Запрос', type: 'textarea', rows: 5, placeholder: 'SQL-запрос или JSONPath' },
      ],
      params: [],
      columns: [
        { key: 'info', label: 'Информация', type: 'text' },
        { key: 'data_name', label: 'Имя колонки с данными', type: 'text' },
        { key: 'align', label: 'Выравнивание', type: 'select', options: [
          { value: 'start', title: 'Left' },
          { value: 'center', title: 'Center' },
          { value: 'end', title: 'Right' },
        ]},
        { key: 'width', label: 'Ширина', type: 'text' },
        { key: 'sortable', label: 'Разрешить сортировку', type: 'checkbox' },
        { key: 'separator', label: 'Разделитель', type: 'checkbox' },
        { key: 'data_type', label: 'Тип данных', type: 'select', options: [] },
        { key: 'color_column', label: 'Имя колонки с цветом', type: 'text' },
      ],
    },
    timeline: {
      main: [],
      params: [
        { key: 'url', label: 'URL (JSON)', type: 'text', placeholder: 'https://api.example.com/events' },
      ],
    },
    group: {
      main: [],
      params: [
        { key: 'group_id', label: 'ID группы', type: 'text' },
      ],
    },
    map: {
      main: [],
      params: [
        { key: 'lat', label: 'Широта', type: 'text', placeholder: '55.75', row: 'coord' },
        { key: 'lon', label: 'Долгота', type: 'text', placeholder: '37.62', row: 'coord' },
      ],
    },
    calendar: {
      main: [],
      params: [],
    },
    colorslider: {
      main: [],
      params: [
        { key: 'object', label: 'Объект цвета', type: 'object' },
      ],
    },
    empty: {
      main: [],
      params: [
        { key: 'label', label: 'Текст', type: 'text' },
        { key: 'transparent', label: 'Прозрачный', type: 'checkbox' },
      ],
    },
    keypad: {
      main: [],
      params: [
        { key: 'object', label: 'Объект для отправки', type: 'object' },
        { key: 'property', label: 'Свойство', type: 'text', placeholder: 'value' },
      ],
    },
    roominfo: {
      main: [],
      params: [
        { key: 'help', type: 'info', text: 'Укажите датчики в формате JSON: [{"object":"obj1","label":"Темп.","icon":"fas fa-thermometer-half","suffix":"°C"},{"object":"obj2","label":"Влажность","icon":"fas fa-tint","suffix":"%"}]' },
        { key: 'sensors', label: 'Датчики (JSON)', type: 'textarea', rows: 4 },
      ],
    },
    slideshow: {
      main: [],
      params: [
        { key: 'images', label: 'Изображения (JSON или через запятую)', type: 'textarea', rows: 2, placeholder: 'url1.jpg, url2.jpg, url3.jpg' },
        { key: 'interval', label: 'Интервал (сек)', type: 'number', default: 5 },
      ],
    },
    sliderbuttons: {
      main: [],
      params: [
        { key: 'object', label: 'Объект', type: 'object' },
        { key: 'property', label: 'Свойство', type: 'text', placeholder: 'level' },
        { key: 'min', label: 'Мин', type: 'number', default: 0, row: 'range' },
        { key: 'max', label: 'Макс', type: 'number', default: 100, row: 'range' },
        { key: 'step', label: 'Шаг', type: 'number', default: 1, row: 'range' },
        { key: 'unit', label: 'Единица', type: 'text', placeholder: '%' },
      ],
    },
    thermostat: {
      main: [],
      params: [
        { key: 'object_current', label: 'Объект текущей температуры', type: 'object' },
        { key: 'object_target', label: 'Объект целевой температуры', type: 'object' },
        { key: 'object_status', label: 'Объект статуса', type: 'object' },
        { key: 'min', label: 'Мин', type: 'number', default: 5, row: 'range' },
        { key: 'max', label: 'Макс', type: 'number', default: 35, row: 'range' },
      ],
    },
    trend: {
      main: [],
      params: [
        { key: 'object', label: 'Объект', type: 'object' },
        { key: 'property', label: 'Свойство', type: 'text', placeholder: 'value' },
        { key: 'interval', label: 'Интервал обновления (сек)', type: 'number', default: 30 },
        { key: 'round', label: 'Округление', type: 'number', placeholder: '1' },
      ],
    },
  },

  // ---- Дефолтные значения для addWidget ----
  defaults: {
    relay: { icon: 'fas fa-power-off', background: false, round: false },
    dimmer: { icon: 'fas fa-lightbulb', property: 'level', level_min: 0, level_max: 100, level_step: 1, background: false, round: false },
    value: { icon: 'fas fa-hashtag', aliasLabels: null, background: false, round: false },
    text: { icon: 'fas fa-font', text: '' },
    slider: { icon: 'fas fa-sliders-h', property: 'level', min: 0, max: 100, step: 1, prepend_icon: '', append_icon: '' },
    select: { icon: 'fas fa-list', options: JSON.stringify([{label:'Вкл',value:'1'},{label:'Выкл',value:'0'}]) },
    button: { icon: 'fas fa-play', buttonText: 'Выполнить', hold: 1, value: '1', command: '', method: '' },
    clock: { icon: 'fas fa-clock', locale: 'ru-RU', viewTime: true, viewDate: true, sizeTime: 48, sizeDate: 16 },
    iframe: { icon: 'fas fa-window-maximize', url: '' },
    image: { icon: 'fas fa-image', url: '', timeout: 0 },
    panellink: { icon: 'fas fa-link', panel: '', image: '' },
    rgb: { icon: 'fas fa-palette', property: 'status', background: false, round: false },
    progressbar: { icon: 'fas fa-chart-bar', level_min: 0, level_max: 100, striped: false, rounded: false, color_progress: 'primary' },
    gauge: { icon: 'fas fa-gauge-high', minValue: 0, maxValue: 100, round: 0, doughnut: false, colors: JSON.stringify([{color:'#a9d70b'},{color:'#f9c802'},{color:'#ff0000'}]) },
    test: { icon: 'fas fa-flask' },
    unknown: { icon: 'fas fa-question-circle' },
    sendtext: { icon: 'fas fa-paper-plane', url: '', autosend: false },
    analogclock: { icon: 'fas fa-clock' },
    status: { icon: 'fas fa-info-circle', statuses: JSON.stringify([{status:'0',title:'Выкл',icon:'fas fa-power-off',color:'#ef4444'},{status:'1',title:'Вкл',icon:'fas fa-check',color:'#22c55e'}]) },
    datepicker: { icon: 'fas fa-calendar-alt' },
    timepicker: { icon: 'fas fa-clock' },
    roundslider: { icon: 'fas fa-circle', min: 0, max: 100, step: 1, unit: '%' },
    graph: { icon: 'fas fa-chart-line', days: 1 },
    bargraph: { icon: 'fas fa-chart-bar', days: 1 },
    weather: { icon: 'fas fa-cloud-sun', api_key: '', city_id: '', lat: '', lon: '' },
    table: { icon: 'fas fa-table', url: '', query: '', refresh: 60, columns: '[]' },
    timeline: { icon: 'fas fa-stream', url: '' },
    group: { icon: 'fas fa-layer-group', group_id: '' },
    map: { icon: 'fas fa-map-marker-alt', lat: '', lon: '' },
    calendar: { icon: 'fas fa-calendar-alt' },
    colorslider: { icon: 'fas fa-palette' },
    empty: { icon: 'fas fa-square', label: '', transparent: false },
    keypad: { icon: 'fas fa-th', property: 'value' },
    roominfo: { icon: 'fas fa-home', sensors: JSON.stringify([{object:'',label:'',icon:'',suffix:''}]) },
    slideshow: { icon: 'fas fa-images', images: '', interval: 5 },
    sliderbuttons: { icon: 'fas fa-plus-minus', property: 'level', min: 0, max: 100, step: 1, unit: '' },
    thermostat: { icon: 'fas fa-thermometer-half', min: 5, max: 35 },
    trend: { icon: 'fas fa-chart-line', property: 'value', interval: 30, round: 1 },
  },

  // ---- Получить поля для (тип, таб) ----
  getFields(type, tab) {
    const common = this._common[tab] || [];
    const specific = (this.types[type] && this.types[type][tab]) || [];
    return [...common, ...specific];
  },

  // ---- Какие табы показывать для типа ----
  getTabs(type) {
    let tabs = ['main', 'params', 'advanced', 'position'];
    if (this.hasMethodsTab(type)) tabs.splice(2, 0, 'methods');
    if (type === 'table') tabs.splice(2, 0, 'columns');
    return tabs;
  },

  hasMethodsTab(type) {
    return false;
  },
};
