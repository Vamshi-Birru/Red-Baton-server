import mongoose from "mongoose";
const NewsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  url: {
    type: String,
   
  },
  hackerNewsUrl: {
    type: String,
    required: true,
  },
  postedOnText:{
    type: String,
    required:true
  },
  scrapedTime:{
    type:Date,
    required:true
  },
 
  upvotes: {
    type: Number,
    required: true,
  },
  comments: {
    type: Number,
    required:true
  },
  read:{
    type: Boolean,
    required:true
  },
  delete:{
    type:Boolean,
    required:true
  }
  
});

export default mongoose.model("newsItem", NewsSchema)