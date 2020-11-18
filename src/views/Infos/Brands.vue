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
                <v-text-field v-model="editedItem.name" validate-on-blur label="品牌名">
                  <span slot="prepend" class="red--text">*</span>
                </v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <Vcombobox
                    ref="product_type"
                    @select_change="product_type_change_dialog"
                    :p-items="product_types"
                    :p-search="product_type_search"
                    :setValue="product_type_value"
                    p-label="商品类型"
                    p-placeholder="筛选类型"
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
      <v-col cols="6" sm="4" md="3" class="py-0">
        <v-text-field
            label="品牌名"
            @keyup.enter="onRefresh()"
            clearable
            v-model.trim="brand_name"
        />
      </v-col>
      <v-col cols="6" sm="4" md="3" class="py-0">
        <v-text-field
            label="商品类型"
            @keyup.enter="onRefresh()"
            clearable
            v-model.trim="product_type_name" />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" class="py-0">
        <v-data-table
            :height="tableHeight"
            fixed-header
            :headers="headers"
            :items="brands"
            :items-per-page="itemsPerPage"
            :footer-props="footer_props"
            :options.sync="options"
            :server-items-length="totalLength"
            :loading="loading"
            hide-default-header
            item-key="id"
            class="elevation-1"
            @update:page="getAllBrands"
            @page-count="pagination_length = $event"
        >
          <template v-if="!mobile" v-slot:header="{ props: { headers } }">
            <thead>
            <tr>
              <th :width="header.width"  v-for="header in headers" :key="header.text">
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
        name: "Brands",
        mixins: [mixin],
        data: () => ( {
            nav_items: [{
                text: '基础资料',
                disabled: true
            }],
            product_type_value: {},
            product_types: [],
            product_type_id: '',
            product_type_search: '',

            options: {},
            loading: true,
            totalLength: 0,

            brands: [],
            brand_name: '',
            product_type_name: '',
            headers: [
                {
                    text: 'ID',
                    align: 'left',
                    value: 'id',
                },
                {
                    text: '品牌名',
                    align: 'left',
                    value: 'name'
                },
                { text: '商品类型',  value: 'product_type_name' },
                { text: '操作', value: 'action',width: '100' }
            ],
            dialog: false,
            editedIndex: -1,
            editedItem: {},
            defaultItem: {
                name: '',
                product_type_id: '',
                product_type_name: '',
            },
        } ),
        created() {
            this.init()
            this.nav_items.push(
              {
                  text: '商品品牌',
                  disabled: false,
                  href: this.$route.path
              }
            )
        },
        methods: {
            init() {
                this.getAllBrands()
                this.getAllPTs()
            },
            getAllBrands() {
                this.brands=[]
                let params = {
                    product_type_name: this.product_type_name,
                    name: this.brand_name,
                    ...this.reqParams()
                }
                this.axios({
                    url: '/api/brands',
                    params
                }).then(res => {
                    this.loading = false
                    if ( res.state === 1 ) {
                        this.brands = res.root
                        this.totalLength =  res.total
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            getAllPTs(){
                this.axios({
                    url: `/api/product_types`
                }).then(res=> {
                    if (res.state === 1) {
                        this.product_types = res.root
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })

                })
            },
            product_type_change_dialog(child_msg){
                if (child_msg) {
                    this.editedItem.product_type_id = child_msg.id
                    this.editedItem.product_type_name = child_msg.name
                } else {
                    delete this.editedItem.product_type_id
                    delete this.editedItem.product_type_name
                }
            },
            postBrand({brand_name, product_type_id} = {}) {
                let params ={
                    name: brand_name,
                    product_type_id: product_type_id
                }
                this.axios({
                    url: `/api/brands`,
                    method: 'POST',
                    data: params
                }).then(res=> {
                    if (res.state) {
                        this.brands.unshift(res)
                        this.Snackerbar({ bool: true, type: 'success', text: '创建品牌成功' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                }).finally(()=>{
                    this.close()
                })
            },
            putBrand({brand_id, brand_name, product_type_id} = {}) {
                let params = {
                    name: brand_name,
                    product_type_id: product_type_id
                }
                this.axios({
                    url: `/api/brands/${ brand_id }`,
                    method: 'PUT',
                    data: params
                }).then(res=> {
                    if (res.state === 1) {
                        Object.assign(this.brands[this.editedIndex], this.editedItem)
                        this.Snackerbar({bool:true, type: 'success', text: '品牌信息已更新'})
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                }).finally(()=>{
                    this.close()
                })
            },
            deleteBrand({brand_id, index} = {}) {
                this.axios({
                    url: `/api/brands/${ brand_id }`,
                    method: 'DELETE'
                }).then(res=> {
                    if (res.state === 1) {
                        this.brands.splice(index, 1)
                        this.Snackerbar({ bool: true, type: 'success', text: '删除成功' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            onCreate(){
                this.dialog = true
                this.product_type_value = null
                this.$refs.product_type && this.$refs.product_type.resetItem()
            },
            onRefresh(){
                this.options.page = 1
                this.getAllBrands()
            },
            editItem (item) {
                this.editedIndex = this.brands.indexOf(item)
                this.editedItem = Object.assign({}, item)
                this.product_type_value = this.product_types.find((value)=> {
                    if (value.id === this.editedItem.product_type_id) return true
                })
                this.dialog = true
            },
            deleteItem (item) {
                const index = this.brands.indexOf(item)
                confirm(`确认删除${item.name}？`) && this.deleteBrand({brand_id:item.id, index})
            },
            save () {
                if (this.editedIndex > -1) {
                    let param = {
                        brand_id: this.editedItem.id,
                        brand_name: this.editedItem.name,
                        product_type_id: this.editedItem.product_type_id
                    }

                    this.putBrand(param)
                } else {
                    let param = {
                        brand_name: this.editedItem.name,
                        product_type_id: this.editedItem.product_type_id
                    }
                    this.postBrand(param)
                }
            }
        },
        computed: {
            formTitle () {
                return this.editedIndex === -1 ? '新建品牌' : '编辑品牌信息'
            }
        },
        watch: {
            'options.itemsPerPage': {
                handler (cur, old) {
                    if (old == null) return
                    this.getAllBrands()
                }
            }
        }
    }
</script>

<style scoped>

</style>
