# Laravel 開發注意事項

> 記錄在容器化 Laravel 專案中，請 AI 協作時需要先交代的環境事實與領域術語定義。整理於 2026 年。

## 環境備忘

- 本機以 Podman 容器執行 PHP，容器名稱與專案目錄名稱不一定相同，下指令前先確認
- 容器內沒有安裝 `jq`，需要處理 JSON 時改用 PHP 或在容器外處理
- 專案在容器內的路徑固定（例如 `/var/www/html/<專案目錄>`），指令要用該路徑

## 領域術語定義

有些專案對常見詞彙另有定義，與一般慣用不同。要請 AI 寫程式碼或文件時，先把定義寫給它，避免用一般字義理解。

### Provider（站台／遊戲平台）

- **定義**：提供遊戲服務的站台，類似遊戲網站或應用程式
- **關係**：一個 provider 底下可以有多個 platform

### Platform（遊戲廠商）

- **定義**：實際開發並提供遊戲內容的廠商
- **關係**：一個 platform 可以同時屬於多個 provider

### 關係示意

```text
Provider (站台)
├── Platform A (遊戲廠商)
├── Platform B (遊戲廠商)
└── Platform C (遊戲廠商)

Platform X (遊戲廠商)
├── Provider 1 (站台)
└── Provider 2 (站台)
```

## 使用注意事項

- 提到「站台」就是 provider，提到「遊戲廠商」就是 platform
- 撰寫程式碼或文件時，採用上述定義，不採用一般常見字義
- 同一組術語在多個相關服務之間要保持一致

## 給 AI 的結構化摘要（範例）

把術語整理成 JSON，方便放進提示詞：

```json
{
  "environment": {
    "containerName": "<容器名稱>",
    "projectPath": "/var/www/html/<專案目錄>"
  },
  "coreDefinitions": {
    "Provider": {
      "chinese": "站台",
      "description": "Hosts game services; one provider can have multiple platforms"
    },
    "Platform": {
      "chinese": "遊戲廠商",
      "description": "A game vendor; one platform can belong to multiple providers"
    }
  },
  "relationships": [
    { "type": "provider_to_platforms", "description": "Provider 下有多個 Platform" },
    { "type": "platform_to_providers", "description": "Platform 可能屬於多個 Provider" }
  ]
}
```
