targetScope = 'resourceGroup'

@minLength(1)
@maxLength(64)
@description('azd 환경 이름 (예: dev, prod)')
param environmentName string

@minLength(1)
@description('Azure 배포 리전')
param location string = resourceGroup().location

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
var resourceToken = toLower(uniqueString(resourceGroup().id, environmentName))
var appName = 'bys-${resourceToken}'

// App Service 배포 (기존 리소스 그룹 사용)
module web 'app/web.bicep' = {
  name: 'web'
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
output SERVICE_WEB_URL string = web.outputs.url
output SERVICE_WEB_NAME string = web.outputs.name
