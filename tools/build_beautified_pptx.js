const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");

const ROOT = "D:/Work/UCASNJ/SpecPilot";
const IMG_DIR = path.join(ROOT, "ppt_images");
const OUT_DIR = path.join(ROOT, "PPT输出");
const OUT_FILE = path.join(OUT_DIR, "SpecPilot智能测试系统汇报_美化版.pptx");

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "第7组";
pptx.company = "UCASNJ";
pptx.subject = "SpecPilot 项目汇报";
pptx.title = "基于大模型的测试场景生成与自主 Web 测试智能体";
pptx.lang = "zh-CN";
pptx.theme = {
  headFontFace: "Microsoft YaHei",
  bodyFontFace: "Microsoft YaHei",
  lang: "zh-CN",
};
pptx.defineLayout({ name: "LAYOUT_WIDE", width: 13.333, height: 7.5 });

const C = {
  navy: "1E2761",
  navy2: "111B45",
  blue: "2563EB",
  cyan: "06B6D4",
  teal: "0F9F9A",
  ice: "EAF4FF",
  pale: "F8FAFC",
  line: "D7E3F3",
  text: "172033",
  muted: "64748B",
  white: "FFFFFF",
  green: "16A34A",
  amber: "F59E0B",
  red: "EF4444",
};

const W = 13.333;
const H = 7.5;
const font = "Microsoft YaHei";

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function text(slide, value, x, y, w, h, opts = {}) {
  slide.addText(value, {
    x, y, w, h,
    fontFace: font,
    margin: opts.margin ?? 0,
    breakLine: false,
    fit: "shrink",
    ...opts,
  });
}

function shape(slide, type, x, y, w, h, opts = {}) {
  slide.addShape(type, { x, y, w, h, ...opts });
}

function line(slide, x, y, w, h, color = C.line, width = 1) {
  shape(slide, pptx.ShapeType.line, x, y, w, h, { line: { color, width } });
}

function pill(slide, label, x, y, w, color = C.blue) {
  shape(slide, pptx.ShapeType.roundRect, x, y, w, 0.32, {
    rectRadius: 0.04,
    fill: { color },
    line: { color, transparency: 100 },
  });
  text(slide, label, x + 0.08, y + 0.06, w - 0.16, 0.2, {
    fontSize: 8.5,
    bold: true,
    color: C.white,
    align: "center",
  });
}

function darkGeometry(slide) {
  slide.background = { color: C.navy };
  shape(slide, pptx.ShapeType.parallelogram, 8.1, -0.6, 4.9, 2.2, {
    rotate: 0,
    fill: { color: C.blue, transparency: 12 },
    line: { color: C.blue, transparency: 100 },
  });
  shape(slide, pptx.ShapeType.parallelogram, 9.3, -0.15, 4.4, 1.7, {
    fill: { color: C.cyan, transparency: 8 },
    line: { color: C.cyan, transparency: 100 },
  });
  shape(slide, pptx.ShapeType.parallelogram, 9.4, 5.95, 4.8, 1.2, {
    fill: { color: C.blue, transparency: 5 },
    line: { color: C.blue, transparency: 100 },
  });
  shape(slide, pptx.ShapeType.parallelogram, 10.8, 6.45, 3.1, 0.72, {
    fill: { color: C.cyan, transparency: 15 },
    line: { color: C.cyan, transparency: 100 },
  });
}

function lightChrome(slide, chapter, title, pageNo) {
  slide.background = { color: C.pale };
  shape(slide, pptx.ShapeType.rect, 0, 0, 0.18, H, {
    fill: { color: C.navy },
    line: { color: C.navy, transparency: 100 },
  });
  shape(slide, pptx.ShapeType.rect, 0.18, 0, 0.08, H, {
    fill: { color: C.cyan },
    line: { color: C.cyan, transparency: 100 },
  });
  shape(slide, pptx.ShapeType.parallelogram, 10.9, 0, 2.8, 0.45, {
    fill: { color: C.blue, transparency: 10 },
    line: { color: C.blue, transparency: 100 },
  });
  shape(slide, pptx.ShapeType.parallelogram, 11.75, 0, 1.8, 0.45, {
    fill: { color: C.cyan, transparency: 0 },
    line: { color: C.cyan, transparency: 100 },
  });
  pill(slide, chapter, 0.62, 0.38, 0.78, C.navy);
  text(slide, title, 1.52, 0.30, 8.9, 0.45, {
    fontSize: 22,
    bold: true,
    color: C.text,
  });
  text(slide, String(pageNo).padStart(2, "0"), 12.32, 6.92, 0.48, 0.22, {
    fontSize: 8.5,
    color: C.muted,
    align: "right",
  });
  line(slide, 0.62, 6.74, 11.72, 0, "E4ECF7", 0.8);
}

