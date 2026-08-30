$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSCommandPath
$dist = Join-Path $project 'dist'
if (Test-Path $dist) { Remove-Item -LiteralPath $dist -Recurse -Force }
New-Item -ItemType Directory -Path (Join-Path $dist 'server'),(Join-Path $dist 'client') | Out-Null
Get-ChildItem -Path $project -File | Where-Object { $_.Extension -in '.html','.css','.jpg','.png','.mp4' } | Copy-Item -Destination (Join-Path $dist 'client')
Copy-Item -LiteralPath (Join-Path $project 'site-worker.js') -Destination (Join-Path $dist 'server/index.js')