# Stars - 整合測試「非功能性冗餘」清理 - 實作規劃

## 版本記錄

| 版本 | 更新時間         | 變更摘要 |
| ---- | ---------------- | -------- |
| v1.0 | 2026-02-03 15:10 | 初次規劃 |

---

## 0. 專案現況分析摘要

> 本區塊記錄規劃前的專案分析結果，確保實作與專案架構一致。

### 0.1 參考的既有實作

| 檔案                                     | 參考原因              | 關鍵發現                                         |
| ---------------------------------------- | --------------------- | ------------------------------------------------ |
| `tests/Integration/TagController/DisableGroupTest.php` | 識別冗餘 | 在 `setupTestData` 中指定了 `name`，但測試邏輯不依賴它 |
| `tests/Integration/TagController/EditTest.php` | 識別「必要」指定 | 測試邏輯需驗證變更前後，故指定 `name` 是必要的 |

### 0.2 識別的架構模式

| 項目         | 專案採用方式                                  |
| ------------ | --------------------------------------------- |
| 測試資料建立 | `Model::factory()->...->create([...])`        |
| 冗餘定義     | 在不涉及該欄位驗證的測試中手動指定具體字串，增加了代碼噪音並降低了 Fuzzing 覆蓋率 |

---

## 1. 需求概述

### 1.1 背景與目標

- **背景**：在先前針對整合測試的檢視中發現，部分測試檔案在 `setupTestData` 中手動指定了 `name` 或 `description` 等欄位，但在該測試檔案的所有 TestCase 中，這些欄位並未作為核心變因或過濾條件。這被識別為「非功能性冗餘」。
- **目標**：移除這些非功能性冗餘，讓 Factory 的 Faker 自行產生隨機資料，保持測試代碼精簡並增加資料覆蓋面。

### 1.2 範圍界定

- **包含**：
    - `DisableGroupTest.php`
    - `DisableTest.php`
    - `EnableGroupTest.php`
    - `EnableTest.php`
    - `UpdateGroupTagsTest.php`
    - `GetGroupTagsTest.php`
    - `GetGroupTest.php`
    - `GetTest.php`
- **不包含**：
    - `EditGroupTest.php` (需比對變更前)
    - `EditTest.php` (需比對變更前)
    - `TagGroupListsTest.php` (涉及 Fuzzy Search 斷言)
    - `TagListsTest.php` (涉及 Fuzzy Search 斷言)

---

## 2. 系統架構變更

N/A (僅涉及測試代碼重構)

---

## 3. API 規格設計

N/A

---

## 4. 實作細節

### 4.1 實作任務清單

依序列出可直接執行的原子化任務：

| #   | 任務                                      | 依賴 |
| --- | ----------------------------------------- | ---- |
| 1   | 修改 `DisableGroupTest.php`：移除 `create()` 中的 `name` | -    |
| 2   | 修改 `DisableTest.php`：移除 `create()` 中的 `name_tw` | -    |
| 3   | 修改 `EnableGroupTest.php`：移除 `create()` 中的 `name` | -    |
| 4   | 修改 `EnableTest.php`：移除 `create()` 中的 `name_tw` | -    |
| 5   | 修改 `UpdateGroupTagsTest.php`：移除所有 `create()` 中的 `name` 相關參數 | -    |
| 6   | 修改 `GetGroupTagsTest.php`：移除所有 `create()` 中的 `name` 相關參數 | -    |
| 7   | 修改 `GetGroupTest.php`：移除 `create()` 中的 `name` 及 `description` | -    |
| 8   | 修改 `GetTest.php`：移除 `create()` 中的 `name_*` 及 `description` | -    |
| 9   | 執行 `vendor/bin/phpunit` 驗證所有測試通過 | 1-8  |

### 4.2 關鍵邏輯

將原本冗餘的：
```php
$this->group = TagGroups::factory()->enabled()->create([
    'name' => '待停用群組',
]);
```
改為精簡的：
```php
$this->group = TagGroups::factory()->enabled()->create();
```

---

## 5. 部署與驗證

### 5.1 部署注意事項

N/A

### 5.2 驗證項目

#### 整合測試

| 測試類別       | 測試情境     | 預期結果 |
| -------------- | ------------ | -------- |
| PHPUnit | TagController 整合測試 | 全數通過 (100/100) |

---

## 6. 自我檢查點

- [ ] 移除後，測試中的 `$this->model->name` 斷言是否仍然有效？（若是動態比對則有效）
- [ ] 是否誤刪了清單過濾（Filter）測試需要的固定名稱？
