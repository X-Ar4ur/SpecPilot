import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { FileBlob, PresentationFile } from "@oai/artifact-tool";
import {
  createSlideContext,
  padSlideNumber,
  saveBlobToFile,
} from "file:///C:/Users/xuws/.codex/plugins/cache/openai-primary-runtime/presentations/26.521.10419/skills/presentations/scripts/artifact_tool_utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspace = __dirname;
const starter = path.join(workspace, "template-starter.pptx");
const outputName = process.env.SPECPILOT_PPTX_OUT || "SpecPilot智能体层模板版可编辑汇报.pptx";
const output = path.join(workspace, "output", outputName);
const previewDir = path.join(workspace, "preview", "final");
const layoutDir = path.join(workspace, "layout", "final");

const W = 1280;
const H = 720;
const BLUE = "#0F4C9A";
const NAVY = "#0B2F63";
const CYAN = "#11B8D7";
const TEAL = "#10A6A6";
const GREEN = "#27AE60";
const AMBER = "#F5A623";
const RED = "#E74C3C";
const INK = "#102033";
const MUTED = "#5B6B83";
const LINE = "#B8CAE5";
const PALE = "#F4F8FE";
const WHITE = "#FFFFFF";
const FONT = "微软雅黑";

const artifact = await import("@oai/artifact-tool");
const ctx = createSlideContext(artifact, {
  slideSize: { width: W, height: H },
  workspaceDir: workspace,
  outputDir: path.dirname(output),
  assetDir: path.join(workspace, "assets"),
  titleFont: FONT,
  bodyFont: FONT,
});

function slidesOf(presentation) {
  return Array.from({ length: presentation.slides.count }, (_, i) => presentation.slides.getItem(i));
}

