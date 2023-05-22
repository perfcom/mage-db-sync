import { localhostMagentoRootExec } from '../utils/console';
import { Listr } from 'listr2';
import configFile from '../../config/settings.json'
import fs from "fs";

class MagentoConfigureTask {
    private configureTasks = [];

    configure = async (list: any, config: any) => {
        await this.addTasks(list, config);
        return list;
    }

    // Add tasks
    addTasks = async (list: any, config: any) => {
        list.add(
            {
                title: 'Configuring Magento for development usage',
                task: (ctx: any, task: any): Listr =>
                task.newListr(
                    this.configureTasks
                )
            }
        )

        this.configureTasks.push(
            {
                title: "Replacing URL's and doing some preperation for development",
                task: async (): Promise<void> => {
                    var dbQuery = '';
                    // Delete queries
                    var dbQueryRemove = "DELETE FROM core_config_data WHERE path LIKE 'web/cookie/cookie_domain';",
                        dbQueryRemove = dbQueryRemove + "DELETE FROM core_config_data WHERE path LIKE 'dev/static/sign';",
                        dbQueryRemove = dbQueryRemove + "DELETE FROM core_config_data WHERE path LIKE '%smtp%';",
                        dbQueryRemove = dbQueryRemove + "DELETE FROM core_config_data WHERE path LIKE 'admin/url/use_custom';",
                        dbQueryRemove = dbQueryRemove + "DELETE FROM core_config_data WHERE path LIKE 'admin/url/use_custom_path';",
                        dbQueryRemove = dbQueryRemove + "DELETE FROM core_config_data WHERE path LIKE 'web/unsecure/base_static_url';",
                        dbQueryRemove = dbQueryRemove + "DELETE FROM core_config_data WHERE path LIKE 'web/unsecure/base_media_url';",
                        dbQueryRemove = dbQueryRemove + "DELETE FROM core_config_data WHERE path LIKE 'web/unsecure/base_link_url';",
                        dbQueryRemove = dbQueryRemove + "DELETE FROM core_config_data WHERE path LIKE 'web/unsecure/base_url';",
                        dbQueryRemove = dbQueryRemove + "DELETE FROM core_config_data WHERE path LIKE 'web/secure/base_static_url';"
                        dbQueryRemove = dbQueryRemove + "DELETE FROM core_config_data WHERE path LIKE 'web/secure/base_media_url';",
                        dbQueryRemove = dbQueryRemove + "DELETE FROM core_config_data WHERE path LIKE 'web/secure/base_link_url';",
                        dbQueryRemove = dbQueryRemove + "DELETE FROM core_config_data WHERE path LIKE 'web/secure/base_url';",
                        dbQueryRemove = dbQueryRemove + "DELETE FROM core_config_data WHERE path LIKE '%ceyenne%';";

                    // Update queries
                    var dbQueryUpdate = "UPDATE core_config_data SET value = '0' WHERE path = 'web/secure/use_in_frontend';",
                        dbQueryUpdate = dbQueryUpdate + "UPDATE core_config_data SET value = '0' WHERE path = 'web/secure/use_in_adminhtml';"

                    let baseUrl = 'http://' + config.settings.magentoLocalhostDomainName + '/';

                    if (config.settings.isDdevActive) {
                        dbQueryUpdate = "UPDATE core_config_data SET value = '1' WHERE path = 'web/secure/use_in_frontend';",
                        dbQueryUpdate = dbQueryUpdate + "UPDATE core_config_data SET value = '1' WHERE path = 'web/secure/use_in_adminhtml';"

                        baseUrl = 'https://' + config.settings.magentoLocalhostDomainName + '/';
                    }

                    // Insert queries
                    var dbQueryInsert = "INSERT INTO core_config_data (scope, scope_id, path, value) VALUES ('default', '0', 'web/unsecure/base_static_url', '{{unsecure_base_url}}static/');",
                        dbQueryInsert = dbQueryInsert + "INSERT INTO core_config_data (scope, scope_id, path, value) VALUES ('default', '0', 'web/unsecure/base_media_url', '{{unsecure_base_url}}media/');",
                        dbQueryInsert = dbQueryInsert + "INSERT INTO core_config_data (scope, scope_id, path, value) VALUES ('default', '0', 'web/unsecure/base_link_url', '{{unsecure_base_url}}');",
                        dbQueryInsert = dbQueryInsert + "INSERT INTO core_config_data (scope, scope_id, path, value) VALUES ('default', '0', 'web/secure/base_static_url', '{{secure_base_url}}static/');",
                        dbQueryInsert = dbQueryInsert + "INSERT INTO core_config_data (scope, scope_id, path, value) VALUES ('default', '0', 'web/secure/base_media_url', '{{secure_base_url}}media/');",
                        dbQueryInsert = dbQueryInsert + "INSERT INTO core_config_data (scope, scope_id, path, value) VALUES ('default', '0', 'web/secure/base_link_url', '{{secure_base_url}}');",
                        dbQueryInsert = dbQueryInsert + "INSERT INTO core_config_data (scope, scope_id, path, value) VALUES ('default', '0', 'web/unsecure/base_url', '" + baseUrl + "');",
                        dbQueryInsert = dbQueryInsert + "INSERT INTO core_config_data (scope, scope_id, path, value) VALUES ('default', '0', 'web/secure/base_url', '" + baseUrl + "');",
                        dbQueryInsert = dbQueryInsert + "INSERT INTO core_config_data (scope, scope_id, path, value) VALUES ('default', '0', 'msp_devtools/general/enabled', '1');",
                        dbQueryInsert = dbQueryInsert + "INSERT INTO core_config_data (scope, scope_id, path, value) VALUES ('default', '0', 'dev/static/sign', '0');";

                    // Build up query
                    dbQuery = dbQuery + dbQueryRemove + dbQueryUpdate + dbQueryInsert;

                    // Set import domain for final message on completing all tasks
                    config.finalMessages.importDomain = baseUrl;

                    await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} db:query "${dbQuery}"`, config);
                }
            }
        );

        this.configureTasks.push(
            {
                title: "Configuring ElasticSearch 7",
                task: async (): Promise<void> => {
                    // make sure amasty elastic is not working anymore
                    await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} config:store:delete amasty_elastic* --all`, config);
                    await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} config:store:set amasty_elastic/connection/engine elasticsearch7`, config);

                    await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} config:store:set catalog/search/engine elasticsearch7`, config);
                    if (config.settings.isDdevActive) {
                        await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} config:store:set catalog/search/elasticsearch7_server_hostname elasticsearch`, config);
                    } else {
                        await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} config:store:set catalog/search/elasticsearch7_server_hostname localhost`, config);
                    }
                    await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} config:store:set catalog/search/elasticsearch7_server_port 9200`, config);
                    await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} config:store:set catalog/search/elasticsearch7_index_prefix ${config.settings.currentFolderName}`, config);
                    await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} config:store:set catalog/search/elasticsearch7_enable_auth 0`, config);
                    await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} config:store:set catalog/search/elasticsearch7_server_timeout 15`, config);
                }
            }
        );

        this.configureTasks.push(
            {
                title: 'Creating an admin user',
                task: async (): Promise<void> => {
                    // Remove all current admin users
                    var dbQuery = `DELETE FROM admin_user; ALTER TABLE admin_user AUTO_INCREMENT = 1;`;
                    await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} db:query "${dbQuery}"`, config);

                    // Fix admin auth
                    await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} db:add-default-authorization-entries`, config);

                    // Create a new admin user
                    await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} admin:user:create --admin-user=${configFile.magentoBackend.adminUsername} --admin-password=${configFile.magentoBackend.adminPassword} --admin-email=${configFile.magentoBackend.adminEmailAddress} --admin-firstname=Firstname --admin-lastname=Lastname`, config);
                }
            }
        );

        this.configureTasks.push(
            {
                title: 'Disable reCAPTCHA',
                task: async (): Promise<void> => {
                    await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} config:store:set msp_securitysuite_recaptcha/frontend/enabled 0`, config);
                    await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} config:store:set msp_securitysuite_recaptcha/backend/enabled 0`, config);
                    await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} config:store:set admin/captcha/enable 0`, config);
                    await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} config:store:set customer/captcha/enable 0`, config);
                    await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} config:store:set recaptcha/general/enabled 0`, config);
                    await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} config:store:set msp_securitysuite_recaptcha/frontend/enabled 0`, config);
                    await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} config:store:set msp_securitysuite_recaptcha/frontend/enabled 0`, config);
                }
            }
        );

        this.configureTasks.push(
            {
                title: 'Configuring cache',
                task: async (): Promise<void> => {
                    await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} config:store:set system/full_page_cache/caching_application 2`, config);
                }
            }
        );

        this.configureTasks.push(
            {
                title: 'Creating a dummy customer on every website',
                task: async (): Promise<void> => {
                    // Create new dummy customers for all websites
                    // Get all websites
                    let allWebsites = await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} sys:website:list --format=json`, config);
                    allWebsites = JSON.parse(<string>allWebsites);

                    // @ts-ignore
                    for (const [key, value] of Object.entries(allWebsites)) {
                        // @ts-ignore
                        let code = value.code;
                        await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} customer:create ${configFile.magentoBackend.adminEmailAddress} ${configFile.magentoBackend.adminPassword} Firstname Lastname ${code}`, config, true);
                    }
                }
            }
        );

        this.configureTasks.push(
            {
                title: "Configuring Wordpress settings within Magento",
                task: async (): Promise<void> => {
                    // If wordpress is imported, we do nothing
                    if (config.settings.wordpressImport && config.settings.wordpressImport == 'yes') {
                        return;
                    } else {
                        await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} config:store:delete wordpress/* --all`, config);
                        await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} config:store:set wordpress/setup/mode NULL`, config);
                        await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} config:store:set wordpress/multisite/enabled 0`, config);
                    }
                }
            }
        );

        this.configureTasks.push(
            {
                title: 'Synchronizing module versions on localhost',
                task: async (): Promise<void> => {
                    // Downgrade module data in database
                    await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} sys:setup:downgrade-versions; ${config.settings.magerun2CommandLocal} setup:upgrade`, config);
                }
            }
        );

        if (config.settings.runCommands && config.settings.runCommands == 'yes') {
            this.configureTasks.push(
                {
                    title: 'Running project commands',
                    task: async (): Promise<void> => {

                        // Magerun2 commands
                        if (config.settings.magerun2Command && config.settings.magerun2Command.length > 0) {
                            await localhostMagentoRootExec(config.settings.magerun2Command, config, false, true);
                        }

                        // Database queries
                        if (config.settings.databaseCommand && config.settings.databaseCommand.length > 0) {
                            let dbQuery = config.settings.databaseCommand.replace(/'/g, '"');
                            await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} db:query '` + dbQuery + `'`, config, false, true);
                        }
                    }
                }
            );
        }

        if (fs.existsSync(config.settings.currentFolder + '/.mage-db-sync-config.json')) {
            // Use custom config file for the project
            this.configureTasks.push(
                {
                    title: 'Setting core_config_data configurations through .mage-db-sync-config.json',
                    task: async (): Promise<void> => {
                        let jsonData = require(config.settings.currentFolder + '/.mage-db-sync-config.json');
                        let coreConfigData = jsonData.core_config_data;

                        if (coreConfigData) {
                            Object.keys(coreConfigData).forEach(key => {
                                let storeId = key,
                                    values = jsonData.core_config_data[key];

                                values = Object.entries(values);

                                // @ts-ignore
                                values.map(async ([path, value] = entry) => {
                                    var scope = 'default';
                                    // @ts-ignore
                                    if (storeId != 0) {
                                        scope = 'stores';
                                    }

                                    await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} config:store:delete ${path} --scope-id=${storeId}`, config);
                                    await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} config:store:set ${path} ${value} --scope-id=${storeId} --scope=${scope}`, config);
                                });
                            })
                        }
                    }
                }
            );
        }

        this.configureTasks.push(
            {
                title: 'Removing generated code',
                task: async (): Promise<void> => {
                    // Remove generated code
                    await localhostMagentoRootExec("rm -rf generated/code", config);
                }
            }
        );

        this.configureTasks.push(
            {
                title: 'Reindexing & flushing Magento caches',
                task: async (): Promise<void> => {
                    // Flush the magento caches and import config data
                    // Reindex data, only when elastic is used
                    if (config.settings.elasticSearchUsed) {
                        if (config.settings.isDdevActive) {
                            await localhostMagentoRootExec(`ddev exec curl -X DELETE 'http://elasticsearch:9200/_all'`, config);
                        }

                        await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} cache:enable; ${config.settings.magerun2CommandLocal} cache:flush; ${config.settings.magerun2CommandLocal} app:config:import`, config);
                        await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} index:reset; ${config.settings.magerun2CommandLocal} index:reindex catalogsearch_fulltext catalog_category_product catalog_product_category catalog_product_price cataloginventory_stock`, config);
                    }

                    await localhostMagentoRootExec(`${config.settings.magerun2CommandLocal} cache:enable; ${config.settings.magerun2CommandLocal} cache:flush; ${config.settings.magerun2CommandLocal} app:config:import`, config);
                }
            }
        );
    }
}

export default MagentoConfigureTask
