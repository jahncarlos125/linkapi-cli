module.exports = async (origin, destination, payload) => {
  if (origin === 'linkapi') {
    return {
      id: payload.ID,
      status: payload.STATUS,
      date: payload.created_at,
    };
  }
};
