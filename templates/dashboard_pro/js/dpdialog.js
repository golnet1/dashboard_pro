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

    /* Диалог истории значения - как HistoryDialog в Mboard: сверху кнопки периода
       и вида, ниже график или таблица. Открывается кликом по виджету, у которого
       включён выключатель «Открывать историю» (см. js/widgets/gauge.js).
       Данные берёт метод history модуля:
       /api.php/module/dashboard_pro/history?object=..&property=..&hours=..
       и отдаёт {data: [{timestamp, value, time}]}. Запрос идёт через dpHttp, а не
       через dpAPI: тот кэширует ответы по адресу, и открытие того же периода во
       второй раз показало бы старые данные. */
    const HIST_PERIODS = [
        { hours: 1, key: 'history_hour' },
        { hours: 6, key: 'history_hour6' },
        { hours: 12, key: 'history_hour12' },
        { hours: 24, key: 'history_day' },
        { hours: 168, key: 'history_week' },
        { hours: 744, key: 'history_month' }
    ];
    const HIST_DEFAULT_HOURS = 6;
    const HIST_VIEWS = [
        { view: 'graph', key: 'history_graph' },
        { view: 'table', key: 'history_table' }
    ];

    function histPad(n) {
        return (n < 10 ? '0' : '') + n;
    }

    function histTime(ts) {
        const d = new Date(Number(ts) * 1000);
        if (isNaN(d.getTime())) return '';
        return histPad(d.getDate()) + '.' + histPad(d.getMonth() + 1) + ' ' + histPad(d.getHours()) + ':' + histPad(d.getMinutes());
    }

    function histNumber(v, round) {
        const n = Number(v);
        if (!isFinite(n)) return String(v);
        return n.toFixed(Math.min(6, Math.max(0, round | 0)));
    }

    function histValue(v, round, unit) {
        if (v === null || v === undefined || v === '') return '-';
        const s = histNumber(v, round);
        return unit ? s + ' ' + unit : s;
    }

    window.dpHistory = function (opts) {
        const o = opts || {};
        const object = String(o.object || '');
        const property = String(o.property || '');
        if (!object) return Promise.resolve(false);
        const unit = o.unit || '';
        const color = o.color || '#1976d2';
        const round = Number.isFinite(Number(o.round)) ? Number(o.round) : 2;

        return new Promise(resolve => {
            let hours = HIST_DEFAULT_HOURS;
            let view = 'graph';
            let rows = [];
            let loading = false;
            let seq = 0;

            const overlay = document.createElement('div');
            overlay.className = 'dp-dialog';

            const card = document.createElement('div');
            card.className = 'dp-dialog__card dp-dialog__card--hist';

            const head = document.createElement('div');
            head.className = 'dp-dialog__head';
            const ic = document.createElement('i');
            ic.className = 'fas fa-chart-line';
            const title = document.createElement('div');
            title.className = 'dp-dialog__title';
            title.textContent = tr('history_title') + ' "' + (o.title || (object + (property ? '.' + property : ''))) + '"';
            const closeX = mkBtn('dp-dialog__x', '');
            closeX.title = tr('close');
            closeX.innerHTML = '<i class="fas fa-xmark"></i>';
            closeX.addEventListener('click', () => done());
            head.appendChild(ic);
            head.appendChild(title);
            head.appendChild(closeX);

            const bar = document.createElement('div');
            bar.className = 'dp-hist__bar';
            const periodsBox = document.createElement('div');
            periodsBox.className = 'dp-hist__periods';
            const viewsBox = document.createElement('div');
            viewsBox.className = 'dp-hist__views';
            bar.appendChild(periodsBox);
            bar.appendChild(viewsBox);

            const body = document.createElement('div');
            body.className = 'dp-dialog__body dp-hist__body';
            const chartWrap = document.createElement('div');
            chartWrap.className = 'dp-hist__chart';
            const canvas = document.createElement('canvas');
            canvas.className = 'dp-hist__canvas';
            chartWrap.appendChild(canvas);
            const tableWrap = document.createElement('div');
            tableWrap.className = 'dp-hist__table';
            const msg = document.createElement('div');
            msg.className = 'dp-hist__msg';
            body.appendChild(chartWrap);
            body.appendChild(tableWrap);
            body.appendChild(msg);

            const foot = document.createElement('div');
            foot.className = 'dp-dialog__foot';
            const closeBtn = mkBtn('dp-btn dp-btn--primary', tr('close'));
            closeBtn.addEventListener('click', () => done());
            foot.appendChild(closeBtn);

            card.appendChild(head);
            card.appendChild(bar);
            card.appendChild(body);
            card.appendChild(foot);
            overlay.appendChild(card);

            HIST_PERIODS.forEach(p => {
                const b = mkBtn('dp-hist__btn', tr(p.key));
                b.dataset.hours = String(p.hours);
                b.addEventListener('click', () => { hours = p.hours; load(); });
                periodsBox.appendChild(b);
            });
            HIST_VIEWS.forEach(v => {
                const b = mkBtn('dp-hist__btn', tr(v.key));
                b.dataset.view = v.view;
                b.addEventListener('click', () => { view = v.view; render(); });
                viewsBox.appendChild(b);
            });

            function markActive() {
                Array.prototype.forEach.call(periodsBox.children, b => {
                    b.classList.toggle('is-active', Number(b.dataset.hours) === hours);
                });
                Array.prototype.forEach.call(viewsBox.children, b => {
                    b.classList.toggle('is-active', b.dataset.view === view);
                });
            }

            function drawGraph() {
                const rect = chartWrap.getBoundingClientRect();
                const w = Math.max(200, Math.round(rect.width));
                const h = Math.max(140, Math.round(rect.height));
                const dpr = window.devicePixelRatio || 1;
                canvas.width = Math.round(w * dpr);
                canvas.height = Math.round(h * dpr);
                canvas.style.width = w + 'px';
                canvas.style.height = h + 'px';
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                ctx.clearRect(0, 0, w, h);

                const pts = rows.map(r => ({ t: Number(r.timestamp), v: Number(r.value) }))
                    .filter(p => isFinite(p.t) && isFinite(p.v));
                if (!pts.length) return;

                const t0 = pts[0].t, t1 = pts[pts.length - 1].t;
                let vmin = Math.min.apply(null, pts.map(p => p.v));
                let vmax = Math.max.apply(null, pts.map(p => p.v));
                if (!(vmax > vmin)) { vmax = vmin + 1; vmin = vmin - 1; }

                const padL = 46, padR = 10, padT = 10, padB = 24;
                const pw = Math.max(10, w - padL - padR);
                const ph = Math.max(10, h - padT - padB);
                const xAt = t => padL + (t1 > t0 ? (t - t0) / (t1 - t0) : 0.5) * pw;
                const yAt = v => padT + (1 - (v - vmin) / (vmax - vmin)) * ph;

                ctx.font = '11px sans-serif';
                ctx.textBaseline = 'middle';
                const steps = 4;
                for (let i = 0; i <= steps; i++) {
                    const v = vmin + (vmax - vmin) * i / steps;
                    const y = yAt(v);
                    ctx.strokeStyle = 'rgba(128,128,128,.25)';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([3, 4]);
                    ctx.beginPath();
                    ctx.moveTo(padL, y);
                    ctx.lineTo(padL + pw, y);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.fillStyle = 'rgba(255,255,255,.6)';
                    ctx.textAlign = 'right';
                    ctx.fillText(histNumber(v, round), padL - 6, y);
                }

                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillStyle = 'rgba(255,255,255,.6)';
                const ticks = Math.max(2, Math.min(6, Math.floor(pw / 90)));
                for (let i = 0; i <= ticks; i++) {
                    const t = t0 + (t1 - t0) * i / ticks;
                    const label = (t1 - t0) > 86400 ? histTime(t) : histTime(t).slice(-5);
                    const x = Math.min(w - 24, Math.max(24, xAt(t)));
                    ctx.fillText(label, x, padT + ph + 6);
                }

                const path = (close) => {
                    ctx.beginPath();
                    pts.forEach((p, i) => {
                        if (i) ctx.lineTo(xAt(p.t), yAt(p.v));
                        else ctx.moveTo(xAt(p.t), yAt(p.v));
                    });
                    if (close) {
                        ctx.lineTo(xAt(pts[pts.length - 1].t), padT + ph);
                        ctx.lineTo(xAt(pts[0].t), padT + ph);
                        ctx.closePath();
                    }
                };

                if (pts.length > 1) {
                    path(true);
                    ctx.globalAlpha = 0.16;
                    ctx.fillStyle = color;
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }
                path(false);
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.6;
                ctx.lineJoin = 'round';
                ctx.stroke();

                pts.forEach((p, i) => {
                    const last = i === pts.length - 1;
                    ctx.beginPath();
                    ctx.arc(xAt(p.t), yAt(p.v), last ? 3.5 : 1.6, 0, Math.PI * 2);
                    ctx.fillStyle = color;
                    ctx.fill();
                });
            }

            function renderTable() {
                tableWrap.textContent = '';
                const table = document.createElement('table');
                table.className = 'dp-hist__grid';
                const thead = document.createElement('thead');
                const hr = document.createElement('tr');
                [tr('history_value'), tr('history_datetime')].forEach(txt => {
                    const th = document.createElement('th');
                    th.textContent = txt;
                    hr.appendChild(th);
                });
                thead.appendChild(hr);
                table.appendChild(thead);
                const tbody = document.createElement('tbody');
                rows.slice()
                    .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
                    .forEach(r => {
                        const tr_ = document.createElement('tr');
                        const td1 = document.createElement('td');
                        td1.textContent = histValue(r.value, round, unit);
                        const td2 = document.createElement('td');
                        td2.textContent = r.time || histTime(r.timestamp);
                        tr_.appendChild(td1);
                        tr_.appendChild(td2);
                        tbody.appendChild(tr_);
                    });
                table.appendChild(tbody);
                tableWrap.appendChild(table);
            }

            function render() {
                markActive();
                const numeric = rows.some(r => isFinite(Number(r.value)));
                let mode;
                if (loading) mode = 'loading';
                else if (!rows.length) mode = 'empty';
                else if (view === 'graph' && !numeric) mode = 'wrong';
                else mode = view;

                chartWrap.style.display = mode === 'graph' ? '' : 'none';
                tableWrap.style.display = mode === 'table' ? '' : 'none';
                msg.style.display = (mode === 'graph' || mode === 'table') ? 'none' : '';

                if (mode === 'graph') drawGraph();
                else if (mode === 'table') renderTable();
                else if (mode === 'wrong') msg.textContent = tr('history_wrong') || tr('history_wrong_data') || tr('history_empty');
                else msg.textContent = mode === 'loading' ? tr('history_loading') : tr('history_empty');
            }

            function load() {
                const my = ++seq;
                const params = { object: object, hours: String(hours) };
                if (property) params.property = property;
                loading = true;
                rows = [];
                render();
                dpHttp('history?' + new URLSearchParams(params))
                    .then(res => {
                        if (my !== seq) return;
                        loading = false;
                        rows = (res && Array.isArray(res.data)) ? res.data : [];
                        render();
                    })
                    .catch(() => {
                        if (my !== seq) return;
                        loading = false;
                        rows = [];
                        render();
                    });
            }

            function onResize() {
                if (view === 'graph' && rows.length) drawGraph();
            }

            function onKey(e) {
                if (e.key === 'Escape') done();
            }

            function done() {
                overlay.remove();
                document.removeEventListener('keydown', onKey);
                window.removeEventListener('resize', onResize);
                resolve(true);
            }

            overlay.addEventListener('mousedown', e => {
                if (e.target === overlay) done();
            });
            document.addEventListener('keydown', onKey);
            window.addEventListener('resize', onResize);

            document.body.appendChild(overlay);
            load();
            closeBtn.focus();
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