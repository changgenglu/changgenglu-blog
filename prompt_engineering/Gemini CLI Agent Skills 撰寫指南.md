# Gemini CLI Agent Skills 撰寫指南

> 本指南說明如何為 Gemini CLI 設計高品質的 Agent Skills(高精準度、低幻覺（Hallucination）)，並確保與現有配置（GEMINI.md, Commands）無縫整合。

## 1. 核心機制：自動發現 (Auto-Discovery)

Gemini CLI 具備「自動發現」機制，會掃描 `.gemini/skills/` 目錄，將所有 Skills 的 Metadata (Name, Description) 注入 System Prompt。

- **觸發流程**：
  1. Session 啟動：載入所有 Skills 的 `name` 與 `description`。
  2. 任務識別：模型根據 User Task 比對 Skill Description。
  3. 動態激發：模型主動呼叫 `activate_skill` 工具，載入完整 `SKILL.md` 內容。

**⚠️ 重要觀念**：由於此機制全自動且基於語意匹配，我們**不需要**（也不建議）在其他地方手動強制載入 Skills。

---

## 2. 最佳實踐與設計規範

### 2.0 核心結構 (The Anatomy of a Skill)

一個標準的 Skill 通常包含三個關鍵部分，缺一不可：

* **Skill Name (函數名稱)**：AI 識別工具的唯一 ID。
* **Description (功能描述)**：這是最重要的部分，AI 透過這段文字理解「這是什麼」以及「什麼時候該用」。
* **Parameters Schema (參數定義)**：告訴 AI 需要提取哪些資訊來執行任務。

以下是用於撰寫高品質 Skill 的具體規範：

### 2.1 命名規範 (Naming Conventions)

- **目錄名稱** = **Skill Name** (使用 kebab-case，如 `laravel-coding-standard`)
- **檔案路徑**：`.gemini/skills/<skill-name>/SKILL.md`
- **動詞開頭**：使用清晰的 `動詞-名詞` 格式。
    * ✅ `get-current-weather`, `execute-sql-query`, `search-knowledge-base`
    * ❌ `weather`, `sql`, `search`
- **避免歧義**：名稱應能自解釋，避免重疊。

### 2.2 描述撰寫 (Description Engineering)

Description 是模型判斷「何時使用此技能」的唯一依據。必須包含三個要素：
1. **觸發場景 (Activates when...)**：明確列出適用情境。
2. **負向約束 (Do NOT use for...)**：明確界定邊界，防止誤觸發。
3. **具體範例 (Examples...)**：提供 User Prompt 範例。

**❌ 錯誤示範**：
```yaml
description: "Laravel coding standards and best practices."
```
*(太過籠統，可能在一般 PHP 問題時也被觸發)*

**✅ 正確示範**：
```yaml
description: "Activates when user writes or reviews PHP/Laravel code, requiring Laravel-specific coding standards validation. Do NOT use for basic indentation/whitespace checks (handled by linter). Examples: 'Check naming conventions', 'Review validation format'."
```

### 2.3 參數定義 (Parameter Constraints)

不要相信 AI 會自動猜對格式，必須透過 Schema 強制約束。

* **使用 Enum (枚舉)**：若參數只有固定幾個選項（如 `units`: 'celsius' | 'fahrenheit'），務必使用 Enum 鎖定，防止 AI 創造不存在的選項。
* **必填 vs 選填**：明確標記 `Required` 欄位。
* **詳細的參數描述**：每個參數都應有 `description`，解釋預期的格式（如："ISO 8601 date format" 或 "City name, not zip code"）。


---

## 3. 配置整合策略：避免 Context 衝突

由於 Skills 是「按需加載 (On-Demand)」，應避免與「常駐 Context」發生衝突或冗餘。

### 3.1 GEMINI.md (專案核心文檔)
- **原則**：GEMINI.md 是常駐 Context，應保持精簡。
- **做**：僅提示「詳細知識已模組化」，引導 AI 依賴 Skills。
- **不做**：列出詳細的 Skill 表格或指令。CLI 已經自動將 Skill 列表注入 System Prompt，手動列出會造成 Token 浪費與潛在混淆。

### 3.2 Custom Commands (`config.toml`)
- **原則**：Commands 定義特定任務流程，Skills 提供執行任務所需的知識。
- **做**：在 Prompt 中使用「弱提示」來指引 AI 考慮特定領域知識。
  ```toml
  # 提示 AI 本任務可能需要某些領域知識
  # - laravel-coding-standard
  # - security-auditor
  ```
- **不做**：
  - **不要使用路徑引用**：如 `.gemini/skills/xx/SKILL.md`（模型可能試圖讀取檔案而失敗）。
  - **不要強制加載指令**：依賴模型的自動判斷能力通常更好。

### 3.3 System.md (角色定義)
- **原則**：定義 Agnet 的「核心人格」與「最高指導原則」。
- **關係**：System.md 定義 "Who I am" (e.g., Senior Architect)，Skills 定義 "What I can do" (e.g., Audit Security)。兩者互補不衝突。

---

## 4. 審查清單 (Checklist)

新增或修改 Skill 時，請確認：

- [ ] **命名一致**：目錄名與 `name` 欄位一致。
- [ ] **精準描述**：Description 包含 `Activates when`, `Do NOT use`, `Examples`。
- [ ] **獨立性**：Skill 內容是否足夠獨立，不依賴其他 Skill？
- [ ] **無冗餘引用**：檢查 `commands/*.toml` 與 `GEMINI.md`，確保沒有過時或重複的強制引用。

---

## 🔗 參考來源

* **Gemini CLI Skills Documentation**: [https://geminicli.com/docs/cli/skills/](https://geminicli.com/docs/cli/skills/)
* **Google Gemini API - Function Calling**: [https://ai.google.dev/gemini-api/docs/function-calling](https://ai.google.dev/gemini-api/docs/function-calling) (官方底層原理)
* **OpenAI Cookbook - Function Calling Best Practices**: 雖然是 OpenAI 文件，但在參數描述（Description Engineering）上的邏輯與 Gemini 高度通用。

