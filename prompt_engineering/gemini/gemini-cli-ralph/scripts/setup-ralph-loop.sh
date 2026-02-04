#!/bin/bash

# Ralph 迴圈設定腳本（適用於 Gemini CLI）
# 建立會話內 Ralph 迴圈的狀態檔案

set -euo pipefail

# 解析參數
PROMPT_PARTS=()
MAX_ITERATIONS=0
COMPLETION_PROMISE="null"

while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      cat << 'HELP_EOF'
Ralph 迴圈 - Gemini CLI 的互動式自我參照開發迴圈

用法：
  /ralph-loop [PROMPT...] [OPTIONS]

參數：
  PROMPT...    啟動迴圈的初始提示

選項：
  --max-iterations <n>           自動停止前的最大迭代次數（預設：無限制）
  --completion-promise '<text>'  完成承諾短語（多字詞請使用引號）
  -h, --help                     顯示此說明訊息

範例：
  /ralph-loop Build a todo API --completion-promise 'DONE' --max-iterations 20
  /ralph-loop --max-iterations 10 Fix the auth bug
  /ralph-loop Refactor cache layer
HELP_EOF
      exit 0
      ;;
    --max-iterations)
      if [[ -z "${2:-}" ]] || ! [[ "$2" =~ ^[0-9]+$ ]]; then
        echo "❌ 錯誤：--max-iterations 需要一個正整數" >&2
        exit 1
      fi
      MAX_ITERATIONS="$2"
      shift 2
      ;;
    --completion-promise)
      if [[ -z "${2:-}" ]]; then
        echo "❌ 錯誤：--completion-promise 需要一個文字參數" >&2
        exit 1
      fi
      COMPLETION_PROMISE="$2"
      shift 2
      ;;
    *)
      PROMPT_PARTS+=("$1")
      shift
      ;;
  esac
done

PROMPT="${PROMPT_PARTS[*]}"

if [[ -z "$PROMPT" ]]; then
  echo "❌ 錯誤：未提供提示" >&2
  echo "用法：/ralph-loop <prompt> [--max-iterations N] [--completion-promise 'text']" >&2
  exit 1
fi

mkdir -p .gemini

if [[ -n "$COMPLETION_PROMISE" ]] && [[ "$COMPLETION_PROMISE" != "null" ]]; then
  COMPLETION_PROMISE_YAML="\"$COMPLETION_PROMISE\""
else
  COMPLETION_PROMISE_YAML="null"
fi

cat > .gemini/ralph-loop.local.md <<EOF
---
active: true
iteration: 1
max_iterations: $MAX_ITERATIONS
completion_promise: $COMPLETION_PROMISE_YAML
started_at: "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
---

$PROMPT
EOF

cat <<EOF
🔄 Ralph 迴圈已啟動！

迭代次數：1
最大迭代次數：$(if [[ $MAX_ITERATIONS -gt 0 ]]; then echo $MAX_ITERATIONS; else echo "無限制"; fi)
完成承諾：$(if [[ "$COMPLETION_PROMISE" != "null" ]]; then echo "$COMPLETION_PROMISE"; else echo "無"; fi)

監控狀態：cat .gemini/ralph-loop.local.md
取消迴圈：/cancel-ralph

EOF

echo "$PROMPT"

if [[ "$COMPLETION_PROMISE" != "null" ]]; then
  echo ""
  echo "完成時請輸出：<promise>$COMPLETION_PROMISE</promise>"
  echo "僅在陳述確實為真時才輸出！"
fi

