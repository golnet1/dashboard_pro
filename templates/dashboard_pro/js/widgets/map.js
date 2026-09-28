const MapWidget = {
    MOSCOW: [55.75, 37.62],
    GEO_TIMEOUT: 8000,
    props: ['widget'],
    tabs: [
        { key: 'main', label: 'tab_main', fields: 'params' },
        { key: 'advanced', label: 'tab_advanced', fields: 'advanced' },
    ],
    fields: {
        params: [
            { key: 'title', label: 'field_title', type: 'text' },
            { key: 'icon_type', label: 'field_icon_type', type: 'select', row: 'icon_row', options: [{value:'icon',label:'opt_icon'},{value:'property',label:'opt_property'},{value:'url',label:'opt_url'}] },
            { key: 'icon', label: 'field_icon', type: 'icon_picker', row: 'icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_object', label: 'field_icon_object', type: 'object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_property', label: 'field_icon_property', type: 'property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_url', label: 'field_icon_url', type: 'text', row: 'icon_row', showIf: { icon_type: 'url' } },
            { key: 'provider', label: 'field_map_provider', type: 'select', row: 'map_row', default: '0', options: [
                {value:'0',label:'opt_map_osm'},
                {value:'1',label:'opt_map_2gis'},
                {value:'2',label:'opt_map_yandex'},
                {value:'5',label:'opt_map_gmap_streets'},
                {value:'6',label:'opt_map_gmap_hybrid'},
                {value:'7',label:'opt_map_gmap_sat'},
            ] },
            { key: 'zoom', label: 'field_zoom', type: 'number', row: 'map_row', default: 15 },
            { key: 'object', label: 'field_object', type: 'object', row: 'obj_prop' },
            { key: 'property', label: 'field_property', type: 'property', row: 'obj_prop' },
            { key: 'lat', label: 'field_latitude', type: 'text', placeholder: '55.75', default: '55.75', row: 'coord' },
            { key: 'lon', label: 'field_longitude', type: 'text', placeholder: '37.62', default: '37.62', row: 'coord' },
        ],
        advanced: [
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
    },
    defaults: { icon: 'fas fa-map-marker-alt', icon_type: 'icon', provider: '0', zoom: 15, lat: '55.75', lon: '37.62', height: 180 },
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header dp-map__head">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || t('widget_map') }}</div>
            </div>
            <div class="widget-v-card__body dp-map__body">
                <div class="dp-map__box">
                    <div ref="map" class="dp-map__canvas"></div>
                    <div v-if="showMessage" class="dp-map__msg">
                        <span>{{ t(mapMessageKey) }}</span>
                        <span v-if="mapError === 'init' && mapErrorText" style="display:block;margin-top:4px;font-size:.7rem;opacity:.7;word-break:break-word">{{ mapErrorText }}</span>
                    </div>
                    <div v-if="ready && tilesFailed" class="dp-map__badge">{{ t('map_tiles_failed') }}</div>
                </div>
                <div v-if="coordStr" class="dp-map__coord">{{ coordStr }}</div>
            </div>
        </div>`,
    data() {
        return {
            lat: null, lon: null, timer: null, ready: false, failed: false,
            map: null, layer: null, marker: null, ro: null, tries: 0, mapError: '', mapErrorText: '',
            tileErrors: 0, tilesFailed: false, geo: null, locateDone: false, viewed: false
        };
    },
    computed: {
        providers() {
            return [
                { id: 0, url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: 'OpenStreetMap' },
                { id: 1, url: 'https://tile2.maps.2gis.com/tiles?x={x}&y={y}&z={z}', attribution: '2GIS' },
                { id: 2, url: 'https://core-renderer-tiles.maps.yandex.ru/tiles?l=map&x={x}&y={y}&z={z}', attribution: 'Yandex' },
                { id: 5, url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], attribution: 'Google' },
                { id: 6, url: 'https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], attribution: 'Google' },
                { id: 7, url: 'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], attribution: 'Google' },
            ];
        },
        // legacy provider ids -> current; old Yandex satellite/hybrid degrade to the base map
        providerAlias() {
            return { 3: 2, 4: 2 };
        },
        tileOptions() {
            const o = { reuseTiles: true, updateWhenIdle: false, attribution: this.provider.attribution || '' };
            if (this.provider.subdomains) o.subdomains = this.provider.subdomains;
            return o;
        },
        provider() {
            const raw = parseInt(this.widget.provider, 10);
            if (isNaN(raw)) return this.providers[0];
            const byId = this.providers.find(p => p.id === raw);
            if (byId) return byId;
            const alias = this.providerAlias[raw];
            const remapped = (alias === undefined) ? null : this.providers.find(p => p.id === alias);
            return remapped || this.providers[0];
        },
        zoom() {
            const z = parseFloat(this.widget.zoom);
            return isNaN(z) ? 15 : z;
        },
        // explicit settings/object coords, then browser geolocation, then Moscow
        center() {
            const fixed = this.rawCenter();
            if (fixed) return fixed;
            if (this.geo) return this.geo;
            return this.locateDone ? MapWidget.MOSCOW : null;
        },
        coordStr() {
            const c = this.center;
            return c ? c[0].toFixed(4) + ', ' + c[1].toFixed(4) : '';
        },
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        },
        showMessage() {
            if (this.ready && !this.center) return true;
            return !this.ready && this.mapError !== 'wait';
        },
        mapMessageKey() {
            if (this.ready && !this.center) return 'map_locating';
            if (this.mapError === 'leaflet') return 'map_no_leaflet';
            if (this.mapError === 'size') return 'map_no_size';
            return 'map_error';
        }
    },
    watch: {
        'widget.provider': function () { this.applyProvider(); },
        'widget.zoom': function () { if (this.map) this.map.setZoom(this.zoom); }
    },
    mounted() {
        this.init();
        this.load();
        const obj = this.widget.object_value || this.widget.object;
        if (obj && !window.__dpWsLive) this.timer = setInterval(() => this.load(), 30000);
    },
    beforeUnmount() { this.destroy(); },
    methods: {
        // coordinates as configured, or null when they could not be determined
        rawCenter() {
            if (this.lat !== null && this.lon !== null) return [this.lat, this.lon];
            const la = parseFloat(this.widget.lat), lo = parseFloat(this.widget.lon);
            if (!isNaN(la) && !isNaN(lo)) return [la, lo];
            return null;
        },
        raw(o) { return (window.Vue && window.Vue.markRaw) ? window.Vue.markRaw(o) : o; },
        init() {
            if (typeof ResizeObserver !== 'undefined' && this.$refs.map) {
                this.ro = new ResizeObserver(() => this.onResize());
                this.ro.observe(this.$refs.map);
            }
            this._resize = () => this.onResize();
            window.addEventListener('resize', this._resize);
            this.waitLeaflet();
        },
        waitLeaflet() {
            if (this.destroyed || this.map || this.ready) return;
            const el = this.$refs.map;
            if (!el) { this.retry(); return; }
            if (!window.L) {
                if (this.tries > 25) this.mapError = 'leaflet';
                this.retry();
                return;
            }
            if (!this.ensureSize(el)) { this.retry(); return; }
            try {
                this.createMap(el);
            } catch (e) {
                this.mapError = 'init';
                this.mapErrorText = (e && e.message) ? e.message : String(e);
                console.error('MapWidget init failed', e);
            }
        },
        ensureSize(el) {
            if (el.offsetWidth >= 20 && el.offsetHeight >= 20) return true;
            const host = el.closest ? el.closest('.widget') : null;
            const r = (host || el.parentElement || {}).getBoundingClientRect
                ? (host || el.parentElement).getBoundingClientRect()
                : null;
            if (r && r.width >= 20 && r.height >= 20) {
                el.style.width = Math.round(r.width) + 'px';
                el.style.height = Math.round(r.height) + 'px';
                return el.offsetWidth >= 20 && el.offsetHeight >= 20;
            }
            return false;
        },
        retry() {
            this.tries++;
            if (this.mapError !== 'init' && this.mapError !== 'leaflet' && this.mapError !== 'size') this.mapError = 'wait';
            if (this.tries > 100) { if (this.mapError === 'wait') this.mapError = 'size'; return; }
            this._t = setTimeout(() => this.waitLeaflet(), 200);
        },
        createMap(el) {
            if (this.map) return;
            if (this._t) { clearTimeout(this._t); this._t = null; }
            const L = window.L;
            el.style.width = '100%';
            el.style.height = '100%';
            this.map = this.raw(L.map(el, {
                zoomSnap: 0.5,
                zoomControl: false,
                attributionControl: true,
                reuseTiles: true,
                updateWhenIdle: false
            }));
            this.layer = this.raw(L.tileLayer(this.provider.url, this.tileOptions)).addTo(this.map);
            this.watchTiles();
            this.mapError = '';
            this.mapErrorText = '';
            this.ready = true;
            this.startLocate();
            this.setView();
        },
        watchTiles() {
            if (!this.layer || !this.layer.on) return;
            this.tileErrors = 0;
            this.layer.on('tileerror', () => {
                this.tileErrors++;
                if (this.tileErrors >= 4) this.tilesFailed = true;
            });
            this.layer.on('tileload', () => { this.tilesFailed = false; });
        },
        applyProvider() {
            if (!this.map || !this.layer) return;
            const o = this.tileOptions;
            this.layer.setUrl(this.provider.url, o);
            this.tilesFailed = false;
            this.tileErrors = 0;
            this.watchTiles();
        },
        onResize() {
            if (!this.map) return;
            try { this.map.invalidateSize({ animate: false }); } catch (e) { /* noop */ }
        },
        // coordinates come from the browser; Moscow only when it cannot tell us where we are
        startLocate() {
            if (this.rawCenter() || this._geoStarted) return;
            this._geoStarted = true;
            if (typeof navigator === 'undefined' || !navigator.geolocation) {
                this.locateFail();
                return;
            }
            this._geoTimer = setTimeout(() => this.locateFail(), MapWidget.GEO_TIMEOUT);
            navigator.geolocation.getCurrentPosition(pos => {
                this.onLocated(pos.coords.latitude, pos.coords.longitude);
            }, () => this.locateFail(), { enableHighAccuracy: false, timeout: MapWidget.GEO_TIMEOUT, maximumAge: 600000 });
        },
        locateFail() {
            if (this._geoTimer) { clearTimeout(this._geoTimer); this._geoTimer = null; }
            this.locateDone = true;
            this.setView();
        },
        onLocated(lat, lon) {
            if (this._geoTimer) { clearTimeout(this._geoTimer); this._geoTimer = null; }
            this.geo = [lat, lon];
            this.locateDone = true;
            this.setView();
        },
        setView() {
            if (!this.map || this.viewed) return;
            const c = this.center;
            if (!c) return;
            this.map.setView(c, this.zoom);
            this.viewed = true;
            this.mapError = '';
            this.mapErrorText = '';
            this.setMarker();
            this.onResize();
        },
        setMarker() {
            if (!this.map || !window.L) return;
            const c = this.center;
            if (!c) return;
            if (this.marker) this.marker.setLatLng(c);
            else this.marker = this.raw(window.L.marker(c).addTo(this.map));
            if (this.marker.getPopup()) this.marker.setPopupContent(this.coordStr);
            else this.marker.bindPopup(this.coordStr);
        },
        applyCenter() {
            if (!this.map) return;
            const c = this.center;
            if (!c) return;
            this.setMarker();
            const cur = this.map.getCenter();
            if (!cur || cur.lat !== c[0] || cur.lng !== c[1]) this.map.setView(c, this.zoom);
        },
        async load() {
            const obj = this.widget.object_value || this.widget.object;
            if (!obj) {
                this.startLocate();
                this.applyCenter();
                return;
            }
            try {
                const d = await dpAPI('getProperty?' + new URLSearchParams({ object: obj, property: this.widget.property || 'coordinates' }));
                if (!d.error && d.value !== undefined && d.value !== null) {
                    const parts = String(d.value).split(/[,;:\s]+/);
                    if (parts.length >= 2) {
                        const la = parseFloat(parts[0]), lo = parseFloat(parts[1]);
                        if (!isNaN(la) && !isNaN(lo)) { this.lat = la; this.lon = lo; }
                    }
                }
            } catch (e) { /* silent */ }
            if (this.rawCenter()) this.setView();
            this.applyCenter();
        },
        destroy() {
            this.destroyed = true;
            if (this._t) clearTimeout(this._t);
            if (this._geoTimer) clearTimeout(this._geoTimer);
            if (this.timer) clearInterval(this.timer);
            if (this._resize) window.removeEventListener('resize', this._resize);
            if (this.ro) { this.ro.disconnect(); this.ro = null; }
            if (this.map) { try { this.map.remove(); } catch (e) { /* noop */ } this.map = null; }
            this.layer = null;
            this.marker = null;
        }
    }
};

window.DpWidgets = window.DpWidgets || {};
window.DpWidgets.map = MapWidget;
