const MusicRemoteWidget = {
    props: ['widget'],
    fields: {
        params: [
            { key: 'title', label: 'field_title', type: 'text' },
            { key: 'icon_type', label: 'field_icon_type', type: 'select', row: 'icon_row', options: [{value:'icon',label:'opt_icon'},{value:'property',label:'opt_property'},{value:'url',label:'opt_url'}] },
            { key: 'icon', label: 'field_icon', type: 'icon_picker', row: 'icon_row', showIf: { icon_type: 'icon' } },
            { key: 'icon_object', label: 'field_icon_object', type: 'object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_property', label: 'field_icon_property', type: 'property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { key: 'icon_url', label: 'field_icon_url', type: 'text', row: 'icon_row', showIf: { icon_type: 'url' } },
            { key: 'send_mode', label: 'field_send_mode', type: 'select', row: 'send_row', options: [{value:'property',label:'opt_set_property'},{value:'command',label:'opt_command'},{value:'script',label:'opt_script'}] },
            { key: 'object', label: 'field_send_object', type: 'object', row: 'obj_prop', showIf: { send_mode: 'property' } },
            { key: 'property', label: 'field_property', type: 'property', row: 'obj_prop', showIf: { send_mode: 'property' } },
            { key: 'command_prefix', label: 'field_command_prefix', type: 'text', row: 'obj_prop', showIf: { send_mode: 'command' }, placeholder: 'ph_command_prefix' },
            { key: 'script', label: 'field_script', type: 'text', row: 'obj_prop', showIf: { send_mode: 'script' }, placeholder: 'ph_script' },
            { key: 'codes', label: 'field_codes', type: 'textarea', rows: 6, placeholder: 'ph_codes' },
        ],
        advanced: [
            { key: 'bg_mode', label: 'field_bg_mode', type: 'select', row: 'bg_row', options: [{value:'default',label:'opt_default'},{value:'image',label:'opt_image'},{value:'color',label:'opt_custom_color'},{value:'property',label:'opt_color_property'}] },
            { key: 'color', label: 'field_color', type: 'color', row: 'bg_row', showIf: { bg_mode: 'color' } },
            { key: 'bg_image', label: 'field_image_url', type: 'text', row: 'bg_row', showIf: { bg_mode: 'image' } },
            { key: 'bg_object', label: 'field_bg_object', type: 'object', row: 'bg_row', showIf: { bg_mode: 'property' } },
            { key: 'bg_property', label: 'field_bg_property', type: 'property', row: 'bg_row', showIf: { bg_mode: 'property' } },
        ],
    },
    defaults: { icon: 'fas fa-music', icon_type: 'icon', property: 'value', send_mode: 'property', codes: '' },
    template: `
        <div class="widget-v-card" :style="cardStyle" style="display:flex;flex-direction:column">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || t('widget_musicremote') }}</div>
            </div>
            <div class="widget-v-card__body dp-remote__body">
                <button class="dp-remote__power" @click="press('power')" :title="t('rc_power')"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 3.5v8"/><path d="M6.4 7.2a8 8 0 1 0 11.2 0"/></svg></button>
                <div class="dp-remote__transport">
                    <button class="dp-remote__key dp-remote__key--p" @click="press('prev')" :title="t('rc_prev')"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6 5h3v14H6V5zm13 0v14l-9.5-7L19 5z"/></svg></button>
                    <button class="dp-remote__key dp-remote__key--p dp-remote__key--main" :class="{ 'dp-remote__key--play': playing }" @click="togglePlay" :title="playing ? t('rc_pause') : t('rc_play')"><svg v-if="playing" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M7 5h4v14H7V5zm6 0h4v14h-4V5z"/></svg><svg v-else viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8 5v14l11-7L8 5z"/></svg></button>
                    <button class="dp-remote__key dp-remote__key--p" @click="press('next')" :title="t('rc_next')"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M15 5h3v14h-3V5zM5 5v14l9.5-7L5 5z"/></svg></button>
                </div>
                <div class="dp-remote__row">
                    <button class="dp-remote__key dp-remote__key--wide" @click="press('stop')">{{ t('rc_stop') }}</button>
                    <button class="dp-remote__key dp-remote__key--wide" @click="press('pause')">{{ t('rc_pause') }}</button>
                    <button class="dp-remote__key dp-remote__key--wide" @click="press('eject')">{{ t('rc_eject') }}</button>
                </div>
                <div class="dp-remote__row">
                    <button class="dp-remote__key dp-remote__key--wide" @click="press('vol-')">{{ t('rc_vol_down') }}</button>
                    <button class="dp-remote__key dp-remote__key--wide" @click="press('mute')">{{ t('rc_mute') }}</button>
                    <button class="dp-remote__key dp-remote__key--wide" @click="press('vol+')">{{ t('rc_vol_up') }}</button>
                </div>
                <div class="dp-remote__row">
                    <button class="dp-remote__key dp-remote__key--wide" :class="{ 'dp-remote__key--active': src === 'cd' }" @click="selectSrc('cd')">{{ t('rc_cd') }}</button>
                    <button class="dp-remote__key dp-remote__key--wide" :class="{ 'dp-remote__key--active': src === 'usb' }" @click="selectSrc('usb')">{{ t('rc_usb') }}</button>
                    <button class="dp-remote__key dp-remote__key--wide" :class="{ 'dp-remote__key--active': src === 'bt' }" @click="selectSrc('bt')">{{ t('rc_bt') }}</button>
                </div>
                <div class="dp-remote__row">
                    <button class="dp-remote__key dp-remote__key--wide" :class="{ 'dp-remote__key--active': src === 'aux' }" @click="selectSrc('aux')">{{ t('rc_aux') }}</button>
                    <button class="dp-remote__key dp-remote__key--wide" @click="press('mode')">{{ t('rc_mode') }}</button>
                    <button class="dp-remote__key dp-remote__key--wide" @click="press('eq')">{{ t('rc_eq') }}</button>
                </div>
            </div>
        </div>`,
    data() { return { playing: false, src: '' }; },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        },
        codeMap() {
            try { return JSON.parse(this.widget.codes || '{}'); } catch (e) { return {}; }
        }
    },
    methods: {
        codeFor(k) {
            const v = this.codeMap[k];
            if (v !== undefined && v !== null && v !== '') return String(v);
            const tv = { power: 'Power', prev: 'Previous', next: 'Next', 'vol+': 'VolumeUp', 'vol-': 'VolumeDown', mute: 'Mute', stop: 'Stop', pause: 'Pause', play: 'PlayPause' };
            return tv[k] || k;
        },
        async send(k) {
            const code = this.codeFor(k);
            try {
                if (this.widget.send_mode === 'script') {
                    await dpAPI('scriptRun?' + new URLSearchParams({ script: this.widget.script, param: code }));
                } else if (this.widget.send_mode === 'command') {
                    await dpAPI('execCommand?' + new URLSearchParams({ command: (this.widget.command_prefix || '') + code }));
                } else if (this.widget.object) {
                    const params = { object: this.widget.object, value: code };
                    if (this.widget.property) params.property = this.widget.property;
                    await dpAPI('setProperty?' + new URLSearchParams(params));
                }
            } catch (e) { console.error(e); }
        },
        press(k) { this.send(k); },
        togglePlay() {
            this.playing = !this.playing;
            this.send(this.playing ? 'play' : 'pause');
        },
        selectSrc(s) {
            this.src = s;
            this.send(s);
        }
    }
};

window.DpWidgets = window.DpWidgets || {};
window.DpWidgets.musicremote = MusicRemoteWidget;