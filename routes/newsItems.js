import express from "express";
import {  
  readItems,
  getnewsItems,
  deleteItems,
  scrapeHackerNews
} from "../controllers/newsItem.js";


const router = express.Router();
router.put("/readItem",readItems);
router.put("/deleteItem",deleteItems);
router.get("/",scrapeHackerNews,getnewsItems);


export default router;
