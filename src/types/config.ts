// Configuration file types

export interface ReceiptConfig {
  version: string;
  location?: string;
  timezone?: string;
  printer?: string;
  locale?: "en" | "ko";
}

export const DEFAULT_CONFIG: ReceiptConfig = {
  version: "1.0.0",
};
