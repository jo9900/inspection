<template>
  <v-container class="wrap">
    <Vsnackerbar :show.sync="snackbar" :type="snackbar_type">{{ snackbar_text }}</Vsnackerbar>
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">{{ formTitle }}</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12" sm="6" md="6" class="py-0">
                <v-text-field v-model.trim="editedItem.name" label="质检项名称">
                  <span slot="prepend" class="red--text">*</span>
                </v-text-field>
              </v-col>
              <v-col cols="12" sm="6" md="6" class="py-0">
                <v-text-field
                    label="上级质检项"
                    v-model.trim="editedItem.parent_name"
                    append-icon="search"
                    @click:append="searchCate"
                    @click:clear="clearCateSearch"
                    clearable
                />
                <v-dialog v-model="showCates" max-width="500px">
                  <SearchCates
                      @Snackerbar="Snackerbar"
                      :search="parent_search_text"
                      :showCates.sync="showCates"
                      @selected="fillCate"
                  />
                </v-dialog>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" sm="6" md="6" class="pa-0">
                <v-radio-group v-model="editedItem.cate_type" row mandatory>
                  <v-radio class="mb-md-0 mb-2" label="不可操作质检项" value.number="0" />
                  <v-radio label="可操作质检项" value.number="1" />
                </v-radio-group>
              </v-col>

              <v-col cols="12" sm="6" md="6" class="ma-0">
                <v-select v-model="editedItem.order_type" :items="order_types" label="单据类型" />
              </v-col>
              <v-col cols="12" class="d-flex pa-0">
                <v-switch
                    class="ma-0"
                    v-model="editedItem.has_picture"
                    label="是否需要照片"
                />
                <v-icon v-show="editedItem.has_picture" color="green" class="mb-4">done</v-icon>
              </v-col>
              <v-col cols="12" class="d-flex pa-0">
                <v-switch
                    class="ma-0"
                    v-model="editedItem.need_text"
                    label="是否需要文字"
                />
                <v-icon v-show="editedItem.need_text" color="green" class="mb-4">done</v-icon>
              </v-col>
              <v-col cols="12" class="d-flex pa-0">
                <v-switch
                    class="ma-0"
                    v-model="editedItem.in_use"
                    label="是否启用"
                />
                <v-icon v-show="editedItem.in_use" color="green" class="mb-4">done</v-icon>
              </v-col>
              <v-col cols="12" class="d-flex pa-0">
                <v-switch
                    class="ma-0"
                    v-model="editedItem.is_multi"
                    label="是否多选"
                />
                <v-icon v-show="editedItem.is_multi" color="green" class="mb-4">done</v-icon>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" class="d-flex pa-0">
                <v-switch
                    class="ma-0"
                    v-model="editedItem.is_product_sku"
                    label="是否属于商品SKU"
                />
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
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
      <v-col cols="12" md="6" class="d-flex align-center py-0">
        <v-btn tile color="primary" v-ripple dark @click="onRefresh()">查询</v-btn>
        <v-btn tile color="primary" v-ripple dark @click="onCreate()" v-if="allowCreate">新建</v-btn>
      </v-col>
      <v-spacer />
      <v-col cols="12" md="3" class="py-0">
        <v-text-field
            label="质检项"
            @keyup.enter="onRefresh()"
            clearable
            v-model.trim="cate_name"
        />
      </v-col>

    </v-row>
    <v-row>
      <v-col cols="12" class="py-0">
        <v-data-table
            :height="tableHeight"
            fixed-header
            :headers="headers"
            :items="cates"
            :items-per-page="itemsPerPage"
            :footer-props="footer_props"
            :options.sync="options"
            :server-items-length="totalLength"
            :loading="loading"
            hide-default-header
            item-key="id"
            class="elevation-1"
            @update:page="getAllCates"
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
          <template v-slot:item.cate_type="{ item }">
            {{ format_cate_type(item.cate_type) }}
          </template>
          <template v-slot:item.has_picture="{ item }">
            {{ item.has_picture | FormatBool }}
          </template>
          <template v-slot:item.need_text="{ item }">
            {{ item.need_text | FormatBool }}
          </template>
          <template v-slot:item.in_use="{ item }">
            {{ item.in_use | FormatBool }}
          </template>
          <template v-slot:item.is_multi="{ item }">
            {{ item.is_multi | FormatBool }}
          </template>
          <template v-slot:item.is_product_sku="{ item }">
            {{ item.is_product_sku | FormatBool }}
          </template>

          <template v-slot:item.order_type="{ item }">
            {{ item.order_type | FormatOrderType }}
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
        name: "Cates",
        mixins: [mixin],
        data: () => ( {
            nav_items: [{
                text: '基础资料',
                disabled: true
            }],

            showCates: false,
            parent_search_text: '',

            cate_name: '',

            options: {},
            loading: true,
            totalLength: 0,

            search: '',
            cates: [],
            headers: [
                {
                    text: 'ID',
                    align: 'left',
                    value: 'id'
                },
                { text: '名称', value: 'name' },
                { text: '操作类型', value: 'cate_type' },
                { text: '上级质检项', value: 'parent_name' },
                { text: '是否需要照片', value: 'has_picture' },
                { text: '是否需要文字', value: 'need_text' },
                { text: '是否启用', value: 'in_use' },
                { text: '是否多选', value: 'is_multi' },
                { text: '是否属于商品sku', value: 'is_product_sku' },
                { text: '单据类型',  value: 'order_type'},
                { text: '操作', value: 'action',width: '100' }
            ],
            dialog: false,
            editedIndex: -1,
            editedItem: {order_type: null},
            defaultItem: {
                name: '',
                cate_type: '',
                has_picture: false,
                need_text: false,
                in_use: false,
                is_product_sku: false,
                parent_id: null,
                parent_name: null,
                order_type: null,
                is_multi: false
            }
        } ),
        created() {
            this.init()
            this.nav_items.push(
              {
                  text: '质检项',
                  disabled: false,
                  href: this.$route.path
              }
            )
        },
        methods: {
            init() {
                this.getAllCates()
            },
            getAllCates() {
                this.cates = []
                this.axios({
                    url: `/api/cates`,
                    params: {
                        name: this.cate_name,
                        ...this.reqParams()
                    }
                }).then(res => {
                    this.loading = false
                    if ( res.state === 1 ) {
                        this.cates = res.root
                        this.totalLength = res.total
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })

                })
            },
            postCate(params) {
                this.axios({
                    url: `/api/cates`,
                    method: 'POST',
                    data: params
                }).then(res => {
                    if ( res.state === 1 ) {
                        this.cates.unshift(res)
                        this.Snackerbar({ bool: true, type: 'success', text: '创建质检项成功' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                }).finally(()=>{
                    this.close()
                })
            },
            putCate(params, cate_id) {
                this.axios({
                    url: `/api/cates/${ cate_id }`,
                    method: 'PUT',
                    data: params
                }).then(res => {
                    if ( res.state === 1 ) {
                        Object.assign(this.cates[this.editedIndex], this.editedItem)
                        this.Snackerbar({ bool: true, type: 'success', text: '质检项已更新' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                }).finally(()=>{
                    this.close()
                })
            },
            deleteCate({ cate_id, index } = {}) {
                this.axios({
                    url: `/api/cates/${ cate_id }`,
                    method: 'DELETE'
                }).then(res => {
                    if ( res.state === 1 ) {
                        this.cates.splice(index, 1)
                        this.Snackerbar({ bool: true, type: 'success', text: '删除成功' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            onRefresh() {
                this.options.page = 1
                this.getAllCates()
            },
            editItem(item) {
                this.editedIndex = this.cates.indexOf(item)
                this.editedItem = Object.assign({}, item)
                this.dialog = true
            },
            deleteItem(item) {
                const index = this.cates.indexOf(item)
                confirm(`确认删除${ item.name }？`) && this.deleteCate({ cate_id: item.id, index })
            },
            save() {
                let param = {
                    name: this.editedItem.name,
                    cate_type: this.editedItem.cate_type,
                    parent_id: this.editedItem.parent_id,
                    has_picture: this.editedItem.has_picture,
                    need_text: this.editedItem.need_text,
                    in_use: this.editedItem.in_use,
                    is_product_sku: this.editedItem.is_product_sku,
                    order_type: this.editedItem.order_type,
                    is_multi: this.editedItem.is_multi
                }
                if ( this.editedIndex > -1 ) {
                    this.putCate(param, this.editedItem.id)
                }
                else {
                    this.postCate(this.editedItem)
                }
            },
            format_cate_type(flag) {
                if ( flag == 0 ) return '不可操作'
                return '可操作'
            },
            fillCate(cur) {
                this.editedItem.parent_id = cur.id
                this.editedItem.parent_name = cur.name
            },
            searchCate() {
                this.showCates = true
                this.parent_search_text = this.editedItem.parent_name
            },
            clearCateSearch() {
                this.editedItem.parent_id = null
                this.editedItem.parent_name = null
            }

        },
        computed: {
            formTitle() {
                return this.editedIndex === -1 ? '新建质检项' : '编辑质检项'
            }
        }
    }
</script>

<style scoped>

</style>
