# 營運分析報表回傳所有儲值管道金額

專案: https://www.notion.so/e0fb1267f7ad4962af552d9525bce5a2
優先度: 一般
執行狀態: 待辦事項
標籤: 流程規劃
Group: 開發項目
完成進度: 1
專案分數: 0.03
參與人員: https://www.notion.so/1e706ce0833d8057a5fbea2f82310c72
歸檔: No
工作項目: 確認需求&規劃 (https://www.notion.so/2fc06ce0833d809b81f4d01033cfed5d?pvs=21)

## 需求分析

目前 `getServiceDailyReport()` API 只回傳 `normal_pack` 和 `vip_pack` 兩種儲值管道金額，需要擴充為回傳所有儲值管道的金額。

---

## 儲值管道定義 (IDepositType)

| 常數 | 值 | 說明 |
| --- | --- | --- |
| YOE | 1 | 遊E卡 |
| YOE_DIGITAL | 2 | 遊E數位卡 |
| GASH | 3 | GASH 儲值 |
| ONLINE_TW | 4 | 線上支付（台灣） |
| ONLINE_OVERSEA | 5 | 線上支付（海外） |
| VIP | 6 | VIP 儲值 |
| NORMAL_PACK | 7 | 商城禮包 |
| VIP_PACK | 8 | 商城 VIP 禮包 |

---

## 資料來源

**API 入口**: `RecordController::deposited()`

- 路徑: `api/client/record/deposited`
- 參數: `type` (儲值類型), `point` (儲值點數)
- 儲存: 透過 `UserDepositedRecord` Service 存入 Redis

**資料模型**: `UserDepositedRecord`

- 連線: `record` database
- 表格: `user_deposited_record`
- 欄位: `provider_id`, `username`, `type`, `point`, `created_at`

---

## 日報產生機制

### Command 位置

`app/Console/Commands/MakeServiceDailyReport.php`

### 排程執行

在 `app/Console/Kernel.php` (第56-62行)：

- 星城 (`ab08031e`) - 每日 00:30 執行
- 華義 (`8a62f87b`) - 每日 00:30 執行

### 目前程式邏輯 (第136-156行)

```php
$userDepositedRecord = app('Service')->init('UserDepositedRecord');
$depositedRecords = $userDepositedRecord->lists([
    'provider_id' => $provider['id'],
    'begin_at' => $yesterday,
    'end_at' => $today,
]);

// 統計各類型儲值金額 (已遍歷所有 type)
$depositData = [];
foreach ($depositedRecords['list'] as $record) {
    if (! isset($depositData[$record['type']])) {
        $depositData[$record['type']] = 0;
    }
    $depositData[$record['type']] += $record['point'];
}

// 目前只寫入 type=7 和 type=8
'normal_pack' => $depositData[IDepositType::NORMAL_PACK] ?? 0,
'vip_pack' => $depositData[IDepositType::VIP_PACK] ?? 0,
```

**重點**: 程式已經在遍歷所有儲值記錄並按 type 分類統計到 `$depositData`，只是最後寫入時只取了 type 7 和 8。

---

## 實作規劃

### 1. 資料庫變更 (Migration)

新增 `service_daily_report` 表欄位:

```php
$table->double('yoe')->default(0);           // 遊E卡金額
$table->double('yoe_digital')->default(0);   // 遊E數位卡金額
$table->double('gash')->default(0);          // GASH 儲值金額
$table->double('online_tw')->default(0);     // 線上支付（台灣）金額
$table->double('online_oversea')->default(0);// 線上支付（海外）金額
$table->double('vip_deposit')->default(0);   // VIP 儲值金額
```

### 2. Model 更新

更新 `app/Models/ServiceDailyReport.php` 的 `$fillable`:

```php
protected $fillable = [
    // ... 現有欄位
    'yoe',
    'yoe_digital',
    'gash',
    'online_tw',
    'online_oversea',
    'vip_deposit',
];
```

### 3. Command 更新

修改 `app/Console/Commands/MakeServiceDailyReport.php`，寫入時新增:

```php
'yoe' => $depositData[IDepositType::YOE] ?? 0,
'yoe_digital' => $depositData[IDepositType::YOE_DIGITAL] ?? 0,
'gash' => $depositData[IDepositType::GASH] ?? 0,
'online_tw' => $depositData[IDepositType::ONLINE_TW] ?? 0,
'online_oversea' => $depositData[IDepositType::ONLINE_OVERSEA] ?? 0,
'vip_deposit' => $depositData[IDepositType::VIP] ?? 0,
```

### 4. API 回傳更新

修改 `app/Http/Controllers/ReportController.php` 的 `getServiceDailyReport()`:

```php
'yoe' => $serviceReport['list'][$date]['yoe'] ?? 0,
'yoe_digital' => $serviceReport['list'][$date]['yoe_digital'] ?? 0,
'gash' => $serviceReport['list'][$date]['gash'] ?? 0,
'online_tw' => $serviceReport['list'][$date]['online_tw'] ?? 0,
'online_oversea' => $serviceReport['list'][$date]['online_oversea'] ?? 0,
'vip_deposit' => $serviceReport['list'][$date]['vip_deposit'] ?? 0,
```

### 5. API 文件更新

更新 Apidoc 註解，新增各儲值管道欄位說明。

---

## 需修改檔案清單

| 檔案 | 修改內容 |
| --- | --- |
| `database/migrations/report/` | 新增 migration 加 6 個欄位 |
| `app/Models/ServiceDailyReport.php` | 更新 $fillable 陣列 |
| `app/Console/Commands/MakeServiceDailyReport.php` | 寫入時新增 6 個儲值欄位 |
| `app/Http/Controllers/ReportController.php` | API 回傳新增 6 個欄位 + Apidoc 註解 |
| `app/Interfaces/IDepositType.php` | 無需修改 (已有定義) |

---

## 資料流程圖

```
客戶端呼叫 deposited API
       ↓
RecordController::deposited()
       ↓
UserDepositedRecord Service → Redis → user_deposited_record 表
       ↓
MakeServiceDailyReport Command (每日 00:30)
       ↓
從 user_deposited_record 查詢昨日資料
       ↓
按 type 分類統計金額 ($depositData)
       ↓
寫入 service_daily_report 表
       ↓
getServiceDailyReport() API 回傳
```