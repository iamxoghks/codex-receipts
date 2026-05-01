import { mkdir, writeFile } from "fs/promises";
import { dirname, join, resolve } from "path";
import { DataFetcher } from "./data-fetcher.js";
import { TranscriptParser } from "./transcript-parser.js";
import { ReceiptGenerator } from "./receipt-generator.js";
import { HtmlRenderer } from "./html-renderer.js";
import { ConfigManager } from "./config-manager.js";
import { ThermalPrinterRenderer } from "./thermal-printer.js";
import { LocationDetector } from "../utils/location.js";
import type { ReceiptData } from "./receipt-generator.js";

export interface GenerateReceiptRequest {
  session?: string;
  location?: string;
  saveHtml?: boolean;
  printer?: string;
  locale?: "en" | "ko";
}

export interface GenerateReceiptResult {
  receiptData: ReceiptData;
  receipt: string;
  htmlPath?: string;
  printer?: {
    attempted: boolean;
    interface?: string;
    ok: boolean;
    error?: string;
  };
}

export class ReceiptService {
  private dataFetcher = new DataFetcher();
  private transcriptParser = new TranscriptParser();
  private receiptGenerator = new ReceiptGenerator();
  private htmlRenderer = new HtmlRenderer();
  private thermalPrinter = new ThermalPrinterRenderer();
  private configManager = new ConfigManager();
  private locationDetector = new LocationDetector();

  async generateReceipt(
    request: GenerateReceiptRequest = {},
  ): Promise<GenerateReceiptResult> {
    const config = await this.configManager.loadConfig();
    const sessionData = await this.dataFetcher.fetchSessionData(request.session);

    if (!sessionData.projectPath) {
      throw new Error("Cannot determine Codex session path.");
    }

    const transcriptData = await this.transcriptParser.parseTranscript(
      sessionData.projectPath,
    );
    const location =
      request.location || (await this.locationDetector.getLocation(config));
    const receiptData = {
      sessionData,
      transcriptData,
      location,
      config: { ...config, locale: request.locale || config.locale },
    };
    const receipt = this.receiptGenerator.generateReceipt(receiptData);

    const result: GenerateReceiptResult = { receiptData, receipt };

    if (request.saveHtml) {
      result.htmlPath = await this.saveHtmlReceipt(receiptData, receipt);
    }

    if (request.printer) {
      result.printer = await this.printReceipt(receiptData, request.printer);
    }

    return result;
  }

  private async printReceipt(
    receiptData: ReceiptData,
    printerInterface: string,
  ): Promise<NonNullable<GenerateReceiptResult["printer"]>> {
    try {
      await this.thermalPrinter.printReceipt(receiptData, printerInterface);
      return {
        attempted: true,
        interface: printerInterface,
        ok: true,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown printer error";
      return {
        attempted: true,
        interface: printerInterface,
        ok: false,
        error: message,
      };
    }
  }

  private async saveHtmlReceipt(
    receiptData: ReceiptData,
    receipt: string,
  ): Promise<string> {
    const home = process.env.HOME || process.env.USERPROFILE || "";
    const fileName =
      receiptData.transcriptData.sessionSlug ||
      receiptData.sessionData.sessionId;
    const outputPath = resolve(
      join(home, ".codex-receipts", "projects", `${fileName}.html`),
    );
    const html = this.htmlRenderer.generateHtml(receiptData, receipt);

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, html, "utf-8");

    return outputPath;
  }
}
