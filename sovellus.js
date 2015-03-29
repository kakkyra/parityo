var express = require("express");
var app = express();
var router = require("./reititin");//router-file tietojen käsittelyyn jotka saadaan lomakkeelta
var con = require("./sql");//sql-yhteys ja kyselyt taulusta
var path = require("path");


app.use(express.bodyParser());
app.use(express.urlencoded());
app.use(express.json());

app.get('/', function(request, response){


//lomake johon syötetään osoite joka halutaan lyhentää
//LOMAKE ON TÄSSÄ

var html = '<div style="background: url(http://hdwallpaperia.com/wp-content/uploads/2014/01/Floral-Vintage-Wallpaper-High-Resolution.jpg); position:absolute; top:0;bottom:0;left:0;right:0;"><h1 align="center">Antin ja Eijan urlshorttaaja</h1><div style="background-color:#E6CC80;border: 7px ridge #5C3D00;height:120px;width:450px;margin:20% auto;">'
     + '<form action="/add" method="get" style="margin:20px 50px;background-color:transparent;">' +
   'Anna osoite' + "  " +
               '<input type="text" name="url" style="width:250px; background-color:#F2E6C0;" placeholder="Kirjoita muodossa http://www.osoite.xx"/>' +
               '<br>' + '<br>' +
               '<button type="submit" style="margin-left: 80px;color:black; background-color:#966C19;border: 4px ridge #5C3D00;">Muunna osoite</button>' +
            '</form>' +
               '</div><div style="position:absolute;bottom:0;width: 100%;padding-top: 40px;clear: both;text-align:center">Antti A. ja Eija K. 3/2015</div></div>';
              
  response.send(html);
});

app.listen(2700);
console.log("Started listening at port 2700");
router.route(app);


var mysql = require("mysql");
var req = require("request");
var cons = require("./sql");
var crypto = require('crypto');
var pool = mysql.createPool({
		host:cons.host,
		user:cons.user,
		password:cons.password,
		database:cons.database
	});

//luodaan tiiviste-objekti(hash)
function generateHash(onSuccess, onError, retryCount, url, request, response, con) {
	var hash = "";

		var reg = /[^A-Za-z0-9-_]/;

		if(reg.test(hash) || hash == "add"){
			onError(response, request, con, 403);
			return;
		

	}
	else{
		//luodaan lyhyturlin merkkijono
		var hashsum = crypto.createHash('sha1');
		hashsum.update((new Date).getTime()+"");
		hash = hashsum.digest('hex').substring(0, 8);
	}

//tarkistetaan onko lyhyturl jo olemassa ja suoritetaan luonti jos ei ole
    con.query(cons.get_query.replace("{osio}", con.escape(hash)), function(err, rows){
		if(err){
			console.log(err);
		}
//tiivisteen luominen ja tarvittaessa uudelleenyritys
        if (rows != undefined && rows.length == 0) {
            onSuccess(hash, url, request, response, con);
        } else {
		
            if (retryCount > 1) {
                generateHash(onSuccess, onError, retryCount - 1, url, request, response, con);
            } else {
                onError(response, request, con, 401);
            }
        }
    });
}

//The function that is executed when there's an error
//response.send sends a message back to the client
function hashError(response, request, con, code){
	response.send(urlResult(null, false, code));
}

//The function that is executed when the short URL has been created successfully.
function handleHash(hash, url, request, response, con){
	con.query(cons.add_query.replace("{URL}", con.escape(url)).replace("{osio}", con.escape(hash)).replace("{IP}", con.escape(getIP(request))), function(err, rows){
		if(err){
			console.log(err);
		}
	});
	response.send(urlResult(hash));

};
//palauttaa tuloksen selaimeen
//LUODAAN TULOSSIVU
function urlResult(hash){
return hash != null ? '<div style="background: url(http://hdwallpaperia.com/wp-content/uploads/2014/01/Floral-Vintage-Wallpaper-High-Resolution.jpg); position:absolute; top:0;bottom:0;left:0;right:0;"><h1 align="center">Antin ja Eijan urlshorttaaja</h1><div style="background-color:#E6CC80;border: 7px ridge #5C3D00;height:120px;width:450px;margin:20% auto;"><div style="padding: 33px 65px;">'+'<a href="http://'+cons.root_url+':2700/'+hash+'"target="_blank">'+cons.root_url+':2700/'+hash+'</a>'+'<br/><br/><a href="http://localhost:2700">Takaisin alkuun</a></div></div><div style="position:absolute;bottom:0;width: 100%;padding-top: 40px;clear: both;text-align:center">Antti A. ja Eija K. 3/2015</div></div>' : null;
}

//lyhyt osoitteen käsittely ja uudelleenohjaus
var getUrl = function(osio, request, response){
	pool.getConnection(function(err, con){
		con.query(cons.get_query.replace("{osio}", con.escape(osio)), function(err, rows){
			var result = rows;
			if(!err && rows.length > 0){

				response.redirect(result[0].url);
			}
			else{
				response.send("ERROR");
			}

		});
		con.release();
	});
};

//Annettu osoite lisätään tietokantaan
var addUrl = function(url, request, response){
	pool.getConnection(function(err, con){
		if(url){
			url = decodeURIComponent(url).toLowerCase();
			con.query(cons.check_ip_query.replace("{IP}", con.escape(getIP(request))), function(err, rows){

				if(rows[0].counted != undefined){
					con.query(cons.check_url_query.replace("{URL}", con.escape(url)), function(err, rows){

						if(url.indexOf("http://localhost") > -1 || url.indexOf("https://localhost") > -1){
							response.send(urlResult(null, false, 401));
							return;
						}

						if(!err && rows.length > 0){

						//HAETAAN JO OLEMASSAOLEVA LYHYTURL TIETOKANNASTA
							  var htt = urlResult(rows[0].osio, true, 100);
							response.send(htt);
						}
						else{
							req(url, function(err, res, body){
								
									generateHash(handleHash, hashError, 50, url, request, response, con);
						
							});
						}
					});
				}

			});
		}
		else{

var virhe = '<div style="background: url(http://hdwallpaperia.com/wp-content/uploads/2014/01/Floral-Vintage-Wallpaper-High-Resolution.jpg); position:absolute; top:0;bottom:0;left:0;right:0;"><h1 align="center">Antin ja Eijan urlshorttaaja</h1><div style="background-color:#E6CC80;border: 7px ridge #5C3D00;height:120px;width:450px;margin:20% auto;"><div style="padding: 33px 65px;">Anna nyt edes joku osoite :D<br/><br/><a href="http://localhost:2700">Takaisin alkuun</a></div></div><div style="position:absolute;bottom:0;width: 100%;padding-top: 40px;clear: both;text-align:center">Antti A. ja Eija K. 3/2015</div></div>'
			response.send(virhe);
		}
		con.release();
	});
};

//palautetaan alkuperäisen lähteen IP-osoite
function getIP(request){
	return request.header("x-forwarded-for") || request.connection.remoteAddress;
}

exports.getUrl = getUrl;
exports.addUrl = addUrl;
