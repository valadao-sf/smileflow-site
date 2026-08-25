/**
 * Copied from:
 * valadao-sf/smileflow src/lib/composer/composer-state.ts
 * commit: 5510913e6ce3d25a7a92e03469137cf1c450144d
 */

export type ComposerPhase =
  | "idle"
  | "gravando"
  | "transcrevendo"
  | "pensando"
  | "reanalisando"
  | "erro";

export type AttachmentKind = "audio" | "image" | "file" | "pasted-text";

export interface Attachment {
  id: string;
  kind: AttachmentKind;
  name: string;
}

export interface ComposerState {
  phase: ComposerPhase;
  text: string;
  attachments: Attachment[];
  error?: string;
  _nextId: number;
}

export type ComposerEvent =
  | { type: "TYPE"; text: string }
  | { type: "PASTE_TEXT"; text: string }
  | { type: "PASTE_IMAGE"; name: string }
  | { type: "DROP_FILES"; names: string[] }
  | { type: "ADD_FILES"; names: string[] }
  | { type: "MIC_START" }
  | { type: "MIC_STOP" }
  | { type: "TRANSCRIPT_READY"; text: string }
  | { type: "THINK_START" }
  | { type: "DONE" }
  | { type: "FAIL"; error: string }
  | { type: "RESET" };

export const initialComposer: ComposerState = {
  phase: "idle",
  text: "",
  attachments: [],
  error: undefined,
  _nextId: 1,
};

function makeAttachments(
  state: ComposerState,
  kind: AttachmentKind,
  names: string[],
): { attachments: Attachment[]; nextId: number } {
  let nextId = state._nextId;
  const created: Attachment[] = names.map((name) => {
    const attachment: Attachment = { id: `att-${nextId}`, kind, name };
    nextId += 1;
    return attachment;
  });
  return { attachments: [...state.attachments, ...created], nextId };
}

export function hasComposerContent(text: string, attachments: Attachment[]): boolean {
  return text.trim().length > 0 || attachments.length > 0;
}

export function composerSlot(phase: ComposerPhase, hasContent: boolean): "mic" | "send" {
  if (phase === "gravando" || phase === "transcrevendo") return "mic";
  return hasContent ? "send" : "mic";
}

export function composerReducer(state: ComposerState, event: ComposerEvent): ComposerState {
  switch (event.type) {
    case "TYPE":
      return {
        ...state,
        phase: state.phase === "erro" ? "idle" : state.phase,
        text: event.text,
        error: undefined,
      };
    case "PASTE_TEXT":
      return { ...state, text: state.text + event.text };
    case "PASTE_IMAGE": {
      const { attachments, nextId } = makeAttachments(state, "image", [event.name]);
      return { ...state, attachments, _nextId: nextId };
    }
    case "DROP_FILES": {
      const { attachments, nextId } = makeAttachments(state, "file", event.names);
      return { ...state, attachments, _nextId: nextId };
    }
    case "ADD_FILES": {
      const { attachments, nextId } = makeAttachments(state, "file", event.names);
      return { ...state, attachments, _nextId: nextId };
    }
    case "MIC_START":
      return { ...state, phase: "gravando", error: undefined };
    case "MIC_STOP":
      return { ...state, phase: "transcrevendo" };
    case "TRANSCRIPT_READY":
      return {
        ...state,
        phase: "idle",
        text: state.text ? `${state.text} ${event.text}` : event.text,
      };
    case "THINK_START":
      return { ...state, phase: "pensando", error: undefined };
    case "DONE":
      return { ...state, phase: "idle", text: "", attachments: [], error: undefined };
    case "FAIL":
      return { ...state, phase: "erro", error: event.error };
    case "RESET":
      return { ...state, phase: "idle", error: undefined };
    default:
      return state;
  }
}
