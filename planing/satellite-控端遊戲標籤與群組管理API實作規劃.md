# satellite - 控端遊戲標籤與群組管理 API 實作規劃 (Proxy Mode)

## 版本記錄

| 版本 | 更新時間 | 變更摘要 |
|------|---------|----------|
| v1.1 | 2026-01-30 | 修正架構：移除本地 DB 設計，改採 Proxy 模式透傳請求至外部核心服務 |
| v1.0 | 2026-01-30 | 初次規劃（已廢棄） |

---

## 0. 專案現況分析摘要

> 本區塊記錄規劃前的專案分析結果，確保實作與專案架構一致。

### 0.1 參考的既有實作

| 檔案 | 參考原因 | 關鍵發現 |
|-----|---------|---------|
| `app/Services/Internal.php` | 了解外部服務調用 | 使用 `HttpClient` 與 `generateApiUrl` 封裝外部請求，為本專案標準通訊模式。 |
| `.gemini/GEMINI.md` | 架構規範 | 明確指出 `Tag` 為外部核心資料，BFF 僅負責轉發 (Proxy)。 |
| `database/seeders/Feature.php` | 權限管理 | 新增後台功能需在此註冊 Menu 與 Permission。 |

### 0.2 識別的架構模式

| 項目 | 專案採用方式 |
|-----|-------------|
| 分層架構 | Controller (Validation) → Internal Service (Proxy) → External API |
| 資料存儲 | **完全依賴外部服務**，本地不建立 `tags` 等資料表。 |
| 權限控制 | 需於 `Feature` Seeder 註冊新功能，並由 Middleware 驗證 `x-pid` 與權限。 |

### 0.3 必須遵循的慣例

- **Service 調用**：擴充 `App\Services\Internal` 類別以支援 Tag 相關 API。
- **Request 驗證**：Controller 需實作 FormRequest 或 `validate` 以確保傳給後端的資料正確。
- **Response 處理**：直接透傳外部服務的回應，或僅做必要的格式轉換。

---

## 1. 需求概述

### 1.1 背景與目標
- **背景**：後台需新增遊戲標籤與群組管理功能，但資料源位於外部核心系統。
- **目標**：在 `satellite` (BFF) 實作 API 介面，接收前端請求並安全地轉發至外部服務。
- **影響範圍**：
    - 新增後台 API 端點。
    - 擴充 `Internal` Service。
    - 新增後台 Menu 權限設定。

### 1.2 範圍界定
- **包含**：
    - 標籤 (Tag) 管理 API 轉發。
    - 標籤群組 (TagGroup) 管理 API 轉發。
    - 遊戲-標籤關聯 API 轉發。
    - 後台 Menu/Permission 設定 (`Feature` Seeder)。
- **不包含**：
    - 本地資料庫 Schema 變更。
    - 外部服務端的 API 實作（假設已存在）。

---

## 2. 系統架構變更

### 2.1 資料庫變更
**無**。本專案不持有 Tag 資料。

### 2.2 設定變更
| 設定檔 | 變更內容 | 說明 |
|-------|---------|-----|
| `database/seeders/Feature.php` | 新增 Tag 相關 Menu 與 Permission | 讓控端與管端能看到並操作此功能。 |

### 2.3 程式碼結構
#### 新增檔案
| 檔案路徑 | 類型 | 職責說明 |
|---------|-----|---------|
| `app/Http/Controllers/TagController.php` | Controller | 處理 Tag 與 TagGroup 的請求驗證與轉發 |
| `app/Http/Controllers/GameTagController.php` | Controller | 處理 Game 與 Tag 綁定的請求驗證與轉發 |
| `app/Http/Requests/Tag/*.php` | FormRequest | (可選) 封裝驗證邏輯 |

#### 修改檔案
| 檔案路徑 | 修改內容摘要 |
|---------|-------------|
| `app/Services/Internal.php` | 新增 `tag`, `tagGroup`, `gameTag` 相關的 API 呼叫方法 |
| `routes/api.php` | 註冊新的 API 路由 |

---

## 3. API 規格設計

> BFF API 規格與外部核心服務 API 規格保持一致（透傳模式）。

