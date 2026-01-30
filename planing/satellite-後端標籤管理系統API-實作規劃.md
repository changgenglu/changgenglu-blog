# satellite - 後端標籤管理系統 API - 實作規劃

## 版本記錄

| 版本 | 更新時間 | 變更摘要 |
|------|---------|----------|
| v1.0 | 2026-01-30 | 初次規劃：新增標籤、標籤群組與遊戲標籤管理功能 |

---

## 0. 專案現況分析摘要

> 本區塊記錄規劃前的專案分析結果，確保實作與專案架構一致。

### 0.1 參考的既有實作

| 檔案 | 參考原因 | 關鍵發現 |
|-----|---------|---------|
| `app/Http/Controllers/GameController.php` | 了解 Game 資料來源 | `GameController` 為 Proxy，透過 `Internal` Service 呼叫核心後端取得遊戲資料，無本地 Game Table。 |
| `app/Services/Internal.php` | 了解內部服務調用 | 使用 `HttpClient` 封裝對內 API 呼叫，需透過此服務取得原始 Game Data。 |
| `app/Services/ServiceFactory.php` | 了解 Service 模式 | 使用 `app('Service')::init('ClassName')` 進行 Service 實例化與單例管理。 |
| `routes/api.php` | 了解路由與權限 | 後台 API 使用 `auth:backend` middleware，且需檢查 header `x-pid`。 |

### 0.2 識別的架構模式

| 項目 | 專案採用方式 |
|-----|-------------|
| 分層架構 | Controller (Proxy/Orchestrator) → Service (Logic/External Call) → Model (Local DB) |
| 資料整合策略 | **Sidecar Pattern**：`satellite` 專案本地儲存 `Tags` 與 `GameTags` 關聯，`Game` 本體資料由核心系統提供，於 Service 層進行合併 (Merge)。 |
| 命名慣例 | Controller 結尾、Service 位於 `App\Services`、Model 位於 `App\Models`。 |
| 驗證方式 | Controller 內使用 `$this->validate($request, ...)`。 |

### 0.3 必須遵循的慣例

- Service 呼叫必須使用 `app('Service')::init('ServiceName')`。
- 後台 API 路由需定義於 `routes/api.php` 的 `auth:backend` 群組內。
- 跨服務呼叫 (Internal API) 需透過 `App\Services\Internal` 處理。

---

## 1. 需求概述

### 1.1 背景與目標
- **背景**：目前遊戲資料缺乏靈活的標籤管理功能，運營團隊需要能自定義標籤（如「熱門」、「新上架」）並將其套用到遊戲上，或將標籤分組管理。
- **目標**：在 `satellite` 專案實作標籤管理系統，包含標籤 (Tag)、標籤群組 (Tag Group) 的 CRUD，以及遊戲與標籤的關聯管理。
- **影響範圍**：新增後台管理 API，不影響現有遊戲核心邏輯，但在取得遊戲資訊時需擴充標籤欄位。

### 1.2 範圍界定
- **包含**：
    - `Tags` 資料表與 CRUD API。
    - `TagGroups` 資料表與 CRUD API。
    - `TagGroupItems` (群組-標籤關聯) 管理 API。
    - `GameTags` (遊戲-標籤關聯) 管理 API。
    - 聚合遊戲資訊 API (Internal Game Data + Local Tags)。
- **不包含**：
    - 修改核心系統的 Game Table。
    - 前台顯示邏輯（本次僅限後台管理 API）。

---

## 2. 系統架構變更

### 2.1 資料庫變更

#### 新增資料表

| 資料表名稱 | 說明 |
|-----------|-----|
| `tags` | 儲存標籤定義 |
| `tag_groups` | 儲存標籤群組定義 |
| `tag_group_items` | 儲存標籤群組與標籤的關聯 (Pivot) |
| `game_tags` | 儲存遊戲與標籤的關聯 (Pivot, game_id 為邏輯外鍵) |

#### Schema 設計 (Pseudo Migration)

