/**
 * Copied from:
 * valadao-sf/smileflow src/components/design-system/ai-native/use-composer-inputs.ts
 * commit: 025f0d525b0889ef62b9fd63b1de79b81542557a
 */

import { useCallback, useState } from "react";
import type { ChangeEvent, ClipboardEvent, DragEvent } from "react";

import type { ComposerEvent } from "./composer-state";

export function useComposerInputs(dispatch: (event: ComposerEvent) => void) {
  const [dropActive, setDropActive] = useState(false);

  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLTextAreaElement>) => {
      const items = event.clipboardData?.items;
      if (items) {
        for (const item of Array.from(items)) {
          if (item.kind === "file" && item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            dispatch({ type: "PASTE_IMAGE", name: file?.name || "imagem colada" });
            return;
          }
        }
      }
    },
    [dispatch],
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDropActive(true);
  }, []);

  const handleDragLeave = useCallback(() => setDropActive(false), []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDropActive(false);
      const files = Array.from(event.dataTransfer?.files ?? []);
      if (files.length > 0) {
        dispatch({ type: "DROP_FILES", names: files.map((file) => file.name) });
      }
    },
    [dispatch],
  );

  const handleFileInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      if (files.length > 0) {
        dispatch({ type: "ADD_FILES", names: files.map((file) => file.name) });
      }
      event.target.value = "";
    },
    [dispatch],
  );

  return {
    dropActive,
    handlePaste,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
  };
}
