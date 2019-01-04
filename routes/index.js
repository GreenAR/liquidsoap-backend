let express = require('express');
let router = express.Router();
let fs = require('fs');
let shell = require('shelljs');
let schedule = require('node-schedule');


/* GET home page. */
router.post('/start', function(req, res, next) {
    var telnet_port      = req.body.telnet_port;
    var harbor_port      = req.body.harbor_port;
    var harbor_password  = req.body.harbor_password;
    var icecast_host     = req.body.icecast_host;
    var icecast_port     = req.body.icecast_port;
    var icecast_password = req.body.icecast_password;
    var icecast_mount    = req.body.icecast_mount;
    var harbor_port_record    = req.body.harbor_port_record;
    var record_dir    = req.body.record_dir;

    console.log(req.body);
    fs.createReadStream('./../script/template.liq').pipe(fs.createWriteStream('./../script/'+icecast_mount+'.liq'));
    // noinspection JSAnnotator
    fs.chmod('./../script/'+icecast_mount+'.liq', 0777 ,function (err,data) {
        if (err) {
            return console.log(err);
        }
    });

    fs.readFile('./../script/'+icecast_mount+'.liq', 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }
        var result = data.replace(/harbor_port/g,      harbor_port);
        result = result.replace  (/telnet_port/g,      telnet_port);
        result = result.replace  (/harbor_password/g,  harbor_password);
        result = result.replace  (/icecast_host/g,     icecast_host);
        result = result.replace  (/icecast_port/g,     icecast_port);
        result = result.replace  (/icecast_password/g, icecast_password);
        result = result.replace  (/icecast_mount/g,    icecast_mount);
        result = result.replace  (/harbor_record_port/g,    harbor_port_record);
        result = result.replace  (/record_dir/g,    record_dir);

        fs.writeFile('./../script/'+icecast_mount+'.liq', result, 'utf8', function (err) {
            if (err) return console.log(err);
            else {
                shell.exec('./../shell '+icecast_mount,function(code, stdout, stderr) {
                    res.json({
                        'Exit code':code,
                        'Program stdout':stdout,
                        'Program stderr':stderr
                    });
                })
            }

        });
    });


});
router.post('/change/playlist/at', async function (req, res, next) {
    try {
    let mount        = req.body.mount;
    let record       = req.body.record;
    let time         = req.body.time;
    let playlist     = req.body.playlist;
    let telnet_port  = req.body.telnet_port;
    let date_param   = req.body.date;
    let date = new Date(date_param);

    let j = schedule.scheduleJob(date, function(){
        let cmd1 = telnet_port+' "default(dot)pls.uri '+record+'"';
        let cmd2 = telnet_port+' '+mount+'.skip';
        shell.exec('python ./routes/telnet.py '+cmd1,function(code1, stdout1, stderr1) {
            shell.exec('python ./routes/telnet.py '+cmd2,function(code, stdout, stderr) {
            });
        });
    });
        res.json({
            "status":"success",
            "job_name":j.name
        });
    }catch (e) {
        res.json({
            "status":"error"
        });
    }

    date.setSeconds(date.getSeconds() + time.seconds);
    date.setMinutes(date.getMinutes() + time.minutes);
    date.setHours(date.getHours() + time.hours);

    schedule.scheduleJob(date, function(){
        let cmd1 = telnet_port+' "default(dot)pls.uri '+playlist+'"';
        let cmd2 = telnet_port+' '+mount+'.skip';
        shell.exec('python ./routes/telnet.py '+cmd1,function(code1, stdout1, stderr1) {
            shell.exec('python ./routes/telnet.py '+cmd2,function(code, stdout, stderr) {
            });
        });
    });

});


router.post('/cancel/playlist/at', async function (req, res, next) {
    try {
        let job_name      = req.body.job_name;
        var job = schedule.scheduledJobs[job_name];
        job.cancel();
        res.json({
            "status":"success"
        });
    }catch (e) {
        res.json({
            "status":"error"
        });
    }

});

router.post('/change/playlist', async function (req, res, next) {
    try {
        let mount            = req.body.mount;
        let playlist      = req.body.playlist;
        let telnet_port      = req.body.telnet_port;
        let cmd1 = telnet_port+' "default(dot)pls.uri '+playlist+'"';
        let cmd2 = telnet_port+' '+mount+'.skip';
        shell.exec('python ./routes/telnet.py '+cmd1,function(code1, stdout1, stderr1) {
            shell.exec('python ./routes/telnet.py '+cmd2,function(code, stdout, stderr) {
                res.json({
                    "status":"success"
                });
            });
        });
    }catch (e) {
        res.json({
            "status":"error"
        });
    }

});


module.exports = router;
