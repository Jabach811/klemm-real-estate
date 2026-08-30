$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSCommandPath
$dist = Join-Path $project 'dist'
$site = Join-Path $project 'site'
if (Test-Path $dist) { Remove-Item -LiteralPath $dist -Recurse -Force }
New-Item -ItemType Directory -Path (Join-Path $dist 'server'),(Join-Path $dist 'client') | Out-Null
Copy-Item -LiteralPath $site -Destination (Join-Path $dist 'client/site') -Recurse
Copy-Item -LiteralPath (Join-Path $project 'shared') -Destination (Join-Path $dist 'client/shared') -Recurse
Copy-Item -LiteralPath (Join-Path $project 'cities') -Destination (Join-Path $dist 'client/cities') -Recurse

# Publish shared pages at their existing root URLs as well as under /site/.
foreach ($file in Get-ChildItem -LiteralPath $site -File) {
  if ($file.Extension -eq '.html') {
    $content = Get-Content -LiteralPath $file.FullName -Raw
    $content = $content -replace 'href="\.\./cities/tracy/index\.html"', 'href="index.html"'
    $content = $content -replace '(?<!\.)\.\./cities/', 'cities/'
    $content = $content -replace '(?<!\.)\.\./shared/', 'shared/'
    Set-Content -LiteralPath (Join-Path $dist "client/$($file.Name)") -Value $content -NoNewline
  } elseif ($file.Extension -eq '.css') {
    Copy-Item -LiteralPath $file.FullName -Destination (Join-Path $dist "client/$($file.Name)")
  }
}

# Keep existing public root URLs while city pages live next to their own assets.
$cityEntryPoints = @{
  'cities/tracy/index.html' = 'index.html'
  'cities/manteca/index.html' = 'mantecare.html'
  'cities/mountain-house/index.html' = 'mountainhousere.html'
  'cities/lathrop/index.html' = 'lathropre.html'
  'cities/river-islands/index.html' = 'riverislandsre.html'
  'cities/woodbridge/index.html' = 'woodbridgere.html'
}
foreach ($source in $cityEntryPoints.Keys) {
  $content = Get-Content -LiteralPath (Join-Path $project $source) -Raw
  $content = $content -replace '\s*<base href="../../site/">', ''
  $content = $content -replace '(?<!\.)\.\./cities/', 'cities/'
  $content = $content -replace '(?<!\.)\.\./shared/', 'shared/'
  # The page's links back to itself should stay on its own public URL.
  $content = $content -replace [regex]::Escape("href=`"$source`""), "href=`"$($cityEntryPoints[$source])`""
  Set-Content -LiteralPath (Join-Path $dist "client/$($cityEntryPoints[$source])") -Value $content -NoNewline
}
Copy-Item -LiteralPath (Join-Path $project 'site-worker.js') -Destination (Join-Path $dist 'server/index.js')
