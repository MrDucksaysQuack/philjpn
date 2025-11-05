"use client";

import { CheckIcon } from "./icons";

interface Benefit {
  text: string;
}

interface BenefitListProps {
  benefits: Benefit[];
  className?: string;
}

export default function BenefitList({ benefits, className = "" }: BenefitListProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {benefits.map((benefit, index) => (
        <div
          key={index}
          className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-theme-primary hover:shadow-md transition-all duration-300"
        >
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-theme-primary-light text-theme-primary flex items-center justify-center mt-0.5">
            <CheckIcon className="w-4 h-4" />
          </div>
          <p className="text-gray-700 leading-relaxed flex-1">{benefit.text}</p>
        </div>
      ))}
    </div>
  );
}

