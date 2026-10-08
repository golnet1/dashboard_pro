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

/* общий клиентский лог виджетов: строки копятся и пакетом уходят в cmLog-эндпоинт
   модуля; сервер сам решает, писать ли в DebMes (только при включённой отладке) */
let dpCLogBuf = [];
let dpCLogT = 0;
function dpClientLog(src, level, msg) {
    if (!src || msg === '' || msg === null || msg === undefined) return;
    dpCLogBuf.push({ s: String(src).slice(0, 40), l: level === 'debug' ? 'debug' : 'cm', m: String(msg).slice(0, 600) });
    if (dpCLogT) return;
    dpCLogT = window.setTimeout(() => {
        dpCLogT = 0;
        const items = dpCLogBuf.splice(0, dpCLogBuf.length);
        if (!items.length) return;
        const groups = {};
        for (const it of items) {
            const key = it.l + '\u0001' + it.s;
            (groups[key] = groups[key] || []).push(it.m);
        }
        for (const key of Object.keys(groups)) {
            const sep = key.indexOf('\u0001');
            const lvl = key.slice(0, sep);
            const srcName = key.slice(sep + 1);
            try {
                fetch('/api.php/module/dashboard_pro/cmLog', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ src: srcName, level: lvl, lines: groups[key] })
                }).catch(() => {});
            } catch (e) { }
        }
    }, 2000);
}
window.__dpWsLive = false;
window.__dpInfoCache = window.__dpInfoCache || {};
window.__dpWidgetState = window.__dpWidgetState || {};

