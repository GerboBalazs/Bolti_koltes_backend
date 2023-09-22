require('dotenv').config();
const mssql = require('mssql');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST || '',
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '', 10),
    options: {
        trustServerCertificate: true,
    },
};

module.exports = {
    initialConnection: () => {
        try {
            mssql.connect(config).then(() => {
                console.log('Succesfull connection to Database');
            });
        } catch (err) {
            console.log(err);
        }
    },
    runQuery: async (query) => {
        const pool = await mssql.connect(config);
        const res = await pool.query(query);
        return res;
    },
};
