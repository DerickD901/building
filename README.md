# Building — Creative Studio

A responsive creative workspace for games, music, and pictures, with optional demo store and booking tools. Built with Node.js and browser JavaScript. No packages, API keys, or installation are required.

## Run

Requires Node.js 20 or later:

```sh
cd /workspace/building
npm start
```

The server listens on port 3000 (override with `PORT`). `npm run dev` watches server changes. The UI is browser-based; this is not a game engine, DAW, or image editor.

## Features

- Create and filter projects for Games, Music, and Pictures; advance project progress in 10% increments.
- Preview local images, audio, and video without uploading files. Previews are session-only.
- Create tasks and move them between To do, In progress, and Done.
- Add example products to a cart and place local demo orders.
- Schedule and cancel local demo sessions, with past-time and duplicate-time validation.

Projects, tasks, bookings, cart, orders, and activity use browser localStorage. Data is tied to the browser and origin, is not shared between users, and can be removed by clearing browser storage. Local media is not stored or uploaded. No authentication, payments, delivery, calendar integration, cloud sync, or production backend is included. Product prices and initial projects are illustrative demo content.

## Verify

```sh
npm test
curl --fail http://127.0.0.1:3000/health
```

Server tests cover assets, health, missing files, unsupported methods, and path traversal. A browser smoke check was also performed during setup for project persistence, task transitions, media previews, demo orders, booking, and mobile layout.

Run this project from a local or cloud checkout. Publishing its source to GitHub does not deploy it as a public app.
