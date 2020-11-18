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
                <v-text-field v-model.trim="editedItem.name" label="用户">
                  <span slot="prepend" class="red--text">*</span>
                </v-text-field>
              </v-col>

              <v-col cols="12" sm="6" md="6">
                <v-text-field v-model="editedItem.password" label="密码">
                  <span slot="prepend" class="red--text">*</span>
                </v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" sm="6" md="6">
                <v-text-field
                    class="pl-0 pl-md-3"
                    label="选择C8员工"
                    v-model.trim="editedItem.employee_name"
                    append-icon="search"
                    @click:append="searchEmployee"
                    @click:clear="clearEmployeeSearch"
                    clearable
                />
                <v-dialog v-model="showEmployees" max-width="500px">
                  <SearchEmployees
                      @Snackerbar="Snackerbar"
                      :search="employee_search_text"
                      :showEmployees.sync="showEmployees"
                      @selected="fillEmployee"
                  />
                </v-dialog>
              </v-col>
              <v-col cols="12" sm="6" md="6">
                <Vcombobox
                    class="pl-0 pl-md-3"
                    ref="role"
                    @select_change="role_change"
                    :p-items="roles"
                    :p-required="false"
                    :p-search="role_search"
                    :setValue="role_value"
                    p-label="角色"
                    p-placeholder="筛选角色"
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
      <v-col cols="12" sm="3" md="3" class="d-flex align-center py-0">
        <v-btn tile color="primary" v-ripple dark @click="onRefresh()">查询</v-btn>
        <v-btn tile color="primary" v-ripple dark @click="onCreate()" v-if="allowCreate">新建</v-btn>
      </v-col>
      <v-col cols="4" sm="3" md="3" class="py-0">
        <v-text-field
            label="用户名"
            @keyup.enter="onRefresh()"
            clearable
            v-model.trim="user_name"
        />
      </v-col>
      <v-col cols="4" sm="3" md="3" class="py-0">
        <v-text-field
            label="角色"
            @keyup.enter="onRefresh()"
            clearable
            v-model.trim="role_name"
        />
      </v-col>
      <v-col cols="4" sm="3" md="3" class="py-0">
        <v-text-field
            label="员工"
            @keyup.enter="onRefresh()"
            clearable
            v-model.trim="employee_name"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" class="py-0">
        <v-data-table
            :height="tableHeight"
            fixed-header
            :headers="headers"
            :items="users"
            :items-per-page="itemsPerPage"
            :footer-props="footer_props"
            :options.sync="options"
            :server-items-length="totalLength"
            :loading="loading"
            item-key="id"
            hide-default-header
            class="elevation-1"
            @update:page="getAllUsers"
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
        name: "Users",
        mixins: [mixin],
        data: () => ( {
            nav_items: [{
                text: '基础资料',
                disabled: true
            }],
            user_name: '',
            employee_name: '',

            showEmployees: false,
            employee_search_text: '',

            role_name: '',
            role_search: '',
            role_value: {},
            roles: [],

            employees: [],

            options: {},
            loading: true,
            totalLength: 0,

            users: [],
            headers: [
                {
                    text: 'ID',
                    align: 'left',
                    value: 'id'
                },
                { text: '用户名', value: 'name' },
                { text: '角色名', value: 'role_name' },
                { text: '对应C8中员工', value: 'employee_name' },
                { text: '操作', value: 'action',width: '100' }
            ],
            dialog: false,
            editedIndex: -1,
            editedItem: {},
            defaultItem: {
                id: null,
                name: null,
                password: null,
                employee_id: null,
                employee_name: null,
                role_name: null,
                role_id: null
            }
        } ),
        created() {
            this.init()
            this.nav_items.push(
              {
                  text: '用户管理',
                  disabled: false,
                  href: this.$route.path
              }
            )
        },
        methods: {
            init() {
                this.getAllUsers()
                this.getAllRoles()
            },
            getAllUsers() {
                this.users = []
                this.axios({
                    url: `/api/users`,
                    params: {
                        name: this.user_name,
                        employee_name: this.employee_name,
                        role_name: this.role_name,
                        ...this.reqParams()
                    }
                }).then(res => {
                    this.loading = false
                    if ( res.state === 1 ) {
                        this.users = res.root
                        this.totalLength = res.total
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })

                })
            },
            getAllRoles() {
                this.axios({
                    url: `/api/roles`,
                    params: {
                        name: this.role_search
                    }
                }).then(res => {
                    this.loading = false
                    if ( res.state === 1 ) {
                        this.roles = res.root
                    }
                })
            },
            role_change(child_msg) {
                if ( child_msg ) {
                    let { id, name } = child_msg
                    this.editedItem.role_id = id
                    this.editedItem.role_name = name
                }
                else {
                    this.editedItem.role_id = null
                    this.editedItem.role_name = null
                }
            },
            postUser({ password, user_name, employee_id, role_id } = {}) {
                let params = {
                    name: user_name,
                    password,
                    employee_id,
                    role_id
                }
                this.axios({
                    url: `/api/users`,
                    method: 'POST',
                    data: params
                }).then(res => {
                    if ( res.state === 1 ) {
                        this.users.unshift(res)
                        this.Snackerbar({ bool: true, type: 'success', text: '创建用户成功' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                }).finally(() => {
                    this.close()
                })
            },
            putUser(params, user_id) {
                this.axios({
                    url: `/api/users/${ user_id }`,
                    method: 'PUT',
                    data: params
                }).then(res => {
                    if ( res.state ) {
                        Object.assign(this.users[this.editedIndex], this.editedItem)
                        this.Snackerbar({ bool: true, type: 'success', text: '用户已更新' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                }).finally(() => {
                    this.close()
                })
            },
            deleteUser({ user_id, index } = {}) {
                this.axios({
                    url: `/api/users/${ user_id }`,
                    method: 'DELETE'
                }).then(res => {
                    if ( res.state === 1 ) {
                        this.users.splice(index, 1)
                        this.Snackerbar({ bool: true, type: 'success', text: '删除成功' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            onCreate() {
                this.dialog = true
                this.role_value = null
                this.$refs.role && this.$refs.role.resetItem()
            },
            onRefresh() {
                this.options.page = 1
                this.getAllUsers()
            },
            editItem(item) {
                this.editedIndex = this.users.indexOf(item)
                this.editedItem = Object.assign({}, item)
                this.role_value = this.roles.find((value) => {
                    if ( value.id === this.editedItem.role_id ) return true
                })
                this.dialog = true
            },
            deleteItem(item) {
                const index = this.users.indexOf(item)
                confirm(`确认删除${ item.name }？`) && this.deleteUser({ user_id: item.id, index })
            },
            save() {
                let param = {
                    user_name: this.editedItem.name,
                    employee_id: this.editedItem.employee_id,
                    password: this.editedItem.password,
                    role_id: this.editedItem.role_id
                }
                if ( this.editedIndex > -1 )
                    this.putUser(param, this.editedItem.id)
                else
                    this.postUser(param)
            },
            fillEmployee(cur) {
                this.editedItem.employee_id = cur.id
                this.editedItem.employee_name = cur.name
            },
            searchEmployee() {
                this.showEmployees = true
                this.employee_search_text = this.editedItem.employee_name
            },
            clearEmployeeSearch() {
                this.editedItem.employee_id = null
                this.editedItem.employee_name = null
            }
        },
        computed: {
            formTitle() {
                return this.editedIndex === -1 ? '新建用户' : '编辑用户信息'
            }
        }
    }
</script>

<style scoped>

</style>
