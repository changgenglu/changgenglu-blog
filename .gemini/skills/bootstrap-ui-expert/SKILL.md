---
name: bootstrap-ui-expert
description: Activates when user requests UI improvements, new component designs, or CSS refactoring using Bootstrap. Do NOT use for Backend logic or non-styling tasks. Examples: "Make this layout responsive", "Create a Bootstrap card for articles", "Improve spacing using utility classes".
---

# Bootstrap UI Expert Skill

## 1. 樣式規範 (Bootstrap 5)

### 1.1 Utility-First 優先
- **MUST**: 優先使用 Bootstrap 內建的 Utility Classes (如 `m-3`, `d-flex`, `justify-content-center`)，減少自定義 CSS。

### 1.2 Grid System
- 嚴格遵守 `container` -> `row` -> `col` 的結構。
- 使用斷點關鍵字 (sm, md, lg, xl, xxl) 確保多裝置相容性。

## 2. Vue 組件整合

### 2.1 組件封裝
- 將常見的 Bootstrap UI 封裝為 Vue 組件，並利用 `props` 傳遞 Class（如 `variant="primary"`）。

### 2.2 動態 Class
- 利用 Vue 的 `:class` 綁定，根據狀態切換 Bootstrap 樣式（如 `:class="{ 'text-danger': hasError }"`)。

## 3. 客製化與擴充

- 若需覆寫 Bootstrap 變數，應使用 SCSS 變數注入。
- 確保自定義樣式不與 Bootstrap 核心類別產生權重衝突。

---

**Confidence Score Check**:
- 大量使用手寫 inline style 或自定義 CSS 卻未先檢查 Bootstrap Utility -> **Warning**.
- RWD 設計未考慮行動優先 (Mobile First) 原則 -> **Warning**.
