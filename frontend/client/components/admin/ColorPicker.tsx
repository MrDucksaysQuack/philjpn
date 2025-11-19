"use client";

import { useState, useRef, useEffect } from "react";
import { ColorHarmonyService, ColorValidationResult, ColorImportance } from "@/lib/color-harmony";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  importance?: ColorImportance;
  criticalColors?: {
    primary?: string;
    background?: string;
    textPrimary?: string;
  };
  validateAgainst?: string; // 대비 검증을 위한 배경 색상
  showValidation?: boolean;
  suggestions?: string[]; // 조화 색상 제안
}

export default function ColorPicker({
  label,
  value,
  onChange,
  importance,
  criticalColors,
  validateAgainst,
  showValidation = true,
  suggestions = [],
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [validation, setValidation] = useState<ColorValidationResult | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // 색상 검증
  useEffect(() => {
    if (showValidation && value && validateAgainst) {
      const result = ColorHarmonyService.validateColorCombination(value, validateAgainst);
      setValidation(result);
    }
  }, [value, validateAgainst, showValidation]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
  };

  const getValidationBadge = () => {
    if (!validation) return null;

    const badgeClass = {
      AAA: "bg-green-100 text-green-800 border-green-300",
      AA: "bg-blue-100 text-blue-800 border-blue-300",
      FAIL: "bg-red-100 text-red-800 border-red-300",
    }[validation.level];

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded border ${badgeClass}`}>
        {validation.level} ({validation.contrastRatio.toFixed(2)}:1)
      </span>
    );
  };

  return (
    <div className="space-y-2" ref={pickerRef}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {importance && (
          <span className={`ml-2 px-2 py-0.5 text-xs rounded ${
            importance === ColorImportance.CRITICAL ? "bg-red-100 text-red-800" :
            importance === ColorImportance.HIGH ? "bg-orange-100 text-orange-800" :
            importance === ColorImportance.MEDIUM ? "bg-yellow-100 text-yellow-800" :
            "bg-gray-100 text-gray-800"
          }`}>
            {importance === ColorImportance.CRITICAL ? "최우선" :
             importance === ColorImportance.HIGH ? "높음" :
             importance === ColorImportance.MEDIUM ? "중간" : "낮음"}
          </span>
        )}
      </label>

      <div className="flex items-center gap-3">
        {/* 색상 미리보기 */}
        <div
          className="w-16 h-16 rounded-lg border-2 border-gray-300 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
          style={{ backgroundColor: value || "#ffffff" }}
          onClick={() => setIsOpen(!isOpen)}
        />

        {/* 색상 입력 */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={value || "#ffffff"}
              onChange={handleColorChange}
              className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={value || ""}
              onChange={(e) => {
                const hex = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
                if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                  onChange(hex);
                } else {
                  onChange(e.target.value);
                }
              }}
              placeholder="#000000"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent"
            />
          </div>

          {/* 검증 결과 */}
          {showValidation && validation && (
            <div className="mt-2 flex items-center gap-2">
              {getValidationBadge()}
              {validation.warnings.length > 0 && (
                <span className="text-xs text-red-600">{validation.warnings[0]}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 조화 색상 제안 */}
      {suggestions.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 mb-1">조화 색상 제안:</p>
          <div className="flex gap-2 flex-wrap">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-8 h-8 rounded border-2 border-gray-300 hover:border-theme-primary transition-colors shadow-sm hover:shadow-md"
                style={{ backgroundColor: suggestion }}
                title={suggestion}
              />
            ))}
          </div>
        </div>
      )}

      {/* 자동 수정 제안 */}
      {validation && !validation.isValid && validation.suggestions && validation.suggestions.length > 0 && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800 mb-1">자동 수정 제안:</p>
          <div className="flex gap-2">
            {validation.suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onChange(suggestion)}
                className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors"
              >
                {suggestion} 적용
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

