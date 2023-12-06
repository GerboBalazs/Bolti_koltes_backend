const sql = require('../../sql');

module.exports = {
    /**
     * This endpoint is for get all discount types with all parameters
     * @param {*} req
     * @param {*} res
     */
    getDiscounts: async (req, res) => {
        try {
            const discounts = (await sql.runQuery(`SELECT * FROM Discounts`)).recordset;
            res.status(200).json(discounts);
        } catch (err) {
            res.status(400).json({ msg: err });
        }
    },
};
