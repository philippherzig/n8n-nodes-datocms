import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

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
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a record',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a record',
					},
					{
						name: 'Get All',
						value: 'getAll',
						description: 'Get all records',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a record',
					},
					{
						name: 'Publish',
						value: 'publish',
						description: 'Publish a record',
					},
					{
						name: 'Unpublish',
						value: 'unpublish',
						description: 'Unpublish a record',
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
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get an upload',
					},
					{
						name: 'Get All',
						value: 'getAll',
						description: 'Get all uploads',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete an upload',
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
						name: 'Get All',
						value: 'getAll',
						description: 'Get all item types',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get an item type',
					},
				],
				default: 'getAll',
			},
			// Item Type selection for record operations
			{
				displayName: 'Item Type',
				name: 'itemType',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getItemTypes',
				},
				displayOptions: {
					show: {
						resource: ['record'],
						operation: ['create', 'getAll', 'get', 'update', 'delete', 'publish', 'unpublish'],
					},
				},
				default: '',
				required: true,
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
			// Fields for record creation/update
			{
				displayName: 'Fields',
				name: 'fields',
				type: 'json',
				displayOptions: {
					show: {
						resource: ['record'],
						operation: ['create', 'update'],
					},
				},
				default: '{}',
				description: 'Record fields as JSON object',
			},
			// Upload fields
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['upload'],
						operation: ['create'],
					},
				},
				default: 'data',
				required: true,
				description: 'Name of the binary property to upload',
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
			// Additional options
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						resource: ['record'],
						operation: ['create', 'update'],
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
		loadOptions: {
			async getItemTypes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('datoCmsApi');
				const client = buildClient({
					apiToken: credentials.apiToken as string,
					environment: credentials.environment as string,
				});

				try {
					const itemTypes = await client.itemTypes.list();
					
					return itemTypes.map((itemType) => ({
						name: itemType.name,
						value: itemType.id,
					}));
				} catch (error) {
					throw new NodeOperationError(this.getNode(), `Failed to load item types: ${error.message}`);
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
					const itemType = this.getNodeParameter('itemType', i) as string;

					switch (operation) {
						case 'create':
							const createFields = this.getNodeParameter('fields', i) as string;
							const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;
							
							const recordData = {
								item_type: { id: itemType, type: 'item_type' },
								...JSON.parse(createFields),
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
							const items = await client.items.list({
								filter: {
									type: itemType,
								},
							});
							// Handle multiple items: each item should be a separate n8n item
							for (const item of items) {
								returnData.push({
									json: item as any,
									pairedItem: {
										item: i,
									},
								});
							}
							continue;

						case 'update':
							const updateRecordId = this.getNodeParameter('recordId', i) as string;
							const updateFields = this.getNodeParameter('fields', i) as string;
							const updateAdditionalFields = this.getNodeParameter('additionalFields', i, {}) as any;
							
							const updateData = {
								...JSON.parse(updateFields),
							};

							responseData = await client.items.update(updateRecordId, updateData);
							
							if (updateAdditionalFields.autoPublish) {
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
							const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
							this.helpers.assertBinaryData(i, binaryPropertyName);
							const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

							responseData = await client.uploads.create({
								path: buffer,
							});
							break;

						case 'get':
							const uploadId = this.getNodeParameter('uploadId', i) as string;
							responseData = await client.uploads.find(uploadId);
							break;

						case 'getAll':
							const uploads = await client.uploads.list();
							// Handle multiple items: each upload should be a separate n8n item
							for (const upload of uploads) {
								returnData.push({
									json: upload as any,
									pairedItem: {
										item: i,
									},
								});
							}
							continue;

						case 'delete':
							const deleteUploadId = this.getNodeParameter('uploadId', i) as string;
							responseData = await client.uploads.destroy(deleteUploadId);
							break;
					}
				} else if (resource === 'itemType') {
					switch (operation) {
						case 'getAll':
							const itemTypes = await client.itemTypes.list();
							// Handle multiple items: each item type should be a separate n8n item
							for (const itemType of itemTypes) {
								returnData.push({
									json: itemType as any,
									pairedItem: {
										item: i,
									},
								});
							}
							continue;

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