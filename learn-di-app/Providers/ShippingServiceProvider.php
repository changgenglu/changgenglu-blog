<?php

namespace App\Providers;

use App\Services\LogisticsInterface;
use Illuminate\Support\ServiceProvider;

/**
 * 運輸服務提供者（依賴注入設定）
 */
class ShippingServiceProvider extends ServiceProvider
{
    /**
     * 註冊服務到容器中
     */
    public function register()
    {
        // 這個Service Provider目前沒有全域綁定
        // 每個物流服務會在各自的Controller中進行依賴注入
    }

    /**
     * 啟動服務
     */
    public function boot()
    {
        //
    }
}
