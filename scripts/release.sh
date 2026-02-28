#!/bin/bash

set -e

# 获取版本号
VERSION=$(node -p "require('./package.json').version")

echo "🚀 Releasing OpenWork version $VERSION..."
echo ""

# 检查是否安装了 GitHub CLI
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) 未安装"
    echo "请访问 https://cli.github.com/ 安装"
    exit 1
fi

# 检查是否已登录 GitHub
if ! gh auth status &> /dev/null; then
    echo "❌ 未登录 GitHub"
    echo "请运行: gh auth login"
    exit 1
fi

# 检查是否有未提交的更改
if [[ -n $(git status --porcelain) ]]; then
    echo "⚠️  警告: 有未提交的更改"
    echo "请先提交或暂存更改"
    git status
    exit 1
fi

# 检查当前分支
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
    echo "⚠️  警告: 当前不在 main 分支"
    echo "当前分支: $CURRENT_BRANCH"
    read -p "是否继续? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 确认发布
echo "📦 准备发布版本: $VERSION"
echo "⚠️  请确认以下信息:"
echo "  - 版本号正确"
echo "  - CHANGELOG 已更新"
echo "  - 所有更改已提交"
echo ""
read -p "确认发布? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "取消发布"
    exit 1
fi

# 创建 Git Tag
echo ""
echo "🏷️  创建 Git tag: v$VERSION"
git tag -a "v$VERSION" -m "Release v$VERSION"

# 推送 tag
echo "📤 推送 tag 到 GitHub"
git push origin "v$VERSION"

# 构建和打包
echo ""
echo "🔨 构建项目..."
npm run build

echo "📦 打包应用..."
npm run dist

# 检查打包文件
if [[ ! -d "dist" ]]; then
    echo "❌ 打包失败: dist 目录不存在"
    exit 1
fi

# 收集打包文件
FILES=$(find dist -type f \( -name "*.dmg" -o -name "*.zip" -o -name "*.exe" -o -name "*.AppImage" -o -name "*.deb" \) 2>/dev/null || true)

if [[ -z "$FILES" ]]; then
    echo "❌ 未找到打包文件"
    exit 1
fi

echo "✅ 打包完成，找到以下文件:"
echo "$FILES"
echo ""

# 创建 GitHub Release
echo "📝 创建 GitHub Release..."
NOTES=$(sed -n "/## \[$VERSION\]/,/^## /p" CHANGELOG.md | head -n -1 || echo "Release v$VERSION")

gh release create "v$VERSION" \
  --title "v$VERSION" \
  --notes "$NOTES" \
  $FILES

echo ""
echo "✅ 发布成功!"
echo "🔗 查看发布: https://github.com/uniqueli/openwork/releases/tag/v$VERSION"
echo ""
echo "📋 后续步骤:"
echo "  1. 在 GitHub 上验证 Release"
echo "  2. 下载安装包测试"
echo "  3. 通知用户更新"
