// A 2D Neural Network Explorer in Javascript
// Copyright 2020 Chris Collander, cmcollander@gmail.com
// Licensed under GNU GPLv3 (LICENSE.md)

let canvasX = 400;
let canvasY = 400;
let gridX = 40;
let gridY = 40;
let pointRadius = 15;

let data = []

const RED = 0;
const BLUE = 1;

let point_color = RED;
let background_color;

let redButton;
let blueButton;
let trainButton;

let canvas;
let predictionBackground;

let nn; // Our neural network object

// Given a pixel coordinate, what index of coordListNormalized maps to that point?
getCoordListNormalizedIndex = (x, y) => canvasY * x + y;

// Given a pixel coordinate, normalize it
normalize = (x, y) => [x / canvasX, y / canvasY];

// Given a normalized coordinate, convert to canvas coordinate
unnormalize = (x, y) => [int(x * canvasX), int(y * canvasY)];

function createUI() {
  redButton = createButton("Place Red Data Points")
  redButton.mousePressed(() => point_color = RED)
  blueButton = createButton("Place Blue Data Points")
  blueButton.mousePressed(() => point_color = BLUE)

  trainButton = createButton("Train and Predict Full Space")
  trainButton.mousePressed(train)
}

function setup() {
  // Prepare background surface
  predictionBackground = createGraphics(canvasX, canvasY);
  predict(initial = true);

  createElement('h2', '2D Neural Network Explorer')
  canvas = createCanvas(canvasX, canvasY);
  canvas.mousePressed(canvasMouseClicked)
  createUI();
}

function draw() {
  // Draw our latest prediction background
  image(predictionBackground, 0, 0)
  // Draw each of our data points
  for (let row of data) {
    let coordX;
    let coordY;
    [coordX, coordY] = unnormalize(row[0], row[1]);
    stroke(0, 0, 0);
    if (row[2] == 0)
      fill(color(255, 0, 0));
    else
      fill(color(0, 0, 255));
    ellipse(coordX, coordY, pointRadius, pointRadius);
  }
}

function canvasMouseClicked() {
  if (point_color == RED)
    fill(255, 0, 0);
  else if (point_color == BLUE)
    fill(0, 0, 255);
  ellipse(mouseX, mouseY, pointRadius, pointRadius);
  [newX, newY] = normalize(mouseX, mouseY);
  data.push([newX, newY, point_color]);
}

function train() {
  console.log("Training!")
  const options = {
    inputs: 2,
    outputs: 2,
    task: 'classification',
    debug: true
  }
  nn = ml5.neuralNetwork(options);
  let total = 0;
  data.forEach(row => {
    total += 1
    nn.addData({
      x: row[0],
      y: row[1]
    }, {
      red: 1 - row[2],
      blue: row[2]
    })
  });
  console.log("Loaded Data: ", total)
  const trainingOptions = {
    epochs: 10,
    batchSize: 12
  }
  nn.train(trainingOptions, finishedTraining);
}

function finishedTraining() {
  console.log("Finished Training!");
  predict();
}

function predict(initial = false) {
  console.log("Inside predict");
  if (initial) {
    console.log("Initial background");
    predictionBackground.background(color(0, 50, 0));
    return;
  }

  for (let x = 0; x < gridX; x++)
    for (let y = 0; y < gridY; y++) {
      let centeredX = ((2 * x + 1) * canvasX) / (2 * gridX);
      let centeredY = ((2 * y + 1) * canvasY) / (2 * gridY);
      [newX, newY] = normalize(centeredX, centeredY);
      nn.predict({
        x: newX,
        y: newY
      }, (error, result) => {
        if (error) {
          console.error(error);
          return;
        }
        let redResult = result[0]["value"]
        let blueResult = result[1]["value"]
        let w = canvasX / gridX
        let g = canvasY / gridY
        if (redResult > blueResult)
          predictionBackground.fill(color(50, 0, 0));
        else
          predictionBackground.fill(color(0, 0, 50));
        predictionBackground.rectMode(CENTER);
        predictionBackground.noStroke();
        predictionBackground.rect(centeredX, centeredY, w, g)
      });
    }
  console.log("Finished Predicting");
  //miniBackground.scale(canvasX / gridX, canvasY / gridY)
  //predictionBackground.image(miniBackground, 0, 0)
  console.log("Finished Updating Background");
}