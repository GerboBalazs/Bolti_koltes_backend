const sql = require('../../sql');
const utility = require('../../utilities');

module.exports = {
    /**
     * Add product to list or cart
     * @param {*} req
     * @param {*} res
     */
    addToList: async (req, res) => {
        try {
            //get userid
            if (await utility.authorize(req, res)) {
                const authHeader = req.headers['authorization'];
                const token = authHeader && authHeader.split(' ')[1];
                const userID = utility.parseJwt(token).userId;

                //check if userid/product already in list
                const result = await sql.runQuery(`SELECT * FROM List WHERE UserID = '${userID}' AND Barcode = '${req.body.Barcode}'`);

                if (result.rowsAffected == 0) {
                    await sql.runQuery(`INSERT INTO List(UserID, Barcode, Quantity, InCart, CurrentPrice, ShopID) 
                VALUES('${userID}', '${req.body.Barcode}', '${req.body.Quantity}', '${req.body.InCart}', '${req.body.CurrentPrice}', '${req.body.ShopID}')`);
                    res.status(200).json({ msg: 'Product added to the list successfully' });
                } else {
                    //if it already exists, update the list
                    await sql.runQuery(
                        `UPDATE List SET Quantity = Quantity + '${req.body.Quantity}' , InCart ='${req.body.InCart}' , CurrentPrice ='${req.body.CurrentPrice}', ShopID ='${req.body.ShopID}' WHERE UserID = '${userID}' AND Barcode = '${req.body.Barcode}'`
                    );
                    res.status(200).json({ msg: 'Product updated on the list successfully' });
                }
            }
        } catch (err) {
            res.status(400).json({ msg: err });
        }
    },

    /**
     * This endpoint is for update all information about the product on the list or cart
     * @param {*} req
     * @param {*} res
     */
    modifyProductInList: async (req, res) => {
        try {
            if (await utility.authorize(req, res)) {
                const authHeader = req.headers['authorization'];
                const token = authHeader && authHeader.split(' ')[1];
                const userID = utility.parseJwt(token).userId;
                const result = await sql.runQuery(`SELECT * FROM List WHERE UserID = '${userID}' AND Barcode = '${req.body.Barcode}'`);
                if (result.rowsAffected == 0) {
                    res.status(400).json({ msg: 'User does not have the product on the list' });
                } else {
                    await sql.runQuery(
                        `UPDATE List SET Quantity = '${req.body.Quantity}' , InCart ='${req.body.InCart}' , CurrentPrice ='${req.body.CurrentPrice}', ShopID ='${req.body.ShopID}' WHERE UserID = '${userID}' AND Barcode = '${req.body.Barcode}'`
                    );
                    res.status(200).json({ msg: 'Product updated on the list successfully' });
                }
            }
        } catch (err) {
            res.status(400).json({ msg: err });
        }
    },

    /**
     * This endpoint is for remove product from list or cart
     * @param {*} req
     * @param {*} res
     */
    removeFromList: async (req, res) => {
        try {
            if (await utility.authorize(req, res)) {
                const authHeader = req.headers['authorization'];
                const token = authHeader && authHeader.split(' ')[1];
                const userID = utility.parseJwt(token).userId;
                const result = await sql.runQuery(`SELECT * FROM List WHERE UserID = '${userID}' AND Barcode = '${req.body.Barcode}'`);
                if (result.rowsAffected == 0) {
                    res.status(400).json({ msg: 'User does not have the product on the list' });
                } else {
                    await sql.runQuery(`DELETE FROM List WHERE UserID = '${userID}' AND Barcode = '${req.body.Barcode}'`);
                    res.status(200).json({ msg: 'Product deleted from the list successfully' });
                }
            }
        } catch (err) {
            res.status(400).json({ msg: err });
        }
    },

    /**
     * This endpoint is for get user's saved shopping list
     * @param {*} req
     * @param {*} res
     */
    getList: async (req, res) => {
        try {
            if (await utility.authorize(req, res)) {
                const authHeader = req.headers['authorization'];
                const token = authHeader && authHeader.split(' ')[1];
                const userID = utility.parseJwt(token).userId;

                let results = [];
                const list = (
                    await sql.runQuery(
                        `SELECT l.*, p.ImageLink, p.Name FROM List l JOIN Products p ON l.Barcode = p.Barcode WHERE UserID = '${userID}'`
                    )
                ).recordset;
                const shops = (await sql.runQuery(`SELECT * FROM Shop`)).recordset;

                for (let element of list) {
                    let prices = [];
                    let details = (
                        await sql.runQuery(
                            `SELECT d.*, s.ShopName FROM Details d JOIN Shop s on d.ShopID=s.ShopID WHERE d.Barcode='${element.Barcode}'`
                        )
                    ).recordset;
                    let availableShops = [];
                    //add available shops
                    for (let detail of details) {
                        prices.push({ ShopName: detail.ShopName, Price: detail.Price, ShopID: detail.ShopID, Discount: detail.Discount });
                        availableShops.push(detail.ShopName);
                    }
                    //add unavailable shops with price 0
                    for (let shop of shops) {
                        if (!availableShops.includes(shop.ShopName)) {
                            prices.push({ ShopName: shop.ShopName, Price: 0, ShopID: shop.ShopID, Discount: false });
                        }
                    }
                    //Set the current price instead of shop's price
                    for (let price of prices) {
                        if (element.ShopID == price.ShopID) {
                            price.Price = element.CurrentPrice;
                        }
                    }

                    //check if product is favourited
                    let favourited = true;
                    const result = await sql.runQuery(`SELECT * FROM Favourites WHERE Barcode=${element.Barcode[1]} AND UserID=${userID}`);
                    if (result.rowsAffected == 0) {
                        favourited = false;
                    }
                    results.push({
                        Barcode: element.Barcode,
                        Name: element.Name,
                        ImageLink: element.ImageLink,
                        Favourite: favourited,
                        InCart: element.InCart,
                        ShopID: element.ShopID,
                        Pieces: element.Quantity,
                        Price: prices,
                    });
                }

                res.status(200).json(results);
            }
        } catch (err) {
            console.log(err);
            res.status(400).json({ msg: err });
        }
    },
};
