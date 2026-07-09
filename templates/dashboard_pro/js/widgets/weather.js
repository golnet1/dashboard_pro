const WeatherWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'title', label: 'field_title', type: 'text' },
            { key: 'icon_type', label: 'field_icon_type', type: 'select', row: 'icon_row', options: [{value:'icon',label:'opt_icon'},{value:'property',label:'opt_property'},{value:'url',label:'opt_url'}] },
            { key: 'icon', label: 'field_icon', type: 'icon_picker', row: 'icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_object', label: 'field_icon_object', type: 'object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_property', label: 'field_icon_property', type: 'property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_url', label: 'field_icon_url', type: 'text', row: 'icon_row', showIf: { icon_type: 'url' } },
            { key: 'api_key', label: 'field_api_key', type: 'text' },
            { key: 'city_id', label: 'field_city_id', type: 'text', placeholder: 'ph_city_id' },
            { key: 'lat', label: 'field_latitude', type: 'text', placeholder: '55.75', row: 'coord' },
            { key: 'lon', label: 'field_longitude', type: 'text', placeholder: '37.62', row: 'coord' },
            { key: 'help', type: 'info', text: 'help_city_id_or_coords' },
        ],
        advanced: [
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
    },
    defaults: { icon: 'fas fa-cloud-sun', icon_type: 'icon', api_key: '', city_id: '', lat: '', lon: '' },
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || t('widget_weather') }}</div>
            </div>
            <div class="widget-v-card__body" style="display:flex;flex-direction:column;flex:1;padding:8px 12px">
                <div v-if="loading" style="text-align:center;color:rgba(255,255,255,.5);padding:12px">{{ t('loading_data') }}</div>
                <template v-else-if="data">
                    <div style="display:flex;align-items:center;gap:12px">
                        <div v-if="data.icon" style="font-size:3rem;line-height:1"><img :src="'https://openweathermap.org/img/wn/' + data.icon + '@2x.png'" style="width:64px;height:64px"></div>
                        <div>
                            <div style="font-size:1.8rem;font-weight:300;color:rgba(255,255,255,.87)">{{ data.temp }}°C</div>
                            <div style="font-size:.85rem;color:rgba(255,255,255,.5)">{{ data.description }}</div>
                        </div>
                    </div>
                    <div style="display:flex;gap:16px;margin-top:8px;font-size:.8rem;color:rgba(255,255,255,.5)">
                        <span><i class="fas fa-tint"></i> {{ data.humidity }}%</span>
                        <span><i class="fas fa-wind"></i> {{ data.wind }} {{ t('unit_wind_speed') }}</span>
                    </div>
                </template>
                <div v-else style="text-align:center;color:rgba(255,255,255,.35);padding:12px;font-size:.8rem">{{ t('enter_city_id_or_coords') }}</div>
            </div>
        </div>`,
    data() { return { data: null, loading: false, timer: null }; },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        }
    },
    mounted() {
        this.fetchWeather();
        this.timer = setInterval(() => this.fetchWeather(), 600000);
    },
    beforeUnmount() { if (this.timer) clearInterval(this.timer); },
    methods: {
        async fetchWeather() {
            const apiKey = this.widget.api_key || '';
            const cityId = this.widget.city_id || '';
            const lat = this.widget.lat, lon = this.widget.lon;
            if ((!cityId && (!lat || !lon)) || !apiKey) { this.loading = false; return; }
            this.loading = true;
            try {
                const params = cityId ? { id: cityId, appid: apiKey, units: 'metric', lang: 'ru' } : { lat, lon, appid: apiKey, units: 'metric', lang: 'ru' };
                const r = await fetch('https://api.openweathermap.org/data/2.5/weather?' + new URLSearchParams(params));
                const j = await r.json();
                if (j.main) {
                    this.data = {
                        temp: Math.round(j.main.temp),
                        humidity: j.main.humidity,
                        wind: Math.round(j.wind.speed * 10) / 10,
                        description: j.weather[0].description,
                        icon: j.weather[0].icon,
                        city: j.name
                    };
                }
            } catch(e) {}
            this.loading = false;
        }
    }
};
