# Puppy 專案策略

> 本文件定義 `puppy` 專案的架構、技術棧與開發規範。

---

## 1. 專案概覽 (Project Overview)

`puppy` 是一個基於 **NestJS** 框架開發的後端服務，主要處理遊戲平台（如 MG, AB）的整合與錢包通訊。專案採用 TypeScript 開發，並整合了 WebSocket (WS) 與 TCP 通訊協議，用於處理即時遊戲邏輯與錢包餘額同步。

### 核心技術棧
- **Framework:** NestJS (Node.js)
- **Language:** TypeScript
- **Database:** MySQL (使用 TypeORM 進行 ORM 管理)
- **Cache:** Redis (使用 ioredis)
- **Communication:** 
    - HTTP (Express)
    - WebSocket (@nestjs/websockets)
    - TCP (自定義 TcpClientService 用於錢包通訊)
- **Environment Management:** 使用 `.env.mars` (Staging) 與 `.env.venus` (Prod) 進行多環境配置。

---

## 2. 核心架構 (Core Architecture)

專案結構遵循 NestJS 的模組化設計：

- **`src/app.module.ts`**: 應用入口模組，動態載入環境配置。
- **`src/platforms/`**: 存放不同遊戲平台的整合邏輯（如 `mg`, `ab`）。
    - 每個平台擁有自己的 Controller, Service, Entities, Migrations 等。
- **`src/wallet/`**: 錢包通訊核心。
    - `tcpclient.service.ts`: 負責與錢包伺服器建立 TCP 連線。
    - `stars_protocol/`: 實作錢包專屬通訊協議 (Stars Protocol)。
- **`src/ws.gateway.ts`**: WebSocket 閘道器，處理 `login`, `spin`, `get_balance` 等即時指令。
- **`src/config/`**: 配置管理，包含 TypeORM 與環境變數載入邏輯。

---

## 3. 運行與測試指令 (Building and Running)

依據 `package.json` 定義的腳本：

### 安裝依賴
```bash
pnpm install
```

### 啟動服務
- **開發環境 (Dev):** `pnpm run start:dev` (預設載入 `.env.local`)
- **測試環境 (Staging):** `pnpm run start:staging` (載入 `.env.mars`)
- **正式環境 (Prod):** `pnpm run start:prod` (載入 `.env.venus`)

### 測試
- **單元測試:** `pnpm run test`
- **E2E 測試:** `pnpm run test:e2e`
- **覆蓋率報告:** `pnpm run test:cov`

### 資料庫遷移 (TypeORM)
- **執行遷移:** `pnpm run migration`

---

## 4. 開發規範 (Development Conventions)

### 環境變數規則
- 修改 `src/config/env.config.ts` 必須確保 `NODE_ENV` 對應到正確的 `.env` 檔案。
- **Staging:** `.env.mars`
- **Prod:** `.env.venus`

### 通訊協議規範
- 與錢包伺服器通訊時，優先使用 `StarProtocolService` 與 `TcpClientService`。
- WebSocket 閘道器 (`WsStartGateway`) 監聽埠號為 **3000**。

### 程式碼風格
- 遵循 **SOLID 原則** 與 NestJS 官方最佳實務。
- 使用 Prettier 進行格式化：`pnpm run format`。
- 使用 ESLint 進行靜態檢查：`pnpm run lint`。

---

## 5. 待辦事項 (TODO)
- [ ] 補完 `AbModule` 的整合 (目前在 `AppModule` 中被註解)。
- [ ] 完善各平台的單元測試覆蓋率。
- [ ] 確保 `stars_protocol` 的異常處理機制更加強健。
