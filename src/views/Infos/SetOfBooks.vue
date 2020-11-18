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
              <v-col cols="12" sm="6">
                <v-text-field v-model.trim="editedItem.token" label="令牌" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model.trim="editedItem.url" label="C8网址" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                    v-model="editedItem.bill_type"
                    :items="bill_types"
                    label="发票类型"
                />
              </v-col>
              <v-col col="6" md="5">
                <v-text-field
                    label="仓库"
                    v-model.trim="editedItem.store_name"
                    append-icon="search"
                    @click:append="searchStore"
                    @click:clear="clearStoreSearch"
                    clearable
                />
                <v-dialog v-model="showStore" max-width="500px">
                  <SearchStores
                      @Snackerbar="Snackerbar"
                      :search="store_search_text"
                      :showStore.sync="showStore"
                      @selected="fillStore"
                  />
                </v-dialog>
              </v-col>
              <v-col col="6" md="5">
                <v-text-field
                    label="散件仓库"
                    v-model.trim="editedItem.in_store_name"
                    append-icon="search"
                    @click:append="searchInStore"
                    @click:clear="clearInStoreSearch"
                    clearable
                />
                <v-dialog v-model="showInStore" max-width="500px">
                  <SearchStores
                      @Snackerbar="Snackerbar"
                      :search="in_store_search_text"
                      :showStore.sync="showInStore"
                      @selected="fillInStore"
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
      <v-col cols="12" md="6" class="d-flex align-center">
        <v-btn tile color="primary" v-ripple dark @click="onRefresh()">查询</v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" class="py-0">
        <v-data-table
            :height="tableHeight"
            fixed-header
            :headers="headers"
            :items="SOBs"
            :items-per-page="itemsPerPage"
            :footer-props="footer_props"
            :options.sync="options"
            :server-items-length="totalLength"
            :loading="loading"
            item-key="id"
            hide-default-header
            class="elevation-1"
            @update:page="getAllSOBs"
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
          <template v-slot:item.bill_type="{ item }">
            {{ item.bill_type | BillType }}
          </template>
          <template v-slot:item.action="{ item }">
            <v-icon v-if="allowEdit" small class="mr-2" @click="editItem(item)">
              edit
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
        name: "SetOfBooks",
        mixins: [mixin],
        data: () => ( {
            nav_items: [{
                text: '基础资料',
                disabled: true
            }],
            SOB_name: '',

            showStore: false,
            store_search_text: '',
            showInStore: false,
            in_store_search_text: '',

            options: {},
            loading: true,
            totalLength: 0,

            SOBs: [],
            headers: [
                {
                    text: 'ID',
                    align: 'left',
                    value: 'id'
                },
                { text: '账套号', value: 'name' },
                { text: '发票类型', value: 'bill_type' },
                { text: '仓库', value: 'store_name' },
                { text: '散件仓库', value: 'in_store_name' },
                { text: '令牌失效时间', value: 'token_expired_at' },
                { text: '操作', value: 'action',width: '100' }
            ],
            dialog: false,
            editedIndex: -1,
            editedItem: {},
            defaultItem: {
                name: '',
                url: '',
                store_id: null,
                store_name: '',
                in_store_id: null,
                in_store_name: '',
                bill_type: null
            }
        } ),
        created() {
            this.init()
            this.nav_items.push(
              {
                  text: '账套设置',
                  disabled: false,
                  href: this.$route.path
              }
            )
        },
        methods: {
            init() {
                this.getAllSOBs()
            },
            getAllSOBs() {
                this.SOBs = []
                this.axios({
                    url: `/api/set_of_books`,
                    params: {
                        ...this.reqParams()
                    }
                }).then(res => {
                    this.loading = false
                    if ( res.state ) {
                        this.SOBs = [res]
                        this.totalLength = res.total
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })

                })
            },
            putSOB(params, SOB_id) {
                this.axios({
                    url: `/api/set_of_books/${ SOB_id }`,
                    method: 'PUT',
                    data: params
                }).then(res => {
                    if ( res.state === 1 ) {
                        Object.assign(this.SOBs[this.editedIndex], this.editedItem)
                        this.Snackerbar({ bool: true, type: 'success', text: '账套信息已更新' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                }).finally(() => {
                    this.close()
                })
            },
            onRefresh() {
                this.options.page = 1
                this.getAllSOBs()
            },
            editItem(item) {
                this.editedIndex = this.SOBs.indexOf(item)
                this.editedItem = Object.assign({}, item)
                this.dialog = true
            },
            save() {
                let param = {
                    url: this.editedItem.url,
                    token: this.editedItem.token,
                    store_id: this.editedItem.store_id,
                    store_name: this.editedItem.store_name,
                    in_store_id: this.editedItem.in_store_id,
                    in_store_name: this.editedItem.in_store_name,
                    bill_type: this.editedItem.bill_type
                }
                if ( this.editedIndex > -1 ) {
                    this.putSOB(param, this.editedItem.id)
                }
            },
            fillStore(cur) {
                this.editedItem.store_id = cur.id
                this.editedItem.store_name = cur.name
            },
            searchStore() {
                this.showStore = true
                this.store_search_text = this.editedItem.store_name
            },
            clearStoreSearch() {
                this.editedItem.store_id = null
                this.editedItem.store_name = ''
            },
            fillInStore(cur) {
                this.editedItem.in_store_id = cur.id
                this.editedItem.in_store_name = cur.name
            },
            searchInStore() {
                this.showInStore = true
                this.in_store_search_text = this.editedItem.in_store_name
            },
            clearInStoreSearch() {
                this.editedItem.in_store_id = null
                this.editedItem.in_store_name = ''
            }
        },
        computed: {
            formTitle() {
                return this.editedIndex === -1 ? '' : '编辑账套信息'
            }
        }
    }
</script>

<style scoped>

</style>
