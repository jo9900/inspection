<template>
  <v-container fluid class="pa-0">
    <Vsnackerbar :show.sync="snackbar" :type="snackbar_type">{{ snackbar_text }}</Vsnackerbar>
    <v-tabs v-model="tabIndex" class="Tab breadcrumbs">
      <v-tab>创建拆包单</v-tab>
      <v-tab v-if="allowView">拆包记录</v-tab>
    </v-tabs>
    <v-tabs-items v-model="tabIndex" class="px-2">
      <v-tab-item>
        <Order :logistics_companies="logistics_companies" />
      </v-tab-item>
      <v-tab-item>
        <v-card flat>
          <v-row v-show="!mobile || showBtns" class="top-wrap">
            <v-col cols="6" sm="4" md="2">
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
            <v-col cols="6" sm="4" md="2">
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
            <v-col cols="6" sm="4" md="2">
              <v-text-field
                  label="单号"
                  clearable
                  v-model.trim="filterParams.code"
              />
            </v-col>
            <v-col cols="6" sm="4" md="2">
              <v-text-field
                  label="物流单号"
                  clearable
                  v-model.trim="filterParams.out_sid"
              />
            </v-col>
            <v-col cols="6" sm="4" md="2">
              <v-text-field
                  label="内部码"
                  clearable
                  v-model.trim="filterParams.inner_code"
              />
            </v-col>
            <v-col cols="6" sm="4" md="2">
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
              <v-btn tile color="primary" v-show="!mobile || showBtns" v-ripple dark @click="onRefresh()">查询</v-btn>
              <v-btn tile color="primary" v-show="!mobile" v-ripple dark @click="createPurchaseOrders()" v-if="$store.getters.allowCreatePurchaseOrder">批量生成进货单</v-btn>
              <v-btn tile color="primary" v-if="!mobile && allowExport" v-ripple dark @click="onExportSOs">导出拆包</v-btn>
              <v-btn tile color="primary" v-if="!mobile && allowExport && allowViewIOs" v-ripple :disabled="isDisabled" @click="onExportIOs">导出初检</v-btn>
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
                  :items="SOs"
                  :items-per-page="itemsPerPage"
                  :footer-props="footer_props"
                  :options.sync="options"
                  :server-items-length="totalLength"
                  :loading="loading"
                  item-key="id"
                  hide-default-header
                  class="elevation-1"
                  @update:page="getAllSOs"
                  show-select
                  @page-count="pagination_length = $event"
              >
                <template v-if="!mobile" v-slot:header="{ props: { headers } }">
                  <thead>
                  <tr>
                    <th :width="header.width" v-for="header in headers" :key="header.text">
                      {{ header.text }}
                    </th>
                  </tr>
                  </thead>
                </template>

                <template v-slot:item.status="{ item }">
                  <v-chip
                      dark
                      color="red"
                      v-if="item.purchase_order_status!=6 &&item.status == 0"
                  >未完成</v-chip>
                  <v-chip
                      dark
                      color="success"
                      v-if="item.purchase_order_status!=6 &&item.status == 6"
                  >已完成</v-chip>
                  <v-chip
                      dark
                      color="cyan"
                      v-if="item.purchase_order_status == 6"
                  >已入库</v-chip>
                </template>
                <template v-slot:item.inner_code="{ item }">
                  <!--                  只显示第一个-->
                  {{ item.inner_code | SpliceInnerCode }}
                </template>
                <template v-slot:item.action="{ item }">
                  <v-btn v-if="item.status==6" small text class="mr-2" @click="editItem(item)">
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
          <v-dialog v-model="showOrderDialog" max-width="800px">
            <Order @Snackerbar="Snackerbar" @afterEdit="afterEdit" :showOrderDialog.sync="showOrderDialog"
                   :data="editingItem" :logistics_companies="logistics_companies" />
          </v-dialog>
        </v-card>
      </v-tab-item>
    </v-tabs-items>
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
              isDisabled: false,
              lineIndex: 0,
              showStartDatePicker: false,
              showEndDatePicker: false,
              filterParams: {
                  start_date: new Date().toISOString().substr(0, 10),
                  end_date: new Date().toISOString().substr(0, 10),
                  out_sid: null,
                  inner_code: null,
                  source_id: null,
                  code: null, //单号
                  status: null
              },
              status: [{
                  value: 0,
                  text: '未完成'
              }, {
                  value: 6,
                  text: '已完成'
              }, {
                  value: 7,
                  text: '已入库'
              }],
              headers: [
                  {
                      text: 'ID',
                      align: 'left',
                      value: 'id'
                  },
                  { text: '单号', value: 'code' },
                  { text: '内部码', value: 'inner_code' },
                  { text: '数量', value: 'total_quantity' },
                  { text: '状态', value: 'status' },
                  { text: '执行人', value: 'executed_user' },
                  { text: '物流单号', value: 'out_sid' },
                  { text: '物流公司', value: 'logistics_company_name' },
                  { text: '卖家', value: 'partner_name' },
                  { text: '操作', value: 'action', width: '210' }
              ],
              options: {},
              loading: false,
              totalLength: 0,
              selectedRow: [],
              SOs: [], // 拆包单列表
              editedIndex: -1,
              editingItem: {},
              showOrderDialog: false,
              logistics_companies: []
          }
        ),
        mounted() {
            this.init()
            this.isAllowExport()
            this.isAllowViewIO()
            let today = new Date()
            this.filterParams.start_date = [today.getFullYear(), today.getMonth() + 1, 1].join('-')
        },
        methods: {
            init() {
                this.getAllLCs()
            },
            getAllLCs() {
                this.axios({
                    url: `/api/logistics_companies`
                }).then(res => {
                    if ( res.state ) {
                        this.logistics_companies = res.root
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })

                })
            },
            editItem(item) {
                this.snackbar = false
                this.editedIndex = this.SOs.indexOf(item)
                this.getSO(item.id)
            },
            deleteItem(item) {
                this.snackbar = false
                const index = this.SOs.indexOf(item)
                confirm(`确认删除拆包单${ item.code }？`) && this.deleteSO({ so_id: item.id, index })
            },
            deleteSO({ so_id, index } = {}) {
                this.axios({
                    url: `/api/sorting_orders/${ so_id }`,
                    method: 'DELETE'
                }).then(res => {
                    if ( res.state ) {
                        this.SOs.splice(index, 1)
                        this.Snackerbar({ bool: true, type: 'success', text: '删除成功' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            getAllSOs() {
                this.loading = true
                document.documentElement.scrollTop = 0
                let params = JSON.parse(JSON.stringify(this.filterParams))
                params.end_date = this.addDay(params.end_date, 1)
                params = Object.assign({}, params, this.reqParams())
                this.SOs = []
                this.axios({
                    url: '/api/sorting_orders?action=view',
                    params
                }).then(res => {
                    this.loading = false
                    if ( res.state ) {
                        this.SOs = res.root
                        this.totalLength = res.total
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            getSO(id) {
                this.axios({
                    url: `/api/sorting_orders/${ id }`
                }).then(res => {
                    if ( res.id ) {
                        this.editingItem = res
                        this.showOrderDialog = true
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })

                })
            },
            afterEdit(cur) {
                Object.assign(this.SOs[this.editedIndex], cur)
            },
            onRefresh() {
                this.getAllSOs()
                this.calcTableHeight()
                this.showBtns = false
            },
            createPurchaseOrders(){
                if (!this.selectedRow.length) return alert('至少选择一记录')
                let arr = []
                for ( let i = 0, len = this.selectedRow.length; i < len; i++ ) {
                    arr.push(this.selectedRow[i].id)
                }
                let ids = arr.join(',')
                this.axios({
                    url: `/api/sorting_orders?action=import_as_purchase_order`,
                    params: {
                        ids
                    }
                }).then(res=> {
                    if (res.state)
                        this.Snackerbar({ bool: true, type: 'success', text: '批量生成进货单成功' })
                    else
                        this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            params(){
                let params = JSON.parse(JSON.stringify(this.filterParams))
                params.end_date = this.addDay(params.end_date, 1)
                return Object.assign({}, params, this.reqParams())
            },
            onExportSOs() {
                let data = {
                    url: `/api/sorting_orders?action=view&format=excel`,
                    params: this.params(),
                    name: '导出拆包信息',
                }
                this.$store.dispatch('exportToExcel', data)
            },
            onExportIOs() {
                this.isDisabled = true
                let data = {
                    url: `/api/sorting_orders?action=view&format=excel&context=inspection_order`,
                    params: this.params(),
                    name: '导出初检信息',
                }
                this.$store.dispatch('exportToExcel', data).finally(() => {
                    this.isDisabled = false
                })
            }
        }
    }
</script>

<style scoped>

</style>
