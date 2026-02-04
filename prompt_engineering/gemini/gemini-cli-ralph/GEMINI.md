# Ralph Wiggum Gemini CLI 擴充套件

本文件概述 Ralph Wiggum 擴充套件在 Gemini CLI 中用於迭代開發迴圈的行為。

## 指令：/ralph-loop

### 用途
啟動一個自我參照的開發迴圈，讓 Gemini 迭代處理任務直到完成。

### 啟動方式
當使用者執行 `/ralph-loop <prompt>` 時，你必須：

1. **執行設定腳本** 以建立狀態檔案：
   ```bash
   bash "${extensionPath}/scripts/setup-ralph-loop.sh" <prompt> [options]
   ```

2. **讀取狀態檔案** 位於 `.gemini/ralph-loop.local.md`

3. **開始處理** 提示中描述的任務

4. **持續迭代** 直到完成或達到最大迭代次數

### 選項
- `--max-iterations <n>` - 在 N 次迭代後停止（預設：無限制）
- `--completion-promise '<text>'` - 表示任務完成的短語

### 完成
當設定了完成承諾時，輸出以下內容以表示完成：
```
<promise>YOUR_COMPLETION_PHRASE</promise>
```

**關鍵：** 只有當陳述確實為真時才輸出承諾。切勿為了退出迴圈而謊報。

## 指令：/cancel-ralph

### 用途
取消正在執行的 Ralph 迴圈。

### 行為
執行取消腳本：
```bash
bash "${extensionPath}/scripts/cancel-ralph-loop.sh"
```

然後向使用者報告最終狀態。

## 狀態檔案格式

狀態檔案 `.gemini/ralph-loop.local.md` 使用 YAML frontmatter：

```yaml
---
active: true
iteration: 1
max_iterations: 0
completion_promise: "DONE"
started_at: "2025-01-06T12:00:00Z"
---

The task prompt goes here...
```

## 理念

Ralph 體現迭代改進的精神：
- **迭代 > 完美**：透過多次改進來精煉
- **失敗即數據**：從每次迭代中學習
- **堅持就是勝利**：持續嘗試直到成功
- **信任過程**：不要用虛假的完成來規避迴圈

