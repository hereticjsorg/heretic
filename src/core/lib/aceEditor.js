/* eslint-disable import/no-webpack-loader-syntax */

import ace from /* webpackChunkName: "heretic-ace" */ "ace-builds/src-noconflict/ace";

ace.config.setModuleUrl("ace/theme/chrome", require("file-loader?name=npm.ace-builds.theme-chrome.[contenthash:8].js&esModule=false!ace-builds/src-noconflict/theme-chrome.js"));
ace.config.setModuleUrl("ace/theme/ambiance", require("file-loader?name=npm.ace-builds.theme-ambiance.[contenthash:8].js&esModule=false!ace-builds/src-noconflict/theme-ambiance.js"));
ace.config.setModuleUrl("ace/mode/html_worker", require("file-loader?name=npm.ace-builds.worker-html.[contenthash:8].js&esModule=false!ace-builds/src-noconflict/worker-html.js"));
ace.config.setModuleUrl("ace/mode/html", require("file-loader?name=npm.ace-builds.mode-html.[contenthash:8].js&esModule=false!ace-builds/src-noconflict/mode-html.js"));
ace.config.setModuleUrl("ace/mode/css_worker", require("file-loader?name=npm.ace-builds.worker-css.[contenthash:8].js&esModule=false!ace-builds/src-noconflict/worker-css.js"));
ace.config.setModuleUrl("ace/mode/css", require("file-loader?name=npm.ace-builds.mode-css.[contenthash:8].js&esModule=false!ace-builds/src-noconflict/mode-css.js"));
ace.config.setModuleUrl("ace/mode/javascript_worker", require("file-loader?name=npm.ace-builds.worker-javascript.[contenthash:8].js&esModule=false!ace-builds/src-noconflict/worker-javascript.js"));
ace.config.setModuleUrl("ace/mode/javascript", require("file-loader?name=npm.ace-builds.mode-javascript.[contenthash:8].js&esModule=false!ace-builds/src-noconflict/mode-javascript.js"));
ace.config.setModuleUrl("ace/mode/text", require("file-loader?name=npm.ace-builds.mode-text.[contenthash:8].js&esModule=false!ace-builds/src-noconflict/mode-text.js"));
ace.config.setModuleUrl("ace/mode/json_worker", require("file-loader?name=npm.ace-builds.worker-json.[contenthash:8].js&esModule=false!ace-builds/src-noconflict/worker-json.js"));
ace.config.setModuleUrl("ace/mode/json", require("file-loader?name=npm.ace-builds.mode-json.[contenthash:8].js&esModule=false!ace-builds/src-noconflict/mode-json.js"));
ace.config.setModuleUrl("ace/mode/markdown", require("file-loader?name=npm.ace-builds.mode-markdown.[contenthash:8].js&esModule=false!ace-builds/src-noconflict/mode-markdown.js"));

export default ace;
