<template>
  <v-dialog
      v-model="isShow"
      v-bind="$props"
      :value="isShow"
      v-on="$listeners"
  >

    <v-card>
      <v-card-title
          class="headline grey lighten-2"
          primary-title
      >
        Privacy Policy
      </v-card-title>

      <v-card-text>

      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
            color="primary"
            text
            @click="isShow = false"
        >
          关闭
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
    export default {
        name: "Vdialog",
        inheritAttrs: false,
        data() {
            return {
                isShow: this.show
            }
        },
        watch: {
            show: {
                handler(cur) {
                    this.isShow = cur
                }
            }
        },
        props: {
            show: {
                type: Boolean,
                default: false
            },
            type: {
                type: String,
                default: 'info'
            }
        }
    }
</script>

<style scoped>

</style>
