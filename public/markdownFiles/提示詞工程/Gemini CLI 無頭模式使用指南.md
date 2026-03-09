# Gemini CLI 無頭模式使用指南

## 什麼是無頭模式？

無頭模式（Headless Mode）讓 Gemini CLI 以非互動方式執行，適用於：
- **CI/CD**：自動分析 Pull Request
- **批次處理**：批量摘要日誌檔案
- **工具建構**：建立自訂的 AI 包裝腳本
- **技能驗證**：驗證 Agent Skills 是否正確安裝

---

## 基本用法

### 使用 `-p` 旗標（推薦）

```bash
gemini -p "你的提示詞"
```

> **⚠️ 重要提醒**：舊版文件可能提到使用位置參數（positional argument）觸發無頭模式，但目前版本**位置參數預設進入互動模式**。必須使用 `-p`（`--prompt`）旗標才能進入無頭模式。

### 管道輸入

```bash
# 管道檔案內容
cat error.log | gemini -p "解釋為什麼失敗"

# 管道指令輸出
git diff | gemini -p "為這些變更寫一個 commit message"
```

### 輸出格式

```bash
# JSON 格式輸出
gemini -p "分析這段程式碼" --output-format json

# 串流 JSON 輸出（JSONL）
gemini -p "分析這段程式碼" --output-format streaming-json
```

---

## 實戰踩坑紀錄

以下是在使用無頭模式驗證 Agent Skills 安裝時遇到的問題與解法。

### 問題 1：位置參數不會進入無頭模式

**症狀：**
```bash
gemini "列出你的 skills"
```
執行後進入了互動模式（出現 ASCII Logo、對話介面），而非預期的無頭模式。

**原因：**
CLI 版本更新後，位置參數的行為已改變。啟動時會顯示提示：
```
ℹ Positional arguments now default to interactive mode.
  To run in non-interactive mode, use the --prompt (-p) flag.
```

**解法：**
```bash
gemini -p "列出你的 skills"
```

---

### 問題 2：WSL 環境中 `gemini` 指令找不到

**症狀：**
```bash
wsl bash -c 'gemini --help'
# bash: gemini：命令找不到
```

**原因：**
`gemini` 是透過 nvm 管理的 Node.js 全域套件安裝，非互動式 bash（`bash -c`）不會載入 `~/.bashrc` 中的 nvm 初始化腳本，導致 PATH 中沒有 nvm 管理的 bin 目錄。

**解法 1：直接設定 PATH**
```bash
wsl bash -c 'export PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" && gemini -p "你的提示詞"'
```

**解法 2：使用互動式 bash（但有轉義問題）**
```bash
wsl bash -ic 'gemini -p "你的提示詞"'
```
> 注意：`-ic` 模式下 PowerShell 的引號轉義可能產生問題，建議使用解法 1。

**排查指令：** 找出 gemini 實際安裝位置
```bash
wsl bash -c 'find $HOME/.nvm -name "gemini" -type f 2>/dev/null'
```

---

### 問題 3：PowerShell 中的跨平台指令差異

**症狀：**
```powershell
# PowerShell 中直接輸入也找不到
gemini --version
# gemini: The term 'gemini' is not recognized...
```

**原因：**
`gemini` 安裝在 WSL 的 Linux 環境中，Windows PowerShell 的 PATH 不包含 WSL 內的路徑。

**解法：** 統一透過 `wsl` 前綴執行
```powershell
wsl bash -c 'export PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" && gemini -p "你的提示詞"'
```

---

### 問題 4：技能衝突警告

**症狀：**
```
⚠ Skill conflict detected: "auto-skill" from 
  "/home/dev/.agents/skills/auto-skill/SKILL.md" 
  is overriding the same skill from 
  "/home/dev/.gemini/skills/auto-skill/SKILL.md".
```

**原因：**
同一個技能同時存在於 `.agents/skills/` 和 `.gemini/skills/` 兩個目錄中。Gemini CLI 會掃描多個技能目錄，當發現同名技能時發出衝突警告。

**解法：** 移除重複的技能，只保留一個位置的版本：
```bash
# 保留 .agents/skills/ 的版本，移除 .gemini/skills/ 的
rm -rf ~/.gemini/skills/auto-skill
```

---

## Exit Code 參考

| Exit Code | 說明 |
|-----------|------|
| `0` | 成功 |
| `1` | 一般錯誤或 API 失敗 |
| `42` | 輸入錯誤（無效提示或參數） |
| `53` | 超過回合限制 |

---

## 實用範例

### 驗證 Agent Skills 是否被正確載入

```bash
gemini -p "列出你目前可用的所有 agent skills 的名稱"
```

### 驗證特定 Skill 檔案是否可讀取

```bash
gemini -p "讀取 .agents/skills/superpowers/SKILL.md 的內容並摘要"
```

### 搭配 JSON 輸出進行腳本處理

```bash
gemini -p "分析 @package.json 並回傳 JSON" --output-format json | jq -r '.response'
```

### 批次處理多個檔案

```bash
for file in src/*.ts; do
  echo "分析 $file..."
  gemini -p "審查此檔案的程式碼品質 @$file" >> review_results.md
done
```

---

## 參考來源

- [Gemini CLI 無頭模式文件](https://geminicli.com/docs/cli/headless/)
- [自動化教學](https://geminicli.com/docs/cli/tutorials/automation)
- [CLI 參考文件](https://geminicli.com/docs/cli/cli-reference)
