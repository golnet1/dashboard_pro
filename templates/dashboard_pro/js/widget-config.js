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
  // ---- Позиция (общие поля для всех типов) ----
  _common: {
    position: [
      { key: 'x', label: 'X (px)', type: 'number' },
      { key: 'y', label: 'Y (px)', type: 'number' },
      { key: 'width', label: 'Ширина (px)', type: 'number' },
      { key: 'height', label: 'Высота (px)', type: 'number' },
    ],
  },

  defaults: {},

  getFields(type, tab) {
    if (tab === 'position') return this._common.position;
    return [];
  },

  getTabs(type) {
    let tabs = ['main', 'params', 'advanced', 'position'];
    if (type === 'table') tabs.splice(2, 0, 'columns');
    return tabs;
  },
};
