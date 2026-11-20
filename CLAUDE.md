# 法册 (Fajing)

中国法条学习工具。直接读法条，每条独立标记，按艾宾浩斯阶段安排加深；React 19 + Vite + TypeScript，本地优先，无后端。法律库收录 308 部法律、24,470 条条文。

## 先读这 10 条

1. 改 UI 前读 `src/index.css` 的 token 和 `src/components/ui` 的组件；不要新造颜色、圆角、间距。
2. 一个视图只保留一个主按钮；危险操作才用 `danger`。
3. 法条学习的基本单位是单条法条：统一用 `ArticleStudyControl` / `ArticleStudyRow`，不要另写一套勾选。
4. 文案只保留页面标题与关键键值对；低频说明放 tooltip，免责声明放首次 Dialog 与页脚；不写营销语、口语和装饰性句子。
5. 间距取 4 的倍数（4/8/12/16/24/32/48/64）；嵌套容器等距内缩；优先用 `gap` 而不是零散 margin。
6. 圆角由 `--radius-*` 管理；公告方向为 0；引入圆角时用连续圆角并保留普通圆角回退。
7. 学习阶段只走 `src/lib/ebbinghaus.ts`；间隔固定为 1/2/4/7/15/30/60 天，不要在组件里另算。
8. 不复制商业题库（竹马/众合等）的题目或解析；法条引用公开法条库。
9. 本地数据在 IndexedDB；新增字段必须同步 `LawProgress`、备份 schema 和导入测试。
10. 完成前跑：`npm run lint && npm test && npm run build && npm run e2e`。

## 命令

```bash
npm run dev              # Vite + 内容校验
npm run build            # tsc + 内容校验 + 构建
npm run build:release    # 额外要求全部 reviewStatus: checked
npm test                 # Vitest，先跑 content:text
npm run e2e              # Playwright，复用 5173 端口
npm run desktop:dev      # Electron + Vite
npm run desktop:build    # Windows NSIS 安装包
npm run desktop:unpack   # 免安装目录，用于验收
npm run lint
npm run content:validate # 法条引用闸门；--strict 检查 draft
npm run content:import   # 下载 just-laws 并全量导入法条库
npm run content:index    # 生成 src/generated/law-index.ts
npm run content:text     # 生成 MDX 正文检索文本
```

Windows 双击 `启动.bat`。

## 文件地图

| 路径 | 职责 |
|---|---|
| `src/content/registry.ts` | 法律元数据与按需条文加载 |
| `scripts/import-all-laws.ts` | just-laws → 全部 `content/laws/*.json` |
| `scripts/build-law-index.ts` | 生成法律目录元数据，供首屏与搜索使用 |
| `src/generated/law-index.ts` | 自动生成；不要手改 |
| `src/lib/ebbinghaus.ts` | 阶段定义、到期曲线、统计 |
| `src/lib/db.ts` | Dexie 表、`LawProgress` 与 `Setting` 类型 |
| `src/features/laws/law-progress-repo.ts` | 标记 / 批量标记 / live query |
| `src/features/laws/ArticleStudyControl.tsx` | 单条法条勾选与加深 |
| `src/features/laws/ArticleStudyRow.tsx` | 条号、阶段、正文、勾选 |
| `src/features/laws/StudyPage.tsx` | 随机 / 整部 / 到期学习台 |
| `src/features/home/HomePage.tsx` | 三栏艾宾浩斯看板 |
| `src/lib/sqlite-sync.ts` | SQLite 快照 <-> IndexedDB 缓存同步 |
| `electron/main.cjs` | Electron 主进程、窗口、IPC、缩放 |
| `electron/database.cjs` | SQLite schema 与快照读写 |
| `electron/preload.cjs` | 受限 contextBridge |
| `src/components/DesktopZoom.tsx` | 自定义界面缩放 |
| `src/components/ui/` | 基础组件 |
| `src/index.css` | Design Token 与全局样式 |
| `content/themes/`、`content/bosses/` | 旧场景内容，UI 已退役；保留数据与校验 |
| `docs/desktop.md` | 桌面架构、数据库表、发布检查 |

