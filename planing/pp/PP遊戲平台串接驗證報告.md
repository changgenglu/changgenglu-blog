# PP (Pragmatic Play) 遊戲平台串接驗證報告

**日期：** 2026-03-10（初版）/ 2026-03-11（補充流程文件審查）
**對象：** 開發團隊與專案相關人員
**目的：** 核對 PP 串接實作與「PP 交易流程說明書」及「星城外接 API 文件」之差異，列出待處理項目與技術討論點。同時審查我方撰寫的 PP 串接流程說明文件（`Pragmatic_Play_單一錢包.md`）與官方規範的一致性。

---

## 1. 取得遊戲連結實作核對

### 規範對比

- **星城規範 (PDF 3.1)**：要求端點為 `POST /api/game/link`，參數包含 `xinkey`, `game_code`, `lang`, `mobile`, `thumb_url`, `user_level`, `vip_level`, `ip`。
- **目前實作 (`PpController.ts`)**：
  - 端點定義為 `POST /game/url`（完整路徑含前綴為 `api/platforms/pp/:countryCode/game/url`）。
  - 接收參數 (`GameUrlRequest`) 為 `xinkey`, `gameId`, `language`, `platform`, `lobbyUrl`, `cashierUrl`。

### 驗證結果：⚠️ 尚未完全對齊

1. **端點命名與參數名**：目前的實作偏向於「Puppy 內部前端呼叫 Puppy」的設計，而非「星城系統呼叫 Puppy」的標準規範。
2. **缺少欄位**：目前的 `GameUrlRequest` 缺少星城規範中的 `user_level`, `vip_level`, `thumb_url` 等欄位。
3. **認證保護缺失** ⚠️：以下端點缺乏認證保護機制：
   - `POST /game/url` — 無 Hash 驗證或 IP 白名單保護（`pp.module.ts:46-59` 僅對 10 個 `.html` 端點掛載 Hash + IP 白名單中間件，`/game/url` 僅有請求日誌中間件）
   - `GET /games` — 無認證保護，任何人可呼叫
   - `POST /closeSession` — 無認證保護
   - `GET /failed/transaction/list` — 無認證保護，可洩漏交易資料

   **建議**：確認這些端點的使用場景（是否為前端調用或星城系統調用），並補充相應的認證保護（Hash 驗證或 IP 白名單）。
4. **建議**：若此端點是預留給星城直接觸發，需修改端點路由與 DTO 結構以符合 PDF 3.1 規範。

### 星城規範要求但尚未實作的端點 ⚠️

以下三個端點為星城 API 文件明確要求供應商（Puppy）需實作的介面，但在 PP 平台的 `PpController.ts` 中**完全沒有對應實作**：

| 星城規範 | 端點路由 | 說明 | 實作狀態 |
|---------|---------|------|---------|
| PDF 3.2 | `POST /api/game/demo/link` | 取得遊戲試玩連結，星城系統呼叫 Puppy，參數含 `game_code`, `lang`, `mobile` | ❌ 未實作 |
| PDF 3.5 | `GET /api/report/list` | 取得供應商報表，星城系統以 JWT 認證呼叫，參數含 `begin_at`, `end_at`, `game_code`，需回傳各遊戲的 `bet_amount`, `payoff`, `profit` 統計 | ❌ 未實作 |
| PDF 3.8 | `POST /api/user/kick` | 強制指定用戶離線，星城系統以 JWT 認證呼叫，參數含 `name`（玩家唯一別名） | ❌ 未實作 |

**備註**：星城規範 PDF 3.6「取得遊戲時間區間 RTP」標註為「非必做」，目前同樣未實作，可依需求決定是否納入開發計畫。

**建議**：與星城確認上線前是否需要完成這三個端點的實作，並確認 JWT 認證驗證中間件的設計（星城系統呼叫 Puppy 的端點使用 JWT 認證，與 PP 反向呼叫使用的 Hash 驗證不同）。

