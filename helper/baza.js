const { Pool, Client } = require('pg')
exports.pool = new Pool({
    user: 'zpjqmsfg',
    host: 'abul.db.elephantsql.com',
    database: 'zpjqmsfg',
    password: 'Zeq7d-ErjC-xE_ob_VsvmV2hn9eiwehh',
    port: 5432,
    max: 10,
    idleTimeoutMillis: 3000
});
