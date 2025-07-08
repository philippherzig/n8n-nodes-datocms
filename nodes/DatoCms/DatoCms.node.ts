import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	INodeListSearchResult,
	NodeConnectionType,
	NodeOperationError,
	ResourceMapperFields,
	FieldType,
} from 'n8n-workflow';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { buildClient } from '@datocms/cma-client-node';

export class DatoCms implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'DatoCMS',
		name: 'datoCms',
		icon: { light: 'file:datocms.svg', dark: 'file:datocms.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with DatoCMS API',
		defaults: {
			name: 'DatoCMS',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'datoCmsApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Record',
						value: 'record',
					},
					{
						name: 'Upload',
						value: 'upload',
					},
					{
						name: 'Item Type',
						value: 'itemType',
					},
				],
				default: 'record',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['record'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new record',
						action: 'Create a record',
					},
					{
						name: 'Create or Update',
						value: 'upsert',
						description: 'Create a new record, or update the current one if it already exists (upsert)',
						action: 'Record upsert',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a record',
						action: 'Delete a record',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a record',
						action: 'Get a record',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many records',
						action: 'Get many records',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a record',
						action: 'Update a record',
					},
					{
						name: 'Publish',
						value: 'publish',
						description: 'Publish a record',
						action: 'Publish a record',
					},
					{
						name: 'Unpublish',
						value: 'unpublish',
						description: 'Unpublish a record',
						action: 'Unpublish a record',
					},
				],
				default: 'create',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['upload'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Upload a file',
						action: 'Create an upload',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get an upload',
						action: 'Get an upload',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many uploads',
						action: 'Get many uploads',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete an upload',
						action: 'Delete an upload',
					},
				],
				default: 'create',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['itemType'],
					},
				},
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many item types',
						action: 'Get many item types',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get an item type',
						action: 'Get an item type',
					},
				],
				default: 'getAll',
			},
			// Item Type selection for record operations
			{
				displayName: 'Item Type',
				name: 'itemType',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				required: true,
				displayOptions: {
					show: {
						resource: ['record'],
						operation: ['create', 'getAll', 'update', 'upsert', 'delete', 'publish', 'unpublish'],
					},
				},
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						placeholder: 'Select an item type...',
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
				description: 'The item type to work with',
			},
			// Record ID field
			{
				displayName: 'Record ID',
				name: 'recordId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['record'],
						operation: ['get', 'update', 'delete', 'publish', 'unpublish'],
					},
				},
				default: '',
				required: true,
				description: 'The ID of the record',
			},
			// Fields for record creation
			{
				displayName: 'Fields',
				name: 'fields',
				type: 'resourceMapper',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['record'],
						operation: ['create'],
					},
				},
				default: {
					mappingMode: 'defineBelow',
					value: null,
				},
				typeOptions: {
					resourceMapper: {
						resourceMapperMethod: 'getModelFields',
						mode: 'add',
						valuesLabel: 'Fields',
						addAllFields: true,
						multiKeyMatch: false,
					},
				},
				description: 'Fields to set for the new record',
			},
			// Fields for record update
			{
				displayName: 'Fields',
				name: 'fields',
				type: 'resourceMapper',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['record'],
						operation: ['update'],
					},
				},
				default: {
					mappingMode: 'defineBelow',
					value: null,
				},
				typeOptions: {
					resourceMapper: {
						resourceMapperMethod: 'getModelFields',
						mode: 'add',
						valuesLabel: 'Fields',
						addAllFields: true,
						multiKeyMatch: false,
					},
				},
				description: 'Fields to update in the record',
			},
			// Upload fields
			{
				displayName: 'Upload Source',
				name: 'uploadSource',
				type: 'options',
				options: [
					{
						name: 'Binary Data',
						value: 'binary',
						description: 'Upload from binary data in workflow',
					},
					{
						name: 'URL',
						value: 'url',
						description: 'Upload from remote URL',
					},
				],
				displayOptions: {
					show: {
						resource: ['upload'],
						operation: ['create'],
					},
				},
				default: 'binary',
				required: true,
				description: 'Source for the file upload',
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['upload'],
						operation: ['create'],
						uploadSource: ['binary'],
					},
				},
				default: 'data',
				required: true,
				description: 'Name of the binary property to upload',
			},
			{
				displayName: 'File URL',
				name: 'fileUrl',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['upload'],
						operation: ['create'],
						uploadSource: ['url'],
					},
				},
				default: '',
				required: true,
				description: 'URL of the file to upload',
				placeholder: 'https://example.com/image.jpg',
			},
			{
				displayName: 'Skip Creation If Already Exists',
				name: 'skipCreationIfAlreadyExists',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['upload'],
						operation: ['create'],
					},
				},
				default: true,
				description: 'Whether to skip creating a new upload if a file with the same content already exists in DatoCMS',
			},
			{
				displayName: 'Upload Collection',
				name: 'uploadCollection',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				displayOptions: {
					show: {
						resource: ['upload'],
						operation: ['create'],
					},
				},
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						placeholder: 'Select a collection...',
						typeOptions: {
							searchListMethod: 'searchUploadCollections',
							searchable: true,
						},
					},
					{
						displayName: 'By ID',
						name: 'id',
						type: 'string',
						placeholder: 'e.g., AbC123dEf456GhI789',
					},
				],
				description: 'Optional: Upload collection to organize the upload',
			},
			{
				displayName: 'Include Other Input Fields',
				name: 'includeOtherInputFields',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['upload'],
						operation: ['create'],
					},
				},
				default: false,
				description: 'Whether to pass to the output all the input fields (along with the fields set in \'Upload\')',
			},
			{
				displayName: 'Filter by Collection',
				name: 'filterByCollection',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				displayOptions: {
					show: {
						resource: ['upload'],
						operation: ['getAll'],
					},
				},
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						placeholder: 'Select a collection...',
						typeOptions: {
							searchListMethod: 'searchUploadCollections',
							searchable: true,
						},
					},
					{
						displayName: 'By ID',
						name: 'id',
						type: 'string',
						placeholder: 'e.g., AbC123dEf456GhI789',
					},
				],
				description: 'Optional: Filter uploads by collection (client-side filtering). Note: DatoCMS API doesn\'t support server-side collection filtering.',
			},
			{
				displayName: 'Upload ID',
				name: 'uploadId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['upload'],
						operation: ['get', 'delete'],
					},
				},
				default: '',
				required: true,
				description: 'The ID of the upload',
			},
			// Additional options for Get Many records
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'fixedCollection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: {
					show: {
						resource: ['record'],
						operation: ['getAll'],
					},
				},
				description: 'Filter records by field values',
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						name: 'filter',
						displayName: 'Filter',
						values: [
							{
								displayName: 'Field',
								name: 'field',
								type: 'options',
								typeOptions: {
									loadOptionsMethod: 'getFilterableFields',
								},
								default: '',
								required: true,
								description: 'The field to filter by',
							},
							{
								displayName: 'Operator',
								name: 'operator',
								type: 'options',
								options: [
									{
										name: 'Equals',
										value: 'eq',
										description: 'Field equals value',
									},
									{
										name: 'Not Equals',
										value: 'neq',
										description: 'Field does not equal value',
									},
									{
										name: 'Greater Than',
										value: 'gt',
										description: 'Field is greater than value',
									},
									{
										name: 'Greater Than or Equal',
										value: 'gte',
										description: 'Field is greater than or equal to value',
									},
									{
										name: 'Less Than',
										value: 'lt',
										description: 'Field is less than value',
									},
									{
										name: 'Less Than or Equal',
										value: 'lte',
										description: 'Field is less than or equal to value',
									},
									{
										name: 'In',
										value: 'in',
										description: 'Field matches any of the comma-separated values',
									},
									{
										name: 'Not In',
										value: 'notIn',
										description: 'Field does not match any of the comma-separated values',
									},
									{
										name: 'Exists',
										value: 'exists',
										description: 'Field has a value (not null)',
									},
								],
								default: 'eq',
								description: 'The comparison operator',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								displayOptions: {
									hide: {
										operator: ['exists'],
									},
								},
								default: '',
								description: 'The value to compare against. For "In" and "Not In" operators, use comma-separated values.',
							},
						],
					},
				],
			},
			// Additional options
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['record', 'upload', 'itemType'],
						operation: ['getAll'],
					},
				},
				default: false,
				description: 'Whether to return all results or only up to a given limit',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['record', 'upload', 'itemType'],
						operation: ['getAll'],
						returnAll: [false],
					},
				},
				typeOptions: {
					minValue: 1,
				},
				default: 50,
				description: 'Max number of results to return',
			},
			{
				displayName: 'Fields',
				name: 'fields',
				type: 'resourceMapper',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['record'],
						operation: ['upsert'],
					},
				},
				default: {
					mappingMode: 'defineBelow',
					value: null,
				},
				typeOptions: {
					resourceMapper: {
						resourceMapperMethod: 'getModelFields',
						mode: 'upsert',
						fieldWords: {
							singular: 'field',
							plural: 'fields',
						},
						addAllFields: true,
						multiKeyMatch: true,
						supportAutoMap: true,
						matchingFieldsLabels: {
							title: 'Matching Fields',
							description: 'Fields to use for matching existing records. Usually an ID or unique field.',
							hint: 'Select the field(s) to match records on for upsert operations',
						},
					},
				},
				description: 'Fields to upsert in the record. Use matching fields to identify existing records.',
			},
			{
				displayName: 'Create If Not Found',
				name: 'createIfNotFound',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['record'],
						operation: ['upsert'],
					},
				},
				default: true,
				description: 'Whether to create a new record if no matching record is found',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						resource: ['record'],
						operation: ['create', 'update', 'upsert'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Auto Publish',
						name: 'autoPublish',
						type: 'boolean',
						default: false,
						description: 'Whether to automatically publish the record after creation/update',
					},
				],
			},
		],
	};

	methods = {
		listSearch: {
			async searchItemTypes(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult> {
				const credentials = await this.getCredentials('datoCmsApi');
				const client = buildClient({
					apiToken: credentials.apiToken as string,
					environment: credentials.environment as string,
				});

				try {
					const itemTypes = await client.itemTypes.list();
					
					const results = itemTypes
						.filter((itemType) => !filter || itemType.name.toLowerCase().includes(filter.toLowerCase()))
						.map((itemType) => ({
							name: itemType.name,
							value: itemType.id,
						}));

					return {
						results,
					};
				} catch (error) {
					throw new NodeOperationError(this.getNode(), `Failed to load item types: ${error.message}`);
				}
			},

			async searchUploadCollections(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult> {
				const credentials = await this.getCredentials('datoCmsApi');
				const client = buildClient({
					apiToken: credentials.apiToken as string,
					environment: credentials.environment as string,
				});

				try {
					const uploadCollections = await client.uploadCollections.list();
					
					// Add a "None" option as the first choice
					const results: INodePropertyOptions[] = [
						{
							name: '(None)',
							value: '',
						},
					];
					
					// Add upload collections with filter
					const filteredCollections = uploadCollections
						.filter((collection) => !filter || collection.label.toLowerCase().includes(filter.toLowerCase()))
						.map((collection) => ({
							name: collection.label,
							value: collection.id,
						}));
					
					results.push(...filteredCollections);

					return {
						results,
					};
				} catch (error) {
					// Graceful degradation: If upload collections are not accessible,
					// return only the "None" option so upload still works
					if (error.message && (error.message.includes('INSUFFICIENT_PERMISSIONS') || error.message.includes('401'))) {
						return {
							results: [
								{
									name: '(None - Upload Collections Not Accessible)',
									value: '',
								},
							],
						};
					}
					throw new NodeOperationError(this.getNode(), `Failed to load upload collections: ${error.message}`);
				}
			},
		},
		loadOptions: {
			async getFilterableFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('datoCmsApi');
				const itemTypeParam = this.getNodeParameter('itemType') as any;
				
				// Extract the value from resource locator
				let itemType = itemTypeParam?.value || itemTypeParam;
				
				// Handle resource locator structure
				if (typeof itemTypeParam === 'object' && itemTypeParam !== null) {
					itemType = itemTypeParam.value;
				}
				
				if (!itemType || itemType === '') {
					return [];
				}

				const client = buildClient({
					apiToken: credentials.apiToken as string,
					environment: credentials.environment as string,
				});

				try {
					// Get all fields for this item type
					const fields = await client.fields.list(itemType);
					
					// Sort fields by position to match DatoCMS schema order
					fields.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
					
					const options: INodePropertyOptions[] = [];
					
					// Add system fields that can be filtered
					options.push(
						{
							name: 'ID',
							value: 'id',
							description: 'Record ID',
						},
						{
							name: 'Created At',
							value: '_created_at',
							description: 'Record creation timestamp',
						},
						{
							name: 'Updated At',
							value: '_updated_at',
							description: 'Record last update timestamp',
						},
						{
							name: 'Published At',
							value: '_published_at',
							description: 'Record publication timestamp',
						},
						{
							name: 'First Published At',
							value: '_first_published_at',
							description: 'Record first publication timestamp',
						},
						{
							name: 'Status',
							value: '_status',
							description: 'Record status (draft or published)',
						},
						{
							name: 'Is Valid',
							value: '_is_valid',
							description: 'Whether the record is valid',
						},
					);
					
					// Add custom fields
					for (const field of fields) {
						// Skip fields that cannot be filtered (like modular content and structured text)
						const fieldType = field.field_type as string;
						if (fieldType === 'modular_content' || fieldType === 'structured_text') {
							continue;
						}
						
						let description = field.label;
						if (field.localized) {
							description += ' (Localized)';
						}
						if ((field.validators as any)?.unique) {
							description += ' (Unique)';
						}
						
						options.push({
							name: field.label,
							value: field.api_key,
							description: description,
						});
					}
					
					return options;
				} catch (error) {
					throw new NodeOperationError(this.getNode(), `Failed to load filterable fields: ${error.message}`);
				}
			},

			async getUploadCollections(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('datoCmsApi');
				const client = buildClient({
					apiToken: credentials.apiToken as string,
					environment: credentials.environment as string,
				});

				try {
					const uploadCollections = await client.uploadCollections.list();
					
					// Add a "None" option as the first choice
					const options: INodePropertyOptions[] = [
						{
							name: '(None)',
							value: '',
						},
					];
					
					// Add upload collections
					options.push(...uploadCollections.map((collection) => ({
						name: collection.label,
						value: collection.id,
					})));
					
					return options;
				} catch (error) {
					// Graceful degradation: If upload collections are not accessible,
					// return only the "None" option so upload still works
					if (error.message && (error.message.includes('INSUFFICIENT_PERMISSIONS') || error.message.includes('401'))) {
						return [
							{
								name: '(None - Upload Collections Not Accessible)',
								value: '',
							},
						];
					}
					throw new NodeOperationError(this.getNode(), `Failed to load upload collections: ${error.message}`);
				}
			},


			async getSiteLocales(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('datoCmsApi');
				const client = buildClient({
					apiToken: credentials.apiToken as string,
					environment: credentials.environment as string,
				});

				try {
					const site = await client.site.find();
					
					return site.locales.map((locale) => ({
						name: locale,
						value: locale,
					}));
				} catch (error) {
					throw new NodeOperationError(this.getNode(), `Failed to load site locales: ${error.message}`);
				}
			},
		},
		resourceMapping: {
			async getModelFields(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
				const credentials = await this.getCredentials('datoCmsApi');
				const itemTypeParam = this.getNodeParameter('itemType') as any;
				
				// Extract the value from resource locator
				let itemType = itemTypeParam?.value || itemTypeParam;
				
				// Handle resource locator structure
				if (typeof itemTypeParam === 'object' && itemTypeParam !== null) {
					itemType = itemTypeParam.value;
				}
				
				if (!itemType || itemType === '') {
					throw new NodeOperationError(this.getNode(), 'Please select an Item Type first');
				}

				const client = buildClient({
					apiToken: credentials.apiToken as string,
					environment: credentials.environment as string,
				});

				try {
					// Get all fields for this item type
					const fields = await client.fields.list(itemType);
					
					// Sort fields by position to match DatoCMS schema order
					fields.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
					
					const mappedFields: ResourceMapperFields = {
						fields: []
					};
					

					// Map DatoCMS field types to n8n field types
					const fieldTypeMapping: { [key: string]: FieldType } = {
						'string': 'string',
						'text': 'string',
						'slug': 'string',
						'color': 'string',
						'integer': 'number',
						'float': 'number',
						'boolean': 'boolean',
						'date': 'dateTime',
						'date_time': 'dateTime',
						'json': 'string',
						'lat_lon': 'string',
						'seo': 'string',
						'structured_text': 'string',
						'link': 'string',
						'links': 'array',
						'file': 'string',
						'gallery': 'array',
						'single_block': 'string',
						'modular_content': 'array',
					};
					

					// Track if we have any unique fields for defaultMatch
					let firstUniqueField: string | null = null;

					for (const field of fields) {
						// Skip system fields and non-editable fields
						if (field.api_key === 'id' || field.api_key === 'created_at' || field.api_key === 'updated_at') {
							continue;
						}

						let fieldType = fieldTypeMapping[field.field_type] || 'string';
						const isLocalized = field.localized === true;
						const isRequired = !!(field.validators as any)?.required;
						const isUnique = !!(field.validators as any)?.unique;
						
						// Apply enhanced field types based on DatoCMS validators
						const validators = field.validators as any;
						if (validators?.format?.predefined_pattern === 'url') {
							fieldType = 'url';
						} else if (validators?.format?.predefined_pattern === 'email') {
							fieldType = 'string'; // n8n doesn't have email type in ResourceMapper
						}
						
						// For enum fields, we could set options but ResourceMapper doesn't support it well
						let fieldOptions: any = undefined;
						if (validators?.enum?.values && Array.isArray(validators.enum.values)) {
							// Note: ResourceMapper options support is limited, but we can try
							fieldOptions = validators.enum.values.map((value: any) => ({
								name: value,
								value: value
							}));
						}
						
						// Build display name with markers for unique and localized fields
						// Note: Required fields are handled by required: true property which prevents removal
						let displayName = field.label;
						if (isUnique) {
							displayName = `${displayName} (Unique)`;
						}
						if (isLocalized) {
							displayName = `${displayName} (Localized)`;
						}
						
						// Determine if field can be used for matching
						const canBeUsedToMatch = isUnique || ['string', 'slug', 'integer'].includes(field.field_type);
						
						// Set first unique field as default match
						const isDefaultMatch = isUnique && firstUniqueField === null;
						if (isDefaultMatch) {
							firstUniqueField = field.api_key;
						}
						
						const fieldDef: any = {
							id: field.api_key,
							displayName: displayName,
							type: isLocalized ? 'string' : fieldType, // Use string type for localized fields to allow JSON input
							required: isRequired,
							defaultMatch: isDefaultMatch,
							canBeUsedToMatch: canBeUsedToMatch,
							display: true,
							removed: false,
						};
						
						// Add options for enum fields if available
						if (fieldOptions) {
							fieldDef.options = fieldOptions;
						}
						
						mappedFields.fields.push(fieldDef);
					}

					return mappedFields;
				} catch (error) {
					throw new NodeOperationError(this.getNode(), `Failed to load model fields: ${error.message}`);
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const credentials = await this.getCredentials('datoCmsApi');
				const client = buildClient({
					apiToken: credentials.apiToken as string,
					environment: credentials.environment as string,
				});

				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				let responseData;

				if (resource === 'record') {
					// Only get itemType for operations that need it
					let itemType: string | undefined;
					if (operation !== 'get') {
						const itemTypeParam = this.getNodeParameter('itemType', i) as any;
						// Extract the value from resource locator
						itemType = itemTypeParam?.value || itemTypeParam;
					}

					switch (operation) {
						case 'create':
							const createFields = this.getNodeParameter('fields', i) as any;
							const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;
							
							// Handle resourceMapper data
							let fieldData: any = {};
							if (createFields.mappingMode === 'defineBelow' && createFields.value) {
								// Convert resourceMapper format to DatoCMS format
								fieldData = { ...createFields.value };
								
								// Parse any JSON strings that might be localized fields
								for (const [key, value] of Object.entries(fieldData)) {
									// Skip helper fields
									if (key.startsWith('_') && key.includes('helper')) {
										delete fieldData[key];
										continue;
									}
									
									if (typeof value === 'string' && value.trim().startsWith('{')) {
										try {
											fieldData[key] = JSON.parse(value);
										} catch (e) {
											// If it's not valid JSON, keep it as a string
										}
									}
								}
							} else if (createFields.mappingMode === 'autoMapInputData') {
								// Auto-map from input data
								const inputData = items[i].json;
								fieldData = inputData;
							}
							
							const recordData: any = {
								item_type: { id: itemType, type: 'item_type' as const },
								...fieldData,
							};

							responseData = await client.items.create(recordData);
							
							if (additionalFields.autoPublish) {
								responseData = await client.items.publish(responseData.id);
							}
							break;

						case 'get':
							const getRecordId = this.getNodeParameter('recordId', i) as string;
							responseData = await client.items.find(getRecordId);
							break;

						case 'getAll':
							const returnAll = this.getNodeParameter('returnAll', i) as boolean;
							const limit = this.getNodeParameter('limit', i, 50) as number;
							const filters = this.getNodeParameter('filters', i, {}) as any;
							
							// Build filter object
							const filterParams: any = {
								filter: {
									type: itemType,
								},
							};
							
							// Add field filters if any
							if (filters.filter && Array.isArray(filters.filter) && filters.filter.length > 0) {
								filterParams.filter.fields = {};
								
								for (const filterItem of filters.filter) {
									const field = filterItem.field;
									const operator = filterItem.operator;
									const value = filterItem.value;
									
									// Handle different operators
									if (operator === 'exists') {
										filterParams.filter.fields[field] = { exists: true };
									} else if (operator === 'in' || operator === 'notIn') {
										// Split comma-separated values and trim whitespace
										const values = value.split(',').map((v: string) => v.trim());
										filterParams.filter.fields[field] = { [operator]: values };
									} else {
										// For other operators, use the value directly
										filterParams.filter.fields[field] = { [operator]: value };
									}
								}
							}
							
							// Collect results in an array
							const results: any[] = [];
							
							if (returnAll) {
								// Use paginated iterator to get all items
								const items = client.items.listPagedIterator(filterParams);
								for await (const item of items) {
									results.push(item);
								}
							} else {
								// Use regular list with pagination
								const items = await client.items.list({
									...filterParams,
									page: {
										limit: Math.min(limit, 500), // DatoCMS record limit is 500
										offset: 0,
									},
								});
								results.push(...items);
							}
							
							// Always return an output item, even if no results found
							responseData = {
								results: results,
								count: results.length,
								query: {
									itemType: itemType,
									filters: filters.filter || [],
									returnAll: returnAll,
									limit: returnAll ? undefined : limit
								}
							};
							break;

						case 'update':
							const updateRecordId = this.getNodeParameter('recordId', i) as string;
							const updateFields = this.getNodeParameter('fields', i) as any;
							const updateAdditionalFields = this.getNodeParameter('additionalFields', i, {}) as any;
							
							// Handle resourceMapper data
							let updateFieldData: any = {};
							if (updateFields.mappingMode === 'defineBelow' && updateFields.value) {
								// Convert resourceMapper format to DatoCMS format
								updateFieldData = { ...updateFields.value };
								
								// Parse any JSON strings that might be localized fields
								for (const [key, value] of Object.entries(updateFieldData)) {
									// Skip helper fields
									if (key.startsWith('_') && key.includes('helper')) {
										delete updateFieldData[key];
										continue;
									}
									
									if (typeof value === 'string' && value.trim().startsWith('{')) {
										try {
											updateFieldData[key] = JSON.parse(value);
										} catch (e) {
											// If it's not valid JSON, keep it as a string
										}
									}
								}
							} else if (updateFields.mappingMode === 'autoMapInputData') {
								// Auto-map from input data
								const inputData = items[i].json;
								updateFieldData = inputData;
							}

							responseData = await client.items.update(updateRecordId, updateFieldData);
							
							if (updateAdditionalFields.autoPublish) {
								responseData = await client.items.publish(responseData.id);
							}
							break;

						case 'upsert':
							const upsertItemTypeParam = this.getNodeParameter('itemType', i) as any;
							const upsertItemTypeId = upsertItemTypeParam?.value || upsertItemTypeParam;
							const upsertFields = this.getNodeParameter('fields', i) as any;
							const createIfNotFound = this.getNodeParameter('createIfNotFound', i, true) as boolean;
							const upsertAdditionalFields = this.getNodeParameter('additionalFields', i, {}) as any;
							
							// Handle resourceMapper data and extract matching fields
							let upsertFieldData: any = {};
							let matchingFields: any = {};
							
							if (upsertFields.mappingMode === 'defineBelow' && upsertFields.value) {
								// Convert resourceMapper format to DatoCMS format
								upsertFieldData = { ...upsertFields.value };
								
								// Extract matching fields from ResourceMapper
								if (upsertFields.matchingColumns && Array.isArray(upsertFields.matchingColumns)) {
									// Build matching fields object from array
									for (const matchingColumn of upsertFields.matchingColumns) {
										matchingFields[matchingColumn] = upsertFieldData[matchingColumn];
									}
								}
								
								// Parse any JSON strings that might be localized fields
								for (const [key, value] of Object.entries(upsertFieldData)) {
									// Skip helper fields
									if (key.startsWith('_') && key.includes('helper')) {
										delete upsertFieldData[key];
										continue;
									}
									
									if (typeof value === 'string' && value.trim().startsWith('{')) {
										try {
											upsertFieldData[key] = JSON.parse(value);
										} catch (e) {
											// If it's not valid JSON, keep it as a string
										}
									}
								}
							} else if (upsertFields.mappingMode === 'autoMapInputData') {
								// Auto-map from input data
								const inputData = items[i].json;
								upsertFieldData = inputData;
								
								// For auto-mapping, we need to have matching fields configured
								// We cannot assume any field for matching
							}

							// Get the matching field (must be explicitly configured)
							const matchingFieldKeys = Object.keys(matchingFields);
							if (matchingFieldKeys.length === 0) {
								throw new NodeOperationError(this.getNode(), 'No matching fields configured. Please select at least one field to match records on in the resource mapper.');
							}
							
							const fieldToMatchOn = matchingFieldKeys[0]; // Use first matching field
							const matchValue = matchingFields[fieldToMatchOn] || upsertFieldData[fieldToMatchOn];
							
							if (!matchValue) {
								throw new NodeOperationError(this.getNode(), `No value provided for matching field '${fieldToMatchOn}'. Please provide a value for the matching field.`);
							}

							// Search for existing record(s) by the matching field
							let existingRecords: any[] = [];
							try {
								// Search by field value using API filtering for better performance
								existingRecords = [];
								
								// Use DatoCMS API filtering for efficient field-based search
								const filterParams = {
									filter: {
										type: upsertItemTypeId,
										fields: {
											[fieldToMatchOn]: {
												eq: matchValue
											}
										}
									},
									version: 'current', // Include draft records, not just published ones
									perPage: 100,
								};
								
								const recordsIterator = client.items.listPagedIterator(filterParams);
								
								// Collect all matching records (should be few due to API filtering)
								for await (const record of recordsIterator) {
									existingRecords.push(record);
								}
							} catch (error) {
								throw new NodeOperationError(this.getNode(), `Failed to search for existing records: ${error.message}`);
							}

							// Handle the different scenarios
							if (existingRecords.length === 0) {
								// No existing record found
								if (createIfNotFound) {
									// Create new record
									responseData = await client.items.create({
										item_type: { type: 'item_type', id: upsertItemTypeId },
										...upsertFieldData,
									});
								} else {
									throw new NodeOperationError(this.getNode(), `No record found with ${fieldToMatchOn} = '${matchValue}' and createIfNotFound is disabled`);
								}
							} else if (existingRecords.length === 1) {
								// Exactly one record found - update it
								responseData = await client.items.update(existingRecords[0].id, upsertFieldData);
							} else {
								// Multiple records found - this shouldn't happen with unique fields, but handle it
								throw new NodeOperationError(this.getNode(), `Multiple records found with ${fieldToMatchOn} = '${matchValue}'. Please use a unique field for matching.`);
							}
							
							if (upsertAdditionalFields.autoPublish) {
								responseData = await client.items.publish(responseData.id);
							}
							break;

						case 'delete':
							const deleteRecordId = this.getNodeParameter('recordId', i) as string;
							responseData = await client.items.destroy(deleteRecordId);
							break;

						case 'publish':
							const publishRecordId = this.getNodeParameter('recordId', i) as string;
							responseData = await client.items.publish(publishRecordId);
							break;

						case 'unpublish':
							const unpublishRecordId = this.getNodeParameter('recordId', i) as string;
							responseData = await client.items.unpublish(unpublishRecordId);
							break;
					}
				} else if (resource === 'upload') {
					switch (operation) {
						case 'create':
							const uploadSource = this.getNodeParameter('uploadSource', i) as string;
							const skipCreationIfAlreadyExists = this.getNodeParameter('skipCreationIfAlreadyExists', i) as boolean;
							const includeOtherInputFields = this.getNodeParameter('includeOtherInputFields', i) as boolean;
						const uploadCollectionParam = this.getNodeParameter('uploadCollection', i) as any;
						// Extract the value from resource locator
						const uploadCollection = uploadCollectionParam?.value !== undefined ? uploadCollectionParam.value : (typeof uploadCollectionParam === 'object' && uploadCollectionParam !== null ? uploadCollectionParam.value : uploadCollectionParam);
							
							if (uploadSource === 'binary') {
								const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
								const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
								const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
								
								// Get filename from binary data
								const filename = binaryData.fileName || 'upload.bin';
								
								// Create temporary file
								const tempFilePath = join(tmpdir(), `datocms-upload-${Date.now()}-${Math.random().toString(36).substring(7)}`);
								writeFileSync(tempFilePath, buffer);
								
								try {
									responseData = await client.uploads.createFromLocalFile({
										localPath: tempFilePath,
										filename: filename,
										skipCreationIfAlreadyExists: skipCreationIfAlreadyExists,
									...(uploadCollection ? { 
										upload_collection: {
											type: 'upload_collection',
											id: uploadCollection
										}
									} : {})
									});
								} finally {
									// Clean up temporary file
									try {
										unlinkSync(tempFilePath);
									} catch (error) {
										// Ignore cleanup errors
									}
								}
							} else if (uploadSource === 'url') {
								const fileUrl = this.getNodeParameter('fileUrl', i) as string;
								
								if (!fileUrl) {
									throw new NodeOperationError(this.getNode(), 'File URL is required when using URL upload source');
								}
								
								responseData = await client.uploads.createFromUrl({
									url: fileUrl,
									skipCreationIfAlreadyExists: skipCreationIfAlreadyExists,
									...(uploadCollection ? { 
										upload_collection: {
											type: 'upload_collection',
											id: uploadCollection
										}
									} : {})
								});
							} else {
								throw new NodeOperationError(this.getNode(), 'Invalid upload source specified');
							}
							
							// Merge input data if the option is enabled
							if (includeOtherInputFields) {
								const inputData = items[i].json;
								responseData = {
									...inputData,
									...responseData,
								};
							}
							break;

						case 'get':
							const uploadId = this.getNodeParameter('uploadId', i) as string;
							responseData = await client.uploads.find(uploadId);
							break;

						case 'getAll':
							const returnAllUploads = this.getNodeParameter('returnAll', i) as boolean;
							const limitUploads = this.getNodeParameter('limit', i, 50) as number;
							const filterByCollectionParam = this.getNodeParameter('filterByCollection', i) as any;
							// Extract the value from resource locator
							const filterByCollection = filterByCollectionParam?.value !== undefined ? filterByCollectionParam.value : (typeof filterByCollectionParam === 'object' && filterByCollectionParam !== null ? filterByCollectionParam.value : filterByCollectionParam);
							
							// Collect results in an array
							const uploadResults: any[] = [];
							
							if (returnAllUploads) {
								// Use paginated iterator to get all uploads
								const uploads = client.uploads.listPagedIterator();
								for await (const upload of uploads) {
									// Apply client-side collection filter
									if (!filterByCollection || 
										(upload.upload_collection && upload.upload_collection.id === filterByCollection)) {
										uploadResults.push(upload);
									}
								}
							} else {
								// Use regular list with pagination
								const uploads = await client.uploads.list({
									page: {
										limit: Math.min(limitUploads, 50), // DatoCMS upload limit is 50
										offset: 0,
									},
								});
								for (const upload of uploads) {
									// Apply client-side collection filter
									if (!filterByCollection || 
										(upload.upload_collection && upload.upload_collection.id === filterByCollection)) {
										uploadResults.push(upload);
									}
								}
							}
							
							// Always return an output item, even if no results found
							responseData = {
								results: uploadResults,
								count: uploadResults.length,
								query: {
									filterByCollection: filterByCollection || null,
									returnAll: returnAllUploads,
									limit: returnAllUploads ? undefined : limitUploads
								}
							};
							break;

						case 'delete':
							const deleteUploadId = this.getNodeParameter('uploadId', i) as string;
							responseData = await client.uploads.destroy(deleteUploadId);
							break;
					}
				} else if (resource === 'itemType') {
					switch (operation) {
						case 'getAll':
							const returnAllItemTypes = this.getNodeParameter('returnAll', i) as boolean;
							const limitItemTypes = this.getNodeParameter('limit', i, 50) as number;
							
							const allItemTypes = await client.itemTypes.list();
							const itemTypesToReturn = returnAllItemTypes ? allItemTypes : allItemTypes.slice(0, limitItemTypes);
							
							// Always return an output item with results array
							responseData = {
								results: itemTypesToReturn,
								count: itemTypesToReturn.length,
								query: {
									returnAll: returnAllItemTypes,
									limit: returnAllItemTypes ? undefined : limitItemTypes
								}
							};
							break;

						case 'get':
							const itemTypeId = this.getNodeParameter('itemTypeId', i) as string;
							responseData = await client.itemTypes.find(itemTypeId);
							break;
					}
				}

				// Only add to returnData if responseData exists (getAll operations handle this separately)
				if (responseData !== undefined) {
					returnData.push({
						json: responseData as any || {},
						pairedItem: {
							item: i,
						},
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
						},
						pairedItem: {
							item: i,
						},
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}