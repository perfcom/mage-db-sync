import { clearConsole, info, success } from "../utils/console";
import configFile from '../../config/settings.json'
import MainController from "./mainController";
import DatabaseTypeQuestion from "../questions/databaseTypeQuestion";
import SelectDatabaseQuestion from "../questions/selectDatabaseQuestion";
import ConfigurationQuestions from "../questions/configurationQuestions";
import ChecksTask from "../tasks/checksTask";
import DownloadTask from "../tasks/downloadTask";
import ImportTask from "../tasks/importTask";
import MagentoConfigureTask from "../tasks/magentoConfigureTask";
import WordpressConfigureTask from "../tasks/wordpressConfigureTask";

class TestController extends MainController {    
    executeStart = async (): Promise<void> => {
        // Ask all the questions to the user
        await this.askQuestions();
        
        // Configure task list
        await this.prepareTasks();

        // Run all tasks
        try {
            await this.list.run();

            // Show final message when done with all tasks
            if (this.config.finalMessages.importDomain.length > 0) {
                success(`Magento is successfully imported to localhost. ${this.config.finalMessages.importDomain} is now available.`);
                info(`You can log in to the Magento backend with username: ${configFile.magentoBackend.adminUsername} and password: ${configFile.magentoBackend.adminPassword}`);
                info(`For each website there is a dummy customer account available. Email: ${configFile.magentoBackend.adminEmailAddress}, Password: ${configFile.magentoBackend.adminPassword}`);
            } else if (this.config.finalMessages.magentoDatabaseLocation.length > 0) {
                success(`Downloaded Magento database to: ${this.config.finalMessages.magentoDatabaseLocation}`);
                // Show wordpress download message if downloaded
                if (this.config.finalMessages.wordpressDatabaseLocation.length > 0) {
                    success(`Downloaded Wordpress database to: ${this.config.finalMessages.wordpressDatabaseLocation}`);
                }
            }

            // Show wordpress import message if imported
            if (this.config.settings.wordpressImport && this.config.settings.wordpressImport == 'yes') {
                success(`Wordpress is successfully imported to localhost.`);
            }

            process.exit();
        } catch (e) {
            console.error(e)
        }
    }

    // Ask questions to user
    askQuestions = async () => {
        // Clear the console
        clearConsole();

        // Ask question about database type
        let databaseTypeQuestion = await new DatabaseTypeQuestion();
        await databaseTypeQuestion.configure(this.config);

        // Make user choose a database from the list
        let selectDatabaseQuestion = await new SelectDatabaseQuestion();
        await selectDatabaseQuestion.configure(this.config);

        // Adds multiple configuration questions
        let configurationQuestions = await new ConfigurationQuestions();
        await configurationQuestions.configure(this.config);

        // Clear the console
        clearConsole();
    }

    // Configure task list
    prepareTasks = async () => {
        // Build up check list
        let checkTask = await new ChecksTask();
        await checkTask.configure(this.list, this.config);

        // Build up download list
        let downloadTask = await new DownloadTask();
        await downloadTask.configure(this.list, this.config, this.ssh);

        if (this.config.settings.import && this.config.settings.import == "yes") {
            // Build import list
            let importTask = await new ImportTask();
            await importTask.configure(this.list, this.config);

            // Build Magento configure list
            let magentoConfigureTask = await new MagentoConfigureTask();
            await magentoConfigureTask.configure(this.list, this.config);

            if (this.config.settings.wordpressImport && this.config.settings.wordpressImport == "yes") {
                // Build Wordpress configure list
                let wordpressConfigureTask = await new WordpressConfigureTask();
                await wordpressConfigureTask.configure(this.list, this.config);
            }
        }
    }
}

export default TestController