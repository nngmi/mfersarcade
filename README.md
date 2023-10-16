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
- Run `npm install` in root
- `cd client && npm install`

Quick commands:

- `npm test` - run unit tests
- `npm run build && npm start` - start up local server with your changes

### Local Development Setup

Follow these steps to run the app locally with hot reload on the client:

⚠ Warning: *Make sure to revert these changes before merging into `main`, as they could have unintended consequences with the Heroku deploy.*

1. Add the following line to `client/package.json` to proxy requests to the Express server:
    ```json
    "proxy": "http://localhost:3001"
    ```
1. Create an .env file at `client/.env` and add the following variable:
    ```
    REACT_APP_SERVER_URL=http://localhost:3000
   ```
1. Run the Express backend at root:
    ```bash
    npm start
    ```
1. Open a new terminal, and run the client dev server:
    ```bash
    cd client && npm start
    ```
1. Go to [http://localhost:3000](http://localhost:3000)

    - Make some changes, save, and you should see them automatically in the browser

## Infra

- Hosted on heroku
- Stateless - no backend db - all game data stored in memory, any deploy clears the history
