<template>
  <v-card v-on:="$listeners" v-bind="$props" class="pa-2" id="psDom">
    <div class="main">
      <div>质检单号：{{ data.code || data.form_code }}</div>
<!--      区分是是否是日志 字段不一样 有form_created_at说明是日志-->
      <div v-if="data.form_created_at">
        开单：{{ data.form_created_user }} {{ data.form_created_at }}
      </div>
      <div v-else>开单：{{ data.created_user }} {{ data.created_at }}</div>
      <div v-if="data.form_created_at">
        更改：{{ data.created_user }} {{ data.created_at}}
      </div>
      <div v-else>更改：{{ data.updated_user }} {{ data.updated_at }}</div>
      <div>组装拆卸单号：{{ data.assemble_code }}</div>
      <div>进货单号：{{ data.purchase_order_code }}</div>
      <div><span :class="difColor(data.brand_id,'brand_id')">商品品牌：</span>{{ data.brand_name }}</div>
      <div><span :class="difColor(data.product_type_id,'product_type_id')">商品类型：</span>{{ data.product_type_name }}
      </div>
      <div><span :class="difColor(data.product_id,'product_id')">商品名称：</span>{{ data.product_name }}</div>
    </div>
    <div class="cates" v-for="(line, lineIndex) in data.lines" :key="lineIndex">
      <div class="my-2">
        <div class="font-weight-black">{{ line.name }}</div>
        <ul class="children ml-4">
          <li v-for="(child, childIndex) in line.children" :key="childIndex">
            <span :class="difLineColor(line, child)">{{ child.name }}：</span>
            <span
                class="font-weight-medium"
                v-for="(item, itemIndex) in child.items"
                v-show="item.checked"
                :key="itemIndex"
            >
              {{ item.text }} <span v-if="item.memo">（{{ item.memo }}）</span>
            </span>
            <span v-show="child.text && child.items && child.items.length">（{{ child.text }}）</span>
            <span v-show="child.text && (!child.items || child.items.length == 0)">{{ child.text }}</span>
            <span v-if="child.name == 'SN' && child.memo" class="red--text pl-2">{{ child.memo }}</span>
            <v-row v-if="child.has_picture && child.picture_urls">
              <v-col cols="12" md="8" class="pa-0">
                <v-list max-width="200">
                  <v-list-item v-for="(url, urlIdx)  in child.picture_urls" :key="urlIdx">
                    <img :src="url"
                         alt="照片"
                         :class="url == clickedUrl? 'img-expand': 'img-small'"
                         @click="changeImgSize(url)"
                    >
                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>
            <!--            第三层质检项-->
            <div class="ml-4" v-if="child.children && child.children.length">
              <ul class="children ml-4">
                <li v-for="(_child, _childIndex) in child.children" :key="_childIndex">
                  <span :class="difLineColor(line, child, _child)">{{ _child.name }}：</span>
                  <span
                      class="font-weight-medium"
                      v-for="(item, itemIndex) in _child.items"
                      v-show="item.checked"
                      :key="itemIndex"
                  >
                    {{ item.text }} <span v-if="item.memo">（{{ item.memo }}）</span>

                  </span>
                  <span v-show="_child.text && _child.items && _child.items.length">（{{ _child.text }}）</span>
                  <span v-show="_child.text && (!_child.items || _child.items.length == 0)">{{ _child.text }}</span>
                  <v-row v-if="_child.has_picture && _child.picture_urls">
                    <v-col cols="12" md="8" class="pa-0">
                      <v-list max-width="200">
                        <v-list-item v-for="(_url, _urlIdx) in _child.picture_urls" :key="_urlIdx">
                          <img :src="_url"
                               alt="照片"
                               :class="_url == clickedUrl? 'img-expand': 'img-small'"
                               @click="changeImgSize(_url)"
                          >
                        </v-list-item>
                      </v-list>
                    </v-col>
                  </v-row>
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </v-card>
</template>

<script>
    import html2canvas from "html2canvas"

    export default {
        name: "SimplifiedOrder",
        data() {
            return {
                clickedUrl: 0
            }
        },
        watch: {
            data() {
                this.clickedUrl = 0
            }
        },
        methods: {
            printScreen() {
                let code = this.data.code || this.data.form_code
                html2canvas(document.getElementById('psDom'), {
                    scale: 2
                }).then(function (canvas) {
                    canvas.toDataURL("image/png")
                    let eleLink = document.createElement("a");
                    eleLink.href = canvas.toDataURL("image/png")
                    eleLink.download = code
                    document.body.appendChild(eleLink);
                    eleLink.click();
                    document.body.removeChild(eleLink)
                });
            },
            changeImgSize(url) {
                if ( url == this.clickedUrl ) {
                    this.clickedUrl = 0
                    return
                }
                this.clickedUrl = url
            },
            difColor(id, key) {
                if ( !this.IO ) return
                if ( this.IO[key] != id ) return 'red--text' // 品牌 类型 型号
                return undefined
            },
            difLineColor(line, child, _child = null) {
                if ( !this.IO ) return
                let { lines } = this.IO
                let flag = undefined
                for ( let i = 0, len = lines.length; i < len; i++ ) {
                    let IOline = lines[i]
                    if ( IOline.id === line.id ) { // 相同的第一层质检项
                        for ( let j = 0, len2 = IOline.children.length; j < len2; j++ ) {
                            let IOchild = lines[i].children[j]
                            if ( IOchild.id === child.id ) { // 相同的第二层质检项
                                if ( !_child ) { // 第二层
                                    if ( child.need_text && child.text !== IOchild.text ) {
                                        flag = 'red--text'
                                        return flag
                                    }
                                    if ( !child.items || !IOchild.items ) return
                                    for ( let x = 0, len3 = child.items.length; x < len3; x++ ) {
                                        let item = child.items[x]
                                        IOchild.items.forEach(obj => {
                                            if ( obj.id === item.id && obj.checked != item.checked ) {
                                                flag = 'red--text'
                                                return flag
                                            }
                                        })
                                    }
                                }
                                else { // 有第三层
                                    if ( IOchild.children && IOchild.children.length ) { // 两者都有第三层
                                        for ( let x = 0, len3 = IOchild.children.length; x < len3; x++ ) {
                                            let IO_child = IOchild.children[x]
                                            if ( _child.id === IO_child.id ) { // 同一个第三层质检项
                                                if ( _child.need_text && _child.text !== IO_child.text ) {
                                                    flag = 'red--text'
                                                    return flag
                                                }
                                                if ( !_child.items || !IO_child.items ) return
                                                for ( let y = 0, len4 = _child.items.length; y < len4; y++ ) {
                                                    let item = _child.items[y]
                                                    IO_child.items.forEach(obj => {
                                                        if ( obj.id === item.id && obj.checked != item.checked ) {
                                                            flag = 'red--text'
                                                            return flag
                                                        }
                                                    })
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                return flag
            }
        },
        props: ['data', 'IO']
    }
</script>

<style scoped lang="less">
  .children {
    padding: 0;
    list-style: none;
  }
</style>
