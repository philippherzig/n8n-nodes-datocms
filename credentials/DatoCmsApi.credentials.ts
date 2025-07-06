import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class DatoCmsApi implements ICredentialType {
	name = 'datoCmsApi';
	displayName = 'DatoCMS API';

	documentationUrl = 'https://www.datocms.com/docs/content-management-api';

	properties: INodeProperties[] = [
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'The API token for your DatoCMS project',
		},
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'string',
			default: 'main',
			description: 'The environment to use (default: main)',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://site-api.datocms.com',
			description: 'The base URL for the DatoCMS API',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'Authorization': '=Bearer {{ $credentials.apiToken }}',
				'Accept': 'application/json',
				'X-Api-Version': '3',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{ $credentials.baseUrl }}',
			url: '/site',
			method: 'GET',
		},
	};
}