# 法径

一个按生活主题学习中国法律的本地 Web 应用。不做题、不考试，从真实场景进入，读完能落到法条原文，学过的内容用 FSRS 间隔复习留下来。

## 当前主题

- 合同
- 婚姻（内容筹备中）
- 劳动（内容筹备中）

## 启动

双击 `启动.bat`，或：

```bash
npm install
npm run dev
```

浏览器打开终端里显示的地址（默认 http://localhost:5173）。

## 怎么用

1. 首页选一个主题。
2. 点开一个场景，先看问题，自己想一想，再展开答案。
3. 正文里的概念可以继续点开，法条可就地展开看原文。
4. 底部自评「没懂 / 大概懂了 / 很熟」，知识点进入复习队列。
5. 复习页按到期时间出现，用自己的话回忆，再对答案。
6. 场景和知识点都可以写笔记、收藏；设置页能导出备份。

## 加内容

内容在 `content/themes/<主题>/` 下：

- `theme.json`：主题信息
- `scenarios/*.mdx`：场景，frontmatter 里声明 `kpIds`、`primaryKpId`、`articleRefs`
- `concepts/*.mdx`：知识点，必须写 `reviewPrompt` 和 `reviewAnswer`

MDX 里可用：

```mdx
<ArticleRef law="civil-code" no="第四百六十九条" />
<ConceptLink id="contract-form">合同的形式</ConceptLink>
<Callout type="tip">实务提示</Callout>
<Steps><Step title="第一步">…</Step></Steps>
```

改完运行：

```bash
npm run content:validate
```

法条条号不存在、引用了不存在的知识点、场景漏了主知识点，都会报错。发布构建（`npm run build:release`）还要求所有内容 `reviewStatus: checked`。

## 更新法条

法条库在 `content/laws/*.json`，由脚本从 [just-laws](https://github.com/ImCa0/just-laws) 导入（该仓库数据来自国家法律法规数据库）：

```bash
npm run content:import
```

导入后重新运行内容校验，失效的法条引用会被指出来。

## 数据备份

学习进度、笔记、收藏只存在浏览器的 IndexedDB 里。设置页可以：

- 导出完整数据（JSON）
- 导出笔记（Markdown）
- 导入备份（会覆盖当前数据）
- 清除全部数据

## 技术栈

React 19、Vite、TypeScript、Tailwind CSS 4、React Router 7、Zod、Dexie、MiniSearch、ts-fsrs、Vitest、Playwright。

## 免责声明

内容仅供学习，不构成法律意见。具体案件请咨询执业律师。法条原文来自国家法律法规数据库，解释文字仅供参考。
