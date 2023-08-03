import React, { useEffect, useState } from "react";
import axios from "axios";

const tokenSymbols = ["BTCUSDT", "ETHUSDT"];

const TokenList = () => {
  const [tokenPrices, setTokenPrices] = useState([]);

  useEffect(() => {
    const fetchTokenPrices = async () => {
      try {
        const response = await axios.get(
          "https://api.binance.com/api/v3/ticker/price"
        );

        const tokensWithTrueValue = response.data.filter(
            (token) => tokenSymbols.indexOf(token.symbol) !== -1
        );

        const prices = tokensWithTrueValue.map((token) => token.price);

        setTokenPrices(prices);
      } catch (error) {
        console.error("Erreur lors de la récupération des prix des tokens :", error);
      }
    };

    fetchTokenPrices();

    const interval = setInterval(fetchTokenPrices, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2>Liste des prix des tokens :</h2>
      <ul>
        {tokenPrices.map((price, index) => (
          <li key={index}>
            {tokenSymbols[index]} : {parseFloat(price).toFixed(2)} USDT
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TokenList;
