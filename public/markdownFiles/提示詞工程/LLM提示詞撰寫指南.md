# Claude 提示詞撰寫指南（2026 年版）

> 基於 Anthropic 官方文件（Claude 4.x 系列最佳實踐）及 Reddit / Medium / Substack 等社群心得整理。

---

## 一、核心原則

### 1. 清晰直接，不靠推測

Claude 會「字面」解讀你的指令，而非推測你的意圖。

| ❌ 模糊 | ✅ 明確 |
|---------|---------|
| 幫我寫個好一點的版本 | 改寫為正式商業語氣，限 3 段以內，每段不超過 80 字 |
| 分析這段程式碼 | 找出此函式中的 N+1 查詢問題，並提供使用 `with()` 預載入的修復方案 |

> [!TIP]
> **黃金法則**：把你的提示詞拿給一個對任務完全不知情的同事看，如果他會覺得困惑，Claude 也會。 — *Anthropic 官方文件*

### 2. 說「要做什麼」而非「不要做什麼」

正向指令比負面禁止更有效。

```
❌ 不要使用 Markdown
✅ 以純文字段落回覆，不使用任何格式標記
```

### 3. 提供動機，不只下命令

解釋「為什麼」能幫助 Claude 更精準理解目標。

```
❌ 輸出 JSON 格式
✅ 以 JSON 格式輸出，因為下游系統需要直接解析這份資料
```

---

## 二、結構化提示詞

### 模組化架構

一份高效能提示詞的六大區塊：

```
┌────────────────────────────────────┐
│ 1. 角色 (Role)                     │
│ 2. 目標 (Goal)                     │
│ 3. 上下文 (Context)               │
│ 4. 指令 (Instructions)            │
│ 5. 範例 (Examples)                │
│ 6. 輸出格式 (Output Format)       │
└────────────────────────────────────┘
```

### XML 標籤分隔內容

Claude 經過大量 XML / HTML 訓練，對標籤結構特別敏感。使用 XML 標籤可以明確區分不同類型的內容，減少誤解。

```xml
<instructions>
你的任務是根據提供的客戶回覆，分析其情緒並分類。
</instructions>

<context>
這些回覆來自 2025 Q4 的客戶滿意度調查。
</context>

<input>
{{customer_feedback}}
</input>

<output_format>
以 JSON 輸出：{ "sentiment": "positive|neutral|negative", "category": "..." }
</output_format>
```

> [!IMPORTANT]
> **標籤命名一致性**：在同一個專案或工作流中，保持標籤名稱統一（例如始終用 `<instructions>` 而非混用 `<task>` / `<prompt>` / `<instructions>`）。

### Markdown 也可以

XML 標籤並非唯一選擇。對於 **CLI 工具**（如 gemini-cli、Claude Code）的自定義指令：
- **TOML prompt**：用 Markdown 標題（`##`、`###`）分層即可
- **CLAUDE.md / GEMINI.md**：用 Markdown 結構化就很有效

關鍵不是用什麼格式，而是**結構清晰、分層明確**。

---

## 三、有效使用範例（Few-Shot）

範例是最可靠的引導方式，能讓 Claude 精確模仿你要的格式、語氣和結構。

### 範例三原則

| 原則 | 說明 |
|------|------|
| 相關 | 範例必須貼近真實使用場景 |
| 多樣 | 覆蓋邊界情況，避免 Claude 學到無意的模式 |
| 結構化 | 用 `<example>` 標籤包裹，與指令明確區分 |

### 範例模板

```xml
<examples>
  <example>
    <input>用戶說：「這個產品太爛了，浪費錢」</input>
    <output>{ "sentiment": "negative", "category": "product_quality" }</output>
  </example>
  <example>
    <input>用戶說：「還可以吧，沒什麼特別感覺」</input>
    <output>{ "sentiment": "neutral", "category": "general" }</output>
  </example>
</examples>
```

