const apisService = require('./internal-apis.service');
const projectService = require('./project.service');
const {
  promptHelper
} = require('../helpers/index');
const automationService = require('./automation.service');
const tenantService = require('./tenant.service');
const getEnv = require('../env');
const config = require('../config');
const moment = require('moment');
const {
  get
} = require('lodash');

function validateName(input) {
  if (!input) {
    throw new Error('Please, insert the job name');
  }
  return true;
}

class JobService {

  async askTimeToExec() {
    const unit = await promptHelper.list('frequency', 'Select a time unit:', ['minutes', 'hours', 'days']);
    const interval = await promptHelper.askNumber('timeUnit', 'Interval(only numbers):', {
      validate: (input) => {
        if (!input) {
          throw new Error('Please, insert the job interval');
        }
        if (unit === 'minutes' && input < 5) {
          throw new Error('Minimum allowed interval is 5 minutes.');
        }
        return true;
      }
    });
    let scheduleHour = null;
    let dateNextExec = Date.now();
    let utcOffset = null;
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    if (unit === 'days') {
      scheduleHour = await promptHelper.askTime('executeAt', 'Execute at:', ['HH', ':', 'MM']);
      hours = scheduleHour.getHours();
      minutes = scheduleHour.getMinutes();
      utcOffset = moment().utcOffset();
      dateNextExec = new Date(moment().utcOffset(utcOffset).hours(hours).minutes(minutes)
        .toISOString());
      if (moment() > moment(dateNextExec)) {
        dateNextExec = moment(dateNextExec).add(1, 'days').toISOString();
      }
    }
    return {
      timeToExec: {
        type: 'POOLING',
        frequency: {
          interval,
          unit: unit.toUpperCase(),
          scheduleHour: `${hours}:${minutes}`,
          utcOffset
        }
      },
      dateNextExec
    };
  }

  async askInfo() {
    const name = await promptHelper.askInput('name', 'Job name:', {
      validate: validateName
    });
    const project = await projectService.askProject();
    const automationBranch = await promptHelper.list('branch', 'Select a branch:', ['master', 'development']);
    const automationName = await automationService.askAutomation(project.source, automationBranch);
    const tenant = await tenantService.askTenant();
    const timeToExec = await this.askTimeToExec();
    const isActive = await promptHelper.list('status', 'Select a job status:', ['On', 'Off']);
    return {
      name,
      automationBranch,
      isActive: isActive === 'On',
      automationName,
      params: '{ "name": "Example" }',
      project: project.source._id,
      subscriber: config.get('subscriberId'),
      tenant,
      type: 'POOLING',
      ...timeToExec
    };
  }

  async create() {
    try {
      const body = await this.askInfo();
      await apisService.call(`${getEnv('API_ULTRON_URL')}/triggers`, {
        method: 'POST',
        body
      });
      console.log('Job successfully created');
    } catch (err) {
      console.log(`Error trying to create job: ${err.message || 'Unexpected error'}`);
    }
  }

  async askJob() {
    const jobs = await this.getJobs();
    const labels = jobs.map((job) => ({
      source: job,
      key: job._id,
      value: `${job.name} - ${job.project.name} - ${job.automationName} - ${job.tenant.title}`
    }));
    const result = await promptHelper.list('job', 'Select a job:\n  Name - Project - Automation - Tenant', labels.map((label) => label.value));
    return labels.find((label) => label.value === result);
  }

  async list() {
    try {
      const job = await this.askJob();
      const operation = await promptHelper.list('operation', 'Select a operation', ['Run', 'Delete']);
      // if (operation === 'Edit') { return; }
      if (operation === 'Delete') {
        return this.delete(job.source);
      }
      if (operation === 'Run') {
        return this.run(job.source);
      }

    } catch (err) {
      console.log(`Error trying to list jobs: ${err.message || 'Unexpected error'}`);
    }
  }

  async run(job) {
    try {
      await apisService.call(`${getEnv('API_ULTRON_URL')}/triggers/${job._id}`, {
        method: 'PUT',
        body: {
          dateNextExec: moment()
        }
      });
      console.log('Job successfully started');
    } catch (err) {
      console.log(`Error trying to run job: ${err.message || 'Unexpected error'}`);
    }
  }

  async getJobs(queryString = {
    subscriber: config.get('subscriberId'),
    limit: 200,
    _sort_displayName: 'asc',
    skip: 0
  }) {
    const res = await apisService.call(`${getEnv('API_ULTRON_URL')}/triggers`, {
      method: 'GET',
      queryString
    });
    const jobs = get(res, 'data');
    if (!jobs || !jobs.length) {
      throw new Error('Jobs not found!');
    }
    return jobs;
  }

  async delete(job) {
    try {
      const confirm = await promptHelper.confirm('Are you sure?');
      if (!confirm) {
        return;
      }
      const url = `${getEnv('API_ULTRON_URL')}/triggers/${job._id}`;
      await apisService.call(url, {
        method: 'DELETE'
      });
      console.log(`Job ${job.name} successfully deleted`);
    } catch (err) {
      console.log(`Error trying to delete job : ${err.message || 'Unexpected error'}`);
    }
  }

  async getJson() {
    const jobs = await this.getJobs();
    const response = [];
    for (const job of jobs) {
      response.push({
        id: job._id,
        title: job.name
      });
    }
    console.log(JSON.stringify(response));
    return response;
  }

}

module.exports = new JobService();