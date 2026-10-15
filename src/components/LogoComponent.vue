<template>
  <header class="site-header">
    <div class="grid-paper site-header-inner" :class="{ 'is-mobile': isMobile }">
      <router-link to="/" class="brand">
        <img alt="my logo" src="../assets/profile.jpg" class="myLogo">
        <span class="site-title">Changgenglu</span>
      </router-link>
      <ThemeToggle />
    </div>
  </header>
</template>

<script>
import ThemeToggle from '@/components/ThemeToggle.vue';

export default {
  components: { ThemeToggle },
  data() {
    return {
      isMobile: false,
    }
  },
  mounted() {
    this.checkDevice();
    window.addEventListener('resize', this.checkDevice); // Add listener
  },
  beforeUnmount() { // Add unmount hook
    window.removeEventListener('resize', this.checkDevice);
  },
  methods: {
    checkDevice() {
      this.isMobile = window.innerWidth < 768; // Fix bug
    },
  },
}
</script>

<style>
.site-header {
  border-bottom: 1px solid var(--line);
  background-color: var(--bg);
}

.site-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
}

.site-header-inner.is-mobile {
  padding: 10px 16px;
}

.site-header .brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--ink);
  text-decoration: none;
}

.myLogo {
  border-radius: 9999px;
  height: 36px;
  width: 36px;
  object-fit: cover;
}

.site-title {
  font-family: var(--font-mono);
  font-weight: 500;
  font-size: 0.95rem;
  letter-spacing: 0.02em;
}
</style>
