# Redis 學習筆記

<!-- TOC -->

- [Redis 學習筆記](#redis-學習筆記)
  - [redis-cil](#redis-cil)
  - [資料類型](#資料類型)
    - [string](#string)
    - [List](#list)
    - [Set](#set)
    - [Hash](#hash)
      - [HGETALL 指令詳細說明](#hgetall-指令詳細說明)
      - [Laravel 更新 Hash 指定 Key 值的情境範例](#laravel-更新-hash-指定-key-值的情境範例)
    - [Sorted Set](#sorted-set)
  - [Redis Pipeline](#redis-pipeline)
    - [簡介](#簡介)
    - [工作原理](#工作原理)
    - [效能提升原理](#效能提升原理)
    - [使用場景](#使用場景)
    - [優缺點](#優缺點)
    - [程式語言範例](#程式語言範例)
      - [Redis CLI 範例](#redis-cli-範例)
      - [Python 範例](#python-範例)
      - [Node.js 範例](#nodejs-範例)
      - [PHP 範例](#php-範例)
      - [Laravel 範例](#laravel-範例)
    - [效能測試範例](#效能測試範例)
    - [注意事項](#注意事項)
    - [最佳實踐](#最佳實踐)
  - [redis Key](#redis-key)
  - [指令間聽](#指令間聽)
  - [Redis GUI](#redis-gui)
  - [windows 安裝 phpredis](#windows-安裝-phpredis)
  - [Redis 與 Memcached 的差異](#redis-與-memcached-的差異)

<!-- /TOC -->

## redis-cil

```shell
# redis-cli -h <host> -p <port>
redis-cli -h 127.0.0.1 -p 6379
```

## 資料類型

- redis 支援五種資料類型：
  - string 字串
  - hash 雜湊
  - list 列表
  - set 集合
  - zset 有序集合

### string

一個 key 對應一個 value。

字串類型為二進制，因此 string 可包含任何資料，如 jpg 圖片，或是一個序列化的物件。

string 最大可以儲存 512MB

```shell
# SET key value [EX seconds|PX milliseconds|KEEPTTL] [NX|XX]
> SET phone Note10 EX 10          # 10 秒過期
> SET price 23900

# SETNX key value
# SET if Not Exist，如果該 key 不存在才儲存
> SETNX frameworks "react vue angular" # 回傳 1 表示成功，0 表示失敗（該 key 已經存在）

# SETEX key seconds value  # 設定過期時間

# 增加或減少數值
> INCR price               # 23901，一次增加 1
> DECR price               # 23900，一次減少 1
> INCRBY price 1000        # 24900，一次增加 1000
> DECRBY price 1000        # 23900，一次減少 1000
```

### List

由於 Lists 本質上是 linked-list 的緣故，它在新增和刪除元素的速度是快的，但搜尋速度是相對慢的。可以使用 RPUSH 和 LPUSH 來新增元素，如果該 key 尚不存在的話，會回傳新的 List，如果該 key 已經存在，或它不是 List 的話，則會回傳錯誤。

- 有順序性
- 新增刪除速度相對快：適合用在只要取出頭尾元素的情況(ex: Quene)
- 搜尋速度相對慢
- 適用時機
  - Message Quene: 只需取出頭尾的元素，不需要搜尋

```shell
# 在 List 中新增元素
# RPUSH <key> <element> [element ...] / LPUSH <key> <element> [element ...]
> RPUSH frameworks react vue angular  # 3
> LPUSH frameworks svelte             # 4

# 檢視 List 中的元素
# LRANGE <key> <start> <stop>
> LRANGE frameworks 0 -1  # 列出所有元素，-1 表示 list 中的最後一個元素

# 檢視 List 數目
# LLEN <key>
> LLEN frameworks

# 移除 list 中的元素
# RPOP <key> / LPOP <key>
> RPOP frameworks         # 移除 list 最後一個元素
> LPOP frameworks
```

### Set

由多個 redis 中的 string 以無序的方式所組成，其保證內部不會有重複的元素，此外 Redis 提供了多個 Set 之間交集、差集與聯集的操作。

- 使用時機：

  - 記錄每一個造訪的 ip
  - 商品標籤

- Set 的基礎操作
  - CRUD: SADD SREM SMEMBERS SCARD SPOP
  - 集合操作: SDIFF SINTER SUNION

```shell
# SADD <key> <member> [member ...]   # 新增元素到 Set 中
> SADD languages english             # 1，新增的元素數目
> SADD languages frensh chinese      # 2，新增的元素數目
> SADD languages english             # 0，如果元素已經在該 Sets 中，會回傳 0

# SREM <key> <member> [member...]     # 從 Set 中移除元素
> SREM languages english              # 1，移除的元素數目

# SMEMBERS <key>                      # 檢視 Set 中所有元素
> SMEMBERS languages                  # 回傳的元素沒有順序性

# SISMEMBER <key> <member>            # 檢視元素是否存在該 Set 中
> SISMEMBER languages chinese         # 1，存在的話回傳 1，不存在則回傳 0

# SUNION <key> [key...]               # 合併多個 Sets
> SUNION languages programming-languages
127.0.0.1:6379> SMEMBERS bike
1) "green"
2) "white"
3) "black"
4) "red"
127.0.0.1:6379> SUNION car
1) "green"
2) "yellow"
3) "red"
127.0.0.1:6379> SUNION car bike
1) "yellow"
2) "red"
3) "white"
4) "black"
5) "green"
```

### Hash

為 key-value 的資料類型，也是 Redis 的主結構，非常適合用於儲存物件型資料，例如 User 物件有姓名、年齡、信箱等。當物件非常小時，Hash 會將資料壓縮後儲存，因此單台 redis 可以儲存數百萬個小物件。

- Hash 的基礎操作
  - **Create**: HSET, HMSET, HSETNX
  - **Read**: HGET, HMGET, HGETALL, HKEYS, HVALS, HEXISTS, HLEN
  - **Update**: HSET (覆蓋), HINCRBY, HINCRBYFLOAT
  - **Delete**: HDEL
  - **多欄位操作**: HMSET, HMGET, HGETALL

```shell
# HSET <key> <field> <value> [field value...]   # 新增 field-value pairs 到 Hash 中
> HSET phone name "iphone"       # 1，新增的數目
> HSET phone price 22500     # 1，新增的數目
> HSET phone name "iphone mini"  # 0，表示該 field 已經存在 hash 中，將會「更新」其 value

# HGET <key> <field>             # 取得 field 的 value
> HGET phone name                # "iphone mini"

# HGETALL <key>                  # 取得該 hash 的所有值
> HGETALL phone

# HMSET <key> <field> <value> [field value...]  # 一次設定多個 field-value pairs
> HMSET phone brand "Apple" model "iPhone 15"    # OK

# HMGET <key> <field> [field...]    # 一次取出多個 field 的值
> HMGET phone name price brand      # ["iphone mini", "22500", "Apple"]

# HDEL <key> <field> [field...]     # 刪除指定的 field
> HDEL phone brand model            # 2，刪除的 field 數目

# HEXISTS <key> <field>             # 檢查 field 是否存在
> HEXISTS phone name                # 1，存在
> HEXISTS phone brand               # 0，不存在

# HKEYS <key>                       # 取得所有 field 名稱
> HKEYS phone                       # ["name", "price"]

# HVALS <key>                       # 取得所有 value
> HVALS phone                       # ["iphone mini", "22500"]

# HLEN <key>                        # 取得 field 數量
> HLEN phone                        # 2

# HSETNX <key> <field> <value>     # 只在 field 不存在時才設定
> HSETNX phone color "black"       # 1，成功設定
> HSETNX phone name "iPhone 16"    # 0，field 已存在，不更新

# HINCRBY <key> <field> <increment>    # 將 field 的數值增加指定值
> HSET counter views 100              # 設定初始值
> HINCRBY counter views 50            # 150，views 增加 50

# HINCRBYFLOAT <key> <field> <increment>  # 將 field 的浮點數值增加指定值
> HSET product rating 4.5             # 設定初始評分
> HINCRBYFLOAT product rating 0.3     # 4.8，rating 增加 0.3

# HSTRLEN <key> <field>              # 取得 field 值的字串長度
> HSTRLEN phone name                  # 12，"iphone mini" 的長度

# 實用範例：使用者資料管理
> HSET user:1001 name "小明" age "25" email "ming@example.com" city "台北"
> HSET user:1001 last_login "2024-01-15" login_count 0
> HINCRBY user:1001 login_count 1    # 登入次數 +1
> HMGET user:1001 name age city      # ["小明", "25", "台北"]
> HGETALL user:1001                  # 取得完整使用者資料
```

#### HGETALL 指令詳細說明

`HGETALL` 是 Redis 用於取得指定 Hash（雜湊）鍵下所有欄位（field）與對應值（value）的指令。回傳結果會依序列出所有欄位名稱與其值，適合用於一次取得整個 Hash 的所有資料。

**語法：**

```shell
HGETALL <key>
```

- `<key>`：要查詢的 Hash 鍵名。

**回傳格式：**

- 若指定的 key 存在且為 Hash，回傳所有欄位與值，格式為陣列（field1, value1, field2, value2, ...）。
- 若 key 不存在，回傳空陣列。

**範例：**

Redis CLI 範例：

```shell
127.0.0.1:6379> HSET user:1001 name "小明" age "25" city "台北"
(integer) 3
127.0.0.1:6379> HGETALL user:1001
1) "name"
2) "小明"
3) "age"
4) "25"
5) "city"
6) "台北"
```

Laravel phpredis 範例：

```php
<?php

use Illuminate\Support\Facades\Redis;

// 設定 Hash 資料
Redis::hset('user:1001', 'name', '小明');
Redis::hset('user:1001', 'age', '25');
Redis::hset('user:1001', 'city', '台北');

// 一次設定多個欄位
Redis::hmset('user:1001', [
    'email' => 'ming@example.com',
    'last_login' => '2024-01-15',
    'login_count' => 0
]);

// 取得單個欄位值
$name = Redis::hget('user:1001', 'name'); // "小明"

// 取得多個欄位值
$userData = Redis::hmget('user:1001', ['name', 'age', 'city']);
// ["小明", "25", "台北"]

// 取得所有欄位和值
$allData = Redis::hgetall('user:1001');
// ["name" => "小明", "age" => "25", "city" => "台北", "email" => "ming@example.com", ...]

// 檢查欄位是否存在
$exists = Redis::hexists('user:1001', 'name'); // true

// 取得所有欄位名稱
$fields = Redis::hkeys('user:1001'); // ["name", "age", "city", "email", ...]

// 取得所有值
$values = Redis::hvals('user:1001'); // ["小明", "25", "台北", "ming@example.com", ...]

// 取得欄位數量
$count = Redis::hlen('user:1001'); // 5

// 數值操作
Redis::hincrby('user:1001', 'login_count', 1); // 登入次數 +1

// 刪除欄位
Redis::hdel('user:1001', 'last_login'); // 1

// 使用 Laravel 的 Redis Facade 進行批量操作
Redis::pipeline(function ($pipe) {
    $pipe->hset('user:1001', 'status', 'active');
    $pipe->hset('user:1001', 'updated_at', now()->toISOString());
    $pipe->expire('user:1001', 3600); // 1小時過期
});
```

**常見用途：**

- 一次取得某個使用者、設定檔、會話等所有屬性
- 檢查 Hash 內所有資料內容
- 配合資料遷移、備份時導出完整 Hash
- 快速檢查設定或狀態資訊

**與 HGET 差異：**

- `HGETALL`：一次取得 Hash 內所有欄位與值
- `HGET`：僅取得指定欄位的值

範例：

```shell
127.0.0.1:6379> HGET user:1001 name
"小明"
127.0.0.1:6379> HGETALL user:1001
1) "name"
2) "小明"
3) "age"
4) "25"
3) "city"
4) "台北"
```

**注意事項：**

- 若 Hash 很大，`HGETALL` 可能回傳大量資料，請注意效能與網路流量。
- 若 key 不存在，回傳空陣列，不會報錯。

#### Laravel 更新 Hash 指定 Key 值的情境範例

以下展示在 Laravel 專案中常見的 Hash 更新情境，包含簡單的 Redis 指令和操作流程：

**1. 使用者資料更新流程：**

```php
// 設定使用者資料到 Hash
$userId = 1001;
$redisKey = "user:{$userId}:profile";

// 流程 1: 單一欄位更新
Redis::hset($redisKey, 'name', '小明');
Redis::hset($redisKey, 'age', '25');

// 流程 2: 批量更新多個欄位
Redis::hmset($redisKey, [
    'email' => 'ming@example.com',
    'city' => '台北',
    'last_login' => now()->toISOString()
]);

// 流程 3: 更新修改時間戳
Redis::hset($redisKey, 'updated_at', now()->toISOString());

// 流程 4: 設定過期時間（24小時）
Redis::expire($redisKey, 86400);
```

**2. 計數器操作流程：**

```php
// 流程 1: 登入次數遞增
$loginCount = Redis::hincrby($redisKey, 'login_count', 1);

// 流程 2: 評分遞增（浮點數）
$newRating = Redis::hincrbyfloat($redisKey, 'rating', 0.5);

// 流程 3: 檢查欄位是否存在
if (Redis::hexists($redisKey, 'login_count')) {
    // 欄位存在，進行更新
    Redis::hset($redisKey, 'last_activity', now()->toISOString());
}
```

**3. 條件式更新流程：**

```php
<?php

// 流程 1: 只在欄位不存在時設定（HSETNX）
$result = Redis::hsetnx($redisKey, 'created_at', now()->toISOString());
if ($result) {
    echo "新欄位已建立";
} else {
    echo "欄位已存在，未更新";
}

// 流程 2: 檢查並更新受保護欄位
$protectedFields = ['_system', '_version'];
$field = 'status';

if (!in_array($field, $protectedFields)) {
    Redis::hset($redisKey, $field, 'active');
    Redis::hset($redisKey, '_last_updated', now()->toISOString());
}
```

**4. 批量操作流程（使用 Pipeline）：**

```php
<?php

// 流程: 使用 Pipeline 進行多個操作
Redis::pipeline(function ($pipe) use ($redisKey) {
    // 更新使用者狀態
    $pipe->hset($redisKey, 'status', 'online');

    // 更新活動時間
    $pipe->hset($redisKey, 'last_activity', now()->toISOString());

    // 遞增活動計數
    $pipe->hincrby($redisKey, 'activity_count', 1);

    // 設定過期時間
    $pipe->expire($redisKey, 3600);
});
```

**5. 資料查詢和驗證流程：**

```php
<?php

// 流程 1: 取得更新後的資料
$userData = Redis::hgetall($redisKey);

// 流程 2: 取得特定欄位值
$name = Redis::hget($redisKey, 'name');
$age = Redis::hget($redisKey, 'age');

// 流程 3: 取得多個欄位值
$profileFields = Redis::hmget($redisKey, ['name', 'age', 'city']);

// 流程 4: 檢查欄位數量
$fieldCount = Redis::hlen($redisKey);
```

**6. 快取管理流程：**

```php
<?php

// 流程 1: 更新系統設定
$settingsKey = 'settings:app';
Redis::hset($settingsKey, 'maintenance_mode', 'false');
Redis::hset($settingsKey, 'cache_ttl', '3600');

// 流程 2: 批量更新設定
Redis::hmset($settingsKey, [
    'debug_mode' => 'true',
    'log_level' => 'info',
    'timezone' => 'Asia/Taipei'
]);

// 流程 3: 更新快取時間戳
Redis::hset($settingsKey, '_last_updated', now()->toISOString());
```

**主要操作流程總結：**

1. **單一更新**: 使用 `HSET` 更新個別欄位
2. **批量更新**: 使用 `HMSET` 一次更新多個欄位
3. **條件更新**: 使用 `HSETNX` 避免覆蓋現有資料
4. **數值操作**: 使用 `HINCRBY` 和 `HINCRBYFLOAT` 進行計數
5. **批量操作**: 使用 `Pipeline` 提升效能
6. **資料驗證**: 使用 `HEXISTS` 檢查欄位存在性
7. **過期管理**: 使用 `EXPIRE` 設定快取生命週期

這些流程展示了在 Laravel 中如何有效地使用 Redis Hash 進行各種更新操作，適合用於使用者資料管理、計數器、系統設定等場景。

### Sorted Set

為有序的 Set，其順序會依照傳入的權重值排序，在查找資料時，可使用 binary search，因此查找效率高。由於 Sorted Set 的高效能查詢，Sorted Set 可當做一組 Hash 資料的 index，將物件 id 以及 index field 儲存在 Sort Set，單筆物件的完整資料儲存在 Hash。

- 有順序性，透過 `score` 產生連結來達到排序的作用，`score` 本身會是 `float`
- 元素值仍然是唯一，但 `score` 可以不是唯一
- 不論是 Add, Remove 或是 update 速度都很快，可以同時快速搜學中間的項目
- 可以視為 `set` 和 `hash` 的混合
- 使用上指令和 `set` 相似，只要將最開頭的 `S` 改成 `Z`
- 使用時機

  - 遊戲的計分板

- Sorted Set 的基礎操作

  - CRUD: ZADD ZRANGE ZREM
  - Rank 操作: ZRANK 找元素位置，ZSCORE 設定元素權重值

- option
  - XX: 只更新存在的成員，不添加新成員
  - NX: 不更新存在的成員，只添加新成員
  - CN: 修改返回值為發生變化的成員總數，原始是返回新添加成員的總數(CH 為 change 的縮寫)。更改的元素是新增加的成員，已經存在的成員更新分數。所以在命令中指定的成員有相同的分數將不被計算在內。一般而言，ZADD 只會返回新增成員的數量
  - INCR: 當 ZADD 指定這個選項時，成員的做就等同 ZINCRBY 命令，對成員的分數進行遞增操作。

```shell
# ZADD <key> [NX|XX] [CH] [INCR] <score> <member> [score member ...]，新增 sorted Set
> ZADD students 1 aaron                  # 1
> ZADD students 2 allison         # 1
> ZADD students 3 bruce 4 derek          # 2

# XX：只更新已存在的 member 的 score，絕不新增 member
# NX：不更新已存在的 member 的 score，總是新增 member
> ZADD students XX 10 aaron    # 如果 aaron 存在，則將 score 更新為 10
> ZADD students NX 777 jen     # 如果 jen 不存在，則新增且將 score 設為 777

# ZRANGE <key> <start> <stop> [WITHSCORES]，檢視 sorted set
> ZRANGE students 0 -1                   # 檢視 sorted set 中所有元素

# ZCARD <key>，檢視該 set 中的元素數目
> ZCARD students

# ZCOUNT <key> <min> <max>     # 檢視分數介於 min ~ max 間的元素拭目
> ZCOUNT students 0 10

# ZSCORE <key> <member>        # 檢視某 member 的 score
> ZSCORE students aaron

# ZINCRBY <key> <increment> <member>    # 幫 member 的 score 分數增加
> ZINCRBY students 10 aaron             # 幫 aaron 的 score 加 10
```

## Redis Pipeline

### 簡介

Redis Pipeline（管道）是一種將多個 Redis 指令打包在一起發送的技術，可以大幅提升 Redis 操作的效能。傳統的 Redis 操作模式是「請求-回應」的往返模式，而 Pipeline 允許客戶端將多個指令一次性發送到 Redis 伺服器，然後一次性接收所有回應。

### 工作原理

**傳統模式（無 Pipeline）：**

```
Client -> SET key1 value1 -> Server
Client <- OK <- Server
Client -> SET key2 value2 -> Server
Client <- OK <- Server
Client -> SET key3 value3 -> Server
Client <- OK <- Server
```

**Pipeline 模式：**

```
Client -> SET key1 value1 -> Server
Client -> SET key2 value2 -> Server
Client -> SET key3 value3 -> Server
Client <- OK <- Server
Client <- OK <- Server
Client <- OK <- Server
```

### 效能提升原理

1. **減少網路往返次數**：將多個指令打包成一個批次發送
2. **降低網路延遲影響**：減少 TCP 連接的開銷
3. **提高吞吐量**：特別適合需要執行大量指令的場景

### 使用場景

- **批量資料操作**：一次性設定多個 key-value
- **資料初始化**：大量資料的初始載入
- **統計資料處理**：需要執行多個計數器操作
- **快取預熱**：系統啟動時預先載入快取資料
- **資料遷移**：大量資料的匯入匯出

### 優缺點

**優點：**

- 大幅提升效能，特別是在高延遲網路環境下
- 減少網路開銷
- 提高系統吞吐量
- 適合批量操作場景

**缺點：**

- 不支援原子性操作（與 Redis Transaction 不同）
- 記憶體使用量可能增加
- 錯誤處理較複雜
- 不適合需要即時回應的場景

### 程式語言範例

#### Redis CLI 範例

```shell
# 使用 redis-cli 的 --pipe 選項
echo -en '*3\r\n$3\r\nSET\r\n$4\r\nkey1\r\n$5\r\nvalue1\r\n*3\r\n$3\r\nSET\r\n$4\r\nkey2\r\n$5\r\nvalue2\r\n' | redis-cli --pipe

# 或者使用檔案方式
cat commands.txt | redis-cli --pipe
```

#### Python 範例

```python
import redis

# 建立 Redis 連接
r = redis.Redis(host='localhost', port=6379, db=0)

# 使用 Pipeline
pipe = r.pipeline()

# 將多個指令加入 Pipeline
pipe.set('user:1:name', '小明')
pipe.set('user:1:age', '25')
pipe.set('user:1:city', '台北')
pipe.incr('user:counter')
pipe.expire('user:1:name', 3600)

# 執行所有指令
results = pipe.execute()
print(results)  # [True, True, True, 1, True]

# 使用上下文管理器
with r.pipeline() as pipe:
    pipe.set('key1', 'value1')
    pipe.set('key2', 'value2')
    pipe.set('key3', 'value3')
    results = pipe.execute()
```

#### Node.js 範例

```javascript
const { createClient } = require("redis");

async function pipelineExample() {
  const client = createClient();
  await client.connect();

  // 建立 Pipeline
  const pipeline = client.multi();

  // 加入多個指令
  pipeline.set("user:1:name", "小明");
  pipeline.set("user:1:age", "25");
  pipeline.set("user:1:city", "台北");
  pipeline.incr("user:counter");
  pipeline.expire("user:1:name", 3600);

  // 執行 Pipeline
  const results = await pipeline.exec();
  console.log(results);

  await client.quit();
}

pipelineExample();
```

#### PHP 範例

```php
<?php
$redis = new Redis();
$redis->connect('127.0.0.1', 6379);

// 開始 Pipeline
$redis->multi();

// 加入多個指令
$redis->set('user:1:name', '小明');
$redis->set('user:1:age', '25');
$redis->set('user:1:city', '台北');
$redis->incr('user:counter');
$redis->expire('user:1:name', 3600);

// 執行 Pipeline
$results = $redis->exec();
print_r($results);
?>
```

#### Laravel 範例

```php
use Illuminate\Support\Facades\Redis;

// 使用 Laravel Redis Facade
$pipeline = Redis::pipeline();

$pipeline->set('user:1:name', '小明');
$pipeline->set('user:1:age', '25');
$pipeline->set('user:1:city', '台北');
$pipeline->incr('user:counter');
$pipeline->expire('user:1:name', 3600);

$results = $pipeline->execute();
dd($results);
```

### 效能測試範例

```python
import redis
import time

r = redis.Redis(host='localhost', port=6379, db=0)

# 測試傳統模式
start_time = time.time()
for i in range(1000):
    r.set(f'key{i}', f'value{i}')
traditional_time = time.time() - start_time

# 測試 Pipeline 模式
start_time = time.time()
pipe = r.pipeline()
for i in range(1000):
    pipe.set(f'key{i}', f'value{i}')
pipe.execute()
pipeline_time = time.time() - start_time

print(f'傳統模式耗時: {traditional_time:.4f} 秒')
print(f'Pipeline 模式耗時: {pipeline_time:.4f} 秒')
print(f'效能提升: {traditional_time/pipeline_time:.2f} 倍')
```

### 注意事項

1. **記憶體使用**：Pipeline 會將所有指令暫存在記憶體中，大量指令時需注意記憶體使用量
2. **錯誤處理**：Pipeline 中的某個指令失敗不會影響其他指令的執行
3. **原子性**：Pipeline 不保證原子性，如需原子性操作請使用 Redis Transaction
4. **網路延遲**：在低延遲網路環境下，Pipeline 的效能提升可能不明顯
5. **指令順序**：Pipeline 中的指令會按順序執行，但回應順序可能不同

### 最佳實踐

1. **適當的批次大小**：建議每批次 100-1000 個指令
2. **錯誤處理**：實作適當的錯誤處理機制
3. **監控記憶體**：監控 Pipeline 的記憶體使用情況
4. **測試效能**：在實際環境中測試 Pipeline 的效能提升
5. **考慮替代方案**：對於簡單操作，考慮使用 Redis 的批量指令（如 MSET、MGET）

## redis Key

| 指令                                      | 描述                                      |
| ----------------------------------------- | ----------------------------------------- |
| DEL key                                   | 當 key 存在時，將其刪除                   |
| DUMP key                                  | 序列化傳入的 key，並回傳被序列化的值      |
| EXISTS key                                | 檢查傳入的 key 是否存在                   |
| EXPIRE key seconds                        | 為傳入的 key 設定過期時間，以秒計         |
| EXPIREAT key timestamp                    | 設定過期時間，接受 UNIX 時間戳 為時間參數 |
| PEXPIRE key milliseconds                  | 設置過期時間以毫秒計                      |
| PEXPIREAT key milliseconds-timestamp      | 設置過期時間的時間戳以毫秒計              |
| KEYS pattern                              | 查找所有符合傳入模式 (pattem) 的 key      |
| MOVE key db                               | 將目前資料庫中 key 移動到指定的資料庫中   |
| PERSIST key                               | 移除 key 的過期時間，key 將永久保存       |
| PTTL key                                  | 以毫秒為單位，回傳 key 剩餘的過期時間     |
| TTL key                                   | 以秒為單位，回傳 key 剩餘的過期時間       |
| RANDOMKEY                                 | 從資料庫中，隨機回傳一個 key              |
| RENAME key newkey                         | 修改 key 的名稱                           |
| RENAMENX key newkey                       | 當 newkey 不存在時，將 key 改名為 newkey  |
| SCAN cursor [MATCH pattern] [COUNT count] | 迭代資料庫中的資料庫鍵                    |
| TYPE key                                  | 返回 key 所儲存的值的類型                 |

## 指令間聽

在 redis-cli 中下 `monitor` 可監聽所有對 redis 的操作

## Redis GUI

> [Another Redis Desktop Manager](https://github.com/qishibo/AnotherRedisDesktopManager/)
>
> [[Tool] Redis 管理工具 - Another Redis Desktop Manager](https://marcus116.blogspot.com/2020/04/tool-redis-another-redis-desktop-manager.html)

## windows 安裝 phpredis

> 下載 phpredis 需要對應 php 的版本
>
> PHP Version `7.4.29`
>
> Architecture: `x64`
>
> PHP Extension Build: API20190902,`TS`,`VC15`

[windows phpredis](https://windows.php.net/downloads/pecl/releases/redis/)

5.3.7 -> php_redis-`5.3.7-7.4`-`ts-vc15`-`x64`.zip

將下載的檔案解壓縮後，將資料夾內 `php_redis.dll` 和 `php_redis.pdb` 複製到 php 的擴充套件 `ext` 目錄之下

最後在 php.ini 檔案中，加入兩行程式碼(注意順序)

```txt
extension=php_igbinary.dll
extension=php_redis.dll
```

最後在 phpinfo 中檢查 php-redis 是否安裝成功

## Redis 與 Memcached 的差異

1. 資料結構： redis 提供多種資料結構，如字串、雜湊表、列表、集合、有序集合等。而 memcached 只有支援簡單的 key value。
2. 持久化方式：redis 提供多種持久化方式：RDB、AOF，可以將資料儲存到硬碟中，而 memcached 不支援持久化。
3. 資料分片方式： redis 使用 hash 槽分片方式，可以實現資料的自動分片和負載平衡，而 memcached 只能手動分片。
4. 處理資料的方式：redis 使用單執行緒處理資料請求，支援事務、Lua 腳本等進階功能。而 memcached 使用多執行緒處理資料請求，只支援基本的 Get、Set 操作。
5. 協議：Redis 使用自己的協議，支援多個資料庫，可以使用密碼進行認證。而 memcached 使用文字協議，只支援一個預設資料庫。
6. 記憶體管理方式： redis 的記憶體管理比 memcached 更加複雜，支援更多的記憶體最佳化策略。
