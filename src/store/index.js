import { createStore } from "vuex";

export default createStore({
  state: {
    files: [],
    searchResults: [],
    pageStart: "",
    pageEnd: "",
  },
  getters: {},
  mutations: {
    getFiles(state, payload) {
      state.files = payload;
    },
    pageStart(state, payload) {
      state.pageStart = payload
    },
    pageEnd(state, payload) {
      state.pageEnd = payload
    },
  },
  actions: {},
  modules: {},
});
