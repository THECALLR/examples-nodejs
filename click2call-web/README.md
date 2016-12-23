# Nodejs Click2Call web demo

## Table of contents
* [Requirements](#requirements)
* [Installing](#installing)
* [Running](#running)
* [Further help](#further-help)

---

## Requirements
* nodejs >= 0.7.0 [available here](https://nodejs.org/)
* npm - node package manager ( installed by default with nodejs )
* CALLR npm package [available here](https://www.npmjs.com/package/callr)

---

## Installing

To setup the web demo, change into the directory and run `npm install`, which will download all the application dependencies. 
```
$ npm install
click2call-web@0.0.0 /examples-nodejs/click2call-web
+-- body-parser@1.15.2
| +-- bytes@2.4.0
...
| +-- content-type@1.0.2
+-- callr@1.0.0
...
+-- cookie-parser@1.4.3
| `-- on-headers@1.0.1
`-- serve-favicon@2.3.0
$
```
---

## Running

To run the web demo, change into the directory and run `npm start`, which will launch the web application listening on port 3000.   
You can then browse to http://localhost:3000 to see the running Click2Call web demo.
```
$ npm start

> click2call-web@0.0.0 start /examples-nodejs/click2call-web
> node ./bin/www

```
---

## Further help
* You will find API documentation and snippets here at [http://www.callr.com/docs/](http://www.callr.com/docs/)
* Or in our github repository [https://github.com/THECALLR/](https://github.com/THECALLR/)
* nodejs sdk github here ([https://github.com/THECALLR/sdk-nodejs](https://github.com/THECALLR/sdk-nodejs))
* nodejs examples here ([https://github.com/THECALLR/examples-nodejs](https://github.com/THECALLR/examples-nodejs))
 
---