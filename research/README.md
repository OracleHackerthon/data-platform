# research/ (승연)

EDA와 프롬프트 실험 공간. **배포되지 않는다.**

```powershell
cd research
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
jupyter lab
```

- 실험이 끝난 프롬프트는 `ai/prompts/` 로, 로직은 `ai/` 의 함수로 옮긴다.
- 앱에서 쓸 데이터는 CSV/JSON으로 `research/data/` 에 내보내고, DB 적재는 영진 님과 맞춘다.
- 원본 데이터가 크거나 민감하면 커밋하지 않는다 (`research/data/raw/` 는 gitignore).

## 시연 데이터 다시 만들기 (10/16 ADB 에 적재한 것과 같은 결과)
표준 라이브러리만 쓴다 (위 venv 필요 없음). 난수 시드가 고정이라 다시 돌려도 같은 값이 나온다.

1. UCI SECOM (https://archive.ics.uci.edu/dataset/179/secom) 을 받아 `research/data/raw/secom/` 에 푼다 (`secom.data`, `secom_labels.data`).
2. 원본 살펴보기: `python -I secom_profile.py data/raw/secom` → 1,567행, 590컬럼, 불량 104건, 결측 분포
3. 적재 파일 만들기: `python -I build_seed.py data/raw/secom data/raw/seed`
   - 센서 40개 선택 (상수 컬럼 제외 후 결측 30% 미만에서 불량 상관 상위 32개 + 결측 30% 이상에서 8개). 이유는 `columns.txt`
   - 원본 1,567행, 합성 1,000행 (클래스별 평균·공분산 샘플링), 업체 A/B/C 예측값 (사전 생성. recall A 0.548 / B 0.779 / C 0.423)
   - 메타데이터·업체 시드 (모두 가상 회사), 업체 A·C 시드 제출
4. 적재는 정민이 한다. 순서와 확인 SQL 은 `docs/OCI_RUNBOOK.md` 5-2
