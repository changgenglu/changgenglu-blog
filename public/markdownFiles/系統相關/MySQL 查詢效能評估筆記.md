# MySQL 查詢效能評估筆記

> 本文記錄在 `MakeServiceDailyReport` OOM 重構過程中，評估 MySQL 查詢效能與影響的完整方法論。
> 適用場景：設計資料查詢語法、資料結構、Index、查詢優化。

---

## 一、評估流程總覽

```
1. 調查資料表現況（結構、索引、資料量）
   ↓
2. 用 EXPLAIN 分析現有查詢與計畫中的查詢
   ↓
3. 評估索引設計（是否需要新增 / 修改）
   ↓
4. 評估 DDL 操作的成本與風險（時間、鎖定、replica）
   ↓
5. 在正式環境進行非破壞性實測（CPU、並發影響）
   ↓
6. 依據數據做出最終決策
```

---

## 二、調查資料表現況

在分析查詢前，必須先掌握資料表的基本狀態。

### 2.1 查看資料表結構

```sql
SHOW CREATE TABLE {table_name}\G
```

重點確認：
- 欄位型別（影響 index key 大小，進而影響 B-tree 層數與記憶體用量）
- `ENGINE`（InnoDB 才支援 MVCC 與 Online DDL）
- `COLLATE`（影響字串比較與排序效率）

### 2.2 查看現有索引

```sql
SHOW INDEX FROM {table_name};
```

關鍵欄位解讀：

| 欄位 | 說明 | 判斷依據 |
|---|---|---|
| `Key_name` | 索引名稱 | — |
| `Column_name` | 索引欄位 | 確認覆蓋了哪些查詢條件 |
| `Cardinality` | 不重複值的估計數量 | 越高越有選擇性；接近 1 代表索引幾乎無效 |
| `Sub_part` | 是否為前綴索引 | NULL = 整欄索引 |
| `Index_type` | 索引類型 | 一般為 `BTREE` |

**Cardinality 判讀範例：**
```
index_provider  Cardinality=2  →  全表只有 2 個不同的 provider_id，
                                   過濾效果極差（掃描 99% 的資料才能找到目標）
created_at_idx  Cardinality=3,418,980  →  時間戳高度分散，選擇性高
```

### 2.3 確認資料量與資料表大小

```sql
-- 精確筆數（較慢，但準確）
SELECT COUNT(*) FROM {table_name};

-- 資料表大小統計（較快，table_rows 為估算值）
SELECT
  table_name,
  table_rows,
  ROUND(data_length / 1024 / 1024, 2)  AS data_mb,
  ROUND(index_length / 1024 / 1024, 2) AS index_mb,
  ROUND((data_length + index_length) / 1024 / 1024, 2) AS total_mb,
  ROUND(data_length / table_rows, 2) AS avg_row_bytes
FROM information_schema.tables
WHERE table_schema = '{database_name}'
  AND table_name = '{table_name}';
```

> **注意**：`information_schema.tables` 的 `table_rows` 是 InnoDB 的估算值，誤差可達 20–50%。需要精確筆數時使用 `COUNT(*)`。

### 2.4 確認 MySQL 版本

```sql
SELECT VERSION();
```

版本影響 Online DDL 支援程度：

| 版本 | `ADD INDEX` Online DDL | 說明 |
|---|---|---|
| MySQL 5.6+ | 支援 `INPLACE` | 不複製整張表 |
| MySQL 5.7+ | 支援 `LOCK=NONE` | 不鎖表，允許並發 DML |
| MySQL 8.0+ | 支援 Instant DDL（部分操作）| 部分操作可即時完成 |

---

## 三、EXPLAIN 查詢計畫分析

### 3.1 基本用法

```sql
EXPLAIN SELECT ... FROM ... WHERE ...;
```

加上 `\G` 以縱向顯示（適合欄位較多時）：
```sql
EXPLAIN SELECT ... FROM ... WHERE ...\G
```

格式化輸出（MySQL 8.0+）：
```sql
EXPLAIN FORMAT=JSON SELECT ...;
EXPLAIN ANALYZE SELECT ...;  -- 實際執行並回傳真實統計（慎用於大表）
```

> `EXPLAIN` 不會實際執行查詢，可安全用於生產環境分析。
> `EXPLAIN ANALYZE` 會實際執行，大表慎用。

### 3.2 核心欄位判讀

#### `type`（最重要）

查詢效能由好到壞的排序：

