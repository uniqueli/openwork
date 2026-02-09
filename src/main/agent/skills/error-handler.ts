/**
 * Enhanced error handling for skill operations
 * Provides detailed error messages and recovery suggestions
 */

export enum SkillErrorCode {
  // Validation errors
  VALIDATION_FAILED = "VALIDATION_FAILED",
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",

  // Permission errors
  CANNOT_MODIFY_BUILTIN = "CANNOT_MODIFY_BUILTIN",
  CANNOT_DELETE_BUILTIN = "CANNOT_DELETE_BUILTIN",
  SKILL_NOT_ENABLED = "SKILL_NOT_ENABLED",

  // Resource errors
  SKILL_NOT_FOUND = "SKILL_NOT_FOUND",
  SKILL_ALREADY_EXISTS = "SKILL_ALREADY_EXISTS",
  SKILL_LOAD_FAILED = "SKILL_LOAD_FAILED",

  // Storage errors
  STORAGE_ERROR = "STORAGE_ERROR",
  SAVE_FAILED = "SAVE_FAILED",
  LOAD_FAILED = "LOAD_FAILED",

  // System errors
  UNKNOWN_ERROR = "UNKNOWN_ERROR"
}

export interface SkillError {
  code: SkillErrorCode
  message: string
  field?: string
  details?: string
  recovery?: string[]
  originalError?: unknown
}

/**
 * Create a standardized skill error
 */
export function createSkillError(
  code: SkillErrorCode,
  message: string,
  extras?: {
    field?: string
    details?: string
    recovery?: string[]
    originalError?: unknown
  }
): SkillError {
  return {
    code,
    message,
    ...extras
  }
}

/**
 * Format skill error for user display
 */
export function formatSkillError(error: SkillError | Error | unknown): string {
  if (isSkillError(error)) {
    let output = `❌ ${error.message}`

    if (error.field) {
      output += `\n\n字段: ${error.field}`
    }

    if (error.details) {
      output += `\n\n详细信息: ${error.details}`
    }

    if (error.recovery && error.recovery.length > 0) {
      output += `\n\n建议解决方案:\n`
      error.recovery.forEach((suggestion, index) => {
        output += `${index + 1}. ${suggestion}\n`
      })
    }

    return output
  }

  if (error instanceof Error) {
    return `❌ 错误: ${error.message}`
  }

  return "❌ 未知错误"
}

/**
 * Check if error is a SkillError
 */
export function isSkillError(error: unknown): error is SkillError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  )
}

/**
 * Predefined error messages with recovery suggestions
 */
export const SKILL_ERRORS = {
  // Validation errors
  VALIDATION_FAILED: createSkillError(SkillErrorCode.VALIDATION_FAILED, "技能数据验证失败", {
    details: "请确保所有字段符合要求",
    recovery: [
      "检查必填字段是否都已填写",
      "确认字段长度在限制范围内",
      "验证字段格式是否正确"
    ]
  }),

  MISSING_REQUIRED_FIELD: (field: string) =>
    createSkillError(SkillErrorCode.MISSING_REQUIRED_FIELD, `缺少必填字段`, {
      field,
      details: `字段 "${field}" 是必填的`,
      recovery: [`请填写 ${field} 字段`]
    }),

  // Permission errors
  CANNOT_MODIFY_BUILTIN: createSkillError(
    SkillErrorCode.CANNOT_MODIFY_BUILTIN,
    "无法修改内置技能",
    {
      details: "内置技能是系统提供的，不能直接修改",
      recovery: [
        "如需自定义，请创建一个新的用户技能",
        "复制内置技能的内容到新技能中",
        "根据需要修改新技能的内容"
      ]
    }
  ),

  CANNOT_DELETE_BUILTIN: createSkillError(
    SkillErrorCode.CANNOT_DELETE_BUILTIN,
    "无法删除内置技能",
    {
      details: "内置技能是系统提供的，不能删除",
      recovery: [
        "您可以禁用不需要的内置技能",
        "在设置中切换技能的启用状态"
      ]
    }
  ),

  SKILL_NOT_ENABLED: (skillName: string) =>
    createSkillError(SkillErrorCode.SKILL_NOT_ENABLED, `技能 "${skillName}" 未启用`, {
      details: "该技能当前处于禁用状态",
      recovery: [
        "在技能面板中启用该技能",
        "确保该技能在已启用技能列表中",
        "重新加载技能列表"
      ]
    }),

  // Resource errors
  SKILL_NOT_FOUND: (skillId: string) =>
    createSkillError(SkillErrorCode.SKILL_NOT_FOUND, `找不到技能: ${skillId}`, {
      details: "技能 ID 不存在或已被删除",
      recovery: [
        "检查技能 ID 是否正确",
        "刷新技能列表",
        "该技能可能已被删除"
      ]
    }),

  SKILL_ALREADY_EXISTS: (skillId: string) =>
    createSkillError(SkillErrorCode.SKILL_ALREADY_EXISTS, `技能已存在: ${skillId}`, {
      details: "具有相同 ID 的技能已经存在",
      recovery: [
        "使用不同的 ID 创建新技能",
        "如果要更新现有技能，请使用更新功能",
        "删除现有技能后重新创建"
      ]
    }),

  // Storage errors
  STORAGE_ERROR: (details: string) =>
    createSkillError(SkillErrorCode.STORAGE_ERROR, "存储错误", {
      details,
      recovery: [
        "检查磁盘空间是否充足",
        "确保有文件写入权限",
        "尝试重新启动应用",
        "检查存储路径是否有效"
      ]
    }),

  SAVE_FAILED: createSkillError(SkillErrorCode.SAVE_FAILED, "保存技能失败", {
    details: "无法将技能数据保存到存储",
    recovery: [
      "检查技能数据格式是否正确",
      "确保存储路径可访问",
      "尝试删除并重新创建技能",
      "查看控制台日志获取详细错误信息"
    ]
  })
}

