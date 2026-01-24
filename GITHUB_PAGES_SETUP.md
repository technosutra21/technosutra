# GitHub Pages Configuration for USDZ Deployment

## Issue
The USDZ files are not accessible at `https://technosutra.bhumisparshaschool.org/test-ios`

## Solution

### 1. Configure GitHub Pages in Repository Settings

Go to: `https://github.com/technosutra21/technosutra/settings/pages`

**Required Settings:**
- **Source**: Deploy from a branch
- **Branch**: Select `gh-pages` 
- **Folder**: `/ (root)`
- **Custom Domain**: `technosutra.bhumisparshaschool.org` (if not already set)

### 2. Ensure gh-pages Branch Exists

The workflow creates and pushes to the `gh-pages` branch. After running the workflow once, the branch should exist.

If it doesn't exist after workflow completion:
1. Go to repository branches: `https://github.com/technosutra21/technosutra/branches`
2. Verify `gh-pages` branch is present
3. If not, manually create it:
   ```bash
   git checkout --orphan gh-pages
   git rm -rf .
   echo "GitHub Pages will be deployed here" > index.html
   git add index.html
   git commit -m "Initial gh-pages branch"
   git push origin gh-pages
   ```

### 3. Wait for Deployment

After configuring GitHub Pages settings:
1. The GitHub Actions workflow needs to run again (push to master)
2. Check workflow logs to verify deployment succeeds
3. Wait 1-2 minutes for GitHub Pages to build and deploy
4. Verify at: `https://technosutra.bhumisparshaschool.org/test-ios`

### 4. Test USDZ Accessibility

Once deployed, verify files are accessible:
- Test root: `https://technosutra.bhumisparshaschool.org/test-ios/`
- Test file: `https://technosutra.bhumisparshaschool.org/test-ios/models/modelo1.usdz`
- Test JSON: `https://technosutra.bhumisparshaschool.org/test-ios/models.json`

### 5. Troubleshooting

**If still getting 404:**

1. **Check Actions tab**
   - Go to https://github.com/technosutra21/technosutra/actions
   - Verify the "GLB to USDZ AR Converter & iOS Test" workflow shows "Deploy to GitHub Pages"
   - Check if deployment step shows any errors

2. **Verify gh-pages branch has content**
   - Go to https://github.com/technosutra21/technosutra/tree/gh-pages
   - Should see `test-ios/` directory with files

3. **Clear GitHub Pages cache**
   - Go to Settings > Pages
   - Uncheck custom domain, save, then re-enable it
   - This forces GitHub to re-deploy

4. **Check DNS for custom domain**
   ```bash
   nslookup technosutra.bhumisparshaschool.org
   # Should resolve to GitHub Pages IP: 185.199.108.153
   ```

## Workflow Details

The GitHub Actions workflow:
1. Converts all GLB models to USDZ format
2. Creates `docs/test-ios/` directory structure
3. Copies USDZ files to `docs/test-ios/models/`
4. Generates `models.json` inventory
5. Creates interactive HTML viewer
6. Uses `peaceiris/actions-gh-pages@v4` to deploy `docs/` to `gh-pages` branch
7. GitHub Pages serves from `gh-pages` branch at `/test-ios/` path

## File Structure on GitHub Pages

```
gh-pages branch (root):
├── test-ios/
│   ├── index.html          (AR viewer)
│   ├── models.json         (inventory)
│   ├── README.md
│   ├── models/
│   │   ├── modelo1.usdz
│   │   ├── modelo2.usdz
│   │   └── ... (61 total)
│   └── .nojekyll           (prevents Jekyll processing)
```

## USDZ URLs After Deployment

Once properly deployed, USDZ files are accessible at:
```
https://technosutra.bhumisparshaschool.org/test-ios/models/modeloN.usdz
```

This URL is used by:
- `ios-ar.html` - Direct iOS AR viewer
- `galeria.html` - Gallery with AR support
- `AR.html` - Main AR experience (redirects iOS users)
