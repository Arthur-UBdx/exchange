import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { createChart } from 'lightweight-charts';
import styles from '../styles/TokenDetail.module.css';

const TokenDetail = () => {
    const { id } = useParams();
    const chartRef = useRef(null);
    const [interval, setInterval] = useState('15m');
    const [candles, setCandles] = useState([]);
    const chartContainerRef = useRef(null);
    const candlestickSeriesRef = useRef(null);

    useEffect(() => {
        const url = `https://api.binance.com/api/v3/klines?symbol=${id}&interval=${interval}`;
        const getCandles = async () => {
            try {
                const response = await axios.get(url);
                const candlesData = response.data.map(item => ({
                    time: Math.floor(item[0] / 1000),
                    open: parseFloat(item[1]),
                    high: parseFloat(item[2]),
                    low: parseFloat(item[3]),
                    close: parseFloat(item[4])
                }));
                setCandles(candlesData);
            } catch (error) {
                console.error('Error fetching candles:', error.message);
            }
        };
        getCandles();
    }, [id, interval]);

    useEffect(() => {
        if (chartContainerRef.current && !chartRef.current) {
            chartRef.current = createChart(chartContainerRef.current, { width: 800, height: 400 });
            candlestickSeriesRef.current = chartRef.current.addCandlestickSeries();
        }

        if (candles.length > 0 && candlestickSeriesRef.current) {
            candlestickSeriesRef.current.setData(candles);
        }

        return () => {
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
                candlestickSeriesRef.current = null;
            }
        };
    }, [candles]);

    const handleIntervalChange = (newInterval) => {
        setInterval(newInterval);
    };

    return (
        <div className={styles.tokenDetailContainer}>
            <h1 className={styles.tokenDetailHeader}>{id}</h1>
            <div className={styles.tokenDetailIntervalButtons}>
                <button className={styles.tokenDetailIntervalButton} onClick={() => handleIntervalChange('15m')}>15m</button>
                <button className={styles.tokenDetailIntervalButton} onClick={() => handleIntervalChange('1h')}>1h</button>
                <button className={styles.tokenDetailIntervalButton} onClick={() => handleIntervalChange('4h')}>4h</button>
                <button className={styles.tokenDetailIntervalButton} onClick={() => handleIntervalChange('1d')}>1d</button>
            </div>
            <div ref={chartContainerRef}></div>
        </div>
    );    
};

export default TokenDetail;
