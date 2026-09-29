# Fondo del viaje — David + Paula

Mini app móvil para llevar el fondo del viaje sin backend.

## Datos
- David: $10.290.000 COP aportados; saldo inicial 2.628,68 USDC
- Paula: $7.602.000 COP aportados; saldo inicial 1.727,64 USDC
- Global inicial: 4.356,32 USDC
- Meta: $10.000.000 COP por persona

## Persistencia
Los movimientos nuevos se guardan en `localStorage` del navegador.
Usa siempre el mismo dominio de producción en Vercel y evita navegación privada.
La app incluye exportación JSON como respaldo.

## Vercel
1. Sube este proyecto a GitHub.
2. En Vercel: Add New > Project.
3. Importa el repositorio.
4. Framework: Vite.
5. Build command: `npm run build`.
6. Output: `dist`.
7. Deploy.

No necesita variables de entorno, Supabase ni backend.
