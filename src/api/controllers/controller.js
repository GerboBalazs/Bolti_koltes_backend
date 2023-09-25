const sql = require('../../sql');

module.exports = {
    getProducts: (req, res) => {
        const id = req.params.productID;
        // console.log(req.ip);
        if (id == 'special') {
            res.status(200).json({
                message: 'You discovered a special ID',
                id: id,
            });
        } else {
            res.status(200).json({
                message: 'You passed an ID',
            });
        }
    },
    prodProba: async (req, res) => {
        const prod = await sql.runQuery(`SELECT * FROM Products`);
        res.status(200).json({
            barcode: prod.recordset[0].Barcode,
        });
    },
};
