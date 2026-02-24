# stars - Service 層記憶體優化第二階段重構 - 實作規劃

## 版本記錄

| 版本 | 更新時間 | 變更摘要 |
| ---- | ---------------- | -------- |
| v1.0 | 2026-02-24 11:55 | 初次規劃 |

---

## 1. 需求概述

### 1.1 背景與目標

- **需求背景（Why）**：第一階段已在 Command 層以「全零佔位 + 分批 update」解決 `BackfillServiceDailyReport` 的 OOM，但根本原因（Service 層 Eloquent 物件肥大）尚未修正。`MakeServiceDailyReport` 的排程命令有相同結構性問題，尚未套用任何 OOM 防護。
- **功能目標（What）**：壓縮 PHP 資料結構（不改 SQL 策略）、對排程命令套用相同防護模式、補齊測試覆蓋，確保重構安全可驗證。
- **影響範圍（Where）**：`UserLoginRecord`、`UserDepositedRecord` 兩個 Service，以及 `MakeServiceDailyReport` Command。

### 1.2 範圍界定

- **包含**
  - `UserLoginRecord::getVipLevelMemberCount()` — `pluck` 取代 `get()`
  - `UserDepositedRecord::lists()` — `toBase()` 跳過 Eloquent hydration
  - `MakeServiceDailyReport` — 套用全零佔位 + 三組分批 update + 記憶體回收
  - 重構前先補充 PHPUnit 單元測試
  - 修正 `MakeServiceDailyReport` 缺少 `releaseLock()` 的現有 bug
- **不包含**
  - `StatisticsUserLogin` — 見 §1.3 評估結論，無需優化
  - 將統計邏輯移入 Job — 見 §1.3 評估結論，無需引入
  - `ServiceDailyReport::create()` / `update()` Service 方法本身的拆分（第三階段）
- **假設條件**
  - 正式環境 memory\_limit ≥ 128 MB，與測試環境相同
  - `report` DB connection 支援普通 `UPDATE`（無唯讀限制）

### 1.3 前置評估結論

#### StatisticsUserLogin — 無需優化

| 操作 | 資料量 | 峰值記憶體估算 | 結論 |
|------|--------|----------------|------|
| `getTenMinuteList` × 144 | 平均每時段 306 人 | < 0.5 MB / 次 | 安全 |
| `getDailyList` (DAU=44,043) | 44,043 個字串 | ≈ 3~5 MB | 安全 |
| `array_intersect` × 5 | 兩個 44,043 陣列 | ≈ 10 MB 峰值 | 安全 |

Redis `SMEMBERS` 回傳純字串陣列，無 Eloquent 物件開銷，不存在記憶體瓶頸。

#### 統計邏輯移入 Job — 不需要

- 正式環境排程單次執行約 2 秒，屬可接受範圍。
- Redis 分散式鎖已確保同一 provider 不重複執行。
- 引入 Job 需要額外的 Horizon 佇列資源與錯誤重試設計，成本高於效益。
- 結論：維持同步排程，不引入 Job。

#### 冪等策略 — 判斷存在後 create/update，不用 transaction rollback

- `GameServerDailyReport`、`BettingDailyReport`、`PayingDailyReport`、`ProfitDailyReport` 已使用 `upsert()`，本身具備冪等性。
- `ServiceDailyReport` 套用與 Backfill 相同的「先查存在 → update / 否則 create」邏輯即可。
- 各報表之間不需要跨表原子性，局部失敗重跑即可，不需 rollback。

---

## 2. 系統架構變更

### 2.1 資料庫變更

無。

### 2.2 設定變更

無。

### 2.3 程式碼結構

#### 修改檔案

| 檔案路徑 | 修改內容摘要 |
|---------|-------------|
| `app/Services/UserLoginRecord.php` | `getVipLevelMemberCount` 改用 `pluck` + `array_count_values` |
| `app/Services/UserDepositedRecord.php` | `lists()` 加入 `toBase()` 跳過 Eloquent hydration |
| `app/Console/Commands/MakeServiceDailyReport.php` | 套用全零佔位 + 三組分批 update + releaseLock 修正 |

