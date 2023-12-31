// models from the database tables

export interface User {
    id: number; // PK serial
    email: string; // varchar(64)
    username: string; // varchar(64)
    password: string; // char(64)
    salt: string; // char(16)
    auth_level: number; // int
    status: number; // int
}

export interface Wallet {
    owner_id: number; // int
    currency_id: number; // int
    symbol: string; // varchar(8)
    fullname: string; // varchar(32)
    balance: number; //float (double precision)
    assigned_to_order; // float (double precision)
}

export interface Asset {
    id: number; // PK serial
    symbol: string; // varchar(8)
    name: string; // varchar(32)
    reserve: number; // float (double precision)
    assigned: number; // float (double precision)
}

export interface Market {
    id: number; // PK serial
    pair_symbol: string; // varchar(16) unique
    asset1_id: number; // int
    asset1_symbol: string; // varchar(8)
    asset2_id: number; // int
    asset2_symbol: string; // varchar(8)
}

export interface Candle {
    start: Date; // timestamp PK
    timeframe: number; // int
    open: number; // float (double precision)
    high: number; // float (double precision)
    low: number; // float (double precision)
    close: number; // float (double precision)
    volume: number; // float (double precision)
    currency_symbol_1: string; // varchar(8)
    currency_symbol_2: string; // varchar(8)
}

export interface Transaction {
    id: number;
    buyer_id: number;
    seller_id: number;
    market_id: number;
    price: number; 
    amount: number;
    timestamp: Date;
}