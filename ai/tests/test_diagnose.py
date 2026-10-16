import json
import sys
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

from fastapi.exceptions import RequestValidationError
from starlette.requests import Request

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from main import DiagnoseIn, diagnose, validation_error_handler


class DiagnoseEndpointTests(unittest.IsolatedAsyncioTestCase):
    @patch("main.ask", new_callable=AsyncMock)
    async def test_diagnose_combines_llm_content_with_python_index(self, ask_mock):
        llm_response = json.dumps(
            {
                "infoCategoryCount": 3,
                "standardLinkageKeyCount": 1,
                "continuousNameClarity": 0,
                "categoryValueClarity": 0,
                "report": "결측이 있어 일부 센서의 품질 개선이 필요합니다.",
                "taskCard": {
                    "title": "공정 불량 예측",
                    "problem": "불량 제품을 조기에 찾아야 합니다.",
                    "metric": "불량 검출률(recall)",
                    "dataNeeded": "공정 센서와 정상·불량 라벨",
                },
                "improvementTexts": {
                    "diversity": "의미 있는 컬럼을 더 확보하세요.",
                    "linkage": "표준 연계키를 추가하세요.",
                    "clarity": "컬럼명과 범주 기준을 설명하세요.",
                    "timeliness": "정기적으로 데이터를 제공하세요.",
                    "physical_quality": "센서 결측을 줄이세요.",
                    "row_sufficiency": "유효한 행을 더 확보하세요.",
                    "provider_reliability": "품질 인증 정보를 보완하세요.",
                    "delivery_convenience": "사용하기 쉬운 수령 방식을 제공하세요.",
                    "format_openness": "개방형 파일 형식을 제공하세요.",
                },
            },
            ensure_ascii=False,
        )
        ask_mock.return_value = f"```json\n{llm_response}\n```"
        body = DiagnoseIn(
            metrics={
                "columnCount": 40,
                "meaningfulColumnCount": 32,
                "absoluteScaleRatio": 1,
                "consistencyRate": 0.854,
                "validRowCount": 1,
            },
            meta={
                "createdOn": "2008-10-17",
                "supplyCycle": "비정기 (1회 제공)",
                "aggregationCycle": "주기없음 (웨이퍼 단위 발생)",
                "creditGrade": "BB",
                "qualityCert": False,
                "deliveryMethod": "격리 환경 접속",
                "fileFormat": "csv",
            },
            columns=[{"name": "s_001", "type": "number"}],
        )

        result = await diagnose(body)

        ask_mock.assert_awaited_once()
        self.assertEqual(result["ok"], True)
        self.assertEqual(result["data"]["valueIndex"]["score"], 555)
        self.assertEqual(result["data"]["report"], "결측이 있어 일부 센서의 품질 개선이 필요합니다.")
        self.assertEqual(result["data"]["taskCard"]["metric"], "불량 검출률(recall)")
        self.assertEqual(len(result["data"]["valueIndex"]["suggestions"]), 3)

    @patch("main.ask", new_callable=AsyncMock)
    async def test_diagnose_rejects_invalid_llm_json(self, ask_mock):
        ask_mock.return_value = "not json"
        body = DiagnoseIn(metrics={}, meta={}, columns=[])

        with self.assertLogs("ai", level="ERROR"):
            result = await diagnose(body)

        self.assertEqual(result, {"ok": False, "error": "진단 생성 실패 (ai 서비스 로그 확인)"})

    async def test_invalid_request_uses_standard_error_envelope(self):
        request = Request({"type": "http", "method": "POST", "path": "/diagnose", "headers": []})

        response = await validation_error_handler(request, RequestValidationError([]))

        self.assertEqual(response.status_code, 422)
        self.assertEqual(
            json.loads(response.body),
            {"ok": False, "error": "진단 요청 형식이 올바르지 않습니다"},
        )


if __name__ == "__main__":
    unittest.main()
