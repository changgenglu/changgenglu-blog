# changgenglu-blog - 測試框架導入與自動化整合 - 實作規劃

## 版本記錄

| 版本 | 更新時間 | 變更摘要 |
|------|---------|----------|
| v1.0 | 2026-01-26 | 初次規劃：導入 Vitest 並整合 CI |

---

## 1. 需求概述

### 1.1 背景與目標
- **需求背景**：目前專案缺乏自動化測試機制，依賴手動驗證。隨著功能增加（如 Git 時間修正邏輯），手動測試成本與風險提高。
- **功能目標**：
    1.  建立完整的測試基礎設施，支援 Node.js 腳本（後端邏輯）與 Vue 3 組件（前端邏輯）的測試。
    2.  將測試流程整合至部署腳本（`deploy.sh`），確保「先測試、後部署」，提升發布品質。
- **影響範圍**：`package.json`（新增依賴）、`vite.config.js`（新增設定）、`deploy.sh`、以及新增的 `tests/` 目錄。

### 1.2 範圍界定
- **包含**：
    - 安裝與配置 Vitest。
    - 針對 `makeDirectory.js` 與 `markdownCompiler.js` 撰寫單元測試。
    - 針對關鍵 Vue 組件（如 `App.vue` 或核心顯示組件）建立測試範例。
    - 修改 `deploy.sh` 加入測試阻斷機制。
- **不包含**：
    - E2E 測試（如 Cypress/Playwright）。
    - 對既有 UI 的全面測試覆蓋（本次僅建立框架與範例）。
- **假設條件**：
    - 專案目前的 Webpack 配置與 Vitest 不衝突（Vitest 基於 Vite，需處理 Vue CLI 專案的相容性）。

---

## 2. 系統架構變更

### 2.1 資料庫變更
N/A

### 2.2 設定變更
| 設定檔 | 變更內容 | 說明 |
|-------|---------|-----|
| `package.json` | 新增 `vitest`, `@vue/test-utils`, `jsdom` | 測試核心依賴 |
| `package.json` | 新增 scripts: `"test": "vitest"` | 測試執行指令 |
| `vitest.config.js` | 新增檔案 | Vitest 設定檔，配置別名與環境 |
| `deploy.sh` | 新增 `npm run test` | 部署前執行測試 |

### 2.3 程式碼結構
#### 新增檔案
| 檔案路徑 | 類型 | 職責說明 |
|---------|-----|---------|
| `tests/unit/scripts/makeDirectory.spec.js` | Test | 測試目錄生成與 Git 時間抓取邏輯 |
| `tests/unit/scripts/markdownCompiler.spec.js` | Test | 測試 Markdown 解析與 JSON 生成邏輯 |
| `tests/unit/components/Example.spec.js` | Test | Vue 組件測試範例 |

---

## 3. API 規格設計
N/A (內部測試不涉及 API 變更)

---

## 4. 實作細節

### 4.1 實作任務清單
依序列出可直接執行的原子化任務：

| # | 任務 | 依賴 |
|---|-----|-----|
| 1 | 安裝 Vitest 及相關依賴 (`npm install -D vitest jsdom @vue/test-utils`) | - |
| 2 | 建立 `vitest.config.js` 並配置 Vue plugin 與 Alias | 1 |
| 3 | 重構 `makeDirectory.js` 與 `markdownCompiler.js` 以支援模組導出（Export functions for testing） | - |
| 4 | 撰寫 `tests/unit/scripts/makeDirectory.spec.js` | 3 |
| 5 | 撰寫 `tests/unit/scripts/markdownCompiler.spec.js` | 3 |
| 6 | 在 `deploy.sh` 中加入 `npm run test`，若失敗則終止部署 | 4,5 |
| 7 | 執行測試並驗證 CI 流程 | 6 |

### 4.2 關鍵邏輯（提供偽代碼）

#### 重構腳本以支援測試 (Refactoring for Testability)
目前腳本直接執行邏輯，需改為導出函式：

**`makeDirectory.js`**
```javascript
// ... imports

function getFileGitDate(filePath) { ... }
function generateFileList(dir) { ... }

// 判斷是否被直接執行 (CLI entry point)
if (require.main === module) {
    generateFileList(directoryPath);
}

module.exports = { getFileGitDate, generateFileList };
```

#### Vitest Config (`vitest.config.js`)
```javascript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
})
```

#### 測試案例：Git 時間邏輯
```javascript
import { describe, it, expect, vi } from 'vitest';
import { getFileGitDate } from '../../../makeDirectory';
import { execSync } from 'child_process';

vi.mock('child_process');

describe('getFileGitDate', () => {
  it('should return git commit date when git command succeeds', () => {
    vi.mocked(execSync).mockReturnValue('2023-01-01T00:00:00Z');
    const date = getFileGitDate('test.md');
    expect(date).toBeInstanceOf(Date);
    expect(date.toISOString()).toBe('2023-01-01T00:00:00.000Z');
  });

  it('should fallback to mtime when git command fails', () => {
    vi.mocked(execSync).mockImplementation(() => { throw new Error('Git error') });
    // Mock fs.statSync...
    // Assert fallback logic
  });
});
```

### 4.3 錯誤處理設計
| 情境 | 處理方式 |
|-----|---------|
| 測試失敗 | `npm run test` 回傳非 0 exit code，`deploy.sh` 捕獲後立即 `exit 1`，阻止 `git push`。 |

---

## 5. 部署與驗證

### 5.1 部署注意事項
| 階段 | 項目 | 說明 |
|-----|-----|-----|
| 部署前 | 依賴安裝 | 確保 `npm install` 已包含 `vitest` |
| 部署中 | 自動測試 | `deploy.sh` 將自動執行測試，需觀察 console output |

### 5.2 驗證項目
#### 單元測試
| 測試類別 | 測試項目 | 預期結果 |
|---------|---------|---------|
| Script Test | `getFileGitDate` | 正確解析 Git 時間與 Fallback |
| Script Test | `markdownCompiler` | 正確解析 TOC 與分離內容 |

#### CI 整合測試
| 測試情境 | 預期結果 |
|---------|---------|
| 測試通過 | 部署腳本繼續執行並顯示「部署成功」 |
| 測試失敗 (模擬) | 部署腳本中斷，顯示錯誤訊息，且**不執行** `git push` |

### 5.3 自我檢查點
- [ ] `vitest.config.js` 是否正確處理了 Vue 2/3 的差異（本專案為 Vue 3）。
- [ ] 測試檔是否與源碼分離（放在 `tests/` 目錄下）。
- [ ] `deploy.sh` 是否有 `set -e` 或明確檢查測試指令的 exit code。