#!/usr/bin/env pwsh
# Run a simple local HTTP server and open the project in the default browser with optional auto-clear
# Usage: Right-click and "Run with PowerShell" or open PowerShell in this folder and run `.
un_local_server.ps1`

try{
  $root = Split-Path -Parent $MyInvocation.MyCommand.Definition
  Set-Location $root
}catch{
  # fallback to current directory
}

Write-Host "Starting local HTTP server in:`n$(Get-Location)" -ForegroundColor Cyan

# Prefer 'py' launcher, fallback to 'python'
if (Get-Command py -ErrorAction SilentlyContinue){
  Start-Process py -ArgumentList '-3','-m','http.server','8000'
  Write-Host "Started server with 'py -3 -m http.server 8000'" -ForegroundColor Green
}elseif(Get-Command python -ErrorAction SilentlyContinue){
  Start-Process python -ArgumentList '-m','http.server','8000'
  Write-Host "Started server with 'python -m http.server 8000'" -ForegroundColor Green
}else{
  Write-Warning "Python not found. If you have Node.js, run: npx http-server . -p 8000"
}

Start-Sleep -Milliseconds 800

$url = 'http://localhost:8000/index.html?clear=all'
Write-Host "Opening browser: $url" -ForegroundColor Cyan
Start-Process $url

Write-Host "If the browser doesn't open, visit http://localhost:8000/index.html manually." -ForegroundColor Yellow
