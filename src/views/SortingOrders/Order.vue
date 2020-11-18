<template>
  <v-card flat v-bind="$props" class="pa-4">
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
    <v-row class="Btns">
      <v-col class="py-0 ma-0">
        <v-btn
            color="info"
            class="mr-2"
            @click="create"
            v-if="allowCreate && !showEdit"
        >
          创建
        </v-btn>
        <v-btn
            color="amber"
            class="mr-2 white--text"
            @click="saveEdit"
            v-if="showEdit && ($store.getters.isAdmin || so_params.status == 0)"
        >
          保存
        </v-btn>
        <v-btn
            color="info"
            class="mr-2 white--text"
            @click="execute"
            v-if="allowEdit && showEdit && so_params.status != 6"
        >
          执行
        </v-btn>
        <v-btn
            color="info"
            class="mr-4 white--text"
            @click="onPrint"
            v-if="allowPrint && showEdit && !mobile"
        >
          打印
        </v-btn>
        <v-btn
            color="info"
            class="mr-4 white--text"
            @click="exportIO"
            v-if="allowExport && showEdit && !mobile && so_params.status == 6"
        >
          导出
        </v-btn>
        <v-btn
            color="error"
            class="ml-2"
            @click="reset"
            v-if="!showEdit"
        >
          重置
        </v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col class="py-0" :md="showEdit?'8':'12'" cols="12">
        <v-row>
          <v-col :md="showEdit?'12':'6'" cols="12">
            <v-form v-model="valid" ref="form">
              <v-container>
                <v-row>
                  <v-col cols="12" md="4" class="py-0">
                    <v-text-field
                        v-model.trim="so_params.out_sid"
                        label="物流单号"
                        :rules="rules"
                        required
                    >
                      <span slot="prepend" class="red--text">*</span>
                    </v-text-field>
                  </v-col>

                  <v-col cols="12" md="4" class="py-0">
                    <Vcombobox
                        @select_change="logistics_change_dialog"
                        :p-items="logistics_companies"
                        :setValue="logistics_value"
                        p-label="物流公司"
                        p-placeholder="筛选物流公司"
                    />
                  </v-col>
                  <v-col cols="12" md="4" class="py-0">
                    <v-text-field
                        class="pl-3"
                        v-model.trim="so_params.source_id"
                        label="订单总价"
                        required
                    />
                  </v-col>

                  <v-col cols="12" md="8" class="py-0">
                    <v-text-field
                        readonly
                        label="卖家"
                        :rules="rules"
                        v-model.trim="so_params.partner_name"
                        append-icon="search"
                        @click:append="searchC8Partner"
                        @click:clear="clearC8PartnerSearch"
                        clearable
                    >
                      <span slot="prepend" class="red--text">*</span>
                    </v-text-field>
                    <v-dialog v-model="showC8Partners" max-width="500px">
                      <SearchC8Partners
                          @Snackerbar="Snackerbar"
                          :search="partner_name"
                          :showC8Partners.sync="showC8Partners"
                          @selected="fillC8Partner"
                      />
                    </v-dialog>
                  </v-col>

                  <v-col cols="12" md="4" class="py-0">
                    <v-text-field
                        class="pl-3"
                        v-model.trim="so_params.mobile"
                        label="卖家电话"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="8" class="py-0">
                    <v-text-field
                        class="pl-3"
                        v-model="so_params.memo"
                        label="备注"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="4" class="py-0">
                    <v-text-field
                        class="pl-3"
                        v-model.trim="so_params.source"
                        label="监控位"
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-container>
            </v-form>
          </v-col>
          <v-divider vertical v-if="!showEdit"></v-divider>
          <v-col :md="showEdit?'12':'5'" cols="12">
            <v-list dense tile>
              <v-subheader class="d-flex justify-space-between">
                <span class="subtitle-1">拆包明细</span>
                <v-btn text fab small @click="addLine">
                  <v-icon large color="info">add_circle</v-icon>
                </v-btn>
              </v-subheader>

              <v-list-item
                  dense
                  v-for="(item, i) in lines"
                  :key="i"
              >
                <v-list-item-content class="py-0">
                  <v-row>
                    <v-col cols="6" class="py-0">
                      <v-text-field dense placeholder="名称" @keyup.enter="addLine" v-model="item.name" />
                    </v-col>
                    <v-col cols="6" class="py-0">
                      <v-text-field dense placeholder="数量" @keyup.enter="addLine" v-model="item.value" />
                    </v-col>
                  </v-row>
                </v-list-item-content>
                <v-list-item-action>
                  <v-icon @click="deleteLine(i)">clear</v-icon>
                </v-list-item-action>
              </v-list-item>
            </v-list>
          </v-col>
        </v-row>
      </v-col>
      <v-col md="4" v-if="showEdit">
        <v-chip color="teal" dark>内部码</v-chip>
        <div class="inner_code_wrap">
          <small class="grey--text" v-if="codes.length">选中需要打印的内部码，未选时打印全部</small>
          <span
              v-for="code in inner_codes"
              :key="code"
              @click="getCodes(code)"
              :class="selectedCode(code)"
          >
              {{ code }}
            </span>
        </div>
      </v-col>
    </v-row>
  </v-card>
