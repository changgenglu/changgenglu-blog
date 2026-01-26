# Mac Podman 開發環境建置指南

## 概述

本指南將在 macOS 上建立一個完整的開發環境，使用 Podman 容器化技術，包含 MySQL、Redis、PHP 多版本和 phpMyAdmin 等服務。

## 環境需求

- macOS (Apple Silicon 或 Intel)
- 已安裝 Homebrew
- 已安裝 Podman
- 已安裝 Google Cloud SDK (用於存取私有映像檔)

## 安裝步驟

### 1. 安裝 Podman

```bash
# 安裝 Podman
brew install podman

# 初始化並啟動 Podman 虛擬機
podman machine init
podman machine start

# 驗證安裝
podman info
```

### 2. 安裝 Google Cloud SDK

```bash
# 安裝 Google Cloud SDK
brew install --cask google-cloud-sdk

# 重新載入 shell 配置
source ~/.zshrc

# 初始化 gcloud (需要登入 Google 帳號)
gcloud init

# 設定專案
gcloud config set project development-operation-center

# 配置 Docker 認證
gcloud auth configure-docker
```

### 3. 建立 Pod 容器群組

```bash
podman pod create --name dev-pod \
-p 8080:80 \
-p 3306-3310:3306-3310 \
-p 5001:5000 \
-p 5432:5432 \
-p 6060:6060 \
-p 6379:6379 \
-p 8000:8000 \
-p 8081-8082:8081-8082 \
-p 8084:8084 \
-p 11211:11211 \
-p 11625-11626:11625-11626 \
-p 27017:27017 \
-p 9229:9229 \
-p 9230:9229 \
-p 9231:9229
```

**注意**：端口 5000 被 macOS Control Center 佔用，因此使用 5001 替代。

### 4. 建立 MySQL 容器

```bash
# 建立數據目錄
mkdir -p ./mysql/data ./mysql/etc

# 建立 MySQL 容器
podman run -d --name mysql --pod dev-pod \
-e MYSQL_ROOT_PASSWORD=qwe123 \
-e MYSQL_DATABASE=trading_bot \
-e MYSQL_CHARSET=utf8mb4 \
-e MYSQL_COLLATION=utf8mb4_unicode_ci \
-v ${PWD}/mysql/data:/var/lib/mysql \
docker.io/library/mysql:8.0
```

### 5. 建立 Redis 容器

```bash
podman run --pod dev-pod -d --name redis \
--restart=always \
docker.io/library/redis:7.2.8-alpine3.21
```

### 6. 建立 phpMyAdmin 容器

```bash
podman run --pod dev-pod -d --name pma \
-e PMA_HOST="127.0.0.1" \
-e PMA_USER="root" \
-e PMA_PASSWORD='qwe123' \
-e UPLOAD_LIMIT='1028M' \
-e MEMORY_LIMIT='1028M' \
--restart=always \
docker.io/phpmyadmin/phpmyadmin
```

### 7. 建立 PHP 容器

#### PHP 8.1

```bash
podman run --pod dev-pod -d --name php81 \
--restart=always \
-e PHP_INI_POST_MAX_SIZE="256M" \
-e UPLOAD_MAX_FILESIZE="200M" \
-v ${PWD}:/var/www/html \
-w /var/www/html/ \
docker.io/library/php:8.1-fpm-alpine \
sh -c 'while true;do sleep 30; done;'
```

#### PHP 8.3

```bash
podman run --pod dev-pod -d --name php838 \
--restart=always \
-v ${PWD}:/var/www/html \
-w /var/www/html/ \
docker.io/library/php:8.3-fpm-alpine \
sh -c 'while true;do sleep 30; done;'
```

#### Node.js

```bash
# 建立 Node.js 容器
podman run --pod dev-pod -d --name node --restart=always \
-e DEBUG='true' \
-e NODE_OPTIONS=--openssl-legacy-provider \
-v ${PWD}:/var/www/html \
-w /var/www/html/ \
docker.io/library/node:18.11.0-alpine3.16 \
sh -c 'while true;do sleep 30; done;'
```