> [!TIP]
> 1–3 個範例通常就足夠。範例太多反而可能造成 token 浪費且降低彈性。

---

## 四、角色定義

指定角色能讓 Claude 聚焦於相應的知識領域和溝通風格。

```
你是一位有 10 年經驗的資深後端工程師，專精 Laravel 與 NestJS。
你偏好乾淨的架構、SOLID 原則和明確的職責分離。
```

### 進階：角色堆疊（Role Stacking）

同時指派多重專家視角，促進內部「辯論」，提高分析的全面性。

```
從以下三個角色的視角分析此架構決策：
1. 資深後端工程師（關注可維護性）
2. 資安專家（關注安全風險）
3. DevOps 工程師（關注部署與擴展性）
```

> *— 來源：Medium 社群 2026 年初系列文章*

---

## 五、思考與推理

### 鼓勵逐步思考（Chain of Thought）

對於複雜問題，要求 Claude 先思考再回答，能顯著提升品質。

```
在回答之前，請先在 <thinking> 標籤中逐步分析問題，然後再給出最終回答。
```

### 控制思考深度

Claude 4.x 系列（尤其 Opus 4.6）預設會做大量探索。可依需求控制：

| 關鍵詞 | 效果 |
|--------|------|
| `think` | 標準深度思考 |
| `think hard` | 更深入推理 |
| `ultrathink` | 最大思考預算（可能非常慢） |

### 避免過度思考

如果 Claude 反覆猶豫或探索太多方向：

```
選定一個方案後就執行，除非遇到直接矛盾的新資訊才回頭修正。
不要在兩個方案之間反覆比較。
```

> *— Anthropic 官方 Claude Opus 4.6 調校建議*

---

## 六、輸出格式控制

### 明確指定格式

```
以 Markdown 表格輸出，包含以下欄位：功能名稱、優先級（P0–P3）、預估工時、負責人。
```

### 控制長度

```
❌ 簡短回答
✅ 限 200 字以內，分 2–3 段，每段開頭用粗體標示重點
```

### 提示詞格式 ≈ 輸出格式

Claude 會自動模仿你提示詞的格式風格。如果你的提示詞大量使用 Markdown，輸出也會傾向 Markdown。想要純文字回覆，就在提示詞裡減少 Markdown 使用。

---

## 七、進階技巧（2026 社群精選）

### 1. 記憶注入（Memory Injection）

在對話開頭預載你的偏好，確保整個工作階段保持一致。

```
<preferences>
- 程式碼風格：PSR-12
- 命名：camelCase（變數）、PascalCase（類別）
- 回覆語言：繁體中文
- 錯誤處理：使用自定義 Exception 類別
</preferences>
```

### 2. 反向提示（Reverse Prompting）

讓 Claude 先提問，再開始工作，減少幻覺與誤解。

```
在開始實作之前，請先列出你需要確認的問題（最多 5 個），
等我回答後再開始。
```

### 3. 約束級聯（Constraint Cascade）

對於複雜任務，分層下達指令，避免一次灌太多。

```
第一步：分析需求，列出你理解的要點
（等 Claude 回覆後）
第二步：基於以上理解，設計資料庫 Schema
（等 Claude 回覆後）
第三步：根據 Schema 設計 API 端點
```

### 4. 驗證迴圈（Verification Loop）

要求 Claude 自我審查輸出。

```
完成回答後，請自我檢查：
1. 是否有邏輯矛盾？
2. 是否遺漏了邊界情況？
3. 提供的方案是否真正解決了問題？
如有發現問題，直接修正後再輸出最終版本。
```

### 5. 不確定性處理

明確允許 Claude 說「不知道」，大幅減少幻覺。

```
如果你不確定某個事實或無法從提供的資料中找到答案，
請直接說「我不確定」，不要猜測或編造。
```

---

## 八、Agentic 系統提示詞設計

適用於 Claude Code、gemini-cli 等自動化編碼助手的 system prompt / CLAUDE.md / GEMINI.md。

