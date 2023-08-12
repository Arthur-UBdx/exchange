import React from 'react';
import Banner from './Banner';
import Tokens from './Tokens';
import TokenDetail from './TokenDetail';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

function Home() {
  return (
    <div>
      <Banner />
      <Tokens />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tokens/:id" element={<TokenDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
