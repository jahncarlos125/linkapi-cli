#!/usr/bin/env node

const program = require('commander');
const {
  login,
  logout
} = require('./login');
const {
  userLogged
} = require('./helpers');
const templateService = require('./services/template.service');
const projectService = require('./services/project.service');
const tenantService = require('./services/tenant.service');
const subscriberService = require('./services/subscriber.service');
const runService = require('./services/run.service');
const jobService = require('./services/job.service');
const packageJSON = require('./package.json');

program
  .command('login')
  .description('Login in your account')
  .action((options) => {
    login(options);
  });


program
  .command('logout')
  .description('Logout')
  .action(() => logout());


program
  .command('project <subcommand> [param1]')
  .alias('p')
  .description('Manage your LinkApi projects')
  .action(async (_subCommand, param1) => {
    if (!userLogged()) {
      return;
    }
    const subcommand = _subCommand.toUpperCase();

    if (subcommand === 'L' || subcommand === 'LIST') {
      return projectService.list();
    }

    if (subcommand === 'COMMIT') {
      return projectService.commit(param1);
    }

    if (subcommand === 'CREATE') {
      return projectService.create();
    }

    if (subcommand === 'D' || subcommand === 'DISCARD') {
      return projectService.discard(param1);
    }

    if (subcommand === 'P' || subcommand === 'PUBLISH') {
      return projectService.publish();
    }

    if (subcommand === 'S' || subcommand === 'SYNC') {
      return projectService.sync();
    }

    if (subcommand === 'C' || subcommand === 'CLONE') {
      return projectService.clone(null, param1);
    }

    if (subcommand === 'J' || subcommand === 'JSON') {
      return projectService.getJson();
    }

    console.log('Invalid command!');
  });

program
  .command('job <subcommand>')
  .alias('j')
  .description('Manage your LinkApi jobs')
  .action(async (_subCommand) => {
    if (!userLogged()) {
      return;
    }
    const subcommand = _subCommand.toUpperCase();

    if (subcommand === 'C' || subcommand === 'CREATE') {
      return jobService.create();
    }

    if (subcommand === 'L' || subcommand === 'LIST') {
      return jobService.list();
    }

    if (subcommand === 'J' || subcommand === 'JSON') {
      return jobService.getJson();
    }

    console.log('Invalid command!');
  });

program
  .command('generate <type> <name>')
  .alias('g')
  .description('Create files from templates')
  .action((type, name) => {
    if (!userLogged()) {
      return;
    }
    return templateService.generateFile(type, name);
  });

program
  .command('subscriber <subcommand> [param]')
  .alias('s')
  .description('List Subscribers')
  .action(async (_subCommand, param) => {
    if (!userLogged()) {
      return;
    }
    const subcommand = _subCommand.toUpperCase();
    if (subcommand === 'J' || subcommand === 'JSON') {
      return subscriberService.getJson();
    }

    if (subcommand === 'S' || subcommand === 'SET') {
      return subscriberService.set(param);
    }

    console.log('Invalid command!');
  });

program
  .command('tenant <subcommand>')
  .alias('t')
  .description('List Tenants')
  .action(async (_subCommand) => {
    if (!userLogged()) {
      return;
    }
    const subcommand = _subCommand.toUpperCase();

    if (subcommand === 'J' || subcommand === 'JSON') {
      return tenantService.getJson();
    }

    console.log('Invalid command!');
  });

program
  .command('run')
  .alias('r')
  .description('Run your project files')
  .requiredOption('-p, --path <path>')
  .option('-t, --tenant <tenant>')
  .option('--params <params>')
  .action((options) => {
    if (!userLogged()) {
      return;
    }
    return runService.run(options);
  });

program
  .version(packageJSON.version, '-v, --version')
  .description('LinkApi CLI');

program.parse(process.argv);
