/* Dashboard Pro — widget builder UI
 * Three sections: appearance builder, settings panels, module code.
 */
(function () {
    'use strict';

    var B = window.DpBuilder;
    if (!B) { console.error('[dpb] dpbuilder.js is not loaded'); return; }

    function norm(s) {
        return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
    }

    /* the colours the module offers in its own settings */
    var COLOR_PALETTE = [
        '#1976d2', '#1e88e5', '#00897b', '#43a047', '#fdd835', '#fb8c00', '#f4511e', '#e53935',
        '#8e24aa', '#5e35b1', '#3949ab', '#00acc1', '#6d4c41', '#757575', '#9e9e9e', '#212121',
        '#ffffff', '#fafafa', '#eceff1', '#cfd8dc', '#b0bec5', '#90a4ae', '#607d8b', '#37474f'
    ];

    /* a value of a dropdown, translated by dpb_v_<value>; unknown values stay as they are */
    function valLabel(v) {
        var k = 'dpb_v_' + String(v).replace(/-/g, '_');
        var s = window.__t ? window.__t(k) : k;
        return s === k ? v : s;
    }

    /* ---------------------------------------------------------------- */

    var PaletteList = {
        props: ['items', 'activeCat', 'forSettings'],
        template:
            '<div class="dpb-palette">' +
            '  <div v-for="cat in cats" :key="cat.key" class="dpb-palette__cat">' +
            '    <div class="dpb-palette__cat-head" @click="toggle(cat.key)">' +
            '      <i class="fas" :class="activeCat === cat.key ? \'fa-chevron-down\' : \'fa-chevron-right\'" style="font-size:.6rem;opacity:.6"></i>' +
            '      <span>{{ t(cat.label) }}</span><span class="dpb-badge">{{ catItems(cat.key).length }}</span>' +
            '    </div>' +
            '    <div class="dpb-palette__grid" v-show="activeCat === cat.key">' +
            '      <div v-for="it in catItems(cat.key)" :key="it.t" class="dpb-palette__item"' +
            '           draggable="true" @dragstart="onDrag($event, it)" @dragend="onDragEnd"' +
            '           @dblclick="onPick(it)" :title="t(it.label)">' +
            '        <i :class="it.icon"></i><span>{{ t(it.label) }}</span>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +
            '</div>',
        data: function () {
            return { cats: B.CATS };
        },
        methods: {
            t: function (s) { return window.__t ? window.__t(s) : s; },
            toggle: function (k) { this.$emit('toggle', k); },
            catItems: function (k) {
                var out = [];
                for (var t in B.COMPONENTS) {
                    if (!Object.prototype.hasOwnProperty.call(B.COMPONENTS, t)) continue;
                    if (B.COMPONENTS[t].cat === k) out.push(B.COMPONENTS[t]);
                }
                return out;
            },
            onDrag: function (ev, it) {
                ev.dataTransfer.effectAllowed = 'copy';
                ev.dataTransfer.setData('text/plain', JSON.stringify({ kind: this.forSettings ? 'field' : 'comp', type: it.t }));
                this.$emit('drag-comp', it);
            },
            onDragEnd: function () { this.$emit('drag-end'); },
            onPick: function (it) { this.$emit('pick', it); }
        }
    };

    var FieldPalette = {
        props: ['activeCat'],
        template:
            '<div class="dpb-palette">' +
            '  <div class="dpb-palette__cat-head" @click="toggle()">' +
            '      <i class="fas" :class="activeCat === \'fields\' ? \'fa-chevron-down\' : \'fa-chevron-right\'" style="font-size:.6rem;opacity:.6"></i>' +
            '      <span>{{ t(\'dpb_cat_fields\') }}</span><span class="dpb-badge">{{ count }}</span>' +
            '  </div>' +
            '  <div class="dpb-palette__grid" v-show="activeCat === \'fields\'">' +
            '    <div v-for="(meta, tp) in types" :key="tp" class="dpb-palette__item"' +
            '         draggable="true" @dragstart="onDrag($event, tp)" @dblclick="onPick(tp)" :title="tp">' +
            '      <i :class="meta.icon"></i><span>{{ tp }}</span>' +
            '    </div>' +
            '  </div>' +
            '  <div class="dpb-palette__cat-head" @click="toggleSys()">' +
            '      <i class="fas" :class="activeCat === \'sys\' ? \'fa-chevron-down\' : \'fa-chevron-right\'" style="font-size:.6rem;opacity:.6"></i>' +
            '      <span>{{ t(\'dpb_system\') }}</span><span class="dpb-badge">{{ sys.length }}</span>' +
            '  </div>' +
            '  <div class="dpb-palette__grid" v-show="activeCat === \'sys\'">' +
            '    <div v-for="s in sys" :key="s.field" class="dpb-palette__item dpb-palette__item--sys"' +
            '         draggable="true" @dragstart="onDragSys($event, s)" @dblclick="onPickSys(s)" :title="s.field">' +
            '      <i :class="s.icon"></i><span>{{ t(s.label) }}</span>' +
            '    </div>' +
            '  </div>' +
            '</div>',
        data: function () {
            return { types: B.FIELD_TYPES, sys: B.systemFields() };
        },
        computed: {
            count: function () { return Object.keys(B.FIELD_TYPES).length; }
        },
        methods: {
            t: function (s) { return window.__t ? window.__t(s) : s; },
            toggle: function () { this.$emit('toggle'); },
            toggleSys: function () { this.$emit('toggle-sys'); },
            onDrag: function (ev, tp) {
                ev.dataTransfer.effectAllowed = 'copy';
                ev.dataTransfer.setData('text/plain', JSON.stringify({ kind: 'field', type: tp }));
            },
            onDragSys: function (ev, s) {
                ev.dataTransfer.effectAllowed = 'copy';
                ev.dataTransfer.setData('text/plain', JSON.stringify({ kind: 'system', field: s.field, tab: s.tab }));
            },
            onPick: function (tp) { this.$emit('pick', { _t: tp }); },
            onPickSys: function (s) { this.$emit('pick-sys', s); }
        }
    };

    /* ---------------------------------------------------------------- */
    /* a property with a fixed list of icons: a button with the icon and
       the picker the module uses, the class can still be typed by hand   */
    /* ---------------------------------------------------------------- */

    /* the catalogue the module publishes is a list of categories, the picker
       shows a flat list of class names: it is built once and shared, an
       empty answer is not remembered, in case the module is late */
    var _iconList = null;
    function iconList() {
        if (_iconList) return _iconList;
        var cats = (window.DpIconCategories || []).filter(function (c) { return c && c.icons && c.icons.length; });
        var all = [];
        cats.forEach(function (c) {
            c.icons.forEach(function (v) { if (v && all.indexOf(v) < 0) all.push(v); });
        });
        if (!all.length) return all;
        _iconList = all;
        return _iconList;
    }

    var IconPicker = {
        props: ['modelValue'],
        template:
            '<div class="dpb-pick">' +
            '  <button type="button" class="dpb-pick__btn" @click="toggle">' +
            '    <i v-if="modelValue" :class="modelValue"></i><i v-else class="fas fa-star dpb-pick__none"></i>' +
            '    <span class="dpb-pick__val">{{ modelValue || t(\'dpb_icon_none\') }}</span>' +
            '    <i class="fas fa-chevron-down dpb-pick__arrow"></i>' +
            '  </button>' +
            '  <div v-if="open" class="dpb-pop">' +
            '    <div class="dpb-pop__head"><input type="text" class="dpb-inp" v-model="q" :placeholder="t(\'dpb_icon_search\')"></div>' +
            '    <div class="dpb-pop__grid">' +
            '      <button v-for="ic in list" :key="ic" type="button" class="dpb-pop__cell" :class="{ active: ic === modelValue }"' +
            '              @click="pick(ic)" :title="ic"><i :class="ic"></i></button>' +
            '    </div>' +
            '    <div v-if="!list.length" class="dpb-pop__empty">{{ t(\'dpb_icon_none_found\') }}</div>' +
            '    <div class="dpb-pop__foot">' +
            '      <input type="text" class="dpb-inp" :value="modelValue" @change="type($event.target.value)" :placeholder="\'fas fa-star\'">' +
            '      <button type="button" class="dpb-btn dpb-btn--ghost" @click="pick(\'\')">{{ t(\'dpb_icon_none\') }}</button>' +
            '    </div>' +
            '  </div>' +
            '</div>',
        data: function () {
            return { open: false, q: '', all: iconList() };
        },
        computed: {
            list: function () {
                var q = this.q.trim().toLowerCase();
                if (!q) return this.all;
                var re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
                return this.all.filter(function (v) { return re.test(v); });
            }
        },
        mounted: function () {
            var self = this;
            this._off = function (e) { if (self.open && !self.$el.contains(e.target)) self.open = false; };
            document.addEventListener('mousedown', this._off, true);
        },
        beforeUnmount: function () { if (this._off) document.removeEventListener('mousedown', this._off, true); },
        methods: {
            t: function (s) { return window.__t ? window.__t(s) : s; },
            toggle: function () { this.open = !this.open; if (this.open) this.q = ''; },
            pick: function (v) { this.open = false; this.$emit('update:modelValue', v); },
            type: function (v) { this.open = false; this.$emit('update:modelValue', String(v || '').trim()); }
        }
    };

    /* ---------------------------------------------------------------- */
    /* a property with a colour: a button with the sample and a picker
       with the native control, the palette and a free value                */
    /* ---------------------------------------------------------------- */

    var ColorPicker = {
        props: ['modelValue'],
        template:
            '<div class="dpb-pick">' +
            '  <button type="button" class="dpb-pick__btn" @click="toggle">' +
            '    <span class="dpb-pick__chip" :style="chip"></span>' +
            '    <span class="dpb-pick__val">{{ modelValue || t(\'dpb_color_none\') }}</span>' +
            '    <i class="fas fa-chevron-down dpb-pick__arrow"></i>' +
            '  </button>' +
            '  <div v-if="open" class="dpb-pop dpb-pop--color">' +
            '    <div class="dpb-pop__head dpb-pop__head--color">' +
            '      <input type="color" class="dpb-color__native" :value="hex" @input="type($event.target.value)">' +
            '      <input type="text" class="dpb-inp" :value="modelValue" @change="type($event.target.value)" placeholder="#1976d2 / rgba(0,0,0,.3)">' +
            '    </div>' +
            '    <div class="dpb-pop__grid dpb-pop__grid--color">' +
            '      <button v-for="c in PALETTE" :key="c" type="button" class="dpb-pop__cell dpb-pop__cell--color"' +
            '              :style="{ background: c }" :class="{ active: c === modelValue }" @click="pick(c)" :title="c"></button>' +
            '    </div>' +
            '    <div class="dpb-pop__foot">' +
            '      <button type="button" class="dpb-btn dpb-btn--ghost" @click="type(\'inherit\')">inherit</button>' +
            '      <button type="button" class="dpb-btn dpb-btn--ghost" @click="pick(\'\')">{{ t(\'dpb_color_none\') }}</button>' +
            '    </div>' +
            '  </div>' +
            '</div>',
        data: function () {
            return { open: false, PALETTE: COLOR_PALETTE };
        },
        computed: {
            /* only a plain hex value can be shown by the native control */
            hex: function () {
                var v = String(this.modelValue || '').trim();
                return /^#[0-9a-f]{6}$/i.test(v) ? v : '#000000';
            },
            chip: function () {
                var v = String(this.modelValue || '').trim();
                return v ? { background: v } : { background: 'transparent', border: '1px dashed rgba(255,255,255,.35)' };
            }
        },
        mounted: function () {
            var self = this;
            this._off = function (e) { if (self.open && !self.$el.contains(e.target)) self.open = false; };
            document.addEventListener('mousedown', this._off, true);
        },
        beforeUnmount: function () { if (this._off) document.removeEventListener('mousedown', this._off, true); },
        methods: {
            t: function (s) { return window.__t ? window.__t(s) : s; },
            toggle: function () { this.open = !this.open; },
            pick: function (v) { this.open = false; this.$emit('update:modelValue', v); },
            type: function (v) { this.open = false; this.$emit('update:modelValue', String(v || '').trim()); }
        }
    };

    /* ---------------------------------------------------------------- */

    var CodeEditor = {
        props: ['modelValue', 'language'],
        template:
            '<div class="dpb-code">' +
            '  <div class="dpb-code__gutter"><div v-for="n in lines" :key="n" class="dpb-code__ln">{{ n }}</div></div>' +
            '  <div class="dpb-code__area" ref="area">' +
            '    <pre class="dpb-code__hl" aria-hidden="true"><code v-html="hl"></code></pre>' +
            '    <textarea ref="ta" class="dpb-code__ta" spellcheck="false" wrap="off"' +
            '      :value="modelValue" @input="onInput" @scroll="onScroll"' +
            '      @keydown.tab.prevent="onTab" @keydown="onKey"></textarea>' +
            '  </div>' +
            '</div>',
        data: function () {
            return { hl: '' };
        },
        computed: {
            lines: function () {
                return Math.max(1, String(this.modelValue || '').split('\n').length);
            }
        },
        watch: {
            modelValue: function () { this.render(); },
            hl: function () {
                if (this.$refs.ta) this.$refs.ta.scrollTop = this.scrollTop || 0;
            }
        },
        mounted: function () {
            this.render();
            if (this.hasRawHtml) this.checkRaw();
            this.$nextTick(this.syncScroll);
        },
        methods: {
            render: function () {
                this.hl = B.highlight(this.modelValue || '');
                this.$nextTick(this.syncScroll);
            },
            syncScroll: function () {
                var ta = this.$refs.ta;
                if (!ta) return;
                this.scrollTop = ta.scrollTop;
                this.scrollLeft = ta.scrollLeft;
                var g = this.$el.querySelector('.dpb-code__gutter');
                var p = this.$el.querySelector('.dpb-code__hl');
                if (g) g.scrollTop = ta.scrollTop;
                if (p) { p.scrollTop = ta.scrollTop; p.scrollLeft = ta.scrollLeft; }
            },
            onScroll: function () { this.syncScroll(); },
            onInput: function (e) { this.$emit('update:modelValue', e.target.value); },
            onTab: function (e) {
                var ta = e.target;
                var s = ta.selectionStart, en = ta.selectionEnd;
                var v = ta.value;
                var next = v.slice(0, s) + '    ' + v.slice(en);
                this.$emit('update:modelValue', next);
                this.$nextTick(function () { ta.selectionStart = ta.selectionEnd = s + 4; });
            },
            onKey: function (e) {
                if (e.key !== 'Enter' || !e.shiftKey) return;
                var ta = e.target;
                var s = ta.selectionStart;
                var v = ta.value;
                var ls = v.lastIndexOf('\n', s - 1) + 1;
                var line = v.slice(ls, s);
                var ind = (line.match(/^\s*/) || [''])[0];
                if (!ind) return;
                e.preventDefault();
                var next = v.slice(0, ls) + ind + v.slice(ls);
                this.$emit('update:modelValue', next);
                this.$nextTick(function () { ta.selectionStart = ta.selectionEnd = s + ind.length; });
            }
        }
    };

    /* ---------------------------------------------------------------- */

    /* the eight resize handles of the selected component, as in mboard */
    var HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

    var DpBuilder = {
        name: 'dp-builder',
        components: {
            PaletteList: PaletteList,
            FieldPalette: FieldPalette,
            IconPicker: IconPicker,
            ColorPicker: ColorPicker,
            CodeEditor: CodeEditor
        },
        props: {
            modelValue: { type: Object, required: true },
            existingTitles: { type: Array, default: function () { return []; } },
            builtTypes: { type: Array, default: function () { return []; } },
            busy: { type: Boolean, default: false }
        },
        template:
            /* ---------------- shell ---------------- */
            '<div class="dpb">' +
            '  <div class="dpb-subtabs">' +
            '    <button v-for="s in SUBS" :key="s.key" class="dpb-subtab" :class="{ \'dpb-subtab--on\': sub === s.key }" @click="sub = s.key">' +
            '      <i :class="s.icon"></i>{{ t(s.label) }}</button>' +
            '    <div style="flex:1"></div>' +
            '    <div class="dpb-modes" v-show="sub === \'view\'">' +
            '      <button class="dpb-mode" :class="{ \'dpb-mode--on\': viewIsVisual }" @click="setViewMode(\'visual\')"><i class="fas fa-table-cells"></i>{{ t(\'dpb_view_visual\') }}</button>' +
            '      <button class="dpb-mode" :class="{ \'dpb-mode--on\': viewIsCode }" @click="setViewMode(\'code\')"><i class="fas fa-code"></i>{{ t(\'dpb_view_code\') }}</button>' +
            '      <button class="dpb-mode" :class="{ \'dpb-mode--on\': viewIsCss }" @click="setViewMode(\'css\')"><i class="fas fa-paint-brush"></i>{{ t(\'dpb_view_css\') }}</button>' +
            '    </div>' +
            '    <div style="flex:1"></div>' +
            '    <div class="dpb-wizstat" v-if="stats">{{ t(\'dpb_items\') }}: {{ stats.items }} · {{ t(\'dpb_fields\') }}: {{ stats.fields }}</div>' +
            '  </div>' +

            /* ================= 1. appearance ================= */
            '  <div v-show="sub === \'view\' && viewIsVisual" class="dpb-panes">' +
            '    <div class="dpb-pane dpb-pane--left">' +
            '      <div class="dpb-pane__title">{{ t(\'dpb_palette\') }}</div>' +
            '      <div class="dpb-pane__scroll">' +
            '        <palette-list :active-cat="cat" @toggle="cat = cat === $event ? \'\' : $event" @drag-comp="onPaletteDrag" @drag-end="palette = null" @pick="addItem($event.t)" />' +
            '        <div v-if="widgetTypes.length" class="dpb-palette__cat">' +
            '          <div class="dpb-palette__cat-head" @click="cat = cat === \'__widgets\' ? \'\' : \'__widgets\'">' +
            '            <i class="fas" :class="cat === \'__widgets\' ? \'fa-chevron-down\' : \'fa-chevron-right\'" style="font-size:.6rem;opacity:.6"></i>' +
            '            <span>{{ t(\'dpb_cat_installed\') }}</span><span class="dpb-badge">{{ widgetTypes.length }}</span>' +
            '          </div>' +
            '          <div class="dpb-palette__grid" v-show="cat === \'__widgets\'">' +
            '            <div v-for="wt in widgetTypes" :key="wt" class="dpb-palette__item" draggable="true"' +
            '                 @dragstart="onWidgetDrag($event, wt)" @dblclick="addWidgetItem(wt)"><i class="fas fa-cube"></i><span>{{ wt }}</span></div>' +
            '          </div>' +
            '        </div>' +
            '      </div>' +
            '    </div>' +

            '    <div class="dpb-pane dpb-pane--center" @dragover.prevent @drop.prevent="onCanvasDrop">' +
            '      <div class="dpb-pane__title">{{ t(\'dpb_canvas\') }}</div>' +
            '      <div class="dpb-note" v-if="htmlKept"><i class="fas fa-code"></i><span>{{ t(\'dpb_html_kept\') }}</span></div>' +
            '      <div class="dpb-canvas" :class="{ \'dpb-canvas--over\': over }">' +
            '        <div class="dpb-frame" :style="frameStyle()">' +
            '          <div class="dpb-frame__size">{{ model.appearance.width }} &times; {{ model.appearance.height }} px</div>' +
            '          <div class="dpb-frame__body" :style="frameBodyStyle()" @click="sel = \'\'">' +
            '            <div class="dpb-frame__grid"></div>' +
            /* the header the module starts with: the same icon and name the code writes */
            '            <div class="dpb-head" v-if="model.appearance.showTitle || model.appearance.iconType === \'property\' || (model.appearance.iconType === \'icon\' && model.appearance.icon) || (model.appearance.iconType === \'url\' && model.appearance.iconUrl)">' +
            '              <i class="dpb-ico" v-if="model.appearance.iconType === \'icon\' && model.appearance.icon" :class="model.appearance.icon"></i>' +
            '              <img class="dpb-ico" v-else-if="model.appearance.iconType === \'url\' && model.appearance.iconUrl" :src="model.appearance.iconUrl" alt="">' +
            '              <img class="dpb-ico" v-else-if="model.appearance.iconType === \'property\' && model.appearance.iconProperty" :src="iconPropValue" alt="">' +
            '              <span class="dpb-title" v-if="model.appearance.showTitle && model.appearance.title">{{ model.appearance.title }}</span>' +
            '            </div>' +
            '            <div class="dpb-canvas__stack" ref="area">' +
              '              <div v-for="it in model.appearance.items" :key="it._i" class="dpb-node" :class="{ \'dpb-node--on\': sel === it._i, \'dpb-node--drag\': drag && drag._i === it._i, \'dpb-node--rs\': rs && rs._i === it._i, \'dpb-node--live\': liveOf(it) }"' +
              '                   :style="nodeStyle(it)" :title="liveOf(it)" @mousedown="dragStart($event, it)" @click.stop="sel = it._i">' +
             '                <div class="dpb-node__body"><div class="dpb-fit" v-html="renderItem(it)"></div></div>' +
             '                <div class="dpb-node__hs" v-if="sel === it._i">' +
             '                  <i v-for="hd in HANDLES" :key="hd" class="dpb-h" :class="\'dpb-h--\' + hd" @mousedown.stop="resizeStart($event, it, hd)"></i>' +
             '                </div>' +
             '              </div>' +
            '              <div v-if="!model.appearance.items.length && rawPreview" class="dpb-rawprev"><component :is="rawPreview" :widget="previewWidget"></component></div>' +
            '              <div v-else-if="!model.appearance.items.length" class="dpb-empty">{{ t(\'dpb_canvas_empty\') }}</div>' +
            '            </div>' +
            '          </div>' +
            '          <div class="dpb-frame__over" v-if="overflows">{{ t(\'dpb_overflow\') }}</div>' +
            '        </div>' +
            '      </div>' +
            '      <div class="dpb-modbar">' +
            '        <label>{{ t(\'dpb_mod_width\') }}<input type="number" v-model.number="model.appearance.width" min="40" step="10"></label>' +
            '        <label>{{ t(\'dpb_mod_height\') }}<input type="number" v-model.number="model.appearance.height" min="20" step="10"></label>' +
            '        <label>{{ t(\'dpb_mod_gap\') }}<input type="number" v-model.number="model.appearance.gap" min="0" step="2"></label>' +
            '        <span class="dpb-sizes">' +
            '          <button v-for="p in SIZE_PRESETS" :key="p[0] + \'x\' + p[1]" type="button" class="dpb-size" :class="{ \'dpb-size--on\': model.appearance.width === p[0] && model.appearance.height === p[1] }" @click="setSize(p[0], p[1])">{{ p[0] }}&times;{{ p[1] }}</button>' +
            '        </span>' +
            '      </div>' +
            '    </div>' +

            '    <div class="dpb-pane dpb-pane--right">' +
            '      <div class="dpb-pane__title">{{ t(\'dpb_props\') }}</div>' +
            /* --- the list of the components of the canvas: a way to reach a small one
               or a covered one, where clicking on the canvas is not convenient --- */
            '      <div class="dpb-f dpb-pick" v-if="model.appearance.items.length">' +
            '        <label>{{ t(\'dpb_pick\') }}</label>' +
            '        <select v-model="sel">' +
            '          <option value="">{{ t(\'select_default\') }}</option>' +
            '          <option v-for="(it, ii) in model.appearance.items" :key="it._i" :value="it._i">{{ itName(it, ii) }}</option>' +
            '        </select>' +
            '      </div>' +
            '      <div class="dpb-pane__scroll">' +
            /* --- widget identity --- */
            '        <div class="dpb-block">' +
            '          <div class="dpb-block__title"><i class="fas fa-id-badge"></i>{{ t(\'dpb_blk_widget\') }}</div>' +
            '          <div class="dpb-f"><label>{{ t(\'dpb_name\') }}</label>' +
            '            <input type="text" v-model="model.title" :class="{ \'dpb-bad\': nameError }" @input="nameError = \'\'" :placeholder="t(\'dpb_name_ph\')">' +
            '            <div class="dpb-err" v-if="nameError"><i class="fas fa-exclamation-triangle"></i>{{ nameError }}</div>' +
            '            <div class="dpb-hint" v-else>{{ t(\'dpb_name_hint\') }}</div>' +
            '          </div>' +
            '          <div class="dpb-f"><label>{{ t(\'dpb_type\') }}</label>' +
            '            <input type="text" v-model="model.type" :class="{ \'dpb-bad\': typeError }" @input="typeError = \'\'" placeholder="my_widget">' +
            '            <div class="dpb-err" v-if="typeError"><i class="fas fa-exclamation-triangle"></i>{{ typeError }}</div>' +
            '            <div class="dpb-hint" v-else>a-z 0-9 _ -</div>' +
            '          </div>' +
            '          <div class="dpb-f"><label>{{ t(\'dpb_icon\') }}</label><icon-picker v-model="model.icon"></icon-picker></div>' +
            '          <div class="dpb-f"><label>{{ t(\'dpb_desc\') }}</label><textarea rows="2" v-model="model.description"></textarea></div>' +
            '        </div>' +
            /* --- module look --- */
            '        <div class="dpb-block">' +
            '          <div class="dpb-block__title"><i class="fas fa-palette"></i>{{ t(\'dpb_blk_module\') }}</div>' +
            '          <div class="dpb-hint" v-if="htmlKept">{{ t(\'dpb_module_look_hint\') }}</div>' +
            '          <div class="dpb-row2">' +
            '            <div class="dpb-f" v-if="!htmlKept"><label>{{ t(\'dpb_pad\') }}</label><input type="number" v-model.number="model.appearance.pad" min="0"></div>' +
            '            <div class="dpb-f"><label>{{ t(\'dpb_radius\') }}</label><input type="number" v-model.number="model.appearance.radius" min="0"></div>' +
            '          </div>' +
            '          <div class="dpb-row2" v-if="!htmlKept">' +
            '            <div class="dpb-f"><label>{{ t(\'dpb_bg\') }}</label><input type="color" v-model="model.appearance.bg"></div>' +
            '            <div class="dpb-f"><label>{{ t(\'dpb_color\') }}</label><input type="color" v-model="model.appearance.color"></div>' +
            '          </div>' +
            '          <div class="dpb-f" v-if="!htmlKept"><label>{{ t(\'dpb_root_cls\') }}</label><input type="text" spellcheck="false" v-model="model.appearance.cls" placeholder="widget-v-card"></div>' +
            '          <div class="dpb-f" v-if="!htmlKept"><label>{{ t(\'dpb_align\') }}</label>' +
            '            <select v-model="model.appearance.align">' +
            '              <option v-for="o in [\'stretch\', \'flex-start\', \'center\', \'flex-end\']" :key="o" :value="o">{{ valLabel(o) }}</option></select></div>' +
            '          <div class="dpb-chk" v-if="!htmlKept"><input type="checkbox" id="dpbShowTitle" v-model="model.appearance.showTitle"><label for="dpbShowTitle">{{ t(\'dpb_showtitle\') }}</label></div>' +
            '          <div class="dpb-f" v-if="!htmlKept && model.appearance.showTitle"><label>{{ t(\'field_title\') }}</label><input type="text" v-model="model.appearance.title"></div>' +
            /* the icon of the module itself: the same set the settings panel offers */
            '          <div class="dpb-f" v-if="!htmlKept"><label>{{ t(\'field_icon_type\') }}</label><select v-model="model.appearance.iconType">' +
            '            <option value="icon">{{ t(\'opt_icon\') }}</option>' +
            '            <option value="property">{{ t(\'opt_property\') }}</option>' +
            '            <option value="url">{{ t(\'opt_url\') }}</option></select></div>' +
            '          <div class="dpb-f" v-if="!htmlKept && model.appearance.iconType === \'icon\'"><label>{{ t(\'field_icon\') }}</label><icon-picker v-model="model.appearance.icon"></icon-picker></div>' +
            '          <div class="dpb-row2" v-if="!htmlKept && model.appearance.iconType === \'property\'">' +
            '            <div class="dpb-f"><label>{{ t(\'field_icon_object\') }}</label><input type="text" spellcheck="false" v-model="model.appearance.iconObject" placeholder="MegaCC"></div>' +
            '            <div class="dpb-f"><label>{{ t(\'field_icon_property\') }}</label><input type="text" spellcheck="false" v-model="model.appearance.iconProperty" placeholder="Status"></div>' +
            '          </div>' +
            '          <div class="dpb-f" v-if="!htmlKept && model.appearance.iconType === \'url\'"><label>{{ t(\'field_icon_url\') }}</label><input type="text" spellcheck="false" v-model="model.appearance.iconUrl" placeholder="https://..."></div>' +
            '        </div>' +
            /* --- selected component --- */
            '        <div class="dpb-block" v-if="cur">' +
            '          <div class="dpb-block__title"><i :class="compOf(cur).icon"></i>{{ t(compOf(cur).label) }}</div>' +
            '          <div class="dpb-row2">' +
            '            <div class="dpb-f"><label>{{ t(\'dpb_x\') }}</label><input type="number" v-model.number="cur.x" min="0" step="1" @change="setPos(cur, cur.x, cur.y)"></div>' +
            '            <div class="dpb-f"><label>{{ t(\'dpb_y\') }}</label><input type="number" v-model.number="cur.y" min="0" step="1" @change="setPos(cur, cur.x, cur.y)"></div>' +
            '          </div>' +
            '          <div class="dpb-row2">' +
            '            <div class="dpb-f"><label>{{ t(\'dpb_w\') }}</label><input type="number" v-model.number="cur.w" min="10" step="1"></div>' +
            '            <div class="dpb-f"><label>{{ t(\'dpb_h\') }}</label><input type="number" v-model.number="cur.h" min="10" step="1"></div>' +
            '          </div>' +
            /* the place may follow a value instead of a number */
            '          <div class="dpb-row2">' +
            '            <div class="dpb-f"><label>{{ t(\'dpb_dx\') }}</label><input type="text" class="dpb-expr" spellcheck="false" v-model="cur.dx" @input="posInput($event, \'x\')" placeholder="on ? 0 : 48"></div>' +
            '            <div class="dpb-f"><label>{{ t(\'dpb_dy\') }}</label><input type="text" class="dpb-expr" spellcheck="false" v-model="cur.dy" @input="posInput($event, \'y\')" placeholder="on ? 0 : 6"></div>' +
            '          </div>' +
            '          <div class="dpb-hint" v-if="cur.dx || cur.dy">{{ t(\'dpb_pos_expr_hint\') }}</div>' +
             '          <div class="dpb-row2">' +
             '            <div class="dpb-f"><label>{{ t(\'dpb_anchor_x\') }}</label>' +
             '              <select v-model="cur.anchorX" :disabled="cur.stretchX"><option value="">{{ t(\'dpb_anchor_none\') }}</option>' +
             '                <option v-for="o in [\'left\', \'center\', \'right\']" :key="o" :value="o">{{ valLabel(o) }}</option></select>' +
             '              <div class="dpb-chk" v-if="stretchOf(cur, \'x\')"><input type="checkbox" id="dpbStx" v-model="cur.stretchX"><label for="dpbStx">{{ t(\'dpb_stretch_x\') }}</label></div>' +
             '            </div>' +
             '            <div class="dpb-f"><label>{{ t(\'dpb_anchor_y\') }}</label>' +
             '              <select v-model="cur.anchorY" :disabled="cur.stretchY"><option value="">{{ t(\'dpb_anchor_none\') }}</option>' +
             '                <option v-for="o in [\'top\', \'center\', \'bottom\']" :key="o" :value="o">{{ valLabel(o) }}</option></select>' +
             '              <div class="dpb-chk" v-if="stretchOf(cur, \'y\')"><input type="checkbox" id="dpbSty" v-model="cur.stretchY"><label for="dpbSty">{{ t(\'dpb_stretch_y\') }}</label></div>' +
             '            </div>' +
             '          </div>' +
             '          <div class="dpb-hint">{{ cur.stretchX || cur.stretchY ? t(\'dpb_stretch_hint\') : t(\'dpb_anchor_hint\') }}</div>' +
            '          <div class="dpb-f"><label>{{ t(\'dpb_bind\') }}</label><select v-model="cur.bind">' +
            '            <option value="">—</option><option v-for="k in settingKeys" :key="k" :value="k">{{ k }}</option></select></div>' +
            '          <template v-for="(pd, pk) in propsOf(cur)">' +
            '            <div v-if="propShown(cur, pd)" :key="pk" class="dpb-f">' +
            '              <label>{{ t(pd.label) }}</label>' +
            '              <icon-picker v-if="pd.type === \'icon\'" v-model="cur[pk]"></icon-picker>' +
            '              <color-picker v-else-if="pd.type === \'color\'" v-model="cur[pk]"></color-picker>' +
            '              <select v-else-if="pd.type === \'select\'" v-model="cur[pk]"><option v-for="o in optList(pd, pk)" :key="String(o.value)" :value="o.value">{{ optLabel(o) }}</option></select>' +
            '              <select v-else-if="pd.type === \'bool\'" v-model="cur[pk]"><option :value="false">{{ t(\'dpb_no\') }}</option><option :value="true">{{ t(\'dpb_yes\') }}</option></select>' +
            '              <select v-else-if="pd.type === \'setting\'" v-model="cur[pk]">' +
            '                <option value="">—</option><option v-for="k in settingKeys" :key="k" :value="k">{{ k }}</option></select>' +
            '              <textarea v-else-if="pd.type === \'textarea\'" rows="3" v-model="cur[pk]"></textarea>' +
            '              <input v-else-if="pd.type === \'expr\'" type="text" class="dpb-expr" spellcheck="false" v-model="cur[pk]" placeholder="&#123;&#123; level &#125;&#125;">' +
            '              <input v-else type="text" v-model="cur[pk]">' +
            '              <div class="dpb-hint" v-if="pd.hint">{{ t(pd.hint) }}</div>' +
            '            </div>' +
            '          </template>' +
            /* the hook of the component in the generated code: what a hand written
               method looks the component up by */
            '          <div class="dpb-f"><label>{{ t(\'dpb_hook\') }}</label>' +
            '            <input type="text" class="dpb-expr" readonly :value="hookOf(cur)"></div>' +
            '          <div class="dpb-hint">{{ t(\'dpb_hook_hint\') }}</div>' +
            '        </div>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +

            /* ---- ready made widget: its own HTML is edited as text ---- */
            '  <div v-show="sub === \'view\' && viewIsCode" class="dpb-panes dpb-panes--raw">' +
            '    <div class="dpb-pane dpb-pane--center">' +
            '      <div class="dpb-pane__title">{{ t(\'dpb_raw_title\') }}</div>' +
            '      <div class="dpb-pane__scroll">' +
            '        <div class="dpb-warn"><i class="fas fa-exclamation-triangle"></i><span>{{ t(\'dpb_raw_warn\') }}</span></div>' +
            '        <textarea class="dpb-raw" v-model="model.appearance.html" spellcheck="false"></textarea>' +
            '        <div class="dpb-err" v-if="rawErr"><i class="fas fa-exclamation-triangle"></i>{{ rawErr }}</div>' +
            '      </div>' +
            '    </div>' +
            '    <div class="dpb-pane dpb-pane--right">' +
            '      <div class="dpb-pane__title">{{ t(\'dpb_canvas\') }}</div>' +
            '      <div class="dpb-canvas">' +
            '        <div class="dpb-frame" :style="frameStyle()">' +
            '          <div class="dpb-frame__size">{{ model.appearance.width }} &times; {{ model.appearance.height }} px</div>' +
            '          <div class="dpb-frame__body" :style="frameBodyStyle()">' +
            '            <component v-if="rawPreview" :is="rawPreview" :widget="previewWidget"></component>' +
            '            <div v-else class="dpb-empty">{{ t(\'dpb_raw_nopreview\') }}</div>' +
            '          </div>' +
            '        </div>' +
            '      </div>' +
            '      <div class="dpb-modbar">' +
            '        <label>{{ t(\'dpb_mod_width\') }}<input type="number" v-model.number="model.appearance.width" min="40" step="10"></label>' +
            '        <label>{{ t(\'dpb_mod_height\') }}<input type="number" v-model.number="model.appearance.height" min="20" step="10"></label>' +
            '        <div style="flex:1"></div>' +
            '        <button class="dpb-btn dpb-btn--ghost" @click="setViewMode(\'visual\')"><i class="fas fa-table-cells"></i>{{ t(\'dpb_raw_tovisual\') }}</button>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +

            /* ---- the stylesheet of the widget: rules the file puts into the page ---- */
            '  <div v-show="sub === \'view\' && viewIsCss" class="dpb-panes dpb-panes--raw dpb-panes--css">' +
            '    <div class="dpb-pane dpb-pane--center">' +
            '      <div class="dpb-pane__title">{{ t(\'dpb_css_title\') }}</div>' +
            '      <div class="dpb-pane__scroll">' +
            '        <div class="dpb-hint"><i class="fas fa-info-circle"></i><span>{{ t(\'dpb_css_hint\') }}</span></div>' +
            '        <code-editor v-model="cssText" />' +
            '        <div class="dpb-err" v-if="cssErr"><i class="fas fa-exclamation-triangle"></i>{{ cssErr }}</div>' +
            '      </div>' +
            '    </div>' +
            '    <div class="dpb-pane dpb-pane--right">' +
            '      <div class="dpb-pane__title">{{ t(\'dpb_canvas\') }}</div>' +
            '      <div class="dpb-canvas">' +
            '        <div class="dpb-frame" :style="frameStyle()">' +
            '          <div class="dpb-frame__size">{{ model.appearance.width }} &times; {{ model.appearance.height }} px</div>' +
            '          <div class="dpb-frame__body" :style="frameBodyStyle()">' +
            '            <component v-if="rawPreview" :is="rawPreview" :widget="previewWidget"></component>' +
            '            <div v-else class="dpb-empty">{{ t(\'dpb_raw_nopreview\') }}</div>' +
            '          </div>' +
            '        </div>' +
            '      </div>' +
            '      <div class="dpb-modbar">' +
            '        <span class="dpb-hint">{{ t(\'dpb_css_where\') }}</span>' +
            '        <div style="flex:1"></div>' +
            '        <button class="dpb-btn dpb-btn--ghost" @click="setViewMode(\'visual\')"><i class="fas fa-table-cells"></i>{{ t(\'dpb_raw_tovisual\') }}</button>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +

            /* ================= 2. settings panels ================= */
            '  <div v-show="sub === \'settings\'" class="dpb-panes">' +
            '    <div class="dpb-pane dpb-pane--left">' +
            '      <div class="dpb-pane__title">{{ t(\'dpb_fieldtypes\') }}</div>' +
            '      <div class="dpb-pane__scroll"><field-palette :active-cat="cat"' +
            '        @toggle="cat = cat === \'fields\' ? \'\' : \'fields\'"' +
            '        @toggle-sys="cat = cat === \'sys\' ? \'\' : \'sys\'"' +
            '        @pick="addField($event._t)" @pick-sys="addSystemField($event)" /></div>' +
            '    </div>' +
            '    <div class="dpb-pane dpb-pane--center">' +
            '      <div class="dpb-pane__title">{{ t(\'dpb_tabs\') }}</div>' +
            '      <div class="dpb-tabbar">' +
            '        <span v-for="(tb, ti) in model.settings.tabs" :key="tb.key" class="dpb-tab" :class="{ \'dpb-tab--on\': ti === tabIdx, \'dpb-tab--sys\': isSysTab(tb) }"' +
            '              @click="tabIdx = ti" @dblclick="renameInline(ti)">' +
            '          <input v-if="ren === ti" v-model="tb.label" class="dpb-inline" @blur="ren = -1" @keyup.enter="ren = -1" @click.stop>' +
            '          <template v-else>{{ tabLabel(tb.label) }}</template>' +
            '          <i class="far fa-times" v-if="model.settings.tabs.length > 1 && ren !== ti" @click.stop="delTab(ti)"></i>' +
            '        </span>' +
            '        <button class="dpb-tab-add" @click="addTab"><i class="fas fa-plus"></i></button>' +
            '      </div>' +
            '      <div class="dpb-flist" @dragover.prevent @drop.prevent="onFieldDrop">' +
            '        <div v-for="(f, fi) in curTab.items" :key="f._i" class="dpb-frow" :class="{ \'dpb-frow--on\': fsel === f._i, \'dpb-frow--sys\': sysOf(f) }" @click="selField(f)">' +
            '          <i class="fas fa-grip-vertical dpb-grip"></i>' +
            '          <i :class="sysOf(f) ? sysOf(f).icon : fIcon(f.type)"></i>' +
            '          <div class="dpb-frow__main"><b>{{ fLbl(f) }}</b><span>{{ sysOf(f) ? t(sysOf(f).label) + \' · \' + f.key : f.key + \' · \' + fType(f.type) }}</span></div>' +
            '          <div class="dpb-frow__ops">' +
            '            <button :disabled="fi === 0" @click.stop="moveField(fi, -1)"><i class="fas fa-arrow-up"></i></button>' +
            '            <button :disabled="fi === curTab.items.length - 1" @click.stop="moveField(fi, 1)"><i class="fas fa-arrow-down"></i></button>' +
            '            <button v-if="!sysOf(f)" @click.stop="copyField(fi)"><i class="fas fa-copy"></i></button>' +
            '            <button @click.stop="delField(fi)"><i class="far fa-trash-alt"></i></button>' +
            '          </div>' +
            '        </div>' +
            '        <div v-if="curSys" class="dpb-sysrow">' +
            '          <i class="fas fa-microchip"></i>' +
            '          <div class="dpb-sysrow__main"><b>{{ t(curSys.label) }}</b><span>{{ curSys.field }}</span></div>' +
            '          <div class="dpb-sysrow__hint">{{ t(\'dpb_system_hint\') }}</div>' +
            '        </div>' +
            '        <div v-if="!curTab.items.length" class="dpb-empty">{{ t(\'dpb_fields_empty\') }}</div>' +
            '      </div>' +
            '      <div class="dpb-modbar"><span class="dpb-hint">{{ t(\'dpb_keys_hint\') }}</span></div>' +
            '    </div>' +
            '    <div class="dpb-pane dpb-pane--right">' +
            '      <div class="dpb-pane__title">{{ t(\'dpb_props\') }}</div>' +
            '      <div class="dpb-pane__scroll">' +
            '        <div class="dpb-block" v-if="curF">' +
            '          <div class="dpb-block__title"><i :class="sysOf(curF) ? sysOf(curF).icon : fIcon(curF.type)"></i>{{ sysOf(curF) ? t(sysOf(curF).label) : fType(curF.type) }}</div>' +
            '          <div class="dpb-f"><label>{{ t(\'dpb_key\') }}</label>' +
            '            <input type="text" v-model="curF.key" :class="{ \'dpb-bad\': keyError }" @input="keyError = \'\'" placeholder="myParam">' +
            '            <div class="dpb-err" v-if="keyError"><i class="fas fa-exclamation-triangle"></i>{{ keyError }}</div>' +
            '            <div class="dpb-hint" v-else>a-z 0-9 _</div></div>' +
            '          <div class="dpb-f"><label>{{ t(\'dpb_label\') }}</label><input type="text" v-model="curF.label">' +
            '            <div class="dpb-hint">{{ t(\'dpb_label_hint\') }}</div></div>' +
            '          <div class="dpb-f"><label>{{ t(\'dpb_default\') }}</label>' +
            '            <icon-picker v-if="curF.type === \'icon_picker\'" v-model="curF.default"></icon-picker>' +
            '            <color-picker v-else-if="curF.type === \'color\'" v-model="curF.default"></color-picker>' +
            '            <input v-else type="text" v-model="curF.default"></div>' +
            '          <div class="dpb-f" v-if="curF.type === \'select\'"><label>{{ t(\'dpb_options\') }}</label><textarea rows="4" v-model="curF.options"></textarea>' +
            '            <div class="dpb-hint">value | label</div></div>' +
            '          <div class="dpb-row2" v-if="curF.type === \'slider\'">' +
            '            <div class="dpb-f"><label>{{ t(\'dpb_min\') }}</label><input type="text" v-model="curF.min"></div>' +
            '            <div class="dpb-f"><label>{{ t(\'dpb_max\') }}</label><input type="text" v-model="curF.max"></div>' +
            '          </div>' +
            '          <div class="dpb-f"><label>{{ t(\'dpb_row\') }}</label><input type="text" v-model="curF.row" placeholder="row1"></div>' +
            '          <div class="dpb-f"><label>{{ t(\'dpb_hint\') }}</label><input type="text" v-model="curF.hint"></div>' +
            '          <div class="dpb-hint" v-if="sysOf(curF)"><i class="fas fa-microchip"></i> {{ t(\'dpb_system_hint\') }}</div>' +
            '        </div>' +
            '        <div v-else class="dpb-empty">{{ t(\'dpb_no_field\') }}</div>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +

            /* ================= 3. code ================= */
            '  <div v-show="sub === \'code\'" class="dpb-codewrap">' +
            '    <div class="dpb-codetabs">' +
            '      <div class="dpb-codetabs__scroll">' +
            '        <button v-for="(c, ci) in CODES" :key="c.key" class="dpb-subtab" :class="{ \'dpb-subtab--on\': code === c.key, \'dpb-subtab--sep\': c.sep }"' +
            '                @click="c.sep || (code = c.key)" @dblclick.stop="c.ed && renFn(c)">' +
            '          <i :class="c.ed ? \'fas fa-bolt\' : c.icon"></i>' +
            '          <span v-if="c.ed && fnren === c.key" class="dpb-fnren"><input :value="c.label" class="dpb-inline" @click.stop @input="setFnName(c, $event.target.value)" @blur="commitFn(c)" @keyup.enter="commitFn(c)"></span>' +
            '          <template v-else>{{ c.label }}</template>' +
            '          <i v-if="c.ed" class="far fa-times dpb-fn__del" :class="{ \'dpb-fn__del--hide\': fnren === c.key }" @click.stop="delFn(c)"></i>' +
            '        </button>' +
            '        <div style="flex:1"></div>' +
            '      </div>' +
            '      <div class="dpb-fnadd">' +
            '        <button class="dpb-btn dpb-btn--ghost" :class="{ \'dpb-fnadd--on\': fnMenu }" @click="fnMenu = !fnMenu; fnren = -1"><i class="fas fa-plus"></i>{{ t(\'dpb_fn_add\') }}</button>' +
            '        <div v-if="fnMenu" class="dpb-fnmenu">' +
            '          <div class="dpb-fnmenu__head">{{ t(\'dpb_fn_add\') }}</div>' +
            '          <button v-for="s in FN_STD" :key="s.key" class="dpb-fnitem" @click.stop="addStdFn(s)"><i :class="s.icon"></i>{{ s.label }}</button>' +
            '          <div class="dpb-fnmenu__sep"></div>' +
            '          <button class="dpb-fnitem dpb-fnitem--custom" @click.stop="addConsts"><i class="fas fa-superscript"></i>{{ t(\'dpb_mod_consts\') }}</button>' +
            '          <button class="dpb-fnitem dpb-fnitem--custom" @click.stop="addHeadFn"><i class="fas fa-cube"></i>{{ t(\'dpb_mod_fn\') }}<span class="dpb-fnitem__hint">{{ t(\'dpb_fn_num\') }}</span></button>' +
            '          <button class="dpb-fnitem dpb-fnitem--custom" @click.stop="addStatic"><i class="fas fa-database"></i>{{ t(\'dpb_mod_static\') }}<span class="dpb-fnitem__hint">{{ t(\'dpb_fn_num\') }}</span></button>' +
            '        </div>' +
            '      </div>' +
            '      <button class="dpb-btn dpb-btn--ghost" @click="runWizard"><i class="fas fa-magic"></i>{{ t(\'dpb_wizard\') }}</button>' +
            '    </div>' +
            '    <div v-if="fnEmpty" class="dpb-codearea"><div class="dpb-fnstub" @click="fnMenu = true"><i class="fas fa-plus"></i>{{ t(\'dpb_fn_stub\') }}<span>{{ t(\'dpb_fn_stub_hint\') }}</span></div></div>' +
            '    <div v-else class="dpb-codearea"><div v-if="staticHdr" class="dpb-stathdr"><code class="dpb-stathdr__code">{{ staticHdr }}</code></div><code-editor v-model="codeText" /></div>' +
            '    <div class="dpb-codefoot">' +
            '      <span v-if="err" class="dpb-err"><i class="fas fa-exclamation-triangle"></i>{{ err }}</span>' +
            '      <span v-else class="dpb-ok"><i class="fas fa-check"></i>{{ t(\'dpb_code_ok\') }}</span>' +
            '      <div style="flex:1"></div>' +
            '      <span class="dpb-hint">{{ t(\'dpb_code_hint\') }}</span>' +
            '    </div>' +
            '  </div>' +

            /* ---------------- footer ---------------- */
            '  <div class="dpb-foot">' +
            '    <span class="dpb-err" v-if="sub === \'view\' && (nameError || typeError)"><i class="fas fa-exclamation-triangle"></i>{{ nameError || typeError }}</span>' +
            '    <span class="dpb-hint" v-else>{{ t(\'dpb_foot_hint\') }}</span>' +
            '    <div style="flex:1"></div>' +
            '    <button class="dpb-btn dpb-btn--ghost" :disabled="busy" @click="$emit(\'reset\')"><i class="fas fa-undo"></i>{{ t(\'dpb_reset\') }}</button>' +
            '      <button class="dpb-btn dpb-btn--ghost" :disabled="busy" @click="$emit(\'action\', \'loadzip\', {})"><i class="fas fa-file-import"></i>{{ t(\'dpb_upload\') }}</button>' +
            '      <button class="dpb-btn dpb-btn--ghost" :disabled="busy" @click="download"><i class="fas fa-file-arrow-down"></i>{{ t(\'dpb_download\') }}</button>' +
            '    <button class="dpb-btn dpb-btn--primary" :disabled="busy" @click="save">' +
            '      <i class="fas" :class="busy ? \'fa-spinner fa-spin\' : \'fa-floppy-disk\'"></i>{{ t(\'dpb_save\') }}</button>' +
            '  </div>' +
            '</div>',

        data: function () {
            return {
                sub: 'view',
                code: 'methods',
                cat: 'basic',
                sel: '',
                fsel: '',
                tabIdx: 0,
                ren: -1,
                over: false,
                drag: null,
                rs: null,
                palette: null,
                nameError: '',
                typeError: '',
                keyError: '',
                err: '',
                rawErr: '',
                rawTpl: '',
                rawTimer: null,
                cssErr: '',
            iconPropValue: '',
            iconPropFor: '',
            /* the values read from the objects for the canvas: keyed by the key of the
               field, so an icon bound to a field of type "property" can be drawn with
               the value of the property instead of its name */
            iconPropVals: {},
                viewMode: 'auto',
                fnMenu: false,
                fnren: -1,
                fnold: '',
                SUBS: [
                    { key: 'view', label: 'dpb_sec_view', icon: 'fas fa-tv' },
                    { key: 'settings', label: 'dpb_sec_settings', icon: 'fas fa-sliders' },
                    { key: 'code', label: 'dpb_sec_code', icon: 'fas fa-code' }
                ],
                FN_STD: [
                    { key: 'data', label: 'data()', icon: 'fas fa-database' },
                    { key: 'computed', label: 'computed', icon: 'fas fa-calculator' },
                    { key: 'methods', label: 'methods', icon: 'fas fa-cogs' },
                    { key: 'mounted', label: 'mounted()', icon: 'fas fa-power-off' },
                    { key: 'watch', label: 'watch', icon: 'fas fa-eye' },
                    { key: 'beforeUnmount', label: 'beforeUnmount()', icon: 'fas fa-flag' }
                ],
                /* the sizes offered as one click. The three narrow ones are what a card on the
       panel is: one line, two lines, and the tall one - so the width stays 280 and
       only the height changes, which is what most widgets need */
    SIZE_PRESETS: [[280, 115], [280, 140], [280, 170], [320, 200], [400, 300], [560, 320]],
                HANDLES: HANDLES
            };
        },

        computed: {
            model: function () { return this.modelValue; },
            CODES: function () {
                var has = function (k) {
                    return String((this.model.code || {})[k] || '').trim() !== '';
                }.bind(this);
                var list = [{ key: 'data', label: 'data()', icon: 'fas fa-database' }, { key: 'dataPre', label: 'data() (до return)', icon: 'fas fa-indent' }];
                if (has('computed')) list.push({ key: 'computed', label: 'computed', icon: 'fas fa-calculator' });
                if (has('methods')) list.push({ key: 'methods', label: 'methods', icon: 'fas fa-cogs' });
                if (has('mounted')) list.push({ key: 'mounted', label: 'mounted()', icon: 'fas fa-power-off' });
                if (has('watch')) list.push({ key: 'watch', label: 'watch', icon: 'fas fa-eye' });
                if (has('beforeUnmount')) list.push({ key: 'beforeUnmount', label: 'beforeUnmount()', icon: 'fas fa-power-off' });
                var fs = (this.model.code || {}).funcs || [];
                for (var i = 0; i < fs.length; i++) {
                    list.push({ key: '@' + i, label: String(fs[i].name || ''), icon: 'fas fa-bolt', ed: true, idx: i, grp: 'fn' });
                }
                /* the code of the file outside the component literal: constants,
                   module helper functions and component statics, each under its name */
                var post = [];
                if (has('consts') || this.code === 'consts') post.push({ key: 'consts', label: String(this.t('dpb_mod_consts')), icon: 'fas fa-superscript', fixed: true });
                var hf = (this.model.code || {}).headFuncs || [];
                for (var j = 0; j < hf.length; j++) {
                    post.push({ key: 'H' + j, label: String(hf[j].name || ''), icon: 'fas fa-cube', ed: true, idx: j, grp: 'head' });
                }
                var st = (this.model.code || {}).statics || [];
                for (var k = 0; k < st.length; k++) {
                    post.push({ key: 'S' + k, label: String(st[k].name || ''), icon: 'fas fa-database', ed: true, idx: k, grp: 'static' });
                }
                if (post.length) list.push({ key: '::sep', label: '', sep: true, icon: '' });
                return list.concat(post);
            },
            funcs: function () { return (this.model.code || {}).funcs || []; },
            headFuncs: function () { return (this.model.code || {}).headFuncs || []; },
            statics: function () { return (this.model.code || {}).statics || []; },
            /* the editable object of the current tab: a standard section, the
               "Константы" text, or a named entry of funcs / module funcs / statics */
            edCur: function () {
                var c = this.code;
                if (typeof c !== 'string') return null;
                if (c === 'consts') return { kind: 'consts' };
                if (c.charAt(0) === '@') return { kind: 'fn', obj: this.funcs[parseInt(c.slice(1), 10)] || null };
                if (c.charAt(0) === 'H') return { kind: 'head', obj: this.headFuncs[parseInt(c.slice(1), 10)] || null };
                if (c.charAt(0) === 'S') return { kind: 'static', obj: this.statics[parseInt(c.slice(1), 10)] || null };
                return null;
            },
            fnCur: function () {
                var e = this.edCur;
                return (e && (e.kind === 'fn' || e.kind === 'head' || e.kind === 'static')) ? e.obj : null;
            },
            /* the head of a static tab, read only: the widget variable is taken
               from the name of the widget, the property from the name of the tab,
               and only the value after "=" is edited in the window */
            staticHdr: function () {
                var e = this.edCur;
                if (!e || e.kind !== 'static' || !e.obj) return '';
                return this.staticVar() + '.' + (e.obj.name || 'STATIC') + ' = ';
            },
            /* an empty standard section shows the "add a function" stub instead of an editor */
            fnEmpty: function () {
                if (this.fnCur) return false;
                if (this.code === 'data' || this.code === 'dataPre' || this.code === 'consts') return false;
                return !String(this.model.code[this.code] || '').trim();
            },
            /* the code sections are shown from the first column, the indent of the
               file is put back when the text is saved */
            codeText: {
                get: function () {
                    var e = this.edCur;
                    if (!e) return B.dedentBy(this.model.code[this.code], this.sectionBase(this.code));
                    if (e.kind === 'consts') return String(this.model.code.consts || '');
                    if (e.kind === 'static') {
                        var sc = String(e.obj ? e.obj.text : '');
                        return B.dedentBy(this.staticBody(sc), this.staticBase(sc));
                    }
                    return e.obj ? (e.obj.text || '') : '';
                },
                set: function (v) {
                    var e = this.edCur;
                    if (!e) { this.model.code[this.code] = B.reindentBy(v, this.sectionBase(this.code)); return; }
                    if (e.kind === 'consts') { this.model.code.consts = v; return; }
if (e.kind === 'static') {
                    var cur = String(e.obj ? e.obj.text : '');
                    var body = B.reindentBy(String(v || '').replace(/\s+$/, ''), this.staticBase(cur));
                    e.obj.text = this.staticFull(cur, body);
                    return;
                }
                if (e.obj) {
                    e.obj.text = v;
                    /* the tab carries the name of the function the code declares, so
                       a name changed in the code moves the label of the tab too */
                    if (e.kind === 'head' || e.kind === 'fn') {
                        var mm = (e.kind === 'head'
                            ? /^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/
                            : /^[ \t]*([A-Za-z_$][\w$]*)\s*\(/).exec(String(v || '').trim());
                        if (mm && mm[1] !== e.obj.name) e.obj.name = mm[1];
                    }
                }
                }
            },
            hasRawHtml: function () {
                var h = this.model.appearance ? this.model.appearance.html : '';
                return String(h || '').trim() !== '';
            },
            /* nothing has been made yet: no blocks, no fields, no code. The code
               section of such a widget opens right on data(): it is always there,
               while methods() is still empty and would only show the stub */
            isBlank: function () {
                var m = this.model || {}, c = m.code || {}, a = m.appearance || {};
                if (String(m.title || '').trim() || String(m.description || '').trim()) return false;
                if (((a.items) || []).some(function (it) {
                    if (it._std && DpBuilder.isStdItem && DpBuilder.isStdItem(it)) return false;
                    return true;
                })) return false;
                if (String(a.html || '').trim()) return false;
                /* a header the user has set is work too, even without a single block */
                if (a.showTitle && String(a.title || '').trim()) return false;
                if (String(a.icon || '').trim() || String(a.iconUrl || '').trim()) return false;
                if (String(a.iconObject || '').trim() || String(a.iconProperty || '').trim()) return false;
                var tabs = ((m.settings || {}).tabs) || [];
                for (var i = 0; i < tabs.length; i++) {
                    var items = ((tabs[i] || {}).items) || [];
                    for (var x = 0; x < items.length; x++) {
                        var f = items[x] || {};
                        if (f._sys || f.type === 'info') continue;
                        if (f._std && DpBuilder.isStdField && DpBuilder.isStdField(f)) continue;
                        return false;
                    }
                }
                var keys = ['dataPre', 'data', 'computed', 'methods', 'mounted', 'watch', 'beforeUnmount', 'consts'];
                for (var j = 0; j < keys.length; j++) {
                    if (String(c[keys[j]] || '').trim()) return false;
                }
                return !((c.funcs) || []).length &&
                    !((c.headFuncs) || []).length &&
                    !((c.statics) || []).length;
            },
            /* 'auto' follows the model: a widget with own HTML opens in code mode,
               a widget made of blocks opens in the visual mode */
            viewIsCode: function () {
                if (this.viewMode === 'css') return false;
                if (this.viewMode === 'code') return true;
                if (this.viewMode === 'visual') return false;
                return this.hasRawHtml;
            },
            /* the stylesheet has a mode of its own: it belongs to the appearance
               like the markup does, but it is not the markup */
            viewIsCss: function () { return this.viewMode === 'css'; },
            viewIsVisual: function () { return !this.viewIsCode && !this.viewIsCss; },
            cssText: {
                get: function () { return String(((this.model || {}).code || {}).css || ''); },
                set: function (v) {
                    if (!this.model.code) this.model.code = {};
                    this.model.code.css = v;
                    this.checkCss();
                }
            },
            /* own markup is kept while the canvas is empty: nothing contradicts it yet */
            htmlKept: function () {
                return this.hasRawHtml && !(this.model.appearance.items || []).length;
            },
            rawPreview: function () {
                if (!this.hasRawHtml) return null;
                var opts = B.codeToOptions ? B.codeToOptions(this.model) : {};
                var o = { props: ['widget'], template: this.rawTpl || this.model.appearance.html };
                ['data', 'computed', 'methods', 'watch', 'mounted', 'beforeUnmount'].forEach(function (k) {
                    if (opts[k] !== undefined) o[k] = opts[k];
                });
                return o;
            },
            tabNames: function () { return this.model.settings.tabs; },
            cur: function () {
                var it = this.model.appearance.items;
                for (var i = 0; i < it.length; i++) if (it[i]._i === this.sel) return it[i];
                return null;
            },
            curTab: function () {
                var t = this.model.settings.tabs;
                return t[Math.min(this.tabIdx, t.length - 1)] || null;
            },
            curF: function () {
                var tab = this.curTab;
                var it = tab ? tab.items : [];
                for (var i = 0; i < it.length; i++) if (it[i]._i === this.fsel) return it[i];
                return null;
            },
            /* the core section of the current tab, while the tab has no field for it yet */
            curSys: function () {
                var tb = this.curTab;
                if (!tb || !this.isSysTab(tb)) return null;
                var has = (tb.items || []).some(function (f) { return !!this.sysOf(f); }, this);
                return has ? null : B.systemTabOf(tb);
            },
            settingKeys: function () { return B.settingKeys(this.model); },
            overflows: function () {
                var a = this.model.appearance;
                var b = B.innerSize(a);
                var items = a.items || [];
                for (var i = 0; i < items.length; i++) {
                    var s = B.itemSize(items[i]);
                    var x = Number(items[i].x) || 0, y = Number(items[i].y) || 0;
                    if (x < 0 || y < 0 || x + s.w > b.w + 1 || y + s.h > b.h + 1) return true;
                }
                return false;
            },
            previewWidget: function () {
                var w = {};
                this.model.settings.tabs.forEach(function (tb) {
                    (tb.items || []).forEach(function (f) { if (f.key) w[f.key] = f.default; });
                });
                return w;
            },
            widgetTypes: function () { return this.builtTypes || []; },
            stats: function () {
                return {
                    items: this.model.appearance.items.length,
                    fields: this.model.settings.tabs.reduce(function (a, tb) { return a + (tb.items || []).length; }, 0)
                };
            }
        },

        watch: {
            /* another widget is opened: back to the defaults and the mode
               follows the new model again. The tab chosen in the previous
               widget (a code section, a subtab, a settings tab) must not
               stick to the next one */
            modelValue: function () { this.sub = 'view'; this.code = 'data'; this.tabIdx = 0; this.sel = ''; this.fsel = ''; this.fnold = ''; this.viewMode = 'auto'; this.rawTpl = ''; this.rawErr = ''; this.cssErr = ''; this.fnMenu = false; this.fnren = -1; this.syncCss(); },
            /* the stylesheet is shown in the page while it is edited, so the rules
               are seen where they will really stand */
            viewMode: function () { this.syncCss(); },
            'model.code.css': function () { this.checkCss(); this.syncCss(); },
            model: { deep: true, handler: function () { this.validate(); this.loadIconProps(); } },
            'model.appearance.width': function () { this.clampItems(); },
            'model.appearance.height': function () { this.clampItems(); },
            'model.appearance.pad': function () { this.clampItems(); },
            'model.appearance.html': function () { this.queueRaw(); },
            'model.appearance.iconProperty': function () { this.loadIconProp(); },
            'model.appearance.iconObject': function () { this.loadIconProp(); },
            'model.code.data': function () { this.check(); },
            'model.code.dataPre': function () { this.check(); },
            'model.code.computed': function () { this.check(); },
            'model.code.methods': function () { this.check(); },
            'model.code.mounted': function () { this.check(); },
            'model.code.watch': function () { this.check(); },
            'model.code.beforeUnmount': function () { this.check(); },
            'model.code.funcs': { deep: true, handler: function () { this.check(); } },
            'model.code.consts': function () { this.check(); },
            'model.code.headFuncs': { deep: true, handler: function () { this.check(); } },
            'model.code.statics': { deep: true, handler: function () { this.check(); } }
        },

         mounted: function () {
             /* a widget with own markup opens in the code mode, everything is checked once */
             if (this.hasRawHtml) this.checkRaw();
             if (this.cssText) this.checkCss();
             /* a brand new widget starts in data(): it is the only section that is
                there from the start, methods() and the rest are still empty */
             if (this.isBlank && this.code === 'methods') this.code = 'data';
              /* the "add a function" menu closes on a click outside the builder */
              var self = this;
              this._fnDoc = function (e) {
                  /* the selection is taken off only on the canvas itself and by the
                     empty line of the list in the panel. Any other click - on a
                     field, a colour, a button of the selected component - means the
                     user is working with it, so the selection must stay. */
                  if (!self.fnMenu) return;
                 var el = self.$el;
                 if (el && el.contains(e.target)) return;
                 self.fnMenu = false;
                 self.fnren = -1;
             };
              this._kb = function (e) {
                  /* the keys belong to the canvas only: in the code mode and in the other
                     sections they must keep their usual meaning */
                  if (self.sub !== 'view' || self.viewIsCode || self.viewIsCss) return;
                  var tag = (e.target && e.target.tagName) || '';
                  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
                  /* cur is a computed, so it holds the component itself - calling it
                     would throw inside the listener and the key would do nothing */
                  var it = self.cur;
                  if (!self.sel || !it) return;
                  var items = self.model.appearance.items;
                  var idx = items.findIndex(function (x) { return x._i === it._i; });
                  if (idx < 0) return;
                  if (e.key === 'Delete' || e.key === 'Backspace' || e.code === 'Delete') {
                      e.preventDefault();
                      self.delItem(idx);
                  } else if ((e.ctrlKey || e.metaKey) && String(e.key || '').toLowerCase() === 'c') {
                      e.preventDefault();
                      self.copyItem(idx);
                  }
              };
              document.addEventListener('click', this._fnDoc);
              document.addEventListener('keydown', this._kb, true);
              this.loadIconProp();
              this.loadIconProps();
         },
         beforeUnmount: function () {
             if (this._fnDoc) document.removeEventListener('click', this._fnDoc);
             if (this._kb) document.removeEventListener('keydown', this._kb, true);
             /* the rules being edited are not written anywhere yet - they go away
                with the editor, the file keeps only what was saved */
             var live = document.getElementById('dpb-css-live');
             if (live && live.parentNode) live.parentNode.removeChild(live);
         },

        methods: {
            t: function (s) { return window.__t ? window.__t(s) : s; },
            compOf: function (it) { return B.COMPONENTS[it._t] || { label: it._t, icon: 'fas fa-square' }; },
            /* the name of a component in the list of the panel. The number is the
               place on the canvas: two texts of the same kind would otherwise be
               told apart by nothing. It is a method and not a computed on purpose -
               a computed is cached and gets no argument, so every component in the
               list would have been shown under the name of the first one. */
            /* the icon of the module of type "property": the property keeps the path to
               the picture, so the canvas has to show that path and not the name of the
               property. It used to be written straight into the class, which showed
               nothing - "Status" is not a class. The value is read once per change of
               the object or the property; a wrong answer only leaves the icon empty. */
            loadIconProp: function () {
                var a = this.model && this.model.appearance;
                if (!a || String(a.iconType || '') !== 'property') {
                    this.iconPropValue = '';
                    this.iconPropFor = '';
                    return;
                }
                var obj = String(a.iconObject || '').trim();
                var prop = String(a.iconProperty || '').trim();
                if (!obj || !prop) {
                    this.iconPropValue = '';
                    this.iconPropFor = '';
                    return;
                }
                var self = this;
                this._iconSeq = (this._iconSeq || 0) + 1;
                var seq = this._iconSeq;
                var url = 'getProperty?object=' + encodeURIComponent(obj) + '&property=' + encodeURIComponent(prop);
                Promise.resolve(typeof dpAPI === 'function' ? dpAPI(url) : null)
                    .then(function (r) {
                        /* a newer request has come in the meantime: its answer wins */
                        if (seq !== self._iconSeq) return;
                        var v = (r && r.value !== undefined && r.value !== null) ? r.value : '';
                        self.iconPropValue = String(v).trim();
                        self.iconPropFor = obj + '.' + prop;
                    })
                    .catch(function () {
                        if (seq !== self._iconSeq) return;
                        self.iconPropValue = '';
                        self.iconPropFor = obj + '.' + prop;
                    });
            },
            /* The same for the icons on the canvas. A field of type "property" holds the
               name of a property, so the canvas drew the name as a font class and stayed
               empty - the written widget fetched the value, the editor did not, and the
               two disagreed about the very same model. Read once per change of the object
               or of the property; a wrong answer only leaves the icon empty. */
            loadIconProps: function () {
                var self = this;
                var m = this.model;
                if (!m || !m.appearance || !m.appearance.items) return;
                var fields = [];
                (m.settings.tabs || []).forEach(function (tb) {
                    (tb.items || []).forEach(function (f) { if (f && f.key) fields.push(f); });
                });
                var objOf = function (row) {
                    var hit = '';
                    fields.forEach(function (f) {
                        if (!hit && String(f.type) === 'object' && String(f.row || '') === String(row || '')) hit = String(f.key);
                    });
                    if (!hit) fields.forEach(function (f) { if (!hit && String(f.type) === 'object') hit = String(f.key); });
                    return hit;
                };
                var want = {};
                m.appearance.items.forEach(function (it) {
                    if (!it || String(it._t) !== 'icon') return;
                    var k = String(it.bind || '');
                    if (!k) {
                        /* an icon that follows a property of its own: the object and the
                           property are written on the component, the name it reads the
                           value under is the one the model carries */
                        if (String(it.iconType || '') !== 'property') return;
                        var io = String(it.iconObject || '').trim();
                        var ip = String(it.iconProperty || '').trim();
                        if (!io || !ip || !it._ico) return;
                        want[it._ico] = { obj: io, prop: ip };
                        return;
                    }
                    var pf = null;
                    /* an icon on the switch of the settings panel follows the choice
                       made there, so the pair to read is the one the panel declares */
                    if (k === 'icon_type') {
                        var wo = String(this.previewWidget.icon_object == null ? '' : this.previewWidget.icon_object).trim();
                        var wp = String(this.previewWidget.icon_property == null ? '' : this.previewWidget.icon_property).trim();
                        if (String(this.previewWidget.icon_type || '') === 'property' && wo && wp) {
                            want[wp] = { obj: wo, prop: wp };
                        }
                        return;
                    }
                    fields.forEach(function (f) { if (!pf && String(f.key) === k && String(f.type) === 'property') pf = f; });
                    if (!pf) return;
                    var obj = objOf(pf.row);
                    var prop = String(this.previewWidget[k] == null ? '' : this.previewWidget[k]).trim();
                    if (!obj || !prop) return;
                    want[k] = { obj: obj, prop: prop };
                }, this);
                var keys = Object.keys(want);
                if (!keys.length) {
                    if (Object.keys(this.iconPropVals).length) this.iconPropVals = {};
                    return;
                }
                this._ipSeq = (this._ipSeq || 0) + 1;
                var seq = this._ipSeq;
                Promise.all(keys.map(function (k) {
                    var url = 'getProperty?object=' + encodeURIComponent(want[k].obj) +
                        '&property=' + encodeURIComponent(want[k].prop);
                    return Promise.resolve(typeof dpAPI === 'function' ? dpAPI(url) : null)
                        .then(function (r) { return [k, (r && r.value !== undefined && r.value !== null) ? String(r.value).trim() : '']; })
                        .catch(function () { return [k, '']; });
                })).then(function (pairs) {
                    /* a newer request has come in the meantime: its answer wins */
                    if (seq !== self._ipSeq) return;
                    var next = {};
                    pairs.forEach(function (p) { next[p[0]] = p[1]; });
                    self.iconPropVals = next;
                });
            },

            itName: function (it, idx) {                var c = this.compOf(it);                var kind = this.t(c.label);
                var txt = String(it.text === undefined || it.text === null ? '' : it.text).trim();
                /* one word and not too long: a whole sentence would fill the whole list */
                if (txt && txt.length <= 24 && !/\s/.test(txt)) txt = '«' + txt + '»';
                else if (txt) txt = '«' + txt.slice(0, 23).trim() + '…»';
                return (idx + 1) + '. ' + kind + (txt ? ' ' + txt : '');
            },
            /* a question with the look of the dashboard: the native confirm is
               replaced where a styled dialog is available */
            ask: function (text, danger) {
                if (window.dpConfirm) return window.dpConfirm(text, danger ? { danger: true } : {});
                return Promise.resolve(window.confirm(text));
            },
            /* the stylesheet of the widget is edited on its own: no markup is taken
               away or put back by switching to it */
            setViewMode: function (m) {
                var self = this;
                var a = this.model.appearance;
                if (m === 'css') {
                    this.viewMode = 'css';
                    this.checkCss();
                    this.syncCss();
                    return;
                }
                if (m === 'code') {
                    if (this.viewIsCode && this.hasRawHtml) return;
                    this.ask(this.t('dpb_raw_warn_confirm')).then(function (ok) {
                        if (!ok) return;
                        /* an empty canvas has nothing to seed: the markup of a free
                           body written into the own markup would throw the canvas out
                           of its empty state - leave the editor empty instead */
                        if (!self.hasRawHtml && (a.items || []).length) a.html = B.templateOf ? B.templateOf(self.model) : '';
                        self.viewMode = 'code';
                        self.checkRaw();
                    });
                    return;
                }
                /* visual */
                if (!this.viewIsCode && !this.hasRawHtml) { this.viewMode = 'visual'; return; }
                var drop = (a.items || []).length > 0;
                var toVisual = function (ok) {
                    if (!ok) return;
                    if (drop) {
                        /* the canvas contradicts the markup: it wins, the markup goes away */
                        a.html = '';
                        /* the file is no longer restored as is: the model now owns the widget */
                        self.model.imported = false;
                    }
                    /* empty canvas: keep the markup, it still produces the same result */
                    self.viewMode = 'visual';
                    self.rawErr = '';
                };
                if (drop) this.ask(this.t('dpb_raw_drop_confirm'), true).then(toVisual);
                else toVisual(true);
            },
            /* one tag carries the rules being edited: it follows the text and is
               taken away when the mode or the widget is left, so no copy of an old
               stylesheet stays on the page */
            syncCss: function () {
                if (typeof document === 'undefined') return;
                var el = document.getElementById('dpb-css-live');
                var css = this.viewIsCss ? this.cssText : '';
                if (!String(css || '').trim()) {
                    if (el && el.parentNode) el.parentNode.removeChild(el);
                    return;
                }
                if (!el) {
                    el = document.createElement('style');
                    el.id = 'dpb-css-live';
                    (document.head || document.documentElement).appendChild(el);
                }
                el.textContent = css;
            },
            /* the rules are watched as they are typed: an unclosed brace or quote
               would swallow the rest of the page's styles */
            checkCss: function () {
                var s = this.cssText;
                this.cssErr = '';
                if (!s.trim()) return;
                var d = 0, q = '', line = 1, open = false;
                for (var i = 0; i < s.length; i++) {
                    var ch = s.charAt(i);
                    if (q) {
                        if (ch === '\\') { i++; continue; }
                        if (ch === q) q = '';
                        if (ch === '\n') line++;
                        continue;
                    }
                    if (ch === '"' || ch === '\'') { q = ch; continue; }
                    if (ch === '/' && s.charAt(i + 1) === '*') {
                        var e = s.indexOf('*/', i + 2);
                        if (e < 0) { open = true; break; }
                        for (var k = i; k < e; k++) if (s.charAt(k) === '\n') line++;
                        i = e + 1;
                        continue;
                    }
                    if (ch === '\n') { line++; continue; }
                    if (ch === '{') d++;
                    else if (ch === '}') {
                        d--;
                        if (d < 0) { this.cssErr = this.t('dpb_css_bad') + ' (' + line + ')'; return; }
                    }
                }
                if (open || q || d > 0) this.cssErr = this.t('dpb_css_bad') + ' (' + line + ')';
            },
            checkRaw: function () {
                var h = String((this.model.appearance || {}).html || '');
                this.rawTpl = h;
                if (!h.trim()) { this.rawErr = ''; return; }
                var pre = B.checkMarkup ? B.checkMarkup(h) : { ok: true, error: '' };
                if (!pre.ok) { this.rawErr = pre.key ? this.t(pre.key) : pre.error; return; }
                try {
                    var V = window.Vue;
                    if (V && typeof V.compile === 'function') V.compile(h);
                    this.rawErr = '';
                } catch (e) {
                    this.rawErr = (e && e.message) ? e.message : String(e);
                }
            },
            queueRaw: function () {
                var self = this;
                if (this.rawTimer) clearTimeout(this.rawTimer);
                this.rawTimer = setTimeout(function () { self.rawTimer = null; self.checkRaw(); }, 500);
            },
            propsOf: function (it) { return (B.COMPONENTS[it._t] || {}).props || {}; },

            /* a field with `when` belongs to the component only in some of the
               modes: the font size of its own is in the way while the size is
               taken from the common settings of the panel */
            propShown: function (it, pd) {
                if (!pd || !pd.when) return true;
                var w = pd.when, v = it[w.key];
                if (v === undefined || v === null) v = '';
                return (w.show || []).indexOf(String(v)) >= 0;
            },
            optList: function (pd, key) {
            /* `types` is filled with the widgets the module has installed */
            var raw = (pd.dyn === 'types' ? (this.builtTypes || []) : (pd.options || [])).slice();
            /* the same two shapes a field uses: a bare value, whose caption comes from
               its own name, or {value,label}, where the caption is given outright.
               Both come back as {value,label}, so the list is drawn one way. */
            var out = raw.map(function (o) {
                return (o && typeof o === 'object' && o.value !== undefined)
                    ? { value: o.value, label: o.label }
                    : { value: o, label: '' };
            });
            /* a value that is not in the list stays in the list: nothing is lost on save */
            var v = key ? this.cur[key] : '';
            var seen = out.some(function (o) { return String(o.value) === String(v); });
            if (v !== '' && v !== undefined && v !== null && !seen) out.unshift({ value: v, label: '' });
            return out.length ? out : [{ value: '', label: '' }];
        },
            valLabel: valLabel,
            optLabel: function (o) {
                if (!o) return '';
                return o.label ? this.t(o.label) : valLabel(o.value);
            },
        fType: function (tp) { return window.__t ? window.__t('dpb_ft_' + tp) : tp; },
            fIcon: function (tp) { return (B.FIELD_TYPES[tp] || {}).icon || 'fas fa-square'; },
            tabLabel: function (v) { return B.lbl ? B.lbl(v) : v; },
            /* the name of a field as the widget shows it: the label of a ready made
               widget is a key of the language file, an own one is written as it is */
            fLbl: function (f) {
                if (!f) return this.t('dpb_unnamed');
                var v = String(f.label || '').trim();
                if (v && B.lbl) v = B.lbl(v) || v;
                return v || f.key || this.t('dpb_unnamed');
            },
            /* the system section a field belongs to, or null for an ordinary field */
            sysOf: function (f) { return (B.systemFieldOf && f && f._sys) ? B.systemFieldOf(f) : null; },
            /* the tab belongs to a section of the core */
            isSysTab: function (tb) { return !!(B.systemTabOf && B.systemTabOf(tb)); },
                /* an offset that is a plain number is a real place on the canvas: the
                   panel puts it as left/top from the edge, so the canvas does the same
                   and holds the component inside. An expression of live values cannot
                   be counted here - only on the panel - so it keeps the editor place
                   and is marked instead. */
                numOf: function (v) {
                    var x = B.safeExpr(v);
                    if (x === '' || !/^-?\d+(\.\d+)?$/.test(x)) return null;
                    var n = Math.round(Number(x));
                    return isFinite(n) ? n : null;
                },
                liveOf: function (it) {
                    if (!it) return '';
                    var a = B.safeExpr(it.dx), b = B.safeExpr(it.dy);
                    if (!a && !b) return '';
                    if ((a && this.numOf(a) === null) || (b && this.numOf(b) === null)) {
                        return (a ? this.t('dpb_dx') + ': ' + a : '') + (a && b ? '   ' : '') +
                            (b ? this.t('dpb_dy') + ': ' + b : '');
                    }
                    return '';
                },
                nodeStyle: function (it) {
                    var s = B.itemSize(it);
                    var ax = this.numOf(it.dx), ay = this.numOf(it.dy);
                    var x = ax === null ? it.x : ax;
                    var y = ay === null ? it.y : ay;
                    var p = B.clampPos(this.model.appearance, x, y, s.w, s.h);
                    return 'left:' + p.x + 'px;top:' + p.y + 'px;width:' + p.w + 'px;height:' + p.h + 'px';
                },
                setSize: function (w, h) {
                    this.model.appearance.width = w;
                    this.model.appearance.height = h;
                    this.clampItems();
                },
                clampItems: function () { B.clampAll(this.model.appearance); },
                /* a coordinate typed by hand has to land inside the canvas, the
                   same way a dragged component does */
                setPos: function (it, ax, ay) {
                    if (!it) return;
                    var a = this.model.appearance;
                    var p = B.clampPos(a, Math.round(Number(ax) || 0), Math.round(Number(ay) || 0), it.w, it.h);
                    it.x = p.x; it.y = p.y;
                    B.clampAll(a);
                },
                /* an offset names an exact place from the edge, a stretched side fills
                   whatever is left over - the two cannot hold at once. The offset wins,
                   so the checkbox is cleared here instead of leaving the model saying
                   "stretched" while the code quietly ignores the offset. */
                posInput: function (ev, side) {
                    var it = this.cur;
                    if (!it) return;
                    var v = String((ev && ev.target && ev.target.value) || '');
                    if (v.trim()) it[side === 'y' ? 'stretchY' : 'stretchX'] = false;
                    this.check();
                },
                /* the selector a hand written method uses to find this component */
                hookOf: function (it) {
                    if (!it || !it._i) return '';
                    return '[data-dpb-i="' + String(it._i).replace(/["\\\\<>&]/g, '') + '"]';
                },
                frameStyle: function () {
                    var a = this.model.appearance;
                    return 'width:' + (Number(a.width) || 0) + 'px;height:' + (Number(a.height) || 0) + 'px;' +
                        'border-radius:' + (Number(a.radius) || 0) + 'px;' +
                        (a.bg ? 'background:' + a.bg + ';' : '');
                },
                frameBodyStyle: function () {
                    var a = this.model.appearance;
                    return 'padding:' + (Number(a.pad) || 0) + 'px;' +
                        (a.color ? 'color:' + a.color + ';' : '') +
                        (a.bg ? '' : 'background:rgba(255,255,255,.03);');
                },

            /* --- mouse placement inside the widget frame --- */
            dragStart: function (ev, it) {
                if (ev.button !== 0) return;
                if (ev.target && ev.target.closest && ev.target.closest('.dpb-node__hs')) return;
                var s = B.itemSize(it);
                this.sel = it._i;
                this.drag = {
                    _i: it._i, it: it,
                    x0: Number(it.x) || 0, y0: Number(it.y) || 0,
                    dx: ev.clientX - (Number(it.x) || 0),
                    dy: ev.clientY - (Number(it.y) || 0),
                    w: s.w, h: s.h, moved: false
                };
                var self = this;
                this._onMove = function (e) { self.dragMove(e); };
                this._onUp = function () { self.dragEnd(); };
                document.addEventListener('mousemove', this._onMove, true);
                document.addEventListener('mouseup', this._onUp, true);
                ev.preventDefault();
            },
            dragMove: function (ev) {
                var d = this.drag;
                if (!d) return;
                /* the others stay where they are: this one stops at the first
                   neighbour it would cover */
                var p = B.placeFree(this.model.appearance, d.it, ev.clientX - d.dx, ev.clientY - d.dy);
                d.it.x = p.x; d.it.y = p.y;
                d.it.w = p.w; d.it.h = p.h;
                d.moved = true;
                ev.preventDefault();
            },
            dragEnd: function () {
                if (this._onMove) document.removeEventListener('mousemove', this._onMove, true);
                if (this._onUp) document.removeEventListener('mouseup', this._onUp, true);
                this._onMove = this._onUp = null;
                this.drag = null;
            },

            /* --- resizing the component by one of the eight handles --- */
            resizeStart: function (ev, it, dir) {
                if (ev.button !== 0) return;
                this.sel = it._i;
                this.rs = { _i: it._i, it: it, dir: dir };
                var self = this;
                this._onRsMove = function (e) { self.resizeMove(e); };
                this._onRsUp = function () { self.resizeEnd(); };
                document.addEventListener('mousemove', this._onRsMove, true);
                document.addEventListener('mouseup', this._onRsUp, true);
                ev.preventDefault();
                ev.stopPropagation();
            },
            resizeMove: function (ev) {
                var r = this.rs;
                if (!r) return;
                var pt = this.areaPoint(ev);
                if (!pt) return;
                var p = B.resizeItem(this.model.appearance, r.it, r.dir, pt.x, pt.y);
                r.it.x = p.x; r.it.y = p.y; r.it.w = p.w; r.it.h = p.h;
                ev.preventDefault();
            },
            resizeEnd: function () {
                if (this._onRsMove) document.removeEventListener('mousemove', this._onRsMove, true);
                if (this._onRsUp) document.removeEventListener('mouseup', this._onRsUp, true);
                this._onRsMove = this._onRsUp = null;
                this.rs = null;
            },
            /* point of the frame body (content box) under the mouse */
            areaPoint: function (ev) {
                var el = this.$refs.area;
                if (!el || !el.getBoundingClientRect) return null;
                var r = el.getBoundingClientRect();
                return { x: ev.clientX - r.left, y: ev.clientY - r.top };
            },
                stackStyle: function () { return ''; },
            renderItem: function (it) { return B.previewHtml(it, this.previewWidget, this.model, this.iconPropVals); },

            /* --- palette / drop --- */
            onPaletteDrag: function (it) { this.palette = it; },
            onWidgetDrag: function (ev, wt) {
                ev.dataTransfer.effectAllowed = 'copy';
                ev.dataTransfer.setData('text/plain', JSON.stringify({ kind: 'comp', type: 'widget', widget: wt }));
            },
            onCanvasDrop: function (ev) {
                this.over = false;
                var raw = ev.dataTransfer.getData('text/plain');
                if (!raw) return;
                var d;
                try { d = JSON.parse(raw); } catch (e) { return; }
                if (d.kind !== 'comp') return;
                var pt = this.areaPoint(ev);
                this.addItem(d.type, d.widget, pt);
            },
            addItem: function (t, wtype, at) {
                var it = B.newItem(t || 'text');
                var d = B.COMPONENTS[t || 'text'] || {};
                it.w = d.w || 160; it.h = d.h || 32;
                if (t === 'widget' && wtype) it.type = wtype;
                var a = this.model.appearance;
                var self = this;
                var place = function () {
                    if (at) {
                        var p = B.clampPos(a, at.x - it.w / 2, at.y - it.h / 2, it.w, it.h);
                        it.x = p.x; it.y = p.y; it.w = p.w; it.h = p.h;
                    } else {
                        var free = B.autoPos(a, a.items || [], it.w, it.h);
                        it.x = free.x; it.y = free.y;
                    }
                    self.model.appearance.items.push(it);
                    self.sel = it._i;
                    if (t === 'widget' && !wtype) self.typeError = self.t('dpb_pick_widget');
                    self.sub = 'view';
                };
                if (this.hasRawHtml) {
                    /* the first block on an empty canvas contradicts the kept markup */
                    this.ask(this.t('dpb_html_drop_confirm'), true).then(function (ok) {
                        if (!ok) return;
                        a.html = '';
                        /* the file is no longer restored as is: the model now owns the widget */
                        self.model.imported = false;
                        self.viewMode = 'visual';
                        place();
                    });
                    return;
                }
                place();
            },
            addWidgetItem: function (wt) { this.addItem('widget', wt); },
            delItem: function (i) {
                var it = this.model.appearance.items[i];
                this.model.appearance.items.splice(i, 1);
                if (this.sel === it._i) this.sel = '';
            },
            copyItem: function (i) {
                var a = this.model.appearance;
                var src = a.items[i];
                var c = JSON.parse(JSON.stringify(src));
                c._i = B.uid('c');
                /* a copy that lands on the original cannot be seen or grabbed, so it
                   takes another place: first straight under the original, and if that
                   is taken - any free one. The width and height come from the copy, so
                   a stretched side keeps its own size here just like it does anywhere */
                var s = B.itemSize(c);
                var gap = Number(a.gap) || 8;
                var p = B.placeFree(a, c, src.x, src.y + s.h + gap);
                if (!p || (p.x === src.x && p.y === src.y)) p = B.autoPos(a, a.items, s.w, s.h);
                c.x = p.x; c.y = p.y;
                a.items.splice(i + 1, 0, c);
                this.sel = c._i;
            },
            moveItem: function (i, d) {
                var a = this.model.appearance.items;
                var j = i + d;
                if (j < 0 || j >= a.length) return;
                var t = a[i]; a[i] = a[j]; a[j] = t;
            },

            /* a component can be stretched only along the sides it can really take:
               a slider grows sideways but keeps its height, a switch does not grow
               at all, an image takes both */
            stretchOf: function (it, axis) {
                return !!(it && B.canStretch(it._t, axis));
            },

            /* --- settings tabs --- */
            addTab: function () {                var n = this.model.settings.tabs.length + 1;
                var key = 'tab' + n;
                while (this.model.settings.tabs.some(function (x) { return x.key === key; })) { n++; key = 'tab' + n; }
                this.model.settings.tabs.push({ key: key, label: 'Tab ' + n, items: [] });
                this.tabIdx = this.model.settings.tabs.length - 1;
            },
            delTab: function (i) {
                if (this.model.settings.tabs.length <= 1) return;
                this.model.settings.tabs.splice(i, 1);
                if (this.tabIdx >= this.model.settings.tabs.length) this.tabIdx = this.model.settings.tabs.length - 1;
                this.fsel = '';
            },
            renameInline: function (i) { this.ren = i; },

            /* --- fields --- */
            onFieldDrop: function (ev) {
                var raw = ev.dataTransfer.getData('text/plain');
                if (!raw) return;
                var d;
                try { d = JSON.parse(raw); } catch (e) { return; }
                if (d.kind === 'field') this.addField(d.type);
                else if (d.kind === 'system') this.addSystemField(d);
            },
            addField: function (tp) {
                var f = B.newField(tp || 'text');
                var used = {};
                this.curTab.items.forEach(function (x) { used[x.key] = 1; });
                var base = 'my' + String(tp || 'field');
                var k = base, n = 1;
                while (used[k]) { n++; k = base + n; }
                f.key = k;
                f.label = k.charAt(0).toUpperCase() + k.slice(1);
                this.curTab.items.push(f);
                this.selField(f);
                this.sub = 'settings';
            },
            /* the error of the key belongs to the field that was selected before */
            selField: function (f) {
                this.fsel = f ? f._i : '';
                this.keyError = '';
            },
            /* a system field is added to the tab as an ordinary field: the section that
               edits its value is drawn by the module core, the widget only keeps the data */
            addSystemField: function (s) {
                var key = (s && s.field) || '';
                if (!key) return;
                var used = {};
                this.curTab.items.forEach(function (x) { used[x.key] = x; });
                if (used[key]) {
                    /* the tab already keeps it: show the field that is in the way */
                    this.selField(used[key]);
                    this.keyError = this.t('dpb_sys_dup');
                    return;
                }
                var f = B.systemField(s, '[]');
                this.curTab.items.push(f);
                this.selField(f);
                this.sub = 'settings';
            },
            delField: function (i) {
                var f = this.curTab.items[i];
                this.curTab.items.splice(i, 1);
                if (this.fsel === f._i) this.selField(null);
            },
            copyField: function (i) {
                var src = this.curTab.items[i];
                /* a system field exists only once: its section keeps a single property */
                if (src && src._sys) { this.selField(src); this.keyError = this.t('dpb_sys_nocopy'); return; }
                var c = JSON.parse(JSON.stringify(src));
                c._i = B.uid('f');
                c.key = c.key + 'Copy';
                c.label = c.label + ' copy';
                this.curTab.items.splice(i + 1, 0, c);
                this.selField(c);
            },
            moveField: function (i, d) {
                var a = this.curTab.items, j = i + d;
                if (j < 0 || j >= a.length) return;
                var t = a[i]; a[i] = a[j]; a[j] = t;
            },

            /* --- code --- */
            check: function () {
                var e = this.edCur;
                var text, kind;
                if (e) {
                    text = e.kind === 'consts' ? String(this.model.code.consts || '')
                        : (e.obj ? (e.obj.text || '') : '');
                    kind = 'mounted';
                } else {
                    text = this.model.code[this.code] || '';
                    kind = this.code;
                }
                var r = B.checkSyntax(text, kind);
                this.err = r.ok ? '' : (r.key ? this.t(r.key) : r.error);
            },
            addStdFn: function (s) {
                var c = this.model.code;
                var stub = { computed: '// computed', methods: '// methods', mounted: '// mounted', watch: '// watch', beforeUnmount: '// beforeUnmount' }[s.key];
                if (s.key !== 'data' && !String(c[s.key] || '').trim() && stub) c[s.key] = stub;
                this.code = s.key;
                this.fnMenu = false;
                this.check();
            },
            /* the module level of the file outside the component literal */
            addConsts: function () {
                this.code = 'consts';
                this.fnMenu = false;
                this.check();
            },
            addHeadFn: function () {
                var c = this.model.code;
                if (!Array.isArray(c.headFuncs)) c.headFuncs = [];
                var names = {};
                c.headFuncs.forEach(function (f) { names[f.name] = 1; });
                c.funcs.forEach(function (f) { names[f.name] = 1; });
                ['data', 'dataPre', 'computed', 'methods', 'mounted', 'watch', 'beforeUnmount'].forEach(function (k) { names[k] = 1; });
                var n = 1;
                while (names['fn' + n]) n++;
                c.headFuncs.push({ _i: B.uid('hf'), name: 'fn' + n, text: 'function fn' + n + '() {}' });
                this.code = 'H' + (c.headFuncs.length - 1);
                this.fnMenu = false;
                this.check();
            },
            addStatic: function () {
                var c = this.model.code;
                if (!Array.isArray(c.statics)) c.statics = [];
                var names = {};
                c.statics.forEach(function (f) { names[f.name] = 1; });
                var n = 1;
                while (names['STATIC' + n]) n++;
                c.statics.push({ _i: B.uid('st'), name: 'STATIC' + n, text: '' });
                this.code = 'S' + (c.statics.length - 1);
                this.fnMenu = false;
                this.check();
            },
            /* the depth of a section: from the whole of its text when the depth is
               even, from the recorded indent of the import otherwise - a line a hand
               edit left shallow (methods of musicplayer.js) must not cancel the
               indent of every entry, so the recorded depth wins when nothing else
               says anything */
            sectionBase: function (name) {
                var min = B.blockIndent(String((this.model.code || {})[name] || ''));
                if (min > 0) return min;
                var i = (this.model || {}).indent;
                return (i && typeof i[name] === 'number' && i[name] > 0) ? i[name] : 0;
            },
            staticBase: function (text) {
                return B.blockIndent(this.staticBody(String(text || '')));
            },
            objOf: function (c) {
                var grp = c && c.grp;
                var i = c ? c.idx : -1;
                if (grp === 'fn') return this.funcs[i];
                if (grp === 'head') return this.headFuncs[i];
                if (grp === 'static') return this.statics[i];
                return null;
            },
            /* the variable the widget lives in on the module level: the one the
               file uses when it is imported, the built name for a new widget */
            staticVar: function () {
                return String((this.model.srcVar || '')).trim() || B.varName(this.model.type || 'widget');
            },
            /* the value without the "Widget.NAME =" head; a text without a head
               (typed into a brand new static) stays as it is */
            staticValue: function (text) {
                var h = /^[ \t]*[A-Za-z_$][\w$]*\.[A-Za-z_$][\w$]*[ \t]*=[ \t]*/.exec(String(text || ''));
                return h ? String(text).slice(h[0].length) : String(text || '');
            },
            /* the statics are tables: the brackets of the array and the closing ";"
               are put back when the file is written, so the tab shows only the
               lines between them */
            staticIsArray: function (text) {
                return /^[ \t]*[A-Za-z_$][\w$]*\.[A-Za-z_$][\w$]*[ \t]*=\s*\[/.test(String(text || ''));
            },
            staticBody: function (text) {
                var v = this.staticValue(text);
                var s = String(v || '').replace(/^\s+/, '');
                if (s.charAt(0) === '[') {
                    var b = s.slice(1).replace(/\s*;\s*$/, '').replace(/\s*\]\s*$/, '').replace(/^\s*\n/, '').replace(/\s+$/, '');
                    return b;
                }
                return String(v || '').replace(/\s*;\s*$/, '').replace(/\s+$/, '');
            },
/* the whole statement from the value: the head, the brackets of the
                array and the ";" are added automatically; a value that was not an
                array keeps its shape, only the ";" is appended */
            staticFull: function (cur, body) {
                var vn = this.staticVar();
                var nm = (this.edCur && this.edCur.obj && this.edCur.obj.name) ? this.edCur.obj.name : 'STATIC';
                var t = String(body || '').replace(/\s+$/, '');
                if (!t.trim()) return '';
                var isArr = !String(cur).trim() || this.staticIsArray(cur);
                if (isArr) return vn + '.' + nm + ' = [\n' + t.replace(/^\s*\n/, '') + '\n];';
                if (t.charAt(t.length - 1) !== ';') t += ';';
                return vn + '.' + nm + ' = ' + t;
            },
            setFnName: function (c, v) {
                var o = this.objOf(c);
                if (o) o.name = v;
            },
            delFn: function (c) {
                var grp = c && c.grp;
                var i = c ? c.idx : -1;
                var arr = grp === 'head' ? (this.model.code.headFuncs || [])
                    : grp === 'static' ? (this.model.code.statics || [])
                        : (this.model.code.funcs || []);
                if (!arr[i]) return;
                arr.splice(i, 1);
                if (String(this.code) === c.key) this.code = 'data';
                this.fnren = '';
                this.fnMenu = false;
                this.check();
            },
            renFn: function (c) {
                var o = this.objOf(c);
                if (!o) return;
                this.fnold = String(o.name || '');
                this.fnren = c.key;
                var self = this;
                setTimeout(function () {
                    var el = self.$el ? self.$el.querySelector('.dpb-fnren input') : null;
                    if (el) { el.focus(); el.select(); }
                }, 0);
            },
            commitFn: function (c) {
                var grp = c && c.grp;
                var arr = grp === 'head' ? (this.model.code.headFuncs || [])
                    : grp === 'static' ? (this.model.code.statics || [])
                        : (this.model.code.funcs || []);
                var o = arr[c.idx];
                if (o) {
                    var old = this.fnold;
                    var nm = String(o.name || '').trim();
                    var ok = /^[A-Za-z_$][\w$]*$/.test(nm) &&
                        (grp !== 'static' || /^[A-Z][A-Z0-9_]*$/.test(nm)) &&
                        ['data', 'dataPre', 'computed', 'methods', 'mounted', 'watch', 'beforeUnmount', 'consts'].indexOf(nm) < 0 &&
                        !arr.some(function (x, j) { return j !== c.idx && String(x.name) === nm; });
                    if (!ok) o.name = old || (grp === 'static' ? 'STATIC' + (c.idx + 1) : 'fn' + (c.idx + 1));
                    else if (old && old !== o.name) {
                        /* the name lives in the code the entry keeps: the tab shows
                           it and the file is written from the text, so a rename has
                           to reach the declaration itself */
                        if (grp === 'head') {
                            var reH = new RegExp('\\bfunction\\s+' + old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\(');
                            o.text = String(o.text || '').replace(reH, 'function ' + o.name + '(');
                        } else if (grp === 'static') {
                            var reS = new RegExp('([A-Za-z_$][\\w$]*\\.)' + old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\s*=)');
                            o.text = String(o.text || '').replace(reS, '$1' + o.name + '$2');
                        }
                    }
                }
                this.fnren = '';
                this.fnold = '';
            },
            runWizard: function (onlyStubs) {
                var w = B.wizard(this.model);
                var fill = function (k) {
                    var cur = String((this.model.code || {})[k] || '').trim();
                    if (cur) return;
                    if (String(w[k] || '').trim()) this.model.code[k] = w[k];
                }.bind(this);
                fill('data');
                this.mergeComputed();
                fill('methods');
                fill('mounted');
                fill('beforeUnmount');
                this.check();
            },

            /* the wizard fills an empty section, so a name that showed up later - a new
               field, or an expression in a component offset - never reached the code.
               The file then names a value the widget never declares, the render throws
               and nothing moves. Every name the wizard offers that the written
               computed does not have yet is appended to it; the same guarantee is
               made again by genSource, so it holds even without the button. */
            mergeComputed: function () {
                B.ensureComputed(this.model);
            },

            /* --- validation --- */
            taken: function () {
                return (this.existingTitles || []).map(norm);
            },
            validate: function () {
                var title = norm(this.model.title);
                this.nameError = '';
                this.typeError = '';
                this.keyError = '';

                if (this.model.title) {
                    if (this.taken().indexOf(title) >= 0) this.nameError = this.t('dpb_name_dup');
                } else {
                    this.nameError = this.t('dpb_name_req');
                }
                if (!/^[a-z0-9_\-]{1,40}$/.test(this.model.type)) this.typeError = this.t('dpb_type_bad');
                if (this.curF) {
                    var k = this.curF.key || '';
                    if (k && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(k)) this.keyError = this.t('dpb_key_bad');
                }
            },

            /* --- output --- */
            source: function () { return B.genSource(this.model); },
            download: function () {
                this.validate();
                if (this.nameError || this.typeError) { this.sub = 'view'; return; }
                this.$emit('action', 'download', { model: this.model, js: this.source() });
            },
            save: function () {
                this.validate();
                if (this.nameError || this.typeError) { this.sub = 'view'; return; }
                this.$emit('action', 'install', { model: this.model, js: this.source() });
            },
            reset: function () { this.$emit('reset'); }
        },

        created: function () { this.validate(); }
    };

    window.DpBuilderUI = DpBuilder;
})();
