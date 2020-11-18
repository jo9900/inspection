<template>
  <v-alert
      v-bind="$props"
      :value="isShow"
      v-on="$listeners"
      class="v-alert"
      border="left"
      prominent text dismissible
  >
    <slot />
  </v-alert>
</template>

<script>
    export default {
        name: "Valert",
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
