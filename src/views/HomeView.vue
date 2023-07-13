<template>
  <div class="container">
    <menu-component></menu-component>
  </div>
</template>

<script>
import MenuComponent from '@/components/MenuComponent.vue';

export default {
  components: { MenuComponent },
  name: 'HomeView',

}
</script>

<style>
.container {
  width: 50vw;
}
</style>
