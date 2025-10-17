<?php

return [
    /*
    |--------------------------------------------------------------------------
    | 預設物流服務提供者
    |--------------------------------------------------------------------------
    |
    | 指定預設要使用的物流服務提供者。
    | 可用選項：black_cat, hsinchu, post_office
    |
    */

    'default_provider' => env('SHIPPING_PROVIDER', 'black_cat'),

    /*
    |--------------------------------------------------------------------------
    | 物流服務提供者設定
    |--------------------------------------------------------------------------
    |
    | 設定每個物流服務提供者的參數。
    |
    */

    'providers' => [
        'black_cat' => [
            'class' => \App\Services\BlackCat::class,
            'name' => '黑貓貨運',
            'base_fee' => 100,
            'fee_per_kg' => 10,
        ],

        'hsinchu' => [
            'class' => \App\Services\Hsinchu::class,
            'name' => '新竹貨運',
            'base_fee' => 80,
            'fee_per_kg' => 15,
        ],

        'post_office' => [
            'class' => \App\Services\PostOffice::class,
            'name' => '郵局',
            'base_fee' => 70,
            'fee_per_kg' => 20,
        ],
    ],
];
