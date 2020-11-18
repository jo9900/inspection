
export function FormatBool(boolean){
    if (!boolean)
        return '否'
    return '是'
}
export function BillType(type){
    if (type == 0) {
        return '收据'
    } else if(type == 1) {
        return '发票'
    } else {
        return '增值税发票'
    }
}
export function SpliceInnerCode(inner_code_str) {
    if (inner_code_str) {
        return inner_code_str.split(',')[0]
    }
    return inner_code_str
}
export function  FormatOrderType(type) {
    if (!type) return '不限'
    if (type == 1) return '初检单'
    if (type == 2) return '复检单'
}
export function Roundup(value) {
    let precision = 2
    if (value === '' || value == null) return ''
    if (value === 0) return 0
    let  tmp = Math.pow(10, precision)
    return (Math.round(value * tmp) / tmp).toFixed(precision)
}

