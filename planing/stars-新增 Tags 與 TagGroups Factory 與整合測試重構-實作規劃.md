# Stars - 新增 Tags 與 TagGroups Factory 與整合測試重構 - 實作規劃

## 版本記錄

| 版本 | 更新時間 | 變更摘要 |
| :--- | :--- | :--- |
| v1.0 | 2026-02-03 14:15 | 初次規劃 |

---

## 0. 專案現況分析摘要

> 本區塊記錄規劃前的專案分析結果，確保實作與專案架構一致。

### 0.1 參考的既有實作

| 檔案 | 參考原因 | 關鍵發現 |
| :--- | :--- | :--- |
| `app/Models/Tags.php` | Factory 建立目標 | 使用 `HasFactory`，`type` 屬性依賴 ID 區段計算 |
| `app/Interfaces/ITags.php` | ID 邏輯來源 | 定義了 `TAG_TYPE_STYLE` (40000) 等常數 |
| `tests/Integration/TagController/*.php` | 重構目標 | 目前大量使用 `Model::create` 手動建立測試資料，且硬編碼 ID |

### 0.2 識別的架構模式

| 項目 | 專案採用方式 |
| :--- | :--- |
| 分層架構 | Controller → Service → Model (大部分為 ServiceFactory 模式) |
| 命名慣例 | 測試方法 `snake_case`，測試檔案 `{MethodName}Test.php` |
| 測試資料 | 目前多為手動 `create`，本次目標引入 Factory |
| ID 邏輯 | `Tags` ID 具有業務語意（Magic Numbers），需在 Factory 中封裝 |

### 0.3 必須遵循的慣例

-   Factory 檔案存放在 `database/factories/`。
-   測試中使用 `setUpTestData` 方法準備資料。
-   測試必須全數通過 (`vendor/bin/phpunit`)。

---

## 1. 需求概述

### 1.1 背景與目標

-   **需求背景**：目前的整合測試中，`Tags` 與 `TagGroups` 資料皆為手動建立，且 `Tags` 的 ID 具有特定業務語意（如 4xxxx 代表風格標籤）。手動指定 ID 容易出錯且難以維護。
-   **功能目標**：建立 `TagsFactory` 與 `TagGroupsFactory`，封裝 ID 生成邏輯與預設屬性，並將現有整合測試重構為使用 Factory。
-   **影響範圍**：`database/factories/` 及 `tests/Integration/TagController/`。

### 1.2 範圍界定

-   **包含**：
    -   建立 `database/factories/TagsFactory.php`。
    -   建立 `database/factories/TagGroupsFactory.php`。
    -   重構 `tests/Integration/TagController/` 下的所有測試檔案。
-   **不包含**：修改 `Tags` 或 `TagGroups` 的 Model 邏輯。
-   **假設條件**：`ITags` 介面中的常數定義穩定。

---

## 2. 系統架構變更

### 2.1 資料庫變更

#### 新增/修改資料表

N/A (僅涉及測試資料生成)

### 2.2 設定變更

N/A

### 2.3 程式碼結構

#### 新增檔案

| 檔案路徑 | 類型 | 職責說明 |
| :--- | :--- | :--- |
| `database/factories/TagsFactory.php` | Factory | `Tags` 模型工廠，含 `style`, `country` 等狀態 |
| `database/factories/TagGroupsFactory.php` | Factory | `TagGroups` 模型工廠，含 `enabled`, `disabled` 狀態 |

#### 修改檔案

| 檔案路徑 | 修改內容摘要 |
| :--- | :--- |
| `tests/Integration/TagController/*.php` | 將 `Model::create` 替換為 `Model::factory()` |

---

## 3. API 規格設計

N/A (本次為內部重構)

---

## 4. 實作細節

### 4.1 實作任務清單

依序列出可直接執行的原子化任務：

| # | 任務 | 依賴 |
| :--- | :--- | :--- |
| 1 | 建立 `database/factories/TagsFactory.php` | - |
| 2 | 建立 `database/factories/TagGroupsFactory.php` | - |
| 3 | 重構 `CreateGroupTest.php` | 1, 2 |
| 4 | 重構 `CreateTest.php` | 1, 2 |
| 5 | 重構 `DisableGroupTest.php` | 1, 2 |
| 6 | 重構 `DisableTest.php` | 1, 2 |
| 7 | 重構 `EditGroupTest.php` | 1, 2 |
| 8 | 重構 `EditTest.php` | 1, 2 |
| 9 | 重構 `EnableGroupTest.php` | 1, 2 |
| 10 | 重構 `EnableTest.php` | 1, 2 |
| 11 | 重構 `GetGroupTagsTest.php` | 1, 2 |
| 12 | 重構 `GetGroupTest.php` | 1, 2 |
| 13 | 重構 `GetTagTypeListsTest.php` | 1, 2 |
| 14 | 重構 `GetTest.php` | 1, 2 |
| 15 | 重構 `TagGroupListsTest.php` | 1, 2 |
| 16 | 重構 `TagListsTest.php` | 1, 2 |
| 17 | 重構 `UpdateGroupTagsTest.php` | 1, 2 |
| 18 | 執行所有測試驗證 | 3-17 |

### 4.2 關鍵邏輯（提供偽代碼）

#### TagsFactory

```php
class TagsFactory extends Factory
{
    public function definition()
    {
        return [
            // 預設 ID 範圍 90000+，避免衝突
            'id' => $this->faker->unique()->numberBetween(90000, 99999),
            'name_tw' => $this->faker->unique()->word,
            'name_cn' => $this->faker->unique()->word,
            'name_en' => $this->faker->unique()->word,
            'enable' => 1,
            'description' => $this->faker->sentence,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    public function style()
    {
        return $this->state(fn (array $attributes) => [
            'id' => ITags::TAG_TYPE_STYLE + $this->faker->unique()->numberBetween(1, 9999),
        ]);
    }
    
    public function country()
    {
        return $this->state(fn (array $attributes) => [
            'id' => ITags::TAG_TYPE_COUNTRY + $this->faker->unique()->numberBetween(1, 9999),
        ]);
    }
    
    // 其他類型依此類推
}
```

#### TagGroupsFactory

```php
class TagGroupsFactory extends Factory
{
    public function definition()
    {
        return [
            'name' => $this->faker->unique()->words(3, true),
            'enable' => $this->faker->boolean(80),
            'description' => $this->faker->sentence,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
    
    public function enabled()
    {
        return $this->state(fn (array $attributes) => [
            'enable' => true,
        ]);
    }

    public function disabled()
    {
        return $this->state(fn (array $attributes) => [
            'enable' => false,
        ]);
    }
}
```

---

## 5. 部署與驗證

### 5.1 部署注意事項

| 階段 | 項目 | 說明 |
| :--- | :--- | :--- |
| 部署前 | 測試 | 確保 CI/CD 流程中的測試通過 |

### 5.2 驗證項目

#### 整合測試

| 測試類別 | 測試情境 | 預期結果 |
| :--- | :--- | :--- |
| `TagController/*` | 所有測試案例 | 全數通過 (Green) |

### 5.3 自開檢查點

#### 基本規範

-   [ ] Factory 產生的資料符合 Model 規範
-   [ ] 測試重構後邏輯不變
-   [ ] 沒有遺留的硬編碼 ID（除了 Factory 內部）
