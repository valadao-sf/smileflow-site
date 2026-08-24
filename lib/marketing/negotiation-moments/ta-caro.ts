import type { NegotiationMomentConfig, VideoMoment } from "./types";

export const universalMncBridge: VideoMoment = {
  id: "video4",
  assetId: "nathalya-mnc-bridge-universal-v1",
  eyebrow: "Quando a frase muda",
  title: "Você não precisa decorar uma resposta para cada situação.",
  body: "Quando você aprende a conduzir a conversa, consegue lidar com o que a paciente disser.",
  transcript: [
    "Olha só uma coisa que eu vejo acontecer o tempo inteiro.",
    "A profissional aprende o que responder quando a paciente fala ‘tá caro’. Aí aparece uma paciente que fala ‘vou pensar’.",
    "Depois vem ‘preciso falar com meu marido’, ‘na outra clínica ficou mais barato’ ou ‘me manda no WhatsApp que depois eu vejo’.",
    "E vira uma coleção de respostas. Só que negociação não funciona assim.",
    "A objeção é só um momento da conversa. Antes dela teve tudo que você perguntou, o que entendeu, o plano que apresentou e como falou o preço.",
    "No Método Negociação Clínica, eu quero ensinar você a entender o que está acontecendo e saber conduzir o próximo passo. É isso que a gente treina no MNC.",
  ],
  actionLabel: "Ver o método completo",
  asset: { poster: "/images/nathalya-poster.jpg" },
};

