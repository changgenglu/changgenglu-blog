# stars - Service 層記憶體優化第二階段重構 - 實作規劃

## 版本記錄

| 版本 | 更新時間 | 變更摘要 |
| ---- | ---------------- | -------- |
| v1.0 | 2026-02-24 11:55 | 初次規劃 |
| v1.1 | 2026-02-24 | 補充 Part 1 新會員統計 SQL 聚合方案；補充留存率計算移至 StatisticsUserLogin Service |
| v1.2 | 2026-02-24 | 修改四：`$retentionRates` 改用字串 key `"day_N"`，避免整數 key 與位置索引混淆 |
| v1.3 | 2026-02-24 | 修正 `getVipLevelMemberCount` 雙重計數缺陷（改用 ROW_NUMBER 子查詢）；補充風險評估與缺陷摘要 |

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
| VIP 人數統計 | 載入全部明細 → PHP `groupBy`（non-strict mode 下 vip_level 不確定） | SQL `ROW_NUMBER()` 子查詢取每位玩家最後登入的 vip_level，再外層 `GROUP BY` 計數 |
| 付費人數統計 | 載入全部明細 → PHP `in_array` | SQL `COUNT(DISTINCT username)` |
| 各類型儲值金額 | 載入全部明細 → PHP `foreach` | SQL `SUM(point) GROUP BY type` |
| 新會員各登入類型統計 | 載入全部明細 → PHP 逐筆累計，並建立 username 陣列 | SQL `COUNT(*) + SUM(type = ?)` |
| 留存率計算 | Command 中取 Redis SMEMBERS 全量陣列 → PHP `array_intersect` | 封裝至 `StatisticsUserLogin` Service，邏輯不變，調用語意清晰 |
| 記憶體複雜度 | O(n)，峰值 >128 MB（OOM） | DB 聚合 O(1)；留存率仍 O(n)，n = DAU |
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

**業務邏輯確認**：每位玩家在日報表中僅被計入其當日**最後一次登入**的 VIP 等級；若當日僅登入一次則以該次等級計算。各 VIP 等級的人數加總等於 DAU。

**現況雙重缺陷**：

1. **原始 PHP 實作**：`groupBy('username')` 未對 `vip_level` 進行聚合，在 MySQL `ONLY_FULL_GROUP_BY` 停用的情況下，回傳的 `vip_level` 值不確定（非 MAX(created_at) 對應的等級），屬於潛在 bug。

2. **初版 SQL 聚合方案（已廢棄）**：
   ```sql
   SELECT vip_level, COUNT(DISTINCT username) AS member_count
   FROM user_login_record
   WHERE provider_id = ? AND created_at >= ? AND created_at < ?
   GROUP BY vip_level;
   ```
   **雙重計數問題**：玩家當日若有多筆不同 vip_level 的登入記錄（如 VIP1 → VIP2），該玩家會同時出現在 vip_level=1 與 vip_level=2 的計數中，導致各等級人數加總 > DAU，違反業務邏輯。

**正確方案**：以 `ROW_NUMBER()` 子查詢取每位玩家當日最後一筆記錄，再於外層按 vip_level 計數：

```php
public function getVipLevelMemberCount(int $providerId, \DateTime $beginAt, \DateTime $endAt): array
{
    $latestVip = Model::select('vip_level', DB::raw(
        'ROW_NUMBER() OVER (PARTITION BY username ORDER BY created_at DESC) AS rn'
    ))
        ->where('provider_id', $providerId)
        ->where('created_at', '>=', $beginAt)
        ->where('created_at', '<', $endAt);

    $rows = DB::table(DB::raw("({$latestVip->toSql()}) AS latest_vip"))
        ->mergeBindings($latestVip->getQuery())
        ->where('rn', 1)
        ->select('vip_level', DB::raw('COUNT(*) AS member_count'))
        ->groupBy('vip_level')
        ->get();

    $result = [];
    foreach ($rows as $row) {
        $result[$row->vip_level] = (int) $row->member_count;
    }

    return $result;
}
```

