import { CSSExportService } from "../../services/cssExportService";

export class ExportController {
  static async handleExportCss(msg: { exportFormat?: string; shouldDownload?: boolean }) {
    const format = (msg.exportFormat || "css") as "css" | "scss" | "tailwind-v4";
    const cssContent = await CSSExportService.exportVariables(format);
    figma.ui.postMessage({
      type: "css-export",
      cssData: cssContent,
      shouldDownload: msg.shouldDownload,
      exportFormat: format,
    });
  }

  static async handleGetUnitSettings() {
    const unitSettingsData = await CSSExportService.getUnitSettingsData();
    figma.ui.postMessage({
      type: "unit-settings-data",
      data: unitSettingsData,
    });
  }

  static async handleUpdateUnitSettings(msg: { collections: any; groups: any }) {
    CSSExportService.updateUnitSettings({
      collections: msg.collections,
      groups: msg.groups,
    });
    await CSSExportService.saveUnitSettings();
    figma.ui.postMessage({
      type: "unit-settings-updated",
      success: true,
    });
  }

  static async handleValidateTailwindV4() {
    const twValidation = await CSSExportService.getTailwindV4ValidationStatus();
    figma.ui.postMessage({
      type: "tailwind-v4-validation",
      validation: twValidation,
    });
  }
}