| type | 說明 | 效能 |
|---|---|---|
| `const` | 主鍵或唯一索引等值查詢，最多 1 行 | 最佳 |
| `eq_ref` | JOIN 時對端使用主鍵 | 優秀 |
| `ref` | 非唯一索引等值查詢 | 良好 |
| `range` | 索引範圍掃描（BETWEEN、>、<、IN）| 可接受 |
| `index` | 全索引掃描（掃描整個索引，不回表）| 較差 |
| `ALL` | 全表掃描，無使用索引 | 危險 |

> **原則**：正式環境中 `ALL` 出現在大表查詢必須立即處理。

#### `key` 與 `key_len`

- `key`：MySQL 實際選擇的索引名稱。`NULL` 代表未使用索引。
- `key_len`：使用了索引的多少 bytes。

`key_len` 與型別的對應：

| 欄位型別 | Bytes |
|---|---|
| `TINYINT` | 1 |
| `SMALLINT` | 2 |
| `INT` | 4 |
| `BIGINT` | 8 |
| `DATE` | 3 |
| `DATETIME` | 8 |
| `TIMESTAMP` | 4（`TIMESTAMP(3)` = 7）|
| `VARCHAR(n)` utf8mb4 | 最多 n×4 + 2 |

**複合索引 `key_len` 判讀範例：**
```
複合索引 (provider_id SMALLINT, created_at TIMESTAMP(3))
完整使用：key_len = 2 + 7 = 9  → 兩個欄位都用到
僅用前綴：key_len = 2          → 只用到 provider_id，created_at 退化為 post-filter
```

#### `rows`

MySQL 估計需要掃描的行數。注意：這是**估算值**，實際行數可能不同（InnoDB 統計有誤差）。

#### `Extra`

| Extra 值 | 說明 | 影響 |
|---|---|---|
| `Using index` | 覆蓋索引，不需回表 | 最佳 |
| `Using where` | 索引後仍需逐行過濾 | 可接受，視過濾效率 |
| `Using filesort` | 需要額外排序（ORDER BY / GROUP BY）| 視結果集大小決定影響程度 |
| `Using temporary` | 使用暫存表 | 注意記憶體用量 |
| `Using index condition` | Index Condition Pushdown（ICP）| 較 `Using where` 優化 |

> **`Using filesort` 判斷原則**：結果集小（如 GROUP BY vip_level 最多 11 行）→ 無影響；結果集大（數萬行）→ 需評估優化。

### 3.3 複合索引的使用規則

**最左前綴原則（Left-prefix Rule）**：
```sql
-- 複合索引 (A, B, C)
WHERE A = 1              → 使用 A（前綴）
WHERE A = 1 AND B = 2   → 使用 A, B
WHERE A = 1 AND B > 5   → 使用 A, B（B 為範圍，C 無法使用）
WHERE B = 2              → 不使用索引（跳過了 A）
WHERE A = 1 AND C = 3   → 只使用 A（跳過了 B，C 無法使用）
```

**設計複合索引的欄位順序原則：**
1. 等值條件（`=`）的欄位放前面
2. 範圍條件（`>`、`<`、`BETWEEN`）的欄位放後面
3. Cardinality 高的欄位放前面（當多欄都是等值條件時）

**本案範例：**
```sql
-- 查詢模式：WHERE provider_id = X AND created_at >= Y AND created_at < Z
-- 正確設計：(provider_id, created_at)
-- provider_id 為等值，created_at 為範圍 → 等值放前、範圍放後
```

---

## 四、索引設計評估

### 4.1 何時需要新增索引

- EXPLAIN 出現 `type = ALL`（全表掃描）
- `key = NULL`（未使用任何索引）
- `rows` 遠大於實際返回行數（例如掃描 100 萬行只返回 100 行）
- 查詢頻繁且資料量持續增長

### 4.2 何時不應新增索引

- 資料量極小（< 1,000 筆），索引反而增加維護成本
- 欄位 Cardinality 極低（如布林值、狀態碼只有 2–3 個值）
- 該欄位幾乎只有寫入，很少查詢

### 4.3 複合索引可以取代單欄索引

複合索引 `(A, B)` 可以服務以下查詢：
- `WHERE A = ?`（使用最左前綴 A）
- `WHERE A = ? AND B = ?`（完整使用）
- `WHERE A = ? AND B > ?`（A 完整、B 範圍）

因此，若已有複合索引 `(provider_id, created_at)`，原本的單欄索引 `(provider_id)` 即為冗餘，可評估移除。

### 4.4 索引對 INSERT / UPDATE 的影響

每個索引都會在寫入時增加維護成本：
- INSERT：需要更新所有相關索引的 B-tree
- 索引數量越多，寫入越慢
- 原則：**只建必要的索引，不多不少**

---

## 五、ALTER TABLE 成本評估

