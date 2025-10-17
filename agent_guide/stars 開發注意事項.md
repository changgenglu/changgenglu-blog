- podman container name is php8 (not stars)
- jq is not installed in the container
- Project path(in pod): /var/www/html/stars

# 專案術語定義 (Project Terminology)

## 核心概念定義

### Provider (站台/遊戲平台)
- **定義**: 站台、遊戲平台
- **說明**: 一個提供遊戲服務的平台，類似於遊戲網站或應用程式
- **關係**: 一個 provider 底下可以有多個 platform

### Platform (遊戲供應商/遊戲廠商)  
- **定義**: 遊戲供應商、遊戲廠商
- **說明**: 實際開發和提供遊戲內容的廠商或供應商
- **關係**: 一個 platform 可以屬於多個 provider

## 關係架構
Provider (站台)
├── Platform A (遊戲廠商)
├── Platform B (遊戲廠商)
└── Platform C (遊戲廠商)
Platform X (遊戲廠商)
├── Provider 1 (站台)
└── Provider 2 (站台)


## 使用注意事項
- 在 stars、satellite、cron 專案中，provider 和 platform 的定義與一般常見定義不同
- 撰寫程式碼或文件時，請使用上述定義而非一般常見的定義
- 當提到「站台」時，指的是 provider
- 當提到「遊戲廠商」時，指的是 platform