<?php

namespace App\Http\Controllers;

use App\Services\PostOffice;
use Illuminate\Http\Request;

/**
 * 郵局控制器（專門處理郵局貨運業務）
 */
class PostOfficeController extends Controller
{
    /**
     * 計算郵局運費
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function calculateFee(Request $request)
    {
        $weight = $request->input('weight', 1);

        // 直接建立郵局服務物件
        $postOffice = new PostOffice();
        $fee = $postOffice->calculateFee($weight);

        return response()->json([
            'provider' => '郵局',
            'weight' => $weight,
            'fee' => $fee,
            'base_fee' => 70,
            'fee_per_kg' => 20,
            'message' => '郵局運費計算完成'
        ]);
    }

    /**
     * 取得郵局服務資訊
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getServiceInfo()
    {
        $postOffice = new PostOffice();

        return response()->json([
            'provider' => '郵局',
            'base_fee' => 70,
            'fee_per_kg' => 20,
            'service_class' => get_class($postOffice),
            'description' => '郵局提供穩定可靠的貨運服務'
        ]);
    }

    /**
     * 檢查郵局服務可用性
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkAvailability(Request $request)
    {
        $weight = $request->input('weight', 1);

        // 模擬檢查服務可用性
        $isAvailable = true;
        $estimatedDeliveryTime = '5-7天';

        if ($weight > 20) {
            $isAvailable = false;
            $estimatedDeliveryTime = '無法運送超過20公斤的貨物';
        }

        return response()->json([
            'provider' => '郵局',
            'weight' => $weight,
            'available' => $isAvailable,
            'estimated_delivery_time' => $estimatedDeliveryTime,
            'max_weight' => 20,
            'message' => $isAvailable ? '服務可用' : '超過重量限制'
        ]);
    }
}

