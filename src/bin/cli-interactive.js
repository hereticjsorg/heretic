const fs = require("fs-extra");
const path = require("path");
const commandLineArgs = require("command-line-args");
const BinUtils = require("#lib/binUtils.js");

const options = commandLineArgs([{
    name: "no-color",
    type: Boolean,
}]);
const binUtils = new BinUtils(options);

(async () => {
    binUtils.setLogProperties({
        enabled: true,
        color: !options["no-color"],
        noDate: true,
    });
    binUtils.setInteractive(true);
    binUtils.printLogo();
    const inquirer = (await import("inquirer")).default;
    binUtils.readConfig();
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const answers = await inquirer
            .prompt([{
                type: "list",
                name: "action",
                message: "What do you want to do?",
                choices: [
                    "Add module",
                    "Remove module",
                    new inquirer.Separator(),
                    "Add language",
                    "Remove language",
                    new inquirer.Separator(),
                    `Create "admin" user`,
                    "Reset password for user",
                    new inquirer.Separator(),
                    "Import Geo data",
                    new inquirer.Separator(),
                    "Quit",
                    new inquirer.Separator(),
                ],
            }]);
        binUtils.log("", {
            noDate: true,
        });
        switch (answers.action) {
        case "Remove module":
            const modulesList = fs.readdirSync(path.resolve(__dirname, "../../site/modules")).filter(p => !p.match(/^\./));
            if (!modulesList.length) {
                binUtils.log("No modules to remove", {
                    error: true,
                    noDate: true,
                });
                break;
            }
            const removeModuleAnswers = await inquirer.prompt([{
                type: "list",
                name: "id",
                message: "Which module to remove?",
                choices: modulesList,
            }]);
            binUtils.log("", {
                noDate: true,
            });
            binUtils.removeModule(removeModuleAnswers.id);
            break;
        case "Add module":
            const addModuleAnswers = await inquirer.prompt([{
                type: "input",
                name: "id",
                message: "Enter module ID:",
                validate(value) {
                    if (value.match(/^[a-zA-Z][a-zA-Z0-9_]+$/i)) {
                        return true;
                    }
                    return "Please enter a valid module ID";
                },
            }]);
            binUtils.log("", {
                noDate: true,
            });
            await binUtils.addModule(addModuleAnswers.id);
            break;
        case "Add language":
            const addLanguageAnswers = await inquirer.prompt([{
                type: "input",
                name: "id",
                message: "Enter language ID (xx-xx):",
                validate(value) {
                    if (value.match(/^[a-z]{2}-[a-z]{2}$/i)) {
                        return true;
                    }
                    return "Please enter a valid language ID";
                },
            }, {
                type: "input",
                name: "name",
                message: "Enter language name:",
            }]);
            binUtils.log("", {
                noDate: true,
            });
            await binUtils.addLanguage(addLanguageAnswers.id, addLanguageAnswers.name);
            break;
        case "Remove language":
            const languagesConfigPath = path.resolve(__dirname, "../../etc/languages.json");
            if (!fs.existsSync(languagesConfigPath)) {
                binUtils.log(`The "etc/languages.json" file is missing`, {
                    error: true,
                    noDate: true,
                });
                break;
            }
            const languages = fs.readJSONSync(languagesConfigPath);
            const removeLanguageAnswers = await inquirer.prompt([{
                type: "list",
                name: "id",
                message: "Which language to remove?",
                choices: Object.keys(languages),
            }]);
            binUtils.log("", {
                noDate: true,
            });
            await binUtils.removeLanguage(removeLanguageAnswers.id);
            break;
        case `Create "admin" user`:
            await binUtils.createAdmin();
            break;
        case "Reset password for user":
            const resetPasswordAnswers = await inquirer.prompt([{
                type: "input",
                name: "username",
                message: "Enter username:",
                validate(value) {
                    if (value.match(/^[a-zA-Z][a-zA-Z0-9_]+$/i)) {
                        return true;
                    }
                    return "Please enter a valid username";
                },
            }]);
            binUtils.log("", {
                noDate: true,
            });
            await binUtils.resetPassword(resetPasswordAnswers.username);
            break;
        case "Import Geo data":
            await binUtils.geoCleanUp();
            await binUtils.geoImportBlocksV4();
            await binUtils.geoImportBlocksV6();
            await binUtils.geoImportCities();
            await binUtils.geoImportCountries();
            await binUtils.geoEnsureIndexes();
            binUtils.log("Geo Data import success", {
                success: true,
            });
            break;
        default:
            binUtils.disconnectDatabase();
            binUtils.log("Have a nice day!\n", {
                success: true,
                noDate: true,
            });
            process.exit(0);
        }
        binUtils.log("", {
            noDate: true,
        });
    }
})();
