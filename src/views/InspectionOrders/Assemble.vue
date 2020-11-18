<template>
  <v-card v-bind="$props" v-on="$listeners">
    <Vsnackerbar :show.sync="snackbar" :type="snackbar_type">{{ snackbar_text }}</Vsnackerbar>

    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="headline">编辑明细</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                    label="C8中对应商品"
                    v-model.trim="editedItem.product_name"
                    append-icon="search"
                    @click:append="searchC8Pro"
                    @click:clear="clearC8ProSearch"
                    clearable
                />
                <v-dialog v-model="showC8Products" max-width="500px">
                  <SearchC8Products
                      @Snackerbar="Snackerbar"
                      :search="c8_product_name"
                      :showC8Products.sync="showC8Products"
                      @selected="fillC8Pro"
                  />
                </v-dialog>
              </v-col>
              <v-col cols="3" md="6">
                <v-text-field v-model.trim="editedItem.quantity" label="数量" />
              </v-col>
              <v-col cols="3" md="6">
                <v-text-field v-model.trim="editedItem.price" label="单价" />
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
    <Vsnackerbar :show.sync="snackbar" :type="snackbar_type">{{ snackbar_text }}</Vsnackerbar>
    <v-form>
      <v-container>
        <v-btn color="primary" @click="saveAssembleBill" v-if="$store.getters.allowCreateAssemble">
          保存组装拆卸单
        </v-btn>
        <v-row>
          <v-col col="6" md="3">
            <v-text-field
                label="部门"
                v-model.trim="bill.department_name"
                append-icon="search"
                @click:append="searchC8Dep"
                @click:clear="clearC8DepSearch"
                clearable
            >
              <span slot="prepend" class="red--text">*</span>
            </v-text-field>
            <v-dialog v-model="showC8Departments" max-width="500px">
              <SearchC8Departments
                  @Snackerbar="Snackerbar"
                  :search="dep_name"
                  :showC8Departments.sync="showC8Departments"
                  @selected="fillC8Dep"
              />
            </v-dialog>
          </v-col>
          <v-col col="6" md="3">
            <v-text-field
                class="pl-0 pl-md-3"
                label="选择C8员工"
                v-model.trim="bill.employee_name"
                append-icon="search"
                @click:append="searchEmployee"
                @click:clear="clearEmployeeSearch"
                clearable
            >
              <span slot="prepend" class="red--text">*</span>
            </v-text-field>
            <v-dialog v-model="showEmployees" max-width="500px">
              <SearchEmployees
                  @Snackerbar="Snackerbar"
                  :search="employee_search_text"
                  :showEmployees.sync="showEmployees"
                  @selected="fillEmployee"
              />
            </v-dialog>
          </v-col>
          <v-col col="6" md="3">
            <v-text-field
                label="成品仓库"
                v-model.trim="bill.store_name"
                append-icon="search"
                @click:append="searchStore"
                @click:clear="clearStoreSearch"
                clearable
            >
              <span slot="prepend" class="red--text">*</span>
            </v-text-field>
            <v-dialog v-model="showStore" max-width="500px">
              <SearchStores
                  @Snackerbar="Snackerbar"
                  :search="store_search_text"
                  :showStore.sync="showStore"
                  @selected="fillStore"
              />
            </v-dialog>
          </v-col>
          <v-col col="6" md="3">
            <v-text-field
                label="散件仓库"
                v-model.trim="bill.in_store_name"
                append-icon="search"
                @click:append="searchInStore"
                @click:clear="clearInStoreSearch"
                clearable
            >
              <span slot="prepend" class="red--text">*</span>
            </v-text-field>
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
        <!--        明细部分-->
        <v-row>
          <!--          成品-->
          <v-col>
            <v-chip color="amber">成品录入</v-chip>
            <v-simple-table
                class="elevation-1"
                dense
            >
              <template v-slot:default>
                <thead>
                <tr>
                  <th class="text-left"
                      v-for="header in headers"
                      :key="header.text"
                  >
                    {{ header.text }}
                  </th>
                </tr>
                </thead>
                <tbody>
                <tr>
                  <td>{{ 1 }}</td>
                  <td>{{ bill.product_name }}</td>
                  <td>{{ bill.quantity }}</td>
                  <td>{{ bill.price | Roundup }}</td>
                  <td>
                    <v-icon
                        small
                        class="mr-2"
                        @click="editLine(bill)"
                    >
                      edit
                    </v-icon>
                  </td>
                </tr>
                </tbody>
              </template>
            </v-simple-table>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-chip color="amber">散件录入</v-chip>
            <v-data-table
                dense
                disable-sort
                hide-default-footer
                :headers="headers"
                :items="billLines"
                class="elevation-1"
            >
              <template v-slot:body="{ items }">
                <tbody>
                <tr v-for="(item, index) in items" :key="index">
                  <td>{{ index + 1 }}</td>
                  <td>{{ item.product_name }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>{{ item.price | Roundup }}</td>
                  <td>
                    <v-icon
                        small
                        class="mr-2"
                        @click="editItem(item)"
                    >
                      edit
                    </v-icon>
                  </td>
                </tr>
                </tbody>
              </template>

            </v-data-table>
          </v-col>
        </v-row>
      </v-container>
    </v-form>
  </v-card>
</template>

<script>
    import mixin from '@/mixins/mixin'
    export default {
        name: "Assemble",
        mixins: [mixin],
        props: ['pData'],
        data() {
            return {
                IO_id: null,
                bill: {},
                billLines: [], // 散件明细

                showEmployees: false,
                employee_search_text: '',

                showStore: false,
                store_search_text: '',

                showInStore: false,
                in_store_search_text: '',

                showC8Departments: false,
                dep_name: '',

                headers: [
                    {
                        text: '序号',
                        align: 'left',
                        value: '',
                        width: '80'
                    },
                    {
                        text: '商品名',
                        align: 'left',
                        value: 'product_name'
                    },
                    {
                        text: '数量',
                        align: 'left',
                        value: 'quantity',
                        width: '150'
                    },
                    {
                        text: '单价',
                        align: 'left',
                        value: 'price'
                    },
                    {
                        text: '操作',
                        value: 'action',
                        width: '80'
                    }
                ],
                dialog: false, // 编辑行
                editedIndex: -1,
                editedItem: {},
                defaultItem: {
                    product_name: '',
                    product_id: '',
                    quantity: 0,
                    price: null
                },
                c8_product_name: '',
                showC8Products: false
            }
        },
        watch: {
            pData: {
                handler(cur) {
                    this.IO_id = cur.IO_id
                    this.bill = cur.bill
                    this.billLines = cur.bill.assemble_part_lines

                },
                immediate: true
            }
        },
        methods: {
            saveAssembleBill() { // 保存组装拆卸单
                this.bill.assemble_part_lines = this.billLines
                let data = this.bill
                data.form_name = 'assemble'
                this.axios({
                    url: `/api/inspection_orders/${ this.IO_id }?action=create_form`,
                    method: 'POST',
                    data: data
                }).then(res => {
                    if ( res.state === 1 ) {
                        this.$listeners.Snackerbar({ bool: true, type: 'success', text: '组装拆卸单更新成功' })
                        this.$emit('update:saveAssembleBill', false)
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            save() {
                if ( this.editedIndex > -1 )
                    Object.assign(this.billLines[this.editedIndex], this.editedItem)
                else
                    Object.assign(this.bill, this.editedItem)
                this.close()
            },
            editLine(bill) {// 成品表
                this.editedIndex = -2
                this.editedItem = Object.assign({}, bill)
                this.dialog = true
            },
            editItem(item) {// 散件表
                this.editedIndex = this.billLines.indexOf(item)
                this.editedItem = Object.assign({}, item)
                this.dialog = true
            },
            fillEmployee(cur) {
                this.bill.employee_id = cur.id
                this.bill.employee_name = cur.name
            },
            searchEmployee() {
                this.showEmployees = true
                this.employee_search_text = this.bill.employee_name

            },
            clearEmployeeSearch() {
                this.bill.employee_id = null
                this.bill.employee_name = null
            },
            fillStore(cur) {
                this.bill.store_id = cur.id
                this.bill.store_name = cur.name
            },
            searchStore() {
                this.showStore = true
                this.store_search_text = this.bill.store_name
            },
            clearStoreSearch() {
                this.bill.store_id = null
                this.bill.store_name = ''
            },

            fillC8Dep(cur) {
                this.bill.department_id = cur.id
                this.bill.department_name = cur.name
            },
            searchC8Dep() {
                this.showC8Departments = true
                this.dep_name = this.bill.department_name
            },
            clearC8DepSearch() {
                this.bill.department_name = null
                this.bill.department_id = null
            },
            // c8商品
            fillC8Pro(cur) {
                this.editedItem.product_id = cur.id
                this.editedItem.product_name = cur.name
            },
            searchC8Pro() {
                this.showC8Products = true
                this.c8_product_name = this.editedItem.product_name
            },
            clearC8ProSearch() {
                this.editedItem.product_id = null
                this.editedItem.product_name = null
            },
            // 散件仓库
            fillInStore(cur) {
                this.bill.in_store_id = cur.id
                this.bill.in_store_name = cur.name
            },
            searchInStore() {
                this.showInStore = true
                this.in_store_search_text = this.bill.in_store_name
            },
            clearInStoreSearch() {
                this.bill.in_store_id = null
                this.bill.in_store_name = ''
            }
        }
    }
</script>

<style scoped>

</style>
