# StoryDeck Assignment

这是训练营作业的提交入口。项目 Demo 已经在主仓库实现，作业材料单独放在 `assignment/` 目录中，便于评审先看产品思考，再运行交互原型。

## 提交内容

- [产品设计说明](product-design.md)
  - 行为观察与用户思考
  - 目标用户和核心痛点
  - 产品设计思路
  - 核心功能和模块关系
  - 用户完整动线
  - Demo 与作业要求映射

- [Demo 演示脚本](demo-walkthrough.md)
  - 本地运行方式
  - 推荐演示路径
  - 关键讲述点
  - 与传统 PPT 编辑器的差异

## 一句话方案

StoryDeck 不是把 AI 塞进传统 PPT 编辑器，而是把 PPT 的核心交互从“逐页制作”改成“叙事结构驱动”：用户持续调整 Narrative Map 和每页表达意图，AI 根据这些结构化意图重写内容，同时保持模板、布局和导出结果稳定联动。

## Demo 地址

本地启动后访问：

```bash
npm run dev
```

默认地址：

```text
http://127.0.0.1:5173/
```

如果需要真实 PPT 渲染预览，在第二个终端启动：

```bash
npm run preview-server
```

## 目录说明

`assignment/.gitignore` 只忽略作业演示时可能临时生成的导出文件、截图和录屏，不忽略作业正文。

