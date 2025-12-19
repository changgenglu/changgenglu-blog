# 優化後台供應商（Platform）IP 管理

## 1. 概述

本規劃旨在優化 `eagle` 專案中後台供應商 IP 管理的商業邏輯，以對齊 `stars` 專案的運作機制。透過實作分佈式鎖與嚴格的業務預檢，解決併發操作衝突與數據一致性問題，同時確保對外 API 介面嚴格遵循現有 API 文檔規範。

## 2. 需求說明

- **實作分佈式鎖**：在操作 Cloud Armor 前，必須先獲取鎖，防止併發衝突。
- **新增 IP 預檢**：在呼叫 Cloud Armor 新增 IP 前，必須檢查 IP 是否已存在，若全部重複則拋出異常，不呼叫 GCP API。
- **移除 IP 預檢**：在呼叫 Cloud Armor 移除 IP 前，必須檢查 IP 是否存在於清單中，若有任一不存在則拋出異常，不呼叫 GCP API。
- **API 介面一致性**：嚴格遵守 `@docs/notion-api/遊戲供應商IP管理 API 文件.md` 的 Request/Response 格式，不新增未定義欄位（如 `updated_ip_list`）。
- **架構規範**：不移植 `stars` 的代碼映射 (`reNamePlatform`) 邏輯，並使用新增的 `CacheKey` Enum 取代硬編碼字串。

## 3. 功能說明

### 3.1 鎖機制管理 (CloudArmorService)
- 提供 `tryAcquireApiLock` 方法，使用 Redis 原子操作 (`set NX EX`) 獲取鎖。
- 提供 `removeApiLock` 方法釋放鎖。
- 用於 `QcWhiteListService` 在執行 IP 變更操作前的保護。

### 3.2 新增 IP 到白名單 (QcWhiteListService)
- 接收平台代碼與 IP 列表。
- 獲取分佈式鎖，失敗則拋出 `api_operation_too_frequent`。
- 取得目前 Cloud Armor 上的 IP 列表。
- 過濾已存在的 IP。
- 若待新增列表為空，拋出 `platform_ip_is_exist`。
- 呼叫 `CloudArmorService` 執行新增。
- 釋放鎖。

### 3.3 從白名單移除 IP (QcWhiteListService)
- 接收平台代碼與 IP 列表。
- 獲取分佈式鎖，失敗則拋出 `api_operation_too_frequent`。
- 取得目前 Cloud Armor 上的 IP 列表。
- 驗證所有待移除 IP 是否都存在於清單中。
- 若有任一 IP 不存在，拋出 `platform_ip_not_exist`。
- 呼叫 `CloudArmorService` 執行移除。
- 釋放鎖。

## 4. 實現邏輯

1.  **定義 CacheKey**：在 `App\Enums\Cache\CacheKey` 新增 `CLOUD_ARMOR_API_LOCK`。
2.  **實作基礎設施**：在 `App\Services\CloudArmor\CloudArmorService` 中實作鎖的獲取與釋放邏輯。
3.  **重構業務邏輯**：修改 `App\Services\Qc\QcWhiteListService` 的 `addIpToRule` 與 `removeIpFromRule` 方法，加入鎖與預檢邏輯。

## 5. 技術實現

### 5.1 定義 CacheKey

```php
// app/Enums/Cache/CacheKey.php

case CLOUD_ARMOR_API_LOCK = 'cloud_armor:api_lock:{policy_name}:{platform_code}';
```

### 5.2 CloudArmorService 鎖實作

```php
// app/Services/CloudArmor/CloudArmorService.php

public function tryAcquireApiLock(string $policyName, string $platformCode, ?int $ttl = null): bool
{
    $ttl = $ttl ?? self::TTL_LOCK;
    
    // 使用 IRedisCache 的 setWithOptions 實作原子鎖
    // 假設 key 已經正確綁定 policy_name 與 platform_code
    return $this->cache->setWithOptions(
        CacheKey::CLOUD_ARMOR_API_LOCK,
        [
            'policy_name' => $policyName,
            'platform_code' => $platformCode
        ],
        time(), // Value 可以是當前時間戳
        [
            'NX' => true,
            'EX' => $ttl
        ]
    );
}

public function removeApiLock(string $policyName, string $platformCode): void
{
    $this->cache->forget(
        CacheKey::CLOUD_ARMOR_API_LOCK, 
        [
            'policy_name' => $policyName,
            'platform_code' => $platformCode
        ]
    );
}
```