function sectionSlide(num, titleCn, titleEn) {
  const slide = pptx.addSlide();
  darkGeometry(slide);
  text(slide, String(num), 0.88, 1.15, 1.4, 1.0, {
    fontSize: 62,
    bold: true,
    color: C.cyan,
  });
  text(slide, titleCn, 2.15, 1.28, 5.4, 0.62, {
    fontSize: 29,
    bold: true,
    color: C.white,
  });
  text(slide, titleEn, 2.17, 2.0, 5.7, 0.34, {
    fontSize: 13,
    color: "CADCFC",
  });
  shape(slide, pptx.ShapeType.rect, 2.17, 2.55, 2.6, 0.06, {
    fill: { color: C.cyan },
    line: { color: C.cyan, transparency: 100 },
  });
  text(slide, "SpecPilot", 10.85, 6.78, 1.35, 0.24, {
    fontSize: 10,
    bold: true,
    color: "CADCFC",
    align: "right",
  });
}

function card(slide, x, y, w, h, title, body, accent = C.blue) {
  shape(slide, pptx.ShapeType.roundRect, x, y, w, h, {
    rectRadius: 0.08,
    fill: { color: C.white },
    line: { color: C.line, width: 0.8 },
    shadow: { type: "outer", color: "94A3B8", blur: 1.5, offset: 1.1, angle: 45, opacity: 0.13 },
  });
  shape(slide, pptx.ShapeType.rect, x, y, 0.08, h, {
    fill: { color: accent },
    line: { color: accent, transparency: 100 },
  });
  text(slide, title, x + 0.25, y + 0.22, w - 0.46, 0.28, {
    fontSize: 14.5,
    bold: true,
    color: C.text,
  });
  text(slide, body, x + 0.25, y + 0.63, w - 0.45, h - 0.78, {
    fontSize: 10.5,
    color: C.muted,
    breakLine: false,
    fit: "shrink",
    valign: "top",
  });
}

function metric(slide, x, y, value, label, color) {
  shape(slide, pptx.ShapeType.roundRect, x, y, 2.12, 1.08, {
    rectRadius: 0.08,
    fill: { color: C.white },
    line: { color: C.line, width: 0.8 },
    shadow: { type: "outer", color: "94A3B8", blur: 1.2, offset: 0.9, angle: 45, opacity: 0.12 },
  });
  text(slide, value, x + 0.18, y + 0.12, 0.9, 0.45, {
    fontSize: 25,
    bold: true,
    color,
  });
  text(slide, label, x + 0.2, y + 0.62, 1.68, 0.22, {
    fontSize: 9.6,
    color: C.muted,
  });
}

function stage(slide, n, title, body, x, y, w, color) {
  shape(slide, pptx.ShapeType.chevron, x, y, w, 1.05, {
    fill: { color, transparency: 0 },
    line: { color, transparency: 100 },
  });
  text(slide, String(n).padStart(2, "0"), x + 0.18, y + 0.13, 0.38, 0.28, {
    fontSize: 12,
    bold: true,
    color: C.white,
  });
  text(slide, title, x + 0.62, y + 0.13, w - 0.82, 0.25, {
    fontSize: 11.5,
    bold: true,
    color: C.white,
  });
  text(slide, body, x + 0.62, y + 0.48, w - 0.95, 0.34, {
    fontSize: 8.2,
    color: "EAF4FF",
    fit: "shrink",
  });
}

function containImage(slide, imgName, x, y, w, h) {
  const img = path.join(IMG_DIR, imgName);
  shape(slide, pptx.ShapeType.roundRect, x - 0.03, y + 0.06, w + 0.06, h, {
    rectRadius: 0.06,
    fill: { color: "CBD5E1", transparency: 48 },
    line: { color: "CBD5E1", transparency: 100 },
  });
  shape(slide, pptx.ShapeType.roundRect, x - 0.01, y - 0.01, w + 0.02, h + 0.02, {
    rectRadius: 0.06,
    fill: { color: C.white },
    line: { color: C.line, width: 0.8 },
  });
  const ratio = 16 / 9;
  let iw = w;
  let ih = w / ratio;
  if (ih > h) {
    ih = h;
    iw = h * ratio;
  }
  const ix = x + (w - iw) / 2;
  const iy = y + (h - ih) / 2;
  slide.addImage({ path: img, x: ix, y: iy, w: iw, h: ih, altText: imgName });
}

function imageSlide(chapter, title, pageNo, imgName, insightTitle, insightBody) {
  const slide = pptx.addSlide();
  lightChrome(slide, chapter, title, pageNo);
  containImage(slide, imgName, 0.72, 1.10, 8.9, 5.45);
  shape(slide, pptx.ShapeType.roundRect, 9.92, 1.16, 2.72, 5.25, {
    rectRadius: 0.08,
    fill: { color: C.navy },
    line: { color: C.navy, transparency: 100 },
  });
  text(slide, insightTitle, 10.18, 1.55, 2.15, 0.62, {
    fontSize: 17,
    bold: true,
    color: C.white,
    fit: "shrink",
  });
  shape(slide, pptx.ShapeType.rect, 10.18, 2.35, 0.52, 0.06, {
    fill: { color: C.cyan },
    line: { color: C.cyan, transparency: 100 },
  });
  text(slide, insightBody, 10.18, 2.62, 2.15, 2.85, {
    fontSize: 10.5,
    color: "D7E6FF",
    valign: "top",
    breakLine: false,
    fit: "shrink",
  });
  pill(slide, "图示", 10.18, 5.78, 0.62, C.cyan);
  text(slide, "内容遵循大纲，可直接用于第3章之后的讲解页。", 10.9, 5.83, 1.42, 0.2, {
    fontSize: 7.6,
    color: "CADCFC",
    fit: "shrink",
  });
}

