import Vue from "vue";
import { AUTH_LOGOUT } from "./auth";

export const USER_REQUEST = "USER_REQUEST";
export const USER_SUCCESS = "USER_SUCCESS";
export const USER_ERROR = "USER_ERROR";

const state = { status: "", profile: {} };

const getters = {
  getProfile: state => state.profile,
  isProfileLoaded: state => !!state.profile.USERNAME
};

import axios from 'axios';
const actions = {
  [USER_REQUEST]: ({ commit, dispatch }, data) => {
    commit(USER_REQUEST);
    let urlMethod = "/api/module/mboard_"+process.env.VUE_APP_TYPE+"/user";
    axios.post(urlMethod, { user: data.user })
      .then(resp => {
        console.log(resp.data.apiHandleResult)
        if (resp.data.apiHandleResult){
            commit(USER_SUCCESS, resp.data.apiHandleResult);
            commit("setCurrentUser", resp.data.apiHandleResult.ID)
            dispatch("loadSettings")
            dispatch("loadUsers")
            dispatch("loadEvents")
        }
        else
        {
            throw("Error get info profile");
        }
      })
      .catch(() => {
        console.log("Error get user profile")
        commit(USER_ERROR);
        // if resp is unauthorized, logout, to
        dispatch(AUTH_LOGOUT);
      });
  }
};

const mutations = {
  [USER_REQUEST]: state => {
    state.status = "loading";
  },
  [USER_SUCCESS]: (state, info) => {
    state.status = "success";
    Vue.set(state, "profile", info);
  },
  [USER_ERROR]: state => {
    state.status = "error";
  },
  [AUTH_LOGOUT]: state => {
    state.profile = {};
  }
};

export default {
  state,
  getters,
  actions,
  mutations
};