param(
    [string]$InputDir    = "",
    [string]$OutputFile  = "blog-narrated-video.mp4",
    [string]$Series      = "",
    [switch]$AllSeries,
    [int]$PadSeconds     = 1
)

# build-video.ps1
#
# Stitches PNG screenshots + WAV narrations into a narrated MP4 slideshow.
# Requires FFmpeg on PATH: https://ffmpeg.org/download.html
#
# Usage:
#   # Single series
#   .\build-video.ps1 -Series "series-1-authentication" -OutputFile "auth.mp4"
#
#   # All series into one video
#   .\build-video.ps1 -AllSeries -OutputFile "blog-full-series.mp4"
#
#   # Custom input folder
#   .\build-video.ps1 -InputDir "screenshots-output\series-6-ai-app-features" -OutputFile "ai.mp4"

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Verify FFmpeg is available
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    Write-Error "FFmpeg not found on PATH. Download from https://ffmpeg.org/download.html and add to PATH."
    exit 1
}

$ScriptDir     = Split-Path -Parent $MyInvocation.MyCommand.Path
$SubmoduleRoot = Split-Path -Parent $ScriptDir
$ScreenshotsRoot = Join-Path $SubmoduleRoot "screenshots-output"

# Resolve which folders to process
$folders = @()
if ($InputDir -ne "") {
    $folders = @($InputDir)
} elseif ($AllSeries) {
    $folders = Get-ChildItem -Path $ScreenshotsRoot -Directory | Sort-Object Name | Select-Object -ExpandProperty FullName
} elseif ($Series -ne "") {
    $folders = @(Join-Path $ScreenshotsRoot $Series)
} else {
    Write-Error "Specify -Series <name>, -AllSeries, or -InputDir <path>."
    exit 1
}

# Collect PNG+WAV pairs across all resolved folders
$pairs = @()
foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        Write-Warning "Folder not found, skipping: $folder"
        continue
    }
    $pngs = Get-ChildItem -Path $folder -Filter "*.png" | Sort-Object Name
    foreach ($png in $pngs) {
        $wav = [System.IO.Path]::ChangeExtension($png.FullName, ".wav")
        if (Test-Path $wav) {
            $pairs += [PSCustomObject]@{ PNG = $png.FullName; WAV = $wav }
        } else {
            Write-Warning "No WAV for $($png.Name) — skipping (run the screenshot tests first)."
        }
    }
}

if ($pairs.Count -eq 0) {
    Write-Error "No PNG+WAV pairs found. Run: npx playwright test --project=screenshots"
    exit 1
}

Write-Host "Building video from $($pairs.Count) slides..."

# Temp folder for per-slide clips
$TempDir = Join-Path $env:TEMP "pw-slides-$(Get-Date -Format 'yyyyMMddHHmmss')"
New-Item -ItemType Directory -Path $TempDir | Out-Null

$clipList = Join-Path $TempDir "clips.txt"
$clips = @()

for ($i = 0; $i -lt $pairs.Count; $i++) {
    $pair    = $pairs[$i]
    $clipOut = Join-Path $TempDir "clip_$($i.ToString('D4')).mp4"

    # Get WAV duration so the image is shown for exactly that long + padding
    $durationJson = & ffprobe -v quiet -print_format json -show_streams $pair.WAV 2>&1 | ConvertFrom-Json
    $wavDuration  = [double]($durationJson.streams[0].duration)
    $slideDuration = [Math]::Round($wavDuration + $PadSeconds, 2)

    Write-Host "  Slide $($i+1)/$($pairs.Count): $([System.IO.Path]::GetFileNameWithoutExtension($pair.PNG)) ($($slideDuration)s)"

    # Build one clip: PNG scaled to 1920x1080 (letterboxed) + WAV + pad silence
    & ffmpeg -y `
        -loop 1 -t $slideDuration -i $pair.PNG `
        -i $pair.WAV `
        -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black" `
        -c:v libx264 -preset fast -crf 22 `
        -c:a aac -b:a 128k `
        -shortest `
        -pix_fmt yuv420p `
        $clipOut 2>&1 | Out-Null

    if (-not (Test-Path $clipOut)) {
        Write-Warning "FFmpeg failed on slide $($i+1), skipping."
        continue
    }

    $clips += $clipOut
    Add-Content -Path $clipList -Value "file '$clipOut'"
}

if ($clips.Count -eq 0) {
    Write-Error "No clips were created. Check FFmpeg output above."
    exit 1
}

# Resolve output path relative to submodule root if not absolute
if (-not [System.IO.Path]::IsPathRooted($OutputFile)) {
    $OutputFile = Join-Path $SubmoduleRoot $OutputFile
}

Write-Host ""
Write-Host "Concatenating $($clips.Count) clips into: $OutputFile"

& ffmpeg -y -f concat -safe 0 -i $clipList -c copy $OutputFile 2>&1 | Out-Null

# Cleanup temp clips
Remove-Item -Recurse -Force $TempDir

if (Test-Path $OutputFile) {
    $size = [Math]::Round((Get-Item $OutputFile).Length / 1MB, 1)
    Write-Host ""
    Write-Host "Done: $OutputFile ($size MB)"
    Write-Host ""
    Write-Host "Play with:  Start-Process '$OutputFile'"
    Write-Host "Or open in any media player."
} else {
    Write-Error "Output file was not created. Check FFmpeg errors above."
    exit 1
}
