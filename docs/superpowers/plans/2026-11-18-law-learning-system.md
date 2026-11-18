# 法径 · 中国法律主题学习系统 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建成一个按生活主题学习中国法律、带场景化阅读与 FSRS 复习的本地优先 Web 应用，所有法律结论可回溯到法条原文。

**Architecture:** 纯静态 React SPA：构建期内容校验 + 法条引用校验，运行期从 MDX/JSON 注册内容；学习进度、笔记、收藏存 IndexedDB；复习调度用 ts-fsrs；无后端、无 PWA。

**Tech Stack:** React 19、Vite、TypeScript（strict）、Tailwind CSS 4、React Router 7、Zod、Dexie、MiniSearch、ts-fsrs 6、Vitest、Testing Library、Playwright。

**Spec:** `docs/superpowers/specs/2026-11-18-law-learning-system-design.md`

## Global Constraints

- TypeScript strict；所有类型必须显式，禁止 `any`（测试断言除外）。
- 中文界面；面向电脑使用，手机只保证可读。
- 纯静态、无后端；个人数据只存 IndexedDB，可导出/导入 JSON。
- 不做 PWA / Service Worker；字体与静态资源内置，不依赖外网 CDN。
- 所有法律结论必须有 `ArticleRef` 支撑；无法条支撑的操作步骤必须放在 `Callout type="tip"` 并标为「实务提示」。
- 内容写作保守：以法条原文的白话转述为主，不作绝对结果预测。
- 发布构建要求所有内容 `reviewStatus: 'checked'`；开发构建允许 `draft` 并警告。
- v1 三个主题：`contracts`（合同）、`marriage`（婚姻）、`labor`（劳动）。
- 不做考试、判分、排行榜、刷题。
- v1 不做 AI。

## 实现说明（对设计文档的实现级偏离）

1. 设计文档写「构建时生成搜索索引」；因内容量小（< 2000 条），本计划改为**首次加载时在浏览器构建索引**，避免索引与内容不同步。用户可见行为不变。
2. 设计文档写 shadcn/ui；本计划不使用 shadcn CLI，而是按 shadcn 的「组件源码复制进仓库」方式，自建 `src/components/ui` 基础组件（Button/Card/Badge/Progress/Dialog 等），只按需引入 Radix Dialog。避免 CLI 交互与版本漂移。
3. 消费者权益保护法未收录于 just-laws；v1 先用电子商务法 + 民法典合同编覆盖网购场景，后续需要时从 flk.npc.gov.cn 手工补入。

## Review Focus

以下是最容易伤到使用者的五类输入/条件，各自在对应任务的测试中固定：

1. **内容引用的法条不存在或原文被改写** → 构建必须失败并指出文件与条号。（Task 5）
2. **第一次打开、IndexedDB 为空或被清空** → 首页/主题页/复习页显示空状态，不崩溃。（Task 10、Task 15）
3. **知识点从未评过分（无 FSRS 卡片）时点击自评** → 正确创建卡片并排期，不抛错。（Task 14）
4. **刷新或重启后进度、到期时间、笔记丢失** → Dexie 持久化与重新读取测试。（Task 9、Task 15）
5. **窄屏 360px 下横向溢出或关键按钮不可见** → 响应式检查。（Task 22、Task 23）

---

### Task 1: 工程脚手架与测试环境

**Files:**
- Create: `package.json`、`tsconfig.json`、`tsconfig.app.json`、`tsconfig.node.json`、`vite.config.ts`、`index.html`、`src/main.tsx`、`src/App.tsx`、`src/index.css`、`src/types/mdx.d.ts`、`tests/setup.ts`、`.gitignore`、`.prettierrc`、`eslint.config.js`、`scripts/validate-content.ts`（占位）
- Test: `tests/app/smoke.test.tsx`

**Interfaces:**
- Produces: `App` 默认导出；Vitest 可运行；路径别名 `@/* -> src/*`。

- [ ] **Step 1: 写失败的冒烟测试**

```tsx
// tests/app/smoke.test.tsx
import { render, screen } from '@testing-library/react';
import App from '../../src/App';

test('显示应用名', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: '法径' })).toBeInTheDocument();
});
```

- [ ] **Step 2: 创建 `package.json` 并安装依赖**

dependencies：`react@^19`、`react-dom@^19`、`react-router-dom@^7`、`zod@^4`、`dexie@^4`、`dexie-react-hooks@^1`、`minisearch@^7`、`ts-fsrs@^6`、`clsx`、`tailwind-merge`、`@radix-ui/react-dialog`、`@radix-ui/react-collapsible`。

devDependencies：`typescript`、`vite`、`@vitejs/plugin-react`、`@types/react`、`@types/react-dom`、`tailwindcss@^4`、`@tailwindcss/vite`、`vitest`、`jsdom`、`@testing-library/react`、`@testing-library/jest-dom`、`@testing-library/user-event`、`fake-indexeddb`、`tsx`、`@mdx-js/rollup`、`@mdx-js/mdx`、`remark-frontmatter`、`remark-mdx-frontmatter`、`unified`、`remark-parse`、`remark-mdx`、`unist-util-visit`、`yaml`、`gray-matter`、`eslint`、`typescript-eslint`、`eslint-plugin-react-hooks`、`prettier`、`@playwright/test`。

scripts：

```json
{
  "dev": "vite",
  "predev": "npm run content:validate",
  "build": "tsc -b && vite build",
  "prebuild": "npm run content:validate",
  "build:release": "npm run content:validate -- --strict && tsc -b && vite build",
  "content:validate": "tsx scripts/validate-content.ts",
  "content:import": "tsx scripts/import-laws.ts",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "lint": "eslint .",
  "e2e": "playwright test"
}
```

运行：`npm install`

- [ ] **Step 3: 写配置**

`vite.config.ts` 必须包含：`@vitejs/plugin-react`、`@tailwindcss/vite`、MDX 插件（`enforce: 'pre'`，remark 插件 `remarkFrontmatter` + `remarkMdxFrontmatter`）、`resolve.alias['@'] = '/src'`、`test: { environment: 'jsdom', setupFiles: './tests/setup.ts', globals: true }`。

`src/types/mdx.d.ts`：

```ts
declare module '*.mdx' {
  import type { ComponentType } from 'react';
  const MDXComponent: ComponentType<Record<string, unknown>>;
  export default MDXComponent;
  export const frontmatter: Record<string, unknown>;
}
```

`tests/setup.ts`：`import '@testing-library/jest-dom/vitest'; import 'fake-indexeddb/auto';`

`src/index.css`：`@import "tailwindcss";` 加基础变量（纸色背景、墨色正文）。

`tsconfig.app.json` 的 `compilerOptions.types` 加 `"vitest/globals"`，避免测试里的 `test/expect/vi` 报类型错误。

`scripts/validate-content.ts` 先写占位实现：打印 `content validation not implemented` 并 `process.exit(0)`，保证 `npm run dev` 在 Task 5 之前也能启动；Task 5 会替换它。

- [ ] **Step 4: 运行测试确认失败**

Run: `npm test -- tests/app/smoke.test.tsx`
Expected: FAIL，提示找不到 `../../src/App`。

- [ ] **Step 5: 实现最小 `App`**

```tsx
// src/App.tsx
export default function App() {
  return <h1>法径</h1>;
}
```

`src/main.tsx` 渲染 `<App />`。

- [ ] **Step 6: 运行测试确认通过**

Run: `npm test -- tests/app/smoke.test.tsx`
Expected: PASS。

- [ ] **Step 7: 初始化仓库并提交**

```bash
git init
git add .
git commit -m "chore: scaffold vite react typescript app"
```

---

### Task 2: 内容数据模型与 Zod 校验

**Files:**
- Create: `src/content/schema.ts`
- Test: `tests/content/schema.test.ts`

**Interfaces:**
- Produces: `articleRefSchema`、`themeSchema`、`scenarioFrontmatterSchema`、`knowledgePointFrontmatterSchema`、`lawSchema`、`lawArticleSchema`、`lawFileSchema`，以及 `Theme`、`ScenarioFrontmatter`、`KnowledgePointFrontmatter`、`Law`、`LawArticle`、`LawFile`、`ArticleRef` 类型。

- [ ] **Step 1: 写失败的 schema 测试**

