<template>
  <v-data-table
      height="50vh"
      v-on="$listeners"
      fixed-header
      :headers="headers"
      :items="items"
      :items-per-page="itemsPerPage"
      :footer-props="footer_props"
      :options.sync="options"
      :server-items-length="totalLength"
      :loading="loading"
      @click:row="select"
      item-key="id"
      hide-default-header
      class="elevation-1"
      @page-count="pagination_length = $event"
  >

  </v-data-table>
</template>
<script>
    import mixin from "../mixins/mixin"

    export default {
        name: "SearchC8Products",
        mixins: [mixin],
        data() {
            return {
                headers: [{
                    text: 'C8商品',
                    value: 'name',
                    sortable: false
                }],
                items: [],
                product_name: '',
                totalLength: 0,
                loading: true,
                options: {}
            }
        },
        watch: {
            search: {
                handler(cur) {
                    this.product_name = cur
                    this.getAllC8Pros()
                },
                immediate: true
            },
            options: {
                handler(cur, old) {
                    if ( old.page ) {
                        this.getAllC8Pros()
                    }
                },
                deep: true
            }
        },
        props: ['search'],
        methods: {
            getAllC8Pros() {
                let params = {
                    name__icontains__or__help_code__icontains: this.product_name,
                    context: 'form_create',
                    action: 'search',
                    in_use: true,
                    ...this.reqParams()
                }
                this.axios({
                    url: `/api/c8_products`,
                    params
                }).then(res => {
                    this.loading = false
                    if ( res.state ) {
                        this.items = res.root
                        this.totalLength = res.total
                        return
                    }
                    this.$listeners.Snackerbar({ bool: true, type: '', text: res.errmsg })

                })
            },
            select(cur) {
                this.$emit('selected', cur)
                this.$emit('update:showC8Products', false)
            }
        }

    }
</script>

<style scoped>

</style>