> **效能說明**：ROW_NUMBER() 子查詢比簡單 GROUP BY 效能略差，但回傳結果集仍極小（最多 11 行），對排程的整體執行時間影響可忽略。

---

#### `UserLoginRecord` — 新增 `getNewMemberStats()`（Part 1 替換）

**現況問題（lines 78–101）**：`lists()` 以 `is_new_member = true` 篩選後，仍將所有登入明細載入 PHP，並在迴圈中累計 `username` 陣列（`$newMembersFromOtherProduct`、`$newMembersByPhone`、`$newMembersFromQPP`）。實際用途僅為取各陣列的 `count()`，無需在 PHP 層持有 username 字串。

**重構決策**：資料來源為 `user_login_record`（MySQL），與 `StatisticsUserLogin`（Redis）資料來源不同，可安全替換為 SQL 聚合，不影響留存率計算的語意正確性。

**重構後**：改為單次 SQL 查詢，回傳 1 筆聚合結果，4 個整數欄位，記憶體趨近 0 MB。

```php
public function getNewMemberStats(int $providerId, \DateTime $beginAt, \DateTime $endAt): array
{
    $types = $this->getTypes();
    $row = Model::where('provider_id', $providerId)
        ->where('created_at', '>=', $beginAt)
        ->where('created_at', '<', $endAt)
        ->where('is_new_member', true)
        ->selectRaw(
            'COUNT(*) AS total, SUM(type = ?) AS auto_login_by_phone, SUM(type = ?) AS login_by_phone, SUM(type = ?) AS login_by_qpp',
            [$types['league_funny'], $types['otp'], $types['qpp']]
        )
        ->first();

    return [
        'count'               => (int) ($row->total ?? 0),
        'auto_login_by_phone' => (int) ($row->auto_login_by_phone ?? 0),
        'login_by_phone'      => (int) ($row->login_by_phone ?? 0),
        'login_by_qpp'        => (int) ($row->login_by_qpp ?? 0),
    ];
}
```

---

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

---

#### `StatisticsUserLogin` — 新增 `getDailyCount()` 與 `getRetentionCounts()`

**現況問題（lines 74–75、110–134）**：留存率計算直接散落在 Command 中，每個留存天數各自呼叫 `getDailyList()` 並執行 `array_intersect()`，導致：
- Redis `SMEMBERS` 呼叫次數為 1（DAU）+ 5（留存天數）= 6 次
- 全量 username 陣列存於 Command 變數，職責不清
- 無法單獨為此邏輯撰寫單元測試

**重構決策**：留存率使用 Redis 資料（`SMEMBERS`），與 `user_login_record`（MySQL）資料來源不同，**不可替換為 SQL 聚合**，維持 Redis 資料路徑，僅將計算邏輯封裝至 Service 層。

**方案選擇**：採用**方案 A（分開取）**——`getDailyCount()` 與 `getRetentionCounts()` 為獨立方法。`getDailyList($yesterday)` 在兩個方法中各呼叫一次（共 2 次），以換取方法職責單一、介面清晰的可維護性。

**新增兩個方法：**

```php
public function getDailyCount(int $providerId, \DateTime $date): int
{
    return count($this->getDailyList($providerId, $date));
}

/**
 * @param  int[]          $days  留存天數清單，如 [1, 3, 7, 14, 30]
 * @return array<int, int>       key 為留存天數整數，value 為交集人數
 */
public function getRetentionCounts(int $providerId, \DateTime $date, array $days): array
{
    $baseList = $this->getDailyList($providerId, $date);
    $result = [];

    foreach ($days as $day) {
        $compareDate = (clone $date)->modify("-{$day} day");
        $compareList = $this->getDailyList($providerId, $compareDate);
        $result[$day] = count(array_intersect($baseList, $compareList));
    }

    return $result;
}
```

