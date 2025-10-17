<?php

namespace App\Http\Controllers;

use App\Services\BlackCat;
use Illuminate\Http\Request;

/**
 * 黑貓貨運控制器（專門處理黑貓貨運業務）
 */
class BlackCatController extends Controller
{
    /**
     * 計算黑貓貨運運費
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function calculateFee(Request $request)
    {
        $weight = $request->input('weight', 1);

        // 直接建立黑貓貨運服務物件
        $blackCat = new BlackCat();
        $fee = $blackCat->calculateFee($weight);

        return response()->json([
            'provider' => '黑貓貨運',
            'weight' => $weight,
            'fee' => $fee,
            'base_fee' => 100,
            'fee_per_kg' => 10,
            'message' => '黑貓貨運運費計算完成'
        ]);
    }

    /**
     * 取得黑貓貨運服務資訊
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getServiceInfo()
    {
        $blackCat = new BlackCat();

        return response()->json([
            'provider' => '黑貓貨運',
            'base_fee' => 100,
            'fee_per_kg' => 10,
            'service_class' => get_class($blackCat),
            'description' => '黑貓貨運提供快速可靠的貨運服務'
        ]);
    }

    /**
     * 檢查黑貓貨運服務可用性
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkAvailability(Request $request)
    {
        $weight = $request->input('weight', 1);

        // 模擬檢查服務可用性
        $isAvailable = true;
        $estimatedDeliveryTime = '2-3天';

        if ($weight > 50) {
            $isAvailable = false;
            $estimatedDeliveryTime = '無法運送超過50公斤的貨物';
        }

        return response()->json([
            'provider' => '黑貓貨運',
            'weight' => $weight,
            'available' => $isAvailable,
            'estimated_delivery_time' => $estimatedDeliveryTime,
            'max_weight' => 50,
            'message' => $isAvailable ? '服務可用' : '超過重量限制'
        ]);
    }
}

