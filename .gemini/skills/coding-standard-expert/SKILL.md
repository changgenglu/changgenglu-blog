---
name: "coding-standard-expert"
description: "Activates when user requests code review for team coding standards, naming conventions, validation rules, or enum best practices. Do NOT use for basic indentation/whitespace checks (handled by linter). Examples: 'Check for array format violations', 'Validate naming conventions'."
---

# Coding Standard Expert Skill

## 🧠 Expertise

Coding Style 守門員，專精於語意化命名、陣列結構規範、Validation 與 Enum 最佳實務。

> **核心原則**：一致性、可讀性、可維護性。

---

## 1. 命名規範 (Naming Conventions)

### 1.1 變數與常數

| 類型 | 規則 | 正確範例 | 錯誤範例 |
|-----|------|---------|---------|
| **變數** | **camelCase** | `$userEmail` | `$user_email`, `$UserEmail` |
| **陣列(單筆)** | **單數** | `$user = []` | `$users = []` (若僅含一筆) |
| **陣列(多筆)** | **複數** | `$userIds = []` | `$userId = []` (若含多筆) |
| **常數** | **UPPER_SNAKE_CASE** | `MAX_COUNT` | `MaxCount`, `max_count` |

### 1.2 函數與方法

- **動作導向**：必須以 **動詞** 開頭。
- **List 方法**：若回傳列表，動詞應加 `s` 或名詞複數。
- **格式**：**camelCase**。

```php
// ✅ 正確
public function getUserById($id) { }
public function createOrder($data) { }
public function gameListsByPlatform($platform) { } // List 相關加 s

// ❌ 錯誤
public function userById($id) { }           // 缺少動詞
public function gameListByPlatform() { }    // List 應加 s
```

---

## 2. 陣列使用規範 (Array Usage)

### 2.1 語法與結構

- **宣告**：統一使用短陣列語法 `[]`，禁止 `array()`。
- **多行陣列**：
  - 結尾逗號：**必須**包含（Trailing Comma）。
  - 縮排：內容向右縮排一個 Tab。
  - 對齊：結束括號 `]` 與變數宣告對齊。

```php
// ✅ 正確
$users = [
    'Test1',
    'Test2', // 結尾逗號
];

// ❌ 錯誤
$users = array(); // 禁止舊式寫法
$users = [
    'Test1',
    'Test2'  // 缺少結尾逗號
    ];       // 對齊錯誤
```

### 2.2 鍵值對

- **格式**：`=>` 前後需有空格。
- **多行**：鍵值對陣列建議多行撰寫。

---

## 3. Validation Rules 規範

### 3.1 陣列格式強制

在 Controller 與 FormRequest 中，驗證規則 **必須使用陣列格式**，禁止使用管道符號 `|` 字串格式。

**理由**：
- 可讀性更高
- 易於 diff 與維護
- 支援物件與閉包規則

```php
// ✅ 正確
$request->validate([
    'email' => [
        'required',
        'email',
        Rule::unique('users')->ignore($id),
    ],
    'type' => [ 'required', 'in:a,b,c' ],
]);

// ❌ 錯誤
$request->validate([
    'email' => 'required|email|unique:users', // 禁止字串格式
]);
```

---

## 4. Enum 使用規範

### 4.1 命名與結構

- **類別命名**：**PascalCase** (大駝峰)，如 `OrderStatus`。
- **檔案位置**：`app/Enums/`。

### 4.2 實作要求 (PHP 8.1+ Backed Enum)

Enum 必須包含業務邏輯方法，而非僅是純資料：

1.  **getLabel()**：回傳顯示用的文字（如 '已出貨'）。
2.  **getColor()**：回傳前端顯示顏色（如 'success', 'danger'）。
3.  **static getOptions()**：回傳 `value => label` 陣列，供前端選單使用。

```php
enum OrderStatus: string
{
    case PENDING = 'pending';
    
    public function getLabel(): string
    {
        return match($this) {
            self::PENDING => '待處理',
        };
    }
}
```

---

## 5. 控制結構細節

雖然 IDE/Linter 會處理大部分格式，但需注意語意相關的結構：

- **Switch**：每個 `case` 必須有 `break`（除非有註解 `// no break`）。
- **Foreach**：
  - 簡單迭代使用 `$item`。
  - 鍵值迭代使用 `$key => $value`。
  - 變數名稱應具備業務語意（如 `$productId => $productData`）。

---

## 6. 審查檢查清單

- [ ] 變數是否使用 camelCase？
- [ ] 驗證規則是否為陣列格式？
- [ ] 方法名稱是否以動詞開頭？
- [ ] Enum 是否包含 Label/Color 方法？
- [ ] 陣列是否使用 `[]` 且有多行結尾逗號？
