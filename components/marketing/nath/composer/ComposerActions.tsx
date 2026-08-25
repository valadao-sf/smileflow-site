/**
 * Copied from:
 * valadao-sf/smileflow src/components/design-system/ai-native/ComposerActions.tsx
 * commit: 025f0d525b0889ef62b9fd63b1de79b81542557a
 */

import type { ReactNode } from "react";
import { ArrowUp, AudioLines, Mic, Plus } from "lucide-react";

export interface ComposerActionsProps {
  children: ReactNode;
  onAttach: () => void;
  onMic: () => void;
  onSend: () => void;
  showSend: boolean;
  micActive: boolean;
  micDisabled: boolean;
  sendDisabled: boolean;
  busy: boolean;
}

export function ComposerActions({
  children,
  onAttach,
  onMic,
  onSend,
  showSend,
  micActive,
  micDisabled,
  sendDisabled,
  busy,
}: ComposerActionsProps) {
  return (
    <div className="sf-composer__row">
      <button
        type="button"
        className="sf-composer__btn"
        onClick={onAttach}
        disabled={busy}
        aria-label="Anexar arquivo"
      >
        <Plus size={18} />
      </button>

      {children}

      {showSend ? (
        <button
          type="button"
          className="sf-composer__btn sf-composer__btn--send"
          onClick={onSend}
          disabled={sendDisabled}
          aria-label="Enviar mensagem"
        >
          <ArrowUp size={18} />
        </button>
      ) : (
        <button
          type="button"
          className="sf-composer__btn sf-composer__btn--mic"
          data-active={micActive}
          onClick={onMic}
          disabled={micDisabled}
          aria-label={micActive ? "Parar gravação" : "Gravar áudio"}
        >
          {micActive ? <AudioLines size={18} /> : <Mic size={18} />}
        </button>
      )}
    </div>
  );
}
