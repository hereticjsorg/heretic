# Console Client

There is console client available which allows you to automate some routine Heretic tasks such as creating or removing new modules.

To use CLI, please run the following command:

```
npm run cli --
```

## Parameters Available

* *--addModule &lt;id&gt; [--navigation]*: create a new module (optionally add to navbar)
* *--removeModule &lt;id&gt;*: delete existing module
* *--addLanguage &lt;id:name&gt;*: add new language (example: de-de:Deutsch)
* *--removeLanguage &lt;id&gt;*: delete existing language

## Examples

Add a new module with ID *test*, route */test* and include it into the navbar:

```
npm run cli -- --addModule test --navigation
```

Remove a module with ID *test* (also removes the corresponding entries in the navbar):

```
npm run cli -- --removeModule test
```

Add a new language (with ISO code *de-de* and name *Deutsch*):

```
npm run cli -- --addLanguage de-de:Deutsch
```

Remove an existing language *de-de*:

```
npm run cli -- --removeLanguage de-de
```