function textItems(slide) {
  return slide.shapes.items
    .map((shape) => {
      try {
        return { shape, text: String(shape.text || ""), position: shape.position };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function setCommonText(slide, slideNo, title) {
  const items = textItems(slide);
  const titleCandidate = items
    .filter((item) => item.position?.top > 120 && item.position?.top < 230 && item.position?.width > 180)
    .sort((a, b) => a.position.top - b.position.top)[0];
  if (titleCandidate && title) titleCandidate.shape.text = title;

  for (const item of items) {
    const trimmed = item.text.trim();
    if (/^\d{2}$/.test(trimmed) && item.position?.top > 600) {
      item.shape.text = String(slideNo).padStart(2, "0");
    }
    if (trimmed.includes("2026年4月23日")) {
      item.shape.text = item.text.replace("2026年4月23日", "2026年5月26日");
    }
    if (trimmed.includes("LLM-driven Test Scenario Generation")) {
      item.shape.text = "LLM-driven Test Scenario Generation & Autonomous Web Testing Agent";
    }
    if (trimmed.includes("基于大模型的测试场景生成")) {
      item.shape.text = "基于大模型的测试场景生成\n与自主 Web 测试智能体";
    }
  }
}

function clearOldContent(slide) {
  for (const shape of [...slide.shapes.items]) {
    const p = shape.position;
    if (!p) continue;
    const isChrome = p.top < 105 || p.top > 630;
    const isTitle = p.top > 120 && p.top < 230 && p.width > 180;
    const isBody = p.top > 210 && p.top < 620;
    if (!isChrome && !isTitle && isBody && typeof shape.delete === "function") {
      shape.delete();
    }
  }
  for (const image of [...(slide.images?.items || [])]) {
    const p = image.position;
    if (p && p.top > 210 && p.top < 620 && typeof image.delete === "function") {
      image.delete();
    }
  }
  for (const item of textItems(slide)) {
    const p = item.position;
    const keepChrome =
      p.top < 105 ||
      p.top > 630 ||
      item.text.includes("研究背景及意义") ||
      item.text.includes("研究目标与方案") ||
      item.text.includes("研究框架介绍") ||
      item.text.includes("研究进度安排") ||
      item.text.includes("小组分工");
    const keepTitle = p.top > 120 && p.top < 230 && p.width > 180;
    if (!keepChrome && !keepTitle) item.shape.text = "";
  }
}

function t(slide, text, x, y, w, h, opts = {}) {
  return ctx.addText(slide, {
    text,
    left: x,
    top: y,
    width: w,
    height: h,
    typeface: opts.typeface || FONT,
    fontSize: opts.fontSize || 22,
    color: opts.color || INK,
    bold: opts.bold || false,
    align: opts.align || "left",
    valign: opts.valign || "top",
    fill: opts.fill || "#00000000",
    line: opts.line || ctx.line("#00000000", 0),
    insets: opts.insets || { left: 0, right: 0, top: 0, bottom: 0 },
  });
}

function box(slide, x, y, w, h, opts = {}) {
  return ctx.addShape(slide, {
    geometry: opts.geometry || "roundRect",
    left: x,
    top: y,
    width: w,
    height: h,
    fill: opts.fill || WHITE,
    line: ctx.line(opts.line || LINE, opts.lineWidth || 1.3),
  });
}

function line(slide, x1, y1, x2, y2, color = BLUE, width = 2) {
  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  const w = Math.abs(x2 - x1) || 1;
  const h = Math.abs(y2 - y1) || 1;
  ctx.addShape(slide, {
    geometry: "line",
    left,
    top,
    width: w,
    height: h,
    fill: "#00000000",
    line: ctx.line(color, width),
  });
}

function arrow(slide, x, y, color = BLUE, size = 24) {
  t(slide, "→", x, y, 38, 30, { fontSize: size, bold: true, color, align: "center" });
}

function pill(slide, text, x, y, w, color = BLUE) {
  box(slide, x, y, w, 30, { fill: color, line: color });
  t(slide, text, x, y + 7, w, 16, { fontSize: 13, bold: true, color: WHITE, align: "center" });
}

function card(slide, title, body, x, y, w, h, color = BLUE) {
  box(slide, x, y, w, h, { fill: WHITE, line: "#D6E2F3" });
  ctx.addShape(slide, {
    geometry: "rect",
    left: x,
    top: y,
    width: 7,
    height: h,
    fill: color,
    line: ctx.line(color, 0),
  });
  t(slide, title, x + 18, y + 15, w - 34, 26, { fontSize: 18, bold: true, color });
  t(slide, body, x + 18, y + 48, w - 34, h - 58, { fontSize: 13.5, color: MUTED });
}

function smallIcon(slide, label, x, y, color = BLUE) {
  box(slide, x, y, 44, 44, { geometry: "ellipse", fill: color, line: color });
  t(slide, label, x, y + 10, 44, 20, { fontSize: 15, bold: true, color: WHITE, align: "center" });
}

function stage(slide, n, title, sub, x, y, w, color = BLUE) {
  box(slide, x, y, w, 92, { fill: "#F8FBFF", line: "#B9D5F5" });
  smallIcon(slide, String(n), x + 12, y + 16, color);
  t(slide, title, x + 66, y + 16, w - 80, 20, { fontSize: 15.5, bold: true, color: INK });
  t(slide, sub, x + 66, y + 45, w - 80, 32, { fontSize: 11.5, color: MUTED });
}

function metric(slide, value, label, x, y, color) {
  box(slide, x, y, 170, 82, { fill: "#F8FBFF", line: "#D6E6F7" });
  t(slide, value, x + 18, y + 15, 65, 32, { fontSize: 29, bold: true, color });
  t(slide, label, x + 86, y + 20, 68, 36, { fontSize: 13, color: MUTED });
}

function connector(slide, x1, y1, x2, y2) {
  line(slide, x1, y1, x2 - 22, y2, "#7A97BE", 1.5);
  arrow(slide, x2 - 34, y2 - 16, "#7A97BE", 20);
}

function addBullets(slide, bullets, x, y, w, lineH = 26) {
  bullets.forEach((b, i) => {
    smallIcon(slide, String(i + 1), x, y + i * lineH - 5, i % 2 ? CYAN : BLUE);
    t(slide, b, x + 54, y + i * lineH, w - 54, 20, { fontSize: 15, color: INK });
  });
}

function researchBackground(slide) {
  card(slide, "真实 Web 流程复杂", "页面动态、权限状态、弹窗与异步加载交织，传统脚本维护成本高。", 70, 250, 345, 100, BLUE);
  card(slide, "LLM Agent 仍易失败", "缺少待测系统领域知识时，容易输出与手册或 UI 不一致的操作。", 465, 250, 345, 100, CYAN);
  card(slide, "完成后难以判定", "Agent 自报成功不等于功能正确，需要 Trace、截图和验证器复核。", 860, 250, 345, 100, TEAL);
  box(slide, 112, 410, 1050, 115, { fill: "#F6FAFF", line: "#C9DAF0" });
  t(slide, "核心问题", 145, 446, 120, 26, { fontSize: 21, bold: true, color: BLUE });
  t(slide, "如何把 4ga Boards 手册中的功能描述，变成可执行、可验证、可追溯的 Web 测试任务？", 300, 435, 780, 38, { fontSize: 24, bold: true, color: INK });
  t(slide, "SpecPilot 的回答：手册证据约束生成，零 locator 保持意图表达，browser-use 自主执行，验证器给出可复查结论。", 302, 485, 770, 26, { fontSize: 15, color: MUTED });
}

function researchMeaning(slide) {
  const items = [
    ["手册", "软件手册转为结构化测试知识"],
    ["场景", "自然语言步骤，不绑定 DOM locator"],
    ["执行", "Web Agent 自主完成页面操作"],
    ["验证", "确定性验证 + 视觉验证"],
    ["诊断", "失败分类与报告归档"],
  ];
  items.forEach((it, i) => {
    const x = 92 + i * 230;
    smallIcon(slide, String(i + 1), x + 50, 252, [BLUE, CYAN, TEAL, GREEN, AMBER][i]);
    t(slide, it[0], x, 314, 144, 24, { fontSize: 20, bold: true, color: INK, align: "center" });
    t(slide, it[1], x - 16, 350, 176, 42, { fontSize: 13, color: MUTED, align: "center" });
    if (i < items.length - 1) arrow(slide, x + 170, 260, "#7A97BE", 27);
  });
  box(slide, 135, 460, 1010, 78, { fill: "#FFF9EF", line: "#F3D6A2" });
  t(slide, "形成“手册证据 → 测试场景 → 智能体执行 → 结果验证 → 失败分析”的闭环，而不是只让大模型写测试用例。", 170, 486, 940, 28, { fontSize: 21, bold: true, color: "#8A5700", align: "center" });
}

function overallFlow(slide) {
  const steps = [
    ["4ga 手册", "英文 user/admin manual"],
    ["清洗切片", "Markdown + heading path"],
    ["向量索引", "ChromaDB evidence"],
    ["场景生成", "Feature + Scenario"],
    ["自主执行", "browser-use Agent"],
    ["验证报告", "DOM/视觉/分类"],
  ];
  steps.forEach((s, i) => {
    const x = 65 + i * 195;
    stage(slide, i + 1, s[0], s[1], x, 245, 160, [BLUE, CYAN, TEAL, GREEN, AMBER, RED][i]);
    if (i < steps.length - 1) arrow(slide, x + 163, 275, "#6E86AA", 22);
  });
  card(slide, "边界 1：零 locator", "场景只表达用户意图，不写 selector、xpath、DOM id 或 element index。", 85, 410, 330, 100, CYAN);
  card(slide, "边界 2：browser-use 唯一执行器", "不使用 Playwright fallback，保持自然语言任务到 Agent 自主执行的路线。", 475, 410, 330, 100, BLUE);
  card(slide, "边界 3：本地可追溯", "Trace、截图、验证结果和报告统一归档到 data/runs/{run_id}/。", 865, 410, 330, 100, TEAL);
}

function goals(slide) {
  metric(slide, "48", "已抽取功能点", 95, 255, BLUE);
  metric(slide, "62", "已生成测试场景", 315, 255, CYAN);
  metric(slide, "17", "本地运行记录", 535, 255, GREEN);
  box(slide, 780, 248, 355, 95, { fill: "#F3FAFF", line: "#BBD9F4" });
  t(slide, "可运行本地闭环", 822, 274, 270, 28, { fontSize: 22, bold: true, color: BLUE, align: "center" });
  t(slide, "从手册到执行记录，已形成端到端系统形态", 824, 308, 270, 22, { fontSize: 13.5, color: MUTED, align: "center" });
  addBullets(slide, [
    "自动抽取 4ga Boards 主要功能点",
    "生成结构化、可执行、带证据的测试场景",
    "实时展示 Agent 节点状态、动作、截图与事件流",
    "对执行结果进行验证、失败分类和报告归档",
  ], 120, 410, 1000, 44);
}

function architecture(slide) {
  const layers = [
    ["Next.js 中文控制台", "Dashboard / Features / Scenarios / Live Run / Reports"],
    ["REST API + SSE", "运行创建、事件推送、报告导出"],
    ["FastAPI 后端", "SQLModel / SQLite / ChromaDB / Artifact storage"],
    ["LangGraph Workflow", "ScenarioLoader → BrowserUseRun → Verifier → Reporter"],
    ["browser-use Agent", "DeepSeek / OpenAI-compatible / Browser Use hosted LLM"],
    ["验证与报告", "Deterministic Verifier + GLM-4.6V + FailureClassifier"],
  ];
  layers.forEach((l, i) => {
    const y = 225 + i * 62;
    box(slide, 150 + i * 18, y, 980 - i * 36, 46, { fill: i % 2 ? "#F4FBFF" : "#F8FAFF", line: "#B9D1EC" });
    t(slide, l[0], 185 + i * 18, y + 12, 225, 20, { fontSize: 17, bold: true, color: BLUE });
    t(slide, l[1], 430 + i * 18, y + 14, 600 - i * 40, 18, { fontSize: 13, color: MUTED });
  });
}

function techStack(slide) {
  const groups = [
    ["前端展示层", "Next.js App Router\nTypeScript / Tailwind CSS\nRadix UI / Lucide Icons\nReact Flow / TanStack Query / Recharts"],
    ["后端服务层", "FastAPI / SQLModel\nSQLite / ChromaDB\nsse-starlette\npersistence + artifacts"],
    ["智能体层", "LangGraph workflow\nbrowser-use Agent\nOpenAI-compatible adapter\nlangchain-deepseek adapter"],
    ["验证与存储", "Deterministic Verifier\nGLM-4.6V adapter\nFailureClassifier\ndata/runs/{run_id}/"],
  ];
  groups.forEach((g, i) => {
    const x = 76 + (i % 2) * 580;
    const y = 235 + Math.floor(i / 2) * 182;
    card(slide, g[0], g[1], x, y, 500, 135, i % 2 ? CYAN : BLUE);
  });
}

function systemModules(slide) {
  const modules = [
    ["手册知识层", "爬取 / 清洗 / 切片 / 索引", "DOC"],
    ["场景生成层", "功能点抽取 / 零 locator 场景", "SCN"],
    ["智能体执行层", "任务构造 / browser-use 执行", "AGT"],
    ["验证与诊断层", "确定性验证 / GLM 视觉 / 分类", "CHK"],
    ["前端控制台层", "状态可视化 / 报告 / 运行历史", "UI"],
  ];
  modules.forEach((m, i) => {
    const y = 230 + i * 72;
    smallIcon(slide, m[2], 95, y + 8, [BLUE, CYAN, TEAL, GREEN, AMBER][i]);
    box(slide, 165, y, 880, 54, { fill: "#F9FCFF", line: "#BFD5EF" });
    t(slide, m[0], 200, y + 14, 190, 22, { fontSize: 20, bold: true, color: INK });
    t(slide, m[1], 450, y + 16, 430, 18, { fontSize: 14, color: MUTED });
    arrow(slide, 990, y + 10, "#7A97BE", 22);
    box(slide, 1060, y + 9, 100, 36, { fill: "#EEF7FF", line: "#BFD5EF" });
  });
}

function manualToScenarios(slide) {
  const steps = ["手册页面", "爬取清洗", "标题切片", "ChromaDB索引", "功能点抽取", "零locator场景", "校验入库"];
  steps.forEach((s, i) => {
    const x = 62 + i * 168;
    stage(slide, i + 1, s, i < 4 ? "证据保真" : "结构化输出", x, 232, 136, i % 2 ? CYAN : BLUE);
    if (i < steps.length - 1) arrow(slide, x + 136, 260, "#7A97BE", 18);
  });
  box(slide, 95, 405, 1080, 52, { fill: "#F3F8FF", line: "#BFD5EF" });
  t(slide, "手册知识层：URL / title / heading path / manual section / content hash", 120, 423, 810, 18, { fontSize: 15, color: BLUE, bold: true });
  box(slide, 95, 480, 1080, 52, { fill: "#F4FFFD", line: "#BFE8E4" });
  t(slide, "场景生成层：Feature → Scenario → evidence quotes → 零 locator 校验 → SQLite 持久化", 120, 498, 900, 18, { fontSize: 15, color: TEAL, bold: true });
}

function apiStorage(slide) {
  ["前端请求", "手册生成任务", "运行请求"].forEach((label, i) => {
    card(slide, label, ["/api/features\n/api/scenarios", "/api/pipeline/manual-to-scenarios", "/api/runs\n/events / artifacts"][i], 90, 245 + i * 95, 260, 70, [BLUE, CYAN, TEAL][i]);
    connector(slide, 350, 280 + i * 95, 490, 280 + i * 95);
  });
  box(slide, 505, 255, 300, 250, { fill: "#F6FEFD", line: "#70D3CB" });
  t(slide, "FastAPI 后端", 555, 285, 200, 28, { fontSize: 24, bold: true, color: TEAL, align: "center" });
  t(slide, "/api/features\n/api/scenarios\n/api/runs\n/api/settings\n/api/doctor", 590, 335, 130, 120, { fontSize: 15, color: INK, align: "center" });
  ["SQLite 元数据", "ChromaDB 索引", "Artifacts 文件", "SSE 事件流", "报告导出"].forEach((label, i) => {
    box(slide, 900, 225 + i * 67, 245, 46, { fill: "#F8FBFF", line: "#C8DAEE" });
    t(slide, label, 930, 239 + i * 67, 180, 18, { fontSize: 15.5, bold: true, color: INK });
    connector(slide, 805, 280, 900, 248 + i * 67);
  });
}

function frontendConsole(slide) {
  box(slide, 75, 225, 690, 330, { fill: "#F9FBFF", line: "#BFD5EF" });
  box(slide, 75, 225, 690, 44, { fill: NAVY, line: NAVY });
  t(slide, "SpecPilot 中文控制台", 100, 237, 240, 18, { fontSize: 16, bold: true, color: WHITE });
  ["工作台", "功能点", "测试场景", "执行过程", "执行记录"].forEach((v, i) => pill(slide, v, 110 + i * 118, 292, 88, i === 3 ? CYAN : BLUE));
  metric(slide, "48", "功能点", 118, 355, BLUE);
  metric(slide, "62", "场景", 328, 355, CYAN);
  metric(slide, "17", "运行", 538, 355, GREEN);
  box(slide, 115, 465, 280, 56, { fill: "#FFFFFF", line: "#D6E2F3" });
  t(slide, "SSE 实时事件流", 140, 482, 210, 18, { fontSize: 15, bold: true, color: BLUE });
  box(slide, 432, 465, 275, 56, { fill: "#FFFFFF", line: "#D6E2F3" });
  t(slide, "报告与运行历史", 465, 482, 210, 18, { fontSize: 15, bold: true, color: TEAL });
  card(slide, "控制台职责", "用中文界面串起功能点、场景、运行、报告四类工作流；通过实时事件流让智能体执行过程可观察、可解释、可复盘。", 830, 250, 330, 250, BLUE);
}

function agentLayer(slide) {
  box(slide, 65, 230, 1120, 320, { fill: "#F8FBFF", line: "#AAD3F5" });
  box(slide, 115, 285, 420, 170, { fill: "#FFFFFF", line: "#BFD5EF" });
  t(slide, "browser-use 内部 Agent loop", 145, 308, 350, 22, { fontSize: 18, bold: true, color: BLUE });
  ["观察页面", "规划动作", "执行动作", "返回轨迹"].forEach((v, i) => {
    stage(slide, i + 1, v, ["DOM + screenshot", "click/input/drag", "本地浏览器", "history + errors"][i], 140 + (i % 2) * 185, 350 + Math.floor(i / 2) * 68, 160, i % 2 ? CYAN : BLUE);
  });
  box(slide, 610, 275, 500, 190, { fill: "#FFFFFF", line: "#BFD5EF" });
  t(slide, "LangGraph 外部工作流", 650, 302, 350, 22, { fontSize: 18, bold: true, color: TEAL });
  ["ScenarioLoader", "BrowserUseRun", "TraceCollector", "Verifier", "FailureClassifier", "Reporter"].forEach((v, i) => {
    const x = 642 + (i % 3) * 148;
    const y = 350 + Math.floor(i / 3) * 62;
    box(slide, x, y, 128, 42, { fill: i === 1 ? "#E8FAFF" : "#F7FBFF", line: "#BFD5EF" });
    t(slide, v, x + 8, y + 13, 112, 14, { fontSize: 11.5, bold: true, color: INK, align: "center" });
  });
  t(slide, "职责边界：browser-use 负责单场景内部执行 loop；LangGraph 负责执行前后编排、记录、验证、分类和报告。", 170, 495, 900, 24, { fontSize: 16, bold: true, color: NAVY, align: "center" });
}

function langgraphRole(slide) {
  const nodes = ["ScenarioLoader", "BrowserUseRun", "TraceCollector", "DeterministicVerifier", "VisionVerifier", "FailureClassifier", "RepairPlanner", "Reporter"];
  nodes.forEach((n, i) => {
    const x = 70 + i * 140;
    box(slide, x, 305, 115, 55, { fill: i === 1 ? "#E6F8FF" : "#FFFFFF", line: i === 1 ? CYAN : "#BFD5EF" });
    t(slide, n, x + 8, 321, 100, 16, { fontSize: 10.5, bold: true, color: INK, align: "center" });
    if (i < nodes.length - 1) arrow(slide, x + 112, 318, "#7A97BE", 18);
  });
  card(slide, "固定运行阶段", "把一次 Agent 测试运行拆成可观测节点。", 105, 415, 230, 78, BLUE);
  card(slide, "支撑实时可视化", "React Flow 根据 TraceEvent 展示节点流转。", 390, 415, 230, 78, CYAN);
  card(slide, "便于后续扩展", "可插入二次验证、修补策略或人工审核节点。", 675, 415, 230, 78, TEAL);
  card(slide, "不替代 browser-use", "不重新规划每一次 click，避免职责重叠。", 960, 415, 230, 78, AMBER);
}

function taskBuilder(slide) {
  card(slide, "TestScenario", "title\npreconditions\ntest_data\nsteps\nexpectations", 90, 260, 250, 210, BLUE);
  arrow(slide, 365, 345, "#7A97BE", 30);
  card(slide, "TaskBuilder", "字段筛选\n敏感信息过滤\n内容转换与规范化\n补充执行规则", 445, 260, 290, 210, CYAN);
  arrow(slide, 760, 345, "#7A97BE", 30);
  card(slide, "browser-use 任务", "场景标题\n前置条件\n非敏感测试数据\n操作步骤\n执行规则", 835, 260, 290, 210, TEAL);
  box(slide, 258, 505, 360, 48, { fill: "#FFF2F0", line: "#F4B0A8" });
  t(slide, "password / token / api_key 不进入任务", 282, 522, 315, 16, { fontSize: 14, bold: true, color: RED, align: "center" });
  box(slide, 720, 505, 380, 48, { fill: "#F0FFF7", line: "#B9EBCF" });
  t(slide, "expectations 只交给后置验证器，避免 Agent 迎合答案", 742, 522, 340, 16, { fontSize: 14, bold: true, color: GREEN, align: "center" });
}

function browserUseChoice(slide) {
  box(slide, 105, 235, 470, 260, { fill: "#FFFFFF", line: "#BFD5EF" });
  box(slide, 105, 235, 470, 42, { fill: NAVY, line: NAVY });
  t(slide, "Playwright", 105, 247, 470, 18, { fontSize: 18, bold: true, color: WHITE, align: "center" });
  ["脚本驱动", "依赖 locator", "确定性 E2E", "适合已知流程"].forEach((v, i) => t(slide, "• " + v, 155, 305 + i * 38, 320, 22, { fontSize: 18, color: INK }));
  box(slide, 705, 235, 470, 260, { fill: "#FFFFFF", line: "#BFD5EF" });
  box(slide, 705, 235, 470, 42, { fill: TEAL, line: TEAL });
  t(slide, "browser-use", 705, 247, 470, 18, { fontSize: 18, bold: true, color: WHITE, align: "center" });
  ["自然语言任务", "运行时观察", "自主规划动作", "返回执行轨迹"].forEach((v, i) => t(slide, "• " + v, 755, 305 + i * 38, 320, 22, { fontSize: 18, color: INK }));
  box(slide, 215, 535, 850, 46, { fill: "#FFF8E8", line: "#F1CE78" });
  t(slide, "手册场景需要 Agent 自主执行：没有 selector，只有自然语言意图。", 245, 548, 790, 20, { fontSize: 20, bold: true, color: "#9A6500", align: "center" });
}

function liveTrace(slide) {
  box(slide, 90, 255, 300, 240, { fill: "#F8FBFF", line: "#BFD5EF" });
  t(slide, "后端 Run Executor", 125, 285, 230, 22, { fontSize: 20, bold: true, color: BLUE, align: "center" });
  ["创建 run_id", "Browser Use 执行", "校验与分类", "写入 trace.jsonl"].forEach((v, i) => pill(slide, v, 140, 335 + i * 38, 200, i % 2 ? CYAN : BLUE));
  arrow(slide, 420, 350, "#7A97BE", 30);
  card(slide, "TraceEvent", "node_status\nbrowser_step\nbrowser_frame\nverification\nclassification\nreport", 500, 260, 250, 240, CYAN);
  arrow(slide, 780, 350, "#7A97BE", 30);
  box(slide, 870, 255, 300, 240, { fill: "#FFFFFF", line: "#BFD5EF" });
  t(slide, "前端实时页", 915, 285, 210, 22, { fontSize: 20, bold: true, color: TEAL, align: "center" });
  ["Agent 节点图", "动作日志", "浏览器截图", "截图时间线"].forEach((v, i) => t(slide, "• " + v, 930, 335 + i * 38, 180, 20, { fontSize: 16, color: INK }));
}

function verification(slide) {
  box(slide, 100, 245, 490, 160, { fill: "#F8FBFF", line: "#BFD5EF" });
  t(slide, "DeterministicVerifier", 145, 270, 390, 22, { fontSize: 19, bold: true, color: BLUE, align: "center" });
  ["DOM文本", "URL", "可访问性树", "HTML快照"].forEach((v, i) => pill(slide, v, 130 + i * 110, 325, 90, BLUE));
  box(slide, 690, 245, 490, 160, { fill: "#F4FFFD", line: "#BFE8E4" });
  t(slide, "VisionVerifier", 735, 270, 390, 22, { fontSize: 19, bold: true, color: TEAL, align: "center" });
  ["初始截图", "最终截图", "GLM-4.6V", "语义判断"].forEach((v, i) => pill(slide, v, 720 + i * 110, 325, 90, TEAL));
  box(slide, 160, 462, 960, 82, { fill: "#FFFFFF", line: "#D6E2F3" });
  t(slide, "仲裁规则", 190, 490, 110, 20, { fontSize: 18, bold: true, color: BLUE });
  t(slide, "确定性通过 + 无需视觉 → pass；semantic 必须走视觉；任一通道低置信度 → needs_review；通道冲突 → fail_soft / 人工复核。", 330, 486, 735, 24, { fontSize: 16, color: INK });
}

function failureClassifier(slide) {
  const inputs = ["verification", "agent 自报", "errors", "final URL", "DOM Summary"];
  inputs.forEach((v, i) => card(slide, v, "诊断信号", 80, 235 + i * 58, 230, 44, i % 2 ? CYAN : BLUE));
  arrow(slide, 340, 350, "#7A97BE", 28);
  box(slide, 430, 285, 260, 150, { fill: NAVY, line: NAVY });
  t(slide, "FailureClassifier\n失败分类器", 470, 336, 180, 45, { fontSize: 21, bold: true, color: WHITE, align: "center" });
  arrow(slide, 710, 350, "#7A97BE", 28);
  const cats = [
    "navigation_failure",
    "element_not_found",
    "interaction_failure",
    "timing_issue",
    "state_mismatch",
    "visual_regression",
    "agent_planning_error",
    "unknown",
  ];
  cats.forEach((v, i) => {
    const x = 800 + (i % 2) * 170;
    const y = 235 + Math.floor(i / 2) * 53;
    pill(slide, v, x, y, 150, [RED, AMBER, BLUE, CYAN][i % 4]);
  });
  box(slide, 800, 465, 320, 66, { fill: "#F8FBFF", line: "#D6E2F3" });
  t(slide, "输出：primary / secondary[] / reason / 判定依据", 825, 488, 270, 18, { fontSize: 14.5, bold: true, color: TEAL, align: "center" });
}

function reportArtifacts(slide) {
  card(slide, "一次运行 Run", "run_id\nscenario_id\nstart/end\n模型配置", 95, 290, 220, 145, BLUE);
  arrow(slide, 340, 345, "#7A97BE", 26);
  box(slide, 420, 250, 315, 230, { fill: "#F8FBFF", line: "#BFD5EF" });
  t(slide, "data/runs/{run_id}/", 450, 278, 250, 22, { fontSize: 19, bold: true, color: BLUE });
  ["trace.jsonl", "report.json", "report.html", "screenshots/", "verification/"].forEach((v, i) => t(slide, "□ " + v, 470, 318 + i * 29, 190, 18, { fontSize: 15, color: INK }));
  arrow(slide, 755, 345, "#7A97BE", 26);
  box(slide, 830, 250, 340, 230, { fill: WHITE, line: "#BFD5EF" });
  t(slide, "报告预览 report.html", 870, 278, 250, 22, { fontSize: 19, bold: true, color: TEAL });
  ["Run Summary", "Verification Results", "Trace Events", "Failure Classification", "Artifact Links"].forEach((v, i) => pill(slide, v, 885, 318 + i * 29, 215, i % 2 ? CYAN : TEAL));
  box(slide, 260, 525, 760, 42, { fill: "#FFF2F0", line: "#F4B0A8" });
  t(slide, "安全处理：报告生成时脱敏 api_key / password / secret / token / credential / authorization。", 290, 537, 700, 18, { fontSize: 15, bold: true, color: RED, align: "center" });
}

function innovation(slide) {
  const items = [
    ["零 locator 场景", "只描述用户意图，提升 UI 改版泛化能力", BLUE],
    ["零领域专用 action", "保留 Web Agent 实时 DOM 自主决策价值", CYAN],
    ["职责边界清晰", "browser-use 执行，LangGraph 编排验证报告", TEAL],
    ["双通道验证", "DOM / URL / 文本 + GLM-4.6V 视觉语义", GREEN],
    ["可观察执行", "SSE 事件流、节点状态图、截图时间线", AMBER],
    ["手册证据约束", "source URLs + evidence quotes 降低幻觉", RED],
  ];
  items.forEach((it, i) => {
    const x = 95 + (i % 3) * 375;
    const y = 245 + Math.floor(i / 3) * 145;
    card(slide, it[0], it[1], x, y, 320, 95, it[2]);
  });
}

function currentResults(slide) {
  metric(slide, "48", "功能点", 90, 245, BLUE);
  metric(slide, "62", "测试场景", 300, 245, CYAN);
  metric(slide, "17", "运行记录", 510, 245, GREEN);
  metric(slide, "6+", "覆盖模块", 720, 245, TEAL);
  box(slide, 90, 365, 330, 160, { fill: "#FFFFFF", line: "#D6E2F3" });
  t(slide, "功能点实现进度", 120, 390, 220, 20, { fontSize: 17, bold: true, color: INK });
  box(slide, 145, 430, 90, 90, { geometry: "ellipse", fill: "#E9F2FF", line: "#C8DAEE" });
  t(slide, "80%", 158, 461, 65, 24, { fontSize: 24, bold: true, color: BLUE, align: "center" });
  t(slide, "已实现 48 / 计划 60", 258, 455, 130, 22, { fontSize: 13, color: MUTED });
  box(slide, 465, 365, 330, 160, { fill: "#FFFFFF", line: "#D6E2F3" });
  t(slide, "测试场景类别分布", 495, 390, 220, 20, { fontSize: 17, bold: true, color: INK });
  [22, 16, 12, 7, 5].forEach((v, i) => {
    const h = v * 4;
    box(slide, 505 + i * 48, 490 - h, 26, h, { fill: [BLUE, CYAN, TEAL, AMBER, RED][i], line: [BLUE, CYAN, TEAL, AMBER, RED][i] });
    t(slide, String(v), 500 + i * 48, 493, 36, 14, { fontSize: 10.5, color: MUTED, align: "center" });
  });
  box(slide, 840, 365, 330, 160, { fill: "#FFFFFF", line: "#D6E2F3" });
  t(slide, "已完成模块清单", 870, 390, 220, 20, { fontSize: 17, bold: true, color: INK });
  ["手册生成", "功能点抽取", "场景生成", "browser-use执行", "验证器", "报告导出", "Doctor检查"].forEach((v, i) => {
    t(slide, "✓ " + v, 880 + (i % 2) * 145, 428 + Math.floor(i / 2) * 28, 130, 16, { fontSize: 13.5, color: i % 2 ? TEAL : BLUE, bold: true });
  });
}

function testingNext(slide) {
  card(slide, "后端测试覆盖", "schema 零 locator 校验\nconfig 与 provider\nartifact path 安全\nmanual pipeline\nfailure classifier\nreport generation", 90, 245, 320, 210, BLUE);
  card(slide, "前端测试覆盖", "App Shell\nDashboard\n手册生成页\n场景表格\n设置抽屉\nLogo / 背景展示", 480, 245, 320, 210, CYAN);
  card(slide, "后续优化方向", "RepairPlanner 自动修补\n失败分类 LLM-as-Judge\naction 目标高亮\nmutation 生成算法\n更多真实 E2E 样本", 870, 245, 320, 210, TEAL);
  box(slide, 165, 505, 950, 44, { fill: "#F6FAFF", line: "#BFD5EF" });
  t(slide, "真实 E2E 验收依赖测试账号、4ga 网络环境、文本模型 API key 和 GLM-4.6V API key。", 195, 518, 890, 18, { fontSize: 15.5, bold: true, color: NAVY, align: "center" });
}

function team(slide) {
  const members = [
    ["李荣康", "手册解析 / 功能点提取 / ChromaDB 索引"],
    ["陈柏睿", "测试场景生成 / Prompt / 证据校验"],
    ["许文硕", "智能体层 / browser-use / LangGraph / 验证分类"],
    ["黄良宏", "评估指标 / 前端可视化 / 报告页面"],
    ["Team", "需求讨论 / 代码审查 / 测试 / 答辩材料"],
  ];
  members.forEach((m, i) => {
    const x = 65 + i * 238;
    card(slide, m[0], m[1], x, 265, 205, 155, [BLUE, CYAN, TEAL, AMBER, RED][i]);
    smallIcon(slide, String.fromCharCode(65 + i), x + 81, 450, [BLUE, CYAN, TEAL, AMBER, RED][i]);
  });
}

const slidePlan = [
  ["", null],
  ["", null],
  ["", null],
  ["1.1  研究背景", researchBackground],
  ["1.2  研究意义", researchMeaning],
  ["", null],
  ["2.1  总体流程", overallFlow],
  ["2.2  研究目标", goals],
  ["2.3  总体架构", architecture],
  ["", null],
  ["3.1  整体技术栈", techStack],
  ["3.2  系统模块划分", systemModules],
  ["3.3  手册知识层与场景生成层", manualToScenarios],
  ["3.4  后端 API 与数据存储", apiStorage],
  ["3.5  前端控制台与可视化", frontendConsole],
  ["3.6  智能体层总体设计", agentLayer],
  ["3.7  LangGraph 的作用", langgraphRole],
  ["3.8  从测试场景到 Agent 任务", taskBuilder],
  ["3.9  为什么选择 browser-use", browserUseChoice],
  ["3.10  运行编排与实时事件流", liveTrace],
  ["3.11  双通道验证与仲裁", verification],
  ["3.12  失败分类器", failureClassifier],
  ["3.13  运行报告与证据归档", reportArtifacts],
  ["3.14  框架创新点总结", innovation],
  ["", null],
  ["4.1  当前实现成果", currentResults],
  ["4.2  测试与验收情况", testingNext],
  ["5.1  小组分工", team],
  ["", null],
];

const presentation = await PresentationFile.importPptx(await FileBlob.load(starter));
const slides = slidesOf(presentation);
const maxDrawSlide = process.env.SPECPILOT_MAX_DRAW_SLIDE
  ? Number.parseInt(process.env.SPECPILOT_MAX_DRAW_SLIDE, 10)
  : Number.POSITIVE_INFINITY;
slides.forEach((slide, index) => {
  const [title, draw] = slidePlan[index] || ["", null];
  setCommonText(slide, index + 1, title);
  if (draw && index + 1 <= maxDrawSlide) {
    clearOldContent(slide);
    draw(slide);
  }
});

await fs.mkdir(path.dirname(output), { recursive: true });
const pptx = await PresentationFile.exportPptx(presentation);
await pptx.save(output);

await fs.mkdir(previewDir, { recursive: true });
await fs.mkdir(layoutDir, { recursive: true });
const previewPaths = [];
for (let i = 0; i < slides.length; i += 1) {
  const slide = slides[i];
  const preview = await presentation.export({ slide, format: "png", scale: 1 });
  const previewPath = path.join(previewDir, `slide-${padSlideNumber(i + 1)}.png`);
  await saveBlobToFile(preview, previewPath);
  previewPaths.push(previewPath);
  const layout = await presentation.export({ slide, format: "layout" });
  await saveBlobToFile(layout, path.join(layoutDir, `slide-${padSlideNumber(i + 1)}.layout.json`));
}

await fs.writeFile(
  path.join(workspace, "output", "final-manifest.json"),
  JSON.stringify({ output, slideCount: slides.length, previewDir, layoutDir, previewPaths }, null, 2),
  "utf8",
);
console.log(output);
