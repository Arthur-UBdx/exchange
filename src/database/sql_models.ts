// models from the database tables

export interface User {
    id: number; // PK 
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
    amount: number; //float (double precision)
}