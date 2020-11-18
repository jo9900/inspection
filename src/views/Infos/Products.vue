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
              <v-col cols="12" md="6">
                <v-text-field v-model.trim="editedItem.name" label="商品型号">
                  <span slot="prepend" class="red--text">*</span>
                </v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <Vcombobox
                    ref="brand"
                    @select_change="brand_change_dialog"
                    :p-items="brands"
                    :setValue="brand_value"
                    p-label="商品品牌"
                    p-placeholder="筛选品牌"
                />
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
      <v-spacer></v-spacer>
      <v-col cols="6" sm="4" md="3" class="py-0">
        <v-text-field
            label="品牌"
            @keyup.enter="onRefresh()"
            clearable
            v-model.trim="brand_name"
        />
      </v-col>
      <v-col cols="6" sm="4" md="3" class="py-0">
        <v-text-field
            label="型号"
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
            :items="products"
            :items-per-page="itemsPerPage"
            :footer-props="footer_props"
            :options.sync="options"
            :server-items-length="totalLength"
            :loading="loading"
            item-key="id"
            hide-default-header
            @update:page="getAllPros"
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
        name: "ProductTypes",
        mixins: [mixin],
        data: () => ( {
            nav_items: [{
                text: '基础资料',
                disabled: true
            }],
            brands: [],
            brand_value: {},

            product_name: '',
            brand_name: '',

            options: {},
            loading: true,
            totalLength: 0,

            search: '',
            products: [],
            headers: [
                {
                    text: 'ID',
                    align: 'left',
                    value: 'id'

                },
                { text: '商品型号', value: 'name' },
                { text: '品牌', value: 'brand_name' },
                { text: '操作', value: 'action',width: '100' }
            ],
            dialog: false,
            editedIndex: -1,
            editedItem: {},
            defaultItem: {
                name: '',
                brand_id: null,
                brand_name: null
            }
        } ),
        created() {
            this.init()
            this.nav_items.push(
              {
                  text: '商品型号',
                  disabled: false,
                  href: this.$route.path
              }
            )
        },
        methods: {
            init() {
                this.getAllPros()
                this.getAllBrands()
            },
            getAllPros() {
                this.products = []
                let params = {
                    brand_name: this.brand_name,
                    name: this.product_name,
                    ...this.reqParams()
                }
                this.axios({
                    url: `/api/products`,
                    params
                }).then(res => {
                    this.loading = false
                    if ( res.state ) {
                        this.products = res.root
                        this.totalLength = res.total
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
            brand_change_dialog(child_msg) {
                if ( child_msg ) {
                    this.editedItem.brand_id = child_msg.id
                    this.editedItem.brand_name = child_msg.name
                }
                else {
                    delete this.editedItem.brand_id
                    delete this.editedItem.brand_name
                }
            },
            postPro({ pro_name, brand_id } = {}) {
                let params = {
                    name: pro_name,
                    brand_id
                }
                this.axios({
                    url: `/api/products`,
                    method: 'POST',
                    data: params
                }).then(res => {
                    if ( res.state === 1 ) {
                        this.products.unshift(res)
                        this.Snackerbar({ bool: true, type: 'success', text: '创建商品类型成功' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                }).finally(() => {
                    this.close()
                })
            },
            putPro({ pro_id, pro_name, brand_id } = {}) {
                let params = {
                    name: pro_name,
                    brand_id
                }
                this.axios({
                    url: `/api/products/${ pro_id }`,
                    method: 'PUT',
                    data: params
                }).then(res => {
                    if ( res.state === 1 ) {
                        Object.assign(this.products[this.editedIndex], this.editedItem)
                        this.Snackerbar({ bool: true, type: 'success', text: '商品型号已更新' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                }).finally(() => {
                    this.close()
                })
            },
            deletePro({ pro_id, index } = {}) {
                this.axios({
                    url: `/api/products/${ pro_id }`,
                    method: 'DELETE'
                }).then(res => {
                    if ( res.state === 1 ) {
                        this.products.splice(index, 1)
                        this.Snackerbar({ bool: true, type: 'success', text: '删除成功' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            onCreate() {
                this.dialog = true
                this.brand_value = null
                this.$refs.brand && this.$refs.brand.resetItem()
            },
            onRefresh() {
                this.options.page = 1
                this.getAllPros()
            },
            editItem(item) {
                this.editedIndex = this.products.indexOf(item)
                this.editedItem = Object.assign({}, item)

                this.brand_value = this.brands.find((value) => {
                    if ( value.id === this.editedItem.brand_id ) return true
                })
                this.dialog = true
            },
            deleteItem(item) {
                const index = this.products.indexOf(item)
                confirm(`确认删除${ item.name }？`) && this.deletePro({ pro_id: item.id, index })
            },
            save() {
                if ( this.editedIndex > -1 ) {
                    let param = {
                        brand_id: this.editedItem.brand_id,
                        pro_name: this.editedItem.name,
                        pro_id: this.editedItem.id
                    }
                    this.putPro(param)
                }
                else {
                    let param = {
                        brand_id: this.editedItem.brand_id,
                        pro_name: this.editedItem.name
                    }
                    this.postPro(param)
                }
            }
        },
        computed: {
            formTitle() {
                return this.editedIndex === -1 ? '新建商品型号' : '编辑商品型号'
            }
        }
    }
</script>

<style scoped>

</style>
