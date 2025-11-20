"use client";

import { useCallback } from "react";
import koMessages from "../messages/ko.json";
import enMessages from "../messages/en.json";
import jaMessages from "../messages/ja.json";

type Locale = "ko" | "en" | "ja";

const messages: Record<Locale, Record<string, any>> = {
  ko: koMessages,
  en: enMessages,
  ja: jaMessages,
};

export const useTranslation = (locale: Locale = "ko") => {
  // locale을 직접 의존성으로 사용하여 안정적인 참조 보장
  // messageSet은 locale에 따라 결정되므로 locale을 의존성으로 사용
  const messageSet = messages[locale] || messages.ko;

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const keys = key.split(".");
      let value: any = messageSet;

      for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
          value = value[k];
        } else {
          return key; // 키를 찾을 수 없으면 원래 키 반환
        }
      }

      if (typeof value !== "string") {
        return key;
      }

      // 파라미터 치환
      if (params) {
        return Object.entries(params).reduce(
          (str, [paramKey, paramValue]) =>
            str.replace(`{${paramKey}}`, String(paramValue)),
          value,
        );
      }

      return value;
    },
    [locale], // messageSet 대신 locale을 직접 의존성으로 사용하여 안정적인 참조 보장
  );

  return { t, locale };
};
