# Architecture Principles

## Overall Architecture

### Node-Based Architecture
- Single main node (`DatoCms`) handling multiple resources
- Resource-based operation organization (Record, Upload, Item Type, Block)
- Operation-specific parameter sets with conditional display
- Unified credential management

### Separation of Concerns
- **Node Definition**: Parameter definitions and UI configuration
- **Method Implementation**: Dynamic option loading and field mapping
- **Execution Logic**: API calls and data transformation
- **Error Handling**: Centralized error management

## Design Patterns

### Resource Locator Pattern
Used for entity selection (Item Types, Block Types, Upload Collections):
```typescript
{
  displayName: 'Item Type',
  name: 'itemType',
  type: 'resourceLocator',
  modes: [
    { name: 'list', type: 'list' },    // Dropdown selection
    { name: 'id', type: 'string' }     // Manual ID input
  ]
}
```

### Resource Mapper Pattern
Used for field mapping with schema validation:
```typescript
{
  displayName: 'Fields',
  name: 'fields',
  type: 'resourceMapper',
  typeOptions: {
    resourceMapper: {
      resourceMapperMethod: 'getModelFields',
      mode: 'add|upsert',
      addAllFields: true
    }
  }
}
```

### Dynamic Parameter Loading
- `listSearch` methods for searchable dropdowns
- `loadOptions` methods for parameter options
- Context-aware parameter visibility with `displayOptions`

## Data Flow Architecture

### Input Processing
1. **Parameter Validation**: Validate user inputs and resource selections
2. **Schema Loading**: Dynamically load field schemas from DatoCMS
3. **Field Mapping**: Transform user field mappings to API format
4. **Data Preparation**: Prepare data for API calls

### API Integration
1. **Client Initialization**: Configure DatoCMS client with credentials
2. **API Calls**: Execute operations with proper error handling
3. **Response Processing**: Transform API responses to n8n format
4. **Result Formatting**: Format results for workflow consumption

### Output Generation
1. **Data Transformation**: Convert API responses to workflow data
2. **Metadata Inclusion**: Add operation metadata when relevant
3. **Error Context**: Provide meaningful error information
4. **Bulk Operation Stats**: Include statistics for bulk operations

## Scalability Principles

### Performance Optimization
- **Lazy Loading**: Load schemas and options only when needed
- **Caching**: Cache frequently accessed schema information
- **Batch Operations**: Support bulk operations for efficiency
- **Concurrent Processing**: Use controlled concurrency for bulk uploads

### Memory Management
- **Stream Processing**: Use streams for large file operations
- **Temporary Files**: Clean up temporary files after use
- **Resource Cleanup**: Properly dispose of resources

### Error Resilience
- **Graceful Degradation**: Continue operation when non-critical features fail
- **Retry Logic**: Implement retry for transient failures
- **Circuit Breaker**: Prevent cascade failures
- **Fallback Options**: Provide alternatives when primary methods fail

## Integration Patterns

### n8n Integration
- **Workflow Compatibility**: Ensure seamless integration with n8n workflows
- **Data Format Consistency**: Maintain consistent data formats across operations
- **Expression Support**: Support n8n expressions in parameters
- **Binary Data Handling**: Proper handling of binary data in workflows

### DatoCMS Integration
- **API Version Compatibility**: Use stable API versions
- **Feature Coverage**: Support all relevant DatoCMS features
- **Schema Synchronization**: Keep field schemas in sync with DatoCMS
- **Environment Support**: Support multiple DatoCMS environments

### External System Integration
- **URL Processing**: Handle external URLs for uploads
- **File Format Support**: Support various file formats
- **Webhook Compatibility**: Prepare for webhook integration
- **Third-party Service Integration**: Enable integration with other services

## Security Principles

### Credential Management
- **Secure Storage**: Use n8n's credential system
- **Token Validation**: Validate API tokens before use
- **Environment Isolation**: Support environment-specific credentials
- **Permission Checking**: Validate permissions before operations

### Data Protection
- **Input Sanitization**: Sanitize user inputs
- **Output Filtering**: Filter sensitive data from outputs
- **Temporary File Security**: Secure handling of temporary files
- **Error Information**: Avoid exposing sensitive information in errors

### API Security
- **Rate Limiting**: Respect API rate limits
- **Request Validation**: Validate requests before sending
- **Response Validation**: Validate API responses
- **Secure Communication**: Use HTTPS for all API communication
