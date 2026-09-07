# OwnAPI DC-API 管理账号修复设计

## 背景与现状

生产环境的 MiniMax H3 页面、OwnAPI `/v1/videos` 路由、客户 API Key 鉴权与视频计费代码均已上线。最低规格真实冒烟请求返回 `503 MiniMax-H3 is temporarily unavailable`，任务未创建、未扣费，且响应未暴露上游信息。

根因是现有 `minimax-h3` 后台账号由旧版表单创建：账号虽然启用、状态正常且白名单只有 `MiniMax-H3`，但缺少后端调度必须使用的 `extra.upstream_provider = "dc-api"`。同时账号 Base URL 当前包含 `/v1/videos`，而视频转发服务会自行追加该路径，若只补标记会产生重复路径。

## 目标

- 让管理员能够通过正常后台表单创建和维护 DC-API 视频上游账号。
- 修复现有 MiniMax H3 账号时保留已有 API Key，不在浏览器、日志或 Git 中暴露它。
- 客户始终只看见 OwnAPI 域名、OwnAPI Key、加密后的 OwnAPI 任务 ID 和 OwnAPI 视频内容地址。
- 仅允许 `MiniMax-H3` 使用该视频账号，避免错误路由和利润串线。
- 完成一次 5 秒 768p、最高 `$0.38` 的生产冒烟测试，验证创建、轮询、内容读取和 `$0.375` 客户扣费。

## 方案选择

采用“后台正式支持 DC-API 视频上游类型”的方案。直接改数据库虽快，但以后从后台编辑账号会丢失隐藏标记；按 URL 自动识别上游则容易误判，也削弱明确的安全边界。

## 后台表单设计

OpenAI API Key 账号的“上游用途”增加三个明确选项：

1. 普通 OpenAI API Key
2. PackyAPI 文本模型
3. DC-API 视频模型

选择 DC-API 后：

- 写入 `extra.upstream_provider = "dc-api"`。
- Base URL 保存为服务根地址，不允许以 `/v1/videos`、`/v1/videos/` 结尾；表单提交时安全规范化旧值。
- 凭据中的专用模型固定为 `MiniMax-H3`。
- 模型白名单固定为 `MiniMax-H3 -> MiniMax-H3`，不能配置通配符或其他模型。
- 编辑已有账号时，API Key 留空表示保持当前密钥。
- 关闭与视频账号无关的 OpenAI 自动透传、Compact、WebSocket 和图片桥接设置，避免产生含混配置。
- 辅助文案明确说明：上游密钥仅在服务端使用，客户只能使用 OwnAPI Key。

## 后端约束

沿用现有后端安全规则：只有 `upstream_provider=dc-api`、状态可调度、平台为 OpenAI、账号类型为 API Key/Upstream、专用模型精确等于 `MiniMax-H3` 的账号才能被视频服务选中。

补充 Base URL 校验，拒绝包含视频资源路径的 DC-API 地址。转发层只在服务器内部添加 `/v1/videos`、任务查询和内容路径，并统一替换认证头。上游任务 ID继续封装为加密 OwnAPI ID；上游错误、响应头、地址和凭据不透传。

## 生产修复流程

1. 先部署后台表单和后端校验代码。
2. 在生产后台编辑现有 `minimax-h3` 账号：选择 DC-API 视频模型、规范化 Base URL，API Key 保持留空，确认唯一模型为 `MiniMax-H3`。
3. 不创建第二个 DC-API 账号，不修改生产数据库中的其他账号。
4. 创建一个 OwnAPI 1x、额度 `$0.38` 的临时测试 Key。
5. 提交 5 秒 768p 任务，轮询到终态并通过 OwnAPI 内容地址读取视频。
6. 检查使用记录和余额实际扣除 `$0.375`，检查所有客户可见响应均无 DC-API 标识。
7. 删除临时测试 Key并清空本地剪贴板。

## 测试与验收

- 前端单元测试：创建/编辑表单能正确序列化并保留 `dc-api`；切换类型不会意外保留或删除其他账号配置；旧 Base URL 会被规范化。
- 后端单元测试：DC-API 专用字段、模型与 Base URL 校验；选择器不会选择普通 OpenAI/Packy账号；路径拼接无重复。
- 回归：Packy 四账号、普通 OpenAI 账号和现有文本路由不变。
- 生产验收：任务成功创建和完成、视频可读、仅扣预期费用、临时 Key 已删除、客户响应不暴露上游。

## 回滚

代码回滚使用部署前的 OwnAPI 镜像。账号配置回滚只恢复现有 `minimax-h3` 账号的上一版本，不删除账号、不清除密钥、不触碰 PostgreSQL 或 Redis 数据卷。冒烟测试若在任务创建前失败不计费；若已创建则保留使用记录并停止重复测试。
