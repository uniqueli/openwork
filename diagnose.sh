#!/bin/bash

echo "=========================================="
echo "Custom API 配置诊断"
echo "=========================================="
echo ""

# 检查配置文件
echo "1. 检查配置文件..."
if [ -f ~/.openwork/.env ]; then
    echo "✓ 配置文件存在"
    echo ""
    echo "配置内容："
    grep CUSTOM ~/.openwork/.env || echo "❌ 没有找到 CUSTOM 相关配置"
else
    echo "❌ 配置文件不存在: ~/.openwork/.env"
fi

echo ""
echo "=========================================="
echo "2. 检查默认模型设置..."
if [ -f ~/.openwork/settings.json ]; then
    echo "✓ 设置文件存在"
    echo ""
    echo "默认模型："
    cat ~/.openwork/settings.json | grep -o '"defaultModel":"[^"]*"' || echo "未设置"
else
    echo "⚠️  设置文件不存在（这是正常的，会使用默认值）"
fi

echo ""
echo "=========================================="
echo "3. 诊断结果"
echo "=========================================="
echo ""

# 检查是否配置了 Custom API
if grep -q "CUSTOM_BASE_URL" ~/.openwork/.env 2>/dev/null && \
   grep -q "CUSTOM_API_KEY" ~/.openwork/.env 2>/dev/null; then
    echo "✓ Custom API 已配置"
    echo ""
    echo "⚠️  重要提示："
    echo "   即使配置了 Custom API，你仍然需要在 UI 中选择它！"
    echo ""
    echo "   请按照以下步骤操作："
    echo "   1. 在应用中找到模型选择器（显示当前模型名称的按钮）"
    echo "   2. 点击它打开菜单"
    echo "   3. 左侧选择 'Custom API'"
    echo "   4. 右侧选择 'custom' 模型"
    echo "   5. 确认模型选择器显示 'custom'"
    echo ""
else
    echo "❌ Custom API 未配置"
    echo ""
    echo "请先配置 Custom API："
    echo "1. 在应用中点击 Custom API 的钥匙图标"
    echo "2. 填写 Base URL 和 API Key"
    echo "3. 点击 Save"
fi

echo ""
echo "=========================================="
echo "4. 下一步操作"
echo "=========================================="
echo ""
echo "如果配置正确但仍然报错，请检查："
echo ""
echo "□ 是否重新构建了应用？"
echo "  npm run build && npm run dev"
echo ""
echo "□ 是否在 UI 中选择了 'custom' 模型？"
echo "  （不是 claude、gpt 或 gemini）"
echo ""
echo "□ 模型选择器是否显示 'custom'？"
echo "  （不是 'claude-sonnet-4-5-20250929'）"
echo ""
echo "□ 控制台日志是否显示 'Using model: custom'？"
echo "  （打开开发者工具查看）"
echo ""
