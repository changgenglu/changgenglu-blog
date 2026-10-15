# OpenAI Codex Plugin for Claude Code 技術分析報告

> 雙代理循環風險、架構分析與實作參考
> 撰寫日期：2026-03-31

---

## 一、功能概述

OpenAI 於 2026 年 3 月 31 日發布官方 Claude Code 插件 `codex-plugin-cc`，讓開發者在 Claude Code 工作流程中直接呼叫 Codex 進行程式碼審查與任務移交。此舉代表 OpenAI 主動切入競爭對手 Anthropic 的生態圈，以互通性作為競爭策略。

### 指令對照表

| 指令 | 功能說明 |
|------|----------|
| `/codex:review` | 標準審查，與在 Codex 內直接執行 `/review` 品質相同 |
| `/codex:adversarial-review` | 對抗性審查，以懷疑態度挑戰現有程式碼，可帶入自訂 focus 文字 |
| `/codex:rescue` | 將當前任務移交給 Codex 繼續執行 |
| `/codex:status` | 查詢背景執行任務狀態 |
| `/codex:result` | 取得已完成任務結果 |
| `/codex:cancel` | 取消背景任務 |
| `/codex:setup` | 檢查 Codex CLI 是否就緒 |

### 系統需求

- ChatGPT 訂閱（免費版即可）或 OpenAI API Key
- Node.js 18.18+
- 本地已安裝 Codex CLI（插件透過本地 CLI 中轉，無需雲端代理）

### 架構示意

```
Claude Code Session
    │
    │  /codex:review (Stop hook 觸發)
    ▼
Codex CLI（本地中轉）
    │
    │  API Request
    ▼
OpenAI API（GPT-5 / gpt-5.4-mini 等）
    │
    │  Review Result
    ▼
Review Gate 判斷 → 有問題？阻斷 Stop → Claude 修正 → 再次審查
```

---

## 二、問題核心：雙代理循環風險分析

### 2.1 原始問題

> **Q：** 「插件透過本地 Codex CLI 中轉，支援 review gate 功能，但可能導致雙代理循環消耗額度。」針對此敘述，請進行思考與說明。

### 2.2 Review Gate 機制說明

Review Gate 的核心是 Claude Code 的 **Stop Hook** 機制：

- 每當 Claude Code 準備結束一輪任務，Stop Hook 被觸發
- 插件攔截此事件，呼叫 Codex 對 Claude 的最新輸出進行針對性審查
- 若 Codex 發現問題，Stop 被阻斷，Claude 必須先修正才能繼續
- 修正完成後，再次觸發 Stop Hook，Codex 再審查一次

官方 README 明確警告：

> *"The review gate can create a long-running Claude/Codex loop and may drain usage limits quickly. Only enable it when you plan to actively monitor the session."*

### 2.3 雙向計費結構

此迴圈的關鍵風險在於**雙重帳單**：

| 費用項目 | 說明 |
|----------|------|
| Claude Code 額度 | 每次 Claude 修正輸出均消耗 Anthropic token（或 Pro 計畫使用量） |
| Codex 額度 | 每次 Codex 審查均消耗 OpenAI API 費用或 ChatGPT 使用配額 |
| 迴圈乘數效應 | 單一功能若觸發 N 次迴圈，雙方成本均乘以 N |
| 隱性風險 | 退出條件不明確時，迴圈可能無限持續至 session 逾時 |

### 2.4 迴圈流程圖解

```
Claude 產出程式碼
    │
    ▼
Stop Hook 觸發 → Codex 審查
    │                   │
    │   有問題？ ────────┘
    │       │
    │       ▼
    │   Stop 被阻斷
    │       │
    │       ▼
    │   Claude 修正
    │       │
    └───────┘  ← 重新觸發 Stop Hook
    │
    ▼（Codex 判斷無問題）
Session 結束
```

### 2.5 與 16 子代理架構的對照

在自建的多代理架構中，Review-Lead 的退出條件完全由開發者掌控，可定義 `max_iterations`、`severity_threshold` 等參數。相較之下，官方插件的 review gate 退出邏輯由 OpenAI 實作，開發者無法介入迴圈深度控制。

| 比較項目 | 說明 |
|----------|------|
| 自建 Review-Lead | 退出條件可控、成本透明、與既有架構整合、無黑盒邏輯 |
| Plugin Review Gate | 退出條件為黑盒、雙向計費、無法干預迴圈深度、職責可能重疊 |

---

## 三、社群實作分享

### 3.1 官方倉庫（openai/codex-plugin-cc）

