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
//To generate token
function generateAccessToken(user) {
    return jwt.sign({ email: user.email, userId: user.userId }, process.env.ACCESS_TOKEN_SECRET, {
        algorithm: 'HS256',
        expiresIn: '1h',
    });
}
//To generate refresh tokens
function generateRefreshToken(user) {
    const refreshToken = jwt.sign({ email: user.email, userId: user.userId }, process.env.REFRESH_TOKEN_SECRET, {
        algorithm: 'HS256',
        expiresIn: '14d',
    });
    sql.runQuery(`INSERT INTO Token VALUES('${refreshToken}')`);
    return refreshToken;
}

//To decode the token
function parseJwt(token) {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}
module.exports = {
    //To authenticate the user with normal token
    authenticate: async (req, res) => {
        //Check if the email is already exsisting
        await sql
            .runQuery(`SELECT * FROM Users WHERE Email ='${req.body.email}'`)
            .then((result) => {
                if (result.rowsAffected[0] == 0) return res.status(401).send({ msg: 'Email or password is incorrect!' });
                //Check if the password is correct
                if (result.recordset[0].Password !== createHash('sha256').update(req.body.password).digest('hex')) {
                    return res.status(401).send({ msg: 'Email or password is incorrect!' });
                }
                const user = { email: result.recordset[0].Email, userId: result.recordset[0].UserID };
                //If OK, then create token
                const accessToken = generateAccessToken(user);
                const refreshToken = generateRefreshToken(user);
                res.status(200).json({ accessToken: accessToken, refreshToken: refreshToken });
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
    refreshToken: async (req, res) => {
        try {
            const refreshToken = req.body.refreshToken;
            if (refreshToken == null) return res.sendStatus(401);
            await sql.runQuery(`SELECT * FROM Token WHERE RefreshToken LIKE '${refreshToken}'`).then((result) => {
                if (result.rowsAffected == 0) return res.sendStatus(401);
                jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
                    if (err) {
                        sql.runQuery(`DELETE FROM Token WHERE RefreshToken LIKE '${refreshToken}'`);
                        return res.sendStatus(403);
                    } else {
                        const accessToken = generateAccessToken(user);
                        res.status(200).json({ accessToken: accessToken });
                    }
                });
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
    //Add product to list
    addToList: async (req, res) => {
        try {
            //get userid
            if (await authorize(req, res)) {
                const authHeader = req.headers['authorization'];
                const token = authHeader && authHeader.split(' ')[1];
                const userID = parseJwt(token).userId;

                //check if userid/product already in list
                const result = await sql.runQuery(`SELECT * FROM List WHERE UserID = '${userID}' AND Barcode = '${req.body.barcode}'`);

                if (result.rowsAffected == 0) {
                    await sql.runQuery(`INSERT INTO List(UserID, Barcode, Quantity, InCart, CurrentPrice, ShopID) 
                    VALUES('${userID}', '${req.body.barcode}', '${req.body.quantity}', '${req.body.incart}', '${req.body.currentprice}', '${req.body.shopid}')`);
                    res.status(200).json({ msg: 'Product added to the list successfully' });
                } else {
                    //if it already exists, update the list
                    // const newQuantity = result.recordset[0].Quantity + req.body.quantity;
                    await sql.runQuery(
                        `UPDATE List SET Quantity = '${req.body.quantity}' , InCart ='${req.body.incart}' , CurrentPrice ='${req.body.currentprice}', ShopID ='${req.body.shopid}' WHERE UserID = '${userID}' AND Barcode = '${req.body.barcode}'`
                    );
                    res.status(200).json({ msg: 'Product updated on the list successfully' });
                }
            }
        } catch (err) {
            res.status(404).json({ msg: err });
        }
    },
    getList: async (req, res) => {
        try {
            if (await authorize(req, res)) {
                const authHeader = req.headers['authorization'];
                const token = authHeader && authHeader.split(' ')[1];
                const userID = parseJwt(token).userId;
                const list = (await sql.runQuery(`SELECT * FROM List WHERE UserID = ${userID}`)).recordset;
                res.status(200).json(JSON.parse(JSON.stringify(list)));
            }
        } catch (err) {
            res.status(404).json({ msg: err });
        }
    },
    toggleInCart: async (req, res) => {
        try {
            if (await authorize(req, res)) {
                const authHeader = req.headers['authorization'];
                const token = authHeader && authHeader.split(' ')[1];
                const userID = parseJwt(token).userId;
                const barcode = req.body.barcode;
                //get current inCart and flip it
                console.log(barcode, userID);
                let inCartValue = (await sql.runQuery(`SELECT InCart FROM List WHERE Barcode = ${barcode} AND UserID = ${userID}`)).recordset[0].InCart;
                inCartValue = !inCartValue;
                //convert bool to 1 or 0
                //nemtom miért boolt ad vissza az sql ha csak 1/0-t fogad el
                inCartValue = inCartValue ? 1 : 0;
                
                await sql.runQuery(`UPDATE List SET InCart = ${inCartValue} WHERE Barcode = ${barcode} AND UserID = ${userID}`);
                res.status(200).json({ msg: "InCart value toggled successfully" });
            }
        } catch (err) {
            res.status(404).json({ msg: err });
        }
    },
};
