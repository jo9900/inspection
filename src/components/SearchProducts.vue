<template>
  <v-data-table
      height="50vh"
      v-on="$listeners"
      v-bind="$props"
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
        name: "SearchProducts",
        mixins: [mixin],
        data() {
            return {
                headers: [{
                    text: '商品型号',
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
                    this.getAllPros()
                },
                immediate: true
            },
            options: {
                handler(cur, old) {
                    if ( old.page ) {
                        this.getAllPros()
                    }
                },
                deep: true
            }
        },
        props: ['search', 'brand_id'],
        methods: {
            getAllPros() {
                let params = {
                    name: this.product_name,
                    brand_id: this.brand_id,
                    ...this.reqParams()
                }
                this.axios({
                    url: `/api/products`,
                    params
                }).then(res => {
                    this.loading = false
                    if ( res.state === 1 ) {
                        this.items = res.root
                        this.totalLength = res.total
                        return
                    }
                    this.$listeners.Snackerbar({ bool: true, type: '', text: res.errmsg })

                })
            },
            select(cur) {
                this.$emit('selected', cur)
                this.$emit('update:showProducts', false)
            }
        }

    }
</script>

<style scoped>

</style>
