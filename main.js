const express = require("express");
const fs = require("fs");
const session = require("express-session");
const multer = require("multer");
const db = require("./database");
const userModel = require("./database/models/user.js");

var app = express();

app.use(express.json());
app.use(session({
  secret: 'keyboard cat',
  saveUninitialized: true
}))

app.set('view engine', 'ejs');

db.init();

app.use(express.urlencoded());
app.use(express.static("uploads"));
app.use(express.static("views"));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix)
  }
});

const upload = multer({storage: storage});

app.get("/", function(req, res){
	if(req.session.isLoggedIn){
		res.redirect("home");
	}
	else
		res.redirect("login");
});

app.get("/home", function(req, res){
	if(req.session.isLoggedIn){
        var user = req.session.user;
        res.render("home", { username: user.username, profile_pic: user.profile_pic });
	}
	else
	res.redirect("login")
})

app.post("/getProducts", function(req, res){
    var page = req.body.page;
    var noproductsToDisplay = page*5;
    fs.readFile("products.js", "utf-8", function(err, data){
        var products = JSON.parse(data);
        if(noproductsToDisplay>products.length)
            noproductsToDisplay = products.length;
        
        var productsToSend = [];
        for(var i = 0; i < noproductsToDisplay; i++){
            productsToSend.push(products[i]);
        }
        res.end(JSON.stringify(productsToSend));
    })
})

app.route("/register").get(function(req, res){

		res.render("register", { error: "" });
		
}).post(upload.single("profile_pic"), function(req, res){

	var file = req.file;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var cpassword = req.body.cpassword;

	if(!file){
		res.render("register", { error: "Add profile picture"});
		return;
	}
	if(!email){
		res.render("register", { error: "Enter email"});
		return;
	}
	if(!username){
		res.render("register", { error: "Enter username"});
		return;
	}
	if(!password){
		res.render("register", { error: "Enter password"});
		return;
	}

	if(password !== cpassword){
		res.render("register", {error: "Passwords are not matching"});
		return;
	}

	userModel.create({
		profile_pic: file.filename,
		email: email,
		username: username,
		password: password
	})
	.then(function(){
		res.redirect("login");
	})
	.catch(function(err){
		res.render("register", { error: "Something went wrong"});
	})
});


app.route("/login").get(function(req, res){

	res.render("login");

}).post(function(req, res){
	
	var username = req.body.username;
	var password = req.body.password;

	userModel.findOne({username: username, password: password})
	.then(function(user){
		if(user){
			req.session.isLoggedIn = true;
			req.session.user = user;
		}
		res.redirect("/");
	})
	.catch(function(err){
		console.log(err);
		res.end("error occured");
	})
});


app.post("/logout", function(req, res){
	req.session.destroy();
	res.redirect("/");
})


app.listen(3000, function(){
	console.log("server running at port http://localhost:3000");
})