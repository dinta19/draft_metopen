-- Jalankan sekali pada proyek Supabase baru melalui SQL Editor.
-- Semua akses aplikasi melewati backend Node.js; tidak ada akses tabel langsung dari browser.
begin;

create table public.staff_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 100),
  role text not null check (role in ('owner','cashier')),
  active boolean not null default true
);
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('makanan','minuman','camilan')),
  description text not null default '',
  price integer not null check (price between 100 and 10000000),
  image_url text not null default '',
  best_seller boolean not null default false,
  spicy boolean not null default false,
  calories integer check (calories between 0 and 10000),
  available boolean not null default true,
  deleted boolean not null default false
);
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  request_key uuid not null unique,
  tracking_token text not null check (tracking_token ~ '^[a-f0-9]{64}$'),
  customer_name text not null,
  whatsapp text not null,
  order_type text not null check (order_type in ('dine_in','takeaway')),
  table_number integer,
  payment_method text not null check (payment_method in ('qris','transfer')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid')),
  status text not null default 'received' check (status in ('received','processing','ready','completed')),
  items jsonb not null check (jsonb_typeof(items)='array' and jsonb_array_length(items)>0),
  total bigint not null check (total>0),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_by uuid references public.staff_profiles(id) on delete set null,
  check ((order_type='dine_in' and table_number is not null and table_number between 1 and 50) or (order_type='takeaway' and table_number is null)),
  check (status <> 'completed' or (payment_status='paid' and completed_at is not null))
);
create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null check (unit in ('kg','gram','liter','ml','pcs','pack')),
  stock numeric(12,3) not null check (stock between 0 and 1000000),
  minimum numeric(12,3) not null check (minimum between 0 and 1000000),
  deleted boolean not null default false
);
create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ingredients(id),
  ingredient_name text not null,
  unit text not null,
  "before" numeric(12,3) not null,
  "after" numeric(12,3) not null,
  delta numeric(12,3) not null,
  reason text not null,
  actor_name text not null,
  created_at timestamptz not null default now()
);
create index orders_created_at_idx on public.orders(created_at desc);
create index orders_completed_at_idx on public.orders(completed_at desc) where status='completed' and payment_status='paid';
create index stock_movements_ingredient_idx on public.stock_movements(ingredient_id,created_at desc);
create index stock_movements_created_at_idx on public.stock_movements(created_at desc);

alter table public.staff_profiles enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.ingredients enable row level security;
alter table public.stock_movements enable row level security;
-- Tidak ada policy anon/authenticated: backend memverifikasi sesi dan peran.
revoke all on table public.staff_profiles,public.menu_items,public.orders,public.ingredients,public.stock_movements from anon,authenticated;
grant select,insert,update,delete on table public.staff_profiles,public.menu_items,public.orders,public.ingredients,public.stock_movements to service_role;

