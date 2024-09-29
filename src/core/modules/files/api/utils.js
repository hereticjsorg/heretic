/* eslint-disable no-void */
import path from "path";
import fs from "fs-extra";
import moduleConfig from "../module.js";
import { isBinaryFile } from "#core/lib/3rdparty/isBinaryFile.ts";

const extensionsText = [
    "Makefile",
    "Rakefile",
    "ada",
    "adb",
    "ads",
    "applescript",
    "as",
    "ascx",
    "asm",
    "asmx",
    "asp",
    "aspx",
    "atom",
    "bas",
    "bash",
    "bashrc",
    "bat",
    "bbcolors",
    "bdsgroup",
    "bdsproj",
    "bib",
    "bowerrc",
    "c",
    "cbl",
    "cc",
    "cfc",
    "cfg",
    "cfm",
    "cfml",
    "cgi",
    "clj",
    "cls",
    "cmake",
    "cmd",
    "cnf",
    "cob",
    "coffee",
    "coffeekup",
    "conf",
    "cpp",
    "cpt",
    "cpy",
    "crt",
    "cs",
    "csh",
    "cson",
    "csr",
    "css",
    "csslintrc",
    "csv",
    "ctl",
    "curlrc",
    "cxx",
    "dart",
    "dfm",
    "diff",
    "dof",
    "dpk",
    "dproj",
    "dtd",
    "eco",
    "editorconfig",
    "ejs",
    "el",
    "emacs",
    "eml",
    "ent",
    "erb",
    "erl",
    "eslintignore",
    "eslintrc",
    "ex",
    "exs",
    "f",
    "f03",
    "f77",
    "f90",
    "f95",
    "fish",
    "for",
    "fpp",
    "frm",
    "ftn",
    "gemrc",
    "gitattributes",
    "gitconfig",
    "gitignore",
    "gitkeep",
    "gitmodules",
    "go",
    "gpp",
    "gradle",
    "groovy",
    "groupproj",
    "grunit",
    "gtmpl",
    "gvimrc",
    "h",
    "haml",
    "hbs",
    "hgignore",
    "hh",
    "hpp",
    "hrl",
    "hs",
    "hta",
    "htaccess",
    "htc",
    "htm",
    "html",
    "htpasswd",
    "hxx",
    "iced",
    "inc",
    "ini",
    "ino",
    "int",
    "irbrc",
    "itcl",
    "itermcolors",
    "itk",
    "jade",
    "java",
    "jhtm",
    "jhtml",
    "js",
    "jscsrc",
    "jshintignore",
    "jshintrc",
    "json",
    "json5",
    "jsonld",
    "jsp",
    "jspx",
    "jsx",
    "ksh",
    "less",
    "lhs",
    "lisp",
    "log",
    "ls",
    "lsp",
    "lua",
    "m",
    "mak",
    "map",
    "markdown",
    "master",
    "md",
    "mdown",
    "mdwn",
    "mdx",
    "metadata",
    "mht",
    "mhtml",
    "mjs",
    "mk",
    "mkd",
    "mkdn",
    "mkdown",
    "marko",
    "ml",
    "mli",
    "mm",
    "mxml",
    "nfm",
    "nfo",
    "njk",
    "noon",
    "npmignore",
    "npmrc",
    "nvmrc",
    "ops",
    "pas",
    "pasm",
    "patch",
    "pbxproj",
    "pch",
    "pem",
    "pg",
    "php",
    "php3",
    "php4",
    "php5",
    "phpt",
    "phtml",
    "pir",
    "pl",
    "pm",
    "pmc",
    "pod",
    "pot",
    "properties",
    "props",
    "pt",
    "pug",
    "py",
    "r",
    "rake",
    "rb",
    "rdoc",
    "rdoc_options",
    "resx",
    "rhtml",
    "rjs",
    "rlib",
    "rmd",
    "ron",
    "rs",
    "rss",
    "rst",
    "rtf",
    "rvmrc",
    "rxml",
    "s",
    "sass",
    "scala",
    "scm",
    "scss",
    "seestyle",
    "sh",
    "shtml",
    "sls",
    "spec",
    "sql",
    "sqlite",
    "ss",
    "sss",
    "st",
    "strings",
    "sty",
    "styl",
    "stylus",
    "sub",
    "sublime-build",
    "sublime-commands",
    "sublime-completions",
    "sublime-keymap",
    "sublime-macro",
    "sublime-menu",
    "sublime-project",
    "sublime-settings",
    "sublime-workspace",
    "sv",
    "svc",
    "svg",
    "t",
    "tcl",
    "tcsh",
    "terminal",
    "tex",
    "text",
    "textile",
    "tg",
    "tmLanguage",
    "tmTheme",
    "tmpl",
    "tpl",
    "ts",
    "tsv",
    "tsx",
    "tt",
    "tt2",
    "ttml",
    "txt",
    "v",
    "vb",
    "vbs",
    "vh",
    "vhd",
    "vhdl",
    "vim",
    "viminfo",
    "vimrc",
    "vue",
    "webapp",
    "wxml",
    "wxss",
    "x-php",
    "xht",
    "xhtml",
    "xml",
    "xs",
    "xsd",
    "xsl",
    "xslt",
    "yaml",
    "yml",
    "zsh",
    "zshrc",
];

// const filenamesText = [
//     "LICENSE",
//     "CHANGELOG",
//     "Dockerfile",
// ];

export default class {
    constructor(fastify) {
        this.fastify = fastify;
    }

    formatBytes(bytes, decimals = 2) {
        const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
        if (bytes === 0) {
            return {
                size: 0,
                unit: sizes[0],
            };
        }
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return {
            size: parseFloat((bytes / k ** i).toFixed(dm)),
            unit: sizes[i],
        };
    }

    isText(filename) {
        if (filename) {
            const ext = path.extname(filename).replace(/^\./, "");
            if (!ext) {
                return null;
            }
            return extensionsText.indexOf(ext) !== -1;
        }
        return null;
    }

    async isBinary(filename) {
        const text = this.isText(filename);
        if (text == null) {
            try {
                const bin = await isBinaryFile(filename);
                return bin;
            } catch {
                return true;
            }
        }
        return !text;
    }

    async fileExists(filePath) {
        try {
            await fs.access(filePath, fs.F_OK);
            return true;
        } catch {
            return false;
        }
    }

    getPath(d) {
        const parDir = d.replace(/\.\./gm, "").replace(/~/gm, "");
        const root = path
            .resolve(`${__dirname}/../${moduleConfig.root}`)
            .replace(/\\/gm, "/");
        const dir = parDir
            ? path
                  .resolve(`${__dirname}/../${moduleConfig.root}/${parDir}`)
                  .replace(/\\/gm, "/")
            : root;
        if (
            this.fastify &&
            this.fastify.systemConfig.demo &&
            dir.match(/\/conf\.d/)
        ) {
            return false;
        }
        return dir.indexOf(root) !== 0 ? false : dir;
    }
}
