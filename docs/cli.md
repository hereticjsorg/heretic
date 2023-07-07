# Console Client

There is console client available which allows you to automate some routine Heretic tasks such as creating or removing new pages.

To use CLI, please run the following command:

```
npm run cli --
```

## Parameters Available

* *--addModule &lt;id&gt; [--navigation]*: create a new page (optionally add to navbar)
* *--removeModule &lt;id&gt;*: delete existing page
* *--addLanguage &lt;id:name&gt;*: add new language (example: de-de:Deutsch)
* *--removeLanguage &lt;id&gt;*: delete existing language
* *--importGeoData*: import geo database (requires MongoDB to be enabled)
* *--createAdmin*: create *admin* user with access to admin panel (requires MongoDB to be enabled)
* *--resetPassword &lt;username&gt;*: create user or reset existing user's password to "password"

## Examples

Add a new page with ID *test*, route */test* and include it into the navbar:

```
npm run cli -- --addModule test --navigation
```

Remove a page with ID *test* (also removes the corresponding entries in the navbar):

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

# Interactive Console Client

You may wish to use an user-friendly interactive version of console client if you don't want to keep all the parameter names in mind:

```
npm run cli-interactive
```