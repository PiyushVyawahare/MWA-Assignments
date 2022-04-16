const express = require("express");
const fs = require("fs");
const session = require("express-session");
const multer = require("multer");
const db = require("./database");
const userModel = require("./database/models/user.js");
const cartModel = require("./database/models/cart.js");
const sendMail = require("./utils/sendMail");


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
app.use(express.static("public"));

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
	res.redirect("home");
});

app.get("/home", function(req, res){
	if(req.session.isLoggedIn){
        var user = req.session.user;
        res.render("home", { loggedIn: true, username: user.username, profile_pic: user.profile_pic });
	}
	else
        res.render("home", { loggedIn: false, username: "", profile_pic: "" });
})

app.post("/getProducts", function(req, res){
    var page = req.body.page;
    var noproductsToDisplay = page*4;
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
});


app.route("/cart")
.post(function(req, res){

    var user = null;

    if(!req.session.isLoggedIn){
        res.status(401).json({ status: false, message: "Please Login", data: null });
        return;
    }

    user = req.session.user;

    var product_id = req.body.id;

    var flag = 0;
    

    
    fs.readFile("products.js", "utf-8", function(err, data){
        var product = null;
        var products = JSON.parse(data);
        for(var i = 0; i < products.length; i++){
            if(products[i]._id ===  product_id)
                product = products[i];
        }

        cartModel.findOne({ product_id: product_id, user_id: user._id}).then(function(prd){

            if(prd)
                res.status(409).json({ status: false, message: "Item already in cart", data: null });
            else{
                cartModel.create({
                    product_id: product_id,
                    product_image: "random",
                    product_name: product.name,
                    product_price: product.price,
                    product_description: product.description,
                    user_id: user._id
                }).then(function(){
                    res.status(200).json({ status: true, message: "Added to cart", data: null});
                })
            }
        })
    })
});


app.route("/viewCart")
.get(function(req, res){
    var user = null;

    if(!req.session.isLoggedIn){
        res.redirect("/home");
        return;
    }

    user = req.session.user;

    cartModel.find({user_id: user._id}).then(function(products){
        if(products.length){
            res.render("viewCart", { error: "", products: products, loggedIn: true, username: user.username, profile_pic: user.profile_pic });
        }
        else{
            res.render("viewCart", {error: "Cart is Empty", products: [], loggedIn: true, username: user.username, profile_pic: user.profile_pic})
        }
    }).catch(function(err){
        console.log("cant find");
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

    userModel.findOne({email: email}).then(function(user){
        if(user)
            res.render("register", {error: "Email is already registered with us"});
        return;
    })
	userModel.create({
		profile_pic: file.filename,
		email: email,
		username: username,
		password: password,
        isVerified: false
	})
	.then(function(){

        var url = '<h3><a href="http://localhost:3000/verifyUser/'+username+'">Click here </a>to verify your email.</h3>'

        sendMail(
            email, 
            "Welcome to magical ECom, Verify email",
            url,
            function(err){
                if(err){
                    res.render("register", { error: "Unable to send email!!"});
                }
                else{
                    res.render("register", { error: "Email sent successfully, please Verify!!"});
                }
            }
        )
		//res.redirect("login");
	})
	.catch(function(err){
        console.log(err);
		res.render("register", { error: "Something went wrong"});
	})
});


app.route("/login").get(function(req, res){

	res.render("login", {error: ""});

}).post(function(req, res){
	
	var username = req.body.username;
	var password = req.body.password;

	userModel.findOne({username: username, password: password})
	.then(function(user){
		if(user){
            if(user.isVerified){
			    req.session.isLoggedIn = true;
                req.session.user = user;
                res.redirect("/");
            }
            else
                res.render("login", {error: "Please verify email!!"});
			
		}
        else{
            res.render("login", {error: "User not found!!"});
        }
		
	})
	.catch(function(err){
        res.render("login", {error: "User not found!!"});
	})
});


app.post("/logout", function(req, res){
	req.session.destroy();
	res.redirect("/");
})




app.get("/verifyUser/:username", function(req, res){
    const username = req.params.username;

    userModel.findOne({username: username})
    .then(function(user){
        if(user){

            userModel.updateOne({username: username}, { isVerified : true}, function(err, data){
                if(err)
                    console.log(err);
                else
                    res.send("Verification successful, "+"<a href='/login'>login now</a>");
            });
            
        }
    })
});


app.route("/changePassword").get(function(req, res){
    var user = req.session.user;
    res.render("changePassword", { username: user.username, profile_pic: user.profile_pic, error: "" });
}).post(function(req, res){
    var npassword = req.body.npassword;
    var cpassword = req.body.cpassword;
    var user = req.session.user;

    if(npassword !== cpassword){
        res.render("changePassword", { username: user.username, profile_pic: user.profile_pic, error: "New passwords not matching" });
        return;
    }

    userModel.findOne({username: user.username, password: user.password})
    .then(function(user){
        if(user){

            userModel.updateOne({username: user.username, password: user.password}, { password : npassword}, function(err, data){
                if(err)
                    console.log(err);
                else
                    res.send("Password Changed, "+"<a href='/login'>login now</a>"+" with new password");
            });
            
        }
    })
})

app.route("/forgotPassword").get(function(req, res){
    res.render("forgotPassword", {error: ""});
}).post(function(req, res){
    var email = req.body.email;
    userModel.findOne({email: email}).then(function(user){
        if(user){
            var url = '<h3>Do not worry <a href="http:///localhost:3000/forgotPasswordPage/'+user.email+'">Click here </a>to set new password.</h3>'

            sendMail(
                email, 
                "Welcome to magical ECom, Forgot Password?",
                url,
                function(err){
                    if(err){
                        res.render("forgotPassword", { error: "Unable to send email right now!!"});
                    }
                    else{
                        res.render("forgotPassword", { error: "Email sent successfully, please Check!!"});
                    }
                }
            )
        }
        else{
            res.render("forgotPassword", {error: "Email not registered with us"})
        }
    });
});


app.route("/forgotPasswordPage/:email").get(function(req, res){
    var email = req.params.email;
    req.session.email = email;
    res.render("forgotPasswordPage", { error: ""});
})

app.post("/forgotPasswordPage", function(req, res){
    var npassword = req.body.npassword;
    var cpassword = req.body.cpassword;
    var email = req.session.email;
    req.session.destroy();
    if(npassword !== cpassword){
        res.render("forgotPasswordPage", { error: "New passwords not matching" });
        return;
    }

    userModel.findOne({email: email})
    .then(function(user){
        if(user){

            userModel.updateOne({email: email}, { password : npassword}, function(err, data){
                if(err)
                    console.log(err);
                else
                    res.send("Password Changed, "+"<a href='/login'>login now</a>"+" with new password");
            });
            
        }
        else{
            res.render("forgotPasswordPage", { error: "User with this link not found!!" })
        }
    })
});


app.listen(3000, function(){
	console.log("server running at port http://localhost:3000");
})