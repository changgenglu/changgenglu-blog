# satellite - 控端遊戲標籤與群組管理 API 實作規劃

## 版本記錄

| 版本 | 更新時間 | 變更摘要 |
|------|---------|----------|
| v1.0 | 2026-01-30 | 初次規劃：標籤(Tag)、標籤群組(TagGroup) 與 遊戲標籤綁定功能 |

---

## 0. 專案現況分析摘要

> 本區塊記錄規劃前的專案分析結果，確保實作與專案架構一致。

### 0.1 參考的既有實作

| 檔案 | 參考原因 | 關鍵發現 |
|-----|---------|---------|
| `routes/api.php` | 了解路由結構 | 控制器直接位於 `App\Http\Controllers` 命名空間下，無 `Backend` 子目錄。 |
| `app/Services/Internal.php` | 了解外部服務調用 | 專案作為 BFF，核心資料（如 Game）位於外部，需透過 API 取得，本地僅儲存擴充關聯資料。 |
| `app/Models/*` | 確認資料模型現況 | `Game` Model 不存在本地，故 `game_tags` 關聯表僅能儲存 `game_id` 而無法建立 Foreign Key。 |

### 0.2 識別的架構模式

| 項目 | 專案採用方式 |
|-----|-------------|
| 分層架構 | Controller → Service (Factory Pattern `app('Service')::init()`) → Model |
| 資料存儲 | 標籤與群組資料存放於本地 DB (`satellite`)，遊戲資料透過 Internal API 獲取。 |
| 跨服務關聯 | 本地 `game_tags` 表透過 `game_id` 邏輯關聯外部遊戲，無資料庫層級 FK 約束。 |
| 軟刪除 | 專案普遍使用 `SoftDeletes`。 |

### 0.3 必須遵循的慣例

- **Service 調用**：必須使用 `app('Service')::init('ServiceName')` 方式調用。
- **命名規範**：Model 使用單數（如 `Tag`），Table 使用複數（如 `tags`）。
- **API 回應**：遵循專案既有 JSON 結構（含 `x-pid` Header 處理）。
- **權限控制**：需整合既有 Header `x-pid` 驗證。

---

## 1. 需求概述

### 1.1 背景與目標
- **背景**：目前後台缺乏遊戲標籤（如：熱門、最新）與群組（如：首頁推薦）的管理機制，無法靈活配置前端顯示內容。
- **目標**：實作一套完整的 RESTful API，提供控端人員管理標籤、群組及設定遊戲關聯。
- **影響範圍**：後台管理介面（API）、前端遊戲列表顯示（資料源）。

### 1.2 範圍界定
- **包含**：
    - 標籤 (Tag) CRUD 與 啟用/停用。
    - 標籤群組 (TagGroup) CRUD 與 啟用/停用。
    - 標籤與群組的關聯管理。
    - 遊戲與標籤的關聯管理。
- **不包含**：
    - 遊戲本身的新增/修改（屬外部核心系統職責）。
    - 前端顯示 API（本次僅實作後台管理 API）。
- **假設條件**：
    - 前端會傳入正確的 `game_id`。
    - `x-pid` 用於區分營運平台權限或記錄。

---

## 2. 系統架構變更

### 2.1 資料庫變更

#### 新增資料表

| 資料表名稱 | 說明 |
|-----------|-----|
| `tags` | 儲存標籤定義（多語系名稱、類型） |
| `tag_groups` | 儲存標籤群組定義 |
| `tag_group_map` | 標籤與群組的多對多關聯 |
| `game_tags` | 遊戲與標籤的多對多關聯 |

#### Schema 設計 (Pseudo Migration)

```yaml
table: tags
  - id: bigInteger, auto_increment, primary
  - type: integer, default(0), index    # 標籤類型
  - name_tw: string(20)                 # 繁中名稱
  - name_cn: string(20), nullable       # 簡中名稱
  - name_en: string(20), nullable       # 英文名稱
  - description: string(50), nullable
  - enable: boolean, default(true), index
  - created_at: timestamp
  - updated_at: timestamp
  - deleted_at: timestamp               # Soft Delete

table: tag_groups
  - id: bigInteger, auto_increment, primary
  - name: string(20)
  - description: string(50), nullable
  - enable: boolean, default(true), index
  - created_at: timestamp
  - updated_at: timestamp
  - deleted_at: timestamp               # Soft Delete

table: tag_group_map
  - group_id: bigInteger, index
  - tag_id: bigInteger, index
  - primary_key: [group_id, tag_id]
  # FK constraints optional depending on DB engine but recommended for internal integrity

table: game_tags
  - game_id: integer, index             # 外部遊戲 ID，無 FK
  - tag_id: bigInteger, index
  - primary_key: [game_id, tag_id]
```

### 2.2 程式碼結構

#### 新增檔案

| 檔案路徑 | 類型 | 職責說明 |
|---------|-----|---------|
| `app/Models/Tag.php` | Model | 標籤模型 |
| `app/Models/TagGroup.php` | Model | 標籤群組模型 |
| `app/Models/GameTags.php` | Model | 遊戲標籤關聯模型 (Pivot 概念) |
| `app/Services/Tag.php` | Service | 處理標籤與群組的 CRUD 邏輯 |
| `app/Services/GameTag.php` | Service | 處理遊戲與標籤綁定邏輯 |
| `app/Http/Controllers/TagController.php` | Controller | 標籤與群組管理 API |
| `app/Http/Controllers/GameTagController.php` | Controller | 遊戲標籤綁定 API |

