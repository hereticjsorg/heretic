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