$sh = New-Object -ComObject WScript.Shell
$paths = @(
  "C:\Users\Flp-5\OneDrive\Desktop\Contexto - Estudo de Inglês.lnk",
  "C:\Users\Flp-5\Desktop\Contexto - Estudo de Inglês.lnk"
)
foreach ($p in $paths) {
  if (Test-Path -LiteralPath $p) {
    $sc = $sh.CreateShortcut($p)
    Write-Output "Path: $p"
    Write-Output "Target: $($sc.TargetPath)"
    Write-Output "Args: $($sc.Arguments)"
    Write-Output "Working: $($sc.WorkingDirectory)"
  }
}
