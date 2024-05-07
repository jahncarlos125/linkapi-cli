module.exports = query => {
    const keys = Object.keys(query);
    let queryString = '&';
    keys.forEach(key => {
        queryString = queryString + `${key}=${query[key]}&`;
    })
    queryString = queryString.slice(0, -1);
    return queryString;
};