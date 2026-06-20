"use client";

import { RiskCategory } from "@/types";

interface CategoryCardProps {
  category: RiskCategory;
}

function scoreColor(score: number) {
  if (score < 30) return { bar: "bg-green-500", text: "text-green-600" };
  if (score < 60) return { bar: "bg-yellow-400", text: "text-yellow-600" };
  if (score < 80) return { bar: "bg-orange-500", text: "text-orange-600" };
  return { bar: "bg-red-600", text: "text-red-600" };
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const { bar, text } = scoreColor(category.score);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-gray-700 text-sm">
          {category.name}
        </span>
        <span className={`font-bold text-sm ${text}`}>{category.score}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full ${bar} transition-all duration-700`}
          style={{ width: `${category.score}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">{category.description}</p>
    </div>
  );
}