```ts
// tests/content/schema.test.ts
import {
  scenarioFrontmatterSchema,
  knowledgePointFrontmatterSchema,
} from '../../src/content/schema';

const scenario = {
  id: 'contract-formation',
  title: '口头说好的事，算数吗？',
  hook: '房东口头答应我续租，转头又租给别人。',
  kpIds: ['contract-formation'],
  primaryKpId: 'contract-formation',
  articleRefs: [{ lawId: 'civil-code', articleNo: '第四百六十九条' }],
  estimatedMinutes: 4,
  order: 1,
};

test('合法场景通过，reviewStatus 默认 draft', () => {
  const parsed = scenarioFrontmatterSchema.parse(scenario);
  expect(parsed.reviewStatus).toBe('draft');
});

test('阿拉伯数字条号被拒绝', () => {
  expect(() =>
    scenarioFrontmatterSchema.parse({
      ...scenario,
      articleRefs: [{ lawId: 'civil-code', articleNo: '第469条' }],
    }),
  ).toThrow();
});

test('primaryKpId 必须在 kpIds 中', () => {
  expect(() =>
    scenarioFrontmatterSchema.parse({ ...scenario, primaryKpId: 'missing' }),
  ).toThrow();
});

test('知识点必须有 reviewPrompt 和 reviewAnswer', () => {
  expect(() =>
    knowledgePointFrontmatterSchema.parse({
      id: 'x', title: 'x', oneLiner: 'x', articleRefs: [],
      relatedKpIds: [], confusions: [], order: 1,
    }),
  ).toThrow();
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/content/schema.test.ts`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现 schema**

条号正则：`/^第[一二三四五六七八九十百千零〇两]+条$/`。

`scenarioFrontmatterSchema` 字段：`id`（kebab-case）、`title`、`hook`、`thinkPrompt?`、`kpIds`（至少 1）、`primaryKpId`、`articleRefs`、`estimatedMinutes`（正整数，默认 5）、`order`（非负整数）、`reviewStatus`（`draft|checked`，默认 `draft`）。用 `.superRefine` 校验 `primaryKpId ∈ kpIds`。

`knowledgePointFrontmatterSchema` 字段：`id`、`title`、`oneLiner`、`articleRefs`、`relatedKpIds`、`confusions`（默认 `[]`）、`reviewPrompt`、`reviewAnswer`、`order`（非负整数）、`reviewStatus`。

`lawSchema`：`id`、`title`、`shortTitle`、`effectiveAt`、`sourceUrl`、`importedAt`、`articleCount`、`note?`。`lawFileSchema = { law, articles }`。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- tests/content/schema.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/content/schema.ts tests/content/schema.test.ts
git commit -m "feat: add content schemas"
```

---

### Task 3: 法条 Markdown 解析器

**Files:**
- Create: `scripts/lib/parse-law-markdown.ts`
- Test: `tests/scripts/parse-law-markdown.test.ts`

**Interfaces:**
- Produces: `parseLawMarkdown(markdown: string): ParsedArticle[]`；`chineseNumeralToInt(numeral: string): number`；类型 `ParsedArticle = { articleNo: string; text: string; path: string[] }`。

- [ ] **Step 1: 写失败的解析测试**

```ts
// tests/scripts/parse-law-markdown.test.ts
import { parseLawMarkdown, chineseNumeralToInt } from '../../scripts/lib/parse-law-markdown';

const src = `# 中华人民共和国劳动合同法

## 第一章　总则

**第一条**　为了完善劳动合同制度。

**第二条**　中华人民共和国境内的企业、个体经济组织等组织适用本法。

国家机关、事业单位、社会团体和与其建立劳动关系的劳动者，依照本法执行。

## 第二章　劳动合同的订立

**第十条**　建立劳动关系，应当订立书面劳动合同。
`;

test('解析条号、正文、章节路径', () => {
  const articles = parseLawMarkdown(src);
  expect(articles).toHaveLength(3);
  expect(articles[0].articleNo).toBe('第一条');
  expect(articles[1].text).toContain('国家机关、事业单位');
  expect(articles[1].path).toEqual(['第一章　总则']);
  expect(articles[2].articleNo).toBe('第十条');
});

