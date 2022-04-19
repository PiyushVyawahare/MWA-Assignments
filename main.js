const express = require("express");
const fs = require("fs");
const session = require("express-session");
const multer = require("multer");
const db = require("./database");
const userModelInstance = require("./database/models/user.js");
const cartModel = require("./database/models/cart.js");
const sendMail = require("./utils/sendMail");
const productModel = require("./database/models/product.js");


const userModel = userModelInstance.model;
const userTypeEnums = userModelInstance.userRoleEnums;

var app = express();

app.use(express.json());
app.use(session({
  secret: 'keyboard cat',
  saveUninitialized: true
}))

app.set('view engine', 'ejs');

db.init();

app.use(express.urlencoded());
app.use(express.static("products"));
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


const storage2 = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'products')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix)
    }
  });


const upload = multer({storage: storage});
const prd = multer({storage: storage2});

app.get("/", function(req, res){
	res.redirect("home");
});

app.route("/home").get(function(req, res){
    
    productModel.find(function(err, products){
        if(req.session.isLoggedIn){
            var user = req.session.user;
            res.render("home", { products: products, loggedIn: true, username: user.username, profile_pic: user.profile_pic, userType: user.userType });
        }
        else
            res.render("home", { products: products, loggedIn: false, username: "", profile_pic: "", userType: 0 });
    });
    
})

app.post("/getProducts", function(req, res){
    
    

    // fs.readFile("products.js", "utf-8", function(err, data){
    //     var products = JSON.parse(data);
    //     if(noproductsToDisplay>products.length)
    //         noproductsToDisplay = products.length;
        
    //     var productsToSend = [];
    //     for(var i = 0; i < noproductsToDisplay; i++){
    //         productsToSend.push(products[i]);
    //     }
    //     res.end(JSON.stringify(productsToSend));
    // })
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
    // console.log(product_id);
    var flag = 0;
    

    
    productModel.findOne({_id: product_id}).then(function(product){
        // console.log(product);
        cartModel.findOne({ product_id: product_id, user_id: user._id}).then(function(prd){

            if(prd)
                res.status(409).json({ status: false, message: "Item already in cart", data: null });
            else{
                cartModel.create({
                    product_id: product_id,
                    product_pic: product.product_pic,
                    product_name: product.product_name,
                    product_price: product.product_price,
                    product_description: product.product_desc,
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
            res.render("viewCart", { error: "", products: products, loggedIn: true, username: user.username, profile_pic: user.profile_pic, userType: user.userType });
        }
        else{
            res.render("viewCart", {error: "Cart is Empty", products: [], loggedIn: true, username: user.username, profile_pic: user.profile_pic, userType: user.userType })
        }
    }).catch(function(err){
        // console.log("cant find");
    })
})

app.post("/removeFromCart", function(req, res){

    var id = req.body.id;
    // console.log(id);
    cartModel.deleteOne({product_id: id}).then(function(prd){
        if(prd)
            res.status(200).end();
        else
            res.status(401).end();
    })
})

app.post("/changeQuantity", function(req, res){

    var id = req.body.id;
    var flag = req.body.flag;

    cartModel.findOne({product_id: id}).then(function(product){
        if(product){
            if(flag){
                ++product.quantity;
                cartModel.updateOne({product_id: id}, {quantity: product.quantity}).then(function(){
                        res.end(JSON.stringify(product.quantity));
                })
            }
            else{
                --product.quantity;
                if(product.quantity <= 0)
                    product.quantity = 1;
                cartModel.updateOne({product_id: id}, {quantity: product.quantity}).then(function(){
                        res.end(JSON.stringify(product.quantity));
                })
            }
        }
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
        else{
            userModel.create({
                profile_pic: file.filename,
                email: email,
                username: username,
                password: password,
                isVerified: false,
                userType: userTypeEnums.admin
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
                // console.log(err);
                res.render("register", { error: "Something went wrong"});
            })
        }
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
                    res.render("login", { error: "Error occured while verifying email!!"});
                else
                    res.render("login", { error: "Email Verified successfully, login now!!"});
            });
            
        }
    })
});


app.route("/changePassword").get(function(req, res){
    var user = req.session.user;
    var loggedIn = req.session.isLoggedIn;
    if(!loggedIn){
        res.render("changePassword", { loggedIn: loggedIn, username: "", profile_pic: "", error: "Not logged in.." });
        return;
    }
    res.render("changePassword", { loggedIn: loggedIn, username: user.username, profile_pic: user.profile_pic, error: "" });
}).post(function(req, res){
    var npassword = req.body.npassword;
    var cpassword = req.body.cpassword;
    var user = req.session.user;
    var loggedIn = req.session.isLoggedIn;
    if(!loggedIn){
        res.render("changePassword", { loggedIn: loggedIn, username: "", profile_pic: "", error: "Not logged in.." });
        return;
    }
    if(npassword !== cpassword){
        res.render("changePassword", { loggedIn: loggedIn, username: user.username, profile_pic: user.profile_pic, error: "New passwords not matching" });
        return;
    }

    userModel.findOne({username: user.username, password: user.password})
    .then(function(user){
        if(user){

            userModel.updateOne({username: user.username, password: user.password}, { password : npassword}, function(err, data){
                if(err)
                    res.render("login", { error: "Error while changing password!!"});
                else
                    res.render("login", { error: "Password changed successfully, login now!!"});
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
                    res.render("login", { error: "Can't update password!!"});
                else
                    res.render("login", { error: "Password updated successfully, login with new password!!"});
            });
            
        }
        else{
            res.render("forgotPasswordPage", { error: "User with this link not found!!" })
        }
    })
});


// admin side work

app.route("/addProduct").get(function(req, res){

    
    var loggedIn = req.session.isLoggedIn;
    if(loggedIn){
        var user = req.session.user;
        if(user.userType === 1)
            res.render("addProduct", { error: "", loggedIn: loggedIn, username: user.username, profile_pic: user.profile_pic});
        else
            res.redirect("home");
    }
    else
        res.redirect("home");
}).post(prd.single("product_pic"), function(req, res){


    var user = req.session.user;
    var loggedIn = req.session.isLoggedIn;

	var file = req.file;
	var name = req.body.productname;
	var price = req.body.productprice;
	var stock = req.body.productstock;
	var desc = req.body.productdesc;

	// if(!file){
	// 	res.render("addProduct", { error: "Add profile picture"});
	// 	return;
	// }
	// if(!name){
	// 	res.render("addProduct", { error: "Enter product name"});
	// 	return;
	// }
	// if(!price){
	// 	res.render("addProduct", { error: "Enter price"});
	// 	return;
	// }
	// if(!stock){
	// 	res.render("addProduct", { error: "Enter product stock"});
	// 	return;
	// }
    // if(!desc){
	// 	res.render("addProduct", { error: "Enter description"});
	// 	return;
	// }

    productModel.create({
        product_pic: file.filename,
        product_name: name,
        product_price: price,
        product_stock: stock,
        product_desc: desc,
    })
    .then(function(){
        res.render("addProduct", { error: "Product added successfully!!", loggedIn: loggedIn, username: user.username, profile_pic: user.profile_pic });
    })
    .catch(function(err){
        // console.log(err);
        res.render("addProduct", { error: "Something went wrong", loggedIn: loggedIn, username: user.username, profile_pic: user.profile_pic });
    })
})


app.listen(3000, function(){
	console.log("server running at port http://localhost:3000");
})