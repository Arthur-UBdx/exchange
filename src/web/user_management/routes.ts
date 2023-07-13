import { Router } from 'express';
import { UserBase, RegisterError, LoginError } from './model';
import { Result } from '../../utils/result';
import { sign } from 'jsonwebtoken';
import { userInfo } from 'os';

const router_user_handling = Router();
const JWT_SECRET = process.env.JWT_SECRET;

router_user_handling.get('/login', async (req, res) => {
    res.sendFile('user_management/login.html', {root: './web/'});
});

router_user_handling.post('/login', async (req, res) => {
    console.log(req.body);
    res.status(200).send('ok');
})

router_user_handling.get('/register', async (req, res) => {
    res.sendFile('user_management/register.html', {root: './web/'});
});

router_user_handling.post('/register', async (req, res) => {
    console.log(req.body);
    if(!req.body.username || !req.body.password || !req.body.email || !req.body.remember_me) {
        res.status(400).send('Bad request');
        return;
    }
    const remember_me: boolean = req.body.remember_me;
    const result: Result<number, RegisterError> = await UserBase.create_user(req.body.username, req.body.password, req.body.email);
    if(result.is_err()) {
        res.status(500).json({sucess:"false", message:"Internal server error"});
        return;
    }
    const expires: number = remember_me ? Date.now() + parseInt(process.env.SESSION_EXPIRATION_TIME) : 0;

    res.status(200).json({success:"true", message:"User created"});
});

module.exports = router_user_handling;