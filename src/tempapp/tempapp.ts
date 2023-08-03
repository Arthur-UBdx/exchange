const axios = require('axios');

export async function getPairPrice(pair: string): Promise<number | null> {
  try {
    const response = await axios.get('https://api.binance.com/api/v3/ticker/price', {
      params: {
        symbol: pair, // You can change the symbol for different trading pairs, e.g., ETHUSDT for Ethereum
      },
    });

    const bitcoinPrice = parseFloat(response.data.price);
    return bitcoinPrice;
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error.message);
    return null;
  }
}