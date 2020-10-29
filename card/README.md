# Template for 'UI Integration Card' repository

## Using this template
Click the button "Use this template" above the file list of this repository and create a new git repository based on this template.

### Project Structure
- ````/```` folder contains the general project files for build
- ````/src```` folder contains the card source and test files
- ````/src/i18n```` folder contains the card translation texts properties.
- ````/src/test-resources```` folders with manual or quinit tests of the card. This folder will not be bundled during build and not delivered to consumers of the card.

### Adapt ````package.json````
- Change the name of the package json
	"name": "cpkg-project-template-card" -> "name": "your-name"

### Adapt ````ui5.yaml````
- Change the name of the package json
	name: cpkg-project-template-card -> name: your-name
- Change the copyright statement to fit your LOBs/company needs
  ````
  copyright: |-
   SAP Work Zone 
    * (c) Copyright 2009-2020 SAP SE or an SAP affiliate company.
  ````

### Adapt ````src/manifest.json````
- Manifest sap.app->id needs to be in your namespace, example your.name
- Manifest sap.app->applicationVersion->version needs to be increased if necessary

## Prepare for testing and building a Card

Install the dependencies
`````
npm i
`````

## Create a (minified) Card Bundle for delivery
`````
npm run-script build
`````
During the build step a dist folder is created in the project containing the resources that are packaged into a zip file.

Result is a ````yourname.zip```` file in the root folder

### Upload the Card bundle to SAP Work Zone
As a company administrator in SAP Work Zone, you can upload the Card's ````yourname.zip```` file and test it in a Workspace.

## Run these steps for local testing
Start a local server for testing. Server uses the ````/src```` folder as root.

`````
npm start
`````

Launch the index.html file hosting your card.

````http://localhost:{port}/test-resources/manual/index.html````

### Change UI5 version if needed
````
/src/test-resources/manual/index.html
````
Within the index.html file, change the UI5 version if needed. This depends on the features you consume from the UI Integration Cards implementation. Currently the version is 1.79.2
````
  <script
     id="sap-ui-bootstrap"
	 src="https://sapui5.hana.ondemand.com/1.79.2/resources/sap-ui-integration.js" ... >
````

## Creation of a Card
Follow the documentation of UI Integration Cards
in the [Card Explorer](https://sapui5.hana.ondemand.com/test-resources/sap/ui/integration/demokit/cardExplorer/webapp/index.html#/explore/list)

You can also use SAP Business Application Studio that has additional [developer tools for UI Integration Card](https://help.sap.com/viewer/7d3b9c7211ca4d7a9630b524205ee836/Cloud/en-US/160f56a5d45a4392a78daf0cec35aad9.html) development.

### Translations of texts
Translated texts of a Card should be maintained in ````/src/i18n```` folder. The .properties files should use suffix
````_language_REGION````.
**Example**
````i18n_en_US.properties````



## Usage of this project's Card for a Content Package
SAP Work Zone will be able to install Content Packages that can contain UI Integration Cards.
To create a Content Package you should use following git template provided by SAP Work Zone:

https://github.wdf.sap.corp/sap-work-zone/cpkg-project-template

While creating a Content Package, the build step of the content package will call ````npm run-script build```` of this project and copy the resulting file into the content package.