#### 新增檔案

| 檔案路徑 | 類型 | 職責說明 |
|---------|-----|---------|
| `tests/Unit/Services/UserLoginRecordTest.php` | PHPUnit Test | 驗證 `getVipLevelMemberCount` 回傳結構與數值正確性 |
| `tests/Unit/Services/UserDepositedRecordTest.php` | PHPUnit Test | 驗證 `lists()` 欄位限制行為與 stdClass 相容性 |
| `tests/Unit/Commands/MakeServiceDailyReportTest.php` | PHPUnit Test | 驗證 Command 的冪等性、分批 update 流程與 lock 行為 |
| `tests/Unit/Commands/BackfillServiceDailyReportTest.php` | PHPUnit Test | 補齊第一階段修改的測試覆蓋 |

---

## 3. API 規格設計

N/A（本次為 CLI / Service 層重構，無 API 異動）

---

## 4. 實作細節

### 4.1 實作任務清單

| # | 任務 | 依賴 |
|---|------|------|
| 1 | 撰寫 `UserLoginRecordTest` — 覆蓋 `getVipLevelMemberCount` | - |
| 2 | 撰寫 `UserDepositedRecordTest` — 覆蓋 `lists()` 含 column 限制 | - |
| 3 | 撰寫 `BackfillServiceDailyReportTest` — 覆蓋冪等與分批流程 | - |
| 4 | 撰寫 `MakeServiceDailyReportTest` — 覆蓋冪等、lock、分批流程 | - |
| 5 | 重構 `UserLoginRecord::getVipLevelMemberCount` | 1 通過後執行 |
| 6 | 重構 `UserDepositedRecord::lists` | 2 通過後執行 |
| 7 | 重構 `MakeServiceDailyReport::handle` | 4 通過後執行 |
| 8 | 修正 `MakeServiceDailyReport::handle` 缺少 releaseLock | 7 |

### 4.2 關鍵邏輯

#### Service：`UserLoginRecord::getVipLevelMemberCount`

```
// 現況：get() 建立 N 個 Eloquent Model → PHP groupBy → ~22 MB
// 目標：pluck() 只取 vip_level 純字串陣列 → array_count_values → ~1-2 MB

pluck('vip_level') from (
    SELECT vip_level
    FROM user_login_records
    WHERE provider_id = ? AND created_at >= ? AND created_at < ?
    GROUP BY username          ← SQL 去重邏輯保留不動
)
→ toArray()                   ← Collection<string>，無 Model 物件
→ array_count_values()        ← C 層統計，回傳 [ vip_level => count ]
```

回傳型態由 `Collection` 改為 `array`，鍵值結構不變（`[0 => N, 1 => N, ...]`），呼叫端 `$vipLevelMemberCount[0] ?? 0` 語法相容。

#### Service：`UserDepositedRecord::lists`

```
// 現況：$stmt->get()->toArray()
//       每列建立完整 Eloquent Model（$attributes, $original, $casts...）
// 目標：$stmt->toBase()->get()->toArray()
//       每列回傳 stdClass，無 Model 開銷，減少 ~70% 記憶體

toBase() 的副作用：
- 回傳 stdClass 而非 Model，屬性存取語法從 $row['key'] 改為 $row->key
- 但 ->toArray() 後兩者皆為純 array，呼叫端不受影響
```

#### Command：`MakeServiceDailyReport` 分批流程

