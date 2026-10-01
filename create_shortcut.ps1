$sh = New-Object -ComObject WScript.Shell
$desktopPaths = @(
    [Environment]::GetFolderPath('Desktop'),
    "C:\Users\Flp-5\OneDrive\Desktop",
    "C:\Users\Flp-5\Desktop"
) | Select-Object -Unique

$batTarget = "C:\Users\Flp-5\OneDrive\Documentos\contexto_app\Contexto.bat"
$workingDir = "C:\Users\Flp-5\OneDrive\Documentos\contexto_app"

foreach ($dp in $desktopPaths) {
    if (Test-Path $dp) {
        $link1 = Join-Path $dp "Contexto - Estudo de Inglês.lnk"
        $sc1 = $sh.CreateShortcut($link1)
        $sc1.TargetPath = $batTarget
        $sc1.WorkingDirectory = $workingDir
        $sc1.Save()

        $link2 = Join-Path $dp "Contexto - Estudo de Ingles.lnk"
        $sc2 = $sh.CreateShortcut($link2)
        $sc2.TargetPath = $batTarget
        $sc2.WorkingDirectory = $workingDir
        $sc2.Save()

        Write-Output "Shortcuts updated in: $dp"
    }
}
