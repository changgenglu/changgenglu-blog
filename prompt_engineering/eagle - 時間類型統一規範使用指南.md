# eagle - 時間類型統一規範使用指南

## 核心原則

**統一規範**：

- 資料庫欄位類型：`DATETIME`
- 應用層時區：`Asia/Taipei (+08:00)`
- API 回傳格式：`ISO 8601` 含時區（如 `2025-12-17T10:30:00+08:00`）

---

## 一、Migration 建立規範

### 標準寫法

```php
use Illuminate\\Support\\Facades\\DB;

Schema::create('members', function (Blueprint $table) {
    // 一般時間欄位
    $table->dateTime('start_at')->nullable();

    // created_at / updated_at 固定寫法（取代 $table->timestamps()）
    $table->dateTime('created_at')->useCurrent();
    $table->dateTime('updated_at')->default(DB::raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    $table->softDeletesDateTime('deleted_at');
});

```

---

## 二、Model 設定規範

### 必要設定

- 繼承 AbstractModel
- 定義所有時間欄位 $dateFields

```php
<?php

namespace App\\Models;

// 繼承 AbstractModel（非 Model）
class Order extends AbstractModel
{
    protected $fillable = [
        'amount',
        'paid_at',
        'expired_at',
    ];

    // 【必填】定義所有時間欄位
    protected array $dateFields = [
        'paid_at',
        'expired_at',
        'created_at',
        'updated_at',
    ];

    // 【必填】cast 為 datetime
    protected function casts(): array
    {
        return [
            'paid_at' => 'datetime',
            'expired_at' => 'datetime',
        ];
    }
}

```

### 為什麼要定義 $dateFields？

| 操作方式 | 語法 | 是否自動轉換 | 依賴 |
| --- | --- | --- | --- |
| Eloquent 操作 | `$model->save()` | ✅ 自動 | Laravel 內建 |
| Eloquent 操作 | `$model->update([...])` | ✅ 自動 | Laravel 內建 |
| Eloquent 操作 | `Model::create([...])` | ✅ 自動 | Laravel 內建 |
| Query Builder 操作 | `Model::where()->update([...])` | ✅ 自動 | **需要 $dateFields** |
| Query Builder 操作 | `Model::insert([...])` | ✅ 自動 | **需要 $dateFields** |
| Query Builder 操作 | `Model::upsert([...])` | ✅ 自動 | **需要 $dateFields** |
| DB Facade 操作 | `DB::table()->update([...])` | ❌ 手動 | 不經過 Model |

---

## 三、Eloquent 操作 - 自動轉換

以下操作**不需要手動處理**，系統自動轉換：

```php
// 建立
$order = Order::create([
    'amount' => 100,
    'paid_at' => now(),  // 自動轉換
]);

// 單筆更新（透過 Model 實例）
$order->paid_at = now();
$order->save();  // 自動轉換

// 單筆更新（透過 update 方法）
$order->update([
    'paid_at' => now(),  // 自動轉換
]);

```

---

## 四、Query Builder 操作 - 自動轉換（需 $dateFields）

以下操作透過 `CustomEloquentBuilder` **自動轉換**：

```php
// 批量更新
Order::where('status', 'pending')
    ->update([
        'paid_at' => now(),  // 自動轉換（因為有 $dateFields）
    ]);

// 批量插入
Order::insert([
    ['amount' => 100, 'paid_at' => now(), 'created_at' => now()],
    ['amount' => 200, 'paid_at' => now(), 'created_at' => now()],
]);  // 自動轉換

// Upsert
Order::upsert(
    [['id' => 1, 'paid_at' => now()]],
    ['id'],
    ['paid_at']
);  // 自動轉換

```

---

## 五、DB Facade 操作 - 需手動轉換

直接使用 `DB::table()` **不經過 Model**，需手動處理：

```php
use Carbon\\Carbon;

// ❌ 錯誤：不會自動轉換
DB::table('orders')->update([
    'paid_at' => now(),
]);

// ✅ 正確：手動格式化
DB::table('orders')->update([
    'paid_at' => now()->format('Y-m-d H:i:s.u'),
]);

// ✅ 或使用 Carbon
DB::table('orders')->update([
    'paid_at' => Carbon::now('Asia/Taipei')->format('Y-m-d H:i:s.u'),
]);

```

---

## 六、資料讀取 - 為什麼轉成 Carbon？

### 讀取流程

```
資料庫 (字串) → asDateTime() → Carbon 實例 → 程式使用

```

### 為什麼用 Carbon？

