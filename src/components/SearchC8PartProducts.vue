<template>
  <v-data-table
      height="50vh"
      v-on="$listeners"
      v-model="selected"
      fixed-header
      :headers="headers"
      :items="items"
      :items-per-page="itemsPerPage"
      :footer-props="footer_props"
      :options.sync="options"
      :server-items-length="totalLength"
      :loading="loading"
      show-select
      hide-default-header
      :single-select="false"
      item-key="id"
      class="elevation-1"
      @page-count="pagination_length = $event"
  >
    <template v-slot:top>
          <v-btn
              class="float-right mt-3"
              text
              color="primary"
              @click="$listeners.selected(selected)"
          >
            <v-icon>check_circle_outline</v-icon>
            确定
          </v-btn>
          <v-text-field
              class="ml-3"
              label="名称"
              append-icon="search"
              @keyup.enter="filter"
              @click:append="filter"
              v-model.trim="query"
          />
    </template>
  </v-data-table>
</template>
<script>
    import mixin from "../mixins/mixin"

    export default {
        name: "SearchC8PartProducts",
        mixins: [mixin],
        data() {
            return {
                selected: [],
                headers: [{
                    text: '选择散件商品',
                    value: 'name',
                    sortable: false
                }],
                items: [],
                totalLength: 0,
                loading: true,
                options: {},
                query: ''
            }
        },
        watch: {
            showC8PartProducts: {
                handler(cur) {
                    if (cur) {
                        this.getAllC8Pros()
                        this.resetItem()
                    }
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
        props: ['showC8PartProducts'],
        methods: {
            filter(){
              this.getAllC8Pros()
            },
            getAllC8Pros() {
                let params = {
                    name__icontains__or__help_code__icontains: this.query,
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
            resetItem() {
                this.selected = []
                this.query = ''
            }
        }

    }
</script>

<style scoped>

</style>
