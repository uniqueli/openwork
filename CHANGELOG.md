# Changelog

All notable changes to this project will be documented in this file.

## [0.2.3] - 2026-02-04

### Added
- **Skills System**: New skill configuration feature allowing users to enable/disable specialized agent skills
  - Built-in skills: SQL Expert, Code Reviewer, Technical Writer, Debugging Expert, Test Engineer, Refactoring Expert, API Designer, Git Expert, Performance Optimizer, Security Auditor, Python Expert, JavaScript Expert
  - Support for creating custom user-defined skills
  - Skill templates for quick skill creation
  - Skills panel in the right sidebar
  - Skills are persisted and synced with deepagents skill files

### Fixed
- Fixed critical bug in `deleteUserSkill` that would accidentally delete all skill records
- Fixed Switch component click handler being overridden by external onClick prop
- Fixed `create-skill-dialog` not closing when `open` prop is false
- Fixed redundant filter in `getAutoLoadSkills` function
- Fixed `clearAllSkillFiles` only clearing built-in skills instead of all skills
- Fixed incomplete type definitions in `preload/index.d.ts` for skills API

### Changed
- Skills initialization is now lazy-loaded on first agent creation for better startup performance
- Improved props naming in `SkillsPanel` component

## [0.2.2] - 2025-xx-xx

### Added
- Multiple custom API configurations support
- Dynamic provider system for custom OpenAI-compatible APIs

## [0.2.1] - 2025-xx-xx

### Added
- Custom API configuration feature
- Support for OpenAI-compatible API endpoints

## [0.2.0] - 2025-xx-xx

### Added
- Initial release with core features
- Support for Anthropic, OpenAI, Google, and Ollama models
- Thread management
- Workspace file system integration
- Human-in-the-loop approval for shell commands
- Subagent task tracking
- Todo list management
