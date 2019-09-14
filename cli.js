#!/usr/bin/env node

// cli args
const [, , ...args] = process.argv
inquirer = require('inquirer'),
  fs = require('fs'),
  path = require('path'),
  chalk = require("chalk"),
  figlet = require("figlet"),
  shell = require("shelljs"),
  replace = require('./replace'),
  editJsonFile = require("edit-json-file");


var configFile = editJsonFile(`${__dirname}/config.json`);
let repos = configFile.get().repositories

if(typeof repos === 'undefined'){
  configFile.set('repositories',[]);
  configFile.save();
  startProject();
  return;
}
const commands = [
  'project:start',
  'project:add',
  'project:list',
  'project:remove',
  'db:export',
  'db:replace',
  'help',
  'install'
];


const run = async () => {

  let command = args[0];

  switch (command) {
    case 'help':
      printHelp();
      break
    case 'project:start':
      startProject();
      break;
    case 'project:add':
      addProjectRepository();
      break;

    case 'project:list':
      listProjects();
      break;
    case 'project:remove':
      removeProject();
      break;
    case 'db:export':
      exportDB();
      break;
    case 'db:replace':
      replaceDB();
      break;
    case 'install':
      initInstall();
      break;
    default:
      logerror('Command not found!');
      printHelp();
  }

};


run();


function printHelp() {
  console.clear();
  message = `
  Application Usage:
  devild <command>

  commands can be:

  project:start :      create a new project
  project:add   :      add new project
  db:export     :      export database from server
  db:replace    :      replace text within a selected file
  help          :      print the usage guide
`;
  shell.echo(chalk.green(message))
}


function logerror(err) {
  console.clear();
  console.log(chalk.red(err));
}


/**
 * Start new project 
 * Will get data from config.json
 */
async function startProject() {
  console.clear();
  projects = configFile.get().repositories;
  if (!projects.length) {
    addProjectRepository();
  }
  projectsTypes = projects.map(val => val.type);
  let questions = [{
    type: 'input',
    name: 'project_name',
    message: 'Your project name'
  }, {
    type: 'list',
    name: 'project',
    message: 'Select Project Type',
    choices: [...projectsTypes]
  }];
  return inquirer.prompt(questions).then(res => {
    let selected = projects.find(element => {
      return element.type === res.project;
    });
    if (selected)
      shell.echo(`Cloning ${selected.name} (${selected.type}) from  ${selected.url}`)
      .exec(`git clone ${selected.url} ${res.project_name}`);
  })
}



async function exportDB(dir = '.') {
  console.clear();
  let questions = [{
      type: 'input',
      name: 'db_name',
      default: 'db_name',
      message: 'Database name to to export',
      validate: (value) => value.length > 0 || 'Please enter database name!'
    },
    {
      type: 'input',
      name: 'db_host',
      default: 'mysql',
      message: 'Database Host name/IP?',
      validate: (value) => value.length > 0 || 'Please enter host name or IP address!'

    },
    {
      type: 'input',
      name: 'db_user',
      default: 'root',
      message: 'Database user ?',
      validate: (value) => value.length > 0 || 'Please enter database user'
    },
    {
      type: 'password',
      name: 'db_pass',
      default: '',
      message: 'Database User Password?'
    },
    {
      type: 'input',
      name: 'export_name',
      default: 'local',
      message: 'File Name to export (without extension .sql)',
      validate: (value) => value.length > 0 || 'Please enter file name to export the database!'
    }
  ]

  return inquirer.prompt(questions)
    .then(res => {
      if (!fs.existsSync(dir))
        shell.exec(`mkdir ${dir}`);
      let command = `mysqldump --host=${res.db_host} --user=${res.db_user}  --password=${res.db_pass}  ${res.db_name} > ${dir}/${res.export_name}.sql`;
      shell.exec(command)
    })
}


/**
 * Will get all .sql files in the current directory,
 * ask you to choose a file, 
 */
