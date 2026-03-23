# Orchestrator Skill 撰寫指南

> **本文件的定位**：這是一份教你如何撰寫「任務執行總監」skill 的指南。
> 讀完後你會知道如何將 Claude Code 從一個寫程式碼的助手，
> 升級為一個管理 16 個子代理的工程主管。
>
> **適用條件**：後端軟體工程師（Laravel / NestJS），Claude Code 主 session 為 Sonnet。

---

## 第一章：心智模型轉換

### 1.1 從「助手」到「主管」

傳統用法：你下指令 → Claude 寫程式碼 → 你 review。
Claude 是一個聽話的工程師。

升級後：你提需求 → Claude 拆解任務、分派給專職子代理、
蒐集產出、審查品質、回報結果 → 你做最終決策。
Claude 是一個管理 16 人團隊的工程主管。

這個轉換的核心洞見來自 gstack 的設計哲學：

> 不是一個萬能的 agent，而是一組各司其職的 specialist。
> 治理結構（governance）才是快速交付與魯莽交付的差異。

gstack 用 skill（slash command）賦予 Claude 不同角色——CEO、Designer、
Eng Manager、Release Manager、QA。每個角色有自己的優先順序與約束。
你的架構用 subagent 做同樣的事，但更適合後端工程師的工作流：
規劃 → 實作（Wave 分層）→ 審查（Wave 分層）→ 交付。

### 1.2 Skill vs Subagent vs Command：選哪個？

| 機制 | 執行位置 | 看得到過程？ | 適合什麼 |
|------|---------|------------|---------|
| **Skill** | 主 agent context 內 | 是 | 方法論注入、知識庫、工作流編排指南 |
| **Subagent** | 獨立 context window | 否（只看結果） | 有明確輸入/輸出的執行任務 |
| **Command** | 主 agent context 內 | 是 | 使用者手動觸發的工作流入口 |

Orchestrator 必須是 **Skill**——因為它要在主 agent 的 context 中運作，
才能讀取使用者需求、判斷路由、呼叫子代理。
（subagent 無法 spawn 其他 subagent，這是官方硬性限制。）

### 1.3 你的角色：決策者，不是執行者

升級後你只需要做三件事：
1. **提出需求**（What + Why）
2. **在停頓點做決策**（確認/否決/調整）
3. **最終驗收**

所有「How」都交給主管（主 agent + orchestrator skill）去分配。

---

## 第二章：Skill 架構設計

### 2.1 目錄結構

```
~/.claude/skills/orchestrator/
├── SKILL.md                       ← 主管的「管理手冊」
└── references/
    ├── routing-rules.md           ← 任務路由決策樹
    ├── wave-patterns.md           ← Wave 執行模式定義
    └── agent-registry.md          ← 子代理清冊
```

採用 progressive disclosure（漸進式揭露）：
主 agent 啟動時只讀 SKILL.md（< 500 行），需要細節時再讀 references/。
這是控制 context 佔用的關鍵——16 個 agent 的完整資訊不該在每次對話開頭就全部載入。

### 2.2 SKILL.md 的結構原則

參考 gstack 和 Anthropic 官方的 skill 設計模式，一個好的 SKILL.md 包含：

**1. YAML Frontmatter（觸發條件）**

```yaml
---
name: orchestrator
description: >
  多代理工作流編排。當需求涉及多步驟開發任務時觸發。
  即使使用者未提及「子代理」，只要可拆解為 2+ 子任務就觸發。
  不用於單一檔案的簡單修改。
---
```

description 要「推銷式」——Claude 傾向不觸發 skill（undertrigger），
所以 description 要明確列出觸發情境。

**2. 身份宣告（Role Statement）**

告訴主 agent 它現在的角色是什麼。
不是「你是一個 AI 助手」，而是「你是管理 16 人團隊的工程主管」。

gstack 的做法：每個 skill 把 Claude 鎖定在一個角色——
CEO review 時它就是 CEO，不會突然跳去寫程式碼。
你的 orchestrator skill 也要這樣：
「你是任務執行總監，你的工作是分派而非執行。」

**3. 核心原則（Guardrails）**

寫成「不可違反」的規則，而非建議。包含：
- 遞迴防護（max_turns）
- Token 節省的判斷公式
- 強制停頓點
- Agent 間不互相呼叫

