/**
 * Google Sheets Integration - Convex Functions
 * 
 * Utiliza la autenticación OAuth2 existente de Gmail para acceder a Google Sheets API
 */

import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { requireAuth, requireUser, debug, logAuthState, getAuthContext } from "./authHelpers";

// Check if user is authenticated and has access to Google Sheets
export const checkGoogleSheetsAuth = query({
  args: {},
  handler: async (ctx) => {
    try {
      const authContext = await getAuthContext(ctx);
      
      if (!authContext.isAuthenticated) {
        return {
          isAuthenticated: false,
          hasGmailAccount: false,
          error: "User not authenticated"
        };
      }

      // Try to find Gmail accounts
      const gmailAccounts = await ctx.db
        .query("email_accounts")
        .withIndex("by_user_id", (q) => q.eq("user_id", authContext.user?._id))
        .filter((q) => q.eq(q.field("provider"), "gmail"))
        .filter((q) => q.eq(q.field("is_active"), true))
        .collect();

      return {
        isAuthenticated: true,
        hasGmailAccount: gmailAccounts.length > 0,
        accountCount: gmailAccounts.length,
        error: null
      };
    } catch (error) {
      return {
        isAuthenticated: false,
        hasGmailAccount: false,
        error: error instanceof Error ? error.message : "Authentication check failed"
      };
    }
  },
});

// Obtener token de acceso de una cuenta de Gmail para usar con Google Sheets
export const getGoogleSheetsToken = query({
  args: {
    accountId: v.optional(v.id("email_accounts")),
  },
  handler: async (ctx, args) => {
    try {
      const { authContext, user } = await requireUser(ctx);
      
      logAuthState("getGoogleSheetsToken", authContext, {
        accountId: args.accountId,
      });

    // Si se proporciona un accountId específico, usarlo
    if (args.accountId) {
      // Primero intentar buscar por _id (documento de Convex)
      let account = await ctx.db.get(args.accountId);
      
      // Si no se encuentra, intentar buscar por accountId interno
      if (!account) {
        account = await ctx.db
          .query("email_accounts")
          .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
          .filter((q) => q.eq(q.field("account_id"), args.accountId))
          .first();
      }
      
      if (!account) {
        throw new Error("Email account not found");
      }
      
      // Verificar que la cuenta pertenece al usuario
      if (account.user_id !== user._id) {
        throw new Error("Access denied: account does not belong to current user");
      }
      
      if (account.provider !== "gmail") {
        throw new Error("Only Gmail accounts can be used for Google Sheets access");
      }
      
      // Parsear credenciales
      const credentials = JSON.parse(account.encrypted_credentials || "{}");
      return {
        accessToken: credentials.accessToken,
        refreshToken: credentials.refreshToken,
        tokenExpiry: credentials.tokenExpiry,
        email: account.email,
      };
    }

    // Si no se proporciona accountId, buscar la primera cuenta de Gmail activa
    const gmailAccount = await ctx.db
      .query("email_accounts")
      .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
      .filter((q) => q.eq(q.field("provider"), "gmail"))
      .filter((q) => q.eq(q.field("is_active"), true))
      .filter((q) => q.eq(q.field("connection_status"), "connected"))
      .first();

    if (!gmailAccount) {
      return null; // No hay cuenta de Gmail disponible
    }

    const credentials = JSON.parse(gmailAccount.encrypted_credentials || "{}");
    return {
      accessToken: credentials.accessToken,
      refreshToken: credentials.refreshToken,
      tokenExpiry: credentials.tokenExpiry,
      email: gmailAccount.email,
    };
    } catch (error) {
      debug("getGoogleSheetsToken", "Authentication error:", error);
      // Return null instead of throwing to allow graceful handling in the UI
      return null;
    }
  },
});