async function replaceDB() {
  console.clear();
  let sqlfiles = await getFilesByExtensionInFolder();
  if (!sqlfiles || !sqlfiles.length > 0) {
    shell.echo(chalk.red(`No SQL files found in ${process.cwd()}!`))
    shell.echo(`Please export by running ${chalk.green('devild db:export')}`);
    process.exit(1);
  }

  let questions = [{
      type: "list",
      name: "file_from",
      message: "Select the file you want to perform search-replace?",
      choices: sqlfiles,
    },
    {
      type: "input",
      name: "URL_from",
      default: "example.loc",
      message: "Type the URL you want to search for",
      validate: (value) => value.length > 0 || 'Please enter string to search!'
    },
    {
      type: "input",
      name: "URL_to",
      default: "example.com",
      message: "Type the URL you want to replace with",
      validate: (value) => value.length > 0 || 'Please enter string you want to replace!'

    },
    {
      type: "input",
      name: "file_to",
      default: "exported",
      message: "Type the new file name to save (without .sql extension)",
      validate: (value) => value.length > 0 || 'Please enter file name to export the file !'
    },

  ];
  return inquirer.prompt(questions)
    .then(answers => {
      let content = fs.readFileSync(answers.file_from, 'utf-8')
      console.log(chalk.yellow(`Replacing ${answers.URL_from} with ${answers.URL_to}`))
      let newContent = replace(content, answers.URL_from, answers.URL_to, );
      if (newContent !== '') {
        newContent = `-- Exported on ${new Date()} \n ${newContent}`;
        fs.writeFileSync(`${answers.file_to}.sql`, `${newContent}`);
        console.log(chalk.green('Complete!'))
      }

    });
};


/**
 * 
 * @param {string} folder to search for
 * @param {string} extension  file extension
 */
async function getFilesByExtensionInFolder(folder = '.', extension = '.sql') {
  let files = fs.readdirSync(folder);
  return files.filter(file => {
    return path.extname(file).toLowerCase() === extension;
  });
}



/**
 * Display a fancy text
 * @param {string} text 
 */
async function fancyText(text = "Devild") {
  console.clear();
  return shell.echo(chalk.green(
    figlet.textSync(text)
  ))
}

/**
 * Add new project repository to config file
 */
async function addProjectRepository() {
  console.clear();
  fancyText('New Project');
  let questions = [{
      type: 'input',
      name: 'name',
      message: 'Project Name (lowercase no spaces)',
      validate: (value) => value.length > 0 || 'Please enter project name!'
    },
    {
      type: 'list',
      name: 'type',
      message: 'Select project Type',
      choices: ['Wordpress', 'Laravel']
    },
    {
      type: 'input',
      name: 'url',
      message: 'Add repository URL',
      validate: (value) => value.length > 0 || 'Please enter repository URL!'
    }
  ];
  return inquirer.prompt(questions).then(res => {
    repos = configFile.get();
    repos.repositories.push(res);
    configFile.set('repositories', repos)
    configFile.save();
  })
}


async function listProjects(){
  console.clear();
  projects = configFile.get().repositories;
  if(typeof projects!==undefined && projects.length){
    console.table(projects);
  }
  else 
  console.log('No Projects saved!');
  
  console.log(chalk.yellow(`Create new project by running ${chalk.red('devild project:start {name}')}`))
}


async function removeProject(){
  projects = configFile.get().repositories;

  projectsTypes = projects.map(val => val.type);
  projectsNames = projects.map(val => val.name);

  let questions = [{
    type: 'list',
    name: 'project',
    message: 'Select Project To Remove',
    choices: [...projectsNames]
  }];
  return inquirer.prompt(questions).then(res => {
    let selected = projects.find((element,index,ar) => {
      return element.name === res.project
    });
    let selectedIndex = projects.indexOf(selected);
    if (selectedIndex !== -1 ){
      shell.echo(`Deleting ${selectedIndex} ${selected.name} (${selected.type})`);
      let xi = projects.splice(selectedIndex,1);
      configFile.set('repositories',projects);
      configFile.save();
    }
  })


}

/**
 * Will create if doesnot exist an example configuration file
 */
async function initInstall() {
  console.clear();
  let confContents = `{
    "repositories": [{
        "name": "wp",
        "type": "Wordpress",
        "url": "https://github.com/wordpress/wordpress.git"
    }]
}`;

  fs.writeFile(`${__dirname}/config.json`, confContents, (err) => {
    if (err) throw err;
  });

}