/**
 * Composes multiple middleware functions into a single array,
 * filtering out any falsy values
 * @param {Array<Function>} middlewares - Array of middleware functions
 * @returns {Array<Function>} Filtered array of middleware functions
 */
const composeMiddleware = (middlewares) => middlewares.filter(Boolean);

module.exports = { composeMiddleware };
