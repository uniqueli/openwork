#!/bin/bash

set -e

VERSION="0.4.1"
REPO="uniqueli/openwork"
TOKEN=$(gh auth token)

echo "📝 创建 GitHub Release v${VERSION}..."

# 创建 Release
RESPONSE=$(curl -X POST \
  -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/$REPO/releases \
  -d "{
    \"tag_name\": \"v$VERSION\",
    \"target_commitish\": \"main\",
    \"name\": \"v$VERSION - 添加打包和自动更新功能\",
    \"body\": \"## v$VERSION - 添加打包和自动更新功能\\n\\n### 新增功能 🎉\\n\\n- ✨ **应用打包** - 集成 electron-builder，支持多平台打包\\n- 🔄 **自动更新** - 集成 electron-updater，支持应用自动更新\\n- 📦 **一键发布** - 提供自动化发布脚本\\n- 📚 **完整文档** - 添加打包和发布指南\\n\\n### 支持的平台\\n\\n- macOS (Apple Silicon + Intel)\\n- Windows (x64 + ia32)\\n- Linux (x64 + arm64)\\n\\n### 下载\\n\\n- **Apple Mac (M1/M2/M3)**: 下载 OpenWork-$VERSION-arm64.dmg\\n- **Intel Mac**: 下载 OpenWork-$VERSION.dmg\\n\\n### 自动更新\\n\\n用户安装此版本后，应用会自动检查更新，后续版本更新时会收到通知并一键安装。\\n\\n### 完整更新日志\\n\\n查看 [CHANGELOG.md](https://github.com/$REPO/blob/main/CHANGELOG.md)\",
    \"draft\": false,
    \"prerelease\": false
  }")

# 提取上传 URL
UPLOAD_URL=$(echo $RESPONSE | grep -o '"upload_url": "[^"]*' | cut -d'"' -f4 | sed 's/{?name,label}/?name=/')

echo "✅ Release 创建成功!"
echo "📤 开始上传安装包..."

# 上传 DMG 文件
for file in dist/OpenWork-*.dmg dist/OpenWork-*.zip; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    echo "上传 $filename ..."

    curl -X POST \
      -H "Authorization: token $TOKEN" \
      -H "Content-Type: application/octet-stream" \
      "$UPLOAD_URL$filename" \
      --data-binary @"$file" \
      --progress-bar

    echo "✅ $filename 上传完成"
  fi
done

echo ""
echo "🎉 发布完成!"
echo "🔗 查看发布: https://github.com/$REPO/releases/tag/v$VERSION"
