require('coffee-script');
var httpClient = require('scoped-http-client');
var fs = require('fs');
var path = require('path');
var events = require('events');
var util = require('util');

module.exports = function(jarvis, module) {

	var scriptPaths = [];
	if (module.config.script_paths) {
		scriptPaths = module.config.script_paths;
	}
	else {
		scriptPaths.push(path.resolve(__dirname + '/scripts/'));
	}
	var hubot = new Hubot(jarvis, module);

	var loadScripts = function(scriptPath) {
		fs.readdir(scriptPath, function(err, files) {
			if (err) {
				return;
			}
			for (var j = 0; j < files.length; j++) {
				var extension = path.extname(files[j]);
				var fullPath = path.join(scriptPath, path.basename(files[j], extension));
				if (extension === '.js' || extension === '.coffee') {
					require(fullPath)(hubot);
				}
			}
		});
	};

	for (var k = 0; k < scriptPaths.length; k++) {
		loadScripts(scriptPaths[k]);
	}
};

function Hubot(jarvis, module) {
	this.jarvis = jarvis;
	this.module = module;
}

Hubot.prototype.hear = function(regexp, callback) {
	var _this = this;

	this.module.addAction(this.module.createTrigger({
		match: regexp,
		func: function(message) {
			var msg = new HubotResponse(_this.jarvis, regexp, message);
			callback(msg);
		}
	}));
};

Hubot.prototype.respond = function(regexp, callback) {
	var _this = this;

	this.module.addAction(this.module.createCommand({
		match: regexp,
		func: function(message) {
			var msg = new HubotResponse(_this.jarvis, regexp, message);
			callback(msg);
		}
	}));
};

Hubot.prototype.enter = function() {
	// Not available
};

Hubot.prototype.leave = function() {
	// Not available
};

Hubot.prototype.send = function(user, str) {
	this.jarvis.respond(str);
};

Hubot.prototype.reply = function(user, str) {
	this.jarvis.respond(str);
};

Hubot.prototype.helpCommands = function() {
	return [];
};

Hubot.prototype.users = function() {
	return {};
};

Hubot.prototype.userForId = function() {
	return null;
};

Hubot.prototype.userForName = function() {
	return null;
};

Hubot.prototype.usersForRawFuzzyName = function() {
	return null;
};

Hubot.prototype.usersForFuzzyName = function() {
	return null;
};

function HubotResponse(jarvis, regex, message) {
	this.jarvis = jarvis;
	this.match = regex.exec(message.body);
	this.message = message;
}

HubotResponse.prototype.send = function(str) {
	this.jarvis.reply(this.message, str);
};

HubotResponse.prototype.topic = function() {
	// Not available.
};

HubotResponse.prototype.reply = function(str) {
	this.send(str);
};

HubotResponse.prototype.random = function(items) {
	return items[Math.floor(Math.random() * items.length)];
};

HubotResponse.prototype.http = function(url) {
	return httpClient.create(url);
};