> **注意**：Redis 版本為 5.0.14，不支援 `SINTERCARD`，維持現有 PHP `array_intersect` 邏輯。

---

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

> **update group 3 的 `$revenue` 來源**：`$revenue = array_sum($revenueByType)`，其中 `$revenueByType` 來自 `getRevenueByType()` 的回傳值（`[ type => total_point ]`）。ARPPU 計算為 `bcdiv($revenue, $payingUserCount, 4)`，需確保 `$revenue` 來源正確；`$payingUserCount` 為 0 時應跳過除法回傳 0。

**修改三：新會員統計改用 SQL 聚合（替換 lines 78–101）**

**原實作**：`lists()` 載入所有新會員明細 → PHP 迴圈累計 username 陣列 → 最終只取各陣列的 `count()`。

**重構後**：呼叫新增的 `getNewMemberStats()` 取得 1 筆聚合結果，整個新會員統計段從 ~20 行縮減為 ~5 行，記憶體趨近 0 MB。

```php
$newMemberStats   = $userLoginRecord->getNewMemberStats($provider['id'], $yesterday, $today);
$newMemberCount   = $newMemberStats['count'];
$autoLoginByPhone = $newMemberStats['auto_login_by_phone'];
$loginByPhone     = $newMemberStats['login_by_phone'];
$loginByQpp       = $newMemberStats['login_by_qpp'];
```

對應 `$dailyReport` 陣列的欄位映射調整：

```php
'new_member'          => $newMemberCount,
'auto_login_by_phone' => $autoLoginByPhone,
'login_by_phone'      => $loginByPhone,
'login_by_qpp'        => $loginByQpp,
```

**修改四：留存率計算重構至 `StatisticsUserLogin`（替換 lines 74–75、110–134）**

**新增類別常數**：

```php
const RETENTION_DAYS = [1, 3, 7, 14, 30];
```

**重構後**：原本 5 段重複的 `modify / getDailyList / array_intersect / bcdiv` 程式碼，收斂為 Service 呼叫 + 單一 `foreach`。

`$retentionRates` 使用字串 key `"day_{N}"` 取代整數 key，避免與位置索引在視覺上產生混淆：

```php
$dau = $statisticsUserLogin->getDailyCount($provider['id'], $yesterday);

$retentionCounts = $statisticsUserLogin->getRetentionCounts(
    $provider['id'],
    $yesterday,
    self::RETENTION_DAYS
);

$retentionRates = [];
foreach (self::RETENTION_DAYS as $days) {
    $retentionRates["day_{$days}"] = ($dau == 0) ? 0 : bcdiv($retentionCounts[$days], $dau, 4);
}
```

對應 `$dailyReport` 陣列的欄位映射：

```php
'1_day_retention_rate'  => $retentionRates['day_1'],
'3_day_retention_rate'  => $retentionRates['day_3'],
'7_day_retention_rate'  => $retentionRates['day_7'],
'14_day_retention_rate' => $retentionRates['day_14'],
'30_day_retention_rate' => $retentionRates['day_30'],
```

---

### 5.3 Migration — 複合索引（效能優化，可後續擇機執行）

```php
Schema::connection('record')->table('user_login_record', function (Blueprint $table) {
    $table->index(['provider_id', 'created_at'], 'idx_provider_created_at');
});

Schema::connection('record')->table('user_deposited_record', function (Blueprint $table) {
    $table->index(['provider_id', 'created_at'], 'idx_provider_created_at');
});
```

---

### 5.4 單元測試

