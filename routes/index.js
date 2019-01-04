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
    console.log('/change/playlist/at', new Date().toLocaleString());

    try {

    let mount        = req.body.mount;
    let record       = req.body.record;
    let time         = req.body.time;
    let playlist     = req.body.playlist;
    let telnet_port  = req.body.telnet_port;
    let date_param   = req.body.date;
    let date = new Date(date_param);


    let date2 = new Date(date_param);
    date2.setSeconds(date2.getSeconds() + time.seconds);
    date2.setMinutes(date2.getMinutes() + time.minutes);
    date2.setHours(date2.getHours() + time.hours);

    let cmdrecord = 'python ./routes/telnet.py '+telnet_port+' "default(dot)pls.uri '+record+'"';
    let cmdplaylist = 'python ./routes/telnet.py '+telnet_port+' "default(dot)pls.uri '+playlist+'"';
    let cmdskip = 'python ./routes/telnet.py '+telnet_port+' '+mount+'.skip';

    let j = schedule.scheduleJob(date, function(){

        shell.exec(cmdrecord,{silent:true},function(code1, stdout1, stderr1) {
            setTimeout(function(){
                shell.exec(cmdskip,{silent:true},function(code, stdout, stderr) {
                    console.log('lanced record',date.toLocaleString());
                });
            }, 500);

        });
    });
    let k = schedule.scheduleJob(date2, function(){
            shell.exec(cmdplaylist,{silent:true},function(code1, stdout1, stderr1) {
                setTimeout(function(){
                    shell.exec(cmdskip,{silent:true},function(code, stdout, stderr) {
                        console.log('back to playlist',date2.toLocaleString());
                    });
                }, 500);

            });
        });

    res.json({
            "status":"success",
            "job_record_name":j.name,
            "job_playlist_name":k.name
        });


    }catch (e) {
        res.json({
            "status":"error"
        });
    }



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
        shell.exec('python ./routes/telnet.py '+cmd1,{silent:true},function(code1, stdout1, stderr1) {
            setTimeout(function(){
                shell.exec('python ./routes/telnet.py '+cmd2,{silent:true},function(code, stdout, stderr) {
                    res.json({
                        "status":"success"
                    });
                });
            }, 500);

        });
    }catch (e) {
        res.json({
            "status":"error"
        });
    }

});


module.exports = router;
