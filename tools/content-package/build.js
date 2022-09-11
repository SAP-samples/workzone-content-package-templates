module.exports.build = function (dir) {
  const rimraf = require("rimraf"),
    util = require("../util/util.js"),
    path = require("path"),
    fs = require("fs-extra"),
    handlebars = require("handlebars"),
    propertiesReader = require("properties-reader"),
    businessHubBuild = process.argv.slice(2)[0] === "-b";

  var validTypes = ["card", "workflow", "workspace-template", "workspace", "homepage", "workpage", "space", "role"];

  function getJSONPathValue(sPath, o) {
    var a = sPath.split("/");
    var oNode = o;
    for (var i = 0; i < a.length; i++) {
      if (!oNode || typeof oNode !== "object") break;
      oNode = oNode[a[i]];
    }
    return oNode ? oNode : "";
  }

  function createCDMBusinessAppForCard(cardManifest, i18nPath) {

    var appId = `${cardManifest["sap.app"].id}.app`;
    var vizId = `${cardManifest["sap.app"].id}.viz`;
    var allKeys = util.i18n.allKeys(cardManifest);
    var result = {
      _version: "3.2.0",
      identification: {
        id: appId,
        title: cardManifest["sap.app"].title,
        entityType: "businessapp",
        // "description" to be deleted, only necessary because of bugs https://jira.tools.sap/browse/DWPBUGS-2514 and
        // https://jira.tools.sap/browse/DWPBUGS-2515
        description: "{{description}}"
      },
      payload: {
        visualizations: {
          [vizId]: {
            vizType: "sap.card",
            vizConfig: cardManifest,
            vizResources: {
              artifactId: appId
            }
          }
        }
      }
    }

    result.texts = createCDMTextsFromI18N(i18nPath, allKeys, {
      locale: "",
      textDictionary: {
        description: "Business App Description"
      }
    });

    return result;
  }

  function createCDMTextsFromI18N(i18nPath, i18nKeys, fallbackObject) {
    try {
      i18nKeys = i18nKeys.filter(key => util.i18n.isKey(key))   // take real i18n refs only and ignore text literals
        .map(key => util.i18n.stripKey(key));  // strip off {{}}
      var files = util.readdir(i18nPath);
      var texts = files.map(file => {
        var entries = {};
        util.readfile(path.join(i18nPath, file))
          .split(/\r?\n/)
          .map(line => line.split("="))
          .filter(entry => i18nKeys.includes(entry[0]))
          .forEach(entry => entries[entry[0]] = entry[1]);
        return {
          locale: file.slice("i18n_".length, file.length - ".properties".length).replace(/_/gi, "-"),
          textDictionary: entries
        }
      });
      if (texts.length === 0) {
        texts.push(
          fallbackObject
        );
      }
      return texts;
    } catch (ex) {
      return [{
        locale: "",
        textDictionary: {
          description: "Business App Description"
        }
      }];
    }
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

  function buildContent(name, config, aCDMEntities) {

    util.log.fancy("Building " + config.type);
    if (config.type === "workpage" || config.type === "role" || config.type === "space") {
      var contentPath = path.join(config.src.from, config.src.content);
      var i18nPath = path.join(config.src.from, "i18n");
      var content = util.json.fromFile(contentPath);
      content.texts = createCDMTextsFromI18N(i18nPath, util.i18n.allKeys(content), {
        locale: "",
        textDictionary: {
          description: "Description"
        }
      });
      aCDMEntities.push(content);
    } else {
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
          manifestRoot = path.dirname(manifestPath),
          manifest = util.json.fromFile(manifestPath),
          sourceDir = path.join(baseDir, "build", config.src.path, (config.src.manifest.replace("manifest.json", ""))),
          i18nDir = path.join(manifestRoot, "i18n"),
          artifactManifest,
          i18nFolder

        //creating artifact.json
        if (manifest["sap.app"] && manifest["sap.app"].type === "card") {

          //create cdm content for card
          aCDMEntities.push(createCDMBusinessAppForCard(manifest, i18nDir));

          artifactManifest = {
            _version: "1.27.0",
            _generator: "cpkg-project-template"
          };
          console.log("Card found: Deriving sap.artifact section");
          artifactManifest["sap.artifact"] = manifest["sap.app"];

          if (typeof manifest["sap.app"].i18n === "string") {
            i18nFolder = path.join(sourceDir, path.dirname(manifest["sap.app"].i18n));
          }
          else {
            i18nFolder = path.join(sourceDir, path.dirname(manifest["sap.app"].i18n.bundleUrl));
          }

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
          artifactManifest["sap.artifact"].i18n = "i18n/i18n.properties";
          i18nFolder = path.join(sourceDir, path.dirname(manifest["sap.artifact"].i18n))
        }

        console.log("Writing artifact manifest: " + targetDir + "/manifest.json");
        util.json.toFile(path.join(targetDir, "manifest.json"), artifactManifest);

        //copy i18n files
        console.log("Copy i18n folder " + i18nFolder);
        if (fs.pathExistsSync(i18nFolder)) {
          fs.copySync(i18nFolder, path.join(targetDir, "i18n"));
          console.log("Copy i18n folder: " + path.join(targetDir, "i18n"));
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

  var aContentInfo = [],
    aCDMEntities = []

  for (var n in contentConfig) {
    console.log("Create content " + n + "...");
    var type = contentConfig[n].type;
    if (validTypes.indexOf(type) === -1) {
      throw new Error("Unknown artifact type " + type + ". Should be " + validTypes.join(","));
    } else {
      buildContent(n, contentConfig[n], aCDMEntities);
    }

  }

  //add the contentInfo to main manifest
  var man = util.json.fromFile(path.join(root, "manifest.json")),
    pack = getJSONPathValue("sap.package", man);


  pack.contents = aContentInfo;

  //add cdm entities
  pack.cdmEntities = [
    ...aCDMEntities
  ];

  console.log("Save /package/manifest.json");
  util.json.toFile(path.join(mainPackagePath, "manifest.json"), man);


  if (fs.pathExistsSync(path.join(root, "i18n"))) {
    console.log("Copy i18n folder");
    fs.copySync(path.join(root, "i18n"), path.join(mainPackagePath, "i18n"));
    //process the i18n
    util.i18n.process(path.join(mainPackagePath, "manifest.json"));
  }

  util.json.toFile(path.join(mainPackagePath, "manifest.json"), man);

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