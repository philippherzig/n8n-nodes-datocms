---
inclusion: fileMatch
fileMatchPattern: "nodes/**/*.ts"
---

# n8n Integration Guidelines

## Node Development Standards

### Node Type Implementation
All nodes must implement the `INodeType` interface with proper configuration:

```typescript
export class DatoCms implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'DatoCMS',
    name: 'datoCms',
    icon: { light: 'file:datocms.svg', dark: 'file:datocms.svg' },
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Interact with DatoCMS API',
    defaults: { name: 'DatoCMS' },
    inputs: [NodeConnectionType.Main],
    outputs: [NodeConnectionType.Main],
    credentials: [{ name: 'datoCmsApi', required: true }],
    properties: [/* parameter definitions */]
  };
}
```

### Parameter Definition Patterns

#### Resource Locator Pattern
Use for entity selection with both dropdown and manual ID input:
```typescript
{
  displayName: 'Item Type',
  name: 'itemType',
  type: 'resourceLocator',
  default: { mode: 'list', value: '' },
  required: true,
  modes: [
    {
      displayName: 'From List',
      name: 'list',
      type: 'list',
      typeOptions: {
        searchListMethod: 'searchItemTypes',
        searchable: true,
      },
    },
    {
      displayName: 'By ID',
      name: 'id',
      type: 'string',
      placeholder: 'e.g., JTmoQFnWTnKr8Dr96Fem3w',
    },
  ],
}
```

#### Resource Mapper Pattern
Use for field mapping with schema validation:
```typescript
{
  displayName: 'Fields',
  name: 'fields',
  type: 'resourceMapper',
  default: { mappingMode: 'defineBelow', value: null },
  typeOptions: {
    resourceMapper: {
      resourceMapperMethod: 'getModelFields',
      mode: 'add', // or 'upsert'
      valuesLabel: 'Fields',
      addAllFields: true,
      multiKeyMatch: false, // true for upsert
    },
  },
}
```

#### Fixed Collection Pattern
Use for complex parameter groups:
```typescript
{
  displayName: 'Filters',
  name: 'filters',
  type: 'fixedCollection',
  placeholder: 'Add Filter',
  default: {},
  typeOptions: { multipleValues: true },
  options: [{
    name: 'filter',
    displayName: 'Filter',
    values: [/* filter parameter definitions */]
  }],
}
```

### Method Implementation Requirements

#### List Search Methods
Implement for searchable dropdowns:
```typescript
methods = {
  listSearch: {
    async searchItemTypes(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult> {
      const credentials = await this.getCredentials('datoCmsApi');
      const client = buildClient({
        apiToken: credentials.apiToken as string,
        environment: credentials.environment as string,
      });

      const itemTypes = await client.itemTypes.list();
      const results = itemTypes
        .filter((itemType) => !filter || itemType.name.toLowerCase().includes(filter.toLowerCase()))
        .map((itemType) => ({
          name: itemType.name,
          value: itemType.id,
        }));

      return { results };
    }
  }
};
```

#### Load Options Methods
Implement for parameter options:
```typescript
loadOptions: {
  async getFilterableFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    // Implementation for loading field options
    return options;
  }
}
```

#### Resource Mapper Methods
Implement for field schema loading:
```typescript
resourceMapping: {
  async getModelFields(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
    // Implementation for loading field schemas
    return { fields };
  }
}
```

## Data Handling Standards

### Input Processing
```typescript
async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
  const items = this.getInputData();
  const resource = this.getNodeParameter('resource', 0) as string;
  const operation = this.getNodeParameter('operation', 0) as string;
  
  const returnData: INodeExecutionData[] = [];
  
  for (let i = 0; i < items.length; i++) {
    try {
      // Process each item
      const result = await processItem(this, i);
      returnData.push({ json: result });
    } catch (error) {
      if (this.continueOnFail()) {
        returnData.push({ json: { error: error.message } });
        continue;
      }
      throw error;
    }
  }
  
  return [returnData];
}
```

### Parameter Extraction Patterns
```typescript
// Resource Locator Value Extraction
const itemTypeParam = this.getNodeParameter('itemType', i) as any;
const itemTypeId = typeof itemTypeParam === 'object' ? itemTypeParam.value : itemTypeParam;

// Resource Mapper Field Processing
const fieldMappings = this.getNodeParameter('fields', i) as ResourceMapperFields;
const processedFields = processResourceMapperFields(fieldMappings, items[i].json);

// Fixed Collection Processing
const filters = this.getNodeParameter('filters', i) as IDataObject;
const filterArray = (filters.filter as IDataObject[]) || [];
```

