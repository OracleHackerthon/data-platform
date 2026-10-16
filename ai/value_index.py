"""가치평가지수 환산 구간과 계산 로직.

가중치와 환산 구간은 docs/PLAN.md B의 가치평가지수 기준을 따른다.
LLM 판정은 원점수(개수 또는 0~1 비율)로 전달하고, 이 모듈에서
10점 척도로 환산한 뒤 지수를 계산한다.
"""

from __future__ import annotations

from datetime import date
from math import floor, isfinite
from typing import Any, Mapping, Sequence


MAX_SCORE = 10.0
INDEX_MIN = 300
INDEX_MAX = 1000
# The MVP uses a fixed scoring date so an identical request keeps the same score.
SCORING_REFERENCE_DATE = date(2026, 10, 17)

AREAS: tuple[dict[str, Any], ...] = (
    {"key": "content", "label": "콘텐츠 적합성", "weight": 32},
    {"key": "quality", "label": "품질·공급 신뢰성", "weight": 47},
    {"key": "usability", "label": "기술적 사용성", "weight": 9},
    {"key": "economy", "label": "경제성", "weight": 12},
)

# Each element lists its source indicators in the same order used to average them.
ELEMENTS: tuple[dict[str, Any], ...] = (
    {
        "key": "diversity",
        "label": "다양성",
        "area": "content",
        "weight": 11,
        "source": "sql",
    },
    {
        "key": "linkage",
        "label": "연계성",
        "area": "content",
        "weight": 7,
        "source": "llm",
    },
    {
        "key": "clarity",
        "label": "명확성",
        "area": "content",
        "weight": 7,
        "source": "sql",
    },
    {
        "key": "timeliness",
        "label": "적시성",
        "area": "content",
        "weight": 7,
        "source": "meta",
    },
    {
        "key": "physical_quality",
        "label": "물리적 품질",
        "area": "quality",
        "weight": 20,
        "source": "sql",
    },
    {
        "key": "row_sufficiency",
        "label": "건수 충분성",
        "area": "quality",
        "weight": 9,
        "source": "sql",
    },
    {
        "key": "supply_continuity",
        "label": "공급 지속성",
        "area": "quality",
        "weight": 11,
        "source": "meta",
    },
    {
        "key": "provider_reliability",
        "label": "공급자 신뢰도",
        "area": "quality",
        "weight": 7,
        "source": "meta",
    },
    {
        "key": "delivery_convenience",
        "label": "수령방식 편리성",
        "area": "usability",
        "weight": 5,
        "source": "meta",
    },
    {
        "key": "format_openness",
        "label": "확장자 개방성",
        "area": "usability",
        "weight": 4,
        "source": "meta",
    },
    {
        "key": "restrictions",
        "label": "제약성",
        "area": "economy",
        "weight": 6,
        "source": "meta",
    },
    {
        "key": "substitutability",
        "label": "대체가능성",
        "area": "economy",
        "weight": 6,
        "source": "meta",
    },
)


def _number(value: Any) -> float | None:
    if value is None or isinstance(value, bool):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if isfinite(number) else None


def _count_score(value: Any, thresholds: Sequence[tuple[int, float]]) -> float | None:
    number = _number(value)
    if number is None or number < 0:
        return None
    for lower_bound, score in thresholds:
        if number >= lower_bound:
            return score
    return thresholds[-1][1]


def _ratio_score(value: Any) -> float | None:
    ratio = _number(value)
    if ratio is None or not 0 <= ratio <= 1:
        return None
    return round(3 + 7 * ratio, 1)


def _meaningful_column_score(metrics: Mapping[str, Any]) -> float | None:
    meaningful = _number(metrics.get("meaningfulColumnCount"))
    total = _number(metrics.get("columnCount"))
    if meaningful is None or total is None or total <= 0 or meaningful < 0:
        return None
    ratio = min(meaningful / total, 1.0)
    thresholds = (
        (0.95, 10.0),
        (0.90, 9.0),
        (0.80, 8.0),
        (0.70, 7.0),
        (0.60, 6.0),
        (0.50, 5.0),
        (0.40, 4.0),
        (0.00, 3.0),
    )
    for lower_bound, score in thresholds:
        if ratio >= lower_bound:
            return score
    return 3.0


def _category_count_score(value: Any) -> float | None:
    count = _number(value)
    if count is None or count < 0:
        return None
    if count >= 5:
        return 10.0
    return {0: 3.0, 1: 3.0, 2: 5.0, 3: 7.0, 4: 8.0}.get(int(count))


def _linkage_count_score(value: Any) -> float | None:
    count = _number(value)
    if count is None or count < 0:
        return None
    if count >= 3:
        return 10.0
    return {0: 3.0, 1: 5.0, 2: 7.0}.get(int(count))


