export const LANDING_TITLE = "Fala comigo 🎙️";

export const LANDING_BODY =
  "Tem uma pergunta, uma conversa que você quer que eu veja ou um caso em que queria minha opinião? Me manda.";

export const INSTAGRAM_BROWSER_HINT =
  "Para gravar seus áudios, toque em ··· e abra esta página no Safari ou no Chrome.";

export interface LandingOption {
  id: "a" | "b" | "c";
  title: string;
  body: string;
  enabled: boolean;
}

export const LANDING_OPTIONS: readonly LandingOption[] = [
  {
    id: "a",
    title: "🎙️ Quero te fazer uma pergunta",
    body: "Pergunta qualquer coisa.",
    enabled: true,
  },
  {
    id: "b",
    title: "📲 Analisa essa conversa pra mim",
    body: "Manda os prints e me conta o que aconteceu.",
    enabled: false,
  },
  {
    id: "c",
    title: "🧠 Quero te contar meu caso",
    body: "Me dá mais contexto para eu conseguir olhar mais fundo.",
    enabled: false,
  },
];

export const CONTACT_LABELS = {
  name: "Como eu te chamo?",
  whatsapp: "Seu WhatsApp",
  instagram: "Seu Instagram",
} as const;

export interface QuestionCopy {
  title: string;
  help: string;
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

export const CONSENT_LABEL =
  "Autorizo a Nath e a equipe SmileFlow a ouvir estes áudios e usar meus dados para responder esta pergunta.";

export const SUCCESS_CTA = "Assistir ao vídeo da Nath";

export const SUCCESS_TITLE = "Áudios enviados.";

export const SUCCESS_BODY = "A Nath recebeu sua pergunta.";

export const SUCCESS_HREF = "https://smileflow.me/negociacao-clinica";
