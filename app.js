const campground = require("./models/campground");

var express        =require("express"),
    app            =express(),
    bodyparser     =require("body-parser"),
    Campground     =require("./models/campground"),
    mongoose       =require("mongoose"),
    Comment        =require("./models/comment"),
    passport       =require("passport"),
    LocalStrategy  =require("passport-local"),
    User           =require("./models/user"),
    methodOverride =require("method-override"),
    flash          =require("connect-flash");
    
app.use(bodyparser.urlencoded({extended:true}));
app.use(express.static(__dirname+"/public"));
app.use(methodOverride("_method"));
app.use(flash());

mongoose.connect("mongodb://localhost:27017/MirrorCraft", { useNewUrlParser: true,useUnifiedTopology: true });

app.set("view engine","ejs");
mongoose.set('useFindAndModify', false);
//mongoose.set('findOneAndUpdate', false);
//mongoose.set('findOneAndDelete', false);

// var campgrounds=[
//     {name:"mountain",image:"https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&cs=tinysrgb&h=350"},
//     {name:"salmon creek",image:"https://images.pexels.com/photos/6757/feet-morning-adventure-camping.jpg?auto=compress&cs=tinysrgb&h=350"},
//     {name:"Granite Hill",image:"https://images.pexels.com/photos/776117/pexels-photo-776117.jpeg?auto=compress&cs=tinysrgb&h=350"},
//     {name:"mountain",image:"https://images.pexels.com/photos/2398220/pexels-photo-2398220.jpeg?auto=compress&cs=tinysrgb&h=350"},
//     {name:"mountain Goat's Rest",image:"https://images.pexels.com/photos/2662816/pexels-photo-2662816.jpeg?auto=compress&cs=tinysrgb&h=350"},
//     {name:"mountain",image:"https://images.pexels.com/photos/1061640/pexels-photo-1061640.jpeg?auto=compress&cs=tinysrgb&h=350"},
//     {name:"salmon creek",image:"https://images.pexels.com/photos/6757/feet-morning-adventure-camping.jpg?auto=compress&cs=tinysrgb&h=350"},
//     {name:"Granite Hill",image:"https://images.pexels.com/photos/776117/pexels-photo-776117.jpeg?auto=compress&cs=tinysrgb&h=350"},
//     {name:"mountain",image:"https://images.pexels.com/photos/2398220/pexels-photo-2398220.jpeg?auto=compress&cs=tinysrgb&h=350"},
//     {name:"mountain Goat's Rest",image:"https://images.pexels.com/photos/2662816/pexels-photo-2662816.jpeg?auto=compress&cs=tinysrgb&h=350"}
//    ]
  
//passport config
app.use(require("express-session")({
secret:"this is my secret.",
resave:false,
saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
    res.locals.currentUser=req.user;
  
    next();
})


app.get("/",function(req,res){
    res.render("landing"); 
})

//INDEX
app.get("/campgrounds",function(req,res){
        
        Campground.find({},function(err,allcampgrounds){
          if(err){
              console.log(err);
          }
          else{
              res.render("campgrounds", {campgrounds:allcampgrounds,currentUser:req.user,logout:req.flash("success"),login:req.flash("successlogin")});
          }

        });
        
});

//CREATE
app.post("/campgrounds",function(req,res){

    var name=req.body.name;
    var image=req.body.image;
    var description=req.body.desc;
    var newcampground={name:name,image:image,description:description,owner:req.user.username};
    Campground.create(newcampground,function(err,newlyCreated){
        if(err){
            console.log(err);
        }
        else{
            res.redirect("/campgrounds");
        }
    });
    
});

//NEW 
app.get("/campgrounds/new",isLoggedIn,function(req,res){
   
    
      res.render("new");
});

//SHOW
app.get("/campgrounds/:id",function(req,res){
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground) {
      if(err){
          console.log(err);
      }
      else{
        res.render("show",{campground:foundCampground,currentUser:req.user});
      }
    })
    
  });

  //COMMENT ROUTES
  app.get("/campgrounds/:id/comments/new",isLoggedIn,function(req,res){
        res.render("comments/new",{id:req.params.id,currentUser:req.user});
  });
  app.post("/campground/:id/comments",isLoggedIn,function(req,res){
      var newcomment=req.body.comment;
      var commentpush={text:newcomment,author:req.user.username};
    Campground.findById(req.params.id,function(err,foundCampground){
        if(err){
            console.log(err);
            res.redirect("/campgrounds");
        }
        else{
             Comment.create(commentpush,function(err,comment){
               if(err){
                   console.log(err);
               }              
               else{
                foundCampground.comments.push(comment);
                foundCampground.save();
                   res.redirect("/campgrounds/"+foundCampground._id);
               }
             });
            
    }
});
  });


