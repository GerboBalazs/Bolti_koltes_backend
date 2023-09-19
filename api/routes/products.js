const express = require("express");
const router = express.Router();

router.get("/", (req, res, next) => {
    res.status(200).json({
        message: "Handling GET requests to /products",
    });
});

router.post("/", (req, res, next) => {
    const product = {
        id: req.body.id,
        name: req.body.name,
        price: req.body.price,
    };
    res.status(200).json({
        message: "Handling POST requests to /products",
        createdProduct: product,
    });
});

router.get("/:productID", (req, res, next) => {
    const id = req.params.productID;
    if (id == "special") {
        res.status(200).json({
            message: "You discovered a special ID",
            id: id,
        });
    } else {
        res.status(200).json({
            message: "You passed an ID",
        });
    }
});

router.patch("/:productID", (req, res, next) => {
    res.status(200).json({
        message: "To update products",
    });
});

router.delete("/:productID", (req, res, next) => {
    res.status(200).json({
        message: "To delete products",
    });
});

module.exports = router;
