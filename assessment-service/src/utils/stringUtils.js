class StringUtils {
    static isNullOrEmpty(str) {
        return !str || str.trim().length === 0;
    }

    static truncate(str, length = 100) {
        if (this.isNullOrEmpty(str)) return str;
        return str.length > length ? `${str.substring(0, length)}...` : str;
    }

    static sanitize(str) {
        if (this.isNullOrEmpty(str)) return str;
        return str.replace(/[<>]/g, '');
    }

    static generateRandomString(length = 10) {
        return Math.random()
            .toString(36)
            .substring(2, length + 2);
    }
}

module.exports = StringUtils;
