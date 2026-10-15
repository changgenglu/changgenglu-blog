<template>
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
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  color: var(--text);
}

.content {
  flex: 1 0 auto;
  padding-bottom: 10px;
}
</style>
