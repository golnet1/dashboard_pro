const state = {
    dialogs: [],
};

const getters = {
    dialogs: state => state.dialogs,
    getDialogFirst: state => state.dialogs.length>0 ? state.dialogs[0] : {title:"",test:""},
    getDialogsCount: state => state.dialogs.length,
}

const actions ={

}

const mutations = {
    addDialogInfo(state, dialog) {
        dialog.type = "info"
        state.dialogs = [ ...state.dialogs, dialog ]
    },
    addDialogQuery(state, dialog) {
        dialog.type = "query"
        state.dialogs = [ ...state.dialogs, dialog ]
    },
    closeDialog: state => {
        state.dialogs.splice(0, 1)
    },
    delDialog(state, id) {
        var items = state.dialogs.filter(t=>t.id <= id)
        items.forEach(item => {
            state.dialogs.splice(state.dialogs.indexOf(item), 1)
        })
    },
}


export default {
    state,
    getters,
    actions,
    mutations
};