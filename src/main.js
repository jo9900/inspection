import Vue from 'vue'
import './plugins/axios'
import App from './App.vue'
import router from './router'
import store from './store'
import './components/register'
import vuetify from './plugins/vuetify';
import './mock/mock'
import * as filters from './filters'
Vue.config.productionTip = false

Object.keys(filters).forEach(key => {
    Vue.filter(key, filters[key])
})

new Vue({
    router,
    store,
    vuetify,
    mounted() {
        this.interceptors()
    },
    methods: {
        interceptors() {
            this.$axios.interceptors.request.use(
              config => {
                  config.headers["Token"] = window.sessionStorage.getItem('token');
                  return config
              },
              error => {
                  return Promise.reject(error)
              }
            )
            this.$axios.interceptors.response.use(
              response => {
                  return response.data
              },
              error => {
                  return Promise.reject(error.response)
              }
            )
        }
    },
    render: h => h(App)
}).$mount('#app')