test('中文数字转整数', () => {
  expect(chineseNumeralToInt('一')).toBe(1);
  expect(chineseNumeralToInt('十一')).toBe(11);
  expect(chineseNumeralToInt('二十')).toBe(20);
  expect(chineseNumeralToInt('一百零一')).toBe(101);
  expect(chineseNumeralToInt('一千二百六十')).toBe(1260);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/scripts/parse-law-markdown.test.ts`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现解析器**

用 `gray-matter` 去掉 frontmatter。逐行扫描：

- `##`/`###` 标题进入 `path`（`##` 重置为一级 + 自身，`###` 追加）；`#` 文章标题忽略。
- 条号行匹配 `/^\*\*(第[一二三四五六七八九十百千零〇两]+条)\*\*[　\s]*(.*)$/`，开始新条。
- 空行结束当前段；非空行追加到当前条 text，段间用 `\n\n` 连接。
- 条号原文保留（含「第」「条」）。

`chineseNumeralToInt` 支持 `零〇一二三四五六七八九十百千两`；按「单位位」累加（千/百/十），`两` 视为 2。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- tests/scripts/parse-law-markdown.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add scripts/lib/parse-law-markdown.ts tests/scripts/parse-law-markdown.test.ts
git commit -m "feat: parse law markdown into articles"
```

---

### Task 4: 法条导入脚本与法条库

**Files:**
- Create: `scripts/law-sources.ts`、`scripts/import-laws.ts`、`content/laws/*.json`（生成物）
- Test: `tests/scripts/import-laws.test.ts`

**Interfaces:**
- Consumes: `parseLawMarkdown`、`ParsedArticle`（Task 3）。
- Produces: `LAW_SOURCES: LawSource[]`；`importLaw(source: LawSource, fetchText: (url: string) => Promise<string>, now: Date): Promise<LawFile>`；`LawSource = { id, title, shortTitle, effectiveAt, sourceUrl, files: string[] }`。

- [ ] **Step 1: 写失败的导入测试**

```ts
// tests/scripts/import-laws.test.ts
import { importLaw } from '../../scripts/import-laws';
import type { LawSource } from '../../scripts/law-sources';

const source: LawSource = {
  id: 'labor-contracts-law',
  title: '中华人民共和国劳动合同法',
  shortTitle: '劳动合同法',
  effectiveAt: '2013-07-01',
  sourceUrl: 'https://flk.npc.gov.cn/',
  files: ['a.md', 'b.md'],
};

test('合并多文件并按条号排序', async () => {
  const md = '## 第一章　总则\n\n**第二条**　乙。\n\n**第一条**　甲。\n';
  const file = await importLaw(source, async () => md, new Date('2026-11-18'));
  expect(file.articles.map((a) => a.articleNo)).toEqual(['第一条', '第二条']);
  expect(file.law.articleCount).toBe(2);
  expect(file.law.importedAt).toBe('2026-11-18');
});

test('同一文件内重复条号报错', async () => {
  const md = '**第一条**　甲。\n\n**第一条**　乙。\n';
  await expect(importLaw(source, async () => md, new Date())).rejects.toThrow('重复条号');
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/scripts/import-laws.test.ts`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现法条源清单与导入**

`scripts/law-sources.ts` 放 `LAW_SOURCES`，raw 基址 `https://raw.githubusercontent.com/ImCa0/just-laws/master/`：

| id | 标题 | effectiveAt | 文件 |
|---|---|---|---|
| civil-code | 中华人民共和国民法典 | 2021-01-01 | `docs/civil-and-commercial/civil-code/01-general-principles.md`、`03-contracts.md`、`05-marriage-and-family.md`、`06-inheritance.md` |
| labor-contracts-law | 中华人民共和国劳动合同法 | 2013-07-01 | `docs/social/labor-contracts-law/README.md` |
| labor-law | 中华人民共和国劳动法 | 1995-01-01 | `docs/social/labor-law/README.md` |
| labor-dispute-mediation-and-arbitration-law | 中华人民共和国劳动争议调解仲裁法 | 2008-05-01 | `docs/procedural/labor-dispute-mediation-and-arbitration-law/README.md` |
| social-insurance-law | 中华人民共和国社会保险法 | 2011-07-01 | `docs/social/social-insurance-law/README.md` |
| anti-domestic-violence-law | 中华人民共和国反家庭暴力法 | 2016-03-01 | `docs/social/anti-domestic-violence-law/README.md` |
| e-commerce-law | 中华人民共和国电子商务法 | 2019-01-01 | `docs/economic/e-commerce-law/README.md` |

`importLaw`：逐文件 `fetchText`，解析、合并、按 `chineseNumeralToInt` 排序；重复条号抛 `重复条号：${lawId} ${articleNo}`；`law.articleCount = articles.length`；`importedAt` 取 `now.toISOString().slice(0,10)`。

CLI：串行下载，写入 `content/laws/<id>.json`（`JSON.stringify(file, null, 2)`），打印每部法律条数。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- tests/scripts/import-laws.test.ts`
Expected: PASS。

- [ ] **Step 5: 生成法条库**

Run: `npm run content:import`
Expected: `content/laws/` 生成 7 个 JSON；民法典条文数 > 1000；劳动合同法 > 90；每部 `articleCount > 0`。把生成物提交进仓库。

- [ ] **Step 6: 提交**

```bash
git add scripts/law-sources.ts scripts/import-laws.ts tests/scripts/import-laws.test.ts content/laws
git commit -m "feat: import national law texts into json corpus"
```

---

### Task 5: 内容校验脚本（法条引用闸门）

**Files:**
- Create: `scripts/lib/parse-mdx.ts`、`scripts/validate-content.ts`
- Test: `tests/scripts/validate-content.test.ts`

**Interfaces:**
- Consumes: Task 2 的 schema、Task 4 的 `LawFile` 结构。
- Produces: `scanMdx(source: string): MdxScan`；`validateContent(rootDir: string, opts?: { strict?: boolean }): ValidationIssue[]`；类型 `MdxScan = { frontmatter: Record<string, unknown>; articleRefs: ArticleRef[]; conceptLinks: string[] }`、`ValidationIssue = { file: string; message: string }`。

- [ ] **Step 1: 写失败的校验测试**

```ts
// tests/scripts/validate-content.test.ts
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateContent } from '../../scripts/validate-content';

async function writeFixture(root: string, opts: { articleNo?: string; duplicate?: boolean; draft?: boolean } = {}) {
  const themeDir = join(root, 'content/themes/contracts');
  await mkdir(join(themeDir, 'scenarios'), { recursive: true });
  await mkdir(join(themeDir, 'concepts'), { recursive: true });
  await mkdir(join(root, 'content/laws'), { recursive: true });
  await writeFile(join(themeDir, 'theme.json'), JSON.stringify({ id: 'contracts', title: '合同', intro: '学合同', order: 1 }));
  await writeFile(join(themeDir, 'concepts/contract-formation.mdx'),
    `---\nid: contract-formation\ntitle: 合同成立\noneLiner: 双方意思表示一致\narticleRefs:\n  - lawId: civil-code\n    articleNo: 第四百六十九条\nrelatedKpIds: []\nconfusions: []\nreviewPrompt: 合同一定要书面吗\nreviewAnswer: 不一定\norder: 1\nreviewStatus: ${opts.draft ? 'draft' : 'checked'}\n---\n\n正文`);
  await writeFile(join(themeDir, 'scenarios/01.mdx'),
    `---\nid: contract-formation-story\ntitle: 口头约定\nhook: 口头说好的算数吗\nkpIds: [contract-formation]\nprimaryKpId: contract-formation\narticleRefs:\n  - lawId: civil-code\n    articleNo: ${opts.articleNo ?? '第四百六十九条'}\norder: 1\nreviewStatus: checked\n---\n\n<ConceptLink id="contract-formation">合同成立</ConceptLink>`);
  await writeFile(join(root, 'content/laws/civil-code.json'), JSON.stringify({
    law: { id: 'civil-code', title: '民法典', shortTitle: '民法典', effectiveAt: '2021-01-01', sourceUrl: 'https://flk.npc.gov.cn/', importedAt: '2026-11-18', articleCount: 1 },
    articles: [{ lawId: 'civil-code', articleNo: '第四百六十九条', text: '当事人订立合同，可以采用书面形式、口头形式或者其他形式。', path: [] }],
  }));
  if (opts.duplicate) {
    await writeFile(join(themeDir, 'scenarios/02.mdx'),
      `---\nid: contract-formation-story\ntitle: 重复\nhook: 重复\nkpIds: [contract-formation]\nprimaryKpId: contract-formation\narticleRefs: []\norder: 2\nreviewStatus: checked\n---\n\n正文`);
  }
}

test('合法内容无问题', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fajing-'));
  await writeFixture(root);
  expect(validateContent(root)).toEqual([]);
});

test('引用不存在的法条时报错', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fajing-'));
  await writeFixture(root, { articleNo: '第九百九十九条' });
  expect(validateContent(root).some((i) => i.message.includes('第九百九十九条'))).toBe(true);
});

test('重复 id 报错', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fajing-'));
  await writeFixture(root, { duplicate: true });
  expect(validateContent(root).some((i) => i.message.includes('重复 id'))).toBe(true);
});

test('strict 模式下 draft 内容报错', async () => {
  const root = await mkdtemp(join(tmpdir(), 'fajing-'));
  await writeFixture(root, { draft: true });
  expect(validateContent(root, { strict: true }).some((i) => i.message.includes('checked'))).toBe(true);
  expect(validateContent(root).some((i) => i.message.includes('checked'))).toBe(false);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/scripts/validate-content.test.ts`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现 MDX 扫描与校验**

`scanMdx` 用 `unified().use(remarkParse).use(remarkFrontmatter).use(remarkMdx)` 解析，`unist-util-visit` 遍历：

- `yaml` 节点 → `yaml.parse` 得 frontmatter。
- `mdxJsxFlowElement` / `mdxJsxTextElement`：`name === 'ArticleRef'` 取 `law`、`no` 属性；`name === 'ConceptLink'` 取 `id` 属性。属性值只支持字符串字面量，表达式属性报错。

`validateContent` 检查（错误信息必须包含文件路径）：

1. 每个 `theme.json` / MDX 通过对应 schema；解析失败转成 issue。
2. 所有 id（主题、场景、知识点、法律）全局唯一；重复报 `重复 id`。
3. `ArticleRef` 的 `lawId` 存在、`articleNo` 在该法律条文中存在。
4. `ConceptLink` 指向存在的知识点。
5. 场景 `kpIds`、`primaryKpId`；知识点 `relatedKpIds` 均存在。
6. strict 模式下 `reviewStatus !== 'checked'` 报错。
7. 正文中出现 `/第[一二三四五六七八九十百千零〇两]+条/` 但不在 `ArticleRef` 组件里 → 警告级 issue（`message` 以 `[警告]` 开头），不阻断非 strict。

`content/` 目录不存在时视为空内容（返回空 issue 列表），保证脚手架阶段 `npm run dev` 不被阻塞。

CLI：`--strict` 时若有非警告 issue，`process.exit(1)`；否则打印警告并 `exit(0)`。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- tests/scripts/validate-content.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add scripts/lib/parse-mdx.ts scripts/validate-content.ts tests/scripts/validate-content.test.ts
git commit -m "feat: validate content and law citations"
```

---

### Task 6: 内容注册表与示例内容

**Files:**
- Create: `src/content/registry.ts`、`content/themes/contracts/theme.json`、`content/themes/contracts/scenarios/01-contract-formation.mdx`、`content/themes/contracts/concepts/contract-formation.mdx`、`content/themes/contracts/concepts/contract-form.mdx`
- Test: `tests/content/registry.test.ts`

**Interfaces:**
- Consumes: schema 类型（Task 2）、法条 JSON（Task 4）。
- Produces:
  - `getThemes(): Theme[]`
  - `getTheme(themeId: string): Theme | undefined`
  - `getScenarios(themeId: string): ScenarioEntry[]`
  - `getScenario(scenarioId: string): ScenarioEntry | undefined`
  - `getKnowledgePoint(kpId: string): KnowledgePointEntry | undefined`
  - `getKnowledgePoints(themeId?: string): KnowledgePointEntry[]`
  - `getLaws(): Law[]`、`getLaw(lawId: string): Law | undefined`
  - `getArticle(lawId: string, articleNo: string): LawArticle | undefined`
  - `getArticles(lawId: string): LawArticle[]`
  - 类型 `ScenarioEntry = { meta: ScenarioFrontmatter & { themeId: string }; Content: ComponentType }`，`KnowledgePointEntry` 同理。

- [ ] **Step 1: 写失败的注册表测试**

```ts
// tests/content/registry.test.ts
import { getThemes, getScenario, getKnowledgePoint, getArticle } from '../../src/content/registry';

test('加载合同主题', () => {
  expect(getThemes().map((t) => t.id)).toContain('contracts');
});

test('场景带 themeId 与 MDX 组件', () => {
  const entry = getScenario('contract-formation');
  expect(entry?.meta.themeId).toBe('contracts');
  expect(entry?.Content).toBeTruthy();
});

test('知识点可读取', () => {
  expect(getKnowledgePoint('contract-formation')?.meta.title).toBeTruthy();
});

test('法条可读取且原文正确', () => {
  expect(getArticle('civil-code', '第四百六十三条')?.text).toContain('本编调整因合同产生的民事关系');
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/content/registry.test.ts`
Expected: FAIL，模块或内容不存在。

- [ ] **Step 3: 实现注册表**

用 `import.meta.glob` eager 加载：

- `/content/themes/*/theme.json`
- `/content/themes/*/scenarios/*.mdx`
- `/content/themes/*/concepts/*.mdx`
- `/content/laws/*.json`

从路径解析 `themeId`（`themes/<themeId>/...`）。用 `scenarioFrontmatterSchema.parse(module.frontmatter)` 校验，失败时抛 `内容错误：<文件路径> ...`。按 `order` 排序。构建索引 `Map`，导出上述函数。

- [ ] **Step 4: 写示例内容**

`theme.json`：`{ "id": "contracts", "title": "合同", "intro": "从签合同、履行到违约，把日常生活里的合同问题弄明白。", "order": 1 }`

`concepts/contract-formation.mdx`：合同成立与生效，引用 `civil-code` 第四百六十九条；`reviewPrompt` 与 `reviewAnswer`；`reviewStatus: draft`。

`concepts/contract-form.mdx`：合同形式（书面/口头/电子），引用第四百六十九条；同样字段。

`scenarios/01-contract-formation.mdx`：标题「口头说好的事，算数吗？」，`primaryKpId: contract-formation`，`kpIds: [contract-formation, contract-form]`，正文使用 `<ConceptLink>` 与 `<ArticleRef>`，`reviewStatus: draft`。

- [ ] **Step 5: 运行测试确认通过**

Run: `npm test -- tests/content/registry.test.ts`
Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add src/content/registry.ts content/themes tests/content/registry.test.ts
git commit -m "feat: add content registry and sample contracts content"
```

---

### Task 7: UI 基础组件

**Files:**
- Create: `src/lib/cn.ts`、`src/components/ui/button.tsx`、`card.tsx`、`badge.tsx`、`progress.tsx`、`dialog.tsx`、`collapsible.tsx`、`input.tsx`、`textarea.tsx`、`separator.tsx`
- Test: `tests/components/ui.test.tsx`

**Interfaces:**
- Produces：
  - `cn(...inputs: ClassValue[]): string`
  - `Button`（`variant: 'default'|'outline'|'ghost'|'danger'`，`size: 'sm'|'md'|'lg'`，原生 button 属性）
  - `Card`/`CardHeader`/`CardTitle`/`CardContent`
  - `Badge`（`tone: 'neutral'|'accent'|'muted'`）
  - `Progress`（`value: number` 0–100）
  - `Dialog`（`open`、`onOpenChange`、`title`、`children`，基于 `@radix-ui/react-dialog`）
  - `Collapsible`（`open`、`onOpenChange`、`trigger`、`children`，基于 `@radix-ui/react-collapsible`）
  - `Input`、`Textarea`、`Separator`

- [ ] **Step 1: 写失败的组件测试**

```tsx
// tests/components/ui.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../../src/components/ui/button';
import { Dialog } from '../../src/components/ui/dialog';

test('Button 可点击', async () => {
  const onClick = vi.fn();
  render(<Button onClick={onClick}>开始</Button>);
  await userEvent.click(screen.getByRole('button', { name: '开始' }));
  expect(onClick).toHaveBeenCalledOnce();
});

test('Dialog 打开时显示标题', () => {
  render(<Dialog open onOpenChange={() => {}} title="免责声明">内容</Dialog>);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText('免责声明')).toBeInTheDocument();
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/components/ui.test.tsx`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现组件**

`cn` 用 `clsx` + `twMerge`。样式遵循 spec 的纸感方向：暖白背景、细边框、低饱和朱砂强调色；组件不使用霓虹/渐变。所有交互元素必须有可见 `focus-visible` 样式和 `aria` 标签。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- tests/components/ui.test.tsx`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/lib/cn.ts src/components/ui tests/components/ui.test.tsx
git commit -m "feat: add base ui components"
```

---

### Task 8: 应用外壳、路由与免责声明

**Files:**
- Create: `src/app/router.tsx`、`src/app/AppLayout.tsx`、`src/features/settings/useTheme.ts`、`src/components/Disclaimer.tsx`、`src/app/NotFound.tsx`
- Modify: `src/App.tsx`、`src/main.tsx`
- Test: `tests/app/shell.test.tsx`

**Interfaces:**
- Consumes: UI 组件（Task 7）。
- Produces: 路由路径 `/`、`/theme/:themeId`、`/scenario/:scenarioId`、`/concept/:kpId`、`/law/:lawId`、`/law/:lawId/:articleNo`、`/review`、`/search`、`/notes`、`/settings`；`useTheme(): { theme, setTheme }`；`Disclaimer`。

- [ ] **Step 1: 写失败的壳测试**

```tsx
// tests/app/shell.test.tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppLayout from '../../src/app/AppLayout';

test('显示主导航', () => {
  render(<MemoryRouter><AppLayout /></MemoryRouter>);
  expect(screen.getByRole('link', { name: '复习' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '搜索' })).toBeInTheDocument();
});

test('首次访问显示免责声明', () => {
  localStorage.clear();
  render(<MemoryRouter><AppLayout /></MemoryRouter>);
  expect(screen.getByText(/不构成法律意见/)).toBeInTheDocument();
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/app/shell.test.tsx`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现外壳**

`AppLayout`：顶部品牌用 `<h1>法径</h1>` + 导航（首页、复习、搜索、笔记、设置）+ 深色模式切换；`<Outlet />`。品牌保持 `h1` 以保证 Task 1 的冒烟测试继续通过。`Disclaimer` 用 Dialog，首次访问（`localStorage['fajing.disclaimer']` 无值）时打开，确认后写入；文案必须包含「仅供学习，不构成法律意见」。

`useTheme`：读写 `localStorage['fajing.theme']`，支持 `light|dark|system`；在 `document.documentElement` 上切换 `data-theme`。

`router.tsx` 用 `createBrowserRouter`，占位页面在后续任务替换。`App.tsx` = `<RouterProvider router={router} />`。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- tests/app/shell.test.tsx`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/app src/components/Disclaimer.tsx src/features/settings/useTheme.ts src/App.tsx src/main.tsx tests/app/shell.test.tsx
git commit -m "feat: add app shell routes and disclaimer"
```

---

### Task 9: 本地数据库与仓储

**Files:**
- Create: `src/lib/db.ts`、`src/features/notes/notes-repo.ts`、`src/features/bookmarks/bookmarks-repo.ts`、`src/features/learning/reads-repo.ts`、`src/features/learning/progress-repo.ts`
- Test: `tests/lib/db.test.ts`

**Interfaces:**
- Produces:
  - `db`（Dexie 实例，表：`progress`、`notes`、`bookmarks`、`reads`、`settings`）
  - `RatingInput = 'again' | 'good' | 'easy'`（在 `src/lib/db.ts` 定义，后续任务复用）
  - `Progress = { kpId: string; state: 'touched'|'learning'|'review'; card?: Card; due?: string; lastRating?: RatingInput; updatedAt: string }`
  - `Note = { id: string; targetType: 'scenario'|'kp'; targetId: string; content: string; updatedAt: string }`
  - `Bookmark = { id: string; targetType: 'scenario'|'kp'; targetId: string; createdAt: string }`
  - `Read = { scenarioId: string; readAt: string; rated: boolean }`
  - `Setting = { id: 'app'; theme: 'light'|'dark'|'system'; disclaimerAcceptedAt?: string }`
  - `saveNote/getNote/listNotes/deleteNote`、`toggleBookmark/isBookmarked/listBookmarks`、`markScenarioRead/getReads`、`getProgress/putProgress/listProgress`。

- [ ] **Step 1: 写失败的持久化测试**

```ts
// tests/lib/db.test.ts
import { db } from '../../src/lib/db';
import { saveNote, getNote } from '../../src/features/notes/notes-repo';
import { toggleBookmark, isBookmarked } from '../../src/features/bookmarks/bookmarks-repo';
import { markScenarioRead, getReads } from '../../src/features/learning/reads-repo';

beforeEach(async () => {
  await Promise.all([db.progress.clear(), db.notes.clear(), db.bookmarks.clear(), db.reads.clear(), db.settings.clear()]);
});

test('笔记写入后可读，id 稳定', async () => {
  await saveNote('kp', 'contract-formation', '我的笔记');
  expect((await getNote('kp', 'contract-formation'))?.content).toBe('我的笔记');
  await saveNote('kp', 'contract-formation', '更新');
  expect(await db.notes.count()).toBe(1);
});

test('收藏可切换', async () => {
  expect(await toggleBookmark('scenario', 'contract-formation-story')).toBe(true);
  expect(await isBookmarked('scenario', 'contract-formation-story')).toBe(true);
  expect(await toggleBookmark('scenario', 'contract-formation-story')).toBe(false);
});

test('阅读记录持久化', async () => {
  await markScenarioRead('contract-formation-story');
  expect((await getReads()).map((r) => r.scenarioId)).toContain('contract-formation-story');
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/lib/db.test.ts`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现数据库与仓储**

`db.ts`：

```ts
this.version(1).stores({
  progress: '&kpId, due, state',
  notes: '&id, targetType, targetId, updatedAt',
  bookmarks: '&id, targetType, targetId, createdAt',
  reads: '&scenarioId, readAt',
  settings: '&id',
});
```

笔记 id：`${targetType}:${targetId}`；收藏 id 同。`markScenarioRead` 用 upsert，保留已有 `rated`。`putProgress` 写入时补 `updatedAt`；有 `card.due` 时同步写 `due`（ISO 字符串）供索引。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- tests/lib/db.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/lib/db.ts src/features/notes src/features/bookmarks src/features/learning/reads-repo.ts src/features/learning/progress-repo.ts tests/lib/db.test.ts
git commit -m "feat: add indexeddb persistence and repositories"
```

---

### Task 10: 首页、主题页与进度计算

**Files:**
- Create: `src/features/learning/theme-progress.ts`、`src/features/home/HomePage.tsx`、`src/features/learning/ThemePage.tsx`
- Modify: `src/app/router.tsx`
- Test: `tests/features/theme-progress.test.ts`、`tests/features/home.test.tsx`

**Interfaces:**
- Consumes: registry（Task 6）、reads/progress 仓储（Task 9）。
- Produces: `computeThemeProgress(input): ThemeProgress`；`computeStreak(reads: Read[], now: Date): number`；页面 `HomePage`、`ThemePage`。

- [ ] **Step 1: 写失败的进度计算测试**

```ts
// tests/features/theme-progress.test.ts
import { computeThemeProgress } from '../../src/features/learning/theme-progress';

test('空数据返回零进度', () => {
  expect(computeThemeProgress({ scenarioIds: ['a'], kpIds: ['k1'], readScenarioIds: [], progress: [] }))
    .toEqual({ scenariosRead: 0, scenariosTotal: 1, kpsMastered: 0, kpsTotal: 1 });
});

test('已读与已掌握分别计数', () => {
  const p = computeThemeProgress({
    scenarioIds: ['a', 'b'], kpIds: ['k1', 'k2'],
    readScenarioIds: ['a'],
    progress: [{ kpId: 'k1', state: 'review', updatedAt: '2026-11-18T00:00:00.000Z' }],
  });
  expect(p.scenariosRead).toBe(1);
  expect(p.kpsMastered).toBe(1);
});

test('连续学习天数按日期去重计算', () => {
  const reads = [
    { scenarioId: 'a', readAt: '2026-11-18T09:00:00.000Z', rated: true },
    { scenarioId: 'b', readAt: '2026-11-18T20:00:00.000Z', rated: true },
    { scenarioId: 'c', readAt: '2026-11-17T09:00:00.000Z', rated: true },
  ];
  expect(computeStreak(reads, new Date('2026-11-18T12:00:00.000Z'))).toBe(2);
});
```

```tsx
// tests/features/home.test.tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../../src/features/home/HomePage';

test('无学习数据时显示引导而不是空白', async () => {
  render(<MemoryRouter><HomePage /></MemoryRouter>);
  expect(await screen.findByText(/从第一个场景开始/)).toBeInTheDocument();
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/features/theme-progress.test.ts`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现进度计算与页面**

`computeThemeProgress` 纯函数：`kpsMastered` 统计 `state === 'review'` 的知识点。

`HomePage`：显示三个主题卡片（标题、intro、进度条「已读 x/y 场景」）、今日到期数量（从 progress 的 `due <= now` 统计）、连续学习天数、搜索入口。无数据时显示引导文案「从第一个场景开始」，而不是空白。

`ThemePage`：主题简介、场景卡片列表（标题 + 预计分钟 + 已读标记）、知识点数量、进度。点击场景进 `/scenario/:id`。

用 `useLiveQuery` 读 reads/progress，保证刷新后恢复。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- tests/features/theme-progress.test.ts tests/features/home.test.tsx`
Expected: PASS（首页测试断言无数据时显示「从第一个场景开始」）。

- [ ] **Step 5: 提交**

```bash
git add src/features/learning/theme-progress.ts src/features/home src/features/learning/ThemePage.tsx src/app/router.tsx tests/features
git commit -m "feat: add home and theme pages with progress"
```

---

### Task 11: MDX 组件与场景学习流

**Files:**
- Create: `src/components/mdx/index.tsx`、`src/components/mdx/article-ref.tsx`、`src/components/mdx/concept-link.tsx`、`src/components/mdx/reveal.tsx`、`src/components/mdx/callout.tsx`、`src/components/mdx/steps.tsx`、`src/features/learning/ScenarioPage.tsx`、`src/features/learning/rating-buttons.tsx`
- Modify: `src/app/router.tsx`
- Test: `tests/features/scenario.test.tsx`

**Interfaces:**
- Consumes: registry（Task 6）、reads/progress（Task 9）、UI（Task 7）。
- Produces: `mdxComponents`（`ArticleRef`、`ConceptLink`、`Callout`、`Steps`、`Step`、`Reveal`）；`RatingButtons`（`onRate: (rating: RatingInput) => void`）；`ScenarioPage({ scenarioId }: { scenarioId?: string })`（未传时从 `useParams` 取，便于路由与测试复用）。

- [ ] **Step 1: 写失败的场景流测试**

```tsx
// tests/features/scenario.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ScenarioPage from '../../src/features/learning/ScenarioPage';
import { db } from '../../src/lib/db';

beforeEach(async () => { await db.progress.clear(); await db.reads.clear(); });

test('答案默认收起，点击后展开并出现自评', async () => {
  render(<MemoryRouter initialEntries={['/scenario/contract-formation']}><ScenarioPage scenarioId="contract-formation" /></MemoryRouter>);
  expect(screen.getByText('口头说好的事，算数吗？')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '大概懂了' })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /展开答案/ }));
  expect(screen.getByRole('button', { name: '大概懂了' })).toBeInTheDocument();
});

test('自评写入主知识点的进度', async () => {
  render(<MemoryRouter initialEntries={['/scenario/contract-formation']}><ScenarioPage scenarioId="contract-formation" /></MemoryRouter>);
  await userEvent.click(screen.getByRole('button', { name: /展开答案/ }));
  await userEvent.click(screen.getByRole('button', { name: '大概懂了' }));
  await vi.waitFor(async () => {
    expect(await db.progress.get('contract-formation')).toBeTruthy();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/features/scenario.test.tsx`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现 MDX 组件**

- `ArticleRef({ lawId, no })`：可折叠显示条号 + 原文；取不到法条时显示「法条缺失：lawId 条号」并加 `role="alert"`。
- `ConceptLink({ id, children })`：`<Link to={'/concept/' + id}>`；取不到知识点时渲染纯文本 + 警告样式。
- `Reveal({ label, children })`：默认收起，按钮文案包含「展开」；展开后按钮隐藏。
- `Callout({ type, children })`：`tip` 显示「实务提示」标签；`warning` 显示「注意」；`info` 无标签。
- `Steps`/`Step`：有序步骤容器。
- `mdxComponents` 导出上述对象。

- [ ] **Step 4: 实现场景页**

页面结构：面包屑（主题）→ 标题 → hook → thinkPrompt（如有）→ `<Reveal label="我想好了，展开答案">` 包裹 MDX → 引用法条列表 → `RatingButtons`。

展开时：`markScenarioRead(scenarioId)`，并对所有非主 `kpIds` 调 `touchKnowledgePoint`（只写 `state: 'touched'`，无卡片）。主知识点不在此处创建卡片，等自评时创建。

`RatingButtons`：三个按钮「没懂」「大概懂了」「很熟」，调用 `rateKnowledgePoint(kpId, rating)`；评完显示「已加入复习」。

- [ ] **Step 5: 运行测试确认通过**

Run: `npm test -- tests/features/scenario.test.tsx`
Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add src/components/mdx src/features/learning/ScenarioPage.tsx src/features/learning/rating-buttons.tsx src/app/router.tsx tests/features/scenario.test.tsx
git commit -m "feat: add mdx components and scenario learning flow"
```

---

### Task 12: 知识点页与法条阅读

**Files:**
- Create: `src/features/learning/KnowledgePointPage.tsx`、`src/features/laws/LawPage.tsx`、`src/features/laws/ArticlePage.tsx`
- Modify: `src/app/router.tsx`
- Test: `tests/features/knowledge-point.test.tsx`、`tests/features/law.test.tsx`

**Interfaces:**
- Consumes: registry、`RatingButtons`、`ArticleRef`、UI。
- Produces: `KnowledgePointPage({ kpId }: { kpId?: string })`、`LawPage({ lawId }: { lawId?: string })`、`ArticlePage({ lawId, articleNo }: { lawId?: string; articleNo?: string })`，均支持从 `useParams` 兜底。

- [ ] **Step 1: 写失败的页面测试**

```tsx
// tests/features/knowledge-point.test.tsx
test('知识点页显示一句话解释、法条与易混淆点', () => {
  render(<MemoryRouter initialEntries={['/concept/contract-formation']}><KnowledgePointPage kpId="contract-formation" /></MemoryRouter>);
  expect(screen.getByText(/合同成立/)).toBeInTheDocument();
  expect(screen.getByText(/第四百六十九条/)).toBeInTheDocument();
});
```

```tsx
// tests/features/law.test.tsx
test('法条页显示原文与来源', () => {
  render(<MemoryRouter initialEntries={['/law/civil-code/第四百六十三条']}><ArticlePage lawId="civil-code" articleNo="第四百六十三条" /></MemoryRouter>);
  expect(screen.getByText(/本编调整因合同产生的民事关系/)).toBeInTheDocument();
  expect(screen.getByText(/中华人民共和国民法典/)).toBeInTheDocument();
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/features/knowledge-point.test.tsx tests/features/law.test.tsx`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现页面**

`KnowledgePointPage`：标题、`oneLiner`、MDX 正文、引用法条（`ArticleRef` 展开原文）、易混淆点列表、相关知识点链接、自己的 `RatingButtons`（作用于本知识点）、笔记入口。

`LawPage`：法律标题、生效日期、来源链接；按 `path` 分组列出条文，点击进 `/law/:lawId/:articleNo`。

`ArticlePage`：法律名 + 条号 + 原文（`whitespace-pre-wrap`）+ 所属章节 + 生效日期 + 来源 + 返回法律目录。法条不存在时显示「未收录该条」和返回链接。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- tests/features/knowledge-point.test.tsx tests/features/law.test.tsx`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/features/learning/KnowledgePointPage.tsx src/features/laws src/app/router.tsx tests/features
git commit -m "feat: add knowledge point and law reading pages"
```

---

### Task 13: 笔记与收藏界面

**Files:**
- Create: `src/features/notes/NoteEditor.tsx`、`src/features/notes/NotesPage.tsx`、`src/features/bookmarks/BookmarkButton.tsx`
- Modify: `src/features/learning/ScenarioPage.tsx`、`src/features/learning/KnowledgePointPage.tsx`、`src/app/router.tsx`
- Test: `tests/features/notes.test.tsx`

**Interfaces:**
- Consumes: 仓储（Task 9）、UI。
- Produces: `NoteEditor({ targetType, targetId })`、`BookmarkButton({ targetType, targetId })`、`NotesPage`（含「笔记 / 收藏」两个分区）。

- [ ] **Step 1: 写失败的笔记测试**

```tsx
// tests/features/notes.test.tsx
test('输入笔记后自动保存', async () => {
  render(<NoteEditor targetType="kp" targetId="contract-formation" />);
  await userEvent.type(screen.getByRole('textbox'), '记得看第四百六十九条');
  await vi.waitFor(async () => {
    expect((await getNote('kp', 'contract-formation'))?.content).toContain('第四百六十九条');
  });
});

test('收藏按钮可切换并带 aria-pressed', async () => {
  render(<BookmarkButton targetType="kp" targetId="contract-formation" />);
  const btn = await screen.findByRole('button', { name: /收藏/ });
  expect(btn).toHaveAttribute('aria-pressed', 'false');
  await userEvent.click(btn);
  expect(await screen.findByRole('button', { name: /已收藏/ })).toHaveAttribute('aria-pressed', 'true');
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/features/notes.test.tsx`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现**

`NoteEditor`：textarea，输入后 500ms 防抖保存；显示「已保存」状态。空内容时删除笔记。

`NotesPage`：分「笔记」「收藏」两个分区。笔记显示目标标题与更新时间，点击跳转到场景/知识点；收藏显示收藏的场景/知识点。两个分区各自有独立空状态（「还没有笔记，学习时随手记一句。」/「还没有收藏，遇到想反复看的内容就收起来。」）。

`BookmarkButton`：切换收藏，显示「已收藏/收藏」，`aria-pressed`。

在场景页、知识点页底部放置 `NoteEditor` 与 `BookmarkButton`。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- tests/features/notes.test.tsx`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/features/notes src/features/bookmarks/BookmarkButton.tsx src/features/learning src/app/router.tsx tests/features/notes.test.tsx
git commit -m "feat: add notes and bookmarks"
```

---

### Task 14: FSRS 复习引擎

**Files:**
- Create: `src/lib/review.ts`、`src/features/learning/rating.ts`
- Test: `tests/lib/review.test.ts`

**Interfaces:**
- Consumes: `Progress`、`RatingInput`（Task 9）。
- Produces:
  - `scheduleProgress(existing: Progress | undefined, kpId: string, rating: RatingInput, now: Date): Progress`
  - `dueProgress(progress: Progress[], now: Date): Progress[]`
  - `rateKnowledgePoint(kpId: string, rating: RatingInput, now?: Date): Promise<Progress>`
  - `touchKnowledgePoint(kpId: string): Promise<void>`

- [ ] **Step 1: 写失败的调度测试**

```ts
// tests/lib/review.test.ts
import { scheduleProgress } from '../../src/lib/review';

const now = new Date('2026-11-18T00:00:00.000Z');

test('首次自评创建卡片并排到未来', () => {
  const p = scheduleProgress(undefined, 'kp-1', 'good', now);
  expect(p.state).toBe('learning');
  expect(new Date(p.card!.due).getTime()).toBeGreaterThan(now.getTime());
});

test('没懂比很熟更早到期', () => {
  const again = scheduleProgress(undefined, 'kp-1', 'again', now);
  const easy = scheduleProgress(undefined, 'kp-1', 'easy', now);
  expect(new Date(again.card!.due).getTime()).toBeLessThan(new Date(easy.card!.due).getTime());
});

test('连续很熟间隔变长', () => {
  const first = scheduleProgress(undefined, 'kp-1', 'easy', now);
  const second = scheduleProgress(first, 'kp-1', 'easy', new Date(first.card!.due));
  const firstDays = new Date(first.card!.due).getTime() - now.getTime();
  const secondDays = new Date(second.card!.due).getTime() - new Date(first.card!.due).getTime();
  expect(secondDays).toBeGreaterThan(firstDays);
});

test('dueProgress 只返回到期卡片', () => {
  const due = scheduleProgress(undefined, 'a', 'again', new Date('2026-11-01T00:00:00.000Z'));
  const future = scheduleProgress(undefined, 'b', 'easy', now);
  expect(dueProgress([due, future], now).map((p) => p.kpId)).toEqual(['a']);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/lib/review.test.ts`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现**

```ts
const scheduler = fsrs(generatorParameters({ enable_fuzz: false }));
const ratingMap = { again: Rating.Again, good: Rating.Good, easy: Rating.Easy };
```

`scheduleProgress`：`existing?.card ?? createEmptyCard(now)`，调用 `scheduler.next(card, now, ratingMap[rating])`，返回 `{ kpId, state: result.card.state === State.Review ? 'review' : 'learning', card: result.card, due: new Date(result.card.due).toISOString(), lastRating: rating, updatedAt: now.toISOString() }`。

`dueProgress`：过滤 `card && new Date(card.due) <= now`，按 due 升序。

`rating.ts`：`rateKnowledgePoint` 读 `progress-repo`，调用 `scheduleProgress`，写回；`touchKnowledgePoint` 仅当不存在时写 `state: 'touched'`。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- tests/lib/review.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/lib/review.ts src/features/learning/rating.ts tests/lib/review.test.ts
git commit -m "feat: add fsrs scheduling engine"
```

---

### Task 15: 复习页面

**Files:**
- Create: `src/features/review/ReviewPage.tsx`
- Modify: `src/app/router.tsx`、`src/app/AppLayout.tsx`（导航显示到期数）
- Test: `tests/features/review.test.tsx`

**Interfaces:**
- Consumes: `dueProgress`、`rateKnowledgePoint`、progress-repo、registry。
- Produces: `ReviewPage`。

- [ ] **Step 1: 写失败的复习测试**

```tsx
// tests/features/review.test.tsx
test('无到期卡片时显示空状态', async () => {
  await db.progress.clear();
  render(<MemoryRouter><ReviewPage /></MemoryRouter>);
  expect(await screen.findByText(/今天没有要复习的/)).toBeInTheDocument();
});

test('有到期卡片时显示问题，展开答案后自评进入下一张', async () => {
  await db.progress.clear();
  await rateKnowledgePoint('contract-formation', 'again', new Date('2026-11-01T00:00:00.000Z'));
  render(<MemoryRouter><ReviewPage /></MemoryRouter>);
  expect(await screen.findByText(/合同/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /显示答案/ }));
  await userEvent.click(screen.getByRole('button', { name: '很熟' }));
  expect(await screen.findByText(/今天没有要复习的/)).toBeInTheDocument();
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/features/review.test.tsx`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现复习页**

读取到期队列（`dueProgress`），一次一张：显示知识点标题与 `reviewPrompt`；按钮「显示答案」展开 `reviewAnswer` 与引用法条；显示 `RatingButtons`。自评后从队列移除并进入下一张。顶部显示「剩余 N 张」。空状态：「今天没有要复习的，去主题里逛逛。」

导航「复习」旁显示到期数（`useLiveQuery`）。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- tests/features/review.test.tsx`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/features/review src/app tests/features/review.test.tsx
git commit -m "feat: add review queue page"
```

---

### Task 16: 搜索

**Files:**
- Create: `src/lib/search.ts`、`src/features/search/SearchPage.tsx`
- Modify: `src/app/router.tsx`
- Test: `tests/lib/search.test.ts`

**Interfaces:**
- Consumes: registry、`tokenizeZh`。
- Produces:
  - `SearchDoc = { id: string; type: 'scenario'|'concept'|'article'; title: string; text: string; themeId?: string; lawId?: string; articleNo?: string }`
  - `collectSearchDocs(): SearchDoc[]`（从注册表收集全部场景、知识点与已收录法条）
  - `buildSearchIndex(docs: SearchDoc[]): MiniSearch<SearchDoc>`
  - `searchContent(index, query: string, filter: 'all'|'scenario'|'concept'|'article', opts?: { themeId?: string; limit?: number }): SearchDoc[]`
  - `tokenizeZh(text: string): string[]`

- [ ] **Step 1: 写失败的搜索测试**

```ts
// tests/lib/search.test.ts
import { buildSearchIndex, searchContent } from '../../src/lib/search';

const docs = [
  { id: 's1', type: 'scenario' as const, title: '试用期被辞退', text: '公司说试用期不合格直接让我走。' },
  { id: 's2', type: 'scenario' as const, title: '押金不退', text: '房东以墙面有划痕为由不退押金。' },
  { id: 'a1', type: 'article' as const, title: '劳动合同法 第二十一条', text: '在试用期中，除劳动者有本法第三十九条和第四十条第一项、第二项规定的情形外，用人单位不得解除劳动合同。' },
];
const index = buildSearchIndex(docs);

test('中文搜索命中标题', () => {
  expect(searchContent(index, '试用期', 'all').map((d) => d.id)).toContain('s1');
});

test('按类型过滤', () => {
  expect(searchContent(index, '试用期', 'article').map((d) => d.id)).toEqual(['a1']);
});

test('按主题过滤', () => {
  const themed = [{ ...docs[0], themeId: 'labor' }, { ...docs[1], themeId: 'contracts' }];
  const idx = buildSearchIndex(themed);
  expect(searchContent(idx, '押金', 'all', { themeId: 'labor' })).toEqual([]);
  expect(searchContent(idx, '押金', 'all', { themeId: 'contracts' }).map((d) => d.id)).toEqual(['s2']);
});

test('空查询返回空数组', () => {
  expect(searchContent(index, '   ', 'all')).toEqual([]);
});

test('从内容注册表收集文档', () => {
  expect(collectSearchDocs().some((d) => d.id === 'contract-formation')).toBe(true);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/lib/search.test.ts`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现搜索**

`tokenizeZh` 用 `Intl.Segmenter('zh-CN', { granularity: 'word' })` 取 `isWordLike` 片段并小写。

MiniSearch 配置：`fields: ['title','text']`、`storeFields: ['id','type','title','text','themeId','lawId','articleNo']`、`tokenize: tokenizeZh`、`searchOptions: { boost: { title: 3 }, prefix: true, fuzzy: 0.2 }`。

`collectSearchDocs`：场景取 `title + hook + 正文纯文本`（MDX 无法直接取纯文本时至少取 `title + hook`），知识点取 `title + oneLiner`，法条取 `shortTitle + articleNo + text`。

`searchContent` 空查询返回 `[]`；`filter !== 'all'` 时按 `type` 过滤；`opts.themeId` 存在时按 `themeId` 过滤；默认 limit 20。

`SearchPage`：输入框即时搜索，类型与主题两个过滤器，分组显示场景/知识点/法条，点击跳转。首页、外壳放搜索入口。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- tests/lib/search.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/lib/search.ts src/features/search src/app/router.tsx tests/lib/search.test.ts
git commit -m "feat: add local full-text search"
```

---

### Task 17: 设置与数据备份

**Files:**
- Create: `src/features/settings/backup.ts`、`src/features/settings/SettingsPage.tsx`
- Modify: `src/app/router.tsx`
- Test: `tests/features/backup.test.ts`

**Interfaces:**
- Consumes: `db`（Task 9）。
- Produces: `SerializedProgress = Omit<Progress, 'card'> & { card?: Omit<Card, 'due'|'last_review'> & { due: string; last_review?: string } }`；`Backup = { version: 1; exportedAt: string; progress: SerializedProgress[]; notes: Note[]; bookmarks: Bookmark[]; reads: Read[]; settings: Setting[] }`；`exportBackup(): Promise<Backup>`；`importBackup(data: unknown): Promise<void>`；`exportNotesMarkdown(): Promise<string>`。

- [ ] **Step 1: 写失败的备份测试**

```ts
// tests/features/backup.test.ts
test('导出包含全部表并可原样导入', async () => {
  await db.notes.clear();
  await saveNote('kp', 'contract-formation', '笔记');
  const backup = await exportBackup();
  expect(backup.version).toBe(1);
  expect(backup.notes).toHaveLength(1);

  await db.notes.clear();
  await importBackup(backup);
  expect((await getNote('kp', 'contract-formation'))?.content).toBe('笔记');
});

test('导出时 Date 序列化为字符串，导入后恢复为 Date', async () => {
  await db.progress.clear();
  await rateKnowledgePoint('contract-formation', 'good', new Date('2026-11-18T00:00:00.000Z'));
  const backup = await exportBackup();
  expect(typeof backup.progress[0].card!.due).toBe('string');

  await db.progress.clear();
  await importBackup(backup);
  const restored = await db.progress.get('contract-formation');
  expect(restored!.card!.due).toBeInstanceOf(Date);
});

test('笔记可导出 Markdown', async () => {
  await db.notes.clear();
  await saveNote('kp', 'contract-formation', '第一条笔记');
  expect(await exportNotesMarkdown()).toContain('第一条笔记');
});

test('非法备份被拒绝且不清空现有数据', async () => {
  await saveNote('kp', 'contract-formation', '保留');
  await expect(importBackup({ version: 99 })).rejects.toThrow();
  expect((await getNote('kp', 'contract-formation'))?.content).toBe('保留');
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/features/backup.test.ts`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现备份与设置页**

`exportBackup` 读五张表，并把 `Progress.card.due` / `card.last_review` 转成 ISO 字符串（JSON 安全）。`importBackup` 用 Zod 校验 `version === 1` 与各表数组，随后把这两个字段转回 `Date`；校验通过后在一个事务里清空并写入。失败时抛错，不动现有数据。

`exportNotesMarkdown`：每条笔记输出 `## <目标标题>\n\n<内容>\n`，拼接为 Markdown。

`SettingsPage`：深色模式选择；「导出数据」下载 `fajing-backup-<date>.json`；「导出笔记 Markdown」下载 `.md`；「导入数据」文件选择 + 确认；显示「数据只存在本机」说明；清除数据（二次确认）。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- tests/features/backup.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/features/settings tests/features/backup.test.ts
git commit -m "feat: add export import backup"
```

---

### Task 18: 启动脚本与 README

**Files:**
- Create: `启动.bat`、`README.md`
- Test: 手动验证

**Interfaces:**
- Produces: 双击 `启动.bat` 启动本地开发服务器并打开浏览器。

- [ ] **Step 1: 写启动脚本**

```bat
@echo off
cd /d "%~dp0"
if not exist node_modules call npm install
call npm run dev -- --open
```

- [ ] **Step 2: 写 README**

包含：项目是什么、当前主题、如何启动（双击或 `npm run dev`）、如何加内容（`content/themes/...`）、如何更新法条（`npm run content:import`）、数据备份、免责声明。

- [ ] **Step 3: 验证**

Run: `npm run content:validate` → 通过（允许 draft 警告）
Run: `npm run build` → 成功
Expected: 构建产物生成，无报错。

- [ ] **Step 4: 提交**

```bash
git add 启动.bat README.md
git commit -m "docs: add launcher and readme"
```

---

### Task 19: 合同主题内容（6 场景 + 13 知识点）

**Files:**
- Modify/Create: `content/themes/contracts/theme.json`、`content/themes/contracts/scenarios/*.mdx`、`content/themes/contracts/concepts/*.mdx`

**Interfaces:**
- Consumes: 法条库（Task 4）、校验脚本（Task 5）。

场景清单（先给用户确认再动笔）：

1. `contract-formation` 口头说好的事，算数吗？（合同成立与形式）
2. `contract-breach` 对方收了钱不办事，我能怎么办？（违约责任）
3. `contract-deposit` 定金和订金，差一个字差很多（定金规则）
4. `contract-online` 网上买的东西不想要了（电子合同与退货）
5. `contract-lease` 房东不退押金（租赁合同）
6. `contract-loan` 借钱给朋友没写借条（借款合同与证据）

知识点约 13 个：合同成立与生效、合同形式、要约与承诺、格式条款、违约责任、继续履行、赔偿损失、违约金、定金罚则、合同解除、租赁合同、押金、借款合同、诉讼时效（可合并）。

- [ ] **Step 1: 给用户确认 6 个场景标题与一句话描述**

用户确认后固定 id。

- [ ] **Step 2: 写 6 个场景 MDX 与对应知识点 MDX**

每个场景：`hook` 第一人称、`thinkPrompt`、正文分「能不能 / 什么条件 / 怎么办」、至少 1 个 `ArticleRef`、`primaryKpId`；「怎么办」放 `Callout type="tip"`。每个知识点：`oneLiner`、白话解读、法条引用、易混淆点、`reviewPrompt`/`reviewAnswer`。

- [ ] **Step 3: 校验**

Run: `npm run content:validate`
Expected: 0 个法条引用错误；draft 警告可接受。

- [ ] **Step 4: 用户抽查并把通过的内容改为 `checked`**

抽查范围：每篇的法条引用与「怎么办」部分。

- [ ] **Step 5: 提交**

```bash
git add content/themes/contracts
git commit -m "content: add contracts theme"
```

---

### Task 20: 婚姻主题内容（6 场景 + 13 知识点）

**Files:**
- Create: `content/themes/marriage/theme.json`、`scenarios/*.mdx`、`concepts/*.mdx`

场景清单（先确认）：

1. `marriage-property` 结婚前买的房，婚后算谁的？（夫妻财产）
2. `marriage-betrothal-gift` 彩礼能不能要回来？（彩礼返还）
3. `marriage-fault` 对方出轨，离婚能要求赔偿吗？（离婚损害赔偿）
4. `marriage-custody` 离婚时孩子归谁？（子女抚养）
5. `marriage-debt` 婚后一方欠债，另一方要还吗？（夫妻共同债务）
6. `marriage-domestic-violence` 遭遇家暴怎么办？（人身安全保护令）

知识点约 13 个：夫妻共同财产、个人财产、婚前财产、彩礼返还、离婚损害赔偿、子女抚养、抚养费、夫妻共同债务、离婚方式、离婚冷静期、人身安全保护令、家庭暴力证据、继承基础。

- [ ] **Step 1–5: 同 Task 19**

校验命令相同；提交信息 `content: add marriage theme`。

---

### Task 21: 劳动主题内容（6 场景 + 13 知识点）

**Files:**
- Create: `content/themes/labor/theme.json`、`scenarios/*.mdx`、`concepts/*.mdx`

场景清单（先确认）：

1. `labor-probation` 试用期被辞退（试用期与解除）
2. `labor-written-contract` 公司一直不签劳动合同（书面合同与双倍工资）
3. `labor-overtime` 加班费到底怎么算？（工时与加班工资）
4. `labor-wrongful-dismissal` 被违法辞退能拿多少？（经济补偿与赔偿金）
5. `labor-work-injury` 上班受伤算工伤吗？（工伤与社会保险）
6. `labor-arbitration` 和公司谈不拢，怎么申请劳动仲裁？（仲裁程序与时效）

知识点约 13 个：试用期、书面劳动合同、双倍工资、工作时间、加班工资、经济补偿、违法解除赔偿金、工伤认定、社会保险、劳动仲裁、仲裁时效、举证责任、协商解除。

- [ ] **Step 1–5: 同 Task 19**

校验命令相同；提交信息 `content: add labor theme`。

---

### Task 22: 视觉打磨、深色模式与响应式

**Files:**
- Modify: `src/index.css`、`src/app/AppLayout.tsx`、`src/features/**`（布局与间距）
- Test: `tests/app/responsive.test.tsx`（结构断言）

**Interfaces:**
- Consumes: 全部页面。
- Produces: 统一的纸感视觉 token；深浅色；360px 可用。

- [ ] **Step 1: 先调用 frontend-design 技能确定视觉方向与 token**

按设计文档：暖白纸色、墨色正文、宋体标题、朱砂强调、细边框卷宗卡片。把 token 写进 `src/index.css` 的 CSS 变量（`--paper`、`--ink`、`--accent`、`--muted`、`--line` 等），深色模式覆盖同一组变量。

- [ ] **Step 2: 写结构测试**

```tsx
test('场景页在窄屏下主要内容有容器且不固定宽度', () => {
  render(<MemoryRouter><ScenarioPage scenarioId="contract-formation" /></MemoryRouter>);
  expect(document.querySelector('.page-shell')).toBeTruthy();
  expect(document.querySelector('[data-fixed-width="true"]')).toBeNull();
});
```

- [ ] **Step 3: 应用样式并手动检查**

在浏览器中用开发者工具检查 360px、768px、1280px：无横向滚动；导航不换行溢出；法条长段落可读；深色模式下正文对比度足够。

- [ ] **Step 4: 测试与构建**

Run: `npm test && npm run build`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src
git commit -m "style: polish paper aesthetic and responsive layout"
```

---

### Task 23: Playwright 冒烟测试

**Files:**
- Create: `playwright.config.ts`、`tests/e2e/smoke.spec.ts`
- Modify: `package.json`（无需改脚本，`e2e` 已存在）

- [ ] **Step 1: 安装浏览器**

Run: `npx playwright install chromium`

- [ ] **Step 2: 写冒烟测试**

```ts
// tests/e2e/smoke.spec.ts
import { test, expect } from '@playwright/test';

test('从首页学一个场景并进入复习', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /合同/ }).first().click();
  await page.getByRole('link', { name: /口头说好的事/ }).click();
  await page.getByRole('button', { name: /展开答案/ }).click();
  await page.getByRole('button', { name: '大概懂了' }).click();
  await page.getByRole('link', { name: '复习' }).click();
  await expect(page.getByText(/合同成立/)).toBeVisible();
});
```

`playwright.config.ts`：`webServer: { command: 'npm run dev -- --port 5173', url: 'http://localhost:5173', reuseExistingServer: true }`，`use.baseURL` 同上，`testDir: './tests/e2e'`。

- [ ] **Step 3: 运行**

Run: `npx playwright install chromium && npm run e2e`
Expected: 1 passed。

- [ ] **Step 4: 提交**

```bash
git add playwright.config.ts tests/e2e
git commit -m "test: add playwright smoke flow"
```

---

### Task 24: 发布前验收

- [ ] **Step 1: 全量检查**

Run:
```bash
npm run lint
npm test
npm run content:validate -- --strict
npm run build:release
npm run e2e
```
Expected: 全部通过；`content:validate --strict` 0 错误（所有内容 `checked`）。

- [ ] **Step 2: 人工验收清单**

- 首页三个主题均在，且显示已读进度。
- 每个主题 6 个场景可打开、可展开、可自评。
- 每个场景至少 1 条法条引用可展开，法条页显示原文、章节、生效日期、来源。
- 自评后刷新页面，复习页仍显示该知识点。
- 笔记、收藏刷新后仍在；导出 JSON 再导入，数据恢复。
- 360px 宽度无横向滚动。
- 首次访问免责声明出现。
- 断网后重新打开（本地服务仍在运行）页面正常。

- [ ] **Step 3: 更新 README 与提交**

```bash
git add README.md
git commit -m "docs: finalize release checklist"
```
