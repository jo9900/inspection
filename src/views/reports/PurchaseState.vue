<template>
  <v-container class="wrap">
    <Vsnackerbar :show.sync="snackbar" :type="snackbar_type">{{ snackbar_text }}</Vsnackerbar>
    <v-breadcrumbs :items="nav_items" class="breadcrumbs pa-0">
      <template v-slot:item="{ item }">
        <v-breadcrumbs-item
            @click="refreshPage"
            :disabled="item.disabled"
        >
          <span :class="item.disabled? 'grey--text':'primary--text'">{{ item.text }}</span>
        </v-breadcrumbs-item>
      </template>
    </v-breadcrumbs>
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
        <v-select
            clearable
            v-model="filterParams.purchase_order_status"
            :items="purchase_order_status"
            label="进货单状态"
        />
      </v-col>
      <v-col cols="6" sm="4" md="2" class="py-0 mt-1">
        <v-text-field v-model.trim="filterParams.user_name" @keyup.enter="onRefresh()"  label="员工名" />
      </v-col>
      <v-col cols="12" sm="4" md="2" class="py-0 mt-1">
        <v-text-field v-model.trim="filterParams.inner_code" @keyup.enter="onRefresh()"  label="内部码" />
      </v-col>
      <v-col cols="12" sm="4" md="2" class="py-0 mt-1">
        <v-text-field v-model.trim="filterParams.purchase_order_code" @keyup.enter="onRefresh()"  label="进货单号" />
      </v-col>
    </v-row>
    <v-row class="btns-wrap">
      <v-col class="py-0">

          <v-btn tile color="primary" v-ripple dark @click="onRefresh()">查询</v-btn>
          <v-btn tile color="primary" v-if="allowCreate" v-ripple dark @click="onExport()">导出</v-btn>

      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" class="py-0">
        <v-data-table
            :height="tableHeight"
            fixed-header
            :headers="headers"
            :items="lists"
            :items-per-page="itemsPerPage"
            :footer-props="footer_props"
            :options.sync="options"
            :server-items-length="totalLength"
            :loading="loading"
            @update:page="getData"
            item-key="id"
            hide-default-header
            class="elevation-1"
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
          <template v-slot:item.purchase_order_status="{ item }" >
            {{ format(item.purchase_order_status) }}
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
  </v-container>
</template>

<script>
    import mixin from "../../mixins/mixin"

    export default {
        name: "PurchaseState",
        mixins: [mixin],
        data: () => ( {
            nav_items: [{
                text: '报表',
                disabled: true
            }],
            showStartDatePicker: false,
            showEndDatePicker: false,
            totalLength: 0,
            loading: true,
            options: {},
            lists: [],
            headers: [
                {
                    text: '进货单号',
                    value: 'purchase_order_code'
                },
                {
                    text: '内部码',
                    value: 'inner_code'
                },
                {
                    text: '创建人',
                    value: 'purchase_created_user'
                },
                {
                    text: '创建时间',
                    value: 'purchase_created_at'
                },
                {
                    text: '单据状态',
                    value: 'purchase_order_status'
                }
            ],
            filterParams: {
                start_date: new Date().toISOString().substr(0, 10),
                end_date: new Date().toISOString().substr(0, 10),
                user_name: undefined,
                inner_code: undefined,
                purchase_order_code: undefined
            },
            purchase_order_status:[{
                value: '2',
                text: '已创建'
            }, {
                value: '6',
                text: '已入库'
            }]
        } ),
        created() {
            this.nav_items.push(
              {
                  text: '进货状态统计表',
                  disabled: false,
                  href: this.$route.path
              }
            )
        },
        mounted() {
            this.init()
        },
        methods: {
            init() {
                let today = new Date()
                this.filterParams.start_date = [today.getFullYear(), today.getMonth() + 1, 1].join('-')
                this.getData()
            },
            onRefresh() {
                this.getData()
            },
            params(){
                let params = JSON.parse(JSON.stringify(this.filterParams))
                params.end_date = this.addDay(params.end_date, 1)
                return Object.assign({}, params, this.reqParams())
            },
            onExport(){
                let data = {
                    url: `/api/reports?action=purchase_state&format=excel`,
                    params: this.params(),
                    name: '进货状态统计表',
                }
                this.$store.dispatch('exportToExcel', data)
            },
            getData() {
                this.loading = true
                this.lists = []
                this.$axios({
                    url: '/api/reports?action=purchase_state',
                    params: this.params()
                }).then(res => {
                    this.loading = false
                    if ( res.state ) {
                        this.lists = res.root
                        this.totalLength = res.total
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            format(status){
                if (status == 2) return '已创建'
                if (status == 6) return '已入库'
                return ''
            }
        }

    }
</script>

<style scoped>

</style>
