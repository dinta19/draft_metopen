<script setup>
import {computed,onMounted,reactive,ref} from 'vue';
import {useRouter} from 'vue-router';
import Icon from '../components/Icon.vue';
import Quantity from '../components/Quantity.vue';
import {api,state,money,cartTotal,persistCart,changeQuantity,newKey,newToken} from '../lib';
const router=useRouter(),form=reactive({customer_name:'',whatsapp:'',payment_method:'qris'}),busy=ref(false),loading=ref(true),error=ref(''),unavailable=ref([]);
let requestKey=newKey(),token=newToken(),lastPayload='';
const blocked=computed(()=>unavailable.value.some(id=>state.cart.some(x=>x.id===id)));
onMounted(async()=>{try{const menus=await api('/menu');state.cart=state.cart.map(item=>{const latest=menus.find(x=>x.id===item.id);if(!latest||!latest.available)unavailable.value.push(item.id);return latest?{...latest,quantity:item.quantity,note:item.note||''}:item;});persistCart();}catch(e){error.value=e.message;}finally{loading.value=false;}});
async function submit(){
  if(busy.value||blocked.value||!state.cart.length)return;
  busy.value=true;error.value='';
  try{
    const fields={...form,order_type:state.orderType,table_number:state.orderType==='dine_in'?Number(state.table):null,items:state.cart.map(x=>({menu_id:x.id,quantity:x.quantity,note:x.note||''}))};
    const signature=JSON.stringify(fields);
    if(lastPayload&&lastPayload!==signature){requestKey=newKey();token=newToken();}lastPayload=signature;
    const order=await api('/orders',{method:'POST',body:{...fields,request_key:requestKey,tracking_token:token}});
    state.cart=[];persistCart();localStorage.setItem('teras-last-order',JSON.stringify({code:order.code,token}));
    router.push({path:`/pesanan/${order.code}`,query:{token}});
  }catch(e){error.value=e.message;}finally{busy.value=false;}
}
</script>
<template><div class="container inner-page"><RouterLink class="back-link" to="/"><Icon name="ArrowLeft" :size="17"/>Kembali ke menu</RouterLink><h1 class="page-heading">Sedikit lagi, siap dipesan.</h1><p class="page-intro">Periksa pesananmu dan lengkapi detail di bawah ini.</p>
  <div v-if="!state.cart.length" class="empty-state panel"><Icon name="ShoppingBag" :size="40"/><h2>Keranjangmu masih kosong</h2><p>Pilih makanan atau minuman sebelum checkout.</p><RouterLink class="button primary" to="/">Lihat menu</RouterLink></div>
  <form v-else class="checkout-grid" @submit.prevent="submit">
    <div><section class="panel"><h2 class="panel-heading"><span class="step-number">1</span>Detail pesanan</h2><div class="checkout-items"><article v-for="item in state.cart" :key="item.id" class="checkout-item"><img :src="item.image_url||'/favicon.svg'" :alt="item.name"/><div class="checkout-item-main"><strong>{{item.name}}</strong><span>{{money(item.price)}}</span><label class="note-label">Catatan untuk dapur<input v-model="item.note" maxlength="200" placeholder="Misalnya: sambal dipisah" @input="persistCart"/></label><p v-if="unavailable.includes(item.id)" class="field-error">Menu ini sudah tidak tersedia. Hapus dari keranjang.</p></div><div class="checkout-item-end"><strong>{{money(item.price*item.quantity)}}</strong><Quantity :quantity="item.quantity" :name="item.name" @change="changeQuantity(item.id,$event)"/><button type="button" class="text-button danger" @click="changeQuantity(item.id,-item.quantity)">Hapus</button></div></article></div></section>
    <section class="panel"><h2 class="panel-heading"><span class="step-number">2</span>Siapa yang memesan?</h2><div class="form-grid"><label>Nama pemesan<input v-model="form.customer_name" required minlength="2" maxlength="80" autocomplete="name" placeholder="Nama kamu"/></label><label>Nomor WhatsApp<input v-model="form.whatsapp" type="tel" required pattern="(\+62|62|0)8[0-9\s()-]{7,15}" autocomplete="tel" placeholder="08xxxxxxxxxx"/><small>Digunakan untuk mencari pesananmu.</small></label></div><fieldset><legend>Tipe pesanan</legend><div class="choice-grid"><label :class="['choice',{selected:state.orderType==='dine_in'}]"><input v-model="state.orderType" type="radio" value="dine_in"/><Icon name="UtensilsCrossed"/><span><strong>Dine-in</strong><small>Nikmati di meja cafe</small></span></label><label :class="['choice',{selected:state.orderType==='takeaway'}]"><input v-model="state.orderType" type="radio" value="takeaway"/><Icon name="ShoppingBag"/><span><strong>Takeaway</strong><small>Ambil di kasir</small></span></label></div></fieldset><label v-if="state.orderType==='dine_in'" class="compact-field">Nomor meja<select v-model="state.table" required><option v-for="n in 50" :key="n" :value="n">Meja {{String(n).padStart(2,'0')}}</option></select></label></section>
    <section class="panel"><h2 class="panel-heading"><span class="step-number">3</span>Metode pembayaran</h2><div class="choice-grid"><label :class="['choice',{selected:form.payment_method==='qris'}]"><input v-model="form.payment_method" type="radio" value="qris"/><Icon name="QrCode"/><span><strong>QRIS</strong><small>Scan melalui bank / e-wallet</small></span></label><label :class="['choice',{selected:form.payment_method==='transfer'}]"><input v-model="form.payment_method" type="radio" value="transfer"/><Icon name="ReceiptText"/><span><strong>Transfer bank</strong><small>Transfer ke rekening cafe</small></span></label></div><p class="muted small">Instruksi pembayaran muncul setelah pesanan dikirim. Pembayaran dikonfirmasi manual oleh kasir.</p></section></div>
    <aside class="panel checkout-summary"><h2>Ringkasan pesanan</h2><div class="summary-line" v-for="item in state.cart" :key="item.id"><span>{{item.quantity}}× {{item.name}}</span><span>{{money(item.quantity*item.price)}}</span></div><div class="summary-total"><span>Total pembayaran</span><strong>{{money(cartTotal)}}</strong></div><div v-if="state.config?.mode==='demo'" class="alert">Ini pesanan demo. Jangan melakukan pembayaran nyata.</div><div v-if="error" role="alert" class="alert error">{{error}}</div><button class="button primary full" :disabled="busy||loading||blocked"><Icon v-if="busy" name="Loader" class="spin" :size="18"/>{{busy?'Mengirim…':'Kirim pesanan'}}<Icon v-if="!busy" name="ArrowRight" :size="18"/></button><p class="secure-note"><Icon name="ShieldCheck" :size="14"/>Total akhir diperiksa kembali saat pesanan dikirim.</p></aside>
  </form>
</div></template>
