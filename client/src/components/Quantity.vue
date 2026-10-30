<script setup>
import Icon from './Icon.vue';
defineProps({quantity:Number,name:String});defineEmits(['change']);
</script>
<template><div class="quantity"><button type="button" :aria-label="`Kurangi ${name}`" @click="$emit('change',-1)"><Icon name="Minus" :size="14"/></button><span>{{quantity}}</span><button type="button" :aria-label="`Tambah ${name}`" :disabled="quantity>=50" @click="$emit('change',1)"><Icon name="Plus" :size="14"/></button></div></template>
