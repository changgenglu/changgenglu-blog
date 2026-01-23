# satellite - 公告模板欄位對齊與 marquee_title 新增 - 實作規劃

## 版本記錄

| 版本 | 更新時間 | 變更摘要 |
|------|---------|----------|
| v1.0 | 2026-01-23 15:30 | 初次規劃：新增 marquee_title 欄位至公告模板以對齊公告功能 |

---

## 1. 需求概述

### 1.1 背景與目標
- **需求背景**：公告模板功能已從原本依賴公告資料表的邏輯中抽離，但在實作過程中遺漏了 `marquee_title` (跑馬燈標題) 欄位，導致模板與實際公告功能不對齊。
- **功能目標**：在公告模板的建立與編輯 API 中新增 `marquee_title` 欄位驗證與傳輸。
- **影響範圍**：`AnnouncementTemplateController` 的 `create` 與 `edit` 方法，以及對應的後端 API。

### 1.2 範圍界定
- **包含**：
    - 修改 `AnnouncementTemplateController` 的驗證規則。
    - 確保 `marquee_title` 欄位正確轉發至後端服務。
- **不包含**：
    - 公告模板以外的其他模板欄位調整。
- **假設條件**：
    - 後端服務 (Backend API) 已準備好接收 `marquee_title` 欄位。

---

## 2. 系統架構變更

### 2.1 資料庫變更
#### 新增/修改資料表
| 資料表名稱 | 變更類型 | 說明 |
|-----------|---------|-----|
| `announcement_template_content` | 修改 | 在語系內容表中新增 `marquee_title` 欄位 (由後端服務執行) |

#### Schema 設計 (Backend Service)
table: announcement_template_content
  - marquee_title: string(400), nullable: false
  - index: [announcement_template_id]

### 2.2 設定變更
| 設定檔 | 變更內容 | 說明 |
|-------|---------|-----|
| N/A | N/A | 本次變更不涉及設定檔修改 |

### 2.3 程式碼結構
#### 新增檔案
| 檔案路徑 | 類型 | 職責說明 |
|---------|-----|---------|
| N/A | N/A | N/A |

#### 修改檔案
| 檔案路徑 | 修改內容摘要 |
|---------|-------------|
| `app/Http/Controllers/AnnouncementTemplateController.php` | 更新 `create` 與 `edit` 方法的驗證規則，加入 `contents.*.marquee_title` |

---

## 3. API 規格設計

### 3.1 端點總覽
| Method | Path | 說明 | 權限 |
|--------|------|-----|-----|
| POST | `/announcement-template` | 新增公告模板 | provider_user, admin |
| PUT | `/announcement-template` | 編輯公告模板 | provider_user, admin |

### 3.2 詳細規格

#### [POST/PUT] /announcement-template
**說明**：建立或更新公告模板內容。

**Request**
```json
{
  "contents": [
    {
      "lang": "string | required | 語言代碼",
      "title": "string | required | 公告標題",
      "marquee_title": "string | required | 跑馬燈標題",
      "article": "string | required | 公告內容"
    }
  ]
}
```

**Validation Rules**
| 欄位 | 規則 | 說明 |
|-----|-----|-----|
| contents.*.marquee_title | required, string, max:400 | 對齊公告功能跑馬燈標題限制 |
| contents.*.title | required, string, max:500 | 對齊 commit e63ca63 調整後的長度 |

**Response - Success (200)**
```json
{
  "before": { "...": "..." },
  "after": { "...": "..." }
}
```

**Response - Error**
| HTTP Code | Error Code | 說明 |
|-----------|-----------|-----|
| 422 | validation_error | 欄位驗證失敗 (如標題過長) |

### 3.3 權限設計
| 操作 | 允許角色 | 特殊條件 |
|-----|---------|---------|
| 建立模板 | admin, provider_user | 需具備 `feature:announcement_template` 權限 |

---

## 4. 實作細節

### 4.1 實作任務清單
| # | 任務 | 依賴 |
|---|-----|-----|
| 1 | 修改 `AnnouncementTemplateController@create` 驗證規則 | - |
| 2 | 修改 `AnnouncementTemplateController@edit` 驗證規則 | - |
| 3 | 確保後端服務 Migration 已執行 (由後端團隊確認) | - |

### 4.2 關鍵邏輯

#### Controller 驗證規則更新

```php
// app/Http/Controllers/AnnouncementTemplateController.php

$validated = $this->validate($request, [
    // ... 其他欄位
    'contents.*.marquee_title' => [ 'required', 'string', 'max:400' ],
    // ...
]);
```

### 4.3 錯誤處理設計
| Exception | 錯誤碼 | 觸發條件 |
|-----------|-------|---------|
| ValidationException | 422 | `marquee_title` 缺失或超過 400 字元 |

### 4.4 Design Patterns
| Pattern | 用途 | 應用位置 |
|---------|-----|---------|
| Proxy/Forwarding | 轉發請求至後端服務 | AnnouncementTemplateController |

---

## 5. 部署與驗證

### 5.1 部署注意事項
| 階段 | 項目 | 說明 |
|-----|-----|-----|
| 部署前 | Backend Sync | 確認 Backend API 已支援 marquee_title 欄位 |
| 部署後 | Route Cache | 執行 `php artisan route:clear` |

### 5.2 驗證項目
#### 整合測試
| 測試類別 | 測試情境 | 預期結果 |
|---------|---------|---------|
| ControllerTest | POST 建立模板包含 marquee_title | HTTP 200, Backend 回傳成功 |
| ControllerTest | PUT 更新模板包含 marquee_title | HTTP 200, Backend 回傳成功 |
| ControllerTest | marquee_title 超過 400 字元 | HTTP 422 validation error |

### 5.3 自我檢查點
- [x] 符合專案規範 (參考 GEMINI.md)
- [x] 欄位長度限制與 `AnnouncementController` 一致
