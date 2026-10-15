<template>
  <footer class="site-footer">
    <div class="grid-paper site-footer-inner">
      <span>powered by: </span>
      <a href="https://github.com/changgenglu">changgenglu</a>
    </div>
  </footer>
</template>

<script>
export default {

}
</script>

<style>
.site-footer {
  border-top: 1px solid var(--line);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 0.85rem;
}

.site-footer-inner {
  padding: 20px 24px;
  text-align: center;
}

.site-footer a {
  color: var(--primary);
}
</style>
