import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import GameConnect4 from "./components/connect4/Connect4";
import Connect4LandingPage from "./components/connect4/Connect4LandingPage";
import MferCastle from "./components/mfercastle/MferCastle";
import ChessLandingPage from "./components/chess/ChessLandingPage";
import GameChess from "./components/chess/Chess";
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/connect4/:gameId" element={<GameConnect4 />} />
        <Route path="/connect4/" element={<Connect4LandingPage />} />
        <Route path="/mferchess/" element={<ChessLandingPage />} />
        <Route path="/mfercastle/:gameId" element={<MferCastle />} />
        <Route path="/mferchess/:gameId" element={<GameChess />} />
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}

export default App;
