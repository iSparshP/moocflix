class DateUtils {
    static isValidDate(date) {
        return date instanceof Date && !isNaN(date);
    }

    static isFutureDate(date) {
        return this.isValidDate(date) && date > new Date();
    }

    static formatDate(date, format = 'ISO') {
        if (!this.isValidDate(date)) return null;

        switch (format) {
            case 'ISO':
                return date.toISOString();
            case 'YYYY-MM-DD':
                return date.toISOString().split('T')[0];
            case 'readable':
                return date.toLocaleString();
            default:
                return date.toISOString();
        }
    }

    static addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
}

module.exports = DateUtils;
