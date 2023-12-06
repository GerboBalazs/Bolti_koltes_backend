const sql = require('../../sql');
const utility = require('../../utilities');

module.exports = {
    /**
     * To get product by barcode
     * @param {*} req
     * @param {*} res
     */
    getProduct: async (req, res) => {
        try {
            //Get the right product
            const product = (
                await sql.runQuery(
                    `SELECT p.Barcode, p.ImageLink,p.Name, d.Price, d.Discount, s.ShopName, s.ShopID FROM Products p
                        JOIN Details d ON p.Barcode=d.Barcode JOIN Shop s ON d.ShopID=s.ShopID WHERE d.Barcode=${req.params.productID}`
                )
            ).recordset;
            const shops = (await sql.runQuery(`SELECT * FROM Shop`)).recordset;
            let prices = [];
            let availableShops = [];
            //If the product is exsisting in more than one store
            for (let element of product) {
                prices.push({ ShopName: element.ShopName, Price: element.Price, ShopID: element.ShopID, Discount: element.Discount });
                availableShops.push(element.ShopName);
            }
            //Set price and discount to 0 in unavailable shops
            for (let shop of shops) {
                if (!availableShops.includes(shop.ShopName)) {
                    prices.push({ ShopName: shop.ShopName, Price: 0, ShopID: shop.ShopID, Discount: 0 });
                }
            }

            let results;

            //check if product is favourited
            if (await utility.isLoggedIn(req)) {
                if (await utility.authorize(req, res)) {
                    const authHeader = req.headers['authorization'];
                    const token = authHeader && authHeader.split(' ')[1];
                    const userID = utility.parseJwt(token).userId;

                    let favourited = true;
                    const result = await sql.runQuery(`SELECT * FROM Favourites WHERE Barcode=${req.params.productID} AND UserID=${userID}`);
                    if (result.rowsAffected == 0) {
                        favourited = false;
                    }
                    results = {
                        Barcode: product[0].Barcode,
                        Name: product[0].Name,
                        ImageLink: product[0].ImageLink,
                        Favourite: favourited,
                        Price: prices,
                    };
                }
            } else {
                results = {
                    Barcode: product[0].Barcode,
                    Name: product[0].Name,
                    ImageLink: product[0].ImageLink,
                    Favourite: false,
                    Price: prices,
                };
            }

            res.status(200).json(results);
        } catch (err) {
            res.status(400).json({ msg: 'Product not found' });
        }
    },
};
