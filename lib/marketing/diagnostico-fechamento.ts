export type AnswerOption = {
  id: string;
  label: string;
};

export type DiagnosticQuestion = {
  id: string;
  fieldId: string;
  title: string;
  options: AnswerOption[];
  background: string;
};

export const VIP_GROUP_URL = "";

export const questions: DiagnosticQuestion[] = [
  {
    id: "price-reaction",
    fieldId: "0af600bc-4fd0-4bc9-83e6-f3e3c3eecef7",
    title: "Na hora de falar o valor total, o que costuma acontecer com você?",
    background: "/images/diagnostico-fechamento/question-price-v2.webp",
    options: [
      { id: "d55bb268-5440-4c28-8839-3f76a5bfe502", label: "Eu travo, gaguejo ou sinto frio na barriga." },
      { id: "3a419419-ddc0-4007-8a94-e3e51301b99c", label: "Eu acelero a fala para acabar logo." },
      { id: "638b08d4-029f-4e9c-af87-d9a4d65d6408", label: "Sinto culpa, como se estivesse cobrando demais." },
      { id: "6f648a73-e3b6-4d3d-bbb1-3330ba88a607", label: "Falo com calma e consigo esperar a resposta." },
    ],
  },
  {
    id: "early-concession",
    fieldId: "86d3c78f-0c7a-45a5-9928-42876036fc36",
    title: "Antes de a paciente pedir, você já oferece desconto ou uma forma mais fácil de pagar?",
    background: "/images/diagnostico-fechamento/question-discount-v2.webp",
    options: [
      { id: "db752d5e-9149-46b4-90f9-6d2c9a2f249d", label: "Quase sempre. Faço isso por medo de ouvir um não." },
      { id: "e4551ac4-ced9-4fec-bc63-1987d29cc8bf", label: "Às vezes. Depende da cara ou da reação dela." },
      { id: "f62cc9d3-f2ad-40fd-9889-3032790dc09b", label: "Raramente. Só em algumas conversas." },
      { id: "482c3fe1-6b9f-41bd-84fc-a2887a014a79", label: "Nunca. Espero a resposta antes de negociar." },
    ],
  },
  {
    id: "automatic-thought",
    fieldId: "bcf4326d-6f14-495a-9f9a-41dbb6518a77",
    title: "Quando a paciente fica em silêncio ou questiona o valor, qual pensamento aparece primeiro?",
    background: "/images/diagnostico-fechamento/question-thought-v2.webp",
    options: [
      { id: "bf306b36-8467-401b-b279-b974eb4b36f2", label: "Ela vai me achar interesseira." },
      { id: "df8c39ae-fad1-4c9d-8a09-05fdfe6a0bb6", label: "Fico com pena. Acho que está pesado para ela." },
      { id: "910b8505-b57f-489b-9964-8c6391a8969f", label: "Será que eu sou boa o bastante para cobrar isso?" },
      { id: "589e6e76-b0df-4752-a39f-333eeb8d3327", label: "Ela vai procurar alguém mais barato e eu vou perder a venda." },
    ],
  },
];

const diagnosisByThought: Record<string, { title: string; explanation: string }> = {
  "bf306b36-8467-401b-b279-b974eb4b36f2": {
    title: "Você tem medo de ser malvista",
    explanation: "Na hora de falar o preço, você pensa primeiro no que a paciente vai achar de você. Esse medo aparece antes mesmo de ela responder. O silêncio pesa. Então você pode falar rápido, se explicar demais ou tentar aliviar a conversa.",
  },
  "df8c39ae-fad1-4c9d-8a09-05fdfe6a0bb6": {
    title: "Você sente culpa de cobrar",
    explanation: "Você sente o peso do preço como se ele também fosse seu. Antes de a paciente dizer o que cabe no bolso dela, você já fica com pena. É nessa hora que o desconto ou o parcelamento podem aparecer cedo demais.",
  },
  "910b8505-b57f-489b-9964-8c6391a8969f": {
    title: "Você duvida do seu valor",
    explanation: "Quando a paciente questiona o preço, você começa a questionar o seu trabalho. A reação dela parece uma prova de que você está cobrando demais. A conversa deixa de ser sobre o tratamento e vira uma dúvida sobre você.",
  },
  "589e6e76-b0df-4752-a39f-333eeb8d3327": {
    title: "Você tem medo de perder a paciente",
    explanation: "Você ouve uma dúvida e já imagina a paciente indo embora. O medo de perder a venda toma conta da conversa. A pressa aparece antes de você entender o que incomodou a paciente.",
  },
};

const reactionByAnswer: Record<string, string> = {
  "d55bb268-5440-4c28-8839-3f76a5bfe502": "Seu corpo trava quando chega a hora de falar o preço.",
  "3a419419-ddc0-4007-8a94-e3e51301b99c": "Você tenta passar pela parte do preço o mais rápido possível.",
  "638b08d4-029f-4e9c-af87-d9a4d65d6408": "Você fala o preço já sentindo que precisa se justificar.",
  "6f648a73-e3b6-4d3d-bbb1-3330ba88a607": "Você consegue falar o preço com calma. A insegurança pode aparecer logo depois.",
};

export function buildDiagnosis(answers: Record<string, string>) {
  return {
    ...(diagnosisByThought[answers[questions[2].fieldId]] ?? diagnosisByThought[questions[2].options[0].id]),
    reaction: reactionByAnswer[answers[questions[0].fieldId]] ?? reactionByAnswer[questions[0].options[0].id],
  };
}
