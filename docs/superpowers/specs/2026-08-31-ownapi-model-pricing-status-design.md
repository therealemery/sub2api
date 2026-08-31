# OwnAPI 模型定价页与状态入口设计

日期：2026-08-31

## 目标

在不改变 OwnAPI 现有黑白视觉语言的前提下，扩充公开 Models 页面：以 PackyAPI Pricing 当前标记为 `93% OFF` 及以上的模型作为收录范围，使用各模型原厂的最新公开标准 API 定价作为基准，并将 OwnAPI 售价统一展示为官方原价的 70%。同时纠正公开 `Status` 与登录后用户监控看板的混用。

## 已确认范围

- 收录 PackyAPI Pricing 在 2026-08-31 标记为 `93% OFF`、`96% OFF` 或 `99% OFF` 的全部 16 个模型。
- 覆盖 OpenAI、Anthropic 和 xAI，不只收录 OpenAI。
- 页面不复用 PackyAPI 的成交价。OwnAPI 的数值价格只由原厂标准 API 公开价乘以 `0.7` 得出。
- 价格单位统一为 `USD / 1M tokens`。
- 标准价格展示输入、缓存输入或缓存读取、输出。缓存写入、Batch、Flex、Priority、Fast、地区溢价和工具调用费不进入首页卡片主价格。
- xAI 长上下文价格需要单独展示；输入达到 200K tokens 时，按原厂长上下文档位计费。
- 当前不建设公开 Status 页面，并从公共 Docs、页头和页脚移除 Status 链接。
- 登录后 `/monitor` 继续作为用户自己的监控看板；管理员全局渠道监控保持独立，不互相暴露数据。

## 方案选择

### 采用：原厂可追溯目录 + OwnAPI 7 折派生价

模型目录保存原厂价、OwnAPI 价格倍率、来源 URL 和核验日期。页面运行时或构建时由统一函数计算 70% 售价，避免手工填写两份价格后产生偏差。页面借鉴 PackyAPI 的分类逻辑，但沿用 OwnAPI 的排版、字体、间距、卡片和艺术图风格。

### 未采用：直接复制 PackyAPI 价格

无法满足“按照每个模型厂家的原价”的要求，也会让 OwnAPI 售价跟随第三方折扣变化而失真。

### 未采用：完整复制 PackyAPI 页面

其部分筛选项对 16 个模型没有区分度，并会破坏 OwnAPI 已有视觉系统。只保留能帮助用户选型的交互。

## 模型及价格基准

下表顺序为：原厂标准输入 / 缓存读取 / 输出，以及对应的 OwnAPI 70% 价格。数值均为 USD / 1M tokens。

