const securityConfig = {
    helmet: {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
            },
        },
        xssFilter: true,
        noSniff: true,
        referrerPolicy: { policy: 'same-origin' },
    },
};

module.exports = { securityConfig };
