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
    '/shops',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        controller.getShops(req, res);
    }
);

router.get(
    '/:productID',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        controller.getProduct(req, res);
    }
);
router.post(
    '/login',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        controller.authenticate(req, res);
    }
);
module.exports = router;
