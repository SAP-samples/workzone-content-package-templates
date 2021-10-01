module.exports.build = function (dir) {
  const path = require("path"),
    util = require("../util/util.js"),
    rimraf = require("rimraf"),
    fs = require("fs-extra"),
    packagejson = util.json.fromFile(path.join(dir, "..", "package.json")),
    name = packagejson.name,
    root = path.join(dir, ".."),
    dist = path.join(root, "dist"),
    out = path.join(root, name + ".zip");

  util.log.fancy("Building Card Package..." + dir + "/src");
  console.log(" - Clean files and folders");

  rimraf.sync(dist);

  fs.removeSync(out);

  console.log(" - Create dist folder and content");

  util.spawn.sync("ui5 build", root, "UI5 build failed");

  util.i18n.process(path.join(dist, "manifest.json"));

  console.log(" - Zip content to " + name + ".zip");

  util.zip.folder(out, root, "dist");

  util.log.fancy("Building Card Package finished successful");
}