# SpecPilot 汇报 PPT 大纲

## 1. 封面

**标题**：基于大模型的测试场景生成与自主 Web 测试智能体

**副标题**：SpecPilot：面向 4ga Boards 的手册驱动智能测试系统

**页面内容**：

- 小组：第 7 组
- 汇报人：第 7 组
- 日期：按实际汇报日期填写

**讲述重点**：

本项目围绕“从软件手册自动生成测试场景，并由智能体自主执行 Web 功能测试”展开，目标是构建一个完整的本地全栈智能测试工具。

## 2. 目录

沿用模板目录结构：

1. 研究背景及意义
2. 研究目标与方案
3. 研究框架介绍
4. 研究进度与成果
5. 小组分工

**讲述重点**：

目录保持模板原有框架，但第 3 章“研究框架介绍”需要重点展开智能体层的实现，包括 LangGraph 编排、browser-use 执行、Trace 采集、验证与失败分类。

## 3. 研究背景及意义

### 3.1 研究背景

**页面标题**：研究背景

**页面内容**：

- Web Agent 正在被用于复杂 Web 应用的自动操作与测试。
- 真实业务系统存在流程复杂、页面动态变化、交互状态难判断等问题。
- 现有 LLM Agent 在真实 Web 任务中仍容易失败：
  - 缺少待测系统的领域知识。
  - 容易生成与手册或实际 UI 不一致的操作。
  - 执行完成后难以准确判断任务是否真正成功。
- 传统自动化测试依赖 selector、xpath、DOM id 等定位信息，面对 UI 改版时稳定性较弱。

**讲述重点**：

4ga Boards 的用户手册和管理员手册包含大量业务功能描述，因此可以把手册作为知识来源，帮助系统自动抽取功能点、生成测试场景，并降低大模型凭空编造测试步骤的风险。

### 3.2 研究意义

**页面标题**：研究意义

**页面内容**：

- 将软件手册转化为结构化测试知识，提升测试场景生成的真实性。
- 使用零 locator 场景，让测试步骤保持自然语言意图，不绑定具体 DOM 实现。
- 使用 Web Agent 自主执行测试场景，减少人工脚本编写成本。
- 通过确定性验证和视觉验证结合，提高结果判断的可靠性。
- 对失败进行分类和报告，为后续定位应用缺陷或 Agent 缺陷提供依据。

**讲述重点**：

项目不是简单让大模型写测试用例，而是形成“手册证据 -> 测试场景 -> 智能体执行 -> 结果验证 -> 失败分析”的闭环。

## 4. 研究目标与方案

### 4.1 总体流程

**页面标题**：总体流程

**建议图示**：

```text
4ga Boards 手册
  -> 爬取与清洗
  -> Markdown 切片
  -> ChromaDB 索引
  -> 功能点抽取
  -> 零 locator 场景生成
  -> browser-use 执行
  -> Trace / 截图采集
  -> 确定性验证 + GLM-4.6V 视觉验证
  -> 失败分类
  -> 报告生成
```

**页面内容**：

- 手册爬取范围：英文 user-manual 与 admin-manual。
- 场景生成要求：每个场景包含 steps、expectations、source URLs、evidence quotes。
- 执行方式：由 browser-use Agent 根据自然语言步骤自主操作浏览器。
- 验证方式：结构化 DOM / 文本 / URL 检查，加上 GLM-4.6V 视觉验证。

**讲述重点**：

流程中有两个关键边界：场景中不写 locator；browser-use 是唯一浏览器执行器。

### 4.2 研究目标

**页面标题**：研究目标

**页面内容**：

- 自动从 4ga Boards 手册中抽取主要功能点。
- 为每个功能点生成结构化、可执行、带证据的测试场景。
- 构建自主 Web 测试智能体，执行生成的测试场景。
- 实时展示 Agent 节点状态、浏览器动作、截图帧和事件流。
- 对执行结果进行验证、失败分类和报告归档。

**当前实现数据**：

- 当前本地数据库中已有 48 个功能点。
- 当前本地数据库中已有 62 个测试场景。
- 当前本地数据库中已有 17 条运行记录。

