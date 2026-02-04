#!/bin/bash

# Ralph 迴圈取消腳本（適用於 Gemini CLI）
# 將迴圈狀態設為非活動

set -euo pipefail

STATE_FILE=".gemini/ralph-loop.local.md"

if [[ ! -f "$STATE_FILE" ]]; then
  echo "❌ 找不到正在執行的 Ralph 迴圈" >&2
  echo "   狀態檔案不存在：$STATE_FILE" >&2
  exit 1
fi

# 從狀態檔案讀取目前迭代次數
ITERATION=$(grep '^iteration:' "$STATE_FILE" | sed 's/iteration: *//')

# 更新狀態檔案，將 active 設為 false
if [[ "$(uname)" == "Darwin" ]]; then
  # macOS sed 在 -i 後需要空字串
  sed -i '' 's/^active: true$/active: false/' "$STATE_FILE"
else
  # GNU sed
  sed -i 's/^active: true$/active: false/' "$STATE_FILE"
fi

echo "✅ Ralph 迴圈已取消"
echo ""
echo "最終迭代次數：${ITERATION:-未知}"
echo "狀態檔案：$STATE_FILE"

