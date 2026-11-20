# 法径 · 中国法律主题学习系统 — 设计文档

- 日期：2026-11-18
- 状态：待批准
- 工作名：法径（Fajing），入库名 `fajing` / 目录 `D:\law-learning`

## 1. 背景与意图

用户想按生活主题学习中国法律（合同、婚姻、劳动等），目标不是应试做题，而是**自然地学下去，并沉淀成自己的知识储备**。

用户原话要点：

> 想按主题学，比如合同、婚姻、劳动这些……我也不知道有什么想法，我希望就是很自然的就把法律学下来……好的学习系统框架，前端设计倒是可以借鉴。

因此本系统的第一目标不是「刷题正确率」，而是**降低理解门槛、维持学习兴趣、让学过的内容留下来**。

## 2. 调研结论（GitHub 现状）

已检索 GitHub（法考、法条、民法典、法律学习、topic:law、spaced repetition、learning platform 等关键词）：

- 高星中国法律项目全部是 **AI 法律助手 / 法律大模型**，不是学习产品：
  - PKU-YuanGroup/ChatLaw（⭐7630）
  - pengxiao-song/LaWGPT（⭐6051）
  - lvwzhen/law-cn-ai（⭐4913，Next.js，2023 后停更）
- 法条数据类：RanKKI/LawRefBook（⭐2467，iOS，授权不明）、ImCa0/just-laws（⭐797，MIT，VuePress 2）、cn/constitution（⭐889）
- 法考刷题类：andesiwangzhiyi-alt/fadao、DADA-dcc/fakao-pwa 等，星数低，且题库来自商业机构（竹马/众合），**有版权风险，不可再分发**
- 学习框架可借鉴：lingdojo/kana-dojo（⭐3886，TS，Duolingo 式但克制）、andymatuschak/orbit（⭐1841，TS，SRS 界面）、open-spaced-repetition/ts-fsrs（⭐4141，FSRS 算法）

**结论**：不存在可直接复用的成熟 TS 法律学习系统。复用的是**法条数据**（just-laws，MIT；法律文本本身不受著作权保护）和**学习算法**（ts-fsrs），产品层自建。

## 3. 目标 / 非目标 / 反目标

### 目标

1. 按生活主题学习，入口是真实场景，不是教材目录。
2. 每张场景 3–5 分钟可读完，读完有「原来如此」的获得感。
3. 学过的知识点能复习、能留下，形成个人知识储备（笔记、收藏、掌握度）。
4. 所有法律结论都挂法条原文，可点开核对。
5. 手机和电脑都好用；离线可用；数据只存在本地。

### 非目标

- 不做考试、判分、排行榜、刷题正确率。
- v1 不做用户账号、云端同步、多端实时同步。
- v1 不做 AI（AI 放 v2）。
- 不做判例数据库、律师咨询平台。
- 不追求覆盖全部中国法律，先做透三个主题。

### 反目标（即使功能都实现了也算失败）

- 用起来像网课/题库，有「今天必须完成 20 题」的压力。
- 用户需要先懂法律术语才能进入场景。
- 内容里的法条条号或原文对不上。
- 增加一个场景需要改代码。

## 4. 约束

- 语言：**TypeScript**（strict）。
- 前端：React + Vite，纯静态，可本地运行、可部署到任意静态托管。
- 内容：中文；法条原文来自权威来源。
- 法律文本免责声明必须存在，且不构成法律意见。
- v1 无后端；所有个人数据存 IndexedDB，可导出/导入 JSON。
- 使用场景以**电脑为主**：双击本地启动；手机端只保证能正常阅读，不做 PWA 安装与离线缓存。
- 字体与静态资源必须内置，不依赖 Google Fonts 等外网资源；断网也能用。

## 5. 方案选择

考虑过三种学习形态：

| 方案 | 描述 | 结论 |
|---|---|---|
| **A. 场景 → 制度 → 法条 的知识网** | 主题下是真实场景卡片，展开讲制度，概念可继续点开，法条就近可查 | **采用** |
| B. 课程闯关（Duolingo 式） | 主题拆成有序关卡，逐关解锁，配小测 | 否决：本质仍是课程+做题，与「自然学」冲突 |
| C. 纯知识库/问答（Obsidian 式） | 搜索、记录、收藏，自由漫游 | 部分吸收：只用于笔记与收藏，不作主结构 |

