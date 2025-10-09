# DatoCMS Integration Guidelines

## API Client Configuration

### Client Setup Pattern
```typescript
const client = buildClient({
  apiToken: credentials.apiToken as string,
  environment: credentials.environment as string,
  logLevel: LogLevel.BODY,
});
```

### Credential Requirements
- **API Token**: DatoCMS management API token with appropriate permissions
- **Environment**: Target environment (default: 'main')
- **Base URL**: API endpoint (default: 'https://site-api.datocms.com')

## Resource Management

### Item Types (Content Models)
- **Discovery**: Use `client.itemTypes.list()` for schema discovery
- **Filtering**: Support filtering by modular_block for block types
- **Caching**: Cache item type information for performance
- **Validation**: Validate item type existence before operations

### Fields and Schema
- **Field Loading**: Use `client.fields.list(itemTypeId)` for field schemas
- **Field Types**: Support all DatoCMS field types
- **Localization**: Handle localized fields appropriately
- **Validation**: Implement field validation based on schema

### Records (Content Items)
- **CRUD Operations**: Support Create, Read, Update, Delete
- **Publishing**: Support publish/unpublish operations
- **Filtering**: Advanced filtering with multiple operators
- **Bulk Operations**: Support bulk delete operations
- **Upsert Logic**: Implement create-or-update functionality

### Uploads (Assets)
- **Single Upload**: Support binary data and URL uploads
- **Bulk Upload**: Process multiple uploads with concurrency control
- **Collections**: Support upload collection organization
- **Deduplication**: Skip uploads for existing files when requested

### Blocks (Modular Content)
- **Block Creation**: Support creating modular content blocks
- **Type Discovery**: Filter item types for block-compatible types
- **Field Mapping**: Use ResourceMapper for block field configuration

## Data Transformation Patterns

### Input Processing
```typescript
// Resource Locator Value Extraction
const itemTypeId = typeof itemTypeParam === 'object' 
  ? itemTypeParam.value 
  : itemTypeParam;

// Field Mapping Processing
const fieldMappings = this.getNodeParameter('fields') as ResourceMapperFields;
const processedData = processFieldMappings(fieldMappings, inputData);
```

### Output Formatting
- **Consistent Structure**: Maintain consistent output structure across operations
- **Metadata Inclusion**: Include operation metadata when relevant
- **Error Context**: Provide detailed error context
- **Bulk Statistics**: Include statistics for bulk operations

### Nested Data Handling
- **Reference Resolution**: Support nested data for related records
- **Relationship Mapping**: Handle record relationships appropriately
- **Circular Reference Prevention**: Prevent infinite loops in nested data

## Error Handling Strategies

### API Error Mapping
```typescript
try {
  // API operation
} catch (error) {
  if (error.message?.includes('INSUFFICIENT_PERMISSIONS')) {
    // Handle permission errors gracefully
    return fallbackResponse;
  }
  throw new NodeOperationError(this.getNode(), `Operation failed: ${error.message}`);
}
```

### Graceful Degradation
- **Permission Errors**: Provide limited functionality when permissions are insufficient
- **Network Errors**: Implement retry logic for transient failures
- **Schema Errors**: Continue with available schema information
- **Validation Errors**: Provide clear validation error messages

### User-Friendly Messages
- **Context-Specific**: Provide operation-specific error messages
- **Actionable**: Include suggestions for resolving errors
- **Detailed**: Include relevant technical details without overwhelming users
- **Localized**: Consider localization for error messages

## Performance Optimization

### Caching Strategies
- **Schema Caching**: Cache item type and field schemas
- **Option Caching**: Cache dropdown options for performance
- **Client Reuse**: Reuse API client instances when possible
- **Response Caching**: Cache frequently accessed data

### Batch Processing
- **Bulk Operations**: Group operations for efficiency
- **Concurrency Control**: Limit concurrent operations to prevent rate limiting
- **Progress Tracking**: Provide progress information for long operations
- **Memory Management**: Handle large datasets efficiently

### Rate Limiting
- **Respect Limits**: Honor DatoCMS API rate limits
- **Backoff Strategy**: Implement exponential backoff for rate limit errors
- **Queue Management**: Queue operations when rate limited
- **Monitoring**: Monitor API usage patterns

## Field Type Support

### Basic Field Types
- **String**: Single-line and multi-line text
- **Integer/Float**: Numeric values with validation
- **Boolean**: True/false values
- **Date/DateTime**: Date and timestamp values
- **JSON**: Structured data objects

### Advanced Field Types
- **File/Image**: Asset references with upload support
- **Link**: References to other records
- **Links**: Multiple record references
- **Modular Content**: Complex structured content
- **Structured Text**: Rich text with embedded content

### Localized Fields
- **Multi-language Support**: Handle localized content appropriately
- **Locale Detection**: Detect and handle multiple locales
- **Fallback Logic**: Implement locale fallback strategies
- **Validation**: Validate localized content requirements

## Testing Integration

### API Testing
- **Mock Responses**: Mock DatoCMS API responses for testing
- **Error Scenarios**: Test various error conditions
- **Rate Limiting**: Test rate limiting behavior
- **Authentication**: Test credential validation

### Schema Testing
- **Field Discovery**: Test field schema loading
- **Type Validation**: Test field type handling
- **Localization**: Test localized field handling
- **Edge Cases**: Test schema edge cases

### Data Transformation Testing
- **Input Processing**: Test input data transformation
- **Output Formatting**: Test output data formatting
- **Error Handling**: Test error transformation
- **Bulk Operations**: Test bulk operation handling
