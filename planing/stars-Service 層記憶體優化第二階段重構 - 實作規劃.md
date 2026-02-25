# stars - Service 層記憶體優化第二階段重構 - 實作規劃

## 版本記錄

| 版本 | 更新時間 | 變更摘要 |
| ---- | ---------------- | -------- |
| v1.0 | 2026-02-24 11:55 | 初次規劃 |

---

# Phase 2 重構規劃書：DB 聚合 + 複合索引

## 1. 背景

`MakeServiceDailyReport` 每日凌晨執行一次，統計前一日的登入與儲值數據。  
原實作將 `user_login_record`（~4.3M 筆）與 `user_deposited_record`（~2.2M 筆）的明細資料全數載入 PHP 進行聚合，導致記憶體峰值超過 128 MB 限制（OOM）。

---

## 2. 測試方法與結果

> **重要說明**：本節所有 SQL 測試資料（含 SHOW INDEX、SHOW CREATE TABLE、COUNT(\*)、information_schema 查詢、MySQL 版本確認）均直接在**正式環境**執行取得，非本機或測試環境。

### 2.1 EXPLAIN 查詢計畫分析

**目的**：在修改程式碼或索引之前，先確認資料庫對現有查詢與計畫中的聚合查詢，實際走的是哪條執行路徑，避免盲目修改。

**測試方式**：在正式環境 `record` 資料庫連線下，對以下四種查詢加上 `EXPLAIN` 前綴執行，MySQL 會回傳執行計畫摘要（不實際掃描資料），讀取 `type`、`key`、`key_len`、`Extra` 欄位判斷效能。

**判讀標準：**

| 欄位 | 最佳 | 可接受 | 危險 |
|---|---|---|---|
| `type` | `const` / `range` | `ref` | `ALL`（全表掃描）|
| `key_len` | 越大越好（代表用到更多索引欄位）| — | 僅 2（只用到 provider_id）|
| `Extra` | 無 | `Using where` | `Using filesort`（視結果集大小）|

**EXPLAIN 結果（正式環境）：**

| 查詢說明 | type | key | key_len | Extra |
|---|---|---|---|---|
| 現況：撈全部明細（`SELECT username, vip_level`）| `ref` | `index_provider` | 2 | Using where |
| 改用：VIP 人數 DB 聚合（`GROUP BY vip_level`）| `ref` | `index_provider` | 2 | Using where; Using filesort |
| 付費人數（`COUNT(DISTINCT username)`）| `ref` | `index_provider` | 2 | Using where |
| 各類型儲值金額（`SUM(point) GROUP BY type`）| `ref` | `index_provider` | 2 | Using where; Using filesort |

**結果解讀：**

- 四個查詢均走 `ref`（有用到索引），非全表掃描，DB 聚合方向基本可行。
- `key_len = 2` 代表 MySQL 目前只用 `provider_id`（smallint，2 bytes）進行索引過濾，`created_at` 的範圍條件並未進入索引，退化為逐筆比對（`Using where`）。
- `Using filesort` 出現在帶有 `GROUP BY` 的查詢，代表需要額外排序步驟。由於聚合結果集極小（VIP 等級最多 11 行、儲值類型最多 8 行），此排序成本可接受。

---

### 2.2 正式環境 SQL 聚合實測

**目的**：在正式環境有其他服務同時連線的情況下，驗證 SQL 聚合查詢是否會造成 CPU 飆升或影響其他服務。

**測試方式**：在正式環境（無複合索引）直接執行以下聚合語法，同時觀察 CPU 與查詢回應時間：

```sql
-- VIP 人數聚合
SELECT vip_level, COUNT(DISTINCT username) AS member_count
FROM user_login_record
WHERE provider_id = ? AND created_at >= ? AND created_at < ?
GROUP BY vip_level;

-- 付費人數
SELECT COUNT(DISTINCT username) AS paying_user_count
FROM user_deposited_record
WHERE provider_id = ? AND created_at >= ? AND created_at < ?;

-- 各儲值類型金額
SELECT type, SUM(point) AS total_point
FROM user_deposited_record
WHERE provider_id = ? AND created_at >= ? AND created_at < ?
GROUP BY type;
```