### 3.1 端點總覽

**Base URL**: `/api/backend`

| Method | Path | 對應 Internal 方法 | 權限 |
|--------|------|-------------------|-----|
| **Tag** | | | |
| POST | `/tag` | `createTag` | tag_create |
| GET | `/tag` | `getTag` | tag_read |
| PUT | `/tag` | `updateTag` | tag_update |
| GET | `/tag/list` | `getTagList` | tag_read |
| PUT | `/tag/enable` | `enableTag` | tag_update |
| PUT | `/tag/disable` | `disableTag` | tag_update |
| **Tag Group** | | | |
| POST | `/tag_group` | `createTagGroup` | tag_group_create |
| ... | ... | ... | ... |
| **Game Tag** | | | |
| GET | `/game/tags` | `getGameTags` | game_tag_read |
| PUT | `/game/tags` | `updateGameTags` | game_tag_update |

### 3.2 詳細規格範例

#### [POST] /api/backend/tag
**說明**：新增標籤 (Proxy to External)

**Request Validation (BFF Layer)**
| 欄位 | 規則 |
|-----|-----|
| type | required, integer |
| name_tw | required, string, max:20 |

**Internal Call**
```php
Internal::createTag($request->all());
```

---

## 4. 實作細節

### 4.1 實作任務清單

| # | 任務 | 依賴 |
|---|-----|-----|
| 1 | 修改 `app/Services/Internal.php`: 新增 Tag 相關 CRUD 方法 | - |
| 2 | 修改 `app/Services/Internal.php`: 新增 TagGroup 相關 CRUD 方法 | 1 |
| 3 | 修改 `app/Services/Internal.php`: 新增 GameTag 相關方法 | 1 |
| 4 | 建立 `TagController`: 實作 Tag & Group 的 Action (Validate + Call Internal) | 2 |
| 5 | 建立 `GameTagController`: 實作 GameTag Action | 3 |
| 6 | 設定 `routes/api.php`: 綁定路由與 Middleware | 4,5 |
| 7 | 修改 `database/seeders/Feature.php`: 註冊功能選單與權限 | - |

### 4.2 關鍵邏輯 (Pseudo Code)

#### Internal Service

```php
// app/Services/Internal.php

public static function createTag(array $data)
{
    $url = static::generateApiUrl('/api/backend/tag'); // 假設外部路徑相同
    return HttpClient::post($url, [
        'data' => $data,
        'timeout' => 10
    ]);
}

public static function getTagList(array $query)
{
    $url = static::generateApiUrl('/api/backend/tag/list');
    return HttpClient::get($url, [
        'query' => $query
    ]);
}
```

#### TagController

```php
// app/Http/Controllers/TagController.php

public function store(Request $request)
{
    // 1. Validation
    $this->validate($request, [
        'type' => 'required|integer',
        'name_tw' => 'required|string|max:20',
        // ...
    ]);

    // 2. Proxy Call
    $response = app('Service')::init('Internal')::createTag($request->all());

    // 3. Return Response
    return response()->json($response);
}
```

### 4.3 錯誤處理設計

- **Validation Error**: Controller 層直接回傳 422。
- **Upstream Error**: `HttpClient` 若發生 Timeout 或 5xx，應捕獲並包裝成 `ExternalException` 或直接透傳錯誤訊息給前端（視專案錯誤處理慣例）。

---

## 5. 部署與驗證

### 5.1 部署注意事項
| 階段 | 項目 | 說明 |
|-----|-----|-----|
| 部署後 | Seeder | 執行 `php artisan db:seed --class=Feature` 以更新權限。 |
| 部署後 | Route Cache | `php artisan route:cache` |

### 5.2 驗證項目
#### 整合測試
- **Mock Internal Service**: 測試 Controller 是否正確驗證參數，並以正確參數呼叫了 Internal Service。
- **Permission**: 測試無權限 User 是否被攔截 (403)。

### 5.3 自我檢查點
- [ ] 確認未建立任何 Migration。
- [ ] 確認 `Internal` Service 的 URL 路徑與外部 API 文件一致。
- [ ] 確認 Seeder 已包含新功能的 Feature 定義。