**4. 路由摘要（Quick Reference）**

SKILL.md 內放摘要，完整版指向 references/routing-rules.md。
主 agent 日常只看摘要就夠了。

**5. Agent 清冊摘要**

同上，摘要表格 + 指向 references/agent-registry.md。

### 2.3 references/ 的設計原則

每個 reference 檔案是獨立的、自包含的文件。
主 agent 讀取時不需要同時讀其他 reference。

| 檔案 | 內容 | 何時讀取 |
|------|------|---------|
| routing-rules.md | 完整決策樹 + 觸發條件 | 需求進來、需判斷路由時 |
| wave-patterns.md | Wave 執行模式定義 | 進入 Wave 流程時 |
| agent-registry.md | 16 個 agent 的完整資訊 | 需要了解某個 agent 的詳細能力時 |

---

## 第三章：子代理提示詞撰寫

### 3.1 提示詞結構

每個子代理是一個 `.md` 檔案，放在 `~/.claude/agents/`。
結構：

```markdown
---
name: agent-name
description: >
  一句話描述職責與觸發時機。
  要寫成「動作導向」——做什麼、什麼時候用。
tools: Read, Grep, Glob          # 最小權限
model: sonnet                     # 明確指定
---

你是一位 [角色定義]。

## 工作流程
（編號步驟）

## 輸出格式
（結構化模板）

## 限制
（禁止事項）
```

### 3.2 撰寫原則

**原則 1：單一職責**

一個 agent 只做一件事。
如果你在 description 裡需要用「和」連接兩個動詞，考慮拆成兩個 agent。

gstack 的做法：CEO review 只做產品決策，不碰架構；
Eng review 只做技術審查，不碰商業判斷。
角色邊界清晰到不需要思考「這件事該找誰」。

**原則 2：輸出格式固定**

每個 agent 的輸出必須有固定的結構化模板。
理由：主 agent 需要解析子代理的產出來決定下一步。
如果產出格式不固定，主 agent 要花 token 去「理解」產出。

例如 review-lead 的結論必須是 `PASS / PASS_WITH_WARNINGS / NEEDS_FIX`，
主 agent 看到 `NEEDS_FIX` 就知道要啟動修正輪，不需要推理。

**原則 3：Tool 最小權限**

| 角色類型 | Tools |
|---------|-------|
| 規劃 / 審查（唯讀） | Read, Grep, Glob |
| 實作（需寫入） | Read, Write, Edit, Bash, Glob, Grep |
| 研究（需網路） | Read, Grep, Glob, WebFetch, WebSearch |

不要給審查 agent Write 權限——它的工作是報告問題，不是修問題。
不要給實作 agent WebSearch——它的工作是寫程式碼，不是做研究。

**原則 4：Model 選擇有明確理由**

| Model | 使用條件 | 你的 agent 中的對應 |
|-------|---------|-------------------|
| opus | 需要跨模組深度推理、無法用 checklist 描述的判斷 | architect, review-lead |
| sonnet | 日常開發、可用 checklist 描述的審查、測試 | 大多數 agent |
| haiku | 純 pattern matching、照規格執行、不做設計決策 | foundation-implementer, style-reviewer |
| inherit | 與主 session 同級，不需特別指定時使用 | planner, planning-specialist, prompt-optimizer |

錯誤示範：「這個 agent 很重要所以用 opus」——重要不等於需要深度推理。
正確思考：「這個 agent 需要做什麼層級的判斷？checklist 能覆蓋嗎？」

**原則 5：限制條件比能力描述更重要**

agent 做錯事的代價遠大於少做事。
寫提示詞時，先寫「禁止什麼」，再寫「要做什麼」。

例如 foundation-implementer 的關鍵限制：
「若任務包含 migration，其 schema 設計必須來自 planner 或 architect 的產出，
不可自行決定欄位、型別、index、cascade。」

這條限制比「你擅長寫 migration」重要 10 倍。

### 3.3 Skill 調用：讓 Agent 使用方法論

子代理的提示詞中可以指示它讀取某個 skill。
這讓方法論成為可複用的模組，而非複製貼上到每個 agent。

範例：`critical-analysis` skill 被 4 個 agent 調用——
planner、planning-specialist、architect、review-lead。
每個 agent 的提示詞中只需加一行：

