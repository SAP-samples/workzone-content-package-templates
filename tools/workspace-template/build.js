module.exports.build = function (dir) {
  var path = require("path"),
    util = require("../util/util.js"),
    rimraf = require("rimraf"),
    fs = require("fs-extra"),
    packagejson = util.json.fromFile(path.join(dir, "..", "package.json")),
    name = packagejson.name,
    root = path.join(dir, ".."),
    dist = path.join(root, "dist"),
    src = path.join(root, "src"),
    out = path.join(root, name + ".zip");


  util.log.fancy("Building Workspace Template Package");
  console.log(" - Clean files and folders");

  rimraf.sync(dist);
  fs.removeSync(out);

  console.log(" - Create dist folder and content");
  fs.copySync(src, dist);
  util.i18n.process(path.join(dist, "manifest.json"));

  console.log(" - Zip content to " + name + ".zip");
  util.zip.folder(out, dist);

  util.log.fancy("Building Workspace Template Package finished successful");
}