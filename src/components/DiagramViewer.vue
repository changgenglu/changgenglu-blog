<template>
  <Teleport to="body">
    <div v-if="open" class="diagram-viewer">
      <div
        ref="dialog"
        class="diagram-viewer__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="diagram-viewer-title"
        tabindex="-1"
      >
        <header class="diagram-viewer__bar">
          <h2 id="diagram-viewer-title" class="diagram-viewer__title">流程圖檢視</h2>
          <span class="diagram-viewer__hint">滾輪縮放、拖曳移動</span>
          <button type="button" class="btn-ghost btn-sm" aria-label="重設縮放" @click="reset">重設</button>
          <button type="button" class="btn-ghost btn-sm" aria-label="關閉" @click="$emit('close')">關閉</button>
        </header>
        <div
          class="diagram-viewer__stage"
          :class="{ 'is-dragging': dragging }"
          @wheel.prevent="onWheel"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="endDrag"
          @pointercancel="endDrag"
        >
          <div class="diagram-viewer__content" :style="contentStyle" v-html="svg"></div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
import { initialView, applyWheelAt, applyDrag } from '@/utils/zoom';

export default {
  name: 'DiagramViewer',
  props: {
    open: { type: Boolean, default: false },
    svg: { type: String, default: '' },
  },
  emits: ['close'],
  data() {
    return {
      view: initialView(),
      dragging: false,
      lastX: 0,
      lastY: 0,
      previousFocus: null,
      previousOverflow: '',
      active: false,
    };
  },
  computed: {
    contentStyle() {
      const { scale, x, y } = this.view;
      return { transform: `translate(${x}px, ${y}px) scale(${scale})` };
    },
  },
  watch: {
    open: {
      immediate: true,
      handler(isOpen) {
        if (isOpen) this.activate();
        else this.deactivate();
      },
    },
  },
  beforeUnmount() {
    this.deactivate();
  },
  methods: {
    activate() {
      this.active = true;
      this.view = initialView();
      this.previousFocus = document.activeElement;
      this.previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', this.onKeydown);
      this.$nextTick(() => this.$refs.dialog?.focus());
    },
    deactivate() {
      document.removeEventListener('keydown', this.onKeydown);
      if (!this.active) return;
      this.active = false;
      document.body.style.overflow = this.previousOverflow;
      this.previousFocus?.focus?.();
      this.previousFocus = null;
      this.dragging = false;
    },
    onKeydown(e) {
      if (e.key === 'Escape') this.$emit('close');
    },
    reset() {
      this.view = initialView();
    },
    onWheel(e) {
      const rect = e.currentTarget.getBoundingClientRect();
      const px = e.clientX - (rect.left + rect.width / 2);
      const py = e.clientY - (rect.top + rect.height / 2);
      this.view = applyWheelAt(this.view, e.deltaY, Number.isFinite(px) ? px : 0, Number.isFinite(py) ? py : 0);
    },
    onPointerDown(e) {
      if (e.button !== 0) return;
      this.dragging = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      // 游標拖出舞台外仍要持續收到 move；部分環境（含 jsdom）沒有此方法
      if (typeof e.target?.setPointerCapture === 'function') {
        try {
          e.target.setPointerCapture(e.pointerId);
        } catch (err) {
          // 無效的 pointerId 時略過，拖曳仍可在舞台內運作
        }
      }
    },
    onPointerMove(e) {
      if (!this.dragging) return;
      this.view = applyDrag(this.view, e.clientX - this.lastX, e.clientY - this.lastY);
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    },
    endDrag() {
      this.dragging = false;
    },
  },
};
</script>

<style scoped>
.diagram-viewer {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  padding: 16px;
  background: rgba(0, 0, 0, 0.6);
}

.diagram-viewer__dialog {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.diagram-viewer__dialog:focus {
  outline: none;
}

.diagram-viewer__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--line);
}

.diagram-viewer__title {
  margin: 0;
  font-size: 1rem;
  color: var(--ink);
}

.diagram-viewer__hint {
  flex: 1;
  color: var(--text-faint);
  font-size: 0.85rem;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 0.85rem;
}

.diagram-viewer__stage {
  flex: 1;
  position: relative;
  min-height: 0;
  overflow: hidden;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.diagram-viewer__stage.is-dragging {
  cursor: grabbing;
}

.diagram-viewer__content {
  position: absolute;
  inset: 0;
  transform-origin: center center;
}

/* 倍率 1 時圖要完整放進舞台（meet）；mermaid 在 svg 上寫了行內 max-width，所以用 !important 蓋過 */
.diagram-viewer__content :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
  max-width: none !important;
  max-height: none !important;
}
</style>
