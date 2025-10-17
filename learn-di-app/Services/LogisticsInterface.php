<?php

namespace App\Services;

/**
 * 物流服務介面
 */
interface LogisticsInterface
{
    /**
     * 計算運費
     *
     * @param int $weight 重量（公斤）
     * @return int 運費金額
     */
    public function calculateFee($weight): int;
}
