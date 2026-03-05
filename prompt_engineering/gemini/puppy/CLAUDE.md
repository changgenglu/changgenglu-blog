# CLAUDE.md

## 1. 快速參考：指令

### 開發

-   `pnpm install` - 安裝依賴（使用 pnpm）
-   `pnpm run start:dev` - 啟動開發伺服器（埠號由 `API_SERVER_PORT` 環境變數決定，預設 3001）
-   `pnpm run start:staging` - 啟動測試環境（載入 `.env.mars`）
-   `pnpm run start:prod` - 啟動正式環境（載入 `.env.venus`）

### 構建與檢查

-   `pnpm run build` - 編譯 TypeScript 至 dist/
-   `pnpm run lint` - 執行 ESLint 並自動修復
-   `pnpm run format` - 執行 Prettier 格式化 src/ 和 test/

### 測試

-   `pnpm run test` - 執行所有單元測試（符合 `*.spec.ts` 的檔案）
-   `pnpm run test:watch` - 在監視模式下執行測試
-   `pnpm run test:cov` - 執行測試並產生覆蓋報告至 /coverage
-   `pnpm run test:e2e` - 執行 E2E 測試（使用 jest-e2e.json 配置）
-   `pnpm run test:debug` - 使用 Node 偵錯器偵錯測試

### 資料庫

-   `pnpm run migration` - 執行 TypeORM 遷移（使用 `src/scripts/migration.ts`）
-   `pnpm run typeorm` - 直接執行 TypeORM CLI 命令

---

## 2. 專案結構與架構

### 高層概覽

Puppy 是一個基於 NestJS 的後端服務，用於管理遊戲平台整合（MG、AB），並透過 TCP（Stars Protocol）進行錢包通訊。架構採用平台模組化設計，每個平台具有獨立的資料庫和業務邏輯。

```
src/
├── config/                 # 全域配置
│   ├── env.config.ts      # NODE_ENV → .env 檔案映射（dev、staging、prod）
│   ├── database-config.factory.ts
│   └── typeorm-cli.config.ts
├── platforms/              # 平台特定模組
│   ├── mg/                # MG 平台
│   │   ├── mg.module.ts   # 模組定義、中間件設置
│   │   ├── mg.service.ts  # 業務邏輯
│   │   ├── mg.controller.ts # 公開 API 端點
│   │   ├── mg-internal.controller.ts # 內部端點（IP 限制）
│   │   ├── mg.schedule.ts # 排程任務（命令模式）
│   │   ├── entities/      # TypeORM 實體
│   │   ├── migrations/    # 資料庫遷移
│   │   ├── middleware/    # 請求/IP 驗證
│   │   ├── database/      # 資料庫配置
│   │   ├── commands/      # 命令模式處理器
│   │   ├── services/      # 領域服務（例如 game-codes.service.ts）
│   │   └── enum/          # 列舉（遊戲、Redis 鍵）
│   └── ab/                # AB 平台（相似結構）
├── wallet/                # 錢包通訊層
│   ├── wallet.module.ts
│   ├── wallet.service.ts
│   ├── tcpclient.service.ts # 低層 TCP 用戶端（Stars Protocol）
│   └── stars_protocol/    # Stars Protocol 實作
│       ├── packet/        # 請求/回應封包
│       ├── message/       # 訊息型別
│       ├── buffer/        # 序列化/反序列化
│       └── stars_protocol.service.ts # 協議處理器
├── redis/                 # Redis 整合
│   └── redis.module.ts
├── http-client/           # HTTP 用戶端包裝
├── logger/                # 日誌中間件
├── controllers/           # 全域控制器（健康檢查、測試）
├── ws.gateway.ts          # WebSocket 閘道器（埠 3000）
│   └── 處理器：login、spin、get_balance
├── app.module.ts          # 根模組
├── main.ts                # 應用程式啟動
└── app.controller.ts      # 根控制器
```

### 關鍵架構模式

#### 1. 平台模組化

每個平台（MG、AB）都是一個**自包含的 NestJS 模組**，具備：

-   獨立的資料庫連接（命名為：`'platform_mg'`、`'platform_ab'`）
-   獨立的業務邏輯和實體
-   自己的中間件和路由
-   可透過 `app.module.ts` 中的匯入來啟用/停用