| 測試檔案 | 測試方法 | 核心驗證 |
|---|---|---|
| `UserLoginRecordTest` | `testGetVipLevelMemberCount` | 各等級人數加總等於 DAU；玩家當日多筆登入只計入最後等級 |
| `UserLoginRecordTest` | `testGetUserCount` | unique / 非 unique 分別正確 |
| `UserLoginRecordTest` | `testGetPwaCount` | `pwa_users` / `unique_pwa_users` 正確 |
| `UserLoginRecordTest` | `testGetNewMemberStats` | 回傳正確的 `count`、`auto_login_by_phone`、`login_by_phone`、`login_by_qpp`；無資料時四個欄位均為 0 |
| `UserDepositedRecordTest` | `testGetPayingUserCount` | 去重後人數正確 |
| `UserDepositedRecordTest` | `testGetRevenueByType` | 各 type 金額正確 |
| `StatisticsUserLoginTest` | `testGetDailyCount` | 等於對應 Redis Set 的 SCARD |
| `StatisticsUserLoginTest` | `testGetRetentionCounts` | 回傳 `[1 => count, 3 => count, ...]`（整數 key）；基準日無資料時各留存數均為 0 |
| `MakeServiceDailyReportTest` | `testHandleCreatesNewRecord` | 首次執行建立新紀錄 |
| `MakeServiceDailyReportTest` | `testHandleUpdatesExistingRecord` | 已存在時走 update 流程 |
| `MakeServiceDailyReportTest` | `testLockReleasedAfterSuccess` | 成功後 Redis lock 已釋放 |
| `MakeServiceDailyReportTest` | `testLockReleasedAfterException` | 例外後 Redis lock 仍釋放 |

---

## 6. 執行順序

```
1. 撰寫單元測試（紅燈）
2. 重構 UserLoginRecord::getVipLevelMemberCount()（改用 ROW_NUMBER 子查詢）
3. 新增 UserLoginRecord::getNewMemberStats()
4. 新增 UserDepositedRecord 聚合方法（getPayingUserCount、getRevenueByType）
5. 新增 StatisticsUserLogin::getDailyCount() 與 getRetentionCounts()
6. 重構 MakeServiceDailyReport（補鎖、create-then-update、改用新方法、加入 RETENTION_DAYS 常數）
7. 確認單元測試全部通過（綠燈）
8. 部署正式環境，觀察次日排程執行結果與記憶體用量
9. （後續）建立複合索引 Migration，離峰時段執行（預估 6–15 分鐘，Online DDL 不停機）
```

---

## 7. 風險評估

### 7.1 主要風險

| 風險 | 等級 | 對策 |
|---|---|---|
| DB 聚合查詢造成 CPU 飆升影響其他服務 | **已排除**（正式環境實測無影響）| — |
| Online DDL 期間 replica lag 累積 | 低–中 | 於凌晨低流量時段執行；監控 replica delay |
| `getVipLevelMemberCount` 回傳型別從 Collection 改為 array | 低 | Command 端使用 `$vipLevelMemberCount[n] ?? 0`，array 相容 |
| `getRevenueByType` 與舊 `lists()` 聚合邏輯差異 | 低 | 單元測試驗證；上線前可與現有邏輯平行執行一天進行結果比對 |
| `getNewMemberStats()` SQL 聚合與原 PHP 計數邏輯差異 | 低 | 測試環境先以同日期平行比對兩方法回傳值 |
| `getDailyList($yesterday)` 在 `getDailyCount()` 與 `getRetentionCounts()` 中各呼叫一次（共 2 次 Redis SMEMBERS）| 低 | 正式環境 Redis SMEMBERS 為 O(n)，DAU ~44,000 筆，兩次讀取合計額外耗時 <10 ms，可接受 |

### 7.2 補充識別的風險

**風險 A：`getVipLevelMemberCount` 雙重計數（已修正）**

初版方案（`COUNT(DISTINCT username) GROUP BY vip_level`）在玩家當日有多筆不同 `vip_level` 登入記錄時，同一玩家會同時被計入多個等級，導致各等級人數加總 > DAU。此問題於 v1.3 改用 `ROW_NUMBER()` 子查詢修正，取每位玩家當日最後一筆記錄的等級。

