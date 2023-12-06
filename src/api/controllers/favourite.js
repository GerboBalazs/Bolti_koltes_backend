const sql = require('../../sql');
const utility = require('../../utilities');

module.exports = {
    /**
     * This endpoint is for add product to user's favourite products list
     * @param {*} req
     * @param {*} res
     */
    addToFavourites: async (req, res) => {
        try {
            //get userid
            if (await utility.authorize(req, res)) {
                const authHeader = req.headers['authorization'];
                const token = authHeader && authHeader.split(' ')[1];
                const userID = utility.parseJwt(token).userId;

                //check if userid/product already favourited
                const result = await sql.runQuery(`SELECT * FROM Favourites WHERE UserID = '${userID}' AND Barcode = '${req.body.Barcode}'`);

                if (result.rowsAffected == 0) {
                    await sql.runQuery(`INSERT INTO Favourites(UserID, Barcode) 
                VALUES('${userID}', '${req.body.Barcode}')`);
                    res.status(200).json({ msg: 'Product added to favourites successfully' });
                } else {
                    res.status(409).json({ msg: 'Product already on favourites list' });
                }
            }
        } catch (err) {
            res.status(400).json({ msg: err });
        }
    },

    /**
     * This endpoint is for remove product to user's favourite products list
     * @param {*} req
     * @param {*} res
     */
    removeFromFavourites: async (req, res) => {
        try {
            if (await utility.authorize(req, res)) {
                const authHeader = req.headers['authorization'];
                const token = authHeader && authHeader.split(' ')[1];
                const userID = utility.parseJwt(token).userId;

                //check if there is anything to delete
                const result = await sql.runQuery(`SELECT * FROM Favourites WHERE UserID = '${userID}' AND Barcode = '${req.body.Barcode}'`);
                if (result.rowsAffected == 0) {
                    res.status(400).json({ msg: 'User does not have the product favourited' });
                } else {
                    await sql.runQuery(`DELETE FROM Favourites WHERE UserID = '${userID}' AND Barcode = '${req.body.Barcode}'`);
                    res.status(200).json({ msg: 'Product removed from favourites successfully' });
                }
            }
        } catch (err) {
            res.status(400).json({ msg: err });
        }
    },

    /**
     * This endpoint is for get the user's favourite products list
     * @param {*} req
     * @param {*} res
     */
    getFavourites: async (req, res) => {
        try {
            if (await utility.authorize(req, res)) {
                const authHeader = req.headers['authorization'];
                const token = authHeader && authHeader.split(' ')[1];
                const userID = utility.parseJwt(token).userId;

                //Get favorites
                const favourites = (await sql.runQuery(`SELECT * FROM Favourites f JOIN Products p ON f.Barcode=p.Barcode WHERE f.UserID=${userID}`))
                    .recordset;
                const shops = (await sql.runQuery(`SELECT * FROM Shop`)).recordset;

                let results = [];
                for (let favourite of favourites) {
                    let prices = [];
                    let availableShops = [];
                    let details = (
                        await sql.runQuery(`SELECT * FROM Details d JOIN Shop s on d.ShopID=s.ShopID WHERE d.Barcode=${favourite.Barcode[1]}`)
                    ).recordset;

                    //add available shops
                    for (let detail of details) {
                        prices.push({ ShopName: detail.ShopName, Price: detail.Price, ShopID: detail.ShopID[1], Discount: detail.Discount });
                        availableShops.push(detail.ShopName);
                    }
                    //add unavailable shops with price 0
                    for (let shop of shops) {
                        if (!availableShops.includes(shop.ShopName)) {
                            prices.push({ ShopName: shop.ShopName, Price: 0, ShopID: shop.ShopID, Discount: 0 });
                        }
                    }
                    //add everything to final list
                    results.push({
                        Barcode: favourite.Barcode[1],
                        Name: favourite.Name,
                        ImageLink: favourite.ImageLink,
                        Favourite: true,
                        Price: prices,
                    });
                }
                res.status(200).json(results);
            }
        } catch (err) {
            res.status(400).json({ msg: err });
        }
    },
};
