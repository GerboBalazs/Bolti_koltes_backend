const sql = require('../../sql');
const jwt = require('jsonwebtoken');
const { createHash } = require('node:crypto');

//To verify the token
async function authorize(req, res) {
    return new Promise(function (resolv) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token == null) return res.sendStatus(401);
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err) => {
            if (err) {
                res.status(403).send({ msg: 'Token is invalid!' });
                return resolv(false);
            }
        });
        return resolv(true);
    });
}

//To decode the token
async function parseJwt(token) {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}
module.exports = {
    //To authenticate the user
    authenticate: async (req, res) => {
        await sql
            //Check if the email is already exsisting
            .runQuery(`SELECT * FROM Users WHERE Email ='${req.body.email}'`)
            .then((result) => {
                if (result.rowsAffected[0] == 0) return res.status(401).send({ msg: 'Email or password is incorrect!' });
                //Check if the password is correct
                if (result.recordset[0].Password !== createHash('sha256').update(req.body.password).digest('hex')) {
                    return res.status(401).send({ msg: 'Email or password is incorrect!' });
                }
                //If OK, then create token
                const accessToken = jwt.sign(
                    { email: result.recordset[0].Email, userId: result.recordset[0].UserID },
                    process.env.ACCESS_TOKEN_SECRET,
                    {
                        algorithm: 'HS256',
                        expiresIn: '1d',
                    }
                );
                res.status(200).json({ accessToken: accessToken });
            })
            .catch((err) => res.status(400).send({ msg: err }));
    },
    //To register new users
    registration: async (req, res) => {
        try {
            //If a user is existing with this email, then not allowed to register again
            await sql.runQuery(`SELECT * FROM Users WHERE Email = '${req.body.email}'`).then((result) => {
                //Check if the email is free
                if (result.rowsAffected == 0) {
                    sql.runQuery(
                        `INSERT INTO Users(Email,Password,DisplayName) VALUES('${req.body.email}','${createHash('sha256')
                            .update(req.body.password)
                            .digest('hex')}','${req.body.username}')`
                    );
                    res.status(200).send({ msg: 'Successful register' });
                } else {
                    res.status(409).send({ msg: 'Email has been already registered!' });
                }
            });
        } catch (err) {
            res.status(400).send({ msg: err });
        }
    },
    //To get products by barcode
    getProduct: async (req, res) => {
        if ((await authorize(req, res)) === true) {
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
                res.status(200).json({
                    Barcode: product[0].Barcode,
                    Name: product[0].Name,
                    ImageLink: product[0].ImageLink,
                    Price: prices,
                });
            } catch (err) {
                res.status(400).json({ msg: 'Product not found' });
            }
        }
    },
    prodProba: async (req, res) => {
        if ((await authorize(req, res)) === true) {
            const prod = await sql.runQuery(`SELECT * FROM Products`);
            res.status(200).json({
                barcode: prod.recordset[0].Barcode,
            });
        }
    },
    //To get all shops
    getShops: async (req, res) => {
        try {
            const shops = (await sql.runQuery(`SELECT * FROM Shop`)).recordset;
            res.status(200).json(JSON.parse(JSON.stringify(shops)));
        } catch (err) {
            res.status(404).json({ msg: err });
        }
    },
};
