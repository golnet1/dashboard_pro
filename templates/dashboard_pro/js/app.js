const { createApp, ref, reactive, computed, watch, onMounted, nextTick } = Vue;

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

function dpFormatAgo(ts) {
    const now = Math.floor(Date.now() / 1000);
    let diff = now - ts;
    if (diff < 0) diff = 0;
    const s = diff % 60;
    const m = Math.floor(diff / 60) % 60;
    const h = Math.floor(diff / 3600) % 24;
    const d = Math.floor(diff / 86400);
    if (d > 0) return d + ' ' + __t('unit_day') + ' ' + h + ' ' + __t('unit_hour') + ' ' + __t('ago_suffix');
    if (h > 0) return h + ' ' + __t('unit_hour') + ' ' + m + ' ' + __t('unit_min') + ' ' + __t('ago_suffix');
    if (m > 0) return m + ' ' + __t('unit_min') + ' ' + s + ' ' + __t('unit_sec') + ' ' + __t('ago_suffix');
    return s + ' ' + __t('unit_sec') + ' ' + __t('ago_suffix');
}

function dpInfoDisplay(val) {
    if (val === '' || val === null || val === undefined) return '';
    const n = Number(val);
    if (!Number.isFinite(n) || n < 1000000000) return val;
    return dpFormatAgo(n);
}

window.__dpWsCache = {};
window.__dpWsLive = false;

const WS_OBJECT_FIELDS = [
    ['object_value', 'property'],
    ['object', 'property'],
    ['object_info', 'property_info'],
    ['object_alive', 'property_alive'],
    ['object_status', 'property_status'],
    ['bg_object', 'bg_property'],
    ['icon_object', 'icon_property']
];

function wsWidgetPropKeys(w) {
    const keys = new Set();
    if (!w) return keys;
    for (const [o, p] of WS_OBJECT_FIELDS) {
        const obj = w[o];
        const prop = w[p];
        if (!obj) continue;
        keys.add(String(obj).toLowerCase());
        if (prop) keys.add((obj + '.' + prop).toLowerCase());
    }
    if (Array.isArray(w.sensors)) {
        w.sensors.forEach(s => {
            if (s && s.object) {
                keys.add(String(s.object).toLowerCase());
                if (s.property) keys.add((s.object + '.' + s.property).toLowerCase());
            }
        });
    }
    return keys;
}

const widgetDefs = ref([]);
const widgetList = ref([]);

const translations = ref({});
window.__t = function(text) { return translations.value[text] || text; };
const t = window.__t;

