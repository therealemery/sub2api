# 中转站 UI 规范 v2.0

> v2.0 是设计哲学的根本转向：从 v1.x 的"iOS 后台风（蓝色+大圆角+苹果克制）"切换为"编辑出版风（米黄纸底+赤橙陶器红+衬线标题+小圆角+印刷理性）"。所有页面——营销页、控制台、文档——共享同一套设计语言。任何与本规范冲突的设计或代码必须以本规范为准。

---

## 0. 给开发者的硬性约束

在动手前先读这一章。codex 在执行 UI 任务时必须遵守以下铁律。

### 0.1 必须做

1. 所有颜色、字号、间距、圆角、阴影、过渡曲线只能通过 CSS 变量引用，禁止直接写十六进制色值或像素值。
2. 任何颜色相关属性（color、background、border-color、fill、stroke）必须使用 §2.2 的语义 token，**禁止使用 §2.1 的 palette 原始值**。palette 仅在主题定义文件（globals.css 的 `:root` 块）中出现一次。
3. 任何页面在动手前先判断属于 **营销层** 还是 **控制台层**，然后套用对应的密度 token。判断标准见 §5。
4. 中文文本必须使用 `--font-zh` 字体栈，英文/数字必须使用 `--font-en` 字体栈，混排通过 `font-family: var(--font-en), var(--font-zh)` 实现。
5. 所有数字（金额、Token 数、用量、百分比）必须使用 `font-variant-numeric: tabular-nums`。
6. 主题切换通过切换 `<html data-theme="light">` 或 `<html data-theme="dark">` 实现，组件内部禁止判断当前主题。
7. 任何容器嵌套结构必须遵循 §2.2 的层级铁律：页面背景与卡片背景必须使用不同 token。
8. 状态标签、金额展示、表格行、图表配色、按钮、卡片、输入框、浮层必须使用本规范封装的组件或 mixin，禁止从零写。
9. 每个页面必须实现：默认态、加载态（骨架屏）、空状态、错误态四种状态。缺一即视为未完成。
10. 按钮高度、卡片尺寸、表格行高、输入框尺寸必须从 §8 的枚举值中选取，禁止自定义。
11. 任何交互元素（按钮、输入框、链接、菜单项）必须实现完整 6 种状态：default / hover / active / focus-visible / disabled / loading。
12. 任何过渡动画必须使用 §12.2 定义的曲线和持续时间 token，禁止 `transition: all`、禁止 `ease`、禁止 `linear`（spinner 除外）。
13. focus 状态必须使用 `:focus-visible` 而非 `:focus`，发光环统一使用 `--focus-ring`。
14. 所有浮层（Drawer / Modal / Bottom Sheet）必须有遮罩层，统一使用 `--backdrop-bg`。

### 0.2 禁止做

1. 禁止引入 Sen、思源黑体、苹方以外的字体。
2. 禁止使用阴影制造层级（`box-shadow` 仅允许出现在 popover、modal、dropdown 三类浮层组件，且必须使用 `--shadow-overlay` token）。
3. 禁止使用渐变（gradient）作为按钮、卡片、背景的主色。例外：图表数据填充区允许使用 `--chart-gradient-*` token。
4. 禁止使用纯黑 #000 或纯白 #fff 作为暗色模式下的文字或背景。
5. 禁止使用 9999px 圆角按钮（pill）作为任何操作。v2.0 全站取消 pill 按钮形态。9999px 仅用于头像、状态色点等圆形元素。
6. 禁止单元格高度小于 40px 的密集表格，禁止行高小于 1.4 的正文。
7. 禁止使用 emoji 作为状态指示，必须使用色点 + 文字组合。
8. 禁止在同一页面出现超过 3 种按钮尺寸、超过 2 种卡片尺寸。
9. 禁止在卡片内放置和外层卡片同色背景的元素（背景必须分层，见 §2.2 容器层级铁律）。
10. 禁止用 `style=""` 内联样式覆盖组件样式。组件可以通过 props 接受 size/variant 等参数，但不能从外部传 color/background。
11. 禁止任何组件硬编码颜色值。即便临时调试，提交前必须替换为 token。

### 0.3 修改规范的流程

本文件即设计源。任何"我觉得这里应该改一下"的想法，必须先改本文件，再改代码。禁止反向操作。

---

## 1. 设计原则

中转站采用 **编辑出版风（editorial design）** 设计语言。所有页面——无论是营销首页还是后台仪表盘——都应该看起来像一本精心设计的独立刊物，而不是一个 SaaS 后台模板。

参考标杆：Stripe / Vercel 早期文档、Werner Werkstatt 品牌指南、Are.na 编辑页面、Field Notes 出版物。

四条核心原则（按优先级排序）：

1. **印刷物大于界面**。视觉决策的依据是"这页放在一本独立刊物里会不会和谐"，而不是"现代 UI 通常长什么样"。米黄纸底、衬线大标题、等宽元数据、细线分隔——这些是出版物的语言。
2. **理性大于装饰**。所有视觉效果只在服务功能时存在。能去掉的都去掉。禁止阴影制造层级、禁止渐变、禁止背景纹理、禁止圆形大圆角"卡片漂浮"效果。
3. **信息密度服从信息层级**。后台页面信息多，但层级必须用排印手段建立——字号、衬线/无衬线对比、kicker 元数据、细线分隔——而不是用色块。
4. **数字是一等公民**。金额、Token、用量等数字的字号、对齐、字体规则严格。仪表盘大数字用衬线（出版气质），表格内数字用无衬线 tabular-nums（可读性）。

---

## 2. 颜色 Token

### 2.1 基础色板（不随主题变化的原始值）

| Name | Value | Token | 备注 |
|------|-------|-------|------|
| Paper | `#fafaf7` | `--palette-paper` | 米黄纸底，全站页面背景 |
| Paper Warm | `#f5f3ec` | `--palette-paper-warm` | 温暖纸色，表头/嵌套底色 |
| Paper Card | `#ffffff` | `--palette-paper-card` | 卡片纯白（在米黄底上更突出） |
| Line | `#e5e3dc` | `--palette-line` | 主分隔线，米黄调灰 |
| Line Soft | `#eeece5` | `--palette-line-soft` | 弱分隔线 |
| Ink | `#1a1a1a` | `--palette-ink` | 主文字色（纯黑接近，但带一点暖） |
| Ink Soft | `#3a3a3a` | `--palette-ink-soft` | 次级文字 |
| Ink Mute | `#6b6b6b` | `--palette-ink-mute` | 弱化文字、说明 |
| Ink Faint | `#9a9a9a` | `--palette-ink-faint` | kicker、元数据、最弱文字 |
| Accent | `#c4471a` | `--palette-accent` | 赤橙陶器红，唯一强调色 |
| Accent Hover | `#a73c16` | `--palette-accent-hover` | hover 加深 |
| Accent Soft | `#e8d5cc` | `--palette-accent-soft` | 选中态浅底 |
| Accent Wash | `#fef7f3` | `--palette-accent-wash` | 最浅的赤橙底，用于卡片底色变化 |
| Success | `#4a7c3c` | `--palette-success` | 萤火虫绿（去饱和，配合出版调） |
| Success Soft | `#e8efe2` | `--palette-success-soft` | 成功浅底 |
| Warn | `#b8851f` | `--palette-warn` | 琴黄（去饱和） |
| Warn Soft | `#f5ebd2` | `--palette-warn-soft` | 警告浅底 |
| Danger | `#a73c2e` | `--palette-danger` | 深红（与赤橙拉开但同色系） |
| Danger Soft | `#f3dcd6` | `--palette-danger-soft` | 危险浅底 |
| Code Bg | `#1c1c1e` | `--palette-code-bg` | 代码块深底 |
| Code Text | `#e8e6df` | `--palette-code-text` | 代码块文字 |
| Dark Page | `#1c1b17` | `--palette-dark-page` | 暗色模式页面底（暖黑而非纯黑） |
| Dark Surface | `#252420` | `--palette-dark-surface` | 暗色模式卡片底 |
| Dark Line | `#3a3833` | `--palette-dark-line` | 暗色模式分隔 |
| Dark Text | `#e8e6df` | `--palette-dark-text` | 暗色模式主文字 |

**关键转变**：
- 删除原 Cloud White / Faint Fog / Polar Mist / Light Ash / Graphite / Deep Slate（灰色调过冷）
- 删除蓝色 Accent Blue（不再是主色）
- 删除 Slate 系列暗色（改用暖黑）
- 三种状态色（绿/黄/红）保留，但**全部去饱和**，与赤橙陶器色调和谐共存

### 2.2 语义 Token（组件中只能用这一组）

#### 容器层级铁律

页面分层，每一层背景必须有可感知差异，**禁止页面背景与卡片背景同色**。

层级关系（亮色模式）：

```
Layer 0: --bg-page         米黄纸底 #fafaf7（全站底色）
Layer 1: --bg-surface      卡片纯白 #ffffff（在米黄底上突出）
Layer 2: --bg-surface-alt  温暖纸色 #f5f3ec（表头、代码块、嵌套底）
Layer 3: --bg-subtle       hover/选中浅底
```

**禁止**：
- 禁止 `--bg-page` 和 `--bg-surface` 设同色
- 禁止用边框替代背景层级
- 禁止用阴影制造层级（浮层除外）
- 禁止给嵌套卡片用不同背景色——嵌套卡片和外层卡片一律 `--bg-surface`
- 禁止任何背景纹理、噪点、渐变（除按官方规定的图表填充区）

| Token | Light | Dark | 用途 |
|-------|-------|------|------|
| `--bg-page` | `#fafaf7` | `#1c1b17` | 页面最底层（米黄纸底 / 暖黑） |
| `--bg-surface` | `#ffffff` | `#252420` | 所有卡片、modal、表单容器 |
| `--bg-surface-alt` | `#f5f3ec` | `#2a2925` | 表头、代码块、面板分区 |
| `--bg-subtle` | `#eeece5` | `#312f2a` | hover 态、选中态浅底 |
| `--bg-inverse` | `#1a1a1a` | `#e8e6df` | 反色按钮、tooltip |
| `--text-primary` | `#1a1a1a` | `#e8e6df` | 标题、正文 |
| `--text-secondary` | `#3a3a3a` | `#c8c5be` | 次级文字 |
| `--text-mute` | `#6b6b6b` | `#9a978f` | 说明、占位 |
| `--text-faint` | `#9a9a9a` | `#76746d` | kicker、元数据、最弱文字 |
| `--text-inverse` | `#fafaf7` | `#1a1a1a` | 深底上的文字 |
| `--text-link` | `#c4471a` | `#d96941` | 链接，赤橙色 |
| `--border-default` | `#e5e3dc` | `#3a3833` | 默认边框、主分隔线 |
| `--border-soft` | `#eeece5` | `#2f2d29` | 弱分隔（卡片内分区） |
| `--border-strong` | `#c8c5b8` | `#4a4842` | 输入框聚焦、强分隔 |
| `--border-focus` | `#c4471a` | `#d96941` | 聚焦态边框 |
| `--accent` | `#c4471a` | `#d96941` | 主操作、活跃态、链接 |
| `--accent-hover` | `#a73c16` | `#bf5731` | hover 加深 |
| `--accent-soft` | `#e8d5cc` | `#4a2a1f` | 选中态、tag 底色 |
| `--accent-wash` | `#fef7f3` | `#2a1f1a` | 最浅赤橙底，强调卡片 |
| `--status-success` | `#4a7c3c` | `#6fa052` | 成功 |
| `--status-success-soft` | `#e8efe2` | `#2a3a22` | 成功浅底 |
| `--status-warn` | `#b8851f` | `#d4a23a` | 警告 |
| `--status-warn-soft` | `#f5ebd2` | `#3a2f1a` | 警告浅底 |
| `--status-danger` | `#a73c2e` | `#c95c4a` | 失败 |
| `--status-danger-soft` | `#f3dcd6` | `#3a1f1a` | 失败浅底 |
| `--status-neutral` | `#6b6b6b` | `#9a978f` | 中性 |
| `--status-neutral-soft` | `#eeece5` | `#312f2a` | 中性浅底 |
| `--shadow-overlay` | `0 8px 32px rgba(26,26,26,.08)` | `0 8px 32px rgba(0,0,0,.5)` | 浮层唯一阴影 |

> 暗色模式背景**禁止使用纯黑**，统一使用暖黑 `#1c1b17`。这是为了保持出版调性的连贯（纯黑会显得冷峻、像现代 SaaS，而非编辑风的"暗夜印刷"质感）。

### 2.3 图表配色（仅供图表组件使用）

与原色板和谐共存，全部去饱和，呈现"印刷油墨"质感。

| Token | Value | 序号 |
|-------|-------|------|
| `--chart-1` | `#c4471a` | 主序列（赤橙陶器） |
| `--chart-2` | `#6b6b6b` | 次序列（深灰，作为对比） |
| `--chart-3` | `#4a7c3c` | 第三序列（萤火虫绿） |
| `--chart-4` | `#b8851f` | 第四序列（琴黄） |
| `--chart-5` | `#7c5cd0` | 第五序列（紫色，去饱和） |
| `--chart-6` | `#a73c2e` | 第六序列（深红，多用于异常） |
| `--chart-grid` | `--border-default` | 网格线 |
| `--chart-axis` | `--text-faint` | 坐标轴文字 |

