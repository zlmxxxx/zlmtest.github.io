# AI · ERA — 人工智能发展与未来前景

一个介绍人工智能最新进展的中文静态网站，内容更新于 2026 年 10 月。

**在线访问：** [https://zlm-test.site](https://zlm-test.site)

网站从数据、历史、技术、行业、中国产业、挑战治理、未来趋势和入门术语八个角度，系统梳理 AI 的现状与前景。核心数据来自斯坦福大学 HAI《2026 AI Index》与工业和信息化部公开发布的信息。

## 功能特点

- **页面嵌套浏览**：首页作为外壳，导航切换时把子页面内容载入中间区域，无需整页刷新；地址形如 `#/china`，支持前进后退与链接分享
- **八个专题页**：数据洞察、发展里程碑、前沿技术详解、行业应用、中国 AI 专题、挑战与治理、未来展望、AI 入门与术语
- **现代视觉设计**：中性深色主题，跟随系统自动切换浅色模式；粒子背景、滚动渐显与数字滚动动画
- **响应式布局**：适配桌面、平板与手机，窄屏下提供折叠菜单
- **无障碍与渐进增强**：
  - 不执行 JS 时内容依然完整可读，子页面可独立访问
  - 支持"减少动态效果"系统设置
  - 键盘与读屏器友好
- **零依赖**：纯 HTML、CSS、JavaScript，无需构建工具

## 专题内容

| 路由 | 专题 | 内容概要 |
|---|---|---|
| `#/stats` | 数据洞察 | 全球 AI 投资、企业采用率、生成式 AI 普及率、中美对比 |
| `#/timeline` | 发展里程碑 | 从 1950 年图灵测试到 2026 年智能体时代的五个阶段 |
| `#/technology` | 前沿技术详解 | AI 技术栈；推理模型、智能体、多模态、开源、具身智能、AI for Science |
| `#/industries` | 行业应用 | 医疗、金融、制造、教育、交通等九大行业场景与企业落地方法 |
| `#/china` | 中国 AI 专题 | 政策脉络、大模型生态、算力基础设施、人形机器人产业 |
| `#/challenges` | 挑战与治理 | 可靠性、安全、就业、版权、深度伪造、能耗与全球治理进展 |
| `#/future` | 未来展望 | 六大趋势判断，以及个人、企业与教育如何应对 |
| `#/basics` | AI 入门与术语 | 基础概念、大模型训练流程、30 个术语与常见误区 |

## 项目结构

```
.
├── index.html        # 首页外壳：导航、首页视图、子页面容器、页脚
├── style.css         # 全站样式（设计令牌、组件、响应式、深浅色主题）
├── script.js         # 粒子背景、滚动动画、导航菜单、页面嵌套路由
├── pages/            # 专题子页面（每个都是可独立访问的完整 HTML）
│   ├── stats.html
│   ├── timeline.html
│   ├── technology.html
│   ├── industries.html
│   ├── china.html
│   ├── challenges.html
│   ├── future.html
│   └── basics.html
└── CNAME             # GitHub Pages 自定义域名
```

### 页面嵌套的工作方式

1. 首页和子页面里指向 `pages/*.html` 的链接，会在加载时被 `script.js` 改写为 `#/名称`
2. 路由变化时，脚本用 `fetch` 取回对应子页面，提取其中的 `<article class="page">` 放入 `#page-view`，并更新标题与导航高亮
3. 直接访问 `pages/xxx.html` 时，页面头部的脚本会跳转回 `/#/xxx`，统一在外壳中展示；不执行 JS 的访问者则直接阅读子页面本身

## 本地预览

由于子页面通过 `fetch` 载入，请使用本地服务器访问。直接双击 `index.html` 时，浏览器会禁止载入子页面，网站会退化为直接打开独立子页面。

```bash
python -m http.server 8000
```

然后在浏览器中打开 <http://localhost:8000>。

## 新增一个专题页

1. 复制 `pages/` 下任意一个页面，例如 `pages/future.html`，重命名为 `pages/新名称.html`
2. 修改 `<title>`、`<meta name="description">`，以及头部跳转脚本中的路由名称
3. 在 `<article class="page">` 中编写内容，可复用现有组件：`card`、`info-card`、`bar-chart`、`data-table`、`glossary`、`faq` 等
4. 在 `index.html` 的导航栏和"专题导航"中添加指向 `pages/新名称.html` 的链接，并更新相邻页面的"上一篇 / 下一篇"

## 部署

本仓库通过 GitHub Pages 从 `main` 分支根目录发布，自定义域名配置在 `CNAME` 中。推送到 `main` 后，通常一两分钟内即可在线上看到更新。

## 数据来源

- [Stanford HAI：The 2026 AI Index Report](https://hai.stanford.edu/ai-index/2026-ai-index-report)
- [Stanford HAI：The 2025 AI Index Report](https://hai.stanford.edu/ai-index/2025-ai-index-report)
- [新京报：工信部 2026 世界人工智能大会新闻发布会](https://www.bjnews.com.cn/detail/1783412916129538.html)
- [新华网：2026 世界人工智能大会报道](https://www.news.cn/tech/20260707/1e0c79e82bb94a97a1488ebe3984834d/c.html)

> 网站内容仅供学习与科普参考。部分数据转引自公开报道与报告解读，引用前请以原始来源为准。
