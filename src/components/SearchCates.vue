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
        name: "SearchCates",
        mixins: [mixin],
        data(){
            return {
                headers:[{
                    text: '质检项',
                    value: 'name',
                    sortable: false
                }],
                items: [],
                cate_name: '',
                totalLength: 0,
                loading: true,
                options: {},
            }
        },
        watch:{
            search: {
                handler(cur) {
                    this.cate_name = cur
                    this.getAllCates()
                },
                immediate: true
            },
            options: {
                handler (cur ,old) {
                    if (old.page) {
                        this.getAllCates()
                    }
                },
                deep: true
            }
        },
        props: ['search'],
        methods: {
            getAllCates(){
                this.axios({
                    url: `/api/cates`,
                    params: {
                        name: this.cate_name,
                        ...this.reqParams()
                    }
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
            select(cur){
                this.$emit('selected',cur)
                this.$emit('update:showCates',false)
            }
        }

    }
</script>

<style scoped>

</style>
