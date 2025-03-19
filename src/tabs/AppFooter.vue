<template>
  <v-footer app>
    <slot>
      <div class="px-4 py-2 text-center w-100" style="padding: 0.1rem!important">
        <span class="text-caption">Sozdik.kz &copy; {{ new Date().getFullYear() }}</span>
      </div>
    </slot>
  </v-footer>
</template>

<script setup>
// No props or imports needed for this simple component
</script> 