//Auth Routes
app.get("/register",function(req,res){
    res.render("register",{currentUser:req.user});
})
//handle sign up logic
app.post("/register",function(req,res){
    var newUser=new User({username:req.body.username});
    User.register(newUser,req.body.password,function(err,user){
     if(err){
         console.log(err);
         return res.render("register");
     }
     passport.authenticate("local")(req,res,function(){
         res.redirect("/campgrounds");
     })
    });
  
});

//show login Form
app.get("/login",function(req,res){
     res.render("login",{currentUser:req.user,message:req.flash("error")});
});

//login logic
app.post("/login",passport.authenticate("local",
   {successRedirect:"/campgrounds",
     failureRedirect:"/login"
  }),function(req,res){
    req.flash("successlogin"," Successfully Logged In");
});

//logout
app.get("/logout",function(req,res){
   req.logout();
   req.flash("success"," Successfully Logged Out");
   res.redirect("/campgrounds");
});

function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        
        return next();
    }
    req.flash("error"," Please Login First");
    res.redirect("/login");
}


//Edit campground
app.get("/campgrounds/:id/edit",isLoggedIn,function(req,res){
Campground.findById(req.params.id,function(err,foundCampground){
    if(err)
{
    console.log(err);
}
else{
   
    if(req.user.username===foundCampground.owner){
    res.render("editcampground",{campground:foundCampground});
    }
    else{
        res.render("sorry");
    }
}
});
 
});
//update campground
app.put("/campgrounds/:id",function(req,res){

    Campground.findByIdAndUpdate(req.params.id,req.body.campgrounds,function(err,updatedCampgrround){
        if(err){
            res.redirect("/campgrounds");
        }
        else{
            res.redirect("/campgrounds/"+req.params.id);
        }
    });
});


//destroy campground
app.delete("/campgrounds/:id",isLoggedIn,function(req,res){
    Campground.findById(req.params.id,function(err,foundCampground){
        if(err)
    {
        console.log(err);
    }
    else{
       
    if(req.user.username===foundCampground.owner){
    Campground.findByIdAndRemove(req.params.id,function(err,foundCampground){
        if(err)
    {
        console.log(err);
    }
    else{
        
        res.redirect("/campgrounds");
        }
    });
}
else{
    res.render("sorry");
}
}
});
});

//comment edit
app.get("/campgrounds/:id/comments/:comment_id/edit",isLoggedIn,function(req,res){

  Comment.findById(req.params.comment_id,function(err,foundComment){
      if(err){
          console.log(err);
      }
      else{
        if(req.user.username===foundComment.author){
          res.render("comments/edit",{campground_id:req.params.id,comment:foundComment});
        }
        else{
            res.render("sorry");
        }
      }
  });
});
app.put("/campgrounds/:id/comments/:comment_id",isLoggedIn,function(req,res){
    console.log(req.body.comment);
    var editedcomment={text:req.body.comment, author:req.user.username};
Comment.findByIdAndUpdate(req.params.comment_id,editedcomment,function(err,updatedComment){
    if(err){
        console.log(err);
        
    }
    else{
        console.log(updatedComment);
        res.redirect("/campgrounds/"+req.params.id);
    }
});
});

//comment delete
app.delete("/campgrounds/:id/comments/:comment_id",isLoggedIn,function(req,res){
    Comment.findById(req.params.comment_id,function(err,foundComment){
        if(err)
    {
        console.log(err);
    }
    else{
       
    if(req.user.username===foundComment.author){
    Comment.findByIdAndRemove(req.params.comment_id,function(err,comment){
        if(err)
    {
        console.log(err);
    }
    else{
        
        res.redirect("/campgrounds/"+req.params.id);
        }
    });
}
else{
    res.render("sorry");
}
}
});
});
let port=process.env.PORT;
if(port==null||port==""){
  port=5000;
}
app.listen(port, function () {
  console.log("Server started successfully at port 5000");
});
