const sql = require('../../sql');

module.exports = {
    /**
     * To get all shops
     * @param {*} req
     * @param {*} res
     */
    getShops: async (req, res) => {
        try {
            const shops = (await sql.runQuery(`SELECT * FROM Shop`)).recordset;
            res.status(200).json(JSON.parse(JSON.stringify(shops)));
        } catch (err) {
            res.status(400).json({ msg: err });
        }
    },
};