def _consistency_score(value: Any) -> float | None:
    ratio = _number(value)
    if ratio is None or not 0 <= ratio <= 1:
        return None
    thresholds = (
        (0.99, 10.0),
        (0.97, 9.0),
        (0.95, 8.0),
        (0.90, 7.0),
        (0.85, 6.0),
        (0.80, 5.0),
        (0.70, 4.0),
        (0.00, 3.0),
    )
    for lower_bound, score in thresholds:
        if ratio >= lower_bound:
            return score
    return 3.0


def _created_on_score(value: Any, reference_date: date) -> float | None:
    if not value:
        return None
    try:
        created_on = date.fromisoformat(str(value)[:10])
    except ValueError:
        return None
    age_years = max((reference_date - created_on).days, 0) / 365.2425
    if age_years <= 1:
        return 10.0
    if age_years <= 2:
        return 8.0
    if age_years <= 3:
        return 6.0
    if age_years <= 5:
        return 4.0
    return 3.0


def _cycle_score(value: Any) -> float | None:
    if value is None:
        return None
    cycle = str(value).strip().lower()
    if not cycle:
        return None
    if any(token in cycle for token in ("1회성", "불규칙", "주기없음", "주기 없음")):
        return 3.0
    if "분기" in cycle:
        return 6.0
    if "실시간" in cycle or any(token in cycle for token in ("초", "분", "시간", "시 단위")):
        return 10.0
    if "일" in cycle:
        return 9.0
    if "주" in cycle:
        return 8.0
    if "월" in cycle:
        return 7.0
    if "반기" in cycle:
        return 5.0
    if "년" in cycle or "연간" in cycle:
        return 4.0
    return None


def _credit_grade_score(value: Any) -> float | None:
    if value is None:
        return None
    grade = str(value).strip().upper().replace(" ", "")
    return {
        "AAA": 10.0,
        "AA": 9.0,
        "A": 8.0,
        "BBB": 7.0,
        "BB": 6.0,
        "B": 5.0,
        "CCC": 3.0,
        "CC": 3.0,
        "C": 3.0,
        "D": 3.0,
        "": 3.0,
    }.get(grade, 3.0)


def _quality_cert_score(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"true", "yes", "y", "있음", "인증"}:
            return 10.0
        if normalized in {"false", "no", "n", "없음", "미인증"}:
            return 3.0
        return None
    return 10.0 if value is True else 3.0 if value is False else None


def _delivery_score(value: Any) -> float | None:
    if value is None:
        return None
    method = str(value).strip().lower()
    if "api" in method or "격리 환경" in method:
        return 9.0
    if "다운로드" in method or "파일" in method:
        return 8.0
    if "오프라인" in method or "매체" in method:
        return 5.0
    return None


def _format_score(value: Any) -> float | None:
    if value is None:
        return None
    file_format = str(value).strip().lower().lstrip(".")
    stages = {
        "1단계": 3.0,
        "2단계": 5.0,
        "3단계": 7.0,
        "4단계": 9.0,
        "5단계": 10.0,
        "csv": 7.0,
        "json": 7.0,
    }
    if file_format in stages:
        return stages[file_format]
    for stage, score in (("5단계", 10.0), ("4단계", 9.0), ("3단계", 7.0), ("2단계", 5.0), ("1단계", 3.0)):
        if stage in file_format:
            return score
    return None


def _mean(scores: Sequence[float | None]) -> float | None:
    available = [score for score in scores if score is not None]
    if not available:
        return None
    return round(sum(available) / len(available), 1)


def _adjusted_weights(active_elements: Sequence[Mapping[str, Any]]) -> dict[str, float]:
    """Normalize weights to one decimal place while keeping their sum at 100."""
    if not active_elements:
        return {}
    active_weight = sum(element["weight"] for element in active_elements)
    exact = {
        element["key"]: element["weight"] * 100 / active_weight
        for element in active_elements
    }
    weights = {key: floor(value * 10 + 1e-9) / 10 for key, value in exact.items()}
    tenths_left = int(round((100 - sum(weights.values())) * 10))
    by_largest_remainder = sorted(
        exact,
        key=lambda key: exact[key] - weights[key],
        reverse=True,
    )
    for key in by_largest_remainder[:tenths_left]:
        weights[key] = round(weights[key] + 0.1, 1)
    return weights


