<template>
  <v-data-table
      height="50vh"
      v-on="$listeners"
      fixed-header
      v-model="selected"
      :headers="headers"
      :items="items"
      :items-per-page="itemsPerPage"
      :footer-props="footer_props"
      :options.sync="options"
      :server-items-length="totalLength"
      :loading="loading"
      item-key="id"
      :single-select="false"
      show-select
      hide-default-header
      class="elevation-1"
      @page-count="pagination_length = $event"
  >
    <template v-slot:top>
      <div class="d-flex flex-row-reverse">
        <v-btn text color="primary" @click="$listeners.selected(selected)">
          <v-icon>check_circle_outline</v-icon>
          确定
        </v-btn>
      </div>
    </template>
  </v-data-table>
</template>
<script>
    import mixin from "../mixins/mixin"

    export default {
        name: "SearchMultiProducts",
        mixins: [mixin],
        data() {
            return {
                selected: [],
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
                    if ( cur == null || cur === '' ) {
                        this.resetItem()
                    }
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
        props: ['search'],
        methods: {
            getAllPros() {
                let params = {
                    name: this.product_name,
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
            resetItem() {
                this.selected = []
            }
        }

    }
</script>

<style scoped>

</style>
