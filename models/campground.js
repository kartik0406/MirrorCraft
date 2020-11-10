var mongoose=require("mongoose");

var CampgroundSchema=new mongoose.Schema({
    name:String,
    image:String,
    description:String,
    owner:String,
    comments:[
        {type:mongoose.Schema.Types.ObjectId,
         ref:"Comment"
        }
    ]
    });
    
    module.exports=mongoose.model("Campground",CampgroundSchema);
    