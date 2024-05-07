const inquirer = require('inquirer');
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));
inquirer.registerPrompt('datetime', require('inquirer-datepicker-prompt'));
inquirer.registerPrompt('checkbox-plus', require('inquirer-checkbox-plus-prompt'));
const fuzzy = require('fuzzy');

var colors = ['red', 'green', 'blue', 'yellow'];


class PromptHelper {

  async confirm(message = 'Are you sure?') {
    const questions = [{
      type: 'confirm',
      name: 'confirm',
      message
    }];

    const answer = await inquirer.prompt(questions);
    return answer.confirm;
  }

  async multiSelect(name, message, choices, dfault = []) {
    const questions = [{
      type: 'checkbox-plus',
      name,
      message,
      pageSize: 10,
      highlight: true,
      searchable: true,
      default: dfault,
      source: (answers, input) => {
        // eslint-disable-next-line no-param-reassign
        input = input || '';
        return new Promise((resolve) => {
          setTimeout(() => {
            const fuzzyResult = fuzzy.filter(input, choices);
            resolve(
              fuzzyResult.map((el) => el.original)
            );
          }, 200);
        });
      },
    }];
    const answer = await inquirer.prompt(questions);
    return answer[name];
  }

  async askInput(name, message, options = {}) {
    const questions = [{
      type: 'input',
      name,
      message,
      ...options
    }];

    const answer = await inquirer.prompt(questions);
    return answer[name];
  }

  async askTime(name, message, format = ['m', '/', 'd', '/', 'yy', ' ', 'h', ':', 'MM', ' ', 'TT']) {
    const questions = [{
      type: 'datetime',
      name,
      message,
      format
    }];
    const answer = await inquirer.prompt(questions);
    return answer[name];
  }

  async askNumber(name, message, options = {}) {
    const questions = [{
      type: 'number',
      name,
      message,
      ...options
    }];

    const answer = await inquirer.prompt(questions);
    return answer[name];
  }

  async askPassword(name, message) {
    const questions = [{
      type: 'password',
      name,
      message
    }];

    const answer = await inquirer.prompt(questions);
    return answer[name];
  }

  async list(name, message, choices) {
    this.choices = choices;
    const questions = [{
      type: 'autocomplete',
      name,
      message,
      source: (answers, input) => {
        // eslint-disable-next-line no-param-reassign
        input = input || '';
        return new Promise((resolve) => {
          setTimeout(() => {
            const fuzzyResult = fuzzy.filter(input, choices);
            resolve(
              fuzzyResult.map((el) => el.original)
            );
          }, 200);
        });
      },
      pageSize: 10,
      validate: (val) => (val ? true : 'Type something!')
    }];
    const answer = await inquirer.prompt(questions);
    return answer[name] ? answer[name] : answer;
  }
}

module.exports = new PromptHelper();
