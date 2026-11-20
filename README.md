# FrameFlow Food AI v1 — 零食/调味料商品口播创作台

可运行的 Web MVP：React + TypeScript + Vite 前端，Node.js HTTP API 后端。

## 包含功能

- 零食 / 调味料品类、商品名称、真实卖点、使用场景、受众、价格信息和禁用措辞
- 种草推荐、带货成交、场景故事、客观介绍四种文案风格
- 15/30/60 秒短视频时长设置
- **示例模板**：无需密钥，在浏览器本地按输入事实组合示例口播及三镜头分镜；不是 AI
- **AI 生成**：需要自有 API 密钥，后端调用 OpenAI Chat Completions 兼容 API，生成口播、分镜、字幕文字、标签
- 口播复制、TXT 和 JSON 下载
- 拍照或选图识别商品包装，核对后回填名称、品类和可见卖点，再使用 AI 生成口播和分镜。支持 8 MB 以内的 JPG、PNG、WebP。
- 素材预览在浏览器本地完成。通过「拍照识别」或「选图识别」提交的图片会发送到配置的模型服务。
- 商品表单浏览器 localStorage 自动保存

## 运行步骤

需要 Node.js 22 或更新版本、npm。

```bash
npm install
cp .env.example .env
# 如需 AI 功能，在 .env 填写 OPENAI_API_KEY；不配置也可用示例模板
npm run dev
```

Windows PowerShell 复制配置文件：`Copy-Item .env.example .env`。

打开 http://localhost:5173 。Vite 自动转发 `/api/*` 到 http://localhost:8787。

若只想预览示例模式：`npm run dev:web` 即可，不需要启动 API。

## 验证

```bash
npm run typecheck
npm run build
```

## 使用真实 AI

1. 在项目根目录 `.env` 中填写 `OPENAI_API_KEY=你的密钥`；推荐保持默认 `OPENAI_BASE_URL=https://api.openai.com/v1`。
2. 启动 `npm run dev`，选择「AI 生成」。
3. 运行服务须有网络且 API 账户有可用额度；模型需支持 `response_format: {type:"json_object"}`，如服务不兼容需修改 `server/index.mjs`。
4. 拍照识别需使用同时支持图片输入和 JSON 输出的 `OPENAI_MODEL`。
5. 服务器会把商品表单数据发送至配置的模型服务；不要输入敏感信息。不要将 `.env` 上传代码仓库或把密钥写入 `VITE_` 变量。

## 项目结构

```text
frameflow-food-ai-v1/
├── src/
│   ├── App.tsx             # 页面、输入和导出交互
│   ├── main.tsx            # React 入口
│   ├── styles.css          # 深色响应式 UI
│   ├── types.ts            # 商品和分镜的数据结构
│   └── sample.ts           # 无 API 示例模板
├── server/
│   └── index.mjs           # API 代理、验证及 AI 调用
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 第一版明确不包括

- 自动读取淘宝/拼多多/抖音商品链接；不抓取商品详情
- TTS 真人/AI 配音、音频合成、字幕时码对齐
- 多轨剪辑、视频渲染及 MP4 成品导出
- 账户登录、云素材库、批量生成与部署级限流

第二版建议：素材上传到对象存储 → 图片/视频内容解析 → 结构化商品资料确认 → AI 脚本与拍摄分镜 → TTS + 对齐 → FFmpeg 视频渲染。发布前始终人工审查食品信息与平台营销规范。

## 部署安全说明

后端仅为本地开发 MVP，**不宜在没有鉴权、请求限额和审计的情况下直接公开部署**；否则公网用户可能消费你的 API 额度。正式部署需要认证、限流、资源配额、上传扫描及日志脱敏。
