
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

import {Router, Application} from 'express'; 
import cookieParser from 'cookie-parser';

import { perform_transaction, TransactionError } from './engine/order_matching';

const router_ressource: Router = require('./web/route_ressource');
const router_api_user_unauth: Router = require('./web/api/user/routes_unauth');
const router_api_user_auth: Router = require('./web/api/user/routes_auth');
const router_pages_user_unauth: Router = require('./web/pages/user_unauth');
const router_api_platform: Router = require('./web/api/platform/routes');

class Server {
    private app: Application;
    
    constructor() {
        this.app = express();
        this.layers();
    }

    private layers() {
        this.app.use(express.json());
        this.app.use(cookieParser());

        // non auth paths
        this.app.get('/', (req, res) => {
            res.send('Hello world');
        })

        this.app.post('/perform_transaction', async (req, res) => {
            const result = await perform_transaction(34, 33, 1, 3, 1, 10);
            
            if(result.is_err()) {
                switch (result.unwrap_err()) {
                    case TransactionError.BuyerHasNotEnoughFunds:
                        res.status(400).json({success: false, message: 'Buyer has not enough funds'});
                        break;
                    case TransactionError.SellerHasNotEnoughFunds:
                        res.status(400).send({success: false, message: 'Seller has not enough funds'});
                        break;
                    case TransactionError.InternalError:
                        console.error(result.unwrap_err());
                        res.status(500).send({success: false, message: 'Internal error'});
                        break;
                }
            }
            
            res.status(200).send('transaction performed');
        });

        this.app.use(router_ressource);
        this.app.use(router_api_user_unauth);
        this.app.use(router_pages_user_unauth);
        this.app.use(router_api_platform);

        // auth paths
        this.app.use(router_api_user_auth);

        // 404
        this.app.use((req, res) => {
            res.status(404).json({success:"false", message:"Path not found"});
        });
    }
    
    public start() {
        this.app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        })
    }
}

const server = new Server();
server.start();