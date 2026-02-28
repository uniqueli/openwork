# OpenWork 打包指南

本文档说明如何将 OpenWork Electron 应用打包成可分发的安装程序。

## 前置要求

- Node.js >= 18
- npm 或 pnpm

## 打包命令

### 开发测试

```bash
# 构建项目
npm run build

# 打包但不创建安装包（用于快速测试）
npm run pack
```

### 生成安装包

```bash
# 打包当前平台的安装包
npm run dist

# 仅打包 macOS 版本
npm run dist:mac

# 仅打包 Windows 版本（需要在 Windows 上运行）
npm run dist:win

# 仅打包 Linux 版本
npm run dist:linux
```

## 输出位置

打包完成后，安装包会生成在 `dist/` 目录：

### macOS
- `OpenWork-0.4.1-arm64.dmg` - Apple Silicon (M1/M2/M3) 版本
- `OpenWork-0.4.1-x64.dmg` - Intel 版本
- `OpenWork-0.4.1-arm64.zip` - Apple Silicon 压缩包
- `OpenWork-0.4.1-x64.zip` - Intel 压缩包

### Windows
- `OpenWork Setup 0.4.1.exe` - 安装程序
- `OpenWork 0.4.1.exe` - 便携版

### Linux
- `OpenWork-0.4.1.AppImage` - 通用 AppImage
- `openwork_0.4.1_amd64.deb` - Debian/Ubuntu 安装包

## 当前配置

### 应用信息
- **应用名称**: OpenWork
- **应用 ID**: com.uniqueli.openwork
- **版本**: 0.4.1
- **版权**: Copyright © 2025 uniqueli

### 支持的平台
- ✅ macOS (Apple Silicon + Intel)
- ✅ Windows (x64 + ia32)
- ✅ Linux (x64 + arm64)

## 自定义图标

当前使用默认的 Electron 图标。要使用自定义图标：

1. 准备一个 1024x1024 的 PNG 图标文件
2. 安装图标生成工具：
   ```bash
   npm install -g electron-icon-builder
   ```
3. 生成图标：
   ```bash
   electron-icon-builder --input=./your-icon.png --output=./build --flatten
   ```
4. 重新运行打包命令

详细信息请参考 `build/README.md`。

## 代码签名（macOS）

当前配置未设置代码签名，这在分发时可能会触发安全警告。

### 生产环境签名

要启用代码签名，需要：

1. 申请 Apple Developer ID 证书
2. 在 `package.json` 的 `build.mac` 中配置：
   ```json
   "mac": {
     "hardenedRuntime": true,
     "gatekeeperAssess": false,
     "identity": "Developer ID Application: Your Name (TEAM_ID)"
   }
   ```

## 分发

### GitHub Releases
配置已设置 GitHub 发布支持。要自动发布到 GitHub：

```bash
# 发布到 GitHub Releases
npm run publish
```

### 手动分发
1. 从 `dist/` 目录复制安装包
2. 上传到文件托管服务（如 GitHub Releases、官网等）
3. 分发下载链接给用户

## 常见问题

### Q: 打包时出现 pnpm 错误？
A: 已在配置中移除 `packageManager` 字段以避免此问题。

### Q: 打包后的应用体积很大？
A: 这是正常的，Electron 应用包含了 Chromium 和 Node.js 运行时。可以通过以下方式优化：
- 使用 `npmRebuild: false`（已配置）
- 仅打包必要的依赖

### Q: Windows 打包需要在 macOS 上进行？
A: 跨平台打包需要使用 CI/CD 服务，如 GitHub Actions、Travis CI 等。本地打包建议在对应平台进行。

### Q: 如何测试打包后的应用？
A: 在 macOS 上：
```bash
open dist/mac/OpenWork.app
```

## 下一步优化建议

1. **添加应用图标** - 提升品牌识别度
2. **配置代码签名** - 提升用户信任度
3. **设置自动更新** - 使用 `electron-updater`
4. **优化安装包大小** - 清理不必要的依赖
5. **添加安装程序定制** - 自定义 NSIS 安装界面
6. **配置 CI/CD** - 自动构建多平台版本

## 相关文件

- `package.json` - 打包配置
- `build/entitlements.mac.plist` - macOS 权限配置
- `build/README.md` - 图标文件说明
- `electron.vite.config.ts` - Electron 构建配置

## 技术支持

如有问题，请查看：
- [electron-builder 官方文档](https://www.electron.build/)
- [Electron 官方文档](https://www.electronjs.org/docs)
- 项目 Issues: https://github.com/uniqueli/openwork/issues