**實測結果：**

- CPU 無明顯飆升，與其他正常查詢無顯著差異
- 查詢回應速度正常，未觀察到阻塞或延遲
- 測試期間其他服務連線持續運作，未受影響

**結論**：DB 聚合查詢在正式環境（含並行連線）下**安全可執行**，無需額外的限流或排程錯開機制。

---

### 2.3 資料表現況調查

**目的**：確認正式環境資料量與索引現況，作為評估 DDL 執行時間與索引設計的依據。

**測試方式**：在正式環境 `record` 資料庫連線下執行以下 SQL：

```sql
SELECT COUNT(*) FROM user_login_record;
SELECT COUNT(*) FROM user_deposited_record;

SELECT table_name, table_rows,
  ROUND(data_length / 1024 / 1024, 2) AS data_mb,
  ROUND(index_length / 1024 / 1024, 2) AS index_mb
FROM information_schema.tables
WHERE table_schema = 'record'
  AND table_name IN ('user_login_record', 'user_deposited_record');

SHOW INDEX FROM user_login_record;
SHOW INDEX FROM user_deposited_record;
```

**測試結果（正式環境）：**

| 項目 | `user_login_record` | `user_deposited_record` |
|---|---|---|
| 精確筆數 | 4,346,418 | 2,241,881 |
| 資料大小 | 345 MB | 127 MB |
| 索引大小 | 162 MB | 82 MB |
| 合計大小 | 507 MB | 209 MB |
| 平均 row size | ~88 bytes | ~59 bytes |

**現有索引：**

| 資料表 | 索引名稱 | 欄位 | Cardinality | 問題 |
|---|---|---|---|---|
| `user_login_record` | `index_provider` | `provider_id` | **2** | 選擇性極低，幾乎無效 |
| `user_login_record` | `..._created_at_index` | `created_at` | 3,418,980 | 無法與 provider 條件同時使用 |
| `user_deposited_record` | `index_provider` | `provider_id` | **1** | 選擇性為零，完全無效 |
| `user_deposited_record` | `..._created_at_index` | `created_at` | 1,597,633 | 無法與 provider 條件同時使用 |

> 兩張資料表目前僅有 provider_id 1 與 2，且 99% 資料屬於 provider 1。`provider_id` 單欄索引 Cardinality 為 1–2，對縮小掃描範圍幾乎沒有幫助。

---

### 2.4 ALTER TABLE 執行時間估算

**MySQL 版本（正式環境）**：8.0.37-google（Google Cloud SQL）

MySQL 8.0 InnoDB 對 `ADD INDEX` 支援 **Online DDL**（`ALGORITHM=INPLACE, LOCK=NONE`），執行期間不鎖表，允許正常讀寫並行。主要耗時為全表掃描並建立 B-tree 索引結構。

| 資料表 | 需掃描資料量 | 新索引估計大小 | 預估時間 |
|---|---|---|---|
| `user_login_record` | 345 MB | ~125 MB | **4–10 分鐘** |
| `user_deposited_record` | 127 MB | ~50 MB | **2–5 分鐘** |
| 合計 | — | — | **6–15 分鐘** |

> 建議於離峰時段（凌晨）執行，避免 replica lag 累積。實際時間受當下資料庫 I/O 負載影響，可能偏離估算範圍。

---

## 3. 技術策略

| 問題 | 原方案（PHP 層） | 本次方案（DB 聚合） |
|---|---|---|
| VIP 人數統計 | 載入全部明細 → PHP `groupBy` | SQL `COUNT(DISTINCT) GROUP BY vip_level` |
| 付費人數統計 | 載入全部明細 → PHP `in_array` | SQL `COUNT(DISTINCT username)` |
| 各類型儲值金額 | 載入全部明細 → PHP `foreach` | SQL `SUM(point) GROUP BY type` |
| 記憶體複雜度 | O(n)，峰值 >128 MB（OOM） | O(1)，趨近 0 MB |
| 正式環境 CPU 影響 | 不適用（PHP OOM 前即中斷）| **實測無明顯 CPU 飆升** |
| 敏感資料外洩風險 | 大量明細存於記憶體，Exception 可能 dump | 無明細在 PHP 記憶體 |

