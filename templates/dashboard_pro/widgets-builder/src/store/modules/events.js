import axios from "axios";

const state = {
    items: [],
    users:[],
    currentUser:-1,
    levels: [],
    notifyLevel:0,
    updating: false,
    searchQuery:"",
};

const getters = {
    allEvents: state => state.items,
    getUsers: state => state.users,
    getUser: (state) => (id) => { return state.users.find(t => t.ID === id)},
    getNewEvents: state => state.items.filter(t=>t.read == false && t.VALUE.level >= state.notifyLevel).sort((item1, item2) => item2.dt - item1.dt),
    allLevels: state => state.levels,
    notifyLevel: state => state.notifyLevel,
    getLevel: (state) => (level) => {
        var items = state.levels.filter(t=>t.level <= level)
        if (items.length==0) return  {
            level: "0",
            icon: "fas fa-bell",
            color: "#ff0000",
          }
        items.sort(function(a, b) {
            return b.level - a.level;
        });
        return items[0]
    },
    sortedEvents(state) {
        return [...state.items].sort((item1, item2) => item2.dt - item1.dt)
    },
    sortedAndSearchedPosts(state, getters) {
        return getters.sortedEvents.filter(item => item.VALUE.message.toLowerCase().includes(state.searchQuery.toLowerCase()))
    }
};

const actions = {
    async loadUsers({commit}) {
      var urlMethod = "/api/module/mboard_" + process.env.VUE_APP_TYPE + "/users"
      var response = await axios.get(urlMethod)
      commit("addUsers", response.data.apiHandleResult)
    },
    loadEvents({commit}) {
        fetch('/api/module/mboard_' + process.env.VUE_APP_TYPE + '/shouts').then((response) => {
            return response.json().then((json) => {
              json.apiHandleResult.forEach(event => {
                var data = {
                  id: event.ID,
                  dt: event.ADDED,
                  read: true,
                  NAME: "SAY",
                  VALUE: {
                    level: event.IMPORTANCE,
                    message: event.MESSAGE,
                    member_id: event.MEMBER_ID
                  }
                }
                //console.log(data)
                commit("addEvent", data)
                //chat.mutations.addMessage(chat.state, { type: 'text', author: `user1`, data: { text: data.VALUE.message, dt: data.dt}})
              });
            })
        })
      },
      async loadMoreEvents({state, commit}) {
        try {
            var sort = [...state.items].sort((item1, item2) => item2.dt - item1.dt)
            var minEvent = sort[sort.length-1]
            const response = await axios.get('/api/module/mboard_' + process.env.VUE_APP_TYPE + '/shouts', {
                params: {
                    begin: minEvent.id
                }
            });
            //console.log(response.data)
            response.data.apiHandleResult.forEach(event => {
                  var data = {
                    id: event.ID,
                    dt: event.ADDED,
                    read: true,
                    NAME: "SAY",
                    VALUE: {
                      level: event.IMPORTANCE,
                      message: event.MESSAGE,
                      member_id: event.MEMBER_ID
                    }
                  }
                  //console.log(data)
                  commit("addEvent", data)
                  //chat.mutations.addMessage(chat.state, { type: 'text', author: `user1`, data: { text: data.VALUE.message, dt: data.dt}})
                })
        } catch (e) {
            console.log(e)
        }
    }
}

import Vue from 'vue'

const mutations = {
    addEvent(state, event) {
        var dublicat = state.items.findIndex(t=> t.id == event.id)
        if (dublicat > -1) return
        if (event.dt === undefined)
            event.dt = new Date()
        else
            event.dt = new Date(event.dt)
        //console.log(event)
        if  (event.id != undefined)
        {
            var index = state.items.findIndex(t=> t.id !== event.id && String(t.dt) == String(event.dt) && t.VALUE.message == event.VALUE.message)
            //console.log(index)
            if (index > 0)
            {
                state.items[index].id = event.id
                return
            }
        }
        else
            event.id = 0
        if (event.read === undefined)
            event.read = false
        if (event.VALUE.level === undefined)
            event.VALUE.level=0
        if (event.VALUE.IMPORTANCE !== undefined)
            event.VALUE.level=event.VALUE.IMPORTANCE
        if (event.VALUE.MESSAGE !== undefined)
            event.VALUE.message=event.VALUE.MESSAGE
        event.type = "text"
        event.VALUE.member_id=parseInt(event.VALUE.member_id)
        if (event.VALUE.member_id == 0)
            event.author = "support"
        else if (event.VALUE.member_id == state.currentUser)
            event.author = "me"
        else
            event.author = event.VALUE.member_id
        if (event.NAME == "MBOARD")
        {
            event.type = "system"
            event.author = "mboard"
        }
        event.data = {
            text : event.VALUE.message
        }
        state.items.push(event); // eslint-disable-line no-param-reassign
        if (event.VALUE.level>=state.notifyLevel && !event.read)
        {
            Vue.notification.show('MBoard', {
                body: event.VALUE.message,
                icon: "img/icon.png"
            }, {})
        }
    },
    addUsers(state, users) {
        users.forEach(user => {
            user.id = user.ID
        });
        state.users = users
    },
    readEvent(state,event){
        event.read = true
    },
    readAllEvent(state){
        state.items.forEach(event => {
            event.read = true
        });
    },
    clearEvents(state) {
       state.items = []
    },
    setLevels(state,levels){
        state.levels = levels
    },
    setNotifyLevel(state, level){
        state.notifyLevel = level
    },
    setSearchQuery(state, searchQuery) {
        state.searchQuery = searchQuery
    },
    setCurrentUser(state, id) {
        state.currentUser = id
    },
    resetEvents(){
        state.items = []
    }

};

export default {
    state,
    getters,
    actions,
    mutations
};