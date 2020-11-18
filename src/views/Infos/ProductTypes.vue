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
                <v-text-field v-model.trim="editedItem.name" validate-on-blur label="商品类型">
                  <span slot="prepend" class="red--text">*</span>
                </v-text-field>
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
      <v-col cols="4" md="6" class="d-flex align-center py-0">
        <v-btn tile color="primary" v-ripple dark @click="onRefresh()">查询</v-btn>
        <v-btn tile color="primary" v-ripple dark @click="onCreate()" v-if="allowCreate">新建</v-btn>
      </v-col>
      <v-spacer />
      <v-col cols="12" md="3" class="py-0">
        <v-text-field
            label="商品类型"
            clearable
            @keyup.enter="onRefresh()"
            v-model.trim="product_type_name"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" class="py-0">
        <v-data-table
            :height="tableHeight"
            fixed-header
            :headers="headers"
            :items="product_types"
            :items-per-page="itemsPerPage"
            :footer-props="footer_props"
            :options.sync="options"
            :server-items-length="totalLength"
            :loading="loading"
            item-key="id"
            hide-default-header
            class="elevation-1"
            @update:page="getAllPTs"
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
            product_type_name: '',

            options: {},
            loading: true,
            totalLength: 0,

            product_types: [],
            headers: [
                {
                    text: 'ID',
                    align: 'left',
                    value: 'id'

                },
                { text: '商品类型', value: 'name' },
                { text: '操作', value: 'action',width: '100' }
            ],
            dialog: false,
            editedIndex: -1,
            editedItem: {},
            defaultItem: {
                name: ''
            }
        } ),
        created() {
            this.init()
            this.nav_items.push(
              {
                  text: '商品类型',
                  disabled: false,
                  href: this.$route.path
              }
            )
        },
        methods: {
            init() {
                this.getAllPTs()
            },
            getAllPTs() {
                this.product_types = []
                this.axios({
                    url: `/api/product_types`,
                    params: {
                        name: this.product_type_name,
                        ...this.reqParams()
                    }
                }).then(res => {
                    this.loading = false
                    if ( res.state === 1 ) {
                        this.product_types = res.root
                        this.totalLength = res.total
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })

                })
            },
            postPT(pt_name) {
                let params = {
                    name: pt_name
                }
                this.axios({
                    url: `/api/product_types`,
                    method: 'POST',
                    data: params
                }).then(res => {
                    if ( res.state === 1 ) {
                        this.product_types.unshift(res)
                        this.Snackerbar({ bool: true, type: 'success', text: '创建商品类型成功' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                }).finally(() => {
                    this.close()
                })
            },
            putPT({ pt_id, pt_name } = {}) {
                let params = {
                    name: pt_name
                }
                this.axios({
                    url: `/api/product_types/${ pt_id }`,
                    method: 'PUT',
                    data: params
                }).then(res => {
                    if ( res.state === 1 ) {
                        Object.assign(this.product_types[this.editedIndex], this.editedItem)
                        this.Snackerbar({ bool: true, type: 'success', text: '商品类型已更新' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                }).finally(() => {
                    this.close()
                })
            },
            deletePT({ pt_id, index } = {}) {
                this.axios({
                    url: `/api/product_types/${ pt_id }`,
                    method: 'DELETE'
                }).then(res => {
                    if ( res.state === 1 ) {
                        this.product_types.splice(index, 1)
                        this.Snackerbar({ bool: true, type: 'success', text: '删除成功' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            onRefresh() {
                this.options.page = 1
                this.getAllPTs()
            },
            editItem(item) {
                this.editedIndex = this.product_types.indexOf(item)
                this.editedItem = Object.assign({}, item)
                this.dialog = true
            },
            deleteItem(item) {
                const index = this.product_types.indexOf(item)
                confirm(`确认删除${ item.name }？`) && this.deletePT({ pt_id: item.id, index })
            },
            save() {
                if ( this.editedIndex > -1 ) {
                    let param = {
                        pt_id: this.editedItem.id,
                        pt_name: this.editedItem.name
                    }
                    this.putPT(param)
                }
                else {
                    this.postPT(this.editedItem.name)
                }
            }
        },
        computed: {
            formTitle() {
                return this.editedIndex === -1 ? '新建商品类型' : '编辑商品类型'
            }
        }
    }
</script>

<style scoped>

</style>
