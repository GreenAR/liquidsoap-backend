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
    var host_name    = req.body.host_name;
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

                fs.createReadStream('./recored_template.js').pipe(fs.createWriteStream('./'+host_name+'.js'));
                // noinspection JSAnnotator
                fs.chmod('./'+host_name+'.js', 0777 ,function (err,data) {
                    if (err) {
                        return console.log(err);
                    }
                });

                fs.readFile('./'+host_name+'.js', 'utf8', function (err,data) {
                    if (err) {
                        return console.log(err);
                    }
                    var result = data.replace(/harbor_record_port/g,      harbor_port_record);
                    result = result.replace  (/host_name/g,    host_name);

                    fs.writeFile('./'+host_name+'.js', result, 'utf8', function (err) {
                        if (err) return console.log(err);
                        else {
                            shell.exec('./../shell '+icecast_mount +" "+host_name,function(code, stdout, stderr) {
                                res.json({
                                    'Exit code':code,
                                    'Program stdout':stdout,
                                    'Program stderr':stderr
                                });
                            })
                        }

                    });
                });

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
        let job_name1      = req.body.job_name1;
        let job_name2      = req.body.job_name2;
        let job1 = schedule.scheduledJobs[job_name1];
        job1.cancel();
        let job2 = schedule.scheduledJobs[job_name2];
        job2.cancel();
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
        let cmd2 = 'python ./routes/telnet.py '+telnet_port+' '+mount+'.skip';
        shell.exec('python ./routes/telnet.py '+cmd1,{silent:true},function(code1, stdout1, stderr1) {
            setTimeout(function(){
                shell.exec(cmd2,{silent:true},function(code, stdout, stderr) {
                    res.json({
                        "code1":code1,
                        "stdout1":stdout1,
                        "stderr1":stderr1,
                        "code":code,
                        "stdout":stdout,
                        "stderr":stderr,
                        "cmd2":cmd2,
                    });
                });
            }, 1500);

        });
    }catch (e) {
        res.json({
            "status":"error"
        });
    }

});


router.post('/remove/user', async function (req, res, next) {
    try {

        let username            = req.body.username;
        let domaine_name      = req.body.domaine_name;
        let cmd =  'systemctl stop '+username+'-liquidsoap && su liquser -c "cd ~/liquidsoap-daemon && mode=remove ./daemonize-liquidsoap.sh '+username+
            '" && rm -rf /home/liquser/liquidsoap-daemon/script/'+username+'.liq /home/liquser/liquidsoap-daemon/script/'+
            username+'-run.liq /home/liquser/liquidsoap-daemon/'+username+'-liquidsoap.systemd /home/liquser/liquidsoap-daemon/log/'
            +username+'-run.log /home/liquser/liquidsoap-daemon/liquidsoap-backend/src/'+domaine_name +
            ' /home/liquser/liquidsoap-daemon/liquidsoap-backend/src/record/'+domaine_name
            +' forever stop '+domaine_name+'.js  /home/liquser/liquidsoap-daemon/liquidsoap-backend/'+domaine_name+'.js';
        shell.exec(cmd,{silent:true},function(code, stdout, stderr) {
            console.log(' forever stop '+domaine_name+'.js');
            shell.exec('forever stop '+domaine_name+'.js',{silent:false},function(code, stdout, stderr) {
                console.log(stdout,stderr);
            });
        });

        res.json({
            "status":"success"
        });


    }catch (e) {
        res.json({
            "status":"error"
        });
    }

});


router.post('/disable/user', async function (req, res, next) {
    try {

        let username            = req.body.username;
        let cmd =  'systemctl stop '+username+'-liquidsoap';
        shell.exec(cmd,{silent:true},function(code, stdout, stderr) {
            console.log(stdout,stderr);
        });

        res.json({
            "status":"success"
        });


    }catch (e) {
        res.json({
            "status":"error"
        });
    }

});
router.post('/enable/user', async function (req, res, next) {
    try {

        let username            = req.body.username;
        let cmd =  'systemctl start '+username+'-liquidsoap';
        shell.exec(cmd,{silent:true},function(code, stdout, stderr) {
            console.log(stdout,stderr);
        });

        res.json({
            "status":"success"
        });


    }catch (e) {
        res.json({
            "status":"error"
        });
    }

});



router.post('/reload/server', async function (req, res, next) {
    try {

        let username            = req.body.username;
        let cmd =  'systemctl restart '+username+'-liquidsoap';
        shell.exec(cmd,{silent:true},function(code, stdout, stderr) {
            console.log(stdout,stderr);
        });

        res.json({
            "status":"success"
        });


    }catch (e) {
        res.json({
            "status":"error"
        });
    }

});


module.exports = router;