### 5.1 Online DDL 的運作方式（MySQL 8.0 InnoDB）

`ADD INDEX` 預設使用 `ALGORITHM=INPLACE, LOCK=NONE`：
- 不複製整張資料表
- 允許並發讀寫（不鎖表）
- 執行期間在背景建立 B-tree

```sql
-- 明確指定（與預設相同，用於確認）
ALTER TABLE {table_name}
  ADD INDEX idx_name (col1, col2),
  ALGORITHM=INPLACE,
  LOCK=NONE;
```

### 5.2 執行時間估算方法

估算 `ADD INDEX` 的時間需要以下資料：
1. **資料量**：`data_length`（需全表掃描）
2. **新索引大小**：key bytes × row count（需寫入索引 B-tree）
3. **磁碟 I/O 速度**：SSD vs HDD 差異顯著

**Google Cloud SQL SSD 經驗值：**

| 資料量 | 預估時間 |
|---|---|
| < 100 MB | < 1 分鐘 |
| 100–500 MB | 2–10 分鐘 |
| 500 MB–2 GB | 10–30 分鐘 |
| > 2 GB | 30 分鐘以上 |

> 實際時間受當下 I/O 負載影響，建議在離峰時段執行。

### 5.3 主要風險：Replica Lag

Online DDL 不鎖主庫，但 DDL 語句仍需在 replica 上重放。若 replica 性能較弱，可能產生 lag。

監控指令：
```sql
SHOW SLAVE STATUS\G  -- 查看 Seconds_Behind_Master
```

---

## 六、並發影響評估

### 6.1 InnoDB MVCC（多版本並發控制）

InnoDB 透過 MVCC 實現讀寫分離：

| 操作 | 是否持行鎖 | 對其他操作的影響 |
|---|---|---|
| 普通 `SELECT` | 否 | 不阻塞任何操作 |
| `SELECT ... LOCK IN SHARE MODE` | 是（共享鎖）| 阻塞 `UPDATE`、`DELETE` |
| `SELECT ... FOR UPDATE` | 是（排他鎖）| 阻塞所有寫入 |
| `INSERT` | 是（插入意向鎖）| 不阻塞普通讀取 |
| `UPDATE` / `DELETE` | 是（排他鎖）| 不阻塞普通讀取 |

**結論**：聚合查詢（`COUNT`、`SUM`、`GROUP BY`）使用普通 `SELECT`，不持行鎖，不阻塞其他服務的 `INSERT`。

### 6.2 CPU 壓力評估

`COUNT(DISTINCT)` 與 `SUM(GROUP BY)` 的 CPU 消耗來源：

| 操作 | 複雜度 | 說明 |
|---|---|---|
| 全量掃描 | O(N) | 讀取符合條件的每一行 |
| DISTINCT hash table | O(N) | 建立去重雜湊表 |
| GROUP BY filesort | O(k log k) | k = 分組數，通常極小 |

**以 Google Cloud SQL（SSD）為基準的壓力門檻：**

| 掃描筆數 | 查詢耗時 | CPU 影響 |
|---|---|---|
| < 100,000 | < 5 ms | 可忽略 |
| 100,000 – 500,000 | 5–50 ms | 輕微，監控可見 |
| 500,000 – 2,000,000 | 50–500 ms | 明顯，約 10–20% spike |
| 2,000,000 – 10,000,000 | 0.5–5 秒 | 顯著，20–50% spike |
| > 10,000,000 | 秒級以上 | 高，可能飽和 |

> 上述為單次查詢在 SSD 環境的估算，並行多個此類查詢時需按比例加總評估。

### 6.3 造成 CPU 壓力的常見情境

- 查詢未走索引，實際掃描遠大於必要（Full Table Scan）
- `DISTINCT` 在超高 cardinality 欄位上（如 UUID），hash table 記憶體爆炸
- 多個排程同時對同一張大表執行複雜查詢
- `sort_buffer_size` 不足，filesort 溢出至磁碟（disk sort）

---

## 七、資料分佈對索引效益的影響

### 7.1 Cardinality 與選擇性

**選擇性（Selectivity）** = 不重複值數量 / 總行數，越接近 1 越好。

```
Cardinality = 2，Total rows = 4,300,000
選擇性 = 2 / 4,300,000 ≈ 0.000046  →  極差，索引幾乎無法縮小掃描範圍
```

MySQL 的查詢優化器（Query Optimizer）會根據統計資訊決定是否使用索引。若選擇性過低，優化器可能主動放棄索引改用全表掃描（認為全表掃描反而更快）。

### 7.2 資料分佈嚴重傾斜時的複合索引

**情境**：`provider_id` 只有 2 個值，99% 資料屬於同一個 provider。

