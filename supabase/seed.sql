-- OPSIONAL: data contoh untuk peninjauan, bukan data resmi Taman Teras Cafe.
-- Dapat dijalankan ulang tanpa menimpa menu/stok yang sudah ada.
begin;
insert into public.menu_items (id,name,category,price,description,image_url,best_seller,spicy,calories,available,deleted) values
('00000000-0000-4000-8000-000000000001','Nasi Ayam Geprek','makanan',22000,'Ayam renyah, sambal geprek, nasi hangat, dan lalapan.','/images/geprek.jpg',true,true,650,true,false),
('00000000-0000-4000-8000-000000000002','Nasi Ayam Lalapan','makanan',24000,'Ayam goreng dengan sambal terasi dan lalapan segar.','/images/lalapan.jpg',true,false,620,true,false),
('00000000-0000-4000-8000-000000000003','Nasi Goreng Teras','makanan',20000,'Nasi goreng rumahan dengan telur dan sayuran.','/images/nasigoreng.jpg',true,false,540,true,false),
('00000000-0000-4000-8000-000000000004','Mie Goreng Spesial','makanan',18000,'Mie goreng gurih dengan telur, sayur, dan taburan bawang.','/images/mie.jpg',false,false,480,true,false),
('00000000-0000-4000-8000-000000000005','Chicken Rice Bowl','makanan',25000,'Potongan ayam berbumbu dengan nasi dan salad segar.','/images/ricebowl.jpg',false,false,580,true,false),
('00000000-0000-4000-8000-000000000006','Nasi Telur Sambal','makanan',15000,'Telur ceplok dan sambal rumahan di atas nasi hangat.','/images/telur.jpg',false,true,420,true,false),
('00000000-0000-4000-8000-000000000007','Es Kopi Susu Teras','minuman',18000,'Kopi, susu segar, dan gula aren. Teman jeda favoritmu.','/images/kopi.jpg',true,false,180,true,false),
('00000000-0000-4000-8000-000000000008','Iced Americano','minuman',15000,'Espresso dan air dingin untuk rasa kopi yang bersih.','/images/americano.jpg',false,false,10,true,false),
('00000000-0000-4000-8000-000000000009','Matcha Latte','minuman',22000,'Matcha lembut berpadu susu segar, disajikan dingin.','/images/matcha.jpg',true,false,210,true,false),
('00000000-0000-4000-8000-000000000010','Chocolate Latte','minuman',20000,'Cokelat pekat dan susu yang lembut.','/images/chocolate.jpg',false,false,240,true,false),
('00000000-0000-4000-8000-000000000011','Lemon Tea','minuman',12000,'Teh segar dengan perasan lemon dan es batu.','/images/tea.jpg',false,false,80,true,false),
('00000000-0000-4000-8000-000000000012','Es Teh Manis','minuman',8000,'Teh melati manis, sederhana dan menyegarkan.','/images/esteh.jpg',false,false,70,true,false),
('00000000-0000-4000-8000-000000000013','Kentang Goreng','camilan',15000,'Kentang goreng keemasan dengan saus pendamping.','/images/fries.jpg',false,false,320,true,false),
('00000000-0000-4000-8000-000000000014','Pisang Cokelat','camilan',16000,'Pisang hangat dengan cokelat dan taburan keju.','/images/banana.jpg',false,false,350,true,false),
('00000000-0000-4000-8000-000000000015','Roti Bakar','camilan',14000,'Roti panggang dengan isian cokelat susu.','/images/toast.jpg',false,false,290,true,false),
('00000000-0000-4000-8000-000000000016','Cireng Rujak','camilan',12000,'Cireng renyah di luar dengan sambal rujak.','/images/cireng.jpg',false,true,250,false,false)
on conflict (id) do nothing;
with initial as (
insert into public.ingredients(id,name,unit,stock,minimum) values
('10000000-0000-4000-8000-000000000001','Beras','kg',12,3),
('10000000-0000-4000-8000-000000000002','Daging ayam','kg',2,3),
('10000000-0000-4000-8000-000000000003','Biji kopi','kg',3,1),
('10000000-0000-4000-8000-000000000004','Susu segar','liter',2,4),
('10000000-0000-4000-8000-000000000005','Telur','pcs',30,10),
('10000000-0000-4000-8000-000000000006','Minyak goreng','liter',5,2),
('10000000-0000-4000-8000-000000000007','Gula aren','kg',2,1)
on conflict (id) do nothing returning *
) insert into public.stock_movements(ingredient_id,ingredient_name,unit,"before","after",delta,reason,actor_name)
select id,name,unit,0,stock,stock,'Stok awal data contoh','Sistem contoh' from initial;
commit;
