"use client";
/**
 * Route: features/business-logic-modern/node-domain/email/components/EmailPreviewModal.tsx
 * EMAIL PREVIEW MODAL – Full email preview in modal with realistic email UI
 *
 * • Modal overlay with centered email preview window
 * • Realistic email client interface (Gmail/Outlook style)
 * • Proper email header with from/to/subject/date
 * • HTML content rendering in iframe for safety
 * • Variable preview and compilation display
 * • Responsive design with proper email typography
 *
 * Keywords: email-preview, modal, email-ui, template-preview, realistic-rendering
 */

import React, { useCallback, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  X, 
  User, 
  Calendar,
  Clock,
  Eye,
  Code,
  Monitor,
  Smartphone
} from "lucide-react";

interface CompiledTemplate {
  subject: string;
  html: string;
  text: string;
  variables: Record<string, string>;
}

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateName?: string;
  compiledTemplate: CompiledTemplate | null;
  variables?: Array<{
    name: string;
    type: string;
    defaultValue: string;
    description: string;
  }>;
}

const MODAL_STYLES = {
  overlay: "fixed inset-0 z-[2147483647] bg-black/60 flex items-center justify-center p-4",
  container: "relative flex h-[min(95vh,900px)] w-[min(98vw,1400px)] flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl transform-gpu transition-all duration-200 ease-out overflow-hidden",
  header: "flex h-14 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800",
  content: "flex-1 flex overflow-hidden",
  sidebar: "w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-auto",
  emailViewer: "flex-1 flex flex-col bg-white dark:bg-gray-900",
  emailHeader: "border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800",
  emailContent: "flex-1 overflow-auto",
} as const;

const EMAIL_STYLES = {
  fromLine: "flex items-center gap-3 mb-3",
  avatar: "w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm",
  senderInfo: "flex-1",
  senderName: "font-semibold text-gray-900 dark:text-gray-100 text-sm",
  senderEmail: "text-gray-600 dark:text-gray-400 text-xs",
  timestamp: "text-gray-500 dark:text-gray-500 text-xs",
  subject: "font-bold text-xl text-gray-900 dark:text-gray-100 mb-4",
  contentFrame: "w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white",
} as const;

