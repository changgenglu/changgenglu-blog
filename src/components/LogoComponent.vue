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