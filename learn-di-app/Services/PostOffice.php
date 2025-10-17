<?php

namespace App\Services;

/**
 * 郵局服務類別
 */
class PostOffice implements LogisticsInterface
{
    /**
     * 計算運費
     *
     * @param int $weight 重量（公斤）
     * @return int 運費金額
     */
    public function calculateFee($weight): int
    {
        return 70 + $weight * 20;
    }
}