---

## 2. 核心交易流程：冪等性實作說明

### 具體實作機制

目前的 PP 串接已實作雙重防護機制：

1. **交易結果快取 (Redis)**：
   - **鍵值結構**：`puppy:pp:transaction:{actionType}:{reference}`（注：實際完整 key 為 `puppy:pp:transaction:...`，因 ioredis 的 keyPrefix 為 `puppy:`）
   - **行為**：在執行任何錢包操作前，會先檢查此 Key。若已存在，直接回傳上次記錄的餘額，不再呼叫錢包。
   - **存活時間 (TTL)**：設定為 190 分鐘（約 3 小時），確保 PP 在 24 小時重試期內的初期重複請求能被攔截。
   - **⚠️ 技術風險**：190 分鐘遠短於 PP 24 小時重試窗口，快取過期後同一 reference 的重試請求會被當作新交易處理，導致重複扣款或加款。
2. **分散式交易鎖 (Transaction Lock)**：
   - **鍵值結構**：`puppy:pp:transaction_lock:{groupId}:{userId}:{reference}`
   - **行為**：利用 Redis 的 `SET NX` 實作。當多個相同 `reference` 的請求同時到達時，僅一個能進入處理程序，其餘回傳 `INTERNAL_ERROR_RETRY` (100) 要求 PP 重試。
   - **存活時間 (TTL)**：60 秒。

### 冪等性實作改進方案

**現狀問題**：冪等性完全依賴 Redis TTL，當快取過期後無法防止重複交易。

**建議改進**：實作「Redis + DB 雙重保護」的策略
- 先查詢 Redis 快取（快速路徑，適合短期重複）
- 若 Redis miss，再查詢資料庫中 `pp_bet_record_sub` 表的 `reference` unique 約束（可覆蓋 24 小時窗口）
- 若資料庫中已存在該 reference 的記錄，直接回傳上次的交易結果，不再呼叫錢包

---

## 3. 特殊玩法結算

### 3.1 Jackpot 獎金拆分 (待討論)

- **說明書要求**：需解析選填欄位 `jackpotDetails`（JSON 格式），區分「累積 (progressive)」與「非累積 (non-progressive)」獎金。
- **目前實作**：**完全缺失**。`JackpotWinRequest` 與資料庫實體 `PpBetRecord` 均未定義對應欄位。
- **待辦項目**：需與團隊確認是否需要記錄拆分細節以利後續財務對帳。

### 3.2 0 元交易處理

- **確認結果**：**⚠️ 存在既有問題**。
- **規範要求**：星城規範第 6 頁與第 21 頁明確要求「下注與派彩同為 0 時，無須調用交易請求」。
- **目前缺陷**：在 `bonusWin.html` 或 `result.html` 中，若玩家未贏分 (`amount = 0`)，目前程式碼仍會執行 `executeSpin` (bet=0, payoff=0)，這會增加錢包伺服器無意義的負擔並可能觸發不必要的錯誤。

---

## 4. 資料庫狀態管理與交易記錄

### 4.0 交易記錄狀態追蹤 ⚠️

**問題**：`pp_bet_record_sub` 實體的 `status` 欄位在建立後一直保持 `PENDING` 狀態，無論交易成功或失敗都不會更新。

**現狀**：
- 記錄建立時設為 `PENDING`（`pp.controller.ts:234-244`）
- 交易完成後無論成功或失敗，`status` 始終未被更新

**影響**：
- 無法追蹤交易的最終狀態（成功、失敗、待重試）
- 對帳與除錯時無法快速判斷交易是否實際完成
- `pp_failed_transactions` 表中的失敗記錄無法與 `pp_bet_record_sub` 的狀態對應

**建議修正**：
- 交易成功後更新 `status` 為 `SUCCESS`
- 交易失敗後更新 `status` 為 `FAILED`，並記錄失敗原因
- 建立排程任務定期檢查 `PENDING` 狀態的舊記錄，決定是否重試或標記為遺失

