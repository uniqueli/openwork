# Build Resources

此目录包含 Electron 应用打包所需的资源文件。

## 图标文件说明

打包需要以下图标文件：

### macOS
- `icon.icns` - macOS 应用图标（推荐尺寸：1024x1024px）

### Windows
- `icon.ico` - Windows 应用图标（包含多种尺寸：16x16, 32x32, 48x48, 256x256）

### Linux
- `icons/` 目录，包含：
  - `icon.png` - 512x512px PNG 图标
  - `icon.svg` - SVG 矢量图标

## 如何生成图标文件

### 方法 1：使用在线工具
访问 https://png2ico.com/ 或类似网站，将 PNG 转换为 ICO/ICNS 格式

### 方法 2：使用命令行工具

#### 安装工具
```bash
# macOS
npm install -g @electron/osx-sign

# 通用
npm install -g electron-icon-builder
```

#### 生成图标
```bash
# 从一个 1024x1024 的 PNG 文件生成所有平台图标
electron-icon-builder --input=./path/to/your-icon.png --output=./build --flatten
```

## 临时方案

如果暂时没有图标文件，electron-builder 会使用默认的 Electron 图标进行打包。

## 文件权限

确保 `entitlements.mac.plist` 文件具有正确的权限，用于 macOS 代码签名。
