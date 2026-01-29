---
name: "line-notifier"
description: "Activates when user explicitly requests LINE notification, task completion summary, or status update via LINE. Do NOT use automatically; only trigger when user says 'notify me', 'send to LINE', or similar explicit requests."
---

# LINE Notifier Skill

## 🧠 Expertise

LINE Bot MCP 通知專家，專精於訊息格式化、發送時機判斷與錯誤處理。

> **MCP 工具**：`push_text_message`（透過 line-bot-mcp-server）

---

## 1. 觸發條件

### 1.1 何時發送

| 條件 | 發送 | 理由 |
|-----|------|------|
| 使用者明確要求 | ✅ | 「通知我」、「發到 LINE」、「傳訊息給我」 |
| 任務完成且使用者曾要求通知 | ✅ | 遵循使用者先前指示 |
| 任務完成但使用者未要求 | ❌ | 避免打擾 |
| 任務失敗或中斷 | ⚠️ | 視嚴重程度，重要失敗可通知 |

### 1.2 判斷關鍵字

```
觸發通知:
- 「通知我」「傳給我」「發到 LINE」
- 「完成後告訴我」「做完通知」
- 「send notification」「notify me」

不觸發:
- 單純詢問或討論
- 任務中間狀態
- 使用者未明確要求
```

---

## 2. 訊息格式規範

### 2.1 標準模板

```
🏷️ 專案：{project_name}
📋 任務：{task_summary}
📊 狀態：{status}

✅ 完成項目：
• {item_1}
• {item_2}

⏰ 完成時間：{timestamp}
```

### 2.2 格式要求

| 規則 | 要求 |
|-----|------|
| **總長度** | ≤ 300 字 |
| **閱讀時間** | 1 分鐘內可掌握 |
| **Emoji 使用** | 適量使用增加可讀性 |
| **換行** | 區塊間保留空行 |
| **條列** | 使用 `•` 符號 |

### 2.3 狀態 Emoji

| 狀態 | Emoji |
|-----|-------|
| 成功完成 | ✅ |
| 部分完成 | ⚠️ |
| 失敗 | ❌ |
| 進行中 | 🔄 |
| 等待中 | ⏳ |

---

## 3. MCP 呼叫

### 3.1 工具參數

```json
{
  "tool": "push_text_message",
  "arguments": {
    "user_id": "使用者 LINE ID",
    "messages": [
      {
        "type": "text",
        "text": "訊息內容"
      }
    ]
  }
}
```

### 3.2 多訊息發送

```json
{
  "messages": [
    { "type": "text", "text": "第一則訊息" },
    { "type": "text", "text": "第二則訊息" }
  ]
}
```

> **限制**：單次最多 5 則訊息

---

## 4. 場景模板

### 4.1 Code Review 完成

```
🏷️ 專案：Stars
📋 Code Review 完成
📊 狀態：✅ 審查完畢

✅ 審查結果：
• 嚴重問題：0
• 高優先級：2
• 中優先級：5

📝 報告位置：
docs/reviews/GameController_review.md

⏰ 2026-01-27 13:45
```

### 4.2 實作計畫完成

```
🏷️ 專案：Stars
📋 實作計畫已建立
📊 狀態：✅ 待審核

📝 計畫摘要：
新增遊戲供應商 API 整合功能

📁 檔案位置：
docs/plans/game_provider_integration.md

⏰ 2026-01-27 13:45
```

### 4.3 任務執行完成

```
🏷️ 專案：Stars
📋 UserController 重構
📊 狀態：✅ 已完成

✅ 變更內容：
• 新增 UserService.php
• 重構 UserController.php
• 新增 IUserRepository.php

🧪 測試：全部通過
⏰ 2026-01-27 13:45
```

### 4.4 任務失敗

```
🏷️ 專案：Stars
📋 資料庫遷移
📊 狀態：❌ 失敗

❌ 錯誤訊息：
Foreign key constraint violation

📍 失敗位置：
2026_01_27_create_orders_table.php

🔧 建議：先執行 users table 遷移
⏰ 2026-01-27 13:45
```

---

## 5. 錯誤處理

### 5.1 處理策略

| 錯誤類型 | 處理方式 |
|---------|---------|
| MCP 不可用 | 跳過通知，繼續完成任務 |
| API 錯誤 | 記錄錯誤，不重試 |
| 格式錯誤 | 使用純文字備援 |

### 5.2 錯誤回報

若通知失敗，在任務結束時回報：

```
⚠️ LINE 通知發送失敗：{error_message}
任務本身已正常完成。
```

---

## 6. 檢查清單

### 發送前確認
- [ ] 使用者是否明確要求通知？
- [ ] 訊息長度是否 ≤ 300 字？
- [ ] 格式是否符合模板？
- [ ] 狀態 Emoji 是否正確？

### 發送後確認
- [ ] 是否收到成功回應？
- [ ] 若失敗是否已跳過並繼續任務？
