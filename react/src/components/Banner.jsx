import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import '../styles/Banner.css';

function Banner() {
    const title = 'CoinHarbor';
    return (
        <div className='banner'>
            <Link to='/'>
                <div className="logo-title-container">
                    <img src={logo} alt='CoinHarbor' className='logo' />
                    <h1 className="title">{title}</h1>
                </div>
            </Link>
        </div>
    );
}

export default Banner;
