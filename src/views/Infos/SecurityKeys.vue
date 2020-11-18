<template>
  <v-container class="wrap">
    <Vsnackerbar :show.sync="snackbar" :type="snackbar_type">{{ snackbar_text }}</Vsnackerbar>
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
        <v-btn tile color="primary" v-ripple dark @click="onSave()">保存设置</v-btn>
        <v-btn tile color="primary" v-ripple dark @click="onRevert()">重置变更</v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" md="3" lg="2">
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
            <v-list-item-group v-model="role" color="primary">
              <v-list-item
                  color="indigo"
                  v-for="role in roles"
                  :key="role.id"
              >
                <v-list-item-content>
                  <v-list-item-title v-text="role.name" />
                </v-list-item-content>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        </v-card>
      </v-col>
      <v-col cols="12" md="9">
        <v-row>
          <v-col cols="8" class="pl-0 pl-md-3">
            <v-treeview
                :items="trees"
                dense
                selectable
                v-model="sk_selected"
                return-object
                activatable
                @update:active="changeActiveSK"
                color="indigo"
                selected-color="indigo"
                hoverable
                open-on-click
            />
          </v-col>
          <v-col cols="4" class="pa-0">
            <v-checkbox
                v-for="item in access_levels"
                :key="item.access_level"
                v-model="ac_selected"
                :label="item.text"
                :value="item.access_level"
                color="indigo"
                hide-details
                @change="changeAC"
            />
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
    import mixin from "../../mixins/mixin"

    export default {
        name: "SecurityKeys",
        mixins: [mixin],
        data: () => ( {
            nav_items: [{
                text: '基础资料',
                disabled: true
            }],
            role_name: '',
            role_id: null,
            trees: [],
            access_levels: [],
            role: -1,
            roles: [],
            sk_selected: [], // 勾选的项目
            ac_selected: [],
            clickedSK: []
        } ),
        created() {
            this.init()
            this.nav_items.push(
              {
                  text: '权限管理',
                  disabled: false,
                  href: this.$route.path
              }
            )
        },
        watch: {
            role(cur) {
                if ( cur != null ) {
                    this.role_id = this.roles[cur].id
                    this.getRoleSK(this.role_id)
                }
                else {
                    this.role_id = null
                    this.trees = []
                }
                this.access_levels = []
            }
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
                    if ( res.state === 1 ) {
                        this.roles = res.root
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            getRoleSK(role_id) {
                this.axios({
                    url: `/api/roles/${ role_id }?action=security_keys`
                }).then(res => {
                    if ( res.state ) {
                        this.trees = res.root
                        this.getSKSelected()
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            getSKSelected() {
                let arr = []
                this.trees.forEach(val => {
                    if ( val.checked ) {
                        arr.push(val) // 第一级勾上时
                    }
                    else { // 第一级没有勾上时
                        let selectedChildren = val.children.filter(child => child.checked === true)
                        arr = arr.concat(selectedChildren)
                    }
                })
                this.$nextTick(function () {
                    this.sk_selected = arr
                })
            },
            changeActiveSK(item) { // 切换选中节点
                this.clickedSK = item
                this.access_levels = []
                if ( !item.length ) { // 取消选中时
                    return
                }
                let { needed_access_level = null, access_level = null } = item[0]
                if ( !needed_access_level ) return // 未选中 或者 没有权限

                this.ac_selected = []
                // eslint-disable-next-line no-unused-vars
                let level = 0
                if ( ( 1 & needed_access_level ) === 1 ) {//查看
                    if ( ( 1 & access_level ) === 1 ) {
                        level += 1;
                        this.ac_selected = [1]
                    }
                    this.access_levels.push({
                        text: '查看',
                        access_level: 1
                    })
                }
                if ( ( 2 & needed_access_level ) === 2 ) {//编辑
                    if ( ( 2 & access_level ) === 2 ) {
                        level += 2;
                        this.ac_selected.push(2)
                    }
                    this.access_levels.push({
                        text: '编辑',
                        access_level: 2
                    })
                }

                if ( ( 4 & needed_access_level ) === 4 ) {//新建
                    if ( ( 4 & access_level ) === 4 ) {
                        level += 4;
                        this.ac_selected.push(4)
                    }

                    this.access_levels.push({
                        text: item[0].lcode.includes('/report')?'导出':'新建',
                        access_level: 4
                    })
                }
                if ( ( 8 & needed_access_level ) === 8 ) {//删除
                    if ( ( 8 & access_level ) === 8 ) {
                        level += 8;
                        this.ac_selected.push(8)
                    }
                    this.access_levels.push({
                        text: '删除',
                        access_level: 8
                    })
                }
                if ( ( 16 & needed_access_level ) === 16 ) {//打印
                    if ( ( 16 & access_level ) === 16 ) {
                        level += 16;
                        this.ac_selected.push(16)
                    }
                    this.access_levels.push({
                        text: '打印',
                        access_level: 16
                    })
                }
            },
            changeAC() { // 变更右侧复选框时保存变动
                if ( !this.clickedSK[0] ) return alert('请选择要设置权限的对象')
                // 每次变动都实时计算并保存到sk_selected
                let index = this.sk_selected.indexOf(this.clickedSK[0])
                if ( this.ac_selected.length )
                    this.sk_selected[index].access_level = this.ac_selected.reduce((accumulator, currentValue) => ( accumulator + currentValue ))
                else
                    this.sk_selected[index].access_level = 0
            },
            onRevert() {
                this.getRoleSK(this.role_id)
                this.ac_selected = []
                this.access_levels = []
            },
            postData() {
                // 处理 params
                let arr = []
                this.sk_selected.forEach(val => {
                    arr.push({
                        security_key_id: val.id,
                        access_level: val.access_level
                    })
                })
                return JSON.stringify(arr)
            },
            onSave() {
                if ( !this.role_id ) return alert('请选择一个角色')
                this.axios({  // 更新角色权限
                    url: `/api/roles/${ this.role_id }?action=security_keys`,
                    method: 'POST',
                    data: {
                        security_keys: this.postData()
                    }
                }).then(res => {
                    if ( res.state ) {
                        this.Snackerbar({ bool: true, type: 'success', text: '权限更新成功' })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            }
        }
    }
</script>

<style scoped>

</style>