---

## 5. 額度調整與退款

### 5.1 退款 (Refund) 實作說明

目前的 `refund.html` 實作邏輯如下：

1. **查詢原始交易**：透過 `reference` 查找 `pp_bet_record_sub`。
2. **PP 特殊規則處理**：若找不到原始交易，系統會記錄日誌並直接回傳成功（`error: 0`），不會對錢包進行任何操作，符合 PP 規範。
3. **錢包操作 (待修正)**：
   - **現狀**：目前退款呼叫 `executeSpin` 時，帶入的參數為 `betAmount = refundAmount, payoff = refundAmount`。
   - **技術風險**：根據星城餘額公式 `最新餘額 = 前餘額 - bet + win`，這會導致餘額「不變」。
   - **建議修正**：正確的退款（返還下注）應為 `betAmount = 0, payoff = refundAmount`，如此餘額才會正確增加回玩家帳戶。
4. **退款失敗快取問題** ⚠️：
   - **現狀**：`pp.controller.ts:549-565`，當 `executeSpin` 執行失敗時，程式碼仍回傳 `error: 0`（成功）並帶 `cash: 0`，且此「成功」結果會被寫入 Redis 快取。
   - **技術風險**：後續 PP 重試同一 `reference` 的退款請求時，會命中 Redis 快取直接回傳「成功」，導致退款永遠不會實際執行——玩家的錢永久遺失。
   - **建議修正**：`executeSpin` 失敗時不應快取結果，且應回傳 PP 錯誤碼 `100`（INTERNAL_ERROR_RETRY）讓 PP 重試。

---

## 6. 錯誤碼與餘額機制

### 6.1 錯誤碼對應機制

實作已針對錢包回傳的錯誤碼進行了初步轉換：

- **餘額不足**：星城 `5` (InsufficientBalance) → PP `1` (INSUFFICIENT_BALANCE)。
- **Token/玩家問題**：正確對應至 PP 的 `2` (PLAYER_NOT_FOUND) 或 `4` (INVALID_TOKEN)。
- **逾時或網路錯誤**：對應至 PP 的 `100` (INTERNAL_ERROR_RETRY)，要求 PP 執行重試。

### 6.2 餘額回傳問題 (技術限制告知點)

- **技術現狀**：星城錢包在「玩家離線」或「API 異常」時，回傳的餘額數值固定為 `0`。
- **與 PP 規範的衝突**：PP 期望在回傳錯誤碼（如 `100`）時，仍能帶上「玩家當前的真實餘額」。
- **結論**：由於 Puppy 角色為中轉代理 (Proxy)，並不持有玩家餘額狀態，當錢包 API 無法正常回應時，Puppy 無法憑空產生餘額。
- **行動建議**：此部分需要與 PP 技術對接人員確認，明確告知在系統異常情境下，`cash` 欄位可能會回傳 `0`，並確認 PP 的重試機制是否能容忍此現象。

---

## 7. XinKey 存活限制與非同步交易的架構矛盾 ⚠️

### 問題描述

- **星城規範**：XinKey（玩家會話 Token）在玩家離線後僅存活 **5 分鐘**，過期後所有需要 XinKey 的錢包操作（`api_login`、`api_spin`、`api_show`）均會失敗。
- **PP 非同步交易特性**：PP 的 `promoWin`（促銷獎金）可在遊戲結束後 **30 分鐘甚至更久** 才發送；`jackpotWin` 亦有類似延遲。所有交易類型在失敗時會在 **24 小時** 內持續重試。

### 現狀分析

目前 `pp.controller.ts` 中的交易處理流程：
1. 從 Redis 取得 `playerInfo`（含 XinKey）— `pp.service.ts` 的 `getPlayerInfo()`
2. 使用該 XinKey 呼叫錢包 `executeSpin()`

