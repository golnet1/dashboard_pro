/* The chat widget works exactly like the panel chat window: it shares the same
   history, the same "thinking" state and the same bubble markup, so both always
   show the same conversation. The shared state lives in the main app instance
   (window.__dp_vm), which also keeps polling the history while a widget is the
   only visible chat surface. */
const ChatWidget = {
    props: ['widget'],
    tabs: [
        { key: 'main', label: 'tab_main', fields: 'params' },
        { key: 'advanced', label: 'tab_advanced', fields: 'advanced' },
    ],
    fields: {
        params: [
            { key: 'hideTitle', label: 'field_hide_title', type: 'checkbox', default: false },
            { key: 'hideSend', label: 'field_hide_send', type: 'checkbox', default: false },
            { key: 'showName', label: 'field_show_name', type: 'checkbox', default: false },
            { key: 'sizeImage', label: 'field_chat_image_size', type: 'number', default: 150 },
        ],
        advanced: [],
    },
    defaults: { icon: 'fas fa-comments', hideTitle: false, hideSend: false, showName: false, sizeImage: 150, height: 300 },
    template: `
        <div class="widget-v-card" :style="cardStyle">
            <div class="widget-v-card__header" v-if="!widget.hideTitle">
                <i v-if="widget.icon" :class="widget.icon" class="widget-v-card__icon"></i>
                <div class="widget-v-card__title">{{ t('widget_chat') }}</div>
                <div class="widget-v-card__spacer"></div>
                <button :title="t('refresh')" @click="refresh" style="flex-shrink:0;width:26px;height:26px;border:none;border-radius:50%;background:rgba(255,255,255,.08);color:var(--on-theme-mid);cursor:pointer;display:flex;align-items:center;justify-content:center">
                    <i class="fas fa-refresh" :class="{ 'fa-spin': loading }"></i>
                </button>
            </div>
            <div class="chat-messages" style="flex:1;min-height:0;max-height:none">
                <div v-if="loading" class="chat-loading">{{ t('loading') }}</div>
                <div v-if="thinking" class="chat-loading">{{ t('thinking') }}</div>
                <div v-for="m in messages" :key="m.ID" class="chat-msg" :class="{ 'chat-msg--mine': isMine(m) }">
                    <img v-if="avatar(m)" :src="avatar(m)" class="chat-msg__avatar" @error="avatarError(m)">
                    <i v-else class="fas fa-user-circle chat-msg__avatar-icon"></i>
                    <div class="chat-msg__body">
                        <div v-if="showName && authorName(m)" class="chat-msg__name">{{ authorName(m) }}</div>
                        <div class="chat-msg__text">{{ m.MESSAGE }}</div>
                        <a v-if="m.IMAGE" :href="m.IMAGE" target="_blank" rel="noopener">
                            <img :src="m.IMAGE" :style="imageStyle" alt="" style="margin-top:4px;border-radius:4px;display:block">
                        </a>
                        <div class="chat-msg__time">{{ time(m) }}</div>
                    </div>
                </div>
            </div>
            <form v-if="!widget.hideSend" class="chat-input" @submit.prevent="send">
                <input v-model="command" :placeholder="t('type_message')" @keyup.enter="send">
                <button type="submit" :disabled="!command.trim()"><i class="fas fa-paper-plane"></i></button>
            </form>
        </div>`,
    data() {
        return { command: '', ready: false, registered: false };
    },
    mounted() {
        /* window.__dp_vm is assigned right after the app mounts, before any widget
           script is fetched, so the shared chat state is already available here */
        if (window.__dp_vm) {
            this.ready = true;
            const v = window.__dp_vm;
            if (typeof v.chatSurfaceMount === 'function') { v.chatSurfaceMount(); this.registered = true; }
            /* the history is shared and usually already in memory: fetch only when empty */
            if (!this.messages.length && typeof v.loadChat === 'function') v.loadChat();
        }
    },
    beforeUnmount() {
        const v = window.__dp_vm;
        if (this.registered && v && typeof v.chatSurfaceUnmount === 'function') {
            v.chatSurfaceUnmount();
            this.registered = false;
        }
    },
    computed: {
        messages() {
            if (!this.ready) return [];
            const v = window.__dp_vm;
            return v ? this.val(v.chatMessages) : [];
        },
        thinking() {
            if (!this.ready) return false;
            const v = window.__dp_vm;
            return !!(v && this.val(v.chatThinking));
        },
        loading() {
            if (!this.ready) return false;
            const v = window.__dp_vm;
            return !!(v && this.val(v.chatLoading));
        },
        showName() {
            const v = this.widget.showName;
            if (v === undefined || v === null || v === '') return false;
            if (typeof v === 'string') {
                const s = v.toLowerCase();
                return !(s === '0' || s === 'false' || s === 'no' || s === 'off');
            }
            return !!v;
        },
        imageStyle() {
            const s = Math.min(Math.max(Number(this.widget.sizeImage) || 150, 30), 400);
            return { maxHeight: s + 'px', maxWidth: s + 'px' };
        },
        cardStyle() {
            return this.widget.color ? { backgroundColor: this.widget.color } : {};
        },
    },
    methods: {
        /* the app instance unwraps refs, but stay tolerant in case a raw ref shows up */
        val(x) {
            return (x && typeof x === 'object' && x.__v_isRef) ? x.value : x;
        },
        refresh() {
            const v = window.__dp_vm;
            if (v && typeof v.loadChat === 'function') v.loadChat();
        },
        send() {
            const v = window.__dp_vm;
            const text = (this.command || '').trim();
            if (!text || !v || typeof v.sendChatText !== 'function') return;
            this.command = '';
            v.sendChatText(text);
        },
        isMine(m) {
            const v = window.__dp_vm;
            return v && typeof v.chatMessageIsMine === 'function' ? !!v.chatMessageIsMine(m) : false;
        },
        avatar(m) {
            const v = window.__dp_vm;
            return v && typeof v.chatAvatar === 'function' ? v.chatAvatar(m) : '';
        },
        avatarError(m) {
            const v = window.__dp_vm;
            if (v && typeof v.chatAvatarError === 'function') v.chatAvatarError(m);
        },
        time(m) {
            const v = window.__dp_vm;
            return v && typeof v.formatTime === 'function' ? v.formatTime(m.ADDED) : '';
        },
        authorName(m) {
            if (Number(m.MEMBER_ID) === 0) return m.AUTHOR_NAME || '';
            return m.USER_NAME || '';
        },
    },
};

window.DpWidgets = window.DpWidgets || {};
window.DpWidgets.chat = ChatWidget;
