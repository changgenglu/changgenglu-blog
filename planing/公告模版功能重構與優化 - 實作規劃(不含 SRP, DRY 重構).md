# 公告模版功能重構與優化 - 實作規劃

## 版本記錄

| 版本 | 更新時間 | 變更摘要 |
|------|---------|----------|
| v1.0 | 2026-01-21 10:00 | 初次規劃（基於 2026-01-19 Code Review） |
| v1.1 | 2026-01-21 16:15 | 範圍調整：排除 Controller 結構重構，專注於 Bug 修復與效能優化 |

---

## 1. 需求概述

### 1.1 背景與目標
- **需求背景**：根據 2026-01-19 的 Code Review 報告，`feature-announcement-templates` 分支存在多項技術債與潛在問題。使用者指示**本次暫不處理 SRP/DRY/Method Length 等重構項目**，優先修復 Bug 與潛在風險。
- **功能目標**：
    1. **修復 Model 設定衝突**：解決 `$fillable` 與 `$guarded` 的衝突。
    2. **修復功能 Bug**：修正 `checkType` 邊界檢查與 `type` 驗證範圍。
    3. **優化效能**：移除建立後的重複查詢，並優化列表 N+1 問題。
    4. **提升程式碼品質**：修正 Import 順序與格式問題。
- **影響範圍**：
    - `app/Http/Controllers/AnnouncementTemplateController.php`
    - `app/Services/AnnouncementTemplate.php`
    - `app/Models/AnnouncementTemplate.php`

### 1.2 範圍界定
- **包含**：
    - 修復 Model `$fillable` / `$guarded` 衝突。
    - 修復 `checkType` 索引未定義錯誤。
    - 增加 Controller 輸入驗證 (`Rule::in`)。
    - 優化 Controller 重複查詢邏輯。
    - 優化 Service 列表查詢 (Eager Loading)。
    - 修正 Import 順序與代碼風格。
- **不包含**：
    - 將 Controller 業務邏輯遷移至 Service (SRP 重構)。
    - 抽取 Backend/Agent 共用邏輯 (DRY 重構)。
    - 拆分過長方法。
    - 依賴注入 (DI) 重構。

---

## 2. 系統架構變更

### 2.1 資料庫變更
N/A

### 2.2 設定變更
N/A

### 2.3 程式碼結構

#### 修改檔案
| 檔案路徑 | 修改內容摘要 |
|---------|-------------|
| `app/Models/AnnouncementTemplate.php` | 移除 `$fillable` 中的 `id`，移除 `$guarded`。 |
| `app/Services/AnnouncementTemplate.php` | 1. `checkType` 增加 `isset` 檢查。<br>2. `lists` 方法支援 `with` 參數 (Eager Loading)。 |
| `app/Http/Controllers/AnnouncementTemplateController.php` | 1. 驗證規則增加 `Rule::in`。<br>2. 移除 `create/edit` 後的重複 `get` 查詢。<br>3. 調整 Import 順序。 |

---

## 3. API 規格設計

**注意**：本次為內部修復，對外 API 介面保持不變。

### 3.1 端點總覽
(與現有 API 一致)

### 3.2 詳細規格
(與現有規格一致)

---

## 4. 實作細節

### 4.1 實作任務清單

| # | 任務 | 依賴 |
|---|-----|-----|
| 1 | **[Model]** 修正 `AnnouncementTemplate` 的 `$fillable` 與 `$guarded` 衝突 | - |
| 2 | **[Service]** 修正 `checkType` 方法，增加 `isset` 檢查 | - |
| 3 | **[Service]** 修改 `lists` 方法，支援 `with` 參數以解決 N+1 問題 | - |
| 4 | **[Controller]** 在 `createByBackend/Agent` 與 `editByBackend/Agent` 中增加 `Rule::in` 驗證 | - |
| 5 | **[Controller]** 移除 `createByBackend/Agent` 與 `editByBackend/Agent` 結尾的重複 `get` 查詢，改用物件回傳或 `refresh()` | 4 |
| 6 | **[Controller]** 調整 Use Import 順序與代碼風格 (return 前空行) | 5 |

### 4.2 關鍵邏輯

#### Service: checkType 修復
```php
public function checkType(int $type, int $subType): bool
{
    if (!isset(IAnnouncement::SUB_TYPES[$type])) {
        return false;
    }
    // ... 原有邏輯
}
```

#### Controller: 驗證增強
```php
'type' => [ 'required', 'integer', Rule::in(IAnnouncement::TYPE_LISTS) ],
```

#### Controller: 移除重複查詢
```php
// 原本
// $template = $templateService->get($provider['id'], $template['id']);
// $template['contents'] = $templateService->contentLists([...]);

// 修改後
$template['contents'] = $templateService->contentLists([ 'template_id' => $template['id'] ]);
// 若 $templateService->create 回傳的是 Model，可直接使用 $template->contents (需確保 Service 回傳正確型別)
// 若 Service 回傳 array，則維持 contentLists 但無需重新 get template
```

---

## 5. 部署與驗證

### 5.1 部署注意事項
- 無需 Migration。
- 建議執行 `php artisan config:cache` (若有改動設定，本次無)。

### 5.2 驗證項目

#### 單元測試 / 整合測試
| 測試情境 | 預期結果 |
|---------|---------|
| 輸入無效的 `type` | HTTP 422 驗證錯誤 (原本可能 500 或 404) |
| 列表查詢 | 確認無 N+1 問題 (Debugbar 或 Log 檢查) |
| 新增/修改功能 | 功能維持正常，資料正確寫入 |

### 5.3 自我檢查點
- [ ] Model 屬性衝突已解決？
- [ ] `checkType` 不會再噴 `Undefined index`？
- [ ] Controller 無重複查詢？
- [ ] Import 順序符合規範？
