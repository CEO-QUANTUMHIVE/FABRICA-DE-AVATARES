import { useCallback, useState } from "react";
import {
  AvatarChips,
  AvatarPlayer,
  useAvatarRuntime,
  type AvatarChipDefinition,
  type AvatarRuntimeEvent,
} from "./avatar";
import { rootChips } from "./demo/flow";
import { demoAvatarManifest } from "./demo/manifest";

const initialMessage =
  "Elegí un chip. Cada opción está atada a una reacción del avatar y a un cambio visible de la experiencia.";

export default function App() {
  const [started, setStarted] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chips, setChips] = useState(rootChips);
  const [message, setMessage] = useState(initialMessage);
  const [lastEvent, setLastEvent] = useState<AvatarRuntimeEvent | null>(null);

  const handleEvent = useCallback((event: AvatarRuntimeEvent) => {
    setLastEvent(event);
  }, []);

  const runtime = useAvatarRuntime({
    manifest: demoAvatarManifest,
    enabled: started,
    onEvent: handleEvent,
  });

  const start = () => {
    setStarted(true);
    runtime.play("connector_welcome_cut", "system");
  };

  const selectChip = (chip: AvatarChipDefinition) => {
    if (chip.clipId) runtime.play(chip.clipId, "chip");
    if (chip.response) setMessage(chip.response);
    if (chip.next) setChips(chip.next);
    if (chip.id === "restart") setChips(rootChips);
    if (chip.mode === "free_chat") setChatOpen(true);
    if (chip.targetId) {
      document.getElementById(chip.targetId)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="QuantumHive">
          <span className="brand__mark">QH</span>
          <span>QuantumHive · Fábrica de Avatares</span>
        </a>
        <span className="topbar__status">cache first · runtime reusable</span>
      </header>

      <section id="inicio" className={`hero ${chatOpen ? "hero--chat" : ""}`}>
        <div className="hero__copy">
          <span className="eyebrow">BASE 01 · AVATAR + CHIPS</span>
          <h1>Una presencia visual que guía, reacciona y después conversa.</h1>
          <p>{message}</p>

          {!started ? (
            <button className="start-button" type="button" onClick={start}>
              Iniciar experiencia
            </button>
          ) : (
            <AvatarChips chips={chips} onSelect={selectChip} />
          )}

          {started && chips !== rootChips && (
            <button
              className="text-button"
              type="button"
              onClick={() => setChips(rootChips)}
            >
              Volver a los chips principales
            </button>
          )}
        </div>

        <div className="hero__stage">
          <AvatarPlayer runtime={runtime} compact={chatOpen} label="Sol" />
          {runtime.lastError && (
            <div className="asset-notice" role="status">
              El runtime sigue activo, pero este asset no respondió.
            </div>
          )}
          {chatOpen && (
            <section className="chat-panel" aria-label="Chat libre">
              <div className="chat-panel__header">
                <div>
                  <span className="eyebrow">MODO LIBRE</span>
                  <h2>Conversación en tiempo real</h2>
                </div>
                <button type="button" onClick={() => setChatOpen(false)}>
                  Cerrar
                </button>
              </div>
              <div className="chat-message">
                El motor de voz o el LLM se conecta aquí. El avatar permanece visible en modo compacto.
              </div>
              <div className="chat-input" aria-hidden="true">
                <span>Escribí o hablá…</span>
                <b>●</b>
              </div>
            </section>
          )}
        </div>
      </section>

      <section id="modulos" className="content-grid">
        <article>
          <span className="card-number">01</span>
          <h2>Fábrica</h2>
          <p>Produce identidades, clips aprobados, idles y manifiestos versionados.</p>
        </article>
        <article>
          <span className="card-number">02</span>
          <h2>Runtime</h2>
          <p>Precarga, reproduce reacciones, rota idles y emite eventos al producto.</p>
        </article>
        <article>
          <span className="card-number">03</span>
          <h2>Producto</h2>
          <p>Define cards, secciones, recomendaciones y el significado de cada chip.</p>
        </article>
      </section>

      <section id="flujo" className="flow-strip">
        <span>CHIP</span><i>→</i><span>INTENCIÓN</span><i>→</i><span>CLIP CACHEADO</span><i>→</i><span>CAMBIO DE UI</span>
      </section>

      <footer>
        <span>Evento actual</span>
        <code>{lastEvent ? JSON.stringify(lastEvent) : "runtime_ready"}</code>
      </footer>
    </main>
  );
}
