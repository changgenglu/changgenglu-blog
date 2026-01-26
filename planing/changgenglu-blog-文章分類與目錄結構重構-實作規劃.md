# changgenglu-blog - 文章分類與目錄結構重構 - 實作規劃

## 版本記錄

| 版本 | 更新時間 | 變更摘要 |
|------|---------|----------|
| v1.0 | 2026-01-26 | 初次規劃：目錄結構重構、檔案同步機制、前端路由調整 |

---

## 1. 需求概述

### 1.1 背景與目標
- **背景**：目前部落格文章散落在 `public/markdownFiles/` 根目錄，管理不易。且 `prompt_engineering/` 目錄下的 AI 筆記需整合至部落格中，但該目錄位於專案根目錄，前端無法直接存取。
- **目標**：
  1. **結構優化**：將文章分類存放（PHP, Javascript, 系統相關...）。
  2. **自動同步**：在建置前自動將 `prompt_engineering` 內的 Markdown 檔案複製到 `public` 目錄，確保前端可存取。
  3. **體驗優化**：首頁改為「分類導覽」，並提供全域搜尋功能。
- **範圍**：
  - 後端建置腳本 (`makeDirectory.js`)：新增檔案複製與分類邏輯。
  - 前端路由與頁面 (`Vue Router`, `HomeView`, `CategoryListView`)。
  - 現有檔案結構遷移。

### 1.2 範圍界定
- **包含**：
  - `public/markdownFiles/` 檔案實體搬移。
  - `makeDirectory.js`：執行 `copy` 動作將 `prompt_engineering/*.md` 同步至 `public/markdownFiles/提示詞工程/`。
  - 前端路由相容性處理（舊連結轉址）。
- **不包含**：
  - 文章內容編輯。
  - **敏感資料過濾**（假設 `prompt_engineering` 內檔案皆可公開，若有敏感資料需人工排除）。

---

## 2. 系統架構變更

### 2.1 資料結構變更 (JSON Model)
`src/assets/fileNames.json` 擴充欄位以支援路徑查找。

| 欄位名稱 | 類型 | 說明 |
|---------|-----|-----|
| name | string | 檔名 (e.g., "Laravel 學習筆記.md") |
| **category** | string | **[新增]** 分類名稱 (e.g., "PHP") |
| **path** | string | **[新增]** 檔案相對路徑 (e.g., "PHP/Laravel 學習筆記.md")，供前端 fetch 使用 |
| date | string | 最後修改時間 |
| matchingLines | array | 標題列表 (TOC) |

### 2.2 檔案結構變更

#### 來源結構
```
root/
├── prompt_engineering/ (*.md)
└── public/markdownFiles/ (*.md)
```

#### 建置後結構 (Runtime Structure)
`makeDirectory.js` 執行後，`public/markdownFiles` 將呈現：
```
public/markdownFiles/
  ├── PHP/
  ├── Javascript/
  ├── ... (其他分類)
  ├── 提示詞工程/ (由 prompt_engineering 複製而來)
  └── Uncategorized/ (未分類檔案)
```

### 2.3 程式碼結構

#### 修改檔案
| 檔案路徑 | 修改內容摘要 |
|---------|-------------|
| `makeDirectory.js` | 新增 `fs.copyFileSync` 邏輯、遞迴掃描目錄、生成含 `path` 的 JSON |
| `src/router/index.js` | 新增分類路由，保留舊路由做相容處理 |
| `src/views/HomeView.vue` | 改為分類卡片顯示，搜尋模式下顯示文章列表 |
| `src/views/MarkdownComponent.vue` | 修改 fetch URL 邏輯，從 `fileNames.json` 查找完整 `path` |

#### 新增檔案
| 檔案路徑 | 類型 | 職責說明 |
|---------|-----|---------|
| `src/views/CategoryListView.vue` | View | 顯示特定分類下的文章列表 |
| `tests/unit/scripts/makeDirectory.spec.js` | Test | 測試檔案複製與 JSON 生成邏輯 |

---

## 3. API 規格設計

本次無後端 API，僅涉及前端對靜態資源 (`fileNames.json`, `*.md`) 的讀取。

### 3.1 資源存取路徑
- **文章列表**：`import fileNames from '@/assets/fileNames.json'`
- **文章內容**：`fetch('/markdownFiles/' + file.path)`

---

## 4. 實作細節

### 4.1 實作任務清單

