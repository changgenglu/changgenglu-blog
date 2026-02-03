# Gemini CLI Agent Skills 撰寫指南

## ⚙️ 前置作業：啟用 Agent Skills

在開始撰寫之前，請確保你的 Gemini CLI 已啟用此功能（預設可能是關閉的）。

1. 執行指令開啟設定介面：`gemini settings`
2. 將 **Agent Skills** 選項設為 `true`。
3. 或者直接編輯設定檔 `~/.gemini/settings.json`：

```json
{
  "agentSkills": true
}
```

---

## 📂 Agent Skills 核心結構說明

一個標準的 Skill 是一個資料夾，必須包含 `SKILL.md`，並可選包含三個支援資料夾。

- **`SKILL.md` (必須)**：技能的「大腦」。包含中繼資料（Metadata）與核心指令（System Instructions）。
- **`scripts/` (進階)**：技能的「手」。AI 可以執行的具體工具（Bash, Python, Node.js）。
- **`references/` (進階)**：技能的「知識庫」。AI 執行任務時參考的靜態文件、規範或 schema。
- **`assets/` (進階)**：技能的「資產」。AI 用來生成的模板、範例程式碼或二進位資源。

---

## 1. 基礎設定範例 (Basic Configuration)

**情境**：建立一個「資深 Code Reviewer」技能。
**特點**：純文字指令驅動，不涉及外部腳本執行，依靠模型本身的知識庫與邏輯。

### 📌 撰寫範例：`code-reviewer/SKILL.md`

請在 `.gemini/skills/code-reviewer/` 目錄下建立 `SKILL.md`：

```markdown
---
name: code-reviewer
description: 專門用於 Python 與 TypeScript 的程式碼審查專家，提供安全性與效能優化建議。
version: 1.0.0
---

# Role Definition

你是一位擁有 10 年經驗的資深軟體架構師，專精於 Python 與 TypeScript。你的目標是透過嚴格的標準提升程式碼品質。

# Instructions

當使用者要求 review 程式碼時，請遵循以下步驟：

1.  **安全性檢查**：優先掃描 SQL Injection、XSS 或機敏資料外洩風險。
2.  **效能評估**：指出時間複雜度過高 (O(n^2) 以上) 的邏輯。
3.  **風格一致性**：確保程式碼符合 PEP8 (Python) 或 Google Style Guide (TS)。
4.  **重構建議**：提供具體的程式碼重構片段，而不僅是口頭建議。

# Constraints

- 回應必須使用繁體中文。
- 若發現安全性漏洞，請以「🚨 高風險」標示。
- 嚴禁修改程式碼的商業邏輯，僅針對實作細節優化。
```

### 📖 設計原理

- **YAML Frontmatter**：`name` 與 `description` 是為了讓 Agent 在「Discovery（探索）」階段能識別此技能的存在。說明越精確，觸發越準確。
- **Role Definition**：透過角色設定（Persona）鎖定輸出的專業度。
- **結構化指令**：將審查過程標準化，確保每次輸出的一致性。

---

## 2. 進階設定範例 (Advanced Configuration)

**情境**：建立一個「自動化 API 測試與文件生成器」技能。
**特點**：整合 **Python 腳本** 執行測試，參考 **API 規範文件**，並使用 **Markdown 模板** 輸出報告。

### 📂 目錄結構

```text
api-tester/
├── SKILL.md
├── scripts/
│   └── curl_test.py      # 實際執行測試的 Python 腳本
├── references/
│   └── status_codes.md   # 參考用的 HTTP 狀態碼定義
└── assets/
    └── report_template.md # 測試報告的輸出格式模板

```

### 📌 撰寫範例 1：`api-tester/SKILL.md`

```markdown
---
name: api-tester
description: 自動化 API 測試代理人。能執行連線測試、驗證回傳格式，並依據標準模板生成測試報告。
version: 1.0.0
tools:
  - scripts/curl_test.py
---

# Role Definition

你是一個 QA 自動化工程師 Agent。你的任務是驗證使用者提供的 API Endpoint，並產出專業報告。

# Capabilities & Workflow

1.  **執行測試**：
    - 當需要測試 API 時，**必須**使用 `scripts/curl_test.py`。
    - 指令格式：`python scripts/curl_test.py <url>`
    - _注意：不要自行模擬測試結果，必須依據腳本的實際 Stdout 輸出。_

2.  **結果分析**：
    - 參考 `references/status_codes.md` 來解釋回傳的 HTTP Status Code 含義。
    - 若 Status Code 為 2xx，視為成功；4xx/5xx 視為失敗。

3.  **報告生成**：
    - 讀取 `assets/report_template.md` 的內容。
    - 將測試結果填入模板中，生成最終回應。

# Constraints

- 測試腳本僅支援 GET 請求。
- 若腳本執行失敗（Exit code != 0），請直接回報錯誤訊息。
```

### 📌 撰寫範例 2：支援檔案內容

**`scripts/curl_test.py` (簡化版)**

```python
import sys
import urllib.request
import time

# 這是一個 Agent 可呼叫的實體工具
url = sys.argv[1]
start = time.time()
try:
    with urllib.request.urlopen(url) as response:
        code = response.getcode()
        duration = time.time() - start
        print(f"SUCCESS: {code}, Latency: {duration:.2f}s")
except Exception as e:
    print(f"FAILED: {e}")

```

**`references/status_codes.md`**

```markdown
# HTTP Status Code Reference

- 200: OK - 請求成功。
- 404: Not Found - 資源不存在，請檢查 URL 路徑。
- 500: Internal Server Error - 伺服器端錯誤，建議檢查後端 Log。
```

**`assets/report_template.md`**

```markdown
## 📝 API 測試報告

- **目標 URL**: {{url}}
- **測試時間**: {{timestamp}}
- **狀態**: {{status}}
- **響應時間**: {{latency}}

## 分析建議

{{analysis}}
```

### 📖 設計原理

- **Tool Binding (Scripts)**：將 AI 無法憑空完成的任務（真實的網路請求）交給 `scripts/` 中的程式碼執行。這是 Agent "Grounding"（接地）的關鍵。
- **Knowledge Retrieval (References)**：將靜態知識（如 HTTP 定義）從 Prompt 中移出，放入 `references/`，減少 Context Window 的消耗，並讓知識維護更容易。
- **Standardization (Assets)**：透過 `assets/` 中的模板強制規範輸出格式，避免 AI 自由發揮導致格式混亂，特別適合需要機器二次讀取（Machine Readable）的產出。

---

## 🔗 參考來源

- [Gemini CLI GitHub Repository - Agent Skills](https://github.com/google-gemini/gemini-cli)
- [Gemini CLI Documentation - Skills Configuration](https://geminicli.com/docs/cli/skills/)
- [Gemini CLI Skills Feature Demo](https://www.youtube.com/watch?v=EmmOcrwNX74)
