// 첫 화면은 공장 대시보드다 (docs/PLAN.md B-0 화면 경로). 10/16 연결 확인용 샘플 화면을 지우고 이동만 남겼다.
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
