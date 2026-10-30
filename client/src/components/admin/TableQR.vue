<script setup>
import {computed,onMounted,ref,watch} from 'vue';
import QRCode from 'qrcode';
import Icon from '../Icon.vue';
import {state,loadConfig} from '../../lib';
const table=ref(1),image=ref(''),error=ref('');
const url=computed(()=>{try{const value=new URL(state.config?.public_url||location.origin);value.pathname='/';value.search='';value.hash='';value.searchParams.set('meja',table.value);return value.href;}catch{return '';}});
async function generate(){try{image.value=await QRCode.toDataURL(url.value,{width:640,margin:2,color:{dark:'#24533e',light:'#ffffff'}});}catch{error.value='Alamat website belum valid.';}}
onMounted(async()=>{await loadConfig().catch(()=>{});generate();});watch(url,generate);
</script>
<template><div class="qr-layout"><section class="panel"><h2>Akses menu dari meja</h2><p class="muted">Pelanggan memindai QR ini untuk membuka menu dengan nomor meja terisi.</p><label>Nomor meja<select v-model="table"><option v-for="n in 50" :key="n" :value="n">Meja {{String(n).padStart(2,'0')}}</option></select></label><label>Tautan menu<input :value="url" readonly/></label><p class="muted small">Alamat mengikuti PUBLIC_APP_URL pada konfigurasi backend. Gunakan alamat yang dapat diakses dari ponsel pelanggan.</p><div v-if="/localhost|127\.0\.0\.1/.test(url)" class="alert">QR saat ini memakai localhost. Untuk mencoba dari ponsel, isi PUBLIC_APP_URL dengan alamat IP komputer atau domain yang dapat diakses.</div><p v-if="error" class="alert error">{{error}}</p><a v-if="image" class="button primary" :href="image" :download="`taman-teras-meja-${table}.png`"><Icon name="Download" :size="17"/>Unduh QR meja</a></section><div class="qr-card"><Icon name="Leaf" :size="33"/><h2>Taman Teras Cafe</h2><p>Jeda sejenak. Pilih yang enak.</p><img v-if="image" :src="image" :alt="`QR menu meja ${table}`"/><strong>MEJA {{String(table).padStart(2,'0')}}</strong><span>Scan untuk melihat menu dan memesan</span><small>QR akses menu · bukan QR pembayaran</small></div></div></template>
