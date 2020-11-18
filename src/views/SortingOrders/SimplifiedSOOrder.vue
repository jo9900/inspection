<template>
  <v-card v-on:="$listeners" v-bind="$props" class="pa-2" id="psDomSO">
    <div class="main">
      <div>物流单号：{{ data.code }}</div>
      <div>物流公司：{{ data.logistics_company_name }}</div>
      <div>订单总价：{{ data.source_id }}</div>
      <div>卖家：{{ data.partner_name }}</div>
      <div>卖家电话：{{ data.mobile }}</div>
      <div>备注：{{ data.memo }}</div>
      <div>监控位：{{ data.source }}</div>
      <div>开单：{{ data.created_user }} {{ data.created_at }}</div>
      <div>更改：{{ data.updated_user }} {{ data.updated_at }}</div>
    </div>
    <div class="lines-wrap">
      明细：
      <div v-for="(line, index) in lines" :key="index">
        {{ line.name }} &nbsp; {{ line.value }}
      </div>
    </div>
    <div class="inner-code-wrap">
      内部码：
      <div v-for="(code, index) in inner_codes" :key="index">
        {{ code }}
      </div>
    </div>
  </v-card>
</template>

<script>
    import html2canvas from "html2canvas"

    export default {
        name: "SimplifiedSOOrder",
        props: ['data'],
        data(){
            return {
                lines: [],
                inner_codes: []
            }
        },
        watch:{
            data: {
                handler(cur){
                    const { packing_lines, inner_code } = cur
                    if ( packing_lines && JSON.parse(packing_lines).length ) {
                        this.lines = JSON.parse(packing_lines)
                    }
                    if (inner_code) {
                        this.inner_codes = inner_code.split(',')
                    }
                },
                immediate:true
            }
        },
        methods: {
            printScreen() {
                let code = this.data.code
                html2canvas(document.getElementById('psDomSO'), {
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
        }
    }
</script>

<style scoped lang="less">
  .lines-wrap{
    background-color: #f1f1f1;
  }

</style>
