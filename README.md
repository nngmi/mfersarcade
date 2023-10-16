# mfers arcade

## Organization

This repo comprises a collection of games.  Each game has:
- node.js server side routes `server/<game>/*`
- React.js client side components `client/src/components/<game>/*`
- tests `test/<game>/*`

Common code:
- node.js server `server/index.js`
- client `client/src/App.js` and `client/src/components/LandingPage.js`

## Quick Commands / Quick Start

Prerequisites:
- github set up
- node.js, npm installed
- yarn installed: `npm install -g yarn` to install

## To run locally

Run all commands at the root of the repo:

1. Install dependencies: run `yarn`
1. Build the client: run `yarn build`
1. Start the server: run `yarn start`
1. Go to [http://localhost:3001](http://localhost:3001) in the browser

Other commands:

- `yarn dev` - Run client in dev mode with hot reload at [http://localhost:3000](http://localhost:3000)
- `yarn test` - Run unit tests

## Infra

- Hosted on heroku
- Stateless - no backend db - all game data stored in memory, any deploy clears the history