---

## 4. 複合索引評估

### 4.1 建議索引

```sql
ADD INDEX idx_provider_created_at (provider_id, created_at);
```

**為何在 provider_id 選擇性極低的情況下仍有效：**  
複合索引的 B-tree 按 `(provider_id, created_at)` 排序，等同於「先依 provider 分群，群內再依時間排序」。查詢一天的資料時，MySQL 直接跳到 `provider_id = 1` 的時間段做範圍掃描，掃描量從 4.3M 筆降至 ~44,000 筆（約 100 倍改善）。

| 索引方案 | 一天查詢掃描筆數 |
|---|---|
| 現有 `index_provider` | ~4,300,000（99% 全掃）|
| 現有 `created_at_index` | ~45,000（含全 provider）|
| 複合 `(provider_id, created_at)` | ~44,000（精確範圍）|

### 4.2 優先級調整

基於正式環境實測結果（無複合索引下 SQL 聚合查詢無明顯 CPU 影響），**複合索引由必要前提調整為效能優化項目**，可在主體重構完成、排程穩定運行後再擇機建立。

---

## 5. 實作計畫

### 5.1 Service 層重構

#### `UserLoginRecord` — 重構 `getVipLevelMemberCount()`

**現況問題**：查詢所有明細至 PHP，再用 Laravel Collection `groupBy` 聚合，正式環境約產生 22 MB 峰值。

**重構後**：改為 SQL `COUNT(DISTINCT) GROUP BY`，回傳最多 11 筆聚合結果，記憶體趨近 0 MB。

```php
public function getVipLevelMemberCount($providerId, \DateTime $beginAt, \DateTime $endAt): array
{
    $rows = Model::select('vip_level', DB::raw('COUNT(DISTINCT username) AS member_count'))
        ->where('provider_id', $providerId)
        ->where('created_at', '>=', $beginAt)
        ->where('created_at', '<', $endAt)
        ->groupBy('vip_level')
        ->get();

    $result = [];
    foreach ($rows as $row) {
        $result[$row->vip_level] = (int) $row->member_count;
    }

    return $result;
}
```

#### `UserDepositedRecord` — 新增兩個語意明確的聚合方法

保留現有 `lists()` 通用方法不動，僅新增專用方法。

```php
public function getPayingUserCount(int $providerId, \DateTime $beginAt, \DateTime $endAt): int
{
    return (int) Model::where('provider_id', $providerId)
        ->where('created_at', '>=', $beginAt)
        ->where('created_at', '<', $endAt)
        ->distinct()
        ->count('username');
}

/**
 * @return array [ type => total_point ]
 */
public function getRevenueByType(int $providerId, \DateTime $beginAt, \DateTime $endAt): array
{
    $rows = Model::select('type', DB::raw('SUM(point) AS total_point'))
        ->where('provider_id', $providerId)
        ->where('created_at', '>=', $beginAt)
        ->where('created_at', '<', $endAt)
        ->groupBy('type')
        ->get();

    $result = [];
    foreach ($rows as $row) {
        $result[$row->type] = (int) $row->total_point;
    }

    return $result;
}
```

### 5.2 Command 層重構 — `MakeServiceDailyReport`

**修改一：補齊缺失的 `releaseLock()`**

現有 `handle()` 在取得 Redis lock 後，成功或例外均未釋放，導致鎖持續 10 分鐘（`LOCK_TTL`）。

```php
private function releaseLock(int $providerId): void
{
    $this->redis()->del($this->getLockKey($providerId));
}
```

以 `finally` 確保所有路徑均釋放：

```php
$providerId = $provider['id'];
try {
    // 統計邏輯
} catch (\Exception $e) {
    Log::error('make:service_daily_report', ['exception' => $e]);
} finally {
    $this->releaseLock($providerId);
}
```

**修改二：「預先佔位 + 分批更新」**

