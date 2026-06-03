import cookies from 'vue-cookies'
export const AUTH_REQUEST = "auth_request"
const AUTH_ERROR = "auth_error"
export const AUTH_SUCCESS = "auth_success"
export const AUTH_LOGOUT = "auth_logout"

import { USER_REQUEST } from "./user";
var shortid = require("shortid")

const state = {
    sessionId: "",
    token: cookies.get("user-mboard") || "",
    status: "",
    error:"",
    hasLoadedOnce: false
};

const getters = {
    isAuthenticated: state => !!state.token,
    authStatus: state => state.status,
    authError: state=> state.error,
    authUser: state => state.token,
    sessionId: state => state.sessionId,
};

import axios from 'axios';
//import { dispatch } from "d3";
var sha512 = require('js-sha512');

const actions = {
    // eslint-disable-next-line no-unused-vars
    [AUTH_REQUEST]: ({ commit, dispatch }, user) => {
        console.log(user)
        return new Promise((resolve, reject) => {
            commit(AUTH_REQUEST);
            let urlMethod = "/api/module/mboard_"+process.env.VUE_APP_TYPE+"/login";
            let password = sha512(user.password)
            axios.post(urlMethod, { user: user.user, password: password })
                .then(resp => {
                    console.log(resp)
                    if (resp.data.apiHandleResult && resp.data.apiHandleResult.USERNAME == user.user)
                    {
                        cookies.set("user-mboard", user.user);
                        // Here set the header of your ajax library to the token value.
                        // example with axios
                        // axios.defaults.headers.common['Authorization'] = resp.token
                        commit(AUTH_SUCCESS, resp.data.apiHandleResult);
                        dispatch(USER_REQUEST, {user:user.user});
                        resolve(resp);
                    }
                    else{
                        reject("Wrong login/password");
                    }
                })
                .catch(err => {
                    commit(AUTH_ERROR, err);
                    cookies.remove("user-mboard")
                    reject(err);
                });
        });
    },
    [AUTH_LOGOUT]: ({ commit, dispatch }) => {
        return new Promise(resolve => {
            dispatch("resetSettings")
            commit(AUTH_LOGOUT);
            cookies.remove("user-mboard")
            resolve();
        });
    }
};

const mutations = {
    [AUTH_REQUEST]: state => {
        state.status = "loading";
    },
    [AUTH_SUCCESS]: (state, user) => {
        state.status = "success";
        state.token = user.USERNAME;
        if (!cookies.get("session-mboard") || cookies.get("session-mboard")=='undefined')
            cookies.set("session-mboard", shortid.generate())
        state.sessionId = cookies.get("session-mboard")
        state.hasLoadedOnce = true;
    },
    [AUTH_ERROR]: (state, error) => {
        state.status = "error";
        state.error = error;
        state.hasLoadedOnce = true;
    },
    [AUTH_LOGOUT]: state => {
        state.token = "";
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};