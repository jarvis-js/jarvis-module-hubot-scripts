require('coffee-script');
var httpClient = require('scoped-http-client');
var fs = require('fs');
var path = require('path');
var events = require('events');
var util = require('util');

util.inherits(HubotBrain, events.EventEmitter);

module.exports = function(bot, module) {
	var scriptPaths = [];
	if (module.options.script_paths) {
		if (Array.isArray(module.options.script_paths)) {
			for (var i = 0; i < module.options.script_paths.length; i++) {
				scriptPaths.push(path.resolve(module.options.script_paths[i]));
			}
		}
		else {
			scriptPaths.push(path.resolve(module.options.script_paths));
		}
	}
	else {
		scriptPaths.push(path.resolve(__dirname + '/scripts/'));
	}
	var hubot = new Hubot(bot, module);
	for (var i = 0; i < scriptPaths.length; i++) {
		(function(scriptPath) {
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
				hubot.brain.loadBrain();
			});
		})(scriptPaths[i]);
	}

	module.unload = function() {
		hubot.brain.close();
	};
};

function Hubot(bot, module) {
	this.bot = bot;
	this.module = module;
	this.brain = new HubotBrain(bot);
}

Hubot.prototype.hear = function(regex, callback) {
	var _this = this;
	this.module.addTrigger(regex, function(request) {
		var msg = new HubotResponse(_this.bot, regex, request);
		callback(msg);
	});
};

Hubot.prototype.respond = function(regex, callback) {
	var re = regex.toString().split('/');
	re.shift(); // remove first empty item
	var modifiers = re.pop(); // pop off modifiers
	var pattern = re.join('/');
	if (pattern[0] !== '^') {
		pattern = '^' + pattern;
	}
	if (pattern[pattern.length - 1] !== '$') {
		pattern += '$';
	}
	regex = new RegExp(pattern, modifiers);

	var _this = this;
	this.module.addCommand(regex, function(request) {
		var msg = new HubotResponse(_this.bot, regex, request);
		callback(msg);
	});
};

Hubot.prototype.enter = function() {
	// Not available
};

Hubot.prototype.leave = function() {
	// Not available
};

Hubot.prototype.send = function(user, str) {
	user.request.reply = str;
	this.bot.respond(user.request);
};

Hubot.prototype.reply = function(user, str) {
	user.request.reply = str;
	this.bot.respond(user.request);
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

function HubotResponse(bot, regex, request) {
	this.bot = bot;
	this.request = request;
	this.message = {
		user: {
			request: request
		},
		message: request.text
	};
	this.match = regex.exec(request.text);
}

HubotResponse.prototype.send = function(str) {
	this.request.reply = str;
	this.bot.reply(this.request);
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

function HubotBrain(bot) {
	this.bot = bot;
	this.data = {};
	this.data.users = {};
	this.saveSeconds = 5;
	this.saveTimeout = null;
}

HubotBrain.prototype.loadBrain = function() {
	var _this = this;
	this.bot.storage.load('hubot-scripts', function(data) {
		if (data !== null) {
			_this.data = data;
		}
		_this.emit('loaded', _this.data);
		_this.resetSaveTimeout();
	});
};

HubotBrain.prototype.saveBrain = function(ending) {
	ending = ending || false;
	var _this = this;
	this.bot.storage.save('hubot-scripts', this.data, function() {
		_this.emit('save', this.data);
		if (!ending) {
			_this.resetSaveTimeout();
		}
	});
};

HubotBrain.prototype.resetSaveTimeout = function() {
	if (this.saveTimeout) {
		clearTimeout(this.saveTimeout);
	}
	var _this = this;
	this.saveTimeout = setTimeout(function() {
		_this.saveBrain();
	}, this.saveSeconds * 1000);
};

HubotBrain.prototype.close = function() {
	if (this.saveInterval) {
		clearInterval(this.saveInterval);
	}
	this.saveBrain();
	this.emit('close');
};