GitHub 官方倉庫結構清晰，分為 `agents`、`commands`、`hooks`、`prompts`、`skills` 五個目錄。Star 數在發布數小時內已達 514，Fork 25。

- Stop Hook 實作位於 `hooks/` 目錄
- 支援 `config.toml` 自訂模型（如 `gpt-5.4-mini`）與推理力（`xhigh`）
- 支援 `codex resume <session-id>` 將背景任務接回 Codex 繼續

### 3.2 社群實作：thepushkarp/cc-codex-plugin

社群貢獻者更早發布的非官方版本，採用「第二意見工作流程」設計理念。

- Claude 可**自主判斷**何時呼叫 Codex（自動觸發，非手動指令）
- 任務以 inline prompt 方式傳遞給 Codex
- 設計上強調「複雜分析才值得花時間等待 Codex 回應」

### 3.3 社群實作：Z-M-Huang/claude-codex

更完整的多模型審查管線，將 Codex 定位為**最終 gate** 而非唯一 reviewer。

```
實作流程 (code-review pipeline)：
1. implementer agent 產出程式碼
2. sonnet code-reviewer（等待 impl 完成）
3. opus code-reviewer（等待 sonnet 通過）
4. codex gate（等待 opus 通過）

IF needs_changes → 建立 fix task + re-review task（同一 reviewer 驗證修正）
IF all approved  → Pipeline complete
```

- 以 `blockedBy` 機制強制順序執行，防止 gate 被跳過
- Codex 作為最後一道關卡，而非驅動迴圈的主力

### 3.4 社群實作：levnikolaevich/claude-code-skills

完整 Agile 交付管線，多模型**並行**審查（Claude Opus + Codex + Gemini），具備自動 fallback。

- Code review 技能同時委派給 Codex 與 Gemini，並行取得多個意見
- 若 Codex 或 Gemini 不可用，自動 fallback 到 Claude Opus
- Story quality gate（`ln-500`）為 4 級評分：`PASS / CONCERNS / REWORK / FAIL`
- 人類審核節點設計在 Story 驗證（`ln-310`）與品質 gate（`ln-500`）

### 3.5 社群使用模式觀察（LINUX DO 論壇）

中文開發者社群已有成熟的**手動循環**使用模式：Claude Code 實作 → Codex review → Claude Code 修正 → Codex review，形成類似 review gate 的人工迴圈。官方插件的 review gate 本質上是將此手動流程自動化，但同時帶入了無人監控的風險。

---

## 四、實作建議

### 4.1 指令使用策略

| 指令 | 風險等級 | 建議策略 |
|------|----------|----------|
| `/codex:review` | 低 | 安全，適合 PR 提交前的最終審查 |
| `/codex:adversarial-review` | 中 | 本身不產生迴圈，但修正後需手動控制輪數 |
| `/codex:rescue` | 低 | 任務委派為單向，不觸發 review gate |
| Review Gate 啟用 | 高 | 僅在主動監控 session 時開啟 |

### 4.2 針對多代理架構的整合建議

- 將 Codex 定位為「一次性第二意見」，插入 Review-Lead 之後、Commit 之前
- 不啟用 review gate，改由 Review-Lead 決定是否需要 Codex 意見
- 若要自動化，使用 `blockedBy` 模式：Codex 為最終 gate，而非迴圈驅動器
- 監控雙邊使用量：Anthropic token + OpenAI API cost，設定 session 層級的 budget alert

### 4.3 config.toml 自訂範例

```toml
# .codex/config.toml（專案層級配置）
model = "gpt-5.4-mini"         # 使用成本較低的模型降低雙重計費影響
model_reasoning_effort = "low"  # review 任務不需要最高推理力
```

---

## 五、結論

此插件的戰略意義大於實用性。OpenAI 透過切入 Claude Code 生態圈的方式，取得開發者工作流程的入口，而非依賴開發者切換工具。

1. `/codex:review` 與 `/codex:adversarial-review` 作為單次審查工具，風險可控且有實際價值。
2. Review Gate 自動化迴圈是真實風險，雙向計費 + 黑盒退出條件是主要問題。
3. 最佳實踐是將 Codex 定位為「最終 gate」而非「迴圈驅動器」。
4. 對於已有 Review-Lead 的多代理架構，此插件可作為補充，但不應替換既有審查層。

---

## 參考資料

- https://github.com/openai/codex-plugin-cc
- https://github.com/thepushkarp/cc-codex-plugin
- https://github.com/Z-M-Huang/claude-codex
- https://github.com/levnikolaevich/claude-code-skills
- https://community.openai.com/t/introducing-codex-plugin-for-claude-code/1378186
