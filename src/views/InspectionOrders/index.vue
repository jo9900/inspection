<template>
  <v-container fluid class="pa-0">
    <Vsnackerbar :show.sync="snackbar" :type="snackbar_type">{{ snackbar_text }}</Vsnackerbar>
    <v-tabs v-model="tabIndex" class="Tab breadcrumbs">
      <v-tab>创建{{ name }}单</v-tab>
      <v-tab v-if="allowView">{{ name }}记录</v-tab>
    </v-tabs>
    <v-tabs-items v-model="tabIndex" class="px-2">
      <v-tab-item>
        <v-btn v-if="mobile" @click="openScan" class="float-left mt-3 mr-3" outlined color="blue">扫描内部码</v-btn>
        <v-text-field
            label="内部码"
            v-model="inner_code"
            append-icon="search"
            :autofocus="!mobile"
            @click:append="searchOrder(inner_code)"
            @keyup.enter.native="searchOrder(inner_code)"
        />
        <Order
            v-show="showOrder"
            @Snackerbar="Snackerbar"
            @hide="showOrder= false"
            :order="order"
            :product_types="product_types"
            :brands="brands"
        />
      </v-tab-item>
      <v-tab-item>
        <v-card flat>
          <v-row v-show="!mobile || showBtns" class="top-wrap">
            <v-col cols="6" md="2" class="py-0">
              <v-menu
                  ref="menu1"
                  v-model="showStartDatePicker"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                  max-width="290px"
                  min-width="290px"
              >
                <template v-slot:activator="{ on }">
                  <v-text-field
                      v-model="filterParams.start_date"
                      label="开始时间"
                      prepend-inner-icon="event"
                      readonly
                      v-on="on"
                  />
                </template>
                <v-date-picker locale="zh-cn" v-model="filterParams.start_date" no-title
                               @input="showStartDatePicker = false" />
              </v-menu>
            </v-col>
            <v-col cols="6" md="2" class="py-0">
              <v-menu
                  ref="menu1"
                  v-model="showEndDatePicker"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                  max-width="290px"
                  min-width="290px"
              >
                <template v-slot:activator="{ on }">
                  <v-text-field
                      v-model="filterParams.end_date"
                      label="结束时间"
                      prepend-inner-icon="event"
                      readonly
                      v-on="on"
                  />
                </template>
                <v-date-picker locale="zh-cn" v-model="filterParams.end_date" no-title
                               @input="showEndDatePicker = false" />
              </v-menu>
            </v-col>
            <v-col cols="6" md="1" class="py-0">
              <v-text-field
                  label="单号"
                  clearable
                  v-model.trim="filterParams.code"
              />
            </v-col>
            <v-col cols="6" md="2" class="py-0">
              <v-text-field
                  label="拆包单号"
                  clearable
                  v-model.trim="filterParams.sorting_order_code"
              />
            </v-col>
            <v-col cols="6" md="2" class="py-0">
              <v-text-field
                  label="内部码"
                  clearable
                  v-model.trim="filterParams.inner_code"
              />
            </v-col>
            <v-col cols="6" md="1" class="py-0">
              <v-text-field
                  label="IMEI"
                  clearable
                  v-model.trim="filterParams.imei"
              />
            </v-col>
            <v-col cols="6" md="2" class="py-0">
              <v-select
                  clearable
                  clear-icon="clear"
                  label="状态"
                  v-model="filterParams.status"
                  :items="status"
              />
            </v-col>
          </v-row>
          <v-row class="btns-wrap">
            <v-col cols="12" md="6" class="d-flex align-center py-0">
              <v-btn tile color="primary" v-ripple dark v-show="mobile && !showBtns" @click="showBtns = true">打开过滤
              </v-btn>
              <v-btn tile color="primary" v-show="!mobile || showBtns"
                     v-ripple dark @click="onRefresh()">查询
              </v-btn>
              <v-btn tile color="primary"
                     v-ripple dark @click="executeOrders()">批量执行
              </v-btn>
              <v-btn tile color="primary" v-if="sources =='recheck_orders' && !mobile && allowExport && allowViewROs" v-ripple
                     :disabled="isDisabledRO" @click="exportRO">导出复检
              </v-btn>
              <v-btn tile color="primary" v-if="mobile"
                     @click="scanInnerCode">扫描内部码
              </v-btn>
            </v-col>
          </v-row>
          <!--          拆包记录表-->
          <v-row>
            <v-col cols="12" class="py-0">
              <v-data-table
                  v-model="selectedRow"
                  :height="tableHeight"
                  fixed-header
                  :headers="headers"
                  :items="orders"
                  :items-per-page="itemsPerPage"
                  :footer-props="footer_props"
                  :options.sync="options"
                  :server-items-length="totalLength"
                  :loading="loading"
                  item-key="id"
                  disable-sort
                  class="elevation-1"
                  @update:page="getAllOrders"
                  show-select
                  @page-count="pagination_length = $event"
              >

                <template v-slot:item.status="{ item }">
                  <v-chip
                      dark
                      :color="statusColor(item)"
                  >
                    {{ format_status(item.status) }}
                  </v-chip>
                </template>
                <template v-slot:item.executed_user="{ item }">
                  {{ item.executed_user || item.executed2_user || item.executed1_user }}
                </template>
                <template v-slot:item.action="{ item }">
                  <v-btn small text @click="viewItem(item)">
                    查看
                  </v-btn>
                  <v-btn v-if="isShowEditBtn(item.status)" small text class="mr-2" @click="editItem(item)">
                    编辑
                  </v-btn>
                  <v-btn v-if="isShowDelBtn(item.status)" small text @click="deleteItem(item)">
                    删除
                  </v-btn>
                </template>
                <template v-slot:no-data>
                  无数据
                </template>
                <template v-slot:no-results>
                  没有符合条件的结果
                </template>
              </v-data-table>
            </v-col>
          </v-row>
          <v-dialog v-model="showOrderDialog" :fullscreen="mobile" min-width="800" max-width="80%">
            <Order
                @Snackerbar="Snackerbar"
                @afterEdit="afterEdit"
                :showOrderDialog.sync="showOrderDialog"
                :data="editingItem"
                :product_types="product_types"
                :brands="brands" />
          </v-dialog>
        </v-card>
      </v-tab-item>
    </v-tabs-items>
    <v-dialog
        v-model="showProgress"
        dark
        max-width="290"
    >
      <v-card class="pa-3">
        {{ progressText }}
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
    import mixin from '@/mixins/mixin'
    import Order from "./Order"

    export default {
        name: "index",
        components: { Order },
        mixins: [mixin],
        data: () => ( {
              showBtns: false,
              tabIndex: null,
              allowDelete: false,
              allowView: false,
              allowEdit: false,
              showOrder: false, // 表单区域
              lineIndex: 0,
              showStartDatePicker: false,
              showEndDatePicker: false,
              filterParams: {
                  start_date: new Date().toISOString().substr(0, 10),
                  end_date: new Date().toISOString().substr(0, 10),
                  inner_code: undefined,
                  code: undefined, //单号
                  status: undefined,
                  imei: undefined,
                  sorting_order_code: undefined
              },
              status: [{
                  value: 0,
                  text: '未完成'
              }, {
                  value: 1,
                  text: '一次执行'
              }, {
                  value: 2,
                  text: '二次执行'
              }, {
                  value: 6,
                  text: '已完成'
              }],
              headers: [
                  {
                      text: 'ID',
                      align: 'left',
                      value: 'id'
                  },
                  { text: '单号', value: 'code' },
                  { text: '内部码', value: 'inner_code' },
                  { text: '商品类型', value: 'product_type_name' },
                  { text: '商品品牌', value: 'brand_name' },
                  { text: '商品型号', value: 'product_name' },
                  { text: '卖家', value: 'partner_name' },
                  { text: '状态', value: 'status' },
                  { text: '执行人', value: 'executed_user' },
                  { text: '操作', value: 'action', width: '200' }
              ],
              options: {},
              loading: false,
              totalLength: 0,
              selectedRow: [],
              orders: [], // 初检单/复检单列表
              editedIndex: -1,
              editingItem: {},
              viewingItem: {},
              showOrderDialog: false,
              order: undefined,
              inner_code: undefined,
              product_types: [],
              brands: [],
              sources: '',
              name: '',
              showProgress: false,
              progressText: '',
              isDisabledRO: false
          }
        ),
        watch: {
            '$route': {
                handler(cur) {
                    this.tabIndex = null
                    // 在初检和复检切换时需要清空一些data
                    this.filterParams = this.$options.data().filterParams
                    this.inner_code = this.$options.data().inner_code
                    this.showOrder = false
                    this.getStartDate()
                    this.orders = []
                    if ( cur.name === 'inspection' ) {
                        this.sources = 'inspection_orders'
                        this.name = '初检'
                    }
                    if ( cur.name === 'recheck' ) {
                        this.sources = 'recheck_orders'
                        this.name = '复检'
                    }
                },
                immediate: true
            }
        },
        mounted() {
            this.init()
            this.isAllowViewRO()
            this.isAllowExport()
            this.getStartDate()
        },
        methods: {
            init() {
                this.getAllBrands()
                this.getAllPTs()
            },
            getStartDate() {
                let today = new Date()
                this.filterParams.start_date = [today.getFullYear(), today.getMonth() + 1, 1].join('-')
            },
            getAllPTs() {
                this.axios({
                    url: `/api/product_types`
                }).then(res => {
                    if ( res.state === 1 ) {
                        this.product_types = res.root
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })

                })
            },
            getAllBrands() {
                this.axios({
                    url: `/api/brands`
                }).then(res => {
                    if ( res.state ) {
                        this.brands = res.root
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })

                })
            },
            searchOrder(inner_code) {
                if ( inner_code == null || inner_code === '' ) return
                this.axios({
                    url: `/api/${ this.sources }?action=generate`,
                    params: {
                        inner_code
                    }
                }).then(res => {
                    this.order = undefined
                    if ( res.state === 1 ) {
                        this.showOrder = true
                        this.order = res
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            scanInnerCode() {
                let _this = this
                const callback = res => {
                    if ( res && res.total ) {
                        let id = res.root[0].id
                        _this.getOrder(id)
                    }
                }
                const successCallback = result => {
                    let innerCode = result.text
                    _this.filterOrders({ inner_code: innerCode }, callback)
                }
                this.onBarcodeScanner(successCallback)
            },
            openScan() {
                let _this = this
                const successCallback = result => {
                    _this.inner_code = result.text
                }
                this.onBarcodeScanner(successCallback)
            },
            viewItem(item) { // 查看已经完成的单子 简要显示
                this.snackbar = false
                this.editedIndex = this.orders.indexOf(item)
                this.getOrder(item.id, 'view')
            },
            editItem(item) {
                this.snackbar = false
                this.editedIndex = this.orders.indexOf(item)
                this.getOrder(item.id, 'edit')
            },
            deleteItem(item) {
                const index = this.orders.indexOf(item)
                confirm(`确认删除${ this.name }单${ item.code }？`) && this.deleteOrder({ order_id: item.id, index })
            },
            deleteOrder({ order_id, index } = {}) {
                this.axios({
                    url: `/api/${ this.sources }/${ order_id }`,
                    method: 'DELETE'
                }).then(res => {
                    if ( res.state ) {
                        this.orders.splice(index, 1)
                        this.Snackerbar({ bool: true, type: 'success', text: '删除成功' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            afterEdit(cur) {
                Object.assign(this.orders[this.editedIndex], cur)
            },
            params(){
                let params = JSON.parse(JSON.stringify(this.filterParams))
                params.end_date = this.addDay(params.end_date, 1)
                return Object.assign({}, params, this.reqParams())
            },
            getAllOrders() {
                this.loading = true
                document.documentElement.scrollTop = 0
                this.orders = []
                let callback = (res) => {
                    this.orders = res.root
                    this.totalLength = res.total
                }
                this.filterOrders(this.params(), callback)
            },
            filterOrders(params, callback) {
                this.axios({
                    url: `/api/${ this.sources }?action=view`,
                    params
                }).then(res => {
                    this.loading = false
                    if ( res.state ) {
                        callback(res)
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            getOrder(id, type) {
                let showSimplified = false
                if ( type === 'view' ) {
                    showSimplified = true
                }
                this.axios({
                    url: `/api/${ this.sources }/${ id }`
                }).then(res => {
                    if ( res.id ) {
                        this.editingItem = res
                        this.editingItem.showSimplified = showSimplified
                        this.showOrderDialog = true
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            onRefresh() {
                this.getAllOrders()
                this.calcTableHeight()
                this.showBtns = false
            },
            async executeOrders() {
                this.showProgress = true
                this.progressText = ''
                let count = 0
                for ( let i = 0, len = this.selectedRow.length; i < len; i++ ) {
                    let id = this.selectedRow[i].id
                    let res = await this.axios({
                        url: `/api/${ this.sources }/${ id }?action=execute`,
                        method: 'POST'
                    })
                    if ( res.state ) count++
                }
                this.progressText = `选中${ this.selectedRow.length }，执行成功${ count }条，失败${ this.selectedRow.length - count }`
                await this.onRefresh()
            },
            statusColor(item) {
                let color = ''
                switch ( item.status ) {
                    default:
                        color = 'red'
                        break
                    case 1:
                        color = 'amber'
                        break;
                    case 2:
                        color = 'info'
                        break
                    case 6:
                        color = 'success'
                }
                return color
            },
            format_status(flag) {
                let text = ''
                switch ( flag ) {
                    default:
                        text = '未完成'
                        break
                    case 1:
                        text = '一次执行'
                        break;
                    case 2:
                        text = '二次执行'
                        break
                    case 6:
                        text = '已完成'
                }
                return text
            },
            exportRO() {
                this.isDisabledRO = true
                let data = {
                    url: `/api/recheck_orders?action=view&format=excel`,
                    params: this.params(),
                    name: `复检信息导出`
                }
                this.$store.dispatch('exportToExcel', data).finally(() => {
                    this.isDisabledRO = false
                })
            },
        }
    }
</script>
<style lang="less">

  .img-small {
    width: 200px;
    z-index: auto;
  }

  .img-expand {
    width: auto;
    max-width: 70vw;
    z-index: 1000;
  }

</style>
