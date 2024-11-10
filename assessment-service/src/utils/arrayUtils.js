class ArrayUtils {
    static chunk(array, size) {
        return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
            array.slice(i * size, i * size + size)
        );
    }

    static unique(array, key) {
        if (!key) return [...new Set(array)];
        return [...new Map(array.map((item) => [item[key], item])).values()];
    }

    static groupBy(array, key) {
        return array.reduce((result, item) => {
            (result[item[key]] = result[item[key]] || []).push(item);
            return result;
        }, {});
    }

    static sortBy(array, key, order = 'asc') {
        return [...array].sort((a, b) => {
            if (order === 'asc') return a[key] > b[key] ? 1 : -1;
            return a[key] < b[key] ? 1 : -1;
        });
    }
}

module.exports = ArrayUtils;
