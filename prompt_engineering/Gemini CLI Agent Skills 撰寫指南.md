## Gemini CLI Agent Skills 撰寫指南

本指南旨在協助開發者為 Agent 構建高精準度、低幻覺（Hallucination）的技能（Skills）。

### 1. 核心結構 (The Anatomy of a Skill)

一個標準的 Skill 通常包含三個關鍵部分，缺一不可：

* **Skill Name (函數名稱)**：AI 識別工具的唯一 ID。
* **Description (功能描述)**：這是最重要的部分，AI 透過這段文字理解「這是什麼」以及「什麼時候該用」。
* **Parameters Schema (參數定義)**：告訴 AI 需要提取哪些資訊來執行任務。

---

## 🚀 最佳實踐與設計規範

以下是用於撰寫高品質 Skill 的具體規範：

### 2.1 命名規範 (Naming Conventions)

* **動詞開頭**：使用清晰的 `動詞_名詞` 格式。
* ✅ `get_current_weather`, `execute_sql_query`, `search_knowledge_base`
* ❌ `weather`, `sql`, `search`


* **避免歧義**：名稱應能自解釋，避免重疊。

### 2.2 描述撰寫 (Description Engineering)

這是 AI 的「提示詞（Prompt）」。寫得越好，AI 調用越準確。

* **包含場景**：說明在什麼情況下應該使用此工具。
* **包含限制**：說明此工具**不能**做什麼。
* **範例說明**：如果是複雜格式，在描述中加入範例。

> **範例對比：**
> * *差勁的描述*："Get weather."
> * *優秀的描述*："Retrieves the current weather conditions for a specific city. Use this when the user asks about temperature, rain, or forecast. Requires a city name and optional country code."
> 
> 

### 2.3 參數定義 (Parameter Constraints)

不要相信 AI 會自動猜對格式，必須透過 Schema 強制約束。

* **使用 Enum (枚舉)**：若參數只有固定幾個選項（如 `units`: 'celsius' | 'fahrenheit'），務必使用 Enum 鎖定，防止 AI 創造不存在的選項。
* **必填 vs 選填**：明確標記 `Required` 欄位。
* **詳細的參數描述**：每個參數都應有 `description`，解釋預期的格式（如："ISO 8601 date format" 或 "City name, not zip code"）。

---

## 🛠️ 實作範例 (Implementation Pattern)

如果你正在編寫 JavaScript/TypeScript (常見於 geminicli 擴充) 或 Python 技能，請參考以下範例結構。

### ## 📌 指令內容 (Skill Definition Example)

這是給開發者參考的標準 Skill 定義模板（以 JSON Schema/TypeScript 為例）：

```typescript
// 定義一個 "獲取股票價格" 的 Skill
const getStockPriceSkill = {
  name: "get_stock_price",
  description: "Retrieves the real-time or closing price of a specific stock symbol. Use this when the user asks for 'current price', 'stock value', or market data. Do NOT use for cryptocurrency.",
  parameters: {
    type: "OBJECT",
    properties: {
      symbol: {
        type: "STRING",
        description: "The stock ticker symbol (e.g., AAPL, GOOGL, TSLA). Must be uppercase."
      },
      market: {
        type: "STRING",
        enum: ["US", "HK", "TW"],
        description: "The stock market region. Defaults to 'US' if not specified."
      }
    },
    required: ["symbol"]
  }
};

```

### ## 📖 設計原理

1. **防禦性描述 (Defensive Description)**：
* 加入了 "Do NOT use for cryptocurrency"（禁止用於加密貨幣）。這是一種**負向約束**，防止 AI 在遇到 "Bitcoin price" 時錯誤調用此工具，減少執行錯誤。


2. **參數枚舉 (Enum Constraints)**：
* `market` 參數被限制為 `["US", "HK", "TW"]`。這確保了後端 API 收到的區域代碼永遠是合法的，AI 不會產生 "United States" 這種無法解析的字串。


3. **預設值邏輯**：
* 在描述中暗示 "Defaults to 'US'"，引導 AI 在使用者未提供市場時，可以忽略此參數或填入預設值。



---

## 💡 進階技巧：如何讓 AI 幫你寫 Skills？

你可以使用以下 Prompt 讓 Gemini 幫你將一般程式碼轉換為 Gemini CLI 可用的 Skill 定義。

**Prompt 範本：**

```markdown
你是 Gemini CLI 的技能開發專家。請將我提供的以下功能需求，轉換為符合 Google Generative AI `FunctionDeclaration` (JSON Schema) 格式的 Skill 定義。

**需求：**
[在此貼上你的功能，例如：寫一個可以查詢特定 IP 地址地理位置的工具]

**要求：**
1. **Name**：使用 snake_case，動詞開頭。
2. **Description**：詳細說明用途、使用時機以及輸入限制。
3. **Parameters**：提供精確的類型、描述，並盡可能使用 Enum 來限制選項。
4. **Output**：請以 JSON 格式輸出。

```

---

## 🔗 參考來源

* **Gemini CLI Skills Documentation**: [https://geminicli.com/docs/cli/skills/](https://geminicli.com/docs/cli/skills/)
* **Google Gemini API - Function Calling**: [https://ai.google.dev/gemini-api/docs/function-calling](https://ai.google.dev/gemini-api/docs/function-calling) (官方底層原理)
* **OpenAI Cookbook - Function Calling Best Practices**: 雖然是 OpenAI 文件，但在參數描述（Description Engineering）上的邏輯與 Gemini 高度通用。
