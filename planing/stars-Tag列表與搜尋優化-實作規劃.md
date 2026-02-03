# Stars 專案 - Tag 列表與搜尋優化 - 實作規劃

## 版本記錄

| 版本 | 更新時間         | 變更摘要 |
| ---- | ---------------- | -------- |
| v1.0 | 2026-02-03 12:00 | 初次規劃：Tag 列表關聯、搜尋與類型欄位優化 |

---

## 0. 專案現況分析摘要

> 本區塊記錄規劃前的專案分析結果，確保實作與專案架構一致。

### 0.1 參考的既有實作

| 檔案 | 參考原因 | 關鍵發現 |
| --- | --- | --- |
| `app/Http/Controllers/TagController.php` | 了解 Controller 慣例 | 目前使用 `app('Service')->init('Tags')` 呼叫服務層；`lists` 與 `tagGroupLists` 為主要修改目標 |
| `app/Services/Tags.php` | 了解 Service 調用方式 | `lists` 方法目前僅支援精確搜尋 (`$stmt->where`)，不支援模糊搜尋或 OR 條件；缺乏 Eager Loading 機制 |
| `app/Models/Tags.php` | 了解 Model 結構 | 缺乏 `type` 欄位（需透過 ID 計算）；缺乏 `groups` 關聯方法；無 `name` 欄位（多語系） |
| `app/Models/TagGroups.php` | 了解關聯結構 | 定義了 `tags()` (BelongsToMany)，需在 `Tags` Model 建立反向關聯 |
| `app/Interfaces/ITags.php` | 了解 Type 定義 | Tag ID 具有範圍意義（如 10000 為國家），`type` 需依據 ID 範圍判斷 |

### 0.2 識別的架構模式

| 項目 | 專案採用方式 |
| --- | --- |
| 分層架構 | Controller (驗證/參數) → Service (查詢邏輯) → Model (資料/Scope) |
| 命名慣例 | Service 初始化慣用 `app('Service')->init('Name')`；Response 包含 `count` 與 `list` |
| 錯誤處理 | 使用 `App\Exceptions\NotFoundException` 等自定義 Exception |
| 驗證方式 | Controller 內使用 `$this->validate()` |
| API 回應格式 | JSON `{'count': int, 'list': array}` |

### 0.3 必須遵循的慣例

- Service 層方法回傳標準陣列或物件結構
- 使用 `ITags` 定義的常數處理類型邏輯
- 保持既有的 `getXxxAttribute` Accessor 風格

---

## 1. 需求概述

### 1.1 背景與目標

- **需求背景**：目前的 Tag 列表 API 功能不足，無法一次取得關聯群組、缺乏類型標識，且搜尋功能僅支援單一語系精確比對，造成前端使用不便。
- **功能目標**：
    1. 優化 `GET /backend/tag/list`：支援多語系模糊搜尋、類型篩選、回傳包含 `type` 與 `tag_group`。
    2. 優化 `GET /backend/tag_group/list`：支援名稱模糊搜尋。
- **影響範圍**：後台 Tag 管理相關 API。

### 1.2 範圍界定

- **包含**：
    - 修改 `TagController` 驗證與參數傳遞
    - 修改 `Tags` Service 查詢邏輯
    - 修改 `Tags` Model 新增關聯與 Accessor
- **不包含**：
    - 前端頁面修改
    - 既有資料庫 Schema 變更（不新增實體欄位，僅透過邏輯處理）
- **假設條件**：
    - Tag 的 `type` 由 ID 範圍決定（依據 `ITags` 定義，例如 `10000` 範圍）。

---

## 2. 系統架構變更

### 2.1 資料庫變更

#### 新增/修改資料表

*本需求不涉及實體資料表結構變更，僅涉及 Model 層邏輯定義。*

### 2.2 設定變更

*無*

### 2.3 程式碼結構

#### 修改檔案

| 檔案路徑 | 修改內容摘要 |
| --- | --- |
| `app/Models/Tags.php` | 新增 `groups()` 關聯；新增 `getTypeAttribute`；新增 `scopeSearchName` 與 `scopeOfType` |
| `app/Services/Tags.php` | 重構 `lists` 支援複雜查詢與關聯載入；重構 `groupLists` 支援模糊搜尋 |
| `app/Http/Controllers/TagController.php` | `tagLists` 新增 `type` 參數驗證；`tagGroupLists` 調整查詢邏輯 |

---

## 3. API 規格設計

### 3.1 詳細規格

#### [GET] /api/backend/tag/list

**說明**：依條件查詢出對應的標籤列表清單（功能增強）

**Request (Query Parameters)**

| 欄位 | 類型 | 必填 | 說明 |
| --- | --- | --- | --- |
| name | string | 否 | 標籤名稱（支援模糊搜尋 tw/cn/en） |
| type | int | 否 | 標籤類型 ID（如 10000, 20000） |
| limit | int | 否 | 筆數 (Default: 20) |
| offset | int | 否 | Offset (Default: 0) |
| ... | ... | ... | (其他既有參數保持不變) |

**Response - Success (200)**