```yaml
table: tags
  - id: bigInteger, auto_increment, primary
  - type: integer, index              # 標籤類型
  - name_tw: string(20)               # 繁中名稱
  - name_cn: string(20), nullable     # 簡中名稱
  - name_en: string(20), nullable     # 英文名稱
  - description: string(50), nullable # 說明
  - enable: boolean, default(true)    # 啟用狀態
  - created_at: timestamp
  - updated_at: timestamp

table: tag_groups
  - id: bigInteger, auto_increment, primary
  - name: string(20)                  # 群組名稱
  - description: string(50), nullable # 說明
  - enable: boolean, default(true)    # 啟用狀態
  - created_at: timestamp
  - updated_at: timestamp

table: tag_group_items
  - group_id: bigInteger, index       # 關聯 tag_groups.id
  - tag_id: bigInteger, index         # 關聯 tags.id
  - primary: [group_id, tag_id]

table: game_tags
  - game_id: integer, index           # 邏輯外鍵，對應核心系統 Game ID
  - tag_id: bigInteger, index         # 關聯 tags.id
  - primary: [game_id, tag_id]
```

### 2.2 程式碼結構

#### 新增檔案

| 檔案路徑 | 類型 | 職責說明 |
|---------|-----|---------|
| `app/Models/Tag.php` | Model | 標籤模型 |
| `app/Models/TagGroup.php` | Model | 標籤群組模型 |
| `app/Models/TagGroupItem.php` | Model | 標籤群組關聯模型 (可選，或直接定義 relationship) |
| `app/Models/GameTag.php` | Model | 遊戲標籤關聯模型 |
| `app/Services/Tag.php` | Service | 處理標籤與群組的 CRUD 邏輯 |
| `app/Services/GameTag.php` | Service | 處理遊戲標籤關聯，以及「遊戲資料聚合」邏輯 |
| `app/Http/Controllers/TagController.php` | Controller | 提供標籤與群組的 HTTP 接口 |
| `app/Http/Controllers/GameTagController.php` | Controller | 提供遊戲標籤關聯的 HTTP 接口 |

---

## 3. API 規格設計

> 所有 API 需包含 Header `x-pid` (平台 ID)。

### 3.1 端點總覽

| Method | Path | 說明 |
|--------|------|-----|
| **Tag Management** | | |
| POST | `/api/backend/tag` | 新增標籤 |
| GET | `/api/backend/tag` | 取得單一標籤 |
| PUT | `/api/backend/tag` | 修改標籤 |
| GET | `/api/backend/tag/list` | 取得標籤列表 (Filter/Sort/Page) |
| PUT | `/api/backend/tag/enable` | 啟用標籤 |
| PUT | `/api/backend/tag/disable` | 停用標籤 |
| GET | `/api/backend/tag/type/list` | 取得標籤大類列表 (Hardcoded or Config) |
| **Tag Group Management** | | |
| POST | `/api/backend/tag_group` | 新增標籤群組 |
| GET | `/api/backend/tag_group` | 取得單一標籤群組 |
| PUT | `/api/backend/tag_group` | 修改標籤群組 |
| GET | `/api/backend/tag_group/list` | 取得標籤群組列表 |
| PUT | `/api/backend/tag_group/enable` | 啟用群組 |
| PUT | `/api/backend/tag_group/disable` | 停用群組 |
| GET | `/api/backend/tag_group/tags` | 取得群組內的標籤 |
| PUT | `/api/backend/tag_group/tags` | 更新群組內的標籤 (Sync) |
| **Game Tag Management** | | |
| GET | `/api/backend/game/tags` | 取得遊戲詳細資訊 (含 Tags) |
| PUT | `/api/backend/game/tags` | 更新遊戲內的標籤 (Sync) |

### 3.2 關鍵 API 詳細規格 (複雜部分)

#### [GET] /api/backend/game/tags
**說明**：取得遊戲詳細資訊，並包含該遊戲的標籤列表。
**Request Query**: `game_id` (int, required)

**Logic**:
1. 呼叫 `Internal` Service 取得原始 Game Data。
2. 查詢本地 `game_tags` table 取得該 `game_id` 的所有 `tag_id`。
3. 查詢 `tags` table 取得標籤詳細資訊。
4. 將 `tags` 陣列合併至 Game Data 中回傳。

**Response**:
```json
{
  "id": 1001,
  "name": "Fortune Tiger",
  "code": "fortune_tiger",
  "tags": [
    {
      "id": 1,
      "name_tw": "熱門",
      "enable": true
    }
  ]
}
```

#### [PUT] /api/backend/game/tags
**說明**：更新遊戲的標籤（全量替換）。
**Request Body**:
```json
{
  "game_id": 1001,
  "tag_ids": [1, 2, 3]
}
```

