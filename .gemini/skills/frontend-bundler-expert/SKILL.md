---
name: frontend-bundler-expert
description: Activates when user requests build optimization, Webpack/Vite configuration changes, or build debugging. Do NOT use for Simple CSS/HTML changes. Examples: "Optimize bundle size", "Configure a new loader in vue.config.js", "Setup chunk splitting".
---

# Frontend Bundler Expert Skill

## 1. Webpack & Vue CLI 規範 (專案現狀)

### 1.1 `vue.config.js` 管理
- **MUST**: 優先使用 `chainWebpack` 進行細粒度配置，而非直接覆寫 `configureWebpack`（除非必要）。
- **Public Path**: 部署於子目錄時（如 GitHub Pages），務必確認 `publicPath` 設定正確。

### 1.2 Loader 配置
- 處理非 JS 資源（如 `.md`）時，需確保對應的 Loader 已安裝並在 Webpack 中正確註冊。

## 2. 效能優化策略

### 2.1 Bundle Analysis
- 建議使用 `webpack-bundle-analyzer` 來識別體積過大的依賴。

### 2.2 Chunk Splitting
- 利用 `optimization.splitChunks` 將大型第三方套件（如 Bootstrap, Highlight.js）拆分為獨立的 vendor chunk，提升快取利用率。

### 2.3 Tree Shaking
- 確保引入庫時使用 ESM 格式，並在 `package.json` 中標註 `sideEffects`。

## 3. 故障排除 (Build Debugging)

- 當建置失敗時，優先檢查：
    1. `node_modules` 是否損壞。
    2. 套件版本相容性（特別是 Vue 3 與其配套插件）。
    3. `process.env` 環境變數是否注入。

---

**Confidence Score Check**:
- 若在未確認現有建置工具（Webpack/Vite）的情況下直接修改設定 -> **Fail**.
- 建議修改設定後未提醒執行 `npm run build` 驗證 -> **Warning**.