**讲述重点**：

目前项目已经不是纯设计方案，而是形成了可运行的本地全栈系统。

### 4.3 总体架构

**页面标题**：总体架构

**建议图示**：

```text
Next.js 中文控制台
  -> REST API + SSE
FastAPI 后端
  -> SQLModel / SQLite
  -> ChromaDB
  -> LangGraph Workflow
  -> browser-use Agent
  -> Deterministic Verifier + GLM-4.6V Vision Verifier
  -> data/runs/{run_id}/ 报告与截图
```

**页面内容**：

- 前端：Next.js App Router、TypeScript、Tailwind CSS、React Flow。
- 后端：FastAPI、SQLModel、SQLite、ChromaDB。
- Agent 编排：LangGraph。
- 浏览器执行：browser-use。
- 文本模型：OpenAI-compatible / DeepSeek V4 Pro / Browser Use hosted LLM，可通过设置选择。
- 视觉模型：GLM-4.6V。

**讲述重点**：

FastAPI 后端是系统中枢，既负责手册生成链路，也负责运行调度、事件流、验证和报告。

## 5. 研究框架介绍

### 5.1 整体技术栈

**页面标题**：整体技术栈

**页面内容**：

- 前端展示层：
  - Next.js App Router
  - TypeScript
  - Tailwind CSS
  - Radix UI
  - Lucide Icons
  - React Flow
  - TanStack Query
  - Recharts
- 后端服务层：
  - FastAPI
  - SQLModel
  - SQLite
  - ChromaDB
  - sse-starlette
- 智能体层：
  - LangGraph
  - browser-use
  - OpenAI-compatible LLM adapter
  - langchain-deepseek adapter
  - GLM-4.6V verifier adapter
- 本地存储：
  - `data/specpilot.db`
  - `data/chroma/`
  - `data/runs/{run_id}/`

**讲述重点**：

技术栈服务于一个目标：把生成、执行、验证、可视化和报告放到一个本地闭环中。

### 5.2 系统模块划分

**页面标题**：系统模块划分

**页面内容**：

SpecPilot 可以拆成五个核心模块：

1. 手册知识层
   - 爬取 4ga Boards 英文 user-manual 和 admin-manual。
   - 清洗页面内容，转换为 Markdown / 文本块。
   - 按标题结构切片，并写入 ChromaDB。

2. 场景生成层
   - 基于手册证据抽取功能点。
   - 根据功能点生成结构化测试场景。
   - 对 evidence quotes、source URLs 和零 locator 约束进行校验。

3. 智能体执行层
   - 将场景步骤转换为 browser-use 任务。
   - 使用 browser-use Agent 自主操作 4ga Boards 页面。
   - 收集 action、URL、截图、错误和执行结果。

4. 验证与诊断层
   - 使用确定性验证器检查 DOM、文本、URL 和元素状态。
   - 使用 GLM-4.6V 进行视觉和语义验证。
   - 对失败结果进行分类和解释。

5. 前端控制台层
   - 展示功能点、测试场景、执行过程、历史记录和报告。
   - 通过 SSE 实时展示 Agent 执行过程。

**讲述重点**：

第 3 章不是只介绍智能体层，而是介绍系统整体框架；其中智能体执行层是最核心、最有技术含量的部分，需要重点讲。

### 5.3 手册知识层与场景生成层

**页面标题**：手册知识层与场景生成层

**对应实现文件**：

- `backend/src/specpilot_backend/services/manual_pipeline.py`
- `backend/src/specpilot_backend/ingestion/crawler.py`
- `backend/src/specpilot_backend/ingestion/chunker.py`
- `backend/src/specpilot_backend/ingestion/indexer.py`
- `backend/src/specpilot_backend/generation/features.py`
- `backend/src/specpilot_backend/generation/scenarios.py`
- `backend/src/specpilot_backend/generation/validators.py`

**页面内容**：

手册处理流程：

```text
manual pages
  -> crawl
  -> clean
  -> chunk
  -> index
  -> feature extraction
  -> scenario generation
  -> validation
```

