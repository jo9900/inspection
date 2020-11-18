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
      <v-col cols="12" md="6" class="d-flex align-center py-0">
        <v-btn tile color="primary" v-ripple dark @click="onRefresh()">查询</v-btn>
        <v-btn tile color="primary" v-if="allowCreate" v-ripple dark @click="onExport()">导出</v-btn>
      </v-col>
      <v-spacer />
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
        <v-text-field v-model.trim="filterParams.user_name" @keyup.enter="onRefresh()" label="员工名" />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" class="py-0">
        <v-data-table
            :height="tableHeight -48 "
            fixed-header
            :headers="headers"
            :items="lists"
            disable-pagination
            hide-default-footer
            :loading="loading"
            class="elevation-1"
            :sort-by.sync="sortBy"
            :sort-desc.sync="sortDesc"
        >
          <template v-slot:footer="{ headers }">
            <table style="background-color: #fafafa;">
              <tfoot>
                <tr>
                  <td width="15%">合计</td>
                  <td width="15%">{{ total_row.packing_quantity }}</td>
                  <td width="15%">{{ total_row.phone_quantity }}</td>
                  <td width="15%">{{ total_row.inspection_quantity }}</td>
                  <td width="15%">{{ total_row.purchase_quantity }}</td>
                  <td width="15%">{{ total_row.recheck_quantity }}</td>
                </tr>
              </tfoot>
            </table>
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
        name: "QuantityCounting",
        mixins: [mixin],
        data: () => ( {
            nav_items: [{
                text: '报表',
                disabled: true
            }],
            showStartDatePicker: false,
            showEndDatePicker: false,
            options: {},
            loading: false,
            totalLength: 0,
            lists: [],
            total_row: [],
            headers: [
                {
                    text: '员工',
                    value: 'user_name',
                    width: '15%'
                },
                {
                    text: '拆包',
                    value: 'packing_quantity',
                    width: '15%'
                },
                {
                    text: '手机',
                    value: 'phone_quantity',
                    width: '15%'
                },
                {
                    text: '初检',
                    value: 'inspection_quantity',
                    width: '15%'
                },
                {
                    text: '入库',
                    value: 'purchase_quantity',
                    width: '15%'
                },
                {
                    text: '复检',
                    value: 'recheck_quantity',
                    width: '15%'
                }
            ],
            filterParams: {
                start_date: new Date().toISOString().substr(0, 10),
                end_date: new Date().toISOString().substr(0, 10),
                user_name: ''
            },
            sortBy: 'packing_quantity',
            sortDesc: true,
        } ),
        created() {
            this.init()
            this.nav_items.push(
              {
                  text: '数量统计表',
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
            },
            onRefresh() {
                this.getData()
            },
            params(){
                let params = JSON.parse(JSON.stringify(this.filterParams))
                params.end_date = this.addDay(params.end_date, 1)
                return params
            },
            onExport(){
                let data = {
                    url: `/api/reports?action=quantity_counting&format=excel`,
                    params: this.params(),
                    name: '数量统计表',
                }
                this.$store.dispatch('exportToExcel', data)
            },
            getData() {
                this.loading = true
                this.lists = []
                this.$axios({
                    url: '/api/reports?action=quantity_counting',
                    params: this.params()
                }).then(res => {
                    this.loading = false
                    if ( res.state ) {
                        this.lists = res.root
                        let outcome = {
                            phone_quantity: 0,
                            purchase_quantity: 0,
                            recheck_quantity: 0,
                            packing_quantity: 0,
                            inspection_quantity: 0,
                        }
                        this.lists.forEach(list=> {
                            outcome.phone_quantity += list.phone_quantity || 0
                            outcome.purchase_quantity += list.purchase_quantity || 0
                            outcome.recheck_quantity += list.recheck_quantity || 0
                            outcome.packing_quantity += list.packing_quantity || 0
                            outcome.inspection_quantity += list.inspection_quantity || 0
                        })
                        this.total_row = outcome
                        this.totalLength = res.total
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })

                })
            }
        }

    }
</script>

<style scoped>

</style>
