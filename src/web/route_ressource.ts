const router_ressource = require('express').Router();

router_ressource.get('/ressource/:file', (req, res) => {
    res.sendFile(req.params.file, { root: './web/ressource'});
});

module.exports = router_ressource;