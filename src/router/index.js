import Vue from 'vue'
import VueRouter from 'vue-router'
// import store from '../store'

Vue.use(VueRouter)

const routes = [
    {
        path: '/',
        meta: {
            name: '',
            requiresAuth: false
        },
        component: () => import( `@/views/Login.vue`),
        children: [
            {
                path: '',
                component: () => import(`@/components/LoginForm.vue`)
            }
        ]
    }, {
        path: '/dashboard',
        meta: {
            name: 'dashboard',
            requiresAuth: true
        },
        component: () => import(`@/views/Dashboard.vue`),
        children: [
            {
                path: 'info',
                name: 'info',
                component: () => import(`@/views/Info.vue`),
                children: [
                    {
                        path: 'brands',
                        name: 'brands',
                        meta: {
                            lcode: '/data/brand'
                        },
                        component: () => import(`@/views/Infos/Brands.vue`)
                    }, {
                        path: 'product_types',
                        name: 'product_types',
                        meta: {
                            lcode: '/data/product_type'
                        },
                        component: () => import(`@/views/Infos/ProductTypes.vue`)
                    }, {
                        path: 'roles',
                        name: 'roles',
                        meta: {
                            lcode: '/data/role'
                        },
                        component: () => import(`@/views/Infos/Roles.vue`)
                    }, {
                        path: 'users',
                        name: 'users',
                        meta: {
                            lcode: '/data/user'
                        },
                        component: () => import(`@/views/Infos/Users.vue`)
                    }, {
                        path: 'products',
                        name: 'products',
                        meta: {
                            lcode: '/data/product'
                        },
                        component: () => import(`@/views/Infos/Products.vue`)
                    }, {
                        path: 'product_mappings',
                        name: 'product_mappings',
                        meta: {
                            lcode: '/data/product_mapping'
                        },
                        component: () => import(`@/views/Infos/ProductMappings.vue`)
                    }, {
                        path: 'cates',
                        name: 'cates',
                        meta: {
                            lcode: '/data/cate'
                        },
                        component: () => import(`@/views/Infos/Cates.vue`)
                    }, {
                        path: 'items',
                        name: 'items',
                        meta: {
                            lcode: '/data/item'
                        },
                        component: () => import(`@/views/Infos/Items.vue`)
                    }, {
                        path: 'logistics_companies',
                        name: 'logistics_companies',
                        meta: {
                            lcode: '/data/logistics_company'
                        },
                        component: () => import(`@/views/Infos/LogisticsCompanies.vue`)
                    }, {
                        path: 'security_keys',
                        name: 'security_keys',
                        meta: {
                            lcode: '/data/security_key'
                        },
                        component: () => import(`@/views/Infos/SecurityKeys.vue`)
                    }, {
                        path: 'set_of_books',
                        name: 'set_of_books',
                        meta: {
                            lcode: '/data/set_of_book'
                        },
                        component: () => import(`@/views/Infos/SetOfBooks.vue`)
                    }

                ]
            },
            {
                path: 'inspection',
                name: 'inspection',
                meta: {
                    lcode: '/order/inspection_order'
                },
                component: () => import(`@/views/InspectionOrders/index.vue`)
            },
            {
                path: 'recheck',
                name: 'recheck',
                meta: {
                    lcode: '/order/recheck_order'
                },
                component: () => import(`@/views/InspectionOrders/index.vue`)
            },
            {
                path: 'sorting',
                name: 'sorting',
                meta: {
                    lcode: '/order/sorting_order'
                },
                component: () => import(`@/views/SortingOrders/index.vue`)
            },
            {
                path: 'view',
                name: 'view',
                component: () => import(`@/views/ViewOrders.vue`)
            },
            {
                path: 'workspace',
                name: 'workspace',
                meta: {
                    lcode: '/data/workspace'
                },
                component: () => import(`@/views/Workspace.vue`)
            },
            {
                path: 'reports',
                name: 'reports',
                component: () => import(`@/views/Reports.vue`),
                children: [
                    {
                        path: 'quantity_counting',
                        name: 'quantity_counting',
                        meta: {
                            lcode: '/report/quantity_counting'
                        },
                        component: () => import(`@/views/reports/QuantityCounting.vue`)
                    },
                    {
                        path: 'purchase_state',
                        name: 'purchase_state',
                        meta: {
                            lcode: '/report/purchase_state'
                        },
                        component: () => import(`@/views/reports/PurchaseState.vue`)
                    },
                ]
            }
        ]
    }
]

const router = new VueRouter({
    mode: 'hash',
    base: process.env.BASE_URL,
    routes
})
router.beforeEach((to, from, next) => {
    if ( to.matched.some(record => record.meta.requiresAuth) ) {
        if ( sessionStorage.getItem('token') ) {
            next()
            return
        }
        next('/')
    }
    else {
        next()
    }
})
router.afterEach(() =>  {
    window.scrollTo(0, 0);
});
export default router
