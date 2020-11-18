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
        name: "SearchEmployees",
        mixins: [mixin],
        data() {
            return {
                headers: [{
                    text: 'C8员工',
                    value: 'name',
                    sortable: false
                }],
                items: [],
                employee_name: '',
                totalLength: 0,
                loading: true,
                options: {}
            }
        },
        watch: {
            search: {
                handler(cur) {
                    this.employee_name = cur
                    this.getAllEmployees()
                },
                immediate: true
            },
            options: {
                handler(cur, old) {
                    if ( old.page ) {
                        this.getAllEmployees()
                    }
                },
                deep: true
            }
        },
        props: ['search'],
        methods: {
            getAllEmployees() {
                this.axios({
                    url: `/api/employees`,
                    params: {
                        name: this.employee_name,
                        sort: JSON.stringify([{ "property": "id", "direction": "DESC" }]),
                        context: 'form_create',
                        in_use: true,
                        ...this.reqParams()
                    }
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
                this.$emit('update:showEmployees', false)
            }
        }

    }
</script>

<style scoped>

</style>
