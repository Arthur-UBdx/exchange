import React from 'react';
import { useParams } from 'react-router-dom';

const TokenDetail = () => {
  const { id } = useParams();

  return (
    <div>
      <h2>Token Detail for {id}</h2>
    </div>
  );
};

export default TokenDetail;
