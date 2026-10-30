<script setup>
import {computed,onMounted,ref} from 'vue';
import {useRoute} from 'vue-router';
import Icon from './components/Icon.vue';
import {state,cartCount,loadConfig} from './lib';
const route=useRoute(),mobile=ref(false),configError=ref('');
const admin=computed(()=>route.path.startsWith('/admin')||route.path==='/login');
onMounted(async()=>{try{await loadConfig();}catch(e){configError.value=e.message;}});
</script>
<template>
  <a class="skip-link" href="#main">Lewati ke konten</a>
  <header v-if="!admin" class="site-header">
    <div class="header-inner">
      <RouterLink to="/" class="brand" aria-label="Taman Teras Cafe, beranda"><span class="brand-mark"><Icon name="Leaf" :size="26" /></span><span>Taman Teras<small>CAFE & GOOD COMPANY</small></span></RouterLink>
      <nav class="desktop-nav" aria-label="Navigasi utama"><RouterLink to="/">Menu</RouterLink><RouterLink to="/pesanan">Pesanan saya</RouterLink><RouterLink to="/tentang">Tentang kami</RouterLink><RouterLink to="/kontak">Kontak & lokasi</RouterLink></nav>
      <div class="header-actions"><RouterLink to="/checkout" class="cart-link"><Icon name="ShoppingBag"/><span class="cart-label">Keranjang</span><span class="counter">{{cartCount}}</span></RouterLink><button class="icon-button mobile-toggle" aria-label="Buka navigasi" :aria-expanded="mobile" @click="mobile=!mobile"><Icon :name="mobile?'X':'Menu'"/></button></div>
    </div>
    <nav v-if="mobile" class="mobile-nav" aria-label="Navigasi ponsel" @click="mobile=false"><RouterLink to="/">Menu</RouterLink><RouterLink to="/pesanan">Pesanan saya</RouterLink><RouterLink to="/tentang">Tentang kami</RouterLink><RouterLink to="/kontak">Kontak & lokasi</RouterLink></nav>
  </header>
  <div v-if="state.config?.mode==='demo'" class="demo-ribbon"><span class="demo-dot"></span> Mode demo <span class="ribbon-detail">· Menu, harga, dan foto adalah contoh. Pembayaran tidak diproses.</span></div>
  <div v-if="configError" class="container alert error" role="alert">{{configError}} Pastikan backend berjalan, lalu muat ulang halaman.</div>
  <main id="main"><RouterView :key="route.path"/></main>
  <footer v-if="!admin" class="site-footer container"><RouterLink to="/" class="footer-brand"><Icon name="Leaf"/> Taman Teras Cafe</RouterLink><span>Tempat singgah, rasa yang akrab.</span><RouterLink to="/login" class="staff-link">Area staf <Icon name="ArrowUpRight" :size="14"/></RouterLink></footer>
  <Transition name="toast"><div v-if="state.notice" class="toast" role="status"><Icon name="CheckCircle2"/>{{state.notice}}</div></Transition>
</template>
