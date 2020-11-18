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
                <v-text-field v-model.trim="editedItem.name" label="角色名称">
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
      <v-col cols="12" md="6" class="d-flex align-center py-4">
        <v-btn tile color="primary" v-ripple dark @click="onRefresh()">查询</v-btn>
        <v-btn tile color="primary" v-ripple dark @click="onCreate()" v-if="allowCreate">新建</v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" md="3">
        <v-card
            class="mx-auto"
            tile
        >
          <v-text-field
              clearable
              clear-icon="clear"
              class="px-4"
              placeholder="输入角色名"
              v-model.trim="role_name"
              @keyup.enter="getAllRoles()"
          />
          <v-list rounded>
            <v-subheader>角色列表</v-subheader>
            <v-list-item-group v-model="role" color="indigo">
              <v-list-item
                  v-for="(role, index) in roles"
                  :key="role.id"
              >
                <v-list-item-content>
                  <v-list-item-title v-text="role.name" />
                </v-list-item-content>
                <v-list-item-icon>
                  <v-icon small color="grey lighten-1" @click="editItem(role)">edit</v-icon>
                  <v-icon small color="grey lighten-1" @click.stop="deleteRole(role.id, index)">delete</v-icon>
                </v-list-item-icon>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        </v-card>
      </v-col>
      <v-col cols="12" md="9" class="py-0">
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
            @update:page="getRoleUsers"
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
          <template v-slot:no-data>
            无数据
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
    import mixin from "../../mixins/mixin"

    export default {
        name: "Roles",
        mixins: [mixin],
        data: () => ( {
            nav_items: [{
                text: '基础资料',
                disabled: true
            }],
            role: -1,
            role_id: null,

            role_name: '',

            options: {},
            loading: true,
            totalLength: 0,

            roles: [],
            users: [],
            headers: [
                {
                    text: 'ID',
                    align: 'left',
                    value: 'id'
                },
                { text: '用户', value: 'name' },
                { text: '对应c8中员工名称', value: 'employee_name' }
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
                  text: '角色管理',
                  disabled: false,
                  href: this.$route.path
              }
            )
        },
        methods: {
            init() {
                this.getAllRoles()
            },
            getAllRoles() {
                this.axios({
                    url: `/api/roles`,
                    params: {
                        name: this.role_name
                    }
                }).then(res => {
                    this.loading = false
                    if ( res.state === 1 ) {
                        this.roles = res.root
                        this.totalLength = res.total
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })

                })
            },
            getRoleUsers(role_id) {
                this.users = []
                this.axios({
                    url: `/api/roles/${ role_id }?action=users`
                }).then(res => {
                    if ( res.state ) {
                        this.users = res.root
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            postRole(params) {
                this.axios({
                    url: `/api/roles`,
                    method: 'POST',
                    data: params
                }).then(res => {
                    if ( res.state === 1 ) {
                        this.roles.unshift(res)
                        this.Snackerbar({ bool: true, type: 'success', text: '创建角色成功' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                }).finally(() => {
                    this.close()
                })
            },
            putRole(params, lc_id) {
                this.axios({
                    url: `/api/roles/${ lc_id }`,
                    method: 'PUT',
                    data: params
                }).then(res => {
                    if ( res.state === 1 ) {
                        Object.assign(this.roles[this.editedIndex], this.editedItem)
                        this.Snackerbar({ bool: true, type: 'success', text: '角色已更新' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                }).finally(() => {
                    this.close()
                })
            },
            deleteRole(role_id, index) {
                this.axios({
                    url: `/api/roles/${ role_id }`,
                    method: 'DELETE'
                }).then(res => {
                    if ( res.state === 1 ) {
                        this.roles.splice(index, 1)
                        this.Snackerbar({ bool: true, type: 'success', text: '删除成功' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            onRefresh() {
                this.options.page = 1
                this.getAllRoles()
            },
            editItem(item) {
                this.editedIndex = this.roles.indexOf(item)
                this.editedItem = Object.assign({}, item)
                this.dialog = true
            },
            deleteItem(item) {
                const index = this.roles.indexOf(item)
                confirm(`确认删除${ item.name }？`) && this.deleteRole({ role_id: item.id, index })
            },
            save() {
                let param = {
                    name: this.editedItem.name
                }
                if ( this.editedIndex > -1 )
                    this.putRole(param, this.editedItem.id)
                else
                    this.postRole(param)
            }
        },
        computed: {
            formTitle() {
                return this.editedIndex === -1 ? '新建角色' : '编辑角色'
            }
        },
        watch: {
            role(cur) { // index
                if ( cur != null ) {
                    this.role_id = this.roles[cur].id
                    this.getRoleUsers(this.role_id)
                }
                else {
                    this.role_id = null
                    this.users = []
                }
            }
        }
    }
</script>

<style scoped>

</style>
