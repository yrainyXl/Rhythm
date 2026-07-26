const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
        PageNumber, PageBreak, LevelFormat } = require('docx');

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

function cell(text, opts = {}) {
  const { bold, width, shading } = opts;
  return new TableCell({
    borders,
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    shading: shading ? { fill: shading, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      spacing: { after: 0 },
      children: [new TextRun({ text, bold: bold ?? false, font: "Arial", size: 20 })]
    })]
  });
}

function p(text, opts = {}) {
  const { bold, indent, spacing, alignment } = opts;
  return new Paragraph({
    alignment: alignment ?? AlignmentType.LEFT,
    spacing: spacing ?? { after: 80 },
    indent: indent ? { left: indent } : undefined,
    children: [new TextRun({ text, bold: bold ?? false, font: "Arial", size: 22 })]
  });
}

function heading1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text, font: "Arial" })] });
}
function heading2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text, font: "Arial" })] });
}
function heading3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text, font: "Arial" })] });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({ children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: "节奏 App 产品设计文档", font: "Arial", size: 18, color: "999999" })]
      })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "- ", font: "Arial", size: 18, color: "999999" }),
                   new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 18, color: "999999" }),
                   new TextRun({ text: " -", font: "Arial", size: 18, color: "999999" })]
      })] })
    },
    children: [

      // ====================== 封面 ======================
      new Paragraph({ spacing: { before: 2400 }, children: [] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: "节奏 App", font: "Arial", size: 60, bold: true, color: "2E75B6" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({ text: "Rhythm", font: "Arial", size: 40, color: "5B9BD5" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
        children: [new TextRun({ text: "产品设计文档", font: "Arial", size: 32, color: "333333" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [new TextRun({ text: "版本 1.0  |  2026年6月", font: "Arial", size: 22, color: "666666" })]
      }),
      new Paragraph({ children: [new PageBreak()] }),

      // ====================== 目录页 ======================
      heading1("目录"),
      p("1. 产品概述"),
      p("2. 核心设计理念"),
      p("3. 三层架构"),
      p("4. 功能模块"),
      p("  4.1 通用习惯系统"),
      p("  4.2 睡眠专项"),
      p("  4.3 运动/康复专项"),
      p("  4.4 阅读专项"),
      p("  4.5 每日复盘"),
      p("  4.6 周报"),
      p("  4.7 目标拆解系统"),
      p("  4.8 情侣连接与共享"),
      p("  4.9 通知提醒"),
      p("5. AI 架构设计"),
      p("6. 技术架构"),
      p("7. 信息架构"),
      p("8. 未来规划"),
      new Paragraph({ children: [new PageBreak()] }),

      // ====================== 1. 产品概述 ======================
      heading1("1. 产品概述"),

      p("节奏（Rhythm）是一款个人生活节奏管理工具。与传统的习惯打卡 App 不同，节奏不追求「做更多事」或「连续打卡天数」，而是帮助用户看见自己的生活模式，识别什么在破坏节奏、什么在滋养节奏，并在此基础上做出微小的调整。"),

      p("产品核心理念：记录不是为了打卡，是为了看见；分析不是为了评判，是为了理解；引导不是催促，是提供方向。"),

      heading3("核心用户假设"),
      p("1) 用户有改善生活习惯的意愿，但需要工具让这些习惯变得「可见」。单纯靠意志力或提醒容易在第一个懈怠期放弃。"),
      p("2) 用户不知道「为什么」坚持不下某些习惯。他们需要一个能检测模式、给出解释的系统，而不是另一个待办清单。"),
      p("3) 用户需要小目标。大目标（「我要每天跑步」「我要早起」）很难持续。系统帮助拆解为可执行的小步骤。"),
      p("4) 用户不想被「监督」。即便在情侣共享场景下，也需要选择权和控制权。信息展示偏中性，不做负面评价。"),

      // ====================== 2. 核心设计理念 ======================
      heading1("2. 核心设计理念"),

      heading3("2.1 三不做原则"),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 60 },
        children: [new TextRun({ text: "不做打卡天数排行" })],
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 60 },
        children: [new TextRun({ text: "不做负面评价（「你太懒了」「你又没完成」）" })],
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 180 },
        children: [new TextRun({ text: "不做社交分享或公开比较" })],
      }),

      heading3("2.2 温和引导原则"),
      p("所有 AI 生成的文案和提示必须满足以下约束："),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 60 },
        children: [new TextRun({ text: "不说负面词汇（不用「差」「糟糕」「失败」）" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 60 },
        children: [new TextRun({ text: "提供建设性建议，而非批评" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 60 },
        children: [new TextRun({ text: "结尾给出一个小而具体的下周行动建议" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 180 },
        children: [new TextRun({ text: "允许「跳过」，不对未完成做惩罚性标记" })],
      }),

      heading3("2.3 专项深度 vs 通用广度"),
      p("不是所有习惯都一视同仁。部分领域需要更细致的记录和分析，才能产生有价值的洞察。因此产品采用「通用习惯 + 专项模块」的混合架构："),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 60 },
        children: [new TextRun({ text: "通用习惯：用户可自定义任意习惯，命名、分类、目标类型完全自由。适合简单重复的事项（喝足水、冥想、吃早餐等）。" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text: "专项模块：针对睡眠、运动/康复、阅读三个领域，提供更丰富的记录字段和更深入的分析能力。" })],
      }),
      new Paragraph({ children: [new PageBreak()] }),

      // ====================== 3. 三层架构 ======================
      heading1("3. 三层架构"),

      heading3("第一层：记录 (Recording)"),
      p("用户每天将生活数据输入系统。这一层的关键设计是「记录带上场景」（Contextual Recording），而不是简单的「是/否」："),

      p("习惯", { bold: true }),
      p("完成时可选择填写：实际值 / 持续时长 / 感受评分（1-5）/ 备注", { indent: 720 }),

      p("睡眠", { bold: true }),
      p("入睡/起床时间（支持跨天）、睡眠质量（好/一般/差）、睡前活动多选（看手机、看书、运动等 14 种）、备注", { indent: 720 }),

      p("运动", { bold: true }),
      p("运动模板（跑步、游泳、瑜伽等 9 种分类）、时长、距离、强度（轻/中/高）、整体感受 1-5、康复模式：按组记录（每组次数 + 感受评估）、备注", { indent: 720 }),

      p("阅读", { bold: true }),
      p("书名、作者、总页数、来源（手动/微信读书/Kindle/其他）、每次记录：阅读时长 + 页数 + 笔记摘录", { indent: 720 }),

      p("每日复盘", { bold: true }),
      p("心情（好/一般/差）、今天最满意的事、最需要改进的事、明天最重要的事、自由备注", { indent: 720 }),

      heading3("第二层：分析 (Analysis)"),
      p("系统自动检测数据中的模式，生成洞察。分析引擎以「本地规则引擎」为默认实现，无需联网或 API Key。"),

      p("通用习惯分析：", { bold: true }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "完成率趋势" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "最容易跳过/最稳定的习惯识别" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "周几容易松懈的模式检测" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text: "长期零完成 — 提示「目标可能太大了」" })],
      }),

      p("专项分析：", { bold: true }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "睡眠：平均时长、质量分布、睡前活动与睡眠关联（睡前玩手机 vs 不玩的时长对比）、近 7 天趋势" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "运动：月度统计、分类分布、每周趋势、康复进度追踪（按模板、训练次数、开始天数）" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text: "阅读：在读/读完统计、每周阅读趋势、最近阅读记录汇总" })],
      }),

      p("交叉分析（跨模块）：", { bold: true }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "运动日 vs 非运动日的睡眠质量对比" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text: "睡前活动类型与睡眠时长的关联" })],
      }),

      heading3("第三层：引导 (Guidance)"),
      p("基于分析结果，系统提供温和的建议。引导层不与提醒系统绑定 — 提醒是时间触发的，引导是数据触发的。"),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "周报中生成自然语言总结（本地规则版）" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "下周小建议（「本周习惯完成率偏低，建议减少习惯数量」「运动次数较少，下周设定每周 3 次的小目标」）" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "目标调整建议（将来接入 LLM 后可生成更个性化、更具体的方案）" })],
      }),
      new Paragraph({ children: [new PageBreak()] }),

      // ====================== 4. 功能模块 ======================
      heading1("4. 功能模块"),

      // ---------- 4.1 ----------
      heading2("4.1 通用习惯系统"),

      heading3("4.1.1 习惯创建"),
      p("用户可自由创建任意习惯。每个习惯包含以下属性："),

      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2400, 6626],
        rows: [
          new TableRow({ children: [cell("字段", { bold: true, width: 2400, shading: "D5E8F0" }), cell("说明", { bold: true, width: 6626, shading: "D5E8F0" })] }),
          new TableRow({ children: [cell("名称", { width: 2400 }), cell("自定义文本", { width: 6626 })] }),
          new TableRow({ children: [cell("分类", { width: 2400 }), cell("7 种：自律 / 学习 / 运动 / 睡眠 / 饮食 / 生活 / 其他", { width: 6626 })] }),
          new TableRow({ children: [cell("目标类型", { width: 2400 }), cell("4 种：布尔（完成即可）/ 时长（如学习 30 分钟）/ 次数（如喝 8 杯水）/ 数值（如体重 70kg）", { width: 6626 })] }),
          new TableRow({ children: [cell("重复规则", { width: 2400 }), cell("4 种：每天 / 工作日 / 周末 / 每周自定义（可选具体周几）", { width: 6626 })] }),
          new TableRow({ children: [cell("提醒时间", { width: 2400 }), cell("可选，到点浏览器通知", { width: 6626 })] }),
          new TableRow({ children: [cell("重要标记", { width: 2400 }), cell("重要习惯在列表顶部展示", { width: 6626 })] }),
        ]
      }),

      heading3("4.1.2 待办生成引擎"),
      p("系统根据每个习惯的重复规则，每天自动生成当日的待办事件（Habit Occurrence）。生成逻辑："),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "检查习惯是否启用" })],
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "检查日期是否在起止范围内" })],
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "根据 repeat_type 判断今天是否应该执行" })],
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "若该习惯今天已有待办，跳过（防重复）" })],
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text: "创建待办，同时「快照」当前的目标值、单位、标题（保证即使习惯后来被修改，历史记录仍准确）" })],
      }),

      heading3("4.1.3 待办操作"),
      p("每条待办支持三种状态变更："),

      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2000, 7026],
        rows: [
          new TableRow({ children: [cell("操作", { bold: true, width: 2000, shading: "D5E8F0" }), cell("说明", { bold: true, width: 7026, shading: "D5E8F0" })] }),
          new TableRow({ children: [cell("完成", { width: 2000 }), cell("标记完成，可选填写实际值、时长、感受（1-5）、备注。生成详细记录用于分析", { width: 7026 })] }),
          new TableRow({ children: [cell("跳过", { width: 2000 }), cell("标记跳过，不动完成率（跳过不同于未完成）", { width: 7026 })] }),
          new TableRow({ children: [cell("撤销", { width: 2000 }), cell("将已完成或已跳过的任务恢复为待办状态，同时删除关联的详细记录", { width: 7026 })] }),
        ]
      }),

      heading3("4.1.4 习惯管理"),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "习惯列表按分类分组显示" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "可编辑已有习惯的名称、分类、目标、重复规则" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "停用习惯（保留历史记录，停止生成新待办）" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text: "确认对话框防止误操作停用" })],
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // ---------- 4.2 ----------
      heading2("4.2 睡眠专项（深度）"),

      p("睡眠模块是三个深度模块之一。设计目标不仅是「记录睡了几个小时」，而是帮用户理解什么因素在影响他们的睡眠质量。"),

      heading3("4.2.1 记录维度"),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "入睡日期+时间、起床日期+时间（支持跨天，如 23:30 入睡、次日 07:30 起床）" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "自动计算睡眠时长（分钟）" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "睡眠质量：好 / 一般 / 差" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "睡前活动多选（14 种）：看手机、刷视频、看书、运动、冥想、喝牛奶、听音乐、玩游戏、工作、聊天、写日记、泡脚、拉伸、其他" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "备注" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text: "校验：睡眠时长最少 60 分钟，最多 720 分钟" })],
      }),

      heading3("4.2.2 分析能力"),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "统计卡片：平均睡眠时长、平均质量评分、记录天数" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "质量分布图：好 / 一般 / 差的占比" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "常见睡前活动排行（Top 5）" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "模式洞察：睡前玩手机 vs 不玩的睡眠时长对比" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text: "近 7 天时长趋势柱状图" })],
      }),

      // ---------- 4.3 ----------
      heading2("4.3 运动/康复专项（深度）"),

      p("运动模块的特殊设计是「康复模式」— 支持分组记录，每组完成后评估感受。这对于有康复训练需求的人尤为重要。"),

      heading3("4.3.1 记录维度"),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "运动日期" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "运动模板（可创建自定义模板，按 9 种分类：跑步/游泳/瑜伽/力量/骑行/球类/康复/拉伸/其他）" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "时长（分钟）、距离（公里，可选）" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "强度：轻 / 中 / 高" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "整体感受评分 1-5" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "康复模式：按组记录（组号、次数、每组感受：轻松/轻微/有挑战/疼痛）、可动态添加/删除组" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text: "备注" })],
      }),

      heading3("4.3.2 分析能力"),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "总运动次数 + 总时长" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "按分类统计分布" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "每周运动次数和时长趋势" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text: "康复进度追踪：按模板显示训练次数和距离首次训练的天数" })],
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // ---------- 4.4 ----------
      heading2("4.4 阅读专项"),

      p("阅读模块的设计侧重「进度感」— 用户可以看到自己在读什么书、读到哪了、花了多少时间。"),

      heading3("4.4.1 记录维度"),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "添加图书：书名、作者、总页数、来源（手动/微信读书/Kindle/其他）" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "每次阅读记录：时长（分钟）、阅读页数、笔记摘录" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "阅读状态：在读 / 读完 / 暂停 / 放弃" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text: "阅读进度自动更新（当前页/总页数）" })],
      }),

      heading3("4.4.2 分析能力"),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "在读/读完/总时长统计" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "每周阅读趋势（时长和页数）" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text: "最近阅读记录列表" })],
      }),

      heading3("4.4.3 接入规划"),
      p("未来计划接入微信读书 API，自动同步阅读数据（当前为手动录入）。已预留 source 字段用于区分数据来源。"),

      // ---------- 4.5 ----------
      heading2("4.5 每日复盘"),

      p("每日复盘是记录层的收尾环节，帮用户每天停下来想一想：今天过得怎么样？"),

      heading3("4.5.1 复盘项"),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "今日心情：好 / 一般 / 差" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "今天最满意的一件事" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "今天最需要改进的一件事" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "明天最重要的一件事" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text: "自由备注" })],
      }),

      p("使用 upsert（创建或更新）逻辑，每天每条用户只有一条记录。"),

      // ---------- 4.6 ----------
      heading2("4.6 周报"),

      p("每周自动汇总所有模块的数据，生成一份综合报告，帮助用户客观地回顾一周。"),

      heading3("4.6.1 周报内容"),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "习惯完成率 + 上周对比" })],
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "完成最多的习惯 / 最容易跳过的习惯" })],
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "平均睡眠时长 + 质量" })],
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "运动次数 + 总时长" })],
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "阅读总时长" })],
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "心情评分" })],
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text: "自然语言总结（本地规则生成）+ 下周小建议" })],
      }),

      heading3("4.6.2 周报生成逻辑"),
      p("周报从多个数据源聚合计算（habits、sleep_records、exercise_records、reading_sessions、daily_reflections）。所有计算在客户端完成，通过 Supabase 查询各表在周时间范围内的数据。"),

      new Paragraph({ children: [new PageBreak()] }),

      // ---------- 4.7 ----------
      heading2("4.7 目标拆解系统"),

      p("帮助用户把模糊的想法（「我要减肥」「我想多读书」）转化为可执行的关键结果（KR）和里程碑。"),

      heading3("4.7.1 目标创建"),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "目标标题 + 描述" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "分类（与习惯分类一致，保持体系统一）" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "目标截止日期（可选）" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text: "状态：进行中 / 已完成 / 已放弃" })],
      }),

      heading3("4.7.2 关键结果 (Key Results)"),
      p("每个目标可添加多个 KR，每个 KR 有可量化的目标值（如「减重 5 公斤」「读完 12 本书」），支持进度追踪。进度条自动显示当前值/目标值的比例，达到目标值时自动标记完成。"),

      heading3("4.7.3 里程碑 (Milestones)"),
      p("每个目标可分解为多个小步骤，按顺序勾选完成。里程碑可以关联到具体的 KR。"),

      // ---------- 4.8 ----------
      heading2("4.8 情侣连接与共享"),

      p("这是一个可选功能，已完整实现但处于低优先级。核心设计理念：连接不是为了「监督」，而是为了「看见」和「鼓励」。"),

      heading3("4.8.1 连接机制"),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "一方创建邀请码（6 位大写字母+数字组合）" })],
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "另一方输入邀请码完成绑定" })],
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "邀请码有效期 48 小时，过期自动失效" })],
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text: "支持解除关系（二次确认，不可恢复）" })],
      }),

      heading3("4.8.2 共享权限（三层粒度）"),
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2000, 2400, 4626],
        rows: [
          new TableRow({ children: [cell("粒度", { bold: true, width: 2000, shading: "D5E8F0" }), cell("示例", { bold: true, width: 2400, shading: "D5E8F0" }), cell("说明", { bold: true, width: 4626, shading: "D5E8F0" })] }),
          new TableRow({ children: [cell("不共享", { width: 2000 }), cell("不可见", { width: 2400 }), cell("完全隐藏此类型数据", { width: 4626 })] }),
          new TableRow({ children: [cell("状态级", { width: 2000 }), cell("睡眠：已记录", { width: 2400 }), cell("只告诉对方「有没有」记录，不透露具体数据", { width: 4626 })] }),
          new TableRow({ children: [cell("详情级", { width: 2000 }), cell("睡眠：7h 30min，质量好", { width: 2400 }), cell("共享完整记录内容", { width: 4626 })] }),
        ]
      }),

      p("每种数据类型（习惯、睡眠、运动、阅读）均可单独设置共享粒度。"),

      heading3("4.8.3 鼓励消息"),
      p("连接后双方可互发鼓励消息：快捷短语（加油 / 辛苦了 / 早点休息）或自定义文本。也可以发送活动建议（如「一起去跑步吧」），对方可选择接受或拒绝。"),

      new Paragraph({ children: [new PageBreak()] }),

      // ---------- 4.9 ----------
      heading2("4.9 通知提醒"),

      heading3("4.9.1 当前实现"),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "浏览器 Notification API 封装" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "权限请求：进入 App 5 秒后展示友好的权限请求提示" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "每分钟检查一次当前时间是否匹配提醒设置" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text: "已完成习惯自动过滤，不重复提醒" })],
      }),

      heading3("4.9.2 已知限制"),
      p("浏览器通知在不活跃标签页、浏览器后台、锁屏等场景下可靠性差，不是可靠的提醒机制。为此已设计通知抽象层，后续可替换为 Service Worker 推送或原生 App 推送。"),

      // ====================== 5. AI 架构设计 ======================
      heading1("5. AI 架构设计"),

      p("AI 模块设计为可插拔的抽象层，默认使用本地规则引擎（不依赖任何外部 API），预留 LLM 接入接口。"),

      heading3("5.1 双模式架构"),

      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2000, 3513, 3513],
        rows: [
          new TableRow({ children: [cell("", { bold: true, width: 2000, shading: "D5E8F0" }), cell("本地规则引擎（默认）", { bold: true, width: 3513, shading: "D5E8F0" }), cell("LLM 模式（未来）", { bold: true, width: 3513, shading: "D5E8F0" })] }),
          new TableRow({ children: [cell("优势", { bold: true, width: 2000 }), cell("零依赖、即时响应、无 API 费用、数据不外传", { width: 3513 }), cell("个性化建议、自然语言更流畅、可理解复杂语境", { width: 3513 })] }),
          new TableRow({ children: [cell("配置", { bold: true, width: 2000 }), cell("默认启用，无需配置", { width: 3513 }), cell("需设置 API Key + Endpoint + Model", { width: 3513 })] }),
        ]
      }),

      heading3("5.2 统一接口"),
      p("所有 AI 调用通过统一的四个函数代理：configureAI()、detectPatterns()、generateWeeklyNarrative()、suggestGoalAdjustments()。切换模式只需调用 configureAI({ mode: 'llm', apiKey: '...' })，业务代码无需修改。"),

      heading3("5.3 本地规则引擎能力"),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "睡眠模式检测：睡前玩手机 vs 不玩的睡眠时长对比；运动日 vs 非运动日的睡眠质量对比" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "习惯模式检测：连续跳过的习惯识别（提示「目标太大了」）；稳定习惯识别（完成率 > 80%）；周几容易松懈的模式分析" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "周报总结生成：根据完成率、运动次数、睡眠时长、阅读数据、心情评分等生成自然语言中文叙述" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text: "目标调整建议：根据习惯完成率、运动频率、睡眠时长给出具体可执行的建议" })],
      }),

      heading3("5.4 分析结果分级"),
      p("每条洞察（PatternInsight）标注置信度（high / medium / low），供前端决定展示优先级和视觉突出程度。高置信度（如连续 5 天跳过同一习惯）优先展示，低置信度（如运动与睡眠的关联，样本不足时）作为参考。"),

      heading3("5.5 LLM 接入规划"),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "支持配置自定义 API Endpoint 和 Model（兼容 OpenAI、Azure OpenAI 等）" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "Prompt 已预先设计（包含完整的温和助手提示词）" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "LLM 调用通过 fetch 实现，不依赖特定 SDK，未来可拆分至服务端 API Route 保护 API Key" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text: "建议使用轻量模型（如 gpt-4o-mini）以降低成本" })],
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // ====================== 6. 技术架构 ======================
      heading1("6. 技术架构"),

      heading3("6.1 技术选型"),

      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [3000, 6026],
        rows: [
          new TableRow({ children: [cell("层级", { bold: true, width: 3000, shading: "D5E8F0" }), cell("技术选型", { bold: true, width: 6026, shading: "D5E8F0" })] }),
          new TableRow({ children: [cell("前端框架", { width: 3000 }), cell("Next.js 14 (App Router)", { width: 6026 })] }),
          new TableRow({ children: [cell("语言", { width: 3000 }), cell("TypeScript (strict mode)", { width: 6026 })] }),
          new TableRow({ children: [cell("样式", { width: 3000 }), cell("Tailwind CSS", { width: 6026 })] }),
          new TableRow({ children: [cell("后端 / 数据库", { width: 3000 }), cell("Supabase (Auth + PostgreSQL + RLS)", { width: 6026 })] }),
          new TableRow({ children: [cell("客户端状态管理", { width: 3000 }), cell("Zustand", { width: 6026 })] }),
          new TableRow({ children: [cell("表单验证", { width: 3000 }), cell("React Hook Form + Zod", { width: 6026 })] }),
          new TableRow({ children: [cell("图表", { width: 3000 }), cell("Recharts", { width: 6026 })] }),
          new TableRow({ children: [cell("日期处理", { width: 3000 }), cell("date-fns", { width: 6026 })] }),
        ]
      }),

      heading3("6.2 安全架构"),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "Row Level Security (RLS)：所有 23 张表均配置 RLS 策略，用户只能访问自己的数据" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "中间件路由保护：未登录用户自动重定向到 /login，已登录用户从 /login 重定向到 /today" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "Supabase Auth：支持邮箱+密码登录 / 注册 / Magic Link 免密码登录" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "所有表均包含 updated_at 自动更新触发器" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text: "情侣共享数据通过 shared_permissions 表控制粒度，对方查询时检查权限级别" })],
      }),

      heading3("6.3 数据库表结构"),
      p("共 23 张表，全部包含 RLS 策略："),

      p("核心业务表：profiles、habits、habit_schedules、habit_occurrences、habit_logs、sleep_records、exercise_templates、exercise_records、exercise_set_logs、reading_books、reading_sessions、daily_reflections、goals、goal_key_results、goal_milestones", { bold: true }),
      p("社交相关表：couples、couple_members、couple_invites、shared_permissions、shared_plan_suggestions、encouragement_messages", { bold: true }),
      p("系统表：notification_settings、notification_logs", { bold: true }),

      new Paragraph({ children: [new PageBreak()] }),

      // ====================== 7. 信息架构 ======================
      heading1("7. 信息架构"),

      heading3("7.1 页面结构"),

      p("App 采用底部标签导航（Tab Bar），5 个主入口："),

      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2000, 2400, 4626],
        rows: [
          new TableRow({ children: [cell("标签", { bold: true, width: 2000, shading: "D5E8F0" }), cell("路由", { bold: true, width: 2400, shading: "D5E8F0" }), cell("内容", { bold: true, width: 4626, shading: "D5E8F0" })] }),
          new TableRow({ children: [cell("今天", { width: 2000 }), cell("/today", { width: 2400 }), cell("日期 + 进度条、今日待办（进行中/已完成）、快捷入口（记录睡眠/记录运动/复盘）", { width: 4626 })] }),
          new TableRow({ children: [cell("计划", { width: 2000 }), cell("/habits", { width: 2400 }), cell("习惯管理（创建/编辑/启用/停用）", { width: 4626 })] }),
          new TableRow({ children: [cell("记录", { width: 2000 }), cell("/records", { width: 2400 }), cell("5 个子标签：睡眠 / 运动 / 阅读 / 复盘 / 周报", { width: 4626 })] }),
          new TableRow({ children: [cell("我的", { width: 2000 }), cell("/me", { width: 2400 }), cell("个人资料编辑、目标管理、通知设置、退出登录", { width: 4626 })] }),
        ]
      }),

      heading3("7.2 登录与引导"),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "/login — 登录页：三标签切换（登录/注册/免密码），表单验证，错误提示" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "/onboarding — 三步入职引导：欢迎 → 昵称+时区 → 偏好作息时间" })],
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text: "/auth/callback — Magic Link 回调处理，code 换 session 后跳转引导页" })],
      }),

      heading3("7.3 顶部导航"),
      p("App 内所有页面共享顶部栏：左侧显示用户昵称，右侧显示通知权限提示。"),

      // ====================== 8. 未来规划 ======================
      heading1("8. 未来规划"),

      heading3("8.1 短期（1-2 周）"),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "修复所有 TypeScript 编译错误，确保 npm run build 通过" })],
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "完整手工测试所有模块（14 项验证清单）" })],
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text: "部署到 Vercel" })],
      }),

      heading3("8.2 中期（1-3 个月）"),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "接入微信读书 API，自动同步阅读数据" })],
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "LLM 模式上线，支持用户配置自己的 API Key" })],
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "情侣共享数据跨用户 RLS 策略细化" })],
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text: "通知系统升级为 Service Worker 推送" })],
      }),

      heading3("8.3 长期（3+ 个月）"),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "原生移动端 App（React Native 或 PWA）" })],
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "AI 更智能的个性化引导（基于长期数据的学习）" })],
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: "更多专项模块（饮食、财务等）" })],
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { after: 80 },
        children: [new TextRun({ text: "Siri / Google Assistant 快捷指令集成" })],
      }),

      // 文档结尾
      new Paragraph({ spacing: { before: 600 }, children: [] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "— 文档结束 —", font: "Arial", size: 22, color: "999999" })]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/sessions/clever-intelligent-franklin/mnt/night/节奏App产品设计文档.docx", buffer);
  console.log("Document created successfully");
});
