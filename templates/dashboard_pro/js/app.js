const { createApp, ref, reactive, computed, watch, onMounted, nextTick } = Vue;

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

const widgetDefs = [
    { type: 'relay', icon: 'fas fa-power-off', title: 'Реле', desc: 'Управление включением/выключением' },
    { type: 'dimmer', icon: 'fas fa-lightbulb', title: 'Диммер', desc: 'Управление яркостью' },
    { type: 'value', icon: 'fas fa-hashtag', title: 'Значение', desc: 'Отображение числового значения' },
    { type: 'text', icon: 'fas fa-font', title: 'Текст', desc: 'Отображение текста' },
    { type: 'slider', icon: 'fas fa-sliders-h', title: 'Слайдер', desc: 'Ползунок для управления' },
    { type: 'select', icon: 'fas fa-list', title: 'Выбор', desc: 'Выбор из вариантов' },
    { type: 'button', icon: 'fas fa-play', title: 'Кнопка', desc: 'Выполнение метода' },
    { type: 'clock', icon: 'fas fa-clock', title: 'Часы', desc: 'Цифровые часы' },
    { type: 'iframe', icon: 'fas fa-window-maximize', title: 'iFrame', desc: 'Встроенная страница' },
    { type: 'image', icon: 'fas fa-image', title: 'Изображение', desc: 'Отображение изображения' },
    { type: 'panellink', icon: 'fas fa-link', title: 'Ссылка на панель', desc: 'Переход на другую панель' },
    { type: 'rgb', icon: 'fas fa-palette', title: 'RGB', desc: 'Управление цветом' },
    { type: 'progressbar', icon: 'fas fa-chart-bar', title: 'Прогресс-бар', desc: 'Шкала прогресса' },
    { type: 'gauge', icon: 'fas fa-gauge-high', title: 'Индикатор', desc: 'Круговой индикатор' },
    { type: 'test', icon: 'fas fa-flask', title: 'Тест', desc: 'Тестовый виджет' },
    { type: 'unknown', icon: 'fas fa-question-circle', title: 'Неизвестный', desc: 'Виджет неизвестного типа' },
    { type: 'sendtext', icon: 'fas fa-paper-plane', title: 'Отправка текста', desc: 'Отправка текста на URL' },
    { type: 'analogclock', icon: 'fas fa-clock', title: 'Аналоговые часы', desc: 'Аналоговые часы' },
    { type: 'status', icon: 'fas fa-info-circle', title: 'Статус', desc: 'Отображение статуса объекта' },
    { type: 'datepicker', icon: 'fas fa-calendar-alt', title: 'Выбор даты', desc: 'Выбор даты' },
    { type: 'timepicker', icon: 'fas fa-clock', title: 'Выбор времени', desc: 'Выбор времени' },
    { type: 'roundslider', icon: 'fas fa-circle', title: 'Круглый слайдер', desc: 'Круглый ползунок' },
    { type: 'graph', icon: 'fas fa-chart-line', title: 'График', desc: 'График значения' },
    { type: 'bargraph', icon: 'fas fa-chart-bar', title: 'Бар-график', desc: 'Столбчатая диаграмма' },
    { type: 'weather', icon: 'fas fa-cloud-sun', title: 'Погода', desc: 'Прогноз погоды' },
    { type: 'table', icon: 'fas fa-table', title: 'Таблица', desc: 'Таблица данных' },
    { type: 'timeline', icon: 'fas fa-stream', title: 'Таймлайн', desc: 'Лента событий' },
    { type: 'group', icon: 'fas fa-layer-group', title: 'Группа', desc: 'Группа виджетов' },
    { type: 'map', icon: 'fas fa-map-marker-alt', title: 'Карта', desc: 'Карта с меткой' },
    { type: 'calendar', icon: 'fas fa-calendar-alt', title: 'Календарь', desc: 'Календарь' },
    { type: 'colorslider', icon: 'fas fa-palette', title: 'Цвет (слайдеры)', desc: 'Цвет с RGB слайдерами' },
    { type: 'empty', icon: 'fas fa-square', title: 'Пустой', desc: 'Пустой разделитель' },
    { type: 'keypad', icon: 'fas fa-th', title: 'Клавиатура', desc: 'Цифровая клавиатура' },
    { type: 'roominfo', icon: 'fas fa-home', title: 'Помещение', desc: 'Показатели помещения' },
    { type: 'slideshow', icon: 'fas fa-images', title: 'Слайд-шоу', desc: 'Слайд-шоу изображений' },
    { type: 'sliderbuttons', icon: 'fas fa-plus-minus', title: 'Слайдер с кнопками', desc: 'Слайдер с +/- кнопками' },
    { type: 'thermostat', icon: 'fas fa-thermometer-half', title: 'Термостат', desc: 'Управление температурой' },
    { type: 'trend', icon: 'fas fa-chart-line', title: 'Тренд', desc: 'Тренд значения' },
];

