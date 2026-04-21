param(
    [Parameter(Mandatory=$true)][string]$Text,
    [Parameter(Mandatory=$true)][string]$OutputPath,
    [string]$Voice = "",
    [int]$Rate = -1,
    [int]$Volume = 100
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer

if ($Voice -ne "") {
    try {
        $synth.SelectVoice($Voice)
    } catch {
        Write-Warning "Voice '$Voice' not found, using system default."
    }
}

$synth.Rate   = [Math]::Max(-10, [Math]::Min(10, $Rate))
$synth.Volume = [Math]::Max(0,   [Math]::Min(100, $Volume))

$dir = Split-Path -Parent $OutputPath
if ($dir -and -not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

# Save to WAV file
$synth.SetOutputToWaveFile($OutputPath)
$synth.Speak($Text)

# Play through speakers so narration is heard live during the test run
$synth.SetOutputToDefaultAudioDevice()
$synth.Speak($Text)

$synth.Dispose()

Write-Host "Audio saved: $OutputPath"
exit 0
