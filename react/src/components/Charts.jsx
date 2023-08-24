import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { createChart } from 'lightweight-charts';
import styles from '../styles/Charts.module.css';
import Banner from './Banner';
import getCandlesData from '../api/FetchCandlesData';

const CHART_WIDTH = 0.6;
const CHART_HEIGHT = 0.6;

const Charts = () => {
    const { id } = useParams();
    const chartRef = useRef(null);
    const [interval, setInterval] = useState('15m');
    const [candles, setCandles] = useState([]);
    const chartContainerRef = useRef(null);
    const candlestickSeriesRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getCandlesData(id, interval);
                setCandles(data);
            } catch (error) {
                console.error('Error fetching candles:', error.message);
            }
        };
        fetchData();
    }, [id, interval]);

    useEffect(() => {
        if (chartContainerRef.current && !chartRef.current) {
            const screen_width = window.innerWidth;
            const screen_height = window.innerHeight;

            chartRef.current = createChart(chartContainerRef.current, { width: screen_width*CHART_WIDTH, height: screen_height*CHART_HEIGHT });
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
        <div>
            <Banner />
            <div className={styles.ChartsContainer}>
                <h1 className={styles.ChartsDetailHeader}>{id}</h1>
                <div className={styles.ChartsButtons}>
                    <button onClick={() => handleIntervalChange('15m')}>15m</button>
                    <button onClick={() => handleIntervalChange('1h')}>1h</button>
                    <button onClick={() => handleIntervalChange('4h')}>4h</button>
                    <button onClick={() => handleIntervalChange('1d')}>1d</button>
                    <button onClick={() => handleIntervalChange('1w')}>1w</button>
                </div>
                {/* <div> */}
                <div ref={chartContainerRef} className={styles.ChartsContainer}></div>
                    {/* <div><h1 className="price-tag" id="price-tag">helloworld</h1></div>
                </div> */}
            </div>
        </div>
    );
};

export default Charts;
