import { token_authenticator } from './web/api/user/auth';
import {Router, Application} from 'express'; 
import cookieParser from 'cookie-parser';
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const router_ressource: Router = require('./web/route_ressource');
const router_user_handling: Router = require('./web/user_management/routes');
const router_auth_test: Router = require('./web/api/auth_test');

class Server {
    private app: Application;
    
    constructor() {
        this.app = express();
        this.layers();
    }

    private layers() {
        this.app.use(express.json());
        // non auth paths
        this.app.get('/', (req, res) => {
            res.send('Hello world');
        })
        this.app.use(cookieParser());
        this.app.use(router_ressource);
        this.app.use(router_user_handling);

        // auth paths
        this.app.use(token_authenticator);
        this.app.use(router_auth_test);
    }
    
    public start() {
        this.app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        })
    }
}

const server = new Server();
server.start();