**風險 B：`$revenue` 計算來源隱含**

`$dailyReport` 的 `revenue` 欄位由 `array_sum($revenueByType)` 推導，ARPPU 計算為 `bcdiv($revenue, $payingUserCount, 4)`。若 `getRevenueByType()` 回傳的 `point` 欄位單位與原 `lists()` 不一致，將靜默回傳錯誤值而不報錯。

**緩解**：`testGetRevenueByType` 須驗證金額單位與現有邏輯一致；上線前平行比對一天結果。

**風險 C：`getDailyList($yesterday)` 兩次呼叫的資料一致性**

`getDailyCount()` 與 `getRetentionCounts()` 分別各呼叫 `getDailyList($yesterday)` 一次。若兩次呼叫之間 Redis SET 資料被更新（理論上昨日 TTL 31 天的 SET 不會日中異動），DAU 基數與留存率分母將不一致。

**緩解**：昨日資料在正式環境實務上不會更新，此風險可接受。若需消除，可在未來版本令 `getRetentionCounts()` 接受選用參數 `array $baseList`，由 Command 傳入已取得的 DAU list，消除重複呼叫。

**風險 D：Redis 鎖定的競態條件（已知缺陷，本次範圍外）**

現有 `acquireLock()` 使用兩步驟 `SETNX` + `EXPIRE`，非原子操作。若程序在 SETNX 成功後、EXPIRE 執行前崩潰，鎖將永久持有直到手動清除。本次新增 `releaseLock()` 解決了鎖不釋放的問題，但未修正取鎖時的競態條件。**完整修正方式**為改用 Redis `SET key value EX ttl NX`（單一原子指令），此修正超出本次重構範圍，建議另行追蹤。

---

## 8. 補充分析：業務邏輯確認

### 8.1 VIP 統計業務規則

- **確認規則**：VIP 等級統計以每位玩家**當日最後一次登入**的 VIP 等級為準；各等級人數加總應等於 DAU。

- **現有實作問題**：舊 `groupBy('username')` 在 MySQL non-strict mode 下，群組內 `vip_level` 值不確定，不保證取最後登入那筆，屬潛在 bug。

- **初版重構問題**：`COUNT(DISTINCT username) GROUP BY vip_level` 在玩家當日有多次 VIP 升降時造成雙重計數。

- **最終方案**：`ROW_NUMBER() OVER (PARTITION BY username ORDER BY created_at DESC)` 取每人最後一筆，外層再 `GROUP BY vip_level`，保證語意正確。

### 8.2 缺陷摘要

| 缺陷 | 嚴重度 | 狀態 |
|---|---|---|
| `getVipLevelMemberCount` 初版重構雙重計數（COUNT DISTINCT GROUP BY vip_level）| 高 | **v1.3 已修正**（改用 ROW_NUMBER 子查詢）|
| 舊 `groupBy('username')` 在 non-strict mode 下 vip_level 不確定 | 中 | **v1.3 已修正**（同上）|
| Redis 鎖定 `SETNX + EXPIRE` 競態條件 | 中 | **本次範圍外**，需另行追蹤 |
| Command `$revenue` 總和來源未明示，ARPPU 靜默錯誤風險 | 低 | **已補充文件說明**（§5.2 修改二）|
| 技術策略表留存率「O(1)」描述不精確 | 低 | **v1.3 已修正**（改為「留存率仍 O(n)，n = DAU」）|

---

## 9. 驗收標準

- [ ] `MakeServiceDailyReport` 執行後記憶體峰值 < 50 MB
- [ ] 執行時間 < 10 秒
- [ ] Redis lock 在所有路徑（成功 / 例外）均正常釋放
- [ ] 單元測試全部通過（含 `testGetVipLevelMemberCount` 驗證各等級加總等於 DAU）
- [ ] （後續）正式環境 EXPLAIN 確認複合索引生效（`key_len = 9`，`type = range`）
