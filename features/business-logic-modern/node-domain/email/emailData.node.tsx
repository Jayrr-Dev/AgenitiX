/**
 * emailData NODE – Email data extraction and analysis
 *
 * • Extract structured data from email content
 * • Parse email headers, body, and attachments
 * • Identify entities, dates, and key information
 * • Convert email data to various formats
 * • Generate statistics and insights from email content
 *
 * Keywords: email-parsing, data-extraction, entity-recognition, email-analytics
 */

"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

// UI Components
import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Node Infrastructure
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
import {
  SafeSchemas,
  createSafeInitialData,
} from "@/features/business-logic-modern/infrastructure/node-core/schema-helpers";
import {
  createNodeValidator,
  reportValidationError,
  useNodeDataValidation,
} from "@/features/business-logic-modern/infrastructure/node-core/validation";
import { withNodeScaffold } from "@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold";
import type { NodeProps } from "@xyflow/react";
import { useStore } from "@xyflow/react";

// Theming and Sizing
import { CATEGORIES } from "@/features/business-logic-modern/infrastructure/theming/categories";
import {
  COLLAPSED_SIZES,
  EXPANDED_SIZES,
} from "@/features/business-logic-modern/infrastructure/theming/sizing";
import { useNodeData } from "@/hooks/useNodeData";

// -----------------------------------------------------------------------------
// 🎨  Styling Constants
// -----------------------------------------------------------------------------

const CATEGORY_TEXT = {
  EMAIL: {
    primary: "text-[--node-email-text]",
  },
} as const;

const CONTENT = {
  expanded: "p-4 w-full h-full flex flex-col",
  collapsed: "flex items-center justify-center w-full h-full",
  disabled: "opacity-50 pointer-events-none",
  header: "flex items-center justify-between mb-3",
  body: "flex-1 overflow-hidden",
} as const;

// -----------------------------------------------------------------------------
// 1️⃣  Data Schema & Validation
// -----------------------------------------------------------------------------

export const EmailDataSchema = z
  .object({
    // Input Email Data
    emailContent: z.string().default(""),
    emailSubject: z.string().default(""),
    emailFrom: z.string().default(""),
    emailTo: z.array(z.string()).default([]),
    emailCc: z.array(z.string()).default([]),
    emailBcc: z.array(z.string()).default([]),
    emailDate: z.string().default(""),
    emailAttachments: z
      .array(
        z.object({
          name: z.string(),
          type: z.string(),
          size: z.number(),
          content: z.string().optional(),
        })
      )
      .default([]),

    // Extraction Settings
    extractEntities: z.boolean().default(true),
    extractDates: z.boolean().default(true),
    extractLinks: z.boolean().default(true),
    extractEmails: z.boolean().default(true),
    extractPhones: z.boolean().default(true),
    extractAddresses: z.boolean().default(false),
    extractKeywords: z.boolean().default(true),
    extractSentiment: z.boolean().default(false),

    // Extracted Data
    entities: z
      .array(
        z.object({
          text: z.string(),
          type: z.string(),
          confidence: z.number().optional(),
        })
      )
      .default([]),
    dates: z
      .array(
        z.object({
          text: z.string(),
          date: z.string(),
          type: z.string().optional(),
        })
      )
      .default([]),
    links: z.array(z.string()).default([]),
    emails: z.array(z.string()).default([]),
    phones: z.array(z.string()).default([]),
    addresses: z.array(z.string()).default([]),
    keywords: z.array(z.string()).default([]),
    sentiment: z
      .object({
        score: z.number().default(0),
        label: z.string().default("neutral"),
      })
      .default({ score: 0, label: "neutral" }),

    // Output Format
    outputFormat: z.enum(["json", "csv", "text", "html"]).default("json"),
    includeRawData: z.boolean().default(false),

    // Processing State
    isProcessing: z.boolean().default(false),
    processingStep: z.string().default(""),
    processingProgress: z.number().default(0),

    // UI State
    activeTab: z
      .enum(["input", "entities", "dates", "links", "export"])
      .default("input"),
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(true),
    expandedSize: SafeSchemas.text("VE3"),
    collapsedSize: SafeSchemas.text("C2"),

    // output
    structuredDataOutput: z.record(z.unknown()).optional(),
    formattedOutput: z.string().optional(),
    errorOutput: z.string().default(""),
  })
  .passthrough();