function addCover() {
  const slide = pptx.addSlide();
  darkGeometry(slide);
  text(slide, "基于大模型的测试场景生成\n与自主 Web 测试智能体", 0.82, 1.14, 7.7, 1.18, {
    fontSize: 31,
    bold: true,
    color: C.white,
    breakLine: false,
    fit: "shrink",
  });
  text(slide, "SpecPilot：面向 4ga Boards 的手册驱动智能测试系统", 0.86, 2.52, 7.2, 0.36, {
    fontSize: 14,
    color: "CADCFC",
  });
  shape(slide, pptx.ShapeType.rect, 0.86, 3.06, 1.78, 0.06, {
    fill: { color: C.cyan },
    line: { color: C.cyan, transparency: 100 },
  });
  const items = [
    ["手册证据", "Manual Evidence"],
    ["零 Locator", "Zero-locator Scenario"],
    ["LangGraph", "Agent Orchestration"],
    ["browser-use", "Autonomous Browser"],
    ["可验证报告", "Trace & Report"],
  ];
  items.forEach((it, idx) => {
    const x = 0.88 + idx * 1.48;
    shape(slide, pptx.ShapeType.ellipse, x, 4.25, 0.54, 0.54, {
      fill: { color: idx % 2 ? C.blue : C.cyan },
      line: { color: C.white, transparency: 100 },
    });
    text(slide, String(idx + 1), x, 4.39, 0.54, 0.2, {
      fontSize: 10,
      bold: true,
      color: C.white,
      align: "center",
    });
    text(slide, it[0], x - 0.12, 4.96, 0.82, 0.22, {
      fontSize: 8.5,
      bold: true,
      color: C.white,
      align: "center",
      fit: "shrink",
    });
    text(slide, it[1], x - 0.22, 5.24, 1.02, 0.2, {
      fontSize: 6.7,
      color: "CADCFC",
      align: "center",
      fit: "shrink",
    });
  });
  text(slide, "小组：第7组     汇报人：第7组     2026年5月", 0.88, 6.65, 5.9, 0.28, {
    fontSize: 11,
    color: "D7E6FF",
  });
}

function addAgenda() {
  const slide = pptx.addSlide();
  darkGeometry(slide);
  text(slide, "目录", 0.76, 0.62, 1.4, 0.5, {
    fontSize: 28,
    bold: true,
    color: C.white,
  });
  text(slide, "Agenda", 0.79, 1.13, 1.2, 0.22, {
    fontSize: 9.5,
    color: "CADCFC",
  });
  const rows = [
    ["01", "研究背景及意义", "为什么需要手册驱动的 Web 智能测试"],
    ["02", "研究目标与方案", "从手册到场景、执行、验证和报告"],
    ["03", "研究框架介绍", "重点展开 LangGraph 与 browser-use 智能体层"],
    ["04", "研究进度与成果", "当前实现数据、运行闭环和下一步计划"],
    ["05", "小组分工", "模块协作与职责划分"],
  ];
  rows.forEach((r, i) => {
    const y = 1.62 + i * 0.92;
    shape(slide, pptx.ShapeType.roundRect, 2.0, y, 8.9, 0.66, {
      rectRadius: 0.08,
      fill: { color: i === 2 ? C.cyan : "FFFFFF", transparency: i === 2 ? 0 : 88 },
      line: { color: "FFFFFF", transparency: 100 },
    });
    text(slide, r[0], 2.28, y + 0.17, 0.55, 0.22, {
      fontSize: 12,
      bold: true,
      color: i === 2 ? C.white : "CADCFC",
      align: "center",
    });
    text(slide, r[1], 3.07, y + 0.13, 2.35, 0.25, {
      fontSize: 13,
      bold: true,
      color: C.white,
    });
    text(slide, r[2], 5.65, y + 0.18, 4.65, 0.2, {
      fontSize: 8.5,
      color: i === 2 ? C.white : "CADCFC",
    });
  });
}

