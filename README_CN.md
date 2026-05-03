# ownapi

ownapi 是一个面向生产的 AI API 中转与配额管理平台。平台支持用户 API Key 分发、上游账号池调度、余额/订阅计费、并发与速率限制、用量统计、支付充值和管理后台。

## 核心能力

- 多上游账号池：支持 OpenAI、Anthropic、Gemini、Antigravity 等平台。
- 多认证类型：支持 API Key、OAuth、Setup Token、AWS Bedrock、Google Vertex Service Account。
- 用户侧 API Key：用户通过平台生成的 Key 调用统一网关。
- 计费与限流：支持余额扣费、套餐订阅、分组倍率、并发限制和 RPM 限制。
- 管理后台：提供账号、分组、用户、用量、支付、监控和系统设置。
- Docker 部署：适合快速上线和后续迁移。

## 快速上线

1. 复制部署配置：

```bash
cd deploy
cp .env.example .env
```

2. 修改 `.env`：

```env
APP_IMAGE=你的镜像仓库/ownapi:latest
ADMIN_EMAIL=你的管理员邮箱
ADMIN_PASSWORD=你的强密码
JWT_SECRET=使用 openssl rand -hex 32 生成
TOTP_ENCRYPTION_KEY=使用 openssl rand -hex 32 生成
POSTGRES_PASSWORD=数据库强密码
REDIS_PASSWORD=Redis 强密码
UPDATE_GITHUB_REPO=
```

`UPDATE_GITHUB_REPO` 默认为空，表示关闭在线更新，避免误拉取非本项目 release。等你搭好自己的 GitHub Release 后再设置为 `your-org/ownapi`。

3. 启动：

```bash
docker compose up -d
docker compose logs -f ownapi
```

4. 进入后台后完成：

- 设置站点名称、Logo、API Base URL、文档 URL。
- 创建 OpenAI、Anthropic、Gemini 等上游账号。
- 创建分组并设置模型白名单、倍率、并发和 RPM。
- 创建测试用户和 API Key。
- 用小额充值测试支付回调和余额到账。
- 调用 `/v1/messages`、`/v1/chat/completions`、`/v1/responses`、`/v1beta/models/...` 验证链路。

## 反向代理要点

Nginx 反代时建议：

```nginx
underscores_in_headers on;
proxy_buffering off;
proxy_read_timeout 600s;
proxy_send_timeout 600s;
```

如果使用 WebSocket 或长连接，确认代理层没有缓冲流式响应。

## 许可证

本项目基于 LGPLv3 许可证。分发修改后的二进制或镜像时，请保留许可证并按 LGPLv3 要求提供对应源码或修改部分源码。
