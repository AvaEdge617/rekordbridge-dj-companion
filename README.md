# CueCraft

CueCraft is a RekordBridge DJ Companion for learning core cueing and transition skills through flexible, calm, short challenges. It uses Nimiq's Mini App SDK to request wallet access in Nimiq Pay; it never requests or stores a private key.

## Current scope

- Touch-screen practice controls
- Unlocked controller/CDJ/vinyl-friendly lessons
- Browser-local progress tracking
- Nimiq Pay wallet connection surface
- Reward UI prepared for a future, server-backed NIM reward pool

## Use with RekordBridge Studio on Windows

Open **CueCraft** from RekordBridge Studio after selecting a controller and
starting either **Test input** or **Start bridge**. RekordBridge serves this
same UI locally and exposes only controller connection status, the selected
profile name, and the latest mapped action. The Companion never receives MIDI
port handles, virtual-port credentials, or wallet data.

When the Companion is opened normally from a static host, it remains fully
usable in touch mode and simply shows no controller status.

The reward pool is intentionally not implemented in the frontend: sending real NIM requires a funded server-side wallet and anti-abuse rules. No API key belongs in this app's source.

## Run locally

Serve this folder over a local web server, then open its network URL in Nimiq Pay's Custom URL screen while both devices are on the same Wi-Fi network. The official test flow supports testnet NIM.

## Before publishing

1. Add a backend that verifies challenge claims and sends limited testnet/mainnet rewards from a secure funded wallet.
2. Replace the CDN SDK import with a pinned package build.
3. Test inside Nimiq Pay, including a rejected wallet request and no-account error.
4. Add an MIT `LICENSE`, then publish under the chosen GitHub account.
