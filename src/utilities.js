const sql = require('./sql');
const jwt = require('jsonwebtoken');

module.exports = {
    //To verify the token
    authorize: async (req, res) => {
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
    },
    isLoggedIn: async (req) => {
        return new Promise(function (resolv) {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];
            if (token == null || token == 'null') return resolv(false);
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err) => {
                if (err) {
                    return resolv(false);
                }
            });
            return resolv(true);
        });
    },

    //To generate token
    generateAccessToken: (user) => {
        return jwt.sign({ email: user.email, userId: user.userId }, process.env.ACCESS_TOKEN_SECRET, {
            algorithm: 'HS256',
            expiresIn: '1h',
        });
    },
    //To generate refresh tokens
    generateRefreshToken: (user) => {
        const refreshToken = jwt.sign({ email: user.email, userId: user.userId }, process.env.REFRESH_TOKEN_SECRET, {
            algorithm: 'HS256',
            expiresIn: '14d',
        });
        sql.runQuery(`INSERT INTO Token VALUES('${refreshToken}')`);
        return refreshToken;
    },

    //To decode the token
    parseJwt: (token) => {
        return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    },
};