序列超过 6 条必须聚合或换图表类型，禁止扩充。
| `--chart-3` | `#d4881f` | 第三序列 |
| `--chart-4` | `#7c5cd0` | 第四序列 |
| `--chart-5` | `#3aa9c2` | 第五序列 |
| `--chart-6` | `#d44a3f` | 第六序列（一般用作异常/告警） |
| `--chart-grid` | `--border-default` | 网格线 |
| `--chart-axis` | `--text-tertiary` | 坐标轴文字 |

图表序列超过 6 条时必须改为聚合或换图表类型，禁止扩充配色。

---

## 3. 字体 Token

### 3.1 字体栈

v2.0 是三套字体明确分工：**衬线大标题 + 无衬线正文 + 等宽元数据**。

```css
/* 衬线标题字体（编辑出版风的灵魂） */
--font-serif: 'Instrument Serif', 'Source Han Serif SC', 'Songti SC', 'Noto Serif SC', Georgia, serif;

/* 无衬线正文字体（所有正文、表格、表单） */
--font-sans-en: 'Inter', ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-sans-zh: 'Noto Sans SC', 'PingFang SC', 'HarmonyOS Sans SC', 'Source Han Sans SC', 'Microsoft YaHei', sans-serif;
--font-sans: var(--font-sans-en), var(--font-sans-zh);

/* 等宽字体（kicker、元数据、代码、API Key） */
--font-mono: 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;

/* 默认 base（向下兼容旧代码引用） */
--font-base: var(--font-sans);
```

**强制规则**：

1. **标题用衬线** `var(--font-serif)`：display / heading-lg / heading 三档大标题，全部使用 Instrument Serif。仪表盘上的大数字也用衬线。
2. **正文用无衬线** `var(--font-sans)`：所有 body / body-sm / caption / 表格内文字、表单文字、按钮文字、导航文字。
3. **元数据用等宽** `var(--font-mono)`：kicker 文字、API Key、Token、URL、代码块、表格内的 ID 字段。
4. **数字位置**：仪表盘大数字用 `var(--font-serif)`，表格内数字用 `var(--font-sans)`。无论哪种都必须加 `font-variant-numeric: tabular-nums`。
5. **中英文混排**：英文/数字优先匹配前置字体（Inter / Instrument Serif），中文字符自动 fallback 到 Noto Sans SC / Source Han Serif SC。
6. **禁止引入 Sen、Roboto、思源黑体（已通过 Noto Sans SC 覆盖）以外的字体**。
7. **网络字体加载**：Instrument Serif、Inter、JetBrains Mono 通过 Google Fonts 或本地化部署。中文字体禁止网络加载（体积过大），依赖系统字体或预下载。

### 3.2 字号梯度

营销层和控制台层共用一套字号，差别在字体（衬线/无衬线）和使用频率。

| Role | Size | Line Height | Weight | 字体族 | Token |
|------|------|-------------|--------|--------|-------|
| display-lg | 88px | 1.0 | 400 | serif | `--text-display-lg` |
| display | 64px | 1.05 | 400 | serif | `--text-display` |
| heading-lg | 44px | 1.1 | 400 | serif | `--text-heading-lg` |
| heading | 28px | 1.2 | 500 | serif | `--text-heading` |
| heading-sm | 20px | 1.3 | 500 | sans | `--text-heading-sm` |
| body-lg | 18px | 1.6 | 400 | sans | `--text-body-lg` |
| body | 15px | 1.6 | 400 | sans | `--text-body` |
| body-sm | 14px | 1.55 | 400 | sans | `--text-body-sm` |
| caption | 13px | 1.5 | 400 | sans | `--text-caption` |
| micro | 12px | 1.4 | 500 | sans | `--text-micro` |
| kicker | 11px | 1.4 | 500 | **mono** | `--text-kicker` |

**关键变化**：
- 衬线大标题字号普遍**变大**：display-lg 从 56px 升到 88px，display 从 44px 升到 64px——这是编辑风的常态，衬线字号需要更大才能显出气质
- 衬线字重**变轻**：display/heading-lg 用 400（regular），不再用 700。Instrument Serif 本身就有"重"感
- 行高**收紧**：display 类行高从 1.07 收到 1.0–1.1，更紧凑、更像印刷品
- 新增 `body-lg`（18px）：营销页正文标准
- 新增 `kicker`（11px mono）：编辑风必备元数据样式（详见 §8.10）

**使用约束**：

| 字号 | 用途 |
|------|------|
| display-lg | 仅营销层落地页 hero。控制台禁用。 |
| display | 营销层 hero 副标题、章节大标题 |
| heading-lg | 营销层副标题、**控制台仪表盘大数字**（如"本月消耗 ¥1,234.56"，衬线呈现） |
| heading | 控制台页面标题、营销层模块标题 |
| heading-sm | 卡片标题、Drawer 标题、模块标题 |
| body-lg | 营销页主要正文 |
| body | 控制台默认正文 |
| body-sm | 表格内文字、表单 label、密集区域正文 |
| caption | 辅助说明、状态标签内文字、表格表头（如果不用 kicker） |
| micro | 角标、徽章数字 |
| kicker | 面包屑、页面标题区上方的小元数据、章节编号、表格表头（推荐）|

### 3.3 字重使用

按字体族分别约束：

**Instrument Serif（衬线）**
- 400 Regular：所有衬线标题，禁止其他字重
- Instrument Serif 设计风格自带"重"感，加粗会破坏比例

**Inter / Noto Sans SC（无衬线）**
- 400 Regular：正文、表格内容、说明
- 500 Medium：按钮文字、表格表头、强调、heading-sm、micro
- 600 Semibold：仅用于卡片标题、强调段落

**JetBrains Mono（等宽）**
- 400 Regular：API Key、URL、代码
- 500 Medium：kicker 文字

不允许使用 300 / 700 / 800 / 900 字重，全站只用 400 / 500 / 600 三档。

### 3.4 斜体使用

衬线字体可以使用斜体。这是编辑风的重要语汇。

**允许斜体的场景**：
- 营销页 hero 副标题中的关键短语（如 "Built _for developers_"）
- 引用、提示性文字（如 "_for example_, here's..."）
- 文章内的强调

**禁止斜体的场景**：
- 后台 UI 文字（按钮、表格、表单、菜单）
- 数字
- 中文（中文字体没有真正的斜体，会渲染成机械倾斜）
- 等宽字体的 kicker

---

## 4. 间距 Token

### 4.1 基础尺度

基本单位 4px。

| Token | Value |
|-------|-------|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |
| `--space-20` | 80px |

> 删除了原 21n 的 13/17/21/25/29/33/38/67/84/90/95/134 这类非倍数值。这些值在后台场景会导致对齐崩溃，统一改为 4 的倍数。

### 4.2 语义间距

| Token | Marketing 层 | Console 层 | 用途 |
|-------|-------------|-----------|------|
| `--gap-section` | 80px | 48px | 大块之间 |
| `--gap-block` | 48px | 24px | 模块之间 |
| `--gap-card` | 24px | 16px | 卡片之间、卡片内主区域 |
| `--gap-row` | 16px | 12px | 表单行、列表行之间 |
| `--gap-inline` | 8px | 8px | 文字、图标行内间距 |
| `--padding-page-x` | 32px | 24px | 页面左右内边距 |
| `--padding-card` | 24px | 16px | 卡片内边距 |
| `--padding-cell` | 16px | 12px | 表格单元格内边距 |

切换密度的方式：在页面根节点加 `data-density="compact"`，对应 token 自动切换。营销页默认 `data-density="comfortable"`。

---

## 5. 层级判定：营销层 vs 控制台层

页面归属判定标准（按优先级）：

1. **路径前缀**：`/`、`/pricing`、`/docs`、`/about` 属营销层；`/console`、`/dashboard`、`/admin` 属控制台层。
2. **登录状态**：未登录用户看到的页面，默认营销层。
3. **页面主体内容**：以表格/表单/图表为主视觉的页面，无论路径，都按控制台层处理。

营销层和控制台层差异：

| 维度 | 营销层 | 控制台层 |
|------|--------|---------|
| 主按钮形状 | 6px 矩形 (`--radius-md`) | 6px 矩形 (`--radius-md`) |
| 主标题字号 | display / display-lg | heading-lg / heading |
| section 间距 | 80px | 48px |
| 卡片内边距 | 24px | 16px |
| 行高 | 1.5–1.75 | 1.4–1.5 |
| 阴影 | 无 | 无（仅浮层） |

---

## 6. 全局布局（强制规则）

控制台层所有页面共用同一套外壳：左侧固定侧边栏 + 顶部固定 header + 主内容区。营销层不强制侧边栏，但顶部 nav 必须遵循 §6.2。

### 6.1 整体结构

```
┌──────────────────────────────────────────────┐
│  Header (顶部栏，固定高度 64px)              │
├──────────┬───────────────────────────────────┤
│          │                                   │
│ Sidebar  │   Main Content                    │
│ 240px    │   max-width: 1440px               │
│ (固定)   │   padding: 24px 32px              │
│          │                                   │
└──────────┴───────────────────────────────────┘
```

铁律：
- 侧边栏固定 240px 宽，收起后 64px 宽
- 顶部 Header 固定 64px 高
- 主内容区最大宽度 1440px，居中
- Header 和 Sidebar 都是 `position: fixed`，不随主内容滚动
- 主内容区有左 240px / 上 64px 的初始 offset，给 fixed 元素让位

### 6.2 顶部 Header

控制台层顶部 header 规则：

| 属性 | 值 |
|------|---|
| 高度 | 64px（固定，禁止变化） |
| 背景 | `--bg-surface` |
| 底部分割 | 1px `--border-default` |
| z-index | 50 |
| 阴影 | 无（用边框分隔） |
| padding | 左右 24px |

Header 内容布局：

- **最左**：仅在侧边栏收起时显示展开按钮（hamburger icon，Ghost 风格 sm 按钮）
- **中间**：空（不放面包屑，面包屑见 §6.4）
- **最右**：从左到右依次放：通知铃铛 → 语言切换 → 账户余额胶囊 → 用户头像菜单

每个元素之间间距 `--space-3`（12px）。

**账户余额胶囊**（截图里那个绿色 $100.00）规则：
- 高度 32px（同 sm 按钮）
- 圆角 `--radius-full`
- 背景 `--status-success-soft`
- 文字 `--status-success`，字重 600，`tabular-nums`
- 左侧 8px 处放钱包图标 14px
- 点击跳转到账单页

**用户头像菜单**：
- 头像直径 32px
- 头像右侧 8px 处显示用户名 + 角色（用户名 `--text-body-sm` 字重 500，角色 `--text-caption` 颜色 `--text-secondary`）
- 整体可点击展开 Popover 菜单（见 §8.8.5）

营销层顶部 nav（首页、登录页等未登录页面）规则：
- 高度 76px
- 背景 `--bg-page`（米黄纸底）
- 底部 1px `--border-default` 分隔
- 左侧站点名（无衬线 18px，字重 500）
- 右侧文字链接（`--text-body-sm`，颜色 `--text-secondary`，hover 变 `--text-primary`）+ 主按钮（Ink variant md 尺寸，6px 圆角）
- 内容居中，左右最大宽度同营销内容区 1024px

### 6.3 左侧 Sidebar

| 属性 | 值 |
|------|---|
| 宽度（展开） | 240px |
| 宽度（收起） | 64px |
| 背景 | `--bg-surface` |
| 右侧分割 | 1px `--border-default` |
| z-index | 40（低于 Header，便于 Header 阴影盖在 Sidebar 上） |
| padding | 上下 16px，左右 12px |

#### Sidebar 顶部

- 高度 64px（与 Header 对齐）
- 左侧站点 logo（24×24）+ 站点名（`--text-heading-sm` 字重 700）
- 收起时只显示 logo，居中

#### Sidebar 导航项

每个导航项规则：

- 高度 40px
- 圆角 `--radius-md`（8px）
- padding 左 12px / 右 12px
- 左侧图标 18px，与文字间距 12px
- 文字 `--text-body-sm`，字重 500
- 默认文字 `--text-secondary`，默认背景 transparent

四种状态：

| 状态 | 背景 | 文字色 | 图标色 |
|------|------|--------|--------|
| default | transparent | `--text-secondary` | `--text-secondary` |
| hover | `--bg-subtle` | `--text-primary` | `--text-primary` |
| active（当前页） | `--accent-soft` | `--accent` | `--accent` |
| collapsed（收起） | 同上，但只显示图标，居中 |

**铁律**：
- active 状态禁止使用左侧色条、禁止使用粗体、禁止使用其他形式标记。统一靠背景+文字色变化标识
- 同时只允许一个导航项处于 active
- 导航项之间垂直间距 2px（紧凑，节省空间）

#### Sidebar 分组

导航项可以分组，组之间用分组标题分隔（如截图里的"我的账户"）。

- 分组标题字号 `--text-caption`（13px）
- 颜色 `--text-tertiary`
- 字重 500，大小写按原样
- 上方间距 `--space-4`（16px），下方间距 `--space-2`（8px）
- 收起态隐藏分组标题，仅保留分隔间距

禁止：
- 禁止超过 3 个分组（视觉负担太重）
- 禁止给分组加图标
- 禁止使用线条分隔分组，仅用间距

#### Sidebar 底部

底部固定区域，从上到下：