**誤解**：「provider_id 選擇性這麼差，複合索引 `(provider_id, created_at)` 也沒用。」

**正確理解**：複合索引的 B-tree 結構如下：
```
[provider_id=1, created_at=2026-01-01] → ...
[provider_id=1, created_at=2026-01-02] → ...  ← 群內按 created_at 排序
...
[provider_id=1, created_at=2026-02-14] → ...  ← 查詢範圍起點
[provider_id=1, created_at=2026-02-15] → ...  ← 查詢範圍終點
...
[provider_id=2, created_at=2026-01-01] → ...
```

查詢 `WHERE provider_id = 1 AND created_at >= '2026-02-14' AND created_at < '2026-02-15'`：
- MySQL 直接定位到範圍起點，連續讀取到終點
- 掃描行數 = 當天 provider 1 的資料量（~44,000 筆）
- 而非 provider 1 的全部資料（~4,300,000 筆）

**結論**：`provider_id` 負責定位「分段」，`created_at` 負責縮小範圍。即使 `provider_id` 選擇性差，複合索引的效益來自第二個欄位的高選擇性。

---

## 八、本案實測數據彙整

### 環境

- 資料庫：Google Cloud SQL MySQL 8.0.37
- 資料表：`record.user_login_record`、`record.user_deposited_record`
- 測試時機：正式環境，無複合索引狀態

### EXPLAIN 結果

| 查詢 | type | key_len | Extra |
|---|---|---|---|
| 現況全明細查詢 | `ref` | 2 | Using where |
| VIP 聚合（無複合索引）| `ref` | 2 | Using where; Using filesort |
| 付費人數聚合（無複合索引）| `ref` | 2 | Using where |
| 各類型儲值聚合（無複合索引）| `ref` | 2 | Using where; Using filesort |

### 正式環境實測

- 聚合查詢（無複合索引）：CPU 及查詢速度無明顯差異
- 掃描量約 44,000–50,000 筆（單日單 provider）
- 無阻塞其他服務 INSERT 的情況

### 資料表狀態

| 資料表 | 筆數 | 資料大小 | 索引大小 |
|---|---|---|---|
| `user_login_record` | 4,346,418 | 345 MB | 162 MB |
| `user_deposited_record` | 2,241,881 | 127 MB | 82 MB |

---

## 九、決策框架

```
查詢是否有 type = ALL 或 key = NULL？
 ├── 是 → 必須加索引
 └── 否 → 繼續分析

key_len 是否遠小於理論最大值？
 ├── 是 → 複合索引未完整使用，考慮調整索引欄位順序或新增複合索引
 └── 否 → 索引使用正常

查詢的實際掃描量（rows）是否遠大於返回量？
 ├── 是 → 索引選擇性差，考慮複合索引或改寫查詢
 └── 否 → 可接受

CPU 壓力是否在可接受範圍？（参考第六節門檻）
 ├── 否 → 需優化查詢或索引
 └── 是 → 是否有並發安全疑慮？
              ├── SELECT 為普通查詢 → 安全，不阻塞
              └── 含 LOCK → 評估鎖定範圍與時間

DDL 成本是否在可接受範圍？
 ├── Online DDL + 離峰執行 → 安全
 └── 需鎖表 → 必須安排維護視窗
```

---

## 十、常用 SQL 指令速查

```sql
-- 查看執行計畫
EXPLAIN SELECT ...;
EXPLAIN FORMAT=JSON SELECT ...;

-- 查看資料表結構與索引
SHOW CREATE TABLE {table_name}\G
SHOW INDEX FROM {table_name};

-- 查看資料量與大小
SELECT COUNT(*) FROM {table_name};
SELECT table_name, table_rows,
  ROUND(data_length/1024/1024, 2) AS data_mb,
  ROUND(index_length/1024/1024, 2) AS index_mb
FROM information_schema.tables
WHERE table_schema = '{db}' AND table_name = '{table}';

-- 確認 MySQL 版本
SELECT VERSION();

-- Online DDL 新增複合索引
ALTER TABLE {table_name}
  ADD INDEX idx_col1_col2 (col1, col2),
  ALGORITHM=INPLACE, LOCK=NONE;

-- 監控 replica lag
SHOW SLAVE STATUS\G

-- 查看當前連線與執行中的查詢
SHOW PROCESSLIST;
SHOW FULL PROCESSLIST;

-- 查看 InnoDB 狀態（含鎖定資訊）
SHOW ENGINE INNODB STATUS\G
```

---

*最後更新：2026-02-24*
*來源案例：MakeServiceDailyReport OOM 重構 — Phase 2 DB 聚合優化*
