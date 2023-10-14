# mfers arcade

## Organization

This repo comprises a collection of games.  Each game has:
- node.js server side routes `server/<game>/*`
- React.js client side components `client/src/components/<game>/*`
- tests `test/<game>/*`

Common code:
- node.js server `index.js`
- client `src/App.js` and `src/components/LandingPage.js`

## Quick Commands / Quick Start

Prerequisites:
- github set up
- node.js, npm installed

Quick commands:

- `npm test` - run unit tests
- `npm run build && npm start` - start up local server with your changes

## Infra

- Hosted on heroku
- Stateless - no backend db - all game data stored in memory, any deploy clears the history