1. 深色模式切换（开关式样式，见 §8.7 Switch）
2. 收起按钮（左侧箭头图标，文字"收起"；收起态时变右箭头，无文字）

底部区域顶部加 1px `--border-default` 分割。

#### 收起动效

侧边栏展开/收起：
- 宽度过渡 250ms `cubic-bezier(0.32, 0.72, 0, 1)`（iOS 曲线）
- 主内容区 margin-left 同步过渡，相同时长曲线
- 文字 opacity 在前 100ms 内淡出/淡入，避免文字被截断显示

### 6.4 面包屑（Breadcrumb）

面包屑不放在 Header 里，**放在主内容区的最顶部**，与页面标题在一起。

规则：

- 位置：主内容区顶部，页面标题上方
- 字号：`--text-caption`（13px）
- 颜色：除最后一级外，`--text-secondary`；最后一级（当前页）`--text-primary`
- 分隔符：`/`，颜色 `--text-tertiary`，左右各 8px 间距
- 中间项可点击跳转，hover 文字变 `--accent`
- 与下方页面标题的间距 `--space-2`（8px）

**触发条件**：仅当页面层级 ≥ 2 时显示。一级页面（仪表盘、运维监控等）不显示面包屑。

示例：
```
设置 / 通用设置 / 邮件配置
                ^当前页
```

### 6.5 主内容区

| 属性 | 值 |
|------|---|
| 最大宽度 | 1440px（`--console-max-width`） |
| 居中 | margin: 0 auto |
| 左右 padding | 32px（亦即 `--padding-page-x` comfortable 模式值，控制台模式 24px） |
| 上下 padding | 24px |
| 背景 | `--bg-page`（即页面浅灰底，不是白色） |

主内容区从上到下的结构：

1. 面包屑（可选，见 §6.4）
2. 页面标题区（标题 `--text-heading` 22px 字重 600 + 可选副标题 `--text-body-sm` `--text-secondary`）
3. 工具栏区（搜索、筛选、主操作按钮，可选）
4. 内容区（卡片们）

各区之间间距：标题区到工具栏 `--space-6`（24px），工具栏到内容区 `--space-6`，卡片之间 `--gap-block`（24px）。

### 6.6 页脚（Footer）

**控制台层禁止显示 Footer**。Footer 会挤压主内容区，且在后台场景没有信息价值。

营销层允许显示 Footer，规则：

- 背景 `--bg-page`
- 顶部 1px `--border-default`
- padding 上下 48px / 左右 32px
- 内容：版权 + 主要链接（最多 3 列，每列 ≤ 5 条）
- 字号 `--text-caption`，颜色 `--text-secondary`

### 6.7 z-index 层级（强制枚举）

为避免浮层互相遮挡，所有 z-index 必须从以下值中选取：

| Token | Value | 用途 |
|-------|-------|------|
| `--z-base` | 0 | 默认层 |
| `--z-sidebar` | 40 | 侧边栏 |
| `--z-header` | 50 | 顶部栏 |
| `--z-dropdown` | 100 | 下拉菜单、Popover |
| `--z-backdrop` | 900 | 浮层遮罩 |
| `--z-drawer` | 950 | 抽屉 |
| `--z-modal` | 1000 | 居中弹窗 |
| `--z-toast` | 1100 | toast 提示（在最顶层，永不被遮挡） |
| `--z-tooltip` | 1200 | tooltip |

禁止使用其他 z-index 值。

### 6.8 sticky 元素规则

控制台页面常需要 sticky 元素（表格表头、筛选栏在滚动时固定）。规则：

- 仅允许以下元素使用 sticky：表格 thead、表格上方筛选/操作工具栏、tab 切换条
- sticky top 值必须考虑 Header（top: 64px）。在主内容区内 sticky 时 top: 0 即可（因为主内容区本身已在 Header 下方）
- sticky 元素背景必须显式声明（否则会透出下方内容）：通常用 `--bg-surface`
- sticky 元素底部必须有 1px `--border-default` 分隔，让用户知道这是 sticky 而非内容自然停留

### 6.9 全局禁止

- 禁止使用 `position: fixed` 用于 Sidebar / Header / 浮层之外的元素
- 禁止 Header 高度超过 64px 或低于 64px
- 禁止 Sidebar 宽度不是 240px / 64px 这两个值
- 禁止在 Sidebar 里放主操作按钮（如"创建密钥"），主操作必须在主内容区
- 禁止 Footer 在控制台页面显示
- 禁止移动端把侧边栏铺满屏幕（移动端做法以后版本再定，目前桌面优先）

---

## 7. 圆角 Token

v2.0 采用出版物理性圆角：小、克制、不抢戏。

| Token | Value | 用途 |
|-------|-------|------|
| `--radius-xs` | 2px | 标签内的色点、micro 角标 |
| `--radius-sm` | 4px | tag、状态标签、checkbox |
| `--radius-md` | 6px | 按钮、输入框、表格单元格 |
| `--radius-lg` | 8px | **卡片专用**、modal、dropdown |
| `--radius-xl` | 10px | Drawer 边角、大尺寸 modal |
| `--radius-full` | 9999px | 头像、状态色点圆形 |

**关键转变**（v1.x → v2.0）：
- 卡片圆角：20px → **8px**。出版物理性，不再追求 macOS 软圆角
- 按钮圆角：8px → 6px
- 删除 `--radius-card` 这个 v1.2 引入的专属变量。v2.0 卡片直接用 `--radius-lg`（8px），与 modal/dropdown 共用一套圆角逻辑——因为编辑风的哲学是"形态一致而非元素差异化"

**铁律**：
- 卡片必须用 `--radius-lg`（8px），全站统一
- 按钮必须用 `--radius-md`（6px）
- 输入框必须用 `--radius-md`（6px）
- 任何元素禁止使用大于 10px 的圆角（除头像/色点圆形外）
- 禁止使用奇数像素圆角（3px、5px、7px 等）
- pill 按钮不再使用 9999px——v2.0 出版风不再有 pill 按钮，全部改为 6px 矩形按钮

---

## 8. 关键组件规则

### 8.1 按钮

按钮共五种 variant，三种 size，禁止扩展。任何按钮都必须明确声明 variant 和 size，必须实现完整 6 种交互状态。

#### 8.1.1 尺寸枚举

| Size | 高度 | 横向 padding | 字号 | 字重 | 圆角（控制台/营销） |
|------|------|-------------|------|------|----------|
| sm   | 32px | 12px        | `--text-caption` (13px) | 500 | `--radius-md` (6px) |
| md   | 40px | 16px        | `--text-body-sm` (14px) | 500 | `--radius-md` (6px) |
| lg   | 48px | 24px        | `--text-body` (15px) | 500 | `--radius-md` (6px) |

**默认值**：表格内、表单 inline 用 sm；页面主操作用 md；营销层 hero CTA 用 lg。

**关键转变**：v2.0 去掉 pill 按钮（9999px 圆角）。营销层和控制台层按钮形态完全一致，都是 6px 小圆角矩形——这是出版风的核心。

#### 8.1.2 Variant（颜色含义）

按钮 variant 仅决定颜色，尺寸由 size 决定。所有 variant 共享 §8.1.3 的交互状态规则。

| Variant   | 背景 | 文字 | 边框 | 用途 |
|-----------|------|------|------|------|
| Primary   | `--accent` | `--text-inverse` | 无 | 主操作（每组仅一个），赤橙陶器红 |
| Secondary | `--bg-surface` | `--text-primary` | 1px `--border-default` | 次操作（取消、返回） |
| Ghost     | transparent | `--text-primary` | 无 | 弱化操作（工具栏、图标按钮） |
| Danger    | `--status-danger` | `--text-inverse` | 无 | 删除、注销、停用（须二次确认） |
| Link      | transparent | `--text-link` | 无 | 行内操作（如表格行"查看详情"，padding 仅左右 4px） |
| Ink       | `--bg-inverse` | `--text-inverse` | 无 | 营销层 hero CTA（黑底白字，编辑风专有） |

新增 **Ink variant**：营销层落地页的 hero CTA 推荐用 Ink（黑底白字），比 Primary 赤橙更克制，符合出版风的"理性首屏"。后台禁用 Ink。

#### 8.1.3 完整交互状态（强制实现 6 种）

每个按钮必须实现以下 6 种状态。缺一即视为未完成。

| 状态 | 视觉变化 | 动效 |
|------|---------|------|
| default | 基础颜色 | — |
| hover | 背景明度变化（见下表），cursor: pointer | 150ms ease-out |
| active（按下） | scale(0.97) + 背景再加深 | 80ms ease-out |
| focus-visible | 外发光环：`0 0 0 3px` `--focus-ring`（半透明主色） | 150ms ease-out |
| disabled | opacity 0.4，cursor not-allowed，**禁止任何 hover/active 变化** | — |
| loading | 文字替换为 spinner（与文字同色），保持原宽度，禁止点击 | — |

**各 variant 的 hover/active 背景值**：

| Variant | hover 背景 | active 背景 |
|---------|-----------|-------------|
| Primary | `--accent-hover` | 在 hover 基础上再降 5% 明度 |
| Secondary | `--bg-subtle` | `--bg-subtle` + 边框变 `--border-strong` |
| Ghost | `--bg-subtle` | `--bg-subtle` + 内阴影 inset 0 0 0 1px transparent → `--border-default` |
| Danger | `--status-danger` × 0.92 明度 | 再 × 0.92 |
| Link | 文字颜色 `--accent-hover` | 不变形不缩放，仅颜色 |
| Ink | `--text-secondary`（深度变浅） | 再变浅，scale(0.97) |

**focus-ring 颜色**：`rgba(196, 71, 26, 0.28)`（亮色，赤橙半透明）/ `rgba(217, 105, 65, 0.35)`（暗色），通过 `--focus-ring` token 暴露。

#### 8.1.4 过渡与动效

所有按钮交互过渡使用如下统一规则。任何按钮组件必须内置这些过渡。

```css
.btn {
  transition:
    background-color 150ms cubic-bezier(0.4, 0, 0.2, 1),
    border-color 150ms cubic-bezier(0.4, 0, 0.2, 1),
    color 150ms cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1),
    transform 80ms cubic-bezier(0.4, 0, 0.2, 1);
}

.btn:active:not(:disabled) {
  transform: scale(0.97);
}

.btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--focus-ring);
}
```

**铁律**：
- 禁止使用 `transition: all`
- 禁止使用 `:focus` 替代 `:focus-visible`（鼠标点击不出现发光环，仅键盘导航出现）
- 禁止给按钮加 `transform: translateY(-2px)` 这类"浮起"效果（破坏出版物的克制气质）
- 按下缩放仅用 scale(0.97)，禁止用 scale(0.95) 或更夸张的值

#### 8.1.5 按钮对齐铁律

1. **同一操作组**（横向并排的按钮）**必须使用相同 size**。禁止主次按钮混 size。
2. 按钮之间间距统一为 `--space-3`（12px）。
3. 对齐方向：modal/表单底部右对齐，表格行内操作右对齐，工具栏右对齐。
4. 主操作（Primary）永远在按钮组的最右侧。
5. 按钮组内图标尺寸：sm 配 14px / md 配 16px / lg 配 18px。
6. 按钮内文字必须 flex 居中，禁止依赖 `line-height` 撑高度。
7. 图标按钮（仅图标无文字）必须是正方形：sm 32×32 / md 40×40 / lg 48×48。

### 8.2 卡片（强制规则）

卡片是后台最常用的容器。**所有卡片外观完全统一**：相同圆角、相同背景、相同边框。不同卡片之间只有内边距和内容差异，没有视觉差异。

#### 8.2.1 卡片外观（所有卡片共用，无例外）

| 属性 | 值 |
|------|---|
| 圆角 | **8px**（`--radius-lg`，统一值，禁止其他圆角） |
| 背景 | `--bg-surface`（亮色 #ffffff / 暗色 #252420） |
| 边框 | 1px solid `--border-default` |
| 阴影 | 无 |

**铁律**：
- 全站所有卡片的圆角必须是 8px，禁止 6px、10px、12px、16px、20px 等其他值
- 全站所有卡片的背景必须是 `--bg-surface`，禁止用 `--bg-surface-alt`、`--bg-subtle` 或任何其他背景色
- 嵌套卡片也用同一个背景 `--bg-surface`，靠 8px 圆角 + 1px 边框自然区分层级
- 卡片不允许加 hover 阴影、不允许加渐变、不允许加角标装饰

**v2.0 新增"强调卡片"变体**：

少数高优先级卡片（如订阅页"当前订阅"、仪表盘"本月消耗"）可使用强调底色：
- 背景改为 `--accent-wash`（最浅赤橙底 #fef7f3）
- 边框改为 1px solid `--accent-soft`
- 其他规则一致

每页强调卡片最多 1 张，超过即视为视觉等级失败。

#### 8.2.2 卡片层级与嵌套

卡片可以嵌套，但外观一致。靠 8px 圆角 + 边框 + 内边距制造嵌套感，不靠颜色差。

| 层级 | 用途 |
|------|------|
| L1 一级卡片 | 页面主要分块（如"个人资料"、"流量与性能"） |
| L2 嵌套卡片 | 一级卡片内的子模块（如"账户余额"、"并发限制"） |
| L3 信息块 | 卡片内的数据展示块（不能再嵌套） |

嵌套深度不能超过 3 层。出现 L4 嵌套即视为信息架构错误，必须拆页面。

