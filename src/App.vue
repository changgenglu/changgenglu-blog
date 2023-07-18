<template>
  <logo-component></logo-component>
  <router-view />
  <footer-component></footer-component>
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
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
</style>
