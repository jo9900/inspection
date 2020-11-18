<template>
  <!--  顶部条-->
  <!--  侧边导航-->
  <!--  底部条-->
  <v-app class="grey lighten-4">
    <v-navigation-drawer app v-model="drawer">
      <v-list dense>

        <v-list-item two-line class="px-0">

          <v-list-item-content>
            <v-list-item-title class="text-center title" @click="updateUserInfo" style="cursor: pointer">{{ user_name }}</v-list-item-title>
            <v-list-item-subtitle class="text-center subtitle-1">{{ set_of_book }}</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-list-group prepend-icon="assignment" color="cyan darken-2">
          <template v-slot:activator>
            <v-list-item-title>基础资料</v-list-item-title>
          </template>
          <v-list-item
              v-for="info in infos"
              :key="info[1]"
              link
              router :to="info[1]"
          >
            <v-list-item-title v-text="info[0]" class="text-left pl-4" />
          </v-list-item>
        </v-list-group>
        <v-list-item link v-for="link in links" :key="link.text" router :to="link.route">
          <v-list-item-action>
            <v-icon>{{ link.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>{{ link.text }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-group prepend-icon="library_books" color="cyan darken-2">
          <template v-slot:activator>
            <v-list-item-title>报表</v-list-item-title>
          </template>
          <v-list-item
              v-for="report in reports"
              :key="report[1]"
              link
              router :to="report[1]"
          >
            <v-list-item-title v-text="report[0]" class="text-left pl-4" />
          </v-list-item>
        </v-list-group>
      </v-list>
    </v-navigation-drawer>
    <v-app-bar app dark color="teal" class="main-header">
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      <v-toolbar-title>聿诺质检平台</v-toolbar-title>
      <v-spacer />
      <v-btn text @click="logout()">
        <span>退出</span>
        <v-icon right>exit_to_app</v-icon>
      </v-btn>
    </v-app-bar>
    <v-content>
      <router-view class="a-0" />
    </v-content>
    <v-footer app color="teal" class="main-footer">
      <span class="white--text">&copy; 2019</span>
    </v-footer>
    <v-dialog v-model="dialog" max-width="290">
      <v-card>
        <v-card-title class="title">修改密码</v-card-title>
        <v-card-text>
          <v-text-field
              v-model="password"
              :append-icon="showPWD ? 'mdi-eye' : 'mdi-eye-off'"
              :rules="[rules.required, rules.min]"
              :type="showPWD ? 'text' : 'password'"
              label="密码"
              hint="至少6位"
              counter
              @click:append="showPWD = !showPWD"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
              color="blue"
              text
              @click="savePWD"
          >
            保存
          </v-btn>
          <v-btn
              color="blue"
              text
              @click="dialog = false"
          >
            放弃
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script>
    export default {
        name: "Dashboard",
        data: () => ( {
            drawer: true,
            user_name: '',
            set_of_book: '',
            password: '',
            dialog: false,
            showPWD: false,
            rules: {
                required: value => !!value || '必填',
                min: v => v.length >= 6 || '至少6位'
            },
            infos: [
                ['商品类型', '/dashboard/info/product_types', '/data/product_type'],
                ['商品品牌', '/dashboard/info/brands', '/data/brand'],
                ['商品型号', '/dashboard/info/products', '/data/product'],
                ['质检项', '/dashboard/info/cates', '/data/cate'],
                ['操作选项', '/dashboard/info/items', '/data/item'],
                ['商品映射', '/dashboard/info/product_mappings', '/data/product_mapping'],
                ['物流公司', '/dashboard/info/logistics_companies', '/data/logistics_company'],
                ['用户管理', '/dashboard/info/users', '/data/user'],
                ['角色管理', '/dashboard/info/roles', '/data/role'],
                ['权限管理', '/dashboard/info/security_keys', '/data/security_key'],
                ['账套信息', '/dashboard/info/set_of_books', '/data/set_of_book']
            ],
            links: [
                { text: '拆包', icon: 'work', route: '/dashboard/sorting', lcode: '/order/sorting_order' },
                { text: '初检', icon: 'pageview', route: '/dashboard/inspection', lcode: '/order/inspection_order' },
                { text: '复检', icon: 'sync_problem', route: '/dashboard/recheck', lcode: '/order/recheck_order' },
                { text: '查询', icon: 'print', route: '/dashboard/workspace', lcode: '/data/workspace' },
                { text: '查看报告', icon: 'assignment', route: '/dashboard/view' }
            ],
            reports: [
              ['数量统计表','/dashboard/reports/quantity_counting', '/report/quantity_counting'],
              ['进货状态统计报表','/dashboard/reports/purchase_state', '/report/purchase_state'],
            ]
        } ),
        created() {
            this.hasSK()
            this.checkInfo()
            this.checkReports()
        },
        mounted() {
            this.set_of_book = sessionStorage.getItem('set_of_book')
            this.user_name = sessionStorage.getItem('user')
        },
        methods: {
            checkInfo() {
                this.check('infos')
            },
            checkReports(){
                this.check('reports')
            },
            check(key){
                let arr = []
                let SK = this.$store.getters.SK
                this[key].forEach(item => {
                    let lcode = item[2]
                    let bool = SK.some(item => { // 至少有查看权限才能在二级菜单上显示
                        return item.lcode === lcode && item.access_level && item.needed_access_level - item.access_level != 1
                    })
                    if ( bool )
                        arr.push(item)
                })
                this[key] = arr
            },
            hasSK() {
                let SK = this.$store.getters.SK
                let newLinks = this.links.filter(link => {
                      if ( !link.lcode ) return link
                      return SK.some(item => item.lcode === link.lcode && item.checked)
                  }
                )
                this.links = newLinks
            },
            updateUserInfo() {
                this.dialog = true
            },
            savePWD(){
                let id = sessionStorage.getItem('user_id')
                if (!id) return '未能获取到用户id，请重新登录后再尝试。'
                this.axios({
                    url: `/api/users/${id}`,
                    data: {
                        password: this.password
                    },
                    method: 'PUT'
                }).then(res=> {
                    this.dialog = false
                    if (res.state) {
                      return alert('密码已更新')
                    }
                    return alert(res.errmsg)
                })
            },
            logout() {
                this.$store.dispatch("logout").then(() => {
                    this.$router.push("/")
                })
            }
        }
    }
</script>

<style scoped>

</style>
