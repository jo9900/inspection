<template>
  <v-container fluid class="wrap py-0">
    <v-dialog v-model="showPrint" class="pa-4 print">
      <iframe
          style="width: 100%;height:50vh"
          title="PDF文件"
          id="Iframe"
          :src="pdfUrl"
      />
      <v-btn color="primary" @click="printOrder">
        打印
      </v-btn>
    </v-dialog>
    <Vsnackerbar :show.sync="snackbar" :type="snackbar_type">{{ snackbar_text }}</Vsnackerbar>
    <v-row class="top-wrap">
      <v-col cols="6" sm="4" md="2" class="py-0 mt-1">
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
      <v-col cols="6" sm="4" md="2" class="py-0 mt-1">
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
      <v-col cols="6" sm="4" md="2" class="py-0 mt-1">
        <v-select multiple clearable v-model="filterParams.state" :items="states" label="进度" />
      </v-col>
      <v-col cols="6" sm="6" md="4" class="py-0 mt-1">
        <v-text-field
            label="内部码"
            clearable
            append-icon="search"
            autofocus
            placeholder="英文逗号分隔"
            @click:append="onSearch"
            @keyup.enter.native="onSearch"
            v-model.trim="filterParams.inner_codes"
        />
      </v-col>
      <v-col cols="6" sm="4" md="2" class="py-0 mt-1">
        <v-text-field v-model.trim="filterParams.sorting_order_code" label="拆包单号" />
      </v-col>
    </v-row>
    <v-row class="btns-wrap">
      <v-col class="py-0">
        <!--        由于查询这个模块是后来追加的需求，按照客户给的原型图（姑且算）为蓝本开发，开发和测试过程中其又数十次变更、追加需求，导致以下按钮部分是对过滤结果作用，部分是对勾选行作用，部分是对内部码输入框的值直接作用。预计以后可能对按钮的作用感到困惑或需进行优化，故此备注 -->
        <v-btn tile color="primary" v-ripple @click="onSearch()">查询</v-btn>
        <v-btn tile color="primary" v-ripple @click="executeOrders()">执行初检</v-btn>
        <v-btn tile color="primary" v-ripple @click="createPurchaseOrders()">生成进货单</v-btn>
        <v-btn tile color="primary" v-ripple @click="createAssembleOrders()" v-if="$store.getters.allowCreateAssemble">
          生成组装拆卸单
        </v-btn>
        <v-menu open-on-hover v-if="!mobile">
          <template v-slot:activator="{ on }">
            <v-btn tile color="primary" dark v-on="on">导出</v-btn>
          </template>
          <v-list>
            <v-list-item>
              <v-list-item-title @click="onExport('inspection_data')">导出</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title @click="exportIO()" v-if="allowExport && allowViewIOs" :disabled="isDisabled">{{
                isDisabled?'正在导出':'导出初检'}}
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title @click="exportRO()" v-if="allowExport && allowViewROs" :disabled="isDisabledRO">{{
                isDisabled?'正在导出':'导出复检'}}
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title @click="onExport('excel')">导出进度</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-menu open-on-hover v-if="!mobile">
          <template v-slot:activator="{ on }">
            <v-btn tile color="primary" dark v-on="on">打印</v-btn>
          </template>
          <v-list>
            <v-list-item>
              <v-list-item-title @click="onExport('pdf')">打印</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title @click="printInnerCode()">打印内部码</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title @click="printBaseInfo()">打印基础资料</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-btn tile color="primary" v-ripple>
          <label for="excel">
            <v-icon></v-icon>
            导入内部码
          </label>
        </v-btn>
        <input
            style="opacity:0;width: 2px"
            type="file"
            id="excel"
            @change="toJSONObj($event)"
            accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        >
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" class="py-0">
        <v-data-table
            v-model="selectedRow"
            :height="tableHeight"
            fixed-header
            :headers="headers"
            :items="results"
            :items-per-page="itemsPerPage"
            :footer-props="footer_props"
            :options.sync="options"
            :server-items-length="totalLength"
            :loading="loading"
            item-key="index"
            disable-sort
            class="elevation-1"
            @update:page="onSearch"
            show-select
            @page-count="pagination_length = $event"
        >
          <template v-slot:item.sorting_order_status="{ item }">
            <div>
              <v-btn text color="grey" class="mr-1 white--text" v-if="item.sorting_order_status != 6"
                     @click="open(item, 'SO')"
              >
                <v-icon color="grey">check</v-icon>
              </v-btn>
              <v-btn text color="blue darken-1" class="mr-1 white--text" v-else
                     @click="open(item, 'SO')"
              >
                <v-icon>check</v-icon>
              </v-btn>
            </div>
          </template>
          <template v-slot:item.inspection_order_status="{ item }">
            <div>
              <v-btn text color="grey" class="mr-1 white--text" v-if="item.inspection_order_status != 6"
                     @click="open(item, 'IO')"
              >
                <v-icon color="grey">check</v-icon>
              </v-btn>
              <v-btn text color="blue darken-1" class="mr-1 white--text" v-else
                     @click="open(item, 'IO')"
              >
                <v-icon>check</v-icon>
              </v-btn>
            </div>
          </template>
          <template v-slot:item.recheck_order_status="{ item }">
            <div>
              <v-btn text color="grey" class="mr-1 white--text" v-if="item.recheck_order_status != 6"
                     @click="open(item, 'Recheck')"
              >
                <v-icon color="grey">check</v-icon>
              </v-btn>
              <v-btn text color="blue darken-1" class="mr-1 white--text" v-else
                     @click="open(item, 'Recheck')"
              >
                <v-icon>check</v-icon>
              </v-btn>
            </div>
          </template>
          <template v-slot:item.purchase_order_status="{ item }">
            <div>
              <v-btn text color="grey" :ripple="false" class="mr-1 white--text" v-if="item.purchase_order_status != 6">
                <v-icon color="grey">check</v-icon>
              </v-btn>
              <v-btn text color="blue darken-1" :ripple="false" class="mr-1 white--text" v-else>
                <v-icon>check</v-icon>
              </v-btn>
            </div>
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
    <v-dialog
        v-model="show"
        min-width="800"
        max-width="80%"
        v-bind="$props"
        :value="show"
        v-on="$listeners"
    >
      <v-card class="pa-2">
        <div>
          单据状态：
          <v-chip color="green" dark v-if="viewingItem.status ===6">
            已完成
          </v-chip>
          <v-chip color="red" dark v-else>
            未完成
          </v-chip>
          <v-btn
              color="blue darken-1"
              class="px-1 mb-1 ml-3 white--text"
              v-if="!mobile && viewingItem.status ===6"
              @click="printScreen(false)"
          >
            截图
          </v-btn>
        </div>
        <SimplifiedOrder ref="SimplifiedOrder" :data="viewingItem" />
      </v-card>
    </v-dialog>
    <v-dialog
        v-model="showSOSimplified"
        min-width="800"
        max-width="80%"
        v-bind="$props"
        :value="show"
        v-on="$listeners"
    >
      <v-card class="pa-2">
        <div>
          单据状态：
          <v-chip color="green" dark v-if="soData.status ===6">
            已完成
          </v-chip>
          <v-chip color="red" dark v-else>
            未完成
          </v-chip>
          <v-btn
              color="blue darken-1"
              class="px-1 mb-1 ml-3 white--text"
              v-if="!mobile && viewingItem.status ===6"
              @click="printScreen(true)"
          >
            截图
          </v-btn>
        </div>
        <SimplifiedSOOrder ref="SimplifiedSOOrder" :data="soData" />
      </v-card>
    </v-dialog>
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
    import SimplifiedOrder from "@/views/InspectionOrders/SimplifiedOrder"
    import SimplifiedSOOrder from "@/views/SortingOrders/SimplifiedSOOrder"
    import mixin from '@/mixins/mixin'
    import print from '@/mixins/print'
    import XLSX from 'xlsx'

    export default {
        name: "Workspace", // 解释一下查看报告和查询的关系：查看报告这个需求之后又要求新做的界面，虽然是叫批量打印（后来又改名查询），但基本上是对查看报告的升级版 增加了打开单据打印导出等功能。
        mixins: [mixin, print],
        components: { SimplifiedOrder, SimplifiedSOOrder },
        data() {
            return {
                show: false,
                viewingItem: {},
                IO: null,
                showStartDatePicker: false,
                showEndDatePicker: false,
                filterParams: {
                    start_date: new Date().toISOString().substr(0, 10),
                    end_date: new Date().toISOString().substr(0, 10),
                    inner_codes: null,
                    format: null,
                    state: null,
                    sorting_order_code: null
                },
                states: [{
                    value: 1,
                    text: '拆包未完成'
                }, {
                    value: 2,
                    text: '拆包完成'
                }, {
                    value: 3,
                    text: '初检未完成'
                }, {
                    value: 4,
                    text: '初检完成'
                }, {
                    value: 5,
                    text: '复检未完成'
                }, {
                    value: 6,
                    text: '复检完成'
                }, {
                    value: 7,
                    text: '未入库'
                }, {
                    value: 8,
                    text: '已入库'
                }],
                headers: [{
                    text: '内部码',
                    value: 'inner_code'
                }, {
                    text: '型号',
                    value: 'product_name'
                }, {
                    text: '拆包',
                    value: 'sorting_order_status'
                }, {
                    text: '初检',
                    value: 'inspection_order_status'
                }, {
                    text: '复检',
                    value: 'recheck_order_status'
                }, {
                    text: '入库',
                    value: 'purchase_order_status'
                }],
                results: [],
                options: {},
                loading: false,
                totalLength: 0,
                selectedRow: [],
                soData: {},
                showSOSimplified: false,
                showProgress: false,
                progressText: '',
                isDisabled: false,
                isDisabledRO: false,
            }
        },
        mounted() {
            this.isAllowViewIO()
            this.isAllowViewRO()
            this.isAllowExport()
            let today = new Date()
            this.filterParams.start_date = [today.getFullYear(), today.getMonth() + 1, 1].join('-')
        },
        methods: {
            open(item, type) {
                if ( type === 'SO' ) {
                    if ( !item.sorting_order_id ) return alert('未创建')
                    this.getOrder(`/api/sorting_orders/${ item.sorting_order_id }`, true)
                }
                else if ( type === 'IO' ) {
                    if ( !item.inspection_order_id ) return alert('未创建')
                    this.getOrder(`/api/inspection_orders/${ item.inspection_order_id }`)
                }
                else if ( type === 'Recheck' ) {
                    if ( !item.recheck_order_id ) return alert('未创建')
                    this.getOrder(`/api/recheck_orders/${ item.recheck_order_id }`)
                }
            },
            printScreen(bool) { // 截取简化版的单据的页面 并下载
                !bool ? this.$refs.SimplifiedOrder.printScreen() : this.$refs.SimplifiedSOOrder.printScreen()
            },
            getOrder(url, bool) {
                this.axios({
                    url
                }).then(res => {
                    if ( res.id ) {
                        if ( bool ) { // 拆包单的简化版
                            this.soData = res
                            this.showSOSimplified = true
                        }
                        else {
                            this.viewingItem = res
                            this.show = true
                        }
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            params() {
                let params = JSON.parse(JSON.stringify(this.filterParams))
                params.end_date = this.addDay(params.end_date, 1)
                params.state = params.state ? params.state.join(',') : null
                return Object.assign({}, params, this.reqParams())
            },
            onSearch() {
                this.loading = true
                document.documentElement.scrollTop = 0
                this.axios({
                    url: `/api/workspace?action=search`,
                    params: this.params()
                }).then(res => {
                    this.loading = false
                    if ( res.state ) {
                        this.results = res.root
                        this.totalLength = res.total
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            async executeOrders() {
                this.showProgress = true
                this.progressText = ''
                let count = 0
                for ( let i = 0, len = this.selectedRow.length; i < len; i++ ) {
                    let id = this.selectedRow[i].inspection_order_id
                    if ( !id ) continue
                    let res = await this.axios({
                        url: `/api/inspection_orders/${ id }?action=execute`,
                        method: 'POST'
                    })
                    if ( res.state ) {
                        count++
                    }
                }
                this.progressText = `选中${ this.selectedRow.length }，执行成功${ count }条，失败${ this.selectedRow.length - count }`
                this.onSearch()
            },
            createAssembleOrders() {
                if ( !this.filterParams.inner_codes ) return alert('请先导入内部码')
                this.axios({
                    url: `/api/inspection_orders?action=import_as_assemble`,
                    params: {
                        inner_codes: this.filterParams.inner_codes
                    }
                }).then(res => {
                    if ( res.state )
                        this.Snackerbar({ bool: true, type: 'success', text: '批量生成组装拆卸单成功' })
                    else
                        this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            createPurchaseOrders() {
                if ( !this.filterParams.inner_codes ) return alert('请先导入内部码')
                this.axios({
                    url: `/api/inspection_orders?action=import_as_purchase_order`,
                    params: {
                        inner_codes: this.filterParams.inner_codes
                    }
                }).then(res => {
                    if ( res.state )
                        this.Snackerbar({ bool: true, type: 'success', text: '批量生成进货单成功' })
                    else
                        this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            exportIO() {
                if ( !this.filterParams.inner_codes ) return alert('请先导入内部码')

                this.isDisabled = true
                let data = {
                    url: `/api/workspace?action=inspection_line&format=excel`,
                    data: {
                        inner_codes: this.filterParams.inner_codes
                    },
                    name: `初检信息导出`,
                    method: 'POST'
                }
                this.$store.dispatch('exportToExcel', data).finally(() => {
                    this.isDisabled = false
                })
            },
            exportRO() {
                if ( !this.filterParams.inner_codes ) return alert('请先导入内部码')

                this.isDisabledRO = true
                let data = {
                    url: `/api/workspace?action=recheck_line&format=excel`,
                    data: {
                        inner_codes: this.filterParams.inner_codes
                    },
                    name: `复检信息导出`,
                    method: 'POST'
                }
                this.$store.dispatch('exportToExcel', data).finally(() => {
                    this.isDisabledRO = false
                })
            },
            onExport(type) {
                if ( type === 'pdf' && !this.filterParams.inner_codes ) {
                    return alert('必须输入内部码')
                }
                let params = JSON.parse(JSON.stringify(this.filterParams))
                params.end_date = this.addDay(params.end_date, 1)
                params.format = type
                if ( type === 'excel' ) {
                    let data = {
                        url: `/api/workspace?action=search`,
                        params,
                        name: '批量导出进度'
                    }
                    this.$store.dispatch('exportToExcel', data)
                }
                if ( type === 'inspection_data' ) {
                    params.format = 'excel'
                    let data = {
                        url: `/api/workspace?action=search&file_type=inspection_data`,
                        params,
                        name: '导出查询'
                    }
                    this.$store.dispatch('exportToExcel', data)
                }
                if ( type === 'pdf' ) {
                    this.printView(`/api/workspace?action=search`, null, 'GET', params)
                }
            },
            printInnerCode() {
                let url = `/api/workspace?action=search`
                let data = {
                    format: 'pdf',
                    order_type: 'sorting_order',
                    inner_codes: this.filterParams.inner_codes
                }
                this.printView(url, data)
            },
            printBaseInfo() {
                let url = `/api/workspace?action=search`
                let data = {
                    format: 'pdf',
                    order_type: 'inspection_order',
                    inner_codes: this.filterParams.inner_codes
                }
                this.printView(url, data)
            },
            toJSONObj($event) {
                let files = $event.target.files
                if ( files.length === 0 ) return
                let jsonResult = ''
                let file = files[0]
                let _this = this
                let reader = new FileReader()
                reader.readAsBinaryString(file)
                reader.onload = function (e) {   //处理load事件。读取操作完成时触发。
                    let data = e.target.result
                    let workbook = XLSX.read(data, { type: 'binary' })
                    let sheetNames = workbook.SheetNames
                    let worksheet = workbook.Sheets[sheetNames[0]] // 只读取第一张sheet
                    jsonResult = XLSX.utils.sheet_to_json(worksheet)
                    _this.getInnerCodes(jsonResult)
                };
                $event.target.value = ''
            },
            getInnerCodes(arr) {
                let codeArr = arr.map(row => {
                    if ( row['内部码'] != null ) return row['内部码']
                })
                this.filterParams.inner_codes = codeArr.join(',')
            }
        }
    }
</script>

<style scoped>
[role="menu"] .v-list-item__title{
   cursor: pointer;
}
</style>
