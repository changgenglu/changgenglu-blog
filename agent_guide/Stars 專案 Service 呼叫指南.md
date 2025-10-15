# Stars 專案 Service 呼叫指南 (AI Agent 版)

## 專案現況概述

當前專案使用混合服務呼叫模式：
- **自訂 Service Manager**: `app('Service')->init('ServiceName')` - 應改為依賴注入
- **已註冊服務呼叫**: `app('Star')->provider()` - 已正確註冊，不需修改

## 實作方向原則

### 1. 優先採用依賴注入
對於新開發功能，一律採用建構子依賴注入模式：
```php
public function __construct(GameSort $gameSortService)
{
    $this->gameSortService = $gameSortService;
}
```

### 2. 識別服務類型（關鍵）
進行服務呼叫優化時，必須仔細識別服務的實際註冊方式：

#### 識別檢查清單：
1. **檢查服務提供者**: 查看 `app/Providers/` 目錄
2. **確認註冊方式**: 檢查是否使用 `$this->app->singleton()` 或 `$this->app->bind()`
3. **測試服務替換**: 嘗試 `app()->instance()` 測試替換

#### 識別結果處理：
- ✅ **已註冊服務**: 如 `Star` 服務，維持現有呼叫方式
- ❌ **自訂 Service Manager**: 如 `app('Service')->init()`，建議改為依賴注入

### 3. 例外情況：Star 服務特殊處理

**重要例外**: `app('Star')->provider()` 雖然看起來像 Service Manager，但實際上已經正確實作。

**服務註冊確認**:
```php
// app/Providers/StarService.php
public function register()
{
    $this->app->singleton('Star', function ($app) {
        return new Star;
    });
}
```

**處理原則**:
- 此服務已經是 Laravel 服務容器管理的，不需要改為建構子依賴注入
- 測試時使用標準 Laravel 測試方法進行 mock
- 支援 `app()->instance()` 或服務容器綁定進行測試替換

## 實作優先級

1. **新功能開發**: 一律採用依賴注入
2. **現有程式碼重構**: 先識別服務類型，再決定處理方式

## 技術原則總結

- **服務識別原則**: 透過檢查服務提供者檔案確認服務註冊方式
- **漸進式重構**: 逐步替換真正的自訂 Service Manager，不強求全面改動
