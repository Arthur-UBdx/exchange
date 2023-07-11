import { Router } from 'express';

const router_user_handling = Router();

router_user_handling.get('/login', (req, res) => {
    res.sendFile('user_management/login.html', {root: './web/'});
});

router_user_handling.post('/login', async (req, res) => {
    console.log(req.body);
    res.status(200).send('ok');
})

router_user_handling.get('/register', (req, res) => {
    res.send('Register');
});

module.exports = router_user_handling;