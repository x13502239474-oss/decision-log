# 个人决策日志 · Decision Capsule

> 记录当下的判断，封存当时的理由，在未来验证自己的判断。

这不是日记，也不是待办清单。它是一封封寄给未来自己的信：做决定时把情境、备选方案、最终选择和理由封存起来，到达回访日期后，先独立写下实际结果，再拆开当时的判断，对照两者，留下经验。

核心目的只有一个：**对抗事后归因偏差**。人很容易在结果出现后重新解释自己当初的想法，所以本应用把「先盲写结果、后展示理由」做成不可跳过的机制，而不是一个可以省掉的交互步骤。

---

## 一、项目介绍

- **首页默认展示待回访的信封墙**，不是统计仪表盘。让用户第一眼看到「等待拆封的信」，把回访变成核心动作。
- 首页分四个区：已到期（暖金 + 呼吸光 + 轻微浮动）、即将到期（7 天内）、未来的信、已拆封的档案。
- **三段式新建流程**：记录情境 → 记录选择与理由 → 信心与回访日期，最后播放约 2.3 秒的封存仪式（卡片收进信封 → 封口 → 邮戳 → 提示）。
- **严格的三阶段回访**：盲写实际结果 → 保存后拆封并展示当时判断与实际结果对照 → 结果对比与经验教训 → 归档。
- **双面档案卡**：正面「当时视角」（牛皮纸 / 旧纸 / 手写批注），背面「回访视角」（冷白纸），可翻转切换。
- 全部记录、统计概览、设置与备份，全部基于本机真实数据，无任何虚构示例数字。

## 二、技术栈

| 项目 | 说明 |
| --- | --- |
| React 18 + TypeScript | 严格类型，`tsc --noEmit` 零错误 |
| Vite 6 | 构建与开发服务器 |
| Tailwind CSS 3 | 工具类 + 自定义设计令牌 |
| Lucide React | 图标（不引入大型 UI 组件库） |
| React Router (HashRouter) | 子路径部署下刷新不 404 |
| localStorage | 统一封装在 `src/lib/storage.ts` |
| JSZip | Markdown ZIP 导出 |
| CSS Animations | 信封封口、拆封、翻转、呼吸光 |
| Service Worker + Web App Manifest | PWA / 添加到主屏幕 |

数据模型定义在 `src/types/decision.ts`，含 `DecisionStatus`、`Reversibility`、`Stakes`、`OutcomeComparison`、`DecisionOption`、`Decision`，以及为后续扩展预留的 `OverviewStats`。ID 使用 UUID（带老浏览器回退），时间为 ISO 8601（`decidedAt` / `reviewedAt` 为完整时间戳，`reviewAt` 为 `YYYY-MM-DD` 日期，按本地日历日比较，避免时区跨天误判）。

## 三、本地运行

```bash
npm install
npm run dev
```

浏览器打开终端给出的地址（默认 `http://localhost:5173/`）。

## 四、构建

```bash
npm run build
```

产物在 `dist/`。构建命令会先执行 TypeScript 类型检查。本地预览构建结果：

```bash
npm run preview
```

预览地址同样是 `http://localhost:4173/decision-log/`（构建时的 base 为 `/decision-log/`）。

重新生成 PWA 图标（纯 Node 脚本，无额外依赖）：

```bash
npm run icons
```

## 五、GitHub Pages 部署

仓库名应为 **`decision-log`**，因此 `vite.config.ts` 中构建时的 `base` 为 `/decision-log/`（本地开发仍使用 `/`）。若部署到用户名主页仓库或自定义域名，构建时设置 `VITE_BASE=/` 即可。

1. 在 GitHub 创建 Public 仓库 `decision-log`，把本项目代码推送到 `main` 分支。
2. 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
3. 推送后 `.github/workflows/deploy-pages.yml` 自动执行：`npm ci` → `npm run build` → 上传 `dist` → 部署 Pages。
4. 也可在 Actions 页面手动运行 `Build and Deploy GitHub Pages` 工作流。
5. 手机访问地址：<https://x13502239474-oss.github.io/decision-log/>。

本项目的实际仓库：<https://github.com/x13502239474-oss/decision-log>。

> Pages 由 `.github/workflows/deploy-pages.yml` 通过 GitHub Actions 自动构建并发布：任何推送到 `main` 的提交都会触发 `npm ci` → `npm run build` → 部署 `dist`。

路由使用 HashRouter（URL 形如 `.../decision-log/#/decision/xxx`），哈希部分不会发送给服务器，因此**在任意子页面刷新都不会出现 404**，无需额外配置 404 回退页。

## 六、手机端使用

