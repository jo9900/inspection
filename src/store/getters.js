
// authorized lets you know if the token is true or not
export default {
    authorized: state => !!state.token,
    SK: state => state.SK,
    isAdmin: state => state.isAdmin,
    allowCreatePurchaseOrder: state => state.allowCreatePurchaseOrder,
    allowCreateAssemble: state => state.allowCreateAssemble
};
