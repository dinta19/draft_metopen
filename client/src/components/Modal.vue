<script setup>
import {onMounted,ref} from 'vue';
import Icon from './Icon.vue';
defineProps({title:String,wide:Boolean});const emit=defineEmits(['close']);const dialog=ref(null);
onMounted(()=>dialog.value.showModal());
</script>
<template><dialog ref="dialog" :class="['modal',{wide}]" aria-labelledby="modal-title" @close="emit('close')" @click="e=>{if(e.target===dialog)emit('close')}"><div class="modal-heading"><h2 id="modal-title">{{title}}</h2><button type="button" class="icon-button" aria-label="Tutup dialog" @click="emit('close')"><Icon name="X"/></button></div><slot/></dialog></template>
