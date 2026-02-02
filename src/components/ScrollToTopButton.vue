<template>
  <div v-if="showButton" class="scroll-to-top-button" @click="scrollToTop">
    <i class="fa fa-arrow-up"></i>
  </div>
</template>

<script>
export default {
  data() {
    return {
      showButton: false,
    };
  },
  methods: {
    handleScroll() {
      const windowHeight = window.innerHeight;
      const footerHeight = 70;
      const buttonOffset = 30;

      this.showButton = window.scrollY > windowHeight - footerHeight - buttonOffset;
    },
    scrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    },
  },
  mounted() {
    window.addEventListener('scroll', this.handleScroll);
  },
  beforeUnmount() { // Corrected from beforeMount
    window.removeEventListener('scroll', this.handleScroll);
  },
};
</script>

<style>
/* Customize the appearance of the scroll-to-top button */
.scroll-to-top-button {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 50px;
  height: 50px;
  border: 2px solid #198754;
  /* background-color: #198754; */
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.3s ease-in-out;
  z-index: 9999;
}

.scroll-to-top-button i {
  color: #198754;
  /* You can customize the arrow icon color here */
}
</style>