## 设计系统

### 令牌

颜色、圆角、间距都在 `src/index.css`。只读语义令牌，不写死 hex：

```css
--paper --card --ink --muted --line
--accent --accent-soft --pink --pink-soft --danger --danger-soft
--yellow --notice-bg --shadow --band-bg --band-fg
--radius-card --radius-control --radius-sm..xl
--space-1..8  /* 4/8/12/16/24/32/48/64 */
```

表面模式由 `AppLayout` 决定：

- `surface-notice`：首页、法律库、设置。黄底、3px 黑边、硬投影。
- `surface-reading`：`/law`、`/study`。纸白底、2px 黑边、轻投影。

颜色语义固定：黄=信息底，蓝=流程/主行动，品红=当前/注意，红=时限/危险，黑=结构与正文。不要把颜色当装饰。

### 组件语义（Do / Don't）

| 组件 | Do | Don't |
|---|---|---|
| Button primary | 页面唯一主行动 | 导航、搜索、设置、并列多个主按钮 |
| Button outline | 查看原文、返回、次级操作 | 替代主行动 |
| Button ghost | 稍后、跳过、展开 | 提交、删除 |
| Button danger | 清除数据、放弃未保存 | 收藏、取消 |
| ArticleStudyControl | 单条标记与再次加深 | 用一个按钮切换“取消学习” |
| ArticleStudyRow | 条号、阶段、到期、正文 | 把正文折叠起来再让用户点开 |
| Card (`hud-panel`) | 需要独立区分的块 | 每个区块都套卡片，失去层级 |
| Badge | 状态、条号、计数 | 承载行动 |
| Progress | 数据展示，不可点击 | 当按钮 |
| Tooltip | 护符规则、奖励概率、字段解释 | 必读免责声明、关键步骤 |
| Dialog | 首次免责、破坏性确认 | 日常阅读内容 |

组件从 `src/components/ui` 取；不要用原生 `<button>` 重新拼一套。样式用 `cn()` 合并，避免互相覆盖。

### 圆角与内缩

- 使用 `--radius-card` / `--radius-control`，不写任意 `rounded-[7px]`。
- 当前公告方向：0 圆角。需要圆角时集中改 `--radius-card` 与 `--radius-control`。
- 引入圆角的表面，优先连续圆角：
  ```css
  border-radius: 12px;
  corner-shape: squircle; /* 不支持时回退普通圆角 */
  ```
- 嵌套容器等距内缩：父卡 padding 16，子卡四边再内缩 8/12/16，不用“上 20 下 12”。

### 文案与披露层级

先确定页面定位，再写文案。保留：页面标题、关键键值对、行动动词。移除：解释性长句、口语、营销词、重复提示。

| 当前/禁止 | 建议 |
|---|---|
| 今天学点什么 | 今日加深 |
| 去主题里逛逛 | 暂无到期法条。 |
| 掉落护符 | 获得护符 |
| 继续学习 → | 继续研读 |
| 复习 | 到期加深 |
| 没懂 / 大概懂了 / 很熟 | 第 N 阶 / 已学 N 次 |

披露层级：

1. 常驻：页面标题、关键值、唯一主行动。
2. Tooltip：规则、概率、字段解释、低频操作说明。
3. Dialog：首次免责、破坏性确认。
4. Alert/Callout：时限、不可逆风险、法律后果。
5. 页脚：免责声明与数据存储说明。

## 法条学习

