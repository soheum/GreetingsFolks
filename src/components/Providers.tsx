"use client";

import type { ReactNode } from "react";
import { LocaleProvider } from "@/lib/locale";

export function Providers({ children }: { children: ReactNode }) {
  return <LocaleProvider>{children}</LocaleProvider>;
}