### 契約式系統提示詞（Contract Style）

```
## 角色
你是 [具體角色]

## 目標
[一句話說明這個提示詞要達成什麼]

## 行為約束
| 允許 | 禁止 |
|------|------|
| ✅ 讀取檔案 | ❌ 刪除檔案 |
| ✅ 執行測試 | ❌ 跳過測試 |

## 工作流程
1. [步驟一]
2. [步驟二]

## 輸出格式
[具體格式要求]
```

### 防止過度工程化

Claude Opus 系列容易「多做」— 建立不需要的檔案、新增不必要的抽象。

```
只做被明確要求的變更。不要：
- 重構未被修改的周邊程式碼
- 為只用一次的操作建立工具函式
- 為假設性的未來需求預先設計
```

> *— Anthropic 官方 Overeagerness 調校建議*

### 長程任務的上下文管理

```
你的 context window 會在接近上限時自動壓縮，因此不要因為 token 預算
而提早結束任務。接近上限時，請將進度和狀態保存到記憶中。
始終堅持自主完成任務，不要人為提前中斷。
```

---

## 九、常見錯誤與反模式

| 反模式 | 問題 | 解法 |
|--------|------|------|
| 🔴 模糊指令 | Claude 猜測你的意圖，輸出不穩定 | 明確具體，包含約束和格式 |
| 🔴 一個 prompt 塞太多任務 | 步驟遺漏、結果不完整 | 拆分為多個 prompt（Prompt Chaining） |
| 🔴 不提供範例 | 格式和語氣不一致 | 加入 1–3 個範例 |
| 🟡 只說「不要」 | 負面指令效果差 | 改為正向指令：「要做什麼」 |
| 🟡 忽略輸出格式 | 每次輸出格式不同 | 明確定義格式、範例或前綴填充 |
| 🟡 不給角色 | 回覆偏通用、缺乏專業感 | 指定具體角色和專長 |
| 🟡 不迭代 | 首版 prompt 不完美就放棄 | 迭代改進，逐步增加複雜度 |
| 🟢 過度工程化 prompt | prompt 太長反而降低效果 | 從簡單開始，每次只加一項，測試效果 |
| 🟢 重複相同指令 | 浪費 token，模型可能困惑 | 每條指令只出現一次 |

---

## 十、實戰 Checklist

撰寫或優化提示詞時，對照以下清單：

- [ ] **角色**：是否定義了具體角色和專長？
- [ ] **目標**：一句話能說清楚這個 prompt 要達成什麼嗎？
- [ ] **約束**：有沒有明確的禁止事項和允許範圍？
- [ ] **輸入**：是否有 `{{ args }}` 或其他變數接口？
- [ ] **範例**：是否提供 1–3 個結構化範例？
- [ ] **輸出格式**：是否明確定義了回覆的結構和長度？
- [ ] **思考引導**：複雜任務是否要求逐步推理？
- [ ] **不確定性**：是否允許 Claude 表達不確定？
- [ ] **簡潔性**：每條指令只出現一次？沒有冗餘的 meta 說明？
- [ ] **可測試**：能否對不同輸入穩定產出符合預期的結果？

---

## 參考來源

| 類別 | 來源 |
|------|------|
| 官方文件 | [Anthropic Prompting Best Practices](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/be-clear-and-direct)（Claude 4.x 系列） |
| 官方文件 | [Prompt Engineering Overview](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview) |
| 社群 | Reddit r/ClaudeAI — XML 標籤結構化討論、prompt 反模式分享 |
| 社群 | Medium — Memory Injection、Reverse Prompting、Constraint Cascade 等進階技巧系列 |
| 社群 | Substack — Context Engineering 與 Protocol Engineering 論述 |
| 社群 | promptbuilder.cc — 契約式系統提示詞模式 |
| 工具 | [Claude Code Best Practices](https://docs.anthropic.com/en/docs/claude-code) — CLAUDE.md 設計模式 |
