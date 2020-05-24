#Requires -Modules @{ModuleName='AWS.Tools.Common';ModuleVersion='4.0.5.0'}
#Requires -Modules @{ModuleName='AWS.Tools.SimpleSystemsManagement';ModuleVersion='4.0.5.0'}
#Requires -Modules @{ModuleName='SqlServer';ModuleVersion='21.1.18221'}

function SeedInitialSchema {
	$dbEndpoint = $env:DbEndpoint
	$usernameParameter = $env:UsernameParameter
	$passwordParameter = $env:PasswordParameter

	$username = (Get-SSMParameter -Name $usernameParameter).Value
	$password = (Get-SSMParameter -Name $passwordParameter).Value
	$connectionString = "Server=${dbEndpoint};User Id=${username};Password=${password}"
	$script = "./SQL/v1.0.0.sql"

	Invoke-Sqlcmd -ConnectionString $connectionString -InputFile $script
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
	PhysicalResourceId = $LambdaContext.LogStreamName
	StackId            = $CFNEvent.StackId
	RequestId          = $CFNEvent.RequestId
	LogicalResourceId  = $CFNEvent.LogicalResourceId
}
Write-Host "Processing RequestType [$($CFNEvent.RequestType)]"
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
	$body.Status = "FAILED"
}
finally {
	try {
			Write-Host "Sending response back to CloudFormation"
			Invoke-WebRequest -Uri $([Uri]$CFNEvent.ResponseURL) -Method Put -Body $($body | ConvertTo-Json -Depth 5)
	}
	catch {
			Write-Error $_
	}
}