---

## 3. API 規格設計

> 詳細 Request/Response 格式請參閱原始需求文件 `@遊戲標籤API文件.md`，此處列出端點清單。

### 3.1 端點總覽

**Base URL**: `/api/backend`

| Method | Path | 說明 |
|--------|------|-----|
| **Tag Management** | | |
| POST | `/tag` | 新增標籤 |
| GET | `/tag` | 取得單一標籤 |
| PUT | `/tag` | 修改標籤 |
| GET | `/tag/list` | 取得標籤列表 (Pagination) |
| PUT | `/tag/enable` | 啟用標籤 |
| PUT | `/tag/disable` | 停用標籤 |
| GET | `/tag/type/list` | 取得標籤類型列表 |
| **Group Management** | | |
| POST | `/tag_group` | 新增群組 |
| GET | `/tag_group` | 取得群組資訊 |
| PUT | `/tag_group` | 修改群組 |
| GET | `/tag_group/list` | 取得群組列表 |
| PUT | `/tag_group/enable` | 啟用群組 |
| PUT | `/tag_group/disable` | 停用群組 |
| GET | `/tag_group/tags` | 取得群組內標籤 |
| PUT | `/tag_group/tags` | 更新群組內標籤 (Sync) |
| **Game Tag Binding** | | |
| GET | `/game/tags` | 取得遊戲標籤資訊 |
| PUT | `/game/tags` | 更新遊戲標籤 (Sync) |

---

## 4. 實作細節

### 4.1 實作任務清單

| # | 任務 | 依賴 |
|---|-----|-----|
| 1 | 建立 Migration: `create_tags_tables` (含 tags, tag_groups, pivots) | - |
| 2 | 建立 Models: `Tag`, `TagGroup`, `GameTags` | 1 |
| 3 | 建立 Service: `Tag` (含 CRUD、啟用停用邏輯) | 2 |
| 4 | 建立 Service: `GameTag` (含綁定邏輯) | 2 |
| 5 | 建立 Controller: `TagController` (實作 Tag & Group API) | 3 |
| 6 | 建立 Controller: `GameTagController` (實作 Game bind API) | 4 |
| 7 | 設定 Routes (`routes/api.php`) | 5,6 |

### 4.2 關鍵邏輯 (Pseudo Code)

#### Tag Service - Update Group Tags (Sync)

```php
// app/Services/Tag.php

public function updateGroupTags(int $groupId, array $tagIds)
{
    // 1. 驗證 Group 是否存在
    $group = TagGroup::find($groupId);
    if (!$group) throw new Exception('no_such_tag_group');

    // 2. 驗證 Tags 是否存在
    $validTags = Tag::whereIn('id', $tagIds)->count();
    if ($validTags != count($tagIds)) throw new Exception('no_such_tag');

    // 3. Sync 關聯 (使用 DB Transaction)
    DB::transaction(function() use ($group, $tagIds) {
        // 先移除舊關聯，再新增新關聯，或使用 sync()
        $group->tags()->sync($tagIds);
    });

    return true;
}
```

#### GameTag Service - Get Game With Tags

```php
// app/Services/GameTag.php

public function getGameWithTags(int $gameId)
{
    // 1. 從 Internal API 取得遊戲基本資訊
    $gameInfo = app('Service')::init('Internal')::getGame($gameId);
    if (!$gameInfo) throw new Exception('no_such_game');

    // 2. 從本地 DB 取得關聯標籤
    $tagIds = GameTags::where('game_id', $gameId)->pluck('tag_id');
    $tags = Tag::whereIn('id', $tagIds)->get();

    // 3. 合併資料回傳
    $gameInfo['tags'] = $tags;
    return $gameInfo;
}
```

### 4.3 錯誤處理設計

| Exception | 錯誤碼 (Response) | 觸發條件 |
|-----------|------------------|---------|
| NotFoundException | `no_such_tag` | ID 不存在 |
| NotFoundException | `no_such_tag_group` | Group ID 不存在 |
| NotFoundException | `no_such_game` | 呼叫 Internal API 回傳 404 |

---

## 5. 部署與驗證

### 5.1 部署注意事項
- **Migration**: 需執行 `php artisan migrate` 建立 4 張新表。
- **Seeder**: 建議新增 `TagSeeder` 預填基本標籤類型 (Tag Types)。

### 5.2 驗證項目

#### 單元/整合測試重點
1. **Tag CRUD**: 測試新增標籤，驗證 `name_tw` 寫入正確。
2. **Soft Delete**: 測試刪除後 `deleted_at` 更新，且 `list` API 預設不回傳。
3. **Group-Tag Sync**: 測試將 Tag A, B 加入 Group，再更新為 Tag B, C，確認 A 被移除且 C 被加入。
4. **Game-Tag Binding**: 測試不存在的 `game_id` 是否正確拋出錯誤 (依賴 Mock Internal Service)。

### 5.3 自我檢查點
- [ ] 所有 API 回應格式是否包含 `data` 或直接回傳物件 (依 spec)？
- [ ] 是否正確處理 `enable` 狀態過濾？
- [ ] `game_tags` 表是否建立了正確的複合索引以優化查詢？