- 顶层页面只有：`/` 看板、`/laws` 法律库、`/law/:lawId` 全文、`/law/:lawId/:articleNo` 单条、`/study` 学习台、`/settings`。复习、笔记、独立搜索不再有路由。
- 首页三栏：左 = 有进度的法律（只展示 `learned > 0`）；中 = 总览、学习曲线、宝箱、连续、成就；右 = 今日到期与阶段看板。
- `/law/:lawId` 全文直读，左侧目录折叠到条号；每条用 `ArticleStudyRow`。
- 学习阶段只由 `advanceLawProgress` 计算：首次第 1 阶，重复学习推进到最多第 7 阶；批量标记只补未学，不推进已学。
- 随机学习边界：法律数 1–5，每部条数 1–10；不足时取可用上限并提示；仅未学模式下排除已学完法律。
- 整部学习：选择法律后展开全文，可逐条标记或批量标记未学；批量前必须显示确认。
- 到期学习最多展示 30 条，避免一次性铺满；标记后 live query 自动移出。
- 搜索并入 `/laws`：名称过滤即时生效，全文索引在输入 ≥2 字符时异步建立。
- articleNo 支持 `第一百三十三条之一`；排序键是条号 × 1000 + 之N。

## 状态与持久化

- Dexie 表：`lawProgress`、`settings`；旧表 `progress`、`notes`、`bookmarks`、`reads` 仅保留兼容与备份。
- `lawProgress` 字段：`id`、`lawId`、`articleNo`、`stage`、`learnCount`、`firstLearnedAt`、`lastStudiedAt`、`nextDueAt`、`studyDays`。
- 连续打卡从 `studyDays` 取并集，不依赖旧 `reads`。
- 奖励、护符、冻结日期在 `settings` 的 `app` 记录里。
- 新增字段必须同步：`LawProgress` 类型、`backupSchema`、导出/导入往返测试。
- 桌面版 SQLite：`%APPDATA%\法册\fache.db`，表 `law_progress`、`settings`、`legacy_records`、`meta`；主进程用 `node:sqlite`，渲染层 IndexedDB 只是响应式缓存。
- 所有会改变学习数据的写入，落库后调用 `scheduleSqliteSave()`；新增写入点必须补上。
- 桌面端 `contextIsolation`、`sandbox` 开启，`nodeIntegration` 关闭；preload 只暴露 storage/zoom/info。
- 缩放控件只用 `DesktopZoom`（80%–150%），不要恢复系统菜单或原生缩放 UI。
- 没有账号后端；跨设备同步不在当前范围。

## 测试与坑

- Vitest：`npm test`；Playwright：`npm run e2e`（先有 dev server 或让配置自动启动）。
- 内容改动会影响 `content:text` 生成的检索文本；不要手改 `src/generated/body-text.ts`。
- `import.meta.glob` 的 `?raw` 在 Vitest 下可能返回懒加载器，所以正文检索文本走生成文件。
- TypeScript 6 不支持 `baseUrl`；路径别名用 `./src/*`。
- 发布前必须看到：lint 0 错、test 全绿、build 成功、e2e 通过。

## 改 UI 的检查单

- [ ] 新颜色是否来自 token？
- [ ] 是否只有一个主按钮？
- [ ] 新法条是否用 `ArticleStudyRow`，且正文默认可见？
- [ ] 阶段推进是否只调用 `advanceLawProgress`，间隔未另写？
- [ ] 随机/整部/批量是否处理数量上限、不足、已学完？
- [ ] 首页左栏是否只展示有进度的法律？
- [ ] 间距是否 4 的倍数、嵌套是否等距？
- [ ] 圆角是否使用 `--radius-*`？
- [ ] 低频说明是否折叠为 tooltip/alert？
- [ ] 360px 是否无横向滚动？
- [ ] 阅读页是否仍保持纸白降强度？
- [ ] 桌面端新增写入是否调用 `scheduleSqliteSave()`？
- [ ] 缩放/窗口控件是否仍使用自定义设计控件？
- [ ] 安装包是否重新验证启动、SQLite 恢复与卸载数据保留？
