import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { createStore, fail, stages } from './store.js';
import { createAuth } from './auth.js';
import { allowedOrigins } from './origins.js';

const text=z.string().trim();
const uuid=z.string().uuid();
const phone=text.transform(x=>x.replace(/[\s()-]/g,'').replace(/^\+62/,'0').replace(/^62/,'0')).pipe(z.string().regex(/^08\d{7,12}$/,'Gunakan nomor WhatsApp Indonesia yang valid.'));
const safeImage=text.max(1200).refine(x=>!x||/^https:\/\//.test(x)||/^\/images\/[a-z0-9_.-]+$/i.test(x),'Foto harus berupa URL HTTPS atau gambar lokal.');
const menuSchema=z.object({name:text.min(2).max(100),category:z.enum(['makanan','minuman','camilan']),description:text.max(400),price:z.number().int().min(100).max(10000000),image_url:safeImage,best_seller:z.boolean(),spicy:z.boolean(),available:z.boolean(),calories:z.number().int().min(0).max(10000).nullable()});
const ingredientSchema=z.object({name:text.min(2).max(100),unit:z.enum(['kg','gram','liter','ml','pcs','pack']),stock:z.number().finite().min(0).max(1000000),minimum:z.number().finite().min(0).max(1000000)});
const orderSchema=z.object({customer_name:text.min(2).max(80),whatsapp:phone,order_type:z.enum(['dine_in','takeaway']),table_number:z.number().int().min(1).max(50).nullable(),payment_method:z.enum(['qris','transfer']),request_key:uuid,tracking_token:z.string().regex(/^[a-f0-9]{64}$/),items:z.array(z.object({menu_id:uuid,quantity:z.number().int().min(1).max(50),note:text.max(200)})).min(1).max(40)})
  .superRefine((x,ctx)=>{if(x.order_type==='dine_in'&&!x.table_number) ctx.addIssue({code:'custom',message:'Nomor meja wajib untuk dine-in.',path:['table_number']});})
  .transform(x=>({...x,table_number:x.order_type==='takeaway'?null:x.table_number}));
const codeSchema=text.regex(/^TT-\d{8}-[A-F0-9]{8}$/,'Nomor pesanan tidak valid.');
const publicOrder=({tracking_token,request_key,whatsapp,updated_by,...order})=>order;
const staffOrder=({tracking_token,request_key,...order})=>order;
const jakartaDate=value=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));

