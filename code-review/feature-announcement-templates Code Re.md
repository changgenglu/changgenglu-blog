# feature-announcement-templates Code Review (2026-01-19)

> **審查日期**: 2026-01-19
>
> **分支名稱**: feature-announcement-templates
>
> **審查者**: Claude AI

---

## 修改範圍總覽

### 新增檔案

| --- | --- | --- |
| `app/Http/Controllers/AnnouncementTemplateController.php` | 809 | 公告模版控制器 |
| `app/Models/AnnouncementTemplate.php` | 54 | 公告模版 Model |
| `app/Models/AnnouncementTemplateContent.php` | 45 | 公告模版內容 Model |
| `app/Services/AnnouncementTemplate.php` | 198 | 公告模版 Service |
| `database/migrations/.../create_announcement_templates_table.php` | 39 | 模版資料表 Migration |
| `database/migrations/.../create_announcement_template_contents_table.php` | 42 | 模版內容資料表 Migration |

### 修改檔案

| 檔案路徑                                            | 說明                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------ |
| `app/Interfaces/IAnnouncement.php`                  | 重新命名常數 MAINTAIN_SUBTYPE_PROVIDER → MAINTAIN_SUBTYPE_PLATFORM |
| `public/apidoc/[errorCode.md](http://errorCode.md)` | 新增錯誤碼文件                                                     |
| `resources/lang/*/error.php`, `error_dict.php`      | 新增錯誤訊息 (en, zh-cn, zh-tw)                                    |
| `routes/api.php`                                    | 新增 10 條 API 路由                                                |

---

## 檢查結果摘要

| 檢查類別         | 結果      | 嚴重問題數 | 中等問題數 | 輕微問題數 |
| ---------------- | --------- | ---------- | ---------- | ---------- |
| 程式碼結構與設計 | ⚠️ 需改善 | 2          | 1          | 0          |
| 程式碼品質       | ⚠️ 需改善 | 1          | 2          | 1          |
| 功能正確性       | ✅ 良好   | 0          | 1          | 0          |
| 安全性           | ✅ 良好   | 0          | 1          | 0          |
| 效能             | ⚠️ 需改善 | 0          | 2          | 0          |
| 可測試性         | ⚠️ 需改善 | 1          | 1          | 0          |

**總計**: 4 個嚴重問題, 8 個中等問題, 1 個輕微問題

---

## 詳細審查報告

### 1. 程式碼結構與設計

#### 🔴 嚴重: 違反 SRP (單一職責原則)

**位置**: `AnnouncementTemplateController.php:61-129`, `169-234`

**問題描述**: Controller 包含大量業務邏輯驗證，應移至 Service 層處理。

**違規代碼範例**:

```php
// ❌ Controller 中直接進行業務邏輯驗證
$provider = app('Service')->init('Providers')->get($validated['provider_id']);
if (! $provider) {
    throw new \App\Exceptions\NotFoundException('no_such_provider');
}

if (! in_array($validated['type'], IAnnouncement::TYPE_LISTS)) {
    throw new \App\Exceptions\NotFoundException('no_such_announcement_type');
}

$templateService = app('Service')->init('AnnouncementTemplate');
if (! $templateService->checkType($validated['type'], $validated['sub_type'] ?? 0)) {
    throw new \App\Exceptions\NotFoundException('no_such_announcement_sub_type');
}
```

**建議修正**:

```php
// ✅ Controller 只負責接收請求和回傳結果
public function createByBackend(Request $request)
{
    $validated = $this->validate($request, [...]);

    $templateService = app('Service')->init('AnnouncementTemplate');
    $template = $templateService->createForProvider(
        $validated['provider_id'],
        $validated
    );

    return $template;
}

// ✅ Service 層處理所有業務邏輯
class AnnouncementTemplate
{
    public function createForProvider(int $providerId, array $data): Model
    {
        // 業務邏輯驗證
        $provider = $this->providerService->get($providerId);
        if (! $provider) {
            throw new NotFoundException('no_such_provider');
        }

        $this->validateType($data['type'], $data['sub_type'] ?? 0);
        $this->validateLanguages($provider['langs'], $data['contents']);

        // 執行建立邏輯...
    }
}
```

---

#### 🔴 嚴重: 違反 DRY 原則 (重複程式碼)

**位置**: 整個 `AnnouncementTemplateController.php`

**問題描述**: Backend 和 Agent 的方法幾乎完全重複，僅差異在取得 provider_id 的方式。

**重複代碼對照**:

