import React from 'react';
import Banner from './Banner';
import HomePage from './HomePage';
import Charts from './Charts';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

function Home() {
  return (
    <div>
      <Banner />
      <HomePage />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tokens/:id" element={<Charts />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
