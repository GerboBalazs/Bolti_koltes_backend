const express = require('express');
const router = express.Router();
const controller = require('../controllers/controller');
router.post(
    '/register',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        controller.registration(req, res);
    }
);
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
router.post('/token', (req, res) => {
    controller.refreshToken(req, res);
});
router.post('/list', (req, res) => {
    controller.addToList(req, res);
});

module.exports = router;
