<template>
  <v-content>
    <v-container class="fill-height" fluid>
      <v-row justify="center" class="ma-0">
        <v-col cols="12" sm="8" md="4" lg="3" class="pa-0">
          <v-card class="elevation-12">
            <v-toolbar color="teal" dark flat>
              <v-toolbar-title>聿诺</v-toolbar-title>
            </v-toolbar>
            <v-card-text>
              <v-form>
                <v-text-field
                    color="teal"
                    label="用户"
                    name="login"
                    prepend-icon="person"
                    type="text"
                    v-model="name"
                    :rules="rules"
                />
                <v-text-field
                    color="teal"
                    id="password"
                    label="密码"
                    name="password"
                    prepend-icon="lock"
                    type="password"
                    v-model="password"
                    :rules="rules"
                />
                <v-text-field
                    color="teal"
                    label="账套号"
                    name="set_of_book"
                    prepend-icon="business"
                    type="text"
                    v-model="set_of_book"
                    @keyup.enter="login()"
                    :rules="rules"
                />
              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn dark color="teal" @click="login()">登录</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-content>
</template>

<script>
    export default {
        name: "LoginForm",
        data() {
            return {
                set_of_book: '',
                name: '',
                password: '',
                rules: [
                    value => !!value || '必填'
                ]
            }
        },
        methods: {
            login() {
                let name = this.name
                let password = this.password
                let set_of_book = this.set_of_book
                this.$store.dispatch('login', JSON.stringify({ name, password, set_of_book }))
                  .then(() => {
                      this.$router.replace('/dashboard')
                  })
                  .catch(err => {
                        alert(err)
                    }
                  )
            }
        },
        props: {
            source: String
        }
    }
</script>

<style scoped>

</style>
