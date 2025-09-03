# Pruebas manuales

## Limpieza de conexiones de audio

1. Ejecuta `npm run dev` y abre `http://localhost:5173` en el navegador.
2. Crea varios cubos y acércalos para generar conexiones de audio.
3. En la consola del navegador verifica que existen nodos activos:
   ```js
   (window as any).audioNodes.size
   ```
   Debe ser mayor que cero.
4. Cierra o recarga la pestaña para disparar `beforeunload`.
5. Abre de nuevo la consola e inspecciona el número de nodos:
   ```js
   (window as any).audioNodes.size
   ```
   Debe ser `0`, confirmando que no quedan conexiones activas.
