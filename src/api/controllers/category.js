const sql = require('../../sql');

module.exports = {
    /**
     * This endpoint to get main and subcategories for categorical search
     * @param {*} req
     * @param {*} res
     */
    getCategories: async (req, res) => {
        try {
            let result = [];
            const MainCategories = await sql.runQuery(
                `SELECT mc.MainCategoryID, mc.CategoryName AS MainCategoryName FROM MainCategory mc JOIN Shop s on mc.ShopID = s.ShopID WHERE s.ShopID='${req.params.ShopID}'`
            );
            const SubCategories = await sql.runQuery(
                `SELECT mc.MainCategoryID, mc.CategoryName AS MainCategoryName, sc.SubCategoryID, sc.CategoryName AS SubCategoryName  FROM MainCategory mc JOIN Shop s on mc.ShopID = s.ShopID JOIN SubCategory sc ON mc.MainCategoryID = sc.MainCategoryID WHERE s.ShopID='${req.params.ShopID}'`
            );

            for (let element of MainCategories.recordset) {
                result.push({ MainCategoryID: element.MainCategoryID, MainCategoryName: element.MainCategoryName, SubCategories: [] });
            }
            for (let main of result) {
                for (let sub of SubCategories.recordset) {
                    if (main.MainCategoryID == sub.MainCategoryID) {
                        main.SubCategories.push({ SubCategoryID: sub.SubCategoryID, SubCategoryName: sub.SubCategoryName });
                    }
                }
            }

            res.status(200).json(result);
        } catch (err) {
            console.log(err);
            res.status(400).json({ msg: err });
        }
    },

    /**
     * This endpoint is for get all product in 1 subcategory
     * @param {*} req
     * @param {*} res
     */
    getProductWithSubCategory: async (req, res) => {
        try {
            const neededProduct = await sql.runQuery(
                `SELECT p.*, d.Price, d.ShopID, s.ShopName, d.SubCategoryID FROM Products p JOIN Details d On p.Barcode=d.Barcode JOIN Shop s ON d.ShopID=s.ShopID WHERE d.SubCategoryID='${req.params.SubCategoryID}'`
            );
            let result = [];
            for (let prod of neededProduct.recordset) {
                result.push({ Barcode: prod.Barcode, Name: prod.Name, ImageLink: prod.ImageLink });
            }

            res.status(200).json(result);
        } catch (err) {
            res.status(400).json({ msg: err });
        }
    },
};
