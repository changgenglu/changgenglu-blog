<template>
  <div class="search-container">
    <div class="search-icon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    </div>
    <input
      type="text"
      :value="modelValue"
      @input="onInput"
      :placeholder="placeholder"
      class="search-input"
    >
    <div class="search-glow"></div>
  </div>
</template>

<script>
import { debounce } from 'lodash'; // 引入 lodash.debounce

export default {
  name: 'SearchInput',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: '搜尋全站筆記...'
    },
    debounceTime: {
      type: Number,
      default: 300 // 預設 300ms
    }
  },
  emits: ['update:modelValue', 'search'],
  data() {
    return {
      internalValue: this.modelValue
    };
  },
  watch: {
    modelValue(newValue) {
      this.internalValue = newValue;
    }
  },
  created() {
    // 使用 created 鉤子初始化 debounce 函數
    this.debouncedEmitSearch = debounce(this.emitSearch, this.debounceTime);
  },
  methods: {
    onInput(event) {
      this.internalValue = event.target.value;
      this.$emit('update:modelValue', this.internalValue); // 立即更新 v-model
      this.debouncedEmitSearch(this.internalValue); // 延遲觸發 search 事件
    },
    emitSearch(value) {
      this.$emit('search', value);
    }
  },
  beforeUnmount() {
    // 在組件銷毀前取消任何待處理的 debounce 呼叫
    if (this.debouncedEmitSearch && this.debouncedEmitSearch.cancel) {
      this.debouncedEmitSearch.cancel();
    }
  }
}
</script>

<style scoped>
.search-container {
  position: relative;
  max-width: 600px;
  margin: 0 auto;
}

.search-input {
  width: 100%;
  padding: 16px 20px 16px 50px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 30px;
  color: white;
  font-size: 1.1rem;
  outline: none;
  backdrop-filter: blur(10px);
  transition: all 0.3s;
}

.search-input:focus {
  border-color: var(--accent-cyan);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 15px rgba(0, 242, 255, 0.2);
}

.search-icon {
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: #888;
}

.search-input:focus + .search-glow {
  opacity: 1;
}

.search-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 30px;
  box-shadow: 0 0 20px rgba(0, 242, 255, 0.1);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
}
</style>
