# DatoCMS n8n Custom Node

## Project Overview

This is a custom n8n node for DatoCMS integration that simplifies content management operations and provides a user-friendly interface for non-technical users.

## Key Features

### ✅ Implemented Features
- **Complete CRUD Operations** for DatoCMS records (Create, Read, Update, Delete)
- **File Upload Management** with automatic record linking
- **Dynamic Content Type Selection** via dropdown (no manual ID entry required)
- **Dynamic Field Mapping** via ResourceMapper (no JSON required for most fields)
- **Enhanced Field Validation & Display**:
  - **Required Fields**: Automatically protected from removal in UI
  - **Unique Fields**: Marked with "(Unique)" indicator
  - **Localized Fields**: Marked with "(Localized)" indicator
  - **Field Ordering**: Matches DatoCMS schema order
  - **Enhanced Field Types**: URL fields get automatic validation
  - **Enum Field Support**: Dropdown options for predefined values
- **Auto-publish functionality** for streamlined workflows
- **Item Type Management** for exploring content models
- **Robust error handling** with continue-on-fail support

### 🎯 Main Benefits
- **Simplified for Non-Techies**: No complex HTTP requests needed
- **Dynamic Field Loading**: Content types and fields populated automatically
- **ResourceMapper Integration**: Visual field mapping interface eliminates JSON complexity
- **Smart Field Handling**: 
  - Required fields automatically protected from removal
  - Unique and localized fields clearly marked
  - Proper field ordering matching DatoCMS schema
  - Enhanced validation based on DatoCMS field types
