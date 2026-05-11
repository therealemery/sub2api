import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const baselinePath = path.join(rootDir, 'checks', 'ui-audit-baseline.json');
const updateBaseline = process.argv.includes('--update-baseline');

const scanTargets = [
  path.join(rootDir, 'index.html'),
  path.join(rootDir, 'src')
];

const fileExtensions = new Set(['.vue', '.ts', '.tsx', '.js', '.jsx', '.css', '.html']);
const skippedDirs = new Set(['node_modules', 'dist', 'coverage', '.vite']);

const rules = [
  {
    id: 'raw-hex-color',
    message: '不要在组件或页面里新增硬编码色值；颜色应进入设计 token 或 Tailwind 主题。',
    pattern: /#[0-9a-fA-F]{3,8}\b/g,
    allowFile: (relativePath) =>
      relativePath === 'src/style.css' ||
      relativePath.startsWith('src/styles/') ||
      relativePath === 'src/assets/styles.css'
  },
  {
    id: 'legacy-blue-utility',
    message: '不要新增旧蓝色 Tailwind 工具类；主交互统一使用 primary/token。',
    pattern: /\b(?:bg|text|border|ring|from|to|via|shadow)-(?:blue|sky|indigo)-\d{2,3}(?:\/\d+)?\b/g
  },
  {
    id: 'arbitrary-visual-utility',
    message: '不要新增随意视觉值；圆角、颜色、阴影应使用统一 token。',
    pattern: /\b(?:bg|text|border|ring|rounded|shadow)-\[[^\]]+\]/g
  },
  {
    id: 'heavy-shadow',
    message: '不要新增过重阴影；卡片、弹窗、浮层应使用统一阴影层级。',
    pattern: /\bshadow-(?:xl|2xl)\b/g
  },
  {
    id: 'inline-style-attribute',
    message: '不要新增模板内联 style；视觉规则应进入组件 class 或共享样式。',
    pattern: /\sstyle\s*=\s*["']/g,
    allowFile: (relativePath) => relativePath.endsWith('.ts') || relativePath.endsWith('.js')
  }
];

function toRelative(filePath) {
  return path.relative(rootDir, filePath).replace(/\\/g, '/');
}

function collectFiles(target) {
  if (!existsSync(target)) {
    return [];
  }

  const statFiles = [];
  const stack = [target];

  while (stack.length > 0) {
    const current = stack.pop();
    const relative = path.basename(current);

    if (skippedDirs.has(relative)) {
      continue;
    }

    const entries = readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!skippedDirs.has(entry.name)) {
          stack.push(fullPath);
        }
        continue;
      }

      if (entry.isFile() && fileExtensions.has(path.extname(entry.name))) {
        statFiles.push(fullPath);
      }
    }
  }

  return statFiles;
}

function normalizeLine(line) {
  return line.trim().replace(/\s+/g, ' ');
}

function addViolation(map, violation) {
  const key = `${violation.ruleId}|${violation.file}|${violation.lineText}`;
  map.set(key, {
    ...violation,
    count: (map.get(key)?.count ?? 0) + 1
  });
}

function scan() {
  const files = scanTargets.flatMap((target) => {
    if (!existsSync(target)) {
      return [];
    }

    const relative = toRelative(target);
    if (fileExtensions.has(path.extname(target))) {
      return [target];
    }

    if (relative === 'src' || relative === '.') {
      return collectFiles(target);
    }

    return [];
  });

  const violations = new Map();

  for (const file of files) {
    const relativePath = toRelative(file);
    const content = readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      for (const rule of rules) {
        if (rule.allowFile?.(relativePath)) {
          continue;
        }

        const matches = line.match(rule.pattern);
        if (!matches) {
          continue;
        }

        for (const match of matches) {
          addViolation(violations, {
            ruleId: rule.id,
            message: rule.message,
            file: relativePath,
            line: index + 1,
            match,
            lineText: normalizeLine(line)
          });
        }
      }
    });
  }

  return Object.fromEntries([...violations.entries()].sort(([left], [right]) => left.localeCompare(right)));
}

function readBaseline() {
  if (!existsSync(baselinePath)) {
    return {};
  }

  return JSON.parse(readFileSync(baselinePath, 'utf8'));
}

function writeBaseline(violations) {
  writeFileSync(
    baselinePath,
    `${JSON.stringify(
      {
        description:
          'UI audit baseline. Do not edit by hand. Run npm run ui:audit:update only after intentionally cleaning or accepting design-system debt.',
        generatedAt: new Date().toISOString(),
        violations
      },
      null,
      2
    )}\n`
  );
}

const currentViolations = scan();

if (updateBaseline) {
  writeBaseline(currentViolations);
  console.log(`UI audit baseline updated: ${Object.keys(currentViolations).length} known signatures.`);
  process.exit(0);
}

const baseline = readBaseline();
const allowedViolations = baseline.violations ?? {};
const newViolations = [];

for (const [signature, violation] of Object.entries(currentViolations)) {
  const allowedCount = allowedViolations[signature]?.count ?? 0;
  if (violation.count > allowedCount) {
    newViolations.push({
      ...violation,
      added: violation.count - allowedCount
    });
  }
}

if (newViolations.length > 0) {
  console.error('\nUI audit failed. New design-system violations were found:\n');
  for (const violation of newViolations.slice(0, 40)) {
    console.error(
      `- ${violation.ruleId} x${violation.added}: ${violation.file}:${violation.line} (${violation.match})`
    );
    console.error(`  ${violation.message}`);
    console.error(`  ${violation.lineText}`);
  }

  if (newViolations.length > 40) {
    console.error(`\n...and ${newViolations.length - 40} more.`);
  }

  console.error('\nUse existing tokens/components, or intentionally update the baseline with npm run ui:audit:update.');
  process.exit(1);
}

console.log(`UI audit passed. ${Object.keys(currentViolations).length} known signatures, no new violations.`);