def _element_scores(
    metrics: Mapping[str, Any],
    meta: Mapping[str, Any],
    llm_assessment: Mapping[str, Any],
    reference_date: date,
) -> dict[str, float | None]:
    return {
        "diversity": _mean(
            (
                _meaningful_column_score(metrics),
                _category_count_score(llm_assessment.get("infoCategoryCount")),
            )
        ),
        "linkage": _linkage_count_score(llm_assessment.get("standardLinkageKeyCount")),
        "clarity": _mean(
            (
                _ratio_score(metrics.get("absoluteScaleRatio")),
                _ratio_score(llm_assessment.get("continuousNameClarity")),
                _ratio_score(llm_assessment.get("categoryValueClarity")),
            )
        ),
        "timeliness": _mean(
            (
                _created_on_score(meta.get("createdOn"), reference_date),
                _cycle_score(meta.get("supplyCycle")),
                _cycle_score(meta.get("aggregationCycle")),
            )
        ),
        "physical_quality": _consistency_score(metrics.get("consistencyRate")),
        "row_sufficiency": _count_score(
            metrics.get("validRowCount"),
            (
                (100_000, 10.0),
                (50_000, 9.0),
                (10_000, 8.0),
                (5_000, 7.0),
                (1_000, 6.0),
                (500, 5.0),
                (100, 4.0),
                (0, 3.0),
            ),
        ),
        # Sales history is not available in this MVP.
        "supply_continuity": None,
        "provider_reliability": _mean(
            (
                _credit_grade_score(meta.get("creditGrade")),
                _quality_cert_score(meta.get("qualityCert")),
            )
        ),
        "delivery_convenience": _delivery_score(meta.get("deliveryMethod")),
        "format_openness": _format_score(meta.get("fileFormat")),
        # License and comparable-product catalog data are not available in this MVP.
        "restrictions": None,
        "substitutability": None,
    }


def calculate_value_index(
    metrics: Mapping[str, Any],
    meta: Mapping[str, Any],
    llm_assessment: Mapping[str, Any],
    improvement_texts: Mapping[str, str] | None = None,
    reference_date: date | None = None,
) -> dict[str, Any]:
    """Calculate the weighted index and contract-shaped breakdown.

    ``llm_assessment`` expects ``infoCategoryCount``,
    ``standardLinkageKeyCount``, ``continuousNameClarity`` and
    ``categoryValueClarity``. The two clarity values are ratios from 0 to 1.
    ``improvement_texts`` maps element keys to LLM-written suggestion text.

    ``reference_date`` overrides the fixed MVP scoring date when a caller has
    an explicitly versioned assessment date.
    """
    evaluated_on = reference_date or SCORING_REFERENCE_DATE
    scores = _element_scores(metrics, meta, llm_assessment, evaluated_on)
    active_elements = [element for element in ELEMENTS if scores[element["key"]] is not None]
    adjusted_weights = _adjusted_weights(active_elements)

    element_results: list[dict[str, Any]] = []
    for element in ELEMENTS:
        score = scores[element["key"]]
        adjusted_weight = adjusted_weights.get(element["key"])
        element_results.append(
            {
                "key": element["key"],
                "label": element["label"],
                "area": element["area"],
                "weight": element["weight"],
                "adjustedWeight": round(adjusted_weight, 1) if adjusted_weight is not None else None,
                "score": score,
                "source": element["source"],
            }
        )

    area_results: list[dict[str, Any]] = []
    for area in AREAS:
        area_elements = [
            element
            for element in ELEMENTS
            if element["area"] == area["key"] and scores[element["key"]] is not None
        ]
        area_score = None
        if area_elements:
            area_weight = sum(element["weight"] for element in area_elements)
            area_score = round(
                sum(scores[element["key"]] * element["weight"] for element in area_elements)
                / area_weight,
                1,
            )
        area_results.append({**area, "score": area_score})

    total_score = None
    if adjusted_weights:
        weighted_score = sum(
            scores[element["key"]] * adjusted_weights[element["key"]]
            for element in ELEMENTS
            if scores[element["key"]] is not None
        )
        total_score = round(weighted_score)

    suggestions: list[dict[str, Any]] = []
    texts = improvement_texts or {}
    candidates = [element for element in ELEMENTS if scores[element["key"]] is not None]
    candidates.sort(key=lambda element: (scores[element["key"]], element["weight"]))
    for element in candidates:
        text = texts.get(element["key"])
        if not text:
            continue
        key = element["key"]
        gain = round((MAX_SCORE - scores[key]) * adjusted_weights[key])
        suggestions.append(
            {
                "element": key,
                "label": element["label"],
                "text": text,
                "expectedGain": gain,
            }
        )
        if len(suggestions) == 3:
            break

    return {
        "score": total_score,
        "min": INDEX_MIN,
        "max": INDEX_MAX,
        "areas": area_results,
        "elements": element_results,
        "suggestions": suggestions,
    }
