import { formatElapsed } from "./format";
import { QUESTIONS } from "./copy";
import type { RecordedAnswer } from "./types";

interface VoiceThreadProps {
  answers: Array<RecordedAnswer | null>;
  current: number;
}

export function VoiceThread({ answers, current }: VoiceThreadProps) {
  return (
    <div className="thread" aria-label="Três recados de voz">
      {QUESTIONS.map((question, index) => {
        const answer = answers[index];
        const isCurrent = index === current;
        const empty = !answer;
        return (
          <article
            key={question.title}
            className={`note${isCurrent ? " note--current" : ""}${empty ? " note--empty" : ""}`}
          >
            <div className="note__kicker">
              <span className="note__index">{index + 1} de 3</span>
              {answer ? (
                <span className="note__body">{formatElapsed(answer.durationS)}</span>
              ) : null}
            </div>
            <p className="note__title">{question.title}</p>
            {answer ? (
              <audio controls preload="metadata" src={answer.url} />
            ) : (
              <p className="note__body">
                {isCurrent ? "Toque no botão para gravar." : "Ainda não gravado."}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