**致命場景**：玩家完成遊戲 → 離線 → 5 分鐘後 XinKey 過期 → PP 發送 `promoWin` 請求 → Puppy 取得的 XinKey 已失效 → 錢包拒絕交易 → PP 持續重試 24 小時均失敗 → **玩家永久損失獎金**。

### 建議方案

1. **短期**：與星城確認是否存在 XinKey 重新激活機制，或是否可用其他身份識別方式（如 `userId` + `groupId`）進行離線交易。
2. **長期**：設計 playerInfo 持久化策略，在 XinKey 過期時自動觸發重新登入流程取得新的 XinKey。

---

## 8. 請求參數驗證缺失

### 問題描述

PP 所有交易端點的 DTO（`dto.ts`）中，金額欄位（`amount`、`bet`、`jackpotContribution` 等）僅使用 `@IsNotEmpty()` 驗證，缺少型別與範圍檢查。

### 技術風險

1. **型別不匹配**：PP 使用 `application/x-www-form-urlencoded` 傳送資料，所有參數到達 Controller 時均為**字串**。若未經轉型驗證，直接傳入星城錢包的 `api_spin`（要求 `ULong` 整數），可能導致協議封包序列化異常。
2. **範圍缺失**：無 `@Min(0)` 驗證，理論上可接受負數金額，存在安全風險。
3. **浮點精度**：PP 金額可能包含小數（如 `1.50`），但星城 `api_spin` 的 `bet`/`win` 為整數（ULong），需確認是否需要乘以倍率轉換。

### 建議修正

在所有金額欄位加上 `@IsNumber()`, `@Min(0)`, `@Transform()` 裝飾器，確保型別轉換與範圍驗證在進入業務邏輯前完成。

---

## 9. 已實作但未驗證的端點

以下 3 個 PP 回呼端點已在 `PpController.ts` 中實作，但本報告先前版本未涵蓋其驗證：

### 9.1 `POST /balance.html`（`pp.controller.ts:135-168`）

- **功能**：PP 查詢玩家餘額，Puppy 透過錢包 `api_show` 取得餘額後回傳。
- **驗證狀態**：邏輯相對單純，主要風險在於 XinKey 過期時回傳 `cash: 0` 的問題（見第 7 章）。

### 9.2 `POST /endRound.html`（`pp.controller.ts:856-895`）

- **功能**：PP 通知回合結束，Puppy 更新 `pp_bet_record` 主記錄的結算資訊。
- **驗證狀態**：此端點不涉及錢包操作，主要為資料庫更新。需確認是否正確處理「endRound 先於 result 到達」的時序異常。

### 9.3 `POST /adjustment.html`（`pp.controller.ts:900-978`）

- **功能**：PP 發送額度調整（可為正或負），Puppy 透過 `executeSpin` 執行。
- **驗證狀態**：
  - 當 `amount > 0`（加款）時，使用 `bet=0, payoff=amount`，邏輯正確。
  - 當 `amount < 0`（扣款）時，使用 `bet=|amount|, payoff=0`，邏輯正確。
  - **風險**：與其他交易端點相同，存在冪等性依賴 Redis TTL 的問題。

---

## 10. 流程說明文件審查：錯誤代碼體系嚴重遺漏 ⚠️

**審查對象**：`Pragmatic_Play_單一錢包.md`
**對照規範**：PP 官方規範（Integration API Specification ZH.pdf）3.17 節

### 問題描述

流程說明文件僅提及錯誤代碼 `1`（餘額不足）和隱含的 `0`（成功），未列出 PP 官方規範定義的完整錯誤代碼體系。PP 規範定義了 11 個以上的錯誤代碼，每個代碼在不同交易類型下有不同的協調行為（是否觸發 Reconciliation）。

### 遺漏的關鍵錯誤代碼

