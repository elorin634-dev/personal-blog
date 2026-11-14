<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useSiteStore } from '@/stores/site';

const store = useSiteStore();
const route = useRoute();

const menuOpen = ref(false);
const scrolled = ref(false);

const navItems = [
  { to: '/', label: '主页', exact: true },
  { to: '/projects', label: '项目' },
  { to: '/articles', label: '文章' },
  { to: '/contact', label: '联系' },
];

function isActive(item) {
  return item.exact ? route.path === '/' : route.path.startsWith(item.to);
}

function onScroll() {
  scrolled.value = window.scrollY > 8;
}

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false;
  }
);

onMounted(() => {
  store.load();
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll);
});
</script>

<template>
  <header class="site-header" :class="{ 'is-scrolled': scrolled }">
    <div class="container header-inner">
      <RouterLink to="/" class="brand" aria-label="返回主页">
        <span class="brand-mark" aria-hidden="true"></span>
        <span class="brand-name">{{ store.siteTitle }}</span>
      </RouterLink>

      <nav class="desktop-nav" aria-label="主导航">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          :class="{ 'is-active': isActive(item) }"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <button
        type="button"
        class="menu-toggle"
        :class="{ 'is-open': menuOpen }"
        :aria-expanded="menuOpen"
        aria-controls="mobile-nav"
        aria-label="切换导航菜单"
        @click="menuOpen = !menuOpen"
      >
        <span></span>
        <span></span>
      </button>
    </div>

    <Transition name="nav-drop">
      <nav v-if="menuOpen" id="mobile-nav" class="mobile-nav" aria-label="移动端导航">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="mobile-nav-link"
          :class="{ 'is-active': isActive(item) }"
        >
          <span>{{ item.label }}</span>
          <span class="mobile-nav-arrow" aria-hidden="true">→</span>
        </RouterLink>
      </nav>
    </Transition>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--bg);
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  backdrop-filter: saturate(180%) blur(14px);
  border-bottom: 1px solid transparent;
  transition: border-color 0.25s ease, background 0.25s ease;
}

.site-header.is-scrolled {
  border-bottom-color: var(--line);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 76px;
  gap: 24px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--ink);
  text-decoration: none;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.brand-mark {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  background: var(--ink);
  position: relative;
}

.brand-mark::after {
  content: '';
  position: absolute;
  right: -3px;
  top: -3px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}

.brand-name {
  font-size: 1.05rem;
}

.desktop-nav {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-link {
  position: relative;
  padding: 8px 14px;
  border-radius: 999px;
  color: var(--ink-soft);
  text-decoration: none;
  font-size: 0.94rem;
  transition: color 0.2s ease, background 0.2s ease;
}

.nav-link:hover {
  color: var(--ink);
  background: var(--surface-soft);
}

.nav-link.is-active {
  color: var(--ink);
  font-weight: 600;
}

.nav-link.is-active::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 1px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--accent);
  transform: translateX(-50%);
}

.menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  width: 42px;
  height: 42px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
}

.menu-toggle span {
  display: block;
  height: 1.5px;
  background: var(--ink);
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.menu-toggle.is-open span:first-child {
  transform: translateY(3.75px) rotate(45deg);
}

.menu-toggle.is-open span:last-child {
  transform: translateY(-3.75px) rotate(-45deg);
}

.mobile-nav {
  display: none;
  flex-direction: column;
  padding: 4px 24px 20px;
  border-top: 1px solid var(--line);
  background: var(--bg);
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid var(--line);
  color: var(--ink-soft);
  text-decoration: none;
  font-size: 1.05rem;
}

.mobile-nav-link.is-active {
  color: var(--accent);
  font-weight: 600;
}

.mobile-nav-arrow {
  opacity: 0.5;
}

@media (max-width: 720px) {
  .desktop-nav {
    display: none;
  }

  .menu-toggle,
  .mobile-nav {
    display: flex;
  }

  .header-inner {
    height: 64px;
  }
}

.nav-drop-enter-active,
.nav-drop-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.nav-drop-enter-from,
.nav-drop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