async function loadTranslations() {
    try {
        const d = await dpAPI('lang');
        if (d && typeof d === 'object') translations.value = d;
    } catch(e) {}
}

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
        const editWidgetParent = ref(null);
        const editParentTab = ref('widgets');
        const groupAddTarget = ref(null);
        const widgetTab = ref('main');
        const draggingWidget = ref(null);
        const dragOffset = ref({ x: 0, y: 0 });
        const resizingWidget = ref(null);
        const resizeStart = ref({ x: 0, y: 0, w: 0, h: 0 });
        const widgetMenuTarget = ref(null);
        const widgetPanelSubmenu = ref(null);
        const widgetGroupSubmenu = ref(null);
        const widgetConfirm = ref(null);
        const showChangeObject = ref(false);
        const changeObjectGroups = ref([]);
        const changeObjectWidgetIdx = ref(-1);
        const chatOpen = ref(false);
        const chatMessages = ref([]);
        const chatText = ref('');
        const chatLoading = ref(false);

        const showNotifications = ref(false);
        const notifications = ref([]);
        const unreadCount = ref(0);
        const showSettingsPanel = ref(false);
        const showWidgetEditorPanel = ref(false);
        const showAddPanel = ref(false);
        const showAbout = ref(false);
        const showExportDialog = ref(false);
        const exportMode = ref('all');
        const exportSelectedPanel = ref('');
        const exportUsers = ref([]);
        const exportSelectedUser = ref('');
        const editPanelData = ref(null);
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
        const extraProperties = ref({});
        const methodCache = reactive({});
        const user = ref({ username: '', name: '', avatar: '', is_admin: false });
        const userMenuOpen = ref(false);
        const isAdmin = ref(false);
        const wsConnected = ref(false);
        const wsBytesReceived = ref(0);
        const wsBytesSent = ref(0);
        const wsPulse = ref(false);
        const wsStatus = ref(null);
        const wsRev = reactive({});
        const bgColorMap = reactive({});
        const settings = ref({ appTitle: '', theme: 'light', defaultPanel: '', debug: false, font: 'Roboto', hideMenu: false, hideChat: false, menuBg: '', panelBg: '', usePanelImage: true, useHeaderImage: false, cardsOpacity: 44, menuOpacity: 16, dialogOpacity: 12, primaryColor: '#1976d2', lightThemeColor: '#ffffff', darkThemeColor: '#303030', iconSize: 0, titleSize: 0, subtitleSize: 0, widgetSize: 0 });

        const filteredDefs = computed(() =>
            widgetSearch.value
                ? widgetDefs.value.filter(d => (d.title || '').toLowerCase().includes(widgetSearch.value.toLowerCase()))
                : widgetDefs.value
        );

        
        function getWidgetFields(type, tab) {
            if (typeof W === 'undefined' || !W.fields) return [];
            const comp = getWidgetComponent(type);
            const component = (comp && comp.fields && comp.fields[tab]) || [];
            const all = tab === 'position' ? (W.fields._common.position || []) : component;
            const seen = new Set();
            return all.filter(f => {
                const key = f.key || f.type;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        }
        function getWidgetComponent(type) {
            try {
                const existing = app.component('widget-' + type);
                if (existing) return existing;
                return registerWidgetComponent(type);
            } catch(e) { return null; }
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

        function getWidgetTabs(type) {
            const comp = getWidgetComponent(type);
            let tabs = [];
            if (comp && comp.tabs) {
                tabs = comp.tabs.map(t => ({ ...t }));
            } else if (comp && comp.fields) {
                const labelMap = { params: 'tab_params', advanced: 'tab_advanced', main: 'tab_main', columns: 'tab_columns' };
                for (const key of Object.keys(comp.fields)) {
                    if (key === 'position') continue;
                    tabs.push({ key, label: labelMap[key] || key.charAt(0).toUpperCase() + key.slice(1) });
                }
            }
            tabs = tabs.filter(tab => {
                if (tab.key === 'columns' || tab.key === 'widgets') return true;
                const fields = getWidgetFields(type, tab.fields || tab.key);
                return fields.length > 0;
            });
            if (!tabs.find(t => t.key === 'position')) {
                tabs.push({ key: 'position', label: 'tab_position' });
            }
            return tabs;
        }

        
        function fieldVisible(field) {
            if (!field.showIf || !editWidgetForm.value) return true;
            const [depKey, depVal] = Object.entries(field.showIf)[0];
            return editWidgetForm.value[depKey] === depVal;
        }

        function getFieldOptions(field) {
            if (field.type === 'property') {
                if (field.key === 'icon_property') return iconProperties.value;
                if (field.key === 'bg_property') return bgProperties.value;
                if (field.key === 'property_info') return infoProperties.value;
                if (field.key?.startsWith('property_')) {
                    const suffix = field.key.replace('property_', '');
                    const objKey = 'object_' + suffix;
                    return extraProperties.value[objKey] || [];
                }
            }
            return widgetProperties.value;
        }

        
        function itemLabel(item) {
            if (!item) return '';
            const desc = item.DESCRIPTION ? item.DESCRIPTION.replace(/\n/g, ' ').trim() : '';
            return desc ? item.TITLE + ' - ' + desc : item.TITLE;
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
        const columnList = computed(() => {
            try { return JSON.parse(editWidgetForm.value?.columns || '[]'); }
            catch { return []; }
        });

        function setColumns(arr) {
            editWidgetForm.value.columns = JSON.stringify(arr);
        }

        function addColumn() {
            const cols = columnList.value;
            cols.push({ info: '', data_name: '', align: 'start', width: '', sortable: true, separator: false, data_type: '', color_column: '' });
            setColumns(cols);
            columnIdx.value = cols.length - 1;
        }
        function removeColumn(idx) {
            const cols = columnList.value;
            cols.splice(idx, 1);
            setColumns(cols);
            if (columnIdx.value >= cols.length) columnIdx.value = Math.max(0, cols.length - 1);
        }
        function moveColumnUp(idx) {
            if (idx <= 0) return;
            const cols = columnList.value;
            [cols[idx - 1], cols[idx]] = [cols[idx], cols[idx - 1]];
            setColumns(cols);
            columnIdx.value = idx - 1;
        }
        function moveColumnDown(idx) {
            const cols = columnList.value;
            if (idx >= cols.length - 1) return;
            [cols[idx], cols[idx + 1]] = [cols[idx + 1], cols[idx]];
            setColumns(cols);
            columnIdx.value = idx + 1;
        }
        function autoDetectColumns() {
            // Placeholder: will be implemented when table data fetching is ready
        }

        const columnFields = [
            { key: 'info', label: 'field_info' },
            { key: 'data_name', label: 'field_column_name' },
            { key: 'align', label: 'field_align', type: 'select', options: [
                { value: 'start', title: 'Left' },
                { value: 'center', title: 'Center' },
                { value: 'end', title: 'Right' },
            ]},
            { key: 'width', label: 'field_width' },
            { key: 'sortable', label: 'field_sortable', type: 'switch' },
            { key: 'separator', label: 'field_separator', type: 'switch' },
            { key: 'data_type', label: 'field_data_type', type: 'select', options: [
                { value: '', title: '—' },
                { value: 'string', title: 'String' },
                { value: 'number', title: 'Number' },
                { value: 'date', title: 'Date' },
            ]},
            { key: 'color_column', label: 'field_color_column' },
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
                return t('add_panel');
            }
            return t('add_widget');
        });

        function addPlusButton() {
            if (!currentPanel.value || currentPanel.value.panelType === 'group') {
                openPanelForm(null);
            } else {
                showAddWidget.value = true;
            }
        }

        const wsTooltip = computed(() => {
            const status = wsConnected.value ? t('ws_connected') : t('ws_disconnected');
            const sent = wsBytesSent.value > 0 ? formatBytes(wsBytesSent.value) : '0 B';
            const recv = wsBytesReceived.value > 0 ? formatBytes(wsBytesReceived.value) : '0 B';
            let extra = '';
            if (wsStatus.value) {
                extra = `\n${t('clients')}: ${wsStatus.value.COUNT_CLIENTS}\n${t('started')}: ${wsStatus.value.STARTED}`;
            }
            return `${status}\n${t('sent')}: ${sent}\n${t('received')}: ${recv}\n${t('click_for_refresh')}${extra}`;
        });

        function widgetTypeComponent(type) {
            registerWidgetComponent(type);
            return 'widget-' + type;
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

function loadScript(src, version) {
            return new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = src + (version && version > 0 ? '?v=' + version : '');
                s.onload = () => resolve();
                s.onerror = () => resolve();
                document.head.appendChild(s);
            });
        }

        async function loadWidgetDefs() {
            const widgets = await dpAPI('widgets');
            if (!widgets || !widgets.items) return;
            widgetDefs.value = widgets.items.map(w => ({
                type: w.TYPE, icon: w.ICON, title: w.TITLE, desc: w.DESCRIPTION, file: w.FILE, priority: w.PRIORITY
            }));
            widgetList.value = [...widgetDefs.value].sort((a, b) => (a.priority || 0) - (b.priority || 0));
            for (const w of widgets.items) {
                if (!w.FILE) continue;
                await loadScript(w.FILE, 29);
            }
            widgetDefs.value.forEach(d => registerWidgetComponent(d.type));
        }

        async function loadData() {
            loading.value = true;
            try {
                await loadTranslations();
                await loadWidgetDefs();
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
            const def = widgetDefs.value.find(d => d.type === type);
            const comp = getWidgetComponent(type);
            const typeDefaults = (comp && comp.defaults) || W.fields.defaults[type] || {};
            const widgetTabs = getWidgetTabs(type);
            const allFields = widgetTabs.flatMap(tab => getWidgetFields(type, tab.fields || tab.key));
            const fieldDefaults = {};
            allFields.forEach(f => {
                if (f.key && f.default !== undefined) fieldDefaults[f.key] = f.default;
            });
            const w = {
                id: 'w_' + Date.now() + '_' + Math.floor(Math.random() * 1000), type,
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
            if (groupAddTarget.value) {
                const parentCopy = groupAddTarget.value;
                if (!Array.isArray(parentCopy.children)) parentCopy.children = [];
                w.span = 1;
                parentCopy.children.push(w);
                groupAddTarget.value = null;
                showAddWidget.value = false;
                return;
            }
            if (!currentPanel.value.widgets) currentPanel.value.widgets = [];
            currentPanel.value.widgets.push(w);
            showAddWidget.value = false;
            editWidgetForm.value = w;
        }

        async function editWidget(w, parent) {
            if (parent) editParentTab.value = widgetTab.value;
            const tabs = getWidgetTabs(w.type);
            widgetTab.value = tabs.length ? tabs[0].key : 'main';
            columnIdx.value = 0;
            editWidgetParent.value = parent || null;
            const def = widgetDefs.value.find(d => d.type === w.type);
            editWidgetForm.value = {
                ...w,
                children: Array.isArray(w.children) ? w.children.map(c => ({ ...c })) : [],
                title: w.title || def?.title || w.type,
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
            // Load methods for all method-type fields
            const methodParents = ['method', 'object_switch', 'object_on', 'object_off', 'object_color'];
            methodParents.forEach(key => {
                const obj = getMethodObj(w[key]);
                if (obj) loadObjectMethods(obj);
            });
            nextTick(updateWidgetTabSlider);
        }

        function removeWidget(idx) {
            currentPanel.value.widgets.splice(idx, 1);
            savePanels();
        }

        const groupChildrenList = computed(() => {
            const f = editWidgetForm.value;
            return (f && Array.isArray(f.children)) ? f.children : [];
        });

        function startGroupChildAdd() {
            const f = editWidgetForm.value;
            if (!f) return;
            groupAddTarget.value = f;
            showAddWidget.value = true;
        }

        function removeGroupChild(child) {
            const parent = editWidgetParent.value || editWidgetForm.value;
            if (!parent || !Array.isArray(parent.children)) return;
            const idx = parent.children.findIndex(c => c.id === child.id);
            if (idx >= 0) parent.children.splice(idx, 1);
        }

        function moveGroupChildOut(child) {
            const parent = editWidgetParent.value || editWidgetForm.value;
            if (!parent || !Array.isArray(parent.children)) return;
            const idx = parent.children.findIndex(c => c.id === child.id);
            if (idx < 0) return;
            widgetConfirm.value = { outOfGroup: true, childId: child.id, panelTitle: parent.title || t('widget_group') };
        }

        function confirmOutOfGroup() {
            const c = widgetConfirm.value;
            if (!c || !c.outOfGroup) return;
            const parent = editWidgetParent.value || editWidgetForm.value;
            if (parent && Array.isArray(parent.children)) {
                const idx = parent.children.findIndex(x => x.id === c.childId);
                if (idx >= 0) {
                    const [moved] = parent.children.splice(idx, 1);
                    if (!currentPanel.value.widgets) currentPanel.value.widgets = [];
                    currentPanel.value.widgets.push(moved);
                    const orig = (currentPanel.value.widgets || []).find(w => w.id === parent.id);
                    if (orig && Array.isArray(orig.children)) {
                        const oi = orig.children.findIndex(x => x.id === c.childId);
                        if (oi >= 0) orig.children.splice(oi, 1);
                    }
                    savePanels();
                }
            }
            widgetConfirm.value = null;
        }

        function moveGroupChild(child, dir) {
            const parent = editWidgetParent.value || editWidgetForm.value;
            if (!parent || !Array.isArray(parent.children)) return;
            const idx = parent.children.findIndex(c => c.id === child.id);
            const ni = idx + dir;
            if (idx < 0 || ni < 0 || ni >= parent.children.length) return;
            const [it] = parent.children.splice(idx, 1);
            parent.children.splice(ni, 0, it);
        }

        const dragChildId = ref(null);
        const dragOverChildId = ref(null);

        function groupChildMouseDown(e, child) {
            if (e.button !== 0) return;
            if (e.target.closest('button, a, input, select, textarea, .v-slider, .v-input__slider')) return;
            e.preventDefault();
            dragChildId.value = child.id;
            dragOverChildId.value = null;
            document.body.classList.add('widget-dragging');
            document.addEventListener('mousemove', groupChildMouseMove);
            document.addEventListener('mouseup', groupChildMouseUp);
        }

        function groupChildMouseMove(e) {
            const el = document.elementFromPoint(e.clientX, e.clientY);
            const item = el && el.closest('.widget-group-list__item');
            const id = item && item.dataset.id;
            dragOverChildId.value = (id && id !== dragChildId.value) ? id : null;
        }

        function groupChildMouseUp() {
            document.removeEventListener('mousemove', groupChildMouseMove);
            document.removeEventListener('mouseup', groupChildMouseUp);
            document.body.classList.remove('widget-dragging');
            const parent = editWidgetParent.value || editWidgetForm.value;
            if (parent && Array.isArray(parent.children)) {
                const from = parent.children.findIndex(c => c.id === dragChildId.value);
                const to = parent.children.findIndex(c => c.id === dragOverChildId.value);
                if (from >= 0 && to >= 0 && from !== to) {
                    const [it] = parent.children.splice(from, 1);
                    parent.children.splice(to, 0, it);
                }
            }
            resetChildDrag();
        }

        function resetChildDrag() {
            dragChildId.value = null;
            dragOverChildId.value = null;
        }

        function addGroupChild(type) {
            groupAddTarget.value = editWidgetForm.value;
            addWidget(type);
        }

        function copyWidget(idx) {
            const src = currentPanel.value.widgets[idx];
            if (!src) return;
            const w = { ...src, id: 'w_' + Date.now(), title: src.title + ' (' + t('copy_suffix') + ')', x: (src.x || 0) + 20, y: (src.y || 0) + 20 };
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

        function widgetHasChangeObjects(w) {
            if (!w) return false;
            const fieldDefs = [
                { field: 'object', alias: null },
                { field: 'object_info', alias: null },
                { field: 'object_alive', alias: null },
                { field: 'object_value', alias: null },
                { field: 'icon_object', alias: 'iconObject' },
                { field: 'bg_object', alias: 'bgObject' },
                { field: 'method', alias: null },
                { field: 'object_switch', alias: null },
                { field: 'object_on', alias: null },
                { field: 'object_off', alias: null },
                { field: 'object_color', alias: null },
            ];
            return fieldDefs.some(fd => {
                let val = w[fd.field];
                if (!val && fd.alias) val = w[fd.alias];
                if (!val) return false;
                if (fd.field === 'method' || fd.field.startsWith('object_')) return !!val.split('/')[0];
                return true;
            });
        }

        function openChangeObject(idx) {
            const w = currentPanel.value.widgets[idx];
            if (!w) return;
            changeObjectWidgetIdx.value = idx;
            const groups = {};
            const fieldDefs = [
                { field: 'object', alias: null, label: 'field_object', isMethod: false },
                { field: 'object_info', alias: null, label: 'field_info', isMethod: false },
                { field: 'object_alive', alias: null, label: 'field_alive', isMethod: false },
                { field: 'object_value', alias: null, label: 'field_value', isMethod: false },
                { field: 'icon_object', alias: 'iconObject', label: 'field_icon', isMethod: false },
                { field: 'bg_object', alias: 'bgObject', label: 'field_bg', isMethod: false },
                { field: 'method', alias: null, label: 'field_method', isMethod: true },
                { field: 'object_switch', alias: null, label: 'field_switch', isMethod: true },
                { field: 'object_on', alias: null, label: 'field_on', isMethod: true },
                { field: 'object_off', alias: null, label: 'field_off', isMethod: true },
                { field: 'object_color', alias: null, label: 'field_color', isMethod: true },
            ];
            for (const fd of fieldDefs) {
                let val = w[fd.field];
                if (!val && fd.alias) val = w[fd.alias];
                if (!val) continue;
                let objKey = val;
                if (fd.isMethod && val.includes('/')) objKey = val.split('/')[0];
                if (!objKey) continue;
                if (!groups[objKey]) groups[objKey] = { oldObj: objKey, newObj: objKey, fields: [] };
                groups[objKey].fields.push(fd.label);
            }
            const vals = Object.values(groups);
            if (vals.length === 0) return;
            changeObjectGroups.value = vals;
            showChangeObject.value = true;
            widgetMenuTarget.value = null;
            if (!objects.value.length) loadObjects();
        }

        function saveChangeObject() {
            const w = currentPanel.value.widgets[changeObjectWidgetIdx.value];
            if (!w) return;
            const fieldMap = {
                'field_object': 'object', 'field_info': 'object_info', 'field_alive': 'object_alive',
                'field_value': 'object_value', 'field_icon': 'icon_object', 'field_bg': 'bg_object',
                'field_method': 'method', 'field_switch': 'object_switch', 'field_on': 'object_on',
                'field_off': 'object_off', 'field_color': 'object_color'
            };
            const methodLabels = ['field_method', 'field_switch', 'field_on', 'field_off', 'field_color'];
            const aliases = { 'field_icon': 'iconObject', 'field_bg': 'bgObject' };
            for (const g of changeObjectGroups.value) {
                if (!g.newObj || g.newObj === g.oldObj) continue;
                for (const lbl of g.fields) {
                    const field = fieldMap[lbl];
                    if (!field) continue;
                    if (methodLabels.includes(lbl)) {
                        const method = (w[field] || '').split('/')[1] || '';
                        w[field] = g.newObj + '/' + method;
                    } else if (aliases[lbl]) {
                        if (w[field]) w[field] = g.newObj;
                        if (w[aliases[lbl]]) w[aliases[lbl]] = g.newObj;
                    } else {
                        w[field] = g.newObj;
                    }
                }
            }
            showChangeObject.value = false;
            savePanels();
        }

        function selectMoveTarget(idx, panelName) {
            const panel = panels.value.find(p => p.name === panelName);
            widgetConfirm.value = { idx, panel: panelName, panelTitle: panel?.title || panelName };
            widgetPanelSubmenu.value = null;
        }

        function moveWidgetToGroup(idx, groupId) {
            const w = currentPanel.value.widgets[idx];
            if (!w) return;
            const g = currentPanel.value.widgets.find(x => x.id === groupId && x.type === 'group');
            if (!g) return;
            widgetConfirm.value = { toGroup: true, idx, groupId, panelTitle: g.title || t('widget_group') };
            widgetGroupSubmenu.value = null;
        }

        function confirmMoveToGroup() {
            const c = widgetConfirm.value;
            if (!c || !c.toGroup) return;
            const w = currentPanel.value.widgets[c.idx];
            const g = currentPanel.value.widgets.find(x => x.id === c.groupId && x.type === 'group');
            if (w && g) {
                currentPanel.value.widgets.splice(c.idx, 1);
                if (!Array.isArray(g.children)) g.children = [];
                w.span = 1;
                g.children.push(w);
            }
            widgetConfirm.value = null;
            widgetMenuTarget.value = null;
            savePanels();
        }

        function confirmMoveWidget() {
            if (!widgetConfirm.value) return;
            changeWidgetPanel(widgetConfirm.value.idx, widgetConfirm.value.panel);
            widgetConfirm.value = null;
            widgetMenuTarget.value = null;
        }

        function changeWidgetPanel(idx, targetPanelName) {
            const w = currentPanel.value.widgets[idx];
            if (!w) return;
            const target = panels.value.find(p => p.name === targetPanelName);
            if (!target) return;
            currentPanel.value.widgets.splice(idx, 1);
            if (!target.widgets) target.widgets = [];
            target.widgets.push(w);
            savePanels();
        }

        function closeEditor() {
            const parent = editWidgetParent.value;
            const parentTab = editParentTab.value;
            if (parent) {
                editWidgetForm.value = null;
                editWidgetParent.value = null;
                editWidget(parent, null);
                editParentTab.value = parentTab;
                if (widgetTab.value !== parentTab) widgetTab.value = parentTab;
            } else {
                editWidgetForm.value = null;
            }
        }

        function saveEditWidget() {
            if (!editWidgetForm.value) return;
            const hadParent = !!editWidgetParent.value;
            const parentTab = editParentTab.value;
            const mode = editWidgetForm.value.bg_mode || (editWidgetForm.value.color ? 'color' : 'default');
            if (mode !== 'color') editWidgetForm.value.color = '';
            if (mode !== 'image') editWidgetForm.value.bg_image = '';
            if (mode !== 'property') { editWidgetForm.value.bg_object = ''; editWidgetForm.value.bg_property = ''; }
            let parent = editWidgetParent.value;
            if (parent && !Array.isArray(parent.children)) {
                const orig = (currentPanel.value.widgets || []).find(w => w.id === parent.id);
                if (orig && Array.isArray(orig.children)) parent = orig;
            }
            if (parent && Array.isArray(parent.children)) {
                const idx = parent.children.findIndex(w => w.id === editWidgetForm.value.id);
                if (idx >= 0) parent.children[idx] = { ...editWidgetForm.value };
                else parent.children.push({ ...editWidgetForm.value });
            } else if (currentPanel.value.widgets) {
                const idx = currentPanel.value.widgets.findIndex(w => w.id === editWidgetForm.value.id);
                if (idx >= 0) currentPanel.value.widgets[idx] = { ...editWidgetForm.value };
            }
            editWidgetForm.value = null;
            editWidgetParent.value = null;
            if (hadParent && parent) {
                editWidget(parent, null);
                editParentTab.value = parentTab;
                if (widgetTab.value !== parentTab) widgetTab.value = parentTab;
            } else {
                savePanels();
            }
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
        // Load methods when any method parent (object_switch/on/off/color) changes
        const methodParents = ['object_switch', 'object_on', 'object_off', 'object_color'];
        methodParents.forEach(key => {
            watch(() => editWidgetForm.value?.[key] ? getMethodObj(editWidgetForm.value[key]) : '', (obj) => {
                if (obj) loadObjectMethods(obj);
            });
        });
        watch(() => editWidgetForm.value?.bg_mode, async (mode) => {
            if (!editWidgetForm.value) return;
            if (mode === 'property') await loadBgProperties();
        });
        watch(() => editWidgetForm.value?.bg_object, (obj) => {
            if (obj && editWidgetForm.value?.bg_mode === 'property') loadBgProperties();
        });
        watch(() => editWidgetForm.value?.icon_object, (obj) => {
            if (obj) loadIconProperties();
        });
        // Generic watcher for any object_* fields (alive, status, current, target, etc.)
        const extraObjectKeys = ['object_alive', 'object_status', 'object_current', 'object_target', 'object_level'];
        extraObjectKeys.forEach(key => {
            watch(() => editWidgetForm.value?.[key], async (obj) => {
                if (!obj) { extraProperties.value[key] = []; return; }
                const res = await dpAPI('properties?object_id=' + encodeURIComponent(obj));
                extraProperties.value = { ...extraProperties.value, [key]: res.items || [] };
            });
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

        async function loadObjectMethods(obj) {
            if (!obj) { methodCache[obj] = []; return []; }
            if (methodCache[obj]) return methodCache[obj];
            const res = await dpAPI('methods?object_id=' + encodeURIComponent(obj));
            const items = res.items || [];
            methodCache[obj] = items;
            return items;
        }

        function toggleField(field) {
            panelForm.value[field] = !panelForm.value[field];
        }

        async function createPanel() {
            const f = panelForm.value;
            panelError.value = '';
            if (!f.title) return;
            if (editPanelData.value && editPanelData.value.widgets?.length && f.panelType === 'group' && editPanelData.value.panelType !== 'group') {
                panelError.value = t('panel_error_group_change');
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
            if (!confirm(t('delete_panel_confirm') + ' «' + p.title + '»?')) return;
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
            { name: 'all', title: 'All' },
            { name: 'home', title: 'Home', icons: ['fas fa-house','fas fa-building','fas fa-door-open','fas fa-bed','fas fa-couch','fas fa-chair','fas fa-toilet','fas fa-shower','fas fa-bath','fas fa-sink','fas fa-faucet','fas fa-trash','fas fa-trash-can','fas fa-recycle','fas fa-lightbulb','fas fa-fan','fas fa-plug','fas fa-bolt','fas fa-snowflake','fas fa-temperature-high','fas fa-temperature-low','fas fa-droplet','fas fa-fire','fas fa-lock','fas fa-unlock','fas fa-key','fas fa-bell','fas fa-clock'] },
            { name: 'devices', title: 'Devices', icons: ['fas fa-tv','fas fa-laptop','fas fa-desktop','fas fa-tablet','fas fa-mobile','fas fa-mobile-button','fas fa-print','fas fa-camera','fas fa-video','fas fa-microphone','fas fa-headphones','fas fa-gamepad','fas fa-robot','fas fa-microchip','fas fa-server','fas fa-database','fas fa-hard-drive','fas fa-sd-card','fas fa-sim-card','fas fa-wifi','fas fa-satellite','fas fa-satellite-dish','fas fa-signal','fas fa-rss','fas fa-radio','fas fa-stopwatch'] },
            { name: 'climate', title: 'Climate', icons: ['fas fa-sun','fas fa-moon','fas fa-cloud','fas fa-cloud-sun','fas fa-cloud-moon','fas fa-cloud-rain','fas fa-cloud-showers-heavy','fas fa-cloud-sun-rain','fas fa-cloud-bolt','fas fa-smog','fas fa-wind','fas fa-fan','fas fa-snowflake','fas fa-fire','fas fa-water','fas fa-droplet','fas fa-leaf','fas fa-tree','fas fa-seedling'] },
            { name: 'lighting', title: 'Lighting', icons: ['fas fa-lightbulb','fas fa-sun','fas fa-moon','fas fa-star','fas fa-fire'] },
            { name: 'energy', title: 'Energy', icons: ['fas fa-bolt','fas fa-plug','fas fa-battery-full','fas fa-battery-three-quarters','fas fa-battery-half','fas fa-battery-quarter','fas fa-battery-empty','fas fa-charging-station','fas fa-gas-pump','fas fa-car-battery','fas fa-solar-panel','fas fa-power-off','fas fa-gauge','fas fa-gauge-high','fas fa-oil-well'] },
            { name: 'media', title: 'Media', icons: ['fas fa-music','fas fa-headphones','fas fa-headset','fas fa-microphone','fas fa-microphone-lines','fas fa-radio','fas fa-tv','fas fa-video','fas fa-film','fas fa-camera','fas fa-camera-retro','fas fa-image','fas fa-images','fas fa-play','fas fa-pause','fas fa-stop','fas fa-forward','fas fa-backward','fas fa-volume-high','fas fa-volume-low','fas fa-volume-off','fas fa-volume-xmark','fas fa-eject','fas fa-shuffle','fas fa-repeat','fas fa-rotate','fas fa-circle-play','fas fa-circle-pause','fas fa-circle-stop'] },
            { name: 'automation', title: 'Automation', icons: ['fas fa-gear','fas fa-sliders','fas fa-code-branch','fas fa-arrow-trend-up','fas fa-arrow-trend-down','fas fa-chart-line','fas fa-chart-bar','fas fa-chart-pie','fas fa-chart-simple','fas fa-chart-gantt','fas fa-route','fas fa-map','fas fa-map-pin','fas fa-location-dot','fas fa-compass','fas fa-crosshairs','fas fa-bullseye','fas fa-clock','fas fa-calendar','fas fa-calendar-days','fas fa-hourglass','fas fa-stopwatch'] },
            { name: 'security', title: 'Security', icons: ['fas fa-shield','fas fa-shield-halved','fas fa-lock','fas fa-lock-open','fas fa-unlock','fas fa-unlock-keyhole','fas fa-key','fas fa-fingerprint','fas fa-id-card','fas fa-id-badge','fas fa-user-lock','fas fa-user-shield','fas fa-eye','fas fa-eye-slash','fas fa-video','fas fa-camera','fas fa-door-closed','fas fa-bell'] },
            { name: 'arrows', title: 'Arrows', icons: ['fas fa-arrow-up','fas fa-arrow-down','fas fa-arrow-left','fas fa-arrow-right','fas fa-chevron-up','fas fa-chevron-down','fas fa-chevron-left','fas fa-chevron-right','fas fa-angle-up','fas fa-angle-down','fas fa-angle-left','fas fa-angle-right','fas fa-caret-up','fas fa-caret-down','fas fa-caret-left','fas fa-caret-right','fas fa-arrows-rotate','fas fa-arrow-rotate-left','fas fa-arrow-rotate-right','fas fa-up-down','fas fa-left-right'] },
            { name: 'transport', title: 'Transport', icons: ['fas fa-car','fas fa-car-side','fas fa-car-rear','fas fa-truck','fas fa-truck-moving','fas fa-bus','fas fa-bus-simple','fas fa-train','fas fa-train-subway','fas fa-train-tram','fas fa-plane','fas fa-plane-up','fas fa-helicopter','fas fa-ship','fas fa-bicycle','fas fa-motorcycle','fas fa-tractor','fas fa-taxi','fas fa-van-shuttle','fas fa-warehouse'] },
            { name: 'food', title: 'Food', icons: ['fas fa-mug-hot','fas fa-mug-saucer','fas fa-bottle-water','fas fa-glass-water','fas fa-wine-glass','fas fa-wine-bottle','fas fa-whiskey-glass','fas fa-utensils','fas fa-kitchen-set','fas fa-bowl-food','fas fa-bowl-rice','fas fa-apple-whole','fas fa-carrot','fas fa-bread-slice','fas fa-cheese','fas fa-cookie','fas fa-fish','fas fa-egg','fas fa-ice-cream'] },
            { name: 'weather', title: 'Weather', icons: ['fas fa-sun','fas fa-moon','fas fa-cloud','fas fa-cloud-sun','fas fa-cloud-moon','fas fa-cloud-rain','fas fa-cloud-showers-heavy','fas fa-cloud-sun-rain','fas fa-cloud-bolt','fas fa-smog','fas fa-wind','fas fa-snowflake','fas fa-temperature-high','fas fa-temperature-low','fas fa-droplet','fas fa-water','fas fa-volcano','fas fa-mountain','fas fa-mountain-sun','fas fa-umbrella'] },
            { name: 'users', title: 'Users', icons: ['fas fa-user','fas fa-users','fas fa-user-plus','fas fa-user-minus','fas fa-user-pen','fas fa-user-gear','fas fa-user-lock','fas fa-user-shield','fas fa-user-check','fas fa-user-xmark','fas fa-user-group','fas fa-user-large','fas fa-user-astronaut','fas fa-user-ninja','fas fa-user-tie','fas fa-user-doctor','fas fa-user-graduate','fas fa-user-secret','fas fa-child','fas fa-people-group','fas fa-people-arrows'] },
            { name: 'status', title: 'Status', icons: ['fas fa-check','fas fa-check-double','fas fa-xmark','fas fa-ban','fas fa-circle-exclamation','fas fa-exclamation','fas fa-question','fas fa-info','fas fa-circle','fas fa-circle-dot','fas fa-circle-half-stroke','fas fa-circle-check','fas fa-circle-xmark','fas fa-circle-plus','fas fa-circle-minus','fas fa-circle-info','fas fa-circle-question','fas fa-bell','fas fa-bell-slash','fas fa-flag','fas fa-flag-checkered','fas fa-heart','fas fa-heart-circle-check','fas fa-heart-circle-exclamation','fas fa-star','fas fa-star-half','fas fa-thumbs-up','fas fa-thumbs-down'] },
            { name: 'communication', title: 'Communication', icons: ['fas fa-phone','fas fa-phone-volume','fas fa-envelope','fas fa-envelope-open','fas fa-comment','fas fa-comments','fas fa-comment-dots','fas fa-message','fas fa-share','fas fa-share-nodes','fas fa-paper-plane','fas fa-reply','fas fa-inbox','fas fa-at','fas fa-hashtag','fas fa-bullhorn','fas fa-wifi','fas fa-signal','fas fa-fax','fas fa-print'] },
            { name: 'files', title: 'Files', icons: ['fas fa-file','fas fa-file-lines','fas fa-file-pdf','fas fa-file-word','fas fa-file-excel','fas fa-file-powerpoint','fas fa-file-image','fas fa-file-video','fas fa-file-audio','fas fa-file-zipper','fas fa-file-code','fas fa-folder','fas fa-folder-open','fas fa-folder-plus','fas fa-folder-minus','fas fa-copy','fas fa-paste','fas fa-clipboard','fas fa-clipboard-list','fas fa-clipboard-check','fas fa-note-sticky','fas fa-newspaper','fas fa-book','fas fa-book-open','fas fa-bookmark'] },
            { name: 'shapes', title: 'Shapes', icons: ['fas fa-square','fas fa-circle','fas fa-diamond','fas fa-heart','fas fa-star','fas fa-star-of-life','fas fa-cross','fas fa-plus','fas fa-minus','fas fa-asterisk','fas fa-infinity'] },
            { name: 'brands', title: 'Brands', icons: ['fab fa-amazon','fab fa-android','fab fa-angular','fab fa-apple','fab fa-aws','fab fa-bitcoin','fab fa-cc-amex','fab fa-cc-mastercard','fab fa-cc-visa','fab fa-centos','fab fa-chrome','fab fa-cloudflare','fab fa-css3','fab fa-digital-ocean','fab fa-discord','fab fa-docker','fab fa-dropbox','fab fa-ebay','fab fa-edge','fab fa-ethereum','fab fa-facebook','fab fa-facebook-messenger','fab fa-fedora','fab fa-firefox','fab fa-github','fab fa-gitlab','fab fa-google','fab fa-html5','fab fa-hubspot','fab fa-instagram','fab fa-jira','fab fa-js','fab fa-linkedin','fab fa-linux','fab fa-microsoft','fab fa-node','fab fa-npm','fab fa-opera','fab fa-paypal','fab fa-pinterest','fab fa-playstation','fab fa-python','fab fa-react','fab fa-reddit','fab fa-redhat','fab fa-rocketchat','fab fa-safari','fab fa-salesforce','fab fa-slack','fab fa-snapchat','fab fa-soundcloud','fab fa-spotify','fab fa-stack-overflow','fab fa-steam','fab fa-stripe','fab fa-telegram','fab fa-tiktok','fab fa-trello','fab fa-twitch','fab fa-twitter','fab fa-ubuntu','fab fa-vimeo','fab fa-vk','fab fa-vuejs','fab fa-whatsapp','fab fa-windows','fab fa-xbox','fab fa-youtube'] },
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

            // transparency as background alpha (0 = fully transparent, 100 = fully opaque)
            function hexToRgb(hex) { return parseInt(hex.slice(1,3), 16)+','+parseInt(hex.slice(3,5), 16)+','+parseInt(hex.slice(5,7), 16); }
            root.style.setProperty('--theme-bg-rgb', hexToRgb(themeBg));
            root.style.setProperty('--card-alpha', (s.cardsOpacity / 100) + '');
            root.style.setProperty('--menu-alpha', (s.menuOpacity / 100) + '');
            root.style.setProperty('--dialog-alpha', (s.dialogOpacity / 100) + '');

            // widget sizes
            root.style.setProperty('--widget-icon-size', (23 + s.iconSize * 0.2) + 'px');
            root.style.setProperty('--widget-title-size', (1.49 + s.titleSize * 0.005) + 'rem');
            root.style.setProperty('--widget-subtitle-size', (1 + s.subtitleSize * 0.005) + 'rem');
            root.style.setProperty('--widget-size', (65 + s.widgetSize * 0.5) + 'px');
        }

        function toggleTheme() {
            settings.value.theme = settings.value.theme === 'light' ? 'dark' : 'light';
            savePanels();
        }

        function cleanupOrphanWidgets() {
            if (!confirm(t('confirm_delete_orphans'))) return;
            const allWidgetIds = new Set();
            panels.value.forEach(p => (p.widgets || []).forEach(w => allWidgetIds.add(w.id)));
            savePanels();
            alert(t('alert_cleanup_done'));
        }

        function resetAll() {
            if (!confirm(t('confirm_delete_all'))) return;
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
                if (!exportSelectedPanel.value) { alert('Select panel'); return; }
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
                if (!exportSelectedUser.value) { alert('Select user'); return; }
                showExportDialog.value = false;
                try {
                    const res = await dpAPI('exportToUser', {
                        method: 'POST',
                        body: JSON.stringify({ targetUser: exportSelectedUser.value })
                    });
                    if (res.warn) {
                        if (confirm(res.message || t('confirm_overwrite_user'))) {
                            const res2 = await dpAPI('exportToUser', {
                                method: 'POST',
                                body: JSON.stringify({ targetUser: exportSelectedUser.value, confirmed: true })
                            });
                            if (res2.success) {
                                alert(t('settings_copied_to_pre') + exportSelectedUser.value + t('settings_copied_to_post'));
                            } else {
                                alert('Error: ' + (res2.error || t('unknown_error')));
                            }
                        }
                    } else if (res.success) {
                        alert(t('settings_copied_to_pre') + exportSelectedUser.value + t('settings_copied_to_post'));
                    } else {
                        alert('Error: ' + (res.error || t('unknown_error')));
                    }
                } catch (e) {
                    alert(t('copy_error_prefix') + e.message);
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
                        alert(t('import_complete'));
                    } else {
                        alert(t('invalid_file_format'));
                    }
                } catch (err) {
                    alert('Import error: ' + err.message);
                }
            };
            input.click();
        }

        async function checkNotifications() {
            try {
                const res = await dpAPI('notifications');
                if (res) {
                    if (Array.isArray(res)) {
                        notifications.value = res;
                        unreadCount.value = res.length;
                    } else {
                        unreadCount.value = res.count ?? (res.items?.length ?? 0);
                        notifications.value = res.items || [];
                    }
                }
            } catch (e) { console.warn('checkNotifications error', e); }
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
                checkNotifications();
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
                widgetPanelSubmenu.value = null;
                widgetGroupSubmenu.value = null;
            }
        }

        let wsSocket = null;
        let wsReconnectTimer = null;
        let wsSubscribedProps = [];

        function wsSetLive(live) {
            window.__dpWsLive = !!live;
        }

        function wsCollectProps() {
            const props = new Set();
            (currentPanel.value?.widgets || []).forEach(w => {
                wsWidgetPropKeys(w).forEach(k => props.add(k));
            });
            return Array.from(props);
        }

        function wsSubscribeProperties() {
            if (!wsSocket || !wsConnected.value) return;
            const list = wsCollectProps();
            if (!list.length) return;
            const same = list.length === wsSubscribedProps.length && list.every(p => wsSubscribedProps.includes(p));
            if (same) return;
            wsSubscribedProps = list;
            const payload = JSON.stringify({ action: 'Subscribe', data: { TYPE: 'properties', PROPERTIES: list.join(',') } });
            wsBytesSent.value += payload.length;
            wsSocket.send(payload);
        }

        function wsRefreshWidgets(propKey) {
            const key = String(propKey).toLowerCase();
            const base = key.split('.')[0];
            (currentPanel.value?.widgets || []).forEach(w => {
                const keys = wsWidgetPropKeys(w);
                if (keys.has(key) || keys.has(base)) {
                    wsRev[w.id] = (wsRev[w.id] || 0) + 1;
                }
            });
        }

        function wsRemountWidgets() {
            (currentPanel.value?.widgets || []).forEach(w => {
                wsRev[w.id] = (wsRev[w.id] || 0) + 1;
            });
        }

        function initWebSocket() {
            const loc = window.location;
            const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = protocol + '//' + loc.hostname + ':8001/majordomo';
            try {
                wsSocket = new WebSocket(wsUrl);
            } catch (e) { console.error('WS creation failed', e); return; }
            wsSocket.onopen = function() {
                wsConnected.value = true;
                wsSetLive(true);
                if (wsReconnectTimer) { clearTimeout(wsReconnectTimer); wsReconnectTimer = null; }
                const subEvents = JSON.stringify({ action: 'Subscribe', data: { TYPE: 'events', EVENTS: 'SAY,DASHBOARD_PRO' } });
                wsBytesSent.value += subEvents.length;
                wsSocket.send(subEvents);
                wsSubscribeProperties();
                wsRemountWidgets();
            };
            wsSocket.onerror = function(e) {
                console.error('WS error', e);
            };
            wsSocket.onmessage = function(msg) {
                wsBytesReceived.value += typeof msg.data === 'string' ? msg.data.length : (msg.data ? (msg.data.size || msg.data.byteLength || 0) : 0);
                try {
                    const data = JSON.parse(msg.data);
                    if (data.action === 'status') {
                        try { wsStatus.value = JSON.parse(data.data); } catch (e) { wsStatus.value = data.data; }
                        return;
                    }
                    if (data.action === 'subscribed' || data.action === 'ping') {
                        return;
                    }
                    if (data.action === 'properties' && data.data) {
                        wsPulse.value = true;
                        setTimeout(() => { wsPulse.value = false; }, 400);
                        let updates;
                        try { updates = JSON.parse(data.data); } catch (e) { updates = null; }
                        if (Array.isArray(updates)) {
                            updates.forEach(u => {
                                if (!u || !u.PROPERTY) return;
                                const key = String(u.PROPERTY).toLowerCase();
                                window.__dpWsCache[key] = { seeded: true, value: u.VALUE };
                                if (window.__dpWsLive) wsRefreshWidgets(key);
                            });
                        }
                        return;
                    }
                    if (data.action === 'events' && data.data) {
                        wsPulse.value = true;
                        setTimeout(() => { wsPulse.value = false; }, 400);
                        let eventData = data.data;
                        try { eventData = JSON.parse(data.data); } catch (e) {}
                        const eInfo = eventData && eventData.EVENT_DATA ? eventData.EVENT_DATA : eventData;
                        const evName = eInfo.NAME ? String(eInfo.NAME).toLowerCase() : '';
                        if (evName !== 'dashboard_pro' && evName !== 'say') return;
                        const cmd = (eInfo && eInfo.VALUE) || eInfo || {};
                        if (evName === 'say') {
                            const sayText = cmd.message;
                            if (sayText && authenticated.value) {
                                notifications.value.unshift({
                                    ID: 'notif_' + Date.now(),
                                    MESSAGE: sayText,
                                    MODULE_NAME: cmd.source || t('module_name_default'),
                                    TYPE: (cmd.level && cmd.level >= 5) ? 'info' : 'info',
                                    ADDED: new Date().toISOString().replace('T', ' ').slice(0, 19)
                                });
                                unreadCount.value = notifications.value.length;
                            }
                            return;
                        }
                        if (cmd.COMMAND === 'ViewNotify') {
                            const n = cmd.NOTIFY || {};
                            if (n.text && authenticated.value) {
                                notifications.value.unshift({
                                    ID: 'notif_' + Date.now(),
                                    MESSAGE: n.text,
                                    MODULE_NAME: n.source || t('module_name_default'),
                                    TYPE: n.icon || 'info',
                                    ADDED: new Date().toISOString().replace('T', ' ').slice(0, 19)
                                });
                                unreadCount.value = notifications.value.length;
                            }
                        }
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
                    if (data.action === 'PostEvent' && data.data) {
                        if (data.data.COMMAND === 'ViewNotify') {
                            const n = data.data.NOTIFY || {};
                            if (n.text && authenticated.value) {
                                notifications.value.unshift({
                                    ID: 'notif_' + Date.now(),
                                    MESSAGE: n.text,
                                    MODULE_NAME: n.source || t('module_name_default'),
                                    TYPE: n.icon || 'info',
                                    ADDED: new Date().toISOString().replace('T', ' ').slice(0, 19)
                                });
                                unreadCount.value = notifications.value.length;
                            }
                        } else if (data.data.COMMAND === 'UpdateData' && authenticated.value) {
                            const curName = currentPanel.value?.name;
                            loadData().then(() => {
                                const updated = panels.value.find(p => p.name === curName);
                                if (updated) currentPanel.value = updated;
                            });
                        }
                    }
                } catch (e) { /* silent */ }
            };
            wsSocket.onclose = function() {
                wsConnected.value = false;
                wsSetLive(false);
                wsSubscribedProps = [];
                wsRemountWidgets();
                wsReconnectTimer = setTimeout(initWebSocket, 5000);
            };
        }

        function forceRefresh() {
            wsRemountWidgets();
            if (wsSocket && wsConnected.value) {
                const payload = JSON.stringify({ action: 'status' });
                wsBytesSent.value += payload.length;
                wsSocket.send(payload);
            }
        }

        function base64ToBlob(b64, mime) {
            const bin = atob(b64);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            return new Blob([bytes], { type: mime || 'application/octet-stream' });
        }

        async function exportWidgetZip(w) {
            try {
                const res = await dpAPI('widgetExport?type=' + encodeURIComponent(w.type));
                if (res.error) { alert(t('error_label') + ' ' + res.error); return; }
                if (!res.zip) { alert(t('error_label') + ' empty archive'); return; }
                const blob = base64ToBlob(res.zip, 'application/zip');
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = res.name || (w.type + '.zip');
                a.click();
                URL.revokeObjectURL(url);
            } catch (e) {
                alert(t('error_label') + (e.message || e));
            }
        }

        function pickWidgetZip() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.zip';
            input.onchange = (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                if (!/\.zip$/i.test(file.name)) { alert(t('widget_editor_bad_zip')); return; }
                const reader = new FileReader();
                reader.onload = async () => {
                    const b64 = String(reader.result || '').split(',')[1] || '';
                    if (!b64) { alert(t('widget_editor_bad_zip')); return; }
                    try {
                        const res = await dpAPI('widgetInstall', { method: 'POST', body: JSON.stringify({ zip: b64 }) });
                        if (res.error) {
                            if (res.error === 'widget_exists') {
                                alert(t('widget_editor_exists') + ': ' + res.type);
                            } else {
                                alert(t('widget_editor_install_error') + '\n' + res.error);
                            }
                        } else {
                            alert(t('widget_editor_installed') + (res.type || file.name));
                            await loadWidgetDefs();
                        }
                    } catch (err) {
                        alert(t('error_label') + (err.message || err));
                    }
                };
                reader.onerror = () => alert(t('error_label') + 'read');
                reader.readAsDataURL(file);
            };
            input.click();
        }

        async function deleteWidgetDef(w) {
            if (!confirm(t('widget_editor_delete_confirm') + ' «' + (w.title || w.type) + '»?')) return;
            try {
                const res = await dpAPI('widgetDelete', { method: 'POST', body: JSON.stringify({ type: w.type }) });
                if (res.error) {
                    if (res.error === 'widget_in_use') {
                        alert(t('widget_editor_in_use') + ': ' + res.count);
                    } else {
                        alert(t('error_label') + ' ' + res.error);
                    }
                    return;
                }
                await loadWidgetDefs();
            } catch (e) {
                alert(t('error_label') + (e.message || e));
            }
        }

        async function moveWidgetDef(idx, dir) {
            const newIdx = idx + dir;
            if (newIdx < 0 || newIdx >= widgetList.value.length) return;
            const arr = widgetList.value;
            [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
            await saveWidgetDefOrder(arr);
        }

        const dragWidgetDefId = ref(null);
        const dragWidgetDefOverId = ref(null);

        function widgetDefMouseDown(e, w) {
            if (e.button !== 0) return;
            if (e.target.closest('button, a, input, select, textarea, .v-slider, .v-input__slider')) return;
            e.preventDefault();
            dragWidgetDefId.value = w.type;
            dragWidgetDefOverId.value = null;
            document.body.classList.add('widget-dragging');
            document.addEventListener('mousemove', widgetDefMouseMove);
            document.addEventListener('mouseup', widgetDefMouseUp);
        }

        function widgetDefMouseMove(e) {
            const el = document.elementFromPoint(e.clientX, e.clientY);
            const item = el && el.closest('.widget-editor__item');
            const type = item && item.dataset.id;
            dragWidgetDefOverId.value = (type && type !== dragWidgetDefId.value) ? type : null;
        }

        async function widgetDefMouseUp() {
            document.removeEventListener('mousemove', widgetDefMouseMove);
            document.removeEventListener('mouseup', widgetDefMouseUp);
            document.body.classList.remove('widget-dragging');
            const arr = widgetList.value;
            const from = arr.findIndex(x => x.type === dragWidgetDefId.value);
            const to = arr.findIndex(x => x.type === dragWidgetDefOverId.value);
            dragWidgetDefId.value = null;
            dragWidgetDefOverId.value = null;
            if (from < 0 || to < 0 || from === to) return;
            const [it] = arr.splice(from, 1);
            arr.splice(to, 0, it);
            await saveWidgetDefOrder(arr);
        }

        async function saveWidgetDefOrder(arr) {
            const order = arr.map(w => w.type);
            try {
                const res = await dpAPI('widgetReorder', { method: 'POST', body: JSON.stringify({ order }) });
                if (res.error) { alert(t('error_label') + ' ' + res.error); await loadWidgetDefs(); return; }
                widgetDefs.value = arr.map(w => ({ ...w }));
            } catch (e) {
                alert(t('error_label') + (e.message || e));
                await loadWidgetDefs();
            }
        }

        window.__closeSettings = () => { showSettingsPanel.value = false; showWidgetEditorPanel.value = false; };

        watch(currentPanel, () => wsSubscribeProperties(), { deep: true });

        watch(settings, (s) => {
            applySettings();
            document.title = s.appTitle || 'Dashboard Pro';
            wsSetLive(wsConnected.value);
        }, { deep: true });

onMounted(() => {
            document.addEventListener('click', handleClickOutside);
            loadTranslations();
            initAuth();
            checkNotifications();
            setInterval(() => { if (!wsConnected.value) checkNotifications(); }, 10000);
            initWebSocket();
        });

        return {
            authenticated, authChecking, login, password, loginError, loginLoading, doLogin, doLogout, testAPI: Auth.testAPI,
            panels, currentPanel, selectPanel, selectHomePanel, loading, editMode,
            showAddWidget, widgetSearch, filteredDefs, plusTooltip, addPlusButton,
            widgetTypeComponent, addWidget, getWidgetFields, getWidgetRows, getWidgetTabs, getFieldOptions, fieldVisible,
            getMethodObj, getMethodName, setMethodField, itemLabel,
            editWidgetForm, widgetTab, widgetTabPos, editWidget, saveEditWidget, removeWidget,
            editWidgetParent, groupAddTarget, addGroupChild, removeGroupChild, moveGroupChild,
            groupChildrenList, startGroupChildAdd, closeEditor, moveGroupChildOut, confirmOutOfGroup, moveGroupChild, groupChildMouseDown, groupChildMouseMove, groupChildMouseUp, resetChildDrag, dragChildId, dragOverChildId,
            columnIdx, columnList, setColumns, addColumn, removeColumn, moveColumnUp, moveColumnDown, autoDetectColumns, columnFields,
            draggingWidget, startDrag, onDrag, stopDrag,
            resizingWidget, startResize, onResize, stopResize,
            widgetMenuTarget, widgetPanelSubmenu, widgetGroupSubmenu, widgetConfirm, copyWidget, exportWidget, changeWidgetPanel, selectMoveTarget, confirmMoveWidget, moveWidgetToGroup, confirmMoveToGroup,
            showChangeObject, changeObjectGroups, openChangeObject, saveChangeObject, widgetHasChangeObjects,
            showSettingsPanel, showWidgetEditorPanel, settings, savePanels, toggleTheme, cleanupOrphanWidgets, resetAll,
            showExportDialog, exportMode, exportSelectedPanel, exportUsers, exportSelectedUser, loadExportUsers, doExport, doImport,
            showAddPanel, editPanelData, panelForm, panelTab, panelTabPos, panelError, createPanel, editPanel, openPanelForm, deletePanel, deleteCurrentPanel, movePanel, showAbout, toggleField,
            showIconPicker, iconTarget, iconSearch, iconCategory, iconCategorySearch, iconPage, iconCategories, filteredIconCategories, filteredIcons, totalPages, paginatedIcons, openIconPicker, selectIcon, iconPicked,
            objects, iconProperties, infoProperties, widgetProperties, bgProperties, extraProperties, methodCache, loadObjects, loadIconProperties, loadInfoProperties, loadWidgetProperties, loadBgProperties, widgetBgStyle,
            isAdmin, toggleEditMode, wsConnected, wsTooltip, wsStatus, wsPulse, wsBytesSent, wsBytesReceived, wsRev, user, userMenuOpen, sidebarMini, toggleSidebar, expandedGroups, childPanels, toggleGroup, forceRefresh, formatBytes,
            showNotifications, notifications, unreadCount, checkNotifications, markNotificationsRead,
            chatOpen, chatMessages, chatText, chatLoading, loadChat, sendChat, toggleChat, formatTime,
            widgetList, moveWidgetDef, exportWidgetZip, deleteWidgetDef, pickWidgetZip,
            widgetDefMouseDown, widgetDefMouseMove, widgetDefMouseUp, dragWidgetDefId, dragWidgetDefOverId,
            t
        };
    }
});

app.config.globalProperties.t = window.__t;

function registerWidgetComponent(type) {
    if (app.component('widget-' + type)) return app.component('widget-' + type);
    const comp = (window.DpWidgets && window.DpWidgets[type]) || null;
    app.component('widget-' + type,
        comp || { template: '<div>' + (t('widget_' + type) || type) + '</div>' });
    return app.component('widget-' + type);
}

const DpSlider = {
    props: {
        modelValue: { type: Number, default: 0 },
        label: { type: String, default: '' },
        min: { type: Number, default: 0 },
        max: { type: Number, default: 100 },
        step: { type: Number, default: 1 }
    },
    emits: ['update:modelValue'],
    data() { return { dragging: false }; },
    computed: {
        range() { return Math.max(0, this.max - this.min); },
        pct() { return this.range ? ((Number(this.modelValue) - this.min) / this.range) * 100 : 0; },
        ticks() {
            const arr = [];
            if (this.step <= 0) return arr;
            const count = this.range / this.step;
            if (count > 12) return arr;
            for (let i = 0; i <= count; i++) arr.push(i * this.step + this.min);
            return arr;
        }
    },
    methods: {
        setFromEvent(e, rect) {
            const r = rect || e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - r.left) / r.width;
            let v = this.min + ratio * this.range;
            if (this.step) v = Math.round((v - this.min) / this.step) * this.step + this.min;
            v = Math.min(this.max, Math.max(this.min, v));
            if (v !== Number(this.modelValue)) this.$emit('update:modelValue', v);
        },
        onDown(e) {
            this.dragging = true;
            const track = e.currentTarget.parentNode;
            const rect = track.getBoundingClientRect();
            const compute = ev => {
                const ratio = (ev.clientX - rect.left) / rect.width;
                let v = this.min + ratio * this.range;
                if (this.step) v = Math.round((v - this.min) / this.step) * this.step + this.min;
                v = Math.min(this.max, Math.max(this.min, v));
                if (v !== Number(this.modelValue)) this.$emit('update:modelValue', v);
            };
            compute(e);
            const up = () => { this.dragging = false; window.removeEventListener('mousemove', compute); window.removeEventListener('mouseup', up); };
            window.addEventListener('mousemove', compute);
            window.addEventListener('mouseup', up);
        }
    },
    template: `
        <div class="v-input v-input__slider theme--dark">
            <div class="v-input__control">
                <div class="v-input__slot">
                    <label class="v-label theme--dark">{{ label }}</label>
                    <div class="v-slider v-slider--horizontal theme--dark" @mousedown="setFromEvent">
                        <input :value="modelValue" disabled="disabled" readonly="readonly" tabindex="-1">
                        <div class="v-slider__track-container">
                            <div class="v-slider__track-background" :style="{ right: '0px', width: 'calc(' + (100 - pct) + '%)' }"></div>
                            <div class="v-slider__track-fill primary" :style="{ left: '0px', right: 'auto', width: pct + '%' }"></div>
                        </div>
                        <div class="v-slider__ticks-container v-slider__ticks-container--always-show" v-if="ticks.length">
                            <span v-for="tv in ticks" :key="tv" class="v-slider__tick" :class="{ 'v-slider__tick--filled': tv <= Number(modelValue) }" :style="{ width: '4px', height: '4px', left: 'calc(' + ((tv - min) / range * 100) + '% - 2px)', top: 'calc(50% - 2px)' }">
                                <div class="v-slider__tick-label">{{ tv }}</div>
                            </span>
                        </div>
                        <div role="slider" tabindex="0" class="v-slider__thumb-container primary--text" :class="{ 'v-slider__thumb-container--active': dragging }" :style="{ left: pct + '%' }" @mousedown.stop="onDown">
                            <div class="v-slider__thumb primary"></div>
                        </div>
                    </div>
                </div>
                <div class="v-messages theme--dark"><div class="v-messages__wrapper"></div></div>
            </div>
        </div>`
};
app.component('dp-slider', DpSlider);

const vm = app.mount('#app');
window.__dp_vm = vm;
