#!/usr/bin/env bash
# 部署前把 index.html 里所有缓存版本号统一改成指定版本（只在 CI 工作区改，不提交回仓库）。
# 用法:
#   bash scripts/stamp-version.sh                # 版本 = git 短 SHA（无 git 时用 UTC 时间戳）
#   VERSION=abc1234 bash scripts/stamp-version.sh
#   TARGET=index.html bash scripts/stamp-version.sh
#   bash scripts/stamp-version.sh --dry-run      # 只打印，不写文件
set -euo pipefail

TARGET="${TARGET:-index.html}"
DRY_RUN=0

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    -h|--help)
      sed -n '2,7p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    -*) echo "ERROR: 未知参数 $arg" >&2; exit 2 ;;
    *)  TARGET="$arg" ;;
  esac
done

[ -f "$TARGET" ] || { echo "ERROR: 找不到 $TARGET" >&2; exit 1; }

if [ -z "${VERSION:-}" ]; then
  if command -v git >/dev/null 2>&1 && git rev-parse --short=7 HEAD >/dev/null 2>&1; then
    VERSION="$(git rev-parse --short=7 HEAD)"
  else
    VERSION="$(date -u +%Y%m%d%H%M%S)"
  fi
fi

# 版本号只允许安全字符，避免把引号/空格注入 HTML 属性
case "$VERSION" in
  *[!A-Za-z0-9._-]*) echo "ERROR: VERSION 含非法字符: $VERSION" >&2; exit 1 ;;
esac
[ -n "$VERSION" ] || { echo "ERROR: VERSION 为空" >&2; exit 1; }

python3 - "$TARGET" "$VERSION" "$DRY_RUN" <<'PY_EOF'
import re
import sys

target, version, dry = sys.argv[1], sys.argv[2], sys.argv[3] == "1"

# newline="" 保证 CRLF/LF 原样保留，避免整文件换行被改写
with open(target, encoding="utf-8", newline="") as f:
    src = f.read()

# 只替换「版本号值」这一段，路径与分隔符原样保留，最小化改动面。
# 组1: 资源路径 + ?v= 或 &v=（v= 与 ver= 都支持）
# 组2: 旧版本号值（到 & # 引号 空白 > 为止）
PATTERN = re.compile(
    r"(?<![\w/.\-=])"
    r"(\.{0,2}/?[A-Za-z0-9_@%+.,/\\-]+?\.(?:js|css|mjs)[?&]v(?:er)?=)"
    r"([^\s\"'&#>]*)",
    re.IGNORECASE,
)

hits = []


def repl(m):
    path, old = m.group(1), m.group(2)
    if re.match(r"^(?:https?:)?//", path):   # 站外 CDN 链接不动
        return m.group(0)
    hits.append((path + old, path + version))
    return path + version


out = PATTERN.sub(repl, src)

print(f"==> 目标文件 : {target}")
print(f"==> 版本号   : {version}")
print(f"==> 重写引用 : {len(hits)} 处")
for old, new in hits:
    print(f"    {old}  ->  {new}")

if not hits:
    print("==> 警告: 没有匹配到任何 ?v= 引用", file=sys.stderr)

# cetBoot 的 data-version 是 loader.js 懒加载视图脚本/大数据文件时的缓存版本号，
# 必须跟着一起更新，否则 listening.js 等懒加载脚本会一直用旧版本号命中浏览器缓存。
BOOT = re.compile(r'(id="cetBoot"[^>]*\bdata-version=")([^"]*)(")')
boot_hits = BOOT.findall(out)
out, boot_n = BOOT.subn(lambda m: m.group(1) + version + m.group(3), out)
print(f"==> cetBoot data-version 重写: {boot_n} 处")

# 自检: 原本带版本号的站内 js/css 引用，必须全部变成新版本
HREF = re.compile(r"""(?:href|src)\s*=\s*["']([^"']*)["']""", re.IGNORECASE)
bad = []
for ref in HREF.findall(out):
    if re.match(r"^(?:https?:)?//", ref):
        continue
    if not re.search(r"\.(?:js|css|mjs)", ref, re.IGNORECASE):
        continue
    if not re.search(r"[?&]v(?:er)?=", ref, re.IGNORECASE):
        continue
    if not re.search(rf"[?&]v(?:er)?={re.escape(version)}(?:&|#|$)", ref, re.IGNORECASE):
        bad.append(ref)

if bad:
    print("==> 错误: 以下站内 js/css 引用的版本号未更新:", file=sys.stderr)
    for b in bad:
        print(f"    {b}", file=sys.stderr)
    sys.exit(1)

if dry:
    print("==> --dry-run: 未写入文件")
    sys.exit(0)

if out == src:
    print("==> 内容无变化")
    sys.exit(0)

with open(target, "w", encoding="utf-8", newline="") as f:
    f.write(out)
print("==> 已写入")
PY_EOF

echo "==> 完成"
