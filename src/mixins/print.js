export default {
    data() {
        return {
            showPrint: false,
            pdfUrl: ''
        }
    },
    methods: {
        printView(url, data, method = 'POST', params = null) {
            this.showPrint = true
            this.axios({
                url,
                data,
                params,
                method,
                responseType: 'blob'
            }).then(res => {
                let blob = new Blob([res], { type: 'application/pdf' });
                this.pdfUrl = URL.createObjectURL(blob)
            })
        },
        printOrder() {
            const printIframe = document.getElementById("Iframe");
            printIframe.contentWindow.print();
            this.showPrint = false
        },
    }
}
