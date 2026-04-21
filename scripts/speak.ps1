<#
.SYNOPSIS
    Generates a WAV audio file from text using Windows built-in TTS.

.DESCRIPTION
    Uses System.Speech.Synthesis.SpeechSynthesizer (built into Windows — no
    external API key or installation required) to convert a narration string
    into a WAV file.

    Called by the Playwright screenshots spec after each page.screenshot() call
    so that every blog screenshot has a matching narration audio file.

.PARAMETER Text
    The narration text to speak. Keep to 1-3 sentences for best pacing.

.PARAMETER OutputPath
    Full path for the output WAV file (e.g. screenshots-output\series-1\dashboard.wav).
    Parent directory must already exist.

.PARAMETER Voice
    Optional. Name of an installed Windows TTS voice.
    Run: Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).GetInstalledVoices() | Select -ExpandProperty VoiceInfo | Select Name
    Defaults to the system default voice.

.PARAMETER Rate
    Speech rate: -10 (slowest) to 10 (fastest). Default: -1 (slightly slower
    than default for clearer narration in video).

.PARAMETER Volume
    Volume: 0-100. Default: 100.

.EXAMPLE
    .\speak.ps1 -Text "The dashboard loads immediately after login." -OutputPath "screenshots-output\series-1\dashboard.wav"

.EXAMPLE
    .\speak.ps1 -Text "Here we can see the AI insights card." -OutputPath "out.wav" -Voice "Microsoft David Desktop" -Rate -2
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string] $Text,

    [Parameter(Mandatory = $true)]
    [string] $OutputPath,

    [string] $Voice   = "",
    [int]    $Rate    = -1,
    [int]    $Volume  = 100
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

try {
    Add-Type -AssemblyName System.Speech

    $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer

    # Select voice if specified; otherwise use system default
    if ($Voice -ne "") {
        try {
            $synth.SelectVoice($Voice)
        } catch {
            Write-Warning "Voice '$Voice' not found — using system default. Available voices:"
            $synth.GetInstalledVoices() | ForEach-Object {
                Write-Warning ("  " + $_.VoiceInfo.Name)
            }
        }
    }

    $synth.Rate   = [Math]::Max(-10, [Math]::Min(10, $Rate))
    $synth.Volume = [Math]::Max(0,   [Math]::Min(100, $Volume))

    # Ensure output directory exists
    $dir = Split-Path -Parent $OutputPath
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $synth.SetOutputToWaveFile($OutputPath)
    $synth.Speak($Text)
    $synth.SetOutputToDefaultAudioDevice()   # reset so the object is reusable
    $synth.Dispose()

    Write-Host "Audio saved: $OutputPath"
    exit 0

} catch {
    Write-Error "speak.ps1 failed: $_"
    exit 1
}