```
handle():
    1. acquire Redis lock（現有邏輯）

    2. resolve report id（冪等）
       existing = ServiceDailyReportModel::where(provider_id, date)->first()
       if existing → reportId = existing.id
       else        → create all-zero → reportId = new.id

    3. Update Group 1（輕量，無記憶體風險）
       compute: mcu, acu, dau, new_member counts, pwa, pageViews, retention rates
       update ServiceDailyReport where id = reportId
       unset all group 1 variables

    4. Update Group 2（VIP，+22 MB）
       compute: vipLevelMemberCount via getVipLevelMemberCount()  ← 重構後 ~1-2 MB
       update ServiceDailyReport where id = reportId
       vipLevelMemberCount = null; gc_collect_cycles()

    5. Update Group 3（儲值，致命點）
       compute: depositedRecords via lists(column=['username','type','point'])
       update ServiceDailyReport where id = reportId
       depositedRecords = null; gc_collect_cycles()

    6. upsert GameServerDailyReport（現有，不動）
    7. upsert BettingDailyReport（現有，不動）
    8. upsert PayingDailyReport（現有，不動）
    9. upsert ProfitDailyReport（現有，不動）

    10. releaseLock()  ← 新增，修正現有 bug
```

#### 新增 releaseLock

```
private function releaseLock(int $providerId): void
    lockKey = getLockKey(providerId)
    redis()->del(lockKey)
```

### 4.3 錯誤處理設計

| 情境 | 現有處理 | 本次調整 |
|------|---------|---------|
| create 失敗（DB 連線） | 外層 catch log | 不動，lock 會在 TTL 後自動釋放 |
| update group 2/3 失敗 | 無（中途拋出） | 補 try-catch，失敗時 releaseLock 後再 rethrow |
| Lock 已存在（重複執行） | `exit` | 不動 |

### 4.4 測試策略

#### Unit Test 重點

| 測試檔案 | 測試項目 | Mock 對象 |
|---------|---------|----------|
| `UserLoginRecordTest` | `getVipLevelMemberCount` 回傳 `array` 型態、鍵為 vip_level 整數、值為計數 | DB（使用 RefreshDatabase 或 Mock） |
| `UserLoginRecordTest` | vip_level 無資料時回傳空 array | DB |
| `UserDepositedRecordTest` | `lists()` 欄位限制 — 回傳陣列不包含 `id`、`created_at` | DB |
| `UserDepositedRecordTest` | `lists()` 無限制時仍回傳全欄位 | DB |
| `BackfillServiceDailyReportTest` | 重跑同一天不建立重複 record | DB + Redis Mock |
| `MakeServiceDailyReportTest` | lock 存在時 handle() 提前結束 | Redis Mock |
| `MakeServiceDailyReportTest` | handle() 完成後 lock 被釋放 | Redis Mock |
| `MakeServiceDailyReportTest` | 重跑同一天不建立重複 ServiceDailyReport | DB + Redis Mock |

---

## 5. 部署與驗證

### 5.1 部署注意事項

| 階段 | 項目 | 說明 |
|------|------|------|
| 部署前 | 確認測試全綠 | `./vendor/bin/phpunit tests/Unit/Services/ tests/Unit/Commands/` |
| 部署後 | 手動執行回補指令 | `php artisan backfill:service_daily_report {clientId} --date=yesterday` 確認記憶體輸出正常 |
| 部署後 | 觀察排程第一次執行 | 確認 `make:service_daily_report` 不 OOM 且 lock 在執行完畢後消失 |

### 5.2 驗證項目

#### 記憶體基準（正式環境 44,043 DAU / 35,000 deposits）

| 步驟 | 重構前預估 | 重構後目標 |
|------|-----------|------------|
| getVipLevelMemberCount | +22 MB，不釋放 | +1~2 MB |
| userDepositedRecord->lists | OOM（128 MB 上限） | +10~15 MB（3 欄 × 35,000 列） |
| 整體峰值 | > 128 MB（FATAL） | < 50 MB |

### 5.3 自我檢查點

- [ ] `getVipLevelMemberCount` 回傳型態改為 `array`，所有呼叫端 `$var[n] ?? 0` 語法確認相容
- [ ] `toBase()` 後 `toArray()` 的呼叫端無使用 Eloquent 專屬方法（如 `->save()`）
- [ ] `MakeServiceDailyReport` 所有執行路徑（成功 / lock 衝突 / 例外）均有呼叫或跳過 `releaseLock`
- [ ] 單元測試全部通過後才執行 Service 修改