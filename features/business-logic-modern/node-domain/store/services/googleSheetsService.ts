export interface GoogleSheetsConfig {
  spreadsheetId: string;
  sheetName: string;
  accessToken?: string;
}

export interface SyncResult {
  success: boolean;
  rowsAffected: number;
  error?: string;
  spreadsheetUrl?: string;
}

export interface ConnectionResult {
  success: boolean;
  isAuthenticated: boolean;
  error?: string;
  spreadsheetInfo?: {
    title: string;
    url: string;
    sheets: string[];
  };
}

/**
 * Extrae el ID del spreadsheet de una URL de Google Sheets
 */
export function extractSpreadsheetId(input: string): string | null {
  if (!input) return null;

  // Si ya es un ID (no contiene '/' ni 'docs.google.com')
  if (!input.includes("/") && !input.includes("docs.google.com")) {
    return input;
  }

  // Extraer de URL completa
  const patterns = [
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
    /\/d\/([a-zA-Z0-9-_]+)/,
    /spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Genera URL para crear un nuevo Google Sheet
 */
export function getCreateSheetUrl(title?: string): string {
  const encodedTitle = encodeURIComponent(title || "AgenitiX Data Sheet");
  return `https://docs.google.com/spreadsheets/create?title=${encodedTitle}`;
}

/**
 * Servicio para interactuar con Google Sheets API
 */
export class GoogleSheetsService {
  private config: GoogleSheetsConfig;
  private apiKey: string;

  constructor(config: GoogleSheetsConfig) {
    this.config = config;
    this.apiKey = process.env.GOOGLE_SHEETS_API_KEY || "";

    if (!this.apiKey) {
      throw new Error("Google Sheets API key not configured");
    }
  }

  /**
   * Actualiza el token de acceso
   */
  updateAccessToken(accessToken: string) {
    this.config.accessToken = accessToken;
  }

  /**
   * Prueba la conexión y obtiene información del spreadsheet
   */
  async testConnection(): Promise<ConnectionResult> {
    try {
      if (!this.config.spreadsheetId) {
        return {
          success: false,
          isAuthenticated: false,
          error: "Spreadsheet ID is required",
        };
      }

      // Primero intentar con API key (solo lectura)
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}?key=${this.apiKey}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          isAuthenticated: !!this.config.accessToken,
          spreadsheetInfo: {
            title: data.properties?.title || "Unknown",
            url: `https://docs.google.com/spreadsheets/d/${this.config.spreadsheetId}`,
            sheets: data.sheets?.map(
              (sheet: any) => sheet.properties?.title || "Sheet1"
            ) || ["Sheet1"],
          },
        };
      }

      // Si falla con API key, intentar con access token
      if (this.config.accessToken) {
        const authResponse = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${this.config.accessToken}`,
              Accept: "application/json",
            },
          }
        );

        if (authResponse.ok) {
          const data = await authResponse.json();
          return {
            success: true,
            isAuthenticated: true,
            spreadsheetInfo: {
              title: data.properties?.title || "Unknown",
              url: `https://docs.google.com/spreadsheets/d/${this.config.spreadsheetId}`,
              sheets: data.sheets?.map(
                (sheet: any) => sheet.properties?.title || "Sheet1"
              ) || ["Sheet1"],
            },
          };
        }
      }

      return {
        success: false,
        isAuthenticated: !!this.config.accessToken,
        error: `Failed to access spreadsheet: ${response.status} ${response.statusText}`,
      };
    } catch (error) {
      return {
        success: false,
        isAuthenticated: !!this.config.accessToken,
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }

  /**
   * Sincroniza datos al spreadsheet
   */
  async syncData(data: any[]): Promise<SyncResult> {
    try {
      if (!this.config.accessToken) {
        return {
          success: false,
          rowsAffected: 0,
          error:
            "Authentication required. Please connect your Gmail account first.",
        };
      }

      if (!data || data.length === 0) {
        return {
          success: false,
          rowsAffected: 0,
          error: "No data to sync",
        };
      }

      // Preparar datos para Google Sheets
      const values = this.prepareDataForSheets(data);

      // Obtener el rango actual para determinar dónde insertar
      const currentRange = await this.getCurrentRange();
      const startRow = currentRange + 1;
      const range = `${this.config.sheetName}!A${startRow}`;

      // Insertar datos
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.config.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            values: values,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          rowsAffected: 0,
          error: `Failed to sync data: ${response.status} ${response.statusText} - ${errorData.error?.message || "Unknown error"}`,
        };
      }

      const result = await response.json();

      return {
        success: true,
        rowsAffected: result.updates?.updatedRows || values.length,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${this.config.spreadsheetId}`,
      };
    } catch (error) {
      return {
        success: false,
        rowsAffected: 0,
        error: error instanceof Error ? error.message : "Sync failed",
      };
    }
  }

  /**
   * Obtiene el número de filas actuales en el sheet
   */
  private async getCurrentRange(): Promise<number> {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}/values/${this.config.sheetName}`,
        {
          headers: {
            Authorization: `Bearer ${this.config.accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.values?.length || 0;
      }

      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Prepara los datos para el formato de Google Sheets
   */
  private prepareDataForSheets(data: any[]): string[][] {
    if (!data || data.length === 0) return [];

    // Si el primer elemento es un objeto, crear headers
    const firstItem = data[0];
    if (typeof firstItem === "object" && firstItem !== null) {
      const headers = Object.keys(firstItem);
      const rows = data.map((item) =>
        headers.map((header) => {
          const value = item[header];
          if (value === null || value === undefined) return "";
          if (typeof value === "object") return JSON.stringify(value);
          return String(value);
        })
      );

      // Solo agregar headers si es la primera vez (esto se puede mejorar)
      return rows;
    }

    // Si son valores primitivos, convertir a array de arrays
    return data.map((item) => [String(item)]);
  }

  /**
   * Desconecta el servicio
   */
  disconnect() {
    // Cleanup si es necesario
    this.config.accessToken = undefined;
  }
}

/**
 * Factory function para crear el servicio
 */
export function createGoogleSheetsService(
  config: GoogleSheetsConfig
): GoogleSheetsService {
  return new GoogleSheetsService(config);
}