create function public.place_order(p_input jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  existing public.orders;
  result public.orders;
  menu public.menu_items;
  item jsonb;
  lines jsonb := '[]'::jsonb;
  amount bigint := 0;
  qty integer;
begin
  -- Permintaan bersamaan dengan request_key sama harus menghasilkan satu pesanan.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_input->>'request_key',0));
  select * into existing from public.orders where request_key=(p_input->>'request_key')::uuid;
  if found then
    if existing.tracking_token <> p_input->>'tracking_token' then raise exception 'Kunci permintaan sudah digunakan.'; end if;
    return to_jsonb(existing);
  end if;
  if jsonb_typeof(p_input->'items')<>'array' or jsonb_array_length(p_input->'items') not between 1 and 40 then raise exception 'Pesanan tidak valid.'; end if;
  -- Urutkan penguncian menu agar pesanan dengan susunan item berbeda tidak deadlock.
  for item in select value from jsonb_array_elements(p_input->'items') order by value->>'menu_id' loop
    select * into menu from public.menu_items where id=(item->>'menu_id')::uuid and not deleted for share;
    if not found or not menu.available then raise exception 'Ada menu yang sudah habis atau tidak tersedia. Perbarui katalog.'; end if;
    qty := (item->>'quantity')::integer;
    if qty not between 1 and 50 then raise exception 'Jumlah menu tidak valid.'; end if;
    lines := lines || jsonb_build_array(jsonb_build_object('menu_id',menu.id,'name',menu.name,'price',menu.price,'quantity',qty,'note',coalesce(item->>'note','')));
    amount := amount + menu.price::bigint * qty;
  end loop;
  insert into public.orders(code,request_key,tracking_token,customer_name,whatsapp,order_type,table_number,payment_method,items,total)
  values('TT-'||to_char(now() at time zone 'Asia/Jakarta','YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
    (p_input->>'request_key')::uuid,p_input->>'tracking_token',p_input->>'customer_name',p_input->>'whatsapp',p_input->>'order_type',
    case when p_input->>'order_type'='dine_in' then (p_input->>'table_number')::integer else null end,p_input->>'payment_method',lines,amount)
    returning * into result;
  -- Sengaja tidak mengubah stok bahan baku: sesuai batasan penelitian.
  return to_jsonb(result);
end;
$$;

create function public.change_order(p_id uuid,p_input jsonb,p_actor uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  result public.orders;
  ordered_stages text[] := array['received','processing','ready','completed'];
  new_status text;
  new_payment text;
begin
  if not exists(select 1 from public.staff_profiles where id=p_actor and active and role in ('owner','cashier')) then raise exception 'Akses staf ditolak.'; end if;
  select * into result from public.orders where id=p_id for update;
  if not found then raise exception 'Pesanan tidak ditemukan.'; end if;
  if result.version<>(p_input->>'version')::integer then raise exception 'Pesanan telah diperbarui staf lain. Muat ulang detail.'; end if;
  new_payment := coalesce(p_input->>'payment_status',result.payment_status);
  new_status := coalesce(p_input->>'status',result.status);
  if p_input ? 'payment_status' and new_payment<>'paid' then raise exception 'Status pembayaran tidak valid.'; end if;
  if p_input ? 'status' then
    if array_position(ordered_stages,new_status) is null or array_position(ordered_stages,new_status)<>array_position(ordered_stages,result.status)+1 then raise exception 'Status pesanan harus diperbarui secara berurutan.'; end if;
    if new_payment<>'paid' then raise exception 'Verifikasi pembayaran sebelum memproses pesanan.'; end if;
  end if;
  update public.orders set status=new_status,payment_status=new_payment,version=version+1,updated_by=p_actor,
    completed_at=case when new_status='completed' then now() else completed_at end
    where id=p_id returning * into result;
  return to_jsonb(result);
end;
$$;

create function public.create_ingredient(p_input jsonb,p_actor uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare result public.ingredients; actor text;
begin
  select name into actor from public.staff_profiles where id=p_actor and active and role='owner';
  if not found then raise exception 'Akses hanya untuk owner.'; end if;
  insert into public.ingredients(id,name,unit,stock,minimum)
    values((p_input->>'id')::uuid,p_input->>'name',p_input->>'unit',(p_input->>'stock')::numeric,(p_input->>'minimum')::numeric) returning * into result;
  insert into public.stock_movements(ingredient_id,ingredient_name,unit,"before","after",delta,reason,actor_name)
    values(result.id,result.name,result.unit,0,result.stock,result.stock,'Stok awal',actor);
  return to_jsonb(result);
end;
$$;

create function public.adjust_stock(p_id uuid,p_input jsonb,p_actor uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare result public.ingredients; actor text; new_stock numeric(12,3); qty numeric(12,3);
begin
  select name into actor from public.staff_profiles where id=p_actor and active and role in ('owner','cashier');
  if not found then raise exception 'Akses staf ditolak.'; end if;
  select * into result from public.ingredients where id=p_id and not deleted for update;
  if not found then raise exception 'Bahan tidak ditemukan.'; end if;
  qty := (p_input->>'quantity')::numeric;
  if qty is null or qty<0 or qty>1000000 or char_length(trim(p_input->>'reason'))<3 then raise exception 'Jumlah atau alasan perubahan tidak valid.'; end if;
  case p_input->>'operation'
    when 'set' then new_stock:=qty;
    when 'add' then new_stock:=result.stock+qty;
    when 'subtract' then new_stock:=result.stock-qty;
    else raise exception 'Jenis perubahan stok tidak valid.';
  end case;
  if new_stock<0 or new_stock>1000000 then raise exception 'Stok harus berada di antara 0 dan 1000000.'; end if;
  insert into public.stock_movements(ingredient_id,ingredient_name,unit,"before","after",delta,reason,actor_name)
    values(result.id,result.name,result.unit,result.stock,new_stock,new_stock-result.stock,p_input->>'reason',actor);
  update public.ingredients set stock=new_stock where id=p_id returning * into result;
  return to_jsonb(result);
end;
$$;

revoke all on function public.place_order(jsonb),public.change_order(uuid,jsonb,uuid),public.create_ingredient(jsonb,uuid),public.adjust_stock(uuid,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.place_order(jsonb),public.change_order(uuid,jsonb,uuid),public.create_ingredient(jsonb,uuid),public.adjust_stock(uuid,jsonb,uuid) to service_role;
commit;
