# Gemini 專案策略

> 本文件定義專案的策略、方法論與領域知識（Knowledge Base），隨任務演進。
> 行為規則與角色定義請參閱 `system.md`。

---

## 1. 專案規範優先（Source of Truth）

### 1.1 規範層級
- 專案規範 > 通用原則
- 若專案規範與通用原則衝突，**以專案規範為準**

### 1.2 術語一致性（DDD）
- 嚴格使用專案中既有的業務術語（如 `Account` vs `User`）
- 禁止自行創造新術語

### 1.3 設定檔檢查優先順序

確認函式庫或框架可用時，優先檢查：

1. 專案依賴檔（如 `package.json`、`composer.json`、`requirements.txt`、`go.mod`、`Cargo.toml` 等）
2. 專案設定檔（如 `config/`、`.env`、`settings.py` 等）
3. 鄰近檔案的 import/use 語句

---

## 2. 主要工作流程

### 2.1 軟體工程任務

修正錯誤、新增功能、重構或說明程式碼時，依序執行：

1. **理解：** 分析使用者請求與程式碼上下文。大量使用 `search_file_content` 和 `glob` 平行搜尋檔案結構、既有慣例和程式碼模式。用 `read_file` 和 `read_many_files` 驗證假設與理解。
2. **計畫：** 建立一個根據步驟 1 理解的明確且合理的解決方案。必要時以簡短清晰的方式告知使用者計畫。若相關，嘗試透過撰寫單元測試建立自我驗證循環。可用輸出日誌或除錯訊息協助驗證。
3. **實作：** 遵守核心規範，運用可用工具（如 `replace`、`write_file`、`run_shell_command`）執行計畫。
4. **驗證（測試）：** 如可行，透過專案既有測試程序驗證變更。藉由檢查 README、建置設定或既有測試指令找到正確的測試指令與框架。絕不假設標準測試指令。
5. **驗證（標準）：** 非常重要：程式碼變更後，執行專案特定的建置、檢查、型別檢查指令以確保程式碼品質及標準遵守。若不確定指令，可詢問使用者是否需執行及如何執行。

### 2.2 新功能開發

**目標：** 自主實作並交付符合專案最佳實務的功能模組。

1. **理解需求：** 分析使用者請求，明確核心功能、API 端點設計、資料模型及業務邏輯。若缺關鍵資訊，提出明確且精準的詢問。
2. **提案計畫：** 制定開發計畫，向使用者簡潔說明，包含：
   - 資料結構設計
   - 主要模組與關聯
   - 層級架構（Controller / Service / Repository 等）
   - 路由或介面設計
   - 必要的驗證規則
   - 測試策略
3. **使用者同意：** 取得使用者對計畫的認可。
4. **實作：** 按核准計畫自主開發，遵循專案既有架構模式。
   - 使用專案的 CLI 工具生成骨架（若適用）
   - 遵循專案既有的分層模式
   - 確保 IDE 相容（型別註解、文件註解等）
5. **驗證：** 執行測試與靜態分析，確保無錯誤。
6. **收集回饋：** 提供相關 API 文件或測試指令，請求使用者回饋。

---

## 3. SOLID 原則遵循

執行任何程式碼生成或審查時，必須遵循 SOLID 原則：

### 3.1 SRP（Single Responsibility Principle，單一職責原則）
**定義**：每個 class/module 只有單一職責。

**檢查要點**：
- class 名稱是否清楚表達單一職責
- method/function 是否只做一件事
- class 的依賴數量是否合理

**紅旗標誌**：
- ❌ class 名稱包含 `And`、`Or`、`Manager`、`Handler` 但職責不明確
- ❌ method 超過 3 個主要動作
- ❌ 一個 class 依賴超過 7 個其他 class

---

### 3.2 OCP（Open/Closed Principle，開放封閉原則）
**定義**：新功能透過擴展而非修改實現。

**檢查要點**：
- 新增功能是否需要修改現有 class
- 是否使用 Interface 或抽象類別來支援擴展

**紅旗標誌**：
- ❌ 使用 `switch/case` 或 `if-else` 鏈處理類型判斷
- ❌ 修改現有 class 以支援新功能

---

### 3.3 LSP（Liskov Substitution Principle，里氏替換原則）
**定義**：子類別能完全替代父類別。

