# Stars-fix-game-sort-bug.md

## 版本記錄

| 版本 | 更新時間 | 變更摘要 |
|------|---------|----------|
| v1.0 | 2026-03-03 | 初次審查 commit f998e5de，確認修復邏輯完整且無功能回歸。 |

---

## 變更摘要

| 項目       | 內容                 |
| ---------- | -------------------- |
| 變更檔案數 | 3 個                 |
| 變更類型   | 修復 (Fix)           |
| 影響範圍   | 營運平台遊戲管理模組 |

---

## 問題清單

### 🔴 嚴重（必須修復）

無

### 🟡 警告（建議修復）

無

### 🔵 建議（可選修復）

| 檔案:行號          | 問題描述         | 建議修復                  |
| ------------------ | ---------------- | ------------------------- |
| `app/Services/ProviderGames.php:708-712` | **程式碼簡化**：`updateGames` 方法中的 `if-else` 邏輯可以精簡。由於 Laravel 的 `upsert` 方法第三個參數預設即為 `null`，手動判斷顯得冗餘。 | 改為 `ProviderGamesModel::upsert($data, [ 'provider_id', 'game_id' ], $update);`。 |

---

## 審查結論

### 各類別評分

| 類別       | 權重 | 得分  | 狀態     | 說明 |
| ---------- | ---- | ----- | -------- | ---- |
| SOLID 原則 | 25%  | 100   | ✅ | 符合單一職責與開閉原則。 |
| 程式碼品質 | 20%  | 95    | ✅ | 邏輯清晰，僅有極小處可簡化。 |
| 功能正確性 | 15%  | 100   | ✅ | 成功解決了分類資訊被無條件覆寫的問題。 |
| 安全性     | 15%  | 100   | ✅ | 使用 Eloquent 內建方法，無注入風險。 |
| 多層架構   | 15%  | 100   | ✅ | Controller 與 Service 層職責分明。 |
| 效能       | 5%   | 100   | ✅ | 使用 upsert 進行批次處理，效率最佳。 |
| 可測試性   | 5%   | 100   | ✅ | 方法參數化後更易於撰寫單元測試。 |

### 總分計算

**加權總分**：99 / 100

### 合併判定

| 分數區間 | 判定      | 行動             |
| -------- | --------- | ---------------- |
| 90-100   | ✅ 優秀   | 可直接合併       |
| 70-89    | ⚠️ 良好   | 修復警告後可合併 |
| 50-69    | ⚠️ 待改善 | 必須修復問題     |
| 0-49     | ❌ 拒絕   | 需重大修改       |

**最終結論**：✅ 可合併

---

## 審查來源

```diff
diff --git a/app/Http/Controllers/ProviderGameController.php b/app/Http/Controllers/ProviderGameController.php
index 556a6591..c955816c 100644
--- a/app/Http/Controllers/ProviderGameController.php
+++ b/app/Http/Controllers/ProviderGameController.php
@@ -430,7 +430,7 @@ class ProviderGameController extends Controller
                 ];
             }
 
-            $providerGameService->updateGames($data);
+            $providerGameService->updateGames($data, [ 'deleted_at' ]);
 
             // 若拔除遊戲，則需刪除遊戲狀態紀錄和排序
             $gameSortService = app('Service')->init('GameSort');
diff --git a/app/Services/ProviderGames.php b/app/Services/ProviderGames.php
index 73f7852e..bee00a5d 100644
--- a/app/Services/ProviderGames.php
+++ b/app/Services/ProviderGames.php
@@ -703,9 +703,13 @@ class ProviderGames
      * @param  int  $providerId  營運平台ID
      * @param  array  $gameIds  遊戲ids
      */
-    public function updateGames($data)
+    public function updateGames($data, $update = null)
     {
-        ProviderGamesModel::upsert($data, [ 'provider_id', 'game_id' ]);
+        if ($update !== null) {
+            ProviderGamesModel::upsert($data, [ 'provider_id', 'game_id' ], $update);
+        } else {
+            ProviderGamesModel::upsert($data, [ 'provider_id', 'game_id' ]);
+        }
     }
 
     public function deleteGames($providerId, $gameIds)
```