function addBackground() {
  const slide = pptx.addSlide();
  lightChrome(slide, "01", "研究背景", 3);
  card(slide, 0.72, 1.28, 3.65, 1.58, "真实 Web 流程复杂", "页面状态、弹窗、权限与异步加载交织，传统脚本维护成本高。", C.blue);
  card(slide, 4.72, 1.28, 3.65, 1.58, "LLM 容易缺少领域知识", "没有手册证据约束时，模型可能生成与系统能力不一致的操作。", C.cyan);
  card(slide, 8.72, 1.28, 3.65, 1.58, "执行成功难以判定", "仅看最后一条回答不足以确认业务状态，需要 Trace、截图和验证器。", C.teal);
  shape(slide, pptx.ShapeType.roundRect, 0.72, 3.5, 11.65, 1.72, {
    rectRadius: 0.08,
    fill: { color: C.navy },
    line: { color: C.navy, transparency: 100 },
  });
  text(slide, "核心问题", 1.05, 3.83, 1.18, 0.32, {
    fontSize: 15,
    bold: true,
    color: C.white,
  });
  text(slide, "如何把 4ga Boards 手册中的功能描述，变成可执行、可验证、可追溯的 Web 测试任务？", 2.38, 3.78, 8.95, 0.46, {
    fontSize: 20,
    bold: true,
    color: C.white,
    fit: "shrink",
  });
  text(slide, "SpecPilot 的回答：手册证据约束生成，零 locator 保持意图表达，browser-use 自主执行，验证器给出可复查结论。", 2.42, 4.5, 8.8, 0.28, {
    fontSize: 10.5,
    color: "D7E6FF",
  });
}

function addSignificance() {
  const slide = pptx.addSlide();
  lightChrome(slide, "01", "研究意义", 4);
  const xs = [0.9, 3.25, 5.6, 7.95, 10.3];
  const labels = [
    ["手册知识", "降低凭空生成"],
    ["结构化场景", "可执行可追溯"],
    ["智能体执行", "减少脚本编写"],
    ["双重验证", "提高判定可靠性"],
    ["失败分类", "辅助定位修复"],
  ];
  xs.forEach((x, i) => {
    shape(slide, pptx.ShapeType.ellipse, x, 1.45, 1.42, 1.42, {
      fill: { color: i % 2 ? C.blue : C.cyan },
      line: { color: C.white, width: 2 },
      shadow: { type: "outer", color: "94A3B8", blur: 1.5, offset: 1.2, angle: 45, opacity: 0.16 },
    });
    text(slide, String(i + 1), x, 1.86, 1.42, 0.28, {
      fontSize: 18,
      bold: true,
      color: C.white,
      align: "center",
    });
    text(slide, labels[i][0], x - 0.2, 3.16, 1.82, 0.28, {
      fontSize: 13,
      bold: true,
      color: C.text,
      align: "center",
      fit: "shrink",
    });
    text(slide, labels[i][1], x - 0.22, 3.56, 1.86, 0.24, {
      fontSize: 9.5,
      color: C.muted,
      align: "center",
      fit: "shrink",
    });
    if (i < xs.length - 1) {
      shape(slide, pptx.ShapeType.rightArrow, x + 1.58, 1.86, 0.86, 0.34, {
        fill: { color: "CBD5E1" },
        line: { color: "CBD5E1", transparency: 100 },
      });
    }
  });
  shape(slide, pptx.ShapeType.roundRect, 1.2, 4.7, 10.9, 0.92, {
    rectRadius: 0.08,
    fill: { color: C.ice },
    line: { color: C.line, width: 0.8 },
  });
  text(slide, "形成“手册证据 → 测试场景 → 智能体执行 → 结果验证 → 失败分析”的闭环，而不是只让大模型写测试用例。", 1.55, 5.02, 10.2, 0.3, {
    fontSize: 14,
    bold: true,
    color: C.navy,
    align: "center",
    fit: "shrink",
  });
}

function addOverallFlow() {
  const slide = pptx.addSlide();
  lightChrome(slide, "02", "总体流程", 6);
  const stages = [
    ["手册爬取", "user/admin manual", C.navy],
    ["知识索引", "Markdown + ChromaDB", C.blue],
    ["场景生成", "feature + scenario", C.cyan],
    ["智能执行", "browser-use Agent", C.teal],
    ["验证报告", "GLM + report", C.navy],
  ];
  stages.forEach((s, i) => stage(slide, i + 1, s[0], s[1], 0.72 + i * 2.32, 1.35, 2.15, s[2]));
  card(slide, 0.85, 3.2, 3.55, 1.55, "边界 1：零 locator", "场景只表达自然语言操作意图，不写 selector、xpath、DOM id 或 element index。", C.cyan);
  card(slide, 4.88, 3.2, 3.55, 1.55, "边界 2：browser-use 唯一执行器", "执行层不使用 Playwright 作为 fallback，避免回到脚本化定位路线。", C.blue);
  card(slide, 8.9, 3.2, 3.55, 1.55, "边界 3：本地可追溯", "运行截图、事件流、验证结果和报告统一归档到 data/runs/{run_id}/。", C.teal);
}

