<?php

use App\Http\Controllers\BlackCatController;
use App\Http\Controllers\HsinchuController;
use App\Http\Controllers\PostOfficeController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group.
|
*/

Route::get('/', function () {
    return view('welcome');
});

/*
|--------------------------------------------------------------------------
| 物流服務路由（每個物流服務獨立的Controller）
|--------------------------------------------------------------------------
|
| 每個物流服務都有專門的Controller負責處理相關業務
|
*/

// 黑貓貨運服務路由
Route::prefix('black-cat')->group(function () {
    Route::get('/fee', [BlackCatController::class, 'calculateFee']);
    Route::get('/info', [BlackCatController::class, 'getServiceInfo']);
    Route::get('/availability', [BlackCatController::class, 'checkAvailability']);
});

// 新竹貨運服務路由
Route::prefix('hsinchu')->group(function () {
    Route::get('/fee', [HsinchuController::class, 'calculateFee']);
    Route::get('/info', [HsinchuController::class, 'getServiceInfo']);
    Route::get('/availability', [HsinchuController::class, 'checkAvailability']);
});

// 郵局服務路由
Route::prefix('post-office')->group(function () {
    Route::get('/fee', [PostOfficeController::class, 'calculateFee']);
    Route::get('/info', [PostOfficeController::class, 'getServiceInfo']);
    Route::get('/availability', [PostOfficeController::class, 'checkAvailability']);
});

/*
|--------------------------------------------------------------------------
| API路由（返回JSON格式）
|--------------------------------------------------------------------------
|
| API版本的物流服務路由
|
*/

// 黑貓貨運API路由
Route::prefix('api/black-cat')->group(function () {
    Route::get('/fee', [BlackCatController::class, 'calculateFee']);
    Route::get('/info', [BlackCatController::class, 'getServiceInfo']);
    Route::get('/availability', [BlackCatController::class, 'checkAvailability']);
});

// 新竹貨運API路由
Route::prefix('api/hsinchu')->group(function () {
    Route::get('/fee', [HsinchuController::class, 'calculateFee']);
    Route::get('/info', [HsinchuController::class, 'getServiceInfo']);
    Route::get('/availability', [HsinchuController::class, 'checkAvailability']);
});

// 郵局API路由
Route::prefix('api/post-office')->group(function () {
    Route::get('/fee', [PostOfficeController::class, 'calculateFee']);
    Route::get('/info', [PostOfficeController::class, 'getServiceInfo']);
    Route::get('/availability', [PostOfficeController::class, 'checkAvailability']);
});
