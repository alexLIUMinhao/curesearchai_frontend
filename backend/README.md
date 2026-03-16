# SparkHunter Backend MVP

当前版本是科研工作台项目的 MVP 后端骨架：

- 默认可使用 mock LLM，也支持用户级真实模型配置
- 支持轻量级 Skills 系统 V1，并内置 `asset_structurer`
- 数据库默认使用 SQLite
- 文件默认保存到本地 `uploads/`
- 后续可扩展 PostgreSQL、OSS/S3、真实大模型调用

## 技术栈

- Python 3.11
- FastAPI
- SQLAlchemy ORM
- Pydantic
- SQLite
- pytest

## 如何安装

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

## 如何启动

```bash
cd backend
uvicorn app.main:app --reload
```

启动后可访问：

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

## 如何测试

```bash
cd backend
pytest
```

## 项目结构说明

```text
backend/
  app/
    main.py
    core/
      config.py
      db.py
      logging.py
    api/
      router.py
      settings.py
      skills.py
      workflows.py
      assets.py
      research_runs.py
      chat.py
      tasks.py
      notes.py
    schemas/
      settings.py
      skills.py
      workflow.py
      asset.py
      research_run.py
      chat.py
      task.py
      note.py
      common.py
    models/
      user_settings.py
      workflow.py
      asset.py
      research_run.py
      chat_message.py
      task.py
      note.py
    repositories/
      settings_repo.py
      workflow_repo.py
      asset_repo.py
      research_repo.py
      chat_repo.py
      task_repo.py
      note_repo.py
    services/
      settings_service.py
      workflow_service.py
      asset_service.py
      research_service.py
      chat_service.py
      task_service.py
      note_service.py
    llm/
      prompt_builder.py
      model_client.py
      output_parser.py
    skills/
      asset_structurer/
      extractors/
      base.py
      registry.py
      schemas.py
      service.py
    storage/
      file_storage.py
    utils/
      exceptions.py
      response.py
      time.py
  uploads/
  tests/
    conftest.py
    test_workflows.py
    test_chat.py
    test_tasks.py
  requirements.txt
  .env.example
  README.md
```

## 分层说明

- API 层：只处理 HTTP 输入输出、参数校验和响应包装
- Service 层：承载业务逻辑，如 workflow 查询、chat prompt 组装、文件上传处理
- Repository 层：只负责数据库 CRUD
- LLM Service 层：分为 prompt 构建、模型调用、输出解析，支持 mock、OpenAI-compatible 和 Gemini
- 数据层：通过 SQLAlchemy ORM 管理 SQLite，配置层已预留 PostgreSQL 切换入口
- 文件存储层：当前为本地存储实现，接口设计可平滑切换到 OSS / S3

## API 示例

### 创建 Workflow

```bash
curl -X POST http://127.0.0.1:8000/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "project-001",
    "name": "Paper Review",
    "description": "Track reading and notes for related work",
    "stage": "reading",
    "status": "active"
  }'
```

### 发送 Chat 消息

```bash
curl -X POST http://127.0.0.1:8000/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_id": 1,
    "message": "请帮我整理下一步研究计划",
    "use_mock": true
  }'
```

### 读取当前用户 Settings

```bash
curl http://127.0.0.1:8000/api/settings/me
```

### 上传 Asset

```bash
curl -X POST http://127.0.0.1:8000/api/assets/upload \
  -F "workflow_id=1" \
  -F "type=pdf" \
  -F "name=paper.pdf" \
  -F "file=@/path/to/paper.pdf"
```

## 当前实现范围

- Workflow、Asset、ResearchRun、ChatMessage、Task、Note 的基础 CRUD / 查询
- `/api/chat/send` 的最简 LLM 调用链路
- `POST /api/skills/run-asset`：对单个 asset 手动运行 `asset_structurer`
- `GET /api/skills/asset/{asset_id}/{skill_name}`：读取 skill 结果
- 统一响应格式：`{"code": 0, "message": "success", "data": ...}`
- 基础异常处理和 Swagger schema

## Skills 系统

当前第一版只真正实现一个 skill：`asset_structurer`

用途：

- 对单个上传后的 asset 做结构化研究提炼
- 结果内部写入 `Asset.metadata_json`
- 同时生成一条 assistant 结构化消息写入 chat history
- 同时生成或更新一条 `summary` note，作为长期记忆

支持的文件类型：

- `txt`
- `md`
- `pdf`
- `docx`

当前不支持：

- `.doc`
- OCR 扫描版 PDF

示例：

```bash
curl -X POST http://127.0.0.1:8000/api/skills/run-asset \
  -H "Content-Type: application/json" \
  -d '{
    "asset_id": 1,
    "skill_name": "asset_structurer"
  }'
```

## LLM 配置

当前支持两层模型配置：

- 用户级 Settings：前端 `Settings` 抽屉中保存 provider / model / key / base URL
- 系统级 `.env`：作为默认值和 fallback

`.env` 仍可配置系统默认模型：

```env
LLM_PROVIDER=openai_compatible
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=your_api_key
LLM_MODEL=gpt-4o-mini
LLM_TEMPERATURE=0.3
LLM_TIMEOUT=60
LLM_USE_MOCK=false
```

说明：

- 当前 `Settings` 为单用户 MVP，内部使用固定 `user_id=default-user`
- API key 第一版明文保存在 SQLite，仅适用于本地开发 / 单用户演示
- 前端 `Settings` 可配置：
  - OpenAI
  - Gemini
  - Qwen
  - MiniMax
  - Kimi
  - Custom OpenAI-compatible
- Studio 中的 `Mock / Live` 是浏览器会话级覆盖，不会自动改写用户长期默认值
- 若真实模型不可用，当前版本会 fallback 到 mock 并记录日志

## 后续扩展建议

- 将 `MockModelClient` 替换为真实 OpenAI / Azure OpenAI / 本地模型客户端
- 将 SQLite 切换为 PostgreSQL，并补充 Alembic 迁移
- 将本地文件存储切换为 OSS / S3
- 增加鉴权、权限控制、审计日志和异步任务编排
