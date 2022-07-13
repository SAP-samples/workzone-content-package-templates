module.exports.build = function (dir) {
  const rimraf = require("rimraf"),
    util = require("../util/util.js"),
    path = require("path"),
    fs = require("fs-extra"),
    handlebars = require("handlebars"),
    propertiesReader = require("properties-reader"),
    businessHubBuild = process.argv.slice(2)[0] === "-b";

  var validTypes = ["card", "workflow", "workspace-template", "workspace", "homepage"];

  function getJSONPathValue(sPath, o) {
    var a = sPath.split("/");
    var oNode = o;
    for (var i = 0; i < a.length; i++) {
      if (!oNode || typeof oNode !== "object") break;
      oNode = oNode[a[i]];
    }
    return oNode ? oNode : "";
  }

  function translateAndVersion(i18n, mapping, packageJSON, manifest) {
    if (i18n) {
      i18n = i18n.replace(".properties", "_en_US.properties");
      if (!fs.existsSync(i18n)) {
        i18n = i18n.replace("_en_US.properties", "_en.properties");
      }
      if (!fs.existsSync(i18n)) {
        i18n = i18n.replace("_en.properties", ".properties");
      }
      if (!fs.existsSync(i18n)) {
        console.log("No translation file found: " + sourceDir + manifest["sap.app"].i18n);
        return false;
      }
      var translations = propertiesReader(i18n),
        template = handlebars.compile(JSON.stringify(manifest)),
        data = translations.getAllProperties(),
        resultJSON = JSON.parse(template(data));
      for (var n in mapping) {
        packageJSON[mapping[n]] = getJSONPathValue(n, resultJSON);
      }
      return true;
    }
    console.log("Warning: manifest entries are not translated. -> " + sourceDir);
    return false;
  }

  //Create Artifact for API Hub
  function createArtifactBusinessHubJSON(sourceDir, targetBusinessHubTargetDir) {
    var mapping = {
      "sap.artifact/id": "Name",
      "sap.artifact/title": "Title",
      "sap.artifact/description": "ShortText",
      "sap.artifact/artifactVersion/version": "Version"
    }
    console.log("----" + sourceDir);
    var packageJSON = {},
      manifest = util.json.fromFile(path.join(sourceDir, "manifest.json")),
      i18n = path.join(sourceDir, manifest["sap.artifact"].i18n);
    if (translateAndVersion(i18n, mapping, packageJSON, manifest)) {
      util.json.toFile(path.join(targetBusinessHubTargetDir, "artifact.json"), packageJSON);
    } else {
      console.log("Info: Skipping Artifact for API Hub");
    }
  }

  //Create Package for API Hub
  function createPackageJSON(sourceDir, targetBusinessHubTargetDir) {
    var mapping = {
      "sap.package/id": "TechnicalName",
      "sap.package/title": "DisplayName",
      "sap.package/subTitle": "ShortText",
      "sap.package/description": "Description",
      "sap.package/packageVersion/version": "Version"
    }
    var packageJSON = {},
      manifest = util.json.fromFile(path.join(sourceDir, "manifest.json")),
      i18n = manifest["sap.package"].i18n;
    if (translateAndVersion(i18n, mapping, packageJSON, manifest)) {
      util.json.toFile(path.join(targetBusinessHubTargetDir, "artifact.json"), packageJSON);
    } else {
      console.log("Info: Skipping Package for API Hub");
    }
  }

  function buildContent(name, config) {
    if (!config.src.build) {
      util.log.fancy("Nothing to build for " + name);
      return;
    }
    util.log.fancy("Building " + name);

    if (config.src.git || config.src.from) {
      var contentsDir = path.join(root, "__contents"),
        baseDir = path.join(contentsDir, name),
        aRun = config.src.build.split(" && "),
        targetDir = path.join(mainArtifactsPath, name),
        targetBusinessHubTargetDir = path.join(businessHubArtifactsPath, name);
      for (var i = 0; i < aRun.length; i++) {
        console.log("Run build in: " + path.join(baseDir, "build", config.src.path));
        util.spawn.sync(aRun[i], path.join(baseDir, "build", config.src.path), aRun[i] + " cannot be executed.\n");
      }

      //copy the result package
      if (config.src.package) {
        var packageSrcPath = path.join(baseDir, "build", config.src.path, config.src.package),
          packageTargetPath = path.join(targetDir, "data.zip"),
          packageBusinessHubTargetTargetPath = path.join(targetBusinessHubTargetDir, "data.zip");
        if (!fs.existsSync(packageSrcPath)) {
          throw new Error("Error: " + packageSrcPath + " not found");
        }
        console.log("Package definition found: " + packageSrcPath);
        console.log("Copy package to target dir: " + packageTargetPath);
        fs.mkdirSync(targetDir);
        fs.copySync(packageSrcPath, packageTargetPath);
        if (businessHubBuild) {
          fs.copySync(packageSrcPath, packageBusinessHubTargetTargetPath);
        }
      }

      var manifestPath = path.join(baseDir, "build", config.src.path, config.src.manifest),
        manifest = util.json.fromFile(manifestPath),
        sourceDir = path.join(baseDir, "build", config.src.path, (config.src.manifest.replace("manifest.json", ""))),
        artifactManifest;

      //creating artifact.json
      if (manifest["sap.app"] && manifest["sap.app"].type === "card") {
        artifactManifest = {
          _version: "1.27.0",
          _generator: "cpkg-project-template"
        };
        console.log("Card found: Deriving sap.artifact section");
        artifactManifest["sap.artifact"] = manifest["sap.app"];
        //i18n is copied always in the i18n folder
        artifactManifest["sap.artifact"].i18n = "i18n/i18n.properties";

        if (artifactManifest["sap.artifact"].applicationVersion) {
          artifactManifest["sap.artifact"].artifactVersion = artifactManifest["sap.artifact"].applicationVersion;
          delete artifactManifest["sap.artifact"].applicationVersion;
        } else {
          console.log("Error: Application version not found for Card " + manifestPath + "/" + manifest["sap.app"].id);
          throw new Error("sap.app/applicationVersion not defined in " + manifestPath + "/" + manifest["sap.app"].id);
        }
      } else {
        artifactManifest = {
          _version: "1.27.0",
          _generator: "cpkg-project-template",
          "sap.artifact": manifest["sap.artifact"]
        }
      }

      console.log("Writing artifact manifest: " + targetDir + "/manifest.json");
      util.json.toFile(path.join(targetDir, "manifest.json"), artifactManifest);

      //copy i18n files
      console.log("Copy i18n folder");
      if (fs.pathExistsSync(path.join(sourceDir, "i18n"))) {
        fs.copySync(path.join(sourceDir, "i18n"), path.join(targetDir, "i18n"));
        //process the i18n
        util.i18n.process(path.join(targetDir, "manifest.json"));
      }

      console.log("Adding contents to /package/manifest.json");
      //adding contents manifest and baseDir
      aContentInfo.push({ manifest: artifactManifest, baseURL: "artifacts/" + name });

      if (businessHubBuild) {
        fs.mkdirSync(targetBusinessHubTargetDir);
        console.log("Generate artifact.json: " + targetDir + "/artifact.json");
        createArtifactBusinessHubJSON(targetDir, targetBusinessHubTargetDir);
      }
    }
  }

  util.log.fancy("Start Build");

  var root = path.join(dir, ".."),
    mainPackagePath = path.join(root, "package"),
    mainArtifactsPath = path.join(root, "package", "artifacts"),
    businessHubPath = path.join(root, "businesshub"),
    businessHubArtifactsPath = path.join(root, "businesshub", "Artifacts");


  console.log("Clear previous results...")
  rimraf.sync(mainPackagePath);
  rimraf.sync(businessHubPath);
  rimraf.sync(path.join(root, "package.zip"));
  rimraf.sync(path.join(root, "businesshub.zip"));
  console.log("Done");

  console.log("Create folders...")
  fs.mkdirSync(mainPackagePath);
  fs.mkdirSync(mainArtifactsPath);
  if (businessHubBuild) {
    fs.mkdirSync(businessHubPath);
    fs.mkdirSync(businessHubArtifactsPath);
  }
  console.log("Done");

  //creating content artifacts and collect info
  var contentConfig = util.json.fromFile(path.join(root, "content.json"));
  if (Object.keys(contentConfig).length === 0) {
    console.log("Error: content.json does not contain any entries.");
    throw new Error("Error: content.json does not contain any entries.");
  }

  var aContentInfo = [];

  for (var n in contentConfig) {
    console.log("Create content " + n + "...");
    var type = contentConfig[n].type;
    if (validTypes.indexOf(type) === -1) {
      throw new Error("Unknown artifact type " + type + ". Should be " + validTypes.join(","));
    }
    buildContent(n, contentConfig[n]);
  }

  //add the contentInfo to main manifest
  var man = util.json.fromFile(path.join(root, "manifest.json")),
    pack = getJSONPathValue("sap.package", man);

  pack.contents = aContentInfo;

  console.log("Saving /package/manifest.json");
  util.json.toFile(path.join(mainPackagePath, "manifest.json"), man);

  //base/i18n/i18n.properties
  if (fs.pathExistsSync(path.join(root, "i18n"))) {
    console.log("Copy i18n folder");
    fs.copySync(path.join(root, "i18n"), path.join(mainPackagePath, "i18n"));
    //process the i18n
    util.i18n.process(path.join(mainPackagePath, "manifest.json"));
  }

  console.log("Creating package.zip ");
  util.zip.folder(path.join(root, "package.zip"), path.join(root, "package"));

  if (businessHubBuild) {
    createPackageJSON(root, businessHubPath);
    util.log.fancy("Creating businesshub.zip");
    util.zip.folder(path.join(root, "businesshub.zip"), path.join(root, "businesshub"));
    rimraf.sync(path.join(root, "businesshub"));
  }
  util.log.fancy("Build finished successful.");

};