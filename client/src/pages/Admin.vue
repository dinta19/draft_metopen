<script setup>
import {computed} from 'vue';
import {useRoute,useRouter} from 'vue-router';
import Icon from '../components/Icon.vue';
import Orders from '../components/admin/Orders.vue';
import Menus from '../components/admin/Menus.vue';
import Stock from '../components/admin/Stock.vue';
import Reports from '../components/admin/Reports.vue';
import TableQR from '../components/admin/TableQR.vue';
import {api,state} from '../lib';
const route=useRoute(),router=useRouter();
const nav=computed(()=>[{id:'orders',label:'Pesanan',icon:'ClipboardList',description:'Terima, siapkan, dan selesaikan setiap pesanan.'},{id:'menu',label:'Kelola menu',icon:'UtensilsCrossed',description:'Atur menu dan ketersediaan untuk pelanggan.'},{id:'stock',label:'Stok bahan baku',icon:'Package',description:'Catat persediaan dan perubahan stok secara manual.'},...(state.user?.role==='owner'?[{id:'reports',label:'Laporan penjualan',icon:'BarChart3',description:'Lihat penjualan dari pesanan yang selesai dan lunas.'}]:[]),{id:'qr',label:'QR meja',icon:'QrCode',description:'Siapkan akses menu untuk setiap meja.'}]);
const current=computed(()=>nav.value.find(x=>x.id===route.params.tab)||nav.value[0]);
const component=computed(()=>({orders:Orders,menu:Menus,stock:Stock,reports:Reports,qr:TableQR}[current.value.id]));
async function logout(){try{await api('/auth/logout',{method:'POST'});state.user=null;router.push('/login');}catch(e){window.alert(e.message);}}
</script>
<template><div class="admin-layout"><aside class="admin-sidebar"><RouterLink class="brand" to="/"><span class="brand-mark"><Icon name="Leaf" :size="24"/></span><span>Taman Teras<small>RUANG KERJA TIM</small></span></RouterLink><div class="sidebar-label">OPERASIONAL CAFE</div><nav aria-label="Dashboard staf"><RouterLink v-for="item in nav" :key="item.id" :to="'/admin/'+item.id" :class="{active:current.id===item.id}"><Icon :name="item.icon" :size="20"/>{{item.label}}</RouterLink></nav><div class="sidebar-bottom"><RouterLink to="/" class="text-button"><Icon name="ArrowUpRight" :size="17"/>Lihat website</RouterLink><div class="staff-profile"><span>{{state.user?.name?.[0]||'T'}}</span><div><strong>{{state.user?.name}}</strong><small>{{state.user?.role==='owner'?'Owner':'Kasir'}}</small></div><button class="icon-button" aria-label="Keluar dari dashboard" @click="logout"><Icon name="LogOut" :size="18"/></button></div></div></aside><div class="admin-workspace"><header class="admin-topbar"><span><Icon name="Store" :size="16"/>Taman Teras Cafe</span><span class="badge neutral">{{state.user?.role==='owner'?'Akses Owner':'Akses Kasir'}}</span></header><div class="admin-content"><div class="admin-page-heading"><div><p class="breadcrumb">Dashboard / {{current.label}}</p><h1>{{current.label}}</h1><p>{{current.description}}</p></div></div><component :is="component" :key="current.id"/></div></div></div></template>
