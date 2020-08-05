Param(
    $Subscription="Visual Studio Enterprise Subscription",
    $ResourceGroup="rg-teamsbot-test",
    $WebAppName="teamsbot-test-2",
    $ZipPath="./deployment.zip"
)

# Login to Azure
#az login
# =========================================================
Write-Output "Creating web config..."
# Delete web config file if exists
$PreviousWebConfig = "./web.config"
if (Test-Path $PreviousWebConfig) {
    Remove-Item $PreviousWebConfig
}
# Create the web config file
az bot prepare-deploy --code-dir "." --lang Javascript
# =========================================================
Write-Output "Zipping up code directory..."
# Delete deployment zip if exists
$PreviousDeployment = "./deployment.zip"
if (Test-Path $PreviousDeployment) {
    Remove-Item $PreviousDeployment
}
# Create deployment zip
Compress-Archive -Path .\* -CompressionLevel Fastest -DestinationPath deployment.zip
# =========================================================
Write-Output "Deploy bot to Azure..."
az webapp deployment source config-zip --subscription $Subscription --resource-group $ResourceGroup `
--name $WebAppName --src $ZipPath

Read-Host -Prompt "Check above for deployment result. Press Enter to exit"