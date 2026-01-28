# Stars - 遊戲列表多語系搜尋優化與穩定性提升 - 實作規劃

## 版本記錄

| 版本 | 更新時間 | 變更摘要 |
|------|---------|----------|
| v1.0 | 2026-01-28 15:10 | 初次規劃：修復 Column 映射風險與搜尋邏輯重構 |

---

## 1. 需求概述

### 1.1 背景與目標
- **需求背景**：在之前的 Code Review 中發現 `ProviderGames` Service 存在嚴重的 `Undefined array key` 風險，且多語系搜尋邏輯在 `Games` 與 `ProviderGames` Service 中重複實作，違反 DRY 原則。
- **功能目標**：
    1.  **穩定性提升**：為 `listsByProviderGames` 的欄位映射增加防禦性檢查。
    2.  **程式碼重構**：將多語系搜尋邏輯提取至 `Games` Model 的 Query Scope，提升可維護性。
- **影響範圍**：後台遊戲列表搜尋功能 (`GamesService`, `ProviderGamesService`)。

### 1.2 範圍界定
- **包含**：
    - `app/Models/Games.php`：新增 `scopeSearchByName`。
    - `app/Services/Games.php`：重構 `lists` 方法使用新 Scope。
    - `app/Services/ProviderGames.php`：重構 `listsByProviderGames` 使用新 Scope 並增加欄位驗證。
- **不包含**：
    - 前端介面變更。
    - 資料庫 Schema 異動。
- **假設條件**：
    - `game_language` 資料表已存在且與 `games` 透過 `game_id` 關聯。

---

## 2. 系統架構變更

### 2.1 資料庫變更
- **N/A** (本次無資料庫變更)

### 2.2 設定變更
- **N/A**

### 2.3 程式碼結構
#### 修改檔案
| 檔案路徑 | 修改內容摘要 |
|---------|-------------|
| `app/Models/Games.php` | 新增 `scopeSearchByName` 封裝多語系搜尋邏輯 |
| `app/Services/Games.php` | 在 `lists` 方法中呼叫 Model Scope |
| `app/Services/ProviderGames.php` | 在 `listsByProviderGames` 中增加欄位白名單驗證，並使用 Model Scope |

---

## 3. API 規格設計

### 3.1 端點總覽
- 本次為內部邏輯優化，不異動對外 API 規格，但提升了 API 的魯棒性 (Robustness)。

---

## 4. 實作細節

### 4.1 實作任務清單

| # | 任務 | 依賴 |
|---|-----|-----|
| 1 | 在 `app/Models/Games.php` 實作 `scopeSearchByName` | - |
| 2 | 修改 `app/Services/Games.php` 移除舊有重複搜尋邏輯並改用 Scope | 1 |
| 3 | 修改 `app/Services/ProviderGames.php` 增加欄位映射 `isset` 檢查 | - |
| 4 | 修改 `app/Services/ProviderGames.php` 移除搜尋邏輯並改用 Scope | 1, 3 |
| 5 | 撰寫單元測試驗證 Scope 正確性與無效欄位處理 | 1, 3, 4 |

### 4.2 關鍵邏輯（提供偽代碼）

#### Model Scope 邏輯 (`app/Models/Games.php`)
```php
public function scopeSearchByName($query, $keyword)
{
    if (empty($keyword)) return $query;
    
    return $query->where(function ($q) use ($keyword) {
        $q->where('games.name', 'LIKE', "%{$keyword}%")
          ->orWhereExists(function ($sub) use ($keyword) {
              $sub->select(DB::raw(1))
                  ->from('game_language')
                  ->whereColumn('game_language.game_id', 'games.id')
                  ->where('game_language.name', 'LIKE', "%{$keyword}%");
          });
    });
}
```

#### Service 防禦性欄位映射 (`app/Services/ProviderGames.php`)
```php
// listsByProviderGames 方法中
$column = [];
if (isset($opts['column'])) {
    foreach ($opts['column'] as $value) {
        // 增加 isset 檢查防止 500 錯誤
        if (isset($queryColumn[$value])) {
            $column[] = $queryColumn[$value];
        }
    }
    // 若傳入欄位皆無效，fallback 至預設全選
    if (empty($column)) {
        $column = array_values($queryColumn);
    }
} else {
    $column = array_values($queryColumn);
}
```

### 4.3 錯誤處理設計
| Exception | 錯誤碼 | 觸發條件 |
|-----------|-------|---------|
| Undefined array key | N/A (已修復) | 傳入不正確的 column 參數時不再觸發 |

---

## 5. 部署與驗證

### 5.1 部署注意事項
- 本次僅為程式碼重構與穩定性修復，無特殊部署順序要求。

### 5.2 驗證項目
#### 單元測試
| 測試類別 | 測試項目 | 預期結果 |
|---------|---------|---------|
| GamesModelTest | `scopeSearchByName` 搜尋原名 | 回傳匹配遊戲 |
| GamesModelTest | `scopeSearchByName` 搜尋語系名 | 回傳匹配遊戲 |
| ProviderGamesTest | 傳入無效 `column` 參數 | 不崩潰，回傳預設欄位或報錯 |

#### 整合測試
| 測試類別 | 測試情境 | 預期結果 |
|---------|---------|---------|
| ControllerTest | 呼叫遊戲列表 API 帶 `like[name]` | 成功回傳篩選後的資料 |
| ControllerTest | 呼叫列表 API 帶無效 `column` | HTTP 200 (或依業務決定報錯) |

### 5.3 自我檢查點

- [ ] `Games` Model 是否已 import `DB` facade？
- [ ] `ProviderGames` Service 是否已正確引入 `Games` Model？
- [ ] `isset` 檢查是否涵蓋所有映射路徑？
- [ ] 是否已移除 `GamesService` 中的重複程式碼？