- 直接用手机浏览器打开 Pages 地址即可，无需安装任何环境或运行命令。
- 适配 320px–430px 宽度，无横向滚动；输入框字号 16px 避免 iOS Safari 聚焦缩放；按钮触控区不小于 44px。
- 手机端使用底部导航（含 `env(safe-area-inset-bottom)` 安全区），桌面端（≥1024px）使用左侧导航。
- 回访对照卡在手机端自动改为上下排列；双面档案卡在手机端改用淡入切换而非 3D 透视，两面以网格叠放，容器高度始终取内容最大值，不会裁切内容或让按钮失效。
- 支持 iPhone Safari 与 Android Chrome。

## 七、PWA 添加到主屏幕

- **iPhone Safari**：打开网页 → 点击底部「分享」→「添加到主屏幕」。
- **Android Chrome**：右上角菜单 →「安装应用」/「添加到主屏幕」。
- 配置包含 `manifest.webmanifest`（名称「个人决策日志」、短名称「决策日志」、主题色 `#171512`、启动背景色 `#171512`）、`sw.js`、`icon-192.png`、`icon-512.png`、`apple-touch-icon.png`、`favicon.svg`。
- Service Worker 采用「导航 network-first、静态资源 cache-first + 后台更新」策略，安装后可全屏离线打开。

**关于 iOS 的说明**：iOS Safari 的 PWA 能力与 Android 不完全一致，本应用**不提供**后台自动同步、后台提醒或推送通知。「是否到期」由你打开应用时按设备本地日期判断。所有数据仍完全离线保存在本机。

## 八、数据存储

- 全部数据保存在浏览器 `localStorage`，键名 `decision-capsule:v1`；主题偏好单独保存在 `decision-capsule:theme`。
- 写入统一走 `src/lib/storage.ts`，页面不直接操作 localStorage；JSON 解析失败、结构异常、版本较新/较旧都有安全降级与提示，不会用脏数据覆盖原始数据。
- **不需要登录、没有后端、不调用任何 API Key 或第三方服务**。
- 刷新页面数据不会丢失；清除站点数据、换设备、使用无痕/隐私模式会丢失数据，请定期导出备份。
- 回访流程中的实际结果在点击「记录结果，拆开过去的信」时**立即同步写入**，之后才播放拆封动画，动画期间刷新页面也不会丢数据。

## 九、数据导出与恢复

在「设置与备份」中：

- **导出全部 Markdown 记录**：每条决策生成一个 `.md` 文件，文件名为「决策日期_标题.md」，打包为 `decision-capsule-backup-日期.zip`。文件包含标题、决策/回访时间、背景情境、备选方案、最终选择、理由、信心程度，以及已回访记录的实际结果、结果对比、经验教训。
- **导出 JSON 完整备份**：包含全部字段与状态，可完整恢复原始数据。
- **导入 JSON 备份**：先校验 `app` / `version` / `decisions` 结构，逐条规范化字段，显示识别条数与跳过条数，再让用户选择「合并」（重复 ID 保留本机版本）或「覆盖」（二次确认并需输入「覆盖」）。结构错误的文件不会覆盖任何现有数据。
- **清空全部数据**：二次确认弹窗，需手动输入「清空」才可执行。

## 十、为什么回访必须先盲写

如果用户在填写实际结果之前就看到当初的理由、选择和预期，会不自觉地被过去的判断锚定，甚至重新解释自己当时的想法，事后归因偏差就又发生了。

因此本应用把顺序写死在流程里：

1. 第一阶段只显示标题、决策日期、回访日期和实际结果输入框——组件在类型层面就拿不到 `reasoning` / `chosen` / `options` / `confidence` 字段。
2. 未填写实际结果时按钮无法通过校验。
3. 点击后**先把结果保存进 localStorage**，再播放拆封动画。
4. 动画结束后才展示当时的判断，与实际结果左右（手机上下）对照。
5. 最后填写结果对比与经验教训，状态改为 `reviewed`。

已完成的记录可以反复查看双面档案卡，但原始理由不提供任何编辑入口。

---

## 十一、已完成功能清单

- [x] 三段式创建决策，支持添加 / 删除多个备选方案
- [x] 五级可视化信心评分、不可逆程度、重要程度、快捷回访日期与自定义日期
- [x] 封存仪式动画（先保存、后播放），刷新不丢数据
- [x] 首页按到期 / 7 日内 / 未来分组的信封墙，到期呼吸光与浮动
- [x] 严格三阶段回访流程（盲写 → 保存 → 拆封对照 → 反思归档）
- [x] 双面档案卡 3D 翻转（手机端安全降级）
- [x] 全部记录：全文搜索、状态 / 重要程度 / 信心筛选、四种排序
- [x] 统计概览：数量、重要程度 / 信心分布、结果对比比例（全部实时计算）
- [x] 状态管理「已放弃」及恢复、单条删除（二次确认）
- [x] Markdown ZIP 导出、JSON 导出 / 校验导入、清空数据、深色 / 浅色模式
- [x] PWA：manifest、Service Worker、192/512/apple-touch 图标、iOS 主屏幕 meta
- [x] 响应式：手机底部导航 + 安全区、桌面左侧导航、无横向滚动
- [x] GitHub Actions 自动构建并发布 GitHub Pages

