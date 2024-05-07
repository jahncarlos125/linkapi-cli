const {
  gitHelper,
  promptHelper,
  fileHelper,
  branchHelper
} = require('../helpers');
const apisService = require('./internal-apis.service');
const componentService = require('./component.service');
const functionService = require('./function.service');
const config = require('../config');
const getEnv = require('../env');

const {
  get
} = require('lodash');

function validateProjectName(input) {
  if (!input) {
    throw new Error('Please, insert the project name');
  }
  return true;
}

class ProjectService {

  async askProject() {
    const projects = await this.getProjects();
    if (!projects || !projects.length) {
      console.log('No project found.');
      return;
    }
    const labels = projects.map((project) => ({
      source: project,
      key: project._id,
      value: `${project.name} - (${project.type === 'EXPOSE_API' ? 'Gateway' : 'Automation'})`
    }));
    const result = await promptHelper.list('project', 'Select a project:', labels.map((label) => label.value));
    return labels.find((label) => label.value === result);
  }

  async clone(project, id = null) {
    try {
      if (id) {
        project = await this.getById(id);
      }

      await gitHelper.clone(project, 'development');
      console.log('Successfully cloned');
    } catch (error) {
      console.log(`Error trying to clone: ${error.message || 'Unexpected error'}`);
    }
  }

  async getJson() {
    const projects = await this.getProjects();
    const response = [];
    for (const project of projects) {
      response.push({
        id: project._id,
        title: project.name
      });
    }
    console.log(JSON.stringify(response));
    return response;
  }

  async getNewProjectComponents(projectComponents = []) {
    const components = await componentService.list();
    const labels = components.map((component) => ({
      source: component,
      key: component._id,
      privacy: component.privacy.type,
      value: ` ${component.name} - (${component.privacy.type === 'PRIVATE' ? 'Private' : 'PreBuilt'})`
    }));
    const defaults = labels
      .filter((label) => projectComponents.some((component) => component._id === label.key))
      .map((label) => label.value);
    const selectedComponents = await promptHelper.multiSelect('project', 'Select components (press SPACE to select)', labels.map((label) => label.value), defaults);
    const dependencies = {
      applications: [],
      universalApps: []
    };
    selectedComponents.forEach((component) => {
      const componentInfo = labels.find((label) => label.value === component);
      if (componentInfo.privacy === 'PRIVATE') {
        return dependencies.applications.push(componentInfo.key)
      }
      dependencies.universalApps.push(componentInfo.key);
    });
    return dependencies;
  }

  async getNewProjectFunctions(projectFunctions = []) {
    const dependencies = {
      functions: []
    };
    const functions = await functionService.list();
    if (!functions || !functions.length) {
      console.log('No functions found.');
      return dependencies;
    }
    const labels = functions.map((fn) => ({
      source: fn,
      key: fn._id,
      value: ` ${fn.name} - (Private)`
    }));
    const defaults = labels
      .filter((label) => projectFunctions.some((fn) => fn === label.key))
      .map((label) => label.value);
    const selectedFunctions = await promptHelper.multiSelect('project', 'Select functions (press SPACE to select)', labels.map((label) => label.value), defaults);

    selectedFunctions.forEach((fn) => {
      const fnInfo = labels.find((label) => label.value === fn);
      dependencies.functions.push(fnInfo.key);
    });
    return dependencies;
  }

  async create() {
    try {
      const baseUrl = `${getEnv('API_ULTRON_URL')}/projects`;

      const name = await promptHelper.askInput('name', 'Project name:', {
        validate: validateProjectName
      });
      const alreadyExists = await this.checkName(name);
      if (alreadyExists) {
        console.log(`Project name ${name} already exists.`);
        return;
      }
      const selectedComponents = await this.getNewProjectComponents();
      const fnSelect = await promptHelper.confirm('Do you want to select a function package?');
      let selectedFunctions = [];
      if (fnSelect) {
        selectedFunctions = await this.getNewProjectFunctions();
      }
      const body = {
        name,
        dependencies: {
          ...selectedFunctions,
          ...selectedComponents
        },
        type: 'INTERNAL_AUTOMATION',
        cli: true,
        subscriber: config.get('subscriberId')
      };
      const project = await apisService.call(baseUrl, {
        method: 'POST',
        body
      });
      console.log(`Project ${name} successfully created`);
      const projectPath = await gitHelper.clone(project, 'development');
      console.log(`Your project was cloned along the path: \n${projectPath}\n`);
      this.showFirstStepsMessages();
    } catch (error) {
      console.log(`Error trying to create project: ${error.message || 'Unexpected error'}`);
    }
  }

  showFirstStepsMessages() {
    const context = config.get('context');
    if (!context && context !== 'v2') {
      return;
    }
    console.log('To get started, access the project root and execute: \n$ npm i\n ');
    console.log('Then test your automations using the command: \n$ npm run test\n');
    console.log('For more information access: https://developers.linkapi.solutions');
  }

