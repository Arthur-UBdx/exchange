import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ReactApexChart from 'react-apexcharts';

const TokenDetail = () => {
    const { id } = useParams();
    const interval = '15m';
    const url = `https://api.binance.com/api/v3/klines?symbol=${id}&interval=${interval}`;
    
    const [candles, setCandles] = useState([]);

    const getCandles = async () => {
        try {
            const response = await axios.get(url);
            const candlesData = response.data.map(item => ({
                x: new Date(item[0]).toISOString(),
                y: [
                    parseFloat(item[1]),
                    parseFloat(item[2]),
                    parseFloat(item[3]),
                    parseFloat(item[4])
                ]
            }));
            setCandles(candlesData);
        } catch (error) {
            console.error('Error fetching candles:', error.message);
        }
    };

    useEffect(() => {
        getCandles();
    });

    const options = {
        chart: {
            type: 'candlestick',
            height: 350
        },
        title: {
            text: id,
            align: 'left'
        },
        xaxis: {
            type: 'datetime'
        },
        yaxis: {
            tooltip: {
                enabled: true
            }
        }
    };

    return (
        <div>
            <ReactApexChart options={options} series={[{ data: candles }]} type="candlestick" height={350} />
        </div>
    );
};

export default TokenDetail;
