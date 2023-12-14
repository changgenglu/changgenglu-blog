<template>
  <div class="logoBag">
    <div :class="{ 'w-25 m-auto': isMobile }">
      <router-link to="/">
        <img alt="my logo" src="../assets/profile.jpg" class="myLogo">
        <div class="fs-1">
          Changgenglu
        </div>
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isMobile: false,
    }
  },
  mounted() {
    this.checkDevice();
  },
  methods: {
    checkDevice() {
      if (this.windowSize < 768) {
        this.isMobile = true;
      }
    },
  },
}
</script>

<style>
.myLogo {
  border-radius: 9999px;
  height: 180px;
  width: 180px;
}

.logoBag {
  text-align: center;
  padding-top: 5vh;
  padding-bottom: 2vh;
  background-color: rgb(14, 20, 20);
}

.logoBag a {
  color: #dddddd;
  font-family: Gambarino, serif;
  font-weight: bold;
}
</style>