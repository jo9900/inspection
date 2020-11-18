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
                <v-text-field
                    label="商品型号"
                    v-model.trim="editedItem.product_name"
                    append-icon="search"
                    @click:append="searchPro"
                    @click:clear="clearProSearch"
                    clearable
                >
                  <span slot="prepend" class="red--text">*</span>
                </v-text-field>
                <v-dialog v-model="showProducts" max-width="500px">
                  <SearchProducts
                      @Snackerbar="Snackerbar"
                      :search="product_name"
                      :showProducts.sync="showProducts"
                      @selected="fillPro"
                  />
                </v-dialog>
              </v-col>
              <v-col cols="12" sm="6" md="6">
                <v-text-field
                    v-model="editedItem.sku"
                    label="SKU"
                    append-icon="add"
                    @click:append="addSKU"
                />
                <v-dialog
                    v-model="showSKU"
                    fullscreen
                    hide-overlay
                    transition="dialog-bottom-transition"
                    scrollable
                >
                  <SelectSKU
                      @close="closeSKU"
                      :editSku="editSku"
                      :showSKU="showSKU"
                  />
                </v-dialog>
              </v-col>
              <v-col cols="12" sm="6" md="6">
                <v-text-field v-model.trim="editedItem.last_code" label="序列尾号" />
              </v-col>
              <v-col cols="12" sm="6" md="6">
                <v-text-field
                    label="C8中对应商品"
                    v-model.trim="editedItem.c8_product_name"
                    append-icon="search"
                    @click:append="searchC8Pro"
                    @click:clear="clearC8ProSearch"
                    clearable
                >
                  <span slot="prepend" class="red--text">*</span>
                </v-text-field>
                <v-dialog v-model="showC8Products" max-width="500px">
                  <SearchC8Products
                      @Snackerbar="Snackerbar"
                      :search="c8_product_name"
                      :showC8Products.sync="showC8Products"
                      @selected="fillC8Pro"
                  />
                </v-dialog>
              </v-col>
              <v-col cols="12">
                <v-text-field
                    label="进货散件"
                    v-model.trim="purchase_part_products_value"
                    append-icon="search"
                    @keyup.enter="searchPurchasePartPro"
                    @click:append="searchPurchasePartPro"
                    @click:clear="clearPurchasePartProSearch"
                    clearable
                />
                <v-dialog v-model="showC8PurchasePartProducts" max-width="500px">
                  <SearchC8PartProducts
                      ref="C8PurchasePartProducts"
                      @Snackerbar="Snackerbar"
                      :search="purchase_part_products_value"
                      :showC8PartProducts.sync="showC8PurchasePartProducts"
                      @selected="fillPurchasePartPro"
                  />
                </v-dialog>
              </v-col>
              <v-col cols="12">
                <v-text-field
                    label="组装拆卸散件"
                    v-model.trim="part_products_value"
                    append-icon="search"
                    @keyup.enter="searchPartPro"
                    @click:append="searchPartPro"
                    @click:clear="clearPartProSearch"
                    clearable
                />
                <v-dialog v-model="showC8PartProducts" max-width="500px">
                  <SearchC8PartProducts
                      ref="C8PartProducts"
                      @Snackerbar="Snackerbar"
                      :search="part_products_value"
                      :showC8PartProducts.sync="showC8PartProducts"
                      @selected="fillPartPro"
                  />
                </v-dialog>
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
            label="商品型号"
            @keyup.enter="onRefresh()"
            clearable
            v-model.trim="product_name"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" class="py-0">
        <v-data-table
            :height="tableHeight"
            fixed-header
            :headers="headers"
            :items="product_mappings"
            :items-per-page="itemsPerPage"
            :footer-props="footer_props"
            :options.sync="options"
            :server-items-length="totalLength"
            :loading="loading"
            item-key="id"
            hide-default-header
            class="elevation-1"
            @update:page="getAllPMs"
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
        name: "ProductMappings",
        mixins: [mixin],
        data: () => ( {
            nav_items: [{
                text: '基础资料',
                disabled: true
            }],
            part_products_value: '', // 将多选的结果name显示在input text里
            purchase_part_products_value: '', // 将多选的结果name显示在input text里

            mapping_id: '',
            product_name: '',
            c8_product_name: '',
            showC8Products: false,
            showC8PartProducts: false,
            showC8PurchasePartProducts: false,
            showProducts: false,

            showSKU: false,
            editSku: [],

            options: {},
            loading: true,
            totalLength: 0,

            product_mappings: [],
            headers: [
                {
                    text: 'ID',
                    align: 'left',
                    value: 'id'
                },
                { text: '商品型号', value: 'product_name' },
                { text: 'SKU', value: 'sku', width:'50%' },
                { text: '对应C8中商品', value: 'c8_product_name' },
                { text: '序列尾号', value: 'last_code' },
                { text: '操作', value: 'action',width: '100' }
            ],
            dialog: false,
            editedIndex: -1,
            editedItem: {},
            defaultItem: {
                product_id: null,
                product_name: '',
                c8_product_id: null,
                c8_product_name: '',
                sku: null,
                last_code: '',
                part_products: null,
                purchase_part_products: null
            }
        } ),
        created() {
            this.init()
            this.nav_items.push(
              {
                  text: '商品映射',
                  disabled: false,
                  href: this.$route.path
              }
            )
        },
        methods: {
            init() {
                this.getAllPMs()
            },
            getAllPMs() {
                this.product_mappings = []
                this.axios({
                    url: `/api/product_mappings`,
                    params: {
                        product_name: this.product_name,
                        ...this.reqParams()
                    }
                }).then(res => {
                    this.loading = false
                    if ( res.state ) {
                        this.product_mappings = res.root
                        this.totalLength = res.total
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })

                })
            },
            postPM(params) {
                this.axios({
                    url: `/api/product_mappings`,
                    method: 'POST',
                    data: params
                }).then(res => {
                    if ( res.state ) {
                        this.product_mappings.unshift(res)
                        this.Snackerbar({ bool: true, type: 'success', text: '创建商品映射成功' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                }).finally(() => {
                    this.close()
                })
            },
            putPM(params, pm_id) {
                this.axios({
                    url: `/api/product_mappings/${ pm_id }`,
                    method: 'PUT',
                    data: params
                }).then(res => {
                    if ( res.state ) {
                        Object.assign(this.product_mappings[this.editedIndex], this.editedItem)
                        this.Snackerbar({ bool: true, type: 'success', text: '商品映射已更新' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                }).finally(() => {
                    this.close()
                })
            },
            deletePM({ pm_id, index } = {}) {
                this.axios({
                    url: `/api/product_mappings/${ pm_id }`,
                    method: 'DELETE'
                }).then(res => {
                    if ( res.state ) {
                        this.product_mappings.splice(index, 1)
                        this.Snackerbar({ bool: true, type: 'success', text: '删除成功' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            onRefresh() {
                this.options.page = 1
                this.getAllPMs()
            },
            editItem(item) {
                this.set_part_products_value(item)
                this.editedIndex = this.product_mappings.indexOf(item)
                this.editedItem = Object.assign({}, item)
                this.dialog = true
            },
            set_part_products_value(item) {
                const {part_products, purchase_part_products} = item
                if (part_products) {
                    let str = ''
                    JSON.parse(part_products).forEach(val => {
                        str += val.name + '；'
                    })
                    this.part_products_value = str
                }
                if (purchase_part_products) {
                    let str = ''
                    JSON.parse(purchase_part_products).forEach(val => {
                        str += val.name + '；'
                    })
                    this.purchase_part_products_value = str
                }
            },
            deleteItem(item) {
                const index = this.product_mappings.indexOf(item)
                confirm(`确认删除${ item.product_name }的映射吗？`) && this.deletePM({ pm_id: item.id, index })
            },
            save() {
                let param = {
                    product_id: this.editedItem.product_id,
                    sku: this.editedItem.sku || [],
                    c8_product_id: this.editedItem.c8_product_id,
                    c8_product_name: this.editedItem.c8_product_name,
                    last_code: this.editedItem.last_code,
                    part_products: this.editedItem.part_products,
                    purchase_part_products: this.editedItem.purchase_part_products
                }
                if ( this.editedIndex > -1 )
                    this.putPM(param, this.editedItem.id)
                else
                    this.postPM(param)
            },
            addSKU() {
                this.showSKU = true
                this.editSku = this.editedItem.sku
            },
            onCreate() {
                this.dialog = true
                this.part_products_value = null
                this.purchase_part_products_value = null
            },
            // 组装拆卸散件
            fillPartPro(cur) {
                this.showC8PartProducts = false
                if ( !cur.length ) return
                let arr = []
                let part_products_value = ''
                cur.forEach(val => {
                    arr.push({
                        id: val.id,
                        name: val.name
                    })
                    part_products_value += val.name + '；'
                })
                if (this.editedItem.part_products) {
                    this.editedItem.part_products = JSON.stringify(JSON.parse(this.editedItem.part_products).concat(arr))
                }else {
                    this.editedItem.part_products = JSON.stringify(arr)
                }
                this.part_products_value = (this.part_products_value || '') + part_products_value
            },
            fillPurchasePartPro(cur) {
                this.showC8PurchasePartProducts = false
                if ( !cur.length ) return
                let arr = []
                let purchase_part_products_value = ''
                cur.forEach(val => {
                    arr.push({
                        id: val.id,
                        name: val.name
                    })
                    purchase_part_products_value += val.name + '；'
                })
                if (this.editedItem.purchase_part_products) {
                    this.editedItem.purchase_part_products = JSON.stringify(JSON.parse(this.editedItem.purchase_part_products).concat(arr))
                }else {
                    this.editedItem.purchase_part_products = JSON.stringify(arr)
                }
                this.purchase_part_products_value = (this.purchase_part_products_value || '') + purchase_part_products_value
            },
            searchPartPro() {
                this.showC8PartProducts = true
            },
            searchPurchasePartPro() {
                this.showC8PurchasePartProducts = true
            },
            clearPartProSearch() {
                this.editedItem.part_products = null
            },
            clearPurchasePartProSearch() {
                this.editedItem.purchase_part_products = null
            },
            // c8商品
            fillC8Pro(cur) {
                this.editedItem.c8_product_id = cur.id
                this.editedItem.c8_product_name = cur.name
            },
            searchC8Pro() {
                this.showC8Products = true
                this.c8_product_name = this.editedItem.c8_product_name
            },
            clearC8ProSearch() {
                this.editedItem.c8_product_id = null
                this.editedItem.c8_product_name = null
            },
            // 此系统商品型号
            fillPro(cur) {
                this.editedItem.product_id = cur.id
                this.editedItem.product_name = cur.name
            },
            searchPro() {
                this.showProducts = true
                this.product_name = this.editedItem.product_name
            },
            clearProSearch() {
                this.editedItem.product_id = null
                this.editedItem.product_name = null
            },
            closeSKU(val) {
                if ( val ) this.editedItem.sku = val
                this.showSKU = false
            }
        },
        computed: {
            formTitle() {
                return this.editedIndex === -1 ? '新建商品映射' : '编辑商品映射'
            }
        }
    }
</script>

<style scoped>

</style>
