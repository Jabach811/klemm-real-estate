$ErrorActionPreference = 'Stop'
$project = [System.IO.Path]::GetFullPath((Split-Path -Parent $PSCommandPath))
$dist = [System.IO.Path]::GetFullPath((Join-Path $project 'dist'))
# Only regenerate this checkout's build output. Source assets are never removed.
if ((Split-Path -Parent $dist) -ne $project -or (Split-Path -Leaf $dist) -ne 'dist') {
  throw "Unexpected build output path: $dist"
}
if (Test-Path -LiteralPath $dist) { Remove-Item -LiteralPath $dist -Recurse -Force }
& node (Join-Path $project 'tools/build-site.mjs')
if ($LASTEXITCODE -ne 0) { throw 'Site build failed.' }