| 代碼 | 含義 | Reconciliation 行為 |
|------|------|---------------------|
| `0` | 成功 | — |
| `1` | 餘額不足 | Bet 時不重試；Result/Refund 會重試 |
| `2` | 玩家未找到/已登出 | 觸發 Reconciliation |
| `3` | 不允許下注 | Bet 時不重試；Result/Refund 會重試 |
| `4` | 無效/過期 Token | 觸發 Reconciliation |
| `5` | Hash 驗證失敗 | 觸發 Reconciliation |
| `6` | 玩家被凍結 | 觸發 Reconciliation |
| `7` | 錯誤參數 | 觸發 Reconciliation |
| `8` | 遊戲未找到或已停用 | Bet 時觸發退款；Result 含贏分時仍須處理 |
| `100` | 內部錯誤（需重試） | 觸發 Reconciliation |
| `120` | 內部錯誤（不需重試） | 不觸發 Reconciliation |
| `130` | EndRound 專用內部錯誤 | — |

### 影響

缺少完整的錯誤代碼對照表，實作者無法正確處理各種異常情境。特別是 `100` 與 `120` 的差異（是否觸發重試）對系統行為影響重大。

### 建議

1. 在流程說明文件中新增完整的錯誤代碼對照表
2. 標註每個代碼在 Bet vs Result/Refund 時的不同 Reconciliation 行為
3. 說明 Puppy 應如何將總部錢包的星城錯誤碼映射到 PP 錯誤碼

---

## 11. 流程說明文件審查：Reconciliation 機制描述不完整 ⚠️

**審查對象**：`Pragmatic_Play_單一錢包.md` 第五部分第 2 點
**對照規範**：PP 官方規範 12.1-12.2 節

### 問題描述

流程說明文件描述為「每 5 秒重試 1 次，共重試 2 次」，但遺漏了以下關鍵細節：

1. **Bet 失敗後 PP 自動發送 Refund**：PP 規範明確要求，Bet 重試仍失敗後，PP 會自動發起 Refund 請求來取消該筆投注。此連動行為完全未提及。
2. **不同交易類型的重試策略差異**：
   - **Bet**：重試 2 次（間隔 5 秒）→ 失敗後自動觸發 Refund
   - **Result/BonusWin/JackpotWin/Adjustment**：重試 2 次 → 失敗後加入交易隊列（最長 24 小時）
   - **Refund**：失敗後直接加入交易隊列（不經初始重試）
   - **EndRound**：直接加入交易隊列
3. **24 小時後的處理**：交易隊列中的請求在 24 小時後仍未成功，將被標記為「手動調節」，需要人工介入處理。此結果處理未說明。

### 建議

依交易類型分別說明 Reconciliation 流程，特別強調 Bet 失敗時 PP 會自動觸發 Refund 的連動關係。

---

## 12. 流程說明文件審查：遺漏端點與回應欄位

### 12.1 流程文件遺漏 `POST /balance.html` 端點

**嚴重度**：Critical
**對照規範**：PP 官方規範 3.5 節（第 33-34 頁）

`/balance.html` 為 PP 必需端點，PP 會在遊戲過程中主動呼叫此端點查詢玩家餘額並顯示在遊戲畫面中。流程說明文件的「各系統間的 API 職責」以及正文中完全未提及此端點。

**建議**：新增段落說明 `/balance.html` 的用途、Puppy 如何透過 `api_show` 向總部錢包查詢餘額。

### 12.2 所有交易回應遺漏 `bonus` 與 `transactionId` 必需欄位

**嚴重度**：Major
**對照規範**：PP 官方規範各交易端點回應參數表

PP 規範中 Bet、Result、BonusWin、JackpotWin、PromoWin、Adjustment 的回應均要求：
- `bonus`（玩家獎勵餘額）— **必需**
- `transactionId`（Puppy 系統中的交易 ID）— **必需**
- `usedPromo`（Bet 回應專有，從獎勵餘額使用的金額）— **必需**