#### 8.2.3 卡片尺寸（仅 padding 不同）

卡片只通过 padding 区分尺寸，外观（圆角、背景、边框）三种尺寸完全一致。

| Size | 内边距 | 标题字号 | 标题字体 | 标题与正文间距 | 适用场景 |
|------|--------|----------|---------|----------------|---------|
| sm   | 20px   | `--text-heading-sm` (20px) | sans | `--space-3` (12px) | 表格上方筛选区、嵌套卡片 |
| md   | 28px   | `--text-heading` (28px) | **serif** | `--space-4` (16px) | 常规页面卡片（默认值） |
| lg   | 40px   | `--text-heading-lg` (44px) | **serif** | `--space-6` (24px) | 营销层 hero 卡片、强调卡片 |

**默认值**：写代码时不指定 size，自动使用 md。

**关键转变**：
- md 和 lg 尺寸卡片的标题用衬线（Instrument Serif），这是 v2.0 的核心视觉特征
- sm 卡片标题保持无衬线（嵌套场景里衬线过于抢戏）
- padding 普遍**变大**：sm 16→20、md 24→28、lg 32→40，符合出版物呼吸感

#### 8.2.4 卡片内布局规则

1. 卡片标题永远在顶部，左对齐，下方可有一行说明文字（`--text-body-sm`，颜色 `--text-mute`）。
2. 标题上方**可加 kicker 文字**（详见 §8.10），增强编辑感。
3. 标题区与内容区之间间距固定为 `--space-4`（16px）。
4. 卡片右上角可放置一个操作区（按钮组或下拉菜单），与标题在同一行。
5. 一级卡片之间间距固定为 `--gap-block`（28px 控制台 / 56px 营销层）。
6. 卡片内多个 L2 子卡片之间间距固定为 `--space-5`（20px）。
7. 卡片不允许设置阴影（除浮层外）。
8. 卡片不允许直接贴边——页面必须有 `--padding-page-x` 的左右内边距。

#### 8.2.5 卡片样式参考实现

```css
/* 唯一允许的卡片基础样式，所有卡片必须基于这个 */
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);  /* 8px */
  padding: 28px;  /* 默认 md */
}

.card--sm { padding: 20px; }
.card--lg { padding: 40px; }

/* 强调卡片（每页最多 1 张） */
.card--accent {
  background: var(--accent-wash);
  border-color: var(--accent-soft);
}

/* 卡片标题（md / lg 用衬线） */
.card__title {
  font-family: var(--font-serif);
  font-size: var(--text-heading);
  font-weight: 500;
  line-height: 1.2;
}
.card--sm .card__title {
  font-family: var(--font-sans);
  font-size: var(--text-heading-sm);
  font-weight: 500;
}

/* 禁止扩展 .card--primary、.card--success 等变体 */
/* 禁止在 .card 上覆盖 background（accent 除外）、border-radius、box-shadow */
```

### 8.3 数据表格（强制规则）

中转站的核心组件，规则全部硬性。

| 维度 | 规则 |
|------|------|
| 行高 | 48px（默认）/ 40px（密集模式，仅当用户主动切换） |
| 单元格水平内边距 | 16px |
| 单元格垂直内边距 | 12px |
| 表头背景 | `--bg-surface-alt`（温暖纸色 #f5f3ec） |
| **表头字体** | **`var(--font-mono)`** JetBrains Mono（kicker 风格） |
| **表头字号** | **`--text-kicker`（11px）**，字重 500 |
| **表头字色** | **`--text-faint`**（#9a9a9a） |
| **表头字间距** | letter-spacing: 0.08em |
| **表头大小写** | 英文全大写，中文保持 |
| 行分隔线 | 底边框 1px `--border-default`（米黄调灰），最后一行无边框 |
| 行 hover | 背景 `--bg-subtle` |
| 行选中 | 背景 `--accent-soft` |
| 字体（数字列） | `font-variant-numeric: tabular-nums`，右对齐 |
| 字体（文字列） | 左对齐 |
| 字体（ID/Key 列） | `var(--font-mono)`，单行省略，hover 显完整 |
| 字体（操作列） | 居中或右对齐 |
| 空状态 | 居中插画 + 说明文字 + 主操作按钮 |
| 加载态 | 骨架屏，禁止使用 spinner 覆盖表格 |
| 分页 | 底部右侧，固定显示总数、当前页、每页条数 |

**v2.0 关键转变**：
- 表头使用 kicker 风格（mono 字体、11px、大写、字间距加宽），让表格自带"出版印刷"质感
- 表头背景从灰色 `#f9f9fb` 改为温暖纸色 `#f5f3ec`，与米黄底协调
- 分隔线颜色调整为米黄调灰 `#e5e3dc`，避免冷灰色破坏整体调性

**列宽规则**：
- 时间列固定 160px
- 金额列右对齐，最小宽度 120px
- 状态列固定 100px
- 操作列固定 120px
- ID/Key 列使用 mono 字体，单行省略，hover 显示完整值

### 8.4 状态标签（强制规则）

中转站只有以下九种状态，禁止自创。

| 状态 | 文字 | 色点颜色 | 文字颜色 | 背景 |
|------|------|---------|---------|------|
| 在线 | 在线 | `--status-success` | `--status-success` | `--status-success-soft` |
| 离线 | 离线 | `--status-neutral` | `--status-secondary` | `--status-neutral-soft` |
| 正常 | 正常 | `--status-success` | `--text-primary` | transparent |
| 欠费 | 欠费 | `--status-danger` | `--status-danger` | `--status-danger-soft` |
| 待激活 | 待激活 | `--status-warn` | `--status-warn` | `--status-warn-soft` |
| 已禁用 | 已禁用 | `--status-neutral` | `--text-tertiary` | `--status-neutral-soft` |
| 处理中 | 处理中 | `--status-warn` | `--status-warn` | `--status-warn-soft` |
| 成功 | 成功 | `--status-success` | `--status-success` | `--status-success-soft` |
| 失败 | 失败 | `--status-danger` | `--status-danger` | `--status-danger-soft` |

**视觉规格**：
- 高度 24px
- 圆角 `--radius-full`
- 左右内边距 8px
- 色点直径 6px，与文字间距 6px
- 文字 `--text-caption`，字重 500
- 禁止使用 emoji 或图标替代色点

### 8.5 金额与 Token 数字（强制规则）

中转站的金额和 Token 数是用户最关心的信息，规则最严。

**字体使用规则（v2.0 关键转变）**：
- **仪表盘大数字**（如"本月消耗 ¥1,234.56"）：用 `var(--font-serif)`，字号 `--text-heading-lg`（44px），字重 400
- **表格内数字**：用 `var(--font-sans)`，字号 `--text-body-sm`（14px）。优先可读性
- **正文行内数字**：跟随上下文字体

所有数字必须加 `font-variant-numeric: tabular-nums`。

**金额展示**：
- 货币符号 `¥` 或 `$` 紧贴数字，无空格
- 千分位使用半角逗号
- 默认保留 2 位小数；小额账单允许显示 4 位小数
- 在表格中右对齐
- 正数无前缀，负数用 `-` 前缀，颜色 `--status-danger`
- 收入/充值加 `+` 前缀，颜色 `--status-success`
- 一般金额 `--text-primary`，仪表盘强调金额可用 `--accent`

**Token 数字**：
- 千分位逗号分隔，不带小数
- 单位 `tokens` 小写、`--text-caption`、`--text-mute`，紧跟数字后空一格
- 超过 100 万允许缩写 `1.23M`，tooltip 显示完整值

**百分比**：
- 保留 1 位小数，紧跟 `%` 无空格
- 涨跌用 `↑` `↓` 前缀，颜色对应 success/danger

**示例规范化输出**：
```
本月消耗
¥1,234.56            ← 衬线 44px, --accent
较上月 ↑ 12.3%       ← 无衬线 13px, --status-success

表格行：
2026-05-12 10:30 | gpt-4 | 1,234,567 | ¥0.42   ← 全部无衬线 14px
```

### 8.6 图表

只允许以下图表类型：
1. 折线图（用量趋势）
2. 柱状图（按时段、按模型分布）
3. 面积图（累计消耗）
4. 饼图/环形图（占比，仅当类目 ≤ 6）
5. 数据卡片（单值大数字）

**强制规则**：
- 配色严格使用 `--chart-1` 到 `--chart-6`，按序列顺序分配
- 网格线使用 `--chart-grid`，1px 实线，水平网格线为主，垂直线可省
- 坐标轴文字使用 `--text-caption`，颜色 `--chart-axis`
- 图例放在图表下方左对齐，与图表间距 16px
- tooltip 背景 `--bg-inverse`，文字 `--text-inverse`，圆角 `--radius-md`，padding 12px
- 单值大数字使用 `--text-heading-lg` 字重 700 配 `tabular-nums`
- 禁止使用 3D 图表、雷达图、漏斗图

### 8.7 输入框与表单（强制规则）

输入框是后台触感的主要载体。**v2.0 采用低对比度填充风格**：默认零边框、米黄温暖填充底；focus 后变白底 + 赤橙发光环；过渡 150ms。所有输入类控件（input/textarea/select/搜索框）共享同一套规则。

#### 8.7.1 输入控件尺寸

| Size | 高度 | 横向 padding | 字号 | 圆角 |
|------|------|-------------|------|------|
| sm | 32px | 12px | `--text-caption` (13px) | `--radius-md` (8px) |
| md | 40px | 14px | `--text-body-sm` (15px) | `--radius-md` (8px) |
| lg | 48px | 16px | `--text-body` (16px) | `--radius-lg` (12px) |

**默认值**：表格 inline 编辑 sm；常规表单 md；登录注册 lg。

#### 8.7.2 输入框完整 5 状态

| 状态 | 背景 | 边框 | 文字 | 阴影 |
|------|------|------|------|------|
| default | `--input-bg` | 无 | `--text-primary` | 无 |
| hover | `--input-bg-hover` | 无 | `--text-primary` | 无 |
| focus | `--bg-surface` | 1px `--border-focus` | `--text-primary` | `0 0 0 3px var(--focus-ring)` |
| disabled | `--input-bg` | 无 | `--text-tertiary` | 无（cursor: not-allowed） |
| error | `--status-danger-soft` | 1px `--status-danger` | `--text-primary` | focus 时叠加红色发光环 |

新增 token（见 §13 CSS 定义）：
- `--input-bg`：亮色 `#f5f3ec` / 暗色 `#2a2925`（米黄温暖纸调，比卡片白底深一点）
- `--input-bg-hover`：亮色 `#eeece5` / 暗色 `#312f2a`
- `--focus-ring`：亮色 `rgba(196, 71, 26, 0.28)` / 暗色 `rgba(217, 105, 65, 0.35)`（赤橙半透明）

#### 8.7.3 输入框过渡动效

```css
.input {
  background: var(--input-bg);
  border: 1px solid transparent;  /* 占位透明边框，避免 focus 时跳动 */
  color: var(--text-primary);
  transition:
    background-color 150ms cubic-bezier(0.4, 0, 0.2, 1),
    border-color 150ms cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.input:hover:not(:disabled):not(:focus) {
  background: var(--input-bg-hover);
}

.input:focus {
  outline: none;
  background: var(--bg-surface);
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px var(--focus-ring);
}
```

**铁律**：
- 默认 border 必须设为 `1px solid transparent`，避免 focus 时元素跳动 1px
- 禁止使用 `outline`，只用 `box-shadow` 做发光环
- 禁止给 focus 加 transform 或 scale
- placeholder 颜色 `--text-tertiary`，禁止 placeholder 字号小于输入文字

#### 8.7.4 输入框内字体

- 输入文字字体：`var(--font-base)`（同正文）
- 输入文字字重：400
- 输入文字颜色：`--text-primary`
- 输入数字时自动 `font-variant-numeric: tabular-nums`
- API Key / Token / URL 类输入：字体改为 `var(--font-mono)`
- placeholder：`--text-tertiary`，字重 400，**禁止用斜体**

#### 8.7.5 各类输入控件实例

所有以下控件继承 §8.7.2 的 5 种状态，外观必须一致。

**Text Input / Textarea**
- 标准 input 规则
- textarea 最小高度 `--space-20`（80px），禁止 resize: both，只允许 vertical 或禁用

**Select / Dropdown**
- 默认外观同 input
- 右侧 12px 处放 chevron-down 图标（14px，`--text-secondary`）
- 展开菜单：背景 `--bg-surface`，边框 1px `--border-default`，圆角 `--radius-lg`，阴影 `--shadow-overlay`，最大高度 320px 超出滚动
- 菜单项高度 36px，hover `--bg-subtle`，选中 `--accent-soft` + 右侧 √ 图标

**Search Input**
- 同 input，但左侧 12px 处放 search 图标（14px，`--text-secondary`）
- 文字 padding-left 增加到 36px
- 右侧有内容时显示 clear (×) 图标

**Checkbox / Radio**
- 尺寸 18×18（sm 16×16）
- 圆角：checkbox `--radius-sm`，radio 圆形
- 未选中：背景 `--input-bg`，无边框
- 选中：背景 `--accent`，白色 √ / 圆点
- focus：`box-shadow: 0 0 0 3px var(--focus-ring)`
- 与右侧 label 间距 `--space-2`（8px）

