# 遊戲供應商後台管理功能 (Platform Backend CRUD)

## 1. 概述

本文件旨在規劃並記錄 Eagle 專案中「遊戲供應商 (Platform)」後台管理功能的實作細節。目標是建立一套標準化的 CRUD 介面，供管理員 (Admin) 管理遊戲供應商資料，同時整併專案既有的通用維護系統，移除冗餘的維護欄位，確保資料的一致性與架構的簡潔性。

## 2. 需求說明

- **後台管理介面 (Admin Only)**：提供管理員新增、查詢、編輯、刪除 (軟刪除) 遊戲供應商的功能。
- **Agent 端無權限**：代理商 (Agent) 端不提供管理權限，亦不提供讀取全域供應商列表的 API。
- **資料結構優化**：
    - 移除 `platforms` 與 `games` 資料表中冗餘的維護時間與狀態欄位，統一使用專案通用的 `Maintenance` 系統。
    - `Platform` 的啟用狀態統一由 `is_enabled` 欄位控制，移除混淆的 `status` 欄位。
- **欄位保護**：
    - 供應商代碼 (`code`) 於建立時強制轉為大寫，且建立後禁止修改。
    - 啟用狀態 (`is_enabled`) 禁止透過 Update API 修改，需使用專屬的 Enable/Disable API。
- **快取機制**：所有寫入操作後需自動清除相關快取。

## 3. 功能說明

- **列表查詢 (List)**：
    - 支援多種篩選條件：關鍵字 (`search`)、啟用狀態 (`is_enabled`)、ID (`id`, `ids`)、包含已刪除 (`include_deleted`)。
    - 支援多欄位排序 (`sort_field`, `sort_order`)。
- **新增供應商 (Create)**：
    - 驗證 `code` 唯一性 (不分大小寫)。
    - 預設停用 (`is_enabled = false`)。
- **編輯供應商 (Update)**：
    - 僅允許修改基本資訊 (名稱、圖片、設定等)。
    - 禁止修改 `code` 與 `is_enabled`。
- **啟停用切換 (Toggle Enable)**：
    - 提供獨立的 API (`enable`, `disable`) 快速切換供應商狀態。
- **刪除與恢復 (Delete/Restore)**：
    - 支援軟刪除 (`SoftDeletes`)。
    - *目前暫不實作 Restore API，但保留底層支援。*

## 4. 實現邏輯

1.  **資料庫重構**：
    - 修改 `platforms` migration，移除 `status`, `maintenance_start_at`, `maintenance_end_at`。
    - 修改 `games` migration，移除 `maintain_begin_at`, `maintain_end_at`。
2.  **核心層 (Model/Enum/Repo)**：
    - `PlatformStatus` Enum 簡化為 `ENABLED(1)` / `DISABLED(0)`。
    - `PlatformRepository` 移除舊有 `status` 篩選，改用 `is_enabled`，並增強篩選與排序邏輯。
3.  **服務層 (Service)**：
    - `PlatformService` 封裝所有業務邏輯。
    - 實作 `createPlatform` (Code 轉大寫)、`updatePlatform` (欄位過濾)、`toggleEnable` 等方法。
    - 統一呼叫 `clearPlatformCache` 清除快取。
4.  **介面層 (Controller/Request/Resource)**：
    - `Admin\PlatformController` 提供 RESTful API。
    - FormRequest (`ListsRequest`, `StoreRequest`, `UpdateRequest`) 嚴格驗證輸入，並使用自訂錯誤訊息。
    - `PlatformResource` 統一回傳格式，移除已廢棄欄位。

## 5. 技術實現

### 5.1 Request 驗證 (UpdateRequest 範例)

```php
// app/Http/Requests/Admin/Platform/UpdateRequest.php
public function rules(): array
{
    return [
        'code' => ['prohibited'],       // 禁止修改 Code
        'is_enabled' => ['prohibited'], // 禁止由此 API 修改狀態
        'name' => ['nullable', 'string', 'max:50'],
        // ... 其他欄位
    ];
}
```

### 5.2 Service 邏輯 (PlatformService 範例)

```php
// app/Services/Platform/PlatformService.php
public function createPlatform(array $data): Platform
{
    if (isset($data['code'])) {
        $data['code'] = strtoupper($data['code']); // 強制大寫
    }
    $data['is_enabled'] = false; // 預設停用

    $platform = $this->platformRepository->create($data);
    $this->clearPlatformCache();
    
    return $platform;
}

public function toggleEnable(int $id, bool $enable): Platform
{
    $platform = $this->platformRepository->findById($id);
    if (! $platform) {
        throw NotFoundException::withCode(ErrorCode::PLATFORM_NOT_FOUND);
    }
    
    $this->platformRepository->update($platform, ['is_enabled' => $enable]);
    $this->clearPlatformCache();
    
    return $platform->refresh();
}
```

### 5.3 Repository 篩選 (PlatformRepository 範例)

```php
// app/Repositories/Platform/PlatformRepository.php
private function applyFilters(Builder $query, array $filters): void
{
    // 關鍵字搜尋 (Code 精確, Name 模糊 - 視需求調整，目前共用 search 邏輯)
    if (! empty($filters['search'])) {
        $search = $filters['search'];
        $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('code', 'like', "%{$search}%")
              ->orWhere('full_name', 'like', "%{$search}%");
        });
    }
    
    // 啟用狀態篩選
    if (isset($filters['is_enabled'])) {
        $query->where('is_enabled', $filters['is_enabled']);
    }
    
    // 包含軟刪除
    if (! empty($filters['include_deleted'])) {
        $query->withTrashed();
    }
}
```

## 6. 注意事項

- **資料庫遷移 (Migration)**：由於專案尚在開發初期，本次採用直接修改 `create_platforms_table` 與 `create_games_table` 的方式。需執行 `php artisan migrate:refresh` 才能生效，請注意這會清空資料。
- **維護功能轉移**：原本依賴 `Platform` 或 `Game` 資料表欄位判斷維護狀態的邏輯 (`isInMaintenance`) 已失效，後續需全面改用 `MaintenanceService` 查詢通用維護系統。
- **Enum 變更**：`PlatformStatus` 定義已變更，請確保前端或舊有程式碼不再依賴 `MAINTENANCE` (2) 這個狀態值。

## 7. 影響範圍

- **資料表結構**：`platforms`, `games`。
- **API 介面**：Admin Platform 相關 API。
- **業務邏輯**：平台啟用判斷、平台維護判斷、遊戲維護判斷。