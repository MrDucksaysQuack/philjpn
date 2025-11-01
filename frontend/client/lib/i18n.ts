"use client";

import { useMemo } from "react";
import koMessages from "../messages/ko.json";
import enMessages from "../messages/en.json";

type Locale = "ko" | "en";

const messages: Record<Locale, Record<string, any>> = {
  ko: koMessages,
  en: enMessages,
};

export const useTranslation = (locale: Locale = "ko") => {
  const t = useMemo(() => {
    const messageSet = messages[locale] || messages.ko;

    return (key: string, params?: Record<string, string | number>) => {
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
    };
  }, [locale]);

  return { t, locale };
};