**Switch**
- 尺寸 44×26（小：36×20）
- 关：背景 `--input-bg-hover`
- 开：背景 `--accent`
- 滑块：白色圆形，22px（小 16px），阴影 `0 1px 3px rgba(0,0,0,0.12)`
- 过渡 200ms cubic-bezier(0.4, 0, 0.2, 1)
- 与 label 间距 `--space-3`（12px）

#### 8.7.6 表单布局

1. label 在输入框上方，与输入框间距 `--space-2`（8px）
2. label 字号 `--text-body-sm`，字重 500，颜色 `--text-primary`
3. label 下可加一行描述（`--text-caption`，颜色 `--text-secondary`），最多一行
4. 字段之间垂直间距 `--gap-row`（控制台 12px / 营销层 16px）
5. 两列布局：列间距 `--space-6`（24px），单列宽度均等
6. 错误提示在输入框下方 4px，颜色 `--status-danger`，字号 `--text-caption`
7. 表单底部按钮组右对齐，主按钮在最右，按钮间距 `--space-3`（12px）
8. 全宽输入框必须显式声明 `width: 100%`

#### 8.7.7 禁止行为

- 禁止字段下方堆叠超过一行的说明文字
- 禁止使用 placeholder 代替 label
- 禁止在同一表单里混用 sm / md / lg
- 禁止"保存"和"取消"用同样的 Primary 样式
- 禁止给输入框加 `box-shadow: inset ...` 内阴影伪 3D 效果
- 禁止用浏览器默认的 outline 显示 focus

### 8.8 浮层：抽屉 / Modal / Popover（强制规则）

中转站只允许三种浮层形态，每种用途明确，禁止混用。

| 形态 | 用途 | 典型场景 |
|------|------|---------|
| Drawer（右侧抽屉） | **主推**。详情查看、编辑、复杂表单 | 编辑用户、查看 Key 详情、配置渠道 |
| Modal（居中弹窗） | 不可逆操作的二次确认、关键提示 | 删除确认、警告提示、登出确认 |
| Bottom Sheet（底部抽屉） | 移动端等效抽屉，桌面端不推荐 | 移动端编辑、移动端筛选 |

**铁律**：
- 同一时刻只允许一个浮层。禁止抽屉里再开 modal 或抽屉，除非是必要的"二次确认"场景
- 浮层不允许嵌套超过 2 层
- 任何浮层都必须有遮罩层（backdrop），禁止无遮罩浮层

#### 8.8.1 共享规则（三种浮层共用）

**遮罩层（Backdrop）**
- 颜色：`rgba(20, 20, 28, 0.4)`（亮色）/ `rgba(0, 0, 0, 0.55)`（暗色），通过 `--backdrop-bg` token
- 点击遮罩：默认关闭浮层；表单类（有未保存数据）需二次确认
- ESC 键：同点击遮罩
- 出现动效：opacity 0 → 1，250ms ease-out
- 禁止使用 backdrop-filter: blur（性能不稳定，且玻璃质感与出版物理性气质冲突）

**容器圆角**
- Drawer：左侧（右抽屉）的两角圆角 `--radius-xl`（10px），其余 0
- Modal：四角全圆角 `--radius-xl`（10px）
- Bottom Sheet：顶部两角圆角 `--radius-xl`（10px），底部贴合屏幕

**容器背景与边框**
- 背景：`--bg-surface`
- 边框：无（与卡片不同，浮层靠阴影区分层级）
- 阴影：`--shadow-overlay`

**标题栏**
- 高度 64px
- 左侧标题：`--text-heading-sm`（19px），字重 600
- 右侧关闭按钮：Ghost icon button，16px X 图标
- 底部分割线：1px `--border-default`

**底部按钮区**
- 高度 72px（含上下 16px padding）
- 顶部分割线：1px `--border-default`
- 按钮右对齐，主按钮在最右
- 按钮 size 默认 md
- 按钮间距 `--space-3`（12px）

**内容区**
- padding 24px
- 自动滚动（overflow-y: auto），最大高度撑满浮层
- 滚动条：6px 宽，圆角 3px，颜色 `--text-tertiary`，hover 时变 `--text-secondary`

#### 8.8.2 Drawer 右侧抽屉（主推）

- 位置：固定右侧，从右侧滑入
- 宽度：sm 400px / md 560px / lg 720px / xl 880px
- 默认宽度 md
- 高度：100vh
- 进入动效：translateX(100%) → 0，250ms cubic-bezier(0.32, 0.72, 0, 1)（iOS 标准曲线）
- 退出动效：translateX(0) → 100%，200ms ease-in
- 遮罩同时淡入淡出

**Drawer 标题栏内可放面包屑或副标题**：
```
[关闭]  用户详情 / 张三              [保存] [取消]
```

#### 8.8.3 Modal 居中弹窗

- 位置：viewport 居中
- 宽度：sm 400px / md 480px / lg 640px
- 高度：自适应内容，最大不超过 viewport 高度 80%
- 进入动效：opacity 0 + scale(0.96) → opacity 1 + scale(1)，200ms cubic-bezier(0.32, 0.72, 0, 1)
- 退出动效：反向，150ms ease-in
- 默认尺寸 sm（仅二次确认）

**Modal 仅用于以下场景**：
- 删除/停用/重置等不可逆操作的确认
- 关键警告（账户异常、安全风险）
- 简短的输入（单字段，如重命名）

**禁止 Modal 用于**：
- 复杂表单（用 Drawer）
- 数据展示（用 Drawer 或独立页面）
- 任何可在抽屉中完成的编辑任务

#### 8.8.4 Bottom Sheet 底部抽屉

- 位置：固定底部，从底部滑入
- 宽度：100vw
- 高度：自适应内容，最大不超过 viewport 高度 90%
- 进入动效：translateY(100%) → 0，280ms cubic-bezier(0.32, 0.72, 0, 1)
- 顶部 24px 处加一个 36×4px 的 grab handle（颜色 `--text-tertiary`），暗示可拖动关闭
- 默认仅在 viewport 宽度 < 768px 时启用

#### 8.8.5 Popover 与 Tooltip（轻量浮层，不属于上述三类）

补充：极小浮层有独立规则，不算浮层主类。

**Popover**（点击触发的菜单/卡片）
- 背景 `--bg-surface`
- 圆角 `--radius-lg`（12px）
- 阴影 `--shadow-overlay`
- 边框 1px `--border-default`
- padding 12px
- 进入动效：opacity 0 + translateY(-4px) → opacity 1 + 0，150ms ease-out

**Tooltip**（hover 提示）
- 背景 `--bg-inverse`
- 文字 `--text-inverse`
- 字号 `--text-caption`
- 圆角 `--radius-md`
- padding 6px 10px
- 延迟出现 400ms，立即消失
- 不允许包含交互元素（链接、按钮）

### 8.9 图标系统（强制规则）

全站只允许使用一个图标库。任何"我这里只是用一下别的图标，别处用 Lucide"的想法都不允许。

#### 8.9.1 图标库选型（已定死）

