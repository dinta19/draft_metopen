<script setup>
import {Leaf,UtensilsCrossed,Coffee,Cookie,ShoppingBag,Plus,Minus,ArrowRight,ArrowUpRight,ArrowLeft,Check,Clock,MapPin,ChevronDown,X,RefreshCw,LogOut,LayoutDashboard,Package,ClipboardList,BarChart3,Settings2,Flame,Trash2,Pencil,Printer,QrCode,AlertCircle,CheckCircle2,Menu,Phone,ExternalLink,Loader,ShieldCheck,Store,ReceiptText,Mail,LockKeyhole,Download,Info} from '@lucide/vue';
defineProps({name:String,size:{type:Number,default:20}});
const icons={Leaf,UtensilsCrossed,Coffee,Cookie,ShoppingBag,Plus,Minus,ArrowRight,ArrowUpRight,ArrowLeft,Check,Clock,MapPin,ChevronDown,X,RefreshCw,LogOut,LayoutDashboard,Package,ClipboardList,BarChart3,Settings2,Flame,Trash2,Pencil,Printer,QrCode,AlertCircle,CheckCircle2,Menu,Phone,ExternalLink,Loader,ShieldCheck,Store,ReceiptText,Mail,LockKeyhole,Download,Info};
</script>
<template><component :is="icons[name]||icons.Leaf" :size="size" :stroke-width="1.7" aria-hidden="true" /></template>
