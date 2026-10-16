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