const WS_OBJECT_FIELDS = [
    ['object_value', 'property'],
    ['object', 'property'],
    ['object_info', 'property_info'],
    ['object_alive', 'property_alive'],
    ['object_status', 'property_status'],
    ['object_current', 'property_current'],
    ['object_target', 'property_target'],
    ['object_level', 'property_level'],
    ['bg_object', 'bg_property'],
    ['icon_object', 'icon_property']
];

        const INTERFACE_FONT_STACKS = {
            Roboto: '"Roboto", Arial, sans-serif',
            Ubuntu: '"Ubuntu", Arial, sans-serif',
            Arial: 'Arial, "Arimo", sans-serif',
            Helvetica: '"Helvetica Neue", "Open Sans", Arial, sans-serif',
            Tahoma: 'Tahoma, Arial, sans-serif',
            Verdana: 'Verdana, Arial, sans-serif'
        };

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
    /* The colour of the background has the same object with the same property
       behind it as any other pair of the list, but an empty property means
       «status» and the pair has to be asked for exactly that way - the pair
       without it is never built above. */
    if (w.bg_mode === 'property' && w.bg_object) {
        keys.add((w.bg_object + '.' + (w.bg_property || 'status')).toLowerCase());
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

/* An address is written into url() the way it arrived, but inside quotes: without
   them an address with spaces or brackets is not a valid url() at all and the
   picture simply never appears, while a backslash of a path has to stay the
   character it stands for instead of escaping whatever follows it. */
function dpCssUrl(raw) {
    const s = String(raw == null ? '' : raw).trim().replace(/[\r\n\t]+/g, ' ');
    return s ? '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"' : '';
}

/* What a property may hold and still be a colour: #rrggbb with or without the
   hash, a bare hex of three or six digits that carries at least one letter (so a
   counter like 123 or 123456 stays a number) and an ordinary triplet. A status or a
   temperature is none of that and must not be painted - the card would otherwise go
   transparent over nothing. The browser gives the final word, so "red" passes and
   "on" does not; where there is no CSS to ask, a well-formed hex is still accepted. */
function dpCssColor(value) {
    const s = String(value == null ? '' : value).trim();
    if (!s) return '';
    let cand = s;
    if (/^(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(s) && /[a-fA-F]/.test(s)) {
        cand = '#' + s;
    } else if (/^\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(\s*,\s*(?:\d+(?:\.\d+)?|\.\d+))?$/.test(s)) {
        const parts = s.split(/\s*,\s*/);
        cand = (parts.length === 4 ? 'rgba(' : 'rgb(') + parts.join(',') + ')';
    }
    if (typeof CSS !== 'undefined' && CSS.supports && typeof CSS.supports === 'function') {
        return CSS.supports('color', cand) ? cand : '';
    }
    return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(cand) ? cand : '';
}

const widgetDefs = ref([]);
const widgetList = ref([]);

const translations = ref({});
/* Until the language has arrived t() hands back the key itself, so nothing may be
   drawn with it yet: the sign in screen would read "sign_in" instead of the words,
   and the keys stay visible long enough to be read. The screen waits for this. */
const langReady = ref(false);
window.__t = function(text) { return translations.value[text] || text; };
const t = window.__t;

/* the name of a widget: its own title first, then the translation, and the type
   itself as the last resort - never a raw key like widget_type */
function widgetName(w) {
    const o = (w && typeof w === 'object') ? w : null;
    const type = (o ? (o.type || '') : w) || '';
    const own = (o && (o.title || o.name)) || '';
    if (own) return own;
    const tr = translations.value['widget_' + type];
    if (tr) return tr;
    const def = widgetDefs.value.find(d => d.type === type);
    if (def && def.title) return def.title;
    return type;
}

let langRetryTimer = null;

/* The wording is what the sign in screen is written in, so the screen is not
   allowed to come up before it. That holds whatever the request does: no answer,
   an empty one, or a failure - the screen waits, and the wording is asked for
   again until it arrives. Open the form on an empty dictionary and it stands
   there spelled out in keys - sign_in, login, password - which is exactly what
   the user should never be shown. */
function keepAskingLang() {
    if (langRetryTimer) return;
    langRetryTimer = setInterval(async () => {
        if (langReady.value) { clearInterval(langRetryTimer); langRetryTimer = null; return; }
        try {
            const d = await dpAPI('lang');
            const isDict = d && typeof d === 'object' && !Array.isArray(d) && Object.keys(d).length > 20;
            if (isDict) {
                translations.value = d;
                langReady.value = true;
                clearInterval(langRetryTimer);
                langRetryTimer = null;
            }
        } catch(e) {}
    }, 2000);
}

async function loadTranslations() {
    if (langReady.value) return true;
    for (let i = 0; i < 3; i++) {
        try {
            const d = await dpAPI('lang');
            /* "error" as a translation key is legitimate (e.g. translation for "connection error").
               The only thing that means "no translation dictionary arrived" is when the
               request failed at transport level and dpHttp returned an object that has
               its own 'error' property AND has no translation keys except possibly
               one or two. The real dictionary has many keys (over a thousand). Treat as
               valid dictionary if there are many keys, even if 'error' is present. */
            const isDict = d && typeof d === 'object' && !Array.isArray(d) && Object.keys(d).length > 20;
            if (isDict) {
                translations.value = d;
                langReady.value = true;
                if (langRetryTimer) { clearInterval(langRetryTimer); langRetryTimer = null; }
                return true;
            }
        } catch(e) {}
        if (i < 2) await new Promise(r => setTimeout(r, 400));
    }
    /* no wording yet - langReady stays false and the sign in screen stays shut */
    keepAskingLang();
    return false;
}

const app = createApp({
    setup() {
        const { authenticated, authChecking, authDenied, login, password, loginError, loginLoading } = Auth;

        const { currentPanel, sidebarOpen, sidebarMini, expandedGroups, childPanels, toggleGroup, selectPanel, selectHomePanel, toggleSidebar } = Sidebar;

        const panels = ref([]);
/* How many times each widget type is actually placed. Counted over every panel and
   inside groups as well: a widget nested in a group stands on the panel all the
   same, and stopping at the first level would under-report it. Two numbers are kept
   apart on purpose - the total over all panels, and the share of the one panel being
   edited. Editing a type changes every instance of it, so how many there are matters
   before the edit, and where those instances live matters after it. */
const widgetUsage = computed(() => {
    const total = {}, here = {};
    const walk = (list, isCurrent) => {
        (Array.isArray(list) ? list : []).forEach(w => {
            if (!w || !w.type) return;
            total[w.type] = (total[w.type] || 0) + 1;
            if (isCurrent) here[w.type] = (here[w.type] || 0) + 1;
            if (Array.isArray(w.children)) walk(w.children, isCurrent);
        });
    };
    panels.value.forEach(p => walk(p && p.widgets, p === currentPanel.value));
    return { total, here };
});
        const loading = ref(true);
        const editMode = ref(false);
        const showAddWidget = ref(false);
        const widgetSearch = ref('');
        const editWidgetForm = ref(null);
        const editWidgetIsNew = ref(false);
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
        const hasUnsavedChanges = ref(false);

        const showNotifications = ref(false);
        const notifications = ref([]);
        const unreadCount = ref(0);
        const showSettingsPanel = ref(false);
        const showWidgetEditorPanel = ref(false);
        const showHeaderPanel = ref(false);
        const showAddPanel = ref(false);
        const showAbout = ref(false);
        const showExportDialog = ref(false);
        const exportMode = ref('all');
        const showCleanupDialog = ref(false);
        const cleanupReport = ref(null);
        const cleanupBusy = ref(false);
        const exportSelectedPanel = ref('');
        const exportUsers = ref([]);
        const exportSelectedUser = ref('');
        const editPanelData = ref(null);
        const panelTab = ref('main');
        const panelError = ref('');
        const showIconPicker = ref(false);
        const iconTarget = ref('panel');
        /* the folder picker of a dir_picker field: the value stays a plain string, the
           dialog only walks the tree of the server and puts the path into that string */
        const showDirPicker = ref(false);
        const dirTarget = ref('');
        const dirPickerPath = ref('');
        const dirPickerItems = ref([]);
        const dirPickerUp = ref(null);
        const dirPickerLoading = ref(false);
        const dirPickerError = ref('');
        const dirPickerPicked = ref('');
        const iconSearch = ref('');
        const iconCategory = ref('all');
        const iconCategorySearch = ref('');
        const iconPage = ref(1);
        const iconPageSize = 63;
        const panelForm = ref({ title: '', iconType: 'icon', icon: 'fas fa-folder', iconObject: '', iconProperty: '', image: '', hideNav: false, hideHome: false, panelType: 'panel', parentGroup: 'root', dropdownNav: false, openOnClick: false, infoObject: '', infoProperty: '', infoPrefix: '', infoPostfix: '', background: false, circle: false, iconColor: 'default', showImageNav: false, individualSettings: false, showImageBg: false, bgSize: 'cover', verticalCompact: false });
        const objects = ref([]);
        const scripts = ref([]);
        const iconProperties = ref([]);
        const infoProperties = ref([]);
        const widgetProperties = ref([]);
        const bgProperties = ref([]);
        const extraProperties = ref({});
        const methodCache = reactive({});
        const user = ref({ username: '', name: '', avatar: '', is_admin: false, sessionID: '' });
        function getSessionCookie() {
            const match = document.cookie.match(/(?:^|;\s*)prj=([^;]+)/);
            return match ? decodeURIComponent(match[1]) : '';
        }
        const userMenuOpen = ref(false);
        const isAdmin = ref(false);
        const wsConnected = ref(false);
        const wsBytesReceived = ref(0);
        const wsBytesSent = ref(0);
        const wsPulse = ref(false);
        const wsStatus = ref(null);
        const wsRev = reactive({});
        const bgColorMap = reactive({});
        const settings = ref({ appTitle: '', theme: 'light', defaultPanel: '', debug: false, font: 'Roboto', hideMenu: false, hideChat: false, menuBg: '', panelBg: '', usePanelImage: true, useHeaderImage: false, cardsOpacity: 44, menuOpacity: 16, dialogOpacity: 12, primaryColor: '#1976d2', lightThemeColor: '#ffffff', darkThemeColor: '#303030', iconSize: 0, titleSize: 0, subtitleSize: 0, widgetSize: 0, grid: false, noOverlap: false, gridStep: 10, roundedWidgets: false, widgetRadius: 12, compactHeader: false, headerStatusItems: [] });

        const headerNow = ref(new Date());
        const headerTime = computed(() => headerNow.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        const headerDate = computed(() => headerNow.value.toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' }));

        const HEADER_STATUS_BUILTIN = [
            { key: 'Security', icon: 'lock' },
            { key: 'System', icon: 'system' },
            { key: 'Communication', icon: 'network' }
        ];
        const HEADER_STATUS_IMAGES = ['lock', 'system', 'network', 'health', 'megad'];
        const hsStateColors = { green: '#4caf50', yellow: '#ffc107', red: '#f44336', blue: '#03a9f4', gray: '#9e9e9e' };
        const hsStateImages = { green: true, yellow: true, red: true };
        function hsStateFromTitle(title) {
            const s = String(title || '').toLowerCase().replace('ё', 'е');
            if (s.includes('green') || s.includes('зел')) return 'green';
            if (s.includes('yellow') || s.includes('желт')) return 'yellow';
            if (s.includes('red') || s.includes('красн')) return 'red';
            if (s.includes('blue') || s.includes('син')) return 'blue';
            if (s.includes('gray') || s.includes('grey') || s.includes('сер') || s.includes('neutral')) return 'gray';
            return null;
        }
        const hdrStatusStore = reactive({});

        const headerStatusItems = computed(() => settings.value.headerStatusItems || []);
        /* Видимость индикаторов служб задаёт сам элемент "Индикаторы служб" в шапке. */
const headerStatusSectionOn = computed(() => headerHas('status'));
        const headerStatusMaxReached = computed(() => (settings.value.headerStatusItems || []).length >= 7);

        function hsParseStatus(value) {
            if (value === null || value === undefined || value === '') return null;
            if (typeof value === 'object') return value;
            try { return JSON.parse(value); } catch (e) { return null; }
        }

        function hsMapArr(item) {
            try { return JSON.parse(item && item.map || '[]'); } catch (e) { return []; }
        }

        function hsMatchColor(map, value) {
            if (!Array.isArray(map) || !map.length) return null;
            const v = parseFloat(value);
            if (isNaN(v)) return null;
            for (const e of map) {
                const lo = parseFloat(e.status);
                const hi = (e.status2 !== undefined && e.status2 !== '') ? parseFloat(e.status2) : NaN;
                if (isNaN(hi) ? (v === lo) : (v >= lo && v <= hi)) return e;
            }
            return null;
        }

        function hsVariantFromHex(hex) {
            const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
            if (!m || m[1] === 'ffffff') return 'green';
            const n = parseInt(m[1], 16);
            const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
            if (r > 150 && g > 150 && b < 140) return 'yellow';
            if (r > 150 && g < 130 && b < 150) return 'red';
            return 'green';
        }

        const headerStatusList = computed(() => {
            const list = [];
            HEADER_STATUS_BUILTIN.forEach((b) => {
                const st = hdrStatusStore['b_' + b.key];
                const raw = st && st.text != null ? String(st.text) : '';
                const state = hsStateFromTitle(raw);
                const color = state ? hsStateColors[state] : null;
                const imgOk = !!color && !!hsStateImages[state];
                list.push({ key: 'b_' + b.key, color: color || null, text: t('hs_builtin_' + b.key.toLowerCase()), title: t('hs_builtin_' + b.key.toLowerCase()), builtin: true, imgOk: imgOk, img: (imgOk ? '/img/icons/status/' + b.icon + '_32_' + state + '.png' : ''), faIcon: null });
            });
            (settings.value.headerStatusItems || []).forEach((it, idx) => {
                const st = hdrStatusStore['c_' + idx];
                const val = st && st.value != null ? st.value : '';
                const match = hsMatchColor(hsMapArr(it), val);
                const color = (match && match.color) || it.color || null;
                const text = (match && match.title) ? match.title : (val === '' ? '' : String(val));
                if (it.icon_type === 'img' && it.icon) {
                    const variant = color ? hsVariantFromHex(color) : 'green';
                    list.push({ key: 'c_' + idx, color: null, text: text, title: it.tooltip ? it.tooltip : text, builtin: false, editable: true, imgOk: true, img: '/img/icons/status/' + it.icon + '_32_' + variant + '.png' });
                } else {
                    list.push({ key: 'c_' + idx, color: color || 'rgba(255,255,255,.6)', text: text, title: it.tooltip ? it.tooltip : text, builtin: false, editable: true, imgOk: false, faIcon: it.icon || 'fas fa-circle' });
                }
            });
            return list;
        });

        async function refreshHeaderStatus() {
            if (!authenticated.value || headerStatusSectionOn.value === false) return;
            HEADER_STATUS_BUILTIN.forEach(async (b) => {
                try {
                    let raw = '';
                    let res = await dpHttp('getProperty?' + new URLSearchParams({ object: b.key, property: 'stateTitle' }));
                    raw = res && res.value != null ? res.value : '';
                    if (raw === '') {
                        res = await dpHttp('getProperty?' + new URLSearchParams({ object: b.key, property: 'status' }));
                        raw = res && res.value != null ? res.value : '';
                    }
                    if (typeof raw === 'object') {
                        const parsed = hsParseStatus(raw);
                        raw = parsed && parsed.text != null ? parsed.text : (parsed && parsed.stateDetails != null ? parsed.stateDetails : '');
                    }
                    hdrStatusStore['b_' + b.key] = { text: String(raw) };
                } catch (e) { }
            });
            (settings.value.headerStatusItems || []).forEach(async (it, idx) => {
                try {
                    let value = null;
                    if (it.source === 'scenario') {
                        if (!it.script) return;
                        const res = await dpHttp('scriptRun?' + new URLSearchParams({ script: it.script }));
                        value = (res && res.result !== undefined) ? res.result : (res && res.value);
                    } else {
                        if (!it.object) return;
                        const res = await dpHttp('getProperty?' + new URLSearchParams({ object: it.object, property: it.property || 'status' }));
                        value = res && res.value;
                        if (typeof value === 'object') {
                            const parsed = hsParseStatus(value);
                            value = parsed && parsed.value != null ? parsed.value : (parsed && parsed.stateDetails != null ? parsed.stateDetails : value);
                        }
                    }
                    hdrStatusStore['c_' + idx] = { value: value };
                } catch (e) { }
            });
        }

        function wsApplyHeaderStatus(keyLower, value) {
            const bi = HEADER_STATUS_BUILTIN.find(b => (b.key + '.statetitle') === keyLower);
            if (bi) { hdrStatusStore['b_' + bi.key] = { text: value == null ? '' : String(value) }; return; }
            (settings.value.headerStatusItems || []).forEach((it, idx) => {
                if (it.source === 'object' && it.object &&
                    (it.object + '.' + (it.property || 'status')).toLowerCase() === keyLower) {
                    hdrStatusStore['c_' + idx] = { value: value };
                }
            });
        }

        /* Значения объектов в шапке живут в headerValueTexts под ключом object.property
           в том же регистре, что и настройка, а WebSocket присылает PROPERTY в нижнем.
           Поэтому ищем по нижнему регистру, а кладём под исходным ключом - тогда
           карта остаётся единой и headerValueTextOf() ничего не теряет. */
        function wsApplyHeaderValue(keyLower, value) {
            const txt = (value === undefined || value === null) ? '' : String(value);
            headerItems.value.forEach(it => {
                if (it.t !== 'value') return;
                const k = headerValueKey(it.cfg);
                if (k && k.toLowerCase() === keyLower) headerValueTexts[k] = txt;
            });
        }

        /* The colour of «по свойству» arrives with the socket under the lower-case
           key of object.property, so the widget is found by that same key. Only a
           value that is really a colour is kept: anything else takes the widget
           back to its normal card instead of painting a status over it. */
        function wsApplyBgColor(keyLower, value) {
            (currentPanel.value?.widgets || []).forEach(w => {
                if (w.bg_mode !== 'property' || !w.bg_object) return;
                const key = (w.bg_object + '.' + (w.bg_property || 'status')).toLowerCase();
                if (key !== keyLower) return;
                const colour = dpCssColor(value);
                if (colour) bgColorMap[w.id] = colour; else delete bgColorMap[w.id];
            });
        }

        /* The socket reports only what changed after the subscription, so the value
           the panel starts with has to be asked for once. Whatever the socket has
           already seeded is used instead of a request - readProperty() in api.js
           does the same while the channel is live. */
        async function bgColorRefresh() {
            const list = (currentPanel.value?.widgets || []).filter(w => w.bg_mode === 'property');
            Object.keys(bgColorMap).forEach(id => {
                if (!list.some(w => w.id === id)) delete bgColorMap[id];
            });
            for (const w of list) {
                const object = String(w.bg_object || '').trim();
                const property = String(w.bg_property || '').trim() || 'status';
                if (!object) { delete bgColorMap[w.id]; continue; }
                const key = (object + '.' + property).toLowerCase();
                const seeded = window.__dpWsCache && window.__dpWsCache[key];
                if (seeded && seeded.seeded) {
                    const cached = dpCssColor(seeded.value);
                    if (cached) bgColorMap[w.id] = cached; else delete bgColorMap[w.id];
                    continue;
                }
                try {
                    const r = await dpAPI('getProperty?' + new URLSearchParams({ object, property }));
                    const colour = dpCssColor(r && r.value);
                    if (colour) bgColorMap[w.id] = colour; else delete bgColorMap[w.id];
                } catch (e) {
                    /* an unreachable property leaves the widget on its normal card */
                }
            }
        }

        /* The source of the colour was rewritten in the editor: the new one has to be
           read and the colour of the old one forgotten. The key changes only when the
           source itself changes, so dragging the widget does not ask for anything. */
        const propertyBgKey = computed(() => (currentPanel.value?.widgets || [])
            .filter(w => w.bg_mode === 'property')
            .map(w => w.id + ':' + w.bg_object + '.' + w.bg_property)
            .join('|'));
        watch(propertyBgKey, () => bgColorRefresh());

        const showHeaderStatusEditor = ref(false);
        const hsEditIdx = ref(-1);
        const hsProperties = ref([]);
        const hsForm = reactive({ icon_type: 'img', icon: 'lock', source: 'object', object: '', property: '', tooltip: '', script: '', color: '#22c55e', map: '[{"status":"0","color":"#ef4444"},{"status":"1","color":"#22c55e"}]' });

        function hsDefaultForm() {
            hsForm.icon_type = 'img'; hsForm.icon = 'lock'; hsForm.source = 'object';
            hsForm.object = ''; hsForm.property = ''; hsForm.tooltip = ''; hsForm.script = '';
            hsForm.color = '#22c55e';
            hsForm.map = '[{"status":"0","color":"#ef4444"},{"status":"1","color":"#22c55e"}]';
            hsProperties.value = [];
        }

        async function loadHsProperties() {
            const oid = hsForm.object;
            if (!oid) { hsProperties.value = []; return; }
            const res = await dpAPI('properties?object_id=' + encodeURIComponent(oid));
            hsProperties.value = res.items || [];
        }

        function clearHsObject() {
            hsForm.object = ''; hsForm.property = ''; hsProperties.value = [];
        }

        function hsEnsureFaIcon() {
            if (hsForm.icon_type !== 'icon') return;
            const cur = hsForm.icon || '';
            const isFa = cur.trim().split(/\s+/)[0].toLowerCase().startsWith('fa');
            if (!isFa) {
                hsForm.icon = (iconCategories && iconCategories[0] && iconCategories[0].icons && iconCategories[0].icons[0]) || 'fas fa-star';
                iconSearch.value = ''; iconCategorySearch.value = '';
                iconCategory.value = 'all'; iconPage.value = 1;
            }
        }

        watch(() => hsForm.icon_type, (val) => { if (val === 'icon') hsEnsureFaIcon(); });

        /* Редактор индикаторов служб открывается как окно, доступ к нему —
           карандаш в элементе "Индикаторы служб" настроек заголовка. */
        function openHeaderStatusEditor() {
            hsDefaultForm(); hsEditIdx.value = -1; showHeaderStatusEditor.value = true;
            hsEnsureFaIcon();
            if (!objects.value.length) loadObjects();
            if (!scripts.value.length) loadScripts();
        }

        function editHeaderStatusItem(idx) {
            const items = settings.value.headerStatusItems || [];
            const it = items[idx]; if (!it) return;
            hsForm.icon_type = it.icon_type || 'img'; hsForm.icon = it.icon || 'lock';
            hsForm.source = it.source || 'object'; hsForm.object = it.object || '';
            hsForm.property = it.property || ''; hsForm.tooltip = it.tooltip || ''; hsForm.script = it.script || '';
            hsForm.color = it.color || '#22c55e'; hsForm.map = it.map || hsForm.map;
            hsEditIdx.value = idx;
            showHeaderStatusEditor.value = true;
            hsEnsureFaIcon();
            loadHsProperties();
            if (!objects.value.length) loadObjects();
            if (!scripts.value.length) loadScripts();
        }

        function saveHeaderStatusItem() {
            if (hsForm.source === 'object' && !hsForm.object) return;
            if (hsForm.source === 'scenario' && !hsForm.script) return;
            const item = { icon_type: hsForm.icon_type, icon: hsForm.icon, source: hsForm.source, object: hsForm.object, property: hsForm.property, tooltip: hsForm.tooltip, script: hsForm.script, color: hsForm.color, map: hsForm.map };
            const items = (settings.value.headerStatusItems || []).slice();
            if (hsEditIdx.value >= 0 && items[hsEditIdx.value]) items[hsEditIdx.value] = item;
            else items.push(item);
            settings.value.headerStatusItems = items;
            settingsChanged();
            wsSubscribeProperties();
            refreshHeaderStatus();
            showHeaderStatusEditor.value = false;
        }

        function removeHeaderStatusItem(idx) {
            const items = (settings.value.headerStatusItems || []).slice();
            items.splice(idx, 1);
            settings.value.headerStatusItems = items;
            settingsChanged();
            wsSubscribeProperties();
            refreshHeaderStatus();
        }

        function openHeaderSettings() {
            showHeaderPanel.value = true;
            showSettingsPanel.value = false;
            showWidgetEditorPanel.value = false;
        }

/* ---- Шапка: состав и порядок элементов ---- */
        const HEADER_UNLIMITED = 99;
        const HEADER_ITEM_TYPES = ['navigator', 'title', 'spacer', 'divider', 'status', 'time', 'updater', 'events', 'theme', 'edit', 'panel', 'value', 'menu'];
        const HEADER_ITEM_DEFS = [
            { type: 'navigator', icon: 'fas fa-bars', key: 'hdr_item_navigator', max: 1 },
            { type: 'title', icon: 'fas fa-font', key: 'hdr_item_title', max: 1 },
            { type: 'spacer', icon: 'fas fa-arrows-alt-h', key: 'hdr_item_spacer', max: 2 },
            { type: 'divider', icon: 'fas fa-grip-lines-vertical', key: 'hdr_item_divider', max: HEADER_UNLIMITED },
            { type: 'status', icon: 'fas fa-heartbeat', key: 'hdr_item_status', max: 1 },
            { type: 'time', icon: 'far fa-clock', key: 'hdr_item_time', max: 1 },
            { type: 'updater', icon: 'fas fa-sync', key: 'hdr_item_updater', max: 1 },
            { type: 'events', icon: 'fas fa-bell', key: 'hdr_item_events', max: 1 },
            { type: 'theme', icon: 'fas fa-adjust', key: 'hdr_item_theme', max: 1 },
            { type: 'edit', icon: 'fas fa-edit', key: 'hdr_item_edit', max: 1, min: 1 },
            { type: 'panel', icon: 'fas fa-caret-square-down', key: 'hdr_item_panel', max: HEADER_UNLIMITED },
            { type: 'value', icon: 'fas fa-bold', key: 'hdr_item_value', max: HEADER_UNLIMITED },
            { type: 'link', icon: 'fas fa-link', key: 'hdr_item_link', max: HEADER_UNLIMITED },
            { type: 'menu', icon: 'far fa-user-circle', key: 'hdr_item_menu', max: 1, min: 1 }
        ];
        const HEADER_DEFAULT_ITEMS = ['navigator', 'title', 'spacer', 'status', 'divider', 'time', 'divider', 'updater', 'events', 'theme', 'edit', 'menu'];

        const headerDef = (ty) => HEADER_ITEM_DEFS.find(d => d.type === ty) || null;
        const headerMax = (ty) => { const d = headerDef(ty); return d ? (d.max || 1) : 1; };
        const headerMin = (ty) => { const d = headerDef(ty); return d ? (d.min || 0) : 0; };

        function headerItemOf(entry) {
            if (typeof entry === 'string') return { t: entry, cfg: {} };
            if (entry && typeof entry === 'object' && typeof entry.t === 'string')
                return { t: entry.t, cfg: (entry.cfg && typeof entry.cfg === 'object') ? entry.cfg : {} };
            return null;
        }
        const headerItems = computed(() => {
            const raw = settings.value.headerItems;
            const list = Array.isArray(raw) ? raw : HEADER_DEFAULT_ITEMS;
            const out = [];
            list.forEach(entry => {
                const it = headerItemOf(entry);
                if (!it) return;
                const d = headerDef(it.t);
                if (!d) return;
                if (out.filter(x => x.t === it.t).length >= headerMax(it.t)) return;
                out.push(it);
            });
            return out;
        });
        const headerHas = (ty) => headerItems.value.some(x => x.t === ty);
        const headerCount = (ty) => headerItems.value.reduce((n, x) => n + (x.t === ty ? 1 : 0), 0);
        const headerAtLimit = (ty) => headerCount(ty) >= headerMax(ty);
        const headerCanRemove = (ty) => headerCount(ty) > headerMin(ty);
        const headerInst = (ty) => {
            const out = [];
            headerItems.value.forEach((it, idx) => { if (it.t === ty) out.push({ type: it.t, key: it.t + '#' + idx, idx: idx, cfg: it.cfg }); });
            return out;
        };
        const headerSpacers = computed(() => headerItems.value.reduce((a, it, i) => { if (it.t === 'spacer') a.push(i); return a; }, []));
        const headerCenterRange = computed(() => {
            const sp = headerSpacers.value;
            if (sp.length < 2) return null;
            const first = sp[0] + 1;
            const last = sp[sp.length - 1] - 1;
            return { first: first, last: last, center: first <= last };
        });
        function headerStyleAt(idx, ty) {
            const st = { order: idx + 1 };
            const r = headerCenterRange.value;
            if (r) {
                if (ty === 'spacer') { st.display = 'none'; return st; }
                if (idx === r.first) st.marginLeft = 'auto';
                if (idx === r.last) st.marginRight = 'auto';
            }
            return st;
        }
        function headerSlotStyle(ty) {
            const idx = headerItems.value.findIndex(x => x.t === ty);
            return idx < 0 ? { order: 999 } : headerStyleAt(idx, ty);
        }
        /* Обязательные элементы (min) всегда присутствуют в заголовке, поэтому
           в меню добавления они не предлагаются. */
        const headerDefs = HEADER_ITEM_DEFS.filter(d => !(d.min > 0));
        const headerItemLabel = (ty) => t(headerDef(ty).key);
        const headerSpacerHint = computed(() => headerSpacers.value.length >= 2 ? t('hdr_spacer_hint2') : t('hdr_spacer_hint1'));
        const headerValueTexts = reactive({});
        function headerValueKey(cfg) {
            return (cfg && cfg.object && cfg.property) ? (cfg.object + '.' + cfg.property) : '';
        }
        function headerValueHint(cfg) {
            return (cfg && cfg.object) ? (cfg.object + '.' + (cfg.property || '')) : '';
        }
        function headerValueTextOf(cfg) {
            const k = headerValueKey(cfg);
            return k ? (headerValueTexts[k] || '') : '';
        }
        /* Режим показа элемента шапки: только иконка, только надпись или и то и другое */
        function headerDisplayOf(cfg, def) {
            const d = cfg && cfg.display;
            return (d === 'icon' || d === 'label' || d === 'both') ? d : (def || 'both');
        }
        function headerShowsIcon(cfg, def) { const d = headerDisplayOf(cfg, def); return d === 'icon' || d === 'both'; }
        function headerShowsLabel(cfg, def) { const d = headerDisplayOf(cfg, def); return d === 'label' || d === 'both'; }
        function headerPanelItemOf(cfg) {
            const name = cfg && cfg.name;
            if (!name) return null;
            return panels.value.find(p => p.name === name && isPanel(p)) || null;
        }
        function headerPanelHint(cfg) {
            const p = headerPanelItemOf(cfg);
            return p ? (p.title || p.name) : '';
        }
        const headerPanelSlots = computed(() => headerInst('panel').map(it => ({
            type: it.type, key: it.key, idx: it.idx, cfg: it.cfg, panel: headerPanelItemOf(it.cfg),
            showIcon: headerShowsIcon(it.cfg, 'icon'), showLabel: headerShowsLabel(it.cfg, 'icon'),
            label: headerPanelHint(it.cfg)
        })));
        const headerValueSlots = computed(() => headerInst('value').map(it => ({
            type: it.type, key: it.key, idx: it.idx, cfg: it.cfg,
            text: headerValueTextOf(it.cfg), hint: headerValueHint(it.cfg)
        })));
        function headerItemsWrite(list, save) {
            settings.value.headerItems = list;
            if (save !== false) settingsChanged();
            /* Состав объектов в шапке изменился - сервер должен начать слать
               и эти свойства, иначе значения в шапке застынут. */
            wsSubscribeProperties();
        }
        /* target < 0 - это новый элемент, его надо добавить в конец; иначе
           обновляется существующий. Одна точка записи для всех трёх диалогов:
           проверка лимита и запись в настройки не должны разойтись. */
        function headerItemPut(target, ty, cfg) {
            const list = headerItems.value.slice();
            if (target < 0) {
                if (headerAtLimit(ty)) return false;
                list.push({ t: ty, cfg: cfg });
            } else {
                const it = list[target];
                if (!it || it.t !== ty) return false;
                it.cfg = cfg;
            }
            headerItemsWrite(list);
            return true;
        }
        function headerMigrateLegacy() {
            const list = headerItems.value.slice();
            let touched = false;
            const legacyPanel = settings.value.headerPanel;
            if (legacyPanel) {
                const it = list.find(x => x.t === 'panel');
                if (it && !it.cfg.name) { it.cfg.name = legacyPanel; touched = true; }
                delete settings.value.headerPanel;
            }
            const legacyValue = settings.value.headerValue;
            if (legacyValue && legacyValue.object) {
                const it = list.find(x => x.t === 'value');
                if (it && !it.cfg.object) { it.cfg.object = legacyValue.object; it.cfg.property = legacyValue.property || ''; touched = true; }
                delete settings.value.headerValue;
            }
            /* Разделители вокруг часов раньше были частью блоков "Статус служб" и
               "Время". Теперь это обычные элементы шапки, поэтому ставим их один раз
               при загрузке; флаг нужен, чтобы потом их можно было свободно удалить. */
            if (!settings.value.headerDividersAroundTime) {
                const ti = list.findIndex(x => x.t === 'time');
                if (ti >= 0) {
                    const hasBefore = ti > 0 && list[ti - 1].t === 'divider';
                    const hasAfter = ti + 1 < list.length && list[ti + 1].t === 'divider';
                    if (!hasBefore) list.splice(ti, 0, { t: 'divider', cfg: {} });
                    if (!hasAfter) list.splice(ti + (hasBefore ? 1 : 2), 0, { t: 'divider', cfg: {} });
                }
                settings.value.headerDividersAroundTime = true;
                touched = true;
            }
            if (touched) headerItemsWrite(list, false);
        }

const headerAddOpen = ref(false);
const headerDragIndex = ref(-1);
        const headerValueOpen = ref(false);
        const headerValueProps = ref([]);
        const headerValueTarget = ref(-1);
        const headerValueForm = reactive({ object: '', property: '' });

        function headerItemAdd(ty) {
            if (!headerDef(ty) || headerAtLimit(ty)) return;
            headerAddOpen.value = false;
            /* Ссылка, значение объекта и выбор панели без своих значений ничего не
               показывают, поэтому сначала диалог, и только «Сохранить» кладёт
               элемент в шапку: «Отмена» не должна оставлять после себя запись. */
            if (ty === 'value') { openHeaderValueDialog(-1); return; }
            if (ty === 'link') { openHeaderLinkDialog(-1); return; }
            if (ty === 'panel') { openHeaderPanelDialog(-1); return; }
            const list = headerItems.value.slice();
            list.push({ t: ty, cfg: {} });
            headerItemsWrite(list);
        }

        function headerItemRemove(idx) {
            const list = headerItems.value.slice();
            const it = list[idx];
            if (!it || !headerCanRemove(it.t)) return;
            list.splice(idx, 1);
            headerItemsWrite(list);
        }

        function headerItemsClear() {
            const keep = HEADER_ITEM_DEFS.filter(d => (d.min || 0) > 0).map(d => d.type);
            headerItemsWrite(keep.map(t => ({ t: t, cfg: {} })));
        }

        function headerItemsDefaults() {
            headerItemsWrite(HEADER_DEFAULT_ITEMS.map(t => ({ t: t, cfg: {} })));
        }

        function headerDragStart(idx) { headerDragIndex.value = idx; }

        function headerDragOver(idx) {
            const from = headerDragIndex.value;
            if (from < 0 || idx === from) return;
            const list = headerItems.value.slice();
            const [moved] = list.splice(from, 1);
            list.splice(idx, 0, moved);
            settings.value.headerItems = list;
            headerDragIndex.value = idx;
        }

        function headerDragEnd() {
            headerDragIndex.value = -1;
            settingsChanged();
        }

        function openHeaderValueDialog(idx) {
            const it = (idx >= 0) ? headerItems.value[idx] : null;
            headerValueTarget.value = idx;
            const cfg = (it && it.cfg) || {};
            headerValueForm.object = cfg.object || '';
            headerValueForm.property = cfg.property || '';
            headerValueProps.value = [];
            headerValueOpen.value = true;
            if (!objects.value.length) loadObjects();
            if (headerValueForm.object) headerValueLoadProps();
        }

        async function headerValueLoadProps() {
            if (!headerValueForm.object) { headerValueProps.value = []; return; }
            const res = await dpAPI('properties?object_id=' + encodeURIComponent(headerValueForm.object));
            headerValueProps.value = res.items || [];
        }

        function headerValueCanSave() {
            return !!headerValueForm.object && !!headerValueForm.property;
        }
        function headerValueSave() {
            if (!headerValueCanSave()) return;
            const cfg = { object: headerValueForm.object, property: headerValueForm.property };
            if (!headerItemPut(headerValueTarget.value, 'value', cfg)) return;
            headerValueOpen.value = false;
            headerValueRefresh();
        }

        async function headerValueRefresh() {
            const wanted = new Map();
            headerItems.value.forEach(it => {
                if (it.t !== 'value') return;
                const key = headerValueKey(it.cfg);
                if (!key || wanted.has(key)) return;
                wanted.set(key, it.cfg);
            });
            Object.keys(headerValueTexts).forEach(k => { if (!wanted.has(k)) delete headerValueTexts[k]; });
            for (const key of Array.from(wanted.keys())) {
                const cfg = wanted.get(key);
                try {
                    const r = await dpAPI('getProperty?object=' + encodeURIComponent(cfg.object) + '&property=' + encodeURIComponent(cfg.property));
                    headerValueTexts[key] = (r && r.value !== undefined && r.value !== null) ? String(r.value) : '';
                } catch (e) {
                    headerValueTexts[key] = '';
                }
            }
        }

/* ---- Шапка: ссылка ---- */
/* Адрес приходит от человека, поэтому приводим его к виду, который можно
   безопасно отдать в iframe или в window.open. Схему дописываем, если её нет,
   но всё, что не http/https (javascript:, data:, file:), отбрасываем - иначе
   в сохранённых настройках окажется код, который выполнится при клике. */
function headerLinkNormalize(raw) {
    let s = String(raw == null ? '' : raw).trim();
    if (!s) return '';
    if (s.startsWith('//')) return 'https:' + s;
    if (/^https?:\/\//i.test(s)) return s;
    if (/^[a-z][a-z0-9+.\-]*:/i.test(s)) return '';
    if (s.startsWith('/')) return window.location.origin + s;
    return 'https://' + s;
}
/* Адрес панели-страницы храним дружелюбно: путь /index.html остаётся путём,
   а хост при открытии подставляется из текущего адреса, поэтому ссылка не
   устаревает при смене IP. Абсолютную внешнюю ссылку сохраняем как есть,
   всё опасное (javascript:, data:, file:) по-прежнему не проходит. */
function panelUrlToSave(raw) {
    const s = String(raw == null ? '' : raw).trim();
    if (!s) return '';
    if (/^[a-z][a-z0-9+.\-]*:/i.test(s) && !/^https?:\/\//i.test(s)) return '';
    if (/^https?:\/\//i.test(s)) {
        return s.startsWith(window.location.origin) ? (s.slice(window.location.origin.length) || '/') : s;
    }
    return s;
}
/* Старый сохранённый адрес может уже нести на себе хост - при показе в форме
   его снимаем, чтобы не прибивать IP к полю ввода. */
function panelUrlToForm(u) {
    const s = String(u == null ? '' : u).trim();
    if (!s) return '';
    return s.startsWith(window.location.origin) ? (s.slice(window.location.origin.length) || '/') : s;
}
function headerLinkUrl(cfg) { return (cfg && typeof cfg.url === 'string') ? cfg.url : ''; }
function headerLinkTitle(cfg) { return (cfg && cfg.title) ? cfg.title : headerLinkUrl(cfg); }
function headerLinkMode(cfg) { return (cfg && cfg.mode === 'window') ? 'window' : 'panel'; }
function headerLinkHint(cfg) {
    const u = headerLinkUrl(cfg);
    return u ? (headerLinkTitle(cfg) + ' - ' + u) : '';
}
/* Значок ссылки в шапке - как у панели в меню: своя картинка или иконка Font Awesome.
   Картинка/иконка берётся из cfg ссылки, иначе из текущей панели, иначе из заголовка. */
const HEADER_LINK_FALLBACK_ICON = 'fas fa-link';
function headerLinkThumb(cfg) {
    const c = (cfg && typeof cfg === 'object') ? cfg : {};
    const cur = currentPanel.value;
    if (c.image) return { image: c.image, icon: '' };
    if (c.icon) return { image: '', icon: c.icon };
    if (cur && cur.image) return { image: cur.image, icon: '' };
    return { image: '', icon: (cur && cur.icon) || HEADER_LINK_FALLBACK_ICON };
}
const headerLinkSlots = computed(() => headerInst('link').map(it => {
    const th = headerLinkThumb(it.cfg);
    return {
        type: it.type, key: it.key, idx: it.idx, cfg: it.cfg,
        url: headerLinkUrl(it.cfg), label: headerLinkTitle(it.cfg),
        image: th.image, icon: th.icon,
        showIcon: headerShowsIcon(it.cfg, 'icon'), showLabel: headerShowsLabel(it.cfg, 'icon'),
        shape: headerLinkShapeOf(it.cfg)
    };
}));
/* Режим "в области панели" показывает адрес в основной области под шапкой,
   поэтому дашборд и меню остаются на месте. */
const linkView = ref(null);
function headerLinkGo(inst) {
    if (!inst) return;
    const u = headerLinkUrl(inst && inst.cfg);
    if (!u) { openHeaderLinkDialog(inst ? inst.idx : -1); return; }
    if (headerLinkMode(inst.cfg) === 'window') { window.open(u, '_blank', 'noopener'); return; }
    linkView.value = { url: u, title: headerLinkTitle(inst.cfg) };
    sidebarOpen.value = false;
}
function closeLinkView() { linkView.value = null; localStorage.removeItem('dp_lastUrl'); }
const headerLinkOpen = ref(false);
const headerLinkTarget = ref(-1);
const headerLinkForm = reactive({ title: '', url: '', mode: 'panel', display: 'icon', icon: '', image: '', shape: 'none' });
/* Форма значка хранится строкой: none (без фона), square, circle.
   Старые записи хранили булево cfg.circle - без shape их надо читать
   как circle/square, иначе значок у всех старых ссычек потерял бы вид. */
function headerLinkShapeOf(cfg) {
    const s = cfg && cfg.shape;
    if (s === 'none' || s === 'square' || s === 'circle') return s;
    return (cfg && cfg.circle) ? 'circle' : 'square';
}
function openHeaderLinkDialog(idx) {
    const it = (idx >= 0) ? headerItems.value[idx] : null;
    headerLinkTarget.value = idx;
    headerLinkForm.title = (it && it.cfg && it.cfg.title) || '';
    headerLinkForm.url = headerLinkUrl(it && it.cfg);
    headerLinkForm.mode = headerLinkMode(it && it.cfg);
    headerLinkForm.display = headerDisplayOf(it && it.cfg, 'icon');
    headerLinkForm.icon = (it && it.cfg && it.cfg.icon) || '';
    headerLinkForm.image = (it && it.cfg && it.cfg.image) || '';
    headerLinkForm.shape = headerLinkShapeOf(it && it.cfg);
    headerLinkOpen.value = true;
}
function headerLinkCanSave() {
    return !!headerLinkNormalize(headerLinkForm.url);
}
function headerLinkSave() {
    const url = headerLinkNormalize(headerLinkForm.url);
    if (!url) return;
    const cfg = {
        title: headerLinkForm.title.trim(), url: url,
        mode: headerLinkMode(headerLinkForm), display: headerLinkForm.display,
        icon: headerLinkForm.icon.trim(), image: headerLinkForm.image.trim(),
        shape: headerLinkForm.shape
    };
    if (!headerItemPut(headerLinkTarget.value, 'link', cfg)) return;
    headerLinkOpen.value = false;
    headerLinkForm.url = url;
    /* Открытая в панели ссылка показывает старый адрес - закрываем её. */
    if (linkView.value && linkView.value.url !== url) closeLinkView();
}

/* ---- Шапка: выбор панели (по образцу значения объекта) ---- */
const headerPanelList = computed(() => panels.value.filter(p => isPanel(p) && !p.hideNav));
const headerPanelOpen = ref(false);
const headerPanelTarget = ref(-1);
const headerPanelForm = reactive({ name: '', display: 'icon' });
function openHeaderPanelDialog(idx) {
    const it = (idx >= 0) ? headerItems.value[idx] : null;
    headerPanelTarget.value = idx;
    headerPanelForm.name = (it && it.cfg && it.cfg.name) || '';
    headerPanelForm.display = headerDisplayOf(it && it.cfg, 'icon');
    headerPanelOpen.value = true;
}
function headerPanelGo(inst) {
    if (!inst) return;
    const cfg = (inst && inst.cfg) || {};
    const p = headerPanelItemOf(cfg);
    if (!p) { openHeaderPanelDialog(inst.idx); return; }
    selectPanel(p);
    sidebarOpen.value = false;
}
function headerPanelCanSave() {
    return !!headerPanelForm.name;
}
function headerPanelSave() {
    if (!headerPanelCanSave()) return;
    const cfg = { name: headerPanelForm.name, display: headerPanelForm.display };
    if (!headerItemPut(headerPanelTarget.value, 'panel', cfg)) return;
    headerPanelOpen.value = false;
}

        const filteredDefs = computed(() => {
            const q = widgetSearch.value.trim().toLowerCase();
            const list = widgetDefs.value.filter(d => d.enabled !== 0);
            if (!q) return list;
            return list.filter(d => {
                const haystack = [widgetName(d), (t('widget_' + d.type + '_desc') !== 'widget_' + d.type + '_desc' ? t('widget_' + d.type + '_desc') : ''), d.type]
                    .map(s => String(s || '').toLowerCase());
                return haystack.some(s => s.includes(q));
            });
        });

        
        function getWidgetFields(type, tab) {
            if (typeof W === 'undefined' || !W.fields) return [];
            const comp = getWidgetComponent(type);
            const component = (comp && comp.fields && comp.fields[tab]) || [];
            const common = (W.fields._common && W.fields._common[tab]) || [];
            const all = tab === 'position' ? common : common.concat(component);
            const seen = new Set();
            const list = all.filter(f => {
                const key = f.key || f.type;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
            /* A list of options written into the file always starts on its first entry:
               an empty value would show the «— выберите —» placeholder instead of a
               real choice, while the first entry is the one the widget works with
               anyway - «По умолчанию» for the background. The widget's own defaults
               are spread over this later and still win. A list that is built after
               the panel loads (a camera, a property, a script) has nothing to
               preselect yet, so such a field keeps its empty entry and stays out. */
            list.forEach(f => {
                if (f.default === undefined && Array.isArray(f.options) && f.options.length &&
                    f.options[0] && f.options[0].value !== undefined) {
                    f.default = f.options[0].value;
                }
            });
            return list;
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

        function getColumnFieldRows() {
            const rows = [];
            let cur = [], curRow = null;
            for (const f of columnFields) {
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
                if (tab.key === 'columns' || tab.key === 'widgets' || tab.key === 'graphs' || tab.key === 'colors' || tab.key === 'items' || tab.key === 'slides' || tab.key === 'statuses' || tab.key === 'template') return true;
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
            const form = editWidgetForm.value;
            /* every key of showIf has to hold, so a field can wait for more than one
               pick: it is only relevant for one device type and one write mode at once */
            return Object.keys(field.showIf).every(depKey => {
                const depVal = field.showIf[depKey];
                const val = form[depKey];
                return Array.isArray(depVal) ? depVal.includes(val) : val === depVal;
            });
        }

        /* the object a property is read from. A method carries its own object in the same
           value, so it needs no pair - every other property lives in a named field. */
        function objectKeyOfField(key) {
            if (!key) return null;
            if (key === 'property') return 'object';
            if (key === 'icon_property') return 'icon_object';
            if (key === 'bg_property') return 'bg_object';
            if (key === 'property_info') return 'object_info';
            if (key === 'state_property') return 'state_object';
            if (key.startsWith('property_')) return 'object_' + key.slice('property_'.length);
            return null;
        }
        function getFieldOptions(field) {
            if (field.type === 'property') {
                if (field.key === 'icon_property') return iconProperties.value;
                if (field.key === 'bg_property') return bgProperties.value;
                if (field.key === 'property_info') return infoProperties.value;
                const objKey = objectKeyOfField(field.key);
                if (objKey && objKey !== 'object') return extraProperties.value[objKey] || [];
            }
            return widgetProperties.value;
        }

        const g2rCameraOptions = ref([]);
        async function loadGo2rtcCameras() {
            const host = String((editWidgetForm.value || {}).host || '').trim();
            g2rCameraOptions.value = [];
            if (!host) return;
            const base = /^https?:\/\//i.test(host) ? host : 'http://' + host;
            try {
                const res = await fetch(base.replace(/\/+$/, '') + '/api/streams');
                if (!res.ok) return;
                const data = await res.json();
                let names = [];
                if (data && typeof data === 'object' && !Array.isArray(data)) {
                    names = Object.keys(data).filter(k => data[k] && typeof data[k] === 'object');
                } else if (Array.isArray(data)) {
                    names = data.map(d => (d && typeof d === 'object' && d.name) ? String(d.name) : String(d));
                }
                g2rCameraOptions.value = names.map(n => ({ value: n, label: n }));
            } catch (e) { g2rCameraOptions.value = []; }
        }
        function hasGo2rtcField() {
            const f = (editWidgetForm.value || {});
            const def = widgetDefs.value.find(d => d.type === f.type);
            if (!def || !def.fields) return false;
            const all = [];
            for (const fs of Object.values(def.fields)) all.push(...(fs || []));
            return all.some(x => x.go2rtc === true);
        }
        watch(() => (editWidgetForm.value || {}).host, () => {
            if (hasGo2rtcField()) loadGo2rtcCameras();
        });

        
        function itemLabel(item) {
            if (!item) return '';
            const desc = item.DESCRIPTION ? item.DESCRIPTION.replace(/\n/g, ' ').trim() : '';
            return desc ? item.TITLE + ' - ' + desc : item.TITLE;
        }

        /* A method field holds one address: "Object/Method". A value with no slash is the
           method itself - that is how a default is written, before an object is picked - so
           its object part is empty and the method name is not lost. A value that ends with a
           slash is an object whose method is not chosen yet: the object has to stay in the
           field, the list of its methods is built from it. */
        function getMethodObj(val) { const s = String(val == null ? '' : val); const i = s.indexOf('/'); return i < 0 ? '' : s.slice(0, i); }
        function getMethodName(val) { const s = String(val == null ? '' : val); const i = s.indexOf('/'); return i < 0 ? s : s.slice(i + 1); }
        function setMethodField(key, partVal, isObj) {
            const cur = editWidgetForm.value[key] || '';
            const obj = isObj ? partVal : getMethodObj(cur);
            let method = isObj ? getMethodName(cur) : partVal;
            /* the default of a method waits for its object: the list of methods is built from
               the object, so the field keeps the "default" placeholder until one is chosen */
            if (isObj && !method && pendingFieldDefaults[key]) method = pendingFieldDefaults[key];
            const both = obj && method;
            /* an address is written whole: the object alone keeps its slash, so a bare
               value always stays readable as the method it names */
            editWidgetForm.value[key] = both ? obj + '/' + method : (isObj ? (obj ? obj + '/' : method) : (obj ? obj + '/' : ''));
        }
        /* the defaults of the fields whose value is only readable once an object is chosen */
        let pendingFieldDefaults = {};
        function takePendingFieldDefault(key) {
            const d = pendingFieldDefaults[key];
            delete pendingFieldDefaults[key];
            return d;
        }
        function applyPendingObjectFields(objKey) {
            const f = editWidgetForm.value;
            if (!f || !objKey || !f[objKey]) return;
            for (const key of Object.keys(pendingFieldDefaults)) {
                if (objectKeyOfField(key) !== objKey) continue;
                /* a field the user filled, or cleared on purpose, never takes the default */
                if (f[key] !== '' && f[key] !== undefined && f[key] !== null) { delete pendingFieldDefaults[key]; continue; }
                f[key] = takePendingFieldDefault(key);
            }
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
            cols.push({ info: '', data_name: '', align: 'start', width: '', sortable: true, separator: false, data_type: 'string', color_column: '', pre: '', pos: '', icon_value: '', striped: false, rounded: false });
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
        async function autoDetectColumns() {
            const query = (editWidgetForm.value?.query || '').trim();
            if (!query) return;
            try {
                const d = await dpAPI('query?' + new URLSearchParams({ query }));
                if (!d || d.error || !Array.isArray(d.data) || !d.data.length) return;
                const keys = Object.keys(d.data[0]);
                const cols = keys.map(k => ({ info: k, data_name: k, align: 'start', width: '', sortable: true, separator: false, data_type: 'string', color_column: '', pre: '', pos: '', icon_value: '', striped: false, rounded: false }));
                setColumns(cols);
                columnIdx.value = 0;
            } catch(e) {}
        }

        // ---- Series editing for graph widget ----
        const seriesIdx = ref(0);
        const seriesScaleOptions = [{ value: 'left', label: 'opt_scale_left' }, { value: 'right', label: 'opt_scale_right' }, { value: 'none', label: 'opt_scale_none' }, { value: 'last', label: 'opt_scale_last' }];
        const seriesList = computed(() => {
            try { return JSON.parse(editWidgetForm.value?.series || '[]'); }
            catch { return []; }
        });
        const seriesProps = ref({});

        function setSeries(arr) {
            editWidgetForm.value.series = JSON.stringify(arr);
        }

        function fixtureSeries() {
            return { key: 's' + Date.now() + '_' + Math.floor(Math.random() * 1000), title: '', object: '', color: '#42a5f5', fill: false, steppedLine: false, scale: 'left', round: 0 };
        }

        function addSeries() {
            const arr = seriesList.value;
            arr.push(fixtureSeries());
            setSeries(arr);
            seriesIdx.value = arr.length - 1;
        }
        function removeSeries(idx) {
            const arr = seriesList.value;
            arr.splice(idx, 1);
            setSeries(arr);
            if (seriesIdx.value >= arr.length) seriesIdx.value = Math.max(0, arr.length - 1);
        }
        function setSeriesField(idx, key, val) {
            const arr = seriesList.value;
            if (arr[idx]) arr[idx][key] = val;
            setSeries(arr);
        }
        async function loadSeriesProps(idx, obj) {
            if (!obj) { seriesProps.value = { ...seriesProps.value, [idx]: [] }; return; }
            const res = await dpAPI('properties?object_id=' + encodeURIComponent(obj));
            seriesProps.value = { ...seriesProps.value, [idx]: res.items || [] };
        }

        // ---- Slide list editing for slideshow widget ----
        const slidesIdx = ref(0);
        const slidesList = computed(() => {
            try { const p = JSON.parse(editWidgetForm.value?.slides || '[]'); return Array.isArray(p) ? p : []; }
            catch { return []; }
        });
        function setSlides(arr) {
            editWidgetForm.value.slides = JSON.stringify(arr);
        }
        function addSlide() {
            const arr = slidesList.value;
            arr.push({ key: 'i' + Date.now() + '_' + Math.floor(Math.random() * 1000), title: '', src: '' });
            setSlides(arr);
            slidesIdx.value = arr.length - 1;
        }
        function removeSlide(idx) {
            const arr = slidesList.value;
            arr.splice(idx, 1);
            setSlides(arr);
            if (slidesIdx.value >= arr.length) slidesIdx.value = Math.max(0, arr.length - 1);
        }
        function setSlideField(idx, key, val) {
            const arr = slidesList.value;
            if (arr[idx]) arr[idx][key] = val;
            setSlides(arr);
        }
        function moveSlide(idx, dir) {
            const arr = slidesList.value;
            const to = idx + dir;
            if (idx < 0 || idx >= arr.length || to < 0 || to >= arr.length) return;
            const cur = slidesIdx.value;
            arr.splice(to, 0, arr.splice(idx, 1)[0]);
            setSlides(arr);
            slidesIdx.value = cur === idx ? to : (cur === to ? idx : cur);
        }

        // ---- Select widget items editing ----
        const selectItems = computed(() => {
            try { return JSON.parse(editWidgetForm.value?.items || '[]'); }
            catch { return []; }
        });
        function setSelectItems(arr) {
            editWidgetForm.value.items = JSON.stringify(arr);
        }
        function fixtureSelectItem() {
            return { key: 's' + Date.now() + '_' + Math.floor(Math.random() * 1000), state: '', title: '', icon: '' };
        }
        function addSelectItem() {
            const arr = selectItems.value;
            arr.push(fixtureSelectItem());
            setSelectItems(arr);
        }
        function removeSelectItem(idx) {
            const arr = selectItems.value;
            arr.splice(idx, 1);
            setSelectItems(arr);
        }
        function setSelectItemField(idx, key, val) {
            const arr = selectItems.value;
            if (arr[idx]) arr[idx][key] = val;
            setSelectItems(arr);
        }

        // ---- Status widget statuses editing ----
        const statusItems = computed(() => {
            const raw = editWidgetForm.value?.statuses;
            const arr = typeof raw === 'string' ? (() => { try { return JSON.parse(raw || '[]'); } catch { return []; } })() : raw;
            return Array.isArray(arr) ? arr : [];
        });
        function setStatusItems(arr) {
            editWidgetForm.value.statuses = JSON.stringify(arr);
        }
        function fixtureStatusItem() {
            return { key: 'st' + Date.now() + '_' + Math.floor(Math.random() * 1000), status: '', status2: '', title: '', icon: '', color: '#ffffff', exec_type: 'empty', method: '', script: '', exec_param: '' };
        }
        function addStatusItem() {
            const arr = statusItems.value;
            arr.push(fixtureStatusItem());
            setStatusItems(arr);
        }
        function removeStatusItem(idx) {
            const arr = statusItems.value;
            arr.splice(idx, 1);
            setStatusItems(arr);
        }
        function setStatusItemField(idx, key, val) {
            const arr = statusItems.value;
            if (arr[idx]) arr[idx][key] = val;
            setStatusItems(arr);
        }
        function moveStatusItem(idx, dir) {
            const arr = statusItems.value;
            const to = idx + dir;
            if (to < 0 || to >= arr.length) return;
            const [it] = arr.splice(idx, 1);
            arr.splice(to, 0, it);
            setStatusItems(arr);
        }
        function stMethodObj(item) { return item && item.method ? String(item.method).split('/')[0] : ''; }
        function stMethods(idx) {
            const obj = stMethodObj(statusItems.value[idx]);
            if (obj && !methodCache[obj]) loadObjectMethods(obj);
            return methodCache[obj] || [];
        }
        function setStatusMethod(idx, partVal, isObj) {
            const cur = statusItems.value[idx]?.method || '';
            const obj = isObj ? partVal : stMethodObj({ method: cur });
            const mth = isObj ? (String(cur).split('/')[1] || '') : partVal;
            setStatusItemField(idx, 'method', obj && mth ? obj + '/' + mth : (obj || mth));
        }

        const columnFields = [
            { key: 'info', label: 'field_info' },
            { key: 'data_name', label: 'field_column_name' },
            { key: 'align', label: 'field_align', type: 'select', options: [
                { value: 'start', title: 'Left', label: 'opt_align_start' },
                { value: 'center', title: 'Center', label: 'opt_align_center' },
                { value: 'end', title: 'Right', label: 'opt_align_end' },
            ]},
            { key: 'width', label: 'field_width' },
            { key: 'sortable', label: 'field_sortable', type: 'switch' },
            { key: 'separator', label: 'field_separator', type: 'switch' },
            { key: 'data_type', label: 'field_data_type', type: 'select', options: [
                { value: 'string', title: 'String' },
                { value: 'checkbox', title: 'Checkbox' },
                { value: 'chip', title: 'Chip' },
                { value: 'icon', title: 'Icon' },
                { value: 'progressbar', title: 'Progressbar' },
                { value: 'button', title: 'Button' },
            ]},
            { key: 'pre', label: 'field_pre', row: 'pre_pos', showIf: { data_type: ['string', 'chip', 'progressbar'] } },
            { key: 'pos', label: 'field_pos', row: 'pre_pos', showIf: { data_type: ['string', 'chip', 'progressbar'] } },
            { key: 'icon_value', label: 'field_icon_value', showIf: { data_type: 'button' } },
            { key: 'color_column', label: 'field_color_column', showIf: { data_type: ['chip', 'icon', 'progressbar', 'button'] } },
            { key: 'striped', label: 'field_striped', type: 'switch', showIf: { data_type: 'progressbar' } },
            { key: 'rounded', label: 'field_rounded', type: 'switch', showIf: { data_type: 'progressbar' } },
        ];

        function columnFieldVisible(col, field) {
            if (!col || !field || !field.showIf) return true;
            const [depKey, depVal] = Object.entries(field.showIf)[0];
            const val = col[depKey];
            return Array.isArray(depVal) ? depVal.includes(val) : val === depVal;
        }

        /* своё закругление виджета: сначала поле настроек, у виджета визуального
           конструктора радиус лежит в его макете. ноль или пусто — значит своего
           значения нет и тогда берётся радиус из общих настроек */
        function ownWidgetRadius(w) {
            const own = Number(w && w.radius);
            if (own > 0) return own;
            const model = window.DpBuilderModels && w && window.DpBuilderModels[w.type];
            const modelRadius = Number(model && model.appearance && model.appearance.radius);
            return modelRadius > 0 ? modelRadius : 0;
        }

        function widgetBgStyle(w) {
            const s = {};
            const mode = w.bg_mode || (w.color ? 'color' : 'default');
            /* The card sits on top of the wrapper and washes it with the theme colour,
               so whatever is painted here has to be seen through it: the card gives
               way for this one widget. Widgets that paint their own card with the same
               colour are not affected - the two layers then simply agree. */
            if (mode === 'color' && w.color) {
                s.backgroundColor = w.color;
                s['--card-alpha'] = 0;
            } else if (mode === 'image' && w.bg_image) {
                const url = dpCssUrl(w.bg_image);
                if (url) {
                    s.backgroundImage = 'url(' + url + ')';
                    s.backgroundSize = 'cover';
                    s.backgroundPosition = 'center';
                    s.backgroundRepeat = 'no-repeat';
                    s.backgroundColor = 'transparent';
                    s['--card-alpha'] = 0;
                }
            } else if (mode === 'property') {
                const bgVal = bgColorMap[w.id];
                if (bgVal) {
                    s.backgroundColor = bgVal;
                    s['--card-alpha'] = 0;
                }
            }
            /* выключатель закругления выключен — радиус остаётся нулём принудительно,
               даже если он прописан в самом виджете */
            let radius = 0;
            if (settings.value.roundedWidgets) {
                /* приоритет: своё значение виджета, иначе общее; 0 или пусто — как есть.
                   значение только передаётся в переменную: встроенные карточки
                   берут его из .widget-v-card, а у самописных виджетов своё
                   закругление в разметке — обрезкой обёртки его перебивать нельзя */
                const own = ownWidgetRadius(w);
                const gen = Number(settings.value.widgetRadius);
                radius = own > 0 ? own : (gen > 0 ? gen : 0);
            }
            s['--wpb-radius'] = radius + 'px';
            /* The wrapper is a plain rectangle: painted straight, its colour or its
               picture fills the corners the rounded card leaves empty and a rounded
               widget reads as a square one. The card keeps taking the radius from
               the variable above - the two only have to be the same number. */
            s.borderRadius = radius + 'px';
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
                const wrap = el.parentElement;
                if (wrap && wrap.scrollWidth > wrap.clientWidth) {
                    const wr = wrap.getBoundingClientRect();
                    if (ar.left < wr.left) wrap.scrollLeft -= (wr.left - ar.left) + 8;
                    else if (ar.right > wr.right) wrap.scrollLeft += (ar.right - wr.right) + 8;
                }
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

        watch(widgetTab, () => {
            nextTick(updateWidgetTabSlider);
        });
        watch(panelTab, () => nextTick(updatePanelTabSlider));

        const plusTooltip = computed(() => {
            /* Открытая страница по адресу не содержит виджетов: клик по <+>
               уводит на домашний экран, где добавляется панель, поэтому
               подпись должна совпадать с этим, а не звать виджеты. */
            if (linkView.value || !isPanel(currentPanel.value)) {
                return t('add_panel');
            }
            return t('add_widget');
        });

        function addPlusButton() {
            /* Пока открыт адрес в области, виджеты добавлять некуда: кнопка «+»
               в шапке должна вести в панель, а не открывать список виджетов. */
            if (linkView.value) { goHome(); return; }
            if (!isPanel(currentPanel.value)) {
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

        function injectVoiceScript(src) {
            if (!src) return;
            if (document.querySelector('script[src^="' + src.split('?')[0] + '"]')) return;
            const s = document.createElement('script');
            s.src = src;
            document.body.appendChild(s);
        }

        async function loadVoiceScripts() {
            let d;
            try { d = await dpAPI('voiceScripts'); } catch (e) { return; }
            if (!d || d.error) return;
            if (d.vosk && d.vosk.src) {
                if (!window.VOSK_CONFIG) {
                    const cfg = document.createElement('script');
                    cfg.textContent = 'window.VOSK_CONFIG=window.VOSK_CONFIG||{};'
                        + 'window.VOSK_CONFIG.triggerPhrases=' + JSON.stringify(d.vosk.triggerPhrases || []) + ';'
                        + 'window.VOSK_CONFIG.apiUrl=' + JSON.stringify(d.vosk.apiUrl || '/api.php/module/vosk/') + ';';
                    document.body.appendChild(cfg);
                }
                injectVoiceScript(d.vosk.src);
            }
            if (d.piper_tts && d.piper_tts.src && window.top === window.self) {
                injectVoiceScript(d.piper_tts.src);
            }
        }

        async function initAuth() {
            await Auth.checkAuth(async (res) => {
                authenticated.value = true;
                user.value = { username: res.username, name: res.name || res.username, avatar: res.avatar || '', is_admin: res.is_admin || false, sessionID: res.sessionID || getSessionCookie() };
                isAdmin.value = user.value.is_admin;
                if (!isAdmin.value) editMode.value = false;
                await loadData();
                checkNotifications();
                loadVoiceScripts();
            });
        }

        async function doLogin() {
            await Auth.doLogin(async (res) => {
                authenticated.value = true;
                user.value = { username: res.username, name: res.name || res.username, avatar: res.avatar || '', is_admin: res.is_admin || false, sessionID: res.sessionID || getSessionCookie() };
                isAdmin.value = user.value.is_admin;
                if (!isAdmin.value) editMode.value = false;
                await loadData();
                checkNotifications();
                loadVoiceScripts();
            });
        }

        function doLogout() {
            Auth.doLogout();
            panels.value = [];
            currentPanel.value = null;
            user.value = { username: '', name: '', avatar: '', is_admin: false, sessionID: '' };
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

        /* The file of a widget is cached under its url, and installing an archive replaces
           that file without changing the url. With one fixed number behind "?v=" the browser
           kept handing out the previous version of the widget, so a fix in an archive never
           reached the panel. The token changes on every install, and the base follows the
           module, so a module update also refreshes the widgets. */
        const WIDGET_TOKEN_KEY = 'dp_widget_token';
        const WIDGET_TOKEN_BASE = 238;
        function widgetToken() {
            let token = 0;
            try { token = parseInt(localStorage.getItem(WIDGET_TOKEN_KEY) || '0', 10) || 0; } catch (e) { token = 0; }
            /* The base is part of the address on purpose. A widget file that was changed
               on the server does not reach a browser that already holds the old one:
               the address is unchanged, so the old copy is served from the cache and the
               fix looks as if it did nothing. The token alone only moves on install, so
               raising the base is what invalidates the file everywhere at once. */
            return ((token > WIDGET_TOKEN_BASE ? token : WIDGET_TOKEN_BASE) + '.' + WIDGET_TOKEN_BASE) + '';
        }
        function bumpWidgetToken() {
            try { localStorage.setItem(WIDGET_TOKEN_KEY, String(Date.now())); } catch (e) { /* private mode: the base still helps */ }
        }

        async function loadWidgetDefs() {
            const widgets = await dpAPI('widgets');
            if (!widgets || !widgets.items) return;
            widgetDefs.value = widgets.items.map(w => ({
                type: w.TYPE, icon: w.ICON, title: w.TITLE, desc: w.DESCRIPTION, file: w.FILE, priority: w.PRIORITY, isSystem: (parseInt(w.IS_SYSTEM, 10) === 1), enabled: (w.ENABLED === null || w.ENABLED === undefined || w.ENABLED === '' ? 1 : (parseInt(w.ENABLED, 10) === 0 ? 0 : 1))
            }));
            widgetList.value = [...widgetDefs.value].sort((a, b) => (a.priority || 0) - (b.priority || 0));
            for (const w of widgets.items) {
                if (!w.FILE) continue;
                await loadScript(w.FILE, widgetToken());
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
                    /* По имени, а не по факту клика: тип записи могли поменять
                       после того, как её открывали, и в localStorage осталась
                       группа или страница. Такую запись восстанавливать нельзя -
                       открывать её надо кликом, а не показом пустой панели. */
                    if (last) currentPanel.value = panels.value.find(p => p.name === last && isPanel(p));
                    if (!currentPanel.value)
                        currentPanel.value = panels.value.find(p => isPanel(p)) || panels.value[0];
                }
                // auto-edit mode when no panels exist
                if (isAdmin.value && !panels.value.length) {
                    editMode.value = true;
                }
                const s = await dpAPI('settings');
                if (!s.error) Object.assign(settings.value, s);
                applySettings();
                /* Панель по умолчанию из настроек открывается при запуске и имеет
                   приоритет над запомненной: её выбрал администратор, и каждый
                   вход должен начинаться с неё. Настройки читаются позже панелей,
                   поэтому выбор делается здесь, а не в восстановлении выше.
                   Страницу по адресу открыть как панель нельзя - она открывается
                   кликом по меню. */
                const def = settings.value.defaultPanel;
                if (def) {
                    const target = panels.value.find(p => p.name === def && p.panelType !== 'url');
                    if (target) selectPanel(target);
                }
                /* Открытая перед перезагрузкой страница-адрес открывается снова,
                   иначе F5 возвращает на предыдущую панель. Панель по умолчанию из
                   настроек остаётся стартовой - она выбрана администратором, и её
                   приоритет над перезагрузкой страницы сохраняется. */
                if (!def) {
                    const lastUrl = localStorage.getItem('dp_lastUrl');
                    if (lastUrl) {
                        const urlTarget = panels.value.find(p => p.name === lastUrl && p.panelType === 'url');
                        const url = urlTarget ? headerLinkNormalize(urlTarget.url) : '';
                        if (url) linkView.value = { url: url, title: urlTarget.title || url, bare: true };
                    }
                }
                headerMigrateLegacy();
                headerValueRefresh();
                bgColorRefresh();
            } catch (e) {
                console.error('loadData error', e);
            }
            loading.value = false;
        }

        async function addWidget(type) {
            const def = widgetDefs.value.find(d => d.type === type);
            const comp = getWidgetComponent(type);
            const rawDefaults = (comp && comp.defaults) || W.fields.defaults[type] || {};
            const typeDefaults = typeof rawDefaults === 'function' ? rawDefaults() : rawDefaults;
            const widgetTabs = getWidgetTabs(type);
            const allFields = widgetTabs.flatMap(tab => getWidgetFields(type, tab.fields || tab.key));
            const fieldDefaults = {};
            /* A property and a method are read through their object: the list of them is
               built from it, so a value written before the object is chosen matches no
               option and the field shows an empty box instead of the "default" one. Their
               defaults therefore wait for the object - pendingFieldDefaults - and are put
               into the field by setMethodField() and applyPendingObjectFields(). */
            const needsObject = t => t === 'property' || t === 'method';
            const stash = d => (d === '' || d === undefined || d === null) ? '' : String(d);
            pendingFieldDefaults = {};
            allFields.forEach(f => {
                if (!f.key) return;
                const d = (f.default !== undefined) ? f.default : '';
                if (needsObject(f.type)) {
                    if (!(f.key in fieldDefaults)) fieldDefaults[f.key] = '';
                    pendingFieldDefaults[f.key] = stash(d);
                    return;
                }
                if (!(f.key in fieldDefaults)) fieldDefaults[f.key] = d;
            });
            /* the defaults block of the file is read the same way: a property or a method
               named there waits for its object as well */
            const typeDefaultsFlat = {};
            for (const k of Object.keys(typeDefaults || {})) {
                if (!(k in fieldDefaults)) continue;
                if (needsObject(allFields.find(f => f.key === k)?.type)) {
                    if (!pendingFieldDefaults[k]) pendingFieldDefaults[k] = stash(typeDefaults[k]);
                    typeDefaultsFlat[k] = '';
                } else {
                    typeDefaultsFlat[k] = typeDefaults[k];
                }
            }
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
                minValue: 0, maxValue: 100,
                colors: JSON.stringify([{color:'#a9d70b'},{color:'#f9c802'},{color:'#ff0000'}]),
                striped: false, color_progress: 'primary',
                viewTime: true, viewDate: true, sizeTime: 48, sizeDate: 16,
                x: 0, y: 0, width: 280, height: 170,
                ...fieldDefaults,
                ...typeDefaultsFlat
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
            const wList = currentPanel.value.widgets;
            if (Array.isArray(wList) && wList.length) {
                const gap = 10;
                const ww = Number(w.width) || 280;
                const wh = Number(w.height) || 170;
                const colLimit = 6 * 280 + 5 * gap;
                const exW = (ex) => Number(ex.width) || 280;
                const exH = (ex) => Number(ex.height) || 170;
                const exX = (ex) => Number(ex.x) || 0;
                const exY = (ex) => Number(ex.y) || 0;
                const overlaps = (x, y) => wList.some(ex =>
                    x < exX(ex) + exW(ex) && x + ww > exX(ex) &&
                    y < exY(ex) + exH(ex) && y + wh > exY(ex)
                );
                const xs = [0];
                wList.forEach(ex => {
                    const r = Math.max(0, Math.min(exX(ex) + exW(ex) + gap, Math.max(0, colLimit - ww)));
                    xs.push(r);
                });
                const ys = [0];
                wList.forEach(ex => { ys.push(Math.max(0, exY(ex) + exH(ex) + gap)); });
                const uniqXs = [...new Set(xs)].sort((a, b) => a - b);
                const uniqYs = [...new Set(ys)].sort((a, b) => a - b);
                let placed = false;
                for (const y of uniqYs) {
                    for (const x of uniqXs) {
                        if (!overlaps(x, y)) {
                            w.x = x;
                            w.y = y;
                            placed = true;
                            break;
                        }
                    }
                    if (placed) break;
                }
                if (!placed) {
                    let bottom = 0;
                    wList.forEach(ex => { bottom = Math.max(bottom, exY(ex) + exH(ex)); });
                    w.x = 0;
                    w.y = bottom + gap;
                }
            }
            if (!currentPanel.value.widgets) currentPanel.value.widgets = [];
            currentPanel.value.widgets.push(w);
            showAddWidget.value = false;
            editWidgetIsNew.value = true;
            await loadObjects();
            const awTabs = getWidgetTabs(type);
            const awDef = awTabs.find(t => t.key === 'main') || awTabs[0];
            widgetTab.value = awDef ? awDef.key : 'main';
            editWidgetForm.value = w;
            nextTick(updateWidgetTabSlider);
        }

        function openWidgetHelp(type) {
            window.open('help/widgets/' + type + '.html', '_blank', 'noopener');
        }

        /* ---- Widget builder (page showWidgetEditorPanel, tab "Создание и редактирование") ---- */
        const widgetEditorTab = ref('list');
        const builderTarget = ref('');
        const builderModel = ref(null);
        const builderReady = ref(false);
        const builderBusy = ref(false);

        const builderTitles = computed(() => {
            const me = builderTarget.value || '';
            const out = [];
            (widgetDefs.value || []).forEach(d => {
                if (d.type && d.type === me) return;
                if (d.title) out.push(d.title);
            });
            return out;
        });

        const builderTypes = computed(() => {
            const me = builderTarget.value || '';
            return (widgetDefs.value || []).map(d => d.type).filter(x => x && x !== 'unknown' && x !== me);
        });

        /* Three ways into the constructor, and they are not the same thing:
           ''            - a widget built from nothing;
           '__example__' - a widget built from the worked out example;
           anything else - a widget that already exists, opened by its type.
           The first two make a new file, so they must never take a name that is
           taken: the type is the file name, and a second "new_widget" would quietly
           write over the first one instead of adding to it. */
        const T_NEW = '';
        const T_EXAMPLE = '__example__';

        /* The one menu of the constructor, top left. Two of its items do not open a
           widget but make one: a blank one, and one from the worked out example. Both
           are framed by dashes so they do not read as names of widgets. Everything
           else is a widget that exists, and it keeps title and type - including the
           starter widget itself, which stays reachable for editing. */
        const builderTargets = computed(() => {
            const out = [
                { value: T_NEW, label: t('dpb_target_new') },
                { value: T_EXAMPLE, label: t('dpb_cat_min_example') }
            ];
            (widgetList.value || []).forEach(w => {
                out.push({ value: w.type, label: widgetName(w) + ' · ' + w.type });
            });
            return out;
        });

        /* Three ways into the constructor, and they are not the same thing:
           ''            - a widget built from nothing;
           '__example__' - a widget built from the worked out example;
           anything else - a widget that already exists, opened by its type.
           The first two make a new file, so they must never take a name that is
           taken: the type is the file name, and a second "new_widget" would quietly
           write over the first one instead of adding to it. */

        function nextWidgetType(taken) {
            const used = {};
            (taken || []).forEach(x => { if (x) used[String(x)] = 1; });
            for (let i = 1; i < 10000; i++) {
                const t = 'widget_' + i;
                if (!used[t]) return t;
            }
            return 'widget_' + String(Date.now());
        }

        function freeWidgetType() {
            const names = (widgetDefs.value || []).map(d => d.type);
            if (builderTarget.value) names.push(builderTarget.value);
            return nextWidgetType(names);
        }

        /* A widget nobody has named must not arrive wearing a name, so the title is
           emptied for every one of them - the example included. */
        function builderBlank(target, example) {
            const B = window.DpBuilder;
            if (!B) return null;
            let t, m;
            if (target && target !== T_NEW && target !== T_EXAMPLE) {
                t = target.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
                if (!/^[a-z]/.test(t)) t = 'w_' + t;
                m = B.newModel(t);
            } else {
                t = freeWidgetType();
                m = example ? B.newModel(t) : (B.emptyModel ? B.emptyModel(t) : B.newModel(t));
            }
            if (m) m.title = '';
            return m;
        }

        async function ensureBuilder(type, force) {
            const cur = type !== undefined ? (type || '') : builderTarget.value;
            if (!force && builderModel.value && builderReady.value && builderTarget.value === cur) return builderModel.value;
            if (!window.DpBuilder) return null;
            builderTarget.value = cur;
            /* neither of the two starts opens a file - there is nothing to open yet */
            if (cur === T_NEW || cur === T_EXAMPLE) {
                builderModel.value = builderBlank(cur, cur === T_EXAMPLE);
                builderReady.value = true;
                return builderModel.value;
            }
            if (cur) {
                let res = null;
                try {
                    res = await dpAPI('widgetModel?type=' + encodeURIComponent(cur));
                } catch (e) { res = null; }
                if (res && !res.error && (res.js || res.model)) {
                    const meta = res.meta || {};
                    const fill = (m) => {
                        m.type = cur;
                        m.title = m.title || meta.TITLE || '';
                        m.icon = m.icon || meta.ICON || 'fas fa-cube';
                        m.description = m.description || meta.DESCRIPTION || '';
                    };
                    /* widget created with the builder: its design model is stored in the file */
                    const m = window.DpBuilder.parseSource(res.js || res.model);
                    if (m) {
                        fill(m);
                        builderModel.value = m;
                        builderReady.value = true;
                        return m;
                    }
                    /* ready made widget: take its HTML, fields, defaults and code from the file */
                    /* The text of the file that was just fetched is the truth: the component
                       registered in the page still carries the fields the widget had before
                       the save, and with it the builder opened the old settings again. The
                       registered component is only a fallback for a file that cannot be
                       read here, and the fresh one takes its place right away. */
                    const fresh = (window.DpBuilder.componentOf && res.js) ? window.DpBuilder.componentOf(res.js) : null;
                    const comp = fresh || getWidgetComponent(cur);
                    if (fresh) { try { window.DpWidgets[cur] = fresh; } catch (e) { /* ignore */ } }
                    const im = window.DpBuilder.importSource(res.js || '', {
                        type: cur,
                        title: meta.TITLE || '',
                        icon: meta.ICON || '',
                        description: meta.DESCRIPTION || '',
                        defaults: (comp && comp.defaults) || null,
                        tabs: (comp && comp.tabs) || null,
                        fields: (comp && comp.fields) || null
                    });
                    if (im) {
                        fill(im);
                        builderModel.value = im;
                        builderReady.value = true;
                        return im;
                    }
                }
            }
            builderModel.value = builderBlank(cur);
            builderReady.value = true;
            return builderModel.value;
        }

        function openBuilder(type) {
            widgetEditorTab.value = 'build';
            showWidgetEditorPanel.value = true;
            showSettingsPanel.value = false;
            showHeaderPanel.value = false;
            builderReady.value = false;
            builderModel.value = null;
            ensureBuilder(type || '', true);
        }

        function builderReset() {
            const cur = builderTarget.value;
            builderModel.value = builderBlank(cur, cur === T_EXAMPLE);
            builderReady.value = true;
        }

        /* ---- "Внешний вид" (template:) tab inside the per-widget dialog ---- */
        const tplMode = ref('design');
        const tplReady = ref(false);

        async function openTemplateTab(type) {
            tplMode.value = 'design';
            tplReady.value = false;
            if (!type) { tplReady.value = true; return; }
            builderTarget.value = type;
            await ensureBuilder(type, true);
            tplReady.value = true;
        }

        const builderTemplateHtml = computed(() => {
            const m = builderModel.value;
            if (!m || !window.DpBuilder) return '';
            try { return window.DpBuilder.templateOf(m) || ''; } catch (e) { return ''; }
        });

        async function copyTemplateHtml() {
            const txt = builderTemplateHtml.value;
            if (!txt) return;
            try {
                await navigator.clipboard.writeText(txt);
            } catch (e) {
                const ta = document.createElement('textarea');
                ta.value = txt; document.body.appendChild(ta); ta.select();
                try { document.execCommand('copy'); } catch (e2) { /* ignore */ }
                document.body.removeChild(ta);
            }
        }

        async function builderAction(kind, payload) {
            /* the archive is picked here: the builder only asks for it */
            if (kind === 'loadzip') { builderLoadZip(); return; }
            if (!payload || builderBusy.value) return;
            const m = payload.model;
            if (!m) return;
            builderBusy.value = true;
            try {
                const body = {
                    type: m.type,
                    title: m.title,
                    icon: m.icon,
                    description: m.description,
                    js: payload.js,
                    mode: kind === 'download' ? 'zip' : 'install'
                };
                const res = await dpAPI('widgetBuild', { method: 'POST', body: JSON.stringify(body) });
                if (res.error) {
                    alert(t('error_label') + ' ' + res.error);
                    return;
                }
                if (kind === 'download') {
                    if (res.zip) {
                        const blob = base64ToBlob(res.zip, 'application/zip');
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = res.name || (m.type + '.zip');
                        a.click();
                        URL.revokeObjectURL(url);
                    }
                    return;
                }
                await loadWidgetDefs();
                try { bumpWidgetToken(); } catch (e) { /* ignore */ }
                widgetConfirm.value = {
                    built: true,
                    type: res.type,
                    updated: !!res.updated
                };
                builderReady.value = false;
                builderModel.value = null;
                ensureBuilder(res.type || m.type, true);
            } catch (e) {
                alert(t('error_label') + (e.message || e));
            } finally {
                builderBusy.value = false;
            }
        }

        /* an archive of a widget opens in the constructor: the model is read from the
           file, nothing is written until the user saves the widget */
        function builderLoadZip() {
            if (!window.DpBuilder) { alert(t('error_label') + ' dpbuilder'); return; }
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
                        builderBusy.value = true;
                        const res = await dpAPI('widgetLoad', { method: 'POST', body: JSON.stringify({ zip: b64 }) });
                        if (res.error) { alert(t('error_label') + ' ' + res.error); return; }
                        const src = res.js || '';
                        /* a widget made in the constructor carries its design model,
                           a ready made one is read from the file itself */
                        let m = window.DpBuilder.parseSource(src);
                        if (!m) {
                            const own = window.DpBuilder.componentOf ? window.DpBuilder.componentOf(src) : null;
                            const comp = own || (getWidgetComponent(res.type) || null);
                            m = window.DpBuilder.importSource(src, {
                                type: res.type,
                                title: res.title || '',
                                icon: res.icon || '',
                                description: res.description || '',
                                defaults: (comp && comp.defaults) || null,
                                tabs: (comp && comp.tabs) || null,
                                fields: (comp && comp.fields) || null
                            });
                        }
                        if (!m) { alert(t('error_label') + ' ' + t('dpb_zip_bad')); return; }
                        m.type = res.type || m.type;
                        m.title = m.title || res.title || '';
                        m.icon = m.icon || res.icon || 'fas fa-cube';
                        m.description = m.description || res.description || '';
                        builderTarget.value = m.type;
                        builderModel.value = m;
                        builderReady.value = true;
                        alert(t('dpb_zip_loaded') + (m.title || m.type));
                    } catch (err) {
                        alert(t('error_label') + (err.message || err));
                    } finally {
                        builderBusy.value = false;
                    }
                };
                reader.onerror = () => alert(t('error_label') + 'read');
                reader.readAsDataURL(file);
            };
            input.click();
        }

        function builderCloseNotice() {
            widgetConfirm.value = null;
        }

        async function editWidget(w, parent) {
            if (parent) editParentTab.value = widgetTab.value;
            const tabs = getWidgetTabs(w.type);
            const eDef = tabs.find(t => t.key === 'main') || tabs[0];
            widgetTab.value = eDef ? eDef.key : 'main';
            columnIdx.value = 0;
            seriesIdx.value = 0;
            slidesIdx.value = 0;
            editWidgetParent.value = parent || null;
            editWidgetIsNew.value = false;
            const def = widgetDefs.value.find(d => d.type === w.type);
            /* a saved widget carries its own values: nothing is waiting for an object */
            pendingFieldDefaults = {};
            editWidgetForm.value = {
                ...w,
                children: Array.isArray(w.children) ? w.children.map(c => ({ ...c })) : [],
                title: w.title || '',
                icon_type: w.icon_type || w.iconType || 'icon',
                icon_object: w.icon_object || w.iconObject || '',
                icon_property: w.icon_property || w.iconProperty || '',
                icon_url: w.icon_url || w.image || '',
                pre_info: w.pre_info || w.prefix || '',
                pos_info: w.pos_info || w.postfix || '',
                columns: typeof w.columns === 'string' ? w.columns : JSON.stringify(w.columns || []),
                period: w.period ?? 24,
                enableZoom: w.enableZoom ?? true,
                series: typeof w.series === 'string' ? w.series : JSON.stringify(w.series || []),
                refresh: w.refresh || 60,
            };
            if (def && def.fields) {
                for (const fields of Object.values(def.fields)) {
                    for (const f of fields) {
if (f.key) {
                        const cur = editWidgetForm.value[f.key];
                        if (cur === undefined || cur === null || cur === '') {
                            editWidgetForm.value[f.key] = (f.default !== undefined) ? f.default : '';
                        }
                    }
                    }
                }
            }
            /* A field that was never saved (a selector added in a later version,
               like the eighth colour-music channel) is undefined, and a select
               bound to undefined matches none of its options: it would sit on a
               blank line instead of the «choose» placeholder. Such fields take
               their default, or an empty string so the placeholder is selected.
               A saved empty string keeps the migration rule below. */
            tabs.forEach(tab => getWidgetFields(w.type, tab.fields || tab.key).forEach(f => {
                if (!f.key) return;
                const cur = editWidgetForm.value[f.key];
                if (cur === undefined || cur === null || (cur === '' && f.default !== undefined)) {
                    editWidgetForm.value[f.key] = (f.default !== undefined) ? f.default : '';
                }
            }));
            widgetProperties.value = [];
            infoProperties.value = [];
            await loadObjects();
            if (!scripts.value.length) await loadScripts();
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
            if (hasGo2rtcField()) loadGo2rtcCameras();
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
                if (fd.field === 'method' || fd.field.startsWith('object_')) return !!getMethodObj(val);
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
                if (fd.isMethod) objKey = getMethodObj(val);
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
                        /* the method of the old address comes along to the new object */
                        const method = getMethodName(w[field]);
                        w[field] = g.newObj + (method ? '/' + method : '/');
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
                if (editWidgetIsNew.value) {
                    const wid = editWidgetForm.value && editWidgetForm.value.id;
                    if (wid && Array.isArray(currentPanel.value.widgets)) {
                        const idx = currentPanel.value.widgets.findIndex(w => w.id === wid);
                        if (idx >= 0) currentPanel.value.widgets.splice(idx, 1);
                    }
                    editWidgetIsNew.value = false;
                }
                editWidgetForm.value = null;
            }
        }

        function saveEditWidget() {
            if (!editWidgetForm.value) return;
            const hadParent = !!editWidgetParent.value;
            const parentTab = editParentTab.value;
            const wid = editWidgetForm.value.id;
            const btnTabs = getWidgetTabs(editWidgetForm.value.type);
            const hasBgMode = btnTabs.some(tab => getWidgetFields(editWidgetForm.value.type, tab.fields || tab.key).some(f => f.key === 'bg_mode'));
            if (hasBgMode) {
                const mode = editWidgetForm.value.bg_mode || (editWidgetForm.value.color ? 'color' : 'default');
                if (mode !== 'color') editWidgetForm.value.color = '';
                if (mode !== 'image') editWidgetForm.value.bg_image = '';
                if (mode !== 'property') { editWidgetForm.value.bg_object = ''; editWidgetForm.value.bg_property = ''; }
            }
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
            if (wid !== undefined && wid !== null) wsRev[wid] = (wsRev[wid] || 0) + 1;
            editWidgetForm.value = null;
            editWidgetParent.value = null;
            editWidgetIsNew.value = false;
            if (hadParent && parent) {
                editWidget(parent, null);
                editParentTab.value = parentTab;
                if (widgetTab.value !== parentTab) widgetTab.value = parentTab;
            } else {
                savePanels();
            }
        }

        const grDragState = ref(-1);
        function grParse() {
            let arr = [];
            try {
                const raw = editWidgetForm.value && editWidgetForm.value.colors;
                const parsed = raw && typeof raw === 'string' ? JSON.parse(raw) : raw;
                if (Array.isArray(parsed)) arr = parsed.map(c => c && c.color).filter(c => typeof c === 'string');
            } catch (e) { arr = []; }
            if (arr.length < 2) arr = ['#a855f7', '#3b82f6', '#22c55e', '#facc15', '#ef4444'];
            return arr;
        }
        function grWrite(arr) {
            editWidgetForm.value.colors = JSON.stringify(arr.map(color => ({ color: String(color || '').trim() })));
        }
        function grColors() { return grParse().map(color => ({ color })); }
        function grPreview() { return { background: 'linear-gradient(90deg,' + grParse().join(',') + ')' }; }
        function grAdd() {
            const arr = grParse();
            arr.push('#22c55e');
            grWrite(arr);
        }
        function grRemove(i) {
            const arr = grParse();
            if (arr.length <= 2) return;
            arr.splice(i, 1);
            grWrite(arr);
        }
        function grSet(i, v) {
            const arr = grParse();
            if (arr[i] === undefined) return;
            let val = String(v || '').trim();
            if (/^[0-9a-fA-F]{6}$/.test(val)) val = '#' + val;
            arr[i] = val;
            grWrite(arr);
        }
        function grDrop(i) {
            const from = grDragState.value;
            if (from < 0 || from === i) { grDragState.value = -1; return; }
            const arr = grParse();
            const [it] = arr.splice(from, 1);
            arr.splice(i, 0, it);
            grWrite(arr);
            grDragState.value = -1;
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

        function getWidgetSiblings(w) {
            const scan = (items) => {
                for (const it of items || []) {
                    if (it === w) return items;
                    if (Array.isArray(it.children)) {
                        const r = scan(it.children);
                        if (r) return r;
                    }
                }
                return null;
            };
            return scan(currentPanel.value.widgets) || [];
        }

        function snapToGrid(v) {
            const step = Math.max(1, settings.value.gridStep || 10);
            return Math.round(v / step) * step;
        }

        function onDrag(e) {
            const w = draggingWidget.value;
            if (!w) return;
            const canvas = document.querySelector('.widgets-canvas');
            if (!canvas) return;
            const r = canvas.getBoundingClientRect();
            let nx = Math.max(0, e.clientX - r.left - dragOffset.value.x);
            let ny = Math.max(0, e.clientY - r.top - dragOffset.value.y);
            if (settings.value.grid) {
                nx = snapToGrid(nx);
                ny = snapToGrid(ny);
            }
            if (settings.value.noOverlap) {
                const rect = { x: nx, y: ny, w: w.width || 280, h: w.height || 200 };
                const gap = settings.value.grid ? Math.max(1, settings.value.gridStep || 10) : 0;
                const siblings = getWidgetSiblings(w);
                for (let pass = 0; pass < 3; pass++) {
                    let moved = false;
                    for (const o of siblings) {
                        if (o === w) continue;
                        const orect = { x: (o.x || 0) - gap, y: (o.y || 0) - gap, w: (o.width || 280) + gap * 2, h: (o.height || 200) + gap * 2 };
                        const ox = Math.min(rect.x + rect.w, orect.x + orect.w) - Math.max(rect.x, orect.x);
                        const oy = Math.min(rect.y + rect.h, orect.y + orect.h) - Math.max(rect.y, orect.y);
                        if (ox > 0 && oy > 0) {
                            if (ox < oy) {
                                rect.x = rect.x < orect.x ? orect.x - rect.w : orect.x + orect.w;
                            } else {
                                rect.y = rect.y < orect.y ? orect.y - rect.h : orect.y + orect.h;
                            }
                            rect.x = Math.max(0, rect.x);
                            rect.y = Math.max(0, rect.y);
                            moved = true;
                        }
                    }
                    if (!moved) break;
                }
                nx = rect.x;
                ny = rect.y;
                if (settings.value.grid) {
                    nx = snapToGrid(nx);
                    ny = snapToGrid(ny);
                }
            }
            w.x = nx;
            w.y = ny;
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
            w.width = Math.max(w.minWidth || 100, resizeStart.value.w + dx);
            w.height = Math.max(w.minHeight || 60, resizeStart.value.h + dy);
            if (settings.value.grid) {
                w.width = snapToGrid(w.width);
                w.height = snapToGrid(w.height);
            }
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
        /* the object of a property is chosen in another field: as soon as it is named, the
           default the property was holding comes into it */
        const objectFields = ['object', 'object_level', 'object_alive', 'object_info', 'icon_object', 'bg_object'];
        objectFields.forEach(key => {
            watch(() => editWidgetForm.value?.[key], (obj) => applyPendingObjectFields(key));
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
        const extraObjectKeys = ['object_alive', 'object_status', 'object_current', 'object_target', 'object_level', 'state_object', 'object_p1', 'object_p2', 'object_p3', 'object_p4', 'object_p5', 'object_p6', 'object_p7', 'object_p8', 'object_hex', 'object_r', 'object_g', 'object_b', 'object_md'];
        extraObjectKeys.forEach(key => {
            watch(() => editWidgetForm.value?.[key], async (obj) => {
                if (!obj) { extraProperties.value[key] = []; return; }
                const res = await dpAPI('properties?object_id=' + encodeURIComponent(obj));
                extraProperties.value = { ...extraProperties.value, [key]: res.items || [] };
            });
        });

        // Series editing watcher: load properties for every series object
        watch(() => editWidgetForm.value?.series, async (val) => {
            if (!val) { seriesProps.value = {}; return; }
            let arr = [];
            try { arr = JSON.parse(val); } catch { arr = []; }
            const map = {};
            for (let i = 0; i < arr.length; i++) {
                if (arr[i] && arr[i].object) {
                    try {
                        const res = await dpAPI('properties?object_id=' + encodeURIComponent(arr[i].object));
                        map[i] = res.items || [];
                    } catch(e) { map[i] = []; }
                } else {
                    map[i] = [];
                }
            }
            seriesProps.value = map;
        });

        function savePanels() {
            applySettings();
            if (!editMode.value) {
                editMode.value = true;
            }
            hasUnsavedChanges.value = true;
        }

        async function commitChanges() {
            await dpAPI('panels', { method: 'POST', body: JSON.stringify({ panels: panels.value }) });
            const s = await dpAPI('settings', { method: 'POST', body: JSON.stringify(settings.value) });
            if (s && !s.error) Object.assign(settings.value, s);
            applySettings();
            hasUnsavedChanges.value = false;
        }

        async function saveSettingsNow() {
            applySettings();
            const s = await dpAPI('settings', { method: 'POST', body: JSON.stringify(settings.value) });
            if (s && !s.error) {
                /* Ответ на запись настроек несёт ещё и состояние .htaccess: правило
                   могло не записаться (файл не доступен веб-серверу), и об этом надо
                   сказать прямо, а не тихо оставить переключатель включённым. Ключ
                   забираем из ответа, чтобы в настройки он не попал обратно. */
                const mp = s.mainPage;
                delete s.mainPage;
                Object.assign(settings.value, s);
                if (mp) {
                    if (mp.ok) {
                        settings.value.mainPageRedirect = mp.enabled ? 1 : 0;
                        dpToast(mp.enabled ? t('main_page_redirect_on') : t('main_page_redirect_off'), 'success', 5000);
                    } else {
                        settings.value.mainPageRedirect = mp.enabled ? 0 : 1;
                        dpToast(t('main_page_redirect') + ': ' + (mp.error || '?'), 'error', 9000);
                    }
                }
            }
            applySettings();
        }

        /* Настройки сохраняются сами, сразу после изменения: ждать кнопку
           со дискетой не нужно. Повторы гасятся таймером, чтобы протяжка
           ползунка или набор текста не слали запрос на каждое движение. */
        let settingsSaveTimer = null;
        function settingsChanged() {
            applySettings();
            if (settingsSaveTimer) { clearTimeout(settingsSaveTimer); settingsSaveTimer = null; }
            settingsSaveTimer = setTimeout(() => { settingsSaveTimer = null; saveSettingsNow(); }, 400);
        }

        /* Панель - запись с виджетами. Группа только раскрывает меню, а запись
           типа 'url' ведёт на внешнюю страницу: виджетов в ней нет, и открывать
           её надо переходом по адресу, а не показом пустой панели. Всё, где
           дальше речь о панели с виджетами, берёт isPanel(), а не сравнение
           с 'group': иначе запись-страница проскакивала бы в списки выбора. */
        function isPanel(p) {
            return !!p && p.panelType !== 'group' && p.panelType !== 'url';
        }

        /* Пока открыт адрес, подсвечен только он: панель, открытая до него, остаётся
           выбранной (к ней возвращается левое меню), но подсветка уходит на
           страницу, иначе в меню горит сразу два пункта. */
        function isNavActive(p) {
            if (!p) return false;
            if (p.panelType === 'url') return !!linkView.value && linkView.value.url === headerLinkNormalize(p.url);
            return !linkView.value && !!currentPanel.value && currentPanel.value.name === p.name;
        }

        function navItemClick(p, expand) {
            if (!p) return;
            if (p.panelType === 'url') {
                const url = headerLinkNormalize(p.url);
                if (!url) return;
                /* Адрес открывается в основной области под шапкой, браузер остаётся на
                   дашборде, и страница выглядит обычным окном: полосы-заголовка
                   с кнопками у неё нет (bare), выход - левое меню. У ссылки из
                   шапки такая полоса остаётся - там она и была придумана. */
                linkView.value = { url: url, title: p.title || url, bare: true };
                localStorage.setItem('dp_lastUrl', p.name);
                sidebarOpen.value = false;
                return;
            }
            selectPanel(p);
            if (expand) expandedGroups.value = { ...expandedGroups.value, [p.name]: true };
            leaveUrlPage();
            sidebarOpen.value = false;
        }
        function leaveUrlPage() {
            if (linkView.value) {
                linkView.value = null;
                localStorage.removeItem('dp_lastUrl');
            }
        }
        function goHome() {
            leaveUrlPage();
            selectHomePanel();
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
                    panelType: p.panelType || 'panel',
                    parentGroup: p.parentGroup || 'root',
                    url: panelUrlToForm(p.url),
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
                /* Новая запись в меню по умолчанию - панель: группу в левое меню
                   обычно кладут осознанно, а пустую группу создают по кнопке
                   «Добавить» и сразу наполняют. Прежним default был 'group'. */
                panelForm.value = { title: '', iconType: 'icon', icon: 'fas fa-folder', iconObject: '', iconProperty: '', image: '', hideNav: false, hideHome: false, panelType: 'panel', parentGroup: 'root', url: '', dropdownNav: false, openOnClick: false, infoObject: '', infoProperty: '', infoPrefix: '', infoPostfix: '', background: false, circle: false, iconColor: 'default', showImageNav: false, individualSettings: false, showImageBg: false, bgSize: 'cover', verticalCompact: false };
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

        async function loadScripts() {
            try {
                const res = await dpAPI('scripts');
                scripts.value = res.items || [];
            } catch(e) {
                console.error('loadScripts error', e);
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
            if (editPanelData.value && editPanelData.value.widgets?.length && f.panelType !== editPanelData.value.panelType && (f.panelType === 'group' || f.panelType === 'url')) {
                panelError.value = f.panelType === 'url' ? t('panel_error_url_change') : t('panel_error_group_change');
                return;
            }
            const panelUrl = f.panelType === 'url' ? panelUrlToSave(f.url) : '';
            if (f.panelType === 'url' && !panelUrl) {
                panelError.value = t('panel_error_url');
                return;
            }
            if (f.panelType !== 'group' && f.parentGroup !== 'root' && !panels.value.find(p => p.name === f.parentGroup && p.panelType === 'group')) {
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
                panelType: f.panelType, parentGroup: f.parentGroup, url: panelUrl, dropdownNav: f.dropdownNav, openOnClick: f.openOnClick,
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
                if (currentPanel.value === editPanelData.value) currentPanel.value = panels.value.find(p => isPanel(p)) || panels.value[0] || null;
            }
            editPanelData.value = null;
            showAddPanel.value = false;
            savePanels();
        }

        async function deleteCurrentPanel(p) {
            p = p || currentPanel.value;
            if (!p) return;
            if (!await dpConfirm(t('delete_panel_confirm') + ' «' + p.title + '»?', { danger: true, okText: t('delete') })) return;
            const idx = panels.value.indexOf(p);
            if (idx >= 0) {
                panels.value.splice(idx, 1);
                if (currentPanel.value === p) {
                    currentPanel.value = panels.value.find(pp => isPanel(pp)) || panels.value[0] || null;
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
        /* the widget builder has its own Vue app: it takes the same list of icons */
        window.DpIconCategories = iconCategories;

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
            if (target === 'hs') hsEnsureFaIcon();
            showIconPicker.value = true;
        }

        /* Opening the folder dialog starts at the root and then walks down: the value of
           the field is not changed while browsing, it is written when the dialog is
           confirmed, so a click on the wrong folder costs nothing. */
        async function openDirPicker(target) {
            dirTarget.value = target;
            dirPickerPicked.value = '';
            showDirPicker.value = true;
            await dirPickerGo('');
        }

        async function dirPickerGo(path) {
            dirPickerLoading.value = true;
            dirPickerError.value = '';
            try {
                const d = await dpAPI('dirs?' + new URLSearchParams({ dir: path || '' }));
                if (d && !d.error) {
                    dirPickerPath.value = String(d.dir || '');
                    dirPickerItems.value = Array.isArray(d.items) ? d.items : [];
                    dirPickerUp.value = String(d.dir || '') === '' ? null : String(d.up || '');
                    dirPickerPicked.value = String(d.dir || '');
                } else {
                    dirPickerError.value = String((d && d.error) || t('dir_picker_fail'));
                    dirPickerItems.value = [];
                    dirPickerUp.value = null;
                }
            } catch (e) {
                dirPickerError.value = String(t('dir_picker_fail'));
                dirPickerItems.value = [];
                dirPickerUp.value = null;
            }
            dirPickerLoading.value = false;
        }

        function closeDirPicker() {
            showDirPicker.value = false;
            dirTarget.value = '';
            dirPickerItems.value = [];
            dirPickerError.value = '';
            dirPickerUp.value = null;
        }

        function dirPickerOk() {
            if (!dirTarget.value || dirPickerError.value) return;
            if (editWidgetForm.value) editWidgetForm.value[dirTarget.value] = dirPickerPicked.value;
            closeDirPicker();
        }

        function selectIcon(ic) {
            if (iconTarget.value === 'panel' && panelForm.value) {
                panelForm.value.icon = ic;
} else if (iconTarget.value === 'hs') {
            hsForm.icon = ic;
        } else if (iconTarget.value === 'hl') {
            headerLinkForm.icon = ic;
        } else if (typeof iconTarget.value === 'string' && iconTarget.value.startsWith('si:')) {
            const idx = parseInt(iconTarget.value.slice(3), 10);
            setSelectItemField(idx, 'icon', ic);
        } else if (typeof iconTarget.value === 'string' && iconTarget.value.startsWith('st:')) {
                const idx = parseInt(iconTarget.value.slice(3), 10);
                setStatusItemField(idx, 'icon', ic);
            } else if (editWidgetForm.value) {
                editWidgetForm.value[iconTarget.value] = ic;
            }
            showIconPicker.value = false;
        }

        function iconPicked(ic) {
            if (iconTarget.value === 'panel' && panelForm.value) {
                return panelForm.value.icon === ic;
            }
            if (iconTarget.value === 'hs') {
                return hsForm.icon === ic;
            }
            if (iconTarget.value === 'hl') {
                return headerLinkForm.icon === ic;
            }
            if (typeof iconTarget.value === 'string' && iconTarget.value.startsWith('si:')) {
                const idx = parseInt(iconTarget.value.slice(3), 10);
                const arr = selectItems.value;
                return arr[idx] && arr[idx].icon === ic;
            }
            if (typeof iconTarget.value === 'string' && iconTarget.value.startsWith('st:')) {
                const idx = parseInt(iconTarget.value.slice(3), 10);
                const arr = statusItems.value;
                return arr[idx] && arr[idx].icon === ic;
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

            // global widget card radius (per-widget radius overrides it inline)
            const gRadius = s.roundedWidgets ? Number(s.widgetRadius) : 0;
            root.style.setProperty('--wpb-radius-default', (gRadius > 0 ? gRadius : 0) + 'px');

            const fontFamily = String(s.font || '').trim();
            const interfaceFont = fontFamily ? (INTERFACE_FONT_STACKS[fontFamily] || fontFamily + ', sans-serif') : '';
            root.style.fontFamily = interfaceFont;
            document.body.style.fontFamily = interfaceFont;
            if (app) {
                app.style.fontFamily = interfaceFont;
                app.classList.toggle('compact-header', !!s.compactHeader);
            }

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
            saveSettingsNow();
        }

        function cleanupOrphanWidgets() {
            cleanupRun();
        }

        async function cleanupRun() {
            if (cleanupBusy.value) return;
            cleanupReport.value = null;
            cleanupBusy.value = true;
            try {
                const res = await dpAPI('auditWidgets');
                if (res && res.error) { alert(t('error_label') + ' ' + res.error); return; }
                const report = { items: [], orphanDefs: [], messages: res.messages || [], restorable: !!res.restorable };
                (res.items || []).forEach(it => { report.items.push({ ...it, checked: !it.soft }); });
                (res.orphanDefs || []).forEach(d => { report.orphanDefs.push({ ...d, checked: false }); });
                cleanupReport.value = report;
                showCleanupDialog.value = true;
            } finally {
                cleanupBusy.value = false;
            }
        }

        function cleanupReasons(item) {
            return (item.reasons || []).map(r => {
                const label = t('reason_' + r.reason);
                return r.detail ? label + ': ' + r.detail : label;
            });
        }

        async function applyCleanup() {
            if (!cleanupReport.value) return;
            const ids = [];
            cleanupReport.value.items.forEach(it => { if (it.checked && Array.isArray(it.path) && it.path.length) ids.push({ panel: it.panel, path: it.path }); });
            const types = cleanupReport.value.orphanDefs.filter(d => d.checked).map(d => d.type);
            if (!ids.length && !types.length) { showCleanupDialog.value = false; return; }
            try {
                const res = await dpAPI('cleanupWidgets', { method: 'POST', body: JSON.stringify({ ids, types }) });
                if (res && res.error) { alert(t('error_label') + ' ' + res.error); return; }
                showCleanupDialog.value = false;
                cleanupReport.value = null;
                await loadData();
                if (typeof res === 'object' && res) {
                    const wc = Number(res.removed) || 0;
                    const tc = Number(res.typesRemoved) || 0;
                    if (wc + tc > 0) {
                        alert(t('cleanup_result_removed').replace('%w', String(wc)).replace('%t', String(tc)));
                    } else {
                        alert(t('cleanup_result_none'));
                    }
                } else {
                    alert(t('alert_cleanup_done'));
                }
            } catch (e) {
                alert(t('unknown_error'));
            }
        }

        async function restorePanels() {
            if (!cleanupReport.value) return;
            try {
                const res = await dpAPI('restorePanels', { method: 'POST', body: '{}' });
                if (res && res.error) { alert(t('error_label') + ' ' + res.error); return; }
                showCleanupDialog.value = false;
                cleanupReport.value = null;
                await loadData();
                alert(t(res.reset ? 'cleanup_restore_reset' : 'cleanup_restore_result').replace('%c', String(Number(res.tail) || 0)));
            } catch (e) {
                alert(t('unknown_error'));
            }
        }

        async function runWizard() {
            if (panels.value && panels.value.length) {
                if (!await dpConfirm(t('wizard_confirm'), { danger: true })) return;
            }
            try {
                const res = await dpAPI('wizard', { method: 'POST', body: '{}' });
                if (res && res.error) { alert(t('error_label') + ' ' + res.error); return; }
                if (res && res.panels) {
                    panels.value = res.panels;
                    currentPanel.value = null;
                    savePanels();
                    selectPanel(panels.value.find(p => isPanel(p)) || panels.value[0] || null);
                }
                if (res && typeof res === 'object' && res.panelsCount !== undefined) {
                    alert(t('wizard_done').replace('%p', String(Number(res.panelsCount) || 0)).replace('%d', String(Number(res.devices) || 0)).replace('%w', String(Number(res.widgets) || 0)));
                } else {
                    alert(t('wizard_done_simple'));
                }
            } catch (e) {
                alert(t('unknown_error'));
            }
        }

        async function resetAll() {
            if (!await dpConfirm(t('confirm_delete_all'), { danger: true, okText: t('delete') })) return;
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
                        if (await dpConfirm(res.message || t('confirm_overwrite_user'), { danger: true, okText: t('yes') })) {
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
                        currentPanel.value = panels.value.find(p => isPanel(p)) || panels.value[0] || null;
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
            if (editMode.value) {
                commitChanges();
            }
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

        function notifAvatarUrl() {
            const v = String((settings.value && settings.value.notifAvatar) || '').trim();
            if (!v) return '/cms/avatars/user.png';
            if (v.indexOf('data:') === 0) return v;
            if (v.charAt(0) === '/' || /^(https?:)?\/\//i.test(v)) return v;
            return '/cms/avatars/' + v;
        }

        function notifAvatarFallback(ev) {
            const el = ev && ev.target;
            if (!el) return;
            if (el.dataset.fallbackApplied) return;
            el.dataset.fallbackApplied = '1';
            el.src = '/cms/avatars/user.png';
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

        /* raw send for high-rate widgets (colour music): their writes go over the
           already open websocket instead of one Apache/php request per frame.
           Returns false when the channel is down so the caller can fall back. */
        window.__dpWsSend = function (payload) {
            if (!wsSocket || wsSocket.readyState !== 1) return false;
            try {
                const s = JSON.stringify(payload);
                wsSocket.send(s);
                wsBytesSent.value += s.length;
                return true;
            } catch (e) { return false; }
        };

        function wsCollectProps() {
            const props = new Set();
            (currentPanel.value?.widgets || []).forEach(w => {
                wsWidgetPropKeys(w).forEach(k => props.add(k));
            });
            HEADER_STATUS_BUILTIN.forEach(b => props.add((b.key + '.stateTitle').toLowerCase()));
            (settings.value.headerStatusItems || []).forEach(it => {
                if (it.source === 'object' && it.object) props.add((it.object + '.' + (it.property || 'status')).toLowerCase());
            });
            headerItems.value.forEach(it => {
                const k = it.t === 'value' ? headerValueKey(it.cfg) : '';
                if (k) props.add(k.toLowerCase());
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

        let wsRemountTimer = null;
        const wsPendingRemount = new Set();

        function queueWsRemount(id) {
            if (id === undefined || id === null) return;
            wsPendingRemount.add(id);
            if (wsRemountTimer) return;
            wsRemountTimer = setTimeout(() => {
                wsRemountTimer = null;
                wsPendingRemount.forEach(wid => { wsRev[wid] = (wsRev[wid] || 0) + 1; });
                wsPendingRemount.clear();
            }, 120);
        }

        function wsRefreshWidgets(propKey) {
            const key = String(propKey).toLowerCase();
            const base = key.split('.')[0];
            (currentPanel.value?.widgets || []).forEach(w => {
                const keys = wsWidgetPropKeys(w);
                if (keys.has(key) || keys.has(base)) queueWsRemount(w.id);
            });
        }

        function wsRemountWidgets() {
            (currentPanel.value?.widgets || []).forEach(w => queueWsRemount(w.id));
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
                /* the channel was down, so the colour from a property may be the one
                   the socket has never reported: ask for it again */
                bgColorRefresh();
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
                                wsApplyHeaderStatus(key, u.VALUE);
                                wsApplyHeaderValue(key, u.VALUE);
                                wsApplyBgColor(key, u.VALUE);
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
            headerValueRefresh();
            bgColorRefresh();
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
                            /* the file changed under the same url: drop the token so the
                               panel gets the widget that was just installed */
                            bumpWidgetToken();
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

        function widgetUsageText(res) {
            const used = res.used_by || {};
            const names = Object.keys(used).map(k => (k === '' ? t('widget_editor_in_use_global') : k) + ' — ' + used[k]);
            let s = t('widget_editor_in_use') + ': ' + res.count;
            if (names.length) s += '\n' + t('widget_editor_in_use_at') + ': ' + names.join(', ');
            return s;
        }

        async function setWidgetEnabled(w, enabled) {
            if (enabled === false) {
                if (!await dpConfirm(t('widget_editor_disable_confirm') + ' «' + (w.title || w.type) + '»?', { okText: t('yes') })) return;
            } else {
                if (!await dpConfirm(t('widget_editor_enable_confirm') + ' «' + (w.title || w.type) + '»?', { okText: t('yes') })) return;
            }
            try {
                const res = await dpAPI('widgetSetEnabled', { method: 'POST', body: JSON.stringify({ type: w.type, enabled: enabled ? 1 : 0 }) });
                if (res.error) {
                    if (res.error === 'widget_in_use') {
                        alert(widgetUsageText(res));
                    } else {
                        alert(t('error_label') + ' ' + res.error);
                    }
                    return;
                }
                w.enabled = enabled ? 1 : 0;
                await loadWidgetDefs();
            } catch (e) {
                alert(t('error_label') + (e.message || e));
            }
        }

        async function copyWidgetDef(w) {
            try {
                const res = await dpAPI('widgetCopy', { method: 'POST', body: JSON.stringify({ type: w.type, suffix: t('widget_editor_copy_suffix') }) });
                if (res.error) {
                    alert(t('error_label') + ' ' + res.error);
                    return;
                }
                await loadWidgetDefs();
                const copied = res.title || res.type || (w.title || w.type);
                dpToast(t('widget_editor_copied') + ': ' + copied, 'success', 5000);
            } catch (e) {
                alert(t('error_label') + (e.message || e));
            }
        }

        async function deleteWidgetDef(w) {
            if (!await dpConfirm(t('widget_editor_delete_confirm') + ' «' + (w.title || w.type) + '»?', { danger: true, okText: t('delete') })) return;
            try {
                const res = await dpAPI('widgetDelete', { method: 'POST', body: JSON.stringify({ type: w.type }) });
                if (res.error) {
                    if (res.error === 'widget_in_use') {
                        alert(widgetUsageText(res));
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

        window.__closeSettings = () => { showSettingsPanel.value = false; showWidgetEditorPanel.value = false; showHeaderPanel.value = false; };

        watch(currentPanel, () => wsSubscribeProperties(), { deep: true });

/* Выбор панели в меню возвращает к панелям, поэтому открытая в области ссылка
   закрывается - иначе панель была бы выбрана, но её не видно.
   Обновление данных той же панели (WebSocket PostProperty/UpdateData подменяют
   currentPanel новым объектом) ссылку закрывать не должно. */
watch(currentPanel, (np, op) => {
    if (!linkView.value) return;
    if ((np && np.name) !== (op && op.name)) { linkView.value = null; localStorage.removeItem('dp_lastUrl'); }
});

        watch(settings, (s) => {
            applySettings();
            document.title = s.appTitle || 'Dashboard Pro';
            wsSetLive(wsConnected.value);
        }, { deep: true });

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
    /* Vue снял v-cloak - загрузка до монтирования больше не нужна */
    const pre = document.getElementById('app-preload');
    if (pre && pre.parentNode) pre.parentNode.removeChild(pre);
    loadTranslations();
            initAuth();
            setInterval(() => headerNow.value = new Date(), 1000);
            setInterval(() => refreshHeaderStatus(), 5000);
            setTimeout(refreshHeaderStatus, 800);
            setInterval(() => { if (!wsConnected.value) checkNotifications(); }, 10000);
            initWebSocket();
        });

        return {
            authenticated, authChecking, authDenied, langReady, login, password, loginError, loginLoading, doLogin, doLogout, testAPI: Auth.testAPI,
            headerTime, headerDate, headerStatusSectionOn, headerStatusList, headerStatusItems, headerStatusMaxReached,
            showHeaderStatusEditor, hsForm, hsProperties, hsEditIdx, openHeaderStatusEditor, loadHsProperties, clearHsObject, editHeaderStatusItem, saveHeaderStatusItem, removeHeaderStatusItem, hsMapArr, headerStatusImages: HEADER_STATUS_IMAGES,
            panels, currentPanel, selectPanel, selectHomePanel, goHome, loading, editMode,
            showAddWidget, widgetSearch, filteredDefs, plusTooltip, addPlusButton,
            widgetTypeComponent, addWidget, openWidgetHelp, getWidgetFields, getWidgetRows, getWidgetTabs, getFieldOptions, fieldVisible, g2rCameraOptions, loadGo2rtcCameras,
            getMethodObj, getMethodName, setMethodField, itemLabel, objectKeyOfField,
            editWidgetForm, editWidgetIsNew, widgetTab, widgetTabPos, editWidget, saveEditWidget, removeWidget,
        builderModel, builderReady, builderBusy, builderTitles, builderTypes, builderTarget, builderTargets,
        ensureBuilder, openBuilder, builderReset, builderAction, builderLoadZip, builderCloseNotice, widgetEditorTab,
        tplMode, tplReady, openTemplateTab, builderTemplateHtml, copyTemplateHtml,
            grDragState, grColors, grPreview, grAdd, grRemove, grSet, grDrop,
            editWidgetParent, groupAddTarget, removeGroupChild,
            groupChildrenList, startGroupChildAdd, closeEditor, moveGroupChildOut, confirmOutOfGroup, groupChildMouseDown, groupChildMouseMove, groupChildMouseUp, resetChildDrag, dragChildId, dragOverChildId,
            columnIdx, columnList, setColumns, addColumn, removeColumn, moveColumnUp, moveColumnDown, autoDetectColumns, columnFields, columnFieldVisible, getColumnFieldRows,
            seriesIdx, seriesList, setSeries, addSeries, removeSeries, setSeriesField, seriesProps, loadSeriesProps, seriesScaleOptions,
    slidesIdx, slidesList, addSlide, removeSlide, setSlideField, moveSlide,
            selectItems, addSelectItem, removeSelectItem, setSelectItemField,
            statusItems, addStatusItem, removeStatusItem, setStatusItemField, moveStatusItem, stMethodObj, stMethods, setStatusMethod,
            draggingWidget, startDrag, onDrag, stopDrag,
            resizingWidget, startResize, onResize, stopResize,
            widgetMenuTarget, widgetPanelSubmenu, widgetGroupSubmenu, widgetConfirm, copyWidget, exportWidget, changeWidgetPanel, selectMoveTarget, confirmMoveWidget, moveWidgetToGroup, confirmMoveToGroup,
            showChangeObject, changeObjectGroups, openChangeObject, saveChangeObject, widgetHasChangeObjects,
            showSettingsPanel, showWidgetEditorPanel, showHeaderPanel, openHeaderSettings, settings, savePanels, saveSettingsNow, settingsChanged, commitChanges, hasUnsavedChanges, toggleTheme, cleanupOrphanWidgets, resetAll,
            headerItems, headerDefs, headerHas, headerCount, headerAtLimit, headerCanRemove, headerInst, headerPanelSlots, headerValueSlots, headerSlotStyle, headerStyleAt, headerSpacerHint, headerDef, headerItemLabel, headerAddOpen, headerDragIndex,
            headerPanelList, headerPanelOpen, headerPanelForm, headerPanelCanSave, headerPanelItemOf, headerPanelHint, openHeaderPanelDialog, headerPanelGo, headerPanelSave,
            headerItemAdd, headerItemPut, headerItemRemove, headerItemsClear, headerItemsDefaults, headerDragStart, headerDragOver, headerDragEnd,
            headerValueOpen, headerValueProps, headerValueForm, headerValueCanSave, headerValueTexts, headerValueHint, headerValueTextOf, openHeaderValueDialog, headerValueLoadProps, headerValueSave, headerValueRefresh,
            headerLinkSlots, linkView, closeLinkView, headerLinkOpen, headerLinkTarget, headerLinkForm, headerLinkCanSave, headerLinkHint, openHeaderLinkDialog, headerLinkGo, headerLinkSave, HEADER_LINK_FALLBACK_ICON,
            showExportDialog, exportMode, exportSelectedPanel, exportUsers, exportSelectedUser, loadExportUsers, doExport, doImport,
            showCleanupDialog, cleanupReport, cleanupBusy, cleanupReasons, applyCleanup, restorePanels, runWizard,
            showAddPanel, editPanelData, panelForm, panelTab, panelTabPos, panelError, createPanel, editPanel, openPanelForm, deletePanel, deleteCurrentPanel, movePanel, isPanel, isNavActive, navItemClick, showAbout, toggleField,
            showIconPicker, iconTarget, iconSearch, iconCategory, iconCategorySearch, iconPage, iconCategories, filteredIconCategories, filteredIcons, totalPages, paginatedIcons, openIconPicker, selectIcon, iconPicked,
            showDirPicker, dirTarget, dirPickerPath, dirPickerItems, dirPickerUp, dirPickerLoading, dirPickerError, dirPickerPicked, openDirPicker, dirPickerGo, closeDirPicker, dirPickerOk,
            objects, iconProperties, infoProperties, widgetProperties, bgProperties, extraProperties, scripts, methodCache, loadObjects, loadScripts, loadIconProperties, loadInfoProperties, loadWidgetProperties, loadBgProperties, loadObjectMethods, widgetBgStyle, ownWidgetRadius,
            isAdmin, toggleEditMode, wsConnected, wsTooltip, wsStatus, wsPulse, wsBytesSent, wsBytesReceived, wsRev, user, userMenuOpen, sidebarMini, toggleSidebar, expandedGroups, childPanels, toggleGroup, forceRefresh, formatBytes,
            showNotifications, notifications, unreadCount, checkNotifications, markNotificationsRead, notifAvatarUrl, notifAvatarFallback,
            chatOpen, chatMessages, chatText, chatLoading, loadChat, sendChat, toggleChat, formatTime,
            widgetList, widgetUsage, exportWidgetZip, setWidgetEnabled, copyWidgetDef, deleteWidgetDef, pickWidgetZip, widgetName,
            widgetDefMouseDown, widgetDefMouseMove, widgetDefMouseUp, dragWidgetDefId, dragWidgetDefOverId,
            t
        };
    }
});

app.config.globalProperties.t = window.__t;

    if (window.DpBuilderUI && !app.component('dp-builder')) {
        app.component('dp-builder', window.DpBuilderUI);
    }

    /* The icon of a widget has three kinds, and only one of them is a Font Awesome
       class. "url" keeps the path to the file and "property" keeps the name of the
       object and the property where that path is stored, so both end up as a
       picture and only "icon" stays a class. The widgets themselves were written
       when the type did nothing and all of them draw
       <i :class="widget.icon"> - so instead of thirty one templates, every widget
       gets these fields through a mixin, and a template that asks for iconSrc
       shows the picture. A widget that still draws only widget.icon keeps working
       exactly as before. */
    const widgetIconMixin = {
        data() {
            return { _iconSrc: '', _iconFor: '' };
        },
        computed: {
            iconType() {
                const w = this.widget || {};
                const t = String(w.icon_type || w.iconType || 'icon');
                return (t === 'property' || t === 'url') ? t : 'icon';
            },
            iconSrc() {
                /* a picture is shown only for url and property; for a class the
                   widget keeps drawing widget.icon itself */
                if (this.iconType === 'icon') return '';
                return this._iconSrc || '';
            }
        },
        mounted() {
            this.loadIconSrc();
        },
        watch: {
            'widget.icon_type': function () { this.loadIconSrc(); },
            'widget.icon_object': function () { this.loadIconSrc(); },
            'widget.icon_property': function () { this.loadIconSrc(); },
            'widget.icon_url': function () { this.loadIconSrc(); }
        },
        methods: {
            loadIconSrc() {
                const w = this.widget || {};
                if (this.iconType === 'icon') {
                    if (this._iconSrc) { this._iconSrc = ''; this._iconFor = ''; }
                    return Promise.resolve();
                }
                const obj = String(w.icon_object || w.iconObject || '').trim();
                const prop = String(w.icon_property || w.iconProperty || '').trim();
                /* the url is already the path to the file */
                if (this.iconType === 'url') {
                    const u = String(w.icon_url || w.iconUrl || '').trim();
                    this._iconSrc = u;
                    this._iconFor = u ? 'url:' + u : '';
                    return Promise.resolve();
                }
                if (!obj || !prop) {
                    this._iconSrc = ''; this._iconFor = '';
                    return Promise.resolve();
                }
                const key = 'property:' + obj + '.' + prop;
                /* the same pair is asked for by every widget on the page, so the
                   value that came back is kept for the others */
                const shared = window.__dpIconPropCache || (window.__dpIconPropCache = {});
                const self = this;
                this._iconSeq = (this._iconSeq || 0) + 1;
                const seq = this._iconSeq;
                const apply = (v) => {
                    if (seq !== self._iconSeq) return;
                    self._iconSrc = String(v || '').trim();
                    self._iconFor = key;
                };
                if (shared[key] !== undefined) { apply(shared[key]); return Promise.resolve(); }
                return Promise.resolve(dpAPI('getProperty?' + new URLSearchParams({ object: obj, property: prop })))
                    .then(r => {
                        const v = (r && r.value !== undefined && r.value !== null) ? r.value : '';
                        shared[key] = String(v).trim();
                        apply(shared[key]);
                    })
                    .catch(() => {
                        /* a wrong or unreachable property leaves the icon empty;
                           it must not break the widget itself */
                        shared[key] = '';
                        apply('');
                    });
            }
        }
    };

    function registerWidgetComponent(type) {
    if (app.component('widget-' + type)) return app.component('widget-' + type);
    const comp = (window.DpWidgets && window.DpWidgets[type]) || null;
    const withIcon = (c) => {
        if (!c) return c;
        /* the widget keeps its own mixins and hooks; the icon fields are added to
           them, so a widget that never draws a picture is not touched */
        const base = { template: '<div>' + (widgetName(type) || type) + '</div>' };
        const src = c === base ? base : c;
        return { ...src, mixins: [widgetIconMixin].concat(src.mixins || []) };
    };
    app.component('widget-' + type,
        withIcon(comp) || { template: '<div>' + (widgetName(type) || type) + '</div>' });
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
