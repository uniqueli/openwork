# 快速发布指引

## ✅ 已完成的准备工作

1. ✅ 代码已提交到本地仓库 (commit: d901757)
2. ✅ Git Tag 已创建 (v0.4.1)
3. ✅ 安装包已生成 (dist/ 目录)

## 📋 接下来需要你手动完成的步骤

### 方式 1：使用命令行（推荐）

```bash
# 1. 推送代码和 Tag 到 GitHub
git push origin main
git push origin v0.4.1

# 2. 如果配置了 GitHub CLI
gh release create v0.4.1 \
  --title "v0.4.1 - 添加打包和自动更新功能" \
  --notes-file RELEASE_GUIDE.md \
  dist/*.dmg \
  dist/*.zip
```

### 方式 2：使用浏览器（简单）

1. **推送代码到 GitHub：**
   ```bash
   git push origin main
   git push origin v0.4.1
   ```

2. **访问 GitHub 创建 Release：**
   - 打开浏览器访问：https://github.com/uniqueli/openwork/releases/new
   - 选择 Tag: `v0.4.1`
   - 目标分支: `main`
   - Release 标题: `v0.4.1 - 添加打包和自动更新功能`
   - Release 描述: 复制下面的内容

3. **上传安装包：**
   点击 "Attach binaries" 或拖拽以下文件：
   - `dist/OpenWork-0.4.1-arm64.dmg`
   - `dist/OpenWork-0.4.1-arm64-mac.zip`
   - `dist/OpenWork-0.4.1.dmg`
   - `dist/OpenWork-0.4.1-mac.zip`

4. **点击 "Publish release"**

---

## 📝 Release 描述（复制这个）

```markdown
## v0.4.1 - 添加打包和自动更新功能

### 新增功能 🎉

- ✨ **应用打包** - 集成 electron-builder，支持多平台打包
- 🔄 **自动更新** - 集成 electron-updater，支持应用自动更新
- 📦 **一键发布** - 提供自动化发布脚本
- 📚 **完整文档** - 添加打包和发布指南

### 支持的平台

- macOS (Apple Silicon + Intel)
- Windows (x64 + ia32)
- Linux (x64 + arm64)

### 下载

- **Apple Mac (M1/M2/M3)**: 下载 `OpenWork-0.4.1-arm64.dmg`
- **Intel Mac**: 下载 `OpenWork-0.4.1.dmg`

### 自动更新

用户安装此版本后，应用会自动检查更新，后续版本更新时会收到通知并一键安装。

### 开发者

- 添加了完整的打包配置
- 创建了发布脚本 `scripts/release.sh`
- 提供了详细的文档说明

### 完整更新日志

查看 [CHANGELOG.md](https://github.com/uniqueli/openwork/blob/main/CHANGELOG.md)
```

---

## 🎯 发布后的验证

1. 访问 https://github.com/uniqueli/openwork/releases 确认 Release 已创建
2. 下载安装包测试能否正常安装
3. 安装后检查是否能检测到更新（虽然这是第一个版本）

## 💡 提示

- 首次推送可能需要输入 GitHub 用户名和密码（或 Personal Access Token）
- 如果遇到认证问题，可以使用 SSH URL 替代 HTTPS：
  ```bash
  git remote set-url origin git@github.com:uniqueli/openwork.git
  ```
- 安装 GitHub CLI 可以简化发布流程：`brew install gh`
