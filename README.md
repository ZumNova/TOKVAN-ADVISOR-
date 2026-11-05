# TOKVAN Advisor

Aplicación React + TypeScript + Vite para consultoría y simulación de tokenización de activos EVM.

## Desarrollo en Ubuntu

```bash
cd /home/pablowiker/foundry-study/TOKVAN-ADVISOR-
npm ci
npm run dev
```

Servidor local: http://localhost:3000

## Verificación

```bash
npm run lint
npm run build
npm run preview
```

## Vercel

- Framework: Vite
- Instalación: `npm ci`
- Build: `npm run build`
- Salida: `dist`
- Rama de producción: `main`

La versión actual usa datos y respuestas de IA simulados. No requiere claves de API para compilar ni ejecuta transacciones blockchain reales.

## Factory ERC-20 v1

Abrir **Factory ERC-20** desde la barra superior. Incluye contratos Solidity con tres aprobaciones independientes, preparador de transacciones para Sepolia y pruebas de integración en Anvil.

Ver [arquitectura, pruebas y despliegue](docs/ERC20_FACTORY.md). Los contratos aún no están desplegados en una red pública.

```bash
npm run contracts:build
npm run contracts:test
npm run test:factory
```
