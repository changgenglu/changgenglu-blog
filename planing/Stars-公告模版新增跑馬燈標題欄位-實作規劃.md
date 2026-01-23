# Stars - 公告模版新增跑馬燈標題欄位 - 實作規劃

## 版本記錄

| 版本 | 更新時間 | 變更摘要 |
|------|---------|----------|
| v1.0 | 2026-01-23 | 初次規劃：新增 `marquee_title` 欄位並設定為必填 |

---

## 1. 需求概述

### 1.1 背景與目標
- **需求背景**：前端在串接公告模版功能時，回報 `contents` 物件中缺少用於顯示跑馬燈的標題欄位 (`marquee_title`)，導致跑馬燈功能無法正確顯示對應資訊。
- **功能目標**：在公告模版內容 (`AnnouncementTemplateContent`) 中新增 `marquee_title` 欄位，並將其設定為必填（Required），以符合前端跑馬燈顯示邏輯。
- **影響範圍**：
  - 資料庫：`announcement_template_contents` 資料表。
  - 後端：Model、Service、Controller (Validation)。
  - API：公告模版的新增與編輯端點。

### 1.2 範圍界定
- **包含**：
  - 資料庫 Schema 變更（直接修改尚未正式上線的原始 Migration）。
  - Model `fillable` 屬性更新。
  - Service 層資料組裝與 `upsert` 邏輯調整。
  - API 驗證規則更新（設為 `required`）。
- **不包含**：
  - 前端 UI 改版。
  - 歷史資料遷移（因功能未正式上線，假設無現有資料一致性問題）。

---

## 2. 系統架構變更

### 2.1 資料庫變更
#### 修改資料表
| 資料表名稱 | 變更類型 | 說明 |
|-----------|---------|-----|
| `announcement_template_contents` | 修改 | 新增 `marquee_title` 欄位 |

#### Schema 設計 (Pseudo Migration)

> **變更路徑**：`database/migrations/management/2026_01_05_145100_create_announcement_template_contents_table.php`

```php
table: announcement_template_contents
  - marquee_title: string(400), not null, after: title, comment: '跑馬燈標題'
```

### 2.2 設定變更
N/A

### 2.3 程式碼結構
#### 修改檔案
| 檔案路徑 | 修改內容摘要 |
|---------|-------------|
| `app/Models/AnnouncementTemplateContent.php` | `$fillable` 新增 `'marquee_title'`。 |
| `app/Services/AnnouncementTemplate.php` | `createWithContents` 與 `updateWithContents` 資料組裝邏輯新增 `marquee_title`。 |
| `app/Http/Controllers/AnnouncementTemplateController.php` | `createByBackend`, `createByAgent`, `editByBackend`, `editByAgent` 驗證規則更新。 |

---

## 3. API 規格設計

### 3.1 端點總覽
| Method | Path | 說明 | 權限 |
|--------|------|-----|-----|
| POST | `/api/backend/announcement-template` | 新增模版 | Admin |
| PUT | `/api/backend/announcement-template` | 更新模版 | Admin |
| POST | `/api/backend/agent/announcement-template` | 營運平台新增模版 | Agent |
| PUT | `/api/backend/agent/announcement-template` | 營運平台更新模版 | Agent |

### 3.2 詳細規格

#### [POST/PUT] /api/backend/(agent/)announcement-template
**說明**：新增或更新公告模版內容。

**Request (Partial Content)**
```json
{
  "contents": [
    {
      "lang": "zh-tw",
      "title": "string | required | 標題",
      "marquee_title": "string | required | 跑馬燈標題",
      "article": "string | required | 內文"
    }
  ]
}
```

**Validation Rules**
| 欄位 | 規則 | 說明 |
|-----|-----|-----|
| contents.*.marquee_title | required, string, max:400 | 必填，長度上限 400 字元，參考 `AnnouncementController` 規範。 |

**Response - Success (200)**
回傳模版物件，`contents` 陣列中每個語系均包含 `marquee_title`。

### 3.3 權限設計
| 操作 | 允許角色 | 特殊條件 |
|-----|---------|---------|
| CRUD 公告模版 | admin, agent | 必須為該平台所屬之供應商權限。 |

---

## 4. 實作細節

### 4.1 實作任務清單
| # | 任務 | 依賴 |
|---|-----|-----|
| 1 | 修改 Migration：`2026_01_05_145100_create_announcement_template_contents_table.php` | - |
| 2 | 更新 Model：`AnnouncementTemplateContent` `$fillable` | 1 |
| 3 | 更新 Controller：`AnnouncementTemplateController` 加入驗證規則 | - |
| 4 | 更新 Service：`AnnouncementTemplate` 資料組裝與 `upsertContent` | 2 |
| 5 | 重跑 Migration：`php artisan migrate:refresh --database=management` | 1 |

### 4.2 關鍵邏輯（提供偽代碼）

#### Service 核心邏輯 (`app/Services/AnnouncementTemplate.php`)

```php
function createWithContents(..., $contents, ...):
    // ...
    foreach ($contents as $content) {
        $formattedContents[] = [
            'template_id' => $template->id,
            'lang' => $content['lang'],
            'title' => $content['title'],
            'marquee_title' => $content['marquee_title'], // 直接取用，不設預設值以確保必填
            'article' => $content['article'],
        ];
    }
    $this->upsertContent($formattedContents);
    // ...

function upsertContent(array $data):
    return AnnouncementTemplateContent::upsert(
        $data,
        [ 'template_id', 'lang' ],
        [ 'title', 'marquee_title', 'article' ] // 加入更新欄位清單
    );
```

### 4.3 錯誤處理設計
| Exception | 錯誤碼 | 觸發條件 |
|-----------|-------|---------|
| ValidationException | validation_error | `marquee_title` 未傳入或超過 400 字元。 |

---

## 5. 部署與驗證

### 5.1 部署注意事項
| 階段 | 項目 | 說明 |
|-----|-----|-----|
| 部署前 | Migration | 因修改原始檔案，需確認測試環境可執行重置操作。 |
| 部署後 | API Doc | 執行 `php artisan apidoc:generate` (若有自動化工具)。 |

### 5.2 驗證項目
#### 單元測試
| 測試類別 | 測試項目 | 預期結果 |
|---------|---------|---------|
| ServiceTest | `upsertContent` 包含新欄位 | 資料庫成功寫入並讀取出 `marquee_title`。 |

#### 整合測試
| 測試類別 | 測試項目 | 預期結果 |
|---------|---------|---------|
| ControllerTest | `marquee_title` 為空 | HTTP 400 |
| ControllerTest | 正常帶入資料 | HTTP 200 |

### 5.3 自我檢查點
- [ ] 符合專案規範（參考 `GEMINI.md`）。
- [ ] 驗證字數限制 (400) 是否與 `AnnouncementController.php` 一致。
