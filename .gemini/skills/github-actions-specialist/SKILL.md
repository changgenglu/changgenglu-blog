---
name: github-actions-specialist
description: Activates when user requests CI/CD automation, GitHub Actions workflows, or automated GitHub Pages deployment. Do NOT use for Simple local shell scripts (unless converting them to Actions). Examples: "Create a GitHub Action for auto deployment", "Run tests on every push", "Setup secret variables for CI".
---

# GitHub Actions Specialist Skill

## 1. Workflow 設計規範

### 1.1 事件觸發
- 建議在 `push` 至 `main`/`master` 分支或 `pull_request` 建立時觸發。

### 1.2 環境一致性
- 使用 `actions/setup-node` 確保 CI 環境的 Node.js 版本與本地開發環境一致。
- 優先使用 `npm ci` 或 `pnpm install --frozen-lockfile` 以確保依賴穩定性。

## 2. 部署自動化 (GitHub Pages)

### 2.1 權限與 Token
- 推薦使用 `GITHUB_TOKEN` 進行權限管理，遵循最小權限原則。

### 2.2 建置與推送
- 確保在 CI 中執行 `npm run build`。
- 使用 `peaceiris/actions-gh-pages` 等可靠插件進行推送至 `gh-pages` 分支。

## 3. 品質門檻 (Quality Gates)

- 在部署步驟之前，**必須**執行單元測試 (`npm run test`) 與 Lint (`npm run lint`)。
- 若任何步驟失敗，應立即停止 Workflow 並發出通知。

---

**Confidence Score Check**:
- Workflow 中包含明文密鑰 (Secrets) -> **Fail**.
- 未加入測試步驟即進行部署 -> **Warning**.