主要设计：

- 只爬取英文 user-manual 和 admin-manual，排除 developer manual。
- 使用标题优先的切片策略，保留 source URL、heading path、module、manual section 等 metadata。
- 生成 Feature 时必须保留 evidence quotes 和 source URLs。
- 生成 Scenario 时必须满足零 locator 规则。
- 如果 quote 不存在于手册 chunk 中，或包含 selector、xpath、element_id 等字段，则场景会被拒绝。

**讲述重点**：

这部分解决的是“测试场景从哪里来”和“如何避免大模型幻觉”的问题。项目不是凭空让模型生成测试，而是让模型基于手册证据生成，并用校验器过滤不可靠结果。

### 5.4 后端 API 与数据存储

**页面标题**：后端 API 与数据存储

**对应实现文件**：

- `backend/src/specpilot_backend/api/*.py`
- `backend/src/specpilot_backend/services/persistence.py`
- `backend/src/specpilot_backend/services/artifacts.py`
- `backend/src/specpilot_backend/models/*.py`

**页面内容**：

后端 API 覆盖：

- 手册生成：`/api/pipeline/manual-to-scenarios`
- 功能点：`/api/features`
- 测试场景：`/api/scenarios`
- 运行记录：`/api/runs`
- 运行事件：`/api/runs/{run_id}/events`
- Trace：`/api/runs/{run_id}/trace`
- Artifacts：`/api/runs/{run_id}/artifacts`
- 报告导出：`/api/runs/{run_id}/report`
- 设置与环境检查：`/api/settings`、`/api/doctor`

数据存储：

- SQLite 保存 feature、scenario、run、job 等元数据。
- ChromaDB 保存手册向量索引。
- 文件系统保存运行证据：

```text
data/runs/{run_id}/
  trace.jsonl
  report.json
  report.html
  screenshots/
  verification/
```

**讲述重点**：

后端不仅是接口层，还承担了任务调度、状态持久化、artifact 管理和安全文件访问。

### 5.5 前端控制台与可视化

**页面标题**：前端控制台与可视化

**对应实现文件**：

- `frontend/app/page.tsx`
- `frontend/app/manual-generation/page.tsx`
- `frontend/app/features/page.tsx`
- `frontend/app/scenarios/page.tsx`
- `frontend/app/runs/page.tsx`
- `frontend/app/runs/live/[run_id]/page.tsx`
- `frontend/components/live/*.tsx`

**页面内容**：

前端主要页面：

- 工作台：展示功能点数量、场景数量、执行情况和系统状态。
- 手册生成：展示抓取、索引、功能点抽取、场景生成四个阶段。
- 功能点树：按模块展示功能点和手册证据。
- 测试场景：展示场景列表、步骤、预期结果、JSON 详情和运行入口。
- 实时执行页：展示 LangGraph 节点、browser-use 动作、截图帧和事件流。
- 执行记录：展示历史 run、报告链接和失败摘要。

**讲述重点**：

前端不是静态展示页面，而是测试控制台。尤其是实时执行页，可以把智能体运行过程、浏览器画面和系统判定同步呈现出来。

### 5.6 智能体层总体设计

**页面标题**：智能体层总体设计

**页面内容**：

智能体层由两个部分组成：

1. browser-use 内部 Agent loop
   - 负责单个测试场景内的网页观察、动作规划和浏览器交互。
   - 根据当前 DOM、页面状态和自然语言任务自主选择 click、input、scroll、drag、wait 等动作。

2. LangGraph 外部工作流
   - 负责场景加载、执行调度、Trace 收集、验证、失败分类和报告生成。
   - 不重复实现 browser-use 内部的 planner，避免两套规划逻辑冲突。

**节点设计**：

```text
ScenarioLoader
  -> BrowserUseRun
  -> TraceCollector
  -> DeterministicVerifier
  -> VisionVerifier
  -> FailureClassifier
  -> RepairPlanner
  -> Reporter
```

**讲述重点**：

LangGraph 的价值不是“再写一个浏览器 Agent”，而是把 browser-use 执行后的测试系统能力补齐：记录、验证、分类和报告。

