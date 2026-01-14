## 📂 Gemini CLI 指令檔撰寫全指南

### 1. `GEMINI.md`：專案上下文與規則 (Project Context)

- **定義**：用於提供特定專案或目錄的背景資訊、開發規範與環境設定。
- **檔案路徑**：
- 專案級：`./GEMINI.md` 或 `.gemini/GEMINI.md`
- 全域級：`~/.gemini/GEMINI.md`
- **特性**：**持久性 (Persistent)**。Gemini 在每次對話開始時都會自動讀取這些檔案。它具備層級覆蓋特性（子目錄的 `GEMINI.md` 會補足或覆蓋父目錄的規則）。
- **解決問題**：避免每次提示都要重複說明技術棧、代碼風格或專案目標。
- **適用情境**：定義「我是用 React + Tailwind」、「變數命名要用 camelCase」、「提交 PR 前必須寫測試」。

### 📌 撰寫範例

```markdown
# Project Context: Gemini AI Trainer
## 🛠 Tech Stack
- Frontend: Next.js 14 (App Router)
- Language: TypeScript
- CSS: Tailwind CSS

## 📜 Coding Guidelines
- Always use Functional Components with Arrow Functions.
- Use `shadcn/ui` for UI components.
- Error handling: Use `try-catch` with descriptive logs in Chinese.
```

---

### 2. `system.md` (或 `SYSTEM.md`)：系統提示詞覆蓋 (System Prompt Override)

- **定義**：用於完全**取代** Gemini CLI 內建的預設系統指令。
- **檔案路徑**：預設為 `.gemini/system.md`（需配合環境變數 `GEMINI_SYSTEM_MD=1` 啟用）。
- **特性**：**強制性與全面性**。它不是「增加」規則，而是「重寫」AI 的底層邏輯與安全性邊界。啟用後，CLI 會顯示 |⌐■_■| 標誌。
- **解決問題**：當預設的 AI 語氣太過客套、限制過多，或者您需要 AI 扮演一個完全不同的角色（如：黑盒測試機）時使用。
- **適用情境**：企業內部安全性規則強制作戰、將 AI 鎖定在特定的工作流程中（例如禁止它閒聊）。

### 📌 撰寫範例

```markdown
# System Core Instructions
You are a high-performance automation agent.
1. DO NOT explain your thought process unless asked.
2. Respond exclusively in valid JSON format for all tool outputs.
3. Your primary goal is code modification without regression.
4. Language: Traditional Chinese.
```

---

### 3. `commands/{command}.toml`：自定義斜槓指令 (Custom Slash Commands)

- **定義**：將複雜的提示詞或工具鏈封裝成簡短的快捷指令。
- **檔案路徑**：
- `.gemini/commands/{name}.toml` (專案專屬)
- `~/.gemini/commands/{name}.toml` (全域)
- **特性**：**動作導向 (Action-Oriented)**。支援參數注入 (`{{args}}`) 與 Shell 指令執行 (`!{...}`)。
- **解決問題**：解決需要重複執行的複雜任務，簡化「讀取檔案 -> 分析 -> 執行操作」的流程。
- **適用情境**：`/refactor`、`/unit-test`、`/git:commit`。

### 📌 撰寫範例 (`refactor.toml`)

```toml
description = "將選定的代碼重構為更簡潔的版本"
prompt = """
請重構以下代碼，目標是降低圈複雜度並提升可讀性。
原始代碼：
{{args}}

請提供重構後的代碼，並附上變更點的簡短說明。
"""
```

---

### 4. `skills/{skill}/SKILL.md`：代理技能 (Agent Skills)

- **定義**：封裝特定領域的專家知識與程序化工作流，具備「被動觸發」與「工具調用」能力。
- **檔案路徑**：`.gemini/skills/{skill-name}/SKILL.md`
- **特性**：**按需加載 (On-demand)**。具備 YAML Frontmatter (Name & Description)，Gemini 會根據任務描述自動「發現」並激活技能，不會佔用不必要的上下文窗口。
- **解決問題**：當指令集過於龐大（例如：整個資料庫遷移指南），放在 `GEMINI.md` 會導致 context 過載時，將其模組化。
- **適用情境**：複雜的安全性審核、特定雲端平台的部署邏輯、大規模數據遷移。

### 📌 撰寫範例 (`db-migration/SKILL.md`)

```markdown
---
name: "db-migrator"
description: "當使用者要求執行資料庫 Migration、SQL 優化或 Schema 設計時激活。"
---
# Database Migrator Skill
## 🧠 Expertise
- Deep knowledge of PostgreSQL 16 and Prisma ORM.
## 🛠 Procedures
1. Always check for destructive changes (e.g., dropping columns).
2. Generate a rollback SQL script for every migration.
3. Suggest appropriate indexes based on query patterns.
```

---

## 📊 綜合對比表

| 指令檔類型 | 核心定位 | 作用域 | 載入時機 | 解決的核心痛點 |
| --- | --- | --- | --- | --- |
| **`GEMINI.md`** | **專案背景** | 專案/目錄 | 每輪對話自動載入 | 減少重複背景說明 |
| **`system.md`** | **底層人格** | 全域/系統 | 啟動時完全取代 | 覆蓋 AI 預設行為與邊界 |
| **`commands/*.toml`** | **快捷工具** | 指令級 | 使用者手動觸發 (`/`) | 簡化重複、複雜的操作流程 |
| **`skills/*.md`** | **專家能力** | 模組化 | 語境匹配時自動激活 | 避免 context 膨脹，模組化專家知識 |