function addGoals() {
  const slide = pptx.addSlide();
  lightChrome(slide, "02", "研究目标与当前实现", 7);
  metric(slide, 0.85, 1.18, "48", "已抽取功能点", C.blue);
  metric(slide, 3.32, 1.18, "62", "已生成测试场景", C.cyan);
  metric(slide, 5.79, 1.18, "17", "本地运行记录", C.green);
  shape(slide, pptx.ShapeType.roundRect, 8.48, 1.18, 3.75, 1.08, {
    rectRadius: 0.08,
    fill: { color: C.navy },
    line: { color: C.navy, transparency: 100 },
  });
  text(slide, "已形成可运行本地闭环", 8.82, 1.45, 3.0, 0.28, {
    fontSize: 15,
    bold: true,
    color: C.white,
  });
  const goals = [
    ["功能点抽取", "从 4ga Boards 手册自动抽取主要业务功能。"],
    ["场景生成", "生成带证据、可执行、结构化、零 locator 的测试场景。"],
    ["智能体执行", "由 browser-use Agent 自主操作页面并采集 Trace。"],
    ["验证与报告", "输出确定性验证、视觉验证、失败分类和归档报告。"],
  ];
  goals.forEach((g, i) => {
    const x = 0.85 + (i % 2) * 5.86;
    const y = 3.0 + Math.floor(i / 2) * 1.35;
    card(slide, x, y, 5.22, 0.95, g[0], g[1], i % 2 ? C.cyan : C.blue);
  });
}

function addArchitecture() {
  const slide = pptx.addSlide();
  lightChrome(slide, "02", "总体架构", 8);
  const layers = [
    ["前端控制台", "Next.js / TypeScript / React Flow / Recharts", C.cyan],
    ["后端服务", "FastAPI / SQLModel / SQLite / REST API / SSE", C.blue],
    ["知识与生成", "Crawler / Chunker / ChromaDB / Feature & Scenario Generator", C.teal],
    ["智能体与验证", "LangGraph / browser-use / Deterministic + GLM-4.6V Verifier", C.navy],
    ["本地归档", "data/specpilot.db / data/chroma / data/runs/{run_id}", "334155"],
  ];
  layers.forEach((l, i) => {
    const y = 1.12 + i * 1.02;
    shape(slide, pptx.ShapeType.roundRect, 1.0 + i * 0.28, y, 10.65 - i * 0.56, 0.74, {
      rectRadius: 0.06,
      fill: { color: l[2], transparency: i === 4 ? 10 : 0 },
      line: { color: l[2], transparency: 100 },
      shadow: { type: "outer", color: "94A3B8", blur: 1.2, offset: 0.8, angle: 45, opacity: 0.12 },
    });
    text(slide, l[0], 1.35 + i * 0.28, y + 0.18, 1.85, 0.24, {
      fontSize: 12.2,
      bold: true,
      color: C.white,
    });
    text(slide, l[1], 3.2 + i * 0.28, y + 0.2, 7.6 - i * 0.56, 0.22, {
      fontSize: 9.6,
      color: "EAF4FF",
      fit: "shrink",
    });
  });
}

function addTechStack() {
  const slide = pptx.addSlide();
  lightChrome(slide, "03", "整体技术栈", 10);
  const groups = [
    ["前端展示层", "Next.js App Router\nTypeScript / Tailwind CSS\nRadix UI / Lucide\nReact Flow / TanStack Query / Recharts", C.cyan],
    ["后端服务层", "FastAPI / SQLModel\nSQLite / ChromaDB\nsse-starlette\n本地文件归档", C.blue],
    ["智能体层", "LangGraph 编排\nbrowser-use 执行\nOpenAI-compatible / DeepSeek\nGLM-4.6V adapter", C.navy],
    ["数据与报告", "data/specpilot.db\ndata/chroma/\ndata/runs/{run_id}/\nTrace / 截图 / Markdown 报告", C.teal],
  ];
  groups.forEach((g, i) => {
    const x = 0.85 + (i % 2) * 5.78;
    const y = 1.25 + Math.floor(i / 2) * 2.42;
    shape(slide, pptx.ShapeType.roundRect, x, y, 5.1, 1.78, {
      rectRadius: 0.08,
      fill: { color: C.white },
      line: { color: C.line, width: 0.8 },
      shadow: { type: "outer", color: "94A3B8", blur: 1.2, offset: 1, angle: 45, opacity: 0.13 },
    });
    shape(slide, pptx.ShapeType.rect, x, y, 5.1, 0.46, {
      fill: { color: g[2] },
      line: { color: g[2], transparency: 100 },
    });
    text(slide, g[0], x + 0.28, y + 0.13, 2.5, 0.18, {
      fontSize: 11.5,
      bold: true,
      color: C.white,
    });
    text(slide, g[1], x + 0.35, y + 0.7, 4.35, 0.78, {
      fontSize: 10.4,
      color: C.text,
      breakLine: false,
      fit: "shrink",
    });
  });
}

