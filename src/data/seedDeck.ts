import type { DeckState } from "../types";

export const initialDeck: DeckState = {
  deck: {
    title: "闲置耳机二手交易困境分析",
    audience: "投资人和创业导师",
    goal: "证明校园二手交易存在真实需求，并接受解决方案的必要性。",
    tone: "清晰、克制、有商业判断",
    duration: "8分钟"
  },
  template: {
    id: "template-quiet-teal",
    name: "Quiet Teal",
    aspectRatio: "16:9",
    backgroundColor: "FFFFFF",
    surfaceColor: "F8FAFC",
    accentColor: "0F766E",
    accentSoftColor: "CCFBF1",
    textColor: "111827",
    bodyColor: "374151",
    borderColor: "DCE4EB"
  },
  nodes: [
    {
      id: "node-1",
      title: "问题引入",
      intent: "用一个贴近生活的问题引发共鸣，激发受众好奇心。",
      role: "开场",
      duration: "0:35",
      slideId: "slide-1",
      risk: "表达略抽象，缺少具体场景。"
    },
    {
      id: "node-2",
      title: "场景共鸣",
      intent: "让听众看到毕业季、搬寝室和教材循环中的真实交易需求。",
      role: "共鸣",
      duration: "0:50",
      slideId: "slide-2"
    },
    {
      id: "node-3",
      title: "核心矛盾",
      intent: "证明问题不是没有买家，而是信任、定价与履约成本过高。",
      role: "冲突",
      duration: "1:10",
      slideId: "slide-3"
    },
    {
      id: "node-4",
      title: "解决方向",
      intent: "把产品从功能列表改写成降低交易成本的一套路径。",
      role: "转折",
      duration: "0:50",
      slideId: "slide-4"
    },
    {
      id: "node-5",
      title: "商业模式",
      intent: "解释平台如何通过服务费、认证和校园合作形成可持续收入。",
      role: "论证",
      duration: "1:05",
      slideId: "slide-5"
    },
    {
      id: "node-6",
      title: "数据与洞察",
      intent: "用轻量数据证明交易频次和增长空间，而不是堆砌行业大词。",
      role: "论证",
      duration: "1:05",
      slideId: "slide-6"
    },
    {
      id: "node-7",
      title: "建议与行动",
      intent: "明确下一步验证路径，降低投资人对执行风险的担忧。",
      role: "行动",
      duration: "0:48",
      slideId: "slide-7"
    },
    {
      id: "node-8",
      title: "总结与展望",
      intent: "收束观点，让听众记住真实需求、低成本切入和可扩展空间。",
      role: "收束",
      duration: "0:40",
      slideId: "slide-8"
    }
  ],
  slides: [
    {
      id: "slide-1",
      nodeId: "node-1",
      title: "校园二手交易存在的问题",
      body: "信息分散、信任不足、交易效率低，让一件小事变成一个大问题。",
      bullets: ["信息分散", "信任不足", "交易效率低"],
      note: "目前表达偏概括，适合作为 AI 重写前的初稿。"
    },
    {
      id: "slide-2",
      nodeId: "node-2",
      title: "毕业季之前，闲置物品开始堆积",
      body: "耳机、教材、小家电和运动装备在寝室之间流动，却很难被稳定发现。",
      bullets: ["毕业搬迁集中释放供给", "同校交易天然降低距离成本", "真实需求被分散渠道稀释"],
      note: "可以补充一个寝室搬迁场景。"
    },
    {
      id: "slide-3",
      nodeId: "node-3",
      title: "不是没有需求，而是交易成本太高",
      body: "买卖双方都担心状态不透明、沟通反复和见面履约的不确定性。",
      bullets: ["物品状态难验证", "价格缺少参照", "沟通和交付反复"],
      note: "适合做成三段阻碍结构。"
    },
    {
      id: "slide-4",
      nodeId: "node-4",
      title: "把交易流程拆成可被降低的成本",
      body: "平台围绕发布、匹配、信任和履约四个环节减少摩擦。",
      bullets: ["标准化发布", "校内身份认证", "价格参考", "预约交付"],
      note: "避免做成功能清单，要强调解决路径。"
    },
    {
      id: "slide-5",
      nodeId: "node-5",
      title: "商业模式建立在高频小额服务上",
      body: "基础交易免费，增值服务围绕认证、保障和校园合作展开。",
      bullets: ["担保服务费", "认证与质检", "校园渠道合作"],
      note: "如果前置到产品方案前，应改成商业机会预告。"
    },
    {
      id: "slide-6",
      nodeId: "node-6",
      title: "交易频次来自真实校园周期",
      body: "开学、毕业、搬寝和课程更替构成可预期的周期性需求。",
      bullets: ["毕业季供给集中", "开学季需求集中", "教材与电子产品复购明显"],
      note: "后续可接入真实调研数据。"
    },
    {
      id: "slide-7",
      nodeId: "node-7",
      title: "先验证一个校区，再复制到更多校园",
      body: "用一个样板校区验证供给密度、成交率和履约体验。",
      bullets: ["30天冷启动", "1000件有效供给", "校内履约闭环"],
      note: "行动请求需要明确资源需求。"
    },
    {
      id: "slide-8",
      nodeId: "node-8",
      title: "从闲置物品开始，重建校园信任交易",
      body: "StoryDeck 展示的是一个可被验证、可复制、可扩展的校园交易切入点。",
      bullets: ["需求真实", "路径清晰", "增长可复制"],
      note: "总结页应简洁收束。"
    }
  ],
  activeNodeId: "node-1",
  riskPrompt: null
};
