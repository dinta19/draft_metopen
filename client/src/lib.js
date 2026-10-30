import { reactive, computed, watch } from 'vue';

export async function api(path,options={}) {
  const response=await fetch(`/api${path}`,{credentials:'same-origin',...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...options.headers},body:options.body?JSON.stringify(options.body):undefined});
  const data=await response.json().catch(()=>({message:'Server tidak dapat dihubungi.'}));
  if(!response.ok) {const error=new Error(data.message||'Permintaan gagal.');error.status=response.status;error.fields=data.fields;throw error;}
  return data;
}
export const money=value=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(value||0);
export const dateTime=value=>new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Jakarta'}).format(new Date(value));
export const localDate=value=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(value||new Date());
export const labels={received:'Diterima',processing:'Diproses',ready:'Siap',completed:'Selesai'};
export const stages=['received','processing','ready','completed'];
export function newKey(){return globalThis.crypto.randomUUID?.()||'10000000-1000-4000-8000-100000000000'.replace(/[018]/g,c=>(Number(c)^crypto.getRandomValues(new Uint8Array(1))[0]&15>>Number(c)/4).toString(16));}
export function newToken(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');}
export const state=reactive({config:null,user:null,cart:[],notice:'',orderType:'dine_in',table:1});
try {const stored=JSON.parse(localStorage.getItem('teras-cart')||'[]');if(Array.isArray(stored)) state.cart=stored.filter(x=>typeof x?.id==='string'&&typeof x.name==='string'&&Number.isFinite(x.price)&&x.price>0&&Number.isInteger(x.quantity)&&x.quantity>0&&x.quantity<=50);} catch {}
try {const context=JSON.parse(localStorage.getItem('teras-context')||'null');if(context&&['dine_in','takeaway'].includes(context.type)&&Number.isInteger(context.table)&&context.table>=1&&context.table<=50){state.orderType=context.type;state.table=context.table;}}catch{}
watch(()=>[state.orderType,state.table],()=>localStorage.setItem('teras-context',JSON.stringify({type:state.orderType,table:state.table})));
export const cartCount=computed(()=>state.cart.reduce((n,x)=>n+x.quantity,0));
export const cartTotal=computed(()=>state.cart.reduce((n,x)=>n+x.quantity*x.price,0));
export function persistCart(){localStorage.setItem('teras-cart',JSON.stringify(state.cart));}
let timer;
export function notify(message){state.notice=message;clearTimeout(timer);timer=setTimeout(()=>state.notice='',3500);}
export function addToCart(menu) {
  if(!menu.available) return;
  const item=state.cart.find(x=>x.id===menu.id);
  if(item&&item.quantity>=50) return notify('Maksimal 50 porsi per menu.');
  if(item) item.quantity++; else state.cart.push({...menu,quantity:1,note:''});
  persistCart();notify(`${menu.name} ditambahkan`);
}
export function changeQuantity(id,delta){const item=state.cart.find(x=>x.id===id);if(!item)return;item.quantity=Math.min(50,item.quantity+delta);if(item.quantity<=0)state.cart=state.cart.filter(x=>x.id!==id);persistCart();}
export async function loadConfig(){if(!state.config)state.config=await api('/config');return state.config;}
export async function loadUser(){try{state.user=await api('/auth/me');}catch{state.user=null;}return state.user;}
