# Arquitectura

## Decisión principal

El avatar no pertenece al Catálogo Vivo. Es una fábrica reusable que entrega un runtime visual y un contrato de eventos. Cada producto importa ese runtime y define su propio recorrido.

## Responsabilidades

### Fábrica de Avatares

- identidad visual y variantes;
- biblioteca de idles y acciones;
- normalización de encuadre, fondo, entrada y salida;
- manifiesto versionado de assets;
- precarga, reproducción, fallback y telemetría del runtime;
- componentes de avatar y chips.

### Producto consumidor

- contenido y datos de negocio;
- cards y secciones;
- árbol autoguiado;
- decisiones del LLM;
- conexión con voz/chat;
- acción de interfaz asociada a cada chip.

## Flujo de ejecución

1. El producto entrega un manifiesto y un árbol de chips.
2. El runtime valida el manifiesto y precarga primero los assets críticos.
3. El usuario toca un chip.
4. El chip solicita un clip semántico y el producto mueve o abre la sección correspondiente.
5. Al terminar el clip, el avatar vuelve a la biblioteca de idles.
6. Si se abre conversación libre, el producto cambia el avatar a presentación compacta.

## Multi-tenant

El runtime no conoce tablas ni credenciales. Recibe una `baseUrl` ya resuelta para el tenant, rubro, avatar y versión. Una ruta de producción esperada es:

`avatar-cache/<tenant_id>/<rubro_id>/<avatar_id>/<version>/<asset>.webm`

El catálogo, la fábrica de agentes y la fábrica de avatares pueden compartir los mismos identificadores de tenant, pero mantienen bases y políticas separadas.
