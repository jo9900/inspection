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
        name: "SearchC8Departments",
        mixins: [mixin],
        data(){
            return {
                headers:[{
                    text: 'C8部门',
                    value: 'name',
                    sortable: false
                }],
                items: [],
                dep_name: '',
                totalLength: 0,
                loading: true,
                options: {},
            }
        },
        watch:{
            search: {
                handler(cur) {
                    this.dep_name = cur
                    this.getAllC8Departments()
                },
                immediate: true
            },
            options: {
                handler (cur ,old) {
                    if (old.page) {
                        this.getAllC8Departments()
                    }
                },
                deep: true
            }
        },
        props: ['search'],
        methods: {
            getAllC8Departments(){
                let params = {
                    name__icontains__or__help_code__icontains: this.dep_name,
                    sort: JSON.stringify([{"property":"id","direction":"DESC"}]),
                    in_use: true,
                    context: 'form_create',
                    ...this.reqParams()
                }
                this.axios({
                    url: `/api/departments`,
                    params
                }).then(res=> {
                    this.loading = false
                    if (res.state) {
                        this.items = res.root
                        this.totalLength =  res.total
                        return
                    }
                    this.$listeners.Snackerbar({ bool: true, type: '', text: res.errmsg })

                })
            },
            select(cur){
                this.$emit('selected',cur)
                this.$emit('update:showC8Departments',false)
            }
        }

    }
</script>

<style scoped>

</style>
