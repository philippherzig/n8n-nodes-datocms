# DatoCMS n8n Custom Node

## Project Overview

This is a custom n8n node for DatoCMS integration that simplifies content management operations and provides a user-friendly interface for non-technical users.

## Key Features

### ✅ Implemented Features
- **Complete CRUD Operations** for DatoCMS records (Create, Read, Update, Delete)
- **File Upload Management** with automatic record linking
- **Dynamic Content Type Selection** via dropdown (no manual ID entry required)
- **Auto-publish functionality** for streamlined workflows
- **Item Type Management** for exploring content models
- **Robust error handling** with continue-on-fail support

### 🎯 Main Benefits
- **Simplified for Non-Techies**: No complex HTTP requests needed
- **Dynamic Field Loading**: Content types and fields populated automatically
- **Multi-Step Operations**: Complex workflows abstracted into single actions
- **Intuitive UX**: Dropdown selections instead of manual ID entry

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
- `create`: Create new content records with auto-publish option
- `get`: Retrieve single record by ID
- `getAll`: List all records filtered by content type
- `update`: Update existing records with auto-publish option
- `delete`: Remove records
- `publish`: Publish draft records
- `unpublish`: Unpublish live records

#### Upload Resource
- `create`: Upload binary files (images, documents, etc.)
- `get`: Retrieve upload information by ID
- `getAll`: List all uploads
- `delete`: Remove uploaded files

#### Item Type Resource
- `getAll`: List all available content models
- `get`: Get specific content model details

### Dynamic Features
- **loadOptions Method**: Automatically populates content type dropdowns from DatoCMS API
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
4. Fields: `{"title": "My Post", "content": "Post content"}`
5. Auto Publish: ✅

#### Uploading an Image
1. Resource: Upload
2. Operation: Create
3. Binary Property: data
4. The uploaded file can then be linked to records

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

### Development Tips
- Use the built-in credential test to verify API connectivity
- Check the n8n logs for detailed error messages
- Ensure your DatoCMS project has the required content models

## Future Enhancements

### Potential Features
- **Dynamic Field Generation**: Auto-generate form fields based on content model
- **Bulk Operations**: Handle multiple records in single operation
- **Advanced Relationships**: Better handling of linked records
- **Validation**: Field validation based on DatoCMS model constraints
- **Localization**: Support for multi-language content

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