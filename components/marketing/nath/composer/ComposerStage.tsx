/**
 * Copied from:
 * valadao-sf/smileflow src/components/design-system/ai-native/ComposerStage.tsx
 * commit: 5510913e6ce3d25a7a92e03469137cf1c450144d
 */

import type { ComposerPhase } from "./composer-state";

const STAGE_LABEL: Record<ComposerPhase, string> = {
  idle: "",
  gravando: "Gravando…",
  transcrevendo: "Transcrevendo…",
  pensando: "Pensando…",
  reanalisando: "Reanalisando…",
  erro: "Algo deu errado.",
};

export interface ComposerStageProps {
  phase: ComposerPhase;
  error?: string;
  barLevels: number[];
  onBarMount?: (index: number, element: HTMLSpanElement | null) => void;
}

export function ComposerStage({ phase, error, barLevels, onBarMount }: ComposerStageProps) {
  if (phase === "idle") return null;
  return (
    <div className="sf-composer__stage" data-phase={phase}>
      {phase === "gravando" && (
        <span className="sf-composer__bars" aria-hidden="true">
          {barLevels.map((level, index) => (
            <span
              key={index}
              className="sf-composer__bar"
              ref={(element) => onBarMount?.(index, element)}
              style={{ transform: `scaleY(${Math.max(0.15, level)})` }}
            />
          ))}
        </span>
      )}
      <span>{phase === "erro" ? error || STAGE_LABEL.erro : STAGE_LABEL[phase]}</span>
    </div>
  );
}
