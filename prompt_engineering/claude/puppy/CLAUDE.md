# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 1. 快速參考指令

### 開發
- `pnpm install` — 安裝依賴
- `pnpm run start:dev` — 啟動開發伺服器（`NODE_ENV=dev`，載入 `.env.local`）
- `pnpm run start:staging` — 啟動測試環境（`NODE_ENV=staging`，載入 `.env.mars`）
- `pnpm run start:prod` — 啟動正式環境（`NODE_ENV=prod`，載入 `.env.venus`）

### 構建與檢查
- `pnpm run build` — 編譯 TypeScript 至 `dist/`
- `pnpm run lint` — 執行 ESLint 並自動修復
- `pnpm run format` — 執行 Prettier 格式化 `src/` 和 `test/`

### 測試
- `pnpm run test` — 執行所有單元測試（`*.spec.ts`）
- `pnpm run test -- --testPathPattern=platforms/mg` — 執行特定平台的測試
- `pnpm run test:watch` — 監視模式
- `pnpm run test:cov` — 覆蓋率報告（輸出至 `/coverage`）
- `pnpm run test:e2e` — E2E 測試（使用 `test/jest-e2e.json`）

### 資料庫
- `pnpm run migration` — 執行 TypeORM 遷移（`src/scripts/migration.ts`）
- `pnpm run typeorm` — 直接執行 TypeORM CLI

---

## 2. 專案結構與架構

### 高層概覽

Puppy 是基於 NestJS 的代理層（Proxy）後端服務，介於星城系統、總部錢包與遊戲供應商（MG、AB、PP）三方之間進行轉接。星城系統透過 HTTP（JWT 認證）將玩家請求（取得遊戲連結、報表查詢、強制離線等）發送到 Puppy，Puppy 將請求轉發給對應的遊戲供應商。遊戲供應商則透過 HTTP 反向呼叫 Puppy 進行身分驗證與交易（下注、派彩等）。Puppy 透過 TCP Stars Protocol 與總部錢包通訊，處理登入驗證、交易（扣款/加款）與餘額查詢。每個平台是自包含模組，具備獨立資料庫。

#### 名詞對照

| 角色 | 別名 | 說明 | 通訊方式 |
|------|------|------|----------|
| 星城系統 | stars、星城 | 外部服務，接受前端玩家請求，轉發至 Puppy | HTTP（JWT 認證） |
| Puppy | 我方 | 代理層，轉接三方系統 | HTTP / TCP |
| 總部錢包 | 總部、錢包、game server | 錢包與會員系統，管理玩家餘額與登入狀態 | TCP 長連線（Stars Protocol） |
| 遊戲供應商 | platform、供應商、廠商 | 遊戲內容提供者（MG、AB、PP 等） | HTTP |

```
src/
├── config/                 # 全域配置（env.config.ts、database-config.factory.ts）
├── platforms/              # 平台模組（核心業務）
│   ├── mg/                # MG (Microgaming) — 目前唯一啟用
│   ├── ab/                # AB (AllBet) — 已停用
│   └── pp/                # PP (Pragmatic Play) — 開發中
├── wallet/                # 錢包通訊層（Stars Protocol / TCP）
│   ├── tcpclient.service.ts   # 低層 TCP 連接（3 秒心跳、自動重連）
│   ├── wallet.service.ts      # 高階 API（Region 路由）
│   └── stars_protocol/        # 二進制協議（封包工廠、解析器、接收器）
├── redis/                 # Redis 模組（ioredis，keyPrefix: `${PROJECT_NAME}:`）
├── http-client/           # HTTP 包裝（node-fetch，通用 fetchData<T>）
├── controllers/           # 全域控制器（healthy、test）
├── ws.gateway.ts          # WebSocket 閘道器（埠 3000，硬編碼）
├── app.module.ts          # 根模組
└── main.ts                # 啟動（WsAdapter、CORS: '*'、API_SERVER_PORT）
```

### 平台模組啟用狀態