### 5.7 LangGraph 在系统中的用途

**页面标题**：LangGraph 的作用

**对应实现文件**：

- `backend/src/specpilot_backend/agent/workflow.py`
- `backend/src/specpilot_backend/services/run_executor.py`

**页面内容**：

LangGraph 在本项目中不是用来替代 browser-use 的浏览器操作能力，而是作为“测试运行工作流编排器”。

具体用途：

1. 固定运行阶段
   - 将一次测试运行拆成可观测的节点：

```text
ScenarioLoader
  -> BrowserUseRun
  -> TraceCollector
  -> DeterministicVerifier
  -> VisionVerifier
  -> FailureClassifier
  -> RepairPlanner
  -> Reporter
```

2. 明确职责边界
   - browser-use 负责单场景内部的观察、规划和执行。
   - LangGraph 负责场景外部的执行前准备、执行后验证、失败诊断和报告生成。

3. 支撑实时可视化
   - 每个节点都有 pending、running、success、failed、needs_review 等状态。
   - 前端 React Flow 根据 TraceEvent 展示节点流转。

4. 便于后续扩展
   - 可以在工作流中插入 RepairPlanner、二次验证、人工审核或评估指标节点。
   - 不需要修改 browser-use 内部执行循环。

**讲述重点**：

LangGraph 的核心价值是让一次 Agent 测试运行变成“可编排、可追踪、可扩展”的流程，而不是把 Agent 的每一次 click 都重新规划一遍。这样既避免和 browser-use 内部 loop 重叠，又能把测试系统需要的验证、分类、报告能力组织起来。

### 5.8 场景到 Agent 任务的转换

**页面标题**：从测试场景到 Agent 任务

**对应实现文件**：

- `backend/src/specpilot_backend/agent/task_builder.py`

**页面内容**：

`TestScenario` 中包含：

- `title`：场景标题。
- `preconditions`：执行前置条件。
- `test_data`：测试数据。
- `steps`：自然语言步骤。
- `expectations`：验证器使用的预期结果。

任务构造时：

- 将 title、preconditions、非敏感 test_data、steps 拼成 browser-use 任务。
- 不把 expectations 放入 Agent 任务字符串。
- expectations 只交给后置验证器使用。

**安全规则**：

- 自动过滤 `api_key`、`auth_token`、`credential`、`password`、`secret`、`token`、`username` 等敏感字段。
- 如果 step 文本中疑似包含敏感字段，直接拒绝构造任务。

**讲述重点**：

不把 expectations 交给 Agent，是为了避免 Agent 只“迎合答案”；真正是否通过，必须由验证层独立判断。

### 5.9 browser-use 执行器实现

**页面标题**：browser-use 执行器实现

**对应实现文件**：

- `backend/src/specpilot_backend/agent/browser_use_runner.py`

**页面内容**：

执行器核心流程：

1. 构造 browser-use task。
2. 创建本地 Browser：
   - `headless` 由设置控制。
   - `user_data_dir=None`，保证运行环境干净。
   - `allowed_domains=*.4gaboards.com`，限制 Agent 跳转范围。
3. 根据设置创建 LLM：
   - OpenAI-compatible provider。
   - Browser Use hosted LLM。
   - DeepSeek V4 Pro compatibility path。
4. 通过 `sensitive_data` 注入 4ga 登录凭据。
5. 调用 `agent.run(max_steps=scenario.max_steps)`。
6. 从 history 中提取执行结果：
   - 是否成功。
   - 最终结果文本。
   - URL 轨迹。
   - action 名称序列。
   - screenshot 路径。
   - error 序列。
   - 总步数。

**讲述重点**：

项目严格使用 browser-use 作为唯一执行器，不使用 Playwright fallback，也不注册 4ga 领域专用 action。

### 5.10 为什么选择 browser-use 而不是 Playwright

**页面标题**：为什么选择 browser-use

**页面内容**：

本项目选择 browser-use，而不是 Playwright，主要不是因为 Playwright 能力不足，而是因为两者解决的问题不同。

