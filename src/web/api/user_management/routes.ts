import pool from '../../../database/database_connector';

const router_user_handling = require('express').Router();

router_user_handling.get('/login', (req, res) => {
    res.send('Login');
});

router_user_handling.post('/login', (req, res) => {
    d
})

module.exports = router_user_handling;