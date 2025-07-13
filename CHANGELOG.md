# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2025-04-13

### Documentation
- Added Block Create operation to README
- Added early development notice warning users about potential issues
- Clarified that complete block objects should be used in modular content fields
- Added link to GitHub issues for bug reporting

## [1.1.0] - 2025-04-13

### Added
- **Block Create Operation**: New operation to create modular content blocks
  - Dynamic block type selection from available modular blocks
  - Full ResourceMapper support for block fields
  - Automatic field validation and type conversion
  - Supports all DatoCMS block field types

### Enhanced
- **JSON Checkbox Group Field Handling**: Improved support for JSON fields with checkbox group editor
  - Automatic array-to-string conversion (no more manual `.toJsonString()` needed!)
  - Direct array input support: `["Mo", "Fr", "Sa"]` works automatically
  - DatoCMS-compatible formatting with pretty-printed JSON
  - Consistent handling across all operations (Create, Update, Upsert, Block Create)
  - Single values automatically converted to arrays

### Fixed
- JSON checkbox field formatting now matches DatoCMS format exactly for better compatibility
- Consistent field parsing across all record operations

## [1.0.1] - Previous Release

### Features
- Complete CRUD operations for DatoCMS records
- File upload management with automatic record linking
- Dynamic content type and field selection
- ResourceMapper integration for visual field mapping
- Auto-publish functionality
- Advanced filtering for Get Many operations
- Bulk upload from URLs with asset reference replacement
- Upsert operation with business field matching
- Item Type management
- Robust error handling with continue-on-fail support