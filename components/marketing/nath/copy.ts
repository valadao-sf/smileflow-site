export interface QuestionCopy {
  help: string;
  title: string;
}

export const QUESTIONS: readonly QuestionCopy[] = [
  {
    title: "O que você quer me perguntar?",
    help: "Pode perguntar do seu jeito. Venda, paciente, dinheiro, trabalho, carreira, alguma coisa que você viveu ou simplesmente algo em que quer saber o que eu penso.",
  },
  {
    title: "Agora me conta um pouco de você.",
    help: "O que você faz? Em que momento você está? E o que eu preciso saber sobre você para entender melhor essa pergunta?",
  },
  {
    title: "O que fez essa pergunta aparecer pra você agora?",
    help: "Aconteceu alguma coisa? Tem alguma história por trás? Se tiver, me conta.",
  },
];

export const INSTAGRAM_QUESTION = "Qual é o seu Instagram?";

export const PROFILE_TITLE = "Antes de começar";
export const PROFILE_PROMPT = "Como eu te chamo?";
export const NAME_CONSENT = "Autorizo falar meu nome nas redes sociais";

export const FINAL_CONSENT_TITLE = "Antes de encerrar…";
export const FINAL_CONSENT_COPY = "A sua história pode ajudar mais pessoas. Posso marcar o seu Instagram se eu compartilhar um trecho da sua pergunta nas redes sociais?";
export const TAG_CONSENT = "Autorizo marcar meu Instagram nas redes sociais";

export const SUCCESS_COPY = "Pergunta enviada.";
export const SUCCESS_BODY = "Quer continuar essa conversa? Entre no grupo VIP para acompanhar os próximos conteúdos.";
export const SUCCESS_CTA = "Entrar no grupo VIP";
// Canonical group already used by the published closing diagnostic.
export const SUCCESS_HREF = "https://chat.whatsapp.com/Cohdt0uEhbAEQA63jp1RUL?mode=gi_t";
