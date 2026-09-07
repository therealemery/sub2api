# OwnAPI DC-API 管理账号修复实施计划

**目标：** 让后台正式支持 DC-API MiniMax H3 视频账号，修复生产账号配置，并完成一笔最高 `$0.38` 的真实端到端验证。

**设计：** `docs/superpowers/specs/2026-09-07-ownapi-dcapi-admin-account-fix-design.md`

**已核实接口：** `POST https://console.dc-api.com/v1/videos` 在无凭据时返回结构化 401；因此账号 `base_url` 使用 `https://console.dc-api.com`，路径由服务端转发器追加。

## 全局约束

- 不读取、输出、提交或重新填写现有 DC-API Key。
- 不创建第二个 DC-API 账号，不修改 Packy 或其他生产账号。
- 客户响应不得包含 DC-API 名称、域名、Key 或原始任务 ID。
- 先测试后实现；每个阶段通过后再部署。
- 临时测试 Key 的最大额度为 `$0.38`，测试后删除。

## Task 1：锁定后端账号约束

涉及文件：

- `backend/internal/service/managed_upstream_test.go`
- `backend/internal/service/account_service.go`

步骤：

1. 增加失败测试：DC-API 接受根地址与精确 `MiniMax-H3`，拒绝 `/v1/videos` 资源路径、缺失/错误模型和不支持的账号类型。
2. 实现 DC-API Base URL 与模型校验，保留 Packy 和普通 OpenAI 行为。
3. 运行 `go test ./internal/service`。

## Task 2：后台创建表单支持 DC-API

涉及文件：

- `frontend/src/components/account/CreateAccountModal.vue`
- 对应创建表单测试

步骤：

1. 增加失败测试，断言选择“DC-API 视频模型”会提交：
   - `extra.upstream_provider = "dc-api"`
   - `credentials.base_url = "https://console.dc-api.com"`
   - `credentials.model = "MiniMax-H3"`
   - `credentials.model_mapping = { "MiniMax-H3": "MiniMax-H3" }`
2. 扩展 provider 类型和选项；切换到 DC-API 时设置受控默认值并禁用无关 OpenAI 设置。
3. 对旧的 `/v1/videos` Base URL 做确定性规范化。
4. 运行创建表单聚焦测试、Vue 类型检查和 ESLint。

## Task 3：后台编辑表单保留和修复 DC-API

涉及文件：

- `frontend/src/components/account/EditAccountModal.vue`
- 对应编辑表单测试

步骤：

1. 增加失败测试，断言已有 `dc-api` 标记能正确显示、提交后保留；API Key 留空不会覆盖旧密钥。
2. 编辑旧账号选择 DC-API 时，规范化 Base URL并写入固定模型/映射。
3. 从 DC-API 切换到其他类型时仅删除 DC-API 专用 `model` 字段，避免影响普通账号数据。
4. 运行编辑表单聚焦测试、Vue 类型检查和 ESLint。

## Task 4：集成验证与提交

1. 运行后端 handler/service/routes 测试。
2. 运行账号表单、H3 页面与模型目录聚焦测试。
3. 运行完整 Vue 类型检查、前端生产构建和 `git diff --check`。
4. 检查 Git diff 无密钥、临时文件和无关修改。
5. 提交并推送 `main`。

## Task 5：部署与生产账号修复

1. 触发 `Build and Deploy`，等待成功并验证 `/health`。
2. 在后台编辑唯一的 `minimax-h3` 账号：选择 DC-API 视频模型，确认根地址、固定模型和唯一映射；API Key 留空保持不变。
3. 检查账号仍为启用和可调度。

## Task 6：最低金额真实冒烟测试

1. 创建 OwnAPI 1x、额度 `$0.38` 的临时客户 Key。
2. 提交 5 秒 768p 无参考图任务，预期客户价格 `$0.375`。
3. 轮询 OwnAPI 加密任务 ID至终态，通过 OwnAPI `/content` 地址读取视频。
4. 验证余额/使用记录扣除 `$0.375`；如创建失败则不重复无限测试。
5. 扫描所有客户可见响应，确认无 DC-API 名称、域名、Key 和原始任务 ID。
6. 删除临时 Key、清空剪贴板，并将生产结果写入 `AGENTS.md` 后提交。
