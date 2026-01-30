# Stars - 批量遊戲語系查詢與設定 API 優化 - 實作規劃

## 版本記錄

| 版本 | 更新時間 | 變更摘要 |
|------|---------|----------|
| v1.0 | 2026-01-30 | 初次規劃 |

---

## 1. 需求概述

### 1.1 背景與目標
- **需求背景**：目前的「批量設定遊戲語系」功能缺乏一個查詢介面，前端無法得知選定遊戲目前的語系設定狀態，導致無法正確顯示初始值。
- **功能目標**：
    1. 新增「查詢遊戲語系列表」API，支援傳入 `game_ids` 與 `platform_id` 查詢特定遊戲的語系設定。
    2. 優化既有的「批量設定遊戲語系」API，使其回應格式與查詢 API 對齊，確保前後端資料處理的一致性。
- **影響範圍**：後台控端/管端遊戲管理模組 (Backend/Control Panel)。

### 1.2 範圍界定
- **包含**：
    - 新增 `GET` 查詢 API。
    - 修改 `PUT` 設定 API 的回應格式。
    - 調整 `GameService` 邏輯以支援新的查詢需求。
- **不包含**：
    - 前端畫面實作。
    - 資料庫 Schema 變更。

---

## 2. 系統架構變更

### 2.1 資料庫變更
**無資料庫變更**。
本功能僅涉及現有資料表 `games` 與 `game_support_languages` 的查詢與關聯操作。

### 2.2 程式碼結構
#### 修改檔案
| 檔案路徑 | 修改內容摘要 |
|---------|-------------|
| `app/Interfaces/IGameService.php` | 新增 `getGameLanguages` 方法定義。 |
| `app/Services/GameService.php` | 實作 `getGameLanguages` 方法，使用 Eloquent 關聯查詢。 |
| `app/Http/Controllers/GameController.php` | 1. 新增 `getLanguages` 方法 (GET Endpoint)。<br>2. 修改 `batchUpdateLanguages` 方法的回應格式。 |

---

## 3. API 規格設計

### 3.1 端點總覽
| Method | Path | 說明 | 權限 |
|--------|------|-----|-----|
| GET | `/api/backend/game/languages` | 批量查詢遊戲語系 | Admin/Operator |
| PUT | `/api/backend/game/languages` | 批量設定遊戲語系 (既有 API 優化) | Admin/Operator |

### 3.2 詳細規格

#### [GET] /api/backend/game/languages
**說明**：根據傳入的遊戲 ID 列表與供應商 ID，回傳這些遊戲的當前語系設定。

**Request (Query Parameters)**
| 欄位 | 類型 | 必填 | 說明 | 範例 |
|-----|------|-----|-----|-----|
| platform_id | integer | ✅ | 供應商 ID | `1` |
| game_ids | string/array | ✅ | 遊戲 ID 列表 (逗號分隔或陣列) | `101,102` |

**Response - Success (200)**
```json
{
    "data": [
        {
            "id": 101,
            "default_lang": "en",
            "support_langs": ["en", "zh-CN", "th"]
        },
        {
            "id": 102,
            "default_lang": "zh-CN",
            "support_langs": ["zh-CN"]
        }
    ]
}
```

#### [PUT] /api/backend/game/languages (既有 API 修改)
**說明**：批量更新遊戲語系設定。
**變更點**：回應 (Response) 格式需與上述 GET API 完全一致，回傳更新後的最新狀態。

**Response - Success (200)**
*(同上)*

---

## 4. 實作細節

### 4.1 實作任務清單

| # | 任務 | 依賴 |
|---|-----|-----|
| 1 | 在 `IGameService` 定義 `getGameLanguages(int $platformId, array $gameIds)` | - |
| 2 | 在 `GameService` 實作 `getGameLanguages` | 1 |
| 3 | 在 `GameController` 新增 `getLanguages` 方法並綁定路由 | 2 |
| 4 | 修改 `GameController` 的 `batchUpdateLanguages` (或對應名稱) 方法，改用 `getGameLanguages` 回傳結果 | 2 |

### 4.2 關鍵邏輯

#### Service 核心邏輯 (`GameService.php`)

```php
public function getGameLanguages(int $platformId, array $gameIds)
{
    // 1. 使用 Eloquent 查詢，並預加載語系關聯
    // 假設關聯名稱為 gameSupportLanguages
    $games = $this->gameRepository->getByPlatformAndIds($platformId, $gameIds);
    
    // 若 Repository 未支援 with，則需手動 load
    $games->load('gameSupportLanguages'); 

    // 2. 格式化回傳資料
    return $games->map(function ($game) {
        return [
            'id' => $game->id,
            'default_lang' => $game->default_lang,
            // 從關聯表中提取語系代碼
            'support_langs' => $game->gameSupportLanguages->pluck('language_code')->toArray(),
        ];
    });
}
```

#### Controller 邏輯 (`GameController.php`)

```php
public function getLanguages(Request $request)
{
    // 驗證輸入
    $request->validate([
        'platform_id' => 'required|integer',
        'game_ids' => 'required', // 支援 array 或 comma-separated string
    ]);

    $gameIds = is_array($request->game_ids) 
        ? $request->game_ids 
        : explode(',', $request->game_ids);

    $data = $this->gameService->getGameLanguages(
        $request->platform_id, 
        $gameIds
    );

    return $this->responseSuccess($data);
}
```

---

## 5. 部署與驗證

### 5.1 部署注意事項
| 階段 | 項目 | 說明 |
|-----|-----|-----|
| 部署後 | Route | 執行 `php artisan route:cache` 確保新路由生效 |

### 5.2 驗證項目

#### 單元/整合測試
| 測試類別 | 測試情境 | 預期結果 |
|---------|---------|---------|
| API Test | 傳入有效的 `platform_id` 與 `game_ids` | 回傳 200 及正確的 JSON 結構 |
| API Test | 傳入不屬於該 Platform 的 `game_id` | 該 Game 不應出現在結果中 (或視 Repository 邏輯而定) |
| API Test | 執行批量更新 | 回傳 200，且 Response 格式與 GET API 一致 |

### 5.3 自我檢查點
- [ ] 查詢邏輯是否使用了 Eager Loading (`with`) 避免 N+1 問題？
- [ ] 批量更新 API 的回傳格式是否已與查詢 API 同步？
- [ ] 路由參數是否符合 RESTful 風格 (Filter 參數使用 Query String)？