### Output Formatting
```typescript
// Standard Success Response
const result = {
  id: record.id,
  ...record.attributes,
  _meta: {
    operation: 'create',
    itemType: itemTypeId,
    timestamp: new Date().toISOString()
  }
};

// Bulk Operation Response
const bulkResult = {
  summary: {
    total: urls.length,
    successful: successfulUploads.length,
    failed: failedUploads.length,
    skipped: skippedUploads.length
  },
  uploads: successfulUploads,
  errors: failedUploads,
  originalData: includeOriginalData ? items[i].json : undefined
};
```

## Error Handling Standards

### Error Types and Handling
```typescript
try {
  // API operation
} catch (error) {
  // Handle specific error types
  if (error.message?.includes('INSUFFICIENT_PERMISSIONS')) {
    throw new NodeOperationError(
      this.getNode(), 
      `Insufficient permissions: ${error.message}`,
      { itemIndex: i }
    );
  }
  
  if (error.message?.includes('RATE_LIMIT')) {
    throw new NodeOperationError(
      this.getNode(), 
      `Rate limit exceeded. Please try again later.`,
      { itemIndex: i }
    );
  }
  
  throw new NodeOperationError(
    this.getNode(), 
    `Operation failed: ${error.message}`,
    { itemIndex: i }
  );
}
```

### Graceful Degradation
```typescript
// Example: Upload collections with graceful fallback
try {
  const uploadCollections = await client.uploadCollections.list();
  return uploadCollections.map(collection => ({
    name: collection.label,
    value: collection.id,
  }));
} catch (error) {
  if (error.message?.includes('INSUFFICIENT_PERMISSIONS')) {
    return [{ name: '(None - Upload Collections Not Accessible)', value: '' }];
  }
  throw error;
}
```

## Performance Optimization

### Caching Strategies
- Cache schema information during parameter loading
- Reuse API client instances within execution context
- Implement request deduplication for repeated calls

### Batch Processing
```typescript
// Bulk operations with concurrency control
const concurrentUploads = this.getNodeParameter('concurrentUploads', i) as number;
const uploadPromises = urls.map(url => () => uploadFile(url));
const results = await executeWithConcurrency(uploadPromises, concurrentUploads);
```

### Memory Management
```typescript
// Temporary file cleanup
const tempFilePath = join(tmpdir(), `n8n-datocms-${Date.now()}`);
try {
  writeFileSync(tempFilePath, binaryData.data, 'base64');
  const result = await client.uploads.create({ path: tempFilePath });
  return result;
} finally {
  try {
    unlinkSync(tempFilePath);
  } catch (cleanupError) {
    // Log cleanup error but don't fail the operation
  }
}
```

## UI/UX Guidelines

### Parameter Organization
- Group related parameters logically
- Use `displayOptions` to show/hide parameters contextually
- Provide clear descriptions and examples
- Use appropriate input types for data

### User Feedback
- Provide meaningful error messages
- Include operation progress for bulk operations
- Show validation feedback immediately
- Use consistent terminology throughout

### Accessibility
- Provide descriptive labels for all parameters
- Include helpful placeholder text
- Use semantic parameter types
- Support keyboard navigation

## Testing Integration

### Parameter Testing
```typescript
// Test parameter visibility logic
describe('Parameter Display Options', () => {
  it('should show item type parameter for record operations', () => {
    const node = new DatoCms();
    const itemTypeParam = node.description.properties.find(p => p.name === 'itemType');
    expect(itemTypeParam.displayOptions.show.resource).toContain('record');
  });
});
```

### Method Testing
```typescript
// Test list search methods
describe('List Search Methods', () => {
  it('should return filtered item types', async () => {
    const mockThis = createMockLoadOptionsFunctions();
    const result = await node.methods.listSearch.searchItemTypes.call(mockThis, 'blog');
    expect(result.results).toHaveLength(1);
    expect(result.results[0].name).toContain('blog');
  });
});
```

### Execution Testing
```typescript
// Test node execution
describe('Node Execution', () => {
  it('should create record successfully', async () => {
    const mockThis = createMockExecuteFunctions();
    const result = await node.execute.call(mockThis);
    expect(result[0]).toHaveLength(1);
    expect(result[0][0].json).toHaveProperty('id');
  });
});
```
