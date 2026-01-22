# Stars - 批量更新遊戲語系設定 - 實作規劃

## 版本記錄

| 版本 | 更新時間 | 變更摘要 |
|------|---------|----------|
| v1.0 | 2026-01-22 | 初次規劃：移除 MantainOperateRecord 使用 |

---

## 1. 需求概述

### 1.1 背景與目標
- **需求背景**：目前控端更新遊戲語系設定（支援語系 `support_langs`、預設語系 `default_lang`）僅能單筆操作，效率較低。
- **功能目標**：新增批量更新遊戲語系設定的 API，允許控端一次對多個遊戲進行語系配置的調整。
- **影響範圍**：控端 API (`GameController`)、遊戲語系服務 (`GameSupportLanguage`)。

### 1.2 範圍界定
- **包含**：
    - 新增批量更新 API。
    - 擴充 Service 以支援批量更新語系關聯表。
    - 清除相關快取（含 Provider 端快取）。
- **不包含**：
    - 前端介面實作。
    - 操作記錄寫入（`MantainOperateRecord` 不適用於此功能）。
- **假設條件**：
    - 輸入的 `game_ids` 必須存在。
    - `default_lang` 必須包含在 `support_langs` 之中。

---

## 2. 系統架構變更

### 2.1 資料庫變更
無資料表結構變更。

### 2.2 設定變更
無設定檔變更。

### 2.3 程式碼結構
#### 修改檔案
| 檔案路徑 | 修改內容摘要 |
|---------|-------------|
| `app/Http/Controllers/GameController.php` | 新增 `setMultiLanguage` 方法 |
| `app/Services/GameSupportLanguage.php` | 新增 `multiEdit` 方法以支援批量寫入 |

---

## 3. API 規格設計

### 3.1 端點總覽
| Method | Path | 說明 | 權限 |
|--------|------|-----|-----|
| PUT | `/api/backend/game/mult_language` | 批量更新遊戲語系設定 | `auth:back` |

### 3.2 詳細規格

#### [PUT] /api/backend/game/mult_language
**說明**：依接收參數批量設定多個遊戲的支援語系與預設語系。

**Request**
```json
{
  "game_ids": [101, 102],
  "default_lang": "en",
  "support_langs": ["en", "zh-tw", "ja"],
  "description": "批量調整語系設定"
}
```

**Validation Rules**
| 欄位 | 規則 | 說明 |
|-----|-----|-----|
| game_ids | required, array | 遊戲 ID 列表 |
| game_ids.* | required, integer | 單個遊戲 ID |
| default_lang | required, string | 預設語系（必須存在於 support_langs） |
| support_langs | required, array | 支援語系列表 |
| support_langs.* | required, string | 語系代碼（需為系統有效語系） |
| description | string, max:200 | 操作備註（目前僅接收不記錄） |

**Response - Success (200)**
```json
{
  "count": 2,
  "list": [
    {
      "id": 101,
      "name": "Game A",
      "default_lang": "en",
      "support_langs": ["en", "zh-tw", "ja"],
      "...": "..."
    },
    {
      "id": 102,
      "name": "Game B",
      "default_lang": "en",
      "support_langs": ["en", "zh-tw", "ja"],
      "...": "..."
    }
  ]
}
```

**Response - Error**
| HTTP Code | Error Code | 說明 |
|-----------|-----------|-----|
| 400 | validation_error | 參數驗證失敗（如預設語系不在支援列表中） |
| 500 | runtime_exception | 語系代碼無效 (no_such_language) |

### 3.3 權限設計
| 操作 | 允許角色 | 特殊條件 |
|-----|---------|---------|
| 批量更新語系 | Backend User | 需具備 `auth:back` 權限 |

---

## 4. 實作細節

### 4.1 實作任務清單
依序列出可直接執行的原子化任務：

| # | 任務 | 依賴 |
|---|-----|-----|
| 1 | 修改 `app/Services/GameSupportLanguage.php`：新增 `multiEdit` 方法 | - |
| 2 | 修改 `app/Http/Controllers/GameController.php`：新增 `setMultiLanguage` 方法 | 1 |
| 3 | 實作 Controller 邏輯：驗證參數、Transaction 處理、呼叫 Service、清除快取 | 2 |
| 4 | 驗證 API：測試正常流程與錯誤邊界 | 3 |

### 4.2 關鍵邏輯（提供偽代碼）

#### GameSupportLanguage Service
```php
public function multiEdit(array $gameIds, array $langs): void
{
    // 檢查語系有效性
    if (! $this->validateLangs($langs)) {
         throw new RuntimeException('no_such_language');
    }

    $data = [];
    $now = now();
    foreach ($gameIds as $gameId) {
        foreach ($langs as $lang) {
            $data[] = [
                'game_id' => $gameId,
                'lang' => $lang,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
    }
    
    // 批次刪除舊設定
    Model::whereIn('game_id', $gameIds)->delete();
    // 批次寫入新設定
    Model::insert($data);
    
    // 清除快取
    foreach ($gameIds as $gameId) {
        $this->removeCache($gameId);
    }
}
```

#### GameController
```php
public function setMultiLanguage(Request $request)
{
    // 1. 驗證
    // 檢查 support_langs 是否為有效系統語系
    // 檢查 default_lang 是否在 support_langs 中
    
    // 2. 執行
    DB::transaction(function () {
        // 更新 Games 表的 default_lang
        GameService::multiEdit($gameIds, ['default_lang' => $defaultLang]);
        
        // 更新 GameSupportLanguage 表
        GameSupportLanguageService::multiEdit($gameIds, $supportLangs);
        
        // 注意：不使用 MantainOperateRecord 記錄操作
    });
    
    // 3. 清除快取 (參考 setMultiVip)
    // 取得受影響的遊戲列表
    // 遍歷遊戲列表：
    //   清除 Games 快取
    //   清除 ProviderGames 快取 (針對所有 enabled providers)
    // 清除 GameSort 快取
    
    return GameService::lists(['ids' => $gameIds]);
}
```

### 4.3 錯誤處理設計
| Exception | 錯誤碼 | 觸發條件 |
|-----------|-------|---------|
| RuntimeException | no_such_language | 傳入無效的語系代碼 |
| ValidationException | invalid_default_lang | default_lang 不在 support_langs 中 |

### 4.4 Design Patterns
| Pattern | 用途 | 應用位置 |
|---------|-----|---------|
| Service Layer | 封裝批量資料庫操作 | `GameSupportLanguage::multiEdit` |

---

## 5. 部署與驗證

### 5.1 部署注意事項
| 階段 | 項目 | 說明 |
|-----|-----|-----|
| 部署後 | Cache | 確認 API 路由生效，視情況執行 `route:cache` |

### 5.2 驗證項目
#### 單元測試
| 測試類別 | 測試項目 | 預期結果 |
|---------|---------|---------|
| GameSupportLanguageTest | `multiEdit` | 正確刪除舊資料並寫入新資料 |

#### 整合測試
| 測試類別 | 測試情境 | 預期結果 |
|---------|---------|---------|
| GameControllerTest | 正常批量更新 | 資料庫與快取皆更新，返回更新後列表 |
| GameControllerTest | `default_lang` 不在 `support_langs` | 回傳 422 驗證錯誤 |
| GameControllerTest | `support_langs` 含無效語系 | 回傳錯誤訊息 |

### 5.3 自我檢查點

#### 基本規範
- [ ] 符合專案規範（參考 `GEMINI.md`）
- [ ] 使用 `DB::transaction` 確保資料一致性
- [ ] 完整清除相關快取（包含 Provider 層級）
