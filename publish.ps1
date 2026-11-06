# CET 学习岛 · 一键发布脚本
# 用法：在 _deploy 目录执行  powershell -ExecutionPolicy Bypass -File .\publish.ps1
# 作用：1) 同步最新站点文件到本目录  2) 若已配置 git 远端，自动 add/commit/push
# 不会创建仓库、不会登录、不会改远端地址；缺少条件时只做同步并打印下一步。

param(
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$Deploy = $PSScriptRoot
$Src = Split-Path $Deploy -Parent

if (-not (Test-Path (Join-Path $Src "index.html"))) {
  Write-Host "[错误] 找不到源站 index.html：$Src" -ForegroundColor Red
  Write-Host "        请把本脚本放在站点根目录下的 _deploy 文件夹里再运行。"
  exit 1
}

function Sync-Dir {
  param([string]$From, [string]$To)
  $changed = New-Object System.Collections.ArrayList
  if (-not (Test-Path $To)) { New-Item -ItemType Directory -Path $To -Force | Out-Null }
  foreach ($f in (Get-ChildItem $From -Recurse -File)) {
    $rel = $f.FullName.Substring($From.Length + 1)
    $dst = Join-Path $To $rel
    $dstDir = Split-Path $dst -Parent
    if (-not (Test-Path $dstDir)) { New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }
    $need = $true
    if (Test-Path $dst) {
      $d = Get-Item $dst
      if ($d.Length -eq $f.Length -and $d.LastWriteTimeUtc -eq $f.LastWriteTimeUtc) { $need = $false }
    }
    if ($need) {
      Copy-Item $f.FullName $dst -Force
      [void]$changed.Add($rel)
    }
  }
  # 删除发布目录里源站已不存在的旧文件（仅限传入的子目录内）
  foreach ($d in (Get-ChildItem $To -Recurse -File)) {
    $rel = $d.FullName.Substring($To.Length + 1)
    if (-not (Test-Path (Join-Path $From $rel))) {
      Remove-Item $d.FullName -Force
      [void]$changed.Add($rel)
    }
  }
  return $changed.ToArray()
}

Write-Host "== 同步站点文件 ==" -ForegroundColor Cyan
$changed = @()

$srcIndex = Join-Path $Src "index.html"
$dstIndex = Join-Path $Deploy "index.html"
$needIndex = $true
if (Test-Path $dstIndex) {
  $a = Get-Item $dstIndex
  $b = Get-Item $srcIndex
  if ($a.Length -eq $b.Length -and $a.LastWriteTimeUtc -eq $b.LastWriteTimeUtc) { $needIndex = $false }
}
if ($needIndex) { Copy-Item $srcIndex $dstIndex -Force; $changed += "index.html" }

$changed += @(Sync-Dir (Join-Path $Src "assets\css") (Join-Path $Deploy "assets\css"))
$changed += @(Sync-Dir (Join-Path $Src "assets\js") (Join-Path $Deploy "assets\js"))
$changed += @(Sync-Dir (Join-Path $Src "assets\audio\cet4-2025-12-s1") (Join-Path $Deploy "assets\audio\cet4-2025-12-s1"))

# 只发布被数据引用的 4 个整卷原音
$rootAudio = @("cet4-2025-12-set1.mp3", "cet4-2025-12-set2.mp3", "cet6-2025-12-set1.mp3", "cet6-2025-12-set2.mp3")
foreach ($name in $rootAudio) {
  $s = Join-Path $Src ("assets\audio\" + $name)
  $t = Join-Path $Deploy ("assets\audio\" + $name)
  if (-not (Test-Path $s)) { continue }
  $need = $true
  if (Test-Path $t) {
    $x = Get-Item $t
    $y = Get-Item $s
    if ($x.Length -eq $y.Length -and $x.LastWriteTimeUtc -eq $y.LastWriteTimeUtc) { $need = $false }
  }
  if ($need) { Copy-Item $s $t -Force; $changed += ("assets/audio/" + $name) }
}

if (-not (Test-Path (Join-Path $Deploy ".nojekyll"))) {
  New-Item -ItemType File -Path (Join-Path $Deploy ".nojekyll") -Force | Out-Null
  $changed += ".nojekyll"
}

$gitignore = Join-Path $Deploy ".gitignore"
if (-not (Test-Path $gitignore)) {
  Set-Content -Path $gitignore -Value "*.zip`r`n" -Encoding UTF8
  Write-Host "[提示] 已创建 .gitignore（忽略发布用的 zip，避免误传 96MB）"
}

$audioCount = @($changed | Where-Object { $_ -like "assets/audio/*" }).Count
if ($changed.Count -eq 0) {
  Write-Host "站点文件已是最新：0 个更新。"
} else {
  Write-Host ("同步完成：" + $changed.Count + " 个文件更新，其中音频 " + $audioCount + " 个。")
  $changed | Select-Object -First 10 | ForEach-Object { Write-Host ("  - " + $_) }
  if ($changed.Count -gt 10) { Write-Host ("  … 其余 " + ($changed.Count - 10) + " 个") }
}

# ---------------- git 检查 ----------------
Write-Host ""
Write-Host "== 检查自动发布条件 ==" -ForegroundColor Cyan

# 优先用站点自带的便携版 git（_tools\PortableGit），找不到再回退到 PATH
$PortableGit = Join-Path (Split-Path $Deploy -Parent) "_tools\PortableGit\bin\git.exe"
$GitExe = $null
if (Test-Path $PortableGit) {
  $GitExe = $PortableGit
} else {
  $g = Get-Command git -ErrorAction SilentlyContinue
  if ($g) { $GitExe = $g.Source }
}
if (-not $GitExe) {
  Write-Host "[跳过推送] 没有可用的 git（便携版与 PATH 都没找到），本次只完成同步。" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "下一步（手动上传，二选一）："
  Write-Host "  A. GitHub 网页：仓库 → Add file → Upload files → 把本目录的 index.html 与 assets 拖进去覆盖 → Commit changes"
  Write-Host "  B. Cloudflare Pages：项目 → Create new deployment → 把本目录整体拖进去 → Deploy"
  Write-Host ""
  Write-Host "想以后一键发布：安装 Git（https://git-scm.com/download/win）后，在本目录执行一次："
  Write-Host "  git init"
  Write-Host "  git remote add origin https://github.com/你的用户名/仓库名.git"
  Write-Host "  git add index.html assets .nojekyll"
  Write-Host "  git commit -m `"init`""
  Write-Host "  git push -u origin main"
  Write-Host "之后再运行本脚本即可自动发布。"
  Write-Host ""
  Write-Host "更新后让对方 Ctrl+F5 强制刷新，避免继续看缓存里的旧页面。"
  exit 0
}

Write-Host ("[git] 使用：" + $GitExe)

if (-not (Test-Path (Join-Path $Deploy ".git"))) {
  Write-Host "[跳过推送] 本目录还不是 git 仓库（没有 .git）。" -ForegroundColor Yellow
  Write-Host "同步已完成。要启用一键发布，在本目录执行一次："
  Write-Host "  git init"
  Write-Host "  git remote add origin https://github.com/你的用户名/仓库名.git"
  Write-Host "  git add index.html assets .nojekyll"
  Write-Host "  git commit -m `"init`""
  Write-Host "  git push -u origin main"
  exit 0
}

$remotes = @(& $GitExe -C $Deploy remote 2>$null)
$remote = $remotes | Select-Object -First 1
if (-not $remote) {
  Write-Host "[跳过推送] 仓库没有配置远端。" -ForegroundColor Yellow
  Write-Host "同步已完成。补一条远端地址后即可自动发布："
  Write-Host "  git -C `"$Deploy`" remote add origin https://github.com/你的用户名/仓库名.git"
  exit 0
}

$branch = (& $GitExe -C $Deploy rev-parse --abbrev-ref HEAD 2>$null)
if ($LASTEXITCODE -ne 0 -or -not $branch) { $branch = "main" }

$status = @(& $GitExe -C $Deploy status --porcelain -- index.html assets .nojekyll)
if ($status.Count -eq 0) {
  Write-Host "没有需要提交的站点改动，远端已是最新。"
  exit 0
}

if ($DryRun) {
  Write-Host ("[DryRun] 待提交文件 " + $status.Count + " 个，将推送到 " + $remote + " 的 " + $branch + " 分支。")
  exit 0
}

Write-Host ("准备发布 " + $status.Count + " 个文件（音频 " + $audioCount + " 个）→ " + $remote + " / " + $branch)

& $GitExe -C $Deploy add -- index.html assets .nojekyll | Out-Null
$msg = "site update: " + (Get-Date -Format "yyyy-MM-dd HH:mm")
$commitOut = (& $GitExe -C $Deploy commit -m $msg 2>&1)
if ($LASTEXITCODE -ne 0) {
  Write-Host "[提交失败] git commit 没有成功，原文如下：" -ForegroundColor Yellow
  $commitOut | ForEach-Object { Write-Host ("  " + $_) }
  exit 1
}
$commit = (& $GitExe -C $Deploy rev-parse --short HEAD)

Write-Host "正在推送到远端…"
$pushOut = (& $GitExe -C $Deploy push origin $branch 2>&1)
$pushCode = $LASTEXITCODE
if ($pushCode -ne 0) {
  Write-Host "[推送失败] 常见原因与处理：" -ForegroundColor Yellow
  $pushOut | ForEach-Object { Write-Host ("  " + $_) }
  Write-Host "  1) 没有登录/无权限：GitHub 已不支持密码推送，请用 Personal Access Token（PAT）作为密码；"
  Write-Host "     或安装 GitHub CLI 后执行 gh auth login"
  Write-Host "  2) 网络不通：检查代理后重试"
  Write-Host "  3) 远端有新提交：先 git pull --rebase origin $branch 再运行本脚本"
  exit 1
}

Write-Host ""
Write-Host ("[完成] 已推送 " + $status.Count + " 个文件（音频 " + $audioCount + " 个变化）") -ForegroundColor Green
Write-Host ("       分支：" + $branch + "  提交：" + $commit + "  远端：" + $remote)
Write-Host "       等 1–2 分钟让 Pages 构建完成，对方刷新即可；若仍是旧页面按 Ctrl+F5 强制刷新。"
exit 0
