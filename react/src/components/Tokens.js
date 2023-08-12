import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/Tokens.css";
import { tokenLogos } from "../datas/tokenlist";
import { tokenSymbols } from "../datas/tokenlist";

const Tokens = () => {
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
        console.error(
          "Erreur lors de la récupération des données des tokens :",
          error
        );
      }
    };
    fetchTokenData();
    const interval = setInterval(fetchTokenData, 2000);
    return () => clearInterval(interval);
  }, []);

  const redirectToTokenPage = (symbol) => {
    window.location.href = `/tokens/${symbol}`;
  };

  return (
    <div className="token-container">
      <h2 className="token-heading">Markets</h2>
      <ul className="token-list">
        {tokenData.map((token, index) => (
          <li
            key={index}
            className="token-item"
            onClick={() => redirectToTokenPage(token.symbol)}
          >
            <div className="token-link">
              <img
                src={tokenLogos[token.symbol]}
                alt={token.symbol}
                width="20"
                height="20"
                className="token-logo"
              />
              {token.symbol} : {token.price.toFixed(2)} USDT{" "}
              <span
                className={`token-price-change ${
                  token.priceChangePercent >= 0 ? "positive" : "negative"
                }`}
              >
                {token.priceChangePercent.toFixed(2)}%{" "}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Tokens;