/**
 * Wrap error with context
 */
export function wrapSkillError(
  error: unknown,
  context: string,
  code: SkillErrorCode = SkillErrorCode.UNKNOWN_ERROR
): SkillError {
  if (isSkillError(error)) {
    return error
  }

  if (error instanceof Error) {
    return createSkillError(code, `${context}: ${error.message}`, {
      details: error.stack,
      originalError: error
    })
  }

  return createSkillError(code, `${context}: 未知错误`, {
    originalError: error
  })
}

/**
 * Parse validation error and return user-friendly message
 */
export function parseValidationError(error: unknown): SkillError {
  const errorMsg = error instanceof Error ? error.message : String(error)

  if (errorMsg.includes("name")) {
    return SKILL_ERRORS.MISSING_REQUIRED_FIELD("name")
  }

  if (errorMsg.includes("description")) {
    return SKILL_ERRORS.MISSING_REQUIRED_FIELD("description")
  }

  if (errorMsg.includes("prompt")) {
    return SKILL_ERRORS.MISSING_REQUIRED_FIELD("prompt")
  }

  if (errorMsg.includes("category")) {
    return SKILL_ERRORS.MISSING_REQUIRED_FIELD("category")
  }

  return SKILL_ERRORS.VALIDATION_FAILED
}

/**
 * Get error recovery steps based on error type
 */
export function getRecoverySteps(errorCode: SkillErrorCode): string[] {
  switch (errorCode) {
    case SkillErrorCode.VALIDATION_FAILED:
    case SkillErrorCode.INVALID_INPUT:
      return [
        "检查输入格式是否正确",
        "确保所有必填字段都已填写",
        "确认字段长度在限制范围内"
      ]

    case SkillErrorCode.CANNOT_MODIFY_BUILTIN:
    case SkillErrorCode.CANNOT_DELETE_BUILTIN:
      return [
        "内置技能只能启用/禁用",
        "创建用户技能来实现自定义功能"
      ]

    case SkillErrorCode.SKILL_NOT_ENABLED:
      return [
        "在技能设置中启用该技能",
        "刷新技能列表"
      ]

    case SkillErrorCode.SKILL_NOT_FOUND:
      return [
        "检查技能 ID 是否正确",
        "刷新技能列表查看可用技能"
      ]

    case SkillErrorCode.STORAGE_ERROR:
    case SkillErrorCode.SAVE_FAILED:
      return [
        "检查存储权限",
        "确保磁盘空间充足",
        "重启应用重试"
      ]

    default:
      return [
        "查看控制台日志获取详细信息",
        "重启应用",
        "如果问题持续，请报告此问题"
      ]
  }
}
