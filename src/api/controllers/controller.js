const sql = require('../../sql');

module.exports = {
    getProduct: async (req, res) => {
        try {
            const product = (
                await sql.runQuery(
                    `SELECT p.Barcode, p.ImageLink,p.Name, d.Price, d.Discount, s.ShopName, s.ShopID FROM Products p
                     JOIN Details d ON p.Barcode=d.Barcode JOIN Shop s ON d.ShopID=s.ShopID WHERE d.Barcode=${req.params.productID}`
                )
            ).recordset;
            const shops = (await sql.runQuery(`SELECT * FROM Shop`)).recordset;
            let prices = [];
            let availableShops = [];
            for (let element of product) {
                prices.push({ ShopName: element.ShopName, Price: element.Price });
                availableShops.push(element.ShopName);
            }
            for (let shop of shops) {
                if (!availableShops.includes(shop.ShopName)) {
                    prices.push({ ShopName: shop.ShopName, Price: 0 });
                }
            }
            res.status(200).json({
                Barcode: product[0].Barcode,
                Name: product[0].Name,
                ImageLink: product[0].ImageLink,
                Price: prices,
            });
        } catch (err) {
            res.status(400).json({ msg: err });
        }
    },
    prodProba: async (req, res) => {
        const prod = await sql.runQuery(`SELECT * FROM Products`);
        res.status(200).json({
            barcode: prod.recordset[0].Barcode,
        });
    },
    getShops: async (req, res) => {
        try {
            const shops = (await sql.runQuery(`SELECT * FROM Shop`)).recordset;
            res.status(200).json(JSON.parse(JSON.stringify(shops)));
        } catch (err) {
            res.status(404).json({ msg: err });
        }
    },
};