function addFrontendConsole() {
  const slide = pptx.addSlide();
  lightChrome(slide, "03", "前端中文控制台", 14);
  shape(slide, pptx.ShapeType.roundRect, 0.82, 1.02, 7.28, 5.28, {
    rectRadius: 0.08,
    fill: { color: C.white },
    line: { color: C.line, width: 0.8 },
    shadow: { type: "outer", color: "94A3B8", blur: 1.4, offset: 1.0, angle: 45, opacity: 0.14 },
  });
  shape(slide, pptx.ShapeType.rect, 0.82, 1.02, 7.28, 0.54, {
    fill: { color: C.navy },
    line: { color: C.navy, transparency: 100 },
  });
  text(slide, "SpecPilot 控制台", 1.12, 1.2, 1.7, 0.2, {
    fontSize: 10.8,
    bold: true,
    color: C.white,
  });
  ["功能点", "测试场景", "运行监控", "历史报告"].forEach((tab, i) => {
    const x = 3.15 + i * 1.05;
    shape(slide, pptx.ShapeType.roundRect, x, 1.17, 0.82, 0.24, {
      rectRadius: 0.04,
      fill: { color: i === 2 ? C.cyan : "FFFFFF", transparency: i === 2 ? 0 : 85 },
      line: { color: "FFFFFF", transparency: 100 },
    });
    text(slide, tab, x + 0.05, 1.22, 0.72, 0.12, {
      fontSize: 6.5,
      bold: i === 2,
      color: C.white,
      align: "center",
      fit: "shrink",
    });
  });
  shape(slide, pptx.ShapeType.roundRect, 1.12, 1.9, 1.35, 0.88, {
    rectRadius: 0.06,
    fill: { color: C.ice },
    line: { color: C.line, width: 0.6 },
  });
  text(slide, "48", 1.38, 2.02, 0.46, 0.28, { fontSize: 19, bold: true, color: C.blue, align: "center" });
  text(slide, "功能点", 1.27, 2.42, 0.7, 0.14, { fontSize: 7.5, color: C.muted, align: "center" });
  shape(slide, pptx.ShapeType.roundRect, 2.75, 1.9, 1.35, 0.88, {
    rectRadius: 0.06,
    fill: { color: C.ice },
    line: { color: C.line, width: 0.6 },
  });
  text(slide, "62", 3.02, 2.02, 0.46, 0.28, { fontSize: 19, bold: true, color: C.cyan, align: "center" });
  text(slide, "场景", 2.92, 2.42, 0.66, 0.14, { fontSize: 7.5, color: C.muted, align: "center" });
  shape(slide, pptx.ShapeType.roundRect, 4.38, 1.9, 1.35, 0.88, {
    rectRadius: 0.06,
    fill: { color: C.ice },
    line: { color: C.line, width: 0.6 },
  });
  text(slide, "17", 4.66, 2.02, 0.46, 0.28, { fontSize: 19, bold: true, color: C.green, align: "center" });
  text(slide, "运行", 4.56, 2.42, 0.66, 0.14, { fontSize: 7.5, color: C.muted, align: "center" });
  shape(slide, pptx.ShapeType.roundRect, 1.12, 3.15, 3.1, 1.78, {
    rectRadius: 0.06,
    fill: { color: "F8FAFC" },
    line: { color: C.line, width: 0.6 },
  });
  text(slide, "运行事件流", 1.36, 3.38, 1.0, 0.18, { fontSize: 10, bold: true, color: C.text });
  ["agent.start", "browser.action", "screenshot.saved", "verify.done"].forEach((t, i) => {
    const y = 3.78 + i * 0.24;
    shape(slide, pptx.ShapeType.ellipse, 1.36, y, 0.1, 0.1, { fill: { color: i < 2 ? C.cyan : C.green }, line: { color: C.white, transparency: 100 } });
    text(slide, t, 1.55, y - 0.02, 1.45, 0.12, { fontSize: 6.9, color: C.muted });
    text(slide, "SSE", 3.45, y - 0.02, 0.42, 0.12, { fontSize: 6.5, bold: true, color: C.blue, align: "right" });
  });
  shape(slide, pptx.ShapeType.roundRect, 4.58, 3.15, 2.92, 1.78, {
    rectRadius: 0.06,
    fill: { color: "F8FAFC" },
    line: { color: C.line, width: 0.6 },
  });
  text(slide, "报告面板", 4.82, 3.38, 1.0, 0.18, { fontSize: 10, bold: true, color: C.text });
  [0.58, 0.82, 0.46].forEach((w, i) => {
    const y = 3.78 + i * 0.36;
    shape(slide, pptx.ShapeType.rect, 4.86, y, 1.95, 0.08, { fill: { color: "DBEAFE" }, line: { color: "DBEAFE", transparency: 100 } });
    shape(slide, pptx.ShapeType.rect, 4.86, y, 1.95 * w, 0.08, { fill: { color: i === 1 ? C.cyan : C.blue }, line: { color: C.blue, transparency: 100 } });
    text(slide, ["通过率", "覆盖场景", "失败待查"][i], 4.86, y + 0.12, 1.0, 0.12, { fontSize: 6.6, color: C.muted });
  });
  shape(slide, pptx.ShapeType.roundRect, 8.5, 1.16, 3.22, 5.16, {
    rectRadius: 0.08,
    fill: { color: C.navy },
    line: { color: C.navy, transparency: 100 },
  });
  text(slide, "控制台职责", 8.82, 1.55, 2.3, 0.34, {
    fontSize: 17,
    bold: true,
    color: C.white,
  });
  shape(slide, pptx.ShapeType.rect, 8.82, 2.16, 0.52, 0.06, {
    fill: { color: C.cyan },
    line: { color: C.cyan, transparency: 100 },
  });
  text(slide, "以中文界面串起“功能点、场景、运行、报告”四类高频工作流；通过 SSE 展示智能体实时状态，让执行过程可观察、可解释、可复盘。", 8.82, 2.45, 2.38, 2.2, {
    fontSize: 10.5,
    color: "D7E6FF",
    valign: "top",
    fit: "shrink",
  });
  pill(slide, "UI", 8.82, 5.72, 0.52, C.cyan);
  text(slide, "默认中文，面向课堂演示和本地调试。", 9.55, 5.78, 1.52, 0.18, {
    fontSize: 7.6,
    color: "CADCFC",
    fit: "shrink",
  });
}

