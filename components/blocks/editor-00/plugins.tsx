import { useState, useEffect } from "react"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
  EditorState,
} from "lexical"
import { mergeRegister } from "@lexical/utils"
import { Bold, Italic, Underline } from "lucide-react"

import { ContentEditable } from "../../editor/editor-ui/content-editable"

// Simple toolbar for basic formatting
function Toolbar() {
  const [editor] = useLexicalComposerContext()

  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)

  const syncFromState = (editorState: EditorState) => {
    editorState.read(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        setIsBold(selection.hasFormat("bold"))
        setIsItalic(selection.hasFormat("italic"))
        setIsUnderline(selection.hasFormat("underline"))
      } else {
        setIsBold(false)
        setIsItalic(false)
        setIsUnderline(false)
      }
    })
  }

  useEffect(() => {
    // Initial sync
    syncFromState(editor.getEditorState())

    const unregister = mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        syncFromState(editorState)
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          syncFromState(editor.getEditorState())
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
    )

    return () => unregister()
  }, [editor])

  const baseBtn =
    "p-1 rounded transition-colors text-foreground/80 hover:bg-white/10 dark:hover:bg-white/10"
  const activeBtn = "bg-white/15 dark:bg-white/15 ring-1 ring-white/20"

  const toggle = (format: "bold" | "italic" | "underline") => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)
    // Immediate visual feedback; will be corrected on next update if needed
    const state = editor.getEditorState()
    syncFromState(state)
  }

  return (
    <div className="flex items-center gap-0.5 px-2 py-1 border-b border-border bg-muted/30 text-[10px]">
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => toggle("bold")}
        className={`${baseBtn} ${isBold ? activeBtn : ""}`}
        title="Bold"
        aria-pressed={isBold}
      >
        <Bold className="h-2.5 w-2.5" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => toggle("italic")}
        className={`${baseBtn} ${isItalic ? activeBtn : ""}`}
        title="Italic"
        aria-pressed={isItalic}
      >
        <Italic className="h-2.5 w-2.5" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => toggle("underline")}
        className={`${baseBtn} ${isUnderline ? activeBtn : ""}`}
        title="Underline"
        aria-pressed={isUnderline}
      >
        <Underline className="h-2.5 w-2.5" />
      </button>
    </div>
  )
}

export function Plugins({ placeholder = "Start typing ..." }: { placeholder?: string }) {
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null)

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem)
    }
  }

  return (
    <div className="relative">
      {/* Toolbar */}
      <Toolbar />
      
      {/* Main editor area */}
      <div className="relative">
        <RichTextPlugin
          contentEditable={
            <div className="relative">
              <div className="" ref={onRef}>
                <ContentEditable 
                  placeholder=""
                  className="relative block min-h-20 overflow-auto px-3 py-0 focus:outline-none text-[10px] cursor-text bg-transparent border-0 resize-none"
                />
              </div>
            </div>
          }
          placeholder={
            <div className="text-muted-foreground pointer-events-none absolute top-0 left-0 overflow-hidden px-3 py-1.5 text-ellipsis select-none text-[10px]">
              {placeholder}
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        
        {/* Essential plugins for functionality */}
        <HistoryPlugin />
        <AutoFocusPlugin />
      </div>
    </div>
  )
}
