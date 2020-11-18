<template>
  <v-card tile>
    <v-card-title>映射SKU
      <v-spacer />
      <v-btn
          color="primary"
          text
          @click="cancel"
      >
        取消
      </v-btn>
      <v-btn
          color="primary"
          text
          @click="close"
      >
        确定
      </v-btn>
    </v-card-title>
    <v-divider />
    <v-card-text>
      <v-row>
        <v-col cols="5">
          <v-treeview
              :items="cates"
              dense
              return-object
              activatable
              :active="cate_active"
              @update:active="changeActiveCate"
              color="indigo"
              selected-color="indigo"
              open-on-click
          />
        </v-col>
        <v-divider vertical />
        <v-col cols="6" v-if="cate_active.length != 0">
          <div v-if="items.length >= 1">
            <v-checkbox
                v-for="item in items"
                :key="item.id"
                v-model="item_selected"
                :label="item.text"
                :value="item.value"
                color="indigo"
                :multiple="false"
                hide-details
                @change="itemInput"
            />
          </div>
          <span v-else class="font-weight-black indigo--text">未添加操作选项</span>
        </v-col>
        <span v-else class="ma-3 font-weight-black grey--text">未选择质检项</span>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script>
    export default {
        name: "SelectSKU",
        data() {
            return {
                cates: [], // 质检项
                items: [], // 操作选项
                cate_active: [], // 激活的操作选项
                item_selected: null, // 勾选的操作选项
                sku: new Map()
            }
        },
        watch: {
            showSKU: {
                handler(cur) {
                    if ( cur == true ) {
                        this.getSKUCates()
                    }
                },
                immediate: true
            }
        },
        props: ['showSKU', 'editSku'],
        methods: {
            getSKUCates() {
                this.axios({
                    url: `/api/cates`,
                    params: {
                        include_item: true,
                        is_product_sku: true,
                        in_use: true
                    }
                }).then(res => {
                    if ( res.state ) {
                        this.cates = res.root
                        if ( !this.editSku || !this.editSku.length ) {
                            for ( let cate of this.cates ) {
                                let key = cate.name
                                cate.items.some(item => {
                                    if ( item.is_default ) {
                                        let obj = {}
                                        obj[key] = item.value
                                        this.sku.set(cate.id, obj)
                                        return true
                                    }
                                })
                            }
                        }
                        else {
                            let _sku = JSON.parse(this.editSku)
                            for ( let cate of this.cates ) {
                                _sku.forEach(obj => {
                                    if ( obj[cate.name] != null ) {
                                        this.sku.set(cate.id, obj)
                                    }
                                })
                            }
                        }
                    }
                })
            },
            changeActiveCate(cur) { // 更改激活的cate
                if ( !cur.length ) return
                this.cate_active = cur
                this.items = cur[0].items
                let obj = this.sku.get(this.cate_active[0].id)
                if ( obj != null )
                    this.item_selected = obj[this.cate_active[0].name]
                else
                    this.item_selected = []
            },
            itemInput(cur) {
                if ( cur == null ) {
                    this.sku.delete(this.cate_active[0].id)
                    return
                }
                this.item_selected = cur
                let key = this.cate_active[0].name
                let obj = {}
                obj[key] = this.item_selected
                this.sku.set(this.cate_active[0].id, obj)
            },
            filterSKU() {
                return JSON.stringify([...this.sku.values()])
            },
            close() {
                let requestParamsSKU = this.filterSKU()
                Object.assign(this.$data, this.$options.data())
                this.$emit('close', requestParamsSKU)
            },
            cancel() {
                Object.assign(this.$data, this.$options.data())
                this.$emit('close', null)
            }
        }
    }
</script>
