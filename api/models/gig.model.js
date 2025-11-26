import mongoose from 'mongoose';
const { Schema } = mongoose;

const GigSchema = new Schema({
  userId:{
    type:String,
    require:true
  },
  title:{
    type:String,
    require:true
  },
  desc:{
    type:String,
    require:true,
    maxlength: 500
  },
  totalStars:{
    type:Number,
    default:0
  },
  starNumber:{
    type:Number,
    default:0
  },
  cat:{
    type:String,
    require:true
  },
  price:{
    type:String,
    require:true
  },
  cover:{
    type:String,
    require:true
  },
  images:{
    type:[String],
    require:false
  },
  sortDesc:{
    type:String,
    require:true
  },
  deliveryTime:{
    type:Number,
    require:true
  },
  features:{
    type:[String],
    require:false
  },
  sales:{
    type:Number,
    default:0,
  },
},{
timestamps:true
});

export default mongoose.model("Gig",GigSchema)