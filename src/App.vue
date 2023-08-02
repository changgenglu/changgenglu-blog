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
html,
body {
  background-color: rgb(17, 28, 29);
}


#app {
  font-family: Supreme, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: rgb(17, 28, 29);
  color: #dddddd;
  position: relative;
  min-height: 92.85vh;
}

.content {
  padding-bottom: 10px;
}

.footer {
  background-color: rgb(14, 20, 20);
  position: absolute;
  bottom: -70px;
  z-index: 999;
}

/* @media (prefers-color-scheme: dark) {
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
} */</style>
