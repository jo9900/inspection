<template>
  <v-container class="wrap">
    <Vsnackerbar :show.sync="snackbar" :type="snackbar_type">{{ snackbar_text }}</Vsnackerbar>
    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="headline">{{ formTitle }}</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12" sm="6" md="6">
                <v-text-field v-model.trim="editedItem.name" label="名称">
                  <span slot="prepend" class="red--text">*</span>
                </v-text-field>
              </v-col>
              <v-col cols="12" sm="6" md="6">
                <v-text-field v-model.trim="editedItem.code" label="编码" />
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="close">取消</v-btn>
          <v-btn color="blue darken-1" text @click="save">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
      <v-col cols="12" sm="4" md="6" class="d-flex align-center py-0">
        <v-btn tile color="primary" v-ripple dark @click="onRefresh()">查询</v-btn>
        <v-btn tile color="primary" v-ripple dark @click="onCreate()" v-if="allowCreate">新建</v-btn>
      </v-col>
      <v-col cols="6" sm="4" md="3" class="py-0">
        <v-text-field
            label="名称"
            clearable
            @keyup.enter="onRefresh()"
            v-model.trim="lc_name"
        />
      </v-col>
      <v-col cols="6" sm="4" md="3" class="py-0">
        <v-text-field
            label="编码"
            clearable
            @keyup.enter="onRefresh()"
            v-model.trim="lc_code"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" class="py-0">
        <v-data-table
            :height="tableHeight"
            fixed-header
            :headers="headers"
            :items="logistics_companies"
            :items-per-page="itemsPerPage"
            :footer-props="footer_props"
            :options.sync="options"
            :server-items-length="totalLength"
            :loading="loading"
            item-key="id"
            hide-default-header
            class="elevation-1"
            @update:page="getAllLCs"
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
          <template v-slot:item.action="{ item }">
            <v-icon v-if="allowEdit" small class="mr-2" @click="editItem(item)">
              edit
            </v-icon>
            <v-icon v-if="allowDelete" small @click="deleteItem(item)">
              delete
            </v-icon>
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
        name: "LogisticsCompanies",
        mixins: [mixin],
        data: () => ( {
            nav_items: [{
                text: '基础资料',
                disabled: true
            }],
            lc_name: '',
            lc_code: '',

            options: {},
            loading: true,
            totalLength: 0,

            logistics_companies: [],
            headers: [
                {
                    text: 'ID',
                    align: 'left',
                    value: 'id'
                },
                { text: '物流公司名称', value: 'name' },
                { text: '物流公司编码', value: 'code' },
                { text: '操作', value: 'action',width: '100' }
            ],
            dialog: false,
            editedIndex: -1,
            editedItem: {},
            defaultItem: {
                name: '',
                code: ''
            }
        } ),
        created() {
            this.init()
            this.nav_items.push(
              {
                  text: '物流公司',
                  disabled: false,
                  href: this.$route.path
              }
            )
        },
        methods: {
            init() {
                this.getAllLCs()
            },
            getAllLCs() {
                this.logistics_companies = []
                this.axios({
                    url: `/api/logistics_companies`,
                    params: {
                        name: this.lc_name,
                        code: this.lc_code,
                        ...this.reqParams()
                    }
                }).then(res => {
                    this.loading = false
                    if ( res.state ) {
                        this.logistics_companies = res.root
                        this.totalLength = res.total
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })

                })
            },
            postLC(params) {
                this.axios({
                    url: `/api/logistics_companies`,
                    method: 'POST',
                    data: params
                }).then(res => {
                    if ( res.state === 1 ) {
                        this.logistics_companies.unshift(res)
                        this.Snackerbar({ bool: true, type: 'success', text: '创建物流公司成功' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                }).finally(() => {
                    this.close()
                })
            },
            putLC(params, lc_id) {
                this.axios({
                    url: `/api/logistics_companies/${ lc_id }`,
                    method: 'PUT',
                    data: params
                }).then(res => {
                    if ( res.state === 1 ) {
                        Object.assign(this.logistics_companies[this.editedIndex], this.editedItem)
                        this.Snackerbar({ bool: true, type: 'success', text: '物流公司已更新' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                }).finally(() => {
                    this.close()
                })
            },
            deleteLC({ lc_id, index } = {}) {
                this.axios({
                    url: `/api/logistics_companies/${ lc_id }`,
                    method: 'DELETE'
                }).then(res => {
                    if ( res.state === 1 ) {
                        this.logistics_companies.splice(index, 1)
                        this.Snackerbar({ bool: true, type: 'success', text: '删除成功' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            onRefresh() {
                this.options.page = 1
                this.getAllLCs()
            },
            editItem(item) {
                this.editedIndex = this.logistics_companies.indexOf(item)
                this.editedItem = Object.assign({}, item)
                this.dialog = true
            },
            deleteItem(item) {
                const index = this.logistics_companies.indexOf(item)
                confirm(`确认删除${ item.name }？`) && this.deleteLC({ lc_id: item.id, index })
            },
            save() {

                let param = {
                    code: this.editedItem.code,
                    name: this.editedItem.name
                }
                if ( this.editedIndex > -1 )
                    this.putLC(param, this.editedItem.id)
                else
                    this.postLC(param)
            }
        },
        computed: {
            formTitle() {
                return this.editedIndex === -1 ? '新建物流公司' : '编辑物流公司'
            }
        }
    }
</script>

<style scoped>

</style>
