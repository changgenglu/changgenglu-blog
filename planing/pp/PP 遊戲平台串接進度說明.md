## PP 遊戲平台串接進度說明

### 一、整體架構

Puppy 作為**中轉代理**，介於：
- **星城系統**：總部錢包（TCP `api_login`、`api_spin`、`api_show`）
- **PP 系統**：Pragmatic Play 娛樂場遊戲廠商

PP 模組已具備：Controller、Service、Hash 驗證、IP 白名單、獨立資料庫連線、Redis 快取等基礎架構。

---

### 二、已完成項目

| 類別 | 項目 |
|------|------|
| **PP 回呼端點** | `authenticate.html`、`balance.html`、`bet.html`、`result.html`、`refund.html`、`bonusWin.html`、`jackpotWin.html`、`promoWin.html`、`endRound.html`、`adjustment.html` 共 10 個 |
| **安全機制** | 上述 `.html` 端點已套用 Hash 驗證 + IP 白名單 |
| **遊戲連結** | `POST /game/url` 已實作（但與星城規範有差異） |
| **冪等性** | Redis 交易快取 + 分散式鎖（但 TTL 190 分鐘，無法涵蓋 PP 24 小時重試） |
| **Refund tid** | 已使用 `refund_${reference}` 避免與原始 Bet 衝突 |
| **錯誤碼對應** | 餘額不足、Token 無效、逾時等已對應至 PP 錯誤碼 |

---

### 三、致命問題（需優先處理）

1. **冪等性不足**  
   Redis TTL 190 分鐘，PP 重試可達 24 小時。快取過期後，同一 `reference` 可能被重複處理。  
   **建議**：增加 DB 層（`pp_bet_record_sub.reference` unique）作為第二層冪等檢查。

2. **XinKey 5 分鐘 vs PP 非同步交易**  
   星城 XinKey 離線後 5 分鐘失效，但 PP 的 `promoWin`、`jackpotWin` 可能延遲 30 分鐘以上才發送，且 PP 會重試 24 小時。  
   **風險**：玩家離線後，非同步派彩可能永遠無法成功。  
   **建議**：建立 PP 失敗交易排程，將失敗寫入 `pp_failed_transactions`，等玩家重新登入後由排程重試；並與星城確認 XinKey 延長或替代機制。

---

### 四、高優先級問題

| 項目 | 說明 |
|------|------|
| **Refund 錢包參數錯誤** | 目前 `bet=refundAmount, payoff=refundAmount` 導致餘額不變，應改為 `bet=0, payoff=refundAmount`（參考 MG rollback） |
| **Refund 失敗仍快取成功** | `executeSpin` 失敗時仍回傳 `error: 0` 並快取，導致後續重試永遠回傳成功，應改為回傳 `100` 並不寫入快取 |
| **交易狀態未更新** | `pp_bet_record_sub.status` 建立後未更新，無法區分成功/失敗 |
| **端點無認證** | `/game/url`、`/games`、`/closeSession`、`/failed/transaction/list` 無 Hash 或 IP 白名單保護 |
| **星城規範端點未實作** | `POST /api/game/demo/link`、`GET /api/report/list`、`POST /api/user/kick` 尚未實作 |
| **金額欄位驗證不足** | 缺少 `@IsNumber()`、`@Min(0)`、`@Transform()` 等驗證 |
| **betLimits 未實作** | 星城 Login 回傳的 `max`/`min` 未透傳至 PP `authenticate` 的 `betLimits` |

---

### 五、與星城規範的差異

| 星城規範 | 目前實作 | 狀態 |
|----------|----------|------|
| `POST /api/game/link` | `POST /game/url`，參數結構不同 | 尚未對齊 |
| `POST /api/game/demo/link` | 無 | 未實作 |
| `GET /api/report/list` | 無 | 未實作 |
| `POST /api/user/kick` | 無 | 未實作 |
| 0 元交易不呼叫錢包 | 仍會呼叫 `executeSpin` | 待修正 |

---

### 六、文件與規範缺口

- `Pragmatic_Play_單一錢包.md` 缺少：完整錯誤碼對照、Reconciliation 分交易類型說明、`/balance.html` 說明、`bonus`/`transactionId`/`usedPromo` 處理策略、Refund 回應格式差異、幣別不可變性說明等。
- PP 規範中 Bet 失敗後會自動觸發 Refund，此連動行為尚未在文件中說明。

---

### 七、建議處理順序

1. **立即**：修正 Refund 錢包參數與失敗處理邏輯  
2. **立即**：實作 Redis + DB 雙重冪等保護  
3. **短期**：建立 PP 失敗交易排程，並與星城討論 XinKey 機制  
4. **短期**：補充 `bet_record_sub.status` 更新與排程消化失敗交易  
5. **上線前**：與星城確認是否必須實作 demo link、report list、user kick 三個端點  

---

**總結**：PP 核心交易流程（bet、result、refund、bonusWin 等）已串接，但存在冪等性與 XinKey 時效兩大架構風險，以及 Refund 邏輯錯誤。建議先處理 Refund 與冪等性，再處理失敗交易排程與星城規範對齊。