流程說明文件所有回應描述均僅提及「回傳餘額」，未說明 Puppy 對這些必需欄位的處理策略（如 `bonus` 固定回傳 `0.00`、`transactionId` 使用資料庫 sub record ID）。

### 12.3 Refund 回應格式與其他端點不同

**嚴重度**：Major
**對照規範**：PP 官方規範 3.11 節（第 47-48 頁）

Refund 回應參數僅要求 `transactionId`、`error`、`description`，**不要求** `cash`、`bonus`、`currency`。流程說明文件的時序圖標示「回傳餘額」可能誤導實作者。

### 12.4 Refund 的 `reference` 欄位語義

**嚴重度**：Major
**對照規範**：PP 官方規範 3.11 節（第 47 頁）

PP 規範中 Refund 的 `reference` 欄位說明為「賭注交易的參考」（即原始 Bet 的 reference），而非退款本身的 reference。流程說明文件未釐清此語義差異。這意味著退款的冪等性應基於「同一筆原始 Bet reference 只退款一次」。

### 12.5 Authenticate 回應欄位不完整

**嚴重度**：Major
**對照規範**：PP 官方規範 3.4 節（第 30-33 頁）

流程說明文件描述 Authenticate 回應為「cash, currency, userId」，遺漏：
- `bonus`（獎勵餘額）— **必需**
- `error` 與 `description` — **必需**
- `betLimits`（投注限額：defaultBet/minBet/maxBet/minTotalBet/maxTotalBet）— 可選但重要
- `token`（可選，用於後續錢包請求的會話控制）

### 12.6 Adjustment 遺漏 `validBetAmount` 必要參數

**嚴重度**：Major
**對照規範**：PP 官方規範 3.15 節（第 53 頁）

Adjustment 請求包含必選參數 `validBetAmount`（有效投注金額），流程說明文件僅描述 `amount` 參數。

---

## 13. 流程說明文件審查：遺漏的可選端點與 API

### 13.1 `POST /session/expired`（SessionExpired）

**對照規範**：PP 官方規範 3.14 節（第 51-52 頁）
PP 通知運營商玩家會話已過期的端點（可選）。

### 13.2 `POST /GetBalancePerGame.html`

**對照規範**：PP 官方規範 3.12 節（第 48-49 頁）
允許 PP 取得每個遊戲的獨立餘額（可選）。

### 13.3 Puppy → PP 方向的 API 清單不完整

流程說明文件主要聚焦在反向呼叫（PP → Puppy）方向，但「Puppy → PP」方向除了 `POST /game/url` 外，還有：

| API | 說明 | 對照規範 |
|-----|------|----------|
| `CancelRound` | 主動取消玩家的遊戲回合並觸發退款，可搭配星城踢人需求 | PP 規範 2.4 節 |
| `GetCasinoGames` | 取得遊戲列表 | PP 規範 2.1 節 |
| `CloseSession` | 關閉玩家會話 | PP 規範 |
| `HealthCheck` | 健康檢查 | PP 規範 |
| `ReplayAPI` | 取得回合重播連結（限 31 天內，對客服查驗有價值） | PP 規範 2.7 節 |

### 13.4 Authenticate 重複呼叫行為未說明

**對照規範**：PP 官方規範 3.4 節

玩家從 PP 內建迷你大廳打開新遊戲時，PP 可能使用相同 token 再次發送 Authenticate 請求。流程說明文件應說明 Puppy 如何處理同一 token 的重複驗證。

### 13.5 Auto-finalization 遺漏「部分遊玩未贏分」情境

**對照規範**：PP 官方規範 2.6 節（第 22 頁，情境 c）

流程說明文件描述了 Auto-finalization 觸發 refund（完全沒玩）或 bonusWin/result（玩了部分並派彩），但遺漏第三種情境：**玩家玩了免費旋轉但完全沒贏**，PP 直接結束回合不發送任何資金請求（若啟用 EndRound 則僅發送 EndRound）。

---

