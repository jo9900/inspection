import axios from 'axios'

axios.defaults.baseURL = process.env.VUE_APP_API_URL

export default {
    login({ commit }, userData) {
        return new Promise((resolve, reject) => {
            commit('auth_request')
            axios.post('/api/login', userData)
              .then(response => {
                  if ( !response.data.state ) {
                      return alert(response.data.errmsg)
                  }
                  let _userData = JSON.parse(userData)
                  const token = response.data.token
                  const SK = response.data.security_keys
                  const user = _userData.name
                  const set_of_book = _userData.set_of_book
                  sessionStorage.setItem('token', token)
                  sessionStorage.setItem('user', user)
                  sessionStorage.setItem('user_id', response.data.user_id)
                  sessionStorage.setItem('set_of_book', set_of_book)
                  sessionStorage.setItem('SK', JSON.stringify(SK))
                  commit('auth_success', { token, user })
                  resolve(response)
              })
              .catch(err => {
                  commit('auth_error')
                  sessionStorage.removeItem('token')
                  sessionStorage.removeItem('SK')
                  reject(err)
              })
        })
    },
    logout({ commit }) {
        return new Promise((resolve) => {
            commit('logout')
            sessionStorage.removeItem('token')
            sessionStorage.removeItem('SK')
            resolve()
        })
    },
    exportToExcel({ commit }, dataObj) {
        commit('auth_request')
        const { url, params, data, name, method } = dataObj
        return new Promise((resolve, reject) => {
            axios({
                url,
                responseType: 'blob',
                params,
                data,
                method: method || 'GET',
                headers: { 'Token': this.state.token }
            }).then(res => {
                if ( !res.data ) return
                let blob = new Blob([res.data], { type: "text/csv" });
                let a = document.createElement('a');
                document.body.appendChild(a);
                a.style = 'display: none';
                let url = window.URL.createObjectURL(blob);
                a.href = url;
                a.download = `${ name }.xlsx`;
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url)
                resolve(res)
            }).catch(e => {
                alert('导出失败')
                reject(e)
            })
        })
    }
}
