# Signal Greenhouse

Signal Greenhouse is a mobile-first Base Mini App with exactly three onchain write actions:

- Pulse Signal -> `pulseSignal()`
- Flip Switch -> `flipSwitch()`
- Stamp Pass -> `stampPass()`

The frontend is built with Next.js App Router, TypeScript, Tailwind CSS, Wagmi, and Viem. It uses Wagmi native configuration with only `injected()` and `coinbaseWallet()` connectors. RainbowKit and WalletConnect are not used.

## Required production values

Configured production values:

- `src/app/layout.tsx`: Base App verification meta tag
- `src/app/layout.tsx`: Talent project verification meta tag
- `src/lib/wagmi.ts`: `signalGreenhouseAddress`

Configured onchain attribution:

- Builder code: `bc_hz0cl0qb`
- `src/lib/wagmi.ts`: ERC-8021 builder encoded string is set as `attributionDataSuffix`.

UI errors are mapped to friendly English statuses only.

## Contract

The required Solidity contract is in `contracts/SignalGreenhouse.sol`. Deploy it on Base mainnet, then paste the deployed address into `src/lib/wagmi.ts`.

## Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run lint
npm run build
```