选 A 的理由：法律的天然结构就是「生活问题 → 法律制度 → 法律条文」，按此组织，用户从自己关心的问题进入，不需要预备知识；同时知识点之间可互链，天然形成知识网，满足「知识储备」。

B 的进度感以轻量方式保留（主题进度、复习到期提示），但不做强制顺序和评分。

## 6. 产品设计

### 6.1 信息架构

```
首页
├── 主题卡片：合同 / 婚姻 / 劳动（v1）
│     └── 主题页：简介 + 场景列表 + 进度
│           └── 场景页：学习流程（渐进披露）
│                 ├── 知识点页：白话解读 + 法条 + 易混淆 + 相关概念
│                 │     └── 法条页：原文 + 所属法律/章节 + 生效日期
│                 └── 笔记 / 收藏
├── 复习：今天到期的知识点
├── 搜索：场景 / 知识点 / 法条全文
├── 我的：笔记、收藏、学习统计（温和）、数据导出/导入
```

### 6.2 一次学习流程

1. 打开首页，看到主题和「今天可以看」的场景，没有强制任务。
2. 点进场景，先看到一段生活化的问题（第一人称），例如「公司说我试用期不合格，让我明天不用来了」。
3. **先想一下**：页面提示「你猜公司能不能这么做？」不判分、不记录答案。
4. 点击展开答案：分 2–4 步讲清楚「能不能 / 什么条件 / 怎么办」。
5. 答案中的法律概念是可点击的 `<ConceptLink>`，点开进入知识点页；法条引用 `<ArticleRef>` 展开显示原文。
6. 底部自评：**没懂 / 大概懂了 / 很熟**。自评只作用于本场景的主知识点（`primaryKpId`），其余关联知识点标记为「已接触」、不排复习；在知识点页可以单独自评。
7. 可以随手写笔记、收藏场景或知识点。

设计原则：

- **渐进披露**：默认只显示问题，思考后再展开，避免一上来信息过载。
- **就近可查**：任何法律结论旁边都有法条入口，不需要跳出去搜索。
- **不判分**：自评只影响复习节奏，不形成分数和排名。
- **可漫游**：知识点之间互相链接，允许用户按兴趣走偏，不强制回到主线。
- **短**：单场景阅读时间控制在 3–5 分钟。

### 6.3 复习机制

- 使用 `ts-fsrs`（FSRS 6.x）。
- 每个知识点有作者撰写的 `reviewPrompt`（一句话自问或微型新场景）与 `reviewAnswer`。
- 自评映射：没懂 → `Again`；大概懂了 → `Good`；很熟 → `Easy`。
- 复习不是重复原题，而是**换一个角度再遇到**（由 `reviewPrompt` 提供）。
- 评分粒度：场景页的自评只更新 `primaryKpId`；知识点页有自己的自评控件。只通过 `<ConceptLink>` 到达的知识点，必须在知识点页自评后才进入队列。场景完成的定义 = 已展开答案 + 已自评。
- 首页显示「今天有 N 个知识点到期」，不显示逾期惩罚。
- 连续学习天数只做展示，不做惩罚或排行榜。

### 6.4 笔记与收藏

- 笔记可挂在场景或知识点上，Markdown，自动保存。
- 收藏可标记场景/知识点，形成「我的清单」。
- 笔记与收藏可导出为 Markdown / JSON。

### 6.5 搜索

- 本地全文检索（MiniSearch），范围：场景标题与正文、知识点标题与正文、所收录法律的条文。
- 支持按主题、类型（场景/知识点/法条）过滤。
- 法条搜索结果显示「法律名 + 条号 + 原文片段」，点击直达法条页。

## 7. 内容体系与生产管线

### 7.1 数据模型

