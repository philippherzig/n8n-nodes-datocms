# Coding Standards

## TypeScript Standards

### Code Style
- Use TypeScript strict mode
- Follow ESLint configuration defined in `.eslintrc.js`
- Use Prettier for code formatting (configuration in `.prettierrc.js`)
- Prefer explicit types over `any`
- Use meaningful variable and function names

### File Organization
```
nodes/
├── DatoCms/
│   ├── DatoCms.node.ts     # Main node implementation
│   └── datocms.svg         # Node icon
credentials/
└── DatoCmsApi.credentials.ts # Credential definition
```

### Import Standards
- Import n8n types from `n8n-workflow`
- Import DatoCMS client from `@datocms/cma-client-node`
- Group imports: external libraries first, then internal modules
- Use named imports when possible

## n8n Node Development Standards

### Node Structure
- Implement `INodeType` interface
- Define comprehensive `INodeTypeDescription`
- Use proper node versioning
- Include appropriate node metadata (displayName, description, etc.)

### Parameter Definitions
- Use `resourceLocator` for entity selection (Item Types, Block Types, etc.)
- Implement `resourceMapper` for field mapping
- Use `fixedCollection` for complex parameter groups
- Provide clear descriptions and placeholders
- Use `displayOptions` to show/hide parameters contextually

### Method Implementation
- Implement `listSearch` methods for dynamic option loading
- Implement `loadOptions` methods for parameter options
- Use `resourceMapper` methods for field schema loading
- Handle errors gracefully with meaningful messages

### Error Handling
- Use `NodeOperationError` for user-facing errors
- Provide context-specific error messages
- Include API error details when helpful
- Implement graceful degradation where possible

## DatoCMS Integration Standards

### Client Configuration
- Use `buildClient` from `@datocms/cma-client-node`
- Configure with user credentials (apiToken, environment)
- Set appropriate log level for debugging
- Handle authentication errors gracefully

### API Patterns
- Use async/await for API calls
- Implement proper pagination for list operations
- Handle rate limiting appropriately
- Cache schema information when possible

### Data Transformation
- Transform DatoCMS responses to n8n-friendly format
- Handle localized content appropriately
- Support nested data structures
- Maintain data type consistency

## Testing Standards

### Unit Testing
- Test all major functionality
- Mock external API calls
- Test error conditions
- Validate parameter handling

### Integration Testing
- Test with real DatoCMS instances when possible
- Validate API integration
- Test credential handling
- Verify data transformation accuracy

## Build and Deployment

### Build Process
- Use TypeScript compiler (`tsc`)
- Copy assets with Gulp (`gulp build:icons`)
- Clean dist directory before build
- Validate with ESLint before publishing

### Package Structure
- Main entry: `index.js`
- Include only `dist/` in published package
- Maintain proper package.json metadata
- Follow n8n community node conventions

### Version Management
- Follow semantic versioning
- Update CHANGELOG.md for releases
- Tag releases in Git
- Coordinate with npm publishing
