# Laravel Service 呼叫指南

> 說明在 Laravel 專案裡，Service 該用依賴注入（Dependency Injection）還是服務容器的字串別名呼叫，以及重構時怎麼先辨識服務的註冊方式。整理於 2026 年。

## 專案現況

舊專案常見兩種呼叫方式混用：

- **自訂 Service Manager（工廠）**：`app('Service')->init('ServiceName')`，內部直接 `new`，不經過服務容器，應逐步改為依賴注入
- **已註冊到容器的服務**：`app('Site')->provider()`，已由服務提供者註冊，不需要修改

## 實作方向原則

### 1. 優先採用依賴注入

新功能一律用建構子注入：

```php
public function __construct(GameSort $gameSortService)
{
    $this->gameSortService = $gameSortService;
}
```

### 2. 先辨識服務類型（關鍵）

重構呼叫方式之前，必須先確認服務實際的註冊方式。

辨識檢查清單：

1. **檢查服務提供者**：查看 `app/Providers/` 目錄
2. **確認註冊方式**：是否使用 `$this->app->singleton()` 或 `$this->app->bind()`
3. **測試服務替換**：嘗試用 `app()->instance()` 替換，看測試是否生效

辨識結果的處理：

- 已註冊服務（如下方的 `Site`）：維持現有呼叫方式
- 自訂 Service Manager（如 `app('Service')->init()`）：改為依賴注入

### 3. 例外：看起來像 Service Manager 的已註冊服務

`app('Site')->provider()` 看起來像 Service Manager，其實已經由服務提供者註冊：

```php
// app/Providers/SiteServiceProvider.php
public function register()
{
    $this->app->singleton('Site', function ($app) {
        return new Site;
    });
}
```

處理原則：

- 這個服務已由 Laravel 服務容器管理，不需要改成建構子注入
- 測試時用標準 Laravel 方法 mock
- 可用 `app()->instance()` 或容器綁定替換

## 實作優先級

1. **新功能開發**：一律採用依賴注入
2. **既有程式碼重構**：先辨識服務類型，再決定處理方式

## 技術原則總結

- **服務辨識原則**：看服務提供者檔案，確認註冊方式後再動手
- **漸進式重構**：逐步替換真正的自訂 Service Manager，不強求一次全改
