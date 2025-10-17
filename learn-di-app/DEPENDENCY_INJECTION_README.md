# Laravel 依賴注入實戰指南

## 📋 專案概述

這個專案展示了Laravel中依賴注入的實際應用，專為**大型專案**設計。每個物流服務都有獨立的Controller負責處理業務邏輯，包含完整的測試架構。

## 🏗️ 設計架構

### 核心原則
- **每個物流服務一個專屬Controller**
- **直接物件建立**（不依賴複雜的依賴注入容器）
- **明確的責任劃分**（每個Controller只負責一個物流服務）
- **完整的測試覆蓋**（單元測試 + 整合測試）

### 專案結構
```
app/Services/
├── LogisticsInterface.php          # 物流服務合約介面
├── BlackCat.php                    # 黑貓貨運服務實作
├── Hsinchu.php                     # 新竹貨運服務實作
└── PostOffice.php                  # 郵局服務實作

app/Http/Controllers/
├── BlackCatController.php          # 黑貓貨運業務處理
├── HsinchuController.php           # 新竹貨運業務處理
└── PostOfficeController.php        # 郵局業務處理

tests/
├── Unit/Services/                  # 單元測試
└── Feature/Http/Controllers/       # 整合測試
```

## 💰 物流服務計費規則

| 物流服務 | 基本運費 | 每公斤加收 | 1公斤運費範例 |
|---------|---------|-----------|--------------|
| **黑貓貨運** | 100元 | 10元 | 110元 |
| **新竹貨運** | 80元 | 15元 | 95元 |
| **郵局** | 70元 | 20元 | 90元 |

## 🚀 快速開始

### 測試各物流服務

```bash
# 黑貓貨運
curl http://localhost/black-cat/fee?weight=2
curl http://localhost/api/black-cat/fee?weight=2

# 新竹貨運
curl http://localhost/hsinchu/fee?weight=2
curl http://localhost/api/hsinchu/fee?weight=2

# 郵局
curl http://localhost/post-office/fee?weight=2
curl http://localhost/api/post-office/fee?weight=2
```

### 測試服務可用性
```bash
# 檢查黑貓貨運服務可用性
curl http://localhost/black-cat/availability?weight=25

# 檢查新竹貨運服務可用性
curl http://localhost/hsinchu/availability?weight=15

# 檢查郵局服務可用性
curl http://localhost/post-office/availability?weight=10
```

## 🧪 執行測試

```bash
# 執行所有測試
phpunit

# 執行單元測試（測試物流服務邏輯）
phpunit tests/Unit

# 執行整合測試（測試Controller功能）
phpunit tests/Feature

# 執行特定測試
phpunit tests/Unit/Services/BlackCatTest.php
phpunit tests/Feature/Http/Controllers/BlackCatControllerTest.php
```

## 📚 核心設計概念

### 1. 介面設計（Interface Segregation）
```php
interface LogisticsInterface
{
    public function calculateFee($weight): int;
}
```
所有物流服務都實作此介面，確保行為一致性。

### 2. 直接物件建立模式
```php
class BlackCatController extends Controller
{
    public function calculateFee(Request $request)
    {
        $weight = $request->input('weight', 1);

        // 直接建立物件，明確知道使用哪個服務
        $blackCat = new BlackCat();
        $fee = $blackCat->calculateFee($weight);

        return response()->json([
            'provider' => '黑貓貨運',
            'fee' => $fee
        ]);
    }
}
```

### 3. 測試架構
- **單元測試**：測試每個物流服務的計算邏輯
- **整合測試**：測試Controller的HTTP請求處理

## 🎯 設計優勢

1. **程式碼清晰**：每個Controller的責任明確，一目了然
2. **測試友好**：不需要複雜的依賴注入模擬
3. **維護簡單**：每個物流服務的變更不會影響其他服務
4. **擴展容易**：新增物流服務只需建立新的Controller
5. **錯誤隔離**：一個物流服務的問題不會影響其他服務

## 🔧 擴展建議

### 新增物流服務步驟：
1. 在 `app/Services/` 建立新的服務類別
2. 實作 `LogisticsInterface` 介面
3. 在 `app/Http/Controllers/` 建立對應的Controller
4. 為新Controller建立測試檔案
5. 更新路由設定

### 範例：新增「快遞服務」
```bash
# 1. 建立服務類別
touch app/Services/Express.php

# 2. 建立Controller
touch app/Http/Controllers/ExpressController.php

# 3. 建立測試檔案
touch tests/Unit/Services/ExpressTest.php
touch tests/Feature/Http/Controllers/ExpressControllerTest.php

# 4. 更新路由
# 在routes/web.php中加入Express相關路由
```

## 📋 總結

這個設計模式特別適合：
- **大型專案**：每個服務獨立，易於維護和擴展
- **團隊開發**：責任劃分明確，減少程式碼衝突
- **測試需求高**：完整的測試覆蓋，確保品質
- **業務邏輯複雜**：每個物流服務的特殊邏輯都能獨立處理

記住：**簡單、明確、可測試** 是優秀軟體設計的核心原則！
