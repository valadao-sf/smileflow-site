/**
 * Copied from:
 * valadao-sf/smileflow src/components/design-system/ai-native/ComposerAttachments.tsx
 * commit: b40d0ebaa5fdfb4a8a2adeb42f1b73ebc7ff4e8f
 */

import type { Attachment } from "./composer-state";

export interface ComposerAttachmentsProps {
  attachments: Attachment[];
  onRemove: (id: string) => void;
}

export function ComposerAttachments({ attachments, onRemove }: ComposerAttachmentsProps) {
  if (attachments.length === 0) return null;
  return (
    <div className="sf-composer__attachments">
      {attachments.map((attachment) => (
        <div className="sf-composer__attachment" key={attachment.id}>
          <span>{attachment.name}</span>
          <button
            type="button"
            onClick={() => onRemove(attachment.id)}
            aria-label={`Remover ${attachment.name}`}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