export type EmailDataType = z.infer<typeof EmailDataSchema>;

const validateNodeData = createNodeValidator(EmailDataSchema, "EmailData");

// -----------------------------------------------------------------------------
// 2️⃣  Dynamic Spec Generation
// -----------------------------------------------------------------------------

const createDynamicSpec = (data: EmailDataType): NodeSpec => {
  // Get size constants based on the keys in the data
  const expandedSize =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ||
    EXPANDED_SIZES.VE3;
  const collapsedSize =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ||
    COLLAPSED_SIZES.C2;

  return {
    kind: "emailData",
    displayName: "Email Data",
    label: "Email Data",
    category: CATEGORIES.EMAIL,
    description: "Extract structured data from email content",
    icon: "LuDatabase",

    size: {
      expanded: expandedSize,
      collapsed: collapsedSize,
    },

    handles: [
      {
        id: "email-input",
        code: "e",
        position: "left",
        type: "target",
        dataType: "JSON",
      },
      {
        id: "structured-output",
        code: "s",
        position: "right",
        type: "source",
        dataType: "JSON",
      },
      {
        id: "formatted-output",
        code: "f",
        position: "bottom",
        type: "source",
        dataType: "String",
      },
    ],

    inspector: { key: "EmailDataInspector" },
    version: 1,
    runtime: { execute: "emailData_execute_v1" },
    initialData: createSafeInitialData(EmailDataSchema, {
      emailContent: "",
      emailSubject: "",
      emailFrom: "",
      emailTo: [],
      emailCc: [],
      emailBcc: [],
      emailDate: "",
      emailAttachments: [],
      extractEntities: true,
      extractDates: true,
      extractLinks: true,
      extractEmails: true,
      extractPhones: true,
      extractAddresses: false,
      extractKeywords: true,
      extractSentiment: false,
      entities: [],
      dates: [],
      links: [],
      emails: [],
      phones: [],
      addresses: [],
      keywords: [],
      sentiment: { score: 0, label: "neutral" },
      outputFormat: "json",
      includeRawData: false,
      isProcessing: false,
      processingStep: "",
      processingProgress: 0,
      activeTab: "input",
      structuredDataOutput: {},
      formattedOutput: "",
      errorOutput: "",
    }),
    dataSchema: EmailDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "structuredDataOutput",
        "formattedOutput",
        "errorOutput",
        "isProcessing",
        "processingStep",
        "processingProgress",
        "expandedSize",
        "collapsedSize",
        "entities",
        "dates",
        "links",
        "emails",
        "phones",
        "addresses",
        "keywords",
        "sentiment",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        {
          key: "emailSubject",
          type: "text",
          label: "Subject",
          placeholder: "Email subject",
        },
        {
          key: "emailFrom",
          type: "text",
          label: "From",
          placeholder: "sender@example.com",
        },
        {
          key: "emailContent",
          type: "textarea",
          label: "Content",
          placeholder: "Email content to analyze",
        },
        { key: "extractEntities", type: "boolean", label: "Extract Entities" },
        { key: "extractDates", type: "boolean", label: "Extract Dates" },
        { key: "extractLinks", type: "boolean", label: "Extract Links" },
        { key: "extractEmails", type: "boolean", label: "Extract Emails" },
        { key: "extractPhones", type: "boolean", label: "Extract Phones" },
        { key: "extractKeywords", type: "boolean", label: "Extract Keywords" },
        {
          key: "extractSentiment",
          type: "boolean",
          label: "Extract Sentiment",
        },
        {
          key: "outputFormat",
          type: "select",
          label: "Output Format",
          validation: {
            options: [
              { value: "json", label: "JSON" },
              { value: "csv", label: "CSV" },
              { value: "text", label: "Text" },
              { value: "html", label: "HTML" },
            ],
          },
        },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    author: "Agenitix Team",
    feature: "email",
    tags: ["email", "data", "extraction", "analysis", "parsing"],
    theming: {},
  };
};

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE3",
  collapsedSize: "C2",
} as EmailDataType);

