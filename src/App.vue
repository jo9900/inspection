<template>
  <main v-cloak>
    <v-fade-transition mode="out-in">
      <router-view/>
    </v-fade-transition>
  </main>
</template>

<script>
    export default {
        name: 'App',
        created: function () {
            this.axios.interceptors.response.use( (response) => {
                return response;
            }, (error) => {
                return Promise.reject(error);
            });
        }
    };
</script>
<style lang="less">
  .v-application--is-ltr{
    .v-data-footer__select{
      display: none;
    }
    .v-data-footer__pagination{
      margin:0 !important;
    }
  }
  [v-cloak] {
    display: none;
  }
  @media only screen and (max-width: 600px) {

    .v-data-table-header-mobile__wrapper .v-select{
      display: none;
    }
    .v-data-table .v-data-table__mobile-row{
      min-height: 40px !important;
    }

    .theme--light.v-data-table thead tr:last-child th{
      height: 34px;
    }
  }
</style>
