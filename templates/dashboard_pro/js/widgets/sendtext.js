const SendTextWidget = {
    props: ['widget'],
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ widget.title || 'Отправить' }}</div>
            </div>
            <div class="widget-v-card__body" style="display:flex;flex-direction:column;gap:8px;padding:8px 12px">
                <div style="display:flex;gap:6px">
                    <input v-model="text" :placeholder="widget.placeholder || 'Введите текст'" style="flex:1;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:4px;padding:8px 10px;color:#fff;font-size:.9rem;outline:none" @keyup.enter="send">
                    <button class="icon-btn" @click="send" title="Отправить" style="margin-top:0"><i class="fas fa-paper-plane"></i></button>
                </div>
                <div v-if="response" style="font-size:.8rem;color:rgba(255,255,255,.6);word-break:break-all">{{ response }}</div>
            </div>
        </div>`,
    data() { return { text: '', response: '', sending: false }; },
    computed: {
        cardStyle() {
            const s = {};
            if (this.widget.color) s.backgroundColor = this.widget.color;
            return s;
        }
    },
    methods: {
        async send() {
            if (!this.text || this.sending) return;
            this.sending = true;
            this.response = '';
            try {
                const url = (this.widget.url || '').replace('<text>', encodeURIComponent(this.text));
                if (url) {
                    const r = await fetch(url);
                    const t = await r.text();
                    this.response = t.substring(0, 200);
                } else if (this.widget.object && this.widget.property) {
                    await dpAPI('setProperty?' + new URLSearchParams({ object: this.widget.object, value: this.text }));
                    this.response = 'OK';
                }
            } catch(e) { this.response = 'Ошибка: ' + e.message; }
            this.sending = false;
            if (!this.widget.url && !this.widget.object) this.response = '';
        }
    }
};