## 十二、项目结构

```
decision-log/
├── public/
│   ├── icons/                  # icon-192.png / icon-512.png / apple-touch-icon.png
│   ├── manifest.webmanifest
│   ├── sw.js
│   └── favicon.svg
├── scripts/generate-icons.mjs  # 零依赖 PNG 生成
├── .github/workflows/deploy-pages.yml
├── src/
│   ├── components/             # Sidebar / BottomNav / EnvelopeCard / ArchiveCard /
│   │                           # PostalStamp / PaperTexture / EmptyState / PageHeader /
│   │                           # ConfirmDialog / SealCeremony
│   ├── pages/                  # Inbox / NewDecision / Review / DecisionList /
│   │                           # DecisionDetail / Overview / Settings
│   ├── hooks/                  # useDecisions / useTheme
│   ├── lib/                    # storage / date / id / labels / export / import / pwa
│   ├── types/decision.ts
│   ├── App.tsx / main.tsx / index.css
├── index.html
├── vite.config.ts / tailwind.config.js / postcss.config.js / tsconfig.json
└── README.md
```

## 十三、验收记录（实际测试）

用本机 Chrome 的无头模式 + CDP（未安装 Playwright / Puppeteer）对**构建产物**做了真实浏览器端到端测试，脚本在 `scripts/e2e-smoke.mjs` + `scripts/browser-checks.js`。

| 检查项 | 结果 |
| --- | --- |
| `npx tsc --noEmit` | 通过，0 个类型错误 |
| `npm run build` | 通过，产出 `dist/`（JS 361 KB / gzip 113 KB，CSS 31 KB） |
| 构建产物完整性 | `index.html`、`manifest.webmanifest`、`sw.js`、`favicon.svg`、3 个 PNG 图标、JS/CSS 均在 `dist` 内；`%BASE_URL%` 正确替换为 `/decision-log/` |
| 端到端测试（本地构建产物） | **90 项全部通过，0 项失败；控制台错误 0 条** |
| 端到端测试（线上 Pages 地址） | **90 项全部通过，0 项失败；控制台错误 0 条**；首页、JS/CSS、manifest、sw.js、图标均返回 HTTP 200 且 MIME 正确 |
| GitHub Actions 自动部署 | 已启用：`npm ci` → `npm run build` → Pages 部署全部成功（run `42468228003`，conclusion `success`）；推送 `main` 或手动运行工作流即自动更新 |
| 创建与持久化 | 三步表单、多方案、信心 5 分、自定义回访日期、封存仪式、刷新后数据仍在，全部通过 |
| 核心回访机制 | 盲写页不出现理由 / 情境 / 方案 / 信心；空结果被拦截；结果在拆封动画前已落盘；动画期间不显示理由；拆封后才展示原始判断，全部通过 |
| 归档与查看 | 状态 `reviewed`、结果对比、经验教训、回访日期、原始理由未被修改、双面档案卡翻转，全部通过 |
| 手机端 | 在 **320px 与 390px** 两个视口验证：无横向滚动、表单控件不越界、输入框 ≥16px、按钮触控区 ≥44px、底部导航、翻转不裁切、弹窗不越界，全部通过 |
| 导入导出 | ZIP 内含 `2026-11-08_自动化测试决策：是否换城市.md`（章节完整）与 `README.txt`；JSON 备份含 `app/version/exportedAt/decisions`；导入结构校验、合并导入、非法备份拒绝、清空二次确认，全部通过 |
| 修复记录 | 测试发现本地 `vite preview` 的 base 与 build 不一致，导致 `/decision-log/assets/*` 被 SPA fallback 成 HTML、module 脚本无法执行；已通过 `isPreview` 修正并复测通过 |

## 十四、复现端到端测试

```bash
npm install
npm run build
npm run preview -- --port 4173 --host 127.0.0.1
# 另开一个终端（Windows 示例）
chrome --headless=new --remote-debugging-port=9222 --user-data-dir=<临时目录> about:blank
# 再开一个终端
npm run test:e2e
```

脚本会自行清理测试用浏览器的 Service Worker、缓存与 localStorage，不会触碰你日常浏览器的任何数据。可通过 `TEST_URL` / `CDP_URL` 环境变量覆盖地址。