## 驗證安裝

### 檢查容器狀態

```bash
podman ps -a
```

### 測試各項服務

#### 1. 測試 phpMyAdmin

```bash
curl -I http://localhost:8080
```

#### 2. 測試 Redis

```bash
podman exec redis redis-cli ping
```

#### 3. 測試 MySQL

```bash
podman exec mysql mysql -u root -pqwe123 -e "SELECT VERSION();"
```

#### 4. 測試 PHP

```bash
# PHP 8.1
podman exec php81 php --version

# PHP 8.3
podman exec php838 php --version
```

#### 5. 測試 Node.js

```bash
# 測試 Node.js 版本
podman exec node node --version

# 測試 npm 版本
podman exec node npm --version
```

## Git 設定與 IAP 通道

### 1. 設定 SSH 金鑰

```bash
# 檢查是否已有 SSH 金鑰
ls -la ~/.ssh/

# 如果沒有，生成新的 SSH 金鑰
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 查看公鑰內容
cat ~/.ssh/id_rsa.pub
```

### 2. 設定 Hosts 文件

```bash
# 將 GitLab 域名加入 hosts 文件
echo "127.0.0.1 mars.gitlab.internal" | sudo tee -a /etc/hosts
```

### 3. 設定 SSH 配置

```bash
# 建立 SSH 配置文件
cat >> ~/.ssh/config << 'EOF'

# GitLab Mars
Host mars.gitlab.internal
    HostName mars.gitlab.internal
    Port 10022
    User git
    IdentityFile ~/.ssh/id_rsa
    IdentitiesOnly yes
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null

EOF
```

### 4. 建立 IAP 通道

```bash
# 建立 IAP 通道 (在背景運行)
gcloud beta compute start-iap-tunnel gitlab 10022 \
--local-host-port=localhost:10022 \
--zone=asia-east1-a &

# 檢查通道狀態
netstat -an | grep 10022
```

### 5. 測試 Git 連接

```bash
# 測試 SSH 連接
ssh -T mars.gitlab.internal

# 如果成功，會看到類似訊息：
# Welcome to GitLab, @username!
```

### 6. 將 SSH 公鑰添加到 GitLab

1. 複製 SSH 公鑰：

   ```bash
   cat ~/.ssh/id_rsa.pub | pbcopy
   ```

2. 登入 GitLab：https://gitlab-v1-mars.9alaxy.com/
3. 進入 Settings → SSH Keys
4. 貼上公鑰並保存

## 服務配置

### 端口對應表

| 服務       | 容器端口 | 主機端口  | 說明           |
| ---------- | -------- | --------- | -------------- |
| phpMyAdmin | 80       | 8080      | 資料庫管理介面 |
| MySQL      | 3306     | 3306-3310 | 資料庫服務     |
| Redis      | 6379     | 6379      | 快取服務       |
| PHP        | 9000     | -         | PHP-FPM        |

### 資料庫連接資訊

- **MySQL**：

  - 主機：`localhost`
  - 端口：`3306`
  - 用戶名：`root`
  - 密碼：`qwe123`
  - 資料庫：`trading_bot`

- **Redis**：

  - 主機：`localhost`
  - 端口：`6379`

- **phpMyAdmin**：
  - 網址：http://localhost:8080
  - 用戶名：`root`
  - 密碼：`qwe123`

## 使用方式

### 進入容器

```bash
# 進入 PHP 8.1 容器
podman exec -it php81 sh

# 進入 PHP 8.3 容器
podman exec -it php838 sh

# 進入 MySQL 容器
podman exec -it mysql bash

# 進入 Redis 容器
podman exec -it redis sh

# 進入 Node.js 容器
podman exec -it node sh
```

### Git 操作

```bash
# 確保 IAP 通道運行
gcloud beta compute start-iap-tunnel gitlab 10022 \
--local-host-port=localhost:10022 \
--zone=asia-east1-a &

# 克隆專案
git clone mars.gitlab.internal:group/project.git

# 測試 Git 連接
ssh -T mars.gitlab.internal
```

