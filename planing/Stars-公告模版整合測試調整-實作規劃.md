# Stars - 公告模版整合測試調整 - 實作規劃

## 版本記錄

| 版本 | 更新時間 | 變更摘要 |
|------|---------|----------|
| v1.0 | 2026-01-23 | 初次規劃：整合 `marquee_title` 相關測試 |

---

## 1. 需求概述

### 1.1 背景與目標
- **需求背景**：公告模版功能已新增 `marquee_title` 欄位並設定為必選，現有整合測試（commit `b0bd5be1`）尚未涵蓋此欄位，導致測試無法通過或覆蓋率不足。
- **功能目標**：調整所有涉及 `AnnouncementTemplate` 的整合測試，確保：
  1. 正常流程包含 `marquee_title` 資料。
  2. 驗證規則（Required, Max 400）有對應的測試案例。
  3. 資料庫與 API 回傳值包含正確的 `marquee_title`。
- **影響範圍**：
  - `tests/Integration/AnnouncementTemplateController/` 下的所有測試類別。

### 1.2 範圍界定
- **包含**：
  - 更新 `CreateByBackendTest`, `CreateByAgentTest`, `EditByBackendTest`, `EditByAgentTest` 的參數與斷言。
  - 新增 `marquee_title` 驗證失敗的測試案例。
  - 更新 `GetByBackendTest`, `GetByAgentTest`, `ListsByBackendTest`, `ListsByAgentTest` 檢查回傳結構。
- **不包含**：
  - 既有業務邏輯變更。
  - 非公告模版相關的測試。

---

## 2. 系統架構變更

### 2.1 資料庫變更
N/A (測試程式調整)

### 2.2 設定變更
N/A

### 2.3 程式碼結構
#### 修改檔案
| 檔案路徑 | 修改內容摘要 |
|---------|-------------|
| `tests/Integration/AnnouncementTemplateController/CreateByBackendTest.php` | 參數補上 `marquee_title`，新增驗證測試。 |
| `tests/Integration/AnnouncementTemplateController/CreateByAgentTest.php` | 參數補上 `marquee_title`，新增驗證測試。 |
| `tests/Integration/AnnouncementTemplateController/EditByBackendTest.php` | 參數補上 `marquee_title`，新增驗證測試。 |
| `tests/Integration/AnnouncementTemplateController/EditByAgentTest.php` | 參數補上 `marquee_title`，新增驗證測試。 |
| `tests/Integration/AnnouncementTemplateController/GetByBackendTest.php` | 斷言補上 `marquee_title` 檢查。 |
| `tests/Integration/AnnouncementTemplateController/GetByAgentTest.php` | 斷言補上 `marquee_title` 檢查。 |
| `tests/Integration/AnnouncementTemplateController/ListsByBackendTest.php` | 斷言補上 `marquee_title` 檢查。 |
| `tests/Integration/AnnouncementTemplateController/ListsByAgentTest.php` | 斷言補上 `marquee_title` 檢查。 |

---

## 3. API 規格設計

### 3.1 端點總覽
維持既有設計，參數結構變更如下：

### 3.2 詳細規格內容變動
**Request (Contents Array)**
```json
{
  "lang": "string | required",
  "title": "string | required",
  "marquee_title": "string | required | max:400", 
  "article": "string | required"
}
```

---

## 4. 實作細節

### 4.1 實作任務清單
| # | 任務 | 依賴 |
|---|-----|-----|
| 1 | 全域替換測試 Payload：加入 `marquee_title` | - |
| 2 | 更新 `Create` / `Edit` 測試：新增 `marquee_title` 驗證測試（Required, Max:400） | 1 |
| 3 | 更新 `Get` / `Lists` 測試：加入 `marquee_title` 回傳值斷言 | 1 |
| 4 | 執行測試並驗證：`php artisan test tests/Integration/AnnouncementTemplateController` | 1, 2, 3 |

---

## 5. 部署與驗證

### 5.1 部署注意事項
N/A (測試環境變更)

### 5.2 驗證項目
#### 整合測試
| 測試類別 | 測試項目 | 預期結果 |
|---------|---------|---------|
| ControllerTest | 執行完整模組測試 | 所有測試 Passed (OK) |
| ControllerTest | marquee_title 缺失 | 觸發 422 Validation Error |
| ControllerTest | marquee_title 超過 400 字 | 觸發 422 Validation Error |

### 5.3 自我檢查點
- [ ] 所有 `contents` 陣列在測試中皆已補上 `marquee_title`。
- [ ] 斷言 `assertDatabaseHas` 有包含新欄位的檢查。
- [ ] 營運平台 (Agent) 與 管理後台 (Backend) 的測試皆已覆蓋。
