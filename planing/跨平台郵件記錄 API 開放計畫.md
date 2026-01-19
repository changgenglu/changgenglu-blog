# 實作規劃 - 跨平台郵件記錄 API 開放計畫

## 1. 需求概述

### 1.1 背景與目標
- **需求背景**：`api/client/record/mail` 目前僅供 Provider 2（特定站台）使用，且該站台限制僅公會成員可互寄信件。
- **功能目標**：將此 API 開放給所有站台（Provider）使用。
- **業務調整**：移除「僅限公會成員」的限制（支援無公會使用者），並確保不同站台間的資料隔離（Provider Isolation）。

### 1.2 範圍界定
- **包含**：
  - 確認現有 API 邏輯是否支援無公會情境。
  - 確認現有資料庫結構是否支援多 Provider 隔離。
  - 驗證並修正潛在的交易一致性風險（Distributed Transaction Risk）。
- **不包含**：
  - 修改 `app/Services/Mail.php` 與 `app/Services/Guild.php` 的核心業務邏輯（經評估無需修改）。

---

## 2. 系統架構檢核

### 2.1 資料庫結構確認
經檢核，現有資料表結構**已完全支援**本次需求，無需執行 Migration。

#### `record.mail_transactions_record`
- **Provider 隔離**：具備 `provider_id` 欄位，且有索引，已支援資料隔離。
- **非公會支援**：`sender_guild_id` 與 `receiver_guild_id` 均為 `nullable`，支援無公會成員的操作。

#### `management.guilds`
- **Provider 隔離**：Primary Key 為 `[provider_id, guild_id]` 複合鍵，不同站台的相同 Guild ID 不會衝突。

### 2.2 潛在風險修復（建議執行）
目前 Controller 使用 `management` 連線開啟 Transaction，但 `MailTransactionsRecord` 寫入的是 `record` 連線。
**風險**：若 `mail_transactions_record` 寫入成功但 `guilds` 更新失敗（或 Transaction Rollback），會導致郵件記錄殘留但公會資訊未更新的資料不一致。

**建議方案**：若 `record` 與 `management` 位於不同資料庫實例，無法使用單一 DB Transaction。建議在 Service 層實作補償機制（Compensating Transaction）或確保業務邏輯順序（先寫入公會確認無誤後再寫入紀錄）。若在同一實例，應統一連線或使用 XA Transaction（不建議）。

---

## 3. API 規格確認

### 3.1 端點總覽
| Method | Path | 說明 | 權限 |
|--------|------|-----|-----|
| POST | `/api/client/record/mail` | 記錄玩家寄信行為 | `auth:provider:maintain` |

### 3.2 參數檢核
現有 Validation 規則已支援需求，無需調整：

**Request Body**
```json
{
  "sender": {
    "has_guild": false,  // 設定為 false 即可支援非公會成員
    "guild_id": null     // has_guild 為 false 時允許 null
  },
  "receiver": {
    "has_guild": false,
    "guild_id": null
  }
}
```

| 欄位 | 規則 | 說明 |
|-----|-----|-----|
| `sender.has_guild` | boolean | 若為 `false`，則不強求 `guild_id` |
| `sender.guild_id` | required_if:sender.has_guild,true | 僅在有公會時必填 |

---

## 4. 實作細節

### 4.1 實作任務清單

| # | 任務 | 類型 | 說明 |
|---|-----|-----|-----|
| 1 | 驗證：多站台隔離測試 | 測試 | 使用不同 Provider Token 呼叫 API，確認 `provider_id` 正確寫入 |
| 2 | 驗證：無公會流程測試 | 測試 | 發送 `has_guild: false` payload，確認 `guild_id` 存入 `NULL` |
| 3 | 優化：交易一致性 (Optional) | 重構 | 修正跨資料庫連線的 Transaction 問題（參考 2.2） |

### 4.2 核心邏輯確認 (Pseudo Check)

```php
// app/Http/Controllers/MailController.php

public function mailRecord(Request $request)
{
    // 1. 自動取得 Provider ID (確保隔離)
    $provider = app('Star')->provider(); 
    
    // 2. 驗證邏輯 (已支援無公會)
    // 若 has_guild 為 false，guild_id 允許 null
    
    // 3. 資料寫入
    // 使用 $provider['id'] 寫入 DB，確保不同站台資料分開
    $mailService->createTransactionsRecord([
        'provider_id' => $provider['id'], 
        // ...
    ]);
}
```

---

## 5. 部署與驗證

### 5.1 部署注意事項
- **無 Migration**：本次無需變更資料庫結構。
- **無 Config 變更**：沿用現有設定。

### 5.2 驗證項目

#### 整合測試 (Integration Test)
| 測試情境 | 輸入資料摘要 | 預期結果 |
|---------|------------|---------|
| **Provider A 寄信** | Token: Provider A <br> sender.has_guild: true | DB `provider_id` = A <br> `sender_guild_id` 有值 |
| **Provider B 寄信** | Token: Provider B <br> sender.has_guild: true | DB `provider_id` = B <br> 與 A 的資料互不影響 |
| **無公會成員寄信** | sender.has_guild: false <br> sender.guild_id: null | DB `sender_guild_id` 為 `NULL` <br> HTTP 200 OK |

### 5.3 自我檢查點
- [x] 資料表 `mail_transactions_record` 是否有 `provider_id`？（是）
- [x] 資料表 `guilds` 是否以 `provider_id` 為複合主鍵？（是）
- [x] API Validation 是否允許 `guild_id` 為 `null`？（是，當 `has_guild` 為 false）
- [ ] (建議) 是否已評估跨連線 Transaction 的風險？（已於 2.2 提出）
