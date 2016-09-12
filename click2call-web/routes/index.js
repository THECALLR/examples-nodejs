var express = require('express');
var router = express.Router();
var callr = require('callr');
var fs = require('fs');

const CLICK2CALL_APPID_FILENAME = './click2call.appid';

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/submit', function (req, res, next) {
  var api, login, pass, target;

  // test for api credentials as environment variables, if not found, take what is passed in post, else return error
  if (!req.body.customer_phone) {
    return res.send({ error: "no number given!" });
  }

  if (!process.env.CALLR_LOGIN || !process.env.CALLR_PASS || !process.env.CALLR_TARGET) {
    if (!req.body.callr_login || !req.body.callr_password || !req.body.callr_target) {
      let result = { error: "unable to find credentials and target" };
      return res.send(result);
    } else {
      login = req.body.callr_login;
      pass = req.body.callr_password;
      target = req.body.callr_target;
    }
  } else {
    login = process.env.CALLR_LOGIN;
    pass = process.env.CALLR_PASS;
    target = process.env.CALLR_TARGET;
  }

  try {
    api = new callr.api(login, pass);
    // test for application id environment variable, if not found, check for app id file, else create app.
    if (!process.env.APP_ID) {
      fs.readFile(CLICK2CALL_APPID_FILENAME, 'utf8', function (err, data) {
        if (err) {
          createAppIdFile(res, api, (appId) => {
            startClick2Call(res, api, appId, target, req.body.customer_phone);
          });
        } else {
          let appId = data.trim();
          console.log(`Reusing previously created appid: ${appId}`);
          startClick2Call(res, api, appId, target, req.body.customer_phone);
        }
      });
    } else {
      startClick2Call(res, api, process.env.APP_ID, target, req.body.customer_phone);
    }
  } catch (e) {
    res.send({error:e});
  }
});

/**
 * Start click to call application
 */
function startClick2Call(res, api, appId, target, customer) {
  let targetA = { number: target, timeout: 30 };
  let targetB = { number: customer, timeout: 30 };

  api.send('clicktocall/calls.start_2', [appId, [targetA], [targetB], null])
    .success((result) => {
      res.send({ ok: `Call started with id: ${result}` });
      console.log(`Click2Call application started, call id: ${result}`);
    })
    .error((error)=>{
      res.send({error:error});
    });
}

/**
 * Create app id file, callback called with appid as argument 
 */
function createAppIdFile(res, api, callback) {
  api.send('apps.create', ['CLICKTOCALL10', 'click2call_web', null])
    .success((app) => {
      fs.writeFile(CLICK2CALL_APPID_FILENAME, app.hash, (err) => {
        if (err) {
          throw Exception('Unable to write to appid file.');
        } else {
          callback(app.hash);
        }
      });
    })
    .error((error)=>{
      res.send({error:error});
    });
}

module.exports = router;
