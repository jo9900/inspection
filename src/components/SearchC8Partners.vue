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
        name: "SearchC8Partners",
        mixins: [mixin],
        data() {
            return {
                selected: [],
                headers: [{
                    text: 'C8商业伙伴',
                    value: 'name',
                    sortable: false
                }],
                items: [],
                partner_name: '',
                totalLength: 0,
                loading: true,
                options: {},
                query: ''
            }
        },
        watch: {
            search: {
                handler(cur) {
                    this.partner_name = cur
                    this.getAllC8Partners()
                },
                immediate: true
            },
            options: {
                handler(cur, old) {
                    if ( old.page ) {
                        this.getAllC8Partners()
                    }
                },
                deep: true
            }
        },
        props: ['search'],
        methods: {
            filter(){
                this.getAllC8Partners()
            },
            getAllC8Partners() {
                let params = {
                    name__icontains__or__help_code__icontains: this.query,
                    sort: JSON.stringify([{ "property": "id", "direction": "DESC" }]),
                    in_use: true,
                    context: 'form_create',
                    ...this.reqParams()
                }
                this.axios({
                    url: `/api/partners`,
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
                this.$emit('update:showC8Partners', false)
            }
        }

    }
</script>

<style scoped>

</style>
