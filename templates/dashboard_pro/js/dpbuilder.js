/* Dashboard Pro — widget builder engine
 * Catalog of components, model <-> Vue component compiler,
 * widget source generator, model parser and code wizard.
 */
(function () {
    'use strict';

    var BIND = /\{\{\s*widget\.([A-Za-z_$][\w$]*)\s*\}\}/g;

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function val(v, d) {
        return (v === undefined || v === null || v === '') ? (d === undefined ? '' : d) : v;
    }

    /* a size may be a plain number (pixels, as the editor shows it) or a value
       that already carries its unit: "1.49rem" copies the title of a ready made
       card and follows the font size of the page */
    function len(v, d) {
        var s = String(val(v, d) === undefined || val(v, d) === null ? '' : val(v, d)).trim();
        if (s === '') return '';
        return /^-?\d*\.?\d+$/.test(s) ? s + 'px' : s;
    }

    function st(o) {
        var out = [];
        for (var k in o) {
            if (!Object.prototype.hasOwnProperty.call(o, k)) continue;
            var v = o[k];
            if (v === '' || v === null || v === undefined) continue;
            out.push(k + ':' + String(v).replace(/[;"']/g, '\\$&'));
        }
        return out.join(';');
    }

    /* ---- bindings: a component may be linked to a settings-field key ---- */
    function bkey(e) {
        var k = String((e && e.bind) || '').trim();
        return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : '';
    }

    /* The value of an icon may be a Font Awesome name or the path to a picture,
       and the two cannot both go into a class: "fas fa-star" is a glyph, while
       "/img/icons/movie.png" in a class draws nothing at all. A name is a list
       of words and never carries a slash; a path always has one, or an image
       extension at the end. That is the whole difference between them.

       The same test is written into the code of a ready made widget, where the
       value is only known once the browser runs - the two must stay equal, or
       the editor and the widget would draw the icon differently. */
    function isPicValue(v) {
        var s = String(v == null ? '' : v).trim();
        if (!s) return false;
        if (s.indexOf('/') >= 0 || s.indexOf('\\') >= 0) return true;
        return /\.(png|jpe?g|gif|svg|webp|bmp|ico|avif)$/i.test(s);
    }

    /* A field of type "property" holds the NAME of a property, not its value: the
       name is written into "widget.<key>", and the value itself is read from the
       object and kept in values[<key>]. An icon bound to such a field shows that
       value - the name of a property is neither a glyph nor a path, so as a class
       it draws nothing. Returns the key when it names a property field, else ''. */
    function propertyKeyOf(m, key) {
        var k = String(key || '');
        if (!k || !m || !m.settings || !m.settings.tabs) return '';
        var hit = '';
        m.settings.tabs.forEach(function (tb) {
            (tb.items || []).forEach(function (f) {
                if (hit || !f || f._sys) return;
                if (String(f.key) === k && String(f.type) === 'property') hit = k;
            });
        });
        return hit;
    }

    /* the object and the property an icon component follows on its own. This is the
       pair the header of the module uses (iconNeeds below); an icon on the canvas is
       the same choice, only each component carries its own instead of sharing one.
       A component bound to a field has nothing to do here - the field decides. */
    function iconOwnPair(e) {
        if (!e || bkey(e)) return null;
        if (String(e.iconType || '') !== 'property') return null;
        if (!e.iconObject || !e.iconProperty) return null;
        return { obj: String(e.iconObject), prop: String(e.iconProperty) };
    }

    /* marks the icon components whose value has to be read from a property, so that
       the markup of a component - the one place that knows how an icon is drawn -
       does not have to know anything about the settings panel */
    function markIconProps(m) {
        var items = (m && m.appearance && m.appearance.items) || [];
        var n = 0;
        items.forEach(function (it) {
            if (!it || it._t !== 'icon') return;
            var p = propertyKeyOf(m, bkey(it));
            if (p) { it._prop = p; delete it._ico; return; }
            delete it._prop;
            /* the name the value is read under in the generated code. It goes onto
               the model rather than being counted where the markup is written, so the
               markup and the code agree without either of them knowing the other */
            if (iconOwnPair(it)) it._ico = 'dpbIco' + (++n);
            else delete it._ico;
        });
    }

    /* text position: {{ widget.key }} or the static prop value */
    function bv(e, key, def) {
        var k = bkey(e);
        if (k) return '{{ widget.' + k + ' }}';
        return esc(val(e[key], def));
    }

    /* value="" attribute position, the bound key is also marked for the generated code */
    function batt(e, def) {
        var k = bkey(e);
        if (k) return 'data-dpb-bind="' + esc(k) + '" :value="widget.' + k + '"';
        return 'value="' + esc(val(def, '')) + '"';
    }

    /* checked attribute position */
    function bchk(e) {
        var k = bkey(e);
        return k ? 'data-dpb-bind="' + esc(k) + '" :checked="!!widget.' + k + '"' : '';
    }

    /* selected attribute position (select / radio options) */
    function bsel(e, opt, isFirst) {
        var k = bkey(e);
        if (!k) return isFirst ? 'selected' : '';
        return 'data-dpb-bind="' + esc(k) + '" :selected="widget.' + k + ' === \'' + String(opt).replace(/'/g, "\\'") + '\'';
    }

    /* src attribute position, bound value wins over the static default */
    function bsrc(e, def) {
        var k = bkey(e);
        var d = String(def == null ? '' : def).replace(/'/g, "\\'");
        if (k) return ':src="widget.' + k + ' || \'' + d + '\'"';
        return 'src="' + esc(def || '') + '"';
    }

    /* ---- live values: a component may show the state of the widget itself ----
       The settings are stored in "widget", but a dimmer also has what it has just
       read from the object: the level, whether the light is on, the moment of the
       last action. Those live in the data of the component, so the binding needs
       an expression: "expr: 'isOn'" gives ':class="{ ... isOn }"'. The expression
       is plain text and lands in the generated code, so only a safe subset of
       javascript is let through — a name, a property chain, a call, arithmetic
       and comparisons, inside {{ }} or an attribute.

       An expression lands in the generated code, inside {{ }} or inside a
       double quoted attribute, so it must not be able to end the string it
       sits in or open anything of its own:
         - a double quote would close the attribute
         - a backslash would escape the next character
         - { } would open a block, and would close {{ }}
         - < would open a tag, and a backtick a template literal
         - ; would end the statement, // and /* would open a comment
       Everything else stays: a single quote, >, |, &, ? and the arithmetic
       are ordinary javascript and read well in a binding. */
    var EXPR_BAD = /[;{}\x3c"\x60\\]|\/\*|\/\//;

    function isIdent(s) { return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(s); }

    /* is the text a single name or a property chain: widget.level, this.level */
    function isPath(s) { return /^(this\.)?[A-Za-z_$][A-Za-z0-9_$]*(\.[A-Za-z_$][A-Za-z0-9_$]*)*$/.test(s); }

    /* a javascript expression safe to put in the generated code */
    function safeExpr(s) {
        var v = String(s == null ? '' : s).trim();
        if (!v || v.length > 120) return '';
        if (EXPR_BAD.test(v)) return '';
        /* only the characters a javascript expression may hold */
        if (!/^[A-Za-z0-9_$.,()[\]'"+\-*/%?:!<>=|&\s]+$/.test(v)) return '';
        if (v.indexOf('v-') >= 0 || v.indexOf('@') >= 0) return '';
        return v;
    }

    /* the name of a two way bound value: "expr" or "widget.key" -> the key */
    function modelKey(e) {
        var x = safeExpr(e.expr);
        if (isPath(x) && x.indexOf('.') < 0) return x;
        var k = bkey(e);
        return k || '';
    }

    /* text position from a live expression: {{ level }} */
    function bex(e, key, def) {
        var x = safeExpr(e.expr);
        if (x) return '{{ ' + x + ' }}';
        return bv(e, key, def);
    }

    /* :attr="expr" when there is an expression, the settings binding otherwise */
    function battr(e, attr, def) {
        var x = safeExpr(e.expr);
        if (x) return ':' + attr + '="' + x + '"';
        return batt(e, def);
    }

    /* v-if="expr" — the element exists only when the expression is true */
    function bvif(e) {
        var x = safeExpr(e.vif);
        return x ? ' v-if="' + x + '"' : '';
    }

    /* The field "icon_type" of the settings panel is not a value but a switch: it says
       where the icon comes from - a glyph, a path, or a property of an object. An icon
       bound to that field used to draw the name of the chosen variant ("property") as a
       class, so the card showed a square with nothing in it. What the switch selects is
       resolved here, and the computed dpbWidgetIcon of the generated widget resolves
       the same three cases from the settings of the running widget - keep the two
       equal, this one is what the canvas shows and that one is what the panel shows. */
    function iconFollowsWidget(e) {
        return bkey(e) === 'icon_type';
    }

    /* Панель объявляет переключатель иконки полем icon_type, а рядом с ним, в том
       же ряду, лежат сами значения: иконка, объект, свойство, путь. Видно их по
       ряду, а не по названию, поэтому поле можно переименовать и ряд всё равно
       будет опознан. Всё, что шаблон вправе спросить у такого виджета, берётся
       отсюда, а не из списка имён, который надо помнить. */
    function iconRowFields(m) {
        var tabs = (m && m.settings && m.settings.tabs) || [];
        var row = '';
        tabs.forEach(function (tb) {
            (tb.items || []).forEach(function (f) {
                if (!row && f && !f._sys && String(f.key) === 'icon_type') row = String(f.row || '');
            });
        });
        if (!row) return [];
        var out = [];
        tabs.forEach(function (tb) {
            (tb.items || []).forEach(function (f) {
                if (!f || f._sys || String(f.row || '') !== row) return;
                if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(String(f.key || ''))) return;
                out.push(f);
            });
        });
        return out;
    }

    function widgetIconValue(w, vals) {
        w = w || {};
        var t = String(w.icon_type || 'icon');
        if (t === 'url') return String(w.icon_url == null ? '' : w.icon_url).trim();
        if (t === 'property') {
            /* a field of type "property" keeps the NAME of the property; the value
               behind it is what the loader put into values[<name>] */
            var n = String(w.icon_property == null ? '' : w.icon_property).trim();
            var v = (n && vals) ? vals[n] : '';
            if (v === undefined || v === null || String(v).trim() === '') v = n;
            return String(v == null ? '' : v).trim();
        }
        return String(w.icon == null ? '' : w.icon).trim();
    }

    /* the names an expression leans on: "iconOn ? 0 : 48" gives ["iconOn"]. They
       have to exist in the generated data, or the widget fails to compile. */
    var EXPR_WORDS = {
        'this': 1, 'true': 1, 'false': 1, 'null': 1, 'undefined': 1,
        'Number': 1, 'String': 1, 'Boolean': 1, 'Math': 1, 'parseInt': 1, 'parseFloat': 1
    };

    function exprRoots(s) {
        var x = safeExpr(s);
        if (!x) return [];
        var re = /[A-Za-z_$][A-Za-z0-9_$]*/g, m, out = [], seen = {};
        /* the member behind a dot is read, not declared: widget.level, this.level */
        while ((m = re.exec(x)) !== null) {
            var w = m[0];
            if (EXPR_WORDS[w] || seen[w]) continue;
            if (x.charAt(m.index + w.length) === '.') continue;
            if (m.index > 0 && x.charAt(m.index - 1) === '.') continue;
            seen[w] = 1;
            out.push(w);
        }
        return out;
    }

    /* @click.stop="name" when a handler is named */
    function bact(e, key) {
        var m = String((e && e[key]) || '').trim();
        if (!isIdent(m)) return '';
        return ' @click.stop="' + m + '"';
    }

    /* "v-model" style two way binding of a live value */
    function bmodel(e, attr) {
        var m = modelKey(e);
        if (!m) return '';
        return ' v-model' + (attr || '') + '="' + m + '"';
    }

    /* the settings of a component: the extra keys every one of them may have */
    /* expr and vif belong to the property list of the components that take them.
       dx and dy are NOT here: the place of a component is one block of its own in the
       panel, right under the size, and every component may move - keeping them out of
       LIVE stops them from turning up a second time in the property list */
    var LIVE = {
        expr: { type: 'expr', label: 'dpb_expr' },
        vif: { type: 'expr', label: 'dpb_vif' }
    };

    function withLive(props) {
        var o = {}, k;
        for (k in props) if (Object.prototype.hasOwnProperty.call(props, k)) o[k] = props[k];
        for (k in LIVE) if (Object.prototype.hasOwnProperty.call(LIVE, k)) o[k] = LIVE[k];
        return o;
    }


    /* ------------------------------------------------------------------ */
    /* component catalog                                                    */
    /* ------------------------------------------------------------------ */

    var P = {
        text: { type: 'text', label: 'dpb_text' },
        /* the caption of a component and the name of its handler are not a "text" */
        label: { type: 'text', label: 'dpb_label' },
        action: { type: 'text', label: 'dpb_action' },
        bind: { type: 'setting', label: 'dpb_bind' },
        icon: { type: 'icon', label: 'dpb_icon' },
        color: { type: 'color', label: 'dpb_color' },
        number: { type: 'number', label: 'dpb_number' },
        select: { type: 'select', label: 'dpb_select', options: [] },
        bool: { type: 'bool', label: 'dpb_flag' },
        align: { type: 'select', label: 'dpb_align', options: ['left', 'center', 'right'] }
    };

    /* a switch always shows its own name, not the generic "flag" */
    function pb(label) { return { type: 'bool', label: label }; }

    /* a dropdown with the values the renderer knows; def is the value a field
       gets when the model says nothing about it */
    function ps(label, options, def) {
        var p = { type: 'select', label: label, options: options };
        if (def !== undefined) p.def = def;
        return p;
    }

    /* a list of values, one per line */
    function plist(label) { return { type: 'textarea', label: label }; }

    /* a number with its own name: "size" of a font is not the "size" of an icon */
    function pn(label) { return { type: 'number', label: label }; }

    /* the fonts the panel offers in its common settings. The same list lives in
       app.js; it is repeated here on purpose: the generated widget has to carry
       the font itself, and it is written into a file that is read long after the
       builder is gone.

       The names carry no quotes on purpose. A style goes into a double quoted
       HTML attribute, and a quoted family would close it - st() escapes the
       quotes, the browser would read a backslash and the font would be lost with
       the markup around it. An unquoted family name is valid CSS even when it is
       made of two words: `Helvetica Neue`, `Open Sans`. */
    var FONT_STACKS = {
        Roboto: 'Roboto, Arial, sans-serif',
        Ubuntu: 'Ubuntu, Arial, sans-serif',
        Arial: 'Arial, Arimo, sans-serif',
        Helvetica: 'Helvetica Neue, Open Sans, Arial, sans-serif',
        Tahoma: 'Tahoma, Arial, sans-serif',
        Verdana: 'Verdana, Arial, sans-serif'
    };

    /* a field that only matters in some of the modes: the menu next to it says
       where the value is taken from, and when it is not taken from the component
       its own field is not shown at all */
    function pwhen(p, key, show) { p.when = { key: key, show: show }; return p; }

    /* a field that is not obvious: where the value comes from and what happens
       when it is left alone */
    function withHint(p, hint) { p.hint = hint; return p; }

    /* the size of a font is either the one of the panel or the number of the
       component. The panel ones are CSS variables, so a widget follows the
       settings of the panel without being rebuilt, and nothing is written into
       the model for them */
    function fontSize(e) {
        var m = String(val(e.sizeMode, '')).trim();
        if (m === 'title') return 'var(--widget-title-size, 1.49rem)';
        if (m === 'sub') return 'var(--widget-subtitle-size, 1rem)';
        return len(e.size, 14);
    }

    /* the font of the panel is left to the cascade: with nothing in the style the
       component keeps the family that the panel sets for the whole page, so both
       "common" and an empty field have to end up as an empty style */
    function fontCss(e) {
        var f = String(val(e.font, '')).trim();
        if (!f || f === 'common') return '';
        return FONT_STACKS[f] || (f + ', sans-serif');
    }

    var C = {};

    function def(t, cat, label, icon, w, h, props, html, extra) {
        var o = { t: t, cat: cat, label: label, icon: icon, w: w, h: h, props: props, html: html };
        if (extra) for (var k in extra) o[k] = extra[k];
        C[t] = o;
        return o;
    }

    /* Which sides of a component may follow the size of the widget: "x" width,
       "y" height, "xy" both, nothing means it keeps its own size on both sides.
       A line of text or a slider has a height of its own and would look broken
       stretched sideways, so they take the width only. A switch, an icon, a dial
       and a spinner have a fixed shape - they are not stretched at all. */
    var STRETCH = {
        text: 'x', button: 'x', icon: '', divider: 'x', spacer: 'xy',
        card: 'xy', row: 'xy',
        input: 'x', textarea: 'xy', number: 'x', checkbox: 'x', switch: '',
        slider: 'x', color: 'x', datetime: 'x',
        select: 'x', radio: 'xy', tabs: 'x', segment: 'x',
        progress: 'x', gauge: '', badge: 'x', list: 'xy', table: 'xy',
        chart: 'xy', image: 'xy', video: 'xy', iframe: 'xy', map: 'xy',
        spinner: '', html: 'xy', widget: 'xy'
    };

    function canStretch(t, axis) {
        return String(STRETCH[t] || '').indexOf(axis) >= 0;
    }

    /* --- basic --- */
    def('text', 'basic', 'dpb_c_text', 'fas fa-font', 160, 24, withLive({
            text: P.text, bind: P.bind,
            sizeMode: withHint(ps('dpb_font_size', ['title', 'sub', 'own'], 'own'), 'dpb_font_size_hint'),
            size: pwhen(pn('dpb_font_size_own'), 'sizeMode', ['', 'own']),
            font: withHint(ps('dpb_font_family', ['common'].concat(Object.keys(FONT_STACKS)), 'common'), 'dpb_font_family_hint'),
            color: P.color, align: P.align, bold: pb('dpb_bold'), italic: pb('dpb_italic')
        }),
        function (e) {
            var fam = fontCss(e);
            return '<span' + bvif(e) + ' style="' + st({
                'font-size': fontSize(e),
                'font-family': fam,
                'color': e.color || 'inherit',
                'font-weight': e.bold ? '600' : '400',
                'font-style': e.italic ? 'italic' : 'normal',
                'text-align': e.align || 'left'
            }) + '">' + bex(e, 'text', e.text || 'Text') + '</span>';
        });

    def('button', 'basic', 'dpb_c_button', 'fas fa-hand-pointer', 160, 36, { text: P.text, icon: P.icon, bind: P.bind, variant: ps('dpb_variant', ['solid', 'outline']), color: P.color, size: pn('dpb_btn_size'), action: P.text },
        function (e) {
            var v = e.variant || 'solid', c = e.color || '#1976d2';
            var bg = v === 'solid' ? c : 'transparent';
            var fg = v === 'solid' ? '#fff' : c;
            var bs = v === 'outline' ? 'border:1px solid ' + c + ';' : '';
            var pad = (val(e.size, 14) || 14) <= 12 ? '4px 10px' : '8px 18px';
            return '<button type="button" data-dpb-action="' + esc(e.action || '') + '" style="' + st({
                'background': bg, 'color': fg, 'padding': pad, 'border-radius': '6px',
                'border': v === 'outline' ? 'none' : 'none', 'font-size': (val(e.size, 14) || 14) + 'px',
                'cursor': 'pointer', 'display': 'inline-flex', 'align-items': 'center', 'gap': '6px'
            }) + bs + '">' + (e.icon ? '<i class="' + esc(e.icon) + '"></i>' : '') + '<span>' + bv(e, 'text', e.text || 'Button') + '</span></button>';
        });

    /* the icon of a card: the glyph may come from the settings or from a live
       value, and a computed property may add classes to it — the highlight of a
       switched on icon works the way it does in the ready made widgets */
    def('icon', 'basic', 'dpb_c_icon', 'fas fa-star', 40, 40, withLive({
            /* the same set the header of the module offers: a glyph, a path, or the
               value of a property of an object. While the icon is bound to a field the
               field says what to draw, so the choice of its own is put away */
            iconType: {
                type: 'select', label: 'field_icon_type',
                options: [
                    { value: 'icon', label: 'opt_icon' },
                    { value: 'property', label: 'opt_property' },
                    { value: 'url', label: 'opt_url' }
                ],
                when: { key: 'bind', show: [''] }
            },
            icon: { type: 'icon', label: 'field_icon', when: { key: 'iconType', show: ['icon', ''] } },
            iconUrl: { type: 'text', label: 'field_icon_url', when: { key: 'iconType', show: ['url'] } },
            iconObject: { type: 'text', label: 'field_icon_object', when: { key: 'iconType', show: ['property'] } },
            iconProperty: { type: 'text', label: 'field_icon_property', when: { key: 'iconType', show: ['property'] } },
            size: withHint(pn('dpb_icon_size'), 'dpb_icon_size_hint'),
            color: P.color,
            cls: { type: 'text', label: 'dpb_icon_cls' },
            hl: { type: 'text', label: 'dpb_icon_hl' }
        }),
        function (e, isPreview, widget) {
            var k = bkey(e);
            var x = safeExpr(e.expr);
            /* the same three choices the header of the module offers. A path the user
               typed is written into the file as it is, a glyph stays a class - which
               one it is, isPixValue() decides, the same as everywhere else here */
            var own = String(e.iconType || '');
            /* bound to the switch of the settings panel: what to draw is decided by
               the choice made there, not by the name of the choice */
            var follow = iconFollowsWidget(e);
            var raw = own === 'url'
                ? String(e.iconUrl || '')
                : String(e.icon || 'fas fa-star');
            if (follow) raw = '';
            var staticGlyph = esc(raw);
            var extra = esc(String(e.cls || '').replace(/\s+/g, ' ').trim());
            var hl = safeExpr(e.hl);
            /* a field of type "property" keeps the name of a property; the icon wants
               the value behind it, which the loader has put into values[<key>] */
            var pk = String(e._prop || '');
            /* the icon follows a property of an object of its own: the loader put the
               value into values[<property>] and this component reads it under the
               name markIconProps gave it. The pair is the one the header of the module
               uses, only every component carries its own */
            var ico = String(e._ico || '');
            /* the value comes either from the settings of the widget, from here, or
               from a property of an object the icon follows on its own */
            var dyn = !!(k || x || ico || follow);
            var expr = follow ? 'dpbWidgetIcon'
                : (pk ? 'dpbPic(' + jsStr(pk) + ')'
                    : (k ? 'widget.' + k : (x || ico || '')));
            var box = itemSize(e._t ? e : { w: e.w, h: e.h, _t: 'icon' });
            var vh = bvif(e);
            /* A guard on the glyph ("v-if=widget.icon") is exactly backwards here: the
               glyph is the value of one of the three modes, so in "property" and "url"
               it is empty and the icon would vanish. What decides is the resolved
               value, so the guard is put on that. A vif of the user's own is kept. */
            if (follow && /\bwidget\.icon\b/.test(vh)) vh = ' v-if="dpbWidgetIcon"';
            /* a picture has no glyph to scale, so it is given the box of the
               component and is fitted into it - the same the ready made widgets
               do with their own picture */
            var picStyle = st({
                'display': 'inline-flex',
                'align-items': 'center',
                'justify-content': 'center',
                'width': box.w + 'px',
                'height': box.h + 'px',
                'object-fit': 'contain',
                'padding': '0'
            });
            /* a highlight paints the background of the glyph box. A bare inline box is
               the line of the font, and the empty room under the baseline makes the
               background hang below the icon, so a highlighted glyph gets a box of its
               own - the size of the component, the same one a ready made widget uses.
               The type is named here: without it the size would fall back to a generic
               box and the background would cover half the card. */
            var iStyle = st({
                'display': hl ? 'inline-flex' : '',
                'align-items': hl ? 'center' : '',
                'justify-content': hl ? 'center' : '',
                'width': hl ? box.w + 'px' : '',
                'height': hl ? box.h + 'px' : '',
                /* an icon with no size of its own takes the size the panel
                   gives to the icons of its widgets. The variable keeps
                   following the common settings, so the icon stays the same
                   size as the ones of a ready made widget. */
                'font-size': String(val(e.size, '')).trim() ? len(e.size, 20) : 'var(--widget-icon-size, 23px)',
                /* a class of the theme may bring its own colour, so the inline one
                   is only written when the field was filled */
                'color': e.color || '',
                /* a highlight class of the theme may carry padding, and a glyph is an
                   inline box: the padding would grow it and it would jump every time
                   the highlight comes and goes. The inline padding wins over the class. */
                'padding': hl ? '0' : ''
            });

            /* the canvas already holds the values of the settings, so the tag is
               chosen here and the browser is given the finished markup. An empty
               value counts too: an icon on a property whose value has not arrived
               yet is drawn empty, not shown with the Vue attributes written out. */
            if (isPreview && dyn && (k || ico || follow) && widget) {
                var pv = follow ? widgetIconValue(widget, widget.dpb_icon_vals) : widget[k || ico];
                if (pv != null && String(pv).trim() !== '') {
                    return isPicValue(pv)
                        ? '<img class="' + extra + '" src="' + esc(pv) + '" style="' + picStyle + '"' + vh + '>'
                        : '<i class="' + (extra ? extra + ' ' : '') + esc(String(pv).trim()) + '" style="' + iStyle + '"' + vh + '></i>';
                }
                return '<i class="' + extra + '" style="' + iStyle + '"' + vh + '></i>';
            }

            if (!dyn && isPicValue(raw)) {
                return '<img class="' + extra + '" src="' + staticGlyph + '" style="' + picStyle + '"' + vh + '>';
            }

            if (dyn) {
                /* the value is a name and a picture at the same time - which one it
                   is only the browser knows, so both tags are written and dpbIsPic
                   picks the one to show */
                var iCls = hl ? '[' + expr + ', ' + hl + ']' : expr;                var pair = '<img v-if="dpbIsPic(' + expr + ')" class="' + extra + '" :src="' + expr + '" style="' + picStyle + '">' +
                    '<i v-else class="' + extra + '" :class="' + esc(iCls) + '" style="' + iStyle + '"></i>';
                /* vif brings a v-if of its own, and an element may only carry one:
                   both tags go under one template instead of repeating the attribute */
                return vh ? '<template' + vh + '>' + pair + '</template>' : pair;
            }

            return '<i class="' + (extra ? extra + ' ' : '') + staticGlyph + '" style="' + iStyle + '"' + vh + '></i>';
        });

    def('divider', 'basic', 'dpb_c_divider', 'fas fa-minus', 200, 8, { color: P.color, style: ps('dpb_style', ['solid', 'dashed', 'dot']) },
        function (e) {
            var s = e.style || 'solid';
            if (s === 'dashed') return '<div style="border-top:1px dashed ' + (e.color || 'rgba(255,255,255,.25)') + '"></div>';
            if (s === 'dot') return '<div style="height:1px;background:none"></div>';
            return '<div style="border-top:1px solid ' + (e.color || 'rgba(255,255,255,.25)') + '"></div>';
        });

    def('spacer', 'basic', 'dpb_c_spacer', 'fas fa-arrows-up-down', 40, 16, { grow: pn('dpb_grow') },
        function (e) {
            return '<div style="flex:' + (val(e.grow, 1) || 1) + ' 1 auto;min-height:2px"></div>';
        });

    def('card', 'basic', 'dpb_c_card', 'fas fa-square', 240, 80, { bg: P.color, radius: pn('dpb_radius'), pad: pn('dpb_pad'), border: P.color },
        function (e) {
            return '<div style="' + st({
                'background': e.bg || 'rgba(255,255,255,.05)',
                'border-radius': val(e.radius, 8) + 'px',
                'padding': val(e.pad, 10) + 'px',
                'border': e.border ? '1px solid ' + e.border : '',
                'width': '100%', 'height': '100%', 'box-sizing': 'border-box', 'overflow': 'hidden'
            }) + '"></div>';
        });

    def('row', 'basic', 'dpb_c_row', 'fas fa-align-justify', 260, 40, { gap: pn('dpb_gap'), align: ps('dpb_align', ['stretch', 'center', 'flex-start', 'flex-end']), justify: ps('dpb_justify', ['flex-start', 'center', 'space-between', 'space-around', 'flex-end']) },
        function (e) {
            return '<div style="' + st({
                'display': 'flex', 'width': '100%', 'height': '100%', 'box-sizing': 'border-box',
                'gap': (val(e.gap, 8) || 8) + 'px',
                'align-items': e.align || 'center',
                'justify-content': e.justify || 'flex-start'
            }) + '"></div>';
        });

    /* --- input --- */
    def('input', 'input', 'dpb_c_input', 'fas fa-keyboard', 200, 34, { label: P.text, bind: P.bind, placeholder: P.text, ph: pn('dpb_font_size'), password: pb('dpb_password') },
        function (e) {
            return '<label style="display:flex;flex-direction:column;gap:4px;width:100%">' +
                (e.label ? '<span style="font-size:.78rem;opacity:.7">' + esc(e.label) + '</span>' : '') +
                '<input type="' + (e.password ? 'password' : 'text') + '" placeholder="' + esc(e.placeholder || '') + '" ' + batt(e, '') + ' style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.18);border-radius:6px;color:inherit;padding:6px 10px;font-size:' + (val(e.ph, 13) || 13) + 'px;width:100%;box-sizing:border-box"></label>';
        });

    def('textarea', 'input', 'dpb_c_textarea', 'fas fa-align-left', 240, 80, { label: P.text, bind: P.bind, placeholder: P.text, rows: pn('dpb_rows') },
        function (e) {
            return '<label style="display:flex;flex-direction:column;gap:4px;width:100%">' +
                (e.label ? '<span style="font-size:.78rem;opacity:.7">' + esc(e.label) + '</span>' : '') +
                '<textarea rows="' + (val(e.rows, 3) || 3) + '" placeholder="' + esc(e.placeholder || '') + '" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.18);border-radius:6px;color:inherit;padding:6px 10px;font-size:13px;width:100%;box-sizing:border-box;resize:vertical">' + bv(e, 'value', '') + '</textarea></label>';
        });

    def('number', 'input', 'dpb_c_number', 'fas fa-sort-numeric-up', 140, 34, { label: P.text, bind: P.bind, min: pn('dpb_min'), max: pn('dpb_max'), step: pn('dpb_step'), suffix: P.text },
        function (e) {
            return '<label style="display:flex;flex-direction:column;gap:4px;width:100%">' +
                (e.label ? '<span style="font-size:.78rem;opacity:.7">' + esc(e.label) + '</span>' : '') +
                '<input type="number" min="' + val(e.min, '') + '" max="' + val(e.max, '') + '" step="' + val(e.step, 'any') + '" ' + batt(e, '') + ' style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.18);border-radius:6px;color:inherit;padding:6px 10px;font-size:13px;width:100%;box-sizing:border-box"></label>';
        });

    def('checkbox', 'input', 'dpb_c_checkbox', 'fas fa-check-square', 170, 24, { label: P.text, bind: P.bind },
        function (e) {
            return '<label style="display:inline-flex;align-items:center;gap:8px;cursor:pointer">' +
                '<input type="checkbox" ' + bchk(e) + ' style="width:16px;height:16px;accent-color:#1976d2">' +
                '<span style="font-size:.85rem">' + bv(e, 'label', e.label || '') + '</span></label>';
        });

    /* the switch of a card: "skin: v" gives the markup of the theme
       (v-input--switch), the position of the thumb follows the state itself */
    def('switch', 'input', 'dpb_c_switch', 'fas fa-toggle-on', 140, 26, withLive({ label: P.label, bind: P.bind, on: pb('dpb_on'), skin: ps('dpb_skin', ['builder', 'v']), action: P.action }),
        function (e) {
            var act = bact(e, 'action');
            if (String(e.skin || '') === 'v') {
                var x = safeExpr(e.expr);
                return '<div class="v-input--switch" :class="{ \'input--is-checked\': ' + (x || 'false') + ' }"' + act + bvif(e) + '>' +
                    '<div class="v-input--switch__track"><div class="v-input--switch__thumb"></div></div></div>';
            }
            var on = e.on !== false;
            return '<label style="display:inline-flex;align-items:center;gap:8px;cursor:pointer">' +
                '<span style="width:38px;height:20px;border-radius:10px;position:relative;display:inline-block;background:' + (on ? '#1976d2' : 'rgba(255,255,255,.22)') + '">' +
                '<span style="position:absolute;top:2px;left:' + (on ? '20px' : '2px') + ';width:16px;height:16px;border-radius:50%;background:#fff;transition:left .15s"></span></span>' +
                '<span style="font-size:.85rem">' + bex(e, 'label', e.label || '') + '</span></label>';
        });

    /* the slider of a card: "skin: v" gives v-slider with its own track, fill and
       thumb; min / max / step / the value itself may come from live data */
    def('slider', 'input', 'dpb_c_slider', 'fas fa-sliders', 200, 34, withLive({
        label: P.text, bind: P.bind, min: pn('dpb_min'), max: pn('dpb_max'), step: pn('dpb_step'),
        unit: P.text, skin: ps('dpb_skin', ['builder', 'v']), action: P.action,
        lomin: { type: 'expr', label: 'dpb_min_expr' },
        himax: { type: 'expr', label: 'dpb_max_expr' },
        stepexpr: { type: 'expr', label: 'dpb_step_expr' },
        fill: { type: 'expr', label: 'dpb_fill_expr' },
        disabled: { type: 'expr', label: 'dpb_disabled_expr' }
    }),
        function (e) {
            var x = safeExpr(e.expr);
            var lo = safeExpr(e.lomin), hi = safeExpr(e.himax), stp = safeExpr(e.stepexpr);
            /* a plain number stays a plain attribute: only a name of the component data
               (or a path) becomes a live one. "lomin" and the rest take any expression */
            var named = function (v) {
                var s = String(v == null ? '' : v).trim();
                return (isIdent(s) || isPath(s)) ? safeExpr(s) : '';
            };
            var mlo = lo || named(e.min);
            var mhi = hi || named(e.max);
            var mst = stp || named(e.step);
            if (String(e.skin || '') === 'v') {
                var ml = bmodel(e, '.number');
                var dis = safeExpr(e.disabled) ? ' :disabled="' + safeExpr(e.disabled) + '"' : '';
                var fill = safeExpr(e.fill) || '0';
                var chg = isIdent(e.action || '') ? ' @change="' + e.action + '"' : '';
                return '<div class="v-slider theme--dark" style="width:100%"' + bvif(e) + '>' +
                    '<input type="range" class="v-slider__input"' + (ml || battr(e, 'value', val(e.min, 0))) +
                    (mlo ? ' :min="' + mlo + '"' : ' min="' + esc(val(e.min, 0)) + '"') +
                    (mhi ? ' :max="' + mhi + '"' : ' max="' + esc(val(e.max, 100)) + '"') +
                    (mst ? ' :step="' + mst + '"' : ' step="' + esc(val(e.step, 'any')) + '"') + chg + dis + '>' +
                    '<div class="v-slider__track"><div class="v-slider__track-fill" :style="{width: ' + fill + ' + \'%\'}"></div></div>' +
                    '<div class="v-slider__thumb-container" :style="{left: ' + fill + ' + \'%\'}"><div class="v-slider__thumb"></div></div>' +
                    '</div>';
            }
            var mn = val(e.min, 0), mx = val(e.max, 100);
            return '<label style="display:flex;flex-direction:column;gap:6px;width:100%">' +
                (e.label ? '<span style="font-size:.78rem;opacity:.7">' + esc(e.label) + '</span>' : '') +
                '<span style="display:flex;align-items:center;gap:8px"><input type="range" min="' + mn + '" max="' + mx + '" step="' + val(e.step, 'any') + '" ' + battr(e, 'value', mn) + ' style="flex:1;accent-color:#1976d2"><b style="font-size:.8rem;min-width:34px;text-align:right">' + bex(e, 'value', '') + (e.unit ? esc(e.unit) : '') + '</b></span></label>';
        });

    def('color', 'input', 'dpb_c_colorpick', 'fas fa-palette', 120, 34, { label: P.text, bind: P.bind, def: P.color },
        function (e) {
            var k = bkey(e);
            var shown = k ? '{{ widget.' + k + ' }}' : esc(e.def || '#1976d2');
            return '<label style="display:flex;flex-direction:column;gap:4px;width:100%">' +
                (e.label ? '<span style="font-size:.78rem;opacity:.7">' + esc(e.label) + '</span>' : '') +
                '<span style="display:flex;align-items:center;gap:8px"><input type="color" ' + batt(e, e.def || '#1976d2') + ' style="width:34px;height:26px;border:none;background:none;padding:0"><span style="font-size:.8rem;opacity:.8">' + shown + '</span></span></label>';
        });

    def('datetime', 'input', 'dpb_c_datetime', 'fas fa-calendar', 200, 34, { label: P.text, bind: P.bind, kind: ps('dpb_kind', ['datetime-local', 'date', 'time', 'month', 'week']) },
        function (e) {
            var k = e.kind || 'datetime-local';
            return '<label style="display:flex;flex-direction:column;gap:4px;width:100%">' +
                (e.label ? '<span style="font-size:.78rem;opacity:.7">' + esc(e.label) + '</span>' : '') +
                '<input type="' + k + '" ' + batt(e, '') + ' style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.18);border-radius:6px;color:inherit;padding:6px 10px;font-size:13px;width:100%;box-sizing:border-box"></label>';
        });

    /* --- select --- */
    def('select', 'select', 'dpb_c_select', 'fas fa-caret-down', 200, 34, { label: P.text, bind: P.bind, options: plist('dpb_options'), ph: P.text },
        function (e) {
            var opts = String(e.options || 'One\nTwo\nThree').split('\n').filter(function (s) { return s.trim() !== ''; });
            var body = opts.map(function (o, i) { return '<option ' + bsel(e, o, i === 0) + '>' + esc(o) + '</option>'; }).join('');
            return '<label style="display:flex;flex-direction:column;gap:4px;width:100%">' +
                (e.label ? '<span style="font-size:.78rem;opacity:.7">' + esc(e.label) + '</span>' : '') +
                '<select ' + batt(e, '') + ' style="background:#2b2b2b;border:1px solid rgba(255,255,255,.18);border-radius:6px;color:inherit;padding:6px 10px;font-size:13px;width:100%;box-sizing:border-box">' + body + '</select></label>';
        });

    def('radio', 'select', 'dpb_c_radio', 'fas fa-dot-circle', 200, 80, { label: P.text, bind: P.bind, options: plist('dpb_options'), dir: ps('dpb_dir', ['horizontal', 'vertical']) },
        function (e) {
            var opts = String(e.options || 'One\nTwo').split('\n').filter(function (s) { return s.trim() !== ''; });
            var dir = e.dir === 'vertical' ? 'column' : 'row';
            var body = opts.map(function (o, i) {
                return '<label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer">' +
                    '<input type="radio" ' + bsel(e, o, i === 0) + ' style="accent-color:#1976d2">' +
                    '<span style="font-size:.85rem">' + esc(o) + '</span></label>';
            }).join('');
            return '<div style="display:flex;flex-direction:column;gap:4px">' +
                (e.label ? '<span style="font-size:.78rem;opacity:.7">' + esc(e.label) + '</span>' : '') +
                '<div style="display:flex;flex-direction:' + dir + ';gap:12px;flex-wrap:wrap">' + body + '</div></div>';
        });

    def('tabs', 'select', 'dpb_c_tabs', 'fas fa-layer-group', 260, 34, { bind: P.bind, items: plist('dpb_items') },
        function (e) {
            var items = String(e.items || 'One\nTwo\nThree').split('\n').filter(function (s) { return s.trim() !== ''; });
            var body = items.map(function (o, i) {
                return '<span style="padding:5px 14px;border-radius:6px;font-size:.82rem;cursor:pointer;background:' + (i === 0 ? 'rgba(255,255,255,.16)' : 'transparent') + '">' + esc(o) + '</span>';
            }).join('');
            return '<div style="display:flex;gap:4px;background:rgba(255,255,255,.05);padding:3px;border-radius:8px;width:100%;box-sizing:border-box">' + body + '</div>';
        });

    def('segment', 'select', 'dpb_c_segment', 'fas fa-grip', 220, 32, { bind: P.bind, options: plist('dpb_options') },
        function (e) {
            var opts = String(e.options || 'One\nTwo\nThree').split('\n').filter(function (s) { return s.trim() !== ''; });
            var body = opts.map(function (o, i) {
                return '<span style="flex:1;text-align:center;padding:5px 0;border-radius:6px;font-size:.8rem;background:' + (i === 0 ? '#1976d2' : 'transparent') + '">' + esc(o) + '</span>';
            }).join('');
            return '<div style="display:flex;gap:2px;background:rgba(255,255,255,.05);padding:3px;border-radius:8px;width:100%;box-sizing:border-box">' + body + '</div>';
        });

    /* --- display --- */
    def('progress', 'display', 'dpb_c_progress', 'fas fa-tasks', 220, 22, { bind: P.bind, color: P.color, height: pn('dpb_height'), label: pb('dpb_show_label') },
        function (e) {
            var k = bkey(e);
            var bar = k
                ? ':style="{ width: Math.max(0, Math.min(100, Number(widget.' + k + ') || 0)) + \'%\' }"'
                : 'style="width:60%"';
            return '<div style="width:100%;display:flex;align-items:center;gap:8px">' +
                (e.label !== false ? '<span style="font-size:.78rem;min-width:38px">' + bv(e, 'value', '60%') + '</span>' : '') +
                '<div style="flex:1;height:' + (val(e.height, 8) || 8) + 'px;background:rgba(255,255,255,.12);border-radius:99px;overflow:hidden">' +
                '<div ' + bar + ' style="height:100%;background:' + (e.color || '#1976d2') + ';transition:width .2s"></div></div></div>';
        });

    def('gauge', 'display', 'dpb_c_gauge', 'fas fa-tachometer-alt', 180, 120, { bind: P.bind, min: pn('dpb_min'), max: pn('dpb_max'), unit: P.text, color: P.color },
        function (e) {
            return '<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px">' +
                '<div style="width:84px;height:84px;border-radius:50%;border:9px solid rgba(255,255,255,.12);border-top-color:' + (e.color || '#1976d2') + ';border-right-color:' + (e.color || '#1976d2') + ';display:flex;align-items:center;justify-content:center;box-sizing:border-box">' +
                '<b style="font-size:1.1rem">' + bv(e, 'value', '—') + esc(e.unit || '') + '</b></div></div>';
        });

    def('badge', 'display', 'dpb_c_badge', 'fas fa-tag', 90, 22, { bind: P.bind, text: P.text, color: P.color },
        function (e) {
            return '<span style="display:inline-flex;align-items:center;padding:2px 10px;border-radius:99px;font-size:.75rem;background:' + (e.color || 'rgba(25,118,210,.25)') + ';color:' + (e.color || '#64b5f6') + ';border:1px solid ' + (e.color || '#1976d2') + '">' + bv(e, 'text', e.text || 'badge') + '</span>';
        });

    def('list', 'display', 'dpb_c_list', 'fas fa-list', 240, 100, { bind: P.bind, items: pn('dpb_count'), bullet: pb('dpb_bullet') },
        function (e) {
            var k = bkey(e);
            var dot = e.bullet === false ? '' : '<span style="width:5px;height:5px;border-radius:50%;background:currentColor;opacity:.6"></span>';
            if (k) {
                return '<div style="width:100%"><div style="display:flex;align-items:center;gap:8px;padding:3px 0">' + dot +
                    '<span style="font-size:.84rem;opacity:.85">{{ widget.' + k + ' }}</span></div></div>';
            }
            var n = Math.max(1, Math.min(12, val(e.items, 4) || 4));
            var rows = '';
            for (var i = 0; i < n; i++) {
                rows += '<div style="display:flex;align-items:center;gap:8px;padding:3px 0">' + dot +
                    '<span style="font-size:.84rem;opacity:.85">—</span></div>';
            }
            return '<div style="width:100%">' + rows + '</div>';
        });

    def('table', 'display', 'dpb_c_table', 'fas fa-table', 280, 120, { bind: P.bind, cols: plist('dpb_cols'), rows: pn('dpb_rows'), striped: pb('dpb_striped') },
        function (e) {
            var cols = String(e.cols || 'A\nB\nC').split('\n').filter(function (s) { return s.trim() !== ''; });
            var n = Math.max(1, Math.min(20, val(e.rows, 3) || 3));
            var head = '<tr>' + cols.map(function (c) { return '<th style="text-align:left;padding:4px 8px;font-size:.76rem;opacity:.6;border-bottom:1px solid rgba(255,255,255,.12)">' + esc(c) + '</th>'; }).join('') + '</tr>';
            var k = bkey(e);
            var body = '';
            if (k) {
                body = '<tr><td colspan="' + cols.length + '" style="padding:4px 8px;font-size:.8rem">{{ widget.' + k + ' }}</td></tr>';
            } else {
                for (var i = 0; i < n; i++) {
                    var bg = (e.striped && i % 2) ? 'background:rgba(255,255,255,.03);' : '';
                    body += '<tr style="' + bg + '">' + cols.map(function () { return '<td style="padding:4px 8px;font-size:.8rem">—</td>'; }).join('') + '</tr>';
                }
            }
            return '<div style="width:100%;height:100%;overflow:auto"><table style="width:100%;border-collapse:collapse">' + head + body + '</table></div>';
        });

    def('chart', 'display', 'dpb_c_chart', 'fas fa-chart-line', 280, 140, { bind: P.bind, color: P.color, kind: ps('dpb_kind', ['line', 'bar']), fill: pb('dpb_fill') },
        function (e) {
            var c = e.color || '#4fc3f7';
            var h = e.kind === 'bar' ? 'M6 90 L50 60 L94 74 L138 30 L182 48 L226 18 L274 40 L274 100 L6 100 Z' : 'M6 78 L50 60 L94 68 L138 34 L182 46 L226 22 L274 36';
            var k = bkey(e);
            return '<div style="width:100%;height:100%;min-height:60px;position:relative"><svg viewBox="0 0 280 100" preserveAspectRatio="none" style="width:100%;height:100%">' +
                (e.fill !== false && e.kind === 'bar' ? '<path d="' + h + '" fill="' + c + '" opacity=".45"></path>' : '') +
                '<path d="' + h + '" fill="none" stroke="' + c + '" stroke-width="2"></path></svg>' +
                (k ? '<span style="position:absolute;top:2px;right:4px;font-size:.72rem;opacity:.8">{{ widget.' + k + ' }}</span>' : '') +
                '</div>';
        });

    def('image', 'display', 'dpb_c_image', 'fas fa-image', 220, 130, { src: P.text, bind: P.bind, alt: P.text, radius: pn('dpb_radius'), fit: ps('dpb_fit', ['cover', 'contain', 'fill', 'none', 'scale-down']) },
        function (e) {
            return '<img ' + bsrc(e, e.src || '') + ' alt="' + esc(e.alt || '') + '" style="width:100%;height:100%;object-fit:' + (e.fit || 'cover') + ';border-radius:' + (val(e.radius, 8) || 8) + 'px;background:rgba(255,255,255,.05)">';
        });

    def('video', 'display', 'dpb_c_video', 'fas fa-video', 260, 150, { src: P.text, bind: P.bind, controls: pb('dpb_controls'), autoplay: pb('dpb_autoplay'), radius: pn('dpb_radius') },
        function (e) {
            return '<video ' + bsrc(e, e.src || '') + ' ' + (e.controls !== false ? 'controls' : '') + ' ' + (e.autoplay ? 'autoplay muted' : '') + ' style="width:100%;height:100%;object-fit:cover;border-radius:' + (val(e.radius, 8) || 8) + 'px;background:#000"></video>';
        });

    def('iframe', 'display', 'dpb_c_iframe', 'fas fa-window-restore', 260, 150, { src: P.text, bind: P.bind, border: pb('dpb_border') },
        function (e) {
            return '<iframe ' + bsrc(e, e.src || '') + ' style="width:100%;height:100%;border:' + (e.border ? '1px solid rgba(255,255,255,.2)' : 'none') + ';border-radius:8px;background:#000"></iframe>';
        });

    def('map', 'display', 'dpb_c_map', 'fas fa-map', 260, 150, { lat: pn('dpb_lat'), lon: pn('dpb_lon'), zoom: pn('dpb_zoom'), radius: pn('dpb_radius') },
        function (e) {
            return '<div style="width:100%;height:100%;border-radius:' + (val(e.radius, 8) || 8) + 'px;background:linear-gradient(135deg,#2a3b2a,#1c2b1c);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.4);font-size:.78rem">' +
                esc(val(e.lat, 55.75) + ', ' + val(e.lon, 37.62) + ' z=' + val(e.zoom, 12)) + '</div>';
        });

    def('spinner', 'display', 'dpb_c_spinner', 'fas fa-circle-notch', 40, 40, { size: pn('dpb_size'), color: P.color },
        function (e) {
            return '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center"><i class="fas fa-spinner fa-spin" style="font-size:' + (val(e.size, 22) || 22) + 'px;color:' + (e.color || 'inherit') + '"></i></div>';
        });

    def('html', 'display', 'dpb_c_html', 'fas fa-code', 240, 80, { bind: P.bind, code: { type: 'textarea', label: 'dpb_html_code' } },
        function (e) {
            var code = String(e.code || '');
            if (bkey(e)) code = code ? code.replace(/\{\{\s*widget\.[A-Za-z_$][\w$]*\s*\}\}/g, '{{ widget.' + bkey(e) + ' }}') : code;
            if (!code.trim()) {
                return '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;border:1px dashed rgba(255,255,255,.2);border-radius:6px;color:rgba(255,255,255,.35);font-size:.75rem">HTML</div>';
            }
            return code;
        }, { raw: true });

    /* whole installed widget dropped into the form */
    def('widget', 'widgets', 'dpb_c_widget', 'fas fa-cubes', 260, 160, { type: { type: 'select', label: 'dpb_type', options: [], dyn: 'types' }, bind: P.bind },
        function (e, isPreview) {
            var ty = String(e.type || '').trim();
            var k = bkey(e);
            if (!ty) {
                return '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;border:1px dashed rgba(255,255,255,.25);border-radius:8px;color:rgba(255,255,255,.45);font-size:.8rem;background:rgba(255,255,255,.03)">' + esc('widget') + '</div>';
            }
            if (isPreview) {
                return '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;border:1px dashed rgba(255,255,255,.25);border-radius:8px;color:rgba(255,255,255,.45);font-size:.8rem;background:rgba(255,255,255,.03)">' +
                    '<i class="fas fa-cubes" style="margin-right:6px"></i>' + esc(ty) + '</div>';
            }
            return '<div style="width:100%;height:100%;box-sizing:border-box;overflow:hidden"><component :is="\'widget-' + esc(ty) + '\'" :widget="' + (k ? 'widget.' + k : '{}') + '"></component></div>';
        });

    var CATS = [
        { key: 'basic', label: 'dpb_cat_basic' },
        { key: 'input', label: 'dpb_cat_input' },
        { key: 'select', label: 'dpb_cat_select' },
        { key: 'display', label: 'dpb_cat_display' },
        { key: 'widgets', label: 'dpb_cat_widgets' }
    ];

    /* ------------------------------------------------------------------ */
    /* settings field catalog                                               */
    /* ------------------------------------------------------------------ */

    /* ------------------------------------------------------------------ */
    /* system tabs                                                          */
    /* ------------------------------------------------------------------ */
    /* A widget file declares only the key of such a tab and an empty fields group
       (`graphs: []`): the section and its editor live in the module core
       (index.html renders it, app.js reads/writes the property), the widget only
       keeps the data. `field` is the widget property the core section edits,
       `label` is the name of the section, `icon` is shown in the builder. */
    var SYSTEM_TABS = {
        widgets: { field: 'children', label: 'tab_widgets', icon: 'fas fa-cubes' },
        graphs: { field: 'series', label: 'tab_graphs', icon: 'fas fa-chart-area' },
        columns: { field: 'columns', label: 'tab_columns', icon: 'fas fa-table' },
        slides: { field: 'slides', label: 'tab_slides', icon: 'fas fa-images' },
        statuses: { field: 'statuses', label: 'tab_statuses', icon: 'fas fa-heart' },
        items: { field: 'items', label: 'tab_items', icon: 'fas fa-list-ul' },
        colors: { field: 'colors', label: 'tab_colors', icon: 'fas fa-palette' }
    };

    /* the palette of the settings section: every system field can be added to a tab
       exactly like an ordinary field type */
    function systemFields() {
        var out = [];
        for (var k in SYSTEM_TABS) {
            if (!Object.prototype.hasOwnProperty.call(SYSTEM_TABS, k)) continue;
            out.push({
                tab: k,
                field: SYSTEM_TABS[k].field,
                label: SYSTEM_TABS[k].label,
                icon: SYSTEM_TABS[k].icon
            });
        }
        return out;
    }

    /* the section a system field belongs to, or null for an ordinary field */
    function systemFieldOf(f) {
        if (!f || !f.key) return null;
        for (var k in SYSTEM_TABS) {
            if (!Object.prototype.hasOwnProperty.call(SYSTEM_TABS, k)) continue;
            if (SYSTEM_TABS[k].field !== f.key) continue;
            return { tab: k, field: f.key, label: SYSTEM_TABS[k].label, icon: SYSTEM_TABS[k].icon };
        }
        return null;
    }

    /* the tab of a widget that belongs to a core section, or null for an ordinary tab */
    function systemTabOf(tab) {
        if (!tab || !Object.prototype.hasOwnProperty.call(SYSTEM_TABS, tab.key)) return null;
        var s = SYSTEM_TABS[tab.key];
        return { tab: tab.key, field: s.field, label: s.label, icon: s.icon };
    }

    /* the field of a core section: its editor is the section itself, so the file never
       declares it - only the value in the widget defaults comes from it */
    function isSystemFieldOf(tab, f) {
        var s = systemTabOf(tab);
        return !!(s && f && f._sys && f.key === s.field);
    }

    /* the row the builder shows for a core section: an ordinary field with the key of the
       widget property, its value taken from the defaults the file already has */
    function systemField(sec, dv) {
        var f = newField('text');
        f.key = sec.field;
        f.label = '';
        /* an object or a function stays in the defaults of the file: only a plain value is
           kept in the row, so the defaults of a ready made widget are written back as they were */
        if (dv === null || typeof dv === 'string' || typeof dv === 'number' || typeof dv === 'boolean') f.default = dv;
        f._sys = sec.tab;
        return f;
    }

    var FT = {
        text: { icon: 'fas fa-font' },
        password: { icon: 'fas fa-key' },
        number: { icon: 'fas fa-sort-numeric-up' },
        textarea: { icon: 'fas fa-align-left' },
        select: { icon: 'fas fa-caret-down' },
        checkbox: { icon: 'fas fa-check-square' },
        slider: { icon: 'fas fa-sliders' },
        color: { icon: 'fas fa-palette' },
        object: { icon: 'fas fa-cube' },
        property: { icon: 'fas fa-list-alt' },
        method: { icon: 'fas fa-cogs' },
        script: { icon: 'fas fa-file-code' },
        icon_picker: { icon: 'fas fa-icons' },
        panel_select: { icon: 'fas fa-th-large' },
        info: { icon: 'fas fa-info-circle' }
    };

    /* ------------------------------------------------------------------ */
    /* model helpers                                                       */
    /* ------------------------------------------------------------------ */

    function uid(p) {
        return (p || 'i') + Math.random().toString(36).slice(2, 8);
    }

    function newItem(t) {
        var d = C[t];
        var it = { _i: uid('c'), _t: t };
        if (!d) return it;
        for (var k in d.props) {
            if (!Object.prototype.hasOwnProperty.call(d.props, k)) continue;
            it[k] = typeof d.props[k].def === 'undefined' ? '' : d.props[k].def;
        }
        if (d.options) it[d.optionsKey || 'options'] = d.options.join('\n');
        /* the side of the widget the component is tied to when the widget is resized;
           empty means the coordinates of the editor are kept */
        if (typeof it.anchorX === 'undefined') it.anchorX = '';
        if (typeof it.anchorY === 'undefined') it.anchorY = '';
        /* the place may also follow a value: an empty expression keeps the coordinates
           of the editor, a filled one is written as an expression of pixels */
        if (typeof it.dx === 'undefined') it.dx = '';
        if (typeof it.dy === 'undefined') it.dy = '';
        /* a stretched side follows the size of the widget; only a side the component
           can stretch is given the flag, so a model never promises more than it can */
        it.stretchX = it.stretchX && canStretch(it._t, 'x') ? true : false;
        it.stretchY = it.stretchY && canStretch(it._t, 'y') ? true : false;
        return it;
    }

    function newField(type) {
        return {
            _i: uid('f'), type: type || 'text', key: '', label: '',
            default: '', options: '', row: '', hint: '', min: '', max: '', step: ''
        };
    }

    /* the fields every new widget starts with: the name of the module and the whole
       icon block, written exactly as a ready made widget declares them - the same
       keys, the same rows, the same conditions and labels taken from the language file.
       The name field is left empty on purpose: a widget nobody has named yet must not
       come out wearing one, and the field itself is what the user types into later */
    function stdFields() {
        var out = [
            { type: 'text', key: 'title', label: 'field_title', default: '' },
            {
                type: 'select', key: 'icon_type', label: 'field_icon_type', row: 'icon_row',
                default: 'icon', options: 'icon|opt_icon\nproperty|opt_property\nurl|opt_url'
            },
            { type: 'icon_picker', key: 'icon', label: 'field_icon', row: 'icon_row', default: 'fas fa-cube', showIf: { icon_type: 'icon' } },
            { type: 'object', key: 'icon_object', label: 'field_icon_object', row: 'icon_row', showIf: { icon_type: 'property' } },
            { type: 'property', key: 'icon_property', label: 'field_icon_property', row: 'icon_row', showIf: { icon_type: 'property' } },
            { type: 'text', key: 'icon_url', label: 'field_icon_url', row: 'icon_row', showIf: { icon_type: 'url' } }
        ];
        return out.map(function (d) {
            var f = newField(d.type);
            f.key = d.key;
            f.label = d.label;
            f.row = d.row || '';
            if (d.default) { f.default = d.default; f._hasDefault = true; }
            if (d.options) f.options = d.options;
            if (d.showIf) f.showIf = d.showIf;
            /* the marker tells a fresh widget from a filled one: the fields a widget
               starts with do not make it a widget the user has already built */
            f._std = 1;
            return f;
        });
    }

    /* untouched = the field is still the one stdFields() hands out */
    function isStdField(f) {
        if (!f || !f._std) return false;
        var std = null;
        stdFields().forEach(function (s) { if (s.key === f.key) std = s; });
        if (!std) return false;
        return f.type === std.type && f.label === std.label && f.row === std.row &&
            (f.default || '') === (std.default || '') && (f.options || '') === (std.options || '') &&
            JSON.stringify(f.showIf || null) === JSON.stringify(std.showIf || null);
    }

    /* a new widget starts with the two components it cannot do without: the icon of
       the module and its name bound to the title field. They are ordinary
       components - they can be moved, restyled or deleted like any other */
    function stdItems(a) {
        var ico = newItem('icon');
        var ttl = newItem('text');
        ico.icon = 'fas fa-cube';
        /* the class the icons of a ready made card carry, so the icon of the widget
           looks the same as the ones on the panel */
        ico.cls = 'widget-v-card__icon';
        /* the icon follows the switch of the settings panel: one choice there decides
           whether it is a glyph, a path or the value of a property, and the component
           is not tied to any one of the three */
        ico.bind = 'icon_type';
        ttl.bind = 'title';
        /* the name of the widget is written in the size of a heading */
        ttl.sizeMode = 'title';
        /* the place of the name depends on whether the icon takes the room next to it */
        ttl.dx = 'icon ? 50 : 2';
        /* the icon sits in the corner of the card, the name goes after it and is
           shifted out of the way whenever the icon is there. Both are clamped to
           the card, so shrinking it pulls them inside instead of letting them
           hang over the edge */
        var ic = clampPos(a, 2, 2, 40, 40);
        var tc = clampPos(a, 50, 7, 190, 22);
        ico.x = ic.x; ico.y = ic.y; ico.w = ic.w; ico.h = ic.h;
        ttl.x = tc.x; ttl.y = tc.y; ttl.w = tc.w; ttl.h = tc.h;
        ico._std = 1; ttl._std = 1;
        return [ico, ttl];
    }

    /* untouched = the component is still the one stdItems() hands out */
    function isStdItem(it) {
        if (!it || !it._std) return false;
        if (it._t === 'icon') {
            return String(it.icon || '') === 'fas fa-cube' &&
                String(it.cls || '') === 'widget-v-card__icon' &&
                String(it.bind || '') === 'icon_type';
        }
        if (it._t === 'text') {
            return it.bind === 'title' && String(it.sizeMode || '') === 'title' &&
                String(it.dx || '') === 'icon ? 50 : 2' && !String(it.text || '').trim();
        }
        return false;
    }

    /* the skeleton of a widget: everything the builder needs, with the code empty.
       This is what every model starts from - normalizeModel() hands it out as the
       defaults, so it must stay cheap and must not ask wizard() for anything.
       The card itself is a row of the panel: 280x90, no rounding, the very class the
       ready made cards carry, so a new widget looks like one of them and not like a
       grey box in a corner */
    function bareModel(type) {
        var appearance = {
            title: '', width: 280, height: 90, pad: 10, gap: 8, radius: 0,
            bg: '', color: '', align: 'stretch', dir: 'column', showTitle: false,
            cls: 'widget-v-card', html: '', items: [],
            iconType: 'icon', icon: '', iconObject: '', iconProperty: '', iconUrl: ''
        };
        appearance.items = stdItems(appearance);
        return {
            v: 1, type: type || 'new_widget', title: '', icon: 'fas fa-cube', description: '',
            appearance: appearance,
            settings: {
                tabs: [{ key: 'main', label: 'tab_main', items: stdFields() }]
            },
            defaultsExtra: {},
            code: { dataPre: '', data: '', computed: '', methods: '', mounted: '', watch: '', beforeUnmount: '', funcs: [] }
        };
    }

    /* A brand new widget opens in the builder with its code already filled in: the
       standard icon follows the icon_type switch, so the panel's own pair of object
       and property has to be readable from the first moment - the loader, the
       watchers and the flag it raises, plus the resolver that picks glyph, path or
       value. It is taken from wizard(), the same place the file is written from, so
       the code a new widget starts with is exactly the code it is saved with.

       The skeleton stays bare for wizard() to walk over - filling it there as well
       would ask for the same code twice over and for nothing. */
    function newModel(type) {
        var m = bareModel(type);
        var wiz = wizard(m);
        /* set() writes a value back into the object. Nothing a widget starts with
           writes anything, so it is left out - a starter that carried a setter would
           put a write into every new widget before anyone asked for one */
        var setters = {};
        (wiz.loaders || []).forEach(function (ld) { if (ld.set) setters[ld.set] = 1; });
        m.code.data = wiz.data;
        m.code.computed = wiz.computed;
        m.code.methods = dropEntries(wiz.methods, function (name) { return !!setters[name]; });
        m.code.mounted = wiz.mounted;
        return m;
    }

    /* The same skeleton, but with nothing in it at all: no components, no fields,
       no code, no icon. This is what "новый виджет" must open - a widget built from
       nothing, not the minimal example dressed up as a blank one. The card frame
       stays: that is the shape of any widget, not content of it.

       The tab itself stays as well, and that is not a compromise but a necessity:
       the panel reads the first tab straight off, without asking whether there is
       one, so a model with no tabs leaves the window blank instead of showing an
       empty widget. The tab is kept with no fields in it - for a tab that is what
       empty means. */
    function emptyModel(type) {
    var m = bareModel(type);
    m.icon = '';
    /* a blank card is one line tall, not the two of the example: 280x115 fits the
       icon of 40 and a name beside it with air to spare, and leaves room to drop
       something underneath later */
    m.appearance.width = 280;
    m.appearance.height = 115;
    m.appearance.items = [];
    m.settings.tabs = [{ key: 'main', label: 'tab_main', items: [] }];
    return m;
    }

    function normalizeModel(m) {
        if (!m || typeof m !== 'object') return bareModel('widget');
        var d = bareModel(m.type || 'widget');
        d.v = 1;
        d.type = m.type || d.type;
        d.title = m.title || '';
        d.icon = m.icon || d.icon;
        d.description = m.description || '';
        var a = m.appearance || {};
        Object.keys(d.appearance).forEach(function (k) {
            if (a[k] !== undefined && a[k] !== null && a[k] !== '') d.appearance[k] = a[k];
        });
        d.appearance.items = (Array.isArray(a.items) ? a.items : []).map(function (it) {
            var def = C[it._t];
            var o = { _i: it._i || uid('c'), _t: it._t || 'text' };
            if (def) {
                for (var k in def.props) {
                    if (!Object.prototype.hasOwnProperty.call(def.props, k)) continue;
                    /* def is the value of a field that the model does not mention:
                       the model of an older widget has no sizeMode and no font, and
                       they must not look like an unfinished one */
                    var dflt = def.props[k].def;
                    if (it[k] !== undefined) o[k] = it[k];
                    else if (dflt !== undefined) o[k] = dflt;
                }
            }
            for (var k2 in it) {
                if (k2 !== '_i' && k2 !== '_t' && o[k2] === undefined) o[k2] = it[k2];
            }
            return o;
        });
        if (itemsLackPos(d.appearance.items)) {
            var legacy = stackedPos(d.appearance, d.appearance.items);
            d.appearance.items.forEach(function (it, i) {
                it.x = legacy[i].x; it.y = legacy[i].y; it.w = legacy[i].w; it.h = legacy[i].h;
            });
        }
        clampAll(d.appearance);
        var s = m.settings || {};
        /* a widget that comes from a file keeps the fields it was saved with: the
           standard ones are only what a NEW widget starts with, so a model without
           tabs of its own gets an empty tab and not the ready made set */
        var srcTabs = (Array.isArray(s.tabs) && s.tabs.length) ? s.tabs : [{ key: 'main', label: 'tab_main', items: [] }];
        d.settings.tabs = srcTabs.map(function (tb, i) {
            var o = {
                key: tb.key || ('tab' + (i + 1)),
                label: tb.label || ('Tab ' + (i + 1)),
                items: (Array.isArray(tb.items) ? tb.items : []).map(function (f) {
                    var o2 = newField(f.type);
                    Object.keys(f).forEach(function (k) { if (k !== '_i') o2[k] = f[k]; });
                    o2._i = f._i || o2._i;
                    return o2;
                })
            };
            /* the name of the fields group of the original file (params, advanced, ...) */
            o.fields = tb.fields || o.key;
            if (Array.isArray(tb._ord)) o._ord = tb._ord.slice();
            return o;
        });
        var c = m.code || {};
        d.code.dataPre = c.dataPre || '';
        d.code.data = c.data || '';
        d.code.computed = c.computed || '';
        d.code.methods = c.methods || '';
        d.code.mounted = c.mounted || '';
        d.code.watch = c.watch || '';
        d.code.beforeUnmount = c.beforeUnmount || '';
        d.code.funcs = Array.isArray(c.funcs) ? c.funcs : [];
        d.defaultsExtra = (m.defaultsExtra && typeof m.defaultsExtra === 'object') ? m.defaultsExtra : {};
        d.imported = !!m.imported;
        /* order of the blocks in the original file: the generator writes them back as they were */
        d.srcOrder = Array.isArray(m.srcOrder) ? m.srcOrder.slice() : null;
        d.srcExtra = Array.isArray(m.srcExtra) ? JSON.parse(JSON.stringify(m.srcExtra)) : null;
        d.srcGroups = Array.isArray(m.srcGroups) ? m.srcGroups.slice() : null;
        d.srcOpenGroups = Array.isArray(m.srcOpenGroups) ? m.srcOpenGroups.slice() : null;
        d.srcDefaults = m.srcDefaults || '';
        d.defaultsRaw = !!m.defaultsRaw;
        d.tabsNoTail = !!m.tabsNoTail;
        d.lastComma = (m.lastComma === undefined) ? false : !!m.lastComma;
        d.srcVar = m.srcVar || '';
        d.srcKey = m.srcKey || '';
        d.eol = m.eol || '\n';
        d.eof = (m.eof === undefined) ? true : !!m.eof;
        d.dataInline = !!m.dataInline;
        d.oneLine = (m.oneLine && typeof m.oneLine === 'object') ? m.oneLine : {};
        d.indent = (m.indent && typeof m.indent === 'object') ? m.indent : {};
        d.headIndent = (m.headIndent && typeof m.headIndent === 'object') ? m.headIndent : {};
        return d;
    }

    /* ------------------------------------------------------------------ */
    /* geometry: free placement of components inside the widget bounds      */
    /* ------------------------------------------------------------------ */

    function itemSize(it) {
        var d = C[it._t] || {};
        return {
            w: Math.max(1, val(it.w, d.w) || d.w || 160),
            h: Math.max(1, val(it.h, d.h) || d.h || 32)
        };
    }

    /* the size left for the components: the padding of the card is taken off it.
       A pad of 0 is a real value — the theme card has none — so it must survive */
    function innerSize(a) {
        return {
            w: Math.max(1, (val(a.width, 320) || 320) - 2 * val(a.pad, 10)),
            h: Math.max(1, (val(a.height, 200) || 200) - 2 * val(a.pad, 10))
        };
    }

    function clampPos(a, x, y, w, h) {
        var b = innerSize(a);
        w = Math.min(w, b.w); h = Math.min(h, b.h);
        var mx = Math.max(0, b.w - w), my = Math.max(0, b.h - h);
        return {
            x: Math.round(Math.min(mx, Math.max(0, val(x, 0)))),
            y: Math.round(Math.min(my, Math.max(0, val(y, 0)))),
            w: w, h: h
        };
    }

    /* legacy models: no x/y at all -> stack them the way the flex layout did */
    function itemsLackPos(items) {
        for (var i = 0; i < items.length; i++) {
            if (items[i].x === undefined || items[i].y === undefined) return true;
        }
        return false;
    }

    function stackedPos(a, items) {
        var b = innerSize(a), gap = val(a.gap, 8) || 8, al = a.align || 'stretch';
        var out = [], x = 0, y = 0, rowH = 0;
        for (var i = 0; i < items.length; i++) {
            var s = itemSize(items[i]);
            if (a.dir === 'row') {
                if (x > 0 && x + s.w > b.w) { x = 0; y += rowH + gap; rowH = 0; }
                var rx = al === 'center' ? Math.round((b.w - s.w) / 2) : (al === 'right' ? b.w - s.w : 0);
                out.push({ x: Math.max(0, rx), y: y, w: s.w, h: s.h });
                x += s.w + gap;
                if (s.h > rowH) rowH = s.h;
            } else {
                var cy = al === 'center' ? Math.round((b.w - s.w) / 2) : (al === 'right' ? b.w - s.w : 0);
                out.push({ x: Math.max(0, cy), y: y, w: s.w, h: s.h });
                y += s.h + gap;
            }
        }
        return out;
    }

    /* next free slot for a new component; prefers the current direction */
    function autoPos(a, items, w, h) {
        var b = innerSize(a), gap = val(a.gap, 8) || 8, al = a.align || 'stretch';
        var taken = items.map(function (it) {
            var s = itemSize(it);
            return { x: val(it.x, 0), y: val(it.y, 0), w: s.w, h: s.h };
        });
        var horiz = (a.dir === 'row') || (!items.length && w >= h);
        for (var pass = 0; pass < 2; pass++) {
            if ((pass === 1) === horiz) continue;
            var x = 0, y = 0, rowH = 0;
            for (var g = 0; g < 4000; g++) {
                var p = clampPos(a, x, y, w, h);
                var hit = taken.some(function (t) {
                    return p.x < t.x + t.w + 2 && p.x + p.w + 2 > t.x && p.y < t.y + t.h + 2 && p.y + p.h + 2 > t.y;
                });
                if (!hit) return { x: p.x, y: p.y };
                if (pass === 0) { x += w + gap; if (x + w > b.w) { x = 0; y += rowH + gap; rowH = 0; } }
                else { y += h + gap; }
                if (pass === 0 && x > b.w + w) { x = 0; y += rowH + gap; rowH = 0; }
                if (pass === 1 && y > b.h + h) { x = 0; y = 0; }
            }
        }
        var c = clampPos(a, al === 'right' ? 99999 : (al === 'center' ? (b.w - w) / 2 : 0), al === 'center' ? (b.h - h) / 2 : 0, w, h);
        return { x: c.x, y: c.y };
    }

    function clampAll(a) {
        var items = a.items || [];
        for (var i = 0; i < items.length; i++) {
            var s = itemSize(items[i]);
            var p = clampPos(a, items[i].x, items[i].y, s.w, s.h);
            items[i].x = p.x; items[i].y = p.y; items[i].w = p.w; items[i].h = p.h;
        }
        return items;
    }

    /* a box that covers another one */
    function overlap(p, q) {
        return p.x < q.x + q.w && p.x + p.w > q.x && p.y < q.y + q.h && p.y + p.h > q.y;
    }

    /* the dragged component never moves the others: it stops at the first one
       it would cover, sliding along it when there is room */
    function placeFree(a, it, x, y) {
        var s = itemSize(it);
        var from = { x: val(it.x, 0), y: val(it.y, 0) };
        var p = clampPos(a, x, y, s.w, s.h);
        var others = (a.items || []).filter(function (o) { return o._i !== it._i; });
        var free = function (nx, ny) {
            var c = clampPos(a, nx, ny, s.w, s.h);
            for (var i = 0; i < others.length; i++) {
                var b = itemSize(others[i]);
                if (overlap(c, { x: val(others[i].x, 0), y: val(others[i].y, 0), w: b.w, h: b.h })) return null;
            }
            return c;
        };

        var hit = free(p.x, p.y);
        if (hit) return hit;
        /* along the wall: first one axis, then the other, then stay put */
        var slide = free(p.x, from.y) || free(from.x, p.y);
        return slide || free(from.x, from.y) || { x: from.x, y: from.y, w: s.w, h: s.h };
    }

    /* a component never shrinks below this, no matter how hard the handle is pulled */
    var MIN_ITEM = 20;

    function lim(v, lo, hi) {
        v = Number(v);
        if (!isFinite(v)) return lo;
        return v < lo ? lo : (v > hi ? hi : v);
    }

    /* resizing by one of the eight handles: the opposite edge keeps its place,
       the component never leaves the widget; px/py are frame coordinates */
    function resizeItem(a, it, dir, px, py) {
        var b = innerSize(a), s = itemSize(it);
        var x = val(it.x, 0), y = val(it.y, 0), w = s.w, h = s.h;
        var d = String(dir || ''), n, room;
        if (d.indexOf('e') >= 0) {
            room = Math.max(0, b.w - x);
            w = lim(px - x, Math.min(MIN_ITEM, room), room);
        } else if (d.indexOf('w') >= 0) {
            n = x + w;
            x = lim(px, 0, Math.max(0, n - Math.min(MIN_ITEM, n)));
            w = n - x;
        }
        if (d.indexOf('s') >= 0) {
            room = Math.max(0, b.h - y);
            h = lim(py - y, Math.min(MIN_ITEM, room), room);
        } else if (d.indexOf('n') >= 0) {
            n = y + h;
            y = lim(py, 0, Math.max(0, n - Math.min(MIN_ITEM, n)));
            h = n - y;
        }
        return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
    }

    /* ------------------------------------------------------------------ */
    /* compilation: model -> Vue component                                 */
    /* ------------------------------------------------------------------ */

    function itemHtml(it, isPreview, widget) {
        var d = C[it._t];
        if (!d) return '';
        try { return d.html(it, !!isPreview, widget) || ''; } catch (e) { return ''; }
    }

    /* where a component sits when the panel gives the widget a box of another size.
       No anchor: the offset from the top left corner stays, exactly as in the editor.
       An anchor ties the component to that side and keeps the distance to it.
       A stretched side has no size of its own: the distance to the left and to the
       right edge is written instead of a width, so the browser gives it the room
       that is left - that is what makes the component follow the size of the widget. */
    function anchorCss(a, it, s, p) {
        var b = innerSize(a);
        var ax = String(it.anchorX || ''), ay = String(it.anchorY || '');
        /* a stretched side is written as the two gaps instead of a size, so the
           browser hands the component the room that is left in the box - but an
           offset names an exact place from the edge, and the two cannot hold at
           once. The offset wins: that side stops stretching and gets its width
           back, otherwise the offset would be written and then dropped. */
        var dxs = safeExpr(it.dx), dys = safeExpr(it.dy);
        var sx = !!(it.stretchX && canStretch(it._t, 'x') && !dxs);
        var sy = !!(it.stretchY && canStretch(it._t, 'y') && !dys);
        var cx, cy, bind = '';
        if (sx) cx = ';left:' + p.x + 'px;right:' + Math.max(0, b.w - p.x - p.w) + 'px';
        else if (!ax || ax === 'left') cx = ';left:' + p.x + 'px';
        else if (ax === 'center') cx = ';left:50%;margin-left:-' + Math.round(p.w / 2) + 'px';
        else if (ax === 'right') cx = ';right:' + Math.max(0, b.w - p.x - p.w) + 'px';
        else cx = ';left:' + p.x + 'px';
        if (sy) cy = ';top:' + p.y + 'px;bottom:' + Math.max(0, b.h - p.y - p.h) + 'px';
        else if (!ay || ay === 'top') cy = ';top:' + p.y + 'px';
        else if (ay === 'center') cy = ';top:50%;margin-top:-' + Math.round(p.h / 2) + 'px';
        else if (ay === 'bottom') cy = ';bottom:' + Math.max(0, b.h - p.y - p.h) + 'px';
        else cy = ';top:' + p.y + 'px';
        /* an expression of the place wins over the anchor of that side: the anchor
           names one side, the expression is a number of pixels from the left/top.
           The unit is written with single quotes and the expression is wrapped in
           brackets: the whole binding sits in a double quoted :style attribute, and
           an expression may be a ternary, where a bare +"px" would land on one
           branch only. */
        if (dxs) {
            bind += "left:(" + dxs + ")+'px'";
            cx = ';left:' + p.x + 'px';
            ax = 'left';
        }
        if (dys) {
            if (bind) bind += ',';
            bind += "top:(" + dys + ")+'px'";
            cy = ';top:' + p.y + 'px';
            ay = 'top';
        }
        var style = 'position:absolute;box-sizing:border-box' + cx + cy +
            (sx ? '' : ';width:' + p.w + 'px') + (sy ? '' : ';height:' + p.h + 'px');
        return { style: style, bind: bind };
    }

    /* the header of the module: the same icon set the settings panel offers, written
       the way a ready made widget writes it - a class for "icon" and a picture for
       both "url" and "property", because a property is read here as the path to the
       file the object keeps in it. The title comes along when it is set. */
    function appearanceHead(a) {
        var icon = '', t = String(a.iconType || 'icon');
        if (t === 'icon' && a.icon) {
            icon = '<i class="dpb-ico ' + esc(a.icon) + '"></i>';
        } else if (t === 'url' && a.iconUrl) {
            icon = '<img class="dpb-ico" src="' + esc(a.iconUrl) + '" alt="">';
        } else if (t === 'property' && a.iconObject && a.iconProperty) {
            icon = '<img class="dpb-ico" :src="dpbIconSrc" alt="">';
        }
        var title = (a.showTitle && a.title) ? '<div class="dpb-title">' + esc(a.title) + '</div>' : '';
        if (!icon && !title) return '';
        return '<div class="dpb-head">' + icon + title + '</div>';
    }

    function appearanceTemplate(m) {
        var a = m.appearance;
        /* widget imported from a ready made file: its own HTML is used as is */
        if (typeof a.html === 'string' && a.html.trim() !== '') return a.html;
        markIconProps(m);
        var items = a.items || [];
        var inner = items.map(function (it, ix) {
            var s = itemSize(it);
            var p = clampPos(a, it.x, it.y, s.w, s.h);
            var g = anchorCss(a, it, s, p);
            /* data-dpb-i is the hook of the component: the widget code may look a
               component up by it, the number it was given in the canvas */
            var hook = ' data-dpb-i="' + esc(it._i || ('i' + ix)) + '" data-dpb-n="' + ix + '"';
            var sty = ' style="' + g.style + '"' + (g.bind ? ' :style="{' + g.bind + '}"' : '');
            return '<div class="dpb-item"' + hook + sty + '>' + itemHtml(it, false) + '</div>';
        }).join('');
        var parts = [];
        var head = appearanceHead(a);
        if (head) parts.push(head);
        /* the coordinates are the ones set in the editor, so the placed area starts at
           the top left corner and keeps that position whatever box the panel gives
           the widget: only the free space at the right and below changes */
        parts.push('<div class="dpb-body" style="position:relative;width:100%;height:100%;overflow:hidden">' + inner + '</div>');
        /* a class on the root lets a widget made here borrow the look of a ready made
           one: "widget-v-card" brings the card background and the theme colours */
        var rootCls = String(a.cls || '').replace(/\s+/g, ' ').trim();
        return '<div class="dpb-root' + (rootCls ? ' ' + esc(rootCls) : '') + '" style="' + st({
            'width': '100%',
            'height': '100%',
            'padding': val(a.pad, 10) + 'px',
            'border-radius': val(a.radius, 8) + 'px',
            /* without an explicit colour the class must stay in charge, otherwise
               an inline "transparent" overrides the card background of the theme */
            'background': a.bg || '',
            'color': a.color || '',
            'box-sizing': 'border-box',
            'overflow': 'hidden',
            'font-family': 'inherit'
        }) + '">' + parts.join('') + '</div>';
    }

    function appearanceStyle(m) {
        var a = m.appearance;
        return st({
            width: (val(a.width, 320) || 320) + 'px',
            height: (val(a.height, 200) || 200) + 'px'
        });
    }

    function fieldObj(m, f) {
        var imported = !!m.imported;
        var type = f.type || 'text';
        var key = f.key || ('f_' + f._i);
        var v = { key: key, type: type };
        if (f.label) v.label = f.label;
        else if (!imported && type !== 'info') v.label = key || 'field';
        if (f.row) v.row = f.row;
        if (f.placeholder) v.placeholder = f.placeholder;
        if (f.parent) v.parent = f.parent;
        if (f.showIf && typeof f.showIf === 'object') v.showIf = f.showIf;
        if (type === 'select' && f.options) {
            v.options = String(f.options).split('\n').filter(function (s) { return s.trim() !== ''; })
                .map(function (s) {
                    var p = s.indexOf('|');
                    if (p >= 0) return { value: s.slice(0, p).trim(), label: s.slice(p + 1).trim() };
                    return { value: s.trim(), label: s.trim() };
                });
        }
        if (type === 'info') { if (f.text) v.text = f.text; else if (f.hint) v.text = f.hint; }
        else if (f.hint) v.text = f.hint;
        if (f.min !== '' && f.min !== undefined && f.min !== null) v.min = f.min;
        if (f.max !== '' && f.max !== undefined && f.max !== null) v.max = f.max;
        if (f.step !== '' && f.step !== undefined && f.step !== null) v.step = f.step;
        if (f._hasDefault || (f.default !== '' && f.default !== undefined && f.default !== null)) v.default = f.default;
        /* keep any extra property of a ready made widget field (rows, inputType, value, ...) */
        var SKIP = { _i: 1, _ord: 1, _sys: 1, type: 1, key: 1, label: 1, options: 1, default: 1, row: 1, hint: 1, min: 1, max: 1, step: 1, text: 1, placeholder: 1, parent: 1, showIf: 1, _hasDefault: 1, _std: 1 };
        for (var ek in f) {
            if (!Object.prototype.hasOwnProperty.call(f, ek)) continue;
            if (SKIP[ek]) continue;
            if (v[ek] === undefined) v[ek] = f[ek];
        }
        /* order: as in the original field object, then the house order, then the rest */
        var ord = [];
        (Array.isArray(f._ord) ? f._ord : []).forEach(function (n) {
            if (v[n] !== undefined && ord.indexOf(n) < 0) ord.push(n);
        });
        FKEYS.forEach(function (n) { if (v[n] !== undefined && ord.indexOf(n) < 0) ord.push(n); });
        Object.keys(v).forEach(function (n) { if (ord.indexOf(n) < 0) ord.push(n); });
        var o = {};
        ord.forEach(function (n) { o[n] = v[n]; });
        return o;
    }

    function fieldsOf(m) {
        var out = {};
        m.settings.tabs.forEach(function (tb) {
            /* the group keeps the name it had in the file (params, advanced, main, ...) */
            var list = (tb.items || []).filter(function (f) { return !isSystemFieldOf(tb, f); });
            out[tb.fields || tb.key] = list.map(function (f) { return fieldObj(m, f); });
        });
        return out;
    }

    function defaultsOf(m) {
        var out = {};
        var ex = (m && m.defaultsExtra && typeof m.defaultsExtra === 'object') ? m.defaultsExtra : {};
        /* a ready made widget keeps its own set of defaults: only refresh known keys */
        var locked = !!m.imported;
        Object.keys(ex).forEach(function (k) { out[k] = ex[k]; });
        m.settings.tabs.forEach(function (tb) {
            (tb.items || []).forEach(function (f) {
                var k = f.key || ('f_' + f._i);
                if (locked && !Object.prototype.hasOwnProperty.call(out, k)) return;
                if (f._hasDefault || (f.default !== '' && f.default !== undefined && f.default !== null)) out[k] = f.default;
            });
        });
        /* the size of the canvas is the size of the widget on the panel: the "Позиция"
           tab is the same for every widget and takes width and height from here.
           A ready made widget keeps the size its own file already declares, and a file
           whose defaults could not be read is written back exactly as it is. */
        var a = m.appearance || {};
        var canAdd = !locked || !m.defaultsRaw;
        if (canAdd && (!locked || !Object.prototype.hasOwnProperty.call(out, 'width'))) out.width = val(a.width, 320) || 320;
        if (canAdd && (!locked || !Object.prototype.hasOwnProperty.call(out, 'height'))) out.height = val(a.height, 200) || 200;
        return out;
    }

    function lbl(s) {
        var v = String(s == null ? '' : s);
        /* a key of the translation table (`tab_widgets`, `dpb_tab_template`) is
           translated, a label written by the user is left as it is */
        if (window.__t && /^[A-Za-z][A-Za-z0-9_]*$/.test(v)) {
            try {
                var r = window.__t(v);
                if (r && r !== v) return r;
            } catch (e) { /* noop */ }
        }
        return v;
    }

    function tabsOf(m) {
        var out = [{ key: 'template', label: 'dpb_tab_template', template: true }];
        m.settings.tabs.forEach(function (tb) { out.push({ key: tb.key, label: lbl(tb.label), fields: tb.key }); });
        return out;
    }

    function settingKeys(m) {
        var k = [];
        m.settings.tabs.forEach(function (tb) {
            (tb.items || []).forEach(function (f) { if (f.key) k.push(f.key); });
        });
        return k;
    }

    /* named custom functions ("funcs") of the builder are joined into the methods: block */
    function funcsOf(m) {
        var c = m && m.code;
        return (c && Array.isArray(c.funcs)) ? c.funcs : [];
    }
    function fnEntry(f) {
        if (!f || !f.name) return '';
        /* the user types a method body from the first column */
        var b = String(f.text || '').replace(/^\s*\n/, '').replace(/\s+$/, '');
        if (!b.trim()) return f.name + '() {}';
        var lines = b.split('\n');
        /* a // comment on the same line would swallow the closing brace: keep it on its own line */
        if (lines.length === 1 && lines[0].indexOf('//') < 0) return f.name + '() { ' + lines[0].trim() + ' }';
        return f.name + '() {' + '\n' + b + '\n}';
    }
    function funcsText(m) {
        return funcsOf(m).map(fnEntry).filter(function (s) { return s !== ''; })
            .map(function (s) { return s + ','; }).join('\n');
    }
    /* the inner text of the methods: block: the user methods first, then the custom funcs */
    function methodsTextOf(m) {
        var c = m.code || {};
        var base = String(c.methods || '').replace(/\s+$/, '');
        var fs = funcsText(m);
        if (!fs) return base;
        /* the funcs are properties of the object: a comma between the user text and the funcs */
        if (base && base.charAt(base.length - 1) !== ',') base += ',';
        return base + '\n' + fs;
    }

    function build(model, extra) {
        var m = normalizeModel(model);
        var tpl = appearanceTemplate(m);
        var autoStyle = appearanceStyle(m);
        extra = extra || {};

        function generatedData() {
            return { dpbType: m.type, dpbKeys: settingKeys(m) };
        }

        var userDataFn = (typeof extra.data === 'function') ? extra.data : null;
        var userComputed = (extra.computed && typeof extra.computed === 'object') ? extra.computed : {};
        var userMethods = (extra.methods && typeof extra.methods === 'object') ? extra.methods : {};

        var comp = {
            props: ['widget'],
            tabs: tabsOf(m),
            fields: fieldsOf(m),
            defaults: defaultsOf(m),
            builderModel: m,
            appearanceStyle: autoStyle,
            template: tpl,
            data: function () {
                var base = generatedData();
                if (userDataFn) {
                    try {
                        var ud = userDataFn.call(this) || {};
                        for (var k in ud) {
                            if (Object.prototype.hasOwnProperty.call(ud, k)) base[k] = ud[k];
                        }
                    } catch (e) { console.error('[dpb] data', e); }
                }
                return base;
            },
            computed: Object.assign({}, userComputed),
            methods: Object.assign({}, userMethods),
            mounted: function () {
                if (typeof extra.mounted === 'function') {
                    try { extra.mounted.call(this); } catch (e) { console.error('[dpb] mounted', e); }
                }
            }
        };
        return comp;
    }

    /* ------------------------------------------------------------------ */
    /* source generation / parsing                                          */
    /* ------------------------------------------------------------------ */

    function ind(s, n) {
        var p = new Array(n + 1).join(' ');
        return String(s || '').split('\n').map(function (l) { return l.trim() === '' ? '' : p + l; }).join('\n');
    }

    /* ------------------------------------------------------------------ */
    /* the house style of the ready made widget files: single quotes,       */
    /* unquoted keys, compact options - never JSON                         */
    /* ------------------------------------------------------------------ */

    function jsStr(s) {
        return '\'' + String(s == null ? '' : s)
            .replace(/\\/g, '\\\\')
            .replace(/'/g, '\\\'')
            .replace(/\r/g, '\\r')
            .replace(/\n/g, '\\n')
            .replace(/\t/g, '\\t') + '\'';
    }
    function jsKey(k) {
        return /^[A-Za-z_$][\w$]*$/.test(k) ? k : jsStr(k);
    }
    /* inline literal; `tight` drops the spaces the original writes inside options */
    function jsLit(v, tight) {
        if (v === null || v === undefined) return 'null';
        if (v === true) return 'true';
        if (v === false) return 'false';
        if (typeof v === 'number') return isFinite(v) ? String(v) : '0';
        if (Array.isArray(v)) return '[' + v.map(function (x) { return jsLit(x, tight); }).join(tight ? ',' : ', ') + ']';
        if (typeof v === 'object') {
            var body = Object.keys(v).map(function (k) {
                /* options are written compact in every ready made widget */
                return jsKey(k) + (tight ? ':' : ': ') + jsLit(v[k], tight || k === 'options');
            }).join(tight ? ',' : ', ');
            return '{' + (tight ? '' : ' ') + body + (tight ? '' : ' ') + '}';
        }
        return jsStr(v);
    }

    /* top level blocks of a component literal, in the order of the file */
    var SRC_BLOCKS = ['props', 'tabs', 'fields', 'defaults', 'template', 'data', 'computed', 'watch', 'mounted', 'beforeUnmount', 'methods'];
        /* The properties that sit directly in the body of the component literal, with the
       place each one starts at. Indentation is what told them apart before, and that
       is not enough: an entry the generator writes into data() or methods is put
       there with its own indent, and by name alone "    values: {}," reads exactly
       like a property of the component. The blocks of the file were then taken from
       those entries, the real ones were left out, and the widget was written out
       without props, tabs and fields - a file the panel cannot load at all. Counting
       braces asks the one question that has an answer here: is this position directly
       inside the literal, or two levels down in a section. The walk is character by
       character and skips strings, template literals, comments and regex literals for
       the same reason: the braces of a template literal are not the braces of the
       object, and the template of a widget is a long one. */
    function topLevelProps(js) {
        var s = String(js || '');
        var head = /(?:^|\n)[ \t]*(?:const|let|var)[ \t]+[A-Za-z_$][\w$]*[ \t]*=[ \t]*\{/.exec(s);
        if (!head) return null;
        var open = s.indexOf('{', head.index + head[0].lastIndexOf('{'));
        var end = blockEnd(s, open);
        var out = [], depth = 0, atLine = true, q = '', last = '', i = open + 1;
        for (; i < end; i++) {
            var ch = s.charAt(i);
            if (q) {
                if (ch === '\\') { i++; atLine = false; continue; }
                if (ch === q) { q = ''; last = ch; }
                atLine = (ch === '\n');
                continue;
            }
            if (ch === '"' || ch === "'" || ch === '`') { q = ch; atLine = false; continue; }
            if (ch === '/' && s.charAt(i + 1) === '/') { var e = s.indexOf('\n', i); i = (e < 0 ? end : e); atLine = true; continue; }
            if (ch === '/' && s.charAt(i + 1) === '*') { var e2 = s.indexOf('*/', i); i = (e2 < 0 ? end : e2 + 1); atLine = false; continue; }
            if (ch === '/' && last && !/[)\]}A-Za-z0-9_$]/.test(last)) {
                /* a regex literal: skip it, or its braces and brackets count as code */
                var k = i + 1, cls = false;
                while (k < end) {
                    var rc = s.charAt(k);
                    if (rc === '\\') { k += 2; continue; }
                    if (rc === '[') cls = true;
                    else if (rc === ']') cls = false;
                    else if (rc === '/' && !cls) break;
                    else if (rc === '\n') break;
                    k++;
                }
                i = (k < end && s.charAt(k) === '/') ? k : i;
                last = '/';
                continue;
            }
            if (ch === '\n') { atLine = true; continue; }
            if (/\s/.test(ch)) continue;
            if (depth === 0 && atLine) {
                var mm = /^([A-Za-z_$][\w$]*)[ \t]*[:(]/.exec(s.slice(i, i + 80));
                if (mm) out.push({ name: mm[1], from: i });
            }
            atLine = false;
            if (ch === '{') depth++;
            else if (ch === '}') depth--;
            last = ch;
        }
        out.end = end;
        return out;
    }

    function blockOrderOf(js) {
        var hits = topLevelProps(js), pos = {}, names = [];
        if (hits) {
            hits.forEach(function (h) {
                if (SRC_BLOCKS.indexOf(h.name) < 0) return;
                if (pos[h.name] === undefined) { pos[h.name] = h.from; names.push(h.name); }
            });
        } else {
            /* a file the literal of which was not found: fall back to the indent alone */
            var s = String(js || ''), mm, re;
            SRC_BLOCKS.forEach(function (n) {
                re = new RegExp('(?:^|\\n)([ \\t]{4,})' + n + '[ \\t]*[:(]', 'g');
                var best = -1, bestInd = 1e9;
                while ((mm = re.exec(s)) !== null) {
                    var ind2 = mm[1].replace(/\t/g, '    ').length;
                    if (ind2 < bestInd) { bestInd = ind2; best = mm.index; }
                }
                if (best >= 0) { pos[n] = best; names.push(n); }
            });
        }
        names.sort(function (a, b) { return pos[a] - pos[b]; });
        return names;
    }

    /* blocks of the file the builder does not know, kept as they are (map.js: MOSCOW, GEO_TIMEOUT) */
    function extraBlocksOf(js) {
        var s = String(js || '');
        var hits = topLevelProps(js);
        if (!hits) {
            var head = /^const\s+[A-Za-z_$][\w$]*\s*=\s*\{/m.exec(s);
            if (!head) return null;
            var i = s.indexOf('{', head.index) + 1, end = blockEnd(s, i - 1);
            var re = /(?:^|\n) {4}([A-Za-z_$][\w$]*)\s*[:(]/g, m;
            re.lastIndex = i;
            hits = [];
            while ((m = re.exec(s)) !== null && m.index < end) {
                hits.push({ name: m[1], from: m.index + (m[0].charAt(0) === '\n' ? 1 : 0) });
            }
            hits.end = end;
        }
        var ex = [], k, n;
        for (k = 0; k < hits.length; k++) {
            if (SRC_BLOCKS.indexOf(hits[k].name) >= 0) continue;
            var to = hits.end;
            for (n = k + 1; n < hits.length; n++) { to = hits[n].from; break; }
            ex.push({ name: hits[k].name, text: s.slice(hits[k].from, to).replace(/\s+$/, '') });
        }
        return ex.length ? ex : null;
    }

    /* does the last item of the tabs array end with a comma? null when there are no tabs */
    /* the index of the bracket that closes the one at i, counting [] () and {} */
    function closeIndex(s, i) {
        var open = s.charAt(i), depth = 0, q = '', j = i;
        var pair = { '(': ')', '[': ']', '{': '}' };
        for (; j < s.length; j++) {
            var ch = s.charAt(j);
            if (q) {
                if (ch === '\\') { j++; continue; }
                if (ch === q) q = '';
                continue;
            }
            if (ch === '"' || ch === "'" || ch === '`') { q = ch; continue; }
            if (ch === '/' && s.charAt(j + 1) === '/') { var e = s.indexOf('\n', j); j = (e < 0 ? s.length : e); continue; }
            if (pair[ch]) { depth++; continue; }
            if (ch === ')' || ch === ']' || ch === '}') {
                depth--;
                if (!depth) return j;
                /* a closer of another kind than the opener: the block ends here anyway */
                if (depth < 0) return s.length;
            }
        }
        return s.length;
    }

    function tabsTailOf(js) {
        var m = /\n {4}tabs\s*:\s*\[/.exec(String(js || ''));
        if (!m) return null;
        var s = String(js), i = m.index + m[0].length - 1;
        var seg = s.slice(i + 1, closeIndex(s, i)).replace(/\s+$/, '');
        if (!seg) return null;
        return /,\s*$/.test(seg);
    }

    /* does the last top level block of the file end with a comma? */
    function lastBlockComma(js) {
        var s = String(js || ''), i = s.search(/\n};/);
        if (i < 0) return null;
        var lines = s.slice(0, i).split('\n');
        var last = '';
        for (var k = lines.length - 1; k >= 0; k--) {
            if (lines[k].trim() === '') continue;
            last = lines[k];
            break;
        }
        return /,\s*$/.test(last);
    }

    /* empty groups the file writes on two lines: `slides: [\n        ],` */
    function openGroupsOf(js) {
        var s = String(js || ''), out = [], re = /\n {8}([A-Za-z_$][\w$]*)\s*:\s*\[\s*\n\s*\]/g, m;
        while ((m = re.exec(s)) !== null) out.push(m[1]);
        return out.length ? out : null;
    }

    /* the names of the groups of fields, in the order of the file (fields: { main: [...], ... }) */
    function groupOrderOf(js) {
        var i = String(js || '').search(/\n {4}fields\s*:\s*\{/);
        if (i < 0) return null;
        var s = String(js), start = i + (/\n {4}fields\s*:\s*\{/.exec(s.slice(i)) || [''])[0].length;
        var out = [], re = /^ {8}([A-Za-z_$][\w$]*)\s*:\s*\[/gm, m;
        re.lastIndex = start;
        while ((m = re.exec(s)) !== null) out.push(m[1]);
        return out.length ? out : null;
    }

    /* property order used by the ready made field objects */
    var FKEYS = ['key', 'label', 'type', 'parent', 'row', 'options', 'showIf', 'text', 'placeholder', 'step', 'min', 'max', 'default'];

    /* safe to paste into a template literal */
    function tplStr(html) {
        return String(html || '')
            .replace(/\\/g, '\\\\')
            .replace(/`/g, '\\`')
            .replace(/\$\{/g, '\\${');
    }

    /* one tag per line, quotes respected, inline text kept on the same line */
    function prettifyHtml(html) {
        var s = String(html || ''), out = '', depth = 0, i = 0, n = s.length, lastTag = true;
        while (i < n) {
            if (s.charAt(i) === '<') {
                var q = '', j = i + 1;
                while (j < n) {
                    var c2 = s.charAt(j);
                    if (q) { if (c2 === q) q = ''; }
                    else if (c2 === '"' || c2 === "'") q = c2;
                    else if (c2 === '>') break;
                    j++;
                }
                var tag = s.slice(i, j + 1);
                var closing = /^<\//.test(tag);
                var bare = /^<(input|img|br|hr|meta|link|area|source|track|wbr)\b/i.test(tag);
                if (closing) depth = Math.max(0, depth - 1);
                out += (!out ? '' : (lastTag ? '\n' + new Array(depth + 1).join('  ') : '')) + tag;
                if (!closing && !bare && !/\/>$/.test(tag)) depth++;
                lastTag = true;
                i = j + 1;
                continue;
            }
            out += s.charAt(i);
            if (s.charAt(i) !== '\n') lastTag = false;
            i++;
        }
        return out;
    }

    /* first {...} starting at/after `from`, parsed safely */
    function readObject(src, from) {
        var s = String(src || ''), i = s.indexOf('{', from || 0);
        if (i < 0) return null;
        var depth = 0, q = '', j = i;
        for (; j < s.length; j++) {
            var ch = s.charAt(j);
            if (q) { if (ch === q) q = ''; continue; }
            if (ch === '"' || ch === "'" || ch === '`') { q = ch; continue; }
            if (ch === '{') depth++;
            else if (ch === '}') { depth--; if (!depth) { j++; break; } }
        }
        var body = s.slice(i, j).replace(/;\s*$/, '').trim();
        if (!body) return null;
        try { return (new Function('return (' + body + ')'))(); } catch (e) { return null; }
    }

    function varName(type) {
        var s = String(type || 'widget').replace(/[^A-Za-z0-9_]/g, '_');
        if (!/^[A-Za-z_]/.test(s)) s = 'w_' + s;
        return s.charAt(0).toUpperCase() + s.slice(1) + 'Widget';
    }

    /* one field per line; a long option list is written one option per line, like map.js */
    function jsField(f) {
        var lit = jsLit(f);
        if (!Array.isArray(f.options) || f.options.length <= 4) return lit;
        var parts = Object.keys(f).map(function (k) {
            if (k !== 'options') return jsKey(k) + ': ' + jsLit(f[k], false);
            return 'options: [\n' + f.options.map(function (o) {
                return '                ' + jsLit(o, true) + ',';
            }).join('\n') + '\n            ]';
        });
        return '{ ' + parts.join(', ') + ' }';
    }

    /* true when the defaults of the model no longer match the text of the file */
    function defaultsChanged(m, raw) {
        /* the file could not be evaluated (it uses window.__t and other page helpers):
           keep its text until the model gets a key that the file does not have */
        if (m.defaultsRaw) {
            var ex0 = m.defaultsExtra || {}, w0 = defaultsOf(m);
            return Object.keys(w0).some(function (k) { return !Object.prototype.hasOwnProperty.call(ex0, k); });
        }
        var want = defaultsOf(m), txt = String(raw).replace(/^\s*defaults\s*:\s*/, '').replace(/;$/, '');
        var got;
        /* the text may use window.* helpers, so it is evaluated in the page scope when possible */
        try { got = (new Function('return (' + txt + ');'))(); } catch (e) {
            /* the text of the file could not be evaluated here (it uses window helpers):
               keep it until the model has a key that the file does not have */
            var ex = m.defaultsExtra || {};
            return Object.keys(want).some(function (k) { return !Object.prototype.hasOwnProperty.call(ex, k); });
        }
        if (typeof got === 'function') { try { got = got(); } catch (e2) { return true; } }
        if (!got || typeof got !== 'object') return true;
        return JSON.stringify(got) !== JSON.stringify(want);
    }

    /* Every name an expression leans on has to exist in the code, or the widget
       names a value nothing declares and it fails to render. The wizard knows the
       names, but it only runs on a button press, so the guarantee is made here,
       where the file is written: whatever the expressions need and the computed
       does not have yet is appended. Existing entries are never touched and a name
       is never written twice. */
    function ensureComputed(model) {
        if (!model || typeof model !== 'object') return;
        var m = normalizeModel(model);
        /* the icon components are marked before anything is written out: the name a
           component reads its value under has to be on the model by the time the
           markup and the code are built, or the two would count differently */
        markIconProps(m);
        /* whether any icon still follows the switch of the settings panel: decides if
           the helper that resolves that choice is needed at all */
        var followNeed = (m.appearance.items || []).some(function (it) {
            return it && it._t === 'icon' && iconFollowsWidget(it);
        });
        var wiz = wizard(m);
        var want = wiz.computed;
        var cur = String(model.code && model.code.computed || '');
        var merged = cur;
        if (String(want || '').trim()) {
            if (!cur.trim()) {
                merged = want;
            } else {
                var have = {}, re = /^\s*([A-Za-z_$][\w$]*)\s*:/gm, mm;
                while ((mm = re.exec(cur)) !== null) have[mm[1]] = 1;
                /* the section is taken apart by entries, not by lines: an entry is a
                   name and everything up to its own closing brace. Walking line by
                   line dropped the body of a multi line entry - the wizard writes
                   names on one line and the code of the entry below it - so the icon
                   of the module arrived as "dpbIconSrc: function () {" and nothing
                   more, and the widget had no value to show. */
                var add = [];
                entriesOf(want).forEach(function (e) {
                    if (have[e.name]) {
                        /* A name the generator owns is machine text even when it is
                           already there. Refreshing it is what lets a widget saved
                           before a change stop carrying the old version - skipping it
                           is what left "Press" where the path of the icon belonged.
                           "icon" joins them while the icon goes after the switch of
                           the panel: then it is not the field any more but the value
                           the switch resolved, and the name beside the icon has to
                           read the same one. A widget whose icon is bound to the
                           field keeps its own "icon" - there the field is the value. */
                        if (ownedName(e.name) || (e.name === 'icon' && followNeed)) merged = replaceEntry(merged, e.name, e.text.replace(/\s+$/, ''));
                        return;
                    }
                    have[e.name] = 1;
                    add.push(e.text.replace(/\s+$/, ''));
                });
                if (add.length) {
                    /* the section is kept as a body, one entry after another; a hand
                       written body may leave out the last comma */
                    var head = merged.replace(/\s+$/, '');
                    if (!/,\s*$/.test(head) && add.length) head += ',';
                    merged = head + '\n' + add.join('\n');
                }
            }
        }
        /* the caller keeps the model it passed in, so that is where the names go:
           normalizeModel builds a fresh object and its copy would be thrown away */
        if (!model.code || typeof model.code !== 'object') model.code = {};
        model.code.computed = merged;

        /* the icon of the module needs more than a computed name: the value of the
           property has to be read and kept somewhere, so the code also needs "values"
           in data, the loader in methods and the call in mounted. Only computed was
           merged above, and runWizard fills a section only while it is still empty,
           so a model whose sections already hold something never got these three and
           the written widget then read a value nothing had ever put there. They are
           added here, the same way: what the file already names is left alone. */
        var icon = iconNeeds(m);
        if (icon) {
            if (!hasName(model.code.data, 'values')) {
                model.code.data = addEntry(model.code.data,
                    '    values: {},');
            }
            if (!/loadDpbIcon\s*:/.test(String(model.code.methods || ''))) {
                model.code.methods = addEntry(model.code.methods,
                    '    loadDpbIcon: function () {\n' +
                    '        var self = this;\n' +
                    '        this.busy = true;\n' +
                    '        return dpAPI(\'getProperty?object=\' + encodeURIComponent(' + jsStr(icon.obj) + ') + \'&property=\' + encodeURIComponent(' + jsStr(icon.prop) + '))\n' +
                    '            .then(function (r) { if (r && !r.error) self.values[' + jsStr(icon.prop) + '] = r.value; })\n' +
                    '            .catch(function (e) { console.error(\'[dpb] loadDpbIcon\', e); })\n' +
                    '            .then(function () { self.busy = false; });\n' +
                    '    },');
            }
            if (!/loadDpbIcon\s*\(\s*\)/.test(String(model.code.mounted || ''))) {
                model.code.mounted = addEntry(model.code.mounted,
                    '    this.loadDpbIcon();', false);
            }
        }

        /* the same hole for an icon component on the canvas: bound to a field it
           calls dpbIsPic() from its own markup, and a model that already holds code
           never got the method - the widget would fail on the missing name and draw
           no icon at all. The entry is taken from wizard() instead of being written
           out again, so both places always agree. dpbPic() comes the same way: it is
           what reads the value of a property the icon is bound to. */
        entriesOf(wiz.methods).forEach(function (e) {
            if (e.name !== 'dpbIsPic' && e.name !== 'dpbPic') return;
            /* always from wizard(), which is where both places are written; a model
               that already holds a helper gets the current text, otherwise it keeps
               reading the field name where the value of the property should be */
            model.code.methods = replaceEntry(model.code.methods, e.name, e.text);
        });
        /* those helpers read from values, which a model with its own data may not have */
        if ((wiz.data || '').indexOf('values') >= 0 && !hasName(model.code.data, 'values')) {
            model.code.data = addEntry(model.code.data, '    values: {},');
        }

        /* A field of type "property" is only a NAME; the value the icon draws has to
           be read from the object. wizard() writes that loader, but it stayed in its
           own sections and never reached the file - the widget asked for a value
           nobody had ever fetched and so drew nothing. Only the pairs an icon really
           uses are brought over: a loader for a pair nothing reads would be code
           nobody asked for. The text is the wizard's own, so the two agree. */
        var wantProp = '';
        (m.appearance.items || []).forEach(function (it) {
            if (!it || it._t !== 'icon' || wantProp) return;
            wantProp = propertyKeyOf(m, bkey(it));
        });
        /* An icon on the icon_type switch asks for the value behind the property
           field of that row just as much as an icon bound straight to the field
           does - but it is bound to the switch, which is a select, so it was not
           seen here and the loader never reached the file. values then stayed
           empty and the icon drew the NAME of the property instead of what it
           holds. The switch is the one asking, so its row counts as a use. */
        var rowProp = '';
        if (!wantProp) {
            iconRowFields(m).forEach(function (f) {
                if (!rowProp && String(f.type) === 'property') rowProp = String(f.key);
            });
        }
        if (rowProp) wantProp = rowProp;
        if (wantProp) {
            /* the loader sets busy while it reads */
            if (!hasName(model.code.data, 'busy')) {
                model.code.data = addEntry(model.code.data, '    busy: false,');
            }
            (wiz.loaders || []).forEach(function (ld) {
                if (ld.prop !== wantProp) return;
                /* The first pair is loaded by a method simply called "load", and the
                   name belongs to whoever wrote it first. A widget that reads its own
                   value has an "async load()" of its own, and writing the loader over
                   that name took the widget's method away: after a save the method was
                   gone and the widget stopped reading anything. So a name that is
                   already taken by something else is not taken here - the loader is
                   written under a name of its own, and the calls in mounted follow it. */
                var ldName = ld.name, ldCode = ld.code, ldMounted = ld.mounted;
                if (takenByOther(model.code.methods, ldName)) {
                    ldName = freeName(model.code.methods, 'dpbLoad' + String(wantProp).replace(/[^A-Za-z0-9_$]/g, '_'));
                    ldCode = ldCode.map(function (t) {
                        return t.replace(ld.name + ':', ldName + ':');
                    });
                    ldMounted = ldMounted.map(function (t) {
                        return t.split('this.' + ld.name).join('this.' + ldName);
                    });
                }
                /* the object and the property are baked into the text of the loader,
                   so a model saved under different ones is refreshed too */
                model.code.methods = replaceEntry(model.code.methods, ldName, ldCode.join('\n'));
                ldMounted.forEach(function (t) {
                    if (String(model.code.mounted || '').indexOf(t) < 0) {
                        model.code.mounted = addEntry(model.code.mounted, t, false);
                    }
                });
            });
        }

        /* the same hole for an icon that follows a property of its own: the name it
           reads the value under and the loader that fills it are the same two pieces
           genSource writes, so a model whose code is already there gets them under
           their own names and not under the ones of another model */
        var ownDone = {}, ownNeed = {};
        (m.appearance.items || []).forEach(function (it) {
            var pr = it && it._t === 'icon' ? iconOwnPair(it) : null;
            if (!pr || !it._ico || ownDone[pr.prop]) return;
            ownDone[pr.prop] = 1;
            var ln = 'load' + it._ico.charAt(0).toUpperCase() + it._ico.slice(1);
            ownNeed[it._ico] = 1;
            ownNeed[ln] = 1;
            if (!hasName(model.code.data, 'values')) {
                model.code.data = addEntry(model.code.data, '    values: {},');
            }
            if (!hasName(model.code.data, 'busy')) {
                model.code.data = addEntry(model.code.data, '    busy: false,');
            }
            /* written out again every time: the object and the property are inside
               the text, and both come from the editor, where they do change */
            model.code.computed = replaceEntry(model.code.computed, it._ico,
                '    ' + it._ico + ': function () {\n' +
                '        var v = this.values[' + jsStr(pr.prop) + '];\n' +
                '        if (v === undefined || v === null) return \'\';\n' +
                '        return String(v).trim();\n' +
                '    },');
            model.code.methods = replaceEntry(model.code.methods, ln,
                '    ' + ln + ': function () {\n' +
                '        var self = this;\n' +
                '        this.busy = true;\n' +
                '        return dpAPI(\'getProperty?object=\' + encodeURIComponent(' + jsStr(pr.obj) + ') + \'&property=\' + encodeURIComponent(' + jsStr(pr.prop) + '))\n' +
                '            .then(function (r) { if (r && !r.error) self.values[' + jsStr(pr.prop) + '] = r.value; })\n' +
                '            .catch(function (e) { console.error(\'[dpb] ' + ln + '\', e); })\n' +
                '            .then(function () { self.busy = false; });\n' +
                '    },');
            var call = '    this.' + ln + '();';
            if (String(model.code.mounted || '').indexOf(call.trim()) < 0) {
                model.code.mounted = addEntry(model.code.mounted, call, false);
            }
        });
        /* what an earlier generation left for an icon that no longer follows a
           property of its own goes away with it, names and calls alike */
        var gone = function (name) {
            var mine = /^dpbIco[0-9]+$/.test(name) || /^loadDpbIco[0-9]+$/.test(name);
            if (mine) return !ownNeed[name];
            /* the helper of an icon that no longer follows the switch of the panel: dead
               code in the file is not harmless, and a widget that keeps it reads a
               setting nobody looks at any more */
            if (name === 'dpbWidgetIcon') return !followNeed;
            /* the loader of the icon of the module itself. It asks for the object and
               the property that were in the panel at some earlier moment, so once the
               panel names another pair it overwrites with a stale value what load()
               has just fetched correctly - the icon then shows a number from an object
               nobody picked any more. And the helper that reads it belongs to the same
               pair. Both go away with the pair. */
            if (name === 'loadDpbIcon' || name === 'dpbIconSrc') return !iconNeeds(m);
            /* the reader of a property the icon is bound to directly. Only such an
               icon has dpbPic() in its markup - one that goes after the switch asks
               dpbIsPic() and never touches this, so the icon row alone does not
               keep it alive */
            if (name === 'dpbPic') return !wantProp || !!rowProp;
            return false;
        };
        model.code.computed = dropEntries(model.code.computed, gone);
        model.code.methods = dropEntries(model.code.methods, gone);
        model.code.mounted = dropCalls(model.code.mounted, gone);
    }

    /* a body written by hand may leave out the last comma, so one is put back
       before the entry is appended */
    /* adds one entry to a generated section. The sections of the options are an
       object literal, so they are separated by a comma; "mounted" is a list of
       statements, and a comma there is not punctuation but a syntax error. */
    function addEntry(body, entry, sep) {
        var head = String(body || '').replace(/\s+$/, '');
        if (!head.trim()) return entry;
        if (sep !== false && !/,\s*$/.test(head)) head += ',';
        return head + '\n' + entry;
    }

    /* Replaces one whole entry by its name. A model that was saved already carries
       the object and the property inside the code, so when either of them changes
       the entry has to be written out again: appending a second one would leave the
       widget with two loaders, and the first would keep asking about the property
       the icon no longer follows. Entries are put back one by one, so a hand
       written neighbour around it is not touched. */
    /* The names the generator writes for itself. A model saved before an improvement
       keeps the older copy of one of them forever: the sections are merged by adding
       what is missing, never by taking the newer text of a name that is already
       there. A widget generated before the fix therefore could not be healed by
       regenerating it - the new code was there and simply never arrived. Anything
       named this way is machine text and is rewritten from the wizard; a name of the
       user's own is left exactly as it is. */
    function ownedName(n) {
        return /^dpb[A-Z0-9_$]/.test(n) || /^load[A-Z0-9_$]/.test(n) || /^set[A-Z0-9_$]/.test(n) ||
            n === 'load' || n === 'set';
    }

    function replaceEntry(body, name, text) {
        var es = entriesOf(body), at = -1, i;
        for (i = 0; i < es.length; i++) if (es[i].name === name) { at = i; break; }
        if (at < 0) return addEntry(body, text);
        /* The one entry is cut out of the text as it stands and the rest is left
           byte for byte. Writing the block back from the parsed entries instead
           would quietly drop everything the parser did not recognise - and then the
           file lost its async methods on every save, because the entry being
           replaced was already there from the previous one. */
        var lines = String(body || '').split('\n');
        var out = lines.slice(0, es[at].start).concat(lines.slice(es[at].end)).join('\n');
        return addEntry(out, text);
    }

    /* Drops the entries a name turns true for. Used to take out what an earlier
       generation left behind when the icon does not follow a property any more:
       dead code in the file is not harmless, a loader for a pair nothing reads
       still asks the object on every start. */
    /* The entries that go are cut out of the text as it stands, and the rest is left
       byte for byte. Writing the block back from the parsed entries instead quietly
       dropped everything the parser did not recognise - a method written as
       "async toggle() { }" arrived as the tail of a multiline call, and the widget
       was left with "object: obj" where a method used to be: that is a name the file
       cannot run, so the widget vanished from the panel. */
    function dropEntries(body, drop) {
        var es = entriesOf(body), cut = [], any = false, i;
        for (i = 0; i < es.length; i++) if (drop(es[i].name)) { cut.push(es[i]); any = true; }
        if (!any) return body;
        var lines = String(body || '').split('\n'), keep = [], n = 0;
        for (i = 0; i < lines.length; i++) {
            while (cut.length && cut[0].start === i) n = Math.max(n, cut[0].end), cut.shift();
            if (i < n) continue;
            keep.push(lines[i]);
        }
        return keep.join('\n');
    }

    /* The calls in mounted are statements, not entries, so they are taken out line
       by line. A call to a loader that is no longer there would fail on every start
       with "not a function" and take the whole widget down with it. */
    function dropCalls(body, drop) {
        var lines = String(body == null ? '' : body).split('\n'), out = [], any = false;
        lines.forEach(function (l) {
            var m = /^\s*this\.(load[A-Za-z0-9_$]*)\s*\(\s*\)\s*;?\s*$/.exec(l);
            if (m && drop(m[1])) { any = true; return; }
            out.push(l);
        });
        return any ? out.join('\n') : body;
    }

    /* splits a generated section into whole entries: the line that opens a name and
       every line up to and including the line where its braces close again. Braces
       inside a string or a regular expression do not count. */
    /* An entry of an object written as a method, not as "name: value":
         async toggle() { ... }
       is a normal way to write methods, and every ready made widget uses it. Reading
       only "name:" left those lines unrecognised, and replaceEntry() rebuilds a block
       from what it recognised - so the methods it did not know were dropped from the
       file on save, silently, while the widget kept every name the template calls.
       start/end are the lines the entry occupies, so a caller can cut it out of the
       original text and leave everything it could not parse exactly as it was. */
    var ENTRY_OPEN = /^\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*(?::|\(\s*\)\s*\{)/;

    function entriesOf(text) {
        var out = [], name = '', buf = [], depth = 0, opened = false, start = 0, li = 0;
        String(text || '').split('\n').forEach(function (l) {
            var at = li++;
            if (!opened) {
                var k = ENTRY_OPEN.exec(l);
                if (!k) return;
                name = k[1];
                buf = [l];
                opened = true;
                start = at;
                depth = 0;
            } else {
                buf.push(l);
            }
            depth += bracesIn(l);
            /* one line entry "name: function () { return x; }," - no brace balance
               to wait for, the line itself ends the name */
            if (depth <= 0) {
                out.push({ name: name, text: buf.join('\n'), start: start, end: at + 1 });
                opened = false;
                buf = [];
            }
        });
        if (opened) out.push({ name: name, text: buf.join('\n'), start: start, end: li });
        return out;
    }

    function bracesIn(line) {
        var d = 0, q = null;
        for (var i = 0; i < line.length; i++) {
            var c = line[i];
            if (q) {
                if (c === '\\') { i++; continue; }
                if (c === q) q = null;
                continue;
            }
            if (c === '\'' || c === '"') { q = c; continue; }
            /* a line comment runs to the end of the line */
            if (c === '/' && line[i + 1] === '/') break;
            if (c === '{') d++;
            else if (c === '}') d--;
        }
        return d;
    }

    function hasName(body, name) {
        return new RegExp('(^|[\\s{,])' + name + '\\s*:').test(String(body || ''));
    }

    /* A name for a loader the generator has to add where the plain one is spoken for.
       The name of a method in a widget is free text and the property it reads can be
       named anything, so the name is built from the property and then made to be a
       name that is not in use yet. */
    function freeName(body, base) {
        var n = base.replace(/[^A-Za-z0-9_$]/g, '_'), i = 2, e;
        while (hasName(body, n)) n = base.replace(/[^A-Za-z0-9_$]/g, '_') + (i++);
        if (hasName(body, n)) { e = entriesOf(body).length; n = 'dpbLoad' + e; }
        return n;
    }

    /* Whether a name in the file is used by something the generator did not write.
       The generator takes a name for itself when nothing else in the widget has it,
       and looks for it by name alone - which is why "load", a name an ordinary widget
       gives its own method, has to be checked before it is written over. An entry
       that only mentions the value and the object the way a loader does is one the
       generator wrote earlier and may be refreshed; anything else belongs to the
       widget and is left alone. */
    function takenByOther(body, name) {
        var es = entriesOf(body), i, e;
        for (i = 0; i < es.length; i++) {
            e = es[i];
            if (e.name !== name) continue;
            return !/this\.values\[|self\.values\[/.test(e.text);
        }
        return false;
    }

    function jsStr(s) { return '\'' + String(s).replace(/\\/g, '\\\\').replace(/'/g, '\\\'') + '\''; }

    /* the object and the property the icon of the module follows */
    function iconNeeds(m) {
        var a = m && m.appearance;
        if (!a || String(a.iconType || '') !== 'property') return null;
        if (!a.iconObject || !a.iconProperty) return null;
        return { obj: String(a.iconObject), prop: String(a.iconProperty) };
    }

    function genSource(model) {
        ensureComputed(model);
        var m = normalizeModel(model);
        var vn = (m.imported && m.srcVar) ? m.srcVar : varName(m.type);
        var c = m.code;
        var imported = !!m.imported;
        function has(k) { return String(c[k] || '').trim() !== ''; }

        var tplText = (typeof m.appearance.html === 'string' && m.appearance.html.trim() !== '')
            ? m.appearance.html
            : prettifyHtml(appearanceTemplate(m));
        tplText = String(tplText).replace(/^\s*\n/, '').replace(/\s+$/, '');

        var B = {};
        B.props = '    props: [\'widget\']';
        /* defaults of a ready made widget are written by hand - the text is kept until they are changed */
        var defLit = jsLit(defaultsOf(m));
        B.defaults = (imported && m.srcDefaults && !defaultsChanged(m, m.srcDefaults))
            ? m.srcDefaults
            : '    defaults: ' + defLit;

        var tabObjs = m.settings.tabs.map(function (tb) {
            var ord = Array.isArray(tb._ord) ? tb._ord : [];
            /* a tab of the file keeps exactly the keys it had - some of them have no "fields" */
            var o = { key: tb.key, label: tb.label };
            if (!imported || ord.indexOf('fields') >= 0) o.fields = tb.fields || tb.key;
            ord.forEach(function (n) {
                if ((n === 'key' || n === 'label' || n === 'fields') && o[n] !== undefined) return;
                if (tb[n] !== undefined && o[n] === undefined) o[n] = tb[n];
            });
            return o;
        });
        B.tabs = tabObjs.length
            ? ['    tabs: ['].concat(tabObjs.map(function (t, i) {
                var last = m.tabsNoTail && (i + 1 === tabObjs.length);
                return '        ' + jsLit(t) + (last ? '' : ',');
            })).concat(['    ]']).join('\n')
            : '';

        /* the file lists the groups of fields in its own order, and only those it has */
        var fld = fieldsOf(m);
        var gk = Object.keys(fld);
        if (imported && Array.isArray(m.srcGroups) && m.srcGroups.length) {
            gk = m.srcGroups.filter(function (g) { return gk.indexOf(g) >= 0; });
            gk.forEach(function (g) { if (fld[g] === undefined) fld[g] = []; });
        }
        var openGroups = (imported && Array.isArray(m.srcOpenGroups)) ? m.srcOpenGroups : [];
        B.fields = gk.length
            ? ['    fields: {'].concat(gk.map(function (g) {
                var list = fld[g] || [];
                if (!list.length) {
                    return openGroups.indexOf(g) >= 0
                        ? ['        ' + jsKey(g) + ': [', '        ],'].join('\n')
                        : '        ' + jsKey(g) + ': [],';
                }
                return ['        ' + jsKey(g) + ': [']
                    .concat(list.map(function (f) { return '            ' + jsField(f) + ','; }))
                    .concat(['        ],']).join('\n');
            })).concat(['    }']).join('\n')
            : '';

        /* the closing backtick stands on the last tag line in every ready made widget */
        var tplOneLine = !tplText || tplText.indexOf('\n') < 0;
        B.template = !tplText ? '    template: ``'
            : (tplOneLine ? '    template: `' + tplStr(tplText) + '`'
                : '    template: `\n' + ind(tplStr(tplText), 8) + '`');

        /* the body of data() keeps the indent of the file; a new one gets the usual 12 */
        function dataBody() {
            var raw = String(c.data || '').replace(/\s+$/, '');
            if (!raw) return '';
            if (raw.indexOf('\n') < 0) return (/^\s/.test(raw) ? '' : ' ') + raw;
            return /^\s/.test(raw) ? raw : ind(raw, 12);
        }
        /* a method keeps the shape it has in the file: one line or a block, and its indent */
        function isOneLine(name, txt) {
            if (imported) return !!((m.oneLine || {})[name]);
            return txt.indexOf('\n') < 0;
        }
        function methodIndent(name) {
            var v = (m.indent || {})[name];
            return (typeof v === 'number' && v > 0) ? v : 8;
        }

        var hadData = imported && Array.isArray(m.srcOrder) && m.srcOrder.indexOf('data') >= 0;
        var dataRaw = String(c.data || '').replace(/\s+$/, '');
        if (!has('data') && !has('dataPre') && !hadData) B.data = '';
        else if (!has('dataPre') && !dataRaw.trim()) B.data = '    data() { return {}; }';
        else if (!has('dataPre') && isOneLine('data', dataRaw)) {
            B.data = '    data() { return {' + dataBody() + ' }; }';
        } else if (m.dataInline) {
            /* graph.js writes `data() { return {` and closes the statement on the same line as the brace */
            B.data = ['    data() { return {', dataBody(), '    }; }'].join('\n');
        } else {
            var dl = [];
            if (has('dataPre')) dl.push(ind(c.dataPre, 8));
            if (dataRaw) {
                if (dataRaw.indexOf('\n') < 0) dl.push('        return {' + dataBody() + ' };');
                else dl.push('        return {', dataBody(), '        };');
            }
            if (!dl.length) dl.push('        return {};');
            B.data = ['    data() {'].concat(dl).concat(['    }']).join('\n');
        }

        /* the code sections are written exactly as they are written in the file */
        function code(name, head, txt) {
            var src = txt !== undefined ? txt : String(c[name] || '');
            var text = String(src).replace(/^\s*\n/, '').replace(/\s+$/, '');
            if (!text.trim()) return '';
            var pad = methodIndent(name);
            /* the block itself may sit deeper than the other blocks of the file */
            var hp = (m.headIndent && typeof m.headIndent[name] === 'number') ? m.headIndent[name] : 4;
            var hs = new Array(hp + 1).join(' ');
            if (/\(\)$/.test(head) && isOneLine(name, text)) {
                /* a one line method, like beforeUnmount() { ... } */
                return hs + head + ' {' + (/^\s/.test(text) ? '' : ' ') + text + ' }';
            }
            if (!/^\s/.test(text.split('\n')[0])) text = ind(text, pad);
            return [hs + head + ' {', text, hs + '}'].join('\n');
        }
        B.computed = code('computed', 'computed:');
        B.watch = code('watch', 'watch:');
        B.mounted = code('mounted', 'mounted()');
        B.beforeUnmount = code('beforeUnmount', 'beforeUnmount()');
        B.methods = code('methods', 'methods:', methodsTextOf(m));

        /* a widget that has no design in the builder must not grow tabs/fields/defaults in the file */
        if (imported && Array.isArray(m.srcOrder) && m.srcOrder.length) {
            ['props', 'defaults', 'tabs', 'fields'].forEach(function (k) {
                if (m.srcOrder.indexOf(k) < 0) B[k] = '';
            });
        }
        /* blocks the builder does not know are written back as they are, at their place */
        var order = (imported && Array.isArray(m.srcOrder) && m.srcOrder.length) ? m.srcOrder.slice() : SRC_BLOCKS.slice();
        if (imported && Array.isArray(m.srcExtra) && m.srcExtra.length) {
            var pos = Math.max(0, order.indexOf('props'));
            m.srcExtra.forEach(function (x) { order.splice(pos, 0, '__x:' + x.name); pos++; });
        }
        var parts = order.filter(function (k) {
            if (k.indexOf('__x:') === 0) {
                var x = extraBy(k.slice(4));
                return x ? String(x.text || '').trim() !== '' : false;
            }
            return !!B[k];
        }).map(function (k) {
            if (k.indexOf('__x:') === 0) {
                var x = extraBy(k.slice(4));
                /* the parts are joined with commas, the text of the file already has them */
                return String((x && x.text) || '').replace(/\s+$/, '').replace(/,$/, '');
            }
            return B[k];
        });
        function extraBy(name) {
            var out = null;
            (m.srcExtra || []).forEach(function (y) { if (y.name === name && !out) out = y; });
            return out;
        }
        /* a block that the file did not have yet goes after the ones it did have */
        SRC_BLOCKS.forEach(function (k) { if (B[k] && parts.indexOf(B[k]) < 0) parts.push(B[k]); });

        var out = ['const ' + vn + ' = {', parts.join(',\n') + (m.lastComma && parts.length ? ',' : ''), '};', ''];
        out.push('window.DpWidgets = window.DpWidgets || {};');
        /* the file may address the widget with a dot or with a quoted key - keep it */
        var wkey = (imported && m.srcKey) ? m.srcKey
            : (/^[A-Za-z_$][\w$]*$/.test(m.type) ? '.' + m.type : '[' + jsStr(m.type) + ']');
        out.push('window.DpWidgets' + wkey + ' = ' + vn + ';');
        if (!imported) {
            /* a widget made in the builder keeps its design model in the file: it is needed to reopen it */
            out.push('');
            out.push('/* design model of the visual builder (needed to reopen it, safe to keep) */');
            out.push('window.DpBuilderModels = window.DpBuilderModels || {};');
            out.push('window.DpBuilderModels[' + JSON.stringify(m.type) + '] = ' + JSON.stringify(m) + ';');
        }
        out.push('');
        /* some of the files do not end with a line break */
        if (imported && m.eof === false) out.pop();
        var text = out.join('\n');
        /* the file is written with the line endings it had */
        var eol = m.eol || '\n';
        return eol === '\n' ? text : text.replace(/\n/g, eol);
    }

    function parseSource(js) {
        if (!js || typeof js !== 'string') return null;
        var obj = null;

        /* current format: window.DpBuilderModels["type"] = {...}; */
        var idx = js.lastIndexOf('DpBuilderModels[');
        if (idx >= 0) {
            var eq = js.indexOf('=', idx);
            if (eq > 0) obj = readObject(js, eq + 1);
        }

        /* legacy format: DPMODEL-BEGIN / DPMODEL-END */
        if (!obj) {
            var mm = js.match(/\/\*\s*DPMODEL-BEGIN\s*\*\/([\s\S]*?)\/\*\s*DPMODEL-END\s*\*\//);
            if (mm) obj = readObject(mm[1], 0);
        }

        var model = (obj && typeof obj === 'object') ? normalizeModel(obj) : null;
        /* The markup of the canvas calls helpers of the builder: dpbIsPic() tells a glyph
           from a picture, the loaders of a property read what an icon is bound to. They
           are written by genSource() when the code is generated, so a file saved before
           them - or one whose code was written by hand - carries the markup without the
           method. The render then throws on the missing name and the preview of the code
           mode comes out empty, while the visual canvas still shows everything. The same
           repair the save does, run while the model is read, so the code the editor shows
           is the code the widget really runs. */
        if (model) ensureComputed(model);
        return model;
    }

    /* ---- balanced block reader (works for ready made widget files too) ---- */

    /* the raw text of a top level block, e.g. `defaults: { ... }` exactly as the file writes it */
    function rawBlockOf(js, name) {
        var s = String(js || '');
        var re = new RegExp('(?:^|\\n) {4}' + name + '\\s*[:(]');
        var m = re.exec(s);
        if (!m) return '';
        var from = m.index + (m[0].charAt(0) === '\n' ? 1 : 0);
        var colon = s.indexOf(':', from);
        /* the value starts after ": " - it may be an object or a function returning one */
        var rest = s.slice(colon + 1);
        var arrow = /^\s*\(?\s*[^()\n]*\s*\)?\s*=>\s*/.exec(rest);
        var val = arrow ? colon + 1 + arrow[0].length : colon + 1;
        while (val < s.length && /\s/.test(s.charAt(val))) val++;
        var wrap = '', ch = s.charAt(val);
        /* the value may be wrapped in parentheses: `defaults: () => ({ ... })` */
        if (ch === '(') {
            var inner = val + 1;
            while (inner < s.length && /\s/.test(s.charAt(inner))) inner++;
            if (s.charAt(inner) === '{') { val = inner; ch = '{'; wrap = ')'; }
        }
        if (ch !== '{') return '';
        var end = blockEnd(s, val), k = end;
        /* `({ ... })` - the block ends with the parenthesis, not with the brace */
        if (wrap === ')') {
            while (k < s.length && /[ \t]/.test(s.charAt(k))) k++;
            if (s.charAt(k) === ')') k++;
        }
        return s.slice(from, k);
    }

    function blockEnd(s, i) {
        var depth = 0, q = '', j = i, last = '';
        for (; j < s.length; j++) {
            var ch = s.charAt(j);
            if (q) {
                if (ch === '\\') { j++; continue; }
                if (ch === q) { q = ''; last = ch; }
                continue;
            }
            if (ch === '"' || ch === "'" || ch === '`') { q = ch; continue; }
            if (ch === '/' && s.charAt(j + 1) === '/') { var e = s.indexOf('\n', j); j = (e < 0 ? s.length : e); continue; }
            if (ch === '/' && s.charAt(j + 1) === '*') { var e2 = s.indexOf('*/', j); j = (e2 < 0 ? s.length : e2 + 1); last = '*'; continue; }
            if (ch === '/' && last && !/[)\]}A-Za-z0-9_$]/.test(last)) {
                /* regex literal: skip it, otherwise "\/\//" looks like a comment */
                var k = j + 1, cls = false;
                while (k < s.length) {
                    var rc = s.charAt(k);
                    if (rc === '\\') { k += 2; continue; }
                    if (rc === '[') cls = true;
                    else if (rc === ']') cls = false;
                    else if (rc === '/' && !cls) break;
                    else if (rc === '\n') break;
                    k++;
                }
                j = (k < s.length && s.charAt(k) === '/') ? k : j;
                last = '/';
                continue;
            }
            if (/\s/.test(ch)) continue;
            if (ch === '{') depth++;
            else if (ch === '}') { depth--; if (!depth) return j + 1; }
            last = ch;
        }
        return s.length;
    }

    function propBody(src, name) {
        /* top level property of the component literal: `computed: { ... }` */
        var re = new RegExp('(?:^|\\n)[ \\t]*' + name + '[ \\t]*:', 'g');
        var m = re.exec(src);
        if (!m) return '';
        var i = m.index + m[0].length;
        while (i < src.length && /[\s]/.test(src.charAt(i))) i++;
        if (src.charAt(i) === '{') return trimCode(src.slice(i + 1, blockEnd(src, i) - 1));
        return '';
    }

    function methodBody(src, name) {
        /* `mounted() { ... }` */
        var re = new RegExp('(?:^|\\n)[ \\t]*' + name + '[ \\t]*\\(\\s*\\)[ \\t]*\\{');
        var m = re.exec(src);
        if (!m) return '';
        var i = m.index + m[0].length - 1;
        return trimCode(src.slice(i + 1, blockEnd(src, i) - 1));
    }

    /* the body of a method block as it is written, without any trimming */
    function methodRaw(src, name) {
        var re = new RegExp('(?:^|\\n)[ \\t]*' + name + '[ \\t]*\\(\\s*\\)[ \\t]*\\{');
        var m = re.exec(src);
        if (!m) return null;
        var i = m.index + m[0].length - 1;
        return src.slice(i + 1, blockEnd(src, i) - 1);
    }

    function dataParts(src) {
        /* data() may contain code before "return" (locals, guards) - it must be kept */
        var fn = methodBody(src, 'data');
        if (fn) {
            var rm = /(^|[\s;{])return\s*\{/.exec(fn);
            if (rm) {
                var i = rm.index + rm[0].length - 1;
                /* the body keeps the indent of the file, so it can be written back as it is */
                return {
                    pre: fn.slice(0, rm.index + rm[1].length).trim(),
                    body: trimCode(fn.slice(i + 1, blockEnd(fn, i) - 1))
                };
            }
            return { pre: '', body: fn };
        }
        return { pre: '', body: propBody(src, 'data') };
    }

    function readTemplateStr(src) {
        var re = /(?:^|[\s,{])template\s*:/g;
        var m = null, mm;
        while ((mm = re.exec(src)) !== null) {
            var i = mm.index + mm[0].length;
            while (i < src.length && /\s/.test(src.charAt(i))) i++;
            var q = src.charAt(i);
            if (q !== '`' && q !== "'" && q !== '"') continue;
            var k = i + 1, buf = '';
            while (k < src.length) {
                var ch = src.charAt(k);
                if (ch === '\\') { buf += ch + src.charAt(k + 1); k += 2; continue; }
                if (ch === q) break;
                buf += ch; k++;
            }
            var lit = src.slice(i, k + 1);
            try { m = { value: (new Function('return ' + lit + ';'))(), raw: lit }; } catch (e) { m = { value: buf, raw: lit }; }
            break;
        }
        return m;
    }

    function extractCode(js) {
        if (!js || typeof js !== 'string') return null;
        var d = dataParts(js);
        return {
            dataPre: d.pre,
            data: d.body,
            computed: propBody(js, 'computed'),
            methods: propBody(js, 'methods'),
            mounted: methodBody(js, 'mounted'),
            watch: propBody(js, 'watch'),
            beforeUnmount: methodBody(js, 'beforeUnmount')
        };
    }

    /* ---- turn the code sections of a model into real option objects ---- */

    function codeToOptions(model) {
        var m = normalizeModel(model), c = m.code || {}, out = {};
        /* computed/methods/watch hold the inner text of an object literal */
        function objOf(code) {
            var s = String(code || '').trim().replace(/,\s*$/, '');
            if (!s) return null;
            try {
                var v = (new Function('return ({' + s + '\n});'))();
                return (v && typeof v === 'object') ? v : null;
            } catch (e) { return null; }
        }
        var cp = objOf(c.computed); if (cp) out.computed = cp;
        var mt = objOf(methodsTextOf(m)); if (mt) out.methods = mt;
        var wt = objOf(c.watch); if (wt) out.watch = wt;
        var pre = String(c.dataPre || '').trim();
        var body = String(c.data || '').trim();
        if (pre || body) {
            try {
                out.data = (new Function('return function(){' + (pre ? pre + '\n' : '') + 'return {' + body + '};' + '\n};'))();
            } catch (e) { /* invalid user code: the editor shows the error */ }
        }
        ['mounted', 'beforeUnmount'].forEach(function (k) {
            var s = String(c[k] || '').trim();
            if (!s) return;
            try { out[k] = (new Function(s)); } catch (e) { /* ignore */ }
        });
        return out;
    }

    /* ---- import of a ready made widget file into the builder model ---- */

    function dedentHtml(s) {
        var lines = String(s || '').replace(/\r\n/g, '\n').replace(/^\n+/, '').replace(/\s+$/, '').split('\n');
        var min = Infinity;
        lines.forEach(function (l) {
            if (!l.trim()) return;
            var n = l.length - l.replace(/^[ \t]+/, '').length;
            if (n < min) min = n;
        });
        if (!isFinite(min) || !min) return lines.join('\n');
        return lines.map(function (l) { return l.slice(min); }).join('\n');
    }

    /* the code sections of the file carry the indent of the file, the editor shows
       them from the first column; the saved text gets the indent back */
    function blockIndent(s) {
        var lines = String(s || '').replace(/\r\n/g, '\n').split('\n');
        var min = Infinity;
        lines.forEach(function (l) {
            if (!l.trim()) return;
            var n = l.length - l.replace(/^[ \t]+/, '').length;
            if (n < min) min = n;
        });
        return isFinite(min) ? min : 0;
    }
    function dedentBlock(s) {
        var min = blockIndent(s);
        if (!min) return String(s || '');
        return String(s || '').split('\n').map(function (l) {
            return l.trim() ? l.slice(min) : l;
        }).join('\n');
    }
    function reindentBlock(edited, raw) {
        var min = blockIndent(raw);
        if (!min) return String(edited || '');
        return String(edited || '').split('\n').map(function (l) {
            return l.trim() ? new Array(min + 1).join(' ') + l : l;
        }).join('\n');
    }

    function fieldFromWidget(f) {
        var o = newField(f && f.type ? f.type : 'text');
        if (!f || typeof f !== 'object') return o;
        /* the order of the properties in the original file */
        o._ord = Object.keys(f);
        Object.keys(f).forEach(function (k) {
            if (k === 'options') return;
            o[k] = f[k];
        });
        if (Object.prototype.hasOwnProperty.call(f, 'default')) o._hasDefault = true;
        if (Array.isArray(f.options)) {
            o.options = f.options.map(function (x) {
                if (x && typeof x === 'object') return x.value + '|' + x.label;
                return String(x);
            }).join('\n');
        }
        return o;
    }

    /* the description of a widget file: the tabs, the fields and the defaults are
       written in the file itself, so a file can be read without installing it */
    function componentOf(js) {
        if (!js || typeof js !== 'string') return null;
        var win = { DpWidgets: {}, DpBuilderModels: {} };
        try {
            new Function('window', js + '\n;return window.DpWidgets;')(win);
        } catch (e) { return null; }
        var out = null;
        for (var k in win.DpWidgets) {
            if (!Object.prototype.hasOwnProperty.call(win.DpWidgets, k)) continue;
            var c = win.DpWidgets[k];
            if (c && (c.tabs || c.fields || c.defaults)) { out = c; break; }
        }
        return out;
    }

    function importSource(js, opts) {
        if (!js || typeof js !== 'string') return null;
        opts = opts || {};
        /* the file may come with windows line endings - remember them and work with \n */
        var eol = /\r\n/.test(js) ? '\r\n' : '\n';
        js = js.replace(/\r\n/g, '\n');
var tpl = readTemplateStr(js);
   if (!tpl) return null;
   var m = newModel(opts.type || 'widget');
   /* The starter comes with its two standard blocks: an icon and a name next to it.
      A widget brought in from a file has no such blocks - its markup is its own, and
      it is put into appearance.html right below. So the starter's blocks are dropped
      here: while they stood, the canvas was not empty, and the live preview of the
      widget is shown only while the canvas is empty - what was on screen was two
      blocks to edit instead of the widget itself, and saving wrote those two blocks
      where the file's own template had been. */
   m.appearance.items = [];
   m.imported = true;
        if (opts.title) m.title = opts.title;
        if (opts.icon) m.icon = opts.icon;
        m.description = opts.description || '';
        m.appearance.html = dedentHtml(tpl.value == null ? '' : tpl.value);
        var code = extractCode(js) || {};
        ['dataPre', 'data', 'computed', 'methods', 'mounted', 'watch', 'beforeUnmount'].forEach(function (k) {
            m.code[k] = code[k] || '';
        });
        /* graph.js writes `data() { return {` - the return stays on the line of the brace */
        var draw = methodRaw(js, 'data');
        m.dataInline = !!(draw && draw.indexOf('\n') >= 0 && /return/.test(draw.split('\n')[0]));
        /* methods written on a single line, like `beforeUnmount() { ... },` */
        m.oneLine = {};
        ['data', 'mounted', 'beforeUnmount'].forEach(function (n) {
            var r = methodRaw(js, n);
            m.oneLine[n] = !!(r && r.indexOf('\n') < 0);
        });
        m.indent = {};
        ['dataPre', 'data', 'computed', 'methods', 'watch', 'mounted', 'beforeUnmount'].forEach(function (n) {
            var r = methodRaw(js, n);
            if (!r) return;
            var fl = r.split('\n').filter(function (l) { return l.trim() !== ''; })[0];
            if (!fl) return;
            m.indent[n] = fl.length - fl.replace(/^[ \t]+/, '').length;
        });
        /* some files write a top level method with a deeper indent (stream.js beforeUnmount) */
        m.headIndent = {};
        ['data', 'computed', 'watch', 'mounted', 'beforeUnmount', 'methods'].forEach(function (n) {
            var mm = new RegExp('(?:^|\\n)( *)(?:' + n + '\\s*[:(])').exec(js);
            if (mm) m.headIndent[n] = mm[1].length;
        });
        /* a widget may define its defaults as a function: `defaults: () => ({ ... })` */
        var defs = opts.defaults;
        if (typeof defs === 'function') { try { defs = defs(); } catch (e) { defs = null; } }
        if (!defs || typeof defs !== 'object') {
            /* the component was not evaluated (no window in the sandbox): read the text of the file */
            var dr = rawBlockOf(js, 'defaults');
            var dtxt = dr.replace(/^\s*defaults\s*:\s*/, '').replace(/^async\s+/, '').replace(/\s*=>\s*/, ' ');
            if (/^ /.test(dtxt) && /\}\s*$/.test(dtxt.replace(/;$/, ''))) {
                try { defs = (new Function('return ' + dtxt.replace(/;$/, '')))(); } catch (e2) { defs = null; }
                if (defs && typeof defs === 'function') { try { defs = defs(); } catch (e3) { defs = null; } }
            }
        }
        m.defaultsExtra = (defs && typeof defs === 'object') ? JSON.parse(JSON.stringify(defs)) : {};
        /* the file could not be evaluated: keep the text so that it is written back unchanged */
        if (!Object.keys(m.defaultsExtra).length) {
            m.srcDefaults = rawBlockOf(js, 'defaults');
            m.defaultsRaw = true;
        }
        var fw = (opts.fields && typeof opts.fields === 'object') ? opts.fields : {};
        var tabs = (Array.isArray(opts.tabs) && opts.tabs.length) ? opts.tabs : [{ key: 'main', label: 'tab_main', fields: 'params' }];
        var dv = m.defaultsExtra || {};
        m.settings.tabs = tabs.map(function (tb, i) {
            var list = fw[tb.fields || tb.key] || fw[tb.key] || [];
            var o = {
                key: tb.key || ('tab' + (i + 1)),
                label: tb.label || ('tab_main'),
                items: (Array.isArray(list) ? list : []).map(fieldFromWidget)
            };
            /* the name of the fields group and the property order of the original file */
            o.fields = tb.fields || tb.key || o.key;
            o._ord = Object.keys(tb);
            /* a tab that only declares the key of a core section (`graphs: []`) is shown with its
               system field, exactly as if it had been dragged from the settings fields panel */
            var sec = systemTabOf({ key: tb.key });
            if (sec && !o.items.length) o.items.push(systemField(sec, dv[sec.field]));
            return o;
        });
        m.srcOrder = blockOrderOf(js);
        m.srcExtra = extraBlocksOf(js);
        m.srcGroups = groupOrderOf(js);
        m.srcOpenGroups = openGroupsOf(js);
        /* defaults are written by hand in the file (JSON.stringify, arrow functions) - keep the text */
        m.srcDefaults = rawBlockOf(js, 'defaults');
        /* the last tab of a file may have no trailing comma */
        m.tabsNoTail = tabsTailOf(js) === false;
        m.lastComma = lastBlockComma(js);
        m.eol = eol;
        /* the file may end without a line break */
        m.eof = /\n$/.test(js);
        /* the widget keeps the name of its component variable (AcRemoteWidget, ...) */
        var last = null, lastKey = '', re = /window\.DpWidgets(\.[A-Za-z_$][\w$]*|\[['"][^'"]+['"]\])\s*=\s*([A-Za-z_$][\w$]*)\s*;/g, mm;
        while ((mm = re.exec(js)) !== null) { last = mm[2]; lastKey = mm[1]; }
        if (last) { m.srcVar = last; m.srcKey = lastKey; }
        if (defs && defs.height) m.appearance.height = Number(defs.height) || m.appearance.height;
        /* the widget brings its own layout: no builder padding/radius around it */
        m.appearance.pad = 0;
        m.appearance.radius = 0;
        return m;
    }

    function trimCode(s) {
        return String(s || '').replace(/^\s*\n/, '').replace(/\s+$/, '');
    }

    /* ------------------------------------------------------------------ */
    /* code wizard                                                          */
    /* ------------------------------------------------------------------ */

    /* the code wizard builds the sections from the data the designer already has:
       every key comes from the appearance items and from the settings panel */
    function wizard(model) {
        var m = normalizeModel(model);
        var data = [], computed = [], methods = [], mounted = [], cleanup = [];

        /* the elements the user can change: the generated code reacts to them */
        var CONTROL = {
            input: 1, textarea: 1, number: 1, checkbox: 1, switch: 1,
            slider: 1, color: 1, datetime: 1, select: 1, radio: 1
        };
        function id(k) { return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(String(k || '')) ? String(k) : ''; }
        function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
        function path(key) { return 'this.widget.' + key; }

        /* --- 1. the settings panel --- */
        var fields = [];
        m.settings.tabs.forEach(function (tb) {
            (tb.items || []).forEach(function (f) {
                if (!f || f._sys || !id(f.key)) return;
                fields.push({ key: f.key, type: f.type || 'text', row: f.row || '' });
            });
        });
        var of = function (t) { return fields.filter(function (f) { return f.type === t; }); };
        var scripts = of('script');
        var methodFields = of('method');

        /* an object field and a property field of the same row are a pair */
        var pairs = [];
        of('property').forEach(function (f) {
            var obj = null;
            fields.forEach(function (o) { if (!obj && o.type === 'object' && o.row && o.row === f.row) obj = o; });
            if (!obj) fields.forEach(function (o) { if (!obj && o.type === 'object') obj = o; });
            if (obj) pairs.push({ obj: obj.key, prop: f.key });
        });

        /* --- 2. the appearance --- */
        var binds = [], controls = [], actions = [], dxeys = [], mPic = false, mPicProp = false;
        m.appearance.items.forEach(function (it) {
            var k = bkey(it);
            if (k && binds.indexOf(k) < 0) binds.push(k);
            /* an icon component that takes its value from the widget has to tell a
               glyph from a picture once the browser runs, so the test has to be in
               the code: it is drawn from isPicValue(), the very function used here */
            if (it._t === 'icon' && (k || safeExpr(it.expr) || iconOwnPair(it) || iconFollowsWidget(it))) mPic = true;
            /* a field of type "property" keeps a name, and the icon needs the value
               behind it - that is read into values[<key>] by the pair loader. The
               field is looked up here and not taken from the item: the code is built
               before the markup, so the mark the markup leaves may not exist yet */
            if (it._t === 'icon' && (it._prop || propertyKeyOf(m, k))) mPicProp = true;
            if (CONTROL[it._t] && k) {
                var known = false;
                controls.forEach(function (c) { if (c.key === k) known = true; });
                if (!known) controls.push({ t: it._t, key: k });
            }
            if (it._t === 'button') {
                var a = String(it.action || '').trim();
                if (a && actions.indexOf(a) < 0) actions.push(a);
            }
            /* the names a coordinate expression leans on have to exist in the code too */
            exprRoots(it.dx).concat(exprRoots(it.dy)).forEach(function (n) {
                if (dxeys.indexOf(n) < 0) dxeys.push(n);
            });
        });

        /* --- the icon of the module itself: the object and the property are written
           into the code, so the header follows the value the object reports right now */
        var mIcon = (String(m.appearance.iconType || '') === 'property' &&
            m.appearance.iconObject && m.appearance.iconProperty)
            ? { obj: String(m.appearance.iconObject), prop: String(m.appearance.iconProperty) }
            : null;
        function qs(s) { return '\'' + String(s).replace(/\\/g, '\\\\').replace(/'/g, '\\\'') + '\''; }

        /* every name the code declares: the actions never overwrite the generated ones */
        var taken = { values: 1, busy: 1 };
        function fname(base) {
            var n = base, i = 2;
            while (taken[n]) n = base + (i++);
            taken[n] = 1;
            return n;
        }

        /* --- data --- */
        /* an icon on the switch of the settings panel resolves the choice at runtime */
        var mFollow = m.appearance.items.some(function (it) { return it && it._t === 'icon' && iconFollowsWidget(it); });
        if (pairs.length || controls.length || mIcon || mPicProp || mFollow) data.push('    busy: false,');
        if (pairs.length || controls.length || mIcon || mPicProp || mFollow) data.push('    values: {},');
        controls.forEach(function (c) {
            if (pairs.some(function (p) { return p.prop === c.key; })) return;
            data.push('    ' + c.key + ': null,');
        });

        /* --- computed: every key the panels use --- */
        var seen = {};
        function acc(key) {
            if (!id(key) || seen[key]) return;
            seen[key] = 1;
            /* the name beside the icon leans on "icon": it must answer the same question
               the icon itself does. In the url and property modes the field "icon" stays
               empty, so leaning on it put the name over the icon there. dpbWidgetIcon is
               the value the icon actually shows, and that is what decides the place. */
            if (key === 'icon' && mFollow) {
                computed.push('    icon: function () { return this.dpbWidgetIcon; },');
                return;
            }
            computed.push('    ' + key + ': function () { return ' + path(key) + ' || \'\'; },');
        }
        binds.forEach(acc);
        pairs.forEach(function (p) { acc(p.obj); acc(p.prop); });
        scripts.forEach(function (f) { acc(f.key); });
        methodFields.forEach(function (f) { acc(f.key); });
        dxeys.forEach(acc);
        /* every field of the row the icon switch sits in is a value the template may
           ask for, so all of them are declared - the icon reads icon_type, icon,
           icon_object, icon_property and icon_url at once */
        iconRowFields(m).forEach(function (f) { acc(f.key); });

        /* --- computed: the picture the icon of the module shows --- */
        if (mIcon) {
            /* the property holds the path to the picture, so the whole value goes
               to src: it used to be cut down to the first word and applied as a
               class, which showed nothing - a path is not a Font Awesome name */
            computed.push('    dpbIconSrc: function () {');
            computed.push('        var v = this.values[' + qs(mIcon.prop) + '];');
            computed.push('        if (v === undefined || v === null) return \'\';');
            computed.push('        return String(v).trim();');
                        computed.push('    },');
        }

        /* --- computed: the icon that follows the choice in the settings panel --- */
        if (mFollow) {
            /* the field icon_type says WHERE the icon comes from, so its own value is
               never drawn. The same three cases the header of the module has, read from
               the settings of the running widget, which is what lets the panel change
               the icon without the file being written again */
            computed.push('    dpbWidgetIcon: function () {');
            computed.push('        var w = this.widget || {}, t = String(w.icon_type || \'icon\');');
            computed.push('        if (t === \'url\') return String(w.icon_url == null ? \'\' : w.icon_url).trim();');
            computed.push('        if (t === \'property\') {');
            computed.push('            var n = String(w.icon_property == null ? \'\' : w.icon_property).trim();');
            computed.push('            var v = (n && this.values) ? this.values[n] : \'\';');
            computed.push('            if (v === undefined || v === null || String(v).trim() === \'\') v = n;');
            computed.push('            return String(v == null ? \'\' : v).trim();');
            computed.push('        }');
            computed.push('        return String(w.icon == null ? \'\' : w.icon).trim();');
            computed.push('    },');
        }


        /* --- methods: read and write every paired property --- */
        /* the loaders are kept aside as well: a model whose code is already written
           needs the very same loader, and it is handed over by name so that both
           places cannot drift apart */
        var loaders = [];
        pairs.forEach(function (p, pi) {
            var lp = fname(pi ? 'load' + cap(p.prop) : 'load');
            var sp = fname(pi ? 'set' + cap(p.prop) : 'set');
            var lt = [
                '    ' + lp + ': function () {',
                '        var self = this;',
                '        var object = ' + path(p.obj) + ' || \'\';',
                '        var property = ' + path(p.prop) + ' || \'\';',
                '        if (!object || !property) return;',
                '        this.busy = true;',
                '        return dpAPI(\'getProperty?object=\' + encodeURIComponent(object) + \'&property=\' + encodeURIComponent(property))',
                '            .then(function (r) { if (r && !r.error) self.values[property] = r.value; })',
                '            .catch(function (e) { console.error(\'[dpb] ' + lp + '\', e); })',
                '            .then(function () { self.busy = false; });',
                '    },'
            ];
            var st = [
                '    ' + sp + ': function (v) {',
                '        var object = ' + path(p.obj) + ' || \'\';',
                '        var property = ' + path(p.prop) + ' || \'\';',
                '        if (!object || !property) return;',
                '        this.values[property] = v;',
                '        return dpAPI(\'setProperty?object=\' + encodeURIComponent(object) + \'&property=\' + encodeURIComponent(property) + \'&value=\' + encodeURIComponent(v));',
                '    },'
            ];
            lt.forEach(function (t) { methods.push(t); });
            st.forEach(function (t) { methods.push(t); });
            var mo = [
                '    this.$watch(\'' + p.obj + '\', this.' + lp + ');',
                '    this.$watch(\'' + p.prop + '\', this.' + lp + ');',
                '    this.' + lp + '();'
            ];
            mo.forEach(function (t) { mounted.push(t); });
            loaders.push({ obj: p.obj, prop: p.prop, name: lp, set: sp, code: lt, mounted: mo });
        });

        /* --- methods: the icon of the module --- */
        if (mIcon) {
            methods.push('    loadDpbIcon: function () {');
            methods.push('        var self = this;');
            methods.push('        this.busy = true;');
            methods.push('        return dpAPI(\'getProperty?object=\' + encodeURIComponent(' + qs(mIcon.obj) + ') + \'&property=\' + encodeURIComponent(' + qs(mIcon.prop) + '))');
            methods.push('            .then(function (r) { if (r && !r.error) self.values[' + qs(mIcon.prop) + '] = r.value; })');
            methods.push('            .catch(function (e) { console.error(\'[dpb] loadDpbIcon\', e); })');
            methods.push('            .then(function () { self.busy = false; });');
            methods.push('    },');
            mounted.push('    this.loadDpbIcon();');
        }

        /* --- methods: telling a glyph from a picture --- */
        if (mPic) {
            methods.push('    dpbIsPic: function (v) {');
            methods.push('        var s = String(v == null ? "" : v).trim();');
            methods.push('        if (!s) return false;');
            methods.push('        if (s.indexOf("/") >= 0 || s.indexOf("\\\\") >= 0) return true;');
            methods.push('        return /\\.(png|jpe?g|gif|svg|webp|bmp|ico|avif)$/i.test(s);');
            methods.push('    },');
        }

        /* --- methods: the value behind a property the icon is bound to --- */
        if (mPicProp) {
            methods.push('    dpbPic: function (p) {');
            /* values is keyed by the NAME of the property, not by the key of the
               field: the loader of the pair writes values[property]. Asking for
               values["icon_property"] therefore found nothing at all and the icon
               fell back to the name of the property, which draws nothing */
            methods.push('        var name = this.widget ? this.widget[p] : "";');
            methods.push('        var v = (this.values && name) ? this.values[name] : "";');
            methods.push('        if (v === undefined || v === null || String(v).trim() === "") {');
            /* nothing was read: either the object is not named yet, or the field holds
               the path outright. What was typed is then all there is, and dropping it
               would take away an icon that used to show */
            methods.push('            v = this.widget && this.widget[p] != null ? this.widget[p] : "";');
            methods.push('        }');
            methods.push('        return String(v).trim();');
            methods.push('    },');
        }

        /* --- methods: the elements the user can change --- */
        controls.forEach(function (c) {
            var n = fname('on' + cap(c.key));
            var pair = null;
            pairs.forEach(function (p) { if (p.prop === c.key) pair = p; });
            methods.push('    ' + n + ': function (v) {');
            if (pair) methods.push('        this.set' + cap(pair.prop) + '(v);');
            else methods.push('        this.' + c.key + ' = v;');
            methods.push('    },');
        });

        /* --- methods: the scripts and the methods of the settings panel --- */
        scripts.forEach(function (f) {
            var n = fname('run' + cap(f.key));
            methods.push('    ' + n + ': function (p) {');
            methods.push('        var script = ' + path(f.key) + ' || \'\';');
            methods.push('        if (!script) return;');
            methods.push('        return dpAPI(\'scriptRun?script=\' + encodeURIComponent(script) + \'&param=\' + encodeURIComponent(JSON.stringify(p === undefined ? null : p)));');
            methods.push('    },');
        });
        methodFields.forEach(function (f) {
            var n = fname('call' + cap(f.key));
            var obj = null;
            fields.forEach(function (o) { if (!obj && o.type === 'object' && o.row && o.row === f.row) obj = o; });
            if (!obj) fields.forEach(function (o) { if (!obj && o.type === 'object') obj = o; });
            if (!obj) return;
            methods.push('    ' + n + ': function (p) {');
            methods.push('        var object = ' + path(obj.key) + ' || \'\';');
            methods.push('        var method = ' + path(f.key) + ' || \'\';');
            methods.push('        if (!object || !method) return;');
            methods.push('        var q = p === undefined || p === null ? \'\' : \'?params=\' + encodeURIComponent(JSON.stringify(p));');
            methods.push('        return dpAPI(\'method/\' + encodeURIComponent(object + \'.\' + method) + q);');
            methods.push('    },');
        });

        /* --- methods: a method per button of the appearance --- */
        actions.forEach(function (a) {
            var base = id(a.replace(/[^A-Za-z0-9_$]/g, '_')) || 'action';
            if (!/^[A-Za-z_$]/.test(base)) base = 'action' + base;
            var n = fname(base);
            methods.push('    ' + n + ': function (e) {');
            methods.push('        // the button "' + a.replace(/\*\//g, '*\\/') + '" of the appearance');
            if (methodFields.length === 1) methods.push('        // this.call' + cap(methodFields[0].key) + '();');
            if (scripts.length === 1) methods.push('        // this.run' + cap(scripts[0].key) + '();');
            methods.push('    },');
        });

        /* --- mounted: the elements of the appearance report themselves --- */
        if (actions.length || controls.length) {
            mounted.push('    var self = this, root = this.$el;');
            if (actions.length) {
                mounted.push('    this._dpbClick = function (e) {');
                mounted.push('        var el = e.target && e.target.closest ? e.target.closest(\'[data-dpb-action]\') : null;');
                mounted.push('        if (!el || (root && !root.contains(el))) return;');
                mounted.push('        var name = el.getAttribute(\'data-dpb-action\');');
                mounted.push('        if (name && typeof self[name] === \'function\') self[name](e);');
                mounted.push('    };');
                mounted.push('    if (root) root.addEventListener(\'click\', this._dpbClick);');
            }
            if (controls.length) {
                mounted.push('    this._dpbInput = function (e) {');
                mounted.push('        var el = e.target;');
                mounted.push('        if (!el || !el.getAttribute) return;');
                mounted.push('        var key = el.getAttribute(\'data-dpb-bind\');');
                mounted.push('        if (!key) return;');
                mounted.push('        var name = \'on\' + key.charAt(0).toUpperCase() + key.slice(1);');
                mounted.push('        if (typeof self[name] === \'function\') self[name](el.type === \'checkbox\' ? el.checked : el.value);');
                mounted.push('    };');
                mounted.push('    if (root) {');
                mounted.push('        root.addEventListener(\'input\', this._dpbInput);');
                mounted.push('        root.addEventListener(\'change\', this._dpbInput);');
                mounted.push('    }');
            }
            cleanup.push('    if (this.$el) {');
            if (actions.length) cleanup.push('        this.$el.removeEventListener(\'click\', this._dpbClick);');
            if (controls.length) {
                cleanup.push('        this.$el.removeEventListener(\'input\', this._dpbInput);');
                cleanup.push('        this.$el.removeEventListener(\'change\', this._dpbInput);');
            }
            cleanup.push('    }');
        }
        if (!pairs.length && !actions.length && !controls.length && !scripts.length && !methodFields.length && !mIcon) {
            mounted.push('    // nothing to load yet: the panels are empty');
        }

        return {
            data: data.join('\n'),
            computed: computed.join('\n'),
            methods: methods.join('\n'),
            mounted: mounted.join('\n'),
            loaders: loaders,
            beforeUnmount: cleanup.join('\n'),
            summary: {
                settings: fields.length,
                items: m.appearance.items.length,
                properties: pairs.length,
                controls: controls.length,
                actions: actions.length,
                scripts: scripts.length,
                methods: methodFields.length
            }
        };
    }

    /* ------------------------------------------------------------------ */
    /* syntax highlighting                                                  */
    /* ------------------------------------------------------------------ */

    var KW = ('break case catch class const continue debugger default delete do else export extends ' +
        'finally for function if import in instanceof let new of return super switch this throw try typeof ' +
        'var void while with yield async await').split(' ');

    var RE = /(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)|('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|([{}()[\];,.:?=<>!+\-*\/%&|^~]+)/g;

    function highlight(code) {
        var out = '', last = 0, m;
        var kw = {};
        KW.forEach(function (k) { kw[k] = 1; });
        RE.lastIndex = 0;
        while ((m = RE.exec(code)) !== null) {
            out += esc(code.slice(last, m.index));
            last = m.index + m[0].length;
            var t = 'n';
            if (m[1] || m[2]) t = 'c';
            else if (m[3]) t = 's';
            else if (m[4]) t = 'd';
            else if (m[5]) {
                var p = RE.lastIndex;
                var nxt = /^\s*\(/.test(code.slice(p));
                t = kw[m[5]] ? 'k' : (nxt ? 'f' : 'i');
            } else t = 'o';
            out += '<span class="tk-' + t + '">' + esc(m[0]) + '</span>';
        }
        out += esc(code.slice(last));
        return out;
    }

    /* the cheap check first: unbalanced brackets, with the exact line */
    function balanceCheck(code) {
        var stack = [], pairs = { ')': '(', ']': '[', '}': '{' };
        var s = String(code || ''), i = 0, n = s.length, last = '';
        while (i < n) {
            var c = s[i];
            if (c === '/' && s[i + 1] === '/') { while (i < n && s[i] !== '\n') i++; continue; }
            if (c === '/' && s[i + 1] === '*') { i += 2; while (i < n && !(s[i] === '*' && s[i + 1] === '/')) i++; i += 2; continue; }
            if (c === '/' && last && !/[)\]}A-Za-z0-9_$]/.test(last)) {
                /* regex literal: `/\{/` must not count its braces */
                var k = i + 1, cls = false;
                while (k < n) {
                    var rc = s[k];
                    if (rc === '\\') { k += 2; continue; }
                    if (rc === '[') cls = true;
                    else if (rc === ']') cls = false;
                    else if (rc === '/' && !cls) break;
                    else if (rc === '\n') break;
                    k++;
                }
                i = (k < n && s[k] === '/') ? k + 1 : k;
                last = '/';
                continue;
            }
            if (c === '"' || c === "'" || c === '`') {
                var q = c; i++;
                while (i < n) { if (s[i] === '\\') { i += 2; continue; } if (s[i] === q) { i++; break; } i++; }
                last = q;
                continue;
            }
            if (c === '(' || c === '[' || c === '{') { stack.push(c); i++; last = c; continue; }
            if (c === ')' || c === ']' || c === '}') {
                if (!stack.length || stack[stack.length - 1] !== pairs[c]) {
                    return { ok: false, error: 'line ' + lineOf(s, i) + ': unexpected "' + c + '"' };
                }
                stack.pop(); i++; last = c; continue;
            }
            if (!/\s/.test(c)) last = c;
            i++;
        }
        if (stack.length) {
            var open = { '(': ')', '[': ']', '{': '}' };
            return { ok: false, error: 'unclosed "' + open[stack[stack.length - 1]] + '"' };
        }
        return { ok: true, error: '' };
    }

    /* the block lives in the component either as a list of object properties
       (data, computed, methods, watch) or as the body of a method (mounted,
       beforeUnmount, the statements before `return` of data). The section is
       compiled, not run, so a bad token is reported the way the parser sees it */
    function syntaxWrappers(s, kind) {
        var obj = 'return ({\n' + s + '\n\n});';
        var fn = 'return (async function(){\n' + s + '\n\n});';
        if (kind === 'mounted' || kind === 'beforeUnmount' || kind === 'dataPre') return [fn];
        if (kind === 'data' || kind === 'computed' || kind === 'methods' || kind === 'watch') return [obj];
        return [obj, fn, 'return (\n' + s + '\n\n);'];
    }

    /* ------------------------------------------------------------------ */
    /* is this code at all?                                                */
    /* ------------------------------------------------------------------ */

    /* the compiler is happy with a lot of text that is not code: a single
       word is a short property, words separated by commas are an object.
       A line of plain words holds no JS at all: one such line is a sentence,
       several of them are a certainty. */
    function proseLines(s, kind) {
        var stripped = String(s || '')
            .replace(/\/\*[\s\S]*?\*\//g, ' ')
            .replace(/\/\/[^\n]*/g, ' ')
            .replace(/`(?:\\[\s\S]|[^`\\])*`/g, ' ')
            .replace(/'(?:\\.|[^'\\])*'/g, ' ')
            .replace(/"(?:\\.|[^"\\])*"/g, ' ');
        /* the body of an object: a bare word there is a property of a variable
           that does not exist, so it can never be what was meant */
        var objBody = kind === 'data' || kind === 'computed' || kind === 'methods' || kind === 'watch';
        var lines = 0, words = 0, single = 0;
        stripped.split('\n').forEach(function (l) {
            var t = l.trim();
            if (!t) return;
            /* only identifiers, separated by commas or spaces (a word in any language) */
            if (!/^[\p{L}_$][\p{L}\p{N}_$]*(\s*[,\s]\s*[\p{L}_$][\p{L}\p{N}_$]*)*$/u.test(t)) return;
            lines++;
            if (t.split(/[\s,]+/).length >= 2) words++;
            else single++;
        });
        if (!lines) return 0;
        if (words) return lines;
        if (single && objBody) return lines;
        return lines >= 3 ? lines : 0;
    }

    /* a template without a tag and without a binding is a text, not a markup */
    function proseMarkup(h) {
        var t = String(h || '').trim();
        if (!t) return false;
        if (t.indexOf('<') >= 0 || t.indexOf('{{') >= 0) return false;
        return true;
    }

    function checkSyntax(code, kind) {
        var s = String(code || '');
        if (!s.trim()) return { ok: true, error: '' };
        if (proseLines(s, kind)) return { ok: false, error: '', key: 'dpb_err_text' };
        var bal = balanceCheck(s);
        if (bal.error) return { ok: false, error: bal.error };
        var ws = syntaxWrappers(s, kind), last = '';
        for (var k = 0; k < ws.length; k++) {
            try { new Function(ws[k]); return { ok: true, error: '' }; }
            catch (e) {
                last = String((e && e.message) ? e.message : e).replace(/^\s*(SyntaxError|Error):\s*/i, '');
            }
        }
        return { ok: false, error: 'syntax: ' + last };
    }

    /* the markup of a widget with own HTML: the text alone is never a widget,
       the real grammar is checked by the template compiler of the framework */
    function checkMarkup(h) {
        var s = String(h || '');
        if (!s.trim()) return { ok: true, error: '' };
        if (proseMarkup(s)) return { ok: false, error: '', key: 'dpb_err_html' };
        return { ok: true, error: '' };
    }

    function lineOf(s, i) {
        var n = 1;
        for (var k = 0; k < i && k < s.length; k++) if (s[k] === '\n') n++;
        return n;
    }

    /* ------------------------------------------------------------------ */
    /* preview helper                                                      */
    /* ------------------------------------------------------------------ */

    /* The canvas of the builder. An icon bound to a field of type "property" is fed
       with "props": the value read from the object, keyed by the field. Without it the
       canvas would show the NAME of the property in the class - "Press" is not a font
       class, so the canvas showed an empty icon while the written widget worked. */
    function previewHtml(item, widget, model, props) {
        /* the name a component reads its value under is put on the model here as
           well: the canvas draws before any code was written out for it */
        if (model) markIconProps(model);
        var it = item;
        var w = widget;
            if (model && item) {
                var p = propertyKeyOf(model, bkey(item));
                if (p) {
                    it = Object.assign({}, item, { _prop: '' });
                    var got = props ? props[p] : '';
                    /* the value read from the object stands in for what the field holds.
                       Until it arrives the field is left empty on purpose: the name of a
                       property in a font class shows nothing anyway, and putting it there
                       only makes the canvas look as if the icon were named "Press" */
                    w = Object.assign({}, widget || {}, { [p]: String(got == null ? '' : got).trim() });
                } else if (item._ico) {
                    /* an icon with a property of its own reads the value under the name
                       it was given; the canvas hands it over the same way */
                    var own = props ? props[item._ico] : '';
                    w = Object.assign({}, widget || {}, { [item._ico]: String(own == null ? '' : own).trim() });
                } else if (iconFollowsWidget(item)) {
                    /* an icon on the switch of the settings panel needs the values the
                       object reported, exactly as the running widget reads them - the
                       canvas has to answer the same way the panel will */
                    w = Object.assign({}, widget || {}, { dpb_icon_vals: props || {} });
                }
            }
        var html = itemHtml(it, true, w);
        return html.replace(BIND, function (_, key) {
            var v = w ? w[key] : undefined;
            if (v === undefined || v === null || v === '') return '<span style="opacity:.4">{{' + esc(key) + '}}</span>';
            return esc(v);
        });
    }

    window.DpBuilder = {
        COMPONENTS: C,
        CATS: CATS,
        FIELD_TYPES: FT,
        SYSTEM_TABS: SYSTEM_TABS,
        systemFieldOf: systemFieldOf,
        systemFields: systemFields,
        systemField: systemField,
        systemTabOf: systemTabOf,
        newModel: newModel,
    emptyModel: emptyModel,
        newItem: newItem,
        newField: newField,
        stdFields: stdFields,
        isStdField: isStdField,
        stdItems: stdItems,
        isStdItem: isStdItem,
        normalizeModel: normalizeModel,
        uid: uid,
        build: build,
        genSource: genSource,
        parseSource: parseSource,
        extractCode: extractCode,
        importSource: importSource,
        codeToOptions: codeToOptions,
        defaultsOf: defaultsOf,
        wizard: wizard,
    ensureComputed: ensureComputed,
        funcsOf: funcsOf,
        funcsText: funcsText,
        methodsTextOf: methodsTextOf,
        highlight: highlight,
        checkSyntax: checkSyntax,
    checkMarkup: checkMarkup,
    componentOf: componentOf,
        previewHtml: previewHtml,
        itemHtml: itemHtml,
        templateOf: function (m) {
            var html = appearanceTemplate(m);
            /* the builder composes new widgets from blocks: write their markup over several lines */
            return (m && m.imported) ? html : prettifyHtml(html);
        },
        itemSize: itemSize,
        innerSize: innerSize,
        clampPos: clampPos,
        anchorCss: anchorCss,
        canStretch: canStretch,
        safeExpr: safeExpr,
        exprRoots: exprRoots,

        autoPos: autoPos,
        clampAll: clampAll,
        placeFree: placeFree,
        resizeItem: resizeItem,
        settingKeys: settingKeys,
        blockIndent: blockIndent,
        dedentBlock: dedentBlock,
        reindentBlock: reindentBlock,
        lbl: lbl,
        varName: varName
    };
})();
