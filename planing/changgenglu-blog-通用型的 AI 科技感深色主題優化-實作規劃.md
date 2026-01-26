# changgenglu-blog - 通用型的 AI 科技感深色主題優化 - 實作規劃

## 版本記錄

| 版本 | 更新時間 | 變更摘要 |
|------|---------|----------|
| v1.0 | 2026-01-26 | 初次規劃：定義 AI 科技感視覺規範與組件重構 |

---

## 1. 需求概述

### 1.1 背景與目標
- **需求背景**：目前部落格採用基礎深色背景，缺乏現代科技感與品牌記憶點。
- **功能目標**：引入「AI 科技感」設計語言，提升視覺層次與使用者閱讀體驗。
- **影響範圍**：全站視覺（Global Styles）、首頁（HomeView）、文章卡片（ArticleCard）、文章內容頁（MarkdownComponent）。

### 1.2 範圍界定
- **包含**：設計系統定義（色盤、字體、間距）、全站背景模式、組件樣式更新、微互動動畫（Micro-interactions）。
- **不包含**：暗黑/亮色切換功能（本次僅針對 Dark Theme 優化）、複雜的 WebGL 背景。
- **假設條件**：使用者瀏覽器支援 CSS Custom Properties (Variables) 與 Backdrop-filter。

---

## 2. 系統架構變更

### 2.1 資料庫變更
- **N/A** (視覺重構不涉及資料庫變更)

### 2.2 設定變更
| 設定檔 | 變更內容 | 說明 |
|-------|---------|-----|
| `src/main.js` | 引入全站主題 CSS | 統一管理視覺變數 |

### 2.3 程式碼結構
#### 新增檔案
| 檔案路徑 | 類型 | 職責說明 |
|---------|-----|---------|
| `src/assets/styles/theme.css` | CSS | 定義 Design Tokens (Colors, Typography, Effects) |
| `src/assets/styles/patterns.css` | CSS | 定義科技感背景模式（Grid/Dots） |

#### 修改檔案
| 檔案路徑 | 修改內容摘要 |
|---------|-------------|
| `src/App.vue` | 調整 Body 背景與全站字體設定 |
| `src/components/ArticleCard.vue` | 重構為 Glassmorphism 風格並加入 Glow 效果 |
| `src/views/HomeView.vue` | 優化搜尋框與分類卡片樣式 |

---

## 3. API 規格設計
- **N/A** (本任務為前端 UI 重構)

---

## 4. 實作細節

### 4.1 實作任務清單
| # | 任務 | 依賴 |
|---|-----|-----|
| 1 | 建立 `theme.css` 並定義 CSS 變數 | - |
| 2 | 在 `App.vue` 實作網格背景底層（Grid Backdrop） | 1 |
| 3 | 重構 `ArticleCard.vue`：改用玻璃擬態與線性漸層邊框 | 1 |
| 4 | 更新 `HomeView.vue` 搜尋框與導航元素樣式 | 3 |
| 5 | 優化文章內容（MarkdownComponent）的排版與語法高亮 | - |

### 4.2 關鍵邏輯

#### CSS Design Tokens (`theme.css`)
```css
:root {
  /* Colors - Cyber Dark */
  --bg-main: #050505;
  --bg-surface: rgba(255, 255, 255, 0.03);
  --accent-cyan: #00f2ff;
  --accent-purple: #7000ff;
  --border-glow: rgba(0, 242, 255, 0.2);
  
  /* Glassmorphism */
  --glass-blur: blur(12px);
  --glass-border: rgba(255, 255, 255, 0.1);
  
  /* Typography */
  --font-sans: 'Inter', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

#### 背景網格模式 (`patterns.css`)
```css
.ai-grid-bg {
  background-image: 
    linear-gradient(rgba(0, 242, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 242, 255, 0.05) 1px, transparent 1px);
  background-size: 40px 40px;
  background-position: center;
}
```

#### ArticleCard 懸停發光效果
```css
.card-glass {
  background: var(--bg-surface);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-glass:hover {
  border-color: var(--accent-cyan);
  box-shadow: 0 0 20px var(--border-glow);
  transform: translateY(-5px);
}
```

### 4.3 錯誤處理設計
- **CSS 回退（Fallback）**：若瀏覽器不支援 `backdrop-filter`，則回退至不透明的 `--bg-surface`。
- **效能優化**：網格背景使用 `will-change: transform` 或固定背景避免滾動重繪效能下降。

### 4.4 Design Patterns
| Pattern | 用途 | 應用位置 |
|---------|-----|---------|
| Utility-First | 快速調整佈局 | Bootstrap 5 + 自定義 Utility Classes |
| Component-Based | 封裝 UI 邏輯 | ArticleCard, LogoComponent |

---

## 5. 部署與驗證

### 5.1 部署注意事項
| 階段 | 項目 | 說明 |
|-----|-----|-----|
| 部署前 | Build Test | 確保 `pnpm run build` 正常 |
| 部署後 | Lighthouse | 檢查重構後的效能（Performance）與無障礙（Accessibility） |

### 5.2 驗證項目
#### 視覺驗證
| 測試項目 | 預期結果 |
|---------|---------|
| 文章卡片懸停 | 邊框出現 Cyan 色發光，卡片輕微上移 |
| 背景網格 | 呈現極簡淡藍色網格，隨頁面滾動 |
| 字體顯示 | 標題使用 Sans-serif，元數據使用 Monospaced |

#### 相容性測試
| 平台 | 預期結果 |
|-----|---------|
| Chrome / Safari | 完整支援 Glassmorphism 效果 |
| Mobile 裝置 | 響應式佈局正確，網格背景不干擾閱讀 |

### 5.3 自我檢查點
- [ ] 所有新色碼均提取至 `:root` 變數
- [ ] `ArticleCard` 移除舊有的 terminal header 裝飾（或改造成更現代的樣式）
- [ ] 頁面捲軸（Scrollbar）樣式是否也同步為 Dark 科技感樣式
