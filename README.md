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
- 商品表单和 AI 创作偏好在浏览器 localStorage 自动保存
- AI 模式支持选择拍法（成品先行、日常微剧情、特写与环境声等），并填写最多 1000 字的定制要求；拍法选项不代表实时热点

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

## 源码导读

建议从 `src/types.ts` 开始：`Product` 是商品表单，`RecognizedProduct` 是待核对的照片识别结果，`Script` 是模板和 AI 模式使用的统一输出类型，每条 `Shot` 包含时间段、画面、口播和字幕。

1. **示例模板**：`src/App.tsx` 的 `generate()` 校验商品名称和卖点，再调用 `src/sample.ts` 的 `demoScript()`。它取前两条卖点，拼接开场、介绍和收尾。切换 15/30/60 秒会改变分镜时间区间，不会缩写或扩写口播；口播风格和 AI 创作偏好不参与模板生成。
2. **AI 生成**：同一个 `generate()` 在 AI 模式下将商品表单和 `preferences` 发送到后端。`server/index.mjs` 校验输入、组合拍法与真实性要求，再请求模型。`asScript()` 检查字段类型和分镜数组，但不核验商品事实，也不验证口播是否真的能在指定时长内读完。
3. **包装识别**：`recognizePhoto()` 发送原始图片数据。后端检查格式、大小和文件签名，再将图片提交给模型。识别成功不会直接修改表单；用户点击回填后，`applyRecognizedProduct()` 才更新名称和卖点，有明确识别品类时也会更新品类。
4. **素材与导出**：普通素材预览使用浏览器对象 URL，不经过 API；TXT 和 JSON 由浏览器生成。导出的字幕是分镜里的文字，不是带精确时间码的字幕文件。

### API 一览

| 方法与路径 | 输入 | 成功响应 |
| --- | --- | --- |
| `GET /api/health` | 无 | `{ ok, aiConfigured }`；只检查是否读取到密钥，不验证密钥有效性或供应商连通性 |
| `GET /api/health/model` | 管理令牌（Bearer） | `{ ok, state, checkedAt }`；上游拒绝时另有 `upstreamStatus` |
| `POST /api/generate` | JSON：`Product` 字段，可选 `preferences: { trendStyle, brief }` | `{ mode: "ai", script }` |
| `POST /api/recognize-product` | JPG、PNG 或 WebP 原始字节，设置匹配的 `Content-Type`；不是 multipart 表单 | `{ product: { name, category, highlights } }`；无法确定品类时为 `null` |

本地开发由 `vite.config.ts` 转发 `/api/`。使用仓库的 Docker Compose 配置时，Web 镜像中的 Nginx 提供前端静态文件，并把 `/api/` 转发给独立的 `api` 服务；对应配置在 `Dockerfile`、`compose.yaml` 和 `docker/nginx.conf`。

### 排查模型服务

在项目根目录的 `.env` 写入 `FRAMEFLOW_ADMIN_TOKEN`（建议用 `openssl rand -hex 32` 生成独立令牌），然后执行 `docker-compose up -d --build`。从创作台点击「后台管理」，或访问 `http://127.0.0.1:8080/admin`，输入令牌即可管理模型。未设置令牌时后台接口关闭。

后台可维护 API 基础地址、模型名称和密钥。密钥不会回显，留空保留原值；迁移到其他服务时请填写目标服务的密钥。保存会立即生效，无需重启。环境变量作为初始配置；保存后的配置优先，存于 Compose 的 `model-settings` 数据卷（非 Docker 默认保存在 `.frameflow/model.json`）。配置文件包含密钥，请保护数据卷及备份，不要提交到 Git；删除数据卷会丢失后台保存的配置。不要通过不可信的 HTTP 网络传输管理令牌或密钥。

状态检测仅在进入后台、保存配置或点击重新检测时触发。它发送一条不含商品信息的短文本请求，检查 Chat Completions 和 JSON 输出，**不验证图片输入能力**。普通 `/api/health` 仍不请求模型，不产生模型调用费用。

| HTTP | `state` | 含义 |
| --- | --- | --- |
| 200 | `healthy` | 模型成功返回预期 JSON |
| 503 | `not_configured` | 后端未读到模型密钥 |
| 502 | `upstream_error` | 上游拒绝请求；查看 `upstreamStatus` 判断是否为鉴权、请求格式或额度等问题 |
| 502 | `connection_error` / `invalid_response` | 未完成上游连接，或响应不是预期 JSON |
| 504 | `timeout` | 上游未在 8 秒内完成响应 |

探测可能消耗少量额度。同一 API 进程内，并发探测合并，结果缓存 60 秒；响应不包含密钥或上游错误正文。不要把该接口作为高频公网探针。

### 动手验证（无需 API 密钥）

1. 用 `npm run dev:web` 打开页面，保留默认商品「香辣拌饭酱」，点击生成。检查分镜是否只使用了前两条卖点。
2. 把时长从 30 秒切到 15 秒，再生成一次。对比两次的镜头时间与全文口播，确认只有时间区间变化。
3. 刷新页面，确认选定的时长仍保留在表单中。再次生成后下载 JSON，对照 `src/types.ts` 检查脚本和每个镜头的字段。

## 第一版明确不包括

- 自动读取淘宝/拼多多/抖音商品链接；不抓取商品详情
- TTS 真人/AI 配音、音频合成、字幕时码对齐
- 多轨剪辑、视频渲染及 MP4 成品导出
- 账户登录、云素材库、批量生成与部署级限流

第二版建议：素材上传到对象存储 → 图片/视频内容解析 → 结构化商品资料确认 → AI 脚本与拍摄分镜 → TTS + 对齐 → FFmpeg 视频渲染。发布前始终人工审查食品信息与平台营销规范。

## 部署安全说明

后端仅为本地开发 MVP，**不宜在没有鉴权、请求限额和审计的情况下直接公开部署**；否则公网用户可能消费你的 API 额度。正式部署需要认证、限流、资源配额、上传扫描及日志脱敏。
