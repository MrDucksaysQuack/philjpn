"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";

interface AutocompleteSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  allowCustom?: boolean;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function AutocompleteSelect({
  value,
  onChange,
  options,
  allowCustom = true,
  placeholder = "선택하거나 입력하세요",
  className = "",
  required = false,
}: AutocompleteSelectProps) {
  const [inputValue, setInputValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 입력값 변경 시 옵션 필터링
  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = options.filter((option) =>
        option.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredOptions(filtered);
      setShowSuggestions(filtered.length > 0 || allowCustom);
    } else {
      setFilteredOptions(options);
      setShowSuggestions(options.length > 0);
    }
  }, [inputValue, options, allowCustom]);

  // 외부 클릭 시 제안 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // value 변경 시 inputValue 업데이트
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleSelectOption = (option: string) => {
    setInputValue(option);
    onChange(option);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setShowSuggestions(false);
      inputRef.current?.blur();
    } else if (e.key === "Enter" && filteredOptions.length > 0) {
      e.preventDefault();
      handleSelectOption(filteredOptions[0]);
    }
  };

  const handleBlur = () => {
    // 약간의 지연을 두어 클릭 이벤트가 먼저 처리되도록
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        list={`autocomplete-${Math.random().toString(36).substr(2, 9)}`}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary"
      />

      {/* 자동완성 제안 */}
      {showSuggestions && (filteredOptions.length > 0 || allowCustom) && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectOption(option)}
                className="w-full text-left px-4 py-2 hover:bg-theme-primary-light hover:text-theme-primary transition-colors"
              >
                {option}
              </button>
            ))
          ) : (
            allowCustom && (
              <div className="px-4 py-2 text-sm text-gray-500">
                Enter 키를 눌러 "{inputValue}" 추가
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

