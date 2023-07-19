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
}

* {
  /* outline: 2px solid red; */
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


  /* 去背圖片在黑暗模式中因為背景變成黑底色，可能就會造成深色內容被深色背景吃掉的問題，為了避免這個問題，建議 img 的背景一律調成跟正常模式的背景色 */
  img {
    background: #fff;
  }
}
</style>
