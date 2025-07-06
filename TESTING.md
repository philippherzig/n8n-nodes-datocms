# Testing the DatoCMS n8n Node

## Local Development Testing

### Prerequisites
- Node.js >= 20.15
- npm
- n8n installed locally

### Setup for Local Testing

1. **Build the node**
   ```bash
   npm install
   npm run build
   ```

2. **Link to n8n (n8n v1.0+ method)**
   ```bash
   # Create n8n custom nodes directory
   mkdir -p ~/.n8n/nodes
   
   # Link our node (from the ~/.n8n/nodes directory)
   cd ~/.n8n/nodes
   npm link /absolute/path/to/n8n-nodes-datocms
   ```

3. **Start n8n**
   ```bash
   # From any directory with n8n installed
   npx n8n
   ```

4. **Test the node**
   - Open http://localhost:5678
   - Add new node (+)
   - Search for "datocms" (use node name, not package name)
   - The DatoCMS node should appear in the list

### Test Environment Setup

For a clean test environment:

```bash
# Create test directory
mkdir n8n-test && cd n8n-test

# Initialize and install n8n
npm init -y
npm install n8n @datocms/cma-client-node

# Install our node package
npm install ../n8n-nodes-datocms/n8n-nodes-datocms-0.1.0.tgz

# Link to n8n nodes directory
cd ~/.n8n/nodes
npm link /path/to/n8n-nodes-datocms

# Start n8n
cd back/to/n8n-test
npx n8n
```

### Important Notes

- **Node Name vs Package Name**: Search for "datocms" (the node name), not "n8n-nodes-datocms" (package name)
- **n8n v1.0+ Change**: Custom nodes must be linked to `~/.n8n/nodes`, not global node_modules
- **Restart Required**: After description changes, restart n8n and re-link if needed
- **Dependencies**: The DatoCMS SDK must be available in the n8n environment

### Testing Checklist

- [ ] Node appears in n8n node list
- [ ] Node can be added to workflow
- [ ] Credentials can be configured
- [ ] Dynamic content type dropdown works
- [ ] Basic CRUD operations function
- [ ] File upload works
- [ ] Error handling works properly

### Troubleshooting

1. **Node not visible**: Check that it's linked to `~/.n8n/nodes` (not global node_modules)
2. **Module not found errors**: Ensure dependencies are installed in test environment
3. **Changes not reflected**: Restart n8n and clear browser cache
4. **Link issues**: Use absolute paths when linking

### Development Workflow

1. Make code changes
2. Run `npm run build`
3. Restart n8n (if description changed)
4. Test in browser
5. Repeat

The official n8n documentation confirms this is the standard process for v1.0+.