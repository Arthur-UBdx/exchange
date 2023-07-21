const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

import {Router, Application} from 'express'; 
import cookieParser from 'cookie-parser';

import { OrderBooks } from './engine/markets';

const router_ressource: Router = require('./web/route_ressource');
const router_api_user_unauth: Router = require('./web/api-rest/user/unauth/routes');
const router_api_user_auth: Router = require('./web/api-rest/user/auth/routes');
const router_pages_user_unauth: Router = require('./web/pages/user_unauth');
const router_api_platform: Router = require('./web/api-rest/platform/routes');
const router_api_auth_market = require('./web/api-rest/market/auth/routes');
const router_api_market_unauth = require('./web/api-rest/market/unauth/routes');

class Server {
    private app: Application;
    
    constructor() {
        this.app = express();
        this.layers();
        this.engine_init();
    }

    private engine_init() {
        OrderBooks.init();
    }

    private layers() {
        this.app.use(express.json());
        this.app.use(cookieParser());

        // non auth paths
        this.app.get('/', (req, res) => {
            res.send('Hello world');
        })
        this.app.use(router_ressource);
        this.app.use(router_api_user_unauth);
        this.app.use(router_pages_user_unauth);
        this.app.use(router_api_platform);
        this.app.use(router_api_market_unauth);

        // auth paths
        this.app.use(router_api_user_auth);
        this.app.use(router_api_auth_market);

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