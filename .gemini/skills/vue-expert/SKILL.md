---
name: vue-expert
description: Activates when user requests Vue.js 3 coding, refactoring, or architectural review. Focuses on Composition API, script setup, and Vue 3 best practices. Do NOT use for Vue 2 legacy code unless specifically requested. Examples: 'Create a Vue component', 'Refactor to Composition API', 'Optimize Vue performance'.
---

# Vue.js 3 Expert Skill

## 1. Composition API Standard

### 1.1 Script Setup
- **MUST**: Use `<script setup>` syntax for all new components.
- **Order**: Define imports, props/emits, reactive state, computed, watchers, lifecycle hooks, and functions in this order.

```vue
<script setup>
import { ref, computed, onMounted } from 'vue';
import ChildComponent from './ChildComponent.vue';

// Props & Emits
const props = defineProps<{
  modelValue: string;
  title?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

// State
const isLoading = ref(false);

// Computed
const hasTitle = computed(() => !!props.title);

// Methods
function handleClick() {
  emit('update:modelValue', 'new value');
}

// Lifecycle
onMounted(() => {
  console.log('Component mounted');
});
</script>
```

### 1.2 Reactivity
- **ref vs reactive**: Prefer `ref` for primitives and explicit object replacement. Use `reactive` only for grouped state where object identity matters.
- **Unwrapping**: Be mindful of automatic unwrapping in templates vs `.value` in scripts.

## 2. Component Design

### 2.1 Single Responsibility
- Components should focus on one specific UI capability or logic domain.
- Extract complex logic into Composable functions (`useFeature.js`).

### 2.2 Props & Events
- **Props**: Use typed props (TypeScript or Object syntax). Avoid `any`.
- **Events**: Define typed emits. Use `update:modelValue` for v-model support.

## 3. Performance & Optimization

### 3.1 v-if vs v-show
- Use `v-if` for conditional rendering (lazy).
- Use `v-show` for frequent toggling (CSS display).

### 3.2 List Rendering
- **Key**: Always use a unique primitive `key` in `v-for`. Avoid using index as key if list order changes.

### 3.3 Computed Properties
- Use `computed` for derived state to leverage caching. Avoid complex logic in templates.

## 4. Ecosystem Integration

### 4.1 Vue Router (v4)
- Use `useRouter` and `useRoute` composables inside `<script setup>`.

### 4.2 State Management (Pinia/Vuex 4)
- Prefer **Pinia** for new stores.
- If using Vuex 4, use `useStore` composable.

## 5. Testing (Vitest/Vue Test Utils)
- Test behavior, not implementation details.
- Use `mount` or `shallowMount`.
- Mock external dependencies (API calls, router).

---

**Confidence Score Check**:
- If generated code uses Options API (`export default { data() ... }`) without user request -> **Fail**.
- If `<script setup>` is missing for Vue 3 tasks -> **Fail**.
