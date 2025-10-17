<?php

namespace App\Services;

/**
 * 黑貓貨運服務類別
 */
class BlackCat implements LogisticsInterface
{
    /**
     * 計算運費
     *
     * @param int $weight 重量（公斤）
     * @return int 運費金額
     */
    public function calculateFee($weight): int
    {
        return 100 + $weight * 10;
    }
}
