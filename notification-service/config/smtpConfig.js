module.exports = {
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
    sender: process.env.MAILGUN_SENDER || 'notifications@moocflix.com',
    host: 'api.mailgun.net',
    version: 'v3',
};
