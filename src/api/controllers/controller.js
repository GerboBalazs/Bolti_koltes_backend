const sql = require('../../sql');

module.exports = {
    getProduct: async (req, res) => {
        try {
            const product = (
                await sql.runQuery(
                    `SELECT p.*, d.Price FROM Products p JOIN Details d ON p.Barcode=d.Barcode WHERE p.Barcode=${req.params.productID}`
                )
            ).recordset;
            res.status(200).json({
                Barcode: product[0].Barcode,
                Name: product[0].Name,
                ImageLink: product[0].ImageLink,
                Price: product[0].Price,
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
