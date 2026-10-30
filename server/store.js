import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { createSeed } from './seed.js';

export function fail(message, status = 400) { const error = new Error(message); error.status = status; throw error; }
export const stages = ['received', 'processing', 'ready', 'completed'];

export async function createStore(mode) {
  if (mode === 'supabase') return createSupabaseStore();
  const path = resolve(process.env.DEMO_DATA_FILE || '.data/demo.json');
  await mkdir(dirname(path), { recursive: true });
  let state;
  try { state = JSON.parse(await readFile(path, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; state = createSeed(); await writeFile(path, JSON.stringify(state, null, 2)); }
  let queue = Promise.resolve();
  const transact = (fn) => {
    const operation = queue.then(async () => {
      const draft = structuredClone(state);
      const value = fn(draft);
      await writeFile(`${path}.tmp`, JSON.stringify(draft, null, 2));
      await rename(`${path}.tmp`, path);
      state = draft;
      return structuredClone(value);
    });
    queue = operation.catch(() => {});
    return operation;
  };
  return {
    list: async (table) => structuredClone(state[table]),
    update: (table,id,patch) => transact(s => {const row=s[table].find(x=>x.id===id); if(!row) fail('Data tidak ditemukan.',404); Object.assign(row,patch); return row;}),
    save: (table, row) => transact(s => {
      const i = s[table].findIndex(x => x.id === row.id);
      if (i < 0) { s[table].push(row); return row; }
      s[table][i] = {...s[table][i], ...row}; return s[table][i];
    }),
    createOrder: input => transact(s => {
      const duplicate = s.orders.find(x => x.request_key === input.request_key);
      if (duplicate) {
        if (duplicate.tracking_token !== input.tracking_token) fail('Kunci permintaan sudah digunakan.',409);
        return duplicate;
      }
      const items = input.items.map(item => {
        const menu = s.menu.find(m => m.id === item.menu_id && !m.deleted);
        if (!menu?.available) fail('Ada menu yang sudah habis atau tidak tersedia. Perbarui katalog.',409);
        return {menu_id:menu.id,name:menu.name,price:menu.price,quantity:item.quantity,note:item.note};
      });
      const day = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()).replaceAll('-','');
      const order = { ...input, id:randomUUID(), code:`TT-${day}-${randomUUID().slice(0,8).toUpperCase()}`, items, total:items.reduce((n,x)=>n+x.price*x.quantity,0), status:'received', payment_status:'unpaid', version:1, created_at:new Date().toISOString() };
      s.orders.push(order); return order;
    }),
    changeOrder: (id, input, actor) => transact(s => {
      const order = s.orders.find(x=>x.id===id);
      if (!order) fail('Pesanan tidak ditemukan.',404);
      if (order.version !== input.version) fail('Pesanan telah diperbarui staf lain. Muat ulang detail.',409);
      if (input.payment_status) order.payment_status = input.payment_status;
      if (input.status) {
        if (stages.indexOf(input.status) !== stages.indexOf(order.status)+1) fail('Status pesanan harus diperbarui secara berurutan.',409);
        if (order.payment_status !== 'paid') fail('Verifikasi pembayaran sebelum memproses pesanan.',409);
        order.status=input.status;
        if (input.status==='completed') order.completed_at=new Date().toISOString();
      }
      order.updated_by=actor.id; order.version++; return order;
    }),
    createIngredient: (row, actor) => transact(s => {
      s.ingredients.push(row);
      s.movements.push({id:randomUUID(),ingredient_id:row.id,ingredient_name:row.name,unit:row.unit,before:0,after:row.stock,delta:row.stock,reason:'Stok awal',actor_name:actor.name,created_at:new Date().toISOString()});
      return row;
    }),
    adjustStock: (id,input,actor) => transact(s => {
      const item=s.ingredients.find(x=>x.id===id && !x.deleted);
      if (!item) fail('Bahan tidak ditemukan.',404);
      const before=item.stock;
      const after=Number((input.operation==='set' ? input.quantity : before+(input.operation==='add'?input.quantity:-input.quantity)).toFixed(3));
      if (after<0 || after>1000000) fail('Stok harus berada di antara 0 dan 1000000.',409);
      item.stock=after;
      s.movements.push({id:randomUUID(),ingredient_id:id,ingredient_name:item.name,unit:item.unit,before,after,delta:Number((after-before).toFixed(3)),reason:input.reason,actor_name:actor.name,created_at:new Date().toISOString()});
      return item;
    }),
  };
}

function createSupabaseStore() {
  const url=process.env.SUPABASE_URL, key=process.env.SUPABASE_SECRET_KEY;
  if (!url || !key || !process.env.SUPABASE_PUBLISHABLE_KEY) throw new Error('Lengkapi SUPABASE_URL, SUPABASE_SECRET_KEY, dan SUPABASE_PUBLISHABLE_KEY.');
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const names={menu:'menu_items',orders:'orders',ingredients:'ingredients',movements:'stock_movements'};
  const unwrap=({data,error})=> {if(error) {console.error('Database:',error.code); fail(error.code==='P0001'?error.message:'Operasi database gagal. Silakan coba lagi.',error.code==='P0001'?409:503);} return data;};
  return {
    db,
    update: async (table,id,patch) => unwrap(await db.from(names[table]).update(patch).eq('id',id).select().single()),
    // Paginate to avoid the default Supabase 1000-row response cap.
    list: async table => {const all=[]; for(let offset=0;;offset+=1000) {const rows=unwrap(await db.from(names[table]).select('*').order('id').range(offset,offset+999)); all.push(...rows); if(rows.length<1000) return all;}},
    save: async (table,row) => unwrap(await db.from(names[table]).upsert(row).select().single()),
    createOrder: async input => unwrap(await db.rpc('place_order',{p_input:input})),
    changeOrder: async (id,input,actor) => unwrap(await db.rpc('change_order',{p_id:id,p_input:input,p_actor:actor.id})),
    createIngredient: async (row,actor) => unwrap(await db.rpc('create_ingredient',{p_input:row,p_actor:actor.id})),
    adjustStock: async (id,input,actor) => unwrap(await db.rpc('adjust_stock',{p_id:id,p_input:input,p_actor:actor.id})),
  };
}
