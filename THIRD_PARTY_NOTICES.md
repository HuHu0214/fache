# 第三方来源与合规说明

## 法律文本

- 法律条文来自 [just-laws](https://github.com/ImCa0/just-laws)，该项目以 MIT License 发布（Copyright © 2022 ImCaO）。
- just-laws 的数据整理自国家法律法规数据库（https://flk.npc.gov.cn/）。
- 本项目仅收录公开法律、决定和决议文本，不收录商业题库、培训机构解析、判例数据库或付费内容。
- 法律、法规、国家机关的决议、决定、命令和其他具有立法、行政、司法性质的文件，不属于《中华人民共和国著作权法》保护的客体；引用时仍保留来源说明。
- 本项目与全国人大、国家法律法规数据库或其他政府机关没有隶属、合作或背书关系。

## 运行时与开源组件

- Electron：MIT License；打包产物内包含 `LICENSE.electron.txt`。
- Chromium：BSD-style 及若干开源许可证；打包产物内包含 `LICENSES.chromium.html`。
- React、React Router、Dexie、MiniSearch、Zod、Tailwind CSS 等依赖按其各自许可证分发，许可证文本可在 `node_modules/<package>/LICENSE` 查看。
- 完整依赖清单见 `package-lock.json`。

## 隐私

- 法条学习阶段、设置、备份数据只写入本机 SQLite 数据库：`%APPDATA%\法册\fache.db`。
- 应用不包含遥测、账号系统、广告或自动上传功能。
- 除用户主动点击外部法条来源链接外，应用不主动向外发送学习数据。
- 桌面安装包未配置代码签名证书；首次运行可能出现 Windows SmartScreen 提示。发布页提供 SHA-256 校验值。

## 内容边界

- 本应用是学习工具，不构成法律意见，也不替代执业律师。
- 法律文本可能因修订、废止或版本差异与最新官方文本不一致；使用前应以国家法律法规数据库和现行有效文本为准。
