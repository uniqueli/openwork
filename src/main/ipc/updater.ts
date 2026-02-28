import { ipcMain, autoUpdater, app } from "electron"
import log from "electron-log"

// 简单的开发环境检查
const isDev = !app.isPackaged

/**
 * 注册更新相关的 IPC 处理器
 */
export function registerUpdaterHandlers(): void {
  // 检查更新
  ipcMain.handle("check-for-updates", async () => {
    try {
      if (isDev) {
        log.info("Skipping update check in development mode")
        return {
          success: false,
          message: "开发模式下跳过更新检查"
        }
      }

      log.info("Checking for updates...")
      const updateCheckResult = await autoUpdater.checkForUpdates() as any

      if (updateCheckResult === null) {
        return {
          success: true,
          updateAvailable: false,
          message: "已经是最新版本"
        }
      }

      return {
        success: true,
        updateAvailable: true,
        version: updateCheckResult.updateInfo.version,
        releaseNotes: updateCheckResult.updateInfo.releaseNotes,
        downloadURL: updateCheckResult.updateInfo.url
      }
    } catch (error) {
      log.error("Check for updates error:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "检查更新失败"
      }
    }
  })

  // 下载并安装更新
  ipcMain.handle("download-update", async () => {
    try {
      if (isDev) {
        return {
          success: false,
          message: "开发模式下无法下载更新"
        }
      }

      // electron-updater 会自动下载
      return {
        success: true,
        message: "更新将在后台下载"
      }
    } catch (error) {
      log.error("Download update error:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "下载更新失败"
      }
    }
  })

  // 安装更新并重启应用
  ipcMain.handle("install-update", async () => {
    try {
      if (isDev) {
        return {
          success: false,
          message: "开发模式下无法安装更新"
        }
      }

      // 立即退出并安装
      setImmediate(() => {
        autoUpdater.quitAndInstall()
      })

      return {
        success: true,
        message: "正在安装更新并重启应用"
      }
    } catch (error) {
      log.error("Install update error:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "安装更新失败"
      }
    }
  })

  // 获取当前版本
  ipcMain.handle("get-app-version", async () => {
    return {
      version: app.getVersion(),
      isDev
    }
  })

  log.info("Updater handlers registered")
}

/**
 * 设置自动检查更新（应用启动时）
 */
export function setupAutoUpdateCheck(intervalMs: number = 24 * 60 * 60 * 1000): void {
  if (isDev) {
    log.info("Auto-update check disabled in development mode")
    return
  }

  // 应用启动时检查一次
  setTimeout(() => {
    log.info("Performing initial update check...")
    void autoUpdater.checkForUpdates()
  }, 5000) // 5秒后检查，避免影响启动速度

  // 定期检查更新
  setInterval(() => {
    log.info("Performing scheduled update check...")
    void autoUpdater.checkForUpdates()
  }, intervalMs)

  log.info(`Auto-update check scheduled every ${intervalMs / 1000 / 60 / 60} hours`)
}
