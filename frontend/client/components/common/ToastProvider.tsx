"use client";

import { ToastContainer } from "./Toast";
import { useToastStore } from "./Toast";

export function ToastProvider() {
  const { toasts, removeToast } = useToastStore();

  return <ToastContainer toasts={toasts} onClose={removeToast} />;
}

