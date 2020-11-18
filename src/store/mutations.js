export default {
    auth_request(state) {
        state.authStatus = 'loading'
    },
    auth_success(state, { token, user }) {
        state.authStatus = 'success'
        state.token = token
        state.user = user
        // 判断是否是超级管理员
        let SKStr = window.sessionStorage.getItem('SK')
        if ( !SKStr || !JSON.parse(SKStr) ) return
        state.SK = JSON.parse(SKStr)
        for ( let i = 0, len = state.SK.length; i < len; i++ ) {
            if ( state.SK[i].lcode === '/data/admin' ) {
                state.isAdmin = state.SK[i].checked
                continue
            }
            if ( state.SK[i].lcode === '/data/import_as_purchase_order' ) {
                state.allowCreatePurchaseOrder = state.SK[i].checked
                continue
            }
            if ( state.SK[i].lcode === '/data/import_as_assemble' ) {
                state.allowCreateAssemble = state.SK[i].checked
            }
        }
    },
    auth_error(state) {
        state.authStatus = 'error'
    },
    logout(state) {
        state.authStatus = ''
        state.token = ''
    }
}
