export default {
    data() {
        return {
            snackbar: false,
            snackbar_type: '',
            snackbar_text: '',
            footer_props: {
                'show-current-page': true,
                'show-first-last-page': true
            },
            screenHeight: document.documentElement.clientHeight,
            tableHeight: '',
            allowEdit: false,
            allowDelete: false,
            allowCreate: false,
            allowView: false,
            allowPrint: false, // 单据有这一项
            allowExport: false,
            allowViewIOs: false,
            allowViewROs: false,
            mobile: null,
            itemsPerPage: 50,
            bill_types: [{
                value: 0,
                text: '收据'
            }, {
                value: 1,
                text: '发票'
            }, {
                value: 2,
                text: '增值税发票'
            }],
            order_types: [{
                value: null,
                text: '不限'
            }, {
                value: 1,
                text: '初检单'
            }, {
                value: 2,
                text: '复检单'
            }]

        }
    },
    created() {
        this.checkSK()
    },
    mounted() {
        this.mobile = !!navigator.userAgent.match(/(iPhone|iPod|Android|ios)/i)
        this.calcTableHeight()
        this.resize()
    },
    methods: {
        checkSK() { // 确定是否有编辑 新建 删除的权限 以控制按钮的状态
            let SK = this.$store.getters.SK
            if ( !SK ) return
            let _SK = {}
            for ( let i = 0, len = SK.length; i < len; i++ ) {
                if ( SK[i].lcode === this.$route.meta.lcode ) {
                    _SK = SK[i]
                    break
                }
            }
            if ( _SK == {} ) return
            let { needed_access_level, access_level } = _SK
            // eslint-disable-next-line no-unused-vars
            let level = 0
            if ( ( 1 & needed_access_level ) === 1 ) {//查看
                if ( ( 1 & access_level ) === 1 ) {
                    level += 1;
                    this.allowView = true
                }
            }
            if ( ( 2 & needed_access_level ) === 2 ) {//编辑
                if ( ( 2 & access_level ) === 2 ) {
                    level += 2;
                    this.allowEdit = true
                }
            }

            if ( ( 4 & needed_access_level ) === 4 ) {//新建
                if ( ( 4 & access_level ) === 4 ) {
                    level += 4;
                    this.allowCreate = true
                }
            }
            if ( ( 8 & needed_access_level ) === 8 ) {//删除
                if ( ( 8 & access_level ) === 8 ) {
                    level += 8;
                    this.allowDelete = true
                }
            }
            if ( ( 16 & needed_access_level ) === 16 ) {//打印
                if ( ( 16 & access_level ) === 16 ) {
                    level += 16;
                    this.allowPrint = true
                }
            }
        },
        refreshPage() {
            window.history.go(0)
        },
        reqParams() {
            const { page } = this.options
            return {
                start: ( page - 1 ) * this.itemsPerPage || 0,
                limit: this.itemsPerPage
            }
        },
        resize() {
            window.onresize = () => {
                return ( () => {
                    this.screenHeight = document.documentElement.clientHeight
                } )()
            }
        },
        calcTableHeight() {
            let topWrap = document.querySelector('.top-wrap') != null ? document.querySelector('.top-wrap').offsetHeight : 0
            let Header = document.querySelector('.main-header') != null ? document.querySelector('.main-header').offsetHeight : 0
            let Breadcrumbs = document.querySelector('.breadcrumbs') != null ? document.querySelector('.breadcrumbs').offsetHeight : 0
            let Btns = document.querySelector('.btns-wrap') != null ? document.querySelector('.btns-wrap').offsetHeight : 0
            let Footer = document.querySelector('.main-footer') != null ? document.querySelector('.main-footer').offsetHeight : 0
            let tableFooter = document.querySelector('.v-data-footer') != null ? document.querySelector('.v-data-footer').offsetHeight : 0

            if ( this.mobile ) {
                this.tableHeight = this.screenHeight - Btns - Breadcrumbs - Header - Footer - tableFooter
                return
            }
            this.tableHeight = this.screenHeight - Btns - Breadcrumbs - Header - Footer - topWrap - tableFooter
            if ( this.$route.path.includes('/dashboard/info/') || this.$route.path.includes('/dashboard/reports/') ) {
                this.tableHeight = this.tableHeight - 24 // 24是 container的上下padding
            }
        },
        Snackerbar({ bool, type = '', text = 'error' } = {}) {
            this.snackbar = bool
            this.snackbar_type = type
            this.snackbar_text = text
        },
        onCreate() {
            this.dialog = true
        },
        close() {
            this.dialog = false
            setTimeout(() => {
                this.editedItem = Object.assign({}, this.defaultItem)
                this.editedIndex = -1
            }, 300)
        },
        addDay(dateStr, day) {
            if ( dateStr == "" ) {
                return dateStr;
            }
            var date = new Date(dateStr);
            date = date.valueOf();
            date = date + day * 24 * 60 * 60 * 1000;
            date = new Date(date);
            date = date.getFullYear() + "-" + ( date.getMonth() + 1 ) + "-" + date.getDate()
            return date;
        },
        diffDay(date1, date2) { //date1-date2
            var hm_date1 = date1.getTime(); //date1的毫秒数
            var hm_date2 = date2.getTime();
            var hm_diff = hm_date1 - hm_date2;
            var day = hm_diff / ( 1000 * 60 * 60 * 24 );
            return day;
        },
        isAllowExport() {
            let SK = this.$store.getters.SK
            for ( let i = 0, len = SK.length; i < len; i++ ) {
                if ( SK[i].lcode === '/data/export' ) {
                    this.allowExport = SK[i].checked
                    break
                }
            }
        },
        isAllowViewIO() {
            // 需要在拆包记录页面导出初检信息 权限为 初检查看权限+导出权限 对是否有拆包查看权限不限制
            let SK = this.$store.getters.SK
            for ( let i = 0, len = SK.length; i < len; i++ ) {
                if ( SK[i].lcode === "/order/inspection_order" ) {
                    let { needed_access_level, access_level } = SK[i]
                    if ( ( 1 & needed_access_level ) === 1 ) {// 查看
                        if ( ( 1 & access_level ) === 1 ) {
                            this.allowViewIOs = true
                        }
                    }
                    break
                }
            }
        },
        isAllowViewRO() {
            let SK = this.$store.getters.SK
            for ( let i = 0, len = SK.length; i < len; i++ ) {
                if ( SK[i].lcode === "/order/recheck_order" ) {
                    let { needed_access_level, access_level } = SK[i]
                    if ( ( 1 & needed_access_level ) === 1 ) {// 查看
                        if ( ( 1 & access_level ) === 1 ) {
                            this.allowViewROs = true
                        }
                    }
                    break
                }
            }
        },
        onBarcodeScanner(successCallback) {
            if ( !this.mobile ) return
            // eslint-disable-next-line no-undef
            cordova.plugins.barcodeScanner.scan(successCallback,
              function (error) {
                  alert("Scanning failed: " + error);
              }, {
                  preferFrontCamera: false, // iOS and Android
                  showFlipCameraButton: true, // iOS and Android
                  showTorchButton: true, // iOS and Android
                  torchOn: false, // Android, launch with the torch switched on (if available)
                  saveHistory: true, // Android, save scan history (default false)
                  resultDisplayDuration: 500, // Android, display scanned text for X ms. 0 suppresses it entirely,
                                              // default 1500
                  formats: "CODE_128",
                  orientation: "portrait", // Android only (portrait|landscape), default unset so it rotates with the
                                           // device
                  disableAnimations: true, // iOS
                  disableSuccessBeep: false // iOS and Android
              }
            )
        },
        isShowDelBtn(status) {
            if ( !this.$store.getters.isAdmin ) {
                if ( status == 0 && !this.allowDelete || status != 0 )
                    return false
            }
            return true
        },
        isShowEditBtn(status) {
            if ( !this.$store.getters.isAdmin ) {
                if ( ( status < 6 && !this.allowEdit ) || status == 6 )
                    return false
            }
            return true
        }

    },
    watch: {
        screenHeight: {
            handler(cur) {
                this.screenHeight = cur
                this.calcTableHeight()
            }
        },
        dialog(val) {
            val || this.close()
        }
    }
}
