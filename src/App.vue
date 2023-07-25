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
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  position: relative;
  min-height: 88vh;
}

/* *{outline: 2px solid;} */

.content {
  padding-bottom: 10px;
}

.footer {
  position: absolute;
  bottom: -70px;
}

@media (prefers-color-scheme: dark) {
  html {
    filter: invert(90%) hue-rotate(180deg);
  }

  img,
  video,
  svg,
  code[class*="language-"] {
    filter: invert(110%) hue-rotate(180deg);
  }

  img {
    background: #fff;
  }
}
</style>
