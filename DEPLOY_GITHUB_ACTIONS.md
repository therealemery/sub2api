# GitHub Actions 自动部署配置

## 已创建的 Workflow

文件：`.github/workflows/deploy.yml`

功能：
- **手动触发**：在 GitHub Actions 页面点击 "Run workflow"
- **自动构建**：在 GitHub 的 Ubuntu runner 上构建 `linux/amd64` 镜像
- **自动推送**：通过 SSH 上传到服务器并重启服务

## 需要配置的 Secrets

在 GitHub 仓库页面：
**Settings → Secrets and variables → Actions → New repository secret**

添加以下 3 个 Secrets：

| Secret Name | 值 | 说明 |
|-------------|-----|------|
| `SERVER_HOST` | `8.209.234.91` | 服务器 IP |
| `SERVER_USER` | `root` | SSH 用户名 |
| `SERVER_SSH_KEY` | SSH 私钥内容 | 见下方生成步骤 |

## 生成 SSH Key（在本地执行）

如果你还没有用于 GitHub Actions 的 SSH key：

```bash
# 生成新 key（不要设置 passphrase）
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# 查看私钥（复制完整内容，包括 BEGIN/END 行）
cat ~/.ssh/github_actions_deploy

# 将公钥添加到服务器的 authorized_keys
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub root@8.209.234.91
```

**重要**：
- 复制私钥到 GitHub Secret `SERVER_SSH_KEY` 时，要包含完整的 `-----BEGIN OPENSSH PRIVATE KEY-----` 到 `-----END OPENSSH PRIVATE KEY-----` 所有内容
- 确保服务器上 `/opt/ownapi/deploy/` 目录存在

## 使用方式

1. 推送代码到 GitHub
2. 进入 GitHub 仓库页面 → **Actions** → **Build and Deploy**
3. 点击 **Run workflow** → 选择分支 → **Run workflow**
4. 等待约 5-10 分钟，自动完成构建和部署

## 排查问题

如果部署失败，检查：
1. Secrets 是否正确配置
2. 服务器防火墙是否允许 GitHub Actions IP（通常是出网，无需额外配置）
3. SSH key 权限：`chmod 600 ~/.ssh/authorized_keys`
4. 查看 GitHub Actions 日志获取详细错误信息