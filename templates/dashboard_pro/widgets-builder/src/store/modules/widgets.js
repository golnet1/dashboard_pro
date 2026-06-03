const state = {
    items: [],
    updating: false,
};

const getters = {
    allWidgets: state => state.items,
    getWidgetById: (state) => (id) => {
        return state.items.find(t => t.id === id)
    },
    getWidgetsByPanel: (state) => (panel) => {
        var widgets = state.items.filter(t => t.parent === panel)
        widgets = widgets.sort((a, b) => (a.order > b.order ? 1 : -1))
        for (var i = 0; i < widgets.length; i++) {
            widgets[i].i = i;
        }
        return widgets
    },
    getWidgetsByObj: (state) => (obj) => {
        return state.items.filter(widget => {
            return JSON.stringify(widget).includes('"'+obj+'"');
        });
    },
    getWidgetsByType: (state) => (type) => {
        var widgets = state.items.filter(t => t.type === type)
        return widgets
    },
    countWidgets: state => state.items.length,
};

const mutations = {
    addWidget(state, widget) {
        if (!widget.x) widget.x = 0
        if (!widget.y) widget.y = 0
        widget.order = widget.i
        widget.reload = false
        state.items.push(widget); // eslint-disable-line no-param-reassign
    },
    editWidget(state, widget) {
        let index = state.items.findIndex(t => t.id === widget.id)
        widget.order = widget.i
        state.items[index] = widget
    },
    delWidget(state, id) {
        let index = state.items.findIndex(t => t.id === id)
        state.items.splice(index,1)
    },
    delWidgetsByPanel(state, panel){
        console.log("delele widgets",panel)
        var widgets = state.items.filter(t => t.parent === panel)
        for (var i = 0; i < widgets.length; i++) {
            let index = state.items.findIndex(t => t.id === widgets[i].id)
            state.items.splice(index,1)
        }
    },
    changeParent(state, data){
        var widgets = state.items.filter(t => t.parent === data.old)
        for (var i = 0; i < widgets.length; i++) {
            widgets[i].parent = data.new
        }
    },
    setWidgets(state, widgets) {
        state.items = widgets
    },
    updatePosWidgets(state, widgets) {
        widgets.forEach(item => {
             var find = state.items.find(t => t.id == item.id)
             if (item.x != undefined)
                find.x = item.x
             if (item.y != undefined)
                find.y = item.y
             find.order = item.i
             //console.log(item.order)
        });
    },
    updateSizeWidgets(state, widgets) {
        widgets.forEach(item => {
             var find = state.items.find(t => t.id == item.id)
             if (item.w != undefined)
                find.w = item.w
             if (item.h != undefined)
                find.h = item.h
             find.order = item.i
             //console.log(item.order)
        });
    },
    setUpdating(state, data) {
        state.updating = data
    },
    setReloadWidget(state, widget) {
        var find = state.items.find(t => t.id == widget)
        if (find)
            find.reload = true
    },
    resetReloadWidget(state, widget) {
        var find = state.items.find(t => t.id == widget)
        if (find)
            find.reload = false
    },
    resetWidgets: state => {
        state.items = [];
    },
};

export default {
    state,
    getters,
    mutations
};