```json
{
    "count": 100,
    "list": [
        {
            "id": 10001,
            "name_tw": "台灣",
            "name_cn": "台湾",
            "name_en": "Taiwan",
            "description": "...",
            "type": 10000,          // [新增] 計算出的類型 ID
            "groups": [             // [新增] 關聯的群組列表
                {
                    "id": 1,
                    "name": "亞洲地區"
                }
            ],
            "created_at": "...",
            "updated_at": "..."
        }
    ]
}
```

#### [GET] /api/backend/tag_group/list

**說明**：依條件查詢出對應的標籤群組列表清單（功能增強）

**Request (Query Parameters)**

| 欄位 | 類型 | 必填 | 說明 |
| --- | --- | --- | --- |
| name | string | 否 | 群組名稱（支援模糊搜尋） |
| ... | ... | ... | (其他既有參數保持不變) |

---

## 4. 實作細節

### 4.1 實作任務清單

| # | 任務 | 依賴 |
| --- | --- | --- |
| 1 | **Model 增強**：在 `Tags` Model 新增 `groups()` 關聯 (BelongsToMany) | - |
| 2 | **Model 增強**：在 `Tags` Model 新增 `getTypeAttribute` (依 ID 判斷) 並加入 `$appends` | - |
| 3 | **Model 增強**：在 `Tags` Model 新增 `scopeSearchName` (OR 模糊搜尋) | - |
| 4 | **Model 增強**：在 `Tags` Model 新增 `scopeOfType` (ID 範圍篩選) | - |
| 5 | **Service 重構**：重構 `Tags::lists` 方法，改用 Query Builder 模式，支援 `with('groups')` 與上述 Scopes | 1,2,3,4 |
| 6 | **Service 重構**：重構 `Tags::groupLists` 方法，支援 `name` 模糊搜尋 | - |
| 7 | **Controller 調整**：修改 `TagController::tagLists` 驗證規則，允許 `type` 參數並傳遞 | 5 |
| 8 | **Controller 調整**：確認 `tagGroupLists` 參數傳遞正確 | 6 |

### 4.2 關鍵邏輯

#### Tags Model - Accessor & Scopes

```php
// app/Models/Tags.php

protected $appends = ['type'];

public function groups()
{
    return $this->belongsToMany(TagGroups::class, 'tag_group_tags', 'tag_id', 'tag_group_id');
}

public function getTypeAttribute()
{
    // 簡單邏輯：以 10000 為單位 (依據 ITags 常數觀察)
    // 10000~19999 -> 10000
    if ($this->id >= 10000) {
        return floor($this->id / 10000) * 10000;
    }
    // 小於 10000 的部分可能需依據 ITags 具體定義處理，或暫時回傳 0/null
    return null; 
}

public function scopeSearchName($query, $keyword)
{
    return $query->where(function ($q) use ($keyword) {
        $q->where('name_tw', 'like', "%{$keyword}%")
          ->orWhere('name_cn', 'like', "%{$keyword}%")
          ->orWhere('name_en', 'like', "%{$keyword}%");
    });
}

public function scopeOfType($query, $type)
{
    // 假設每個 Type 範圍是 10000 (依據 getMaxTagId 邏輯)
    return $query->where('id', '>=', $type)
                 ->where('id', '<', $type + 10000);
}
```

#### Tags Service - lists Refactoring

```php
// app/Services/Tags.php

public function lists(array $where = [], array $opts = [])
{
    $query = TagsModel::with('groups'); // Eager Loading

    // 處理特殊查詢
    if (isset($where['name'])) {
        $query->searchName($where['name']);
        unset($where['name']); // 移除以避免被下方通用邏輯重複處理
    }

    if (isset($where['type'])) {
        $query->ofType($where['type']);
        unset($where['type']);
    }

    // 處理其餘通用條件
    foreach ($where as $key => $value) {
        if (is_array($value)) {
            $query->whereIn($key, $value);
        } else {
            $query->where($key, $value);
        }
    }

    // ... 分頁與排序邏輯 (保持但改用 Builder) ...
}
```

---

## 5. 部署與驗證

### 5.1 部署注意事項

| 階段 | 項目 | 說明 |
| --- | --- | --- |
| 部署後 | Cache | 執行 `php artisan config:cache` (雖無 Config 變更，但為標準程序) |

### 5.2 驗證項目

#### 整合測試 (Postman/Curl)

| 測試情境 | 預期結果 |
| --- | --- |
| `GET /backend/tag/list?name=台灣` | 回傳包含「台灣」、「Taiwan」等名稱的標籤 |
| `GET /backend/tag/list?type=10000` | 僅回傳 ID 在 10000~19999 之間的標籤 |
| `GET /backend/tag/list` (無參) | 列表物件中包含 `type` 欄位與 `groups` 陣列 |
| `GET /backend/tag_group/list?name=亞洲` | 回傳名稱包含「亞洲」的群組 |

### 5.3 自我檢查點

- [ ] 是否正確處理 `name` 不存在於資料表的錯誤（需確認 Controller 驗證規則移除對 `name` 的資料庫欄位檢查，若有）
- [ ] `type` 計算邏輯是否符合 `ITags` 定義
- [ ] 模糊搜尋效能是否可接受（`OR LIKE` 可能無法使用索引，需注意資料量）
