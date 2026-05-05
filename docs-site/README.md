# OwnAPI Documentation Site

VitePress 文档站点，部署在 `https://docs.ownapi.dev`。

## 目录

```
sub2api/
├── docs-site/           # 本文档站点源码
│   ├── docs/            # Markdown 文档内容
│   └── package.json     # VitePress 依赖
├── deploy/
│   ├── caddy/
│   │   └── Caddyfile    # 生产环境 Caddy 配置（含 docs.ownapi.dev）
│   └── docker-compose.yml
└── ...
```

## 开发

```bash
cd docs-site
npm install
npm run docs:dev
```

## 构建

```bash
cd docs-site
npm run docs:build
```

构建输出位于 `docs/.vitepress/dist/`。

## 部署

```bash
cd docs-site
npm run docs:build
scp -r docs/.vitepress/dist/* root@8.209.234.91:/var/www/docs.ownapi.dev/
```

## 服务器配置

Caddy 生产配置见 `../deploy/caddy/Caddyfile`，包含：
- `docs.ownapi.dev` 静态站点虚拟主机
- `ownapi.dev` API 网关（含 CORS 设置）
