#!/bin/bash

# 发布脚本
# 使用方法: ./publish.sh [patch|minor|major]

set -e

echo "=========================================="
echo "发布 @uniqueli/openwork 到 npm"
echo "=========================================="
echo ""

# 检查是否登录 npm
echo "1. 检查 npm 登录状态..."
if ! npm whoami > /dev/null 2>&1; then
    echo "❌ 未登录 npm，请先运行: npm login"
    exit 1
fi
echo "✓ 已登录为: $(npm whoami)"
echo ""

# 检查 Git 状态
echo "2. 检查 Git 状态..."
if [[ -n $(git status -s) ]]; then
    echo "⚠️  有未提交的更改"
    read -p "是否继续? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✓ Git 工作区干净"
fi
echo ""

# 更新版本号
VERSION_TYPE=${1:-patch}
echo "3. 更新版本号 ($VERSION_TYPE)..."
npm version $VERSION_TYPE --no-git-tag-version
NEW_VERSION=$(node -p "require('./package.json').version")
echo "✓ 新版本: $NEW_VERSION"
echo ""

# 构建项目
echo "4. 构建项目..."
npm run build
echo "✓ 构建完成"
echo ""

# 发布到 npm
echo "5. 发布到 npm..."
npm publish --access public
echo "✓ 发布成功"
echo ""

# 提交版本更新
echo "6. 提交版本更新到 Git..."
git add package.json
git commit -m "chore: bump version to $NEW_VERSION"
git tag "v$NEW_VERSION"
echo "✓ 已创建 Git 标签: v$NEW_VERSION"
echo ""

# 推送到远程
echo "7. 推送到远程仓库..."
read -p "是否推送到远程? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin main
    git push origin "v$NEW_VERSION"
    echo "✓ 已推送到远程"
else
    echo "⚠️  跳过推送，请手动运行:"
    echo "   git push origin main"
    echo "   git push origin v$NEW_VERSION"
fi
echo ""

echo "=========================================="
echo "✓ 发布完成！"
echo "=========================================="
echo ""
echo "包名: @uniqueli/openwork"
echo "版本: $NEW_VERSION"
echo "查看: https://www.npmjs.com/package/@uniqueli/openwork"
echo ""
echo "测试安装:"
echo "  npx @uniqueli/openwork@$NEW_VERSION"
echo ""
