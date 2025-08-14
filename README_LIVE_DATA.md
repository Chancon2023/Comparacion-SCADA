# Live weights + reseñas desde Supabase
Este patch:
- Lee **pesos** en vivo desde la tabla `weights` en Supabase y los aplica en **Ranking** y **Radar detallado**.
- Mezcla **reseñas** desde la tabla `reviews` (campos: software, pros, cons, notes) con el dataset local JSON.
- Añade botón **Volver** en Ranking.

## Archivos incluidos
- `src/lib/supabaseClient.js`
- `src/hooks/useLiveWeights.js`
- `src/components/ReviewBadge.jsx`
- `src/components/MiningConclusion.jsx` (versión sin `lucide-react`)
- `src/pages/Ranking.jsx` (modificado)
- `src/pages/RadarDetail.jsx` (modificado)

> Ajusta el import del dataset en ambos `.jsx` si tu JSON está en otra ruta distinta a `src/data/scada_dataset.json`.

## Tablas esperadas en Supabase
### weights
| key           | value (float) |
|---------------|---------------|
| seguridad     | 2             |
| redundancia   | 1.5           |
| integracion   | 1.2           |

### reviews
| software (text) | pros (text) | cons (text) | notes (text) |
|-----------------|-------------|-------------|--------------|

## Variables de entorno (Netlify)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

¡Listo! Sube estos archivos a tu repo y despliega de nuevo.
