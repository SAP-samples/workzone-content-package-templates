# Template for a 'SAP Work Zone - Workspace Template' repository

## Using this template
Click the button "Use this template" above the file list of this repository and create a new git repository based on this template.

### Project Structure
- ````/```` folder contains the general project files for build
- ````/src```` folder contains the files for the workspace metadata (manifest.json) and the exported workspaces zip
- ````/src/i18n```` folder contains the translation of texts properties from the manifest.

### Adapt ````package.json````
- Change the name of the package json
	"name": "cpkg-project-template-workspace" -> "name": "your-name"

### Adapt ````src/manifest.json````
- Manifest sap.artifact->id needs to be in your namespace, example your.name
- Manifest sap.artifact->artifactVersion->version needs to be increased if necessary.

### Translations of texts
Translated texts of a Card should be maintained in ````/src/i18n```` folder. The .properties files should use suffix
````_language_REGION````.
**Example**
````i18n_en_US.properties````

## Create and export a Workspace Template from SAP Work Zone

**Steps to export a Workspace Template**
- Open SAP Work Zone as a Company Administrator
- Create a workspace with all contents that should be part of your Workspace Template.
- Save the workspace as a Workspace Template.
  - Open the workspace menu (top right button with three dots) in the header of your workspace.
  - Select 'Save as Workspace Template' from the menu.
  - Fill out the form in the popup and press 'Create'

**Steps to export a Workspace Template**
- Open SAP Work Zone as a Company Administrator
- Go to Administraton Console - Area & Workspace Configuration - Workspace Templates
- Find the Workspace Template created in the previous step in the list of templates (with your user name)
- Select 'Export' in the 'Action' menu of your template
- Save (Replace) the file in this project under ````src/workspace-template.zip````
- If you like to deliver the workspace template, commit this change to git.

## Import the Workspace template to SAP Work Zone for testing
As a company administrator in SAP Work Zone, you can import a workspace template. During Content Package installation from the customer, the import will be done automatically.

**Steps to import a Workspace Template**
- Open SAP Work Zone as a Company Administrator
- Go to Administraton Console - Area & Workspace Configuration - Workspace Templates
- Press the import button and choose the ````src/workspace-template.zip```` and upload it.

## Usage of this project's Workspace Template for a Content Package
SAP Work Zone will be able to install Content Packages that can contain Workspace Templates.
To create a Content Package you should use following git template provided by SAP Work Zone:

https://github.wdf.sap.corp/sap-work-zone/cpkg-project-template

While creating a Content Package, the build step of the content package will call ````npm run-script build```` of this project and copy the resulting file into the Content Package.
