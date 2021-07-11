# Database synchronizer for Magento
This tool downloads Magento databases and imports it for development purposes

### Requirements
- NodeJS
- Composer
- PHP
- Magerun
- Magerun2

### Installation
1. `npm i -g` in the root folder of this tool
2. Remove .sample from `config/settings.json.sample` and fill in the config settings within `config/settings.json`
3. Remove .sample from the files in `config/database` and configure`config/databases/production.json` or `config/databases/staging.json`

### Using this tool
Simply run `mage-db-sync start` in any CLI after installing it with `npm i -g` and follow the given options

### Configuring databases
in the files `config/databases/production.json` and `config/databases/staging.json` all the databases are configured. These files must contain the following placeholders:

- `username-1-placeholder` can be replaced with a name by choice, this is used as a key for the tool (Required)
- `username` is the ssh username to log in to the server (Required)
- `password` is the ssh password that goes with the ssh username. (Optional if you use SSH keys to login)
- `server` is the server to log in to (Required)
- `port` the server port (Optional)
- `localProjectFolder` is the local project folder (Optional)
- `externalProjectFolder` is the external project folder (Optional)

### NOTES
- The import function does only show "yes" when you're current directory is a Magento installed directory or if a local project folder is set in the database json file
- Tool requires `magerun / magerun2` command to be globally available in shell
- Everything is developed/tested with Magerun2 version 4.7.0
- Wordpress import is currently experimental

### TODO
- Elasticsearch for amasty / mirasvit compatibility
- Make SSH username + password work
- Tests on Magento 2.3.x
- Import Wordpress if project has it
- Magento 1 compatibility