### Node.js 環境建置

#### 安裝 pnpm

在 Node.js 容器的 `/var/www/html` 目錄中執行：

```bash
# 進入 Node.js 容器
podman exec -it node sh

# 安裝 pnpm
npm install -g pnpm@8.10.5
```

#### 安裝專案套件

```bash
# 在專案目錄下執行
pnpm install
```

#### 啟動專案

```bash
# puppy 本地的執行語法
ENV=local pnpm run start
```

### 管理 Pod

```bash
# 查看 Pod 狀態
podman pod list

# 停止 Pod
podman pod stop dev-pod

# 啟動 Pod
podman pod start dev-pod

# 重啟 Pod
podman pod restart dev-pod

# 刪除 Pod (會刪除所有容器)
podman pod rm -f dev-pod
```

### 管理個別容器

```bash
# 查看所有容器
podman ps -a

# 停止容器
podman stop <container_name>

# 啟動容器
podman start <container_name>

# 重啟容器
podman restart <container_name>

# 刪除容器
podman rm <container_name>
```

## 檔案掛載

- **當前目錄**：`/Users/changgenglu/Documents` 已掛載到所有 PHP 容器的 `/var/www/html`
- **MySQL 數據**：`./mysql/data` 目錄用於持久化 MySQL 數據

## 常見問題

### 1. 端口衝突

如果遇到端口被佔用的問題：

```bash
# 查看端口使用情況
lsof -i :<port_number>

# 修改 Pod 配置中的端口映射
```

### 2. 容器無法啟動

```bash
# 查看容器日誌
podman logs <container_name>

# 檢查 Pod 狀態
podman pod inspect dev-pod
```

### 3. 權限問題

```bash
# 確保數據目錄有正確權限
chmod -R 755 ./mysql/data
```

### 4. IAP 通道問題

```bash
# 檢查 IAP 通道是否運行
ps aux | grep iap-tunnel

# 重新啟動 IAP 通道
pkill -f iap-tunnel
gcloud beta compute start-iap-tunnel gitlab 10022 \
--local-host-port=localhost:10022 \
--zone=asia-east1-a &

# 檢查端口是否監聽
netstat -an | grep 10022
```

### 5. Git 連接問題

```bash
# 檢查 SSH 配置
cat ~/.ssh/config

# 測試 SSH 連接
ssh -T mars.gitlab.internal

# 檢查 hosts 文件
cat /etc/hosts | grep mars
```

## 清理環境

如果需要完全清理環境：

```bash
# 停止並刪除 Pod
podman pod rm -f dev-pod

# 刪除數據目錄
rm -rf ./mysql/data

# 清理未使用的映像檔
podman image prune -a
```

## 進階配置

### 自定義 PHP 配置

可以在 PHP 容器中安裝額外的擴展：

```bash
# 進入 PHP 容器
podman exec -it php81 sh

# 安裝 PHP 擴展
apk add --no-cache php8-mysql php8-redis php8-mbstring
```

### 環境變數配置

可以通過環境變數來配置各個服務：

```bash
# 在建立容器時添加環境變數
-e ENV_VAR_NAME=value
```

## 總結

這個環境提供了：

- ✅ MySQL 8.0 資料庫
- ✅ Redis 快取服務
- ✅ Memcached 快取服務
- ✅ PHP 8.1 和 8.3 多版本支援
- ✅ Node.js 18.11.0 環境
- ✅ phpMyAdmin 資料庫管理介面
- ✅ 完整的端口映射配置
- ✅ 檔案掛載支援
- ✅ Google Cloud SDK 整合
- ✅ IAP 通道連接到內部 GitLab
- ✅ SSH 金鑰認證設定

環境已準備就緒，可以開始開發工作！

## 重要提醒

- **IAP 通道**：每次重開機後需要重新啟動 IAP 通道
- **容器重啟**：所有容器都會自動重啟
- **檔案同步**：當前目錄的檔案會即時同步到容器中
- **Git 操作**：需要確保 IAP 通道運行才能進行 Git 操作
