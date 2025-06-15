import React, { useState } from "react";
import ActionToolbar from "../features/business-logic-modern/infrastructure/action-toolbar/ActionToolbar";
import {
  UndoRedoContextType,
  UndoRedoProvider,
  useRegisterUndoRedoManager,
} from "../features/business-logic-modern/infrastructure/action-toolbar/history/UndoRedoContext";

// ---------------------------------------------------------------------------
// MOCK PROVIDER – Supplies canUndo / canRedo and stubbed callbacks
// ---------------------------------------------------------------------------
const MockManager: React.FC<{ canUndo: boolean; canRedo: boolean }> = ({
  canUndo,
  canRedo,
}) => {
  const registerManager = useRegisterUndoRedoManager();

  React.useEffect(() => {
    const mock: UndoRedoContextType = {
      undo: () => true,
      redo: () => true,
      recordAction: () => {},
      recordActionDebounced: () => {},
      clearHistory: () => {},
      removeSelectedNode: () => false,
      getHistory: () => ({
        entries: [],
        currentIndex: -1,
        canUndo,
        canRedo,
      }),
      getFullGraph: () => null,
    } as UndoRedoContextType;

    registerManager(mock);
  }, [canUndo, canRedo, registerManager]);

  return null;
};

// ---------------------------------------------------------------------------
// STORY CONFIG
// ---------------------------------------------------------------------------
export default {
  title: "Components/ActionToolbar/Preview",
  parameters: { layout: "centered" },
  argTypes: {
    showHistoryPanel: {
      control: "boolean",
    },
    canUndo: {
      control: "boolean",
    },
    canRedo: {
      control: "boolean",
    },
  },
  args: {
    showHistoryPanel: false,
    canUndo: true,
    canRedo: false,
  },
};

type ToolbarProps = {
  showHistoryPanel: boolean;
  canUndo: boolean;
  canRedo: boolean;
};

export const InteractiveToolbar = ({
  showHistoryPanel,
  canUndo,
  canRedo,
}: ToolbarProps) => {
  const [historyVisible, setHistoryVisible] = useState(showHistoryPanel);

  return (
    <UndoRedoProvider>
      <MockManager canUndo={canUndo} canRedo={canRedo} />
      <ActionToolbar
        showHistoryPanel={historyVisible}
        onToggleHistory={() => setHistoryVisible((prev) => !prev)}
      />
    </UndoRedoProvider>
  );
};
