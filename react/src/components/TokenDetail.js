import React from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const TokenDetail = () => {
  const { id } = useParams();
  const interval = '15m';
  const url = `https://api.binance.com/api/v3/klines?symbol=${id}&interval=${interval}`;
  
  const getCandles = async () => {
    try {
      const response = await axios.get(url);
      const candles = response.data;
	  console.log('Candles:', candles);
    } catch (error) {
      console.error('Error fetching candles:', error.message);
    }
  };

  return (
    <div>
      <h1>Token Detail</h1>
      <p>Token ID: {id}</p>
      <button onClick={getCandles}>Get Candles</button>
    </div>
  );
};

export default TokenDetail;
