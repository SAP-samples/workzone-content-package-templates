# Template for a 'SAP Work Zone - Workflow' repository

## Using this template

Click the button "Use this template" above the file list of this repository and create a new git repository based on this template.

### Project Structure
- ````/```` folder contains the general project files for build
- ````/src```` folder contains the files for the workflow metadata (manifest.json) and the mta.yaml to create the workflow.mtar.
- ````/src/i18n```` folder contains the translation of texts properties from the manifest.
- ````/src/workflow```` folder contains the workflow project sources like the workflow projects in BAS.


### Adapt ````package.json````
- Change the name of the package json
	"name": "cpkg-project-template-workflow" -> "name": "your-name"
	"version" ->version needs to be increased if necessary, keep in sync with manifest.json and mta.yaml

### Adapt ````src/manifest.json````
- Manifest sap.artifact->id needs to be in your namespace, example your.name
- Manifest sap.artifact->artifactVersion->version needs to be increased if necessary.

### Adapt ````src/mta.yaml````
- Change ID: simple-approval -> your-name
- Change version: 1.0.0 to match the version in the manifest.json and package.json.
- Change modules/requires/name: workflow_simple-approval -> workflow_your-name
- Change resources/name: workflow_simple-approval -> workflow_your-name

### Translations of texts
Translated texts of a Card should be maintained in ````/src/i18n```` folder. The .properties files should use suffix
````_language_REGION````.
**Example**
````i18n_en_US.properties````

## Editing your Workflow with Business Application Studio (BAS)
As a developer create a new workspace in BAS and activate workflow extensions for it.

In the terminal of BAS, clone your newly created repository using git clone {repositorylink}.

Use the workflow tooling within the ````src/workflow````folder.

Test the workflow by deploying the mtar to your SCP subaccount.

Push your commits after you are finished.


## Usage of this project's Workflow Template for a Content Package
SAP Work Zone will be able to install Content Packages that can contain Workflows.
To create a Content Package you should use following git template provided by SAP Work Zone:

https://github.wdf.sap.corp/sap-work-zone/cpkg-project-template

While creating a Content Package, the build step of the content package will call ````npm run-script build```` of this project and copy the resulting file into the Content Package.