```ts
type Theme = {
  id: string;            // "contracts" | "marriage" | "labor"
  title: string;         // "合同"
  intro: string;         // 一句话说明这一主题学什么
  order: number;
};

type Scenario = {
  id: string;
  themeId: string;
  title: string;         // 生活化标题
  hook: string;          // 第一人称问题，1-2 句
  thinkPrompt?: string;  // "你猜……" 引导思考
  body: string;          // MDX
  kpIds: string[];       // 涉及知识点
  primaryKpId: string;   // 本场景的主知识点，场景末尾自评作用于它
  articleRefs: ArticleRef[];
  estimatedMinutes: number;
  reviewStatus: 'draft' | 'checked';   // 用户抽查后置为 checked
};

type KnowledgePoint = {
  id: string;
  themeId: string;
  title: string;
  oneLiner: string;      // 一句话讲清楚
  body: string;          // MDX 白话解读
  articleRefs: ArticleRef[];
  relatedKpIds: string[];
  confusions: string[];  // 易混淆点
  reviewPrompt: string;
  reviewAnswer: string;
  reviewStatus: 'draft' | 'checked';   // 用户抽查后置为 checked
};

type ArticleRef = {
  lawId: string;         // "civil-code"
  articleNo: string;     // "第五百六十三条"
};

type Law = {
  id: string;
  title: string;         // "中华人民共和国民法典"
  shortTitle: string;
  effectiveAt: string;
  sourceUrl: string;
  chapters: { path: string[]; articleNos: string[] }[];
};

type LawArticle = {
  lawId: string;
  articleNo: string;
  text: string;          // 原文，逐字
  path: string[];        // ["第三编 合同", "第一分编 通则", ...]
};
```

用户数据（IndexedDB）：

```ts
type Progress = {
  kpId: string;
  state: 'new' | 'learning' | 'review';
  due?: string;
  stability?: number;
  difficulty?: number;
  lastRating?: 'again' | 'good' | 'easy';
  updatedAt: string;
};

type Note = {
  id: string;
  targetType: 'scenario' | 'kp';
  targetId: string;
  content: string;       // Markdown
  updatedAt: string;
};

type Bookmark = { targetType: 'scenario' | 'kp'; targetId: string; createdAt: string };
type Settings = { theme?: 'light' | 'dark' | 'system'; disclaimerAcceptedAt?: string };
```

### 7.2 内容目录

```
content/
├── laws/                    # 生成物，提交进仓库
│   ├── civil-code.json
│   ├── labor-contract-law.json
│   └── ...
└── themes/
    ├── contracts/
    │   ├── theme.json
    │   ├── scenarios/
    │   │   └── 01-....mdx
    │   └── concepts/
    │       └── ....mdx
    ├── marriage/
    └── labor/
```

MDX frontmatter 由 Zod schema 校验，正文可使用自定义组件：

- `<ConceptLink id="contract-formation">订立合同</ConceptLink>`
- `<ArticleRef law="civil-code" no="第四百六十九条" />`
- `<Callout type="warning">…</Callout>`
- `<Steps>` / `<Step>` 用于「能不能 / 什么条件 / 怎么办」的分步讲解
- `<Reveal>` 用于渐进披露（默认折叠，点击展开）

### 7.3 法条导入

- 数据来源：**国家法律法规数据库 flk.npc.gov.cn** 的现行有效版本；v1 以 just-laws（MIT）仓库中已整理的 Markdown 为抓取起点。
- 已知格式：`**第四百六十三条**　条文内容`，段间空行；文件按编/章组织，标题为 `#`/`##`/`###`。
- 脚本 `scripts/import-laws.ts`：拉取 just-laws 仓库压缩包（GitHub codeload），解析 Markdown，输出标准 `Law` + `LawArticle` JSON，并记录来源 URL 与导入日期。
- 解析规则需写单元测试（条号识别、跨段条文合并、章节归属）。
- 法条文本只做去空白归一化，**不得改写**。

v1 收录范围（只收与三个主题相关的法律，避免体积和校验范围失控）：

| 主题 | 法律 |
|---|---|
| 合同 | 民法典（总则编、合同编）、消费者权益保护法、电子商务法 |
| 婚姻 | 民法典（婚姻家庭编、继承编）、反家庭暴力法 |
| 劳动 | 劳动法、劳动合同法、劳动争议调解仲裁法、社会保险法、工伤保险条例 |

- 该清单是 v1 起点，不是上限。若某个「怎么办」步骤需要程序法（如民事诉讼法、仲裁法、证据规定），把该法律加入库并补引用；不为省事而写无法条支撑的结论。
- 每部法律记录：来源 URL、导入日期、条文数量、与官方库核对日期。v1 以 just-laws（MIT）作为导入起点；若某部法律缺失或与 flk.npc.gov.cn 官方版本不一致，以官方版本为准，手工修正并在 JSON 中注明差异。

### 7.4 内容校验（构建时强制）

`scripts/validate-content.ts` 必须检查：

