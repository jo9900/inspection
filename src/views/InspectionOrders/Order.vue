<template>
  <v-card flat v-bind="$props" v-on="$listeners" class="pa-2">
    <v-dialog v-model="showPrint" class="pa-4 print">
      <iframe
          style="width: 100%;height:50vh"
          title="PDF文件"
          id="Iframe"
          :src="pdfUrl"
      />
      <v-btn color="primary" @click="printOrder">
        打印
      </v-btn>
    </v-dialog>
    <v-dialog v-model="showPOBill" class="pa-4 print">
      <PurchaseOrder :pData="pData" :showPOBill.sync="showPOBill" @Snackerbar="Snackerbar" />
    </v-dialog>
    <v-dialog v-model="showAssembleBill" class="pa-4 print">
      <Assemble :pData="pData" :showAssembleBill.sync="showAssembleBill" @Snackerbar="Snackerbar" />
    </v-dialog>
    <v-dialog v-model="showLogsDialog" max-width="800px">
      <v-card class="pa-1">
        <v-row>
          <v-col cols="3" class="px-0">
            <v-list-item
                dense
                v-for="(log, index) in logs"
                v-ripple
                :key="index"
                @click.self="showLog(log)"
            >
              记录{{ logs.length - index }}
            </v-list-item>
          </v-col>
          <v-col cols="9" v-show="showViewDialog" class="px-4">
            <SimplifiedOrder :data="viewingLog" />
          </v-col>
        </v-row>
      </v-card>
    </v-dialog>
    <Vsnackerbar :show.sync="snackbar" :type="snackbar_type">{{ snackbar_text }}</Vsnackerbar>
    <v-row class="Btns d-flex">
      <v-col class="ma-0">
        <div v-if="data && data.status == 6">
          <v-btn
              color="amber"
              class="mr-1 white--text mb-1"
              v-if="$store.getters.isAdmin && sources == 'inspection_orders' && !showSimplified"
              @click="saveOrder"
          >
            保存
          </v-btn>
          <v-btn
              color="primary"
              class="mr-1 px-1 mb-1"
              v-if="showPOBtn && $store.getters.allowCreatePurchaseOrder"
              @click="createPurchaseOrder"
          >
            生成进货单
          </v-btn>
          <v-btn
              color="primary"
              class="mr-1 px-1 mb-1"
              v-if="showPOBtn && $store.getters.allowCreateAssemble"
              @click="createAssembleOrder"
          >
            生成组装拆卸单
          </v-btn>
          <v-btn
              color="primary"
              class="mr-1 px-1 mb-1"
              v-if="showCompareBtn"
              @click="compareIO"
          >
            对比初检单
          </v-btn>
          <v-btn
              color="info"
              class="mr-1 white--text mb-1"
              @click="onPrint"
              v-if="isAllowPrintIO()"
          >
            打印
          </v-btn>
          <v-btn
              color="blue"
              class="mr-1 px-1 mb-1 white--text"
              @click="orderLogs"
              v-if="showEdit"
          >
            日志
          </v-btn>
          <v-btn
              color="info"
              class="px-1 mb-1"
              v-if="showEdit && !mobile"
              @click="printScreen"
          >
            截图
          </v-btn>
        </div>
        <div v-else>
          <v-btn
              color="amber"
              class="mr-1 white--text mb-1"
              @click="saveOrder"
              v-if="allowEdit"
          >
            保存
          </v-btn>
          <v-btn
              color="info"
              class="mr-1 white--text mb-1"
              @click="onPrint"
              v-if="isAllowPrintIO()"
          >
            打印
          </v-btn>
          <v-btn
              color="info"
              class="mr-1 white--text mb-1"
              @click="executeOrder"
              v-if="allowEdit && showEdit"
          >
            执行
          </v-btn>
          <v-btn
              color="error"
              class="mr-1 mb-1"
              @click="deleteOrder"
              v-if="allowDelete && showEdit"
          >
            删除
          </v-btn>

          <v-btn
              color="info"
              class="mb-1"
              @click="orderLogs"
              v-if="showEdit"
          >
            日志
          </v-btn>
        </div>
      </v-col>
      <v-col cols="2" sm="1" md="1" xl="1" v-show="showEdit" class="pa-0">
        <v-btn icon @click="closeOrderDialog">
          <v-icon>clear</v-icon>
        </v-btn>
      </v-col>
    </v-row>
    <v-card v-if="!showSimplified" flat>
      <v-row dense class="px-2">
        <v-col cols="12" md="4">
          <Vcombobox
              ref="product_type"
              @select_change="product_type_change_dialog"
              :p-items="product_types"
              :p-search="product_type_search"
              :setValue="product_type_value"
              p-placeholder="筛选类型"
              p-label="商品类型"
          />
        </v-col>
        <v-col cols="12" md="4">
          <Vcombobox
              ref="brand"
              @select_change="brand_change_dialog"
              :p-items="brands"
              :setValue="brand_value"
              p-placeholder="筛选品牌"
              p-label="商品品牌"
          />
        </v-col>
        <v-col col="12" md="4">
          <v-text-field
              label="商品型号"
              v-model.trim="putParams.product_name"
              append-icon="search"
              @click:append="searchPro"
              @click:clear="clearProSearch"
              clearable
          >
            <span slot="prepend" class="red--text">*</span>
          </v-text-field>
          <v-dialog v-model="showProducts" max-width="500px">
            <SearchProducts
                @Snackerbar="Snackerbar"
                :search="product_name"
                :brand_id="putParams.brand_id"
                :showProducts.sync="showProducts"
                @selected="fillPro"
            />
          </v-dialog>
        </v-col>
      </v-row>
      <v-row>
        <v-col class="pa-0">
          <v-card flat style="overflow: hidden">
            <v-tabs vertical>
              <v-tab v-for="parentCate in orderLines" :key="parentCate.id">
                {{ parentCate.name }}
              </v-tab>
              <v-tab-item
                  v-for="(childrenCate, index) in childrenList"
                  :key="childrenCate.name"
              >
                <v-row v-for="(row, rowIndex) in childrenCate" :key="row.id" style="width: 90%">
                  <v-col
                      cols="12"
                      md="2"
                      lg="2"
                      xl="1"
                      sm="12"
                      class="blue-grey--text text-md-right"
                  >
                    <!--                    子质检项 -->
                    {{ row.name }}
                    <div class="font-weight-light" v-show="row.is_multi">（多选）</div>
                  </v-col>
                  <!--                  子质检项下的操作选项-->
                  <v-col v-if="!row.children.length" cols="11" md="8" class="ml-3">
                    <v-row class="py-1">
                      <!--                  按钮组操作选项-->
                      <v-col cols="12" md="auto" v-if="row.items && row.items.length" class="pa-0">
                        <div v-for="(item, itemIndex) in row.items" :key="item.id" class="d-flex mr-1 float-left"
                             style="overflow: hidden">
                          <v-btn :color="color(item, row.items)"
                                 @click="changeItem(index, rowIndex, itemIndex)"
                                 class="mr-2 mb-2 px-2 float-left">
                            {{ item.text }}
                          </v-btn>
                          <v-text-field
                              class="float-left mb-1"
                              v-if="item.need_text && item.checked"
                              style="width: 100px"
                              placeholder="备注"
                              outlined
                              color="info"
                              dense
                              hide-details
                              v-model.trim="item.memo"
                          />
                        </div>
                      </v-col>
                      <!--                  输入框类型的操作选项-->
                      <v-col v-if="row.need_text" cols="9" :md="row.items && row.items.length?'1':'3'"
                             class="pa-0 mr-1 mb-1">
                        <v-text-field
                            outlined
                            dense
                            hide-details
                            v-model.trim="row.text"
                        />
                      </v-col>
                      <span class="red--text pt-4">{{ row.old_text }}</span>
                      <span v-if="row.name == 'SN' && row.memo" class="red--text pt-4">{{ row.memo }}</span>
                      <!--                  需要拍照的操作选项-->
                      <v-col v-if="row.has_picture" cols="3" md="11" class="pa-0">
                        <div class="d-flex">
                          <v-btn
                              v-if="mobile"
                              class="mr-1"
                              depressed
                              small
                              @click="openCamera(1, index, rowIndex)"
                          >
                            <v-icon>camera_alt</v-icon>
                          </v-btn>
                          <v-btn v-if="mobile" depressed small @click="openCamera(0, index, rowIndex)">
                            <v-icon>photo</v-icon>
                          </v-btn>
                          <v-btn v-else depressed class="pa-0">
                            <label :for="'image_uploads'+ index + rowIndex">
                              <v-icon>add_photo_alternate</v-icon>
                            </label>
                          </v-btn>
                          <input style="opacity:0;width: 2px" type="file" :id="'image_uploads'+ index + rowIndex"
                                 @change="uploadImgFile($event, index, rowIndex)" accept="image/*">
                        </div>

                        <v-list v-if="row.picture_urls" max-width="200">
                          <v-list-item v-for="url in row.picture_urls" :key="url">
                            <img
                                :src="url"
                                alt="照片"
                                :class="url == clickedUrl? 'img-expand': 'img-small'"
                                @click="changeImgSize(url)"
                            >
                          </v-list-item>
                        </v-list>
                      </v-col>
                    </v-row>
                  </v-col>

                  <!--                  子质检项下的质检项-->
                  <v-col v-else cols="11" md="8">
                    <v-row class="mt-4" v-for="(rowChild, rowChildIndex) in row.children" :key="rowChild.id"
                           style="width: 100%">
                      <v-col cols="12" md="3" lg="3" xl="1" class="rowChild subtitle-2 text-md-right ml-4 ml-md-0">
                        {{ rowChild.name }}
                        <div class="font-weight-light" v-show="rowChild.is_multi">（多选）</div>
                      </v-col>
                      <v-col cols="12" md="9" lg="9" xl="11" class="py-1">
                        <v-row class="py-1" style="width: 100%">
                          <!--                  按钮组操作选项-->
                          <v-col cols="11" md="auto" v-if="rowChild.items && rowChild.items.length" class="pa-0">
                            <div v-for="(item, itemIndex) in rowChild.items" :key="item.id" class="mr-1 float-left"
                                 style="overflow: hidden">
                              <v-btn :color="color(item, rowChild.items)"
                                     @click="changeItem(index, rowIndex, itemIndex, rowChildIndex)"
                                     class="mr-2 mb-2 px-2 float-left">
                                {{ item.text }}
                              </v-btn>
                              <v-text-field
                                  class="float-left mb-1"
                                  v-if="item.need_text && item.checked"
                                  style="width: 100px"
                                  placeholder="备注"
                                  outlined
                                  color="info"
                                  dense
                                  hide-details
                                  v-model.trim="item.memo"
                              />
                            </div>
                          </v-col>
                          <!--                  输入框类型的操作选项-->
                          <v-col v-if="rowChild.need_text" cols="11"
                                 :md="rowChild.items && rowChild.items.length?'2':'5'" class="pa-0 mr-1 mb-1">
                            <v-text-field
                                outlined
                                dense
                                hide-details
                                v-model.trim="rowChild.text"
                            />
                          </v-col>
                          <span class="red--text pt-4">{{ rowChild.old_text }}</span>

                          <!--                  需要拍照的操作选项-->
                          <v-col v-if="rowChild.has_picture" cols="3" md="12" class="pa-0">
                            <div class="d-flex">
                              <v-btn
                                  v-if="mobile"
                                  class="mr-1"
                                  depressed
                                  small
                                  @click="openCamera(1,index, rowIndex, rowChildIndex)"
                              >
                                <v-icon>camera_alt</v-icon>
                              </v-btn>
                              <v-btn v-if="mobile"
                                     class="mr-1"
                                     depressed
                                     small
                                     @click="openCamera(0,index, rowIndex, rowChildIndex)"
                              >
                                <v-icon>photo</v-icon>
                              </v-btn>
                              <v-btn v-else depressed class="pa-0">
                                <label
                                    :for="'image_uploads_child' + index + rowIndex + rowChildIndex">
                                  <v-icon>add_photo_alternate</v-icon>
                                </label>
                              </v-btn>
                              <input style="opacity:0;width: 2px" type="file"
                                     :id="'image_uploads_child' + index + rowIndex + rowChildIndex"
                                     @change="uploadImgFile($event, index, rowIndex, rowChildIndex)" accept="image/*">
                            </div>

                            <v-list v-if="rowChild.picture_urls" max-width="200">
                              <v-list-item v-for="url in rowChild.picture_urls" :key="url">
                                <img :src="url" alt="照片"
                                     :class="url == clickedUrl? 'img-expand': 'img-small'"
                                     @click="changeImgSize(url)">
                              </v-list-item>
                            </v-list>
                          </v-col>
                        </v-row>
                      </v-col>
                    </v-row>
                  </v-col>
                </v-row>
              </v-tab-item>
            </v-tabs>
          </v-card>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-chip color="teal" dark v-show="showEdit">内部码</v-chip>
          <div class="inner_code_wrap">
            <span v-for="code in inner_codes" :key="code">
              {{ code }}
            </span>
          </div>
        </v-col>
      </v-row>
    </v-card>
    <SimplifiedOrder ref="SimplifiedOrder" v-else :showViewDialog.sync="showViewDialog" :data="viewingItem" :IO="IO" />
  </v-card>
