# Deploy script - Add, Commit and Push
# Usage: .\deploy.ps1

Write-Host "🚀 Starting deployment process..." -ForegroundColor Green

# Add all changes
Write-Host "📁 Adding all files..." -ForegroundColor Yellow
git add .

# Check if there are changes to commit
$status = git status --porcelain
if (-not $status) {
    Write-Host "✅ No changes to commit." -ForegroundColor Green
    exit 0
}

# Show what will be committed
Write-Host "📝 Files to be committed:" -ForegroundColor Cyan
git status --short

# Commit with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$commitMessage = "Update: $timestamp"

Write-Host "💾 Committing changes..." -ForegroundColor Yellow
git commit -m $commitMessage

# Check if commit was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit successful!" -ForegroundColor Green
    
    # Push to remote
    Write-Host "🌐 Pushing to remote..." -ForegroundColor Yellow
    git push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "🎉 Deploy completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Push failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Commit failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✨ All done!" -ForegroundColor Green
