# Setup script for Windows PowerShell
# This script copies CSV files from the root directory to the public folder

Write-Host "Setting up Retail Sales Analytics Application..." -ForegroundColor Green

# Check if CSV files exist in root
$csvFiles = @("item_master.csv", "submission.csv", "calendar.csv", "sales_train_evaluation.csv")
$missingFiles = @()

foreach ($file in $csvFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "Warning: The following files are missing from the root directory:" -ForegroundColor Yellow
    foreach ($file in $missingFiles) {
        Write-Host "  - $file" -ForegroundColor Yellow
    }
    Write-Host "Please ensure all CSV files are in the project root before running this script." -ForegroundColor Yellow
}

# Ensure public directory exists
if (-not (Test-Path "public")) {
    New-Item -ItemType Directory -Path "public" | Out-Null
    Write-Host "Created public directory" -ForegroundColor Green
}

# Copy files to public directory
$copiedCount = 0
foreach ($file in $csvFiles) {
    if (Test-Path $file) {
        Copy-Item $file -Destination "public\$file" -Force
        Write-Host "Copied $file to public/" -ForegroundColor Green
        $copiedCount++
    }
}

Write-Host "`nSetup complete! $copiedCount files copied to public directory." -ForegroundColor Green
Write-Host "You can now run 'npm install' and 'npm run dev' to start the application." -ForegroundColor Cyan

