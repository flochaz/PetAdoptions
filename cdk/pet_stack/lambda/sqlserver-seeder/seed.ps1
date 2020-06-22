#Requires -Modules @{ModuleName='AWS.Tools.Common';ModuleVersion='4.0.5.0'}
#Requires -Modules @{ModuleName='AWS.Tools.SimpleSystemsManagement';ModuleVersion='4.0.5.0'}
#Requires -Modules @{ModuleName='SqlServer';ModuleVersion='21.1.18221'}

function SeedInitialSchema {
    Param(
        [Parameter(Position=1, Mandatory=$false)]
        [int]$MaxRetries = 5,
        [Parameter(Position=2, Mandatory=$false)]
        [int]$Delay = 30
    )

    $dbEndpoint = $env:DbEndpoint
    $usernameParameter = $env:UsernameParameter
    $passwordParameter = $env:PasswordParameter

    $username = (Get-SSMParameter -Name $usernameParameter).Value
    $password = (Get-SSMParameter -Name $passwordParameter).Value
    $connectionString = "Server=${dbEndpoint};User Id=${username};Password=${password}"
    $script = "./SQL/v1.0.0.sql"

    $retryAttempt = 0

    do {
        $retryAttempt++
        try {
            # execute the cript
            Invoke-Sqlcmd -ConnectionString $connectionString -InputFile $script
            return
        } catch {
            Write-Error $_ -ErrorAction Continue
            Start-Sleep -Seconds $Delay
        }
    } while ($retryAttempt -lt $MaxRetries)

    # Throw an error after $Maximum unsuccessful invocations. Doesn't need
    # a condition, since the function returns upon successful invocation.
    throw 'SQL Seeder failed.'
}

# The following is a standard template for custom resource implementation.
# Note that only Create event is handled. 

$CFNEvent = if ($null -ne $LambdaInput.Records) {
    Write-Host 'Message received via SNS - Parsing out CloudFormation event'
    $LambdaInput.Records[0].Sns.Message
}
else {
    Write-Host 'Event received directly from CloudFormation'
    $LambdaInput
}
$body = @{
    # We'll assume success and overwrite if anything fails in line to avoid code duplication
    Status             = "SUCCESS"
    Reason             = "See the details in CloudWatch Log Stream:`n[Group] $($LambdaContext.LogGroupName)`n[Stream] $($LambdaContext.LogStreamName)"
    StackId            = $CFNEvent.StackId
    RequestId          = $CFNEvent.RequestId
    LogicalResourceId  = $CFNEvent.LogicalResourceId
}
Write-Host "Processing RequestType [$($CFNEvent.RequestType)]"
Write-Host "Resource Properties:"
Write-Host ($CFNEvent.ResourceProperties | Format-List | Out-String)

try {
    # If you want to return data back to CloudFormation, add the Data property to the body with the value as a hashtable. The hashtable keys will be the retrievable attributes when using Fn::GetAtt against the custom resource in your CloudFormation template:
    #    $body.Data = @{Secret = $null}
    switch ($CFNEvent.RequestType) {
            Create {
                    # Add Create request code here
                    SeedInitialSchema
            }
            Update {
                    # Add Update request code here
                    Write-Host 'SQL Seeder does not support schema updates. Return success.'
            }
            Delete {
                    # Add Delete request code here
                    Write-Host 'SQL Seeder does not support deletion of the schema. Return success.'
            }
    }
}
catch {
    Write-Error $_
    if (-not $CFNEvent.ResourceProperties.IgnoreSqlErrors) {
      $body.Status = "FAILED"
    }
}
finally {
    # use the following block without CDK provider framework
    #try {
    #        Invoke-WebRequest -Uri $([Uri]$CFNEvent.ResponseURL) -Method Put -Body $payload
    #}
    #catch {
    #        Write-Error $_
    #}
}

# Return body as lambda response
$payload = (ConvertTo-Json -InputObject $body -Compress -Depth 5)
$payload