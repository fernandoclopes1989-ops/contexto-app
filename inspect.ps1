$sh = New-Object -ComObject WScript.Shell
Get-ChildItem 'C:\Users\Flp-5\OneDrive\Desktop' -Filter '*Contexto*' | ForEach-Object {
    $sc = $sh.CreateShortcut($_.FullName)
    [Console]::WriteLine("Name: " + $_.FullName)
    [Console]::WriteLine("Target: " + $sc.TargetPath)
    [Console]::WriteLine("Arguments: " + $sc.Arguments)
    [Console]::WriteLine("WorkingDirectory: " + $sc.WorkingDirectory)
}