```
完成主要產出後，讀取 critical-analysis skill 進行自我批判，
將發現附在報告末尾的「批判性審查」段落。
```

這比在 4 個 agent 裡各寫一份批判性審查指南好：
- 修改方法論只需改一個地方
- 確保 4 個 agent 用同一套標準

---

## 第四章：工作流編排設計

### 4.1 路由規則的設計思路

路由規則是 orchestrator skill 的核心——它決定「這個需求該走哪條路」。

設計原則：**decision tree，不是 if-else 清單**。
每個節點只問一個 binary question，答案決定走哪條分支。

```
收到需求
  │
  ├─ 使用者提供了需求文件 / PRD？
  │   └─ YES → @planning-specialist（一次性評分）
  │
  ├─ 需求口頭描述 / 不成形？
  │   └─ YES → @planner（互動式）
  │
  ├─ 修改範圍 ≤ 1 個檔案？
  │   └─ YES → @implementer 直接做
  │
  └─ 跨模組（4+ 檔案）？
      └─ Wave 流程
```

gstack 的路由設計參考：它依據「什麼改變了」來決定需要哪些 review——
後端改動不需要 design review，bug fix 不需要 CEO review。
**smart routing = 不做不必要的事**。

### 4.2 Wave 模式的設計思路

Wave 是你的架構的獨特優勢——它把任務編成有依賴關係的波次，
同一波次內的 agent 可以 parallel 執行。

```
Phase 3 — 實作
  Wave 1: foundation-implementer（Migration, Model, Config, Route）
      ↓ 必須完成才能開始下一波
  Wave 2: logic-implementer ║ api-implementer（parallel）
      ↓
  Wave 3: test-implementer（可選）
```

設計原則：

- Wave 之間是 **sequential**（有依賴）
- Wave 內部是 **parallel**（無依賴，不改同一檔案）
- 每個 Wave 完成 = 1 turn（parallel 的多個 agent 合計 1 turn）

### 4.3 強制停頓點的設計思路

gstack 的 review gate 概念：某些動作必須通過人類審查才能繼續。
Eng Review 是必經的門（gates shipping），CEO Review 是可選的。

你的停頓點同理：

| 停頓點 | 必經/可選 | 理由 |
|--------|---------|------|
| 規劃完成 | 必經 | 防止方向錯誤導致全部返工 |
| 架構設計完成 | 必經 | 架構決策不可逆 |
| 實作遇到規劃外問題 | 必經 | 防止 agent 自行擴大範圍 |
| build 失敗無法自動修復 | 必經 | 防止 agent 盲目嘗試 |
| 審查報告完成 | 必經 | 修什麼由人類決定 |

停頓點是**硬性規則**——即使 agent 判斷「一切正常」，
仍必須暫停讓你確認。這是治理結構的核心。

### 4.4 遞迴防護的設計思路

兩個風險需要防護：

**風險 1：審查修正循環**

```
❌ review → fix → review → fix → review → ...
✅ review → fix → final review → ⏸️人類決定
```

修正輪最多 1 次。第二次審查仍有問題就停下來。
原因：如果兩輪都修不好，問題可能在規劃層而非實作層。

**風險 2：Agent 互相呼叫**

所有呼叫都從主 agent 發出。
subagent A 永遠不會「叫 B 去確認」。
這從結構上消除了 A↔B 死循環的可能。

**Turn 計數**：單一需求上限 10 turns。
同一 Wave 內的 parallel agents 合計 1 turn。
Skill 在 agent context 內執行，不額外計 turn。

---

## 第五章：Token 節省的悖論

### 5.1 問題描述

編排本身消耗 token。如果你要花 500 token 來思考「這件事該交給誰」，
但直接用 Sonnet 做只需要 300 token，那編排就是浪費。

### 5.2 三級判斷

| 情境 | 做法 | 啟用 Wave？ |
|------|------|------------|
| 單一檔案、< 100 行 | `@implementer` 直接做 | 否 |
| 2-3 個子任務 | 簡單分派，不分析模型選擇 | 否 |
| 跨模組（4+ 檔案） | 完整 Wave | 是 |
| 大規模重構（10+ 檔案） | 完整 Wave + Parallel 分組 | 是 |

