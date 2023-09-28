import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import GameTicTacToe from "./components/GameTicTacToe";
import MferCastle from "./components/MferCastle";
import './App.css';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/mfermfertoe/:gameId" element={<GameTicTacToe />} />
        <Route path="/mfercastle/:gameId" element={<MferCastle />} />
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}

export default App;
