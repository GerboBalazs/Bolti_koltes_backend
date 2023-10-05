const sql = require('../../sql');

module.exports = {
    getProduct: async (req, res) => {
        try {
            const product = (await sql.runQuery(`SELECT * FROM Products WHERE barcode=${req.params.productID}`)).recordset;
            res.status(200).json({
                Barcode: product[0].Barcode,
                Name: product[0].Name,
                ImageLink: product[0].ImageLink,
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
};
