// Единый конфиг полей виджетов
// Добавление нового поля: одна строка в нужном типе + табе

// Загружаем скрипты виджетов
(function() {
    var widgets = [
        'relay', 'value', 'button', 'slider', 'dimmer', 'text', 'select',
        'clock', 'iframe', 'rgb', 'progressbar', 'gauge', 'image', 'panellink',
        'test', 'unknown', 'sendtext', 'analogclock', 'status', 'datepicker',
        'timepicker', 'roundslider', 'graph', 'bargraph', 'weather', 'table',
        'timeline', 'group', 'map', 'calendar', 'colorslider', 'empty',
        'keypad', 'roominfo', 'slideshow', 'sliderbuttons', 'thermostat', 'trend'
    ];
    for (var i = 0; i < widgets.length; i++) {
        document.write('<script src="js/widgets/' + widgets[i] + '.js?v=8"><\/script>');
    }
})();

window.W = window.W || {};

W.fields = {
  // ---- Общие поля (доступны всем типам) ----
  _common: {
    main: [
      { key: 'title', label: 'Название', type: 'text' },
      { key: 'icon', label: 'Иконка', type: 'icon' },
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
    // ===== Object + Property + Methods =====
    relay: {
      params: [
        { key: 'object', label: 'Объект', type: 'object', row: 'obj_prop' },
        { key: 'property', label: 'Свойство', type: 'property', row: 'obj_prop' },
        { key: 'object_switch_obj', label: 'Объект (перекл)', type: 'method_object', parent: 'object_switch', row: 'm_switch' },
        { key: 'object_switch', label: 'Метод (перекл)', type: 'method', parent: 'object_switch', row: 'm_switch' },
        { key: 'object_on_obj', label: 'Объект (вкл)', type: 'method_object', parent: 'object_on', row: 'm_on' },
        { key: 'object_on', label: 'Метод (вкл)', type: 'method', parent: 'object_on', row: 'm_on' },
        { key: 'object_off_obj', label: 'Объект (выкл)', type: 'method_object', parent: 'object_off', row: 'm_off' },
        { key: 'object_off', label: 'Метод (выкл)', type: 'method', parent: 'object_off', row: 'm_off' },
      ],
      advanced: [
        { key: 'object_alive', label: 'Признак доступности', type: 'object' },
        { key: 'alive_timeout', label: 'Таймаут (сек)', type: 'number', step: 1 },
        { key: 'object_info', label: 'Информация объекта', type: 'object' },
        { key: 'pre_info', label: 'Префикс информации', type: 'text', row: 'info_affix' },
        { key: 'pos_info', label: 'Постфикс информации', type: 'text', row: 'info_affix' },
      ],
    },
    dimmer: {
      params: [
        { key: 'object', label: 'Объект', type: 'object', row: 'obj_prop' },
        { key: 'property', label: 'Свойство', type: 'property', row: 'obj_prop' },
        { key: 'object_switch_obj', label: 'Объект (перекл)', type: 'method_object', parent: 'object_switch', row: 'm_switch' },
        { key: 'object_switch', label: 'Метод (перекл)', type: 'method', parent: 'object_switch', row: 'm_switch' },
      ],
    },
    rgb: {
      params: [
        { key: 'object', label: 'Объект', type: 'object', row: 'obj_prop' },
        { key: 'property', label: 'Свойство', type: 'property', row: 'obj_prop' },
        { key: 'object_color_obj', label: 'Объект (цвет)', type: 'method_object', parent: 'object_color', row: 'm_color' },
        { key: 'object_color', label: 'Метод (цвет)', type: 'method', parent: 'object_color', row: 'm_color' },
        { key: 'object_switch_obj', label: 'Объект (перекл)', type: 'method_object', parent: 'object_switch', row: 'm_switch' },
        { key: 'object_switch', label: 'Метод (перекл)', type: 'method', parent: 'object_switch', row: 'm_switch' },
        { key: 'object_on_obj', label: 'Объект (вкл)', type: 'method_object', parent: 'object_on', row: 'm_on' },
        { key: 'object_on', label: 'Метод (вкл)', type: 'method', parent: 'object_on', row: 'm_on' },
        { key: 'object_off_obj', label: 'Объект (выкл)', type: 'method_object', parent: 'object_off', row: 'm_off' },
        { key: 'object_off', label: 'Метод (выкл)', type: 'method', parent: 'object_off', row: 'm_off' },
      ],
    },

    // ===== Object + Property only =====
    gauge: {
      params: [
        { key: 'object', label: 'Объект', type: 'object', row: 'obj_prop' },
        { key: 'property', label: 'Свойство', type: 'property', row: 'obj_prop' },
      ],
    },
    map: {
      params: [
        { key: 'object', label: 'Объект', type: 'object', row: 'obj_prop' },
        { key: 'property', label: 'Свойство', type: 'property', row: 'obj_prop' },
      ],
    },
    progressbar: {
      params: [
        { key: 'object', label: 'Объект', type: 'object', row: 'obj_prop' },
        { key: 'property', label: 'Свойство', type: 'property', row: 'obj_prop' },
      ],
      advanced: [
        { key: 'pre_info', label: 'Префикс информации', type: 'text', row: 'info_affix' },
        { key: 'pos_info', label: 'Постфикс информации', type: 'text', row: 'info_affix' },
      ],
    },
    roundslider: {
      params: [
        { key: 'object', label: 'Объект', type: 'object', row: 'obj_prop' },
        { key: 'property', label: 'Свойство', type: 'property', row: 'obj_prop' },
      ],
    },
    select: {
      params: [
        { key: 'object', label: 'Объект', type: 'object', row: 'obj_prop' },
        { key: 'property', label: 'Свойство', type: 'property', row: 'obj_prop' },
      ],
    },
    sendtext: {
      params: [
        { key: 'object', label: 'Объект', type: 'object', row: 'obj_prop' },
        { key: 'property', label: 'Свойство', type: 'property', row: 'obj_prop' },
      ],
    },
    slider: {
      params: [
        { key: 'object', label: 'Объект', type: 'object', row: 'obj_prop' },
        { key: 'property', label: 'Свойство', type: 'property', row: 'obj_prop' },
      ],
    },
    text: {
      params: [
        { key: 'object', label: 'Объект', type: 'object', row: 'obj_prop' },
        { key: 'property', label: 'Свойство', type: 'property', row: 'obj_prop' },
      ],
    },
    value: {
      params: [
        { key: 'object', label: 'Объект', type: 'object', row: 'obj_prop' },
        { key: 'property', label: 'Свойство', type: 'property', row: 'obj_prop' },
      ],
      advanced: [
        { key: 'object_info', label: 'Информация объекта', type: 'object' },
        { key: 'pre_info', label: 'Префикс информации', type: 'text', row: 'info_affix' },
        { key: 'pos_info', label: 'Постфикс информации', type: 'text', row: 'info_affix' },
      ],
    },

    // ===== Object only =====
    bargraph: {
      params: [
        { key: 'object', label: 'Объект', type: 'object' },
      ],
    },
    button: {
      params: [
        { key: 'object', label: 'Объект', type: 'object' },
      ],
    },
    graph: {
      params: [
        { key: 'object', label: 'Объект', type: 'object' },
      ],
    },
    image: {
      params: [
        { key: 'object', label: 'Объект', type: 'object' },
      ],
    },
    timeline: {
      params: [
        { key: 'object', label: 'Объект', type: 'object' },
      ],
    },
    table: {
      params: [
        { key: 'object', label: 'Объект', type: 'object' },
      ],
    },

    // ===== Widgets with custom params (already define object/property in component) =====
    // colorslider, keypad, sliderbuttons, status, trend — have object/property in fields.params

    // ===== Special: multiple named objects =====
    thermostat: {
      params: [
        { key: 'object', label: 'Объект', type: 'object' },
      ],
    },

    // ===== No Object/Property (no params config needed) =====
    // analogclock, calendar, clock, datepicker, empty, group, iframe, panellink,
    // roominfo, slideshow, test, timepicker, unknown, weather
  },

  // ---- Дефолтные значения (перенесены в js/widgets/*.js) ----
  defaults: {},

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
