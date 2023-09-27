import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import GameTicTacToe from "./components/GameTicTacToe";
import './App.css';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/game/:gameId" element={<GameTicTacToe />} />
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}

export default App;
