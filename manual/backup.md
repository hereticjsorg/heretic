# Backup Script

In order to create full backup of your website, please run the following command:

```
npm run backup
```

By defaults, backup archive is saved to *backup* folder, example: *backup/heretic_YYYYMMDD_HHMMDD.zip*. You may change this behavior by using options:

```
npm run backup -- --dir "myBackupDir" --filename "sample.zip"
```

The directory is relative to Heretic root.

## Archive Structure

Heretic backup file is a regular ZIP archive which contains the following directories:

* *dist*: copy of *dist* directory
* *dump*: database dump created by *mongodump* utility
* *etc*: all configuration files from *etc* directory
* *root*: Webpack and package.json/package-lock.json files from root directory
* *src*: copy of *src* directory
* *site*: copy of *src* directory

## Restore Backup

In order to restore backup archive, please run the following command:

```
npm run restore -- --path "path/to/your/backup.zip"
```

The directory is relative to Heretic root. Your current site will be saved to *save_YYYYMMDD_HHMMSS* directory, including current database dump. If you don't wish to save current website, you may wish to specify *--no-save* option:

```
npm run restore -- --path "path/to/your/backup.zip" --no-save
```

What happens if you restore your backup archive using this utility:

* *src*, *dist*, *site* and *etc* directories of your website are dropped and replaced by the corresponding directories from backup archive
* All collections from your database are dropped and replaced by collections from backup archive
* The following files are dropped and replaced in the root folder of your site: *webpack.config.js*, *webpack.utils.js*, *package.json*, *package-lock.json*