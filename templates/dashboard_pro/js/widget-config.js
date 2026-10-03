// Unified widget fields config
// Widget scripts are loaded dynamically by type from the dashboard_widgets DB table.

window.DpWidgets = window.DpWidgets || {};

window.W = window.W || {};

W.fields = {
  // ---- Position (common fields for all types) ----
  _common: {
    advanced: [
      { key: 'radius', label: 'field_radius', type: 'number', placeholder: '0' },
    ],
    position: [
      { key: 'x', label: 'x_px', type: 'number' },
      { key: 'y', label: 'y_px', type: 'number' },
      { key: 'width', label: 'width_px', type: 'number' },
      { key: 'height', label: 'height_px', type: 'number' },
    ],
  },

  defaults: {},
};
