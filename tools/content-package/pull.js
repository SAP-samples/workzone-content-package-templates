module.exports.pull = function (dir) {//load content.json
	const rimraf = require("rimraf"),
		path = require("path"),
		util = require("../util/util.js"),
		fs = require("fs-extra"),
		contentConfig = util.json.fromFile(path.join(dir, "..", "content.json"));

	util.log.fancy("Starting Pull");

	var contentsDir = path.join(dir, "..", "__contents");
	try {
		console.log("Clean __contents dir");
		rimraf.sync(contentsDir);

		fs.mkdirSync(contentsDir);

		//loop entries and pull from git
		for (var n in contentConfig) {
			pullContent(n, contentConfig[n])
		}
		util.log.fancy("Pull finished successful");
	} catch (ex) {
		util.log.fancy("Error:" + ex.message);
	}

	function pullContent(name, config) {
		if (config.src) {
			util.log.fancy("Pull content for " + n + ": " + config.src.git + " on branch/label " + config.src.branch);
			var baseDir = path.join(contentsDir, name);
			console.log(baseDir);
			console.log("Create folder for " + name);
			fs.mkdirSync(baseDir);
			if (config.src.git) {
				var projectDir = config.src.git.substring(config.src.git.lastIndexOf("/") + 1, config.src.git.length - 4);
				if (!config.src.branch) {
					console.log("Warning: 'config.src.branch' not set. Using 'master', consider to specify for delivery.");
					config.src.branch = "master";
				}
				console.log("Cloning..." + config.src.git + " on branch:" + config.src.branch);
				util.spawn.sync("git clone -b " + config.src.branch + " --depth 1 " + config.src.git, baseDir, "Cannot sync from git " + config.src.git);
				console.log("Copy content folder " + config.src.path + " to " + baseDir + "/build");
				fs.copySync(path.join(baseDir, projectDir, config.src.path), path.join(baseDir, "build"));
				console.log("Completed pull for " + name);
			} else if (config.src.from) {
				console.log("Copy... " + config.src.from);
				var dirname = config.src.from.split("/").pop();
				var projectDir = path.join(baseDir, dirname);
				console.log("Target:" + projectDir);
				fs.mkdirSync(projectDir);
				var fromDir;
				if (config.src.from.startsWith("/")) {
					fromDir = config.src.from.split("/");
					fromDir = ["/"].concat(fromDir);
					fromDir = path.join.apply(path, fromDir);
				} else {
					fromDir = config.src.from.split("/");
					fromDir = [dir, ".."].concat(fromDir);
					fromDir = path.join.apply(path, fromDir);
				}
				console.log("From:" + fromDir);
				fs.copySync(fromDir, projectDir);
				fs.copySync(path.join(fromDir, config.src.path), path.join(baseDir, "build"));
				console.log("Created build path " + path.join(baseDir, "build"));
				console.log("Completed copy for " + name);
			}
		} else {
			util.log.fancy("Error: No src config for " + n);
		}
	}
};