| 厂商 | 模型 ID | 原厂标准价 | OwnAPI 价 | 备注 |
| --- | --- | ---: | ---: | --- |
| OpenAI | `gpt-5.4` | 2.5 / 0.25 / 15 | 1.75 / 0.175 / 10.5 | 超过 272K 输入存在原厂长上下文溢价，详情页说明 |
| OpenAI | `gpt-5.4-mini` | 0.75 / 0.075 / 4.5 | 0.525 / 0.0525 / 3.15 | 标准档 |
| OpenAI | `gpt-5.5` | 5 / 0.5 / 30 | 3.5 / 0.35 / 21 | 超过 272K 输入存在原厂长上下文溢价，详情页说明 |
| OpenAI | `gpt-5.6-luna` | 0.2 / 0.02 / 1.2 | 0.14 / 0.014 / 0.84 | 成本优先 |
| OpenAI | `gpt-5.6-terra` | 2 / 0.2 / 12 | 1.4 / 0.14 / 8.4 | 均衡档 |
| OpenAI | `gpt-5.6-sol` | 4 / 0.4 / 20 | 2.8 / 0.28 / 14 | 旗舰档 |
| OpenAI | `codex-auto-review` | 2.5 / 0.25 / 15 | 1.75 / 0.175 / 10.5 | 服务别名；底层按 GPT-5.4 标准价展示，不描述为独立基础模型 |
| Anthropic | `claude-haiku-4-5-20251001` | 1 / 0.1 / 5 | 0.7 / 0.07 / 3.5 | 200K context |
| Anthropic | `claude-opus-4-6` | 5 / 0.5 / 25 | 3.5 / 0.35 / 17.5 | 1M context |
| Anthropic | `claude-opus-4-7` | 5 / 0.5 / 25 | 3.5 / 0.35 / 17.5 | 1M context |
| Anthropic | `claude-opus-4-8` | 5 / 0.5 / 25 | 3.5 / 0.35 / 17.5 | 1M context |
| Anthropic | `claude-opus-5` | 5 / 0.5 / 25 | 3.5 / 0.35 / 17.5 | 1M context |
| Anthropic | `claude-sonnet-4-6` | 3 / 0.3 / 15 | 2.1 / 0.21 / 10.5 | 1M context |
| Anthropic | `claude-sonnet-5` | 2 / 0.2 / 10 | 1.4 / 0.14 / 7 | 2026-08-10 公告确认该价格成为标准价 |
| xAI | `grok-4.5` | 2 / 0.3 / 6 | 1.4 / 0.21 / 4.2 | 短上下文，输入低于 200K |
| xAI | `grok-4.5` 长上下文 | 4 / 0.6 / 12 | 2.8 / 0.42 / 8.4 | 输入达到 200K |
| xAI | `grok-4.6` | 2 / 0.5 / 6 | 1.4 / 0.35 / 4.2 | 短上下文，输入低于 200K |
| xAI | `grok-4.6` 长上下文 | 4 / 1 / 12 | 2.8 / 0.7 / 8.4 | 输入达到 200K |

官方来源：

- OpenAI GPT-5.4：https://developers.openai.com/api/docs/models/gpt-5.4
- OpenAI GPT-5.4 Mini：https://developers.openai.com/api/docs/models/gpt-5.4-mini
- OpenAI GPT-5.5：https://developers.openai.com/api/docs/models/gpt-5.5
- OpenAI GPT-5.6 系列：https://developers.openai.com/api/docs/models/compare
- OpenAI Codex rate card：https://help.openai.com/en/articles/20001415
- Anthropic Pricing：https://platform.claude.com/docs/en/about-claude/pricing
- Anthropic Release Notes：https://platform.claude.com/docs/en/release-notes/overview
- xAI Pricing：https://docs.x.ai/developers/pricing
- PackyAPI 收录范围：https://www.packyapi.com/pricing

## 数据模型与计算规则

扩展 `ModelCatalogEntry`，把展示文案与价格数据分开：

- `providerId`：`openai`、`anthropic` 或 `xai`。
- `providerName` 与 `providerLogo`：厂商正式名称和真实品牌图标路径。
- `officialPricing`：标准输入、缓存读取、输出及可选长上下文档位。
- `ownApiMultiplier`：固定为 `0.7`。
- `pricingSourceUrl` 与 `pricingCheckedAt`：价格出处和核验日期。
- `modelClass`：`flagship`、`balanced`、`fast`、`coding` 等可组合标签。
- `endpoints`：实际兼容的 OpenAI 或 Anthropic 风格接口。
- `isAlias` 与 `aliasNote`：用于 `codex-auto-review`。

售价计算只能走一个纯函数：`officialPrice * ownApiMultiplier`。显示最多保留四位小数并去掉无意义的尾随零；底层保留数值，不把带美元符号的字符串作为计算源。若某项官方价缺失，显示“暂未公布”，不能猜测或回退到 PackyAPI 售价。

## Models 页面信息架构

### 顶部区域

- 标题和简短说明强调“官方原价 7 折”。
- 搜索支持模型 ID、显示名和厂商名。
- 展示“价格最后核验：2026-08-31”。

### 筛选与排序

