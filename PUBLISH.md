# 发布指南

## 准备工作

### 1. 确保你已登录 npm

```bash
npm login
```

输入你的 npm 用户名、密码和邮箱。

### 2. 检查包名是否可用

```bash
npm view @uniqueli/openwork
```

如果显示 404，说明包名可用。

## 发布步骤

### 1. 构建项目

```bash
cd openwork
npm install
npm run build
```

### 2. 测试构建结果

```bash
npm run start
```

确保应用可以正常运行。

### 3. 更新版本号（可选）

如果需要更新版本：

```bash
# 补丁版本 (0.1.0 -> 0.1.1)
npm version patch

# 小版本 (0.1.0 -> 0.2.0)
npm version minor

# 大版本 (0.1.0 -> 1.0.0)
npm version major
```

### 4. 发布到 npm

```bash
npm publish --access public
```

注意：由于包名是 scoped（@uniqueli/openwork），需要添加 `--access public` 参数。

### 5. 验证发布

```bash
npm view @uniqueli/openwork
```

应该能看到你刚发布的版本信息。

### 6. 测试安装

```bash
# 在另一个目录测试
npx @uniqueli/openwork
```

## 发布检查清单

- [ ] 代码已提交到 Git
- [ ] 所有测试通过
- [ ] 构建成功（npm run build）
- [ ] 版本号已更新
- [ ] README.md 已更新
- [ ] CHANGELOG.md 已更新（如果有）
- [ ] 已登录 npm
- [ ] 发布成功
- [ ] 验证安装成功

## 常见问题

### 1. 403 Forbidden

**原因**: 没有权限发布到这个包名

**解决**: 
- 确保已登录正确的 npm 账号
- 确保包名没有被其他人占用
- 使用 `--access public` 参数

### 2. 包名已存在

**原因**: 包名已被占用

**解决**:
- 更改包名（在 package.json 中）
- 或者联系 npm 支持

### 3. 构建失败

**原因**: 依赖或代码问题

**解决**:
- 运行 `npm install` 重新安装依赖
- 检查 TypeScript 错误
- 查看构建日志

## 更新已发布的包

如果需要更新已发布的包：

```bash
# 1. 修改代码
# 2. 更新版本号
npm version patch

# 3. 重新构建
npm run build

# 4. 发布新版本
npm publish --access public
```

## 撤销发布

如果需要撤销发布（仅限发布后 72 小时内）：

```bash
npm unpublish @uniqueli/openwork@0.1.0
```

注意：不建议撤销发布，因为可能影响已经使用该包的用户。

## 标签管理

### 发布 beta 版本

```bash
npm publish --tag beta --access public
```

### 发布 latest 版本

```bash
npm publish --tag latest --access public
```

## Git 标签

发布后建议打 Git 标签：

```bash
git tag v0.1.0
git push origin v0.1.0
```

## 自动化发布

可以使用 GitHub Actions 自动化发布流程。创建 `.github/workflows/publish.yml`：

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm install
      - run: npm run build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

需要在 GitHub 仓库设置中添加 `NPM_TOKEN` secret。