// Refrescar token de acceso si es necesario
export const refreshGoogleToken = action({
  args: {
    accountId: v.id("email_accounts"),
    refreshToken: v.string(),
  },
  handler: async (ctx, args) => {
    const authContext = await requireAuth(ctx);
    
    logAuthState("refreshGoogleToken", authContext, {
      accountId: args.accountId,
    });

    try {
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: process.env.GMAIL_CLIENT_ID!,
          client_secret: process.env.GMAIL_CLIENT_SECRET!,
          refresh_token: args.refreshToken,
          grant_type: "refresh_token",
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
      }

      const tokenData = await response.json();
      
      // Actualizar las credenciales en la base de datos
      const account = await ctx.runQuery(api.emailAccounts.getAccountById, {
        accountId: args.accountId,
      });
      
      if (!account) {
        throw new Error("Account not found");
      }

      const currentCredentials = JSON.parse(account.encrypted_credentials || "{}");
      const updatedCredentials = {
        ...currentCredentials,
        accessToken: tokenData.access_token,
        tokenExpiry: Date.now() + (tokenData.expires_in * 1000),
      };

      await ctx.runMutation(api.emailAccounts.upsertEmailAccountForUser, {
        userId: account.user_id,
        provider: account.provider,
        email: account.email,
        displayName: account.display_name || account.email,
        accessToken: updatedCredentials.accessToken,
        refreshToken: updatedCredentials.refreshToken,
        tokenExpiry: updatedCredentials.tokenExpiry,
      });

      return {
        accessToken: tokenData.access_token,
        tokenExpiry: updatedCredentials.tokenExpiry,
      };

    } catch (error) {
      debug("refreshGoogleToken", "Token refresh failed:", error);
      throw new Error(`Failed to refresh token: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

// Probar conexión con Google Sheets
export const testGoogleSheetsConnection = action({
  args: {
    spreadsheetId: v.string(),
    accountId: v.optional(v.id("email_accounts")),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    error?: string;
    requiresAuth?: boolean;
    spreadsheetInfo?: {
      title: string;
      url: string;
      sheets: string[];
    };
  }> => {
    const authContext = await requireAuth(ctx);
    
    logAuthState("testGoogleSheetsConnection", authContext, {
      spreadsheetId: args.spreadsheetId,
      accountId: args.accountId,
    });

    try {
      // Obtener token de acceso
      const tokenData: any = await ctx.runQuery(api.googleSheets.getGoogleSheetsToken, {
        accountId: args.accountId,
      });

      if (!tokenData) {
        return {
          success: false,
          error: "No Gmail account found. Please connect a Gmail account first.",
          requiresAuth: true,
        };
      }

      // Verificar si el token ha expirado
      if (tokenData.tokenExpiry && Date.now() > tokenData.tokenExpiry) {
        if (tokenData.refreshToken) {
          // Intentar refrescar el token
          const refreshedToken = await ctx.runAction(api.googleSheets.refreshGoogleToken, {
            accountId: args.accountId!,
            refreshToken: tokenData.refreshToken,
          });
          tokenData.accessToken = refreshedToken.accessToken;
        } else {
          return {
            success: false,
            error: "Access token expired and no refresh token available. Please reconnect your Gmail account.",
            requiresAuth: true,
          };
        }
      }

      // Probar acceso al spreadsheet
      const response: any = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${args.spreadsheetId}`,
        {
          headers: {
            Authorization: `Bearer ${tokenData.accessToken}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `Failed to access spreadsheet: ${response.status} ${response.statusText} - ${errorData.error?.message || "Unknown error"}`,
          requiresAuth: response.status === 401,
        };
      }

      const spreadsheetData = await response.json();
      
      return {
        success: true,
        spreadsheetInfo: {
          title: spreadsheetData.properties?.title || "Unknown",
          url: `https://docs.google.com/spreadsheets/d/${args.spreadsheetId}`,
          sheets: spreadsheetData.sheets?.map((sheet: any) => sheet.properties?.title || "Sheet1") || ["Sheet1"],
        },
      };

    } catch (error) {
      debug("testGoogleSheetsConnection", "Connection test failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection test failed",
        requiresAuth: false,
      };
    }
  },
});

// Sincronizar datos a Google Sheets
export const syncDataToGoogleSheets = action({
  args: {
    spreadsheetId: v.string(),
    sheetName: v.string(),
    data: v.any(),
    accountId: v.optional(v.id("email_accounts")),
  },
  handler: async (ctx, args): Promise<{ success: boolean; rowsAffected: number; error?: string; spreadsheetUrl?: string }> => {
    const authContext = await requireAuth(ctx);
    
    logAuthState("syncDataToGoogleSheets", authContext, {
      spreadsheetId: args.spreadsheetId,
      sheetName: args.sheetName,
      accountId: args.accountId,
      dataType: typeof args.data,
    });

    try {
      // Obtener token de acceso
      const tokenData: any = await ctx.runQuery(api.googleSheets.getGoogleSheetsToken, {
        accountId: args.accountId,
      });

      if (!tokenData) {
        return {
          success: false,
          error: "No Gmail account found. Please connect a Gmail account first.",
          rowsAffected: 0,
        };
      }

      // Verificar si el token ha expirado
      if (tokenData.tokenExpiry && Date.now() > tokenData.tokenExpiry) {
        if (tokenData.refreshToken) {
          const refreshedToken = await ctx.runAction(api.googleSheets.refreshGoogleToken, {
            accountId: args.accountId!,
            refreshToken: tokenData.refreshToken,
          });
          tokenData.accessToken = refreshedToken.accessToken;
        } else {
          return {
            success: false,
            error: "Access token expired. Please reconnect your Gmail account.",
            rowsAffected: 0,
          };
        }
      }

      // Preparar datos para Google Sheets
      const dataArray = Array.isArray(args.data) ? args.data : [args.data];
      const values = prepareDataForSheets(dataArray);

      if (values.length === 0) {
        return {
          success: false,
          error: "No valid data to sync",
          rowsAffected: 0,
        };
      }

      // Obtener el rango actual para determinar dónde insertar
      const currentRangeResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${args.spreadsheetId}/values/${args.sheetName}`,
        {
          headers: {
            Authorization: `Bearer ${tokenData.accessToken}`,
          },
        }
      );

      let startRow = 1;
      if (currentRangeResponse.ok) {
        const currentData = await currentRangeResponse.json();
        startRow = (currentData.values?.length || 0) + 1;
      }

      const range = `${args.sheetName}!A${startRow}`;

      // Insertar datos
      const response: any = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${args.spreadsheetId}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenData.accessToken}`,
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
          error: `Failed to sync data: ${response.status} ${response.statusText} - ${errorData.error?.message || "Unknown error"}`,
          rowsAffected: 0,
        };
      }

      const result = await response.json();
      
      return {
        success: true,
        rowsAffected: result.updates?.updatedRows || values.length,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${args.spreadsheetId}`,
      };

    } catch (error) {
      debug("syncDataToGoogleSheets", "Sync failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Sync failed",
        rowsAffected: 0,
      };
    }
  },
});

// Función auxiliar para preparar datos para Google Sheets
function prepareDataForSheets(data: any[]): string[][] {
  if (!data || data.length === 0) return [];

  const firstItem = data[0];
  if (typeof firstItem === "object" && firstItem !== null) {
    const headers = Object.keys(firstItem);
    return data.map((item) =>
      headers.map((header) => {
        const value = item[header];
        if (value === null || value === undefined) return "";
        if (typeof value === "object") return JSON.stringify(value);
        return String(value);
      })
    );
  }

  // Si son valores primitivos, convertir a array de arrays
  return data.map((item) => [String(item)]);
}