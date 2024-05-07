const { branchHelper, stringHelper, fileHelper } = require('../helpers');

class TemplateService {

  async generateFile(type, name) {
    try {
      await branchHelper.checkBranch('development');

      const validTypes = ['automation', 'function', 'data-transformation', 'custom-middleware'];

      if (!validTypes.includes(type)) {
        throw new Error(`${type} is not a valid file type. Valid file types: automation, custom-middleware, function and data-transformation`);
      }

      const writePath = fileHelper.getWritePath(type, name);
      const templatePath = fileHelper.getTemplatePath(type, name);
      const valid = fileHelper.checkPath(writePath);

      if (valid) {
        throw new Error(`A file named ${name} already exists at ${type} folder.`);
      }

      await fileHelper.createDirectoryContent(templatePath, writePath);
      console.log(`${stringHelper.upperCaseFirstLetter(type)} ${name} successfully generated`);

    } catch (error) {
      console.log(`Error trying to generate file: ${error.message || 'Unexpected error'}`);
    }

  }

}

module.exports = new TemplateService();
