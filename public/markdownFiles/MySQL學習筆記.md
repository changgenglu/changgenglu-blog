# MySQL 學習筆記

<!-- TOC -->

- [MySQL 學習筆記](#mysql-學習筆記)
  - [環境設定](#環境設定)
    - [設定時區](#設定時區)
    - [MariaDB 設定命名時區](#mariadb-設定命名時區)
      - [從 zoneinfo 匯入時區](#從-zoneinfo-匯入時區)
      - [從 mysql 提供的指令碼匯入](#從-mysql-提供的指令碼匯入)
  - [資料表語法](#資料表語法)
  - [資料型態](#資料型態)
  - [資料庫設計原則](#資料庫設計原則)
    - [資料庫設計和表建立時就要考慮效能](#資料庫設計和表建立時就要考慮效能)
      - [選擇適合的資料型別](#選擇適合的資料型別)
      - [選擇適合的索引列](#選擇適合的索引列)
    - [SQL 的編寫需要注意最佳化](#sql-的編寫需要注意最佳化)
      - [引擎選擇](#引擎選擇)
      - [分割槽](#分割槽)
  - [DB 命名原則](#db-命名原則)
    - [資料庫命名](#資料庫命名)
    - [資料表命名](#資料表命名)
    - [欄位命名](#欄位命名)
    - [索引命名](#索引命名)
      - [外鍵索引](#外鍵索引)
  - [Function](#function)
    - [CONVERT\_TZ(dt,from\_tz,to\_tz) 轉換時區](#convert_tzdtfrom_tzto_tz-轉換時區)
    - [Event 事件](#event-事件)
      - [範例](#範例)
      - [基本使用](#基本使用)
  - [使用情境](#使用情境)
    - [外鍵 onDelete 約束情況](#外鍵-ondelete-約束情況)
    - [ERROR: #1215 - Cannot add foreign key constraint](#error-1215---cannot-add-foreign-key-constraint)
    - [刪除重複的資料](#刪除重複的資料)
      - [使用 `DISTINCT` 去除重複值](#使用-distinct-去除重複值)
    - [匯入 txt 檔](#匯入-txt-檔)
    - [複合主鍵與聯合主鍵，索引與聯合(複合)索引](#複合主鍵與聯合主鍵索引與聯合複合索引)
      - [複合主鍵與聯合主鍵](#複合主鍵與聯合主鍵)
      - [索引、聯合(複合)索引](#索引聯合複合索引)

<!-- /TOC -->

## 環境設定

### 設定時區

- `show variables like '%time_zone%'` 查看當前時區
  - 會返回兩行紀錄，第一行為 system_time_zone(系統時區)，第二行為 time_zone(資料庫時區)
- `set time_zone='+8:00'` 設置當前請求的時區
  - 不須重新連接 mysql
  - 僅當前的請求有效，若關閉則回復原始值。
- `set global time_zone='+8:00` 設定全域時區
  - 全域請求有效，但必須重新連接 mysql 才會生效(exit 後重新 mysql -uroot -p 進行連接)。
  - 不須重啟 mysql，重啟後回復原始值
- 修改 mysql 設定文件
  - 在 my.ini 中添加
  - 須重啟 mysql

```ini
[mysqld]
default-time-zone=+00:00
character-set-server=utf8mb4
```

### MariaDB 設定命名時區

命名時區是指使用時區的名字，而不是標準時間的小時差。例如 `Asia/Taipei` 就是命名時區，而不是 +08:00。
在 MariaDB 中域設有時區表，但預設為空，需要填充這些表後才能使用。

#### 從 zoneinfo 匯入時區

若系統環境為類 Unix 系統(Mac OS, Linux, FreeBSD, Sun Solaris)，zoneinfo 文件已經包含在系統中。
輸入指令將時區表加入 MariaDB 中的 MySQL 資料庫中

```bash
mysql_tzinfo_to_sql /usr/share/zoneinfo | mariadb -u root -p mysql
&
mysql_tzinfo_to_sql /usr/share/zoneinfo | mysql -u root -p mysql
```

#### 從 mysql 提供的指令碼匯入

由於 windows 沒有 zoneinfo 資料庫，所以必須透過 sql 指令碼匯入時區表

- 下載 sql 指令碼並解壓縮：[https://downloads.mysql.com/general/timezone_2022g_posix_sql.zip](https://downloads.mysql.com/general/timezone_2022g_posix_sql.zip)
- 登入 mariaDB

```bash
.\mysql.exe -u root -p
# 輸入 root 使用者密碼
```

- 連接 MySQL 資料庫

```bash
USE mysql
```

- 從 SQL 指令碼匯入資料

```bash
SOURCE C:\Users\Adam\Downloads\timezone_posix.sql
```

- 檢查是否正確匯入

```bash
SELECT * FROM mysql.time_zone_name;
```

```output
+----------------------------------+--------------+
| Name                             | Time_zone_id |
+----------------------------------+--------------+
| Africa/Abidjan                   |            1 |
| Africa/Accra                     |            2 |
| Africa/Addis_Ababa               |            3 |
| Africa/Algiers                   |            4 |
| Africa/Asmara                    |            5 |
| Africa/Asmera                    |            6 |
| Africa/Bamako                    |            7 |
| Africa/Bangui                    |            8 |
| Africa/Banjul                    |            9 |
| Africa/Bissau                    |           10 |
...
...
| Zulu                             |          597 |
+----------------------------------+--------------+
597 rows in set (0.000 sec)
```

## 資料表語法

- 建立資料表

  ```sql
  CREATE TABLE 資料表名稱 (
    欄位名稱  資料型態,
    ...
  )
  ```

- 增加資料表欄位

  ```sql
  ALTER TABLE 資料表 ADD 欄位名稱 資料型態;
  ```

- 增加資料表內容

  ```sql
  INSERT INTO 資料表 (欄位1, 欄位2, 欄位3, ...)
  VALUES (值1,  值2,  值3, ...);
  ```

- 更新資料欄位

  ```sql
  UPDATE 資料表 SET 欄位1 = '資料1', 欄位2 = '資料2' WHERE 條件;
  ```

- 刪除資料欄位

  ```sql
  delete from 資料表 where 欄位 = ;
  truncate table 資料表;
  drop table 資料表

  -- 刪除外鍵欄位
  ALTER TABLE 資料表 DROP FOREIGN KEY FK_欄位 ; -- 先刪除外鍵名稱
  ALTER TABLE 資料表 DROP `欄位`;               --  才能刪除欄位
  ```

- 選擇欄位

  ```sql
      SELECT 別名.欄位,
      DISTINCT 別名.欄位          -- 欄位資料不重複
      CONCAT(別名.欄位, 別名.欄位) -- 欄位合併
      FROM 資料表 as 別名         -- 別名

      join 資料表B on 資料表別名.欄位 = 資料表B別名.欄位

      WHERE 別名.欄位 = "內容" AND 別名.欄位 = 內容  -- ...而且...
      WHERE (別名.欄位 = "內容" OR 別名.欄位 = 內容) -- (..或者..)
                                                  -- OR的前後要加上括弧，將條件限制住
      WHERE 別名.欄位 LIKE "%內容%"                 -- 內容部分有符合者
      WHERE 別名.欄位 BETWEEN 起始 and 結束         -- 連續不間段的區間
      WHERE 別名.欄位 in (內容, 內容)               -- 挑選同一型態指定內容

      GROUP BY                -- 相同的東西記錄在一起
      HAVING                  -- 接在 GROUP BY 之後設定條件
      UNION
      ORDER BY 別名.欄位       -- 排序(預設由小到大)
      ORDER BY 別名.欄位 DESC  -- 排序由大到小
      LIMIT 起始位置, 資料筆數; -- 選擇資料中要顯示的項目
  ```

- 使用者定義變數

  ```sql
  SELECT @x; --> x值為NULL

  SET @x = 1;
  SELECT @x, ProductID  FROM Products;
  ```

- 子查詢:查詢裡面有查詢

  ```sql
  --> 檢查資料表302中的 ProductID，不存在於資料表301 的 ProductID
  SELECT * FROM lab302
  WHERE ProductID NOT in (SELECT ProductID FROM lab301)
  ```

- inner join | left join | right join | cross join

  ```sql
  -- 結合兩個表中某欄位具有相同資料，一起列出查詢結果
  inner join
  -- 列出左/右邊的表，另一邊的表列出有相同的部分，不足的欄位印出NULL
  left join | right join
  -- 將所有可能的組合通通列出來(交叉查詢)
  cross join
  ```

## 資料型態

- 字串類型

  - `char()` 與 `varchar()` 的空間大小是以後面參數來表示欄位的大小，不同的地方在於`varchar()` 是以動態的方式儲存。

    ```sql
    char(10) = "hello     " -- 10 bytes  包含了五個空格
    varchar(10) = "hello"   -- 5 bytes
    ```

  - `char()` 固定大小浪費空間，但是所需的計算時間少。
  - `varchar()` 不固定長度，但是每一次抓取都要運算，花費 CPU 運算時間

- 數值類型

  |    type     | storage(bytes) |          signed          |    unsigned    |
  | :---------: | :------------: | :----------------------: | :------------: |
  |  `TINYINT`  |       1        |        -128 ~ 127        |    0 ~ 225     |
  | `SMALLINT`  |       2        |      -32768 ~ 32767      |   0 ~ 65535    |
  | `MEDIUMINT` |       3        |    -8388608 ~ 8388607    |  0 ~ 16777215  |
  |    `int`    |       4        | -2147483648 ~ 2147483647 | 0 ~ 4294967295 |
  |  `BIGINT`   |       8        |  $-2^{63}$ ~ $2^{63}-1$  | 0 ~ $2^{64}-1$ |

- `DECIMAL(x, y)` : x = 數值長度(包含小數點)，y = 小數點後的位數(不足補零)

- 時間類型

  - `YEAR` : YYYY
  - `TIME` : HH:MM:SS
  - `DATE` : YYYY-MM-DD
  - `DATETIM`E : YYYY-MM-DD HH:MM:SS

- 鍵名

  - `primary key` 主索引鍵(主鍵)
  - `foreign key` 外部索引鍵(外來鍵)
  - `UNIQUE` 唯一 不能有重複的資料
  - `_INCREMENT` 流水號
  - `DEFAULT =` 預設值
  - `CHECK ()` 資料寫入前的檢查(預設標準)

- functions | method | 方法 | 函式 | 副程式 | 函數

  - `count()` : 計算數量
  - `MAX()` : 找最大的那一個
  - `AVG()` : 平均值
  - `ABS()` : 取絕對值
  - `ROUND()` : 小數點四捨五入

  ***

  - 取得現在時間
    - `CURRENT_DATE()`
    - `SYSDATE()`
    - `NOW()`

  ***

  - `Year()` : 年

  - `Month()` : 月

  - `DAY()` : 日

  - `LENGTH()` : 資料的大小 bytes

  - `CHAR_LENGTH(`) : 字串的長度

  ***

  - `POWER(數值, N次方)` : 計算次方

  - `SUBSTRING(欄位, 起始位置, 擷取長度)` : 擷取字串

  - `INSTR(欄位, '指定的文字')` : 找出指定位置的位置，回傳數值

  - `LEFT(欄位, 擷取長度)` : 從左邊開始擷取到指定長度

  - `REPLACE(目標欄位, '目標字串', '要取代上字串')` :取代指定字元

  - `RPAD(內容, 內容的長度, '取代的字')` : 內容不足或是超過的部分會被取代

  - `REPEAT('要重複的字', 重複次數)` :重複輸入

  ***

  - 將字串轉換型態
    - `CONVERT('字串', 型態)`
    - `CAST('字串' AS 型態)`

  ***

  - `DATE_FORMAT(日期, "%Y")` :日期格式，取得日期中的項目

  ***

  - `IF(判斷條件, "條件為T", "條件為F")` :條件判斷為 true 返回 1，否則返回 2

  - `ELT(數值、清單, '值1', '值2'......'值n')` :透過數值清單傳回指定之索引的項目

  - `IFNULL(x, y)` : 如果 x 有值回傳 x，如果 x 為 NULL 回傳 y

  - `ISNULL(x)` : 如果 x 為 NULL，ISNULL(x)會回傳 1，否則回傳 0

  - `NULLIF(x, y)` : 如果 x = y 回傳 NULL，否則回傳 x

  ***

  - 類似 if else

    ```sql
    CASE
      when condition(條件為true) then "返回結果"
      --如果條件為false就繼續下一行判斷
      when condition(條件為true) then "返回結果"
      else "返回結果" -- 如果上述條件都不符，就返回此結果
    end
    ```

  - 不等於：

    - `<>`
    - `!=`
    - `NOT`

  - 比較：
    - `>=`
    - `<=`

## 資料庫設計原則

> 參考資料：
>
> [詳記一次 MySQL 千萬級大表最佳化過程！](https://www.ipshop.xyz/14954.html)

### 資料庫設計和表建立時就要考慮效能

表設計時要注意的東西

1. 資料表欄位避免出現 null，null 值不容易查詢最佳化，且佔用額外的索引空間。推薦使用數字 0 代替 null。
2. 盡量使用 INT 而非 BIGINT，如果非負，則加上 UNSIGNED (這樣做數值會擴大一倍)，若使用 TINYINT、SMALLINT、MEDIUM_INT 更好。
3. 使用列舉或整數代替字串型別。
4. 資料表不要有太多欄位，在 20 個以內。
5. 用整型來存 ip

索引

1. 索引並不是越多越好。要根據查詢有針對性的建立，考慮在 WHERE 和 ORDER BY 命令上涉及的列建立索引，可根據 EXPLAIN 來檢視是否用了索引還是全表掃描。
2. 避免在 WHERE 子句中對欄位進行 NULL 值的判斷。否則將導致引擎放棄使用 index 而使用全表掃描。
3. 值分布很稀少的欄位不適合建立索引。例如「性別」這種只有兩三個值的欄位。
4. 字元欄位只建字首索引。
5. 字元欄位最好不要作為主鍵。
6. 不用外來見，用程式保證約束。
7. 盡量不使用 UNIQUE，由程式保證約束。
8. 使用多列索引時，主意順序和查詢條件保持一致，同時刪除不必要的單列索引。

#### 選擇適合的資料型別

1. 使用可存下面資料的最小資料型別：整型 < date, time < char, varchar < blob。
2. 使用簡單的資料型別，整型比字元處理開銷更小，因為字串的比較複雜。如：INT 型別儲存時間型別，BIGINT 型別轉 ip 函示。
3. 使用合理的欄位屬性長度，固定程度的表會更快。使用 enum、char 而不是 varchar。
4. 盡可能使用 NOT NULL 定義欄位。
5. 盡量使用 text，非用不可時，最好分表。

#### 選擇適合的索引列

1. 查詢頻繁的列，在 where, group by, order by, on 從句中出現的列。
2. where 條件中，>=, between, in 以及 like 字串加萬用字元 (%) 出現的列。
3. 長度小的列，索引欄位越小越好，因為資料庫的儲存單位是頁，一頁中能存下的資料越多越好。
4. 離散度越大(不同的值多)的列，放在聯合索引前面。檢視離散度，透過統計不同的列直來實現，count 越大，離散度越高。

### SQL 的編寫需要注意最佳化

1. 使用 limit 對查詢結果的紀錄進行限定。
2. 避免 select \*，將要查詢的欄位列出來。
3. 是用連線(join) 來代替子查詢。
4. 拆分大的 delete 或 insert 陳述句。
5. 可透過開啟慢查詢日誌來找出較慢的 SQL。
6. 不進行列運算：SELECT id WHERE age + 1 = 10，任何對列的操作都將導致表掃描。他包括資料庫教程函式、計算運算式等等，查詢時要盡可能將操作移至等號右邊。
7. SQL 陳述句盡可能簡單：一條 SQL 只能在一個 CPU 運算。大陳述句拆成小陳述句，減少鎖時間。一條大 SQL 可以堵死整個庫。
8. OR 改成 IN：OR 的效率是 n 級別，IN 的效率是 log(n)級別，in 個數建議是控制在 200 以內。
9. 不用函式和觸發器，在應用程式實現。
10. 避免 %xxx 式的查詢。
11. 少用 join
12. 使用同型別進行比較，比如用 '123' 和 '123' 比，123 和 123 進行比較。
13. 盡量避免在 WHERE 子句中使用 != 或 <> 運算子，引擎會放棄使用索引而進行全表掃描。
14. 對於連續數值，使用 BETWEEN 不用 in：SELECT id FROM t WHERE num BETWEEN 1 AND 5
15. 串列資了不要拿全表，要使用 LIMIT 來分頁，每頁數量也不要太大。

#### 引擎選擇

- MyISAM(MySQL 5.1 及之前版本的預設引擎)
  - 不支援行鎖，讀取時對需要讀到的所有表加鎖，寫入時則對表加排他鎖。
  - 不支援事務
  - 不支援外來鍵
  - 不支援崩潰後的安全恢復
  - 在表有讀取查詢時，支援往表裡插入新紀錄。
  - 支援 BLOB 和 TEXT 的前 500 個字元索引，支援全文索引。
  - 支援延遲更新索引，極大提升寫入效能。
  - 對於不會進行修的表，支援壓縮表，極大減少磁碟空間佔用。
- InnoDB(MySQL 5.5 後成為預設索引)
  - 支援行鎖，採用 MVCC 來支援高併發
  - 支援事務
  - 支援外來鍵
  - 支援崩潰後的安全恢復
  - 不支援全文索引

> MyISAM 適合 SELECT 密集型的表，而 InnoDB 適合 INSERT 和 UPDATE 密集型的表。
>
> MyISAM 速度很快，佔用儲存空間也小，但若程式要求事務則 InnoDB 是必須的。

#### 分割槽

分割槽的過程是將一個表或索引分解為多個更小、更可管理的部分。對於開發者而言，分割槽後資料表的使用方式和未分割的資料表是一樣的，只不過在物理儲存上，原本該表只有一個數據檔案，現在變成了多個，每個分割槽都是獨立的物件，可以獨自處理，有可以作為一個更大物件的一部分進行處理。

## DB 命名原則

- 命名只能使用英文字母、數字、下劃線，以英文字母開頭
- 避免用 MySQL 的保留字如：backup、call、group 等
- 所有資料庫物件使用小寫字母

### 資料庫命名

- 不超過 30 個字元

### 資料表命名

- 一律使用複數名詞
- 不超過 30 個字元
- 多對多關係中的中間表命名，為兩個表名稱，中間以`_`區隔，以單數命名 例如：`admins`和`members`，中間表命名為`admin_member`

### 欄位命名

- 各表之間相同意義的欄位必須同名
- 多單詞以`_`
- 外鍵約束欄位，以關聯的父層資料表名加上父層資料表欄位名來命名，中間以`_`區隔
  例:父層資料表名`admins`，父層資料表欄位名`id`，關聯欄位名`admin_id`

### 索引命名

#### 外鍵索引

- 資料表名稱\_關聯欄位名稱\_foreign

## Function

### CONVERT_TZ(dt,from_tz,to_tz) 轉換時區

- dt 日期/時間
- from_tz 原始時區
- to_tz 目標時區

```sql
SELECT CONVERT_TZ('2020-12-01 01:00:00','+00:00','+08:00') AS Result;
```

```output
+---------------------+
| Result              |
+---------------------+
| 2020-12-01 09:00:00 |
+---------------------+
```

### Event 事件

用於定期執行某些資料庫任務

- 用途：
  - 自動化維護
  - 刪除過期數據
  - 複製存檔、生成報告

#### 範例

- devices 資料表需要定時刪除已被標記 delete_at 的裝置

```sql
CREATE EVENT delete_old_devices
ON SCHEDULE
-- 每半年檢查一次，並刪除超過半年以上的資料
EVERY 6 MONTH
DO
  DELETE FROM devices WHERE deleted_at < DATE_SUB(NOW(), INTERVAL 6 MONTH);
```

#### 基本使用

- 查詢、刪除

```sql
SHOW EVENTS; -- 查詢

DROP EVENT IF EXISTS <event_name>; --刪除，IF EXISTS可以避免報錯
```

- 啟用事件排程

```sql
SET GLOBAL event_scheduler = ON;
```

- 查看目前正在執行的程序

```sql
SHOW PROCESSLIST;
```

## 使用情境

### 外鍵 onDelete 約束情況

- 沒有加入`onDelete`
  如果在關聯中的限制屬性，沒有加入`onDelete`，此時刪除外鍵約束的父層資料表中的欄位，會出現#1451 error

  ```cmd
  #1451 - Cannot delete or update a parent row: a foreign key constraint fails (`test0505`.`posts`, CONSTRAINT `posts_user_id_foreign` FOREIGN KEY (`user_id`)     REFERENCES `users` (`id`))
  ```

- onDelete('set null')
  刪除父層資料表的欄位時，同時會將關聯的子資料表中的欄位設為`null`。
- onDelete('cascade')
  刪除父層資料表的欄位時，同時會將關聯的子資料表中的欄位刪除。

### ERROR: #1215 - Cannot add foreign key constraint

- 可能原因:
  1. 添加外鍵約束時，目標欄位須和引用欄位具有相同的數據類型，int signed with int signed 或 int unsigned with int unsigned
  2. 在 not null 的欄位加上 on delete/update set null 的外鍵約束，須將該欄位設為 DEFAULT NULL

### 刪除重複的資料

#### 使用 `DISTINCT` 去除重複值

需求：查找 `02:81:85:34:ED:DC` 表中的數據，將表中 `i`, `p`, `ep`, `eq`, `pf`, `created_at` 這六個欄位均重複的資料刪除，並重新整理 id

先建立一個表，接者使用 `SELECT DISTINCT` 去除重複的值，並把去除重複值的資料，存入新資料表中

```sql
CREATE TABLE `02:81:85:34:ED:DC_copy` (
  `id` int(10) UNSIGNED NOT NULL,
  `i` json DEFAULT NULL,
  `p` json DEFAULT NULL,
  `ep` json DEFAULT NULL,
  `eq` json DEFAULT NULL,
  `pf` json DEFAULT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `02:81:85:34:ED:DC_copy` (`i`, `p`, `ep`, `eq`, `pf`, `created_at`)
SELECT DISTINCT `i`, `p`, `ep`, `eq`, `pf`, `created_at` FROM `02:81:85:34:ED:DC`;
```

最後刪掉原表，並將複製的表改名

```sql
drop tables `02:81:85:34:ED:DC`;
alter table `02:81:85:34:ED:DC_copy` rename to `02:81:85:34:ED:DC`;
```

### 匯入 txt 檔

建立資料表

```sql
create table `city_raw_data` (
    `geonameid` int(10) NOT NULL,
    `name` varchar(200) DEFAULT NULL,
    `latitude` decimal(11, 8) DEFAULT NULL,
    `longitude` decimal(11, 8) DEFAULT NULL,
    `country code` varchar(10) DEFAULT NULL,
    `timezone` varchar(40) DEFAULT NULL,
    `modification date` date DEFAULT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8;
```

本地 txt 檔匯入
在 txt 檔中，每一個欄位用 tab 鍵進行分隔

```sql
LOAD DATA INFILE "C:/Users/RD/Desktop/ES.txt" INTO TABLE `city_raw_data` (
`geonameid`,`name`,`asciiname`,`alternatenames`,`latitude`,`longitude`,`feature class`,`feature code`,`country code`,`cc2`,`admin1 code`,`admin2 code``admin3 code`,`admin4 code`,`population`,`elevation`,`dem`,`timezone`,`modification date`
)
```

或用指定的符號進行分隔，如：`|`

```sql
LOAD DATA INFILE "C:/Users/RD/Desktop/ES.txt" INTO TABLE `city_raw_data` FIELDS TERMINATED BY '|' (
    `geonameid`,
    `name`,
    `latitude`,
    `longitude`,
    `country code`,
    `timezone`,
    `modification date`
);
```

### 複合主鍵與聯合主鍵，索引與聯合(複合)索引

#### 複合主鍵與聯合主鍵

- **複合主鍵**：表的主鍵含有一個以上的欄位組成，不使用無業務含意的自增 id 作為主鍵

```sql
create table test
(
  'name' varchar(19) NOT NULL
  'id' number
  'value' varchar(10)
  primary key ('name', 'id')
)
```

`name` 和 `id` 欄位組合起來就是 test 表的複合主鍵，他的出現是因為 `name` 欄位可能會出現重複，所以要加上 `id` 欄位，如此可以保證紀錄的唯一性。

一般而言，主見的欄位資料長度和字串字數越少越好。

當表中只有一個主鍵時，他是唯一的索引；當表中有多個主鍵時，稱為複合主鍵，複合主鍵聯合保證唯一索引。

某者個主鍵欄位值出現重複是沒問題的，只要不是有多筆資料的所有主鍵值完全一樣，就不算重複。

- **聯合主鍵**：多個主鍵聯合形成一個主鍵組合。

聯合主鍵的意義：用兩個字串(或多字串)來確定一條紀錄。這兩個字串都不唯一，可以分別重複。

如：主鍵 A 和主鍵 B 組成聯合主鍵

主鍵 A 跟主鍵 B 的資料可以完全相同，聯合就在於主鍵 A 和主鍵 B 形成的聯合主鍵是唯一的。
下面的例子：主鍵 A 的數據是 1，主鍵 B 的數據也是 1，聯合主鍵其實是 11，11 是唯一值，不允許再出現 11 這個值。(即為多對多關係)

| 主鍵 A | 主鍵 B |
| :----: | :----: |
|   1    |   1    |
|   2    |   2    |
|   3    |   3    |

主鍵 A 與主鍵 B 的聯合主鍵值最多為：11, 12, 13, 21, 22, 23, 31, 32, 33

#### 索引、聯合(複合)索引

- **索引**：加快查詢速度的有效手段。

  系統讀寫資料時，會自動選擇合適的索引作為存取路徑。

  建立索引

  ```sql
  -- 建立索引
  create [unique][cluster]index<索引名>

  -- 刪除索引
  drop index <索引名>
  ```

  建立資料表時同時建立索引

  ```sql
  CREATE TABLE your_table_name (
    column1 datatype,
    column2 datatype,
    -- 其他列定義
    INDEX index_name (column_name)  -- 在這裡添加索引
  );
  ```

  當建立 `your_table_name` 時，同時定義了一個名為 `index_name` 的索引，並指定了要建立索引的列 `column_name`。
  可以依照需求在資料表定義中添加多個索引。

  - `INDEX` 關鍵字用於定義一個普通索引。如果要創建唯一鍵索引，您可以使用 UNIQUE INDEX。
  - `index_name` 是您為索引指定的名稱，用於在以後引用索引。
  - `column_name` 是您要為其建立索引的列名。

  添加索引

  ```sql
  ALTER TABLE your_table_name
  ADD INDEX index_name (column_name);
  ```

  - `your_table_name` 是您要向其添加索引的資料表名稱。
  - `index_name` 是您為新索引指定的名稱。
  - `column_name` 是您要為其建立索引的列名。

  ```sql
  ALTER TABLE users
  ADD INDEX idx_users_email (email);
  ```

  索引是各種關係資料庫中，最常見的一種邏輯單元，是關係資料庫系統很重要的組成部分，對於提高檢索資料速度有很顯著的效果。
  索引的原理是利用根據索引值得到行指針，然後快速定位到資料庫紀錄。

  索引的使用：

  1. 主鍵(預設自帶索引)和外鍵(以及一些可以跟其他表觀聯的字段)
  2. where 子句中基常出現的字段。
  3. 索引應該建立在小字段上，大數據字段(bit, image, test, blob)等，不適用

- **聯合(複合)索引**

```sql
-- 建立聯合索引
create index <索引名> on 表名(欄位1, 欄位2, ...);

-- 例如：有聯合索引 (a, b, c, d)
select * from test where a=1 and b=2; -- a 和 b 索引都起作用
```

索引生效原則：按照聯合索引的順序，由前往後依次使用生效，如果中間某個索引沒有使用，那麼斷點前面的索引部份起作用，斷點後面的索引沒有起作用。

例如

```sql
where a=1 and b=2 and d=4;
```

則只有 a 和 b 索引起作用，中間 c 斷了，則 d 索引不起作用。

mysql 會一值向右尋找直到遇到範圍查詢(>, <, between, like)時停止。

如：

```sql
where a = 1 and b = 2 and c > 3 and d = 4 ;
```

若建立 (a, b, c, d)順序的索引，則索引範圍不會到 b ，因為 c 出現 ">"。
如果建立(a, b, d, c)的順序，則

```sql
where a = 1 and b = 2 and c > 3 and d = 4
```

其中 abcd 都可以用到索引，並且 abd 的順序可以任意調整。

```sql
select * from test where b=2 and d=4 and a=1and c>3;
```

以上 sql 語句中，a, b, c, d 都用到了索引

**注意**

1. 只要列中包含有 null 值，都將不會被包含在索引中，複合索引中只要有一列含有 null 值，那此列的複合索引就是無效的，因此在資料庫設計時盡量不要讓欄位的預設值為 null
2. 使用 like 關鍵字須注意：`like "%aaa%"` 不會命中索引，`like "aaa%"` 才會命中索引。
3. NOT IN 和操作都會變成全表掃描，not in 可以用 not exist 代替。
