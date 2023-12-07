const sql = require('../../sql');
const utility = require('../../utilities');

module.exports = {
    /**
     * The endpoint is for saving the cart of the user in the database
     * @param {*} req
     * @param {*} res
     */
    addToHistory: async (req, res) => {
        try {
            if (await utility.authorize(req, res)) {
                const authHeader = req.headers['authorization'];
                const token = authHeader && authHeader.split(' ')[1];
                const userID = utility.parseJwt(token).userId;

                //Get the user's last inserted PurchaseID
                let purchaseID = await sql.runQuery(`SELECT TOP 1 PurchaseID FROM History WHERE UserID='${userID}' ORDER BY PurchaseID DESC`);
                if (purchaseID.rowsAffected == 0) {
                    purchaseID = 1;
                } else {
                    purchaseID = purchaseID.recordset[0].PurchaseID + 1;
                }
                //Insert the products to history table
                for (let element of req.body) {
                    await sql.runQuery(
                        `INSERT INTO History (PurchaseID, Barcode,UserID, Date, Quantity, CurrentPrice, ShopID) VALUES ('${purchaseID}','${element.Barcode}','${userID}',GETDATE(),'${element.Quantity}','${element.Price}','${element.ShopID}')`
                    );
                }
                res.status(200).json({ msg: 'Purchase is saved' });
            }
        } catch (err) {
            res.status(400).json({ msg: err });
        }
    },

    /**
     * This endpoint is for get user's shopping histories
     * @param {*} req
     * @param {*} res
     */
    getPurchases: async (req, res) => {
        try {
            if (await utility.authorize(req, res)) {
                const authHeader = req.headers['authorization'];
                const token = authHeader && authHeader.split(' ')[1];
                const userID = utility.parseJwt(token).userId;
                let purchases = (
                    await sql.runQuery(
                        `SELECT PurchaseID, SUM(CurrentPrice*Quantity)AS OverallPrice, MAX([Date]) AS Date  FROM History  WHERE UserID='${userID}' GROUP BY PurchaseID`
                    )
                ).recordset;
                for (let purchase of purchases) {
                    //  purchase.Date = purchase.Date.substring(0, 10);
                    purchase.Date = purchase.Date.toISOString().substring(0, 10).replaceAll('/', '-');
                }

                res.status(200).json(purchases);
            }
        } catch (err) {
            console.log(err);
            res.status(400).json({ msg: err });
        }
    },

    /**
     * This endpoint is for get all details about 1 specific shopping
     * @param {*} req
     * @param {*} res
     */
    getPurchaseDetails: async (req, res) => {
        try {
            if (await utility.authorize(req, res)) {
                const authHeader = req.headers['authorization'];
                const token = authHeader && authHeader.split(' ')[1];
                const userID = utility.parseJwt(token).userId;
                const details = (
                    await sql.runQuery(
                        `SELECT p.Barcode, p.Name, p.ImageLink, h.CurrentPrice FROM History h JOIN Products p ON h.Barcode = p.Barcode WHERE PurchaseID = '${req.params.purchaseID}' AND UserID='${userID}'`
                    )
                ).recordset;
                res.status(200).json(details);
            }
        } catch (err) {
            console.log(err);
            res.status(400).json({ msg: err });
        }
    },
};