// -----------------------------------------------------------------------------
// 3️⃣  Utility Functions
// -----------------------------------------------------------------------------

/** Extract emails from text */
const extractEmails = (text: string): string[] => {
  const emailRegex = /[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/g;
  return Array.from(new Set(text.match(emailRegex) || []));
};

/** Extract URLs from text */
const extractLinks = (text: string): string[] => {
  const urlRegex = /https?:\/\/[^\s]+/g;
  return Array.from(new Set(text.match(urlRegex) || []));
};

/** Extract phone numbers from text */
const extractPhones = (text: string): string[] => {
  const phoneRegex = /(?:\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/g;
  return Array.from(new Set(text.match(phoneRegex) || []));
};

/** Extract dates from text */
const extractDates = (
  text: string
): Array<{ text: string; date: string; type?: string }> => {
  // Simple date patterns
  const datePatterns = [
    // MM/DD/YYYY or DD/MM/YYYY
    {
      regex: /(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](\d{4})/g,
      type: "date",
    },
    // YYYY/MM/DD
    {
      regex: /(\d{4})[\/\-](0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])/g,
      type: "date",
    },
    // Month DD, YYYY
    {
      regex:
        /(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?[,\s]+(\d{4})/gi,
      type: "date",
    },
    // Time patterns
    {
      regex: /(\d{1,2}):([0-5]\d)(?::([0-5]\d))?\s*([ap]\.?m\.?)?/gi,
      type: "time",
    },
  ];

  const results: Array<{ text: string; date: string; type?: string }> = [];

  datePatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.regex.exec(text)) !== null) {
      results.push({
        text: match[0],
        date: new Date().toISOString(), // In a real implementation, parse the date properly
        type: pattern.type,
      });
    }
  });

  return results;
};

