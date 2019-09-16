const bodyParser = require('body-parser')
const express = require('express')
const logger = require('morgan')
const app = express()
const {
  fallbackHandler,
  notFoundHandler,
  genericErrorHandler,
  poweredByHandler
} = require('./handlers.js')

// For deployment to Heroku, the port needs to be set using ENV, so
// we check for the port number in process.env
app.set('port', (process.env.PORT || 9001))

app.enable('verbose errors')

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(poweredByHandler)

// --- SNAKE LOGIC GOES BELOW THIS LINE ---

// Handle POST request to '/start'
app.post('/start', (request, response) => {
  // NOTE: Do something here to start the game

  // Response data
  const data = {
    "color": "#FF4444",
    "headType": "silly",
    "tailType": "freckled"
  }

  return response.json(data)
})
var prevMove = '';
// Handle POST request to '/move'
app.post('/move', (request, response) => {
  // NOTE: Do something here to generate your move
  // Get food location
  const foodObj = request.body.board.food[0];
  const foodX = foodObj.x;
  const foodY = foodObj.y;

  // Get snek coords
  const snekObj = request.body.you.body[0];
  const snekHeadX = snekObj.x;
  const snekHeadY = snekObj.y;

  // other snakes ... request.body.board.snakes.body[0]
  var otherSnakes = request.body.board.snakes;
  var allSnakes = [];
  for (var i = 0; i < otherSnakes.length; i++) {
    allSnakes = allSnakes.concat(otherSnakes[i].body);
  }
  console.log(allSnakes);

  // get board size
  var boardHeightMax = request.body.board.height;
  var boardWidthMax = request.body.board.width;
  const boardHeightMin = 0;
  const boardWidthMin = 0;

  // dont move back onto yourself logic
  var backwardMove = '';
  if (prevMove == '') {
    //do nothing for now
  } else {
    if (prevMove == 'up') {
      backwardMove = 'down';
    } else if (prevMove == 'down') {
      backwardMove = 'up';
    } else if (prevMove == 'right') {
      backwardMove = 'left';
    } else {
      backwardMove = 'right';
    }
  }


  var verticalFoodMove = '';
  // move vertically
  if (foodY < snekHeadY) {
    verticalFoodMove = 'up';
  } else if (foodY > snekHeadY) {
    verticalFoodMove = 'down';
  }

  var horizontalFoodMove = '';
  // move horizontally
  if (foodX > snekHeadX) {
    horizontalFoodMove = 'right';
  } else if (foodX < snekHeadX) {
    horizontalFoodMove = 'left';
  }


  //potential and bad moves list
  var potentialMoves = [];
  var badMoves = [];

  // convert directions to coords
  var futureVerticalMove = { x: 0, y: 0 };
  if (verticalFoodMove == 'up') {
    potentialMoves.push('up');
    futureVerticalMove.x = snekHeadX;
    futureVerticalMove.y = snekHeadY - 1;
  } else {
    potentialMoves.push('down');
    futureVerticalMove.x = snekHeadX;
    futureVerticalMove.y = snekHeadY + 1;
  }

  var futureHorizontalMove = { x: 0, y: 0 };
  if (horizontalFoodMove == 'right') {
    potentialMoves.push('right');
    futureHorizontalMove.x = snekHeadX + 1;
    futureHorizontalMove.y = snekHeadY;
  } else {
    potentialMoves.push('left');
    futureHorizontalMove.x = snekHeadX - 1;
    futureHorizontalMove.y = snekHeadY;
  }


  //vertical future move into another snek
  for (var i = 0; i < allSnakes.length; i++) {
    if (allSnakes[i].x == futureVerticalMove.x && allSnakes[i].y == futureVerticalMove.y) {
      for (var m in potentialMoves) {
        if (m == 'up') {
          badMoves.push(m)
        } else if (m == 'down') {
          badMoves.push(m)
        }
      }
    }
  }

  // horizontal future move into another snek
  for (var i = 0; i < allSnakes.length; i++) {
    if (allSnakes[i].x == futureHorizontalMove.x && allSnakes[i].y == futureHorizontalMove.y) {
      for (var m in potentialMoves) {
        if (m == 'right') {
          badMoves.push(m)
        } else if (m == 'left') {
          badMoves.push(m)
        }
      }
    }
  }

  // horizontal future move into wall
  if (futureHorizontalMove.x < boardWidthMin || futureHorizontalMove.x > boardWidthMax) {
    for (var m in potentialMoves) {
      if (m == 'right') {
        badMoves.push(m)
      } else if (m == 'left') {
        badMoves.push(m)
      }
    }
  }

  // vertical future move into wall
  if (futureVerticalMove.y < boardHeightMin || futureVerticalMove.y > boardHeightMax) {
    for (var m in potentialMoves) {
      if (m == 'up') {
        badMoves.push(m)
      } else if (m == 'down') {
        badMoves.push(m)
      }
    }
  }

  var directions = ['up', 'down', 'left', 'right'];
  for (var i = 0; i < directions.length; i++) {
    if (directions.includes(badMoves[i])) {
      directions.splice(directions.indexOf(badMoves[i]));
    }
  };

  var dir = directions[1];

  // body coordinates ************************** TODO

  // Response data for movin'
  //set prevMove to the move that is determined at the end************* TODO
  prevMove = dir;
  const data = {
    move: dir,
  };
  return response.json(data);
})

app.post('/end', (request, response) => {
  // NOTE: Any cleanup when a game is complete.
  return response.json({})
})

app.post('/ping', (request, response) => {
  // Used for checking if this snake is still alive.
  return response.json({});
})

// --- SNAKE LOGIC GOES ABOVE THIS LINE ---

app.use('*', fallbackHandler)
app.use(notFoundHandler)
app.use(genericErrorHandler)

app.listen(app.get('port'), () => {
  console.log('Server listening on port %s', app.get('port'))
})