export default function EmailPreviewModal({ 
  isOpen, 
  onClose, 
  templateName, 
  compiledTemplate,
  variables 
}: EmailPreviewModalProps) {
  const [isClient, setIsClient] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showVariables, setShowVariables] = useState(true);

  useEffect(() => { setIsClient(true); }, []);

  // Lock background scroll while modal is open
  useEffect(() => {
    if (!isClient || !isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isClient, isOpen]);

  // Enter animation
  useEffect(() => {
    if (!isClient) return;
    setIsEntering(false);
    if (!isOpen) return;
    const t = setTimeout(() => setIsEntering(true), 10);
    return () => clearTimeout(t);
  }, [isOpen, isClient]);

  const handleClose = useCallback(() => {
    setIsEntering(false);
    setTimeout(onClose, 150);
  }, [onClose]);

  if (!isClient || !isOpen) return null;

  const currentTime = new Date().toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const modal = (
    <div className={MODAL_STYLES.overlay} onClick={handleClose}>
      <div
        className={`${MODAL_STYLES.container} ${isEntering ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-98'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={MODAL_STYLES.header}>
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Email Preview
            </h2>
            {templateName && (
              <Badge variant="outline" className="text-xs">
                {templateName}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
              <Button
                variant={viewMode === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('desktop')}
                className="h-8 px-3 rounded-r-none border-r"
              >
                <Monitor className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('mobile')}
                className="h-8 px-3 rounded-l-none"
              >
                <Smartphone className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVariables(!showVariables)}
              className="h-8 px-3"
            >
              <Code className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Modal Content */}
        <div className={MODAL_STYLES.content}>
          {/* Sidebar - Variables & Info */}
          {showVariables && (
            <div className={MODAL_STYLES.sidebar}>
              <div className="p-4">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3">
                  Template Info
                </h3>
                
                {compiledTemplate && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Subject
                      </label>
                      <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                        {compiledTemplate.subject || "No subject"}
                      </div>
                    </div>

                    {variables && variables.length > 0 && (
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          Variables ({variables.length})
                        </label>
                        <div className="mt-2 space-y-2">
                          {variables.map((variable, index) => (
                            <div key={index} className="p-2 bg-white dark:bg-gray-800 rounded border">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                  {variable.name}
                                </span>
                                <Badge variant="secondary" className="text-[10px]">
                                  {variable.type}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Value: {compiledTemplate.variables[variable.name] || variable.defaultValue || "N/A"}
                              </div>
                              {variable.description && (
                                <div className="text-[10px] text-gray-500 dark:text-gray-500">
                                  {variable.description}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Email Viewer */}
          <div className={MODAL_STYLES.emailViewer}>
            {/* Email Header */}
            <div className={MODAL_STYLES.emailHeader}>
              <div className={EMAIL_STYLES.fromLine}>
                <div className={EMAIL_STYLES.avatar}>
                  <User className="w-5 h-5" />
                </div>
                <div className={EMAIL_STYLES.senderInfo}>
                  <div className={EMAIL_STYLES.senderName}>
                    Your Company
                  </div>
                  <div className={EMAIL_STYLES.senderEmail}>
                    noreply@yourcompany.com
                  </div>
                </div>
                <div className="text-right">
                  <div className={EMAIL_STYLES.timestamp}>
                    <Calendar className="w-3 h-3 inline mr-1" />
                    {currentTime}
                  </div>
                </div>
              </div>
              
              <Separator className="my-3" />
              
              <div className={EMAIL_STYLES.subject}>
                {compiledTemplate?.subject || "Email Subject"}
              </div>
            </div>

            {/* Email Content */}
            <div className={MODAL_STYLES.emailContent}>
              <div className={`p-4 ${viewMode === 'mobile' ? 'max-w-sm mx-auto' : ''}`}>
                {compiledTemplate?.html ? (
                  <div className={EMAIL_STYLES.contentFrame}>
                    <iframe
                      srcDoc={`
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <meta charset="utf-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1">
                            <style>
                              body { 
                                margin: 0; 
                                padding: 20px; 
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                                font-size: 16px;
                                line-height: 1.6;
                                color: #333;
                                background: #ffffff;
                              }
                              * { box-sizing: border-box; }
                              img { max-width: 100%; height: auto; }
                              table { border-collapse: collapse; width: 100%; }
                              a { color: #007cba; text-decoration: none; }
                              a:hover { text-decoration: underline; }
                              h1, h2, h3, h4, h5, h6 { margin: 0 0 16px 0; font-weight: 600; }
                              p { margin: 0 0 16px 0; }
                              .email-container { max-width: 600px; margin: 0 auto; }
                            </style>
                          </head>
                          <body>
                            <div class="email-container">
                              ${compiledTemplate.html}
                            </div>
                          </body>
                        </html>
                      `}
                      className="w-full border-0"
                      style={{ 
                        height: viewMode === 'mobile' ? '500px' : '600px',
                        minHeight: '400px'
                      }}
                      title="Email Content Preview"
                      sandbox="allow-same-origin"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <div className="text-center">
                      <Eye className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600 dark:text-gray-400 font-medium">
                        No email content to preview
                      </p>
                      <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                        Create content using the designer or add HTML content
                      </p>
                    </div>
                  </div>
                )}

                {/* Plain Text Fallback */}
                {compiledTemplate?.text && !compiledTemplate?.html && (
                  <div className={EMAIL_STYLES.contentFrame}>
                    <div className="p-6 whitespace-pre-wrap text-gray-900 dark:text-gray-100 font-mono text-sm leading-relaxed">
                      {compiledTemplate.text}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
