(function () {
    const ICON = { success: 'fa-circle-check', error: 'fa-circle-exclamation', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
    const MAX_TOASTS = 4;

    function tr(key) {
        return typeof window.__t === 'function' ? window.__t(key) : key;
    }

    function toastHost() {
        let host = document.querySelector('.dp-toasts');
        if (!host) {
            host = document.createElement('div');
            host.className = 'dp-toasts';
            document.body.appendChild(host);
        }
        return host;
    }

    function dpToast(text, kind, ms) {
        const k = ICON[kind] ? kind : 'info';
        const host = toastHost();
        const el = document.createElement('div');
        el.className = 'dp-toast dp-toast--' + k;

        const ic = document.createElement('i');
        ic.className = 'fas ' + ICON[k];

        const body = document.createElement('div');
        body.className = 'dp-toast__text';
        body.textContent = text;

        const close = document.createElement('button');
        close.className = 'dp-toast__close';
        close.innerHTML = '<i class="fas fa-xmark"></i>';

        function hide(node) {
            if (!node || node.classList.contains('dp-toast--leaving')) return;
            node.classList.add('dp-toast--leaving');
            setTimeout(() => { if (node.parentNode) node.parentNode.removeChild(node); }, 200);
        }

        close.addEventListener('click', () => hide(el));
        el.appendChild(ic);
        el.appendChild(body);
        el.appendChild(close);
        host.appendChild(el);

        const items = host.querySelectorAll('.dp-toast');
        for (let i = 0; i < items.length - MAX_TOASTS; i++) items[i].remove();

        const life = ms || (k === 'error' ? 9000 : 4000);
        const timer = setTimeout(() => hide(el), life);
        el.addEventListener('mouseenter', () => clearTimeout(timer));

        return el;
    }

    function mkBtn(cls, label) {
        const b = document.createElement('button');
        b.className = cls;
        b.textContent = label;
        return b;
    }

    function openDialog(opts) {
        const o = opts || {};
        const cancelValue = o.confirm === false;
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.className = 'dp-dialog';

            const card = document.createElement('div');
            card.className = 'dp-dialog__card' + (o.danger ? ' dp-dialog__card--danger' : '');

            const head = document.createElement('div');
            head.className = 'dp-dialog__head';
            const ic = document.createElement('i');
            ic.className = 'fas ' + (o.icon || ICON[o.kind || 'info'] || ICON.info);
            const title = document.createElement('div');
            title.className = 'dp-dialog__title';
            title.textContent = o.title || '';
            head.appendChild(ic);
            head.appendChild(title);

            const body = document.createElement('div');
            body.className = 'dp-dialog__body';
            body.textContent = o.text || '';

            const foot = document.createElement('div');
            foot.className = 'dp-dialog__foot';

            if (o.confirm !== false) {
                const cancel = mkBtn('dp-btn', o.cancelText === undefined ? tr('dp_dialog_cancel') : o.cancelText);
                cancel.addEventListener('click', () => done(false));
                foot.appendChild(cancel);
            }

            const ok = mkBtn(o.danger ? 'dp-btn dp-btn--danger' : 'dp-btn dp-btn--primary',
                o.okText === undefined ? tr('dp_dialog_ok') : o.okText);
            ok.addEventListener('click', () => done(true));
            foot.appendChild(ok);

            card.appendChild(head);
            card.appendChild(body);
            card.appendChild(foot);
            overlay.appendChild(card);
            document.body.appendChild(overlay);

            function done(val) {
                overlay.remove();
                document.removeEventListener('keydown', onKey);
                resolve(val);
            }

            function onKey(e) {
                if (e.key === 'Escape') done(cancelValue);
                else if (e.key === 'Enter') done(true);
            }

            overlay.addEventListener('mousedown', e => {
                if (e.target === overlay) done(cancelValue);
            });

            document.addEventListener('keydown', onKey);
            ok.focus();
        });
    }

    window.dpToast = dpToast;

    window.dpAlert = function (text, kind) {
        return openDialog({
            title: tr('dp_dialog_notice_title'),
            text: text,
            kind: kind || 'info',
            danger: kind === 'error',
            confirm: false
        });
    };

    window.dpConfirm = function (text, opts) {
        const o = opts || {};
        return openDialog({
            title: o.title || tr('dp_dialog_confirm_title'),
            text: text,
            kind: o.kind || (o.danger ? 'warning' : 'info'),
            danger: !!o.danger,
            icon: o.icon,
            okText: o.okText,
            cancelText: o.cancelText
        });
    };

    window.alert = function dpAlertShim(msg) {
        const text = msg === undefined || msg === null ? '' : String(msg);
        const kind = /ошибк|error|не удалось|failed/i.test(text.slice(0, 80)) ? 'error' : 'info';
        if (text.indexOf('\n') >= 0 || text.length > 180) {
            window.dpAlert(text, kind);
            return;
        }
        window.dpToast(text, kind);
    };
})();