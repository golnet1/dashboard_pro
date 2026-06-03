//import Vue from 'vue'

const state = {
    items: [],
    updating: false,
};

const getters = {
    allData: state => state.items,
    getData: (state) => (name) => {
        if (name == undefined) return { name: undefined, value: undefined, updated: undefined }
        if (name == "") return { name: "", value: undefined, updated: undefined }
        if (!name.includes(".")) return { name: name, value: undefined, updated: undefined }
        var data = state.items.find(t => t.name === name)
        if (!data) {
            data = { name: name, value: undefined, updated: undefined }
            state.items.push(data);
            actions.requestData(name)
        }
        return data
    },
    getDataValue: (state) => (name) => {
        var data = state.items.find(t => t.name === name)
        if (!data) {
            data = { name: name, value: undefined, updated: undefined }
            state.items.push(data);
        }
        return data.value
    },
    countData: state => state.items.length,
    loadData: (state) => (name) => {
        var data = state.items.findIndex(t => t.name === name)
        return data >= 0
    },
};

const mutations = {
    addData(state, name) {
        if (name == undefined) return
        if (!name.includes(".")) return null
        var data = { name: name, value: "null", updated: "null" }
        //console.log(data)
        state.items.push(data)
        actions.requestData(name)
    },
    updateData(state, data) {
        let el = state.items.find(t => t.name === data.name)
        //console.log(el)
        if (el) {
            el["value"] = data.value
            const today = new Date();
            el["updated"] = today
        }
        else
            state.items.push(data);// eslint-disable-line no-param-reassign
    },
    setUpdating(state, data) {
        state.updating = data
    },
    resetData: state => {
        console.log("resetData")
        state.items = [];
    }
};
import axios from 'axios';
const actions = {
    requestData: function (context, name) {
        if (name == undefined) return
        let urlMethod = "/api.php/data/" + name;
        axios.get(urlMethod, {}).then(response => {
            const today = new Date();
            var data = { name: name, value: response.data.data, updated: today }
            if (context.state.debug) console.log(data)
            context.commit("updateData", data)
        });
        context.dispatch("subscribeProperty", name)
    },
    requestAllData: function (context) {
        if (state.items.length == 0) return
        var props = []
        state.items.forEach(element => {
            props.push(element.name)
        });
        let urlMethod = "/api.php/data/";
        axios.post(urlMethod, { properties: props }).then(response => {
            var allData = response.data.data
            //console.log(allData)
            const today = new Date();
            for (var key in allData) {
                var data = {
                    name: key,
                    value: allData[key],
                    updated: today
                }
                context.commit("updateData", data)
            }
        });

    },
    subscribeData: function (context, name) {
        context.commit("addData", name)
        //context.dispatch("subscribeProperty", name)
    },
    subscribeAllData: function (context) {
        state.items.forEach(element => {
            context.dispatch("subscribeProperty", element.name)
        })
    }
};
export default {
    state,
    actions,
    getters,
    mutations
};