**Playwright 更适合的场景**：

- 人工提前写好测试脚本。
- 测试流程和元素定位规则明确。
- 使用 selector、locator、xpath、role locator 等方式稳定定位元素。
- 适合传统确定性 E2E 测试。

**本项目的问题特点**：

- 测试场景来自用户手册，而手册不会提供 DOM selector。
- 场景步骤是自然语言意图，例如“在目标 List 中添加 Card”。
- 项目要求场景中不能包含 selector、locator、xpath、element_id、element_index。
- 目标是测试 Web Agent 能否根据实时页面观察自主完成任务。

**browser-use 的优势**：

- 内置 LLM Agent loop，可以根据页面状态自主观察、规划和执行。
- 支持 click、input、scroll、wait、drag、screenshot 等通用浏览器动作。
- 能基于运行时 DOM 和页面语义选择交互目标。
- 更符合“自然语言场景 -> 自主 Web 测试智能体”的任务目标。
- 可以返回 history，包括 action、URL、截图、错误和最终结果，便于后续 Trace 收集与验证。

**架构取舍**：

```text
Playwright:
  测试脚本 -> locator -> 确定性执行

browser-use:
  自然语言任务 -> LLM 观察页面 -> 自主选择动作 -> 执行并返回轨迹
```

**项目中的限制**：

- 不使用 Playwright 作为执行器、fallback runner 或隐藏测试 Agent。
- 不为 4ga Boards 编写领域专用 browser-use action。
- 让 browser-use 使用通用 Web 操作能力完成测试。

**讲述重点**：

Playwright 适合“我已经知道怎么点”的传统脚本测试；SpecPilot 要解决的是“只有手册和自然语言场景，让 Agent 自己理解页面并执行”。因此 browser-use 更契合项目目标。

### 5.11 运行编排与实时事件流

**页面标题**：运行编排与实时可视化

**对应实现文件**：

- `backend/src/specpilot_backend/services/run_executor.py`
- `backend/src/specpilot_backend/events/bus.py`
- `backend/src/specpilot_backend/services/trace_writer.py`
- `frontend/components/live/live-run-console.tsx`

**页面内容**：

运行创建后，后端会：

- 创建 `run_id`。
- 创建 `data/runs/{run_id}/` artifact 目录。
- 发布 `node_status` 事件，展示 LangGraph 节点状态。
- 捕获 browser-use 日志，转成 `browser_step` TraceEvent。
- 持久化截图，并发布 `browser_frame` 事件。
- 将所有事件写入 `trace.jsonl`。
- 通过 SSE 推送给前端实时显示。

前端实时执行页展示：

- React Flow Agent 节点图。
- browser-use 动作日志。
- 当前浏览器截图。
- 截图时间线。
- 最终判定与失败摘要。

**讲述重点**：

这部分让智能体执行过程从“黑盒”变成“可观察过程”，便于答辩演示和调试。

### 5.12 确定性验证器

**页面标题**：确定性验证器

**对应实现文件**：

- `backend/src/specpilot_backend/verification/deterministic.py`

**页面内容**：

确定性验证器基于执行后的快照进行检查：

- `element_visible`：检查目标文本或语义元素是否可见。
- `text_present`：检查页面是否包含或不包含指定文本。
- `url_match`：检查当前 URL 是否满足 pattern、contains 或 equals。
- `element_state`：检查元素 selected、checked、expanded、disabled 等状态。
- `containment`：检查子元素是否位于目标父容器中。

验证数据来源：

- DOM 文本。
- HTML 快照。
- accessibility tree。
- URL。
- DOM summary。

**讲述重点**：

确定性验证器负责可结构化判断的预期，优先使用 DOM、文本、URL 和可访问性树证据，避免全部依赖视觉模型。

### 5.13 GLM-4.6V 视觉验证器

**页面标题**：GLM-4.6V 视觉验证器

**对应实现文件**：

- `backend/src/specpilot_backend/verification/vision_glm.py`

**页面内容**：

视觉验证器用于处理：

