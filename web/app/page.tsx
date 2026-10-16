// 첫 화면은 공장 대시보드다 (docs/PLAN.md B-0 화면 경로). 로그인·기업명 입력 없이 역할 전환으로 시연한다.
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
