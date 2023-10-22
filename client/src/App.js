import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import GameConnect4 from "./components/connect4/Connect4";
import Connect4LandingPage from "./components/connect4/Connect4LandingPage";
import MferCastle from "./components/mfercastle/MferCastle";
import ChessLandingPage from "./components/chess/ChessLandingPage";
import GameChess from "./components/chess/Chess";
import LarvaLegendsLandingPage from "./components/larvalegends/LarvaLegendsLandingPage";
import LarvaLegends from "./components/larvalegends/LarvaLegends";
import MferShootout from "./components/mfershootout/MferShootout";
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/connect4/:gameId" element={<GameConnect4 />} />
        <Route path="/connect4/" element={<Connect4LandingPage />} />
        <Route path="/mferchess/" element={<ChessLandingPage />} />
        <Route path="/mferchess/:gameId" element={<GameChess />} />
        <Route path="/larvalegends/" element={<LarvaLegendsLandingPage />} />
        <Route path="/larvalegends/:gameId" element={<LarvaLegends />} />
        <Route path="/mfercastle/:gameId" element={<MferCastle />} />
        <Route path="/mfersshootout/" element={<MferShootout />} />
      </Routes>
    </Router>
  );
}

export default App;
