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
                <v-text-field v-model.trim="editedItem.text" label="描述">
                  <span slot="prepend" class="red--text">*</span>
                </v-text-field>
              </v-col>
              <v-col cols="12" sm="6" md="6">
                <v-text-field v-model.trim="editedItem.value" label="值">
                  <span slot="prepend" class="red--text">*</span>
                </v-text-field>
              </v-col>
              <v-col col="6">
                <v-text-field
                    class="ma-0 pa-0"
                    label="质检项"
                    v-model.trim="editedItem.cate_name"
                    append-icon="search"
                    @click:append="searchCate"
                    @click:clear="clearCateSearch"
                    clearable
                ><span slot="prepend" class="red--text">*</span></v-text-field>
                <v-dialog v-model="showCates" max-width="500px">
                  <SearchCates
                      :search="cate_search_text"
                      :showCates.sync="showCates"
                      @selected="fillCate"
                  />
                </v-dialog>
              </v-col>
              <v-col cols="12" sm="6" md="6">
                <v-text-field
                    class="ma-0 pa-0"
                    label="商品型号"
                    v-model.trim="mult_products_value"
                    append-icon="search"
                    @click:append="searchMultPro"
                    @click:clear="clearMultProSearch"
                    clearable
                />
                <v-dialog v-model="showMultProducts" max-width="500px">
                  <SearchMultProducts
                      ref="multProducts"
                      @Snackerbar="Snackerbar"
                      :search="mult_products_value"
                      :showMultProducts.sync="showMultProducts"
                      @selected="fillMultPro"
                  />
                </v-dialog>
              </v-col>
              <v-col cols="12" sm="6" md="6" class="ma-0 py-0">
                <v-select v-model="editedItem.order_type" :items="order_types" label="单据类型" />
              </v-col>
              <v-col cols="12" sm="6" md="6" class="d-flex">
                <v-switch
                    class="ma-0"
                    v-model="editedItem.need_text"
                    label="是否需要文字"
                />
                <v-icon v-show="editedItem.need_text" color="green" class="mb-4">done</v-icon>
              </v-col>
              <v-col cols="12" sm="6" md="6" class="d-flex">
                <v-switch
                    class="ma-0"
                    v-model="editedItem.is_default"
                    label="是否默认"
                />
                <v-icon v-show="editedItem.is_default" color="green" class="mb-4">done</v-icon>
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
      <v-col cols="12" md="6" class="d-flex align-center py-0">
        <v-btn tile color="primary" v-ripple dark @click="onRefresh()">查询</v-btn>
        <v-btn tile color="primary" v-ripple dark @click="onCreate()" v-if="allowCreate">新建</v-btn>
      </v-col>
      <v-spacer />
      <v-col cols="12" md="3" class="py-0">
        <v-text-field
            label="质检项"
            clearable
            @keyup.enter="onRefresh()"
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
            :items="items"
            :items-per-page="itemsPerPage"
            :footer-props="footer_props"
            :options.sync="options"
            :server-items-length="totalLength"
            :loading="loading"
            item-key="id"
            hide-default-header
            class="elevation-1"
            @update:page="getAllItems"
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
          <template v-slot:item.is_default="{ item }">
            {{ item.is_default | FormatBool }}
          </template>
          <template v-slot:item.need_text="{ item }">
            {{ item.need_text | FormatBool }}
          </template>
          <template v-slot:item.product_ids="{ item }">
            {{ formatProducts(item.product_ids)}}
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
        name: "Items",
        mixins: [mixin],
        data: () => ( {
            nav_items: [{
                text: '基础资料',
                disabled: true
            }],
            cate_name: '',
            showCates: false,
            cate_search_text: '',
            showMultProducts: false,
            mult_products_value: '',
            options: {},
            loading: true,
            totalLength: 0,

            items: [],
            headers: [
                {
                    text: 'ID',
                    align: 'left',
                    value: 'id'
                },
                { text: '描述', value: 'text' },
                { text: '值', value: 'value' },
                { text: '质检项', value: 'cate_name' },
                { text: '商品型号', value: 'product_ids', width: '30%' },
                { text: '是否默认', value: 'is_default' },
                { text: '是否需要文字', value: 'need_text' },
                { text: '单据类型', value: 'order_type' },
                { text: '操作', value: 'action', width: '100' }
            ],
            dialog: false,
            editedIndex: -1,
            editedItem: { order_type: null },
            defaultItem: {
                text: '',
                value: '',
                cate_id: '',
                product_ids: null,
                is_default: false,
                need_text: false,
                order_type: null
            }
        } ),
        created() {
            this.init()
            this.nav_items.push(
              {
                  text: '操作选项',
                  disabled: false,
                  href: this.$route.path
              }
            )
        },
        methods: {
            init() {
                this.getAllItems()
            },
            getAllItems() {
                this.items = []
                this.axios({
                    url: `/api/items`,
                    params: {
                        cate_name: this.cate_name,
                        ...this.reqParams()
                    }
                }).then(res => {
                    this.loading = false
                    if ( res.state === 1 ) {
                        this.items = res.root
                        this.totalLength = res.total
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })

                })
            },
            postItem(params) {
                this.axios({
                    url: `/api/items`,
                    method: 'POST',
                    data: params
                }).then(res => {
                    if ( res.state === 1 ) {
                        this.items.unshift(res)
                        this.Snackerbar({ bool: true, type: 'success', text: '创建操作选项成功' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                }).finally(() => {
                    this.close()
                })
            },
            putItem(params, item_id) {
                this.axios({
                    url: `/api/items/${ item_id }`,
                    method: 'PUT',
                    data: params
                }).then(res => {
                    if ( res.state === 1 ) {
                        Object.assign(this.items[this.editedIndex], this.editedItem)
                        this.Snackerbar({ bool: true, type: 'success', text: '操作选项已更新' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                }).finally(() => {
                    this.close()
                })
            },
            delete_item({ item_id, index } = {}) {
                this.axios({
                    url: `/api/items/${ item_id }`,
                    method: 'DELETE'
                }).then(res => {
                    if ( res.state === 1 ) {
                        this.items.splice(index, 1)
                        this.Snackerbar({ bool: true, type: 'success', text: '删除成功' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            onCreate() {
                this.dialog = true
                this.mult_products_value = ''
            },
            onRefresh() {
                this.options.page = 1
                this.getAllItems()
            },
            editItem(item) {
                this.editedIndex = this.items.indexOf(item)
                if ( item.product_ids == null || JSON.stringify(item.product_ids) === '{}' ) {
                    this.mult_products_value = ''
                }
                else {
                    this.mult_products_value = Object.values(item.product_ids).join(';')
                }
                this.editedItem = Object.assign({}, item)
                this.dialog = true
            },
            deleteItem(item) {
                const index = this.items.indexOf(item)
                confirm(`确认删除${ item.text }？`) && this.delete_item({ item_id: item.id, index })
            },
            save() {
                let param = {
                    text: this.editedItem.text,
                    value: this.editedItem.value,
                    cate_id: this.editedItem.cate_id,
                    is_default: this.editedItem.is_default,
                    product_ids: this.editedItem.product_ids,
                    need_text: this.editedItem.need_text,
                    order_type: this.editedItem.order_type
                }
                if ( this.editedIndex > -1 )
                    this.putItem(param, this.editedItem.id)
                else
                    this.postItem(param)

            },
            formatProducts(obj) {
                if ( obj == null || JSON.stringify(obj) === '{}' ) return ''
                return Object.values(obj).join(';')
            },
            fillCate(cur) {
                this.editedItem.cate_id = cur.id
                this.editedItem.cate_name = cur.name
            },
            searchCate() {
                this.showCates = true
                this.cate_search_text = this.editedItem.cate_name
            },
            clearCateSearch() {
                this.editedItem.cate_id = null
                this.editedItem.cate_name = null
            },
            // 此系统商品型号
            fillMultPro(cur) {
                this.showMultProducts = false

                this.editedItem.product_ids = null
                if ( !cur.length ) return
                let obj = {}

                let mult_products_value = ''
                cur.forEach(val => {
                    obj[val.id] = val.name
                    mult_products_value += val.name + '；'
                })
                this.editedItem.product_ids = obj
                this.mult_products_value = mult_products_value
            },
            searchMultPro() {
                this.showMultProducts = true
            },
            clearMultProSearch() {
                this.editedItem.product_ids = null
                this.mult_products_value = ''
            }
        },
        computed: {
            formTitle() {
                return this.editedIndex === -1 ? '新建操作选项' : '编辑操作选项'
            }
        }
    }
</script>

<style scoped>

</style>
