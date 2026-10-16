"""SECOM 프로파일: 행 수, 불량 수, 기간, 컬럼별 결측률 분포 (표준 라이브러리만)."""
import sys
from pathlib import Path

d = Path(sys.argv[1])
rows = [line.split() for line in (d / "secom.data").read_text().splitlines()]
labels = [line.split(" ", 1) for line in (d / "secom_labels.data").read_text().splitlines()]

n, m = len(rows), len(rows[0])
fails = sum(1 for l, _ in labels if l == "1")
dates = [t.strip('"') for _, t in labels]
print(f"rows={n} cols={m} fails={fails} ({fails/n:.3%}) first={dates[0]} last={dates[-1]}")

miss = [sum(1 for r in rows if r[j] == "NaN") / n for j in range(m)]
const = []
for j in range(m):
    vals = {r[j] for r in rows if r[j] != "NaN"}
    if len(vals) <= 1:
        const.append(j)
total_missing = sum(1 for r in rows for v in r if v == "NaN") / (n * m)
print(f"total missing cell rate={total_missing:.3%}, constant cols={len(const)}")
for lo, hi in [(0, 0), (0, 0.05), (0.05, 0.3), (0.3, 0.6), (0.6, 1.01)]:
    cnt = sum(1 for x in miss if (x == 0 if hi == 0 else lo < x <= hi if lo > 0 else 0 < x <= hi))
    print(f"missing in ({lo},{hi}] : {cnt}")
print("rows with no NaN:", sum(1 for r in rows if "NaN" not in r))
hi_miss = sorted([(x, j + 1) for j, x in enumerate(miss) if x >= 0.3], reverse=True)
print("high-missing cols (rate, col#):", [(round(x, 2), j) for x, j in hi_miss[:40]])
