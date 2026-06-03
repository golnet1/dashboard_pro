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

  // ---- Поля по типам виджетов (поля перенесены в js/widgets/*.js) ----
  types: {},

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
