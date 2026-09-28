const ChatWidget = {
    props: ['widget'],
    tabs: [
        { key: 'main', label: 'tab_main', fields: 'params' },
    ],
    fields: {
        params: [
            { key: 'hideTitle', label: 'field_hide_title', type: 'checkbox', default: false },
            { key: 'hideSend', label: 'field_hide_send', type: 'checkbox', default: false },
            { key: 'showName', label: 'field_show_name', type: 'checkbox', default: true },
            { key: 'sizeImage', label: 'field_chat_image_size', type: 'number', default: 150 },
        ],
    },
    defaults: { icon: 'fas fa-comments', hideTitle: false, hideSend: false, showName: true, sizeImage: 150, height: 300 },
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header" v-if="!widget.hideTitle">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ t('widget_chat') }}</div>
                <div class="widget-v-card__spacer"></div>
                <button :title="t('refresh')" @click="loadMessages" style="flex-shrink:0;width:26px;height:26px;border:none;border-radius:50%;background:rgba(255,255,255,.08);color:var(--on-theme-mid);cursor:pointer;display:flex;align-items:center;justify-content:center">
                    <i class="fas fa-refresh" :class="{ 'fa-spin': loading }"></i>
                </button>
            </div>
            <div class="widget-v-card__body" style="flex:1;min-height:0;overflow:auto;padding:0 12px 8px">
                <div v-if="messages.length === 0" style="padding:12px 0;color:var(--on-theme-mid);font-size:.85rem">{{ t('chat_empty') }}</div>
                <div v-for="m in messages" :key="m.ID" style="display:flex;align-items:flex-start;gap:8px;padding:4px 0">
                    <div style="flex-shrink:0;width:36px;padding-top:2px;font-size:.7rem;color:var(--on-theme-dim)" :title="m.ADDED">{{ shortTime(m) }}</div>
                    <div style="flex:1;min-width:0">
                        <div v-if="showName && authorName(m)" style="font-size:.72rem;margin-bottom:1px" :style="{ color: isMine(m) ? 'var(--on-theme-mid)' : 'var(--on-theme-dim)' }">{{ authorName(m) }}</div>
                        <div style="color:var(--on-theme-high);word-break:break-word;white-space:pre-wrap">{{ m.MESSAGE }}</div>
                        <a v-if="m.IMAGE" :href="m.IMAGE" target="_blank" rel="noopener">
                            <img :src="m.IMAGE" :style="imageStyle" alt="" style="margin-top:4px;border-radius:4px;display:block">
                        </a>
                    </div>
                    <div style="flex-shrink:0;width:24px;height:24px;margin-top:2px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.08)">
                        <img :src="avatarUrl(m)" alt="" style="width:100%;height:100%;object-fit:cover" loading="lazy">
                    </div>
                </div>
            </div>
            <div v-if="!widget.hideSend" style="display:flex;align-items:center;gap:6px;padding:6px 8px;border-top:1px solid rgba(255,255,255,.12)">
                <input v-model="command" :placeholder="t('field_command')" :disabled="sending" @keyup.enter="sendMessage" style="flex:1;min-width:0;padding:6px 10px;border:1px solid rgba(255,255,255,.15);border-radius:6px;background:rgba(255,255,255,.05);color:var(--on-theme-high);font-size:.9rem;outline:none">
                <button :disabled="sending || !command.trim()" @click="sendMessage" style="flex-shrink:0;width:32px;height:32px;border:none;border-radius:50%;background:var(--primary);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>`,
    data() {
        return { items: [], command: '', me: {}, loading: false, sending: false, timer: null };
    },
    mounted() {
        this.loadMessages();
        this.timer = setInterval(() => this.loadMessages(), 10000);
    },
    beforeUnmount() { if (this.timer) clearInterval(this.timer); },
    computed: {
        messages() {
            return this.items.slice().sort((a, b) => {
                if (a.ADDED < b.ADDED) return 1;
                if (a.ADDED > b.ADDED) return -1;
                return Number(b.ID) - Number(a.ID);
            });
        },
        imageStyle() {
            const s = Math.min(Math.max(Number(this.widget.sizeImage) || 150, 30), 400);
            return { maxHeight: s + 'px', maxWidth: s + 'px' };
        },
        showName() {
            const v = this.widget.showName;
            if (v === undefined || v === null || v === '') return true;
            if (typeof v === 'string') {
                const s = v.toLowerCase();
                return !(s === '0' || s === 'false' || s === 'no' || s === 'off');
            }
            return !!v;
        },
        cardStyle() {
            return this.widget.color ? { backgroundColor: this.widget.color } : {};
        },
    },
    methods: {
        async loadMessages() {
            if (this.loading) return;
            this.loading = true;
            try {
                const d = await dpAPI('chat');
                if (d && !d.error && Array.isArray(d.items)) {
                    this.items = d.items;
                    if (d.me) this.me = d.me;
                }
            } catch (e) { /* silent */ }
            finally { this.loading = false; }
        },
        async sendMessage() {
            const text = (this.command || '').trim();
            if (!text || this.sending) return;
            this.sending = true;
            try {
                const d = await dpAPI('chat', { method: 'POST', body: JSON.stringify({ message: text }) });
                if (d && d.error) return;
                if (d && d.member_id) {
                    this.me = { id: d.member_id, username: d.username, name: d.name, avatar: d.avatar };
                }
                this.command = '';
                await this.loadMessages();
            } catch (e) { /* silent */ }
            finally { this.sending = false; }
        },
        isMine(m) {
            return !!this.me.id && Number(m.MEMBER_ID) === Number(this.me.id);
        },
        authorName(m) {
            if (this.isMine(m)) return this.me.name || this.me.username || '';
            if (Number(m.MEMBER_ID) === 0) return m.AUTHOR_NAME || '';
            return m.USER_NAME || '';
        },
        avatarUrl(m) {
            if (this.isMine(m) && this.me.avatar) {
                const a = String(this.me.avatar);
                return a.charAt(0) === '/' ? a : '/cms/avatars/' + a;
            }
            const a = String(m.USER_AVATAR || '').trim();
            if (!a) return '/cms/avatars/user.png';
            return a.charAt(0) === '/' ? a : '/cms/avatars/' + a;
        },
        shortTime(m) {
            const s = String(m.ADDED || '');
            return s.length >= 16 ? s.substr(11, 5) : '';
        },
    },
};

window.DpWidgets = window.DpWidgets || {};
window.DpWidgets.chat = ChatWidget;
