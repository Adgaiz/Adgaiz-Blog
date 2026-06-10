---
title: "RSCX 会员权益页二维码滚动漂浮问题技术复盘"
category: "Bug技术文档"
tags: ["Bug复盘", "小程序", "Canvas"]
---

# RSCX 会员权益页二维码滚动漂浮问题技术复盘

## 1. 问题现象

在微信开发者工具打开会员权益页（`pages/rscx/member/index`），进行页面滚动时：

- 洗车券区域显示的二维码不跟随页面内容滚动，而是固定在屏幕视口顶层。
- 二维码原本所在的 DOM 位置滚动后留下一个空白矩形框。
- 画面表现为二维码"浮"在列表上方，与页面其余元素产生错位。

## 2. 影响范围

- 会员权益页中所有未使用状态洗车券的二维码展示区域。
- 微信开发者工具（Windows / Mac 平台）以及部分低版本微信基础库的真机环境均受影响。
- 不影响接口数据和核销功能，仅影响 UI 体验。

## 3. 根因链路

```text
l-painter 组件渲染 <canvas> 元素
        ↓
created() 中执行 use2dCanvas = type === '2d' && canIUseCanvas2d() && !isPC
        ↓
微信开发者工具运行在 Windows/Mac 宿主机，uni.getSystemInfoSync().platform 返回 "windows" 或 "mac"
        ↓
isPC = true，!isPC = false
        ↓
use2dCanvas 被强制设为 false，回退到旧版原生 Canvas 模式（canvas-id 属性）
        ↓
旧版原生 Canvas 是独立于 WebView 渲染层的原生组件，z-index 不可控，始终置于最顶层
        ↓
页面滚动时，WebView 内容层跟随手指移动，原生 Canvas 保持相对屏幕固定
        ↓
二维码"漂浮"在屏幕固定位置，原位置留下空白块
```

最终结论：**在微信小程序中，任何形式的 Canvas 元素都无法 100% 保证与 `<scroll-view>` 或页面原生滚动的平滑协同。彻底可靠的方案是将 Canvas 仅作为离屏渲染工具，最终展示层使用 `<image>` 原生组件。**

## 4. 修复方案

修复文件：

- `yudao-ui/yudao-ui-mall-uniapp/pages/rscx/member/index.vue`
- `yudao-ui/yudao-ui-mall-uniapp/uni_modules/lime-painter/components/l-painter/l-painter.vue`

修复策略：

**第一层：移除 PC 平台 Canvas 2D 禁用逻辑**

`l-painter.vue` created() 中移除 `&& !isPC` 条件，改为：

```js
this.use2dCanvas = this.type === '2d' && canIUseCanvas2d()
```

Canvas 2D API 在 PC 微信开发者工具中渲染基础图形（如二维码）功能正常，不应被平台检测拦截。

**第二层：Canvas 离屏渲染 + 图片展示**

`member/index.vue` 中将二维码展示方案从"直接显示 Canvas"改为"Canvas 离屏渲染 → 导出临时图片 → `<image>` 显示"：

- `l-painter` 增设 `hidden` 属性，Canvas 渲染在屏幕外（`position: fixed; left: 1500rpx`），用户不可见。
- 增设 `is-canvas-to-temp-file-path` 属性，渲染完成后自动调用 `canvasToTempFilePath` 导出为临时图片。
- `@success` 事件回调获取临时图片路径，存入 `qrImages[couponId]`。
- 模板中 `<image>` 组件绑定 `qrImages[couponId]` 作为 `src`，`<image>` 是微信原生组件，与视图层完全融合，正常跟随滚动。
- 二维码刷新时**先 `delete qrImages[couponId]` 清除旧图片**，再更新 `qrTimestamps` 触发新一轮离屏渲染。

## 5. 回归验证

已验证场景：

- 微信开发者工具（Windows 平台）滚动会员权益页，二维码正常跟随页面滚动，无漂浮、无空白框。
- 点击二维码区域触发刷新，旧图片清除，新二维码图片正常生成并替换。
- 每 2 分钟自动刷新定时器正常清除旧图片并重新生成。
  - 切换演示用户时二维码正确初始化。


## 6. 后续防护

- 微信小程序中涉及 Canvas 的 UI 展示需求，评估是否可采用"Canvas 离屏渲染 → 导出图片 → `<image>` 展示"方案，避免直接依赖 Canvas 与文档流的协同行为。
- 对 `uni_modules` 内第三方组件库的修改应记录在案，升级组件库版本时需检查 patch 是否仍需保留。
- 如需在更多页面展示二维码，应将"离屏渲染 + 图片展示"逻辑抽取为可复用组件。
