# WebAPI Playground

A TypeScript playground for browser Web APIs. It ships as a small static app with one card per API example so you can try features in isolation.

## What’s in it

- Canvas, Fetch, Beacon
- Badging, Clipboard, Permissions
- Geolocation, Notifications, Wake Lock, Share
- Web Crypto, IndexedDB, Cache API
- BroadcastChannel, Fullscreen, MediaDevices
- Storage, Device Posture, Background Fetch

This is a representative playground for major browser Web API families, with one working example per API family where practical.

## Run it

```sh
devenv shell
npm install
npm run dev
```

Then open `http://localhost:8080/` in your browser.

The Node server handles the same-origin API endpoints used by the demos, so the Fetch, Beacon, Cache, Background Fetch, and related examples work without an extra backend.

You need a server because module scripts and the service worker will not work from `file://` URLs.