- `semantic` 类型 expectation。
- `requires_visual_check=true` 的场景。
- 页面视觉状态、布局异常、拖拽后卡片位置、视图切换状态等难以仅靠 DOM 判断的结果。

调用方式：

- 输入初始截图和最终截图。
- 输入场景标题和 expectation 描述。
- 要求 GLM-4.6V 返回严格 JSON：

```json
{
  "verdict": "pass|fail|uncertain",
  "confidence": 0.88,
  "reasoning": "...",
  "evidence": "...",
  "suggested_failure_type": "visual_regression|null"
}
```

阈值规则：

- 高置信度阈值：0.85。
- 低置信度阈值：0.60。
- 低置信度或 uncertain 进入 `needs_review`。

**讲述重点**：

视觉模型不是替代确定性验证，而是补充语义和视觉状态判断；两者共同提升最终判定可靠性。

### 5.14 仲裁机制

**页面标题**：双通道验证仲裁

**对应实现文件**：

- `backend/src/specpilot_backend/verification/arbitration.py`

**页面内容**：

仲裁规则：

- 确定性验证通过，且不需要视觉验证：最终通过。
- semantic expectation 必须经过视觉验证。
- 确定性通过 + 视觉通过：最终通过。
- 确定性通过 + 视觉失败：最终失败，可能是视觉回归。
- 确定性失败 + 视觉通过：进入 `needs_review`，标记为 `fail_soft`。
- 任一通道低置信度：进入 `needs_review`。

**关键设计**：

Agent 自己报告 success 不能作为最终通过依据，只能作为辅助信号。

**讲述重点**：

系统把“Agent 觉得完成了”和“测试真的通过了”分开，这是智能测试工具区别于普通 Web Agent demo 的重要点。

### 5.15 失败分类器

**页面标题**：失败分类器

**对应实现文件**：

- `backend/src/specpilot_backend/failures/classifier.py`

**页面内容**：

失败分类器根据 verification failure、agent self-report、错误日志、URL、DOM summary、视觉 reasoning 等信号进行分类。

支持的类别：

- `navigation_failure`：导航失败。
- `element_not_found`：目标元素未找到。
- `interaction_failure`：点击、输入、拖拽等交互无效。
- `timing_issue`：加载或异步时序问题。
- `state_mismatch`：执行后状态与预期不一致。
- `visual_regression`：DOM 通过但视觉失败。
- `agent_planning_error`：Agent 规划或步骤理解错误。
- `dom_mismatch_visually_correct`：DOM 判断失败但视觉判断正确。
- `unknown`：兜底内部诊断类别。

**讲述重点**：

失败分类的目标不是只给 pass/fail，而是解释“为什么失败”，为后续改进测试场景、验证器或目标应用提供方向。

### 5.16 报告与 artifacts

**页面标题**：运行报告与证据归档

**对应实现文件**：

- `backend/src/specpilot_backend/reports/generator.py`
- `backend/src/specpilot_backend/api/runs.py`

**页面内容**：

每次运行会在 `data/runs/{run_id}/` 下保存：

- `trace.jsonl`：事件轨迹。
- `report.json`：结构化报告。
- `report.html`：可读 HTML 报告。
- `screenshots/`：关键步骤截图。
- `verification/`：验证结果。

报告中包含：

- run summary。
- verification results。
- trace events。
- failure classification。
- artifact links。

**安全处理**：

报告生成时会对 api_key、password、secret、token、credential、authorization 等敏感字段进行脱敏。

**讲述重点**：

报告是测试结果的可复查证据，也是课程答辩中展示系统完整性的关键材料。

### 5.17 框架创新点总结

**页面标题**：框架创新点总结

**页面内容**：

1. 零 locator 场景设计
   - 测试场景只描述用户意图。
   - 不生成 selector、xpath、element_id、element_index。
   - UI 改版时更具泛化能力。

2. 零领域专用 action
   - 不为 4ga Boards 封装专用 browser-use 工具。
   - 保留 Web Agent 根据实时 DOM 自主决策的能力。

3. LangGraph 与 browser-use 职责分离
   - browser-use 负责单场景执行 loop。
   - LangGraph 负责编排、记录、验证、分类、报告。