**檢查要點**：
- 子類別是否改變父類別方法的預期行為
- 子類別是否拋出父類別未定義的例外

**紅旗標誌**：
- ❌ 子類別覆寫方法拋出 `NotImplementedException`
- ❌ 子類別改變父類別方法的預期行為

---

### 3.4 ISP（Interface Segregation Principle，介面隔離原則）
**定義**：介面精簡且專注。

**檢查要點**：
- 介面方法數量是否合理
- 實作類別是否需要實作所有方法

**紅旗標誌**：
- ❌ 介面方法超過 5 個
- ❌ 實作類別有空方法或拋出 `NotSupported`

---

### 3.5 DIP（Dependency Inversion Principle，依賴反轉原則）
**定義**：依賴抽象而非具體實作。

**檢查要點**：
- 是否使用依賴注入
- 是否依賴 Interface 而非具體類別

**紅旗標誌**：
- ❌ 直接實例化具體類別（非 DTO/Entity）
- ❌ 高層模組 import 低層模組具體類別
- ❌ 未使用依賴注入

---

## 4. 多層架構規範

執行任何程式碼生成或審查時，必須遵循多層架構規範：

| 層級 | 允許 | 禁止 |
|-----|-----|-----|
| **Controller/Handler** | Request → Service → Response | 業務邏輯、狀態判斷、Repository 直呼 |
| **Validation** | 格式與型別驗證 | DB 查詢、業務判斷 |
| **Service** | 業務規則、狀態檢核、交易 | - |
| **Repository/DAO** | CRUD 資料存取 | 業務邏輯 |

### Service 層要求
- 必須透過 Interface 依賴 Repository（DIP）
- 驗證失敗需拋出具體 Exception（含錯誤語意）

---

## 5. 架構精神（Skill 引用）

> 詳細的架構知識已模組化至 Agent Skill，將根據任務自動載入。
> 參考路徑：`.gemini/skills/architecture-reviewer/SKILL.md`

執行程式碼生成或審查時，會自動激活以下專家知識：

| Skill | 涵蓋內容 |
|-------|---------|
| **architecture-reviewer** | SOLID 原則、多層架構、DDD、Clean Architecture |
| **security-auditor** | OWASP Top 10、輸入驗證、認證授權、敏感資料處理 |
| **performance-analyst** | N+1 查詢、快取策略、複雜度分析、擴展性評估 |
| **database-architect** | 資料庫設計、索引優化、分表分庫、多租戶隔離 |
| **redis-architect** | Redis 資料結構、分散式鎖、Pub/Sub、高可用架構 |
| **laravel-expert** | 版本差異、Service Container、Middleware、Eloquent 進階 |
| **devops-engineer** | CI/CD、容器化、Kubernetes、監控告警 |
| **qa-tester** | 測試策略、自動化測試、安全測試、效能測試 |
| **ux-designer** | 設計系統、響應式設計、無障礙設計、用戶研究 |
| **business-analyst** | 需求分析、業務流程設計、數據分析、KPI 定義 |
| **api-designer** | RESTful 設計、請求回應規範、API 安全、文檔規範 |
| **code-mentor** | 代碼解讀、設計模式教學、視覺化工具、學習指導 |

### 快速架構選擇指南

| 場景 | 建議架構 |
|-----|---------|
| 簡單 CRUD 應用 | 多層架構 + SOLID |
| 複雜業務邏輯 | DDD + Clean Architecture |
| 高讀寫比差異 | CQRS |
| 需要審計追蹤、時間旅行 | Event Sourcing |
| 複雜領域 + 高效能需求 | DDD + CQRS + Event Sourcing |

**注意**：架構複雜度應與業務複雜度相匹配，避免過度設計。

---

## 6. 專案記憶

> 此區塊記錄專案特定資訊，由 Gemini 在互動過程中累積。

- 使用 `replace` 工具時，若多個方法結尾邏輯（清除快取+回傳）相似（如 `PlatformController`），`old_string` 必須包含該方法獨有的業務邏輯行（如 `edit` 呼叫），以確保唯一匹配。

<!-- 範例格式：
- 專案 X 的錯誤碼定義於 `resources/lang/error.json`
- API 版本控制使用 `/api/v1/` 前綴
- 快取 key 命名規則：`{module}:{entity}:{id}`
-->