export async function createApp() {
  const mode=process.env.DATA_MODE||'demo';
  if(!['demo','supabase'].includes(mode)) throw new Error('DATA_MODE harus demo atau supabase.');
  if(process.env.NODE_ENV==='production'&&mode!=='supabase') throw new Error('Mode production memerlukan Supabase. Gunakan development untuk demo lokal.');
  const store=await createStore(mode), auth=createAuth(store,mode);
  const origins=allowedOrigins();
  const app=express();
  app.disable('x-powered-by');
  app.use(helmet({contentSecurityPolicy:process.env.NODE_ENV==='production'?{directives:{'img-src':["'self'",'data:','https:'],'frame-src':['https://www.google.com','https://maps.google.com'],'script-src':["'self'"],'style-src':["'self'","'unsafe-inline'"]}}:false}));
  app.use(express.json({limit:'50kb'}),cookieParser());
  app.use('/api',(req,res,next)=>{
    res.set('Cache-Control','no-store');
    const origin=req.get('origin');
    if(!['GET','HEAD','OPTIONS'].includes(req.method)&&origin&&!origins.has(origin)) return res.status(403).json({message:'Asal permintaan tidak diizinkan. Buka alamat lokal yang didukung atau sesuaikan APP_ORIGIN di konfigurasi backend.'});
    next();
  });
  const limiter=(limit,windowMs=15*60*1000)=>rateLimit({windowMs,limit,standardHeaders:'draft-8',legacyHeaders:false,handler:(req,res)=>res.status(429).json({message:'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.'})});
  const validate=schema=>(req,res,next)=>{const r=schema.safeParse(req.body);if(!r.success) return res.status(400).json({message:r.error.issues[0].message,fields:r.error.flatten().fieldErrors});req.body=r.data;next();};
  const find=async(table,id)=>{uuid.parse(id);const row=(await store.list(table)).find(x=>x.id===id&&!x.deleted);if(!row) fail('Data tidak ditemukan.',404);return row;};
  app.get('/api/health',(req,res)=>res.json({ok:true,mode}));
  app.get('/api/config',(req,res)=>res.json({name:'Taman Teras Cafe',mode,public_url:process.env.PUBLIC_APP_URL||'http://localhost:5173',hours:'Senin–Jumat, 08.30–16.00 WIB',address:process.env.CAFE_ADDRESS||'',map_embed_url:process.env.CAFE_MAP_EMBED_URL||'',map_url:process.env.CAFE_MAP_URL||'',whatsapp:process.env.CAFE_WHATSAPP||'',instagram_url:process.env.CAFE_INSTAGRAM_URL||'',payment:{bank_name:process.env.PAYMENT_BANK_NAME||'',account_number:process.env.PAYMENT_ACCOUNT_NUMBER||'',account_holder:process.env.PAYMENT_ACCOUNT_HOLDER||'',qris_image_url:process.env.PAYMENT_QRIS_IMAGE_URL||''}}));
  app.get('/api/menu',async(req,res)=>res.json((await store.list('menu')).filter(x=>!x.deleted)));
  app.post('/api/orders',limiter(30),validate(orderSchema),async(req,res)=>{
    if(mode==='supabase') {
      if(req.body.payment_method==='qris'&&!process.env.PAYMENT_QRIS_IMAGE_URL) fail('QRIS cafe belum diatur. Silakan hubungi kasir.',409);
      if(req.body.payment_method==='transfer'&&(!process.env.PAYMENT_ACCOUNT_NUMBER||!process.env.PAYMENT_BANK_NAME||!process.env.PAYMENT_ACCOUNT_HOLDER)) fail('Rekening cafe belum diatur. Silakan hubungi kasir.',409);
    }
    res.status(201).json(publicOrder(await store.createOrder(req.body)));
  });
  app.get('/api/orders/:code',limiter(100),async(req,res)=>{
    const code=codeSchema.parse(req.params.code), token=req.get('x-tracking-token');
    if(!token||!/^[a-f0-9]{64}$/.test(token)) fail('Tautan pelacakan tidak valid.',404);
    const order=(await store.list('orders')).find(x=>x.code===code&&x.tracking_token===token);
    if(!order) fail('Pesanan tidak ditemukan. Periksa tautan pelacakan.',404);
    res.json(publicOrder(order));
  });
  app.post('/api/orders/lookup',limiter(20),validate(z.object({code:codeSchema,whatsapp:phone})),async(req,res)=>{
    const order=(await store.list('orders')).find(x=>x.code===req.body.code&&x.whatsapp===req.body.whatsapp);
    if(!order) fail('Nomor pesanan atau WhatsApp tidak sesuai.',404);
    res.json(publicOrder(order));
  });
  app.post('/api/auth/login',limiter(12),validate(z.object({email:z.string().trim().email().max(150),password:z.string().min(1).max(150)})),async(req,res)=>res.json(await auth.login(req,res)));
  app.get('/api/auth/me',auth.require,(req,res)=>res.json(req.user));
  app.post('/api/auth/logout',(req,res)=>{auth.logout(req,res);res.json({ok:true});});
  app.use('/api/admin',auth.require);
  app.get('/api/admin/orders',async(req,res)=>{
    const list=(await store.list('orders')).sort((a,b)=>b.created_at.localeCompare(a.created_at));
    res.json(list.map(staffOrder));
  });
  app.patch('/api/admin/orders/:id',validate(z.object({version:z.number().int().positive(),status:z.enum(stages).optional(),payment_status:z.literal('paid').optional()}).refine(x=>x.status||x.payment_status,'Pilih perubahan pesanan.')),async(req,res)=>{uuid.parse(req.params.id);res.json(staffOrder(await store.changeOrder(req.params.id,req.body,req.user)));});
  app.post('/api/admin/menu',auth.owner,validate(menuSchema),async(req,res)=>res.status(201).json(await store.save('menu',{...req.body,id:randomUUID(),deleted:false})));
  app.put('/api/admin/menu/:id',auth.owner,validate(menuSchema),async(req,res)=>{await find('menu',req.params.id);res.json(await store.update('menu',req.params.id,req.body));});
  app.patch('/api/admin/menu/:id/availability',validate(z.object({available:z.boolean()})),async(req,res)=>{await find('menu',req.params.id);res.json(await store.update('menu',req.params.id,req.body));});
  app.delete('/api/admin/menu/:id',auth.owner,async(req,res)=>{await find('menu',req.params.id);await store.update('menu',req.params.id,{deleted:true,available:false});res.json({ok:true});});
  app.get('/api/admin/ingredients',async(req,res)=>res.json((await store.list('ingredients')).filter(x=>!x.deleted).sort((a,b)=>(b.stock<=b.minimum)-(a.stock<=a.minimum)||a.name.localeCompare(b.name))));
  app.post('/api/admin/ingredients',auth.owner,validate(ingredientSchema),async(req,res)=>res.status(201).json(await store.createIngredient({...req.body,id:randomUUID(),deleted:false},req.user)));
  app.put('/api/admin/ingredients/:id',auth.owner,validate(ingredientSchema.omit({stock:true})),async(req,res)=>{await find('ingredients',req.params.id);res.json(await store.update('ingredients',req.params.id,req.body));});
  app.delete('/api/admin/ingredients/:id',auth.owner,async(req,res)=>{await find('ingredients',req.params.id);await store.update('ingredients',req.params.id,{deleted:true});res.json({ok:true});});
  app.post('/api/admin/ingredients/:id/stock',validate(z.object({operation:z.enum(['set','add','subtract']),quantity:z.number().finite().min(0).max(1000000),reason:text.min(3).max(250)})),async(req,res)=>{uuid.parse(req.params.id);res.json(await store.adjustStock(req.params.id,req.body,req.user));});
  app.get('/api/admin/stock-movements',async(req,res)=>res.json((await store.list('movements')).sort((a,b)=>b.created_at.localeCompare(a.created_at))));
  app.get('/api/admin/reports',auth.owner,async(req,res)=>{
    const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
    const {from,to}=z.object({from:date,to:date}).parse(req.query);
    if(from>to||!Number.isFinite(Date.parse(from))||!Number.isFinite(Date.parse(to))) fail('Rentang tanggal tidak valid.');
    const orders=(await store.list('orders')).filter(x=>x.status==='completed'&&x.payment_status==='paid'&&jakartaDate(x.completed_at)>=from&&jakartaDate(x.completed_at)<=to);
    const days={},hours=Array.from({length:24},(_,hour)=>({hour,count:0})),popular={};
    for(const order of orders) {
      const day=jakartaDate(order.completed_at); days[day]=(days[day]||0)+order.total;
      const hour=Number(new Intl.DateTimeFormat('en-GB',{hour:'2-digit',hourCycle:'h23',timeZone:'Asia/Jakarta'}).format(new Date(order.created_at))); hours[hour].count++;
      for(const item of order.items) {const key=item.menu_id; popular[key]||={name:item.name,quantity:0,revenue:0}; popular[key].quantity+=item.quantity;popular[key].revenue+=item.price*item.quantity;}
    }
    res.json({from,to,revenue:orders.reduce((sum,x)=>sum+x.total,0),order_count:orders.length,average:orders.length?Math.round(orders.reduce((s,x)=>s+x.total,0)/orders.length):0,daily:Object.entries(days).sort().map(([date,revenue])=>({date,revenue})),hours:hours.filter(x=>x.hour>=8&&x.hour<=16),popular:Object.values(popular).sort((a,b)=>b.quantity-a.quantity),orders:orders.map(staffOrder)});
  });
  app.use('/api',(req,res)=>res.status(404).json({message:'Endpoint tidak ditemukan.'}));
  if(existsSync(resolve('dist/index.html'))) {app.use(express.static(resolve('dist')));app.get('/{*path}',(req,res)=>res.sendFile(resolve('dist/index.html')));}
  app.use((error,req,res,next)=>{
    if(error instanceof z.ZodError) return res.status(400).json({message:'Parameter tidak valid.'});
    if(error.type==='entity.parse.failed') return res.status(400).json({message:'Format JSON tidak valid.'});
    const status=error.status||500;
    if(status>=500) console.error(error.message);
    res.status(status).json({message:status>=500?'Layanan sedang bermasalah. Silakan coba kembali.':error.message});
  });
  return app;
}