- 厂商：全部、OpenAI、Anthropic、xAI。
- 类型：旗舰、均衡、极速、编程、推理。
- 接口：OpenAI-compatible、Anthropic-compatible；只显示真实兼容项。
- 排序：推荐、名称、输入价格、输出价格。
- 不加入只有一个可选值的“按 token 计费”筛选，以减少无效控制。

### 模型卡片

- 使用现有 OwnAPI 卡片和模型家族艺术图，不照搬 PackyAPI 视觉。
- 厂商小图标必须使用 OpenAI、Anthropic、xAI 的真实品牌资产；不使用 emoji、文字代替或手绘近似图标。
- 同时展示划线的官方原价和醒目的 OwnAPI 价，徽标文案为“官方价 7 折”，不写成 PackyAPI 的 `93% OFF`。
- 卡片主价格默认突出输入价，同时清楚列出缓存读取和输出价，避免只有单一数字造成误解。
- xAI 卡片增加短上下文和长上下文切换或两行价格。
- `codex-auto-review` 增加“基于 GPT-5.4 的自动审查服务”说明。

### 详情页

- 保留上下文、能力、支持端点和适用场景。
- 加入完整价格表、计算说明、原厂价格来源链接和核验日期。
- 对 OpenAI 长上下文、区域处理，Anthropic 缓存写入、数据驻留，以及 xAI 200K 阈值给出非主价格说明。
- 所有“可用”标签必须来自项目实际支持状态；不能仅因为 PackyAPI 收录就暗示 OwnAPI 后端已经可调用。

## Status、Monitor 与管理员监控边界

### 本期决策

- 删除公共页头、页脚和 Docs 侧栏中的 `Status` 入口。
- 不创建假的 `/status`，也不展示没有真实探测支撑的“全部正常”。
- 已存在的 `/monitor` 继续要求登录，展示当前用户可见的模型线路、延迟、可用率及异常信息。
- 管理员全局渠道监控沿用管理员权限与入口，不向普通用户或公共页面泄漏渠道、账户和用户级信息。

### 未来公开 Status 的上线条件

只有在具备独立自动探测、真实可用率聚合、事件发布和维护记录后才恢复公共 Status。届时它只回答全站服务是否正常，不显示任何个人调用数据。

## 数据流与错误处理

1. 静态模型目录提供厂商、能力、官方价和来源元数据。
2. 统一计算函数派生 OwnAPI 70% 价格。
3. Models 列表和详情页共用同一目录和格式化函数。
4. 实际可售状态来自现有后端模型或渠道能力；目录负责营销和价格展示，但不能覆盖真实可用性。
5. 数据缺失时保留模型信息并明确标记“价格待确认”或“暂未开放”，控制台输出开发期警告；页面不能显示 `$0`。
6. 图片加载失败时使用已有品牌安全的家族默认图，不能出现空白大图或破图图标。

## 验证标准

- 单元测试覆盖 70% 价格计算、四位小数格式化、缺失价格、xAI 长上下文和 alias 标记。
- 数据测试断言 16 个 PackyAPI 目标模型全部存在，且厂商、来源 URL、核验日期完整。
- 组件测试覆盖搜索、厂商筛选、类型筛选、排序和详情导航。
- 路由测试断言公共导航不再包含 Status，未登录访问 `/monitor` 仍会进入登录流程。
- 桌面和移动端浏览器 QA 检查卡片换行、价格对齐、品牌图标、筛选交互和无横向溢出。
- 最终价格表逐项与本规格及原厂来源复核，OwnAPI 价格误差必须为零。

## 非目标

- 本期不建设公共故障状态系统。
- 本期不更改用户 `/monitor` 或管理员监控的数据权限模型。
- 本期不实现自动抓取第三方价格；更新仍需人工核验和提交。
- 本期不承诺 PackyAPI 收录模型已经在 OwnAPI 后端全部可调用；页面必须以实际渠道能力为准。
- 本期不部署到生产环境，除非用户在实现和本地验证完成后再次明确要求发布。
