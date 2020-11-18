<template>
  <v-snackbar
      class="mb-10"
      v-model="isShow"
      bottom
      vertical
      :color="type"
      v-bind="$props"
      :timeout="0"
      v-on="$listeners"
  >
    <slot />
    <v-btn dark text @click="close">关闭</v-btn>
  </v-snackbar>
</template>

<script>
    export default {
        name: "Vsnackbar",
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
        methods: {
            close() {
                this.$emit('update:show', false)
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
