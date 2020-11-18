module.exports = {
  "transpileDependencies": [
    "vuetify"
  ],
    devServer: {
        port: 8081,
        open: true,
        proxy: {
            "/api": {
                // target: "http://192.168.2.230:8990",
                target: "https://addons.c8erp.com:8912",
                ws: true,
                changeOrigin: true
            }
        }
    },
    publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
    outputDir: "static",
    assetsDir: './'
}
