# test-edit-clientgamecontroller-platformgamecontroller-20260119-1815.md

## 變更摘要

| 項目 | 內容 |
|-----|-----|
| 變更檔案數 | 5 個 |
| 變更類型 | 新功能 / 修復 / 重構 |
| 影響範圍 | Games Factory, ClientGameController 測試 (DemoLink, GameLink), GameController 測試 (Create, Edit) |

---

## 問題清單

### 🔴 嚴重（必須修復）
| 檔案:行號 | 問題描述 | 建議修復 |
|----------|---------|---------|
| `tests/Integration/ClientGameController/GetGameLinkIntegrationTest.php:100` | **測試破壞風險**：`GamesFactory` 的 `forTesting` 已移除隱式語系建立，但此處 `setDefault` 未顯式呼叫 `withSupportLanguages`，將導致依賴語系資料的測試失敗。 | 修改為 `$this->game = Games::factory()->forTesting()->withSupportLanguages(ILanguage::DEFAULT_LANG_LIST)->create(...);` |
| `tests/Integration/ClientGameController/GetDemoLinkIntegrationTest.php:100` | **測試破壞風險**：同上，`GetDemoLink` 測試亦未更新 Factory 呼叫方式。 | 同上，需顯式呼叫 `withSupportLanguages(...)`。 |

### 🟡 警告（建議修復）
| 檔案:行號 | 問題描述 | 建議修復 |
|----------|---------|---------|
| `tests/Integration/ClientGameController/GetGameLinkIntegrationTest.php:729` | 測試方法命名錯誤，`test_get_demo_link...` 出現在 GameLink 測試中，疑為複製貼上錯誤。 | 修改為 `test_get_game_link...` 以符合測試目標與檔案上下文。 |

### 🔵 建議（可選修復）
| 檔案:行號 | 問題描述 | 建議修復 |
|----------|---------|---------|
| `database/factories/GamesFactory.php` | `withSupportLanguages` 雖然已優化為 Bulk Insert，但目前寫死使用 `management` connection。 | 建議改用 `GameSupportLanguage` Model 的 connection 設定，例如 `(new GameSupportLanguage())->getConnectionName()`，以保持彈性。 |

---

## 審查結論

### 各類別評分

| 類別 | 權重 | 得分 | 狀態 | 說明 |
|-----|-----|-----|-----|-----|
| SOLID 原則 | 25% | 95 | ✅ | Factory 重構後，職責更加單一且明確，消除了隱藏副作用。 |
| 程式碼品質 | 20% | 80 | ⚠️ | 測試檔案中存在複製貼上導致的命名錯誤；Factory 重構未同步更新測試呼叫。 |
| 功能正確性 | 15% | 60 | ❌ | **Factory 變更導致現有測試邏輯損壞**，必須修正測試案例中的 Factory 呼叫。 |
| 安全性 | 15% | 100 | ✅ | 無明顯安全性問題。 |
| 多層架構 | 15% | 100 | ✅ | 測試代碼遵守架構分層，透過 API 進行整合測試。 |
| 效能 | 5% | 100 | ✅ | Factory 改用 Bulk Insert 且移除不必要的隱式建立，效能提升。 |
| 可測試性 | 5% | 95 | ✅ | 顯式建立關聯資料讓測試邊界條件（如無語系情境）更容易達成。 |

### 總分計算

**加權總分**：85 / 100

### 合併判定

| 分數區間 | 判定 | 行動 |
|---------|-----|-----|
| 70-89 | ⚠️ 良好 | 修復警告後可合併 |

**最終結論**：⚠️ 修復後可合併

**關鍵行動**：
1.  請務必更新所有使用 `Games::factory()->forTesting()` 的整合測試，補上 `->withSupportLanguages(...)`，否則 CI/CD 流程將會失敗。
2.  修正測試方法命名錯誤。