`app.module.ts` 中控制平台啟停：

```typescript
imports: [
    loadEnvConfig(),
    ScheduleModule.forRoot(),
    MgModule,        // 啟用
    // AbModule,     // 停用
    // PpModule,     // 開發中
]
```

### 平台模組內部結構（以 MG 為範本）

每個平台模組遵循相同的分層架構：

```
platforms/{platform}/
├── {platform}.module.ts          # 模組定義、中間件設置
├── {platform}.service.ts         # 核心業務邏輯
├── {platform}.controller.ts      # 公開 API 端點
├── {platform}-internal.controller.ts  # 內部端點（IP 限制，MG 獨有）
├── {platform}.schedule.ts        # 排程任務（MG 獨有）
├── {platform}.service.factory.ts # 服務工廠
├── entities/                     # TypeORM 實體
├── migrations/                   # 資料庫遷移
├── middleware/                   # 請求驗證、IP 白名單
├── services/                     # 領域服務
├── commands/                     # 命令模式處理器（MG 獨有）
├── enum/                         # Redis 鍵、遊戲類型等列舉
├── constants/                    # 地區配置（region-config.ts）
├── database/                     # 資料庫連接配置
└── dto.ts                        # 資料轉移物件
```

### 關鍵架構模式

#### 多資料庫命名連接
每個平台使用獨立的 MySQL 資料庫，透過 TypeORM 命名連接隔離：

```typescript
// MG 平台
@InjectRepository(Users, 'platform_mg')
// PP 平台
@InjectRepository(PpBetRecord, 'platform_pp')
// AB 平台（預設連接，無命名）
@InjectRepository(User)
```

#### 環境配置對應
`NODE_ENV` → `.env.*` 映射（`src/config/env.config.ts`）：

| NODE_ENV | 檔案 |
|----------|------|
| `dev` | `.env.local` |
| `staging` | `.env.mars` |
| `prod` | `.env.venus` |

未設定 `NODE_ENV` 會拋出錯誤。

#### 命令模式（MG 平台）
排程任務使用命令模式解耦：

```
MgSchedule（@Cron）
  → MgCommandService.execute(command)
    → ICommandHandler.handle()  // e.g. RefreshGameCodesHandler
      → MgGameCodesService.refresh()
```

- 命令介面：`commands/command.interface.ts`
- 分發服務：`commands/command.service.ts`（Map<name, handler>）
- 處理器：`commands/handlers/*.handler.ts`

#### 錢包通訊（Stars Protocol）
二進制 TCP 協議，流程：
1. `StarProtocolService.PacketFactory` 建立請求封包
2. `TcpClientService` 透過 `net.Socket` 傳送（3 字節長度頭）
3. `Receiver`（Observer 模式）等待回應
4. 解析後返回結果

TCP 特性：3 秒心跳、1 秒重連延遲、二進制序列化/反序列化。

#### WebSocket 閘道器
`WsStartGateway` 監聽埠 3000，處理事件：
- `healz` — 心跳（回傳 'pong'）
- `login` / `spin` / `get_balance` — 錢包操作（1 秒逾時、最多 3 次重試）

回應格式：`{ event: string, data: any }`

#### 中間件與存取控制
各平台透過 `module.configure()` 掛載中間件：

| 中間件 | 用途 | 平台 |
|--------|------|------|
| `RequestMiddleware` | 請求簽名驗證 | MG |
| `InternalIpMiddleware` | 內部端點 IP 白名單 | MG |
| `HashValidationMiddleware` | Hash 簽名驗證 | PP |
| `IpWhitelistMiddleware` | IP 白名單（`PLATFORM_PP_ALLOWED_IPS`） | PP |

#### Redis 使用慣例
- 注入 token：`'REDIS'`
- Key 前綴：`${PROJECT_NAME}:`（即 `puppy:`）
- 各平台在 `enum/redis_key.enum.ts` 定義鍵名常數
- MG 常用鍵：TOKEN、PLAYER、BETTING_PROFILES、TRANSACTION、BET_RECORD、GAME_CODES
- 交易併發控制：Redis 鎖 + TTL 60 秒