function addInnovation() {
  const slide = pptx.addSlide();
  lightChrome(slide, "03", "框架创新点", 24);
  const items = [
    ["手册证据约束", "每个功能点和场景保留 source URL 与 evidence quote，减少模型臆造。", C.blue],
    ["零 locator 场景", "测试场景不依赖 DOM 选择器，面对 UI 改版时保持业务意图稳定。", C.cyan],
    ["LangGraph 状态编排", "把执行、采集、验证、分类组织为可观测的图状态流。", C.navy],
    ["browser-use 自主执行", "让智能体理解页面并执行自然语言任务，而不是回到脚本定位。", C.teal],
    ["双验证与失败分类", "确定性检查 + GLM 视觉判断 + 失败类别，输出可复查报告。", "334155"],
  ];
  items.forEach((it, i) => {
    const x = 0.85 + (i % 2) * 5.78;
    const y = 1.08 + Math.floor(i / 2) * 1.62;
    const w = i === 4 ? 10.88 : 5.12;
    card(slide, x, y, w, 1.05, it[0], it[1], it[2]);
  });
}

function addTestingNext() {
  const slide = pptx.addSlide();
  lightChrome(slide, "04", "测试与下一步计划", 27);
  card(slide, 0.85, 1.18, 3.55, 1.42, "已验证链路", "手册入库、场景生成、运行记录、Trace 采集、报告归档形成基本闭环。", C.green);
  card(slide, 4.88, 1.18, 3.55, 1.42, "风险控制", "禁止 Playwright 执行、禁止 locator 字段、禁止把密钥写入 prompt / trace / screenshot metadata。", C.amber);
  card(slide, 8.9, 1.18, 3.55, 1.42, "下一步", "补充更多真实运行样本，扩展前端可视化与失败分析页，完善端到端验证。", C.blue);
  shape(slide, pptx.ShapeType.roundRect, 1.2, 3.62, 10.85, 1.45, {
    rectRadius: 0.08,
    fill: { color: C.navy },
    line: { color: C.navy, transparency: 100 },
  });
  text(slide, "最终目标", 1.62, 3.98, 1.25, 0.3, {
    fontSize: 15,
    bold: true,
    color: C.cyan,
  });
  text(slide, "让测试人员从“写脚本和维护选择器”转向“审查场景证据、观察智能体执行、复核失败报告”。", 2.92, 3.92, 8.42, 0.38, {
    fontSize: 17,
    bold: true,
    color: C.white,
    fit: "shrink",
  });
}

function addTeam() {
  const slide = pptx.addSlide();
  lightChrome(slide, "05", "小组分工", 29);
  const roles = [
    ["资料与需求", "手册范围梳理、需求文档、汇报材料"],
    ["后端与数据", "FastAPI、SQLModel、ChromaDB、报告归档"],
    ["智能体实现", "LangGraph、browser-use、验证与失败分类"],
    ["前端与展示", "Next.js 控制台、可视化、运行详情"],
  ];
  roles.forEach((r, i) => {
    const x = 0.92 + i * 3.02;
    shape(slide, pptx.ShapeType.roundRect, x, 1.35, 2.42, 3.55, {
      rectRadius: 0.08,
      fill: { color: C.white },
      line: { color: C.line, width: 0.8 },
      shadow: { type: "outer", color: "94A3B8", blur: 1.2, offset: 0.9, angle: 45, opacity: 0.13 },
    });
    shape(slide, pptx.ShapeType.ellipse, x + 0.74, 1.78, 0.94, 0.94, {
      fill: { color: i % 2 ? C.blue : C.cyan },
      line: { color: C.white, transparency: 100 },
    });
    text(slide, String(i + 1), x + 0.74, 2.04, 0.94, 0.22, {
      fontSize: 14,
      bold: true,
      color: C.white,
      align: "center",
    });
    text(slide, r[0], x + 0.25, 3.0, 1.92, 0.3, {
      fontSize: 14,
      bold: true,
      color: C.text,
      align: "center",
      fit: "shrink",
    });
    text(slide, r[1], x + 0.32, 3.55, 1.78, 0.72, {
      fontSize: 9.5,
      color: C.muted,
      align: "center",
      fit: "shrink",
    });
  });
}