  async commit(message = 'Update my project') {
    try {
      const baseUrl = `${getEnv('API_ULTRON_URL')}/projects`;
      await branchHelper.checkBranch('development');
      const projectId = fileHelper.getProjectId();
      const project = await this.getById(projectId);
      const subscriber = config.get('subscriberId');
      if (subscriber !== project.subscriber) {
        throw new Error('Unauthorized access');
      }
      const changes = await gitHelper.getModifiedFiles();

      if (!changes || !changes.length) {
        console.log('No changes to commit.');
        return;
      }
      await gitHelper.commit(message, project.name);

      if (project.numberOfCommitsToPublish || project.numberOfCommitsToPublish === 0) {
        project.numberOfCommitsToPublish += 1;
        await this.update(project._id, project);
      }
      await apisService.call(`${baseUrl}/sync/${projectId}`, {
        method: 'PUT'
      });
      console.log(`Successfully commited, development branch is ahead by ${project.numberOfCommitsToPublish} commits.`);
    } catch (error) {
      console.log(`Error trying to commit project: ${error.message || 'Unexpected error'}`);
    }
  }

  async publish() {
    try {
      const baseUrl = `${getEnv('API_ULTRON_URL')}/projects`;

      await branchHelper.isValidBranch();
      const projectId = fileHelper.getProjectId();
      const body = {
        sourceBranch: 'development',
        targetBranch: 'master'
      };
      await apisService.call(`${baseUrl}/${projectId}/publish`, {
        method: 'POST',
        body
      });
      console.log('Successfully published');
    } catch (error) {
      console.log(`Error trying to publish project: ${error.message || 'Unexpected error'}`);
    }
  }

  async sync(showSuccess = true) {
    try {
      await branchHelper.isValidBranch();
      const branch = await gitHelper.getBranch();
      const res = await gitHelper.pull(branch);
      if (showSuccess && res) {
        console.log('Successfully synced');
      }
    } catch (error) {
      console.log(`Error trying to sync project: ${error.message || 'Unexpected error'}`);
    }
  }

  async getById(id) {
    const baseUrl = `${getEnv('API_ULTRON_URL')}/projects`;

    const res = await apisService.call(`${baseUrl}/${id}`, {
      method: 'GET'
    });
    const project = get(res, 'data');
    if (!project || !project._id) {
      throw new Error('Project not found.');
    }
    return project;
  }

  async list() {
    try {
      const project = await this.askProject();
      if (!project) {
        return;
      }
      const operation = await promptHelper.list('operation', 'Select a operation', ['Clone', 'Manage Dependencies', 'Delete']);
      if (operation === 'Clone') {
        return this.clone(project.source);
      }
      if (operation === 'Manage Dependencies') {
        return this.manageDependencies(project.source);
      }
      if (operation === 'Delete') {
        return this.delete(project.source);
      }
    } catch (err) {
      console.log(`Error trying to list projects: ${err.message || 'Unexpected error'}`);
    }

  }

  async manageDependencies(project) {
    try {
      const components = get(project, 'dependencies.applications') || [];
      const prebuilts = get(project, 'dependencies.universalApps') || [];
      const functions = get(project, 'dependencies.functions') || [];
      const selectedComponents = await this.getNewProjectComponents([...components, ...prebuilts]);
      const selectedFunctions = await this.getNewProjectFunctions(functions);
      const url = `${getEnv('API_ULTRON_URL')}/projects/${project._id}/dependencies`;
      await apisService.call(url, {
        method: 'PATCH',
        body: {
          dependencies: {
            ...selectedComponents,
            ...selectedFunctions
          }
        }
      });
      console.log('Project dependencies successfully updated');
    } catch (err) {
      console.log(`Error trying to manage project dependencies: ${err.message || 'Unexpected error'}`);
    }
  }

  async delete(project) {
    try {
      const confirm = await promptHelper.confirm('Are you sure?');
      if (!confirm) {
        return;
      }
      const url = `${getEnv('API_ULTRON_URL')}/projects/${project._id}`;
      await apisService.call(url, {
        method: 'DELETE'
      });
      console.log(`Project ${project.name} successfully deleted`);
    } catch (err) {
      console.log(`Error trying to delete project : ${err.message || 'Unexpected error'}`);
    }
  }

  async checkName(name) {
    const projects = await this.getProjects();
    if (!projects) {
      return;
    }
    return projects.find((project) => project.name === name);
  }

  async getProjects() {
    const baseUrl = `${getEnv('API_ULTRON_URL')}/projects`;

    const queryString = {
      limit: 250,
      subscriber: config.get('subscriberId')
    };
    const res = await apisService.call(baseUrl, {
      method: 'GET',
      queryString
    });
    const projects = get(res, 'data');
    if (!projects || !projects.length) {
      // console.log('No projects to list');
      return;
    }
    return projects;
  }

  async discard() {
    try {
      const answer = await promptHelper.confirm();
      if (!answer) {
        return;
      }
      await gitHelper.discard();
      console.log('Project changes were discarded.');
    } catch (error) {
      console.log(`Error trying to discard project changes: ${error.message || 'Unexpected error'}`);
    }
  }

  async update(id, body) {
    const baseUrl = `${getEnv('API_ULTRON_URL')}/projects`;
    const res = await apisService.call(`${baseUrl}/${id}`, {
      method: 'PUT',
      body
    });
    return res.payload;
  }

}

module.exports = new ProjectService();