export const taCaroMoment: NegotiationMomentConfig = {
  slug: "ta-caro",
  route: "/quando-acham-caro",
  intent: "quando-acham-caro",
  experimentVariant: "story-v2",
  seo: {
    title: "O que responder quando a paciente fala “tá caro” | Nathálya",
    description:
      "Faça uma simulação rápida e veja como Nathálya conduziria essa conversa antes de dar desconto ou defender o preço.",
    canonical: "https://smileflow.com.br/quando-acham-caro",
  },
  visibleTitle: "O que responder quando a paciente fala “tá caro”?",
  video1: {
    id: "video1",
    assetId: "nathalya-ta-caro-video-1",
    eyebrow: "Olha só essa situação",
    title: "Você falou o valor. A paciente respondeu: “Nossa… achei caro.”",
    body: "O que você falaria nessa hora? Responda o que faria de verdade.",
    transcript: [
      "Olha só essa situação.",
      "Você terminou de explicar o tratamento, falou o valor e a paciente olha pra você e fala: ‘Nossa… achei caro.’",
      "O que você fala nessa hora?",
      "Mas responde o que você faria de verdade, tá? Não o que você acha que eu quero ouvir.",
      "Escolhe uma das respostas aqui e depois eu te mostro o que eu faria.",
    ],
    actionLabel: "Responder",
    asset: { poster: "/images/nathalya-poster.jpg" },
  },
  question1: {
    id: "question1",
    speaker: "Paciente",
    quote: "Nossa… achei caro.",
    prompt: "O que você responderia primeiro?",
    options: [
      {
        id: "a",
        label: "Eu consigo olhar uma condição melhor pra você.",
        feedback: {
          title: "Você ofereceu uma condição antes de ouvir o problema.",
          body: "Ela não pediu desconto nem parcelamento. Talvez o valor nem seja o que mais pesou.",
        },
      },
      {
        id: "b",
        label: "Mas esse tratamento é feito com materiais excelentes e…",
        feedback: {
          title: "Você começou a explicar tudo de novo.",
          body: "Mas explicar mais não mostra o que ela chamou de caro. Primeiro, deixa ela explicar.",
        },
      },
      {
        id: "c",
        label: "Quando você diz que ficou caro, o que está pesando mais pra você?",
        feedback: {
          title: "Você abriu espaço para ela explicar.",
          body: "Agora dá para descobrir se o problema é o valor, a forma de pagar ou o momento. Talvez ela ainda não tenha entendido o tratamento que você indicou.",
        },
      },
    ],
    feedbackAction: "Ver Nathálya explicar",
  },
  video2: {
    id: "video2",
    assetId: "nathalya-ta-caro-video-2",
    eyebrow: "Primeiro, entenda",
    title: "Quando a paciente fala “tá caro”, você ainda não sabe o que está caro.",
    body: "Antes de dar desconto, parcelar ou defender seu preço, descubra o que ela quis dizer.",
    transcript: [
      "Quando a paciente fala ‘tá caro’, você ainda não sabe o que está caro.",
      "Pode ser o valor total. Pode ser a parcela. Pode ser o momento dela. Pode ser que ela esteja comparando com outra clínica.",
      "Ou pode ser que ela ainda nem tenha entendido por que aquele é o tratamento que você está indicando.",
      "Se você corre pra dar desconto, parcelar ou defender o preço, você responde uma coisa que ainda nem entendeu.",
      "Eu primeiro perguntaria: ‘Quando você diz que ficou caro, o que está pesando mais pra você?’",
      "Antes de responder uma objeção, eu preciso descobrir qual é a objeção de verdade.",
    ],
    actionLabel: "Ver a frase para usar",
    asset: { poster: "/images/nathalya-poster.jpg" },
  },
  insight1: {
    id: "insight1",
    eyebrow: "O que faltava descobrir",
    title: "Primeiro, descubra o que “caro” quer dizer.",
    body: [
      "Pode ser o valor total. Pode ser a parcela ou o momento. Ela também pode estar comparando com outra clínica.",
      "Também pode faltar clareza sobre o tratamento que você indicou.",
    ],
    phrase: "Quando você diz que ficou caro, o que está pesando mais para você?",
    actionLabel: "Tentar em outra situação",
  },
  question2: {
    id: "question2",
    speaker: "Paciente",
    quote: "É que eu não imaginava gastar tudo isso agora.",
    prompt: "E agora? O que você faria?",
    options: [
      {
        id: "a",
        label: "Quanto você conseguiria pagar por mês?",
        feedback: {
          title: "Você foi direto para a parcela.",
          body: "Pode ser esse o problema. Mas ela ainda não disse que a parcela é o que pesa.",
        },
      },
      {
        id: "b",
        label: "O que te preocupa mais: o valor todo ou pagar agora?",
        feedback: {
          title: "Essa pergunta separa duas coisas diferentes.",
          body: "Uma coisa é achar o valor alto. Outra é não conseguir pagar tudo agora.",
        },
      },
      {
        id: "c",
        label: "Eu tenho uma opção mais simples e mais barata também.",
        feedback: {
          title: "Você diminuiu o tratamento cedo demais.",
          body: "Ela disse que não esperava o valor. Ainda não disse que quer um tratamento menor.",
        },
      },
    ],
    feedbackAction: "Entender o próximo passo",
  },
  insight2: {
    id: "insight2",
    eyebrow: "Presta atenção nesta diferença",
    title: "Ela ainda não recusou o tratamento.",
    body: [
      "Ela disse que não esperava gastar aquele valor agora.",
      "Isso não é o mesmo que dizer que não pode ou não quer fazer.",
      "Para. Pergunta. Entende. Depois negocia.",
    ],
    phrase: "É o valor todo ou a forma de pagar agora?",
    actionLabel: "Abrir meu guia",
  },
  gift: {
    title: "6 perguntas para fazer antes de dar desconto",
    subtitle: "Quando a paciente fala que está caro",
    intro: "Escolha uma pergunta. Faça e espere a resposta. Não tente usar todas de uma vez.",
    phrases: [
      "O que está pesando mais para você?",
      "É o valor todo ou a forma de pagar agora?",
      "Você tinha outro valor em mente?",
      "Você está comparando com alguma outra opção?",
      "O que ainda precisa ficar claro sobre o tratamento?",
      "Se a forma de pagamento ficasse melhor, faria sentido começar?",
    ],
    rule: "Pergunte uma coisa por vez. Depois, escute.",
    fileName: "6-perguntas-antes-de-dar-desconto.png",
  },
  supportingContent: {
    eyebrow: "Quando a conversa chega no preço",
    title: "Por que a gente trava quando a paciente fala que está caro?",
    paragraphs: [
      "É comum tentar preencher o silêncio. Você explica o tratamento de novo, abre a calculadora ou oferece uma opção mais barata antes de entender a dúvida.",
      "Isso acontece porque o “tá caro” parece uma recusa. Mas ela pode estar falando do valor total, da forma de pagamento, do momento ou de uma comparação. Talvez ela ainda tenha dúvida sobre o tratamento.",
    ],
    actionTitle: "O que fazer primeiro",
    actionParagraphs: [
      "Não discuta o preço nem dê desconto de imediato. Faça uma pergunta curta e espere a resposta.",
      "Depois de entender, você consegue responder ao problema que ela trouxe.",
    ],
    phrase: "Quando você diz que ficou caro, o que está pesando mais para você?",
    faq: [
      {
        question: "O que responder quando a paciente fala que está caro?",
        answer: "Comece perguntando o que ela chamou de caro. Pode ser o valor total, a parcela, o momento ou outra dúvida sobre o tratamento.",
      },
      {
        question: "Devo dar desconto quando a paciente reclama do preço?",
        answer: "Não antes de entender o problema. Se você oferece desconto imediatamente, pode negociar uma coisa que a paciente nem pediu.",
      },
      {
        question: "Como defender o preço do tratamento?",
        answer: "Primeiro, escute. Se ela não entendeu o tratamento, explique o necessário. Se o problema for a forma de pagamento, fale sobre isso depois.",
      },
    ],
  },
  video4: universalMncBridge,
  offer: {
    eyebrow: "Método Negociação Clínica",
    title: "Aprenda a conduzir a conversa até a decisão.",
    body: "Mesmo quando a paciente responde algo que você não esperava.",
    product: "Método Negociação Clínica",
    detail: "Da primeira pergunta até a decisão.",
    actionLabel: "Quero conhecer o MNC",
    destination: "https://smileflow.com.br/negociacao-clinica",
  },
};
