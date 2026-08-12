import type { AvatarChipDefinition } from "../avatar";

const moduleChips: AvatarChipDefinition[] = [
  {
    id: "web-factory",
    label: "Fábrica Web",
    clipId: "connector_look_left_cut",
    targetId: "modulos",
    response: "La Fábrica Web arma la presencia digital. El avatar sigue siendo un módulo independiente.",
  },
  {
    id: "agent-factory",
    label: "Fábrica de Agentes",
    clipId: "connector_look_right_cut",
    targetId: "modulos",
    response: "La Fábrica de Agentes aporta el cerebro y la voz. Este runtime sólo representa y reacciona.",
  },
  {
    id: "restart",
    label: "Volver al inicio",
    clipId: "connector_welcome_cut",
    response: "Volvemos al punto de partida.",
  },
];

export const rootChips: AvatarChipDefinition[] = [
  {
    id: "what",
    label: "¿Qué construimos?",
    clipId: "connector_look_left_cut",
    targetId: "modulos",
    response: "Mirá los módulos: cada fábrica es independiente y los productos las combinan.",
    next: moduleChips,
  },
  {
    id: "how",
    label: "¿Cómo funciona?",
    clipId: "connector_look_right_cut",
    targetId: "flujo",
    response: "El chip emite una intención, el producto cambia la interfaz y el avatar reproduce una reacción cacheada.",
  },
  {
    id: "free-chat",
    label: "Hablar libremente",
    clipId: "connector_live_invite_cut",
    mode: "free_chat",
    response: "El avatar se achica, conserva presencia y le entrega el protagonismo al chat en tiempo real.",
  },
];
