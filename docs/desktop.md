# 桌面版与 SQLite 持久化

## 架构

```text
React 渲染层（Chromium）
  │  Dexie 响应式缓存（useLiveQuery，保证界面即时刷新）
  ▼
preload.cjs（contextBridge，只暴露 storage / zoom / info）
  │  IPC
  ▼
Electron 主进程（main.cjs）
  │  node:sqlite（Electron 内置 Node 24）
  ▼
%APPDATA%\法册\fache.db
```

SQLite 是权威存储。启动时主进程读取快照，渲染层用它重建 IndexedDB 缓存后再挂载 React；
每次学习、宝箱、护符、设置导入/清除后，缓存变更会异步回写 SQLite。浏览器开发模式没有
Electron 桥时，继续使用 IndexedDB，因此 `npm run dev` 和 Vitest 不需要启动桌面端。

## 数据库

文件：`%APPDATA%\法册\fache.db`（WAL 模式）。

| 表 | 字段 | 说明 |
|---|---|---|
| `law_progress` | `id` PK, `law_id`, `article_no`, `stage`, `learn_count`, `first_learned_at`, `last_studied_at`, `next_due_at`, `study_days` JSON | 每条法条的艾宾浩斯状态 |
| `settings` | `id` PK, `data` JSON | 宝箱、护符、冻结日期等设置 |
| `legacy_records` | `table_name`, `record_id`, `data` JSON | 旧场景/笔记/收藏/阅读数据，兼容旧备份 |
| `meta` | `key`, `value` | schema 版本与最后更新时间 |

`law_progress` 对 `law_id` 与 `next_due_at` 建索引，首页到期查询和单法进度查询不需要扫全表。
保存采用事务：清空后重建快照；单机数据量小，写入稳定且逻辑简单。索引库、法律正文不进入
SQLite，它们是只读内容包，随应用发布。

## 安全边界

- `contextIsolation: true`、`nodeIntegration: false`、`sandbox: true`。
- preload 只暴露 `storage.load/save/clear`、`zoom.set`、`info`，不暴露 Node API。
- 生产构建关闭 DevTools；应用菜单被移除，窗口不显示控制台。
- 外部链接（国家法律法规数据库等）交系统浏览器打开。
- 权限请求（摄像头、麦克风、定位等）默认拒绝。
- 无遥测、无账号、无自动上传。

## 缩放

顶部工具栏的 `− / 100% / +` 是自定义控件，调用 `webContents.setZoomFactor`，范围
80%–150%，主题、边框、字号与页面共用 Design Token。不使用 Electron 默认菜单或浏览器原生缩放 UI。

## 构建与发布

```bash
npm run desktop:dev    # Vite + Electron 开发
npm run desktop:build  # 生产构建 + Windows NSIS 安装包
```

产物：

- `release/Fache-Setup-1.0.0.exe`：Windows 10/11 x64 安装包，按用户安装，默认不需要管理员权限。
- `release/win-unpacked/`：免安装目录，用于本地验收。

安装包未做代码签名。首次运行 Windows 可能显示 SmartScreen 提示；发布页同时提供 SHA-256。
卸载默认保留 `%APPDATA%\法册\fache.db`，避免误删学习数据；如需彻底清理，手动删除该目录。

## 发布检查

1. `npm run lint && npm test && npm run build && npm run e2e`
2. `npm run desktop:build`
3. 启动 `release/win-unpacked/法册.exe`，确认标题、缩放、法律库、标记、重启恢复。
4. 计算安装包 SHA-256，写入 Release Notes。
5. 上传安装包、blockmap、Release Notes；源码提交到 GitHub。