```typescript
// app.module.ts
imports: [
    loadEnvConfig(),
    ScheduleModule.forRoot(),
    MgModule,
    // AbModule, // 目前已停用
];
```

#### 2. 環境配置

`NODE_ENV` 變數控制載入哪個 `.env` 檔案：

-   **dev** → `.env.local`（開發環境）
-   **staging** → `.env.mars`（測試環境）
-   **prod** → `.env.venus`（正式環境）

這在 `src/config/env.config.ts` 中強制執行。在啟動前設定 `NODE_ENV`：

```bash
NODE_ENV=dev pnpm run start:dev
NODE_ENV=staging pnpm run start:staging
NODE_ENV=prod pnpm run start:prod
```

#### 3. 錢包通訊（Stars Protocol）

-   **TCP 閘道器**：`WsStartGateway` 監聽**埠 3000**（WebSocket）
-   **協議**：用於錢包餘額/交易同步的二進制協議
-   **流程**：
    1. 用戶端透過 WebSocket 連線至 WsStartGateway
    2. 閘道器透過 `StarProtocolService.PacketFactory` 建立請求封包
    3. `TcpClientService` 向錢包伺服器傳送二進制封包
    4. Receiver 等待回應（包含逾時和重試邏輯）
    5. 回應被解析並返回至用戶端

#### 4. 資料庫架構

-   **TypeORM ORM** 搭配 MySQL
-   **命名連接**：每個平台有隔離的資料庫
    -   MG 平台使用連接名 `'platform_mg'`
    -   AB 平台使用獨立的無名連接
-   **遷移**：平台特定位置於 `src/platforms/{platform}/migrations/`

#### 5. 命令模式（MG 平台）

遊戲代碼刷新使用命令模式：

```
MgSchedule（排程任務）
  → MgCommandService.execute(refreshGameCodesCommand)
    → RefreshGameCodesHandler.handle()
      → MgGameCodesService.refresh()
```

這允許非同步、可測試的命令處理。

#### 6. 中間件與存取控制

-   **RequestMiddleware**：驗證對公開端點的請求
-   **InternalIpMiddleware**：限制內部端點只允許白名單 IP 存取
-   透過 `module.configure()` 應用於特定路由

---

## 3. 程式碼風格與慣例

### ESLint 與 Prettier

-   **解析器**：`@typescript-eslint/parser`
-   **外掛**：`@typescript-eslint/eslint-plugin`、`prettier`
-   **行寬**：80 字元
-   **制表寬度**：4 個空格
-   **引號**：單引號（`'`）
-   **分號**：必須
-   **尾隨逗號**：ES5 風格（在物件/陣列中，不在函數參數中）

**TypeScript 規則**（寬鬆）：

-   不需要明確的返回型別
-   允許 `any` 型別（已停用）
-   無介面名稱前綴要求
-   無明確的模組邊界型別要求

### 命名慣例

-   **類別**：PascalCase（`UserService`、`LoginMessage`）
-   **變數/函數**：camelCase（`getUserBalance`、`isValidToken`）
-   **檔案**：kebab-case 用於工具，PascalCase 用於類別（`user.service.ts`、`User.entity.ts`）
-   **列舉**：UPPER_SNAKE_CASE 用於值（`GAME_CODE`、`REDIS_KEY`）

### 模組組織

每個功能模組遵循：

1. **控制器** → 路由處理器、請求驗證
2. **服務** → 業務邏輯、透過儲存庫的資料庫查詢
3. **實體** → TypeORM 實體定義
4. **DTO** → 資料轉移物件用於驗證
5. **中間件** → 請求預處理
6. **資料庫配置** → 連接與遷移設置

---

## 4. 測試

### 單元測試

-   **位置**：`src/**/*.spec.ts`（與原始碼相同位置）
-   **框架**：Jest 搭配 ts-jest 轉換器
-   **執行**：`pnpm run test`、`pnpm run test:watch`

### E2E 測試

-   **位置**：`test/` 目錄
-   **配置**：`test/jest-e2e.json`
-   **執行**：`pnpm run test:e2e`

### 覆蓋率

