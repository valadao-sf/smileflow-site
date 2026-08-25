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
  compact?: boolean;
};

export const TALLY_FORM_ID = "lbbAvV";
export const VIP_GROUP_URL = "";

export const questions: DiagnosticQuestion[] = [
  {
    id: "price-reaction",
    fieldId: "0af600bc-4fd0-4bc9-83e6-f3e3c3eecef7",
    title: "Na hora de falar o valor total, o que costuma acontecer com você?",
    background: "/images/diagnostico-fechamento/question-price.webp",
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
    background: "/images/diagnostico-fechamento/question-context.webp",
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
    background: "/images/diagnostico-fechamento/question-price.webp",
    options: [
      { id: "bf306b36-8467-401b-b279-b974eb4b36f2", label: "Ela vai me achar interesseira." },
      { id: "df8c39ae-fad1-4c9d-8a09-05fdfe6a0bb6", label: "Fico com pena. Acho que está pesado para ela." },
      { id: "910b8505-b57f-489b-9964-8c6391a8969f", label: "Será que eu sou boa o bastante para cobrar isso?" },
      { id: "589e6e76-b0df-4752-a39f-333eeb8d3327", label: "Ela vai procurar alguém mais barato e eu vou perder a venda." },
    ],
  },
  {
    id: "role",
    fieldId: "52aa8541-9529-432a-9bac-620614851b87",
    title: "Hoje, quem costuma falar de preço com a paciente?",
    background: "/images/diagnostico-fechamento/question-context.webp",
    options: [
      { id: "b7ba4969-a8d7-4e1d-9d37-df3a630c49bb", label: "Eu, no meu próprio consultório ou clínica." },
      { id: "f7185b48-9953-429b-a34b-02cb4b57d96c", label: "Eu vendo pela clínica como responsável ou gerente." },
      { id: "eef8fda6-a07b-4f82-a7a4-607e9c80aa68", label: "Eu atendo em uma clínica de outra pessoa." },
      { id: "c94d4373-f8f3-4cf2-be13-87ed6556fe40", label: "Ainda estou começando e formando minha clientela." },
    ],
  },
  {
    id: "area",
    fieldId: "f075a5ed-c220-4e41-becf-2f03b60ffcce",
    title: "Em qual área você trabalha hoje?",
    background: "/images/diagnostico-fechamento/question-price.webp",
    compact: true,
    options: [
      { id: "7d5810ab-7a94-47b6-8b6c-bdbc764deafb", label: "Odontologia" },
      { id: "9c5177bd-caa2-43ec-ade0-efaf284a9cec", label: "Medicina" },
      { id: "ad5705c9-dbfb-4984-8ee5-fa90d121aef3", label: "Estética" },
      { id: "d3a1c210-0eb2-48cb-92d5-bae962850046", label: "Fisioterapia" },
      { id: "feb5cfb7-425c-4900-8d95-4e1a96232e6d", label: "Psicologia" },
      { id: "a46d0177-a882-45a4-ab03-5afa81a7e541", label: "Nutrição" },
      { id: "bfb2cebb-55ff-4243-ac6d-dd2930824db4", label: "Outra área da saúde" },
      { id: "a3f44588-d96e-412b-b0e0-2bf0022a6e54", label: "Outra área" },
    ],
  },
  {
    id: "revenue",
    fieldId: "5bb64038-4d10-4ec8-b5d1-d33aa836f77c",
    title: "Qual faixa mais se aproxima do faturamento mensal do seu consultório ou clínica?",
    background: "/images/diagnostico-fechamento/question-context.webp",
    options: [
      { id: "90ecc7c5-a0e6-4a63-8317-9eaa3d4f995d", label: "Até R$ 20 mil." },
      { id: "386fb9df-a3f8-4a30-a943-ef08b0de79ae", label: "De R$ 20 mil a R$ 50 mil." },
      { id: "7ece1cf1-3048-4d52-89b2-704bd8bdc7d6", label: "Acima de R$ 50 mil, mas ainda perco muitas vendas." },
      { id: "230d3d99-b23b-479e-b7f1-30e0e0739c79", label: "Acima de R$ 100 mil." },
      { id: "77db7674-4781-4dc6-83b0-996ff3b33ba7", label: "Prefiro não responder." },
    ],
  },
];

export const contactFields = {
  name: "ab5ddbe2-bf23-4d26-a259-6723f888b74b",
  phone: "ddec3cd4-1598-45ee-bbc4-56f9514b2312",
};

const diagnosisByThought: Record<string, { title: string; correction: string }> = {
  "bf306b36-8467-401b-b279-b974eb4b36f2": {
    title: "Medo de ser malvista",
    correction: "Fale o valor e espere. A reação da paciente não define quem você é.",
  },
  "df8c39ae-fad1-4c9d-8a09-05fdfe6a0bb6": {
    title: "Culpa de cobrar",
    correction: "Não decida pela paciente o que cabe ou não no bolso dela.",
  },
  "910b8505-b57f-489b-9964-8c6391a8969f": {
    title: "Dúvida do próprio valor",
    correction: "Não use uma reação ao preço como nota para a qualidade do seu trabalho.",
  },
  "589e6e76-b0df-4752-a39f-333eeb8d3327": {
    title: "Medo de perder a paciente",
    correction: "Antes de oferecer algo mais barato, descubra o que realmente está impedindo a decisão.",
  },
};

const reactionByAnswer: Record<string, string> = {
  "d55bb268-5440-4c28-8839-3f76a5bfe502": "Seu corpo trava antes de você conseguir conduzir a conversa.",
  "3a419419-ddc0-4007-8a94-e3e51301b99c": "Você tenta terminar a parte do preço o mais rápido possível.",
  "638b08d4-029f-4e9c-af87-d9a4d65d6408": "Você fala o valor já sentindo que precisa se justificar.",
  "6f648a73-e3b6-4d3d-bbb1-3330ba88a607": "Você sustenta o preço com calma. Seu risco pode aparecer na etapa seguinte.",
};

export function buildDiagnosis(answers: Record<string, string>) {
  return {
    ...(diagnosisByThought[answers[questions[2].fieldId]] ?? diagnosisByThought[questions[2].options[0].id]),
    reaction: reactionByAnswer[answers[questions[0].fieldId]] ?? reactionByAnswer[questions[0].options[0].id],
    rule: "Fale. Pare. Escute. Só depois negocie.",
  };
}