1. 所有 frontmatter 通过 Zod 校验，id 全局唯一。
2. 每个 `ArticleRef` 的 `lawId` 存在、`articleNo` 在该法律中存在。
3. 若正文引用了法条原文（`<Quote>`），归一化后必须与法条库文本一致，否则报错。
4. `kpIds`、`relatedKpIds` 指向存在的知识点。
5. 每个知识点都有 `reviewPrompt` 和 `reviewAnswer`。
6. 主题下的场景顺序有 `order`，无重复。
7. 发布构建要求所有场景与知识点的 `reviewStatus` 均为 `checked`；开发模式可放宽为警告。

校验失败必须让 `npm run build` 失败。这是防止内容编造法条的核心闸门。

### 7.5 内容编写规范

- 场景必须来自真实生活，第一人称，避免法条腔。
- 解释分三层：**结论 → 条件 → 怎么办**。
- 每个法律结论必须能落到至少一条法条；没有条文支撑的结论不写。操作性步骤可以写，但必须放在 `Callout type="tip"` 里标为「实务提示」，不能在缺少条文时伪装成法律结论。
- 区分「法律规定」与「实务提示」；实务提示用 `Callout` 标明。
- 不写「一定能赢/一定赔多少」这类承诺。
- 写作采取**保守策略**：以法条原文的白话转述为主，不对结果作绝对预测；「怎么办」统一放实务提示，不冒充法律结论。
- AI 起草的内容默认 `reviewStatus: draft`；你抽查通过后改为 `checked`。抽查范围至少覆盖每个场景的法条引用与「怎么办」部分。
- 每篇内容末尾显示所引法条列表与免责声明。

### 7.6 内容量与批次

v1：三个主题 × 各 6 个场景、共约 40 个知识点，覆盖各主题最常见的问题。

内容由 AI 辅助起草、逐条对照法条校对。**法条原文以导入库为准，解释文字必须人工复核。**

采纳的复核标准（用户已确认）：**保守写作、用户抽查**。不追求内容覆盖面的胆量，宁可少下一个结论；每个主题的 6 个生活问题（场景清单）在动笔前先给你确认；确认后内容 id 与文件结构随之固定，后续增补不改 id。发布前所有内容必须为 `checked`。

## 8. 技术架构

### 8.1 技术栈

| 层 | 选型 |
|---|---|
| 构建 | Vite |
| 框架 | React 19 + TypeScript（strict） |
| 路由 | React Router |
| 样式 | Tailwind CSS v4 + shadcn/ui（Radix） |
| 内容 | MDX（`@mdx-js/rollup`）+ Zod |
| 状态 | Zustand（UI 状态） |
| 持久化 | Dexie（IndexedDB） |
| 搜索 | MiniSearch（构建时生成索引） |
| 复习 | ts-fsrs 6.x |
| 测试 | Vitest + Testing Library；关键流程 Playwright |
| 规范 | ESLint + Prettier |

### 8.2 目录结构

```
law-learning/
├── content/                  # 法条 JSON + 主题 MDX
├── scripts/
│   ├── import-laws.ts
│   ├── validate-content.ts
│   └── build-search-index.ts
├── src/
│   ├── app/                  # 路由、布局、全局样式
│   ├── components/           # UI 与 MDX 组件
│   ├── features/
│   │   ├── learning/         # 场景流、渐进披露
│   │   ├── review/           # FSRS 队列
│   │   ├── notes/
│   │   ├── search/
│   │   └── settings/
│   ├── content/              # 内容加载与类型
│   ├── lib/                  # db、fsrs、搜索索引
│   └── main.tsx
├── tests/
└── docs/
```

### 8.3 数据流

```
内容文件 ──构建时──> 校验 ──> 静态 JSON/MDX 模块 + 搜索索引
                                      │
浏览器 ──> 内容加载 ──> React 页面
                │
                └──> 用户操作 ──> Zustand ──> Dexie（IndexedDB）
                                      │
                                      └──> 导出/导入 JSON
```

无服务端请求；内容随构建产物发布。

### 8.4 部署

- `npm run build` 输出纯静态文件，可本地打开（需支持 SPA 路由的托管，如 Vercel/Netlify/GitHub Pages）。
- 提供 `npm run preview` 与一个 Windows 双击启动脚本（与用户现有项目习惯一致）。
- **不做 PWA / Service Worker**：本地静态服务 + 内置资源即可断网使用；手机端仅做可读性适配。

## 9. 视觉方向

