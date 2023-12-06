const express = require('express');
const router = express.Router();
const authenticate = require('../controllers/authenticate');
const category = require('../controllers/category');
const discount = require('../controllers/discount');
const favourite = require('../controllers/favourite');
const history = require('../controllers/history');
const list = require('../controllers/list');
const product = require('../controllers/product');
const shop = require('../controllers/shop');

router.post(
    '/register',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        authenticate.registration(req, res);
    }
);

router.get(
    '/shops',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        shop.getShops(req, res);
    }
);
router.get(
    '/list',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        list.getList(req, res);
    }
);
router.get(
    '/favourites',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        favourite.getFavourites(req, res);
    }
);

router.post(
    '/login',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        authenticate.authenticate(req, res);
    }
);
router.delete(
    '/logout',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        authenticate.logout(req, res);
    }
);
router.post(
    '/token',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        authenticate.refreshToken(req, res);
    }
);
router.post(
    '/list/modify',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        list.modifyProductInList(req, res);
    }
);
router.post(
    '/list/add',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        list.addToList(req, res);
    }
);
router.delete(
    '/list/remove',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        list.removeFromList(req, res);
    }
);
router.post(
    '/favourites/add',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        favourite.addToFavourites(req, res);
    }
);
router.delete(
    '/favourites/remove',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        favourite.removeFromFavourites(req, res);
    }
);
router.get(
    '/categories/:ShopID',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        category.getCategories(req, res);
    }
);
router.get(
    '/products/:SubCategoryID',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        category.getProductWithSubCategory(req, res);
    }
);
router.post(
    '/history',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        history.addToHistory(req, res);
    }
);
router.get(
    '/history/purchases',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        history.getPurchases(req, res);
    }
);
router.get(
    '/history/purchases/:purchaseID',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        history.getPurchaseDetails(req, res);
    }
);
router.get(
    '/discount',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        discount.getDiscounts(req, res);
    }
);
router.get(
    '/:productID',
    (req, res, next) => {
        next();
    },
    (req, res) => {
        product.getProduct(req, res);
    }
);

module.exports = router;
