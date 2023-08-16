import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ReactApexChart from 'react-apexcharts';

const TokenDetail = () => {
    const { id } = useParams();
    const [interval, setInterval] = useState('15m');
    
    const [candles, setCandles] = useState([]);

    useEffect(() => {
        const url = `https://api.binance.com/api/v3/klines?symbol=${id}&interval=${interval}`;

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

        getCandles();
    }, [id, interval]);

    const options = {
        chart: {
            type: 'candlestick',
            height: 350,
            toolbar: {
                show: true,
                tools: {
                    download: false,
                    selection: true,
                    zoom: true,
                    zoomin: true,
                    zoomout: true,
                    pan: true,
                    reset: true,
                },
                autoSelected: 'zoom'
            },
            background: '#1a202c',
            foreColor: '#A0AEC0'
        },
        title: {
            text: id,
            align: 'left',
            style: {
                color: '#A0AEC0'
            }
        },
        xaxis: {
            type: 'datetime'
        },
        yaxis: {
            tooltip: {
                enabled: true
            }
        },
        theme: {
            mode: 'dark'
        },
        plotOptions: {
            candlestick: {
                colors: {
                    upward: '#2ecc71',
                    downward: '#e74c3c'
                }
            }
        },
        grid: {
            borderColor: '#4A5568'
        }
    };

    return (
        <div style={{ background: "#2D3748", padding: "20px" }}>
            <div>
                <button onClick={() => setInterval('15m')}>15m</button>
                <button onClick={() => setInterval('1h')}>1h</button>
                <button onClick={() => setInterval('4h')}>4h</button>
                <button onClick={() => setInterval('1d')}>1d</button>
            </div>
            <ReactApexChart options={options} series={[{ data: candles }]} type="candlestick" height={350} />
        </div>
    );
};

export default TokenDetail;