- 关键词：**纸感、克制、可信**；不做游戏化，不做霓虹渐变。
- 暖白纸色背景 + 墨色正文，标题用宋体（思源宋体 / Noto Serif SC），正文用黑体或系统字体。
- 强调色取朱砂红（法条、关键结论），辅助色低饱和。
- 场景卡像「卷宗卡片」：细边框、轻微纸纹、编号。
- 法条原文用带引号样式的块，显示法律名 + 条号 + 生效日期。
- 支持浅色/深色；手机端单列，阅读宽度约 65–75 字符。
- 可借鉴 kana-dojo 的节奏与留白、orbit 的复习界面、law-cn-ai 的法条引用排版。

## 10. 法律准确性与免责

- 首次打开显示免责声明：内容仅供学习，不构成法律意见；具体案件请咨询执业律师。
- 所有法条原文来自官方数据库导入，页面标注来源与生效日期。
- 页面区分「法条原文」与「白话解读」，解读必须可回溯到条文。
- 内容校验脚本阻止无法条依据的引用。
- 法律更新时，通过重新导入 + 校验发现失效引用。

## 11. 里程碑

| 阶段 | 内容 | 验收 |
|---|---|---|
| M0 | 项目脚手架、数据模型、法条导入与校验脚本 | 导入 5 部法律，校验通过；单元测试覆盖解析 |
| M1 | 主题/场景/知识点/法条页面 + 渐进披露 + 笔记 | 三个示例场景可完整学完；法条可就近展开 |
| M2 | FSRS 复习队列、进度、收藏 | 自评后能按到期时间出现；刷新不丢 |
| M3 | 搜索、导出/导入、深色模式、桌面双击启动脚本、手机端可读性检查 | 桌面双击能用；手机宽度可读；搜索命中三类内容 |
| M4 | 三主题各 6 场景 + 40 知识点内容补齐 | 内容校验全部通过 |
| v2 | AI 助手（解释/追问，必须带法条引用） | 不自由发挥，引用可点开 |

## 12. 留给实现者的决定

- 路由库具体版本与文件路由 vs 配置路由。
- MDX 在构建时预编译为组件，还是运行时加载。
- 搜索索引的字段权重与中文分词策略（MiniSearch 需要中文 tokenizer 配置）。
- 具体视觉 token（字体、间距、圆角）。
- 是否在 v1 收录司法解释（当前只收法律与行政法规）。

## 13. 验收标准

1. `npm run dev` 可启动；`npm run build` 通过且包含内容校验。
2. 三个主题、18 个场景、约 40 个知识点，全部通过校验。
3. 每个场景都能完成「问题 → 思考 → 展开 → 概念 → 法条 → 自评」闭环。
4. 法条页显示原文、所属章节、生效日期与来源。
5. 复习队列按 FSRS 到期时间工作，刷新和重启后进度保留。
6. 笔记、收藏可写入、可导出、可导入。
7. 360px 宽度下无横向滚动，主要操作可单手完成（手机端只做可读性，不追求完整体验）。
8. 首访免责声明可见。
9. 发布构建中所有内容均为 `reviewStatus: checked`。

## 附：2026-11-20 变更记录

用户要求首页改为多邻国式通关航线，并加强动效与科技感。以下覆盖本文档对应表述：

- 首页由主题卡片改为一条主航线（合同 → 婚姻 → 劳动），按顺序通关；「完成」= 展开答案 + 已自评。每章 12 个场景全部通关后解锁章节 Boss，通过 Boss 才能进入下一章。主题页仍可自由访问全部场景和知识点。
- 内容扩展到 36 个场景、56 个知识点、3 个 Boss 关（每关 6 道原创选择题）；题目按法考考点原创，法条引用公开法条库，不复制商业题库。
- 新增每日宝箱（每日一次，20–30 阅历，可能掉落断签护符）、连续打卡每日阅历递增、断签保护、粒子爆发、通关/开箱/升级音效；设置页可关闭音效。
- 全站视觉从纸感改为「法条终端 Legal HUD」：黑曜石底、青色数据高亮、琥珀警示色、等宽数据标签、切角面板、网格与扫描线。默认深色，保留浅色「白昼终端」模式。
- 新增动效：开机加载、节点脉冲/完成弹跳、航线扫描、页面切换、等级提升、通关提示。
- 视觉与首页结构以用户 2026-11-20 的明确要求为准。
