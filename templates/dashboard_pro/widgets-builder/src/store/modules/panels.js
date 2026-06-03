import Vue from 'vue'

const state = {
    items: [],
    updating: false,
};

const getters = {
    allPanels: state => state.items,
    getPanelByName: (state) => (name) => {
        return state.items.filter(t => t.name === name)[0]
    },
    getPanelsParent: (state) => (name) => {
        return state.items.filter(t => t.parent === name || t.parent === undefined)
    },
    getPanelsByType: (state) => (name) => {
        var res = state.items.filter(t => t.type == name)
        if (name == "panel")
        {
            res = state.items.filter(t => t.type == "panel" || t.type == "flex" || t.type == "waterfall"  || t.type == "dnd")
        }
        return res
    },
    countPanels: state => state.items.length,
    loadPanels: state => state.updating,
};

const actions ={
    editPanel: function (context,data){
        context.commit("editPanel", data)
        if (data.panel.name != data.oldName)
            context.commit("changeParent",{old:data.oldName, new : data.panel.name})
    },
    deletePanel: function (context, name) {
        context.commit("delWidgetsByPanel",name)
        context.commit("deletePanel", name)
    },
}

const mutations = {
    addPanel(state, panel) {
        state.items.push(panel);
    },
    editPanel(state, data) {
        console.log("edit panel", data.panel)
        if (data.panel.name != data.oldName)
        {
            var panels = state.items.filter(t => t.parent === data.oldName)
            for (var i = 0; i < panels.length; i++)
                panels[i].parent = data.panel.name
        }
        let index = state.items.findIndex(t => t.name === data.oldName)
        Vue.set(state.items, index, data.panel)
    },
    deletePanel(state, name) {
        let index = state.items.findIndex(t => t.name === name)
        console.log("delete",name,index)
        state.items.splice(index,1)
    },
    upPanel(state, name) {
        let index = state.items.findIndex(t => t.name === name)
        if (index <= 0) return
        state.items[index] = state.items.splice(index-1, 1, state.items[index])[0];
    },
    downPanel(state, name) {
        let index = state.items.findIndex(t => t.name === name)
        if (index < 0 || index == state.items.length-1) return
        state.items[index] = state.items.splice(index+1, 1, state.items[index])[0];
    },
    setPanels(state, panels) {
        console.log("set panels",panels)
        state.items = panels
    },
    setUpdating(state, data) {
        state.updating = data
    },
    resetPanels: state => {
        state.items = [];
    },
};

export default {
    state,
    getters,
    actions,
    mutations
};