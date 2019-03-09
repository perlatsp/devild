## 😈Devild
Database export and search replace for sql files

## How to use
At the moment you will need to
- clone this project
- `cd` in the project and run the following
- `sudo npm link` to link a global variable `devild`
- **NOTE!** If you are using devilbox / docker containers you will need to do the above inside the container.
  
### Available commands
- `devild db:export`        - Will ask credentials to export database
- `devild db:replace`       - Will ask questions to replace url in the exported `sql` file
- `devild install`          - Will create sample config file to create projects repositories (name,type,url)- 
- `devild project:start`    - Will ask questions to create a new project based upon set configurations
- `devild project:add`      - Will ask questions to add a new project to your configuration file

--- 
### TODO
- [x] Search Replace in project
- [x] Create Project (WP or Laravel ) cloning set repos
- [x] Database Export
- [x] Database Replace
- [ ] Database Import
- [ ] SOMETHING ELSE