const fs = require("fs-extra"),
  path = require("path");

console.log("Execute journey card sequence to include sources");

function getDirectory(path) {
  return fs.readdirSync(path).filter(function (file) {
    return fs.statSync(path + '/' + file).isDirectory() && file !== "build";
  });
}

var workflowRoot = path.join(__dirname, "..", "..");
var cardSrcRoot = path.join(__dirname, "..", "src", "workflow");

if (fs.existsSync(workflowRoot)) {
  //find the root dir to check for workflow sources
  workflowRoot = path.join(workflowRoot, getDirectory(workflowRoot)[0], "workflow");
  if (fs.existsSync(workflowRoot)) {
    console.log("Copy workflow src to card sources to be bundled into card zip");
    fs.copySync(workflowRoot, cardSrcRoot);
  } else {
    console.log("No workflow folder found");
  }
}