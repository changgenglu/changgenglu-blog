# Gemini 專案策略 (changgenglu-blog)

> 本文件定義 `changgenglu-blog` 專案的策略、架構規範與業務知識。

---

## 1. 專案概觀 (Project Overview)

本專案為 **Chang Geng Lu 的個人部落格**，採用 **Vue 3** 框架建置。
核心特色在於使用自定義的 Node.js 腳本將 Markdown 檔案轉換為 JSON 格式，供前端 Vue 應用程式讀取並渲染，是一個靜態生成的部落格系統。

### 核心技術 (Tech Stack)

- **Framework**: Vue.js 3.x
- **Build Tool**: Vue CLI
- **State Management**: Vuex 4.x
- **Router**: Vue Router 4.x
- **UI Framework**: Bootstrap 5.x
- **Markdown Rendering**: `vue3-markdown-it` / `markdown-it`
- **Package Manager**: pnpm (建議) 或 npm

---

## 2. 主要工作流程 (Workflow)

### 2.1 開發與部署指令

| 指令              | 說明                    | 備註                              |
| :---------------- | :---------------------- | :-------------------------------- |
| `pnpm install`    | 安裝專案依賴            | 若無 `pnpm`，請改用 `npm install` |
| `pnpm run serve`  | 啟動開發伺服器          | 支援熱重載 (Hot-reload)           |
| `pnpm run build`  | 建置生產版本            | 輸出至 `dist/` 目錄               |
| `pnpm run lint`   | 程式碼風格檢查與修正    |                                   |
| `pnpm run deploy` | **部署至 GitHub Pages** | 自動執行腳本生成數據、打包並推送  |

### 2.2 文章發布流程 (Content Pipeline)

部落格文章以 Markdown 格式撰寫，透過以下腳本處理資料：

1.  **生成目錄索引 (`makeDirectory.js`)**:

    - 掃描 Markdown 來源目錄。
    - 提取檔案修改時間與標題 (H2 tags)。
    - 輸出 `src/assets/fileNames.json` (文章列表)。

2.  **編譯文章內容 (`markdownCompiler.js`)**:
    - 讀取 Markdown 檔案。
    - 解析 TOC (目錄) 標記 (`<!-- TOC -->`)。
    - 將內容轉換並輸出為個別 JSON 檔至 `src/assets/jsonFiles/`。

---

## 3. 專案結構與路徑規範

### 3.1 關鍵路徑

- **`src/`**: Vue 應用程式原始碼。
- **`public/markdownFiles/`**: 目前觀察到的 Markdown 文章存放位置 (需注意與腳本設定的差異)。
- **`makeDirectory.js` & `markdownCompiler.js`**: 核心資料處理腳本。
- **`deploy.sh`**: 自動化部署腳本。

### 3.2 部署策略

- 專案部署於 GitHub Pages。
- `deploy.sh` 會將 `dist` 資料夾內容強制推送至遠端的 `gh-pages` 分支。

---

## 4. 專案記憶 (Project Memory)

> 此區塊記錄專案特定資訊與潛在問題，由 Gemini 在互動過程中累積。

- **路徑配置潛在問題**:

  - `makeDirectory.js` 與 `markdownCompiler.js` 內的原始碼目前指向 `./src/markdownFiles`。
  - 但目前的檔案結構顯示 `src/markdownFiles` 不存在，文章位於 `public/markdownFiles` (或 `src/markdownFiles(notuse)` 曾被棄用)。
  - **注意**: 若執行 `node makeDirectory.js` 失敗，需檢查腳本內的 `directoryPath` 是否需修正為 `./public/markdownFiles` 或將檔案移回 `src/`。

- **Markdown 規範**:

  - 文章內需包含 `<!-- TOC -->` 與 `<!-- /TOC -->` 標籤以正確生成目錄。
  - 列表生成依賴 `## ` (H2) 標籤。

- **部署注意事項**:
  - 執行 `deploy.sh` 前需確保 `git` 環境設定正確。
  - 部署會覆寫遠端 `gh-pages` 分支，請謹慎操作。

## Gemini Added Memories

- The project 'changgenglu-blog' uses a custom Node.js script (makeDirectory.js) to generate a JSON manifest (fileNames.json) of all Markdown articles for the frontend to consume.
- The 'changgenglu-blog' project uses 'makeDirectory.js' to generate 'src/assets/fileNames.json', which acts as the database for the frontend. Currently, it only stores file metadata (name, date, category) and H2 headers (matchingLines), but not the full content.
- 'HomeView.vue' implements a client-side instant search that currently filters only by file name. 'CategoryListView.vue' displays articles of a specific category but lacks search functionality.
- Fixed test failures in 'MarkdownComponent.spec.js' and 'ArticleCard.spec.js' by switching to 'createMemoryHistory' for router mocks, properly hoisting mocks with 'vi.hoisted', and using 'flushPromises' for async assertions.
- Switched Vue Router to Hash mode (createWebHashHistory) to fix routing on GitHub Pages. Also refactored ArticleCard navigation to use programmatic routing (@click) instead of router-link components to resolve rendering issues.
