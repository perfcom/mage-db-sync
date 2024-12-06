import * as fs from "fs";
import { localhostMagentoRootExec, success } from "../utils/console";
import { Listr } from "listr2";

class ImportTask {
  private importTasks = [];

  configure = async (list: any, config: any) => {
    await this.addTasks(list, config);
    return list;
  };

  // Add tasks
  addTasks = async (list: any, config: any) => {
    list.add({
      title: "Import Magento database to localhost",
      task: (ctx: any, task: any): Listr => task.newListr(this.importTasks),
    });

    this.importTasks.push({
      title: "Modify active database",
      task: async (): Promise<void> => {
        let replaceCommand = `ddev php -r "\\$config = include('app/etc/env.php'); \\$config['db']['connection']['default']['dbname'] = '${config.serverVariables.databaseName}'; file_put_contents('app/etc/env.php', '<?php return ' . var_export(\\$config, true) . ';');"`;
        await localhostMagentoRootExec(replaceCommand, config);
      },
    });

    let importTitle = "Importing database";
    if (config.settings.isDdevActive) {
      importTitle = "Importing database (DDEV)";
    }

    this.importTasks.push({
      title: importTitle,
      task: async (): Promise<void> => {
        if (config.settings.isDdevActive) {
          let mysqlCommand1 = `ddev mysql -uroot -proot -hdb -e "CREATE DATABASE IF NOT EXISTS ${config.serverVariables.databaseName};"""`;
          let mysqlCommand2 = `ddev mysql -uroot -proot -hdb -e "GRANT ALL PRIVILEGES ON *.* TO ${config.serverVariables.databaseName}@'localhost';"""`;
          let mysqlCommand3 = `ddev mysql -uroot -proot -hdb -e "GRANT ALL PRIVILEGES ON *.* TO ${config.serverVariables.databaseName}@'%';"""`;
          await localhostMagentoRootExec(mysqlCommand1, config, true);
          await localhostMagentoRootExec(mysqlCommand2, config, true);
          await localhostMagentoRootExec(mysqlCommand3, config, true);
          await localhostMagentoRootExec(
            `ddev import-db --database=${config.serverVariables.databaseName} --src=${config.serverVariables.databaseName}.sql`,
            config,
          );
        } else {
          // Create database
          await localhostMagentoRootExec(
            `${config.settings.magerun2CommandLocal} db:create -q`,
            config,
          );
          // Import SQL file to database
          await localhostMagentoRootExec(
            `${config.settings.magerun2CommandLocal} db:import ${config.serverVariables.databaseName}.sql --force --skip-authorization-entry-creation -q --drop`,
            config,
          );
          // Add default admin authorization rules (Fix for missing auth roles)
          await localhostMagentoRootExec(
            `${config.settings.magerun2CommandLocal} db:add-default-authorization-entries -q`,
            config,
          );
        }
      },
    });

    this.importTasks.push({
      title: "Cleaning up",
      task: async (): Promise<void> => {
        // Remove local SQL file
        await localhostMagentoRootExec(
          "rm " + config.serverVariables.databaseName + ".sql",
          config,
        );
      },
    });
  };
}

export default ImportTask;