**唯一允许的图标库**：[Lucide](https://lucide.dev/)

理由：
- Lucide 是 Feather Icons 的活跃 fork，描边风格统一，与本规范的克制审美一致
- 覆盖 1400+ 图标，足以应对中转站所有场景
- 多平台官方包（lucide-react / lucide-vue-next / lucide），与现代前端栈直接集成
- 单色描边，禁用填充图标的限制天然成立

**禁止**：
- 禁止引入 Heroicons / Font Awesome / Iconify / Tabler / Phosphor 等其他图标库
- 禁止从 Figma / 设计稿手动导出 SVG 单独使用（除非该图标 Lucide 没有，此时见 §8.9.5）
- 禁止使用 emoji 代替图标
- 禁止使用图标字体（Icon Font），统一使用 SVG 组件

#### 8.9.2 引入方式

按平台选用官方包：

| 平台 | 包名 | 引入示例 |
|------|------|---------|
| React | `lucide-react` | `import { Check, X, Search } from 'lucide-react'` |
| Vue | `lucide-vue-next` | `import { Check, X, Search } from 'lucide-vue-next'` |
| 原生 / 其他 | `lucide` | 见官方文档 |

**强制**：必须按需引入（tree-shaking），禁止 `import * as Icons from 'lucide-react'` 这种全量引入。

#### 8.9.3 图标尺寸枚举

只允许以下六档，禁止其他值：

| Token | Size | 用途 |
|-------|------|------|
| `--icon-xs` | 12px | 标签内、状态色点旁、micro 角标 |
| `--icon-sm` | 14px | sm 按钮内、表格行内 Link 按钮、面包屑分隔图标 |
| `--icon-md` | 16px | md 按钮内、Header 右侧图标按钮、表单 inline 图标 |
| `--icon-lg` | 18px | Sidebar 导航项、lg 按钮内 |
| `--icon-xl` | 20px | 卡片标题旁、模块图标 |
| `--icon-2xl` | 24px | Sidebar 顶部 logo、空状态占位插画图标 |

**容器场景映射**（codex 选尺寸时按此查）：

| 场景 | 用哪个 |
|------|-------|
| sm 按钮（高 32px） | 14px |
| md 按钮（高 40px） | 16px |
| lg 按钮（高 48px） | 18px |
| Header 图标按钮 | 16px |
| Header 关闭按钮（modal/drawer 顶部 X） | 16px |
| Sidebar 导航项左侧 | 18px |
| Sidebar logo | 24px |
| 输入框前缀/后缀图标 | 14px |
| 表格内 Link 按钮 | 14px |
| 卡片标题旁说明图标（i 信息提示） | 14px |
| 状态标签内色点（如果用图标代替） | 12px |
| 面包屑分隔（chevron） | 14px |
| Select 下拉箭头 | 14px |
| 空状态占位 | 24px（多次使用同一图标合并显示，详见 §11.5） |

#### 8.9.4 视觉规则

1. **颜色**：图标颜色统一通过 `color` 属性（Lucide SVG 使用 `currentColor`），跟随父级文字色。禁止单独给图标加 `color` 覆盖父级。
2. **描边粗细**：保持 Lucide 默认值 1.5px（`stroke-width="1.5"`），禁止修改为 1px、2px 或其他值。
3. **对齐**：图标必须与同行文字垂直居中。React/Vue 中通过 flex 居中实现，禁止用 `vertical-align: middle`。
4. **图标 + 文字间距**：按尺寸映射：
   - 14px 图标 → 间距 6px
   - 16px 图标 → 间距 8px
   - 18px 图标 → 间距 8px
   - 20px / 24px 图标 → 间距 12px

#### 8.9.5 图标缺失处理

如果 Lucide 没有需要的图标（极少见）：

1. 优先在 Lucide 已有图标里找语义最接近的替代（例如没有"中转"图标，可用 `ArrowRightLeft` 或 `Repeat`）
2. 实在没有合适的，提交 PR 时必须在描述里说明"Lucide 缺失，需自定义"，由维护者评估
3. 自定义图标必须遵守 Lucide 规范：24×24 viewBox、1.5px stroke、round line cap、round line join、currentColor
4. 自定义图标统一放在 `src/icons/custom/` 目录，文件名 kebab-case，组件名 PascalCase
5. 禁止"临时用一下"就近从其他库 copy SVG

#### 8.9.6 业务图标语义映射（强制）

为防止同一含义在不同页面用不同图标，定义业务语义到 Lucide 图标的映射。新增业务概念时先查这张表，没有的报维护者补。

| 业务含义 | Lucide 图标 |
|---------|------------|
| 用户 | `User` |
| 用户组 / 分组 | `Users` |
| API 密钥 | `Key` |
| 模型 | `Layers` |
| 渠道 | `Network` |
| 账号 | `Wallet`（含余额）/ `CircleUserRound`（用户账号） |
| 订阅 | `CreditCard` |
| 兑换码 | `Ticket` |
| 优惠码 | `BadgePercent` |
| 使用记录 / 日志 | `ScrollText` |
| 仪表盘 | `LayoutDashboard` |
| 运维监控 | `Activity` |
| IP 管理 | `Globe` |
| 公告 | `Megaphone` |
| 系统设置 | `Settings` |
| 通知 / 铃铛 | `Bell` |
| 搜索 | `Search` |
| 筛选 | `ListFilter` |
| 刷新 | `RefreshCw` |
| 添加 / 创建 | `Plus` |
| 编辑 | `Pencil`（注：不要用 `Edit`，已废弃） |
| 删除 | `Trash2`（注：不要用 `Trash`，视觉过简） |
| 复制 | `Copy` |
| 复制成功 | `Check`（用于复制按钮临时状态） |
| 显示密码/Key | `Eye` |
| 隐藏密码/Key | `EyeOff` |
| 展开 / 下拉 | `ChevronDown` |
| 收起 / 上 | `ChevronUp` |
| 返回 / 上一级 | `ChevronLeft` |
| 进入 / 下一级 | `ChevronRight` |
| 关闭 | `X` |
| 成功 | `CheckCircle2` |
| 警告 | `AlertTriangle` |
| 失败 / 错误 | `XCircle` |
| 信息 / 提示 | `Info` |
| 帮助 | `CircleHelp` |
| 外部链接 | `ExternalLink` |
| 下载 | `Download` |
| 上传 | `Upload` |
| 钱包 / 余额 | `Wallet` |
| 退出登录 | `LogOut` |
| 暗色模式 | `Moon` |
| 亮色模式 | `Sun` |
| Sidebar 收起 | `PanelLeftClose` |
| Sidebar 展开 | `PanelLeftOpen` |
| 涨 / 上升 | `TrendingUp` |
| 跌 / 下降 | `TrendingDown` |

#### 8.9.7 禁止行为

- 禁止使用 Lucide 之外的图标库
- 禁止修改 Lucide 默认 stroke-width
- 禁止给图标加颜色覆盖
- 禁止使用图标字体
- 禁止 emoji 代替图标
- 禁止表 §8.9.6 中已定义的语义用其他图标（如用 `Edit` 而非 `Pencil` 表示编辑）

### 8.10 Kicker 系统（强制规则）

Kicker 是 v2.0 编辑风的标志性元素：**小号、大写英文 / 等宽、加横线前缀的文字标签**，用于章节编号、面包屑、页面标题区上方的元数据。

参考形态：
```
—— USAGE TUTORIAL
—— 01 起步
—— OVERVIEW · 仪表盘
```

#### 8.10.1 Kicker 视觉规则

| 属性 | 值 |
|------|---|
| 字体 | `var(--font-mono)`（JetBrains Mono） |
| 字号 | `--text-kicker`（11px） |
| 字重 | 500 |
| 字色 | `--text-faint`（#9a9a9a） |
| 大小写 | 英文部分必须全大写；中文部分保持原样 |
| 字间距 | letter-spacing: 0.08em（增加呼吸感） |
| 前缀 | "—— "（两个全角破折号 + 空格），颜色同字色 |

**铁律**：
- Kicker 必须用等宽字体，禁止用 Inter 或衬线
- 英文部分必须大写，禁止驼峰或小写
- 必须有"—— "前缀，禁止使用其他装饰符（•、>、— 单破折号、|）
- 字号必须 11px，禁止 10、12、13
- 颜色必须用 `--text-faint`，禁止用 `--accent` 加色

#### 8.10.2 Kicker 应用场景

**必须使用 Kicker 的场景**：

1. **页面标题区上方**：每个一级页面的主标题上方必须有 kicker，提示页面类型
   ```
   —— OVERVIEW · 仪表盘
   本月消耗汇总          ← 衬线 28px 主标题
   ```

2. **章节大标题上方**：营销页和文档页每个大段落上方
   ```
   —— SECTION 02 · 功能特性
   为开发者打造          ← 衬线 44px
   ```

3. **卡片可选位置**：重要卡片可在标题上方加 kicker，但不强制
   ```
   —— THIS MONTH
   消耗汇总              ← card-title
   ```

**禁止使用 Kicker 的场景**：

- 按钮内
- 表格单元格内
- 表单 label
- 状态标签内
- 任何 ≤ caption (13px) 的小文字旁

#### 8.10.3 Kicker 与面包屑的关系

v2.0 中面包屑本身就用 kicker 风格，统一为出版调性。

面包屑规则更新（覆盖 §6.4）：

- 字体 `var(--font-mono)`
- 字号 11px（`--text-kicker`）
- 大小写：全大写
- 颜色：除最后一级外 `--text-faint`，最后一级 `--text-secondary`
- 分隔符：`·`（中点），左右各 8px 间距
- 前缀加"—— "（与 kicker 一致）

示例：
```
—— SETTINGS · GENERAL · EMAIL CONFIG
邮件配置                                ← 下方 28px 衬线主标题
```

#### 8.10.4 Kicker 样式参考实现

```css
.kicker {
  font-family: var(--font-mono);
  font-size: var(--text-kicker);   /* 11px */
  font-weight: 500;
  line-height: 1.4;
  color: var(--text-faint);
  letter-spacing: 0.08em;
  text-transform: uppercase;       /* 仅对英文有效，中文不受影响 */
}

/* 横线前缀通过 ::before 实现 */
.kicker::before {
  content: "—— ";
  color: inherit;
}
```

页面标题区组合：

```html
<header class="page-header">
  <span class="kicker">OVERVIEW · 仪表盘</span>
  <h1 class="page-title">本月消耗汇总</h1>
  <p class="page-subtitle">查看您本月的 API 调用、Token 消耗与费用明细</p>
</header>
```

```css
.page-header { margin-bottom: 32px; }
.page-header .kicker { display: block; margin-bottom: 12px; }
.page-title {
  font-family: var(--font-serif);
  font-size: var(--text-heading);   /* 28px */
  font-weight: 500;
  line-height: 1.2;
  color: var(--text-primary);
  margin: 0;
}
.page-subtitle {
  font-family: var(--font-sans);
  font-size: var(--text-body);
  color: var(--text-mute);
  margin: 8px 0 0;
  max-width: 60ch;
}
```

### 8.11 营销层落地页（强制规则）

v2.0 的落地页是出版风的最佳展示场。落地页与控制台共用同一套 token，但应用方式不同。

#### 8.11.1 落地页结构

```
┌────────────────────────────────────────┐
│  Top Nav（最简洁，64px 高，无装饰）        │
├────────────────────────────────────────┤
│                                          │
│  Hero（占首屏 80vh）                      │
│  ── BUILT FOR DEVELOPERS                 │  ← kicker
│                                          │
│  一站式 API 中转                          │  ← serif 88px
│  让 _AI 接入_ 变得简单                    │  ← serif 64px italic
│                                          │
│  描述文字（body-lg 18px，限宽 60ch）       │
│                                          │
│  [立即开始]  [查看文档]                    │  ← Ink + Secondary
│                                          │
├────────────────────────────────────────┤
│                                          │
│  Sections（每个 section 间距 120px）       │
│  每个 section 必须有 kicker + serif 大标题  │
│                                          │
└────────────────────────────────────────┘
```

#### 8.11.2 Hero 规则

| 属性 | 值 |
|------|---|
| 高度 | min-height: 80vh |
| 上下 padding | 120px |
| 左右 padding | 32px |
| 最大宽度 | 1024px（窄于后台主内容区，制造"读物"感） |
| 居中方式 | margin: 0 auto |
| 背景 | `--bg-page`（同全站底，禁止用图片或渐变） |
| Kicker | 必须有（如 BUILT FOR DEVELOPERS） |
| 主标题 | `--text-display-lg`（88px）serif 400，可含斜体短语 |
| 副标题 | `--text-display`（64px）serif 400，可斜体 |
| 描述 | `--text-body-lg`（18px）sans 400，颜色 `--text-secondary`，max-width 60ch |
| CTA 按钮 | 主 = Ink variant（黑底白字 lg），次 = Secondary lg |

#### 8.11.3 Section 规则

每个 section 之间间距 120px（`--gap-section-marketing`），section 内：

- Kicker 在最上方（必须）
- 标题 `--text-heading-lg`（44px）serif
- 描述限宽 60ch
- 视觉元素居中或两栏排版
- 禁止 section 内嵌套 section

#### 8.11.4 落地页禁止行为

- 禁止 hero 用图片或渐变背景
- 禁止用动效装饰文字（飞入、打字机等）
- 禁止使用 pill 按钮、阴影按钮、彩色按钮
- 禁止用 emoji 装饰章节
- 禁止使用 toast / loading 提示（落地页是静态读物，无动态状态）

---

## 9. 暗色模式实现规则

### 9.1 实现原则

1. 通过 `<html data-theme="light|dark">` 切换，禁止使用 `prefers-color-scheme` 自动判断（用户偏好优先）。
2. 默认值：未登录用户跟随系统；已登录用户读取用户设置。
3. 所有颜色必须通过 §2.2 的语义 token 引用，组件中**禁止**写：
   - 直接的十六进制色值或 rgb 值
   - `--palette-*` 系列（这是基础色板，仅给 token 定义使用）
   - `rgba()` 拼接的透明色（透明效果统一通过预定义 token）
4. 暗色模式的边框对比度比亮色更弱，不能简单反色。所有边框已在 §2.2 单独定义。
5. 暗色模式下图片、图标需要测试：纯色图标用 `currentColor` 跟随文字色；插画类图片如果在白底设计，需提供暗色版本或加 `--bg-surface` 容器包裹。

### 9.2 暗色模式串色问题排查清单（必读）

"切到暗色后某些字还是黑的"这类问题，源头都是组件里硬编码了颜色值。codex 在审 PR 时必须按以下清单 grep 检查：

```bash
# 1. 查找硬编码十六进制色值
grep -rE "#[0-9a-fA-F]{3,6}" src/ --include="*.{tsx,jsx,vue,css,scss,less}" \
  | grep -vE "(palette-|theme.css|globals.css)"

# 2. 查找硬编码 rgb/rgba
grep -rE "rgba?\([0-9]" src/ --include="*.{tsx,jsx,vue,css,scss,less}"

# 3. 查找 color: black / white / 等关键字
grep -rE "color:\s*(black|white|gray|grey)" src/

# 4. 查找内联 style 中的颜色
grep -rE "style=.*color" src/ --include="*.{tsx,jsx,vue}"
```

任一命令有输出，PR 不予通过。

### 9.3 暗色模式必测组件清单

每次 UI 变更，以下组件必须在 light 和 dark 两种模式下截图自检：

- [ ] 输入框（含 focus、disabled、error 三态）
- [ ] 下拉选择器（含展开后的菜单项 hover）
- [ ] 表格（含表头、行 hover、空状态、加载态）
- [ ] 卡片（含 L1/L2/L3 嵌套层级）
- [ ] modal/dialog（含遮罩层）
- [ ] 状态标签（九种状态全测）
- [ ] toast 提示（含 success/warn/danger 三色）
- [ ] 按钮（五种 variant × 三种 size，重点测 disabled）
- [ ] 图表（含 tooltip 和图例）

---

## 10. 排版规则补充

### 10.1 中英文混排

- 中文与紧邻的英文/数字之间**不加**空格（CSS 通过 `text-spacing-trim: space-all` 自动处理，但目前浏览器支持不完整，所以正文允许人工不加）。
- 标题中如果中英文连接，可手动加半角空格优化视觉，如 "中转站 API 文档"。
- 引号统一使用中文全角 `""''`，引文内嵌使用半角。
- 破折号使用全角 `——`，禁止使用半角 `--`、`—`、`–`。
- 省略号使用 `……`，禁止使用 `...`。

### 10.2 数字格式

见 §8.5。补充：
- 时间戳显示统一格式 `YYYY-MM-DD HH:mm:ss`，相对时间允许在 24 小时内使用（如"3 分钟前"），超过 24 小时强制绝对时间。
- 文件大小使用二进制单位（KiB / MiB / GiB），API 数据量使用十进制单位（KB / MB / GB）。
- 时长用 `1h 23m 45s` 格式，禁止用 `01:23:45`（避免与时间戳混淆）。

### 10.3 文案语气

- 按钮文字：动词开头，4 字以内优先。例：「创建密钥」「立即充值」「查看详情」。
- 错误提示：先说原因再说解决方法，避免"出错了，请重试"这类无信息文案。
- 空状态：用陈述句说明当前状态 + 主操作建议。

---

## 11. 信息密度守则（强制）

后台页面最大的失败模式是"什么都想给用户看"。本章定义一页能展示多少信息，超出即拆页。

### 11.1 单页信息上限

| 维度 | 上限 |
|------|------|
| 同一屏（首屏）的一级卡片数量 | ≤ 3 |
| 单个一级卡片内的 L2 子卡片数量 | ≤ 6 |
| 单张卡片内的表单字段数 | ≤ 12（超过必须分 tab 或分步骤） |
| 单个表格的列数 | ≤ 8（超过必须开启"列设置"由用户选） |
| 单页面 Primary 按钮数量 | ≤ 1（同一时刻只允许一个主操作） |
| 单页面同时存在的 modal 数量 | 1（禁止 modal 套 modal） |

### 11.2 信息分级原则

每页内容必须按"主信息 / 次信息 / 辅助信息"三层分级：

1. **主信息**：用户来这页就为了看这个。一屏内必须能看到，字号最大，颜色最深，占据视觉重心。
2. **次信息**：辅助理解主信息的内容。字号 `--text-body-sm`，颜色 `--text-secondary`。
3. **辅助信息**：可选的元数据（创建时间、ID 等）。字号 `--text-caption`，颜色 `--text-tertiary`，可折叠或 hover 显示。

**判断方法**：盖住屏幕一半，剩下的一半还能不能让用户判断当前页是做什么的。如果不能，主信息没立起来。

### 11.3 该删的内容

以下情况下的内容必须删除或折叠：

1. **重复信息**：同一数据在一页内出现两次。例如 header 显示余额，正文又显示一遍。
2. **永远不变的说明文字**：如"管理账户资料、登录绑定、安全验证和余额提醒。这里的设置只影响当前账户"——这种解释性长文必须折叠到 tooltip 或拆到独立帮助页。
3. **占位元数据**：值为 `-` 或 `N/A` 的字段，在卡片中应隐藏而非显示空值。
4. **未启用的功能入口**：禁用的、灰色的按钮如果用户长期无法激活，应隐藏不显示。
5. **超过两层的嵌套提示**：如果一个字段需要超过 1 行文字解释，说明命名有问题，重新命名而不是堆解释。

### 11.4 拆页 vs 折叠的判断

什么时候该拆页，什么时候该折叠：

- **拆页**：信息有独立的使用场景，用户进入后会停留较长时间（如"系统设置"里的"邮件配置"应该是独立子页面，不该和"通用设置"挤在一个 tab 切换里）
- **折叠**：信息是当前页的补充说明，用户偶尔需要看（如"账户余额"卡片下的"消费明细"链接）
- **tab 切换**：信息之间是平行关系，用户会频繁切换（如"通用 / 功能开关 / 安全 / 邮件"，但每个 tab 内必须满足 §11.1 上限）

### 11.5 仪表盘页特殊规则

仪表盘是后台首页，规则更严：

1. 首屏（1080p 不滚动）必须包含最关键的 3-5 个核心数字
2. 核心数字使用 `.metric-value` 类（衬线 Instrument Serif 44px 字重 400），颜色 `--text-primary` 或 `--accent`
3. 数字上方必须有 kicker 标签（如 `—— THIS MONTH`），呈现完整"出版数据卡片"形态
4. 图表区域允许有"暂无数据"占位，但必须只显示一次空状态图标，禁止每个图表卡片都重复显示同样的"暂无数据"插画——改用统一的"近 1 小时无数据，[切换时间范围]"提示
5. 错误提示（如"加载失败"）禁止用 toast 弹出超过 1 个，多个错误必须合并为"3 项加载失败 [查看详情]"
6. 不允许在仪表盘做任何写操作（删除、修改、创建）

---

## 12. 编辑出版守则（设计哲学）

本章是给 codex 的"为什么"。前面所有章节是"怎么做"，这一章解释做法背后的取舍标准——所有未明确的细节按本章原则补足。

参考标杆：Stripe / Vercel 早期文档、Werner Werkstatt 品牌指南、Are.na 编辑页面、Field Notes、It's Nice That、Frank Chimero 个人站、Robin Rendle 个人站。

### 12.1 四条核心原则

1. **印刷物大于界面**。视觉决策的依据是"这页放在一本独立刊物里会不会和谐"，而不是"现代 SaaS 后台通常长什么样"。米黄纸底、衬线大标题、等宽 kicker、细线分隔——这些是出版物的语言。看到自己想给元素加阴影、加渐变、加圆形大圆角，问一句"这会出现在一本独立刊物里吗"。
2. **理性大于装饰**。所有视觉效果只在服务功能时存在。能去掉的都去掉。卡片用 8px 小圆角不是因为"简洁好看"，是因为出版物里的边框就是直角或微圆角的，没有 20px 软圆角。
3. **统一优于多样**。同一含义只用一种表达。赤橙色只代表"可操作 / 强调"；衬线只用于标题；kicker 只用 mono 字体加横线前缀。看到第二种写法，问"为什么不能合并"。
4. **数字是一等公民**。仪表盘大数字用衬线（出版气质），表格内数字用无衬线（可读性）。无论哪种都必须 tabular-nums。这是 v2.0 唯一允许的"字体不一致"。

### 12.2 动效语言

动效的核心是 **timing function** 和 **持续时间** 的克制。出版物级别的动效不应该被察觉，只应被感知。

| 场景 | 持续时间 | 缓动函数 | 备注 |
|------|---------|---------|------|
| 颜色变化（hover/focus） | 150ms | `cubic-bezier(0.4, 0, 0.2, 1)` | 标准曲线 |
| 按下反馈 | 80ms | `cubic-bezier(0.4, 0, 0.2, 1)` | 比 hover 更快，触感清脆 |
| Popover/Tooltip 出现 | 150ms | `ease-out` | 弹出感 |
| Modal 出现 | 200ms | `cubic-bezier(0.32, 0.72, 0, 1)` | iOS 标准 |
| Drawer 滑入 | 250ms | `cubic-bezier(0.32, 0.72, 0, 1)` | 比 Modal 长，因为位移更大 |
| Bottom Sheet 滑入 | 280ms | `cubic-bezier(0.32, 0.72, 0, 1)` | 同上 |
| Backdrop 淡入 | 250ms | `ease-out` | 与浮层同步 |
| 退出动效 | = 进入的 60-80% | `ease-in` | 退出比进入快 |
| 数字滚动/数据更新 | 400ms | `cubic-bezier(0.4, 0, 0.2, 1)` | 仪表盘大数字变化 |

**禁止**：
- 禁止 `linear` 缓动（除非是 spinner 这类无限循环）
- 禁止 `ease`（这是默认值，过于平庸）
- 禁止使用超过 400ms 的过渡（用户会觉得卡）
- 禁止 bounce / elastic 弹性曲线（不符合出版物的理性气质）
- 禁止给所有元素加 `transition: all 0.3s`，必须明确指定属性

### 12.3 反馈语言

任何交互都必须有反馈，但反馈应该"刚好被感知"，而非"被注意"。

| 交互 | 反馈方式 |
|------|---------|
| hover 按钮 | 背景明度变化（150ms） |
| 按下按钮 | scale(0.97) + 背景再加深 |
| focus 输入框 | 边框变蓝 + 3px 发光环 |
| 提交成功 | toast 提示（2 秒自动消失） |
| 提交失败 | 输入框边框变红 + 下方红色错误文字 |
| 切换 tab/页面 | 内容区淡入（150ms） |
| 加载中 | 骨架屏（禁止 spinner 覆盖整个区域） |
| 列表项 hover | 背景 `--bg-subtle` |
| 列表项点击 | 短暂 scale(0.99) + 背景加深，然后导航 |

**禁止**：
- 禁止 toast 持续超过 4 秒
- 禁止同时出现多个 toast（合并为一条"3 项操作失败 [查看]"）
- 禁止用 alert() 或 confirm() 浏览器原生弹窗

### 12.4 留白语言

出版物的"气质"很大程度来自留白。

1. **元素与容器边界**：永远保持 padding，禁止贴边
2. **同类元素之间**：用 `--space-3`（12px）或 `--space-4`（16px）作为基础间距
3. **不同类元素之间**：用 `--space-6`（24px）或更大
4. **章节分隔**：用 `--gap-block`（24px）或 `--gap-section`（48px）
5. **不要用分割线代替留白**：能用空间区分就不要用线

### 12.5 颜色语言

1. **大面积只用中性色**。蓝色、绿色、红色仅用于强调，不用于装饰大块区域
2. **同一含义只用一种颜色**。蓝色只代表"可操作"，绿色只代表"成功"，红色只代表"危险"
3. **避免饱和度过高**。所有彩色都应该是"被压住"的，不刺眼
4. **暗色模式不是亮色反色**。每个颜色单独定义，需要单独的视觉校准

### 12.6 字体语言

1. **数字比文字重要**。大数字必须用 `tabular-nums`，必须给足字号
2. **标题不需要装饰**。不加渐变、不加阴影、不加任何特效
3. **行距宁多勿少**。除了表格密集场景，行高至少 1.5
4. **粗体克制使用**。除标题外，正文不超过 10% 的字加粗

### 12.7 图标语言

详细规则见 §8.9。设计哲学：

1. 全站只使用 Lucide 一个图标库，单色描边，1.5px stroke
2. 颜色用 `currentColor`，跟随父级文字色
3. 同一业务含义全站使用同一个图标（见 §8.9.6 映射表）
4. 禁止填充图标、彩色图标、emoji 代替图标
5. 6 档尺寸枚举（12/14/16/18/20/24px），禁止其他值

### 12.8 该避免的反编辑模式

明确列出常见的"非编辑出版风"做法，禁止采用：

- 渐变背景（按钮、卡片、hero）
- 拟物化图标（带阴影、高光的 3D 风格图标）
- 大圆角 + 重阴影（"卡片漂浮"效果）
- 鲜艳的"成就感"色块（紫色渐变、彩虹边框）
- 弹簧动画（spring/bounce）
- 角标装饰（彩色 NEW 标签、装饰性图形）
- 玻璃拟态（backdrop-filter: blur 的彩色玻璃效果）
- 霓虹色 / 高饱和度品牌色
- 过多 emoji（功能性 ✓ ✗ 之外的装饰 emoji）
- **pill 按钮（9999px 圆角）——v1.x 允许的 pill 在 v2.0 全部禁用**
- **背景纹理 / 噪点 / body::before 渐变**——出版品质来自字体和留白，不来自纹理

---

## 13. 完整 CSS 变量定义

将以下内容放到全局 CSS 入口（`globals.css` 或等价位置）。

```css
:root {
  /* ---------- 基础色板（编辑出版色调）---------- */
  --palette-paper: #fafaf7;          /* 米黄纸底 */
  --palette-paper-warm: #f5f3ec;     /* 温暖纸色 */
  --palette-paper-card: #ffffff;     /* 卡片白 */
  --palette-line: #e5e3dc;           /* 米黄调灰边框 */
  --palette-line-soft: #eeece5;
  --palette-ink: #1a1a1a;            /* 主文字 */
  --palette-ink-soft: #3a3a3a;
  --palette-ink-mute: #6b6b6b;
  --palette-ink-faint: #9a9a9a;
  --palette-accent: #c4471a;         /* 赤橙陶器红 */
  --palette-accent-hover: #a73c16;
  --palette-accent-soft: #e8d5cc;
  --palette-accent-wash: #fef7f3;
  --palette-success: #4a7c3c;        /* 萤火虫绿 */
  --palette-success-soft: #e8efe2;
  --palette-warn: #b8851f;           /* 琴黄 */
  --palette-warn-soft: #f5ebd2;
  --palette-danger: #a73c2e;         /* 深红 */
  --palette-danger-soft: #f3dcd6;
  --palette-code-bg: #1c1c1e;
  --palette-code-text: #e8e6df;
  --palette-dark-page: #1c1b17;
  --palette-dark-surface: #252420;
  --palette-dark-line: #3a3833;
  --palette-dark-text: #e8e6df;

  /* ---------- 字体 ---------- */
  --font-serif: 'Instrument Serif', 'Source Han Serif SC', 'Songti SC', 'Noto Serif SC', Georgia, serif;
  --font-sans-en: 'Inter', ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-sans-zh: 'Noto Sans SC', 'PingFang SC', 'HarmonyOS Sans SC', 'Source Han Sans SC', 'Microsoft YaHei', sans-serif;
  --font-sans: var(--font-sans-en), var(--font-sans-zh);
  --font-mono: 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;
  --font-base: var(--font-sans);

  /* ---------- 字号 ---------- */
  --text-display-lg: 88px;  --leading-display-lg: 1.0;
  --text-display: 64px;     --leading-display: 1.05;
  --text-heading-lg: 44px;  --leading-heading-lg: 1.1;
  --text-heading: 28px;     --leading-heading: 1.2;
  --text-heading-sm: 20px;  --leading-heading-sm: 1.3;
  --text-body-lg: 18px;     --leading-body-lg: 1.6;
  --text-body: 15px;        --leading-body: 1.6;
  --text-body-sm: 14px;     --leading-body-sm: 1.55;
  --text-caption: 13px;     --leading-caption: 1.5;
  --text-micro: 12px;       --leading-micro: 1.4;
  --text-kicker: 11px;      --leading-kicker: 1.4;

  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;

  /* ---------- 间距 ---------- */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-7: 28px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-14: 56px;
  --space-16: 64px;
  --space-20: 80px;
  --space-30: 120px;       /* 营销页 section 间距 */

  /* ---------- 圆角（出版风小圆角）---------- */
  --radius-xs: 2px;
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;        /* 所有卡片 */
  --radius-xl: 10px;       /* Drawer/Modal */
  --radius-full: 9999px;   /* 仅头像/色点圆形 */

  /* ---------- 图表 ---------- */
  --chart-1: #c4471a;
  --chart-2: #6b6b6b;
  --chart-3: #4a7c3c;
  --chart-4: #b8851f;
  --chart-5: #7c5cd0;
  --chart-6: #a73c2e;

  /* ---------- 布局 ---------- */
  --page-max-width: 1024px;       /* 营销页（窄于后台，呈"读物"感） */
  --console-max-width: 1440px;    /* 后台 */

  /* ---------- 全局布局尺寸 ---------- */
  --layout-header-height: 64px;
  --layout-sidebar-width: 240px;
  --layout-sidebar-collapsed-width: 64px;

  /* ---------- z-index 层级（强制枚举）---------- */
  --z-base: 0;
  --z-sidebar: 40;
  --z-header: 50;
  --z-dropdown: 100;
  --z-backdrop: 900;
  --z-drawer: 950;
  --z-modal: 1000;
  --z-toast: 1100;
  --z-tooltip: 1200;

  /* ---------- 图标尺寸（Lucide）---------- */
  --icon-xs: 12px;
  --icon-sm: 14px;
  --icon-md: 16px;
  --icon-lg: 18px;
  --icon-xl: 20px;
  --icon-2xl: 24px;

  /* ---------- 动效曲线 ---------- */
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-ios: cubic-bezier(0.32, 0.72, 0, 1);
  --duration-fast: 80ms;
  --duration-base: 150ms;
  --duration-modal: 200ms;
  --duration-drawer: 250ms;
  --duration-sheet: 280ms;
}

/* ---------- Light 主题（默认）---------- */
:root,
[data-theme='light'] {
  --bg-page: var(--palette-paper);              /* #fafaf7 米黄纸底 */
  --bg-surface: var(--palette-paper-card);      /* #ffffff 卡片纯白 */
  --bg-surface-alt: var(--palette-paper-warm);  /* #f5f3ec 温暖纸色 */
  --bg-subtle: var(--palette-line-soft);        /* #eeece5 弱底 */
  --bg-inverse: var(--palette-ink);

  --text-primary: var(--palette-ink);
  --text-secondary: var(--palette-ink-soft);
  --text-mute: var(--palette-ink-mute);
  --text-faint: var(--palette-ink-faint);
  --text-inverse: var(--palette-paper);
  --text-link: var(--palette-accent);

  --border-default: var(--palette-line);
  --border-soft: var(--palette-line-soft);
  --border-strong: #c8c5b8;
  --border-focus: var(--palette-accent);

  --accent: var(--palette-accent);
  --accent-hover: var(--palette-accent-hover);
  --accent-soft: var(--palette-accent-soft);
  --accent-wash: var(--palette-accent-wash);

  --status-success: var(--palette-success);
  --status-success-soft: var(--palette-success-soft);
  --status-warn: var(--palette-warn);
  --status-warn-soft: var(--palette-warn-soft);
  --status-danger: var(--palette-danger);
  --status-danger-soft: var(--palette-danger-soft);
  --status-neutral: var(--palette-ink-mute);
  --status-neutral-soft: var(--palette-line-soft);

  --chart-grid: var(--border-default);
  --chart-axis: var(--text-faint);

  --shadow-overlay: 0 8px 32px rgba(26, 26, 26, 0.08);

  /* 输入框（米黄底色调） */
  --input-bg: #f5f3ec;
  --input-bg-hover: #eeece5;

  /* focus 发光环（赤橙半透明） */
  --focus-ring: rgba(196, 71, 26, 0.28);

  /* 浮层遮罩 */
  --backdrop-bg: rgba(26, 26, 26, 0.45);
}

/* ---------- Dark 主题 ---------- */
[data-theme='dark'] {
  --bg-page: var(--palette-dark-page);          /* #1c1b17 暖黑 */
  --bg-surface: var(--palette-dark-surface);    /* #252420 */
  --bg-surface-alt: #2a2925;
  --bg-subtle: #312f2a;
  --bg-inverse: var(--palette-dark-text);

  --text-primary: var(--palette-dark-text);     /* #e8e6df */
  --text-secondary: #c8c5be;
  --text-mute: #9a978f;
  --text-faint: #76746d;
  --text-inverse: var(--palette-ink);
  --text-link: #d96941;

  --border-default: var(--palette-dark-line);   /* #3a3833 */
  --border-soft: #2f2d29;
  --border-strong: #4a4842;
  --border-focus: #d96941;

  --accent: #d96941;
  --accent-hover: #bf5731;
  --accent-soft: #4a2a1f;
  --accent-wash: #2a1f1a;

  --status-success: #6fa052;
  --status-success-soft: #2a3a22;
  --status-warn: #d4a23a;
  --status-warn-soft: #3a2f1a;
  --status-danger: #c95c4a;
  --status-danger-soft: #3a1f1a;
  --status-neutral: #9a978f;
  --status-neutral-soft: #312f2a;

  --chart-grid: var(--border-default);
  --chart-axis: var(--text-faint);

  --shadow-overlay: 0 8px 32px rgba(0, 0, 0, 0.5);

  --input-bg: #2a2925;
  --input-bg-hover: #312f2a;

  --focus-ring: rgba(217, 105, 65, 0.35);

  --backdrop-bg: rgba(0, 0, 0, 0.6);
}

/* ---------- 密度模式 ---------- */
[data-density='comfortable'] {
  --gap-section: 80px;
  --gap-block: 28px;
  --gap-card: 20px;
  --gap-row: 16px;
  --gap-inline: 8px;
  --padding-page-x: 32px;
  --padding-card: 28px;
  --padding-cell: 16px;
}

[data-density='compact'] {
  --gap-section: 48px;
  --gap-block: 20px;
  --gap-card: 16px;
  --gap-row: 12px;
  --gap-inline: 8px;
  --padding-page-x: 24px;
  --padding-card: 20px;
  --padding-cell: 12px;
}

/* 默认密度（控制台） */
:root {
  --gap-section: 80px;
  --gap-block: 28px;
  --gap-card: 20px;
  --gap-row: 16px;
  --gap-inline: 8px;
  --padding-page-x: 32px;
  --padding-card: 28px;
  --padding-cell: 16px;
}

/* ---------- 全局基础样式 ---------- */
html, body {
  background: var(--bg-page);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: var(--text-body);
  line-height: var(--leading-body);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* 数字默认等宽 */
.num, [data-type='number'], td.num {
  font-variant-numeric: tabular-nums;
}

/* 代码字体 */
code, pre, .mono {
  font-family: var(--font-mono);
}

/* 全局移除默认 outline，仅 :focus-visible 显示发光环 */
*:focus { outline: none; }
*:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--focus-ring);
}

/* ---------- 卡片基础类（唯一允许的卡片来源）---------- */
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);   /* 8px */
  padding: 28px;
}
.card--sm { padding: 20px; }
.card--lg { padding: 40px; }
.card--accent {
  background: var(--accent-wash);
  border-color: var(--accent-soft);
}

.card__title {
  font-family: var(--font-serif);
  font-size: var(--text-heading);
  font-weight: 500;
  line-height: 1.2;
  color: var(--text-primary);
  margin: 0 0 16px;
}
.card--sm .card__title {
  font-family: var(--font-sans);
  font-size: var(--text-heading-sm);
}

/* ---------- Kicker 类 ---------- */
.kicker {
  font-family: var(--font-mono);
  font-size: var(--text-kicker);
  font-weight: 500;
  line-height: var(--leading-kicker);
  color: var(--text-faint);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.kicker::before {
  content: "—— ";
  color: inherit;
}

/* ---------- 页面标题区 ---------- */
.page-header { margin-bottom: 32px; }
.page-header .kicker { display: block; margin-bottom: 12px; }
.page-title {
  font-family: var(--font-serif);
  font-size: var(--text-heading);
  font-weight: 500;
  line-height: 1.2;
  color: var(--text-primary);
  margin: 0;
}
.page-subtitle {
  font-family: var(--font-sans);
  font-size: var(--text-body);
  color: var(--text-mute);
  margin: 8px 0 0;
  max-width: 60ch;
}

/* ---------- 输入框基础类 ---------- */
.input {
  background: var(--input-bg);
  border: 1px solid transparent;
  color: var(--text-primary);
  border-radius: var(--radius-md);     /* 6px */
  font-family: var(--font-sans);
  transition:
    background-color var(--duration-base) var(--ease-standard),
    border-color var(--duration-base) var(--ease-standard),
    box-shadow var(--duration-base) var(--ease-standard);
}
.input:hover:not(:disabled):not(:focus) { background: var(--input-bg-hover); }
.input:focus {
  background: var(--bg-surface);
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px var(--focus-ring);
}

/* ---------- 按钮基础类 ---------- */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-family: var(--font-sans);
  font-weight: 500;
  border: 1px solid transparent;
  border-radius: var(--radius-md);     /* 6px */
  cursor: pointer;
  user-select: none;
  transition:
    background-color var(--duration-base) var(--ease-standard),
    border-color var(--duration-base) var(--ease-standard),
    color var(--duration-base) var(--ease-standard),
    box-shadow var(--duration-base) var(--ease-standard),
    transform var(--duration-fast) var(--ease-standard);
}
.btn:active:not(:disabled) { transform: scale(0.97); }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ---------- 表格表头（kicker 风格）---------- */
.table thead th {
  font-family: var(--font-mono);
  font-size: var(--text-kicker);
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-faint);
  background: var(--bg-surface-alt);
  text-align: left;
  padding: 12px 16px;
}

/* ---------- 仪表盘大数字（衬线）---------- */
.metric-value {
  font-family: var(--font-serif);
  font-size: var(--text-heading-lg);    /* 44px */
  font-weight: 400;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}
.metric-value--accent { color: var(--accent); }
```

---

## 14. Tailwind v4 配置

如果项目使用 Tailwind v4，在 `app.css` 增加 `@theme` 块：

```css
@theme {
  --color-bg-page: var(--bg-page);
  --color-bg-surface: var(--bg-surface);
  --color-bg-surface-alt: var(--bg-surface-alt);
  --color-bg-subtle: var(--bg-subtle);
  --color-input-bg: var(--input-bg);
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-mute: var(--text-mute);
  --color-text-faint: var(--text-faint);
  --color-text-link: var(--text-link);
  --color-border-default: var(--border-default);
  --color-border-soft: var(--border-soft);
  --color-border-strong: var(--border-strong);
  --color-border-focus: var(--border-focus);
  --color-accent: var(--accent);
  --color-accent-soft: var(--accent-soft);
  --color-accent-wash: var(--accent-wash);
  --color-success: var(--status-success);
  --color-warn: var(--status-warn);
  --color-danger: var(--status-danger);

  --font-serif: var(--font-serif);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);

  --radius-xs: 2px;
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 10px;
  --radius-full: 9999px;

  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-6: 24px;
  --spacing-7: 28px;
  --spacing-8: 32px;
  --spacing-12: 48px;
  --spacing-20: 80px;
  --spacing-30: 120px;

  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-ios: cubic-bezier(0.32, 0.72, 0, 1);
}
```

之后使用 `bg-bg-surface`、`text-text-primary`、`border-border-default` 即可自动响应主题切换。

衬线标题使用 `font-serif` 类（Tailwind 默认有），等宽用 `font-mono`，正文默认 `font-sans`。

---

## 15. 给 codex 的工作流约束

每次接到 UI 任务时，按以下顺序操作：

1. **确认页面归属**：营销层还是控制台层？写在 PR 描述的第一行。
2. **检查依赖**：是否引入了规范外的字体、组件库、图标库？如有，必须先说明理由并等待确认。
3. **token 检查**：grep 你写的代码，确保没有出现 `#`（除注释外）、`px`（除 `1px` 边框外）这类直接值。
4. **状态测试**：每个新增交互元素，在亮色 + 暗色、comfortable + compact 四种组合下截图自检。
5. **数字检查**：所有展示金额、Token、百分比、用量的位置，确认应用了 `tabular-nums` 并符合 §8.5。
6. **空状态、加载态、错误态**：三种态必须都实现，缺一即视为未完成。

PR 必须附带：
- 修改前后截图（至少 light + dark 两套）
- 一句话说明本次改动属于哪个层、改了什么 token、改了什么组件
- 如违反任何 §0.1/§0.2 的硬性规则，必须在 PR 描述里写明原因并 @ 维护者

---

## 16. 版本与维护

- 当前版本：v2.0
- 维护原则：本文件是 single source of truth。代码与规范冲突时，以规范为准；规范有遗漏时先补规范再写代码。
- 修改本文件需要至少一位维护者 review，并在文件末尾追加变更日志。

### 变更日志

- **v2.0**（当前版本）：设计哲学根本转向——**从 iOS 后台风切换到编辑出版风**。本版本与 v1.x 不向后兼容，删除全部 v1.0–v1.5 历史版本。
  - **§1 设计原则重写**：四条核心原则全部基于"编辑出版风"重写，标杆参考 Stripe / Vercel / Werner Werkstatt / Are.na / Field Notes
  - **§2 颜色系统全部替换**：删除蓝色/灰色冷调，换为米黄纸底 `#fafaf7` + 赤橙陶器 `#c4471a` + 暖黑 `#1c1b17`。三种状态色（绿/黄/红）保留但全部去饱和
  - **§3 字体系统全部替换**：删除 Sen，引入三套分工字体——Instrument Serif（标题）+ Inter + Noto Sans SC（正文）+ JetBrains Mono（kicker + 元数据）。字号梯度全部放大，display-lg 从 56px 升到 88px
  - **§7 圆角全部缩小**：卡片 20px → 8px，按钮 8px → 6px，删除 `--radius-card` 专属变量。删除 pill 9999px 按钮形态
  - **§8.1 按钮**：保留 6 态交互，颜色改赤橙，新增 Ink variant（黑底白字）给营销层 hero CTA
  - **§8.2 卡片**：8px 小圆角统一，md/lg 卡片标题改用衬线 Instrument Serif，新增 `card--accent` 强调卡片变体（最浅赤橙底）
  - **§8.3 表格**：表头改 kicker 风格（mono 字体、11px、大写、加横线前缀），背景换为温暖纸色 `#f5f3ec`
  - **§8.5 数字字体规则**：仪表盘大数字用衬线（出版气质），表格内数字保留无衬线（可读性）
  - **§8.7 输入框**：保留低对比度填充风格（零边框灰底 + focus 变白底），但 input-bg 改为米黄温暖纸色 `#f5f3ec`
  - **§8.10 新增 Kicker 系统**：定义编辑风必备的标志性元素——mono 字体 11px 大写 + "—— "横线前缀，应用于面包屑、页面标题区、章节大标题
  - **§8.11 新增营销层落地页章节**：Hero 80vh 高、限宽 1024px、衬线大标题 + Kicker + Ink CTA、Section 间距 120px
  - **§12 改为"编辑出版守则"**：核心原则改为印刷物大于界面、理性大于装饰、统一优于多样
  - **§13 CSS 变量完全重写**：所有 token 替换为编辑风色板和尺寸，新增 `.kicker` / `.page-header` / `.metric-value` 等出版风专属类
  - **保留 v1.x 的架构性遗产**：暗色模式机制、按钮 6 态交互、表格规则、状态标签九种状态、tabular-nums、信息密度守则、全局布局（Sidebar/Header）、Lucide 图标系统、z-index 枚举——这些是与设计哲学解耦的工程规范，全部保留