**Logic**:
1. 驗證 `game_id` (可選：呼叫 Internal 確認遊戲存在，或信任前端)。
2. 驗證 `tag_ids` 是否存在於 `tags` table。
3. 刪除 `game_tags` 中該 `game_id` 的所有紀錄。
4. 寫入新的 `game_id` + `tag_id` 組合。

---

## 4. 實作細節

### 4.1 實作任務清單

| # | 任務 | 依賴 |
|---|-----|-----|
| 1 | 建立 Migration: `create_tags_tables` (包含 4 張表) | - |
| 2 | 建立 Models: `Tag`, `TagGroup`, `GameTag` | 1 |
| 3 | 建立 `TagService`: 實作 CRUD 方法 | 2 |
| 4 | 建立 `GameTagService`: 實作 `getGameWithTags` 與 `syncGameTags` | 2, `Internal` Service |
| 5 | 建立 `TagController`: 實作 Tag/Group API | 3 |
| 6 | 建立 `GameTagController`: 實作 Game Tag API | 4 |
| 7 | 設定 `routes/api.php`: 註冊路由 | 5, 6 |

### 4.2 關鍵邏輯 (Pseudo Code)

#### GameTagService::getGameWithTags

```php
public function getGameWithTags($gameId) {
    // 1. Get Game Data from Internal API
    $path = '/api/backend/game'; // 注意：需確認 Internal API 路徑是否支援單筆查詢或需調整
    // 假設 Internal API 支援 ?id=xxx
    $gameData = app('Service')::init('Internal')::call($path, ['id' => $gameId]);
    
    if (!$gameData) {
        throw new RuntimeException('no_such_game');
    }

    // 2. Get Local Tags
    $tagIds = GameTag::where('game_id', $gameId)->pluck('tag_id');
    $tags = Tag::whereIn('id', $tagIds)->get();

    // 3. Merge
    $gameData['tags'] = $tags;

    return $gameData;
}
```

#### GameTagService::syncGameTags

```php
public function syncGameTags($gameId, array $tagIds) {
    // Transaction
    DB::transaction(function() use ($gameId, $tagIds) {
        // Delete old
        GameTag::where('game_id', $gameId)->delete();
        
        // Insert new
        $data = [];
        foreach ($tagIds as $tagId) {
            $data[] = ['game_id' => $gameId, 'tag_id' => $tagId];
        }
        GameTag::insert($data);
    });
    
    return true;
}
```

### 4.3 錯誤處理設計

| Exception | 錯誤碼 | 觸發條件 |
|-----------|-------|---------|
| RuntimeException | no_such_tag | 更新時傳入不存在的 Tag ID |
| RuntimeException | no_such_group | 操作不存在的 Group |
| RuntimeException | no_such_game | 查詢不存在的 Game ID |

---

## 5. 部署與驗證

### 5.1 部署注意事項
| 階段 | 項目 | 說明 |
|-----|-----|-----|
| 部署前 | Migration | 執行 `php artisan migrate` 建立標籤相關資料表 |
| 部署中 | Cache | 建議執行 `php artisan route:cache` 更新路由 |

### 5.2 驗證項目

#### 單元/整合測試重點
1. **Tag CRUD**: 測試新增標籤，確認 DB 寫入正確。
2. **Tag Group Sync**: 測試群組關聯標籤，確認 `tag_group_items` 資料正確。
3. **Game Tag Integration**:
   - Mock `Internal` Service 的回應。
   - 呼叫 `GET /api/backend/game/tags`，驗證回傳結構包含 `tags` 欄位。
   - 呼叫 `PUT /api/backend/game/tags`，驗證 DB `game_tags` 資料更新正確。

### 5.3 自我檢查點
- [ ] 所有 API 回應格式是否符合文件規範 (包含 `count`, `list` 結構)。
- [ ] `enable` 狀態是否在列表 API 中正確過濾 (若有 `enable` 參數)。
- [ ] `GameTagService` 是否正確處理 Internal API 失敗的情況 (應回傳錯誤或空)。

---

## 6. 後續建議 (Optional)
- **快取機制**：`Tags` 與 `TagGroups` 變動頻率低，建議在 `TagService` 加入 Cache Layer (Redis)，減少 DB 讀取。
- **批次查詢優化**：若未來有「取得遊戲列表並顯示標籤」的需求（目前僅單筆），需避免 N+1 問題，應實作 `getGamesWithTags(array $gameIds)`。