/** Extract keywords from text */
const extractKeywords = (text: string): string[] => {
  // In a real implementation, this would use NLP techniques
  // Here we'll just extract words that appear frequently and aren't stopwords
  const stopwords = new Set([
    "a",
    "about",
    "above",
    "after",
    "again",
    "against",
    "all",
    "am",
    "an",
    "and",
    "any",
    "are",
    "as",
    "at",
    "be",
    "because",
    "been",
    "before",
    "being",
    "below",
    "between",
    "both",
    "but",
    "by",
    "can",
    "did",
    "do",
    "does",
    "doing",
    "don",
    "down",
    "during",
    "each",
    "few",
    "for",
    "from",
    "further",
    "had",
    "has",
    "have",
    "having",
    "he",
    "her",
    "here",
    "hers",
    "herself",
    "him",
    "himself",
    "his",
    "how",
    "i",
    "if",
    "in",
    "into",
    "is",
    "it",
    "its",
    "itself",
    "just",
    "me",
    "more",
    "most",
    "my",
    "myself",
    "no",
    "nor",
    "not",
    "now",
    "of",
    "off",
    "on",
    "once",
    "only",
    "or",
    "other",
    "our",
    "ours",
    "ourselves",
    "out",
    "over",
    "own",
    "same",
    "she",
    "should",
    "so",
    "some",
    "such",
    "than",
    "that",
    "the",
    "their",
    "theirs",
    "them",
    "themselves",
    "then",
    "there",
    "these",
    "they",
    "this",
    "those",
    "through",
    "to",
    "too",
    "under",
    "until",
    "up",
    "very",
    "was",
    "we",
    "were",
    "what",
    "when",
    "where",
    "which",
    "while",
    "who",
    "whom",
    "why",
    "will",
    "with",
    "you",
    "your",
    "yours",
    "yourself",
    "yourselves",
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopwords.has(word));

  // Count word frequency
  const wordCount: Record<string, number> = {};
  words.forEach((word) => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  // Get top keywords
  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
};

/** Extract named entities from text */
const extractEntities = (
  text: string
): Array<{ text: string; type: string; confidence?: number }> => {
  // In a real implementation, this would use NLP or AI services
  // Here we'll just do some basic pattern matching
  const entities: Array<{ text: string; type: string; confidence?: number }> =
    [];

  // Simple company detection (words ending with Inc, LLC, etc.)
  const companyRegex =
    /\b[A-Z][\w\s&-]+(?:Inc|LLC|Ltd|Corp|Corporation|Company)\b/g;
  let match;
  while ((match = companyRegex.exec(text)) !== null) {
    entities.push({
      text: match[0],
      type: "ORGANIZATION",
      confidence: 0.8,
    });
  }

  // Simple person name detection (Mr./Ms./Dr. followed by capitalized words)
  const personRegex =
    /\b(?:Mr\.|Ms\.|Mrs\.|Dr\.|Prof\.)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g;
  while ((match = personRegex.exec(text)) !== null) {
    entities.push({
      text: match[0],
      type: "PERSON",
      confidence: 0.7,
    });
  }

  return entities;
};

/** Analyze sentiment of text */
const analyzeSentiment = (text: string): { score: number; label: string } => {
  // In a real implementation, this would use NLP or AI services
  // Here we'll just do a simple word-based approach
  const positiveWords = new Set([
    "good",
    "great",
    "excellent",
    "amazing",
    "wonderful",
    "fantastic",
    "terrific",
    "happy",
    "pleased",
    "delighted",
    "satisfied",
    "joy",
    "love",
    "like",
    "appreciate",
    "thank",
    "thanks",
    "grateful",
    "positive",
    "perfect",
    "best",
    "better",
  ]);

  const negativeWords = new Set([
    "bad",
    "terrible",
    "horrible",
    "awful",
    "poor",
    "disappointing",
    "frustrating",
    "sad",
    "unhappy",
    "angry",
    "upset",
    "hate",
    "dislike",
    "sorry",
    "problem",
    "issue",
    "mistake",
    "error",
    "fail",
    "failed",
    "worst",
    "worse",
  ]);

  const words = text.toLowerCase().split(/\W+/);
  let positiveCount = 0;
  let negativeCount = 0;

  words.forEach((word) => {
    if (positiveWords.has(word)) positiveCount++;
    if (negativeWords.has(word)) negativeCount++;
  });

  const totalWords = words.length;
  const score =
    totalWords > 0
      ? (positiveCount - negativeCount) /
        Math.max(1, positiveCount + negativeCount)
      : 0;

  let label = "neutral";
  if (score > 0.25) label = "positive";
  if (score < -0.25) label = "negative";

  return { score, label };
};

/** Format extracted data based on selected output format */
const formatExtractedData = (data: EmailDataType, format: string): string => {
  // Create a simplified data object for output
  const outputData = {
    metadata: {
      subject: data.emailSubject,
      from: data.emailFrom,
      to: data.emailTo,
      cc: data.emailCc,
      date: data.emailDate,
    },
    entities: data.entities,
    dates: data.dates,
    links: data.links,
    emails: data.emails,
    phones: data.phones,
    keywords: data.keywords,
    sentiment: data.sentiment,
  };

  switch (format) {
    case "json":
      return JSON.stringify(outputData, null, 2);

    case "csv":
      // Simple CSV format for demonstration
      let csv = "Type,Value\n";

      // Add metadata
      csv += `Subject,${data.emailSubject}\n`;
      csv += `From,${data.emailFrom}\n`;
      csv += `To,${data.emailTo.join("; ")}\n`;

      // Add entities
      data.entities.forEach((entity) => {
        csv += `Entity (${entity.type}),${entity.text}\n`;
      });

      // Add other data
      data.links.forEach((link) => (csv += `Link,${link}\n`));
      data.emails.forEach((email) => (csv += `Email,${email}\n`));

      return csv;

    case "html":
      // Simple HTML format for demonstration
      let html = `<div class="email-data">\n`;
      html += `  <h2>${data.emailSubject || "Email Data"}</h2>\n`;
      html += `  <div class="metadata">\n`;
      html += `    <p><strong>From:</strong> ${data.emailFrom}</p>\n`;
      html += `    <p><strong>To:</strong> ${data.emailTo.join(", ")}</p>\n`;
      html += `    <p><strong>Date:</strong> ${data.emailDate}</p>\n`;
      html += `  </div>\n\n`;

      // Add entities section
      if (data.entities.length > 0) {
        html += `  <div class="entities">\n`;
        html += `    <h3>Entities</h3>\n`;
        html += `    <ul>\n`;
        data.entities.forEach((entity) => {
          html += `      <li>${entity.text} (${entity.type})</li>\n`;
        });
        html += `    </ul>\n`;
        html += `  </div>\n\n`;
      }

      // Add links section
      if (data.links.length > 0) {
        html += `  <div class="links">\n`;
        html += `    <h3>Links</h3>\n`;
        html += `    <ul>\n`;
        data.links.forEach((link) => {
          html += `      <li><a href="${link}">${link}</a></li>\n`;
        });
        html += `    </ul>\n`;
        html += `  </div>\n`;
      }

      html += `</div>`;
      return html;

    case "text":
    default:
      // Simple text format
      let text = `Email Data Extraction\n\n`;
      text += `Subject: ${data.emailSubject}\n`;
      text += `From: ${data.emailFrom}\n`;
      text += `To: ${data.emailTo.join(", ")}\n`;
      text += `Date: ${data.emailDate}\n\n`;

      if (data.entities.length > 0) {
        text += `Entities:\n`;
        data.entities.forEach((entity) => {
          text += `- ${entity.text} (${entity.type})\n`;
        });
        text += `\n`;
      }

      if (data.links.length > 0) {
        text += `Links:\n`;
        data.links.forEach((link) => {
          text += `- ${link}\n`;
        });
        text += `\n`;
      }

      return text;
  }
};

/** Process email data and extract information */
const processEmailData = (data: EmailDataType): EmailDataType => {
  const updatedData = { ...data };
  const content = data.emailContent;

  // Extract data based on settings
  if (data.extractEmails) {
    updatedData.emails = extractEmails(content);
  }

  if (data.extractLinks) {
    updatedData.links = extractLinks(content);
  }

  if (data.extractPhones) {
    updatedData.phones = extractPhones(content);
  }

  if (data.extractDates) {
    updatedData.dates = extractDates(content);
  }

  if (data.extractKeywords) {
    updatedData.keywords = extractKeywords(content);
  }

  if (data.extractEntities) {
    updatedData.entities = extractEntities(content);
  }

  if (data.extractSentiment) {
    updatedData.sentiment = analyzeSentiment(content);
  }

  // Create structured data output
  const structuredData = {
    metadata: {
      subject: data.emailSubject,
      from: data.emailFrom,
      to: data.emailTo,
      cc: data.emailCc,
      date: data.emailDate,
    },
    extracted: {
      entities: updatedData.entities,
      dates: updatedData.dates,
      links: updatedData.links,
      emails: updatedData.emails,
      phones: updatedData.phones,
      keywords: updatedData.keywords,
      sentiment: updatedData.sentiment,
    },
  };

  updatedData.structuredDataOutput = structuredData;
  updatedData.formattedOutput = formatExtractedData(
    updatedData,
    data.outputFormat
  );

  return updatedData;
};

// -----------------------------------------------------------------------------
// 4️⃣ React Component
// -----------------------------------------------------------------------------

/** Componente personalizado de progreso para reemplazar Progress */
const SimpleProgress = ({
  value = 0,
  className = "",
}: {
  value: number;
  className?: string;
}) => {
  return (
    <div
      className={`h-2 w-full bg-slate-200 rounded-full overflow-hidden ${className}`}
    >
      <div
        className="h-full bg-primary"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
};

/** Component to display an extracted entity */
const EntityItem = ({
  entity,
}: {
  entity: { text: string; type: string; confidence?: number };
}) => {
  return (
    <div className="flex items-center justify-between p-2 border rounded mb-1 bg-slate-50">
      <div className="flex items-center gap-2">
        <Badge variant={entity.type === "PERSON" ? "default" : "outline"}>
          {entity.type}
        </Badge>
        <span className="text-sm">{entity.text}</span>
      </div>
      {entity.confidence !== undefined && (
        <span className="text-xs text-slate-500">
          {Math.round(entity.confidence * 100)}%
        </span>
      )}
    </div>
  );
};

/** Component to display an extracted item (email, link, etc.) */
const ExtractedItem = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="flex items-center justify-between p-2 border rounded mb-1 bg-slate-50">
      <span className="text-sm">{value}</span>
      <Badge variant="outline" className="text-xs">
        {label}
      </Badge>
    </div>
  );
};

/** Component to display analyzed sentiment */
const SentimentIndicator = ({
  sentiment,
}: {
  sentiment?: { score: number; label: string };
}) => {
  if (!sentiment) return null;

  const getColor = () => {
    switch (sentiment.label) {
      case "positive":
        return "bg-green-500";
      case "negative":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs mb-1">
        <span>Negative</span>
        <span>Neutral</span>
        <span>Positive</span>
      </div>
      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor()}`}
          style={{
            width: "10px",
            marginLeft: `${((sentiment.score + 1) / 2) * 100}%`,
            transform: "translateX(-50%)",
          }}
        />
      </div>
      <div className="text-center mt-1 text-xs">
        <Badge
          variant={sentiment.label === "neutral" ? "outline" : "default"}
          className="capitalize"
        >
          {sentiment.label}
        </Badge>
      </div>
    </div>
  );
};

/** Componente principal del nodo */
const EmailDataNode = memo(({ id, spec }: NodeProps & { spec: NodeSpec }) => {
  // -------------------------------------------------------------------------
  const { nodeData, updateNodeData } = useNodeData(id, {});

  // -------------------------------------------------------------------------
  // STATE MANAGEMENT (grouped for clarity)
  // -------------------------------------------------------------------------
  const {
    isExpanded,
    isEnabled,
    emailContent,
    emailSubject,
    emailFrom,
    emailTo,
    emailCc,
    emailDate,
    extractEntities,
    extractDates,
    extractLinks,
    extractEmails,
    extractPhones,
    extractKeywords,
    extractSentiment,
    entities,
    dates,
    links,
    emails,
    phones,
    keywords,
    sentiment,
    outputFormat,
    activeTab,
    isProcessing,
    isActive,
  } = nodeData as EmailDataType;

  const categoryStyles = CATEGORY_TEXT.EMAIL;

  // Global React‑Flow store (nodes & edges) – triggers re‑render on change
  const _nodes = useStore((s) => s.nodes);
  const _edges = useStore((s) => s.edges);

  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // 4.3  Callbacks
  // -------------------------------------------------------------------------

  /** Toggle between collapsed / expanded */
  const toggleExpand = useCallback(() => {
    updateNodeData({ isExpanded: !isExpanded });
  }, [isExpanded, updateNodeData]);

  // Process data when email content or extraction options change
  useEffect(() => {
    if (!emailContent) return;

    updateNodeData({ isProcessing: true });
    setError(null);

    try {
      // Simular un pequeño retraso para mostrar el procesamiento
      const timer = setTimeout(() => {
        const processedData = processEmailData(nodeData as EmailDataType);
        updateNodeData({
          ...processedData,
          isProcessing: false,
          isActive: true,
        });
      }, 500);

      return () => clearTimeout(timer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error processing data");
      updateNodeData({
        isProcessing: false,
        errorOutput:
          err instanceof Error ? err.message : "Error processing data",
      });
    }
  }, [
    emailContent,
    extractEmails,
    extractLinks,
    extractPhones,
    extractDates,
    extractKeywords,
    extractEntities,
    extractSentiment,
    outputFormat,
    updateNodeData,
  ]);

  // Handle changes in extraction options
  const handleExtractionToggle = useCallback(
    (field: keyof EmailDataType) => {
      updateNodeData({
        [field]: !(nodeData as EmailDataType)[field],
      });
    },
    [nodeData, updateNodeData]
  );

  // Handle changes in output format
  const handleFormatChange = useCallback(
    (format: string) => {
      updateNodeData({
        outputFormat: format as "json" | "csv" | "html" | "text",
      });
    },
    [updateNodeData]
  );

  // -------------------------------------------------------------------------
  // 4.5  Validation
  // -------------------------------------------------------------------------
  const validation = validateNodeData(nodeData);
  if (!validation.success) {
    reportValidationError("EmailData", id, validation.errors, {
      originalData: validation.originalData,
      component: "EmailDataNode",
    });
  }

  useNodeDataValidation(EmailDataSchema, "EmailData", validation.data, id);

  // -------------------------------------------------------------------------
  // 4.6  Render
  // -------------------------------------------------------------------------

  if (!isExpanded) {
    return (
      <div className={CONTENT.collapsed}>
        <div className="flex flex-col items-center gap-1">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
            Data
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {emailContent ? "Processing" : "No data"}
          </div>
          {isProcessing && (
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          )}
          {isActive && !isProcessing && (
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </div>
      </div>
    );
  }

  // Renderizar pestaña de configuración
  const renderConfigTab = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Extraction Options</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="extract-emails"
              checked={extractEmails}
              onCheckedChange={() => handleExtractionToggle("extractEmails")}
            />
            <label htmlFor="extract-emails" className="text-sm">
              Emails
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="extract-links"
              checked={extractLinks}
              onCheckedChange={() => handleExtractionToggle("extractLinks")}
            />
            <label htmlFor="extract-links" className="text-sm">
              Links
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="extract-phones"
              checked={extractPhones}
              onCheckedChange={() => handleExtractionToggle("extractPhones")}
            />
            <label htmlFor="extract-phones" className="text-sm">
              Phones
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="extract-dates"
              checked={extractDates}
              onCheckedChange={() => handleExtractionToggle("extractDates")}
            />
            <label htmlFor="extract-dates" className="text-sm">
              Dates
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="extract-keywords"
              checked={extractKeywords}
              onCheckedChange={() => handleExtractionToggle("extractKeywords")}
            />
            <label htmlFor="extract-keywords" className="text-sm">
              Keywords
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="extract-entities"
              checked={extractEntities}
              onCheckedChange={() => handleExtractionToggle("extractEntities")}
            />
            <label htmlFor="extract-entities" className="text-sm">
              Entities
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="extract-sentiment"
              checked={extractSentiment}
              onCheckedChange={() => handleExtractionToggle("extractSentiment")}
            />
            <label htmlFor="extract-sentiment" className="text-sm">
              Sentiment
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Output Format</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={outputFormat === "json" ? "default" : "outline"}
            size="sm"
            onClick={() => handleFormatChange("json")}
          >
            JSON
          </Button>
          <Button
            variant={outputFormat === "csv" ? "default" : "outline"}
            size="sm"
            onClick={() => handleFormatChange("csv")}
          >
            CSV
          </Button>
          <Button
            variant={outputFormat === "html" ? "default" : "outline"}
            size="sm"
            onClick={() => handleFormatChange("html")}
          >
            HTML
          </Button>
          <Button
            variant={outputFormat === "text" ? "default" : "outline"}
            size="sm"
            onClick={() => handleFormatChange("text")}
          >
            Text
          </Button>
        </div>
      </div>
    </div>
  );

  // Renderizar pestaña de datos extraídos
  const renderDataTab = () => {
    if (isProcessing) {
      return (
        <div className="flex flex-col items-center justify-center p-4 space-y-2">
          <SimpleProgress value={50} className="w-3/4" />
          <p className="text-sm text-slate-500">Processing data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 border border-red-200 rounded bg-red-50">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      );
    }

    if (!emailContent) {
      return (
        <div className="p-4 text-center">
          <p className="text-sm text-slate-500">
            Connect an email to extract data
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Metadata */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Metadata</h3>
          <div className="text-xs space-y-1">
            <p>
              <span className="font-medium">Subject:</span> {emailSubject}
            </p>
            <p>
              <span className="font-medium">From:</span> {emailFrom}
            </p>
            <p>
              <span className="font-medium">To:</span> {emailTo.join(", ")}
            </p>
            {emailCc.length > 0 && (
              <p>
                <span className="font-medium">CC:</span> {emailCc.join(", ")}
              </p>
            )}
            <p>
              <span className="font-medium">Date:</span> {emailDate}
            </p>
          </div>
        </div>

        {/* Entities */}
        {extractEntities && entities.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">
              Entities ({entities.length})
            </h3>
            <div className="max-h-32 overflow-y-auto">
              {entities.map((entity, i) => (
                <EntityItem key={`entity-${i}`} entity={entity} />
              ))}
            </div>
          </div>
        )}

        {/* Emails */}
        {extractEmails && emails.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Emails ({emails.length})</h3>
            <div className="max-h-24 overflow-y-auto">
              {emails.map((email, i) => (
                <ExtractedItem key={`email-${i}`} label="Email" value={email} />
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        {extractLinks && links.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Links ({links.length})</h3>
            <div className="max-h-24 overflow-y-auto">
              {links.map((link, i) => (
                <ExtractedItem key={`link-${i}`} label="URL" value={link} />
              ))}
            </div>
          </div>
        )}

        {/* Dates */}
        {extractDates && dates.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Dates ({dates.length})</h3>
            <div className="max-h-24 overflow-y-auto">
              {dates.map((date, i) => (
                <ExtractedItem
                  key={`date-${i}`}
                  label={date.type || "Date"}
                  value={date.text}
                />
              ))}
            </div>
          </div>
        )}

        {/* Keywords */}
        {extractKeywords && keywords.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Keywords</h3>
            <div className="flex flex-wrap gap-1">
              {keywords.map((keyword, i) => (
                <Badge key={`keyword-${i}`} variant="outline">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Sentiment */}
        {extractSentiment && sentiment && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Sentiment Analysis</h3>
            <SentimentIndicator sentiment={sentiment} />
          </div>
        )}
      </div>
    );
  };

  // Renderizar pestaña de salida formateada
  const renderOutputTab = () => {
    const formattedOutput = (nodeData as EmailDataType).formattedOutput;

    if (!formattedOutput) {
      return (
        <div className="p-4 text-center">
          <p className="text-sm text-slate-500">No processed data to display</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">
            Output {outputFormat.toUpperCase()}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(formattedOutput);
              toast.success("Data copied to clipboard");
            }}
          >
            Copy
          </Button>
        </div>
        <Card>
          <CardContent className="p-2">
            <pre className="text-xs overflow-auto max-h-64 p-2">
              {formattedOutput}
            </pre>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className={`${CONTENT.expanded} ${isEnabled ? "" : CONTENT.disabled}`}>
      {/* Header */}
      <div className={CONTENT.header}>
        <LabelNode nodeId={id} label="Email Data" />
        <ExpandCollapseButton showUI={isExpanded} onToggle={toggleExpand} />
      </div>

      {/* Body */}
      <div className={CONTENT.body}>
        <Tabs defaultValue="data" className="h-full flex flex-col">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="config">Config</TabsTrigger>
            <TabsTrigger value="output">Output</TabsTrigger>
          </TabsList>
          <TabsContent value="data" className="flex-grow overflow-auto">
            {renderDataTab()}
          </TabsContent>
          <TabsContent value="config" className="flex-grow overflow-auto">
            {renderConfigTab()}
          </TabsContent>
          <TabsContent value="output" className="flex-grow overflow-auto">
            {renderOutputTab()}
          </TabsContent>
        </Tabs>

        {/* Status */}
        {isActive && (
          <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Data extractor active
          </div>
        )}
      </div>
    </div>
  );
});

EmailDataNode.displayName = "EmailDataNode";

// -----------------------------------------------------------------------------
// 6️⃣  Dynamic spec wrapper component
// -----------------------------------------------------------------------------

const EmailDataNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, {});

  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as EmailDataType),
    [
      (nodeData as EmailDataType).expandedSize,
      (nodeData as EmailDataType).collapsedSize,
    ]
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <EmailDataNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
};

export default EmailDataNodeWithDynamicSpec;
