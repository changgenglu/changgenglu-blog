# Stars - 調整營運分析日報表整合測試 - 實作規劃

## 版本記錄

| 版本 | 更新時間         | 變更摘要 |
| ---- | ---------------- | -------- |
| v1.0 | 2026-02-05 14:40 | 初次規劃 |

---

## 0. 專案現況分析摘要

> 本區塊記錄規劃前的專案分析結果，確保實作與專案架構一致。

### 0.1 參考的既有實作

| 檔案                                     | 參考原因              | 關鍵發現     |
| ---------------------------------------- | --------------------- | ------------ |
| `app/Http/Controllers/ReportController.php` | 確認 API 回傳邏輯  | `getServiceDailyReport` 已新增 `yoe`, `yoe_digital`, `gash`, `online_tw`, `online_oversea`, `vip_deposit` 欄位並有 `?? 0` 處理。 |
| `tests/Integration/ReportController/GetServiceDailyReportIntegrationTest.php` | 調整目標檔案 | 需在 `test_success` 中新增結構與型別斷言。 |
| `database/factories/ServiceDailyReportFactory.php` | 測試資料生成來源 | 需新增對應欄位的 Faker 生成規則，以確保測試資料的真實性。 |

### 0.2 識別的架構模式

| 項目         | 專案採用方式                                  |
| ------------ | --------------------------------------------- |
| 分層架構     | Controller → Service (Factory) → Model |
| 命名慣例     | 測試方法使用 snake_case 並標註 `: void`。 |
| 錯誤處理     | 驗證失敗回傳 HTTP 200，包含 `error_code`。 |
| 驗證方式     | 使用 `assertJsonStructure` 與 `assertIsInt` 進行校驗。 |
| API 回應格式 | JSON 包含 `count` 與 `list` 陣列。 |

### 0.3 必須遵循的慣例

- 測試檔案命名應專注於單一方法。
- 對於金額欄位，必須執行 `assertIsInt` 型別校驗。
- Factory 狀態方法應優先使用。

---

## 1. 需求概述

### 1.1 背景與目標

- 需求背景：營運分析日報表新增 6 個財務相關金額欄位。
- 功能目標：同步更新整合測試與 Factory 定義，確保新欄位受測試保護。
- 影響範圍：`ServiceDailyReport` 相關報表功能。

### 1.2 範圍界定

- **包含**：
  - 更新 `ServiceDailyReportFactory` 定義。
  - 更新 `GetServiceDailyReportIntegrationTest` 成功案例之結構與型別斷言。
- **不包含**：修改業務邏輯或月報表 API。
- **假設條件**：資料庫 Migration 已完成或在測試環境中已同步。

---

## 2. 系統架構變更

### 2.1 資料庫變更

#### 新增/修改資料表

| 資料表名稱 | 變更類型 | 說明 |
| ---------- | -------------- | ------------ |
| `service_daily_reports` | 修改 | 新增 yoe, yoe_digital, gash, online_tw, online_oversea, vip_deposit 欄位。 |

### 2.2 設定變更

N/A

### 2.3 程式碼結構

#### 修改檔案

| 檔案路徑 | 修改內容摘要 |
| ---------------------------------------- | ------------------------------------------- |
| `database/factories/ServiceDailyReportFactory.php` | 新增 6 個金額欄位的 Faker 生成。 |
| `tests/Integration/ReportController/GetServiceDailyReportIntegrationTest.php` | 更新 `test_success` 斷言。 |

---

## 3. API 規格設計

### 3.1 端點總覽

| Method | Path | 說明 | 權限 |
| ------ | ---------- | ------------ | -------- |
| GET | `/api/backend/report/provider/daily` | 營運數據日報表 | 需帶 x-pid |

### 3.2 詳細規格

#### [GET] /api/backend/report/provider/daily

**Request**
- `begin_at` (required)
- `end_at` (required)
- `provider_id` (required)

**Response - `list` 項目新增欄位**

| 欄位 | 型別 | 說明 |
| ---------- | ------ | ------------ |
| `yoe` | int | 遊E卡金額 |
| `yoe_digital` | int | 遊E數位卡金額 |
| `gash` | int | GASH 儲值金額 |
| `online_tw` | int | 線上支付（台灣）金額 |
| `online_oversea` | int | 線上支付（海外）金額 |
| `vip_deposit` | int | VIP 儲值金額 |

---

## 4. 實作任務清單

### 4.1 實作任務清單

| #   | 任務                                      | 依賴 |
| --- | ----------------------------------------- | ---- |
| 1   | 修改 `ServiceDailyReportFactory` 加入新欄位 | -    |
| 2   | 更新 `GetServiceDailyReportIntegrationTest@test_success` 結構斷言 | 1 |
| 3   | 更新 `GetServiceDailyReportIntegrationTest@test_success` 型別斷言 | 2 |
| 4   | 執行測試驗證：`php artisan test`          | 3    |

### 4.2 關鍵邏輯

#### Factory 核心邏輯
```php
'yoe' => $this->faker->numberBetween(0, 10000),
'yoe_digital' => $this->faker->numberBetween(0, 10000),
// ... 依此類推
```

#### 測試斷言邏輯
```php
$response->assertJsonStructure([
    'list' => [
        '*' => [
            'yoe', 'yoe_digital', 'gash', 'online_tw', 'online_oversea', 'vip_deposit'
        ]
    ]
]);
```

---

## 5. 部署與驗證

### 5.1 部署注意事項

N/A (測試碼變更)

### 5.2 驗證項目

#### 整合測試

| 測試類別 | 測試情境 | 預期結果 |
| ----------- | -------- | ------------------ |
| GetServiceDailyReportIntegrationTest | 成功案例 | 回傳 JSON 包含所有新欄位且皆為 Int |

### 5.3 自連檢查點

- [x] 符合專案規範（參考 `GEMINI.md`）
- [x] 型別檢查使用 `assertIsInt`
