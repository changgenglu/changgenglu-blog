# Bug 摘要報告

## 後台遊戲列表種類對不上

---

## 問題說明

後台管端的遊戲列表（`api/backend/agent/game/list`）與遊戲排序列表（`api/backend/agent/game/sort_list`）在相同 `category_type` 條件下，回傳的遊戲數量不一致。

---

## 原因

問題由以下操作序列觸發：

1. 遊戲上架後，透過 `AgentGameController::edit` 手動逐筆修改管端遊戲的 `client_category_type`（例如由 300 改為 900），此時會將 game_sort 表中該平台該款遊戲舊的分類（category_type=300）移除
2. 透過 `GameSortController::update` 將更新後的分類（900）寫入遊戲排序，此時 provider_game 和 game_sort 的遊戲分類是相同的（provider_game.client_category_type=900, game_sort.category_type=900）
3. 後續當需要在平台新增遊戲時，透過 `ProviderGameController::updateGames` 將新遊戲加入平台，**但此方法在執行 upsert 時，對所有傳入的 `game_ids`（含已存在的遊戲）一律以 `games` 表的預設值覆寫 `client_category_type`**，導致步驟 1 手動修改的分類（900）被還原為預設值（300）

### 最終結果

```
provider_games.client_category_type = 300  （被覆蓋回預設值）
game_sort.category_type             = 900  （未同步更新）
```

兩支 API 分別以不同欄位過濾分類：
- `game/list` 使用 `provider_games.client_category_type`
- `game/sort_list` 使用 `game_sort.category_type`

兩者不一致導致結果分歧。

---

## 調整方向

`ProviderGameController::updateGames` 在執行 upsert 時，應區分「新加入的遊戲」與「已存在的遊戲」：

- **新加入的遊戲**：使用 `games` 表的預設 `client_category_type`
- **已存在的遊戲**：保留 `provider_games` 中現有的 `client_category_type`，不予覆寫

---

## 驗證方法

在 `TestController::index` 中模擬完整操作流程，依序執行：

| 步驟 | 操作 | 方法 | 備註 |
|------|------|------|------|
| 1 | 將 `game_id IN (915, 916)` 加入 `provider_id=11` | `ProviderGameController::updateGames` | — |
| 2 | 將 915、916 上架 | `AgentGameStatusController::multiRelease` | — |
| 3 | 逐筆將 915、916 的 `client_category_type` 由 300 改為 900 | `AgentGameController::edit` | 兩筆遊戲各一次 |
| 4 | 以 `category_type=900` 更新三種排序類型 | `GameSortController::update` | `sort_type=1,2,3` |
| 5 | 加入新遊戲 920，傳入 `game_ids=[915, 916, 920]` | `ProviderGameController::updateGames` | **Bug 觸發點** |

### 驗證結果

執行步驟 5 後查詢資料庫：

```sql
-- 查詢 provider_games
SELECT client_category_type FROM provider_games
WHERE provider_id = 11 AND game_id IN (915, 916);
-- 結果：client_category_type = 300 （被還原為預設值）

-- 查詢 game_sort
SELECT category_type FROM game_sort
WHERE provider_id = 11 AND game_id IN (915, 916) AND type = 1;
-- 結果：category_type = 900 （保持不變）
```

資料不一致狀況重現，導致兩支 API 查詢結果不符。

---

## 相關代碼位置

| 檔案 | 行號 | 問題 |
|-----|------|------|
| `app/Http/Controllers/ProviderGameController.php` | 421-431 | upsert 時無條件覆寫 `client_category_type` |
| `app/Http/Controllers/GameSortController.php` | 68-75 | 驗證 `game_ids` 存在時，未驗證分類一致性 |

---

## 影響範圍分析

### 直接受影響的 API

| API 端點 | 說明 |
|---------|------|
| `api/backend/agent/game/list` | 以 `provider_games.client_category_type` 過濾，分類被還原後遊戲歸屬錯誤 |
| `api/backend/agent/game/sort_list` | 以 `game_sort.category_type` 過濾，結果與 `game/list` 不一致 |
| `api/backend/game/sort_list` | 同上（控端版本） |

### 間接受影響的系統

| 系統 | 影響說明 |
|-----|---------|
| 日報表統計 | `GameReportController` 以 `client_category_type` 分類統計，數據歸屬到錯誤分類 |
| 排行榜報表 | `MakeRankReport` Command 以 `client_category_type` 作為排程條件，分類錯誤導致統計不準 |
| 自動排序 Job | `HotGame`、`AllGame`、`NewGame` 以 `client_category_type` 撈遊戲，下次執行時會將 `game_sort` 也修正為錯誤分類，導致資料「一致地錯誤」 |

### 長期風險

由於排序 Job 定期執行，會逐步將 `game_sort.category_type` 同步為錯誤的 `client_category_type`，屆時兩邊資料形成「一致的錯誤」，問題更難被察覺，但實際上遊戲出現在錯誤的分類頁面中。

---

## 資料庫修復說明

### 當前影響範圍

| 環境 | 站台 | 影響狀況 |
| ---- | ---- | -------- |
| 正式環境 | 星城站 | **無影響** - `provider_games.client_category_type` 與 `games.client_category_type` 預設值相同 |
| 測試環境 | 印度站（新站） | **受影響** - 此 Bug 導致資料不一致 |
| DBA 系統 | — | **無影響** - DBA 僅提供正式環境資料，未涉及測試環境 |

### 修復優先順序

**1. 代碼修復（立即執行）**
- 調整 `ProviderGameController::updateGames` 的邏輯（第 421-431 行），區分新舊遊戲
- 新加入的遊戲：使用 `games` 表預設值
- 已存在的遊戲：保留現有的 `client_category_type`，不予覆寫
- 預防未來在其他測試站點重複觸發此 Bug

**2. 印度站測試環境資料修復（測試階段執行）**
- 由於印度站仍在測試環境，資料可直接重置或修正
- 修復方向：確認遊戲的預期分類，批次更新 `provider_games.client_category_type`
- 無需涉及 DBA，因為 DBA 僅支持正式環境

**3. 檢查與上線檢驗**
- 代碼修復上線後，驗證新增遊戲時是否保留既有分類
- 印度站上線前確保資料一致性

### 不涉及的項目

- ✅ **DBA 側資料**：無需修復，DBA 僅提供正式環境資料
- ✅ **正式環境（星城站）**：無需修復，該站的資料已一致

### 相關代碼確認點

- `ProviderGameController::updateGames` 第 421-431 行：upsert 邏輯
- `ProviderGames::updateGames()` Service 層：實際執行 upsert 的方法
