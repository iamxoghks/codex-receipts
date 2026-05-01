import type { ReceiptData } from "../core/receipt-generator.js";

export function getPrinterLocaleWarning(data: ReceiptData): string | undefined {
  if (data.config.locale !== "ko") return undefined;

  return "Korean printer output requires a printer/driver that supports UTF-8 or a Korean code page. If the printed text is garbled, use HTML output or configure the printer's Korean text support.";
}
