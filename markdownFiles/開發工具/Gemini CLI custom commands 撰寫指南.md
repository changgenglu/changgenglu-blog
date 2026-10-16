# Gemini CLI 自訂指令參考

> 本文件摘要自 [gemini-cli 官方文件](https://geminicli.com/docs/cli/custom-commands)，供 AI 撰寫自訂指令時參照。

---

## 1. 檔案位置與優先順序

| 類型 | 位置 | 範圍 |
|------|------|------|
| 全域指令 | `~/.gemini/commands/` | 所有專案可用 |
| 專案指令 | `<project>/.gemini/commands/` | 僅當前專案可用 |

**優先順序**：專案指令會覆蓋同名的全域指令。

---

## 2. 命名與命名空間

- 檔案名稱決定指令名稱
- 子目錄用於建立命名空間，路徑分隔符轉換為 `:`

| 檔案路徑 | 指令名稱 |
|----------|----------|
| `commands/test.toml` | `/test` |
| `commands/git/commit.toml` | `/git:commit` |

---

## 3. TOML 檔案格式

### 必要欄位

```toml
prompt = """
你的 prompt 內容
"""
```

### 可選欄位

```toml
description = "指令說明，顯示於 /help 選單"
```

---

## 4. 參數處理

### 4.1 明確注入：`{{args}}`

當 prompt 包含 `{{args}}` 時，使用者輸入會**替換**該佔位符。

```toml
# /fix "Button is misaligned"
prompt = "請修正此問題：{{args}}"
# → 請修正此問題："Button is misaligned"
```

### 4.2 預設附加行為

當 prompt **不包含** `{{args}}` 時：
- 有參數：附加到 prompt 末尾（以兩個換行分隔）
- 無參數：prompt 原樣發送

```toml
# /changelog 1.2.0 added "New feature"
prompt = """
# Task: Update Changelog
解析使用者輸入的版本、類型、訊息...
"""
# → prompt 內容 + \n\n + "/changelog 1.2.0 added \"New feature\""
```

---

## 5. 動態注入

### 5.1 Shell 指令注入：`!{...}`

執行 shell 指令並注入其輸出。

```toml
prompt = """
根據以下 git diff 生成 commit message：
```diff
!{git diff --staged}
```
"""
```

**特性：**
- 執行前會提示使用者確認
- `{{args}}` 在 `!{...}` 內會自動進行 shell 跳脫
- 指令失敗時會注入錯誤訊息與退出碼

### 5.2 檔案內容注入：`@{...}`

直接將檔案或目錄內容嵌入 prompt。

```toml
prompt = """
根據以下最佳實務審查 {{args}}：
@{docs/best-practices.md}
"""
```

**特性：**
- 支援多媒體檔案（圖片、PDF、音訊、影片）
- 目錄會遞迴展開，尊重 `.gitignore` 與 `.geminiignore`
- 處理順序：`@{...}` → `!{...}` → `{{args}}`

---

## 6. 完整範例

### 範例 1：Git Commit 訊息生成

```toml
# .gemini/commands/git/commit.toml
# 使用方式：/git:commit

description = "根據 staged changes 生成 Git commit message"

prompt = """
請根據以下 git diff 生成 Conventional Commit 訊息：

```diff
!{git diff --staged}
```
"""
```

### 範例 2：程式碼審查

```toml
# .gemini/commands/review.toml
# 使用方式：/review FileCommandLoader.ts

description = "根據最佳實務審查程式碼"

prompt = """
你是專業的程式碼審查員。請審查 {{args}}。

審查時請參考以下最佳實務：
@{docs/best-practices.md}
"""
```

### 範例 3：批判性分析（條件式參數）

```toml
# .gemini/commands/critique.toml
# 使用方式：/critique [可選的分析目標]

description = "對指定目標或前一個回應進行批判性分析"

prompt = """
進入批判性思考模式。

## 分析目標

{{args}}

**判斷規則：**
- 若上方有內容，以該內容為分析目標
- 若無內容，分析本對話中的前一個回應

...後續分析框架...
"""
```

---

## 7. 設計建議

1. **明確角色定義**：在 prompt 開頭設定 AI 的角色與專業背景
2. **結構化輸出**：使用標題與編號引導回應格式
3. **條件式區塊**：對可選功能標註適用條件
4. **參考專案脈絡**：結合 `@{...}` 注入專案規範或文件
5. **動態資料**：善用 `!{...}` 取得即時環境資訊