-   **命令**：`pnpm run test:cov`
-   **輸出**：`/coverage` 目錄
-   **包含**：所有 TypeScript 檔案（`**/*.(t|j)s`）

---

## 5. 開發重要事項

### 環境變數

-   **每個 NODE_ENV 都需要**：所有 env 檔案（`.env.local`、`.env.mars`、`.env.venus`）必須存在
-   **關鍵變數**：
    -   `API_SERVER_PORT`：HTTP 伺服器埠（例如 3001）
    -   `STARS_TAIWAN_WALLET_SERVER_ENDPOINT`：錢包伺服器 URL:埠
    -   每個平台的資料庫憑證
    -   Redis 連接詳細資訊

### 資料庫遷移

-   MG 平台遷移位於 `src/platforms/mg/migrations/`
-   透過 `pnpm run migration` 執行
-   使用 `TypeOrmModule.forRootAsync()` 搭配 `DatabaseConfigService`

### WebSocket 閘道器（WsStartGateway）

-   **埠**：3000（硬編碼，不能與 HTTP 埠衝突）
-   **處理器**：
    -   `healz` - 心跳（返回 'pong'）
    -   `login` - 錢包登入（最多重試 3 次）
    -   `spin` - 遊戲旋轉交易（最多重試 3 次）
    -   `get_balance` - 獲取使用者餘額（最多重試 3 次）
-   **重試邏輯**：每次嘗試 1 秒逾時，最多 3 次重試
-   **回應格式**：`{ event: string, data: any }`

### TCP 用戶端（錢包通訊）

-   `TcpClientService` 管理與錢包伺服器的持久連接
-   在 `WsStartGateway` 建構函式中手動實例化（未注入）
-   `StarProtocolService.PacketFactory` 建立二進制請求封包
-   `Receiver`（來自 `TcpClientService`）發出解析的回應訊息

### Redis 使用

-   透過平台模組中的 `RedisModule` 匯入
-   用於快取遊戲代碼、會話資料、速率限制
-   關鍵列舉：`src/platforms/{platform}/enum/redis_key.enum.ts`

### 多資料庫設置

查詢實體時：

```typescript
// MG 平台（命名連接 'platform_mg'）
@InjectRepository(Users, 'platform_mg')
usersRepository: Repository<Users>

// AB 平台（預設連接）
@InjectRepository(User)
usersRepository: Repository<User>
```

---

## 6. 部署考量

### 構建流程

```bash
pnpm install
pnpm run lint
pnpm run test
pnpm run build
```

輸出：`dist/` 目錄已準備好供 Node.js 執行

### 環境設置

1. 將 `NODE_ENV` 設定為目標環境（dev、staging、prod）
2. 建立相應的 `.env.*` 檔案並填入必要變數
3. 確保 MySQL 資料庫存在且可存取
4. 配置 Redis 連接詳細資訊
5. 設定錢包伺服器端點和身份驗證

### 埠口配置

-   =**HTTP API**：`API_SERVER_PORT` 環境變數（通常 3001）
-   =**WebSocket**：埠 3000（硬編碼）
-   =確保部署目標中兩個埠都可用

---

## 7. 常見開發任務

### 新增平台

1. 建立 `src/platforms/{platform}/` 目錄
2. 新增模組、控制器、服務、實體
3. 建立継承自 `DatabaseConfigService` 的資料庫配置
4. 新增遷移目錄
5. 在模組的 `forRootAsync()` 中建立 TypeORM 連接
6. 在 `app.module.ts` 中匯入模組

### 新增 API 端點

1. 在平台控制器中新增方法
2. 在服務中實作業務邏輯
3. 透過 DTO 和 class-validator 新增驗證
4. 如需要，透過 `module.configure()` 新增中間件
5. 新增單元測試（\*.spec.ts）

### 更新資料庫結構

1. 在 `src/platforms/{platform}/migrations/` 中建立新遷移
2. 修改實體檔案以符合遷移
3. 執行 `pnpm run migration` 以應用
4. 視需要更新服務/儲存庫

### 新增排程任務

1. 在模組匯入中注入 `@nestjs/schedule`（已配置）
2. 在服務中使用 `@Cron()` 或 `@Interval()` 裝飾器
3. 或實作命令模式，如 MG 的 `RefreshGameCodesHandler`