---

## 3. 程式碼風格與慣例

### Prettier
- 單引號、必須分號、ES5 尾隨逗號
- 行寬 80、縮排 4 空格

### ESLint
- 解析器：`@typescript-eslint/parser`
- 已關閉：`explicit-function-return-type`、`explicit-module-boundary-types`、`no-explicit-any`、`interface-name-prefix`

### TypeScript
- 目標：ES2021、模組：CommonJS
- `strictNullChecks: false`、`noImplicitAny: false`

### 命名慣例
- 類別：PascalCase（`MgService`、`PpBetRecord`）
- 變數/函數：camelCase（`getUserBalance`）
- 檔案：kebab-case（`mg.service.ts`），實體用 snake_case（`bet_record.entity.ts`）
- 列舉值：UPPER_SNAKE_CASE（`GAME_CODE`、`REDIS_KEY`）

---

## 4. 環境變數（鍵名，不含值）

### 全域
`PROJECT_NAME`、`API_SERVER_PORT`、`SYNCHRONIZE`、`STARS_TAIWAN_WALLET_SERVER_ENDPOINT`、`IMAGE_DOMAIN_NAME`、`WALLET_CHECK_API_URL`

### 資料庫（主）
`DATABASE_HOST`、`DATABASE_PORT`、`DATABASE_USERNAME`、`DATABASE_PASSWORD`、`DATABASE_NAME`

### Redis
`REDIS_HOST`、`REDIS_PORT`、`REDIS_PASSWORD`、`REDIS_DB`

### MG 平台
- API：`PLATFORM_MG_DOMAIN`、`PLATFORM_MG_STS_DOMAIN`
- 地區（TW/MY/IN/ID/OVERSEAS）：`PLATFORM_MG_{地區}_GROUP_ID`、`_AGENT_CODE`、`_CLIENT_SECRET`、`_CURRENCY`
- DB：`PLATFORM_MG_DATABASE_HOST`、`_PORT`、`_USERNAME`、`_PASSWORD`、`_NAME`

### PP 平台
- API：`PLATFORM_PP_API_DOMAIN`、`PLATFORM_PP_SECURE_LOGIN`、`PLATFORM_PP_SECRET_KEY`、`PLATFORM_PP_PROVIDER_ID`、`PLATFORM_PP_ALLOWED_IPS`
- 台灣：`PLATFORM_PP_TW_GROUP_ID`、`PLATFORM_PP_TW_CURRENCY`
- DB：`PLATFORM_PP_DATABASE_HOST`、`_PORT`、`_USERNAME`、`_PASSWORD`、`_NAME`

### AB 平台
- API：`PLATFORM_AB_DOMAIN`、`PLATFORM_AB_AGENT`、`PLATFORM_AB_SUFFIX`、`PLATFORM_AB_OPERATOR_ID`、`PLATFORM_AB_ALLBET_KEY`、`PLATFORM_AB_PARTNER_KEY`
- DB：`PLATFORM_AB_DATABASE_*`

---

## 5. 埠口配置

| 用途 | 埠口 | 來源 |
|------|------|------|
| HTTP API | `API_SERVER_PORT` 環境變數 | `main.ts` |
| WebSocket | 3000（硬編碼） | `ws.gateway.ts` |

兩個埠不能衝突。

---

## 6. 新增平台的步驟

1. 建立 `src/platforms/{platform}/` 目錄，參考 MG 的完整結構
2. 建立模組、控制器、服務、實體、DTO、中間件、列舉
3. 在 `database/config.ts` 建立資料庫配置，使用命名連接 `'platform_{platform}'`
4. 在 `migrations/` 建立初始遷移
5. 在 `.env.*` 檔案中新增該平台的環境變數
6. 在 `app.module.ts` 中匯入模組
