<template>
  <div class="ai-grid-bg"></div>
  <div class="content">
    <logo-component></logo-component>
    <router-view />
  </div>
  <footer-component class="footer"></footer-component>
</template>

<script>
import FooterComponent from './components/FooterComponent.vue';
import LogoComponent from './components/LogoComponent.vue';


export default {
  components: { LogoComponent, FooterComponent }
}
</script>

<style>
html,
body {
  background-color: var(--bg-main);
  margin: 0;
  padding: 0;
}


#app {
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #dddddd;
  position: relative;
  min-height: 100vh;
}

.content {
  padding-bottom: 10px;
}

.footer {
  background-color: rgba(14, 20, 20, 0.8);
  backdrop-filter: var(--glass-blur);
  position: absolute;
  bottom: -70px;
  width: 100%;
  z-index: 999;
}

</style>
