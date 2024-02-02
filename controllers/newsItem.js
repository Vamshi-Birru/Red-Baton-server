import NewsItem from "../models/NewsItem.js";
import axios from "axios";
import cheerio from "cheerio";

export const readItems=async (req,res)=>{
    try{
      const id=req.body.id;
      const item=await NewsItem.findOne({_id:id});
      if(!item){
        res.status(400).json("There is no item with that Id");
      }
      else{
        item.read=true;
        await item.save();
        res.status(200).json("Successfully read");
      }
    }
    catch(err){
      console.error('Error reading newsItem:', error);
    throw error;
    }
}

export const deleteItems=async(req,res)=>{
  try{
    const id=req.body.id;
    const item=await NewsItem.findOne({_id:id});
    if(!item){
      res.status(400).json("There is no item with that Id");
    }
    else{
      item.delete=true;
      await item.save();
      res.status(200).json("Successfully deleted");
    }
  }
  catch(err){
    console.error('Error deleting newsItem:', error);
    throw error;
  }
}
export const getnewsItems = async (req, res, next) => {

  try {
    const newsItems = await NewsItem.find({delete:false});
    newsItems.forEach((newsItem) => {
      const postedOnText = newsItem.postedOnText;
      const scrapT = newsItem.scrapedTime;
      let timestamp;
      if (postedOnText.includes('minute')) {
        const minutesAgo = parseInt(postedOnText);
        timestamp = scrapT - (minutesAgo * 60 * 1000);
      } else if (postedOnText.includes('hour')) {
        const hoursAgo = parseInt(postedOnText);
        timestamp = scrapT - (hoursAgo * 60 * 60 * 1000);
      } else if (postedOnText.includes('day')) {
        const daysAgo = parseInt(postedOnText);
        timestamp = scrapT - (daysAgo * 24 * 60 * 60 * 1000);
      } else if (postedOnText.includes('week')) {
        const weeksAgo = parseInt(postedOnText);
        timestamp = scrapT - (weeksAgo * 7 * 24 * 60 * 60 * 1000);
      } else if (postedOnText.includes('month')) {
        const monthsAgo = parseInt(postedOnText);
        timestamp = scrapT - (monthsAgo * 30 * 24 * 60 * 60 * 1000);
      } else if (postedOnText.includes('year')) {
        const yearsAgo = parseInt(postedOnText);
        timestamp = scrapT - (yearsAgo * 365 * 24 * 60 * 60 * 1000);
      }
      const Tdifference = Date.now() - timestamp;
      newsItem.timeDifference = Tdifference;

      if (Tdifference < 60 * 1000) {
        newsItem.postedOnText = 'just now';
      } else if (Tdifference < 60 * 60 * 1000) {
        const minutes = Math.floor(Tdifference / (60 * 1000));
        newsItem.postedOnText = minutes + ' minutes ago';
      } else if (Tdifference < 24 * 60 * 60 * 1000) {
        const hours = Math.floor(Tdifference / (60 * 60 * 1000));
        newsItem.postedOnText = hours + ' hours ago';
      } else if (Tdifference < 7 * 24 * 60 * 60 * 1000) {
        const days = Math.floor(Tdifference / (24 * 60 * 60 * 1000));
        newsItem.postedOnText = days + ' days ago';
      } else if (Tdifference < 30 * 24 * 60 * 60 * 1000) {
        const weeks = Math.floor(Tdifference / (7 * 24 * 60 * 60 * 1000));
        newsItem.postedOnText = weeks + ' weeks ago';
      } else if (Tdifference < 365 * 24 * 60 * 60 * 1000) {
        const months = Math.floor(Tdifference / (30 * 24 * 60 * 60 * 1000));
        newsItem.postedOnText = months + ' months ago';
      } else {
        const years = Math.floor(Tdifference / (365 * 24 * 60 * 60 * 1000));
        newsItem.postedOnText = years + ' years ago';
      }
    });
    newsItems.sort((a, b) => a.timeDifference - b.timeDifference);

    const result = newsItems.slice(0, 90);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};


export const scrapeHackerNews = async (req, res, next) => {
  try {
    const numberOfPages = 3;
    const newsItems = [];

    for (let page = 1; page <= numberOfPages; page++) {
      const response = await axios.get(`https://news.ycombinator.com/news?p=${page}`);
      const $ = cheerio.load(response.data);


      $('.athing').each(async (index, element) => {
        const titleElement = $(element).find('.title a');
        const title = titleElement.contents().first().text().trim();

        const trimmedUrl = titleElement.attr('href');
        const matchResult = trimmedUrl.match(/^(https?:\/\/[^\/]+\.([a-z]{2,}))\b/);
        const url = matchResult ? matchResult[1] : null;
        const hackerNewsUrl = $(element).find('.title a').attr('href');
        const postedOnText = $(element).next().find('.age').text().trim();

        const upvotesText = $(element).next().find('.score').text().trim();
        const upvotes = upvotesText.trim() !== '' ? parseInt(upvotesText, 10) : 0;

        const commentsText = $(element).next().find('a[href^="item"]').last().text().trim();
        const commentsMatch = commentsText.match(/^(\d+)\s+comments?$/i);
        const comments = commentsMatch ? parseInt(commentsMatch[1], 10) : 0;
        const resp = await NewsItem.findOne({ title: title, url: url, hackerNewsUrl: hackerNewsUrl });
        if (resp) {
          resp.upvotes = upvotes;
          resp.comments = comments;
          await resp.save();
        }
        else {
          const newNewsItem = new NewsItem({
            title,
            url,
            hackerNewsUrl,
            postedOnText, 
            scrapedTime: Date.now(), 
            upvotes,
            comments,
            read:false,
            delete:false

          });
          await newNewsItem.save();

        }
      });
    }
    next();
  } catch (error) {
    console.error('Error scraping HackerNews:', error);
    throw error;
  }
};