4. 双通道结果验证
   - DOM / 文本 / URL 的确定性判断。
   - GLM-4.6V 的视觉语义判断。

5. 可观察执行过程
   - SSE 实时事件流。
   - 节点状态图。
   - browser-use 动作日志。
   - 截图时间线。

6. 手册证据约束
   - 功能点和场景都必须带 source URLs 与 evidence quotes。
   - 通过 quote 校验和 schema 校验减少幻觉。

**讲述重点**：

这一页适合作为第 3 章的收束页，强调项目不只是“让 Agent 点网页”，而是把手册知识、场景生成、智能执行、结果验证和报告归档连成了完整闭环。

## 6. 研究进度与成果

### 6.1 当前实现成果

**页面标题**：当前实现成果

**页面内容**：

已实现模块：

- FastAPI 后端基础 API。
- SQLite 持久化。
- 手册生成 pipeline。
- 功能点抽取与场景生成。
- 零 locator 校验。
- browser-use 执行器。
- LangGraph 工作流基础节点。
- SSE TraceEvent 事件流。
- 实时执行可视化页面。
- 确定性验证器。
- GLM-4.6V 视觉验证器。
- 失败分类器。
- JSON / HTML 报告生成。
- Doctor 环境检查。
- Mutation schema 与 stub endpoint。
- 中文 Next.js 控制台。

当前本地数据：

- 功能点：48 个。
- 测试场景：62 个。
- 运行记录：17 条。
- 已覆盖模块：Project、Board、List、Card、Views、Admin、Other。

**讲述重点**：

这页要突出项目已经具备“从手册到执行记录”的端到端形态。

### 6.2 测试与验收情况

**页面标题**：测试与验收情况

**页面内容**：

后端测试覆盖：

- scenario schema 零 locator 校验。
- config 和模型 provider 配置。
- API contract。
- artifact path 安全解析。
- manual pipeline。
- generation validators。
- task builder。
- trace events。
- deterministic verifier。
- GLM threshold。
- failure classifier。
- report generation。

前端测试覆盖：

- App Shell。
- Dashboard。
- 手册生成页。
- 场景表格。
- 设置抽屉。
- Logo / 背景展示。

真实 E2E 验收依赖：

- 4ga demo 测试账号。
- 可访问 4ga 的网络环境。
- 文本模型 API key。
- GLM-4.6V API key。

**讲述重点**：

自动化测试验证了代码契约和页面功能；真实浏览器 E2E 需要在模型和测试账号配置完成后运行。

### 6.3 后续优化方向

**页面标题**：后续优化方向

**页面内容**：

- 补全 RepairPlanner 的自动修补策略。
- 增强失败分类中的 LLM-as-Judge 判断。
- 提升 browser-use 每步 action 的坐标和目标元素可视化。
- 扩展 mutation 生成算法。
- 形成更多真实失败样本，用于评估失败分类准确率。
- 完成更多 4ga 核心场景的真实 E2E 跑通。

**讲述重点**：

后续工作围绕稳定性、可解释性和评估指标展开。

## 7. 小组分工

**页面标题**：小组分工

**页面内容建议**：

- 李荣康：手册解析、功能点提取、ChromaDB 索引、RAG 检索。
- 陈柏睿：测试场景生成、Prompt 设计、证据校验、零 locator 检查。
- 许文硕：智能体层、browser-use 执行器、LangGraph 编排、SSE Trace、验证与失败分类。
- 黄良宏：评估指标、前端可视化、运行过程展示、报告页面。
- Team：需求讨论、代码审查、测试、答辩材料整理。

**注意修改模板旧内容**：

模板中原来出现“Playwright 执行引擎”，正式版需要改成“browser-use 执行引擎”。项目约束明确禁止使用 Playwright 作为执行器。

## 8. 结束页

**页面标题**：感谢观看

**页面内容**：

- 汇报结束，敬请各位老师同学批评指正。
- 可补充一句总结：
  - SpecPilot 将手册知识、Web Agent 执行和结果验证连接成完整闭环。
