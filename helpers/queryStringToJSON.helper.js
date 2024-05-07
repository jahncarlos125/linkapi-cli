module.exports = (url) => {
  const pairs = url.slice(1).split('&');
  const result = {};
  pairs.forEach((_pair) => {
    const pair = _pair.split('=');
    result[pair[0]] = decodeURIComponent(pair[1] || '');
  });
  return JSON.parse(JSON.stringify(result));
};
