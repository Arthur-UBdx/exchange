import { Router } from 'express';

const router_test_auth = Router();

router_test_auth.get('/test_auth', async (req, res) => {
    res.status(200).send(req.user);
})

router_test_auth.get('/test_auth/:level', async (req, res) => {
    if(req.user.auth_level < parseInt(req.params.level)) {
        res.status(401).json({
            success: "false",
            message: "Unauthorized, insufficient permissions",
        });
        return;
    } 
    res.status(200).send(req.user);
})

module.exports = router_test_auth;
