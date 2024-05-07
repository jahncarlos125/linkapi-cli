class StringHelper {
  upperCaseFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  removeSpecialCharacters(string) {
    return string.replace(/[^\w]+/g, '');
  }
}

module.exports = new StringHelper();
