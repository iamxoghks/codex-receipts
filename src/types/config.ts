// Configuration file types

export interface ReceiptConfig {
  version: string;
  location?: string;
  timezone?: string;
  printer?: string;
  locale?: "en" | "ko";
  cashierLabel?: string;
  cashier?: string;
  footerMessage?: string;
}

export const DEFAULT_CONFIG: ReceiptConfig = {
  version: "1.0.0",
};
