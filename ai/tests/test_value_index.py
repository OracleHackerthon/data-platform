import unittest
from datetime import date

from ai.value_index import (
    _category_count_score,
    _consistency_score,
    _count_score,
    _cycle_score,
    _linkage_count_score,
    _meaningful_column_score,
    _ratio_score,
    calculate_value_index,
)


class ValueIndexScoringTests(unittest.TestCase):
    def test_seed_data_matches_plan(self):
        metrics = {
            "columnCount": 40,
            "meaningfulColumnCount": 32,
            "absoluteScaleRatio": 1.0,
            "consistencyRate": 0.854,
            "validRowCount": 1,
        }
        meta = {
            "createdOn": "2008-10-17",
            "supplyCycle": "비정기 (1회 제공)",
            "aggregationCycle": "주기없음 (웨이퍼 단위 발생)",
            "creditGrade": "BB",
            "qualityCert": False,
            "deliveryMethod": "격리 환경 접속",
            "fileFormat": "csv",
        }
        llm_assessment = {
            "infoCategoryCount": 3,
            "standardLinkageKeyCount": 1,
            "continuousNameClarity": 0,
            "categoryValueClarity": 0,
        }
        improvement_texts = {
            "physical_quality": "결측 센서를 다시 수집하세요.",
            "row_sufficiency": "결측 센서를 다시 수집해 유효 행 수를 늘리세요.",
            "timeliness": "정기적인 데이터 제공 주기를 마련하세요.",
        }

        result = calculate_value_index(metrics, meta, llm_assessment, improvement_texts)

        self.assertEqual(result["score"], 555)
        self.assertEqual(
            {area["key"]: area["score"] for area in result["areas"]},
            {"content": 5.5, "quality": 5.0, "usability": 8.1, "economy": None},
        )
        elements = {element["key"]: element for element in result["elements"]}
        self.assertEqual(elements["diversity"]["score"], 7.5)
        self.assertEqual(elements["linkage"]["score"], 5.0)
        self.assertEqual(elements["clarity"]["score"], 5.3)
        self.assertEqual(elements["timeliness"]["score"], 3.0)
        self.assertEqual(elements["physical_quality"]["score"], 6.0)
        self.assertEqual(elements["row_sufficiency"]["score"], 3.0)
        self.assertEqual(elements["provider_reliability"]["score"], 4.5)
        self.assertIsNone(elements["supply_continuity"]["score"])
        self.assertIsNone(elements["restrictions"]["score"])
        self.assertIsNone(elements["substitutability"]["score"])

        self.assertEqual(
            {item["element"]: item["expectedGain"] for item in result["suggestions"]},
            {"row_sufficiency": 82, "timeliness": 64, "physical_quality": 104},
        )
        self.assertAlmostEqual(
            sum(element["adjustedWeight"] or 0 for element in result["elements"]), 100.0, places=1
        )

    def test_plan_conversion_boundaries(self):
        self.assertEqual(
            [_meaningful_column_score({"meaningfulColumnCount": count, "columnCount": 40}) for count in (40, 38, 36, 32, 28, 24, 20, 16, 15)],
            [10, 10, 9, 8, 7, 6, 5, 4, 3],
        )
        self.assertEqual([_category_count_score(count) for count in range(1, 6)], [3, 5, 7, 8, 10])
        self.assertEqual([_linkage_count_score(count) for count in range(4)], [3, 5, 7, 10])
        self.assertEqual([_ratio_score(ratio) for ratio in (0, 0.5, 1)], [3, 6.5, 10])
        self.assertEqual(
            [_consistency_score(ratio) for ratio in (0.99, 0.97, 0.95, 0.90, 0.85, 0.80, 0.70, 0.69)],
            [10, 9, 8, 7, 6, 5, 4, 3],
        )
        self.assertEqual(
            [
                _count_score(count, ((1000, 6), (500, 5), (100, 4), (0, 3)))
                for count in (1000, 999, 500, 100, 99)
            ],
            [6, 5, 5, 4, 3],
        )

    def test_cycle_matching_handles_daily_and_quarterly_periods(self):
        self.assertEqual(_cycle_score("일 1회"), 9.0)
        self.assertEqual(_cycle_score("분기 1회"), 6.0)
        self.assertEqual(_cycle_score("주기없음 (웨이퍼 단위 발생)"), 3.0)

    def test_same_input_is_deterministic(self):
        args = (
            {"columnCount": 40, "meaningfulColumnCount": 32, "consistencyRate": 0.854, "validRowCount": 1},
            {"createdOn": "2008-10-17", "supplyCycle": "비정기", "aggregationCycle": "주기없음"},
            {"infoCategoryCount": 3, "standardLinkageKeyCount": 1},
        )
        first = calculate_value_index(*args)
        second = calculate_value_index(*args)
        self.assertEqual(first, second)

    def test_reference_date_can_be_overridden(self):
        metrics = {"columnCount": 1, "meaningfulColumnCount": 1}
        recent_meta = {"createdOn": "2025-10-17"}
        result = calculate_value_index(
            metrics,
            recent_meta,
            {},
            reference_date=date(2026, 10, 17),
        )
        timeliness = next(item for item in result["elements"] if item["key"] == "timeliness")
        self.assertEqual(timeliness["score"], 10.0)


if __name__ == "__main__":
    unittest.main()
