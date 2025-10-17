<?php

namespace App\Services;

/**
 * 新竹貨運服務類別
 */
class Hsinchu implements LogisticsInterface
{
    /**
     * 計算運費
     *
     * @param int $weight 重量（公斤）
     * @return int 運費金額
     */
    public function calculateFee($weight): int
    {
        return 80 + $weight * 15;
    }
}
