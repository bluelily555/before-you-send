import { Suspense } from "react";
import SocialRiskAnalyzer from "@/components/SocialRiskAnalyzer";

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center text-indigo-400">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🛡️</div>
          <p className="text-sm">로딩 중...</p>
        </div>
      </div>
    }>
      <SocialRiskAnalyzer />
    </Suspense>
  );
}
