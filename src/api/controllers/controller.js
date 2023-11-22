const sql = require('../../sql');
const jwt = require('jsonwebtoken');
const { createHash } = require('node:crypto');

//To verify the token
async function authorize(req, res) {
    return new Promise(function (resolv) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token == null || token == 'null') return res.sendStatus(401);
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err) => {
            if (err) {
                res.status(403).send({ msg: 'Token is invalid!' });
                return resolv(false);
            }
        });
        return resolv(true);
    });
}
async function isLoggedIn(req) {
    return new Promise(function (resolv) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token == null || token == 'null') return resolv(false);
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err) => {
            if (err) {
                //res.status(403).send({ msg: 'Token is invalid!' });
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

            let results;

            //check if product is favourited
            if (await isLoggedIn(req)) {
                if (await authorize(req, res)) {
                    const authHeader = req.headers['authorization'];
                    const token = authHeader && authHeader.split(' ')[1];
                    const userID = parseJwt(token).userId;

                    let favourited = true;
                    const result = await sql.runQuery(`SELECT * FROM Favourites WHERE Barcode=${req.params.productID} AND UserID=${userID}`);
                    if (result.rowsAffected == 0) {
                        favourited = false;
                    }
                    results = {
                        Barcode: product[0].Barcode,
                        Name: product[0].Name,
                        ImageLink: product[0].ImageLink,
                        Favourite: favourited,
                        Price: prices,
                    };
                }
            } else {
                results = {
                    Barcode: product[0].Barcode,
                    Name: product[0].Name,
                    ImageLink: product[0].ImageLink,
                    Favourite: false,
                    Price: prices,
                };
            }

            res.status(200).json(results);
        } catch (err) {
            console.log(err);
            res.status(400).json({ msg: 'Product not found' });
        }
    },
    //To get all shops
    getShops: async (req, res) => {
        try {
            const shops = (await sql.runQuery(`SELECT * FROM Shop`)).recordset;
            res.status(200).json(JSON.parse(JSON.stringify(shops)));
        } catch (err) {
            res.status(400).json({ msg: err });
        }
    },
    //Add product to list or cart
    addToList: async (req, res) => {
        try {
            //get userid
            if (await authorize(req, res)) {
                const authHeader = req.headers['authorization'];
                const token = authHeader && authHeader.split(' ')[1];
                const userID = parseJwt(token).userId;

                //check if userid/product already in list
                const result = await sql.runQuery(`SELECT * FROM List WHERE UserID = '${userID}' AND Barcode = '${req.body.Barcode}'`);

                if (result.rowsAffected == 0) {
                    await sql.runQuery(`INSERT INTO List(UserID, Barcode, Quantity, InCart, CurrentPrice, ShopID) 
                    VALUES('${userID}', '${req.body.Barcode}', '${req.body.Quantity}', '${req.body.InCart}', '${req.body.CurrentPrice}', '${req.body.ShopID}')`);
                    res.status(200).json({ msg: 'Product added to the list successfully' });
                } else {
                    //if it already exists, update the list
                    await sql.runQuery(
                        `UPDATE List SET Quantity = Quantity + '${req.body.Quantity}' , InCart ='${req.body.InCart}' , CurrentPrice ='${req.body.CurrentPrice}', ShopID ='${req.body.ShopID}' WHERE UserID = '${userID}' AND Barcode = '${req.body.Barcode}'`
                    );
                    res.status(200).json({ msg: 'Product updated on the list successfully' });
                }
            }
        } catch (err) {
            res.status(400).json({ msg: err });
        }
    },
    //This endpoint is for update all information about the product on the list or cart
    modifyProductInList: async (req, res) => {
        try {
            if (await authorize(req, res)) {
                const authHeader = req.headers['authorization'];
                const token = authHeader && authHeader.split(' ')[1];
                const userID = parseJwt(token).userId;
                const result = await sql.runQuery(`SELECT * FROM List WHERE UserID = '${userID}' AND Barcode = '${req.body.Barcode}'`);
                if (result.rowsAffected == 0) {
                    res.status(400).json({ msg: 'User does not have the product on the list' });
                } else {
                    await sql.runQuery(
                        `UPDATE List SET Quantity = '${req.body.Quantity}' , InCart ='${req.body.InCart}' , CurrentPrice ='${req.body.CurrentPrice}', ShopID ='${req.body.ShopID}' WHERE UserID = '${userID}' AND Barcode = '${req.body.Barcode}'`
                    );
                    res.status(200).json({ msg: 'Product updated on the list successfully' });
                }
            }
        } catch (err) {
            res.status(400).json({ msg: err });
        }
    },
    //This endpoint is for remove product from list or cart
    removeFromList: async (req, res) => {
        try {
            if (await authorize(req, res)) {
                const authHeader = req.headers['authorization'];
                const token = authHeader && authHeader.split(' ')[1];
                const userID = parseJwt(token).userId;
                const result = await sql.runQuery(`SELECT * FROM List WHERE UserID = '${userID}' AND Barcode = '${req.body.Barcode}'`);
                if (result.rowsAffected == 0) {
                    res.status(400).json({ msg: 'User does not have the product on the list' });
                } else {
                    await sql.runQuery(`DELETE FROM List WHERE UserID = '${userID}' AND Barcode = '${req.body.Barcode}'`);
                    res.status(200).json({ msg: 'Product deleted from the list successfully' });
                }
            }
        } catch (err) {
            res.status(400).json({ msg: err });
        }
    },
    getList: async (req, res) => {
        try {
            if (await authorize(req, res)) {
                const authHeader = req.headers['authorization'];
                const token = authHeader && authHeader.split(' ')[1];
                const userID = parseJwt(token).userId;

                let results = [];
                const list = (
                    await sql.runQuery(
                        `SELECT l.*, p.ImageLink, p.Name FROM List l JOIN Products p ON l.Barcode = p.Barcode WHERE UserID = '${userID}'`
                    )
                ).recordset;
                const shops = (await sql.runQuery(`SELECT * FROM Shop`)).recordset;

                for (let element of list) {
                    let prices = [];
                    let details = (
                        await sql.runQuery(
                            `SELECT d.*, s.ShopName FROM Details d JOIN Shop s on d.ShopID=s.ShopID WHERE d.Barcode='${element.Barcode}'`
                        )
                    ).recordset;
                    let availableShops = [];
                    //add available shops
                    for (let detail of details) {
                        prices.push({ ShopName: detail.ShopName, Price: detail.Price, ShopID: detail.ShopID, Discount: detail.Discount });
                        availableShops.push(detail.ShopName);
                    }
                    //add unavailable shops with price 0
                    for (let shop of shops) {
                        if (!availableShops.includes(shop.ShopName)) {
                            prices.push({ ShopName: shop.ShopName, Price: 0, ShopID: shop.ShopID, Discount: false });
                        }
                    }
                    //Set the current price instead of shop's price
                    for (let price of prices) {
                        if (element.ShopID == price.ShopID) {
                            price.Price = element.CurrentPrice;
                        }
                    }

                    //check if product is favourited
                    let favourited = true;
                    const result = await sql.runQuery(`SELECT * FROM Favourites WHERE Barcode=${element.Barcode[1]} AND UserID=${userID}`);
                    if (result.rowsAffected == 0) {
                        favourited = false;
                    }
                    results.push({
                        Barcode: element.Barcode,
                        Name: element.Name,
                        ImageLink: element.ImageLink,
                        Favourite: favourited,
                        InCart: element.InCart,
                        ShopID: element.ShopID,
                        Pieces: element.Quantity,
                        Price: prices,
                    });
                }

                res.status(200).json(results);
            }
        } catch (err) {
            console.log(err);
            res.status(400).json({ msg: err });
        }
    },
    toggleInCart: async (req, res) => {
        try {
            if (await authorize(req, res)) {
                const authHeader = req.headers['authorization'];
                const token = authHeader && authHeader.split(' ')[1];
                const userID = parseJwt(token).userId;
                //get current inCart and flip it
                let inCartValue = (await sql.runQuery(`SELECT InCart FROM List WHERE Barcode = ${req.body.Barcode} AND UserID = ${userID}`))
                    .recordset[0].InCart;
                inCartValue = !inCartValue;
                //convert bool to 1 or 0
                //nemtom miért boolt ad vissza az sql ha csak 1/0-t fogad el
                inCartValue = inCartValue ? 1 : 0;

                await sql.runQuery(`UPDATE List SET InCart = ${inCartValue} WHERE Barcode = ${req.body.Barcode} AND UserID = ${userID}`);
                res.status(200).json({ msg: 'InCart value toggled successfully' });
            }
        } catch (err) {
            res.status(400).json({ msg: err });
        }
    },
    logout: async (req, res) => {
        try {
            //Check if refresh token exsisting in the database
            const result = await sql.runQuery(`SELECT * FROM Token WHERE RefreshToken LIKE '${req.body.refreshToken}'`);
            if (result.rowsAffected != 0) {
                await sql.runQuery(`DELETE FROM Token WHERE RefreshToken LIKE '${req.body.refreshToken}'`);
                res.sendStatus(200);
            } else {
                //If token does not exsising just send 200, logout is already solved
                res.sendStatus(200);
            }
        } catch (err) {
            res.status(400).json({ msg: err });
        }
    },

    addToFavourites: async (req, res) => {
        try {
            //get userid
            if (await authorize(req, res)) {
                const authHeader = req.headers['authorization'];
                const token = authHeader && authHeader.split(' ')[1];
                const userID = parseJwt(token).userId;

                //check if userid/product already favourited
                const result = await sql.runQuery(`SELECT * FROM Favourites WHERE UserID = '${userID}' AND Barcode = '${req.body.Barcode}'`);

                if (result.rowsAffected == 0) {
                    await sql.runQuery(`INSERT INTO Favourites(UserID, Barcode) 
                    VALUES('${userID}', '${req.body.Barcode}')`);
                    res.status(200).json({ msg: 'Product added to favourites successfully' });
                } else {
                    res.status(409).json({ msg: 'Product already on favourites list' });
                }
            }
        } catch (err) {
            res.status(400).json({ msg: err });
        }
    },
    removeFromFavourites: async (req, res) => {
        try {
            if (await authorize(req, res)) {
                const authHeader = req.headers['authorization'];
                const token = authHeader && authHeader.split(' ')[1];
                const userID = parseJwt(token).userId;

                //check if there is anything to delete
                const result = await sql.runQuery(`SELECT * FROM Favourites WHERE UserID = '${userID}' AND Barcode = '${req.body.Barcode}'`);
                if (result.rowsAffected == 0) {
                    res.status(400).json({ msg: 'User does not have the product favourited' });
                } else {
                    await sql.runQuery(`DELETE FROM Favourites WHERE UserID = '${userID}' AND Barcode = '${req.body.Barcode}'`);
                    res.status(200).json({ msg: 'Product removed from favourites successfully' });
                }
            }
        } catch (err) {
            res.status(400).json({ msg: err });
        }
    },

    getFavourites: async (req, res) => {
        try {
            if (await authorize(req, res)) {
                const authHeader = req.headers['authorization'];
                const token = authHeader && authHeader.split(' ')[1];
                const userID = parseJwt(token).userId;

                //Get favorites
                const favourites = (await sql.runQuery(`SELECT * FROM Favourites f JOIN Products p ON f.Barcode=p.Barcode WHERE f.UserID=${userID}`))
                    .recordset;
                const shops = (await sql.runQuery(`SELECT * FROM Shop`)).recordset;

                let results = [];
                for (let favourite of favourites) {
                    let prices = [];
                    let availableShops = [];
                    let details = (
                        await sql.runQuery(`SELECT * FROM Details d JOIN Shop s on d.ShopID=s.ShopID WHERE d.Barcode=${favourite.Barcode[1]}`)
                    ).recordset;

                    //add available shops
                    for (let detail of details) {
                        prices.push({ ShopName: detail.ShopName, Price: detail.Price, ShopID: detail.ShopID[1], Discount: detail.Discount });
                        availableShops.push(detail.ShopName);
                    }
                    //add unavailable shops with price 0
                    for (let shop of shops) {
                        if (!availableShops.includes(shop.ShopName)) {
                            prices.push({ ShopName: shop.ShopName, Price: 0, ShopID: shop.ShopID, Discount: 0 });
                        }
                    }
                    //add everything to final list
                    results.push({
                        Barcode: favourite.Barcode[1],
                        Name: favourite.Name,
                        ImageLink: favourite.ImageLink,
                        Favourite: true,
                        Price: prices,
                    });
                }
                res.status(200).json(results);
            }
        } catch (err) {
            res.status(400).json({ msg: err });
        }
    },
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
