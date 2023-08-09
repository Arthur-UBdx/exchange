import React, { useEffect, useState } from "react";
import axios from "axios";

const tokenSymbols = ["BTCUSDT", "ETHUSDT", "MATICUSDT", "BNBUSDT"];

const tokenLogos = {
  BTCUSDT: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
  ETHUSDT: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
  MATICUSDT: "https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png",
  BNBUSDT: "https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png",
};

const TokenList = () => {
  const [tokenData, setTokenData] = useState([]);

  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        const response = await axios.get(
          "https://api.binance.com/api/v3/ticker/24hr"
        );

        const tokensWithTrueValue = response.data.filter(
          (token) => tokenSymbols.indexOf(token.symbol) !== -1
        );

        const tokenInfo = tokensWithTrueValue.map((token) => ({
          symbol: token.symbol,
          price: parseFloat(token.lastPrice),
          priceChangePercent: parseFloat(token.priceChangePercent),
        }));

        setTokenData(tokenInfo);
      } catch (error) {
        console.error("Erreur lors de la récupération des données des tokens :", error);
      }
    };

    fetchTokenData();

    const interval = setInterval(fetchTokenData, 2000);

    return () => clearInterval(interval);
  }, []);


  return (
    <div style={{ marginLeft: '10px' }}>
      <h2>Market</h2>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {tokenData.map((token, index) => (
          <li key={index} style={{ marginBottom: '10px' }}>
            <img
              src={tokenLogos[token.symbol]}
              alt={token.symbol}
              width="20"
              height="20"
              style={{ verticalAlign: 'middle', marginRight: '5px' }}
            />{" "}
            {token.symbol} : {token.price.toFixed(2)} USDT{" "}
            <span
              style={{
                color: token.priceChangePercent >= 0 ? "green" : "red"
              }}
            >
              {token.priceChangePercent.toFixed(2)}%{" "}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TokenList;