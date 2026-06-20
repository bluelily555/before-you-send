targetScope = 'subscription'

@minLength(1)
@maxLength(64)
@description('azd 환경 이름 (예: dev, prod)')
param environmentName string

@minLength(1)
@description('Azure 배포 리전')
param location string

@description('GitHub Models API 토큰')
@secure()
param githubToken string = ''

@description('Azure OpenAI 엔드포인트 (선택)')
param azureOpenAiEndpoint string = ''

@description('Azure OpenAI API 키 (선택)')
@secure()
param azureOpenAiApiKey string = ''

@description('Azure OpenAI 배포명 (선택)')
param azureOpenAiDeployment string = 'gpt-4o'

var tags = { 'azd-env-name': environmentName }
var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))
var appName = 'bys-${resourceToken}'

// 리소스 그룹
resource rg 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: 'rg-${environmentName}'
  location: location
  tags: tags
}

// App Service 배포
module web 'app/web.bicep' = {
  name: 'web'
  scope: rg
  params: {
    name: appName
    location: location
    tags: union(tags, { 'azd-service-name': 'web' })
    githubToken: githubToken
    azureOpenAiEndpoint: azureOpenAiEndpoint
    azureOpenAiApiKey: azureOpenAiApiKey
    azureOpenAiDeployment: azureOpenAiDeployment
  }
}

// azd 출력값
output AZURE_LOCATION string = location
output AZURE_RESOURCE_GROUP string = rg.name
output SERVICE_WEB_URL string = web.outputs.url
output SERVICE_WEB_NAME string = web.outputs.name
