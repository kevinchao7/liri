var Spotify = require('node-spotify-api');
var keys = require('./keys.js');
var Twitter = require('twitter');
var moment = require('moment');
var inquirer = require('inquirer');
var fs = require('fs');
var request = require('request');

var twitter = new Twitter({
  consumer_key: keys.twitterKeys.consumer_key,
  consumer_secret: keys.twitterKeys.consumer_secret,
  access_token_key: keys.twitterKeys.access_token_key,
  access_token_secret: keys.twitterKeys.access_token_secret
});

var spotify = new Spotify({
  id: keys.spotifyKeys.clientID,
  secret: keys.spotifyKeys.clientSecret
});

var sn = {screen_name: 'robert jones'};
var endpoint = 'statuses/user_timeline';
var apis = ['twitter','spotify','omdb'];
var spotifyOptions = ['album','artist','playlist','track'];
var textFile = 'log.txt';

// Start Liri
runLiri();

function runLiri(){
  inquireList('list','What would you like to search?', 'search', apis, getInquiry);
}

function getInquiry(inquiry){
  if (inquiry == 'twitter'){
    searchTwitter(endpoint,sn,getTweets);
  }
  else if (inquiry == 'spotify'){
    inquireSpotify();
  }
  else{
    inquireMessage('input', 'Enter a movie search term => ', 'movie', searchMovie);
  }
}

function askToSearchAgain(){
  inquireList('list','Do you want to search again?','confirm',['Yes','No'],(resp)=>{
    if (resp == 'Yes') runLiri();
  });
}



function inquireSpotify(){
  inquirer.prompt([
    {
      type    : 'list',
      message : 'What type would you like to search?',
      choices : ['album','track'],
      name    : 'spotify'
    },
    {
      type    : 'input',
      message : 'Enter a search term => ',
      name    : 'searchTerm'
    }
  ]).then(resp=>{
    searchSpotify(resp.spotify, resp.searchTerm, displaySpotifyResults);
  });
}

function inquireMessage(yourType, yourMessage, objName, doFunc){
  inquirer.prompt([
    {
      type    : yourType,
      message : yourMessage,
      name    : objName
    }
  ]).then(resp=>{
    doFunc(resp[objName]);
  });
}

function inquireList(yourType, yourMessage, objName, choiceList, doFunc){
  inquirer.prompt([
    {
      type    : yourType,
      message : yourMessage,
      choices : choiceList,
      name    : objName
    }
  ]).then(resp=>{
    doFunc(resp[objName]);
  });
}

function getTweets(tweets){
  logData('');
  logData('Your Tweets');
  logData('----------------')
  tweets.forEach((value,index)=>{
    if (index < 20) logData(moment(value.created_at, 'dd MMM DD HH:mm:ss ZZ YYYY', 'en').format('LLLL') + ' => ' + value.user.screen_name + ': '+value.text);
  });
  askToSearchAgain();
}

function searchTwitter(endpoint, param, doFunc){
  twitter.get(endpoint, param, function(error, tweets, response) {
    if (!error) {
      doFunc(tweets);
    }
  });
}

function displaySpotifyResults(resp){
  logData('');
  logData('Spotifty '+resp.type+' search');
  logData('----------------------');
  logData('Artist           : ' + resp.artists[0].name);
  logData( ((resp.type == 'track') ? 'Song ' : 'Album')+'            : ' + resp.name);
  logData('Preview Link URL : ' + resp.external_urls.spotify);
  (resp.type != 'track') ? logData() : logData('Album            : ' + resp.album.name);
  askToSearchAgain();
}

function searchSpotify(searchType, searchQuery, doFunc){
  spotify.search({ type: searchType, query: searchQuery }, (err, data)=>{
    if (err) {
      return console.log('Error occurred: ' + err);
    }
    doFunc(data[searchType +'s'].items[0]);
  });
}

function displayMovie(movie){
  logData('');
  logData('OMDB API Search');
  logData('----------------')
  logData('Movie Title            : ' + movie.Title);
  logData('Year released          : ' + movie.Released);
  logData('IMDB Rating            : ' + movie.imdbRating);
  logData('Country                : ' + movie.Country);
  logData('Language               : ' + movie.Language);
  logData('Cast                   : ' + movie.Actors);
  movie.Ratings.forEach((value)=>{
    if(value.Source == 'Rotten Tomatoes')
      logData('Rotten Tomatoes        : ' + value.Value);
  });
  logData('Plot                   : ' + movie.Plot);
  logData('');
  askToSearchAgain();
}

function searchMovie(movieName){
  var queryUrl = "http://www.omdbapi.com/?t=" + movieName + "&y=&plot=short&apikey=40e9cece";
  request(queryUrl, (error,response,body) => {
    if( !error && response.statusCode == 200){
      parsedBody = JSON.parse(body);
      displayMovie(parsedBody);
    }
  });
}

function logData(data){
  console.log(data);
  var logText = data + '\r\n';
  fs.appendFile(textFile, logText , err => {if (err)throw err});
}
