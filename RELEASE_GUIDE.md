# OpenWork 更新发布指南

本文档说明如何发布新版本并让用户自动更新。

## 自动更新工作流程

1. **开发新版本** - 在本地开发新功能
2. **更新版本号** - 修改 package.json 中的版本号
3. **打包发布** - 运行发布脚本生成安装包并上传到 GitHub
4. **用户接收更新** - 用户应用会自动检查更新并提示下载安装

## 发布新版本步骤

### 1. 更新版本号

编辑 `package.json`，更新版本号：

```json
{
  "version": "0.5.0"  // 从 0.4.1 升级到 0.5.0
}
```

版本号遵循语义化版本规范（Semantic Versioning）：
- **主版本号（Major）**：不兼容的 API 变更，如 1.0.0 → 2.0.0
- **次版本号（Minor）**：向下兼容的功能性新增，如 0.4.0 → 0.5.0
- **修订号（Patch）**：向下兼容的问题修正，如 0.4.1 → 0.4.2

### 2. 更新 CHANGELOG

在 `CHANGELOG.md` 中添加更新日志：

```markdown
## [0.5.0] - 2025-02-28

### Added
- 新功能 A
- 新功能 B

### Fixed
- 修复问题 A
- 修复问题 B

### Changed
- 改进功能 A

### Removed
- 移除功能 A
```

### 3. 构建 & 打包

```bash
# 构建
npm run build

# 打包所有平台
npm run dist
```

打包完成后，安装包会生成在 `dist/` 目录：
- macOS: `OpenWork-0.5.0-arm64.dmg`, `OpenWork-0.5.0-x64.dmg`
- Windows: `OpenWork Setup 0.5.0.exe`
- Linux: `OpenWork-0.5.0.AppImage`, `openwork_0.5.0_amd64.deb`

### 4. 创建 GitHub Release

有两种方式创建 Release：

#### 方式 A：手动创建

1. 访问 GitHub Releases 页面
2. 点击 "Draft a new release"
3. 填写 Release 信息：
   - **Tag**: `v0.5.0` （注意加 v 前缀）
   - **Target**: 选择 main 分支
   - **Title**: `v0.5.0 - 新功能描述`
   - **Description**: 从 CHANGELOG 复制更新日志
4. 上传打包文件：
   - `OpenWork-0.5.0-arm64.dmg`
   - `OpenWork-0.5.0-arm64.zip`
   - `OpenWork-0.5.0-x64.dmg`
   - `OpenWork-0.5.0-x64.zip`
   - `OpenWork Setup 0.5.0.exe`
   - `OpenWork-0.5.0.AppImage`
   - `openwork_0.5.0_amd64.deb`
5. 点击 "Publish release"

#### 方式 B：使用发布脚本（推荐）

创建发布脚本 `scripts/release.sh`：

```bash
#!/bin/bash

VERSION=$(node -p "require('./package.json').version")

echo "Releasing version $VERSION..."

# 构建和打包
npm run build
npm run dist

# 使用 GitHub CLI 创建 Release
gh release create "v$VERSION" \
  --title "v$VERSION" \
  --notes "$(sed -n "/## \[$VERSION\]/,/^## /p" CHANGELOG.md | head -n -1)" \
  dist/*.dmg \
  dist/*.zip \
  dist/*.exe \
  dist/*.AppImage \
  dist/*.deb

echo "Release v$VERSION created successfully!"
```

使用脚本：

```bash
chmod +x scripts/release.sh
./scripts/release.sh
```

### 5. 验证发布

1. 访问 GitHub Releases 页面，确认 Release 创建成功
2. 下载安装包测试是否能正常安装
3. 运行旧版本应用，检查是否能检测到新版本

## 自动更新机制

### 更新检查时机

应用会在以下时机自动检查更新：
1. **应用启动时** - 延迟 5 秒后检查（避免影响启动速度）
2. **定期检查** - 每 24 小时检查一次
3. **手动检查** - 用户可以在设置中点击"检查更新"按钮

### 更新流程

1. **检查更新**
   - 应用向 GitHub API 查询最新 Release
   - 比较版本号，发现新版本

2. **通知用户**
   - 显示更新通知弹窗
   - 展示新版本号和更新日志

3. **下载更新**
   - 用户确认后开始下载
   - 显示下载进度
   - 下载完成后通知用户

4. **安装更新**
   - 用户点击"立即重启"
   - 应用退出并安装更新
   - 自动重启应用

### 更新日志格式

为了在更新通知中正确显示，Release 的 Description 应该遵循以下格式：

```markdown
## v0.5.0

### 新增功能
- 功能 A
- 功能 B

### 问题修复
- 问题 A
- 问题 B

### 改进优化
- 优化 A
```

## 配置说明

### electron-builder 配置

在 `package.json` 中已配置发布设置：

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "uniqueli",
      "repo": "openwork",
      "releaseType": "release"
    }
  }
}
```

### GitHub Token

electron-updater 使用公开的 GitHub API，不需要额外的 Token。

如果设置了私有仓库，需要在环境变量中配置：

```bash
export GH_TOKEN="your_github_token"
```

## 故障排查

### Q: 应用检测不到更新？

**检查项：**
1. GitHub Release 是否已发布
2. Release 的 Tag 是否正确（如 `v0.5.0`）
3. Release 是否包含对应平台的安装包
4. 应用的 `version` 是否低于 Release 版本
5. 查看应用日志：`~/Library/Logs/openwork/main.log`

### Q: 下载失败？

**可能原因：**
1. 网络问题
2. GitHub 访问受限（国内用户）
3. 安装包 URL 不正确

**解决方案：**
- 提供手动下载链接
- 考虑使用 CDN 加速
- 设置镜像源

### Q: 安装失败？

**检查项：**
1. 是否有写入权限
2. 磁盘空间是否充足
3. macOS: 是否已允许来自未知开发者的应用

## 最佳实践

1. **版本管理**
   - 使用语义化版本号
   - 每次发布都更新 CHANGELOG
   - 保留发布说明的历史记录

2. **测试流程**
   - 在测试环境充分测试
   - 发布前进行完整的回归测试
   - 先发布 Beta 版本供小部分用户测试

3. **发布频率**
   - 小版本更新可以频繁发布（如每周）
   - 大版本更新需要充分准备（如每月或每季度）
   - 紧急安全修复应立即发布

4. **回滚策略**
   - 保留旧版本下载链接
   - 准备快速回滚方案
   - 监控更新后的用户反馈

## 相关文件

- `package.json` - 版本号和发布配置
- `CHANGELOG.md` - 更新日志
- `src/main/ipc/updater.ts` - 更新逻辑
- `src/preload/index.ts` - 更新 API 暴露
- `BUILD_GUIDE.md` - 打包指南

## 参考资源

- [electron-updater 文档](https://www.electron.build/auto-update)
- [electron-builder 文档](https://www.electron.build/)
- [语义化版本规范](https://semver.org/lang/zh-CN/)
- [GitHub Releases API](https://docs.github.com/en/rest/releases)