const app = createApp({
    setup() {
        const { authenticated, authChecking, login, password, loginError, loginLoading } = Auth;

        const { currentPanel, sidebarOpen, sidebarMini, expandedGroups, childPanels, toggleGroup, selectPanel, selectHomePanel, toggleSidebar } = Sidebar;

        const panels = ref([]);
        const loading = ref(true);
        const editMode = ref(false);
        const showAddWidget = ref(false);
        const widgetSearch = ref('');
        const editWidgetForm = ref(null);
        const widgetTab = ref('main');
        const draggingWidget = ref(null);
        const dragOffset = ref({ x: 0, y: 0 });
        const resizingWidget = ref(null);
        const resizeStart = ref({ x: 0, y: 0, w: 0, h: 0 });
        const widgetMenuTarget = ref(null);
        const chatOpen = ref(false);
        const chatMessages = ref([]);
        const chatText = ref('');
        const chatLoading = ref(false);

        const showNotifications = ref(false);
        const notifications = ref([]);
        const unreadCount = ref(0);
        const showSettings = ref(false);
        const showSettingsPanel = ref(false);
        const settingsTab = ref('main');
        const showAddPanel = ref(false);
        const showAbout = ref(false);
        const showExportDialog = ref(false);
        const exportMode = ref('all');
        const exportSelectedPanel = ref('');
        const exportUsers = ref([]);
        const exportSelectedUser = ref('');
        const editPanelData = ref(null);
        const newPanelTitle = ref('');
        const panelTab = ref('main');
        const panelError = ref('');
        const showIconPicker = ref(false);
        const iconTarget = ref('panel');
        const iconSearch = ref('');
        const iconCategory = ref('all');
        const iconCategorySearch = ref('');
        const iconPage = ref(1);
        const iconPageSize = 24;
        const panelForm = ref({ title: '', iconType: 'icon', icon: 'fas fa-folder', iconObject: '', iconProperty: '', image: '', hideNav: false, hideHome: false, panelType: 'group', parentGroup: 'root', dropdownNav: false, openOnClick: false, infoObject: '', infoProperty: '', infoPrefix: '', infoPostfix: '', background: false, circle: false, iconColor: 'default', showImageNav: false, individualSettings: false, showImageBg: false, bgSize: 'cover', verticalCompact: false });
        const objects = ref([]);
        const iconProperties = ref([]);
        const infoProperties = ref([]);
        const widgetProperties = ref([]);
        const bgProperties = ref([]);
        const methodCache = reactive({});
        const user = ref({ username: '', name: '', avatar: '', is_admin: false });
        const userMenuOpen = ref(false);
        const isAdmin = ref(false);
        const wsConnected = ref(false);
        const wsBytesReceived = ref(0);
        const wsBytesSent = ref(0);
        const wsPulse = ref(false);
        const wsStatus = ref(null);
        const bgColorMap = reactive({});
        const settings = ref({ theme: 'light', refresh_interval: 5000, refreshPeriod: 5000, forceDataUpdate: false, defaultPanel: '', debug: false, font: 'Roboto', hideMenu: false, hideChat: false, menuBg: '', panelBg: '', usePanelImage: true, useHeaderImage: false, cardsOpacity: 56, menuOpacity: 84, dialogOpacity: 88, primaryColor: '#1976d2', lightThemeColor: '#ffffff', darkThemeColor: '#303030', iconSize: 0, titleSize: 0, subtitleSize: 0, widgetSize: 0 });

        const filteredDefs = computed(() =>
            widgetSearch.value
                ? widgetDefs.filter(d => d.title.toLowerCase().includes(widgetSearch.value.toLowerCase()))
                : widgetDefs
        );

        const showMethodsTab = computed(() => {
            if (!editWidgetForm.value) return false;
            return W.fields.hasMethodsTab(editWidgetForm.value.type);
        });

        function getWidgetFields(type, tab) {
            if (typeof W === 'undefined' || !W.fields) return [];
            return W.fields.getFields(type, tab);
        }
        function getWidgetRows(type, tab) {
            const fields = getWidgetFields(type, tab);
            const rows = [];
            let cur = [], curRow = null;
            for (const f of fields) {
                if (f.row !== curRow && cur.length) { rows.push({ fields: cur, row: curRow }); cur = []; }
                curRow = f.row || null;
                cur.push(f);
            }
            if (cur.length) rows.push({ fields: cur, row: curRow });
            return rows;
        }

        const currentFields = computed(() => {
            if (!editWidgetForm.value || !editWidgetForm.value.type) return [];
            return getWidgetFields(editWidgetForm.value.type, widgetTab.value);
        });

        function fieldVisible(field) {
            if (!field.showIf || !editWidgetForm.value) return true;
            const [depKey, depVal] = Object.entries(field.showIf)[0];
            return editWidgetForm.value[depKey] === depVal;
        }

        function hasObjectProp(type) {
            return !['clock','iframe','panellink'].includes(type);
        }
        function hasPropertyField(type) {
            return !['clock','iframe','panellink','button','image'].includes(type);
        }

        function getMethodObj(val) { return val ? val.split('/')[0] : ''; }
        function getMethodName(val) { return val ? val.split('/')[1] || '' : ''; }
        function setMethodField(key, partVal, isObj) {
            const cur = editWidgetForm.value[key] || '';
            const obj = isObj ? partVal : getMethodObj(cur);
            const method = isObj ? getMethodName(cur) : partVal;
            editWidgetForm.value[key] = obj && method ? obj + '/' + method : (obj || method);
        }

        // ---- Column editing for table widget ----
        const columnIdx = ref(0);

        function getColumns() {
            try { return JSON.parse(editWidgetForm.value.columns || '[]'); }
            catch { return []; }
        }
        function setColumns(arr) {
            editWidgetForm.value.columns = JSON.stringify(arr);
        }

        function addColumn() {
            const cols = getColumns();
            cols.push({ info: '', data_name: '', align: 'start', width: '', sortable: true, separator: false, data_type: '', color_column: '' });
            setColumns(cols);
            columnIdx.value = cols.length - 1;
        }
        function removeColumn(idx) {
            const cols = getColumns();
            cols.splice(idx, 1);
            setColumns(cols);
            if (columnIdx.value >= cols.length) columnIdx.value = Math.max(0, cols.length - 1);
        }
        function moveColumnUp(idx) {
            if (idx <= 0) return;
            const cols = getColumns();
            [cols[idx - 1], cols[idx]] = [cols[idx], cols[idx - 1]];
            setColumns(cols);
            columnIdx.value = idx - 1;
        }
        function moveColumnDown(idx) {
            const cols = getColumns();
            if (idx >= cols.length - 1) return;
            [cols[idx], cols[idx + 1]] = [cols[idx + 1], cols[idx]];
            setColumns(cols);
            columnIdx.value = idx + 1;
        }
        function autoDetectColumns() {
            // Placeholder: will be implemented when table data fetching is ready
        }

        const columnFields = [
            { key: 'info', label: 'Информация' },
            { key: 'data_name', label: 'Имя колонки с данными' },
            { key: 'align', label: 'Выравнивание', type: 'select', options: [
                { value: 'start', title: 'Left' },
                { value: 'center', title: 'Center' },
                { value: 'end', title: 'Right' },
            ]},
            { key: 'width', label: 'Ширина' },
            { key: 'sortable', label: 'Разрешить сортировку', type: 'switch' },
            { key: 'separator', label: 'Разделитель', type: 'switch' },
            { key: 'data_type', label: 'Тип данных', type: 'select', options: [
                { value: '', title: '—' },
                { value: 'string', title: 'String' },
                { value: 'number', title: 'Number' },
                { value: 'date', title: 'Date' },
            ]},
            { key: 'color_column', label: 'Имя колонки с цветом' },
        ];

        function widgetBgStyle(w) {
            const s = {};
            const mode = w.bg_mode || (w.color ? 'color' : 'default');
            if (mode === 'color' && w.color) {
                s.backgroundColor = w.color;
            } else if (mode === 'image' && w.bg_image) {
                s.backgroundImage = 'url(' + w.bg_image + ')';
                s.backgroundSize = 'cover';
                s.backgroundPosition = 'center';
                s.backgroundRepeat = 'no-repeat';
            } else if (mode === 'property') {
                const bgVal = bgColorMap[w.id];
                if (bgVal) s.backgroundColor = bgVal;
            }
            return s;
        }

        const widgetTabPos = reactive({ left: '0px', width: '0px' });
        const panelTabPos = reactive({ left: '0px', width: '0px' });

        function updateWidgetTabSlider() {
            nextTick(() => {
                const el = document.querySelector('#widget-edit .v-tabs-bar__content');
                if (!el) return;
                const active = el.querySelector('.v-tab--active') || el.querySelector('.v-tab');
                if (!active) return;
                const er = el.getBoundingClientRect();
                const ar = active.getBoundingClientRect();
                widgetTabPos.left = (ar.left - er.left) + 'px';
                widgetTabPos.width = ar.width + 'px';
            });
        }

        function updatePanelTabSlider() {
            nextTick(() => {
                const el = document.querySelector('#panel-edit .v-tabs-bar__content');
                if (!el) return;
                const active = el.querySelector('.v-tab--active') || el.querySelector('.v-tab');
                if (!active) return;
                const er = el.getBoundingClientRect();
                const ar = active.getBoundingClientRect();
                panelTabPos.left = (ar.left - er.left) + 'px';
                panelTabPos.width = ar.width + 'px';
            });
        }

        watch(widgetTab, () => nextTick(updateWidgetTabSlider));
        watch(panelTab, () => nextTick(updatePanelTabSlider));

        const plusTooltip = computed(() => {
            if (!currentPanel.value || currentPanel.value.panelType === 'group') {
                return 'Добавить панель';
            }
            return 'Добавить виджет';
        });

        function addPlusButton() {
            if (!currentPanel.value || currentPanel.value.panelType === 'group') {
                openPanelForm(null);
            } else {
                showAddWidget.value = true;
            }
        }

        const wsTooltip = computed(() => {
            const status = wsConnected.value ? 'WebSocket: подключён' : 'WebSocket: отключён';
            const sent = wsBytesSent.value > 0 ? formatBytes(wsBytesSent.value) : '0 B';
            const recv = wsBytesReceived.value > 0 ? formatBytes(wsBytesReceived.value) : '0 B';
            let extra = '';
            if (wsStatus.value) {
                extra = `\nКлиентов: ${wsStatus.value.COUNT_CLIENTS}\nЗапущен: ${wsStatus.value.STARTED}`;
            }
            return `${status}\nОтправлено: ${sent}\nПолучено: ${recv}\nНажмите для статуса${extra}`;
        });

        function widgetTypeComponent(type) {
            const map = {
                relay: 'widget-relay', value: 'widget-value', button: 'widget-button',
                slider: 'widget-slider', dimmer: 'widget-dimmer', text: 'widget-text',
                select: 'widget-select', clock: 'widget-clock', iframe: 'widget-iframe',
                image: 'widget-image', panellink: 'widget-panellink',
                rgb: 'widget-rgb', progressbar: 'widget-progressbar', gauge: 'widget-gauge',
                test: 'widget-test', unknown: 'widget-unknown', sendtext: 'widget-sendtext',
                analogclock: 'widget-analogclock', status: 'widget-status', datepicker: 'widget-datepicker',
                timepicker: 'widget-timepicker', roundslider: 'widget-roundslider',
                graph: 'widget-graph', bargraph: 'widget-bargraph', weather: 'widget-weather',
                table: 'widget-table', timeline: 'widget-timeline', group: 'widget-group',
                map: 'widget-map',
                calendar: 'widget-calendar', colorslider: 'widget-colorslider',
                empty: 'widget-empty', keypad: 'widget-keypad', roominfo: 'widget-roominfo',
                slideshow: 'widget-slideshow', sliderbuttons: 'widget-sliderbuttons',
                thermostat: 'widget-thermostat', trend: 'widget-trend'
            };
            return map[type] || 'div';
        }

        async function initAuth() {
            await Auth.checkAuth(async (res) => {
                authenticated.value = true;
                user.value = { username: res.username, name: res.name || res.username, avatar: res.avatar || '', is_admin: res.is_admin || false };
                isAdmin.value = user.value.is_admin;
                if (!isAdmin.value) editMode.value = false;
                await loadData();
                checkNotifications();
            });
        }

        async function doLogin() {
            await Auth.doLogin(async (res) => {
                authenticated.value = true;
                user.value = { username: res.username, name: res.name || res.username, avatar: res.avatar || '', is_admin: res.is_admin || false };
                isAdmin.value = user.value.is_admin;
                if (!isAdmin.value) editMode.value = false;
                await loadData();
                checkNotifications();
            });
        }

        function doLogout() {
            Auth.doLogout();
            panels.value = [];
            currentPanel.value = null;
            user.value = { username: '', name: '', avatar: '', is_admin: false };
            userMenuOpen.value = false;
        }

        async function loadData() {
            loading.value = true;
            try {
                const data = await dpAPI('panels');
                if (data.error) return;
                panels.value = Array.isArray(data) ? data : (data.panels || []);
                if (!Array.isArray(panels.value)) panels.value = [];
                // fix: reset parentGroup for panels whose parent is not a group, and prevent group nesting
                panels.value.forEach(p => {
                    if (p.parentGroup && p.parentGroup !== 'root' && !panels.value.find(g => g.name === p.parentGroup && g.panelType === 'group')) {
                        p.parentGroup = 'root';
                    }
                    if (p.panelType === 'group' && p.parentGroup && p.parentGroup !== 'root') {
                        p.parentGroup = 'root';
                    }
                });
                // restore last selected panel
                if (!currentPanel.value && panels.value.length) {
                    const last = localStorage.getItem('dp_lastPanel');
                    if (last) currentPanel.value = panels.value.find(p => p.name === last);
                    if (!currentPanel.value)
                        currentPanel.value = panels.value.find(p => p.panelType !== 'group') || panels.value[0];
                }
                // auto-edit mode when no panels exist
                if (isAdmin.value && !panels.value.length) {
                    editMode.value = true;
                }
                const s = await dpAPI('settings');
                if (!s.error) Object.assign(settings.value, s);
                applySettings();
            } catch (e) {
                console.error('loadData error', e);
            }
            loading.value = false;
        }

        function addWidget(type) {
            const def = widgetDefs.find(d => d.type === type);
            const typeDefaults = W.fields.defaults[type] || {};
            // Build default values from all field definitions
            const allFields = ['main', 'params', 'methods', 'advanced'].flatMap(tab => W.fields.getFields(type, tab));
            const fieldDefaults = {};
            allFields.forEach(f => {
                if (f.key && f.default !== undefined) fieldDefaults[f.key] = f.default;
            });
            const w = {
                id: 'w_' + Date.now(), type,
                title: def?.title || type,
                icon: def?.icon || '', icon_type: 'icon', icon_object: '', icon_property: '', icon_url: '',
                object: '', property: '', unit: '',
                subtitle: '', buttonText: '', hold: 1, value: '1',
                command: '', method: '', aliasLabels: null,
                object_info: '', object_alive: '', object_color: '',
                pre_info: '', pos_info: '',
                bg_mode: 'default', color: '', bg_image: '', bg_object: '', bg_property: '',
                background: false, round: false,
                view_history: false, history_color: '#1976d2',
                alive_timeout: 60,
                level_min: 0, level_max: 100, level_step: 1,
                prepend_icon: '', append_icon: '',
                panel: '', timeout: 0, url: '',
                minValue: 0, maxValue: 100, doughnut: false,
                colors: JSON.stringify([{color:'#a9d70b'},{color:'#f9c802'},{color:'#ff0000'}]),
                striped: false, color_progress: 'primary',
                viewTime: true, viewDate: true, sizeTime: 48, sizeDate: 16,
                x: 0, y: 0, width: 280, height: 200,
                ...fieldDefaults,
                ...typeDefaults
            };
            w.icon = typeDefaults.icon || def?.icon || '';
            if (!currentPanel.value.widgets) currentPanel.value.widgets = [];
            currentPanel.value.widgets.push(w);
            showAddWidget.value = false;
            editWidgetForm.value = w;
        }

        async function editWidget(w) {
            widgetTab.value = 'main';
            columnIdx.value = 0;
            editWidgetForm.value = {
                ...w,
                icon_type: w.icon_type || w.iconType || 'icon',
                icon_object: w.icon_object || w.iconObject || '',
                icon_property: w.icon_property || w.iconProperty || '',
                icon_url: w.icon_url || w.image || '',
                pre_info: w.pre_info || w.prefix || '',
                pos_info: w.pos_info || w.postfix || '',
                columns: typeof w.columns === 'string' ? w.columns : JSON.stringify(w.columns || []),
                refresh: w.refresh || 60,
            };
            widgetProperties.value = [];
            infoProperties.value = [];
            await loadObjects();
            if (w.object) {
                const res = await dpAPI('properties?object_id=' + encodeURIComponent(w.object));
                widgetProperties.value = res.items || [];
            }
            if (w.object_info) {
                const res = await dpAPI('properties?object_id=' + encodeURIComponent(w.object_info));
                infoProperties.value = res.items || [];
            }
            const methodObj = getMethodObj(w.method);
            if (methodObj) loadObjectMethods(methodObj);
            nextTick(updateWidgetTabSlider);
        }

        function removeWidget(idx) {
            currentPanel.value.widgets.splice(idx, 1);
            savePanels();
        }

        function copyWidget(idx) {
            const src = currentPanel.value.widgets[idx];
            if (!src) return;
            const w = { ...src, id: 'w_' + Date.now(), title: src.title + ' (копия)', x: (src.x || 0) + 20, y: (src.y || 0) + 20 };
            currentPanel.value.widgets.splice(idx + 1, 0, w);
            savePanels();
        }

        function exportWidget(w) {
            const data = JSON.stringify(w, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'widget_' + w.id + '.json';
            a.click(); URL.revokeObjectURL(url);
        }

        function saveEditWidget() {
            if (!currentPanel.value.widgets || !editWidgetForm.value) return;
            const mode = editWidgetForm.value.bg_mode || (editWidgetForm.value.color ? 'color' : 'default');
            if (mode !== 'color') editWidgetForm.value.color = '';
            if (mode !== 'image') editWidgetForm.value.bg_image = '';
            if (mode !== 'property') { editWidgetForm.value.bg_object = ''; editWidgetForm.value.bg_property = ''; }
            const idx = currentPanel.value.widgets.findIndex(w => w.id === editWidgetForm.value.id);
            if (idx >= 0) currentPanel.value.widgets[idx] = { ...editWidgetForm.value };
            editWidgetForm.value = null;
            savePanels();
        }

        function startDrag(e, w) {
            if (!editMode.value) return;
            draggingWidget.value = w;
            const canvas = e.currentTarget.closest('.widgets-canvas');
            const r = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
            dragOffset.value = { x: e.clientX - r.left - (w.x || 0), y: e.clientY - r.top - (w.y || 0) };
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', stopDrag);
        }

        function onDrag(e) {
            const w = draggingWidget.value;
            if (!w) return;
            const canvas = document.querySelector('.widgets-canvas');
            if (!canvas) return;
            const r = canvas.getBoundingClientRect();
            w.x = Math.max(0, e.clientX - r.left - dragOffset.value.x);
            w.y = Math.max(0, e.clientY - r.top - dragOffset.value.y);
        }

        function stopDrag() {
            draggingWidget.value = null;
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', stopDrag);
            savePanels();
        }

        function startResize(e, w) {
            resizingWidget.value = w;
            resizeStart.value = { x: e.clientX, y: e.clientY, w: w.width || 280, h: w.height || 200 };
            document.addEventListener('mousemove', onResize);
            document.addEventListener('mouseup', stopResize);
        }

        function onResize(e) {
            const w = resizingWidget.value;
            if (!w) return;
            const dx = e.clientX - resizeStart.value.x;
            const dy = e.clientY - resizeStart.value.y;
            w.width = Math.max(100, resizeStart.value.w + dx);
            w.height = Math.max(60, resizeStart.value.h + dy);
        }

        function stopResize() {
            if (resizingWidget.value) savePanels();
            resizingWidget.value = null;
            document.removeEventListener('mousemove', onResize);
            document.removeEventListener('mouseup', stopResize);
        }

        watch([() => editWidgetForm.value?.x, () => editWidgetForm.value?.y, () => editWidgetForm.value?.width, () => editWidgetForm.value?.height], ([x, y, width, height]) => {
            if (!editWidgetForm.value || !currentPanel.value?.widgets) return;
            const idx = currentPanel.value.widgets.findIndex(w => w.id === editWidgetForm.value.id);
            if (idx >= 0) Object.assign(currentPanel.value.widgets[idx], { x, y, width, height });
        });

        // Load properties when object changes in edit form
        watch(() => editWidgetForm.value?.object, (obj) => {
            if (obj) loadWidgetProperties();
            else widgetProperties.value = [];
        });
        watch(() => editWidgetForm.value?.object_info, async (obj) => {
            if (!obj) { infoProperties.value = []; return; }
            const res = await dpAPI('properties?object_id=' + encodeURIComponent(obj));
            infoProperties.value = res.items || [];
        });
        watch(() => editWidgetForm.value?.method ? getMethodObj(editWidgetForm.value.method) : '', (obj) => {
            if (obj) loadObjectMethods(obj);
        });
        watch(() => editWidgetForm.value?.bg_mode, async (mode) => {
            if (!editWidgetForm.value) return;
            if (mode === 'property') await loadBgProperties();
        });

        async function savePanels() {
            await dpAPI('panels', { method: 'POST', body: JSON.stringify({ panels: panels.value }) });
            const s = await dpAPI('settings', { method: 'POST', body: JSON.stringify(settings.value) });
            if (s && !s.error) Object.assign(settings.value, s);
            applySettings();
        }

        async function loadIconProperties(oid) {
            if (!oid) oid = panelForm.value.iconObject;
            if (!oid) { iconProperties.value = []; return; }
            const res = await dpAPI('properties?object_id=' + oid);
            iconProperties.value = res.items || [];
        }

        async function openPanelForm(p) {
            if (p) {
                panelForm.value = {
                    title: p.title || '',
                    iconType: p.iconType || 'icon',
                    icon: p.icon || 'fas fa-folder',
                    iconObject: p.iconObject || '',
                    iconProperty: p.iconProperty || '',
                    image: p.image || '',
                    hideNav: p.hideNav || false,
                    hideHome: p.hideHome || false,
                    panelType: p.panelType || 'group',
                    parentGroup: p.parentGroup || 'root',
                    dropdownNav: p.dropdownNav || false,
                    openOnClick: p.openOnClick || false,
                    infoObject: p.infoObject || '',
                    infoProperty: p.infoProperty || '',
                    infoPrefix: p.infoPrefix || '',
                    infoPostfix: p.infoPostfix || '',
                    background: p.background || false,
                    circle: p.circle || false,
                    iconColor: p.iconColor || 'default',
                    showImageNav: p.showImageNav || false,
                    individualSettings: p.individualSettings || false,
                    showImageBg: p.showImageBg || false,
                    bgSize: p.bgSize || 'cover',
                    verticalCompact: p.verticalCompact || false
                };
            } else {
                panelForm.value = { title: '', iconType: 'icon', icon: 'fas fa-folder', iconObject: '', iconProperty: '', image: '', hideNav: false, hideHome: false, panelType: 'group', parentGroup: 'root', dropdownNav: false, openOnClick: false, infoObject: '', infoProperty: '', infoPrefix: '', infoPostfix: '', background: false, circle: false, iconColor: 'default', showImageNav: false, individualSettings: false, showImageBg: false, bgSize: 'cover', verticalCompact: false };
            }
            iconProperties.value = [];
            infoProperties.value = [];
            if (panelForm.value.iconType === 'property' && panelForm.value.iconObject) {
                await loadIconProperties();
            }
            if (panelForm.value.infoObject) {
                await loadInfoProperties();
            }
            newPanelTitle.value = '';
            editPanelData.value = p || null;
            panelTab.value = 'main';
            panelError.value = '';
            showAddPanel.value = true;
            await loadObjects();
            nextTick(updatePanelTabSlider);
        }

        async function loadObjects() {
            try {
                const res = await dpAPI('objects');
                objects.value = res.items || [];
            } catch(e) {
                console.error('loadObjects error', e);
            }
        }

        async function loadIconProperties() {
            const oid = editWidgetForm.value ? (editWidgetForm.value.icon_object || editWidgetForm.value.iconObject) : panelForm.value.iconObject;
            if (!oid) { iconProperties.value = []; return; }
            const res = await dpAPI('properties?object_id=' + encodeURIComponent(oid));
            iconProperties.value = res.items || [];
        }

        async function loadInfoProperties() {
            const oid = editWidgetForm.value ? editWidgetForm.value.object_info : panelForm.value.infoObject;
            if (!oid) { infoProperties.value = []; return; }
            const res = await dpAPI('properties?object_id=' + encodeURIComponent(oid));
            infoProperties.value = res.items || [];
        }

        async function loadWidgetProperties() {
            const oid = editWidgetForm.value?.object;
            if (!oid) { widgetProperties.value = []; return; }
            const res = await dpAPI('properties?object_id=' + encodeURIComponent(oid));
            widgetProperties.value = res.items || [];
        }

        async function loadBgProperties() {
            const oid = editWidgetForm.value?.bg_object;
            if (!oid) { bgProperties.value = []; return; }
            const res = await dpAPI('properties?object_id=' + encodeURIComponent(oid));
            bgProperties.value = res.items || [];
        }

        function fetchWidgetBgColors() {
            if (!currentPanel.value?.widgets) return;
            for (const w of currentPanel.value.widgets) {
                if (w.bg_mode === 'property' && w.bg_object && w.bg_property) {
                    dpAPI('getProperty?object=' + encodeURIComponent(w.bg_object) + '&property=' + encodeURIComponent(w.bg_property))
                        .then(d => { if (!d.error && d.value !== undefined && d.value !== null) bgColorMap[w.id] = d.value; })
                        .catch(() => {});
                }
            }
        }

        async function loadObjectMethods(obj) {
            if (!obj) { methodCache[obj] = []; return []; }
            if (methodCache[obj]) return methodCache[obj];
            const res = await dpAPI('methods?object_id=' + encodeURIComponent(obj));
            const items = res.items || [];
            methodCache[obj] = items;
            return items;
        }

        function toggleField(field) {
            console.log('toggleField', field, panelForm.value[field], '->', !panelForm.value[field]);
            panelForm.value[field] = !panelForm.value[field];
        }

        async function createPanel() {
            const f = panelForm.value;
            panelError.value = '';
            if (!f.title) return;
            if (editPanelData.value && editPanelData.value.widgets?.length && f.panelType === 'group' && editPanelData.value.panelType !== 'group') {
                panelError.value = 'Нельзя изменить панель с виджетами в группу. Удалите или переместите все виджеты.';
                return;
            }
            if (f.panelType === 'panel' && f.parentGroup !== 'root' && !panels.value.find(p => p.name === f.parentGroup && p.panelType === 'group')) {
                f.parentGroup = 'root';
            }
            if (f.panelType === 'group') f.parentGroup = 'root';
            if (f.iconType === 'property' && f.iconObject && f.iconProperty) {
                try {
                    const r = await dpAPI('getProperty?object=' + encodeURIComponent(f.iconObject) + '&property=' + encodeURIComponent(f.iconProperty));
                    if (r && r.value) f.icon = r.value;
                } catch(e) { console.warn('icon property fetch failed', e); }
            }
            if (f.iconType === 'url_image') f.icon = '';
            const data = {
                title: f.title, iconType: f.iconType, icon: f.icon, iconObject: f.iconObject, iconProperty: f.iconProperty,
                image: f.image, hideNav: f.hideNav, hideHome: f.hideHome,
                panelType: f.panelType, parentGroup: f.parentGroup, dropdownNav: f.dropdownNav, openOnClick: f.openOnClick,
                infoObject: f.infoObject, infoProperty: f.infoProperty,
                infoPrefix: f.infoPrefix, infoPostfix: f.infoPostfix,
                background: f.background, circle: f.circle, iconColor: f.iconColor,
                showImageNav: f.showImageNav, individualSettings: f.individualSettings,
                showImageBg: f.showImageBg, bgSize: f.bgSize, verticalCompact: f.verticalCompact
            };
            if (editPanelData.value) {
                Object.assign(editPanelData.value, data);
            } else {
                const p = { ...data, name: 'p_' + Date.now(), widgets: [] };
                panels.value.push(p);
                currentPanel.value = p;
            }
            editPanelData.value = null;
            showAddPanel.value = false;
            savePanels();
        }

        function editPanel(p) {
            openPanelForm(p);
            selectPanel(p);
            editMode.value = true;
        }

        function deletePanel() {
            if (!editPanelData.value) return;
            const idx = panels.value.indexOf(editPanelData.value);
            if (idx >= 0) {
                panels.value.splice(idx, 1);
                if (currentPanel.value === editPanelData.value) currentPanel.value = panels.value.find(p => p.panelType !== 'group') || panels.value[0] || null;
            }
            editPanelData.value = null;
            showAddPanel.value = false;
            savePanels();
        }

        function deleteCurrentPanel(p) {
            p = p || currentPanel.value;
            if (!p) return;
            if (!confirm('Удалить панель «' + p.title + '»?')) return;
            const idx = panels.value.indexOf(p);
            if (idx >= 0) {
                panels.value.splice(idx, 1);
                if (currentPanel.value === p) {
                    currentPanel.value = panels.value.find(pp => pp.panelType !== 'group') || panels.value[0] || null;
                }
            }
            savePanels();
        }

        function movePanel(dir) {
            if (!editPanelData.value) return;
            const idx = panels.value.indexOf(editPanelData.value);
            if (idx < 0) return;
            const newIdx = idx + dir;
            if (newIdx < 0 || newIdx >= panels.value.length) return;
            panels.value.splice(idx, 1);
            panels.value.splice(newIdx, 0, editPanelData.value);
            savePanels();
        }

        const iconCategories = [
            { name: 'all', title: 'Все' },
            { name: 'home', title: 'Дом', icons: ['fas fa-house','fas fa-building','fas fa-door-open','fas fa-bed','fas fa-couch','fas fa-chair','fas fa-toilet','fas fa-shower','fas fa-bath','fas fa-sink','fas fa-faucet','fas fa-trash','fas fa-trash-can','fas fa-recycle','fas fa-lightbulb','fas fa-fan','fas fa-plug','fas fa-bolt','fas fa-snowflake','fas fa-temperature-high','fas fa-temperature-low','fas fa-droplet','fas fa-fire','fas fa-lock','fas fa-unlock','fas fa-key','fas fa-bell','fas fa-clock'] },
            { name: 'devices', title: 'Устройства', icons: ['fas fa-tv','fas fa-laptop','fas fa-desktop','fas fa-tablet','fas fa-mobile','fas fa-mobile-button','fas fa-print','fas fa-camera','fas fa-video','fas fa-microphone','fas fa-headphones','fas fa-gamepad','fas fa-robot','fas fa-microchip','fas fa-server','fas fa-database','fas fa-hard-drive','fas fa-sd-card','fas fa-sim-card','fas fa-wifi','fas fa-satellite','fas fa-satellite-dish','fas fa-signal','fas fa-rss','fas fa-radio','fas fa-stopwatch'] },
            { name: 'climate', title: 'Климат', icons: ['fas fa-sun','fas fa-moon','fas fa-cloud','fas fa-cloud-sun','fas fa-cloud-moon','fas fa-cloud-rain','fas fa-cloud-showers-heavy','fas fa-cloud-sun-rain','fas fa-cloud-bolt','fas fa-smog','fas fa-wind','fas fa-fan','fas fa-snowflake','fas fa-fire','fas fa-water','fas fa-droplet','fas fa-leaf','fas fa-tree','fas fa-seedling'] },
            { name: 'lighting', title: 'Освещение', icons: ['fas fa-lightbulb','fas fa-sun','fas fa-moon','fas fa-star','fas fa-fire'] },
            { name: 'energy', title: 'Энергия', icons: ['fas fa-bolt','fas fa-plug','fas fa-battery-full','fas fa-battery-three-quarters','fas fa-battery-half','fas fa-battery-quarter','fas fa-battery-empty','fas fa-charging-station','fas fa-gas-pump','fas fa-car-battery','fas fa-solar-panel','fas fa-power-off','fas fa-gauge','fas fa-gauge-high','fas fa-oil-well'] },
            { name: 'media', title: 'Медиа', icons: ['fas fa-music','fas fa-headphones','fas fa-headset','fas fa-microphone','fas fa-microphone-lines','fas fa-radio','fas fa-tv','fas fa-video','fas fa-film','fas fa-camera','fas fa-camera-retro','fas fa-image','fas fa-images','fas fa-play','fas fa-pause','fas fa-stop','fas fa-forward','fas fa-backward','fas fa-volume-high','fas fa-volume-low','fas fa-volume-off','fas fa-volume-xmark','fas fa-eject','fas fa-shuffle','fas fa-repeat','fas fa-rotate','fas fa-circle-play','fas fa-circle-pause','fas fa-circle-stop'] },
            { name: 'automation', title: 'Автоматизация', icons: ['fas fa-gear','fas fa-sliders','fas fa-code-branch','fas fa-arrow-trend-up','fas fa-arrow-trend-down','fas fa-chart-line','fas fa-chart-bar','fas fa-chart-pie','fas fa-chart-simple','fas fa-chart-gantt','fas fa-route','fas fa-map','fas fa-map-pin','fas fa-location-dot','fas fa-compass','fas fa-crosshairs','fas fa-bullseye','fas fa-clock','fas fa-calendar','fas fa-calendar-days','fas fa-hourglass','fas fa-stopwatch'] },
            { name: 'security', title: 'Безопасность', icons: ['fas fa-shield','fas fa-shield-halved','fas fa-lock','fas fa-lock-open','fas fa-unlock','fas fa-unlock-keyhole','fas fa-key','fas fa-fingerprint','fas fa-id-card','fas fa-id-badge','fas fa-user-lock','fas fa-user-shield','fas fa-eye','fas fa-eye-slash','fas fa-video','fas fa-camera','fas fa-door-closed','fas fa-bell'] },
            { name: 'arrows', title: 'Стрелки', icons: ['fas fa-arrow-up','fas fa-arrow-down','fas fa-arrow-left','fas fa-arrow-right','fas fa-chevron-up','fas fa-chevron-down','fas fa-chevron-left','fas fa-chevron-right','fas fa-angle-up','fas fa-angle-down','fas fa-angle-left','fas fa-angle-right','fas fa-caret-up','fas fa-caret-down','fas fa-caret-left','fas fa-caret-right','fas fa-arrows-rotate','fas fa-arrow-rotate-left','fas fa-arrow-rotate-right','fas fa-up-down','fas fa-left-right'] },
            { name: 'transport', title: 'Транспорт', icons: ['fas fa-car','fas fa-car-side','fas fa-car-rear','fas fa-truck','fas fa-truck-moving','fas fa-bus','fas fa-bus-simple','fas fa-train','fas fa-train-subway','fas fa-train-tram','fas fa-plane','fas fa-plane-up','fas fa-helicopter','fas fa-ship','fas fa-bicycle','fas fa-motorcycle','fas fa-tractor','fas fa-taxi','fas fa-van-shuttle','fas fa-warehouse'] },
            { name: 'food', title: 'Еда', icons: ['fas fa-mug-hot','fas fa-mug-saucer','fas fa-bottle-water','fas fa-glass-water','fas fa-wine-glass','fas fa-wine-bottle','fas fa-whiskey-glass','fas fa-utensils','fas fa-kitchen-set','fas fa-bowl-food','fas fa-bowl-rice','fas fa-apple-whole','fas fa-carrot','fas fa-bread-slice','fas fa-cheese','fas fa-cookie','fas fa-fish','fas fa-egg','fas fa-ice-cream'] },
            { name: 'weather', title: 'Погода', icons: ['fas fa-sun','fas fa-moon','fas fa-cloud','fas fa-cloud-sun','fas fa-cloud-moon','fas fa-cloud-rain','fas fa-cloud-showers-heavy','fas fa-cloud-sun-rain','fas fa-cloud-bolt','fas fa-smog','fas fa-wind','fas fa-snowflake','fas fa-temperature-high','fas fa-temperature-low','fas fa-droplet','fas fa-water','fas fa-volcano','fas fa-mountain','fas fa-mountain-sun','fas fa-umbrella'] },
            { name: 'users', title: 'Пользователи', icons: ['fas fa-user','fas fa-users','fas fa-user-plus','fas fa-user-minus','fas fa-user-pen','fas fa-user-gear','fas fa-user-lock','fas fa-user-shield','fas fa-user-check','fas fa-user-xmark','fas fa-user-group','fas fa-user-large','fas fa-user-astronaut','fas fa-user-ninja','fas fa-user-tie','fas fa-user-doctor','fas fa-user-graduate','fas fa-user-secret','fas fa-child','fas fa-people-group','fas fa-people-arrows'] },
            { name: 'status', title: 'Статус', icons: ['fas fa-check','fas fa-check-double','fas fa-xmark','fas fa-ban','fas fa-circle-exclamation','fas fa-exclamation','fas fa-question','fas fa-info','fas fa-circle','fas fa-circle-dot','fas fa-circle-half-stroke','fas fa-circle-check','fas fa-circle-xmark','fas fa-circle-plus','fas fa-circle-minus','fas fa-circle-info','fas fa-circle-question','fas fa-bell','fas fa-bell-slash','fas fa-flag','fas fa-flag-checkered','fas fa-heart','fas fa-heart-circle-check','fas fa-heart-circle-exclamation','fas fa-star','fas fa-star-half','fas fa-thumbs-up','fas fa-thumbs-down'] },
            { name: 'communication', title: 'Связь', icons: ['fas fa-phone','fas fa-phone-volume','fas fa-envelope','fas fa-envelope-open','fas fa-comment','fas fa-comments','fas fa-comment-dots','fas fa-message','fas fa-share','fas fa-share-nodes','fas fa-paper-plane','fas fa-reply','fas fa-inbox','fas fa-at','fas fa-hashtag','fas fa-bullhorn','fas fa-wifi','fas fa-signal','fas fa-fax','fas fa-print'] },
            { name: 'files', title: 'Файлы', icons: ['fas fa-file','fas fa-file-lines','fas fa-file-pdf','fas fa-file-word','fas fa-file-excel','fas fa-file-powerpoint','fas fa-file-image','fas fa-file-video','fas fa-file-audio','fas fa-file-zipper','fas fa-file-code','fas fa-folder','fas fa-folder-open','fas fa-folder-plus','fas fa-folder-minus','fas fa-copy','fas fa-paste','fas fa-clipboard','fas fa-clipboard-list','fas fa-clipboard-check','fas fa-note-sticky','fas fa-newspaper','fas fa-book','fas fa-book-open','fas fa-bookmark'] },
            { name: 'shapes', title: 'Фигуры', icons: ['fas fa-square','fas fa-circle','fas fa-diamond','fas fa-heart','fas fa-star','fas fa-star-of-life','fas fa-cross','fas fa-plus','fas fa-minus','fas fa-asterisk','fas fa-infinity'] },
            { name: 'brands', title: 'Бренды', icons: ['fab fa-amazon','fab fa-android','fab fa-angular','fab fa-apple','fab fa-aws','fab fa-bitcoin','fab fa-cc-amex','fab fa-cc-mastercard','fab fa-cc-visa','fab fa-centos','fab fa-chrome','fab fa-cloudflare','fab fa-css3','fab fa-digital-ocean','fab fa-discord','fab fa-docker','fab fa-dropbox','fab fa-ebay','fab fa-edge','fab fa-ethereum','fab fa-facebook','fab fa-facebook-messenger','fab fa-fedora','fab fa-firefox','fab fa-github','fab fa-gitlab','fab fa-google','fab fa-html5','fab fa-hubspot','fab fa-instagram','fab fa-jira','fab fa-js','fab fa-linkedin','fab fa-linux','fab fa-microsoft','fab fa-node','fab fa-npm','fab fa-opera','fab fa-paypal','fab fa-pinterest','fab fa-playstation','fab fa-python','fab fa-react','fab fa-reddit','fab fa-redhat','fab fa-rocketchat','fab fa-safari','fab fa-salesforce','fab fa-slack','fab fa-snapchat','fab fa-soundcloud','fab fa-spotify','fab fa-stack-overflow','fab fa-steam','fab fa-stripe','fab fa-telegram','fab fa-tiktok','fab fa-trello','fab fa-twitch','fab fa-twitter','fab fa-ubuntu','fab fa-vimeo','fab fa-vk','fab fa-vuejs','fab fa-whatsapp','fab fa-windows','fab fa-xbox','fab fa-youtube'] },
        ];
        iconCategories[0].icons = iconCategories.slice(1).flatMap(c => c.icons).filter((v,i,a) => a.indexOf(v) === i);

        const filteredIconCategories = computed(() => {
            const q = iconCategorySearch.value.toLowerCase();
            if (!q) return iconCategories;
            return iconCategories.filter(c => c.name === 'all' || c.title.toLowerCase().includes(q));
        });
        const filteredIcons = computed(() => {
            const cat = iconCategories.find(c => c.name === iconCategory.value);
            if (!cat) return [];
            const q = iconSearch.value.toLowerCase();
            if (!q) return cat.icons;
            return cat.icons.filter(ic => ic.toLowerCase().includes(q));
        });
        const totalPages = computed(() => Math.max(1, Math.ceil(filteredIcons.value.length / iconPageSize)));
        const paginatedIcons = computed(() => {
            const start = (iconPage.value - 1) * iconPageSize;
            return filteredIcons.value.slice(start, start + iconPageSize);
        });
        watch(iconSearch, () => iconPage.value = 1);
        watch(iconCategory, () => iconPage.value = 1);

        function openIconPicker(target) {
            iconTarget.value = target;
            showIconPicker.value = true;
        }

        function selectIcon(ic) {
            if (iconTarget.value === 'panel' && panelForm.value) {
                panelForm.value.icon = ic;
            } else if (editWidgetForm.value) {
                editWidgetForm.value[iconTarget.value] = ic;
            }
            showIconPicker.value = false;
        }

        function iconPicked(ic) {
            if (iconTarget.value === 'panel' && panelForm.value) {
                return panelForm.value.icon === ic;
            }
            return editWidgetForm.value && editWidgetForm.value[iconTarget.value] === ic;
        }

        watch(() => panelForm.value.iconType, async (val) => {
            if (val === 'property') {
                await loadObjects();
                if (panelForm.value.iconObject) await loadIconProperties();
            }
        });

        function formatTime(dt) {
            if (!dt) return '';
            const d = new Date(dt.replace(' ', 'T'));
            if (isNaN(d.getTime())) return dt.slice(11, 16);
            return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        }

        function applySettings() {
            const s = settings.value;
            const root = document.documentElement;
            const sidebar = document.querySelector('.sidebar');
            const main = document.querySelector('.main');
            const app = document.getElementById('app');

            const isDark = s.theme === 'dark';

            // theme
            root.classList.toggle('dark', isDark);

            // font
            root.style.fontFamily = s.font || '';

            // hide menu
            if (sidebar) sidebar.style.display = s.hideMenu ? 'none' : '';
            if (main) main.style.marginLeft = s.hideMenu ? '0' : '';
            const appBar = document.querySelector('.app-bar');
            if (appBar) appBar.style.left = s.hideMenu ? '0' : '';

            // menu background
            if (sidebar) sidebar.style.background = s.menuBg ? 'url(' + s.menuBg + ') center/cover' : '';
            // panel background — on body, shows through .main/.content but hidden behind opaque app-bar & sidebar
            if (s.usePanelImage && s.panelBg) {
                document.body.style.background = 'url(' + s.panelBg + ') center/cover no-repeat';
            } else {
                document.body.style.background = '';
            }
            // clear stray backgrounds
            if (app) app.style.background = '';
            if (main) main.style.background = '';
            const content = document.querySelector('.main > .content');
            if (content) content.style.background = '';

            // colors
            root.style.setProperty('--primary', s.primaryColor || '#1976d2');
            root.style.setProperty('--light-bg', s.lightThemeColor || '#ffffff');
            root.style.setProperty('--dark-bg', s.darkThemeColor || '#303030');

            // theme backgrounds: left panel (sidebar) + widgets use theme color, right panel (main) uses black/white
            root.style.setProperty('--bg', isDark ? '#000000' : '#ffffff');
            const themeBg = isDark ? (s.darkThemeColor || '#303030') : (s.lightThemeColor || '#ffffff');
            root.style.setProperty('--theme-bg', themeBg);

            // text color on themed backgrounds
            const onTheme = isDark ? '#ffffff' : '#1e293b';
            root.style.setProperty('--on-theme', onTheme);
            root.style.setProperty('--on-theme-dim', isDark ? 'rgba(255,255,255,.45)' : 'rgba(30,41,59,.45)');
            root.style.setProperty('--on-theme-mid', isDark ? 'rgba(255,255,255,.7)' : 'rgba(30,41,59,.7)');
            root.style.setProperty('--on-theme-high', isDark ? 'rgba(255,255,255,.87)' : 'rgba(30,41,59,.87)');

            // opacity
            root.style.setProperty('--card-opacity', (s.cardsOpacity / 100) + '');
            root.style.setProperty('--menu-opacity', (s.menuOpacity / 100) + '');
            root.style.setProperty('--dialog-opacity', (s.dialogOpacity / 100) + '');

            // widget sizes
            root.style.setProperty('--widget-icon-size', (23 + s.iconSize * 0.2) + 'px');
            root.style.setProperty('--widget-title-size', (1.49 + s.titleSize * 0.005) + 'rem');
            root.style.setProperty('--widget-subtitle-size', (1 + s.subtitleSize * 0.005) + 'rem');
            root.style.setProperty('--widget-size', (65 + s.widgetSize * 0.5) + 'px');

            // debug
            if (s.debug) console.log('[Dashboard Pro] settings applied', s);
        }

        function toggleTheme() {
            settings.value.theme = settings.value.theme === 'light' ? 'dark' : 'light';
            savePanels();
        }

        function saveSettings() { savePanels(); showSettingsPanel.value = false; }

        function cleanupOrphanWidgets() {
            if (!confirm('Удалить все виджеты, не привязанные к панелям?')) return;
            const allWidgetIds = new Set();
            panels.value.forEach(p => (p.widgets || []).forEach(w => allWidgetIds.add(w.id)));
            savePanels();
            alert('Очистка завершена');
        }

        function resetAll() {
            if (!confirm('Удалить все панели и виджеты? Это действие нельзя отменить.')) return;
            panels.value = [];
            currentPanel.value = null;
            savePanels();
        }

        function downloadJSON(data, filename) {
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = filename;
            a.click(); URL.revokeObjectURL(url);
        }

        async function doExport() {
            if (exportMode.value === 'all') {
                const data = JSON.stringify({ panels: panels.value, settings: settings.value }, null, 2);
                downloadJSON(data, 'dashboard_pro_export.json');
                showExportDialog.value = false;
            } else if (exportMode.value === 'panels') {
                if (!exportSelectedPanel.value) { alert('Выберите панель'); return; }
                const panel = panels.value.find(p => p.name === exportSelectedPanel.value);
                if (!panel) return;
                let exportPanels;
                if (panel.panelType === 'group') {
                    const childNames = panels.value.filter(p => p.parentGroup === panel.name).map(p => p.name);
                    const names = [panel.name, ...childNames];
                    exportPanels = panels.value.filter(p => names.includes(p.name));
                } else {
                    exportPanels = [panel];
                }
                const data = JSON.stringify({ panels: exportPanels, settings: settings.value }, null, 2);
                downloadJSON(data, 'dashboard_pro_export_' + panel.name + '.json');
                showExportDialog.value = false;
            } else if (exportMode.value === 'users') {
                if (!exportSelectedUser.value) { alert('Выберите пользователя'); return; }
                showExportDialog.value = false;
                try {
                    const res = await dpAPI('exportToUser', {
                        method: 'POST',
                        body: JSON.stringify({ targetUser: exportSelectedUser.value })
                    });
                    if (res.warn) {
                        if (confirm(res.message || 'У пользователя уже есть данные. Перезаписать?')) {
                            const res2 = await dpAPI('exportToUser', {
                                method: 'POST',
                                body: JSON.stringify({ targetUser: exportSelectedUser.value, confirmed: true })
                            });
                            if (res2.success) {
                                alert('Настройки скопированы пользователю «' + exportSelectedUser.value + '»');
                            } else {
                                alert('Ошибка: ' + (res2.error || 'неизвестная'));
                            }
                        }
                    } else if (res.success) {
                        alert('Настройки скопированы пользователю «' + exportSelectedUser.value + '»');
                    } else {
                        alert('Ошибка: ' + (res.error || 'неизвестная'));
                    }
                } catch (e) {
                    alert('Ошибка при копировании: ' + e.message);
                }
            }
        }

        async function loadExportUsers() {
            try {
                const res = await dpAPI('users');
                exportUsers.value = res.items || [];
                exportSelectedUser.value = '';
            } catch (e) {
                console.error('loadExportUsers error', e);
                exportUsers.value = [];
            }
        }

        function doImport() {
            showExportDialog.value = false;
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                try {
                    const text = await file.text();
                    const data = JSON.parse(text);
                    if (data.panels && Array.isArray(data.panels)) {
                        panels.value = data.panels;
                        if (data.settings) Object.assign(settings.value, data.settings);
                        currentPanel.value = panels.value.find(p => p.panelType !== 'group') || panels.value[0] || null;
                        savePanels();
                        alert('Импорт завершён');
                    } else {
                        alert('Неверный формат файла');
                    }
                } catch (err) {
                    alert('Ошибка импорта: ' + err.message);
                }
            };
            input.click();
        }

        async function checkNotifications() {
            try {
                const res = await dpAPI('notifications');
                if (res && typeof res.count === 'number') {
                    unreadCount.value = res.count;
                    notifications.value = res.items || [];
                }
            } catch (e) { /* silent */ }
        }

        async function loadChat() {
            chatLoading.value = true;
            try {
                const res = await dpAPI('chat');
                if (res && res.items) chatMessages.value = res.items;
            } catch (e) { /* silent */ }
            chatLoading.value = false;
        }

        async function sendChat() {
            const text = chatText.value.trim();
            if (!text) return;
            chatText.value = '';
            chatLoading.value = true;
            try {
                await dpAPI('chat', { method: 'POST', body: JSON.stringify({ message: text }) });
                await loadChat();
            } catch (e) { /* silent */ }
            chatLoading.value = false;
        }

        function toggleEditMode() {
            if (editMode.value) savePanels();
            editMode.value = !editMode.value;
        }

        function toggleChat() {
            chatOpen.value = !chatOpen.value;
            if (chatOpen.value) loadChat();
        }

        async function markNotificationsRead() {
            const ids = notifications.value.map(n => n.ID);
            if (!ids.length) return;
            await dpAPI('notifications', { method: 'POST', body: JSON.stringify({ ids }) });
            unreadCount.value = 0;
            notifications.value = [];
            showNotifications.value = false;
        }

        function handleClickOutside(e) {
            if (userMenuOpen.value && !e.target.closest('.user-menu') && !e.target.closest('.user-avatar-btn')) {
                userMenuOpen.value = false;
            }
            if (showNotifications.value && !e.target.closest('.notif-dropdown') && !e.target.closest('[data-notif]')) {
                showNotifications.value = false;
            }
            if (widgetMenuTarget.value && !e.target.closest('.widget-menu')) {
                widgetMenuTarget.value = null;
            }
        }

        let wsSocket = null;
        let wsReconnectTimer = null;

        function initWebSocket() {
            const loc = window.location;
            const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = protocol + '//' + loc.host + '/majordomo-ws';
            try {
                wsSocket = new WebSocket(wsUrl);
            } catch (e) { return; }
            wsSocket.onopen = function() {
                wsConnected.value = true;
                if (wsReconnectTimer) { clearTimeout(wsReconnectTimer); wsReconnectTimer = null; }
            };
            wsSocket.onmessage = function(msg) {
                wsBytesReceived.value += msg.data ? new Blob([msg.data]).size : 0;
                wsPulse.value = true;
                setTimeout(() => { wsPulse.value = false; }, 400);
                try {
                    const data = JSON.parse(msg.data);
                    if (data.action === 'status') {
                        wsStatus.value = data.data;
                        console.log('Status WS server', data.data);
                        return;
                    }
                    if (data.action === 'PostProperty' && data.data) {
                        if (authenticated.value) {
                            const curName = currentPanel.value?.name;
                            loadData().then(() => {
                                const updated = panels.value.find(p => p.name === curName);
                                if (updated) currentPanel.value = updated;
                            });
                            checkNotifications();
                            if (chatOpen.value) loadChat();
                        }
                    }
                } catch (e) { /* silent */ }
            };
            wsSocket.onclose = function() {
                wsConnected.value = false;
                wsReconnectTimer = setTimeout(initWebSocket, 5000);
            };
        }

        function forceRefresh() {
            if (wsSocket && wsConnected.value) {
                const payload = JSON.stringify({ action: 'status' });
                wsBytesSent.value += new Blob([payload]).size;
                wsSocket.send(payload);
            }
        }

        function toggleWs() {
            if (wsConnected.value && wsSocket) {
                wsSocket.close();
                wsConnected.value = false;
                if (wsReconnectTimer) { clearTimeout(wsReconnectTimer); wsReconnectTimer = null; }
            }
        }

        window.__closeSettings = () => { showSettingsPanel.value = false; };

        watch(settings, (s) => { applySettings(); }, { deep: true });

        onMounted(() => {
            document.addEventListener('click', handleClickOutside);
            initAuth();
            checkNotifications();
            setInterval(checkNotifications, 10000);
            initWebSocket();
        });

        return {
            authenticated, authChecking, login, password, loginError, loginLoading, doLogin, doLogout, testAPI: Auth.testAPI,
            panels, currentPanel, selectPanel, selectHomePanel, loading, editMode,
            showAddWidget, widgetSearch, filteredDefs, plusTooltip, addPlusButton, showMethodsTab,
            widgetTypeComponent, addWidget, getWidgetFields, getWidgetRows, fieldVisible, hasObjectProp, hasPropertyField,
            getMethodObj, getMethodName, setMethodField,
            editWidgetForm, widgetTab, widgetTabPos, editWidget, saveEditWidget, removeWidget,
            columnIdx, getColumns, setColumns, addColumn, removeColumn, moveColumnUp, moveColumnDown, autoDetectColumns, columnFields,
            draggingWidget, startDrag, onDrag, stopDrag,
            resizingWidget, startResize, onResize, stopResize,
            widgetMenuTarget, copyWidget, exportWidget,
            showSettings, showSettingsPanel, settingsTab, settings, saveSettings, savePanels, toggleTheme, cleanupOrphanWidgets, resetAll,
            showExportDialog, exportMode, exportSelectedPanel, exportUsers, exportSelectedUser, loadExportUsers, doExport, doImport,
            showAddPanel, editPanelData, panelForm, panelTab, panelTabPos, panelError, newPanelTitle, createPanel, editPanel, openPanelForm, deletePanel, deleteCurrentPanel, movePanel, showAbout, toggleField,
            showIconPicker, iconTarget, iconSearch, iconCategory, iconCategorySearch, iconPage, iconCategories, filteredIconCategories, filteredIcons, totalPages, paginatedIcons, openIconPicker, selectIcon, iconPicked,
            objects, iconProperties, infoProperties, widgetProperties, bgProperties, methodCache, loadObjects, loadIconProperties, loadInfoProperties, loadWidgetProperties, loadBgProperties, widgetBgStyle, fetchWidgetBgColors,
            isAdmin, toggleEditMode, toggleWs, wsConnected, wsTooltip, wsStatus, wsPulse, wsBytesSent, wsBytesReceived, user, userMenuOpen, sidebarMini, toggleSidebar, expandedGroups, childPanels, toggleGroup, forceRefresh,
            showNotifications, notifications, unreadCount, checkNotifications, markNotificationsRead,
            chatOpen, chatMessages, chatText, chatLoading, loadChat, sendChat, toggleChat, formatTime
        };
    }
});

