# GitHub Repository Writer - Code Review

將程式碼審查報告寫入遠端 GitHub 儲存庫。

## 任務

將使用者提供的程式碼審查報告寫入或更新到 GitHub 儲存庫 `changgenglu/changgenglu-blog` 的 `code-review/` 目錄中。

## 輸入參數

使用者輸入：`{{ args }}`

## 執行步驟

1. 分析使用者的輸入 `{{ args }}`
   - 識別目標檔案名稱（若未提供，生成帶時間戳記的檔案名稱，如 `review_YYYY-MM-DD.md`）
   - 識別報告內容
2. 使用 `create_or_update_file` 工具
3. 參數設定：
   - `owner`: `changgenglu`
   - `repo`: `changgenglu-blog`
   - `path`: `code-review/<filename>`
   - `content`: 報告內容
   - `message`: `Add code review report: <filename>`
   - `branch`: `master`（或預設分支）
4. 完成後回報寫入的檔案路徑與狀態
