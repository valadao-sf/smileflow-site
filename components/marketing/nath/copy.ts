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

export const IDENTITY_PROMPTS = ["Como eu te chamo?", "Qual é o seu Instagram?"] as const;

export const SUCCESS_CTA = "Assistir ao vídeo da Nath";
export const SUCCESS_HREF = "https://smileflow.me/negociacao-clinica";
