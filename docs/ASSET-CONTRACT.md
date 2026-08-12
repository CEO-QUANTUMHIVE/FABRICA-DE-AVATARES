# Contrato de assets

Cada versión publicada de un avatar tiene un manifiesto inmutable. El runtime nunca adivina nombres de archivo: pide identificadores semánticos estables.

## Campos mínimos

- `avatarId`: identidad base;
- `version`: versión inmutable del set;
- `baseUrl`: raíz pública o firmada del caché;
- `defaultIdleId`: idle seguro de fallback;
- `longWaitIdleId`: idle opcional para cerrar un ciclo natural;
- `assets[].id`: nombre semántico estable;
- `assets[].kind`: comportamiento visual;
- `assets[].url`: archivo relativo o URL absoluta;
- `assets[].priority`: orden de precarga;
- `assets[].muted`: política de audio.

`bytes` y `sha256` son recomendados para verificar que un manifiesto corresponde exactamente a los archivos subidos.

## Reglas de producción

1. Los videos no se guardan en Git.
2. Una versión publicada no se sobrescribe; se crea una nueva.
3. Los clips de una identidad comparten encuadre, escala, iluminación y pose ancla.
4. Todos los navegadores reciben un poster/fallback visual.
5. Supabase/CDN debe servir `Cache-Control: public, max-age=31536000, immutable` para URLs versionadas.
6. Los clips críticos son bienvenida, primer idle y miradas asociadas a los chips iniciales.

El comando `npm run avatar:upload` construye este contrato, calcula tamaño y SHA-256, sube los clips con caché anual y publica `cache-manifest.json` en la misma ruta versionada.

## Personalización por cliente

El logo del traje forma parte del video. Si se hornea dentro de cada frame, cambiarlo obliga a regenerar los clips. La alternativa recomendada para el MVP es mantener el traje neutro y superponer el logo del cliente como una capa de interfaz anclada al avatar; así se reutiliza toda la biblioteca de videos.
