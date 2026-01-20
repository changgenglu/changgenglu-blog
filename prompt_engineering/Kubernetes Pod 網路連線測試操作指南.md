# Kubernetes Pod 網路連線測試操作指南

## 概述

本文件說明如何使用 `curl` 命令測試 Kubernetes 環境中 Pod 間的網路連線效能和延遲。

## 一、curl 效能測試命令解析

### 基本命令結構

```bash
curl -v -w "\n=== Timing Analysis ===\nDNS Lookup: %{time_namelookup}s\nTCP Connect: %{time_connect}s\nSSL Handshake: %{time_appconnect}s\nTime to First Byte: %{time_starttransfer}s\nTotal Time: %{time_total}s\n" https://example.com/api/endpoint
```

### 參數說明

| 參數 | 功能 | 描述 |
|------|------|------|
| `-v` | Verbose | 顯示詳細的請求和回應資訊，包括標頭、SSL 憑證等 |
| `-w` | Write-out | 自訂輸出格式，顯示指定的測量數據 |

### 時間測量指標

| 指標 | 變數 | 說明 |
|------|------|------|
| DNS Lookup | `%{time_namelookup}` | 域名解析為 IP 位址所需時間 |
| TCP Connect | `%{time_connect}` | TCP 連線建立時間（三次握手） |
| SSL Handshake | `%{time_appconnect}` | SSL/TLS 握手時間（HTTPS 時） |
| Time to First Byte | `%{time_starttransfer}` | 從請求開始到接收第一個位元組的時間 |
| Total Time | `%{time_total}` | 整個請求過程的總時間 |

## 二、Kubernetes 環境中的 Pod 間連線測試

### 1. 準備工作

#### 1.1 確認 Pod 和 Service 資訊

```bash
# 查看所有 namespace
kubectl get namespaces

# 查看指定 namespace 中的 pods
kubectl get pods -n <namespace> -o wide

# 查看指定 namespace 中的 services
kubectl get svc -n <namespace>
```

#### 1.2 查看 Pod 分佈和節點資訊

```bash
# 查看 Pod 在不同節點的分佈情況
kubectl get pods -n <namespace> -o wide --sort-by=.spec.nodeName
```

### 2. 測試方法

#### 2.1 使用 Service 名稱測試（推薦）

```bash
# 基本語法
kubectl exec -n <namespace> <source-pod> -- curl -v -w "\n=== Timing Analysis ===\nDNS Lookup: %{time_namelookup}s\nTCP Connect: %{time_connect}s\nSSL Handshake: %{time_appconnect}s\nTime to First Byte: %{time_starttransfer}s\nTotal Time: %{time_total}s\n" http://<target-service>:<port>/

# 範例
kubectl exec -n backend stars-cron-backend-78c97498b8-7v62k -- curl -v -w "\n=== Timing Analysis ===\nDNS Lookup: %{time_namelookup}s\nTCP Connect: %{time_connect}s\nSSL Handshake: %{time_appconnect}s\nTime to First Byte: %{time_starttransfer}s\nTotal Time: %{time_total}s\n" http://stars-backend:80/
```

#### 2.2 使用 Pod IP 直接測試

```bash
# 直接使用 Pod IP 測試（跳過 DNS 解析和 LoadBalancer）
kubectl exec -n <namespace> <source-pod> -- curl -v -w "\n=== Timing Analysis ===\nDNS Lookup: %{time_namelookup}s\nTCP Connect: %{time_connect}s\nSSL Handshake: %{time_appconnect}s\nTime to First Byte: %{time_starttransfer}s\nTotal Time: %{time_total}s\n" http://<target-pod-ip>:<port>/
```

#### 2.3 使用 Service IP 測試

```bash
# 使用 Service 的 Cluster IP 測試（跳過 DNS 解析）
kubectl exec -n <namespace> <source-pod> -- curl -v -w "\n=== Timing Analysis ===\nDNS Lookup: %{time_namelookup}s\nTCP Connect: %{time_connect}s\nSSL Handshake: %{time_appconnect}s\nTime to First Byte: %{time_starttransfer}s\nTotal Time: %{time_total}s\n" http://<service-cluster-ip>:<port>/
```

### 3. 效能比較測試

#### 3.1 簡化版本（只顯示總時間）

```bash
# 測試 Service 名稱
kubectl exec -n <namespace> <source-pod> -- curl -s -w "Service DNS: %{time_total}s\n" -o /dev/null http://<service-name>:<port>/

# 測試 Service IP
kubectl exec -n <namespace> <source-pod> -- curl -s -w "Service IP: %{time_total}s\n" -o /dev/null http://<service-ip>:<port>/

# 測試 Pod IP
kubectl exec -n <namespace> <source-pod> -- curl -s -w "Pod IP: %{time_total}s\n" -o /dev/null http://<pod-ip>:<port>/
```

#### 3.2 批次測試

```bash
# 執行多次測試取平均值
for i in {1..10}; do
  kubectl exec -n <namespace> <source-pod> -- curl -s -w "%{time_total}\n" -o /dev/null http://<target>:<port>/
done
```

#### 3.3 跨節點 vs 同節點效能比較

```bash
# 測試跨節點連線
kubectl exec -n <namespace> <source-pod> -- curl -s -w "跨節點: %{time_total}s\n" -o /dev/null http://<cross-node-pod-ip>:<port>/

# 測試同節點連線
kubectl exec -n <namespace> <source-pod> -- curl -s -w "同節點: %{time_total}s\n" -o /dev/null http://<same-node-pod-ip>:<port>/
```

### 4. 故障排除

#### 4.1 DNS 解析問題

```bash
# 檢查 DNS 解析
kubectl exec -n <namespace> <pod-name> -- nslookup <service-name>

# 檢查 DNS 設定
kubectl exec -n <namespace> <pod-name> -- cat /etc/resolv.conf

# 使用完整 FQDN
kubectl exec -n <namespace> <pod-name> -- curl http://<service-name>.<namespace>.svc.cluster.local:<port>/
```

#### 4.2 檢查 Pod 工具可用性

```bash
# 檢查 curl 是否可用
kubectl exec -n <namespace> <pod-name> -- which curl

# 如果沒有 curl，使用 wget
kubectl exec -n <namespace> <pod-name> -- wget -O- --server-response http://<target>:<port>/
```

#### 4.3 檢查網路政策

```bash
# 檢查 NetworkPolicy
kubectl get networkpolicy -n <namespace>

# 檢查 Pod 標籤
kubectl get pods -n <namespace> --show-labels
```

### 5. 最佳實踐

1. **測試順序建議**：
   - 先測試 Service 名稱（完整路徑）
   - 再測試 Service IP（跳過 DNS）
   - 最後測試 Pod IP（跳過 LoadBalancer）

2. **效能基準**：
   - 同節點 Pod 間通訊：< 5ms
   - 跨節點 Pod 間通訊：< 10ms
   - DNS 解析：< 5ms

3. **測試建議**：
   - 執行多次測試取平均值
   - 測試不同時間點的效能
   - 記錄測試環境和條件

## 六、常見問題

### Q1: 出現 "Could not resolve host" 錯誤
**A**: 檢查 Service 名稱是否正確，或嘗試使用完整 FQDN 格式

### Q2: 連線被拒絕
**A**: 檢查目標 Pod 是否正在運行，端口是否正確

### Q3: 時間測量都是 0
**A**: 可能是連線失敗，檢查網路政策和防火牆設定

### Q4: 效能差異很大
**A**: 考慮網路負載、Pod 資源使用情況和節點間網路狀況 