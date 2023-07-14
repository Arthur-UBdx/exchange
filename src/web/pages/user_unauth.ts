import { Router } from 'express';

const router_pages_user_unauth: Router = Router();

router_pages_user_unauth.get('/login', async (req, res) => {
    res.status(200).sendFile('user_management/login.html', {root: './web/'});
});

router_pages_user_unauth.get('/register', async (req, res) => {
    res.status(200).sendFile('user_management/register.html', {root: './web/'});
});

module.exports = router_pages_user_unauth;