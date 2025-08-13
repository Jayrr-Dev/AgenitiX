"use client";
/**
 * Route: features/business-logic-modern/node-domain/email/components/EmailDesignerModal.tsx
 * EMAIL DESIGNER MODAL – GrapesJS (MJML) editor in a modal
 *
 * • Centers in viewport with smooth enter animation and safe margins
 * • Uses `grapesjs` + `grapesjs-mjml` for email-optimized editing
 * • Returns compiled HTML and extracted text to parent via onSave
 * • Client-only; avoids SSR hydration pitfalls
 *
 * Keywords: grapesjs, mjml, email-designer, modal
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// [Explanation], basically load GrapesJS styles globally once
import "grapesjs/dist/css/grapes.min.css";
// [Explanation], basically bring in starter templates for quick loading
import { STARTER_TEMPLATES, type StarterTemplate } from "../data/starterTemplates";

type EmailDesignerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialHtml?: string;
  onSave: (data: { html: string; text: string; design?: unknown }) => void;
};

export default function EmailDesignerModal({ isOpen, onClose, initialHtml, onSave }: EmailDesignerModalProps) {
  const [isClient, setIsClient] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoaderOpen, setIsLoaderOpen] = useState(false);
  const [templateQuery, setTemplateQuery] = useState("");
  const [templateCategory, setTemplateCategory] = useState<string>("all");
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const destroyTimerRef = useRef<number | null>(null);
  const modalRootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setIsClient(true); }, []);

  // Lock background scroll while modal is open
  useEffect(() => {
    if (!isClient) return;
    if (!isOpen) return;
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

  // Initialize GrapesJS
  useEffect(() => {
    if (!isClient || !isOpen) return;

    const init = async () => {
      try {
        let attempts = 0;
        while (attempts < 20) {
          if (
            containerRef.current &&
            containerRef.current.isConnected &&
            modalRootRef.current &&
            modalRootRef.current.isConnected
          ) break;
          await new Promise((r) => setTimeout(r, 50));
          attempts++;
        }
        if (!containerRef.current || !modalRootRef.current) return;

        const { default: grapesjs } = await import("grapesjs");
        const { default: grapesjsMjml } = await import("grapesjs-mjml");

        const ed = grapesjs.init({
          container: containerRef.current,
          height: "calc(100% - 0px)",
          width: "100%",
          storageManager: false,
          fromElement: false,
          plugins: [grapesjsMjml],
          pluginsOpts: { [grapesjsMjml as unknown as string]: {} },
          // [Explanation], basically attach color picker within the modal to keep it in bounds
          colorPicker: {
            appendTo: (modalRootRef.current as unknown as HTMLElement) || (document.body as HTMLElement)
          },
        });

        // If initialHtml provided, set it, otherwise default MJML
        const defaultMjml = initialHtml ?? `
          <mjml>
            <mj-body background-color="#f6f6f6">
              <mj-section background-color="#ffffff">
                <mj-column>
                  <mj-text align="center" font-size="22px" font-weight="700">Welcome to Email Designer</mj-text>
                  <mj-text align="center" color="#666">Drag blocks from the left panel to start building your email template.</mj-text>
                  <mj-button background-color="#007cba" color="#ffffff" href="#">Get Started</mj-button>
                </mj-column>
              </mj-section>
            </mj-body>
          </mjml>
        `;
        ed.setComponents(defaultMjml);
        ed.refresh();

        // [Explanation], basically ensure a valid target for style manager by selecting wrapper
        try {
          const wrapper = ed.getWrapper?.();
          if (wrapper && ed.select) ed.select(wrapper);
        } catch {}

        ed.on("component:add component:remove component:update style:change", () => setHasUnsavedChanges(true));
        editorRef.current = { ed };
      } catch (e) {
        console.error("EmailDesignerModal: GrapesJS init failed", e);
      }
    };

    // next frame
    const t = requestAnimationFrame(() => { void init(); });
    return () => {
      cancelAnimationFrame(t);
      // [Explanation], basically delay destroy to avoid race with document-level clickout handlers
      if (destroyTimerRef.current) {
        window.clearTimeout(destroyTimerRef.current);
        destroyTimerRef.current = null;
      }
      const ed = editorRef.current?.ed;
      if (ed) {
        try {
          // [Explanation], basically deselect interactive inputs to stop external listeners
          (document.activeElement as HTMLElement | null)?.blur?.();
        } catch {}
        destroyTimerRef.current = window.setTimeout(() => {
          try { ed.destroy?.(); } catch {}
          editorRef.current = null;
          destroyTimerRef.current = null;
        }, 120);
      } else {
        editorRef.current = null;
      }
    };
  }, [isClient, isOpen, initialHtml]);

  const handleSave = useCallback(() => {
    const bundle = editorRef.current as { ed: any } | null;
    if (!bundle?.ed) return;
    const { ed } = bundle;
    const html = ed.getHtml?.() || "";
    const css = ed.getCss?.() || "";
    const compiledHtml = css ? `${html}\n<style>${css}</style>` : html;
    const text = compiledHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    onSave({ html: compiledHtml, text, design: undefined });
  }, [onSave]);

  const handleOpenLoader = useCallback(() => {
    setIsLoaderOpen(true);
  }, []);

  const handleCloseLoader = useCallback(() => {
    setIsLoaderOpen(false);
    setTemplateQuery("");
    setTemplateCategory("all");
  }, []);

  const handleUseTemplate = useCallback((tpl: StarterTemplate) => {
    const bundle = editorRef.current as { ed: any } | null;
    if (!bundle?.ed) return;
    const { ed } = bundle;
    // [Explanation], basically replace canvas with chosen template content
    ed.setComponents(tpl.htmlContent || "");
    ed.refresh?.();
    try {
      const wrapper = ed.getWrapper?.();
      if (wrapper && ed.select) ed.select(wrapper);
    } catch {}
    setHasUnsavedChanges(true);
    setIsLoaderOpen(false);
  }, []);

  // [Explanation], basically close safely by letting external clickout handlers finish
  const handleSafeClose = useCallback(() => {
    try { (document.activeElement as HTMLElement | null)?.blur?.(); } catch {}
    window.setTimeout(() => onClose(), 60);
  }, [onClose]);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    for (const t of STARTER_TEMPLATES) set.add(t.category);
    return ["all", ...Array.from(set)];
  }, []);

  const filteredTemplates = React.useMemo(() => {
    const q = templateQuery.trim().toLowerCase();
    return STARTER_TEMPLATES.filter((t) => {
      const inCat = templateCategory === "all" || t.category === templateCategory;
      if (!q) return inCat;
      const hay = `${t.name} ${t.subject} ${t.description} ${t.tags.join(" ")}`.toLowerCase();
      return inCat && hay.includes(q);
    });
  }, [templateQuery, templateCategory]);

  if (!isClient || !isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-[2147483647] bg-black/60 flex items-center justify-center p-6" onClick={onClose}>
      <div
        className={`relative flex h-[min(90vh,850px)] w-[min(96vw,1200px)] flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl transform-gpu transition-all duration-200 ease-out ${isEntering ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-1 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
        ref={panelRef}
      >
        <div className="flex h-12 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Email Designer {hasUnsavedChanges && <span className="text-orange-500 text-sm">(Unsaved Changes)</span>}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={handleOpenLoader} className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700">Load</button>
            <button onClick={handleSave} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
            <button onClick={handleSafeClose} className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">Close</button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden relative p-2">
          <div ref={containerRef} id="gjs-email-editor" style={{ height: '100%', width: '100%', minHeight: '400px', position: 'relative' }} />

          {isLoaderOpen && (
            <div className="absolute inset-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Starter Templates</span>
                  <input
                    value={templateQuery}
                    onChange={(e) => setTemplateQuery(e.target.value)}
                    placeholder="Search templates..."
                    className="h-9 w-64 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <select
                    value={templateCategory}
                    onChange={(e) => setTemplateCategory(e.target.value)}
                    className="h-9 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleCloseLoader} className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">Close</button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-auto">
                {filteredTemplates.map((tpl) => (
                  <div key={tpl.id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 flex flex-col">
                    <div className="mb-2">
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{tpl.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{tpl.category}</div>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 mb-3">{tpl.description}</div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {tpl.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">{tag}</span>
                        ))}
                      </div>
                      <button onClick={() => handleUseTemplate(tpl)} className="px-2 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700">Use</button>
                    </div>
                  </div>
                ))}
                {filteredTemplates.length === 0 && (
                  <div className="col-span-full text-center text-sm text-gray-500 dark:text-gray-400 py-8">No templates found.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}


