# curl 命令完整說明手冊

## 目錄
1. [基本概念](#基本概念)
2. [HTTP 方法](#http-方法)
3. [常用選項](#常用選項)
4. [實際範例](#實際範例)
5. [進階功能](#進階功能)
6. [故障排除](#故障排除)
7. [最佳實踐](#最佳實踐)

## 基本概念

curl 是一個強大的命令列工具，用於傳輸資料到或從伺服器。它支援多種協定，包括 HTTP、HTTPS、FTP、FTPS、SCP、SFTP 等。

### 基本語法
```bash
curl [選項] [URL]
```

## HTTP 方法

### GET 請求
GET 方法用於從伺服器取得資料，這是預設的 HTTP 方法。

#### 基本 GET 請求
```bash
curl "https://test.com/api/users"
```

#### 帶查詢參數的 GET 請求
```bash
curl "https://test.com/api/users?page=1&limit=10&status=active"
```

#### 帶自訂標頭的 GET 請求
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Accept: application/json" \
     "https://test.com/api/users"
```

### POST 請求
POST 方法用於向伺服器提交資料。

#### 基本 POST 請求 (表單資料)
```bash
curl -X POST "https://test.com/api/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=YOUR_USERNAME&password=YOUR_PASSWORD"
```

#### JSON 資料 POST 請求
```bash
curl -X POST "https://test.com/api/users" \
  -H "Content-Type: application/json" \
  -d '{"name":"張三","email":"zhang@example.com","age":25}'
```

#### 從檔案讀取 JSON 資料
```bash
curl -X POST "https://test.com/api/users" \
  -H "Content-Type: application/json" \
  -d @user_data.json
```

#### 上傳檔案
```bash
curl -X POST "https://test.com/api/upload" \
  -F "file=@/path/to/file.jpg" \
  -F "description=圖片描述"
```

### PUT 請求
PUT 方法用於更新或建立資源。

#### 更新使用者資料
```bash
curl -X PUT "https://test.com/api/users/123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"李四","email":"li@example.com","age":30}'
```

#### 完整替換資源
```bash
curl -X PUT "https://test.com/api/articles/456" \
  -H "Content-Type: application/json" \
  -d @article_data.json
```

### PATCH 請求
PATCH 方法用於部分更新資源。

#### 部分更新使用者資料
```bash
curl -X PATCH "https://test.com/api/users/123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"email":"newemail@example.com"}'
```

### DELETE 請求
DELETE 方法用於刪除資源。

#### 刪除使用者
```bash
curl -X DELETE "https://test.com/api/users/123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 帶確認的刪除請求
```bash
curl -X DELETE "https://test.com/api/users/123" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Confirm-Delete: true"
```

### HEAD 請求
HEAD 方法用於取得回應標頭，不包含回應主體。

```bash
curl -I "https://test.com/api/users"
```

### OPTIONS 請求
OPTIONS 方法用於查詢伺服器支援的方法。

```bash
curl -X OPTIONS "https://test.com/api/users" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```

## 常用選項

### 基本選項
- `-X, --request <method>` - 指定 HTTP 方法 (GET, POST, PUT, DELETE 等)
- `-H, --header <header>` - 設定 HTTP 標頭
- `-d, --data <data>` - 設定 POST 資料
- `-F, --form <name=content>` - 設定表單資料 (multipart/form-data)
- `-G, --get` - 將資料作為查詢參數發送
- `-b, --cookie <data>` - 設定 Cookie
- `-c, --cookie-jar <file>` - 儲存 Cookie 到檔案
- `-u, --user <user:password>` - 基本認證
- `-o, --output <file>` - 輸出到檔案
- `-O, --remote-name` - 使用遠端檔案名稱
- `-s, --silent` - 靜默模式
- `-v, --verbose` - 詳細輸出
- `-i, --include` - 包含回應標頭
- `-I, --head` - 只取得標頭
- `-L, --location` - 跟隨重定向
- `-k, --insecure` - 忽略 SSL 憑證錯誤
- `-w, --write-out <format>` - 格式化輸出
- `--connect-timeout <seconds>` - 連線超時
- `--max-time <seconds>` - 最大執行時間
- `--retry <num>` - 重試次數
- `--retry-delay <seconds>` - 重試間隔

### 進階選項
- `--compressed` - 請求壓縮回應
- `--keepalive-time <seconds>` - Keep-Alive 時間
- `--max-redirs <num>` - 最大重定向次數
- `--proxy <proxy>` - 使用代理伺服器
- `--resolve <host:port:address>` - 自訂 DNS 解析
- `--cacert <file>` - CA 憑證檔案
- `--cert <file>` - 用戶端憑證
- `--key <file>` - 私鑰檔案

## 實際範例

### 認證相關

#### 基本認證
```bash
curl -u "username:password" "https://test.com/api/protected"
```

#### Bearer Token 認證
```bash
curl -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9..." \
     "https://test.com/api/protected"
```

#### API Key 認證
```bash
curl -H "X-API-Key: your-api-key-here" \
     "https://test.com/api/data"
```

### 檔案操作

#### 下載檔案
```bash
curl -O "https://test.com/files/document.pdf"
```

#### 下載並重新命名
```bash
curl -o "my_document.pdf" "https://test.com/files/document.pdf"
```

#### 上傳檔案
```bash
curl -X POST "https://test.com/api/upload" \
  -F "file=@/path/to/file.jpg" \
  -F "title=我的圖片"
```

#### 多檔案上傳
```bash
curl -X POST "https://test.com/api/upload" \
  -F "files[]=@file1.jpg" \
  -F "files[]=@file2.jpg" \
  -F "files[]=@file3.jpg"
```

### 會話管理

#### 登入並儲存 Cookie
```bash
curl -c cookies.txt -X POST "https://test.com/api/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"pass"}'
```

#### 使用儲存的 Cookie
```bash
curl -b cookies.txt "https://test.com/api/protected"
```

### 效能測試

#### 測試連線速度
```bash
curl -w "\n\n=== 效能統計 ===\nHTTP 狀態碼: %{http_code}\n總耗時: %{time_total}s\n連線耗時: %{time_connect}s\nDNS 解析: %{time_namelookup}s\nSSL 握手: %{time_appconnect}s\n重定向: %{time_redirect}s\n開始傳輸: %{time_pretransfer}s\n首字節: %{time_starttransfer}s\n" \
     -s -o /dev/null "https://test.com/api/test"
```

#### 壓力測試
```bash
# 測試 10 次請求
for i in {1..10}; do
  echo "請求 $i:"
  curl -w "耗時: %{time_total}s\n" \
       -s -o /dev/null "https://test.com/api/test"
done
```

### 除錯和監控

#### 詳細輸出
```bash
curl -v "https://test.com/api/users"
```

#### 只顯示標頭
```bash
curl -I "https://test.com/api/users"
```

#### 儲存完整回應
```bash
curl -D headers.txt -o response.json "https://test.com/api/users"
```

## 進階功能

### 環境變數使用
```bash
# 設定環境變數
export API_BASE_URL="https://test.com/api"
export API_TOKEN="your-token-here"

# 使用環境變數
curl -H "Authorization: Bearer $API_TOKEN" \
     "$API_BASE_URL/users"
```

### 批次處理
```bash
# 從檔案讀取 URL 列表
while read url; do
  echo "測試: $url"
  curl -w "狀態: %{http_code}, 耗時: %{time_total}s\n" \
       -s -o /dev/null "$url"
done < urls.txt
```

### 條件請求
```bash
# 使用 If-Modified-Since
curl -H "If-Modified-Since: Wed, 21 Oct 2015 07:28:00 GMT" \
     "https://test.com/api/data"

# 使用 If-None-Match
curl -H "If-None-Match: \"abc123\"" \
     "https://test.com/api/data"
```

### 自訂 DNS 解析
```bash
curl --resolve "test.com:443:192.168.1.100" \
     "https://test.com/api/test"
```

### 代理設定
```bash
# HTTP 代理
curl --proxy "http://proxy.example.com:8080" \
     "https://test.com/api/data"

# SOCKS 代理
curl --socks5 "127.0.0.1:1080" \
     "https://test.com/api/data"
```

## 故障排除

### 常見錯誤

#### 1. 連線錯誤
```bash
# 錯誤: curl: (7) Failed to connect to test.com port 443: Connection refused
# 解決: 檢查網路連線和防火牆設定
curl --connect-timeout 10 "https://test.com/api/test"
```

#### 2. SSL 憑證錯誤
```bash
# 錯誤: curl: (60) SSL certificate problem: self signed certificate
# 解決: 使用 -k 選項忽略憑證檢查 (僅用於測試)
curl -k "https://test.com/api/test"
```

#### 3. 認證失敗
```bash
# 錯誤: 401 Unauthorized
# 解決: 檢查認證資訊
curl -u "correct_username:correct_password" \
     "https://test.com/api/protected"
```

#### 4. 超時錯誤
```bash
# 錯誤: curl: (28) Operation timed out
# 解決: 增加超時時間
curl --max-time 30 "https://test.com/api/slow"
```

### 除錯技巧

#### 1. 使用詳細模式
```bash
curl -v "https://test.com/api/users"
```

#### 2. 檢查 HTTP 狀態碼
```bash
curl -w "HTTP 狀態碼: %{http_code}\n" \
     -s -o /dev/null "https://test.com/api/users"
```

#### 3. 測試 DNS 解析
```bash
curl --resolve "test.com:443:1.2.3.4" \
     "https://test.com/api/test"
```

#### 4. 檢查重定向
```bash
curl -L -v "https://test.com/api/redirect"
```

## 最佳實踐

### 1. 安全性
- 不要在命令列中直接輸入密碼
- 使用環境變數儲存敏感資訊
- 在生產環境中不要使用 `-k` 選項
- 定期更新 curl 版本

### 2. 效能優化
- 使用 Keep-Alive 連線
- 啟用壓縮
- 適當設定超時時間
- 使用連線池

### 3. 錯誤處理
- 檢查 HTTP 狀態碼
- 設定適當的重試機制
- 記錄錯誤日誌
- 使用適當的超時設定

### 4. 程式碼組織
- 使用腳本檔案儲存複雜命令
- 使用設定檔案管理參數
- 添加註解說明
- 版本控制腳本檔案

### 範例腳本

#### 基本 API 測試腳本
```bash
#!/bin/bash
# api_test.sh

API_BASE="https://test.com/api"
TOKEN="your-token-here"

# 測試 GET 請求
echo "測試 GET 請求..."
curl -H "Authorization: Bearer $TOKEN" \
     -w "狀態: %{http_code}, 耗時: %{time_total}s\n" \
     -s -o /dev/null "$API_BASE/users"

# 測試 POST 請求
echo "測試 POST 請求..."
curl -X POST "$API_BASE/users" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"name":"測試使用者","email":"test@example.com"}' \
     -w "狀態: %{http_code}, 耗時: %{time_total}s\n" \
     -s -o /dev/null
```

#### 健康檢查腳本
```bash
#!/bin/bash
# health_check.sh

ENDPOINTS=(
    "https://test.com/api/health"
    "https://test.com/api/status"
    "https://test.com/api/version"
)

for endpoint in "${ENDPOINTS[@]}"; do
    echo "檢查: $endpoint"
    status=$(curl -w "%{http_code}" -s -o /dev/null "$endpoint")

    if [ "$status" -eq 200 ]; then
        echo "✓ 正常 ($status)"
    else
        echo "✗ 異常 ($status)"
    fi
done
```

## 回應格式範例

### 成功回應
```json
{
  "status": "success",
  "data": {
    "id": 123,
    "name": "張三",
    "email": "zhang@example.com"
  },
  "message": "操作成功"
}
```

### 錯誤回應
```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "輸入資料驗證失敗",
    "details": {
      "email": "電子郵件格式不正確"
    }
  }
}
```

### HTTP 狀態碼說明
- `200 OK` - 請求成功
- `201 Created` - 資源建立成功
- `204 No Content` - 請求成功但無內容
- `400 Bad Request` - 請求格式錯誤
- `401 Unauthorized` - 未授權
- `403 Forbidden` - 禁止存取
- `404 Not Found` - 資源不存在
- `422 Unprocessable Entity` - 資料驗證失敗
- `500 Internal Server Error` - 伺服器內部錯誤

## 總結

curl 是一個功能強大的命令列工具，掌握其基本用法和進階功能對於 API 測試、資料傳輸和系統整合都非常重要。透過本手冊的說明和範例，您應該能夠有效地使用 curl 進行各種 HTTP 操作。

記住要根據實際需求選擇適當的選項，並始終注意安全性和效能考量。
