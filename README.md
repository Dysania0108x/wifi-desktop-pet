# WiFi Desktop Pet · macOS

WiFi 是一只会在 Apple Silicon Mac 桌面上散步的黑白小狗。这个分支包含 **v0.5.0 开发版**，保留了 WiFi 的垂耳、白色额纹、背上的斑点和卷起来的尾巴。仓库只包含做成动画的角色素材，不包含真实照片。

## 怎么玩

| 操作 | WiFi 的反应 |
| --- | --- |
| 鼠标移开 | 它会自己散步、闻地面、坐下或趴着休息 |
| 单击 | 摸摸它，它会眯眼 |
| 双击 | 滚出一个网球；WiFi 追过去碰碰球，再折返 |
| 右键或 Shift + F10 | 扔网球、喂食、给水、叫它过来、让它休息、暂停或退出 |
| 拖动 | 把它放到屏幕上的另一处 |

键盘聚焦 WiFi 后，T 扔球、F 喂食、W 给水。水碗有涟漪，食物会逐步减少。玩具和碗活动在 WiFi 周围的小范围，避免一个大透明窗口挡住其他 App；结束后它继续在桌面上散步。系统开启「减少动态效果」会关闭自动漫步。

## 在 Mac 开发运行

下载或检出本分支 **`feat/mac-desktop-mvp`**，终端进入包含 `package.json` 的项目目录。建议使用 Node.js 22，与 CI 一致：

```bash
npm install
npm test
npm run dev
```

## Mac 测试构建

GitHub **Actions → Build macOS app** 会在此分支有新提交时构建 arm64 测试包。只有对应提交的构建成功，才会在运行详情的 **Artifacts** 中出现 `wifi-desktop-pet-macos-verified`。本地构建命令：

```bash
npm run build -- --arm64 --publish never
```

Vite 的网页文件在 `dist/`，打包后的 App 在 `release/mac-arm64/`。CI 检查 App 内的页面和角色素材，再验证本地测试签名与解压后的完整性。**测试签名不等于 Apple 公证，也不是正式发布或自动更新。** 不要关闭 Gatekeeper；如果 macOS 阻止打开，请保留旧版并记录报错。

WiFi 不需要账户、摄像头或联网，不读取桌面内容；窗口位置和摸摸次数保存在本机。源码包与安装包不是同一件事。