## 總結：需要立即討論的項目 (Action Items)

### 致命問題（必須優先解決）

1. **[致命]** 冪等性 Redis TTL 不足（190 分鐘 << 24 小時重試窗口）：實作「Redis + DB 雙重保護」機制，利用 `pp_bet_record_sub.reference` unique 約束覆蓋全時間段。
2. **[致命]** XinKey 5 分鐘存活限制 vs PP 非同步交易的架構矛盾：需與星城確認是否有重新激活機制，或重新設計 playerInfo 持久化策略。

### 高優先級

3. **[高優先級]** 修改 `refund` 邏輯：將錢包操作改為 `bet=0, payoff=amount`。
4. **[高優先級]** 修正退款失敗快取問題：`executeSpin` 失敗時不應快取結果至 Redis，應回傳錯誤碼 `100` 讓 PP 重試（`pp.controller.ts:549-565`）。
5. **[高優先級]** 補充 `bet_record_sub.status` 狀態管理：交易成功/失敗時更新狀態，建立排程任務消化失敗交易。
6. **[高優先級]** 補充端點認證保護：`/game/url`、`/games`、`/closeSession`、`/failed/transaction/list` 均未受 Hash 驗證或 IP 白名單保護（`pp.module.ts:46-59`），需加上對應認證機制。
7. **[高優先級]** 實作星城規範要求的三個端點：取得遊戲試玩連結（`POST /api/game/demo/link`）、取得供應商報表（`GET /api/report/list`）、強制指定用戶離線（`POST /api/user/kick`），需確認上線前是否必須完成。
8. **[高優先級]** 補充請求參數驗證：所有金額欄位加上 `@IsNumber()`, `@Min(0)`, `@Transform()` 裝飾器，確保字串轉數值與範圍檢查（見第 8 章）。
9. **[高優先級]** 〔文件〕補充完整錯誤代碼對照表：流程說明文件僅提及錯誤碼 `0` 和 `1`，需補充 PP 規範定義的全部錯誤代碼及其 Reconciliation 行為差異，並說明星城錯誤碼到 PP 錯誤碼的映射規則（見第 10 章）。
10. **[高優先級]** 〔文件〕補充 Reconciliation 分交易類型說明：特別是 Bet 失敗後 PP 自動觸發 Refund 的連動行為、各交易類型的重試策略差異、24 小時後標記手動調節的處理（見第 11 章）。
11. **[高優先級]** 〔文件〕補充所有交易回應的 `bonus`、`transactionId`、`usedPromo` 必需欄位處理策略，以及 Refund 回應格式與其他端點的差異（見第 12 章）。

### 中優先級

12. **[中優先級]** 實作 0 元過濾：在派彩與 FRB 請求中，若 `amount = 0` 則直接回傳成功而不呼叫錢包。
13. **[中優先級]** 確認 Jackpot 拆分需求：是否需新增資料庫欄位記錄 `jackpotDetails`。
14. **[中優先級]** 確認金額精度轉換：PP 金額（可能含小數）與星城 `api_spin` 的 ULong 整數之間的倍率轉換機制。
15. **[中優先級]** 〔文件〕補充 `/balance.html` 端點說明、Authenticate 完整回應欄位、Adjustment 的 `validBetAmount` 參數（見第 12 章）。
16. **[中優先級]** 〔文件〕補充 Puppy → PP 方向的 API 清單（CancelRound、ReplayAPI 等），評估是否需串接（見第 13 章）。
17. **[中優先級]** 〔文件〕補充 Authenticate 重複呼叫、Auto-finalization 第三種情境等邊界行為（見第 13 章）。

### 低優先級

18. **[低優先級]** 統一遊戲連結端點：確認是否需要依照星城 PDF 3.1 完整實作 `/api/game/link`。
19. **[低優先級]** 〔文件〕補充可選端點說明（SessionExpired、GetBalancePerGame），供團隊評估是否串接。
