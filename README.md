# 法册

一个本地优先的中国法条学习工具。不做题、不考试，直接读法条；每条法条可以独立标记已学，按艾宾浩斯阶段安排下次加深，首页用看板展示进度、到期负荷和学习曲线。

提供 Windows x64 桌面版（Electron / Chromium 内核），安装即用；学习数据保存在本机 SQLite。

## 收录内容

- 308 部法律，24,470 条条文，来自 [just-laws](https://github.com/ImCa0/just-laws)（数据源为国家法律法规数据库）。
- 按宪法、宪法相关法、民法商法、行政法、经济法、社会法、刑法、诉讼与非诉讼程序法、生态环境法分类。
- 其余 8 个只有决议/决定正文、没有条号的文件未收录。

## 启动

桌面版：从 [GitHub Releases](https://github.com/HuHu0214/fache/releases/latest) 下载 `Fache-Setup-1.0.0.exe`，双击安装，不需要 Node.js。

源码仓库：https://github.com/HuHu0214/fache

开发模式：

```bash
npm install
npm run desktop:dev   # Electron + Vite
npm run dev           # 仅浏览器
```

浏览器打开终端里显示的地址（默认 http://localhost:5173）。

桌面安装包构建：

```bash
npm run desktop:build
# 产物：release/Fache-Setup-1.0.0.exe
```

## 怎么用

1. 首页是艾宾浩斯看板：左侧只列出有学习记录的法律和进度条；右侧是今日到期和阶段分布；中间是总览、学习曲线、每日宝箱、连续打卡和成就。
2. 顶部「法律」进入法律库。搜索框同时检索法律名称和法条全文；全文索引在首次输入两个及以上字符时建立。
3. 打开任意法律，左侧目录按章折叠；每条法条左侧有勾选框。第一次勾选进入第 1 阶，之后再次勾选会逐阶加深。
4. 阶段间隔为 1 / 2 / 4 / 7 / 15 / 30 / 60 天；每次加深都会重新安排下次到期日，首页「今日加深」会列出到期条文。
5. 首页「随机抽条」可以选择抽几部法律、每部抽几条，默认只抽未学法条；数量不足时自动按可用上限处理。
6. 「整部法律」选择一部法律后展开全部条文，可以逐条标记，也可以用「标记全部未学」批量进入第 1 阶。
7. 「到期加深」汇总所有到期法条，每次最多显示 30 条，避免一次铺满。
8. 每日宝箱、连续打卡、断签护符、等级和成就都保留在首页；设置只保留外观、音效和卷宗管理。

复习、笔记、独立搜索页已下线；搜索并入法律库，学习记录全部围绕法条本身。

## 数据持久化

桌面版使用 SQLite 作为权威存储，数据库位于：

```text
%APPDATA%\法册\fache.db
```

Electron 主进程通过内置 `node:sqlite` 读写，渲染层使用 IndexedDB 作为响应式缓存；学习、宝箱、护符、导入/清除都会回写 SQLite。浏览器开发模式没有 Electron 桥时继续使用 IndexedDB。

设置页导出的 JSON 包含法条学习阶段、学习次数、下次到期日、学习日期、宝箱奖励、断签护符及旧数据，导入后会恢复。无账号、无遥测、无自动上传。

如果需要跨设备同步，需要另外加后端（用户体系 + 数据库 + 同步协议），当前版本不包含。桌面端架构与数据库表见 [`docs/desktop.md`](docs/desktop.md)。

## 更新法条

法条库在 `content/laws/*.json`，由脚本从 just-laws 全量导入：

```bash
npm run content:import   # 下载并导入全部法律条文
npm run content:index    # 生成法律目录元数据
```

`npm run content:import` 会下载 just-laws 的 tarball，导入全部含条文的法律，并跳过仅有决议、决定标题而没有条号的文件。学习内容直接引用的 7 部核心法律会随首屏加载；其余法律按需加载，避免首屏变慢。

导入后运行内容校验：

```bash
npm run content:validate
```

## 界面

采用「公告 × 法律图解」：首页、法律库、设置使用公告栏风格；法律阅读和学习台使用纸白阅读模式。颜色语义固定：黄 = 信息底，蓝 = 流程与主行动，品红 = 当前与注意，红 = 时限与危险。所有组件共享同一套颜色、圆角、间距和字号令牌。

## 技术栈

React 19、Vite、TypeScript、Tailwind CSS 4、React Router 7、Zod、Dexie、MiniSearch、Electron、SQLite、Vitest、Playwright。

## 合规与许可

- 源码：[MIT License](LICENSE)。
- 法律文本来源：[just-laws](https://github.com/ImCa0/just-laws)（MIT），其数据整理自国家法律法规数据库。
- 不含商业题库、培训机构解析或付费内容。
- 与政府机关无隶属或背书关系。
- 第三方组件与隐私说明见 [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)。

## 免责声明

内容仅供学习，不构成法律意见。具体案件请咨询执业律师。法条原文来自国家法律法规数据库，解释文字仅供参考。
