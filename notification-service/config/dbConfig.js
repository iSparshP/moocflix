module.exports = {
    url: process.env.DATABASE_URL,
    options: {
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
        dialectOptions: {
            ssl:
                process.env.DB_SSL === 'true'
                    ? {
                          require: true,
                          rejectUnauthorized: false,
                      }
                    : false,
        },
    },
};
