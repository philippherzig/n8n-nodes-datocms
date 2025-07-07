# Testing loadOptionsDependsOn with Resource Locators

## Issue
The "Field to Match On" dropdown was not loading options when the Item Type was selected via a resource locator field.

## Root Cause
The `getMatchableFields` method was trying to access the itemType parameter with an index (`getNodeParameter('itemType', 0)`), which is the pattern used in execute methods but not in loadOptions methods.

## Solution
1. Changed `getNodeParameter('itemType', 0)` to `getNodeParameter('itemType')` to match the pattern used in other loadOptions methods like `getModelFields`
2. Added a try-catch block around the `getNodeParameter` call to gracefully handle cases where the parameter isn't available yet
3. The method now returns an empty array when:
   - The itemType parameter cannot be retrieved
   - The itemType value is empty or undefined
   - Any error occurs during field retrieval

## Pattern for loadOptions methods with resource locators:
```typescript
async loadOptionsMethod(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    try {
        let param: any;
        try {
            param = this.getNodeParameter('paramName');
        } catch (error) {
            // Parameter not available yet
            return [];
        }
        
        // Handle resource locator format
        let value: string = '';
        if (typeof param === 'string') {
            value = param;
        } else if (param && typeof param === 'object') {
            value = param.value || '';
        }
        
        if (!value) {
            return [];
        }
        
        // Load options based on value
        // ...
    } catch (error) {
        console.warn('Failed to load options:', error.message);
        return [];
    }
}
```

## Testing Steps
1. In the DatoCMS node, select "Record" resource and "Upsert" operation
2. Select an Item Type from the dropdown
3. The "Field to Match On" dropdown should now populate with matchable fields (unique fields, IDs, string/slug/integer fields)
4. Changing the Item Type should update the available fields in the "Field to Match On" dropdown