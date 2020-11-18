export default {
    authStatus: '',
    token: sessionStorage.getItem('token') || '',
    user: {},
    isAdmin: false,
    SK: undefined,
    allowCreatePurchaseOrder: false,
    allowCreateAssemble: false,
}
