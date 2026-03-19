# CLAUDE.md 優化指南

> 適用於全域（`~/.claude/CLAUDE.md`）與專案級（[./CLAUDE.md](file:///C:/Users/ivan.ma/AppData/Local/Temp/CLAUDE.md)、`./.claude/CLAUDE.md`）配置。
> 依據 Claude Code 官方文件與社群實戰經驗整理。

---

## 一、CLAUDE.md 載入機制總覽

### 1.1 五層載入階層

Claude Code 按以下優先級從低到高載入指令，**後者覆蓋前者**：

```
┌─────────────────────────────────────────────────────┐
│ Layer 1: Managed Policy（最低優先級）                  │
│ 位置：/etc/claude-code/CLAUDE.md (Linux/WSL)          │
│       C:\Program Files\ClaudeCode\CLAUDE.md (Windows) │
│ 載入：每次 session 自動載入                             │
│ 用途：企業級全局規範（IT/DevOps 管理）                   │
├─────────────────────────────────────────────────────┤
│ Layer 2: User Instructions                            │
│ 位置：~/.claude/CLAUDE.md                             │
│       ~/.claude/rules/*.md                            │
│ 載入：每次 session 自動載入                             │
│ 用途：個人偏好、通用習慣                                │
├─────────────────────────────────────────────────────┤
│ Layer 3: Project Root                                 │
│ 位置：./CLAUDE.md 或 ./.claude/CLAUDE.md              │
│       ./.claude/rules/*.md                            │
│ 載入：每次 session 自動載入                             │
│ 用途：專案核心規範、技術棧、架構概述                      │
├─────────────────────────────────────────────────────┤
│ Layer 4: Path-Scoped Rules                            │
│ 位置：./.claude/rules/*.md（含 paths: frontmatter）    │
│ 載入：當 Claude 讀取匹配路徑的檔案時動態載入              │
│ 用途：特定目錄/檔案類型的規範（如 migration、API）       │
├─────────────────────────────────────────────────────┤
│ Layer 5: Subdirectory CLAUDE.md（最高優先級）           │
│ 位置：./src/api/CLAUDE.md、./packages/auth/CLAUDE.md  │
│ 載入：當 Claude 讀取該目錄下的檔案時動態載入              │
│ 用途：模組級指令（如 monorepo 中的子專案）                │
└─────────────────────────────────────────────────────┘
```

### 1.2 關鍵行為

| 行為 | 說明 |
|------|------|
| **自動載入** | Layer 1-3 在每次 session 啟動時全部載入 |
| **動態載入** | Layer 4-5 僅在 Claude 使用 Read 工具讀取匹配檔案時才載入 |
| **覆蓋規則** | 更具體的層級覆蓋更廣泛的層級 |
| **疊加而非替換** | 除非明確衝突，否則各層級的規則會疊加生效 |
| **偵錯工具** | 使用 `/memory` 指令可查看當前載入的所有 CLAUDE.md 和 rules |

---

## 二、何時該拆分

### 2.1 拆分決策框架

```
CLAUDE.md 是否超過 200 行？
├─ 否 → 暫時不拆，觀察增長趨勢
└─ 是 → 是否超過 300 行？
    ├─ 否 → 檢查是否有明確的「可拆段落」（見 §2.2）
    │   ├─ 有 → 拆到 .claude/rules/
    │   └─ 無 → 嘗試精簡（刪重複、壓縮表格）
    └─ 是 → 強烈建議拆分
        ├─ 是否為 monorepo 或多模組專案？
        │   ├─ 是 → 使用 subdirectory CLAUDE.md
        │   └─ 否 → 使用 .claude/rules/ + path-scoped
        └─ 拆分後主檔控制在 150-200 行以內
```

### 2.2 可拆 vs 不可拆的判斷標準

| 適合拆出 | 不適合拆出 |
|---------|----------|
| 被動引用型規則（coding style、命名慣例） | 核心調度邏輯（工作流程步驟、決策樹） |
| 特定技術棧的規範（Laravel 慣例、React patterns） | 角色定位與身份定義 |
| 安全規範（可用 path-scoped 限制作用範圍） | 強制回報點（需與調度邏輯緊密耦合） |
| 錯誤處理與脫困協議（被多處引用但獨立自足） | 回饋處理路由（依賴回報點定義） |
| 平台/環境特定指令（Docker、CI/CD） | 全局約束（語言規範、Token 最小化） |

**核心原則**：如果一段內容被拆出後，AI 理解工作流程時**需要跨文件來回參照**才能正確判斷，就不該拆。

---

## 三、拆分方式對照

### 3.1 `.claude/rules/` 規則檔

**機制**：`.claude/rules/` 目錄下的所有 [.md](file:///C:/Users/ivan.ma/AppData/Local/Temp/CLAUDE.md) 檔案會自動載入，與主 CLAUDE.md **同等優先級**。

**適用場景**：跨專案通用的規範、團隊共享的 coding standard。

```
.claude/
├── CLAUDE.md              ← 核心調度邏輯（保持精簡）
└── rules/
    ├── coding-style.md    ← 程式碼風格規範
    ├── error-handling.md  ← 錯誤處理與脫困協議
    ├── security.md        ← 安全規範
    └── edit-safety.md     ← 編輯安全規範
```

**範例 — `rules/coding-style.md`**：
```markdown
# 程式碼風格規範

## 命名慣例
- Class：PascalCase
- Method/Variable：camelCase
- Database columns：snake_case
- Constants：UPPER_SNAKE_CASE

## 程式碼組織
- 每個 class 一個檔案
- 方法長度不超過 20 行
- 相關功能使用 region 分組
```

### 3.2 Path-Scoped Rules（條件載入）

**機制**：在 `.claude/rules/` 的 [.md](file:///C:/Users/ivan.ma/AppData/Local/Temp/CLAUDE.md) 檔案中加入 YAML frontmatter 的 `paths:` 欄位，指定 glob pattern。**僅在 Claude 讀取匹配檔案時才載入**。

**適用場景**：只針對特定目錄或檔案類型的規範。

**範例 — `rules/migration-rules.md`**：
```markdown
---
paths:
  - "database/migrations/**"
  - "**/Migration*.php"
---

# Migration 撰寫規範

- 每個 migration 只做一件事
- 必須包含 down() 方法
- 索引命名：{table}_{column(s)}_{type}（如 users_email_unique）
- 外鍵命名：{table}_{column}_foreign
- 禁止在 migration 中使用 Model（直接操作 Schema/DB）
```

**範例 — `rules/api-patterns.md`**：
```markdown
---
paths:
  - "app/Http/Controllers/**"
  - "routes/api.php"
  - "app/Http/Requests/**"
---

# API 開發規範

- Controller 只做 Request 解析 → Service 呼叫 → Response 回傳
- 驗證邏輯放 FormRequest，不在 Controller
- 統一使用 JsonResource 做回應格式化
- 錯誤回應使用 Exception Handler 統一處理
```

> ⚠️ **注意**：path-scoped rules 僅在 Claude 使用 Read 工具**讀取**匹配檔案時觸發。若 Claude 直接編輯檔案而未先讀取，規則不會載入。

### 3.3 Subdirectory CLAUDE.md

**機制**：放在子目錄中的 [CLAUDE.md](file:///C:/Users/ivan.ma/AppData/Local/Temp/CLAUDE.md)，當 Claude 讀取該目錄下的檔案時**動態載入**。

**適用場景**：Monorepo、多模組專案、前後端分離。

```
project/
├── CLAUDE.md              ← 專案全局規範
├── packages/
│   ├── api/
│   │   └── CLAUDE.md      ← API 模組專屬指令
│   ├── web/
│   │   └── CLAUDE.md      ← 前端模組專屬指令
│   └── shared/
│       └── CLAUDE.md      ← 共用模組指令
```

**範例 — `packages/api/CLAUDE.md`**：
```markdown
# API 模組

## 技術棧
- Laravel 11 + PHP 8.3
- MySQL 8.0
- Redis（快取 + Queue）

## 架構
- Clean Architecture：Controller → Service → Repository → Model
- 所有 Service 必須有對應的 Interface

## 測試
- 使用 PHPUnit
- 跑測試：`cd packages/api && php artisan test`
- 最低覆蓋率：80%
```

### 3.4 三種方式的選擇矩陣

| 需求 | 推薦方式 | 原因 |
|------|---------|------|
| 通用規範（coding style、git 慣例） | `.claude/rules/` | 每次都需要，全局載入 |
| 特定檔案類型的規範（migration、test） | path-scoped rules | 按需載入，減少 context 污染 |
| 獨立模組/子專案的完整指令 | subdirectory CLAUDE.md | 模組隔離，語義清晰 |
| 調度邏輯、決策樹、工作流程 | **保留在主 CLAUDE.md** | 避免跨檔案語義飄移 |

---

## 四、主 CLAUDE.md 精簡策略

### 4.1 「索引型」主檔模式

當 CLAUDE.md 超過 300 行時，可改為「索引型」——主檔只保留核心邏輯和索引，詳細規範指向 rules 檔。

**精簡前**（350+ 行）：
```markdown
# 角色定位
（20 行）

# 核心原則
（30 行）

# 工作流程
（180 行）

# 程式碼風格      ← 可拆
（40 行）

# 錯誤處理        ← 可拆
（50 行）

# 安全規範        ← 可拆
（30 行）
```

**精簡後**（~230 行）：
```markdown
# 角色定位
（20 行）

# 核心原則
（30 行）

# 工作流程
（180 行）

# 補充規範（自動載入）
以下規範透過 .claude/rules/ 自動載入，不需手動引用：
- 程式碼風格 → .claude/rules/coding-style.md
- 錯誤處理 → .claude/rules/error-handling.md
- 安全規範 → .claude/rules/security.md
```

### 4.2 精簡檢查清單

定期（每季或超過 300 行時）執行以下檢查：

- [ ] **刪除冗餘**：是否有重複表達的規則？（用不同文字說同一件事）
- [ ] **壓縮表格**：長段落能否改為表格？（通常可減少 30-50% 行數）
- [ ] **移除已固化規則**：是否有規則已內建到代理的 system prompt 中？（無需在主檔重複）
- [ ] **合併相似項**：是否有 3+ 條規則可合併為一條概括性規則？
- [ ] **驗證影響**：每項拆出的規則，確認不與主檔的調度邏輯有交叉引用

---

## 五、專案級 CLAUDE.md 模板

### 5.1 新專案初始化

```markdown
# {專案名稱}

## 專案概述
- **用途**：{一句話描述}
- **技術棧**：{語言} + {框架} + {資料庫} + {快取}
- **架構模式**：{如 Clean Architecture / MVC / DDD}

## 快速指令
- 啟動開發環境：`{command}`
- 跑測試：`{command}`
- 建置：`{command}`
- Lint：`{command}`

## 目錄結構
```
src/
├── Controllers/   — API 端點
├── Services/      — 業務邏輯
├── Repositories/  — 資料存取
├── Models/        — 資料模型
└── Tests/         — 測試
```

## 架構規範
- {規範 1}
- {規範 2}

## 命名慣例
- {慣例 1}
- {慣例 2}
```

### 5.2 成長階段拆分路徑

```
Phase 1（< 100 行）：單一 CLAUDE.md 即可
    ↓ 專案成長
Phase 2（100-200 行）：考慮將 coding style 拆到 .claude/rules/
    ↓ 加入更多規範
Phase 3（200-300 行）：path-scoped rules 拆出特定技術規範
    ↓ 多模組/monorepo
Phase 4（300+ 行）：subdirectory CLAUDE.md 做模組隔離
```

---

## 六、常見反模式

| 反模式 | 問題 | 正確做法 |
|--------|------|---------|
| **全塞主檔** | 超過 300 行，AI 注意力稀釋，規則遵從度下降 | 拆分到 rules/ |
| **過度拆分** | 10+ 個 rules 檔案，AI 需整合多份指令，增加矛盾風險 | 控制在 5-7 個 rules 檔 |
| **拆出調度邏輯** | 工作流程步驟分散在多個檔案，AI 無法形成完整決策路徑 | 調度邏輯集中在主檔 |
| **重複定義** | 同一規則在主檔和 rules 檔都出現，版本不同步 | 一處定義，一處引用 |
| **無索引的拆分** | 拆了但主檔沒有說明有哪些 rules，人類維護困難 | 主檔保留索引區塊 |
| **空泛的 path-scope** | `paths: ["**/*"]` 等於全局載入，失去條件載入意義 | 精確定義 glob pattern |
| **忽略 CLAUDE.local.md** | 個人偏好寫入共享的 CLAUDE.md，影響團隊一致性 | 個人偏好用 `.local.md`（git-ignored） |

---

## 七、你的全域 CLAUDE.md 拆分方案（參考）

基於本次診斷，當你的 `~/.claude/CLAUDE.md` 超過 500 行時，建議按以下方案拆分：

| 拆出內容 | 目標位置 | 行數 | 風險 |
|---------|---------|------|------|
| §5 Edit 安全規範 | `~/.claude/rules/edit-safety.md` | ~8 行 | 低 |
| §6 錯誤處理與防循環 | `~/.claude/rules/error-handling.md` | ~40 行 | 中（需確保代理引用可找到） |
| §8 安全規則 | `~/.claude/rules/security.md` | ~8 行 | 低 |
| **不拆** | — | — | — |
| §0-3 角色/語言/核心規範 | 保留主檔 | ~70 行 | — |
| §4 工作流程 | 保留主檔 | ~200 行 | — |
| §7 行為約束 | 保留主檔 | ~15 行 | — |

拆分後主檔預估：~285 行（從 ~395 行降至 ~285 行，縮減 28%）。

> **執行前提**：確認代理定義中引用「遵循 CLAUDE.md 的 L1-L2-L3 脫困協議」時，AI 能從 `rules/error-handling.md` 中找到。可用 `/memory` 指令驗證載入狀態。