- **Multi-Step Operations**: Complex workflows abstracted into single actions
- **Intuitive UX**: Dropdown selections instead of manual ID entry
- **Proper Array Handling**: GetAll operations return each item as separate n8n workflow items
- **Flexible Pagination**: Support for both "Return All" and limited results with configurable limits
  - **Records**: Up to 500 items per request, uses efficient DatoCMS pagination
  - **Uploads**: Up to 50 items per request, uses efficient DatoCMS pagination  
  - **Item Types**: Client-side pagination (API doesn't support server-side pagination)

## Project Structure

```
n8n-nodes-datocms/
├── credentials/
│   └── DatoCmsApi.credentials.ts     # API authentication
├── nodes/
│   └── DatoCms/
│       ├── DatoCms.node.ts          # Main node implementation
│       └── datocms.svg              # Node icon
├── package.json                      # Dependencies & config
└── CLAUDE.md                        # This file
```

## Technical Implementation

### Dependencies
- **@datocms/cma-client-node**: Official DatoCMS TypeScript SDK
- **n8n-workflow**: n8n node development framework

### Resources & Operations

#### Records Resource
- `create`: Create new content records with ResourceMapper field interface and auto-publish option
- `get`: Retrieve single record by ID
- `getAll`: List all records filtered by content type
- `update`: Update existing records with ResourceMapper field interface and auto-publish option
- `delete`: Remove records
- `publish`: Publish draft records
- `unpublish`: Unpublish live records

#### Upload Resource
- `create`: Upload files from binary data or remote URLs (images, documents, etc.) with optional collection assignment
- `get`: Retrieve upload information by ID
- `getAll`: List all uploads with optional collection filtering
- `delete`: Remove uploaded files

#### Item Type Resource
- `getAll`: List all available content models
- `get`: Get specific content model details

### Dynamic Features
- **loadOptions Method**: Automatically populates content type dropdowns from DatoCMS API
- **ResourceMapper Integration**: Automatically loads field schemas for visual mapping
- **Localization Detection**: Automatically detects and marks localized fields
- **Environment Support**: Works with DatoCMS environments (main, sandbox, etc.)
- **Binary Data Handling**: Supports file uploads through n8n's binary data system

## Development Commands

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Development with watch mode
npm run dev

# Lint code
npm run lint

# Format code
npm run format
```

### Development Workflow

When making changes to the node:

1. **Make your code changes** in TypeScript files
2. **Build the project**: `npm run build` (required for changes to take effect)
3. **Restart n8n**: Stop (Ctrl+C) and restart `npx n8n` 
4. **Test changes** in n8n interface
5. **Commit changes**: `git add` and `git commit`

**Important**: Always rebuild after code changes, as n8n loads the compiled JavaScript from the `dist/` directory, not the TypeScript source files.

## Local Testing

See [TESTING.md](./TESTING.md) for detailed instructions on testing the node locally during development.

**Quick Setup:**
```bash
# Build and link for testing
npm run build
mkdir -p ~/.n8n/nodes
cd ~/.n8n/nodes && npm link /absolute/path/to/n8n-nodes-datocms
npx n8n
```

The node will appear as "datocms" (not "n8n-nodes-datocms") in the n8n interface.

## Usage in n8n

1. **Install the node** in your n8n instance
2. **Configure credentials** with your DatoCMS API token
3. **Select resource type** (Record, Upload, Item Type)
4. **Choose operation** based on what you want to do
5. **Configure parameters** using the dynamic dropdowns

### Example Workflows

#### Creating a Blog Post
1. Resource: Record
2. Operation: Create
3. Item Type: [Select from dropdown]
4. Fields: Use ResourceMapper to map fields visually:
   - Regular fields: Enter values directly
   - Localized fields: Use JSON format like `{"en": "My Post", "de": "Mein Beitrag"}`
5. Auto Publish: ✅

#### Uploading an Image
**From Binary Data:**
1. Resource: Upload
2. Operation: Create
3. Upload Source: Binary Data
4. Binary Property: data
5. The uploaded file can then be linked to records

**From URL:**
1. Resource: Upload
2. Operation: Create
3. Upload Source: URL
4. File URL: https://example.com/image.jpg
5. Skip Creation If Already Exists: ✅ (default)
6. Upload Collection: [Optional: Select from dropdown]
7. The uploaded file can then be linked to records

#### Filtering Uploads by Collection
1. Resource: Upload
2. Operation: Get All
3. Return All: ✅ (or set limit)
4. Filter by Collection: [Optional: Select specific collection]
5. Returns only uploads from the selected collection

#### Working with Special Field Types

**Localized Fields (Multi-language content):**
1. **Field Detection**: Localized fields are automatically detected and marked with "(Localized)" in the field name
2. **JSON Format**: Use JSON format to provide content for each locale:
   ```json
   {
     "en": "English content",
     "de": "German content", 
     "it": "Italian content"
   }
   ```
3. **Auto-parsing**: The node automatically converts JSON strings to the correct DatoCMS format

**Required Fields:**
- Automatically detected and protected from removal in the ResourceMapper UI
- Cannot be accidentally deleted from field mapping

**Unique Fields:**
- Marked with "(Unique)" indicator to show they must have unique values
- Helps prevent duplicate content errors

**URL Fields:**
- Automatically validated with n8n's URL field type
- Prevents invalid URL formats from being submitted

**Enum Fields:**
- Display dropdown options with predefined values when supported
- Limits input to valid choices defined in DatoCMS schema

## Configuration

### Credentials Setup
- **API Token**: Your DatoCMS management API token
- **Environment**: Target environment (default: "main")
- **Base URL**: DatoCMS API endpoint (default: "https://site-api.datocms.com")

### Environment Variables
Set these in your DatoCMS project:
- `DATOCMS_API_TOKEN`: Your API token
- `DATOCMS_ENVIRONMENT`: Target environment (optional)

## Troubleshooting

### Common Issues
1. **"Failed to load item types"**: Check API token permissions
2. **Upload errors**: Ensure binary data is properly formatted
3. **Publishing failures**: Verify record exists and is in draft state
4. **GetAll operations showing as single item**: Ensure you've rebuilt after code changes and restarted n8n

### Development Tips
- Use the built-in credential test to verify API connectivity
- Check the n8n logs for detailed error messages
- Ensure your DatoCMS project has the required content models
- Always rebuild (`npm run build`) after making code changes
- Restart n8n completely after rebuilding to load new changes

## Future Enhancements

### Potential Features
- **Advanced Field Types**: Better support for complex field types (structured text, modular content)
- **Bulk Operations**: Handle multiple records in single operation
- **Advanced Relationships**: Better handling of linked records
- **Enhanced Validation**: Field validation based on DatoCMS model constraints
- **Localization UI**: Visual interface for localized content (beyond JSON)

### Performance Optimizations
- **Caching**: Cache content type metadata
- **Batching**: Batch multiple API calls
- **Pagination**: Handle large datasets efficiently

## Contributing

When making changes:
1. Follow existing TypeScript patterns
2. Update this documentation
3. Test with real DatoCMS project
4. Ensure build passes: `npm run build`
5. Check linting: `npm run lint`

## License

MIT License - See LICENSE.md for details