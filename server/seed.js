import { randomUUID } from 'node:crypto';

// Seluruh menu, harga, dan bahan awal adalah data contoh, bukan data resmi cafe.
export const sampleMenu = [
  ['Nasi Ayam Geprek', 'makanan', 22000, 'Ayam renyah, sambal geprek, nasi hangat, dan lalapan.', 'geprek', true, true, 650],
  ['Nasi Ayam Lalapan', 'makanan', 24000, 'Ayam goreng dengan sambal terasi dan lalapan segar.', 'lalapan', true, false, 620],
  ['Nasi Goreng Teras', 'makanan', 20000, 'Nasi goreng rumahan dengan telur dan sayuran.', 'nasigoreng', true, false, 540],
  ['Mie Goreng Spesial', 'makanan', 18000, 'Mie goreng gurih dengan telur, sayur, dan taburan bawang.', 'mie', false, false, 480],
  ['Chicken Rice Bowl', 'makanan', 25000, 'Potongan ayam berbumbu dengan nasi dan salad segar.', 'ricebowl', false, false, 580],
  ['Nasi Telur Sambal', 'makanan', 15000, 'Telur ceplok dan sambal rumahan di atas nasi hangat.', 'telur', false, true, 420],
  ['Es Kopi Susu Teras', 'minuman', 18000, 'Kopi, susu segar, dan gula aren. Teman jeda favoritmu.', 'kopi', true, false, 180],
  ['Iced Americano', 'minuman', 15000, 'Espresso dan air dingin untuk rasa kopi yang bersih.', 'americano', false, false, 10],
  ['Matcha Latte', 'minuman', 22000, 'Matcha lembut berpadu susu segar, disajikan dingin.', 'matcha', true, false, 210],
  ['Chocolate Latte', 'minuman', 20000, 'Cokelat pekat dan susu yang lembut.', 'chocolate', false, false, 240],
  ['Lemon Tea', 'minuman', 12000, 'Teh segar dengan perasan lemon dan es batu.', 'tea', false, false, 80],
  ['Es Teh Manis', 'minuman', 8000, 'Teh melati manis, sederhana dan menyegarkan.', 'esteh', false, false, 70],
  ['Kentang Goreng', 'camilan', 15000, 'Kentang goreng keemasan dengan saus pendamping.', 'fries', false, false, 320],
  ['Pisang Cokelat', 'camilan', 16000, 'Pisang hangat dengan cokelat dan taburan keju.', 'banana', false, false, 350],
  ['Roti Bakar', 'camilan', 14000, 'Roti panggang dengan isian cokelat susu.', 'toast', false, false, 290],
  ['Cireng Rujak', 'camilan', 12000, 'Cireng renyah di luar dengan sambal rujak.', 'cireng', false, true, 250],
].map(([name, category, price, description, image, best_seller, spicy, calories], i) => ({
  id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
  name, category, price, description, image_url: `/images/${image}.jpg`, best_seller, spicy,
  calories, available: image !== 'cireng', deleted: false,
}));

export function createSeed() {
  const ingredients = [['Beras','kg',12,3],['Daging ayam','kg',2,3],['Biji kopi','kg',3,1],['Susu segar','liter',2,4],['Telur','pcs',30,10],['Minyak goreng','liter',5,2],['Gula aren','kg',2,1]]
    .map(([name,unit,stock,minimum]) => ({id:randomUUID(),name,unit,stock,minimum,deleted:false}));
  return { menu: structuredClone(sampleMenu), orders: [], ingredients, movements: ingredients.map(item => ({id:randomUUID(),ingredient_id:item.id,ingredient_name:item.name,unit:item.unit,before:0,after:item.stock,delta:item.stock,reason:'Stok awal data contoh',actor_name:'Sistem demo',created_at:new Date().toISOString()})) };
}