```
create（全 0）或確認已存在
→ update group 1：MCU / ACU / DAU / 新會員 / PWA / 頁面瀏覽 / 留存率  → unset
→ update group 2：VIP 各級人數（DB 聚合，~0 MB）                      → unset
→ update group 3：收益 / 付費人數 / ARPPU / 各類型儲值（DB 聚合，~0 MB）→ unset
```

**修改三：新會員統計改用整數累計**

```php
$autoLoginByPhone = 0;
$loginByPhone = 0;
$loginByQpp = 0;
foreach ($records['list'] as $record) {
    $newMemberCount++;
    if ($record['type'] === $loginTypes['league_funny']) $autoLoginByPhone++;
    elseif ($record['type'] === $loginTypes['otp']) $loginByPhone++;
    elseif ($record['type'] === $loginTypes['qpp']) $loginByQpp++;
}
unset($records);
```

### 5.3 Migration — 複合索引（效能優化，可後續擇機執行）

```php
Schema::connection('record')->table('user_login_record', function (Blueprint $table) {
    $table->index(['provider_id', 'created_at'], 'idx_provider_created_at');
});

Schema::connection('record')->table('user_deposited_record', function (Blueprint $table) {
    $table->index(['provider_id', 'created_at'], 'idx_provider_created_at');
});
```

### 5.4 單元測試

| 測試檔案 | 測試方法 | 核心驗證 |
|---|---|---|
| `UserLoginRecordTest` | `testGetVipLevelMemberCount` | 回傳格式為 `[vip_level => count]`；缺少的等級補 0 |
| `UserLoginRecordTest` | `testGetUserCount` | unique / 非 unique 分別正確 |
| `UserLoginRecordTest` | `testGetPwaCount` | `pwa_users` / `unique_pwa_users` 正確 |
| `UserDepositedRecordTest` | `testGetPayingUserCount` | 去重後人數正確 |
| `UserDepositedRecordTest` | `testGetRevenueByType` | 各 type 金額正確 |
| `MakeServiceDailyReportTest` | `testHandleCreatesNewRecord` | 首次執行建立新紀錄 |
| `MakeServiceDailyReportTest` | `testHandleUpdatesExistingRecord` | 已存在時走 update 流程 |
| `MakeServiceDailyReportTest` | `testLockReleasedAfterSuccess` | 成功後 Redis lock 已釋放 |
| `MakeServiceDailyReportTest` | `testLockReleasedAfterException` | 例外後 Redis lock 仍釋放 |

---

## 6. 執行順序

```
1. 撰寫單元測試（紅燈）
2. 重構 UserLoginRecord::getVipLevelMemberCount()
3. 新增 UserDepositedRecord 聚合方法
4. 重構 MakeServiceDailyReport（補鎖、create-then-update、改用新方法）
5. 確認單元測試全部通過（綠燈）
6. 部署正式環境，觀察次日排程執行結果與記憶體用量
7. （後續）建立複合索引 Migration，離峰時段執行（預估 6–15 分鐘，Online DDL 不停機）
```

---

## 7. 風險評估

| 風險 | 等級 | 對策 |
|---|---|---|
| DB 聚合查詢造成 CPU 飆升影響其他服務 | **已排除**（正式環境實測無影響）| — |
| Online DDL 期間 replica lag 累積 | 低–中 | 於凌晨低流量時段執行；監控 replica delay |
| `getVipLevelMemberCount` 回傳型別從 Collection 改為 array | 低 | Command 端使用 `$vipLevelMemberCount[n] ?? 0`，array 相容 |
| `getRevenueByType` 與舊 `lists()` 聚合邏輯差異 | 低 | 單元測試驗證；上線前可與現有邏輯平行執行一天進行結果比對 |

---

## 8. 驗收標準

- [ ] `MakeServiceDailyReport` 執行後記憶體峰值 < 50 MB
- [ ] 執行時間 < 10 秒
- [ ] Redis lock 在所有路徑（成功 / 例外）均正常釋放
- [ ] 單元測試全部通過
- [ ] （後續）正式環境 EXPLAIN 確認複合索引生效（`key_len = 9`，`type = range`）