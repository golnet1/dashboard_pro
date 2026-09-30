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
            '      <button class="dpb-mode" :class="{ \'dpb-mode--on\': !viewIsCode }" @click="setViewMode(\'visual\')"><i class="fas fa-table-cells"></i>{{ t(\'dpb_view_visual\') }}</button>' +
            '      <button class="dpb-mode" :class="{ \'dpb-mode--on\': viewIsCode }" @click="setViewMode(\'code\')"><i class="fas fa-code"></i>{{ t(\'dpb_view_code\') }}</button>' +
            '    </div>' +
            '    <div style="flex:1"></div>' +
            '    <div class="dpb-wizstat" v-if="stats">{{ t(\'dpb_items\') }}: {{ stats.items }} · {{ t(\'dpb_fields\') }}: {{ stats.fields }}</div>' +
            '  </div>' +

            /* ================= 1. appearance ================= */
            '  <div v-show="sub === \'view\' && !viewIsCode" class="dpb-panes">' +
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
            '          <div class="dpb-frame__body" :style="frameBodyStyle()">' +
            '            <div class="dpb-frame__grid"></div>' +
            '            <div class="dpb-canvas__stack" ref="area">' +
            '              <div v-for="(it, i) in model.appearance.items" :key="it._i" class="dpb-node" :class="{ \'dpb-node--on\': sel === it._i, \'dpb-node--drag\': drag && drag._i === it._i, \'dpb-node--rs\': rs && rs._i === it._i }"' +
            '                   :style="nodeStyle(it)" @mousedown="dragStart($event, it)" @click.stop="sel = it._i">' +
            '                <div class="dpb-node__body"><div class="dpb-fit" v-html="renderItem(it)"></div></div>' +
            '                <div class="dpb-node__hs" v-if="sel === it._i">' +
            '                  <i v-for="hd in HANDLES" :key="hd" class="dpb-h" :class="\'dpb-h--\' + hd" @mousedown.stop="resizeStart($event, it, hd)"></i>' +
            '                </div>' +
            '                <div class="dpb-node__ops">' +
            '                  <button :title="t(\'dpb_copy\')" @click.stop="copyItem(i)"><i class="fas fa-copy"></i></button>' +
            '                  <button :title="t(\'dpb_delete\')" @click.stop="delItem(i)"><i class="far fa-trash-alt"></i></button>' +
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
            '        <label>{{ t(\'dpb_mod_dir\') }}<select v-model="model.appearance.dir"><option value="column">{{ valLabel(\'column\') }}</option><option value="row">{{ valLabel(\'row\') }}</option></select></label>' +
            '        <label>{{ t(\'dpb_mod_gap\') }}<input type="number" v-model.number="model.appearance.gap" min="0" step="2"></label>' +
            '        <span class="dpb-sizes">' +
            '          <button v-for="p in SIZE_PRESETS" :key="p[0] + \'x\' + p[1]" type="button" class="dpb-size" :class="{ \'dpb-size--on\': model.appearance.width === p[0] && model.appearance.height === p[1] }" @click="setSize(p[0], p[1])">{{ p[0] }}&times;{{ p[1] }}</button>' +
            '        </span>' +
            '      </div>' +
            '    </div>' +

            '    <div class="dpb-pane dpb-pane--right">' +
            '      <div class="dpb-pane__title">{{ t(\'dpb_props\') }}</div>' +
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
            '          <div class="dpb-row2">' +
            '            <div class="dpb-f"><label>{{ t(\'dpb_pad\') }}</label><input type="number" v-model.number="model.appearance.pad" min="0"></div>' +
            '            <div class="dpb-f"><label>{{ t(\'dpb_radius\') }}</label><input type="number" v-model.number="model.appearance.radius" min="0"></div>' +
            '          </div>' +
            '          <div class="dpb-row2">' +
            '            <div class="dpb-f"><label>{{ t(\'dpb_bg\') }}</label><input type="color" v-model="model.appearance.bg"></div>' +
            '            <div class="dpb-f"><label>{{ t(\'dpb_color\') }}</label><input type="color" v-model="model.appearance.color"></div>' +
            '          </div>' +
            '          <div class="dpb-f"><label>{{ t(\'dpb_align\') }}</label>' +
            '            <select v-model="model.appearance.align">' +
            '              <option v-for="o in [\'stretch\', \'flex-start\', \'center\', \'flex-end\']" :key="o" :value="o">{{ valLabel(o) }}</option></select></div>' +
            '          <div class="dpb-chk"><input type="checkbox" id="dpbShowTitle" v-model="model.appearance.showTitle"><label for="dpbShowTitle">{{ t(\'dpb_showtitle\') }}</label></div>' +
            '          <div class="dpb-f" v-if="model.appearance.showTitle"><label>{{ t(\'dpb_title\') }}</label><input type="text" v-model="model.appearance.title"></div>' +
            '        </div>' +
            /* --- selected component --- */
            '        <div class="dpb-block" v-if="cur">' +
            '          <div class="dpb-block__title"><i :class="compOf(cur).icon"></i>{{ t(compOf(cur).label) }}</div>' +
            '          <div class="dpb-row2">' +
            '            <div class="dpb-f"><label>{{ t(\'dpb_w\') }}</label><input type="number" v-model.number="cur.w" min="10" step="1"></div>' +
            '            <div class="dpb-f"><label>{{ t(\'dpb_h\') }}</label><input type="number" v-model.number="cur.h" min="10" step="1"></div>' +
            '          </div>' +
            '          <div class="dpb-hint">{{ t(\'dpb_pos_hint\') }}</div>' +
            '          <div class="dpb-row2">' +
            '            <div class="dpb-f"><label>{{ t(\'dpb_anchor_x\') }}</label>' +
            '              <select v-model="cur.anchorX"><option value="">{{ t(\'dpb_anchor_none\') }}</option>' +
            '                <option v-for="o in [\'left\', \'center\', \'right\']" :key="o" :value="o">{{ valLabel(o) }}</option></select></div>' +
            '            <div class="dpb-f"><label>{{ t(\'dpb_anchor_y\') }}</label>' +
            '              <select v-model="cur.anchorY"><option value="">{{ t(\'dpb_anchor_none\') }}</option>' +
            '                <option v-for="o in [\'top\', \'center\', \'bottom\']" :key="o" :value="o">{{ valLabel(o) }}</option></select></div>' +
            '          </div>' +
            '          <div class="dpb-hint">{{ t(\'dpb_anchor_hint\') }}</div>' +
            '          <div class="dpb-f"><label>{{ t(\'dpb_bind\') }}</label><select v-model="cur.bind">' +
            '            <option value="">—</option><option v-for="k in settingKeys" :key="k" :value="k">{{ k }}</option></select></div>' +
            '          <div v-for="(pd, pk) in propsOf(cur)" :key="pk" class="dpb-f">' +
            '            <label>{{ t(pd.label) }}</label>' +
            '            <icon-picker v-if="pd.type === \'icon\'" v-model="cur[pk]"></icon-picker>' +
            '            <color-picker v-else-if="pd.type === \'color\'" v-model="cur[pk]"></color-picker>' +
            '            <select v-else-if="pd.type === \'select\'" v-model="cur[pk]"><option v-for="o in optList(pd, pk)" :key="o" :value="o">{{ valLabel(o) }}</option></select>' +
            '            <select v-else-if="pd.type === \'bool\'" v-model="cur[pk]"><option :value="false">{{ t(\'dpb_no\') }}</option><option :value="true">{{ t(\'dpb_yes\') }}</option></select>' +
            '            <select v-else-if="pd.type === \'setting\'" v-model="cur[pk]">' +
            '              <option value="">—</option><option v-for="k in settingKeys" :key="k" :value="k">{{ k }}</option></select>' +
            '            <textarea v-else-if="pd.type === \'textarea\'" rows="3" v-model="cur[pk]"></textarea>' +
            '            <input v-else type="text" v-model="cur[pk]">' +
            '          </div>' +
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
            '          <div class="dpb-frow__main"><b>{{ f.label || f.key || t(\'dpb_unnamed\') }}</b><span>{{ sysOf(f) ? t(sysOf(f).label) + \' · \' + f.key : f.key + \' · \' + fType(f.type) }}</span></div>' +
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
            '          <div class="dpb-f"><label>{{ t(\'dpb_label\') }}</label><input type="text" v-model="curF.label"></div>' +
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
            '      <button v-for="(c, ci) in CODES" :key="c.key" class="dpb-subtab" :class="{ \'dpb-subtab--on\': code === c.key }"' +
            '              @click="code = c.key" @dblclick.stop="c.fn && renFn(c.idx)">' +
            '        <i :class="c.fn ? \'fas fa-bolt\' : c.icon"></i>' +
            '        <span v-if="c.fn && fnren === c.idx" class="dpb-fnren"><input v-model="funcs[c.idx].name" class="dpb-inline" @click.stop @blur="commitFn(c.idx)" @keyup.enter="commitFn(c.idx)"></span>' +
            '        <template v-else>{{ c.label }}</template>' +
            '        <i v-if="c.fn" class="far fa-times dpb-fn__del" :class="{ \'dpb-fn__del--hide\': fnren === c.idx }" @click.stop="delFn(c.idx)"></i>' +
            '      </button>' +
            '      <div style="flex:1"></div>' +
            '      <div class="dpb-fnadd">' +
            '        <button class="dpb-btn dpb-btn--ghost" :class="{ \'dpb-fnadd--on\': fnMenu }" @click="fnMenu = !fnMenu; fnren = -1"><i class="fas fa-plus"></i>{{ t(\'dpb_fn_add\') }}</button>' +
            '        <div v-if="fnMenu" class="dpb-fnmenu">' +
            '          <div class="dpb-fnmenu__head">{{ t(\'dpb_fn_add\') }}</div>' +
            '          <button v-for="s in FN_STD" :key="s.key" class="dpb-fnitem" @click.stop="addStdFn(s)"><i :class="s.icon"></i>{{ s.label }}</button>' +
            '          <div class="dpb-fnmenu__sep"></div>' +
            '          <button class="dpb-fnitem dpb-fnitem--custom" @click.stop="addCustomFn"><i class="fas fa-bolt"></i>{{ t(\'dpb_fn_custom\') }}<span class="dpb-fnitem__hint">{{ t(\'dpb_fn_num\') }}</span></button>' +
            '        </div>' +
            '      </div>' +
            '      <button class="dpb-btn dpb-btn--ghost" @click="runWizard"><i class="fas fa-magic"></i>{{ t(\'dpb_wizard\') }}</button>' +
            '    </div>' +
            '    <div v-if="fnEmpty" class="dpb-codearea"><div class="dpb-fnstub" @click="fnMenu = true"><i class="fas fa-plus"></i>{{ t(\'dpb_fn_stub\') }}<span>{{ t(\'dpb_fn_stub_hint\') }}</span></div></div>' +
            '    <div v-else class="dpb-codearea"><code-editor v-model="codeText" /></div>' +
            '    <div class="dpb-codefoot">' +
            '      <span v-if="err" class="dpb-err"><i class="fas fa-exclamation-triangle"></i>{{ err }}</span>' +
            '      <span v-else class="dpb-ok"><i class="fas fa-check"></i>{{ t(\'dpb_code_ok\') }}</span>' +
            '      <div style="flex:1"></div>' +
            '      <span class="dpb-hint">{{ t(\'dpb_code_hint\') }}</span>' +
            '    </div>' +
            '  </div>' +

            /* ---------------- footer ---------------- */
            '  <div class="dpb-foot">' +
            '    <span class="dpb-err" v-if="nameError || typeError"><i class="fas fa-exclamation-triangle"></i>{{ nameError || typeError }}</span>' +
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
                SIZE_PRESETS: [[280, 170], [320, 200], [400, 300], [560, 320]],
                HANDLES: HANDLES
            };
        },

        computed: {
            model: function () { return this.modelValue; },
            CODES: function () {
                var has = function (k) {
                    return String((this.model.code || {})[k] || '').trim() !== '';
                }.bind(this);
                var list = [{ key: 'data', label: 'data()', icon: 'fas fa-database' }];
                if (has('dataPre')) list.push({ key: 'dataPre', label: 'data() (до return)', icon: 'fas fa-indent' });
                if (has('computed')) list.push({ key: 'computed', label: 'computed', icon: 'fas fa-calculator' });
                if (has('methods')) list.push({ key: 'methods', label: 'methods', icon: 'fas fa-cogs' });
                if (has('mounted')) list.push({ key: 'mounted', label: 'mounted()', icon: 'fas fa-power-off' });
                if (has('watch')) list.push({ key: 'watch', label: 'watch', icon: 'fas fa-eye' });
                if (has('beforeUnmount')) list.push({ key: 'beforeUnmount', label: 'beforeUnmount()', icon: 'fas fa-power-off' });
                var fs = (this.model.code || {}).funcs || [];
                for (var i = 0; i < fs.length; i++) {
                    list.push({ key: '@' + i, label: String(fs[i].name || ''), icon: 'fas fa-bolt', fn: true, idx: i });
                }
                return list;
            },
            funcs: function () { return (this.model.code || {}).funcs || []; },
            fnCur: function () {
                var c = this.code;
                if (typeof c !== 'string' || c.charAt(0) !== '@') return null;
                return this.funcs[parseInt(c.slice(1), 10)] || null;
            },
            /* an empty standard section shows the "add a function" stub instead of an editor */
            fnEmpty: function () {
                if (this.fnCur) return false;
                if (this.code === 'data' || this.code === 'dataPre') return false;
                return !String(this.model.code[this.code] || '').trim();
            },
            /* the code sections are shown from the first column, the indent of the
               file is put back when the text is saved */
            codeText: {
                get: function () {
                    var f = this.fnCur;
                    if (f) return f.text || '';
                    return B.dedentBlock(this.model.code[this.code]);
                },
                set: function (v) {
                    var f = this.fnCur;
                    if (f) { f.text = v; return; }
                    this.model.code[this.code] = B.reindentBlock(v, this.model.code[this.code]);
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
                var m = this.model || {}, c = m.code || {};
                if (String(m.title || '').trim() || String(m.description || '').trim()) return false;
                if ((((m.appearance || {}).items) || []).length) return false;
                if (String((m.appearance || {}).html || '').trim()) return false;
                var tabs = ((m.settings || {}).tabs) || [];
                for (var i = 0; i < tabs.length; i++) {
                    if ((((tabs[i] || {}).items) || []).length) return false;
                }
                var keys = ['dataPre', 'data', 'computed', 'methods', 'mounted', 'watch', 'beforeUnmount'];
                for (var j = 0; j < keys.length; j++) {
                    if (String(c[keys[j]] || '').trim()) return false;
                }
                return !((c.funcs) || []).length;
            },
            /* 'auto' follows the model: a widget with own HTML opens in code mode,
               a widget made of blocks opens in the visual mode */
            viewIsCode: function () {
                if (this.viewMode === 'code') return true;
                if (this.viewMode === 'visual') return false;
                return this.hasRawHtml;
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
            /* another widget is opened: the mode follows the new model again */
            modelValue: function () { this.viewMode = 'auto'; this.rawTpl = ''; this.rawErr = ''; this.fnMenu = false; this.fnren = -1; },
            model: { deep: true, handler: function () { this.validate(); } },
            'model.appearance.width': function () { this.clampItems(); },
            'model.appearance.height': function () { this.clampItems(); },
            'model.appearance.pad': function () { this.clampItems(); },
            'model.appearance.html': function () { this.queueRaw(); },
            'model.code.data': function () { this.check(); },
            'model.code.dataPre': function () { this.check(); },
            'model.code.computed': function () { this.check(); },
            'model.code.methods': function () { this.check(); },
            'model.code.mounted': function () { this.check(); },
            'model.code.watch': function () { this.check(); },
            'model.code.beforeUnmount': function () { this.check(); },
            'model.code.funcs': { deep: true, handler: function () { this.check(); } }
        },

        mounted: function () {
            /* a widget with own markup opens in the code mode, everything is checked once */
            if (this.hasRawHtml) this.checkRaw();
            /* a brand new widget starts in data(): it is the only section that is
               there from the start, methods() and the rest are still empty */
            if (this.isBlank && this.code === 'methods') this.code = 'data';
            /* the "add a function" menu closes on a click outside the builder */
            var self = this;
            this._fnDoc = function (e) {
                if (!self.fnMenu) return;
                var el = self.$el;
                if (el && el.contains(e.target)) return;
                self.fnMenu = false;
                self.fnren = -1;
            };
            document.addEventListener('click', this._fnDoc);
        },
        beforeUnmount: function () { if (this._fnDoc) document.removeEventListener('click', this._fnDoc); },

        methods: {
            t: function (s) { return window.__t ? window.__t(s) : s; },
            compOf: function (it) { return B.COMPONENTS[it._t] || { label: it._t, icon: 'fas fa-square' }; },
            setViewMode: function (m) {
                var a = this.model.appearance;
                if (m === 'code') {
                    if (this.viewIsCode && this.hasRawHtml) return;
                    if (!window.confirm(this.t('dpb_raw_warn_confirm'))) return;
                    /* seed the editor with the markup the visual mode would generate */
                    if (!this.hasRawHtml) a.html = B.templateOf ? B.templateOf(this.model) : '';
                    this.viewMode = 'code';
                    this.checkRaw();
                    return;
                }
                /* visual */
                if (!this.viewIsCode && !this.hasRawHtml) { this.viewMode = 'visual'; return; }
                if ((a.items || []).length) {
                    /* the canvas contradicts the markup: it wins, the markup goes away */
                    if (!window.confirm(this.t('dpb_raw_drop_confirm'))) return;
                    a.html = '';
                    /* the file is no longer restored as is: the model now owns the widget */
                    this.model.imported = false;
                }
                /* empty canvas: keep the markup, it still produces the same result */
                this.viewMode = 'visual';
                this.rawErr = '';
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
            optList: function (pd, key) {
            /* `types` is filled with the widgets the module has installed */
            var out = (pd.dyn === 'types' ? (this.builtTypes || []) : (pd.options || [])).slice();
            /* a value that is not in the list stays in the list: nothing is lost on save */
            var v = key ? this.cur[key] : '';
            if (v !== '' && v !== undefined && v !== null && out.indexOf(v) < 0) out.unshift(v);
            return out.length ? out : [''];
        },
        valLabel: valLabel,
        fType: function (tp) { return window.__t ? window.__t('dpb_ft_' + tp) : tp; },
            fIcon: function (tp) { return (B.FIELD_TYPES[tp] || {}).icon || 'fas fa-square'; },
            tabLabel: function (v) { return B.lbl ? B.lbl(v) : v; },
            /* the system section a field belongs to, or null for an ordinary field */
            sysOf: function (f) { return (B.systemFieldOf && f && f._sys) ? B.systemFieldOf(f) : null; },
            /* the tab belongs to a section of the core */
            isSysTab: function (tb) { return !!(B.systemTabOf && B.systemTabOf(tb)); },
                nodeStyle: function (it) {
                    var s = B.itemSize(it);
                    var p = B.clampPos(this.model.appearance, it.x, it.y, s.w, s.h);
                    return 'left:' + p.x + 'px;top:' + p.y + 'px;width:' + p.w + 'px;height:' + p.h + 'px';
                },
                setSize: function (w, h) {
                    this.model.appearance.width = w;
                    this.model.appearance.height = h;
                    this.clampItems();
                },
                clampItems: function () { B.clampAll(this.model.appearance); },
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
                if (ev.target && ev.target.closest && ev.target.closest('.dpb-node__ops, .dpb-node__hs')) return;
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
            renderItem: function (it) { return B.previewHtml(it, this.previewWidget); },

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
                /* the first block on an empty canvas contradicts the kept markup */
                if (this.hasRawHtml) {
                    if (!window.confirm(this.t('dpb_html_drop_confirm'))) return;
                    a.html = '';
                    /* the file is no longer restored as is: the model now owns the widget */
                    this.model.imported = false;
                    this.viewMode = 'visual';
                }
                if (at) {
                    var p = B.clampPos(a, at.x - it.w / 2, at.y - it.h / 2, it.w, it.h);
                    it.x = p.x; it.y = p.y; it.w = p.w; it.h = p.h;
                } else {
                    var free = B.autoPos(a, a.items || [], it.w, it.h);
                    it.x = free.x; it.y = free.y;
                }
                this.model.appearance.items.push(it);
                this.sel = it._i;
                if (t === 'widget' && !wtype) this.typeError = this.t('dpb_pick_widget');
                this.sub = 'view';
            },
            addWidgetItem: function (wt) { this.addItem('widget', wt); },
            delItem: function (i) {
                var it = this.model.appearance.items[i];
                this.model.appearance.items.splice(i, 1);
                if (this.sel === it._i) this.sel = '';
            },
            copyItem: function (i) {
                var src = this.model.appearance.items[i];
                var c = JSON.parse(JSON.stringify(src));
                c._i = B.uid('c');
                this.model.appearance.items.splice(i + 1, 0, c);
                this.sel = c._i;
            },
            moveItem: function (i, d) {
                var a = this.model.appearance.items;
                var j = i + d;
                if (j < 0 || j >= a.length) return;
                var t = a[i]; a[i] = a[j]; a[j] = t;
            },

            /* --- settings tabs --- */
            addTab: function () {
                var n = this.model.settings.tabs.length + 1;
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
                var f = this.fnCur;
                var r = f
                    ? B.checkSyntax(f.text || '', 'mounted')
                    : B.checkSyntax(this.model.code[this.code] || '', this.code);
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
            addCustomFn: function () {
                var c = this.model.code;
                if (!Array.isArray(c.funcs)) c.funcs = [];
                var names = {};
                ['data', 'dataPre', 'computed', 'methods', 'mounted', 'watch', 'beforeUnmount'].forEach(function (k) { names[k] = 1; });
                c.funcs.forEach(function (f) { names[f.name] = 1; });
                var n = 1;
                while (names['function' + n]) n++;
                c.funcs.push({ _i: B.uid('fn'), name: 'function' + n, text: '' });
                this.code = '@' + (c.funcs.length - 1);
                this.fnMenu = false;
                this.check();
            },
            delFn: function (i) {
                var fs = this.model.code.funcs || [];
                if (i < 0 || i >= fs.length) return;
                fs.splice(i, 1);
                if (String(this.code).charAt(0) === '@') this.code = 'data';
                this.fnren = -1;
                this.fnMenu = false;
                this.check();
            },
            renFn: function (i) {
                var f = this.funcs[i];
                if (!f) return;
                this.fnold = String(f.name || '');
                this.fnren = i;
                var self = this;
                setTimeout(function () {
                    var el = self.$el ? self.$el.querySelector('.dpb-fnren input') : null;
                    if (el) { el.focus(); el.select(); }
                }, 0);
            },
            commitFn: function (i) {
                var fs = this.model.code.funcs || [];
                var f = fs[i];
                if (f) {
                    var nm = String(f.name || '').trim();
                    var ok = /^[A-Za-z_$][\w$]*$/.test(nm) &&
                        ['data', 'dataPre', 'computed', 'methods', 'mounted', 'watch', 'beforeUnmount'].indexOf(nm) < 0 &&
                        !fs.some(function (x, j) { return j !== i && String(x.name) === nm; });
                    if (!ok) f.name = this.fnold || ('function' + (i + 1));
                }
                this.fnren = -1;
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
                fill('computed');
                fill('methods');
                fill('mounted');
                fill('beforeUnmount');
                this.check();
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
                if (this.nameError || this.typeError) return;
                this.$emit('action', 'download', { model: this.model, js: this.source() });
            },
            save: function () {
                this.validate();
                if (this.nameError || this.typeError) return;
                this.$emit('action', 'install', { model: this.model, js: this.source() });
            },
            reset: function () { this.$emit('reset'); }
        },

        created: function () { this.validate(); }
    };

    window.DpBuilderUI = DpBuilder;
})();
