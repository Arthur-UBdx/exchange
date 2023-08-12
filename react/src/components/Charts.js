import React from "react";

const Charts = (props) => {
  return (
    <div>
      <h2>Chart for {props.match.params.coinSymbol}</h2>
    </div>
  );
};

export default Charts;
