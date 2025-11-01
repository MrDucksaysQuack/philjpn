"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ToastProvider } from "@/components/common/ToastProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1분
            refetchOnWindowFocus: false,
            retry: 1,
            onError: (error: any) => {
              // 전역 에러 처리 (네트워크 에러 등만 처리, 특정 쿼리의 에러는 각 컴포넌트에서 처리)
              if (error?.code === "ERR_NETWORK" || error?.response?.status >= 500) {
                import("@/lib/messages").then(({ getContextualError }) => {
                  const contextualError = getContextualError(error);
                  import("@/components/common/Toast").then(({ toast }) => {
                    toast.error(contextualError.message);
                  });
                });
              }
            },
          },
          mutations: {
            onError: (error: any) => {
              // 전역 에러 처리 (맥락 기반 메시지)
              import("@/lib/messages").then(({ getContextualError }) => {
                const contextualError = getContextualError(error);
                import("@/components/common/Toast").then(({ toast }) => {
                  toast.error(contextualError.message);
                });
              });
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ToastProvider />
    </QueryClientProvider>
  );
}