### 5.3 QcWhiteListService 業務邏輯

```php
// app/Services/Qc/QcWhiteListService.php

public function addIpToRule(string $platformCode, array $ips): array
{
    $policyName = $this->cloudArmorService->getPolicyName();

    // 1. 獲取鎖
    if (! $this->cloudArmorService->tryAcquireApiLock($policyName, $platformCode)) {
        throw RuntimeException::withCode(ErrorCode::API_OPERATION_TOO_FREQUENT);
    }

    try {
        // 2. 預檢：取得現有 IP
        $currentIps = $this->cloudArmorService->getPlatformIpRanges($policyName, $platformCode);
        
        // 3. 預檢：過濾已存在 IP
        $ipsToAdd = array_diff($ips, $currentIps);
        
        if (empty($ipsToAdd)) {
            // 所有 IP 都已存在，拋出異常
            throw RuntimeException::withCode(ErrorCode::PLATFORM_IP_IS_EXIST);
        }

        // 4. 執行新增 (只新增過濾後的 IP)
        $result = $this->cloudArmorService->addIpToRule($policyName, $platformCode, $ipsToAdd);
        
        // 清除快取 (CloudArmorService 內部已處理，此處確保業務邏輯完整性)
        if ($result['success']) {
            $this->cloudArmorService->clearCache($policyName);
        }

        return $result;
    } finally {
        // 5. 釋放鎖
        $this->cloudArmorService->removeApiLock($policyName, $platformCode);
    }
}

public function removeIpFromRule(string $platformCode, array $ips): array
{
    $policyName = $this->cloudArmorService->getPolicyName();

    // 1. 獲取鎖
    if (! $this->cloudArmorService->tryAcquireApiLock($policyName, $platformCode)) {
        throw RuntimeException::withCode(ErrorCode::API_OPERATION_TOO_FREQUENT);
    }

    try {
        // 2. 預檢：取得現有 IP
        $currentIps = $this->cloudArmorService->getPlatformIpRanges($policyName, $platformCode);
        
        // 3. 預檢：檢查是否所有 IP 都存在
        $missingIps = array_diff($ips, $currentIps);
        
        if (!empty($missingIps)) {
            // 有 IP 不存在於清單中，拋出異常
            throw RuntimeException::withCode(ErrorCode::PLATFORM_IP_NOT_EXIST);
        }

        // 4. 執行移除
        $result = $this->cloudArmorService->removeIpFromRule($policyName, $platformCode, $ips);

        if ($result['success']) {
            $this->cloudArmorService->clearCache($policyName);
        }

        return $result;
    } finally {
        // 5. 釋放鎖
        $this->cloudArmorService->removeApiLock($policyName, $platformCode);
    }
}
```

## 6. 注意事項

- **API 回傳格式**：雖然 `stars` 回傳了 `updated_ip_list`，但 `eagle` 必須嚴格遵守 API 文檔，**不回傳**該欄位。
- **Exception Code**：需確認 `ErrorCode::PLATFORM_IP_IS_EXIST` 和 `ErrorCode::PLATFORM_IP_NOT_EXIST` 是否已存在，若不存在需新增或使用適當的現有錯誤碼。
- **鎖的原子性**：依賴 `IRedisCache` 的 `setWithOptions` 實作，需確保底層 Redis 驅動支援 `NX` 選項。

## 7. 影響範圍

- **後台 IP 管理功能**：新增與移除 IP 的行為將變得更嚴謹（重複/不存在會報錯）。
- **併發操作**：多個管理員同時操作同一平台 IP 時，後進者會收到 `API_OPERATION_TOO_FREQUENT` 錯誤。
- **系統效能**：新增了 Redis 鎖操作與預檢邏輯，但減少了無效的 GCP API 呼叫（當 IP 重複時）。
