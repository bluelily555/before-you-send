param name string
param location string
param tags object = {}

@secure()
param githubToken string = ''
param azureOpenAiEndpoint string = ''
@secure()
param azureOpenAiApiKey string = ''
param azureOpenAiDeployment string = 'gpt-4o'

// App Service Plan (Linux B1)
resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: '${name}-plan'
  location: location
  tags: tags
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

// Web App (Node.js 20 LTS)
resource appService 'Microsoft.Web/sites@2022-09-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      appCommandLine: 'npm start'
      nodeVersion: '~20'
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      http20Enabled: true
      appSettings: [
        { name: 'GITHUB_TOKEN',              value: githubToken }
        { name: 'AZURE_OPENAI_ENDPOINT',     value: azureOpenAiEndpoint }
        { name: 'AZURE_OPENAI_API_KEY',      value: azureOpenAiApiKey }
        { name: 'AZURE_OPENAI_DEPLOYMENT',   value: azureOpenAiDeployment }
        { name: 'NEXT_TELEMETRY_DISABLED',   value: '1' }
        { name: 'WEBSITE_NODE_DEFAULT_VERSION', value: '~20' }
        { name: 'SCM_DO_BUILD_DURING_DEPLOYMENT', value: 'true' }
        { name: 'PORT', value: '8080' }
      ]
    }
  }
}

output url string = 'https://${appService.properties.defaultHostName}'
output name string = appService.name
output id string = appService.id
