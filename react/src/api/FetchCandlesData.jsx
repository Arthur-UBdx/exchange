import axios from 'axios';

const getCandlesData = async (id, interval) => {
    const url = `https://api.binance.com/api/v3/klines?symbol=${id}&interval=${interval}`;
    try {
        const response = await axios.get(url);
        return response.data.map(item => ({
            time: Math.floor(item[0] / 1000),
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4])
        }));
    } catch (error) {
        console.error('Error fetching candles:', error.message);
        throw error;
    }
};

export default getCandlesData;