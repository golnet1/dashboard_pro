// Unified widget fields config
// Add new field: one line in the right type + tab

// Load widget scripts
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
        document.write('<script src="js/widgets/' + widgets[i] + '.js?v=9"><\/script>');
    }
})();

window.W = window.W || {};

W.fields = {
  // ---- Position (common fields for all types) ----
  _common: {
    position: [
      { key: 'x', label: 'x_px', type: 'number' },
      { key: 'y', label: 'y_px', type: 'number' },
      { key: 'width', label: 'width_px', type: 'number' },
      { key: 'height', label: 'height_px', type: 'number' },
    ],
  },

  defaults: {},

  getFields(type, tab) {
    if (tab === 'position') return this._common.position;
    return [];
  },
};