| # | 任務 | 依賴 |
|---|-----|-----|
| 1 | **檔案整理**：手動在 `public/markdownFiles/` 建立分類資料夾並移動現有檔案 | - |
| 2 | **腳本核心重構**：修改 `makeDirectory.js` | 1 |
|   | - 實作 `syncExternalFiles(src, dest)`：將 `prompt_engineering` 複製到 `public` | |
|   | - 實作 `scanDirectory(dir)`：遞迴掃描，依資料夾名稱決定 `category` | |
|   | - 生成 `path` 欄位（相對路徑） | |
| 3 | **測試撰寫**：建立 `makeDirectory.spec.js` 驗證複製與 JSON 結構 | 2 |
| 4 | **文章元件升級**：修改 `MarkdownComponent.vue` | 2 |
|   | - 在 `created` hook 中，透過 `route.params.title` 在 `fileNames.json` 查找對應 `path` | |
|   | - 若找不到檔案，顯示 404 提示 | |
| 5 | **分類列表頁**：建立 `CategoryListView.vue` | 4 |
| 6 | **首頁重構**：`HomeView.vue` 實作分類網格與全域搜尋 | 5 |
| 7 | **路由設定**：更新 `router/index.js`，確保 `/:title` 能導向正確文章 | 6 |

### 4.2 關鍵邏輯 (Pseudo Code)

#### `makeDirectory.js` - 同步與生成
```javascript
const fs = require('fs');
const path = require('path');

const EXTERNAL_SOURCES = [
    { src: './prompt_engineering', dest: './public/markdownFiles/提示詞工程' }
];

function syncFiles() {
    EXTERNAL_SOURCES.forEach(({ src, dest }) => {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        const files = fs.readdirSync(src).filter(f => f.endsWith('.md'));
        files.forEach(file => {
            fs.copyFileSync(path.join(src, file), path.join(dest, file));
        });
    });
}

function generateJSON() {
    syncFiles(); // 先同步
    // ... 遞迴掃描 public/markdownFiles
    // fileObj.path = relativePath (e.g., '提示詞工程/AI.md')
    // fileObj.category = parentDirName
}
```

#### `MarkdownComponent.vue` - 路徑查找
```javascript
import fileList from '@/assets/fileNames.json';

// In script
computed: {
    targetFile() {
        // 支援舊連結 (只給檔名) 與新連結
        const title = this.$route.params.title; // 或 fileName
        return fileList.find(f => f.name === title);
    }
},
created() {
    if (this.targetFile) {
        this.fetchMarkdown(`/markdownFiles/${this.targetFile.path}`);
    } else {
        this.error = 'Article not found';
    }
}
```

### 4.3 錯誤處理設計
- **檔案重名**：若不同分類下有同名檔案（如 `PHP/setup.md` 與 `JS/setup.md`），`fileNames.json` 查找時可能衝突。
  - **解法**：路由參數建議改為傳遞 `path` 或 UUID，或暫時假設檔名唯一（目前專案狀況）。若需嚴謹，路由應改為 `/article/:category/:fileName`。**本階段維持檔名唯一假設，但在 JSON 生成時若發現重名應輸出警告。**

---

## 5. 部署與驗證

### 5.1 部署注意事項
- **CI/CD**：確保 `deploy.sh` 或 GitHub Actions 在執行 `pnpm build` **之前**，先執行 `node makeDirectory.js`，以確保 `prompt_engineering` 的檔案已被複製到構建目錄中。

### 5.2 驗證項目

#### 單元測試 (`vitest`)
- 驗證 `makeDirectory` 是否正確忽略非 `.md` 檔案。
- 驗證 `syncFiles` 是否成功將外部檔案複製到目標路徑。

#### 整合測試
- **路由相容性**：訪問舊連結 `domain.com/Laravel%20學習筆記.md` 是否能正常顯示文章（依賴 JSON 查找路徑）。
- **外部檔案存取**：訪問「提示詞工程」分類下的文章，確認無 404 錯誤。
- **搜尋功能**：搜尋 "AI" 是否能跨分類找到提示詞工程的文章。

### 5.3 自我檢查點
- [ ] `prompt_engineering` 檔案是否已物理存在於 `dist/markdownFiles/提示詞工程/`？
- [ ] 首頁分類卡片點擊後是否正確過濾列表？
- [ ] 舊的文章連結是否依然有效？
