const WeatherWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'title', label: 'Название', type: 'text' },
            { key: 'icon_type', label: 'Тип иконки', type: 'select', row: 'icon_row', options: [{value:'icon',label:'Иконка'},{value:'property',label:'Свойство'},{value:'url',label:'URL'}] },
            { key: 'icon', label: 'Иконка', type: 'icon_picker', row: 'icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_object', label: 'Объект (иконка)', type: 'object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_property', label: 'Свойство (иконка)', type: 'property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_url', label: 'URL иконки', type: 'text', row: 'icon_row', showIf: { icon_type: 'url' } },
            { key: 'api_key', label: 'API Key (OpenWeatherMap)', type: 'text' },
            { key: 'city_id', label: 'City ID', type: 'text', placeholder: 'ID города' },
            { key: 'lat', label: 'Широта', type: 'text', placeholder: '55.75', row: 'coord' },
            { key: 'lon', label: 'Долгота', type: 'text', placeholder: '37.62', row: 'coord' },
            { key: 'help', type: 'info', text: 'Укажите API Key и City ID, или координаты' },
        ],
        advanced: [
            { key: 'bg_mode', label: 'Фон виджета', type: 'select', row: 'bg_row', options: [{value:'default',label:'По умолчанию'},{value:'image',label:'Изображение'},{value:'color',label:'Заданный цвет'},{value:'property',label:'Цвет из свойства'}] },
            { key: 'color', label: 'Цвет', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'URL изображения', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'Объект (цвет)', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'Свойство (цвет)', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
    },
    defaults: { icon: 'fas fa-cloud-sun', icon_type: 'icon', api_key: '', city_id: '', lat: '', lon: '' },
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Погода' }}</div>
            </div>
            <div class="widget-v-card__body" style="display:flex;flex-direction:column;flex:1;padding:8px 12px">
                <div v-if="loading" style="text-align:center;color:rgba(255,255,255,.5);padding:12px">Загрузка...</div>
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
                        <span><i class="fas fa-wind"></i> {{ data.wind }} м/с</span>
                    </div>
                </template>
                <div v-else style="text-align:center;color:rgba(255,255,255,.35);padding:12px;font-size:.8rem">Укажите City ID или координаты</div>
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
