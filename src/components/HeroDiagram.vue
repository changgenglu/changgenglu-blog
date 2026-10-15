<template>
  <svg class="hero-diagram" viewBox="0 0 240 200" fill="none" stroke="currentColor" stroke-width="1.5"
    stroke-linejoin="round" stroke-linecap="round" aria-hidden="true" focusable="false">
    <!-- 等角筆記本：頂面、左側面、右側面 -->
    <path d="M120 30 L200 70 L120 110 L40 70 Z" fill="var(--primary-soft)" />
    <path d="M40 70 L40 90 L120 130 L120 110" />
    <path d="M200 70 L200 90 L120 130" />
    <!-- 頁緣線 -->
    <path d="M52 82 L120 116 M60 86 L120 116 M188 82 L120 116" stroke-width="1" opacity="0.5" />
    <!-- 頂面文字行 -->
    <path d="M88 62 L130 41 M98 67 L146 43 M108 72 L136 58" stroke="var(--primary)" />
    <!-- 底部卡片堆 -->
    <path d="M60 140 L120 170 L180 140" opacity="0.6" />
    <path d="M60 150 L120 180 L180 150" opacity="0.35" />
    <circle cx="200" cy="40" r="6" fill="var(--accent)" stroke="none" />
  </svg>
</template>

<style scoped>
.hero-diagram {
  display: block;
  width: 100%;
  height: auto;
  color: var(--ink);
}
</style>
