# 自动更新功能使用说明

OpenWork 现已支持自动更新功能！当有新版本发布时，用户会收到通知并可以一键更新。

## 用户端使用

### 自动更新检查

应用会在以下情况自动检查更新：
- 应用启动后 5 秒
- 每 24 小时检查一次

### 手动检查更新

在渲染进程中，你可以调用：

```typescript
// 检查更新
const result = await window.api.updater.checkForUpdates()

if (result.success && result.updateAvailable) {
  console.log(`发现新版本: ${result.version}`)
  console.log(`更新日志: ${result.releaseNotes}`)
}

// 获取当前版本
const versionInfo = await window.api.updater.getAppVersion()
console.log(`当前版本: ${versionInfo.version}`)
```

### 监听更新事件

```typescript
// 监听更新可用事件
const cleanup1 = window.api.updater.onUpdateAvailable((info) => {
  console.log(`发现新版本: ${info.version}`)
  showUpdateNotification(info)
})

// 监听下载完成事件
const cleanup2 = window.api.updater.onUpdateDownloaded(() => {
  console.log('更新下载完成，请重启应用')
  promptRestart()
})

// 监听下载进度
const cleanup3 = window.api.updater.onDownloadProgress((progress) => {
  console.log(`下载进度: ${progress.percent}%`)
  updateProgressBar(progress.percent)
})

// 清理监听器
// cleanup1()
// cleanup2()
// cleanup3()
```

### 下载和安装更新

```typescript
// 下载更新
const result = await window.api.updater.downloadUpdate()
if (result.success) {
  console.log('开始下载更新...')
}

// 安装更新（会重启应用）
await window.api.updater.installUpdate()
```

## 开发者发布流程

### 快速发布

1. 更新版本号和 CHANGELOG
2. 运行发布脚本：

```bash
./scripts/release.sh
```

脚本会自动：
- 构建 & 打包
- 创建 Git Tag
- 创建 GitHub Release
- 上传所有平台的安装包

### 手动发布

参考 `RELEASE_GUIDE.md` 文档。

## 配置说明

自动更新功能已完全配置好，使用以下技术：

- **electron-updater**: 处理更新逻辑
- **GitHub Releases**: 托管更新文件
- **electron-builder**: 打包和发布

配置位于：
- `package.json` - 发布配置
- `src/main/ipc/updater.ts` - 更新逻辑
- `src/preload/index.ts` - API 暴露

## 常见问题

### Q: 开发模式下会检查更新吗？

不会。更新功能只在生产环境（打包后的应用）中启用。

### Q: 如何测试更新功能？

1. 打包当前版本
2. 修改版本号并发布新版本
3. 运行旧版本应用，检查是否能检测到更新

### Q: 更新文件存放在哪里？

- macOS: `~/Library/Caches/openwork-updater`
- Windows: `%LOCALAPPDATA%\openwork-updater`
- Linux: `~/.config/openwork-updater/cache`

## 技术细节

### 更新检查流程

1. 应用向 GitHub API 查询最新 Release
2. 比较版本号
3. 如果有新版本，下载对应的安装包
4. 下载完成后提示用户重启
5. 重启时安装更新

### 支持的平台

- ✅ macOS (DMG, ZIP)
- ✅ Windows (NSIS, Portable)
- ✅ Linux (AppImage, DEB)

### 发布要求

- 需要安装 GitHub CLI (`gh`)
- 需要 GitHub Personal Access Token（已配置）
- 需要推送到 main 分支

## 相关文档

- `RELEASE_GUIDE.md` - 完整的发布指南
- `BUILD_GUIDE.md` - 打包配置说明
- `CHANGELOG.md` - 更新日志

## 反馈问题

如果遇到更新相关的问题，请在 GitHub 提交 Issue：
https://github.com/uniqueli/openwork/issues
