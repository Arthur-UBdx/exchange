const axios = require('axios');

const getCandles = async () => {
    const symbol = 'BTCUSDT';
    const interval = '15m';
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}`;

    try {
        const response = await axios.get(url);
        const candles = response.data;
        console.log('Candles:', candles);
    } catch (error) {
        console.error('Error fetching candles:', error.message);
    }
};

getCandles();
