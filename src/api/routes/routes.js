const express = require('express');
const router = express.Router();
const controller = require('../controllers/controller');

router.get(
    '/proba',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        controller.prodProba(req, res);
    }
);

router.get(
    '/:productID',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        controller.getProducts(req, res);
    }
);

module.exports = router;
