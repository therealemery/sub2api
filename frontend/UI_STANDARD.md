# OwnAPI UI 标准执行规则

这份文件用于约束后续前端改动，目标是让页面长期保持同一套视觉语言，而不是靠人工记忆。

## 必须遵守

- 页面结构按 `Page -> Section -> Container -> Component` 组织。
- 页面背景、主卡片、卡片内部块必须有清楚层级。
- 颜色使用 `tailwind.config.js` 和 `src/style.css` 中的 token，不在页面组件里新增硬编码色值。
- 主操作使用 `.btn-primary` 或 `primary` 色系；普通操作使用次按钮、文字按钮或图标按钮。
- 金额、收益、余额统一使用绿色状态色。
- 圆角、阴影、hover、focus、disabled 状态使用已有组件类，不写随意值。
- 移动端必须无横向滚动、无遮挡、无文字溢出。

## 禁止新增

- 组件或页面中的硬编码颜色，例如 `#1677ff`。
- 旧蓝色工具类，例如 `bg-blue-*`、`text-blue-*`、`border-blue-*`。
- 随意视觉工具类，例如 `bg-[#...]`、`rounded-[...]`、`shadow-[...]`。
- 过重阴影，例如 `shadow-xl`、`shadow-2xl`。
- 模板内联 `style="..."`。

## 强制检查

本项目新增了 UI 检查命令：

```bash
npm run ui:audit
```

它会和 `checks/ui-audit-baseline.json` 中的历史基线对比。历史问题暂时不阻塞，但新增违反 UI 标准的写法会让检查失败。

只有在设计负责人确认接受新的视觉债务时，才允许更新基线：

```bash
npm run ui:audit:update
```

更新基线必须在提交说明中解释原因。
