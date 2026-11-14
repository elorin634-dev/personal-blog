<script setup>
import SiteHeader from '@/components/SiteHeader.vue';
import SiteFooter from '@/components/SiteFooter.vue';
</script>

<template>
  <div class="app-shell">
    <a class="skip-link" href="#main">跳到主要内容</a>
    <SiteHeader />
    <main id="main" class="site-main">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.site-main {
  flex: 1;
  padding-bottom: 24px;
}
</style>