```php
$order = Order::find(1);

// Carbon 提供豐富的時間操作方法
$order->paid_at->addDays(7);           // 加 7 天
$order->paid_at->diffForHumans();      // "3 天前"
$order->paid_at->isToday();            // 是否今天
$order->paid_at->format('Y-m-d');      // 格式化輸出
$order->paid_at->timestamp;            // 取得時間戳

// 時區操作
$order->paid_at->timezone;             // Asia/Taipei
$order->paid_at->setTimezone('UTC');   // 轉換時區

```

### 讀取時自動轉換的欄位

- `$casts` 中定義為 `datetime` 的欄位
- `created_at`、`updated_at`（Laravel 自動處理）

---

## 七、API 回傳格式

### 自動轉換情境

當 Model **直接序列化為 JSON** 時，會自動調用 `serializeDate()` 方法：

```php
// ✅ 自動轉換 - 直接回傳 Model
return response()->json($order);
// 輸出：{"paid_at": "2025-12-17T10:30:00+08:00", ...}

// ✅ 自動轉換 - 回傳 Model Collection
return response()->json(Order::all());

// ✅ 自動轉換 - Model 的 toArray() / toJson()
$order->toArray();
$order->toJson();

// ✅ 自動轉換 - 直接回傳 Model（Laravel 自動轉 JSON）
return Order::find(1);

```

**自動轉換輸出格式**：`2025-12-17T10:30:00+08:00`（ISO 8601 含時區）

### 手動轉換情境

在 **Resource** 中需要手動調用格式化方法：

```php
class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // ✅ 使用 toIso8601String()
        return [
            'paid_at' => $this->paid_at?->toIso8601String(),
            // 輸出：{"paid_at": "2025-12-17T10:30:00+08:00"}
        ];
    }
}

```

### 對照表

| 回傳方式 | 是否自動轉換 | 範例 |
| --- | --- | --- |
| `response()->json($model)` | ✅ 自動 | 直接回傳 Model |
| `response()->json($collection)` | ✅ 自動 | 回傳 Collection |
| `return $model` | ✅ 自動 | Controller 直接回傳 |
| `$model->toArray()` | ✅ 自動 | 轉陣列 |
| `$model->toJson()` | ✅ 自動 | 轉 JSON 字串 |
| **Resource** 中的時間欄位 | ❌ 手動 | 需調用 `toIso8601String()` |
| 自訂陣列組裝 | ❌ 手動 | 需調用 `toIso8601String()` |

### 輸出格式對照

| 方法 | 輸出 | 說明 |
| --- | --- | --- |
| `toIso8601String()` | `2025-12-17T10:30:00+08:00` | ✅ 標準格式 |
| `toISOString()` | `2025-12-17T02:30:00.000000Z` | ❌ UTC 格式 |
| `toDateTimeString()` | `2025-12-17 10:30:00` | 無時區資訊 |
| `format('Y-m-d H:i:s')` | `2025-12-17 10:30:00` | 自訂格式 |

---

## 八、轉換機制總覽

```
┌─────────────────────────────────────────────────────────────────┐
│                        寫入流程                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Eloquent 操作                    Query Builder 操作             │
│  ─────────────                    ──────────────────            │
│  Model::create()                  Model::where()->update()      │
│  $model->save()                   Model::insert()               │
│  $model->update()                 Model::upsert()               │
│       │                                  │                      │
│       ▼                                  ▼                      │
│  fromDateTime()                   CustomEloquentBuilder         │
│  (Laravel 內建)                   (依賴 $dateFields)            │
│       │                                  │                      │
│       └──────────────┬───────────────────┘                      │
│                      ▼                                          │
│              Y-m-d H:i:s.u 格式                                 │
│                      │                                          │
│                      ▼                                          │
│                  資料庫儲存                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        讀取流程                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  資料庫 (DATETIME 字串)                                         │
│       │                                                         │
│       ▼                                                         │
│  asDateTime() 轉換                                              │
│       │                                                         │
│       ▼                                                         │
│  Carbon 實例 (Asia/Taipei 時區)                                 │
│       │                                                         │
│       ├───────────────┬────────────────┐                        │
│       ▼               ▼                ▼                        │
│  程式邏輯運算    API 序列化       JSON 回傳                      │
│  (直接使用)     serializeDate()  toIso8601String()              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

```

---

## 九、快速檢查清單

新增功能時，確認以下項目：

| 項目 | 檢查內容 |
| --- | --- |
| Migration | 使用 `dateTime()` 非 `timestamp()` |
| Migration | created_at/updated_at 用標準寫法 |
| Model | 繼承 `AbstractModel` |
| Model | 定義 `$dateFields` 包含所有時間欄位 |
| Model | `$casts` 中時間欄位設為 `datetime` |
| Resource | 使用 `toIso8601String()` |
| DB Facade | 手動 `format('Y-m-d H:i:s.u')` |