function addEnd() {
  const slide = pptx.addSlide();
  darkGeometry(slide);
  text(slide, "THANKS", 0.9, 2.2, 4.1, 0.75, {
    fontSize: 42,
    bold: true,
    color: C.white,
  });
  text(slide, "欢迎各位老师和同学批评指正", 0.94, 3.05, 4.3, 0.36, {
    fontSize: 15,
    color: "CADCFC",
  });
  shape(slide, pptx.ShapeType.rect, 0.94, 3.62, 1.7, 0.06, {
    fill: { color: C.cyan },
    line: { color: C.cyan, transparency: 100 },
  });
  text(slide, "SpecPilot · 第7组", 0.96, 6.65, 2.2, 0.24, {
    fontSize: 10.5,
    color: "D7E6FF",
  });
}

async function main() {
  ensureDir(OUT_DIR);
  addCover();
  addAgenda();
  sectionSlide(1, "研究背景及意义", "Background and Significance");
  addBackground();
  addSignificance();
  sectionSlide(2, "研究目标与方案", "Research Objectives and Methodology");
  addOverallFlow();
  addGoals();
  addArchitecture();
  sectionSlide(3, "研究框架介绍", "Research Framework and Agent Layer");
  addTechStack();
  imageSlide("03", "系统模块划分", 11, "03-01-system-modules.png", "整体框架", "第3章先交代系统全貌：知识、生成、执行、验证、控制台五层协同，其中智能体执行层是核心。");
  imageSlide("03", "手册知识层与场景生成层", 12, "03-02-manual-to-scenarios.png", "证据驱动", "从手册页面到功能点和测试场景，保留 source URL 与 evidence quote，避免无依据生成。");
  imageSlide("03", "后端 API 与本地存储", 13, "03-03-backend-api-storage.png", "服务中枢", "FastAPI 统一承接生成、运行、验证、SSE 和报告归档，SQLite 与 ChromaDB 分别承载结构化数据和语义索引。");
  addFrontendConsole();
  imageSlide("03", "智能体层整体实现", 15, "03-04-agent-layer-overview.png", "执行核心", "智能体层把自然语言场景变成 browser-use 任务，执行过程中持续产出状态、截图、动作和错误信息。");
  imageSlide("03", "LangGraph 在系统中的用途", 16, "03-05-langgraph-role.png", "图状态编排", "LangGraph 管理 run state、节点流转和错误分支，使执行、采集、验证、分类都能被统一追踪。");
  imageSlide("03", "Task Builder：零 locator 任务构造", 17, "03-07-task-builder.png", "意图表达", "Task Builder 将 steps 与 expectations 组织为 browser-use 可理解的任务，强调业务意图，不泄露 DOM 选择器。");
  imageSlide("03", "为什么使用 browser-use", 18, "03-06-browser-use-vs-playwright.png", "技术取舍", "browser-use 更适合自然语言任务与页面语义理解；Playwright 更偏脚本化控制，不符合本项目零 locator 目标。");
  imageSlide("03", "实时 Trace 与 SSE", 19, "03-08-live-trace-sse.png", "过程可观测", "后端把 Agent 状态、动作、URL、截图和错误通过 SSE 推送到前端，实现运行时观察。");
  imageSlide("03", "验证与裁决机制", 20, "03-09-verification-arbitration.png", "可靠判定", "确定性验证检查结构化结果，GLM-4.6V 处理视觉语义，两者共同给出最终结论。");
  imageSlide("03", "失败分类器", 21, "03-10-failure-classifier.png", "问题定位", "失败会被归类为应用缺陷、场景缺陷、智能体执行失败、环境问题等，便于后续修复。");
  imageSlide("03", "报告与工件归档", 22, "03-11-report-artifacts.png", "可复查资产", "每次运行的 Trace、截图、验证结果和 Markdown 报告归档在 data/runs/{run_id}/ 下。");
  addInnovation();
  sectionSlide(4, "研究进度与成果", "Progress and Results");
  imageSlide("04", "当前成果", 26, "04-01-current-results.png", "已有数据", "当前本地系统已有 48 个功能点、62 个测试场景和 17 条运行记录，具备可演示闭环。");
  addTestingNext();
  sectionSlide(5, "小组分工", "Team Roles");
  addTeam();
  addEnd();
  await pptx.writeFile({ fileName: OUT_FILE });
  console.log(OUT_FILE);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
