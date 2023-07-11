const router_ressource = require('express').Router();

router_ressource.get('/ressource/script/:file', (req, res) => {
    res.sendFile(req.params.file, { root: './web/ressource/scripts'});
});

router_ressource.get('/ressource/style/:file', (req, res) => {
    res.sendFile(req.params.file, { root: './web/ressource/styles'});
});

router_ressource.get('/ressource/image/:file', (req, res) => {
    res.sendFile(req.params.file, { root: './web/ressource/images'});
});

module.exports = router_ressource;