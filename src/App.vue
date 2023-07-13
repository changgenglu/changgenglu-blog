<template>
  <logo-component></logo-component>
  <router-view />
</template>

<script>
import LogoComponent from './components/LogoComponent.vue';

export default {
  components: { LogoComponent }
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
