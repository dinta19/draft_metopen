import { createApp } from 'vue';
import { createRouter,createWebHistory } from 'vue-router';
import App from './App.vue';
import Menu from './pages/Menu.vue';
import Checkout from './pages/Checkout.vue';
import Tracking from './pages/Tracking.vue';
import Information from './pages/Information.vue';
import Login from './pages/Login.vue';
import Admin from './pages/Admin.vue';
import NotFound from './pages/NotFound.vue';
import { loadUser, state } from './lib';
import './style.css';

const router=createRouter({history:createWebHistory(),routes:[
  {path:'/',component:Menu}, {path:'/menu',redirect:'/'},
  {path:'/checkout',component:Checkout}, {path:'/pesanan',component:Tracking},
  {path:'/pesanan/:code',component:Tracking},
  {path:'/tentang',component:Information}, {path:'/kontak',component:Information},
  {path:'/login',component:Login},
  {path:'/admin/:tab?',component:Admin,meta:{staff:true}},
  {path:'/:pathMatch(.*)*',component:NotFound},
]});
router.beforeEach(async to=>{
  if(to.meta.staff){if(!await loadUser()) return '/login';if(to.params.tab==='reports'&&state.user.role!=='owner') return '/admin/orders';}
});
router.afterEach(()=>{window.scrollTo({top:0});document.title='Taman Teras Cafe';});
createApp(App).use(router).mount('#app');
