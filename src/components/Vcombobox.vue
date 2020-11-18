<template>
  <v-combobox
      v-bind="$props"
      v-on="$listeners"
      v-model="item"
      :items="items"
      :search-input.sync="search"
      :placeholder="placeholder"
      :label="label"
      persistent-hint
      :hide-selected="true"
      :cache-items="true"
      :item-text="itemText"
      :item-value="itemValue"
      :background-color="color"
  >
    <template v-slot:prepend v-if="required">
      <span slot="prepend" class="red--text">*</span>
    </template>
    <template v-slot:no-data>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>
            没有查找到 "<strong>{{ search }}</strong>"
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </template>
  </v-combobox>
</template>

<script>
    export default {
        name: "Vcombobox",
        data() {
            return {
                placeholder: this.pPlaceholder,
                label: this.pLabel,
                search: this.pSearch,
                item: undefined,
                items: this.pItems,
                itemText: this.pItemText || 'name',
                itemValue: this.pItemValue || 'id',
                required: this.pRequired,
                color: undefined
            }
        },
        methods: {
            resetItem() {
                this.item = undefined
            }
        },
        watch: {
            item(cur) {
                this.$listeners.select_change(cur)
            },
            pSearch(cur) {
                this.search = cur
                if ( !cur ) {
                    this.$listeners.select_change(cur)
                }
            },
            pRequired(cur) {
                this.required = cur
            },
            pItemText(cur) {
                this.itemText = cur
            },
            pItemValue(cur) {
                this.itemValue = cur
            },
            pItems: {
                handler(cur) {
                    this.items = cur
                },
                immediate: true
            },
            setValue: {
                handler(cur) {
                    if ( cur )
                      // 设置默认值
                        this.item = cur
                    else
                        this.item = undefined
                },
                immediate: true
            },
            newbgcolor: {
                handler(cur) {
                    this.color = cur
                }
            }
        },
        props: {
            show: {
                type: Boolean,
                default: false
            },
            pItems: [Array, String],
            pSearch: {
                type: String
            },
            pPlaceholder: {
                type: String
            },
            pLabel: {
                type: String
            },
            pItemValue: {
                type: String
            },
            pItemText: {
                type: String
            },
            setValue: {
                type: Object
            },
            pRequired: {
                type: Boolean,
                default: true
            },
            newbgcolor: {
                type: String,
                default: undefined
            }
        }
    }
</script>

<style scoped>

</style>