</template>

<script>
    import mixin from '@/mixins/mixin'
    import print from '@/mixins/print'

    export default {
        name: "Order",
        mixins: [mixin, print],
        data() {
            return {
                valid: false,
                allowCreate: false,
                so_params: {
                    logistics_company_id: null,
                    logistics_company_name: null,
                    out_sid: null,
                    partner_id: null,
                    partner_name: null,
                    mobile: null,
                    source_id: null,
                    source: null,
                    memo: null,
                    packing_lines: null
                },
                inner_codes: [],
                logistics_value: null,
                partner_name: '',
                showC8Partners: false,
                rules: [
                    v => !!v || '必填'
                ],
                lines: [{
                    name: '',
                    value: ''
                }],
                showEdit: false,
                codes: [] // 选中的内部码去打印
            }
        },
        props: ['data', 'logistics_companies'],
        mounted() {
            this.isAllowExport()
        },
        watch: {
            inner_codes() {
                this.codes = []
            },
            data: {
                handler(cur) {
                    if ( !cur ) return
                    let data = cur
                    if ( !data.packing_lines || !data.packing_lines.length ) {
                        this.lines = []
                    }
                    else {
                        this.lines = JSON.parse(data.packing_lines)
                    }
                    this.so_params = data
                    this.inner_codes = data.inner_code.split(',')
                    this.logistics_value = this.logistics_companies.find((value) => {
                        if ( value.id === cur.logistics_company_id ) return true
                    })
                    this.showEdit = true
                },
                immediate: true,
                deep: true
            }
        },
        methods: {
            create() {
                if ( !this.lines || this.lines == '[]' ) {
                    this.so_params.packing_lines = null
                }
                else {
                    this.so_params.packing_lines = JSON.stringify(this.lines)
                }
                this.axios({
                    url: `/api/sorting_orders`,
                    method: 'POST',
                    data: this.so_params
                }).then(res => {
                    if ( res.state ) {
                        this.reset()
                        this.lines = []
                        this.Snackerbar({ bool: true, type: 'success', text: '创建拆包单成功' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })

                })
                this.$refs.form.validate()
            },
            saveEdit() {
                let item = this.$props.data
                if ( !this.lines.length )
                    this.so_params.packing_lines = null
                else
                    this.so_params.packing_lines = JSON.stringify(this.lines)
                this.axios({
                    url: `/api/sorting_orders/${ item.id }`,
                    method: 'PUT',
                    data: this.so_params
                }).then(res => {
                    if ( res.id ) {
                        this.$emit('afterEdit', res)
                        this.$emit('update:showOrderDialog', false)
                        this.$listeners.Snackerbar({ bool: true, type: 'success', text: '更新拆包单成功' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            execute() { // execute order
                let item = this.$props.data
                if ( !confirm(`是否要执行拆包单${ item.code }?`) ) return
                this.axios({
                    url: `/api/sorting_orders/${ item.id }?action=execute`,
                    method: 'POST'
                }).then(res => {
                    if ( res.status === 6 ) {
                        this.$emit('afterEdit', { status: 6 })
                        this.$emit('update:showOrderDialog', false)
                        this.$listeners.Snackerbar({ bool: true, type: 'success', text: '执行拆包单成功' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            selectedCode(code) {
                if ( this.codes.includes(code) ) return 'teal--text'
            },
            getCodes(code) {
                if ( this.codes.includes(code) )
                    this.codes.splice(this.codes.indexOf(code), 1)
                else
                    this.codes.push(code)
            },
            onPrint(data = {}){
                if ( this.codes.length ) {
                    data = {
                        inner_codes: this.codes.join(',')
                    }
                }
                let url = "/api/sorting_orders/" + this.$props.data.id + "?action=print_form"

                this.printView(url, data)
            },
            exportIO() {
                let item = this.$props.data
                let data = {
                    url: `/api/sorting_orders/${ item.id }?action=download_inspection`,
                    params: {},
                    name: `${ item.code }初检信息导出`,
                }
                this.$store.dispatch('exportToExcel', data)
            },
            reset() {
                this.$refs.form.reset()
            },
            deleteLine(i) {
                this.lines.splice(i, 1)
            },
            addLine() {
                this.lines.unshift({
                    name: '',
                    value: ''
                })
            },
            logistics_change_dialog(child_msg) {
                if ( child_msg ) {
                    this.so_params.logistics_company_id = child_msg.id
                    this.so_params.logistics_company_name = child_msg.name
                }
                else {
                    this.so_params.logistics_company_id = null
                    this.so_params.logistics_company_name = null
                }
            },
            fillC8Partner(cur) {
                this.so_params.partner_id = cur.id
                this.so_params.partner_name = cur.name
            },
            searchC8Partner() {
                this.showC8Partners = true
                this.partner_name = this.so_params.partner_name
            },
            clearC8PartnerSearch() {
                this.so_params.partner_name = null
                this.so_params.partner_id = null
            }
        }
    }
</script>

<style scoped lang="less">
  .print {
    height: 100%;
  }

  .inner_code_wrap > span {
    display: block;
    cursor: pointer;
  }
</style>