app.component('widget-relay', RelayWidget);
app.component('widget-value', ValueWidget);
app.component('widget-button', ButtonWidget);
app.component('widget-slider', typeof SliderWidget !== 'undefined' ? SliderWidget : { template: '<div>Слайдер</div>' });
app.component('widget-dimmer', typeof DimmerWidget !== 'undefined' ? DimmerWidget : { template: '<div>Диммер</div>' });
app.component('widget-text', typeof TextWidget !== 'undefined' ? TextWidget : { template: '<div>Текст</div>' });
app.component('widget-select', typeof SelectWidget !== 'undefined' ? SelectWidget : { template: '<div>Выбор</div>' });
app.component('widget-clock', typeof ClockWidget !== 'undefined' ? ClockWidget : { template: '<div>Часы</div>' });
app.component('widget-iframe', typeof IFrameWidget !== 'undefined' ? IFrameWidget : { template: '<div>iFrame</div>' });
app.component('widget-image', typeof ImageWidget !== 'undefined' ? ImageWidget : { template: '<div>Изображение</div>' });
app.component('widget-panellink', typeof PanelLinkWidget !== 'undefined' ? PanelLinkWidget : { template: '<div>Ссылка</div>' });
app.component('widget-rgb', typeof RGBWidget !== 'undefined' ? RGBWidget : { template: '<div>RGB</div>' });
app.component('widget-progressbar', typeof ProgressBarWidget !== 'undefined' ? ProgressBarWidget : { template: '<div>Прогресс</div>' });
app.component('widget-gauge', typeof GaugeWidget !== 'undefined' ? GaugeWidget : { template: '<div>Индикатор</div>' });
app.component('widget-test', typeof TestWidget !== 'undefined' ? TestWidget : { template: '<div>Test</div>' });
app.component('widget-unknown', typeof UnknownWidget !== 'undefined' ? UnknownWidget : { template: '<div>Unknown</div>' });
app.component('widget-sendtext', typeof SendTextWidget !== 'undefined' ? SendTextWidget : { template: '<div>Отправка</div>' });
app.component('widget-analogclock', typeof AnalogClockWidget !== 'undefined' ? AnalogClockWidget : { template: '<div>Часы</div>' });
app.component('widget-status', typeof StatusWidget !== 'undefined' ? StatusWidget : { template: '<div>Статус</div>' });
app.component('widget-datepicker', typeof DatePickerWidget !== 'undefined' ? DatePickerWidget : { template: '<div>Дата</div>' });
app.component('widget-timepicker', typeof TimePickerWidget !== 'undefined' ? TimePickerWidget : { template: '<div>Время</div>' });
app.component('widget-roundslider', typeof RoundSliderWidget !== 'undefined' ? RoundSliderWidget : { template: '<div>Круглый слайдер</div>' });
app.component('widget-graph', typeof GraphWidget !== 'undefined' ? GraphWidget : { template: '<div>График</div>' });
app.component('widget-bargraph', typeof BarGraphWidget !== 'undefined' ? BarGraphWidget : { template: '<div>Бар-график</div>' });
app.component('widget-weather', typeof WeatherWidget !== 'undefined' ? WeatherWidget : { template: '<div>Погода</div>' });
app.component('widget-table', typeof TableWidget !== 'undefined' ? TableWidget : { template: '<div>Таблица</div>' });
app.component('widget-timeline', typeof TimelineWidget !== 'undefined' ? TimelineWidget : { template: '<div>Таймлайн</div>' });
app.component('widget-group', typeof GroupWidget !== 'undefined' ? GroupWidget : { template: '<div>Группа</div>' });
app.component('widget-map', typeof MapWidget !== 'undefined' ? MapWidget : { template: '<div>Карта</div>' });
app.component('widget-calendar', typeof CalendarWidget !== 'undefined' ? CalendarWidget : { template: '<div>Календарь</div>' });
app.component('widget-colorslider', typeof ColorSliderWidget !== 'undefined' ? ColorSliderWidget : { template: '<div>Цвет</div>' });
app.component('widget-empty', typeof EmptyWidget !== 'undefined' ? EmptyWidget : { template: '<div>Пусто</div>' });
app.component('widget-keypad', typeof KeypadWidget !== 'undefined' ? KeypadWidget : { template: '<div>Клавиатура</div>' });
app.component('widget-roominfo', typeof RoomInfoWidget !== 'undefined' ? RoomInfoWidget : { template: '<div>Помещение</div>' });
app.component('widget-slideshow', typeof SlideShowWidget !== 'undefined' ? SlideShowWidget : { template: '<div>Слайд-шоу</div>' });
app.component('widget-sliderbuttons', typeof SliderButtonsWidget !== 'undefined' ? SliderButtonsWidget : { template: '<div>Слайдер</div>' });
app.component('widget-thermostat', typeof ThermostatWidget !== 'undefined' ? ThermostatWidget : { template: '<div>Термостат</div>' });
app.component('widget-trend', typeof TrendWidget !== 'undefined' ? TrendWidget : { template: '<div>Тренд</div>' });

const vm = app.mount('#app');
window.__dp_vm = vm;