</template>

<script>
    import mixin from '@/mixins/mixin'
    import print from '@/mixins/print'
    import PurchaseOrder from "./PurchaseOrder"
    import Assemble from "./Assemble"
    import SimplifiedOrder from "./SimplifiedOrder"

    export default {
        name: "Order",
        mixins: [mixin, print],
        components: { Assemble, PurchaseOrder, SimplifiedOrder },
        data() {
            return {
                valid: false,
                rules: [
                    v => !!v || '必填'
                ],

                product_type_value: null,
                product_type_search: '',
                product_name: '',
                showProducts: false,

                putParams: {
                    product_type_id: null,
                    product_id: null,
                    brand_id: null
                },
                inner_codes: [],
                brand_value: null,
                orderLines: [],
                childrenList: [],
                showEdit: false, // 通过view界面打开时
                showPOBtn: false,
                showCompareBtn: false,
                sources: '',
                name: '',
                IO: null,
                showPOBill: false,
                showAssembleBill: false,
                bill: {},
                pData: {},
                showViewDialog: false,
                showLogsDialog: false,
                viewingItem: {},
                viewingLog: {},
                logs: [],
                showSimplified: false,
                clickedUrl: 0
            }
        },
        props: ['data', 'order', 'product_types', 'brands'],
        watch: {
            '$route': {
                handler(cur) {
                    this.reset(cur)
                },
                immediate: true
            },
            order(cur) {
                // lines是数组
                this.childrenList = []
                this.orderLines = []
                this.snackbar = false
                if ( !cur ) return
                this.product_type_value = this.product_types.find((value) => {
                    if ( value.id === cur.product_type_id ) return true
                })
                this.brand_value = this.brands.find((value) => {
                    if ( value.id === cur.brand_id ) return true
                })
                this.getCateOfProduct(cur.product_id)
                this.putParams = cur
                this.showEdit = false
            },
            data: {
                handler(cur) {
                    // lines是json字符串
                    this.childrenList = []
                    this.orderLines = []
                    this.snackbar = false
                    this.IO = null // 去掉上一次的对比痕迹
                    if ( !cur ) return
                    if ( this.sources == 'inspection_orders' ) {
                        this.showSimplified = cur.showSimplified

                    }
                    else {
                        this.showSimplified = cur.status === 6
                    }
                    if ( this.showSimplified ) {
                        this.viewingItem = cur
                    }
                    if ( cur.lines && Array.isArray(cur.lines) ) {
                        this.orderLines = cur.lines
                        this.orderLines.forEach(val => {
                            this.childrenList.push(val.children)
                        })
                    }
                    // this.product_types 和brands在父组件获取
                    this.product_type_value = this.product_types.find((value) => {
                        if ( value.id === cur.product_type_id ) return true
                    })
                    this.brand_value = this.brands.find((value) => {
                        if ( value.id === cur.brand_id ) return true
                    })
                    this.putParams = cur
                    this.inner_codes = cur.inner_code.split(',')
                    this.showEdit = true
                },
                immediate: true,
                deep: true
            }
        },
        created() {
            this.calcListHeight()
        },
        methods: {
            isAllowPrintIO() {
                // 在pc端 有权限 创建界面 初检单 时显示打印按钮
                return !( this.mobile
                  || !this.allowPrint
                  || this.sources !== 'inspection_orders' )
            },
            changeImgSize(url) {
                if ( url == this.clickedUrl ) {
                    this.clickedUrl = 0
                    return
                }
                this.clickedUrl = url
            },
            showLog(log) {
                this.viewingLog = log
                this.showViewDialog = true
            },
            reset(cur) {
                Object.assign(this.$data, this.$options.data())
                if ( cur.name === 'inspection' ) {
                    this.sources = 'inspection_orders'
                    this.name = '初检'
                    this.showPOBtn = true
                    this.showCompareBtn = false
                }
                if ( cur.name === 'recheck' ) {
                    this.sources = 'recheck_orders'
                    this.name = '复检'
                    this.showPOBtn = false
                    this.showCompareBtn = true
                }
                this.checkSK()
            },
            calcListHeight() {
                let Header = document.querySelector('.main-header') != null ? document.querySelector('.main-header').offsetHeight : 0
                let Tab = document.querySelector('.Tab') != null ? document.querySelector('.Tab').offsetHeight : 0
                let Btns = document.querySelector('.Btns') != null ? document.querySelector('.Tab').offsetHeight : 0
                let Footer = document.querySelector('.main-footer') != null ? document.querySelector('.main-footer').offsetHeight : 0
                this.listHeight = this.screenHeight - Tab - Btns - Header - Footer - 40
            },
            compareIO() {  // 对比初检单
                this.getIO()
            },
            closeOrderDialog() {
                this.$emit('update:showOrderDialog', false)
            },
            getIO() {
                let item = this.$props.data
                this.axios({
                    url: `/api/inspection_orders?action=view`,
                    params: {
                        inner_code: item.inner_code,
                        include_line: true
                    }
                }).then(res => {
                    if ( res.state && res.root.length ) {
                        if ( res.root[0].status != 6 ) {
                            return alert('此初检单尚未执行')
                        }
                        this.IO = res.root[0]
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            getCateOfProduct(product_id) {
                if ( !product_id ) {
                    return
                }
                let order_type = this.sources == 'inspection_orders' ? 1 : 2
                this.axios({
                    url: `/api/cates?action=inspection_lines`, // 复检也是这个接口
                    params: {
                        product_id,
                        order_type
                    }
                }).then(res => {
                    this.orderLines = []
                    this.childrenList = []
                    if ( res.state ) {
                        this.orderLines = res.root
                        this.orderLines.forEach(val => {
                            this.childrenList.push(val.children)
                        })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            createPurchaseOrder() {
                let item = this.$props.data
                this.axios({
                    url: `/api/${ this.sources }/${ item.id }?action=generate_form`,
                    method: 'POST',
                    data: {
                        form_name: 'purchase_order'
                    }
                }).then((res) => {
                    if ( res.state ) {
                        this.bill = res
                        this.pData = {
                            bill: res,
                            IO_id: item.id
                        }
                        this.showPOBill = true
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            createAssembleOrder() {
                let item = this.$props.data
                this.axios({
                    url: `/api/inspection_orders/${ item.id }?action=generate_form`,
                    method: 'POST',
                    data: {
                        form_name: 'assemble'
                    }
                }).then((res) => {
                    if ( res.state ) {
                        this.bill = res
                        this.pData = {
                            bill: res,
                            IO_id: item.id
                        }
                        this.showAssembleBill = true
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            changeItem(index, rowIndex, itemIndex, rowChildIndex = null) {
                let obj = null
                if ( rowChildIndex == null )
                    obj = this.orderLines[index].children[rowIndex]
                else
                    obj = this.orderLines[index].children[rowIndex].children[rowChildIndex]

                const bool  = !obj.items[itemIndex].checked
                let is_multi_cate = obj.is_multi
                let arr = obj.items.map((item, index) => {
                    if ( !is_multi_cate )
                        item.checked = index == itemIndex
                    delete item.is_default
                    return item
                })
                obj.items[itemIndex].checked = bool
                if ( rowChildIndex == null )
                    this.orderLines[index].children[rowIndex].items = arr
                else
                    this.orderLines[index].children[rowIndex].children[rowChildIndex].items = arr

            },
            color(item, items) {
                if ( item.checked ) return 'primary'
                let origin = items.some(item=> {
                    return item.checked == true
                })
                if ( item.is_default && !origin ) return 'primary' // 在其他Item都不是选中项时 选中默认项
                return 'grey lighten-4'
            },
            dataURLtoFile(dataURI, type) {
                let byteString = ''
                if ( dataURI.split(',')[0].indexOf('base64') >= 0 ) {
                    byteString = atob(dataURI.split(',')[1]);
                }
                else byteString = unescape(dataURI.split(',')[1]);
                let array = [];
                for ( let i = 0; i < byteString.length; i++ ) {
                    array.push(byteString.charCodeAt(i));
                }
                return new Blob([new Uint8Array(array)], { type: type });
            },
            afterUploadIMG(picture_url, indexObj) {
                let { index, rowIndex, rowChildIndex } = indexObj
                if ( rowChildIndex == null ) { // 第二层质检项还是第三层质检项
                    if ( !this.orderLines[index].children[rowIndex].picture_urls ) {
                        let arr = []
                        arr.push(picture_url)
                        this.orderLines[index].children[rowIndex].picture_urls = arr
                        return
                    }
                    this.orderLines[index].children[rowIndex].picture_urls.push(picture_url)
                    return
                }
                // 第三层
                if ( !this.orderLines[index].children[rowIndex].children[rowChildIndex].picture_urls ) {
                    let arr = []
                    arr.push(picture_url)
                    this.orderLines[index].children[rowIndex].children[rowChildIndex].picture_urls = arr
                    return
                }
                this.orderLines[index].children[rowIndex].children[rowChildIndex].picture_urls.push(picture_url)

            },
            getQiniuUrl(dataurl, indexObj) {
                let blob = this.dataURLtoFile(dataurl, 'image/jpeg')
                let data = new FormData()
                let fileOfBlob = new File([blob], new Date() + '.jpg'); // 重命名了
                data.append('fileData', fileOfBlob)
                this.onUpload(data, indexObj)
            },
            onUpload(data, indexObj) {
                this.axios({
                    url: '/api/upload',
                    method: 'POST',
                    data
                }).then(res => {
                    if ( res.state ) {
                        this.afterUploadIMG(res.picture_url, indexObj)
                    }
                    else alert('qiniu上传图片出错')
                }).catch((e) => {
                    alert(e)
                })
            },
            openCamera(type, index, rowIndex, rowChildIndex = null) {
                let _this = this
                let indexObj = {
                    index,
                    rowIndex,
                    rowChildIndex: rowChildIndex
                }
                // 获取照片文件
                navigator.camera.getPicture(onSuccess, onFail, {
                    quality: 50,
                    destinationType: 0,
                    sourceType: type // 本机相机
                });

                function onSuccess(imageURI) {
                    // imageURI 是base64编码字符串 要转成file
                    _this.getQiniuUrl('data:image/jpeg;base64,' + imageURI, indexObj)
                }

                function onFail(message) {
                    alert('Failed because: ' + message);
                }
            },
            uploadImgFile($event, index, rowIndex, rowChildIndex = null) {
                let indexObj = {
                    index,
                    rowIndex,
                    rowChildIndex
                }
                let file = $event.target.files[0]
                let data = new FormData()
                data.append('fileData', file)
                this.onUpload(data, indexObj)
                $event.target.value = ''
            },
            saveOrder() {
                let item = this.showEdit ? this.$props.data : this.$props.order
                let data = {
                    ...this.putParams,
                    lines: this.orderLines
                }
                this.axios({
                    url: `/api/${ this.sources }/${ item.id }`,
                    method: 'PUT',
                    data
                }).then(res => {
                    if ( res.id ) {
                        if ( !this.showEdit ) {
                            this.$refs.brand.resetItem()
                            this.$refs.product_type.resetItem()
                            this.reset(this.$route)
                        }
                        this.$emit('afterEdit', res)
                        this.closeOrderDialog()
                        this.$listeners.Snackerbar({ bool: true, type: 'success', text: `更新${ this.name }单成功` })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })

                })
            },
            onPrint() {
                let item = this.showEdit ? this.$props.data : this.$props.order
                let url = "/api/inspection_orders/" + item.id + "?action=print_form"
                this.printView(url)
            },
            executeOrder() { // execute order
                let item = this.$props.data
                let is_inspection_orders = this.sources === 'inspection_orders'
                if ( !is_inspection_orders ) { // 复检单
                    if ( !confirm(`是否要执行${ this.name }单${ item.code }?`) ) return
                }
                else {
                    if ( item.status === 0 ) {
                        if ( !confirm(`是否对${ item.code }进行第一次执行?`) ) return
                    }
                    if ( item.status === 1 ) {
                        if ( !confirm(`是否对${ item.code }进行第二次执行?`) ) return
                    }
                    if ( item.status === 2 ) {
                        if ( !confirm(`是否对${ item.code }进行最终执行?`) ) return
                    }
                }
                this.axios({
                    url: `/api/${ this.sources }/${ item.id }?action=execute`,
                    method: 'POST'
                }).then(res => {
                    if ( res.state === 1 ) {
                        let obj = {
                            status: 6,
                            executed_user: sessionStorage.getItem('user')
                        }
                        // 初检单区分 0 1 2 6四种状态
                        if ( is_inspection_orders ) {
                            if ( item.status === 0 ) obj.status = 1
                            if ( item.status === 1 ) obj.status = 2
                        }
                        this.$emit('afterEdit', obj)
                        this.closeOrderDialog()
                        this.$listeners.Snackerbar({ bool: true, type: 'success', text: `执行${ this.name }单成功` })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            deleteOrder() {
                let item = this.$props.data
                if ( !confirm(`是否要删除${ this.name }单${ item.code }?`) ) return
                this.axios({
                    url: `/api/${ this.sources }/${ item.id }`,
                    method: 'DELETE'
                }).then(res => {
                    if ( res.state ) {
                        this.closeOrderDialog()
                        this.$listeners.Snackerbar({ bool: true, type: 'success', text: `删除${ this.name }单成功` })
                        return
                    }
                    this.Snackerbar({ bool: true, type: '', text: res.errmsg })
                })
            },
            orderLogs() {
                let item = this.$props.data
                this.axios({
                    url: `/api/inspection_logs`,
                    params: {
                        form_id: item.id,
                        form_name: this.$route.name + '_order'
                    }
                }).then(res => {
                    if ( res.state ) {
                        this.logs = res.root
                        this.showViewDialog = false
                        this.showLogsDialog = true
                        return
                    }
                    alert(res.errmsg)
                })
            },
            product_type_change_dialog(child_msg) {
                if ( child_msg ) {
                    this.putParams.product_type_id = child_msg.id
                    this.putParams.product_type_name = child_msg.name
                }
                else {
                    delete this.putParams.product_type_id
                    delete this.putParams.product_type_name
                }
            },
            brand_change_dialog(child_msg) {
                if ( child_msg ) {
                    this.putParams.brand_id = child_msg.id
                    this.putParams.brand_name = child_msg.name
                }
                else {
                    delete this.putParams.brand_id
                    delete this.putParams.brand_name
                }
            },
            fillPro(cur) {
                this.putParams.product_id = cur.id
                this.putParams.product_name = cur.name
                this.getCateOfProduct(cur.id)
            },
            searchPro() {
                this.showProducts = true
                this.product_name = this.putParams.product_name
            },
            clearProSearch() {
                this.putParams.product_id = null
                this.putParams.product_name = null
            },
            printScreen() { // 截取简化版的单据的页面 并下载
                this.$refs.SimplifiedOrder.printScreen()
            }
        }
    }
</script>
<style lang="less" scoped>
  .rowChild {
    color: #757575;
  }
</style>
