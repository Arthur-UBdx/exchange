import {Router, Application} from 'express'; 
const express = require('express');
const dotenv = require('dotenv');

const router_ressource: Router = require('./web/route_ressource');
const router_user_handling: Router = require('./web/user_management/routes');

dotenv.config();

class Server {
    private app: Application;
    
    constructor() {
        this.app = express();
        this.layers();
    }

    private layers() {
        this.app.use(express.json());
        this.app.use(router_ressource);
        this.app.use(router_user_handling);

        this.app.get('/', (req, res) => {
            res.send('Hello world');
        })
    }

    public start() {
        this.app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        })
    }
}

const server = new Server();
server.start();