| Backend 方法             | Agent 方法             | 重複率 |
| ------------------------ | ---------------------- | ------ |
| `createByBackend` (68行) | `createByAgent` (65行) | ~90%   |
| `editByBackend` (90行)   | `editByAgent` (86行)   | ~90%   |
| `getByBackend` (21行)    | `getByAgent` (17行)    | ~85%   |
| `deleteByBackend` (23行) | `deleteByAgent` (19行) | ~85%   |
| `listsByBackend` (40行)  | `listsByAgent` (36行)  | ~85%   |

**建議修正**:

```php
// ✅ 使用私有方法抽取共用邏輯
public function createByBackend(Request $request)
{
    $validated = $this->validateCreateRequest($request, true);
    $providerId = $validated['provider_id'];

    return $this->createTemplate($providerId, $validated);
}

public function createByAgent(Request $request)
{
    $validated = $this->validateCreateRequest($request, false);
    $backend = app('Star')->backend();

    return $this->createTemplate($backend['id'], $validated);
}

private function createTemplate(int $providerId, array $data): array
{
    // 共用的建立邏輯...
}
```

---

#### 🟡 中等: 方法過長

**位置**: `AnnouncementTemplateController.php`

**問題描述**: 多個方法超過建議的 50 行限制。

| 方法名稱          | 行數 | 建議值 |
| ----------------- | ---- | ------ |
| `createByBackend` | 68   | < 50   |
| `createByAgent`   | 65   | < 50   |
| `editByBackend`   | 90   | < 50   |
| `editByAgent`     | 86   | < 50   |

---

### 2. 程式碼品質

#### 🔴 嚴重: Model 的 fillable 與 guarded 衝突

**位置**: `AnnouncementTemplate.php:68-79`

**問題描述**: `$fillable` 包含 'id' 但 `$guarded` 也包含 'id'，這是矛盾的設定。

```php
// ❌ 衝突設定
protected $fillable = [
    'id',  // 在 fillable 中
    'provider_id',
    // ...
];

protected $guarded = ['id'];  // 又在 guarded 中
```

**建議修正**:

```php
// ✅ 移除 fillable 中的 id
protected $fillable = [
    'provider_id',
    'type',
    'sub_type',
    'subject',
];

// 不需要 guarded，因為 id 已不在 fillable 中
```

---

#### 🟡 中等: Use 引入順序不符規範

**位置**: `AnnouncementTemplateController.php:4-15`

**問題描述**: 依據 Eagle Coding Style，Use 應按照：Vendor → Exception → 自定義 Class → Interface 順序。

```php
// ❌ 目前順序
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\QueryException;  // 未使用
use hg\apidoc\annotation as Apidoc;
use App\Interfaces\IAnnouncement;  // Interface 應該在最後
```

**建議修正**:

```php
// ✅ 正確順序
// 1. Vendor
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use hg\apidoc\annotation as Apidoc;

// 2. Exception (如有需要)
use App\Exceptions\NotFoundException;
use App\Exceptions\RuntimeException;

// 3. Interface
use App\Interfaces\IAnnouncement;
```

---

#### 🟡 中等: 未使用的 Import

**位置**: `AnnouncementTemplateController.php:13`

```php
use Illuminate\Database\QueryException;  // 未在程式碼中使用
```

---

#### 🟢 輕微: return 前缺少空行

**位置**: 多處方法

```php
// ❌ 部分地方缺少空行
$template['contents'] = $templateService->contentLists(...);
return $template;

// ✅ 應該有空行
$template['contents'] = $templateService->contentLists(...);

return $template;
```

---

### 3. 功能正確性

#### 🟡 中等: checkType 方法缺少邊界檢查

**位置**: `AnnouncementTemplate.php (Service):146-151`

**問題描述**: 當 `$type` 不存在於 `SUB_TYPES` 陣列時，會產生未定義索引錯誤。

```php
// ❌ 缺少 type 存在性檢查
public function checkType(int $type, int $subType): bool
{
    $subTypeConstants = IAnnouncement::SUB_TYPES[$type];  // 可能報錯
    return in_array($subType, $subTypeConstants);
}
```

**建議修正**:

```php
// ✅ 加入邊界檢查
public function checkType(int $type, int $subType): bool
{
    if (! isset(IAnnouncement::SUB_TYPES[$type])) {
        return false;
    }

    $subTypeConstants = IAnnouncement::SUB_TYPES[$type];

    return empty($subTypeConstants)
        ? $subType === 0
        : in_array($subType, $subTypeConstants, true);
}
```

---

### 4. 安全性

#### 🟡 中等: type 驗證缺少範圍限制

**位置**: `AnnouncementTemplateController.php` 各 validate 區塊

**問題描述**: `type` 和 `sub_type` 只驗證為 integer，沒有限制合法範圍。

