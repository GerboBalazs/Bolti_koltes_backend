const sql = require('../../sql');
const jwt = require('jsonwebtoken');
const { createHash } = require('node:crypto');
const utility = require('../../utilities');

module.exports = {
    /**
     * To register new users
     * @param {*} req
     * @param {*} res
     */
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

    /**
     * To authenticate the user and generating tokens
     * @param {*} req
     * @param {*} res
     */
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
                const accessToken = utility.generateAccessToken(user);
                const refreshToken = utility.generateRefreshToken(user);
                res.status(200).json({ accessToken: accessToken, refreshToken: refreshToken });
            })
            .catch((err) => res.status(400).send({ msg: err }));
    },

    /**
     * Log out the user
     * @param {*} req
     * @param {*} res
     */
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

    /**
     * This endpoint is for refreshing the access token with the refresh token
     * @param {*} req
     * @param {*} res
     * @returns
     */
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
                        const accessToken = utility.generateAccessToken(user);
                        res.status(200).json({ accessToken: accessToken });
                    }
                });
            });
        } catch (err) {
            res.status(400).send({ msg: err });
        }
    },
};