**判斷公式**：如果需要超過 3 句話來「思考該分派給誰」，
跳過編排，直接做。

### 5.3 不要為了省錢而降品質

gstack 的哲學：「不要跳過最後 10%——用 AI 時，那 10% 只花幾秒鐘。」

同理：不要為了省 token 而跳過審查。
審查的成本遠低於 production bug 的修復成本。
省 token 的正確方式是**不做不必要的編排**，而非砍掉品質門檻。

---

## 第六章：從零開始建置

### 6.1 建置順序

```
第 1 步：撰寫 orchestrator SKILL.md
第 2 步：撰寫 references/（routing-rules, wave-patterns, agent-registry）
第 3 步：撰寫每個 agent 的 .md（先寫限制，再寫能力）
第 4 步：撰寫 critical-analysis skill
第 5 步：撰寫 /optimize-prompt command + prompt-optimizer agent
第 6 步：在 CLAUDE.md 中加入 orchestrator section
第 7 步：測試——用一個真實需求跑完整個 Wave 流程
```

### 6.2 CLAUDE.md 中的 orchestrator section

```markdown
## orchestrator

使用 orchestrator skill 管理子代理工作流。
可用 agent：@planner, @planning-specialist, @architect,
@foundation-implementer, @logic-implementer, @api-implementer,
@implementer, @tdd-guide, @test-implementer, @e2e-runner,
@style-reviewer, @security-reviewer, @perf-test-reviewer,
@review-lead, @build-error-resolver, @prompt-optimizer。
可用 skill：critical-analysis。
可用 command：/optimize-prompt。
```

### 6.3 測試方式

用一個真實需求走完整流程，觀察：

1. 路由判斷是否正確（該走 Wave 的有沒有走、不該走的有沒有跳過）
2. 停頓點有沒有確實暫停
3. 子代理的產出品質是否符合預期
4. 修正輪有沒有控制在 1 次以內
5. 總 turn 數是否在 10 以內

---

## 第七章：持續優化

### 7.1 提示詞優化流程

用 `/optimize-prompt [agent名稱]` 觸發 prompt-optimizer subagent。
它會在獨立 context 中分析提示詞並產出 diff 建議。
你確認後才寫入——絕不自動修改。

### 7.2 新增子代理流程

當需求無法被現有 agent 覆蓋時：
1. 主 agent 告知你「目前沒有覆蓋 [X 職責] 的子代理」
2. 提議 name / model / tools / 職責 / 歸屬層級
3. 你確認後才建立
4. 同步更新 agent-registry.md

### 7.3 觀察指標

| 指標 | 健康狀態 | 需要調整 |
|------|---------|---------|
| 修正輪次數 | 多數需求 0-1 輪 | 頻繁觸發修正輪 → 檢視規劃層品質 |
| 停頓點被否決率 | 偶爾否決 | 頻繁否決 → agent 對需求理解有誤 |
| haiku agent 產出品質 | 不需要人工修正 | 頻繁修正 → 考慮升級為 sonnet |
| 路由判斷準確度 | 走對路徑 | 常走錯 → 檢視 routing-rules 的決策樹 |

---

## 附錄：參考資源

| 資源 | 說明 |
|------|------|
| [garrytan/gstack](https://github.com/garrytan/gstack) | role-based skill 設計的標竿——CEO / Eng Manager / QA 角色分離，review gate 機制 |
| [obra/superpowers](https://github.com/obra/superpowers) | brainstorm → spec → plan → subagent execution → review → merge 完整流程 |
| [Claude Code 官方 subagent 文件](https://code.claude.com/docs/en/sub-agents) | frontmatter 欄位、tool 限制、memory 機制 |
| [Claude Code 官方 skill 文件](https://code.claude.com/docs/en/skills) | context: fork、allowed-tools、disable-model-invocation |
| [shanraisshan/claude-code-best-practice](https://github.com/shanraisshan/claude-code-best-practice) | 社群整理的 agent / skill / hook 最佳實踐 |
| [PubNub subagent pipeline](https://www.pubnub.com/blog/best-practices-for-claude-code-sub-agents/) | pm-spec → architect-review → implementer-tester 三階段 pipeline 實戰 |
| [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) | 100+ subagent 的 tool/model 分配參考 |
