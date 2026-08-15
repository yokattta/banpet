# 班宠 Banpet

领养一只陪你把今天工资挣完的班宠。

## MVP

- 根据 MBTI、星座和今日状态娱乐匹配班宠
- 实时计算今日已赚工资与下班倒计时
- 本地保存工资设置，不上传敏感数据
- 宠物互动与分享

这是一个零依赖静态网页。直接打开 `index.html`，或使用任意静态服务器运行。

## 产品范围

当前版本用于验证“班宠匹配是否能带来分享，以及工资计时是否能带来次日回访”。AI 对话、原生桌面悬浮窗、账号系统和付费皮肤暂不包含。

## Mac 菜单栏内部版

`macos/` 包含一个纯本地 SwiftUI 菜单栏应用：自动计算工资和下班倒计时，可选读取 Apple Calendar 会议时长。它不保存会议标题，也不需要后端。

构建需要完整 Xcode 26.1 或与本机 macOS SDK 匹配的 Apple Swift 工具链：进入 `macos/` 后运行 `./build-app.sh`，成品位于 `macos/dist/Banpet.app`。

## Licence

Split, because the two halves are worth different things.

- **Code** — [MIT](LICENSE). Take the engine.
- **Content** — [CC BY-NC-SA 4.0](LICENSE-CONTENT). The Chinese copy and the pet write-ups. Credit it,
  share alike, don't sell it.

Want to use the content commercially? Open an issue — that's a conversation.
