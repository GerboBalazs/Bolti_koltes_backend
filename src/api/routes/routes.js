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
    '/list',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        controller.getList(req, res);
    }
);
router.get(
    '/favourites',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        controller.getFavourites(req, res);
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
router.delete(
    '/logout',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        controller.logout(req, res);
    }
);
router.post(
    '/token',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        controller.refreshToken(req, res);
    }
);
router.post(
    '/list/modify',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        controller.modifyProductInList(req, res);
    }
);
router.post(
    '/list/add',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        controller.addToList(req, res);
    }
);

router.post(
    '/list/toggleInCart',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        controller.toggleInCart(req, res);
    }
);
router.delete(
    '/list/remove',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        controller.removeFromList(req, res);
    }
);
router.post(
    '/favourites/add',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        controller.addToFavourites(req, res);
    }
);
router.delete(
    '/favourites/remove',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        controller.removeFromFavourites(req, res);
    }
);


module.exports = router;