```php
// ❌ 目前驗證
'type' => [ 'required', 'integer' ],
'sub_type' => [ 'integer' ],
```

**建議修正**:

```php
// ✅ 加入範圍限制
use Illuminate\Validation\Rule;

'type' => [ 'required', 'integer', Rule::in(IAnnouncement::TYPE_LISTS) ],
'sub_type' => [ 'integer', 'min:0', 'max:10' ],
```

---

### 5. 效能

#### 🟡 中等: 建立後重複查詢

**位置**: `AnnouncementTemplateController.php:125-127`

**問題描述**: 在建立模版後，立即重新查詢同一筆資料，造成額外的 DB 查詢。

```php
// ❌ 重複查詢
$template = $templateService->create($provider['id'], [...]);
// ... upsertContent ...
$db->commit();

$template = $templateService->get($provider['id'], $template['id']);  // 重複查詢
$template['contents'] = $templateService->contentLists([...]);
```

**建議修正**:

```php
// ✅ 利用已有的 $template 物件，只查詢 contents
$template = $templateService->create($provider['id'], [...]);
// ... upsertContent ...
$db->commit();

$template->refresh();  // 或者直接使用關聯
$template['contents'] = $template->contents;
```

---

#### 🟡 中等: 潛在 N+1 查詢問題

**位置**: `AnnouncementTemplate.php (Service):99-137`

**問題描述**: `lists` 方法回傳列表後，若需要取得每個模版的 contents，會產生 N+1 查詢。

**建議修正**: 在需要時使用 Eager Loading

```php
// ✅ 加入 with 選項
if (isset($opts['with_contents']) && $opts['with_contents']) {
    $stmt->with('contents');
}
```

---

### 6. 可測試性

#### 🔴 嚴重: Service 難以 Mock

**位置**: `AnnouncementTemplateController.php` 全域

**問題描述**: 使用 `app('Service')->init()` 模式難以進行單元測試時的 mock。

```php
// ❌ 難以 mock
$templateService = app('Service')->init('AnnouncementTemplate');
$provider = app('Service')->init('Providers')->get($validated['provider_id']);
```

**建議修正**: 使用依賴注入

```php
// ✅ 構造函數注入
class AnnouncementTemplateController extends Controller
{
    public function __construct(
        private AnnouncementTemplateService $templateService,
        private ProviderService $providerService,
    ) {}

    public function createByBackend(Request $request)
    {
        // 直接使用注入的 service
        $provider = $this->providerService->get($validated['provider_id']);
    }
}
```

---

#### 🟡 中等: 業務邏輯在 Controller 難以測試

**位置**: 所有 Controller 方法

**問題描述**: 業務邏輯（驗證 provider、type、language 等）在 Controller 中，需要完整的 HTTP 請求才能測試，無法單獨進行單元測試。

---

## Eagle Coding Style 檢查清單

| 檢查項目            | 狀態 | 備註                         |
| ------------------- | ---- | ---------------------------- |
| 變數小駝峰          | ✅   | $templateService, $postLangs |
| 常數全大寫          | ✅   | TYPE_LISTS, SUB_TYPES        |
| 類別大駝峰          | ✅   | AnnouncementTemplate         |
| 陣列用 `[]`         | ✅   | 全部使用 []                  |
| Validation 陣列格式 | ✅   | 全部使用陣列格式             |
| Use 按順序排列      | ⚠️   | 順序需調整                   |
| 純字串單引號        | ✅   | 正確使用                     |
| return 前空行       | ⚠️   | 部分缺少                     |
| 檔案結尾空行        | ✅   | 正確                         |

---

## 建議優先處理項目

### 必須修正 (合併前)

1. **修正 Model 的 fillable/guarded 衝突** - 可能導致預期外行為
2. **修正 checkType 邊界檢查** - 可能導致執行時錯誤

### 強烈建議 (下一個迭代)

1. **重構 Controller，將業務邏輯移至 Service 層** - 符合 SRP 原則
2. **抽取 Backend/Agent 共用邏輯** - 減少重複代碼，降低維護成本
3. **加入 type 驗證範圍限制** - 提升安全性

### 建議改善 (後續優化)

1. 調整 Use 引入順序
2. 移除未使用的 import
3. 優化查詢效能
4. 改為依賴注入以提升可測試性

---

## 總結

本次 Code Review 發現主要問題集中在**架構設計**與**程式碼重複**。功能實現基本正確，安全性考量也有基本覆蓋。建議在合併前修正 Model 設定衝突和邊界檢查問題，並在後續迭代中逐步重構 Controller 層，將業務邏輯下沉至 Service 層。

---

_報告由 Claude AI 自動生成_
