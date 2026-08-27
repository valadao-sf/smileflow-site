/**
 * Copied from:
 * valadao-sf/smileflow src/app/dashboard/_olana/i18n.ts
 * commit: 02b052e
 *
 * Only composer/attachment strings used after Olana-agent tools were removed.
 */

interface ComposerDictionary {
  fileTooLarge: string;
  fileTypeNotAllowed: string;
  removeAttachment: string;
  voiceStart: string;
  recordingNow: string;
  transcribingNote: string;
  transcriptFailedNote: string;
  micUnavailable: string;
  audioTranscriptLabel: string;
  attachmentMarker: string;
  kindImage: string;
  kindAudio: string;
  kindFile: string;
  toolsMenu: string;
  toolAttach: string;
  toolAttachHint: string;
  dropOverlay: string;
}

const DICTIONARY: ComposerDictionary = {
  fileTooLarge: "{name} passa do limite de 10 MB.",
  fileTypeNotAllowed: "Tipo de arquivo não suportado: {name}",
  removeAttachment: "Remover anexo",
  voiceStart: "Gravar áudio",
  recordingNow: "Gravando",
  transcribingNote: "Transcrevendo áudio…",
  transcriptFailedNote: "Sem transcrição — o áudio continua anexado.",
  micUnavailable: "Não consegui acessar o microfone.",
  audioTranscriptLabel: "«Transcrição do áudio \"{name}\":»",
  attachmentMarker: "[Anexo: {name} ({kind})]",
  kindImage: "imagem",
  kindAudio: "áudio",
  kindFile: "arquivo",
  toolsMenu: "Ferramentas",
  toolAttach: "Anexar arquivo",
  toolAttachHint: "Foto, áudio, PDF ou texto",
  dropOverlay: "Solte os arquivos para anexar",
};

export type ComposerI18nKey = keyof ComposerDictionary;

export function t(key: ComposerI18nKey, vars?: Record<string, string | number>): string {
  const template = DICTIONARY[key];
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/gu, (raw, name: string) => (
    name in vars ? String(vars[name]) : raw
  ));
}
