<template>
  <v-container fluid class="wrap py-0">
    <Vsnackerbar :show.sync="snackbar" :type="snackbar_type">{{ snackbar_text }}</Vsnackerbar>
    <div v-if="!allowIO && !allowRecheck">无初检单和复检的查看权限</div>
    <div v-else>
      <v-row>
        <v-col cols="6" md="3" lg="2">
          <v-select
              :items="items"
              v-model="type"
              label="单据类型"
          />
        </v-col>
        <v-col cols="6" md="3">
          <v-text-field
              label="内部码"
              clearable
              @focus="inner_code = ''"
              append-icon="search"
              @click:append="onSearch(inner_code)"
              @keyup.enter.native="onSearch(inner_code)"
              v-model.trim="inner_code"
          />
        </v-col>
        <v-btn tile color="primary" class="ml-1" v-if="mobile"
               @click="openScan">扫描内部码
        </v-btn>
      </v-row>
      <div v-show="show">
        单据状态：
        <v-chip color="green" dark v-if="viewingItem.status ===6">
          已完成
        </v-chip>
        <v-chip color="red" dark v-else>
          未完成
        </v-chip>
        <v-btn
            color="blue"
            class="px-1 mb-1 ml-3 white--text"
            v-if="!mobile && viewingItem.status ===6"
            @click="printScreen"
        >
          截图
        </v-btn>
      </div>
      <SimplifiedOrder v-show="show" ref="SimplifiedOrder" :data="viewingItem" :IO="IO" />
    </div>
  </v-container>
</template>

<script>
    import SimplifiedOrder from "@/views/InspectionOrders/SimplifiedOrder"
    import mixin from '@/mixins/mixin'

    export default {
        name: "ViewOrders", // 在基础资料 拆包 初检 复检这四个项目一开始就确定下来的模块后追加的模块
        mixins: [mixin],
        components: { SimplifiedOrder },
        data() {
            return {
                items: ['初检单', '复检单'],
                show: false,
                allowIO: false,
                allowRecheck: false,
                viewingItem: {},
                IO: null,
                inner_code: '',
                type: '初检单',
                sources: 'inspection_orders'
            }
        },
        created() {
            let SK = window.sessionStorage.getItem('SK')
            if ( !SK || !JSON.parse(SK) ) return
            SK = JSON.parse(SK)
            for ( let i = 0, len = SK.length; i < len; i++ ) {
                if ( SK[i].lcode === '/order/inspection_order' ) {
                    this.allowIO = SK[i].checked
                }
                if ( SK[i].lcode === '/order/recheck_order' ) {
                    this.allowRecheck = SK[i].checked
                }
            }
        },
        methods: {
            onSearch(inner_code) {
                if ( inner_code == null || inner_code === '' ) {
                    this.show = false
                    this.viewingItem = {}
                    return
                }
                this.axios({
                    url: `/api/${ this.sources }?action=view`,
                    params: {
                        inner_code
                    }
                }).then(res => {
                    this.viewingItem = {}
                    if ( !res.total ) {
                        return alert('无此单')
                    }
                    if ( res.state === 1 ) {
                        this.getOrder(res.root[0].id)
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            getOrder(id) {
                this.axios({
                    url: `/api/${ this.sources }/${ id }`
                }).then(res => {
                    if ( res.id ) {
                        this.viewingItem = res
                        this.show = true
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            printScreen() { // 截取简化版的单据的页面 并下载
                this.$refs.SimplifiedOrder.printScreen()
            },
            openScan() {
                let _this = this
                const successCallback = result => {
                    _this.inner_code = result.text
                    _this.onSearch(result.text)
                }
                this.onBarcodeScanner(successCallback)
            },
        },
        watch: {
            'type': {
                handler(cur) {
                    if ( cur === '初检单' ) {
                        this.sources = 'inspection_orders'
                    }
                    else {
                        this.sources = 'recheck_orders'
                    }
                },
                immediate: true
            }
        }
    }
</script>

<style scoped>

</style>
