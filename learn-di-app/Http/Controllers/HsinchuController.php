<?php

namespace App\Http\Controllers;

use App\Services\Hsinchu;
use Illuminate\Http\Request;

/**
 * 新竹貨運控制器（專門處理新竹貨運業務）
 */
class HsinchuController extends Controller
{
    /**
     * 計算新竹貨運運費
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function calculateFee(Request $request)
    {
        $weight = $request->input('weight', 1);

        // 直接建立新竹貨運服務物件
        $hsinchu = new Hsinchu();
        $fee = $hsinchu->calculateFee($weight);

        return response()->json([
            'provider' => '新竹貨運',
            'weight' => $weight,
            'fee' => $fee,
            'base_fee' => 80,
            'fee_per_kg' => 15,
            'message' => '新竹貨運運費計算完成'
        ]);
    }

    /**
     * 取得新竹貨運服務資訊
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getServiceInfo()
    {
        $hsinchu = new Hsinchu();

        return response()->json([
            'provider' => '新竹貨運',
            'base_fee' => 80,
            'fee_per_kg' => 15,
            'service_class' => get_class($hsinchu),
            'description' => '新竹貨運提供經濟實惠的貨運服務'
        ]);
    }

    /**
     * 檢查新竹貨運服務可用性
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkAvailability(Request $request)
    {
        $weight = $request->input('weight', 1);

        // 模擬檢查服務可用性
        $isAvailable = true;
        $estimatedDeliveryTime = '3-5天';

        if ($weight > 30) {
            $isAvailable = false;
            $estimatedDeliveryTime = '無法運送超過30公斤的貨物';
        }

        return response()->json([
            'provider' => '新竹貨運',
            'weight' => $weight,
            'available' => $isAvailable,
            'estimated_delivery_time' => $estimatedDeliveryTime,
            'max_weight' => 30,
            'message' => $isAvailable ? '服務可用' : '超過重量限制'
        ]);
    }
}

