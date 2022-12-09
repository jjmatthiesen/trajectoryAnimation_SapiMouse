const data = {}
data.name = 'sapimouse';
data.eg_table = '/data/sapimouse/user1/session_3min.csv'

// this app (usersMouseTrajectory):
let UMT = {}
let paused = false;
let sliderPos = 0;
let sliderMax = 0;
let trajectoryAnimationStart = 0;
let scale = 0.5;
let user_list = []
let data_file = []
let sel_user = {}
let sel_item = {}
let datasets = [data]


function presspause(){
  if(paused === false){
    console.log('you pressed pause');
    UMT.logOutput.innerHTML += "<p>you pressed pause;</p>"
    paused = true;
    UMT.playbutton.html("<i class=\"material-icons\">play_arrow</i>");
  }
  else{
    console.log('you pressed play');
    UMT.logOutput.innerHTML += "<p>you pressed play;</p>"
    paused = false;
    UMT.playbutton.html("<i class=\"material-icons\">pause</i>");
  }
}

function pressreset(){
  console.log('you pressed reset');
  UMT.logOutput.innerHTML += "<p>you pressed reset</p>"
  paused = false;
  UMT.playbutton.html("<i class=\"material-icons\">pause</i>");
  changeSelection();
}

function setAnimationStart(sliderValue) {
  trajectoryAnimationStart = Math.round(sliderValue / 100 * UMT.xCoords.length);
  clear();
  showStaticTrajectory();
}

function updateSliderPos(sliderPos) {
  UMT.slider.value = sliderPos;
}

function checkClicks(){
  clear();
  showStaticTrajectory();
  if (UMT.checkboxClicks.checked()) {
    console.log("Clicks are displayed");
  } else {
    console.log("Clicks are hidden");
  }
}


function getSpeedAt(now) {
  // distance ein pixel
  let distance = dist(UMT.xCoords[now - 1], UMT.yCoords[now - 1], UMT.xCoords[now], UMT.yCoords[now]);
  // time in s
  let time = (table.rows[now].obj['client timestamp'] - table.rows[now - 1].obj['client timestamp']) / 1000

  return Math.round(distance/ time)
}

function getAvgSpeedAt(now){
  let travelledDist = getDistanceCountAt(now)
  // time in s
  let time = (table.rows[now].obj['client timestamp'] - table.rows[0].obj['client timestamp']) / 1000

  return Math.round(travelledDist/ time)
}

function getJumpAt(now) {
  let jumpCount = 0;
  for (let j = 0; j <= now; j ++) {
    if (dist(UMT.xCoords[j - 1], UMT.yCoords[j - 1], UMT.xCoords[j], UMT.yCoords[j]) > 200) {
      jumpCount += 1;
    }
  }
  return jumpCount
}

function getClickCountAt(now) {
  let clickCount = 0;
  for (let j = 0; j <= now; j ++) {
    if (table.rows[j].obj['state'] === "Pressed") {
      clickCount += 1;
    }
  }
  return clickCount
}


function getDistanceCountAt(now) {
  let distanceCount = 0;
  for (let j = 1; j <= now; j ++) {
    // dist is a p5.js function
    distanceCount += dist(UMT.xCoords[j - 1], UMT.yCoords[j - 1], UMT.xCoords[j], UMT.yCoords[j]);
  }
  return Math.round(distanceCount)
}

function preload() {
  // set exam
  user_list = loadStrings('assets/' + data.name + '/user_list.txt');
  data_file = loadStrings('assets/' + data.name + '/data_file.txt');
  table = loadTable(data.eg_table, 'csv', 'header');
}


function setup() {

  UMT.sel_data = document.getElementById("settings_selects_dataset");
  UMT.sel_data.innerHTML="sapimouse"
  createSelects()

  counter_pause = 0

  UMT.xCoords = getXCoords(table)[0];
  UMT.yCoords = getYCoords(table)[0];
  screenWidth = Math.max(...UMT.xCoords)
  screenHeight = Math.max(...UMT.yCoords)
  let canvas  = createCanvas(screenWidth, screenHeight);
  noStroke();
  rect(0, 0, screenWidth, screenHeight);
  fr = 20
  frameRate(fr);
  canvas.parent("canvas")


  if (document.readyState === "complete" || document.readyState === "interactive") {
    UMT.slider = document.getElementById("sliderpos");
    UMT.slider.oninput  = function() {
      // update sliderPos
      setAnimationStart(UMT.slider.value)
    }
    //set Play/Pause button
    UMT.playbutton = createButton("<i class=\"material-icons\">pause</i>");
    UMT.playbutton.mousePressed(presspause);
    UMT.playbutton.id("playbutton");
    UMT.playbutton.class("button");
    UMT.playbutton.parent(document.getElementById("vidbuttons"))
    UMT.resetbutton = createButton("<i class=\"material-icons\">restart_alt</i>");
    UMT.resetbutton.mousePressed(pressreset);
    UMT.resetbutton.id("resetbutton");
    UMT.resetbutton.class("button");
    UMT.resetbutton.parent(document.getElementById("vidbuttons"))
    //set Checkboxes
    UMT.checkboxClicks = createCheckbox("Show Clicks in the Trajectory", true);
    UMT.checkboxClicks.class("cm-toggle")
    UMT.checkboxClicks.changed(checkClicks);
    UMT.checkboxClicks.parent(document.getElementById("choose_options"));
    //set LogOutput on User Interface
    UMT.logOutputWrapper = document.getElementById("log_output");
    UMT.logOutput = document.getElementById("log_output--inner");
    // 2x 15 px paddding
    UMT.logOutputWrapper.style.height = screenHeight -30
    UMT.ClickCounter = document.getElementById("clicks_counter");
    UMT.clickValid = document.getElementById("clicks_valid");
    UMT.distanceCounter = document.getElementById("distance--counter");
    UMT.currentSpeed = document.getElementById("current_speed");
    UMT.avgSpeed = document.getElementById("avg_speed")
    UMT.jumpCounter = document.getElementById("jump_counter")
    UMT.thinkingBreak = document.getElementById("thinking_break");
  }
}

function createSelects() {
  if (sel_user.option || sel_item.option) {
    sel_user.remove();
    sel_item.remove();
  }

  sel_user = createSelect()
  user_list.forEach(element => {
    sel_user.option(element);
  });

  sel_item = createSelect();
  data_file.forEach(element => {
    sel_item.option(element);
  });

  sel_item.parent("settings_selects_item")
  sel_user.parent("settings_selects_user")

  sel_item.changed(changeSelection);
  sel_user.changed(changeSelection);
}

function showStaticTrajectory() {
// display trajectory in canvas from 0 to trajectoryAnimationStart
  for (let j = 1; j <= trajectoryAnimationStart; j++) {
    if (table.rows[j].obj['state'] === 'Drag') {
      console.log('Drag')
      //stroke(255, 158, 65);
      strokeWeight(3);
    } else {
      strokeWeight(1);
    }
    stroke(0, 0, 0);
    line(UMT.xCoords[j - 1], UMT.yCoords[j - 1], UMT.xCoords[j], UMT.yCoords[j]);
    UMT.ClickCounter.innerHTML = getClickCountAt(j).toString();
    UMT.distanceCounter.innerHTML = getDistanceCountAt(j).toString();
    UMT.currentSpeed.innerHTML = getSpeedAt(j).toString();
    UMT.avgSpeed.innerHTML = getAvgSpeedAt(j).toString();
    drawActions(j);
  }
  loop()
  redraw()
}

function drawActions(index) {

  UMT.distanceCounter.innerHTML = getDistanceCountAt(index).toString();
  UMT.ClickCounter.innerHTML = getClickCountAt(index).toString();
  UMT.currentSpeed.innerHTML = getSpeedAt(index).toString();
  UMT.avgSpeed.innerHTML = getAvgSpeedAt(index).toString();

  if (UMT.checkboxClicks.checked()) {
    if (table.rows[index].obj['state'] === 'Pressed') {
      if (table.rows[index].obj['button'] === 'Right') {
        fill('red');
        UMT.logOutput.innerHTML += "<p>right click;</p>"
        circle(UMT.xCoords[index], UMT.yCoords[index], 5);
      }
      else if (table.rows[index].obj['button'] === 'Left') {
        fill(148, 220, 255); // light blue
        UMT.logOutput.innerHTML += "<p>left click;</p>"
        circle(UMT.xCoords[index], UMT.yCoords[index], 5);
      }
    }
  }
}

function draw() {
  if(paused === false) {
    if (i !== trajectoryAnimationStart ) {
      i = trajectoryAnimationStart;
    }

    if (i < UMT.xCoords.length - 1) {
      i++;
      trajectoryAnimationStart++;
      sliderPos = (i / UMT.xCoords.length) * 100;
      updateSliderPos(sliderPos);

      getJumpAt(i);
      UMT.jumpCounter.innerHTML = getJumpAt(i).toString();
      if(getJumpAt(i)>getJumpAt(i-1)){
        UMT.logOutput.innerHTML += "<p>mouse jump in trajectory;</p>"
        console.log('jump')
      }

      if (table.rows[i].obj['state'] === 'Drag') {
        console.log('Drag')
        //stroke(255, 158, 65);
        strokeWeight(3);
      } else {
        strokeWeight(1);
      }
      stroke(0, 0, 0);
      line(UMT.xCoords[i - 1], UMT.yCoords[i - 1], UMT.xCoords[i], UMT.yCoords[i]);
      drawActions(i);

      if (i === 1) {
        UMT.logOutput.innerHTML += "<p>start of the trajectory >>></p>"
      }
      //check thinking break
     /* if (UMT.xCoords[i - 1] === UMT.xCoords[i] && UMT.yCoords[i - 1] === UMT.yCoords[i]) {
        counter_pause++;
      } else {
        // pause over
        if (counter_pause > 40) {
          console.log('took ' + counter_pause / fr + 2 + ' s')
          UMT.logOutput.innerHTML += "<p> thinking break of user took "+ counter_pause / fr + 2 + " s;</p>"
          UMT.thinkingBreak.className = "hidden";
        }
        counter_pause = 0
      }
      // with a frame rate of 20, this should be no movement in 2 seconds
      if (counter_pause > 40) {
        UMT.thinkingBreak.className = "blink";
        console.log('thinking break');
      }*/
    } else {
      console.log('finished')
      UMT.logOutput.innerHTML += "<p>  >>> end of the trajectory.</p>"
      noLoop();
    }
  }}

function changeSelection() {
  stop();
  console.clear()
  UMT.logOutput.innerHTML = "";
  UMT.ClickCounter.innerHTML = "0";
  UMT.distanceCounter.innerHTML = "";
  UMT.currentSpeed.innerHTML = "";
  UMT.avgSpeed.innerHTML = "";
  sliderMax = 0;
  sliderPos = 0;

  loadTable('data/sapimouse/' + sel_user.value() + '/session_' + sel_item.value()  + '.csv', 'csv', 'header', gotDataSelect);
}

function gotDataExam(data) {
  stop();
  i = 0;
  trajectoryAnimationStart = 0;
  createSelects()
  gotData(data)
}

function gotData(data) {
  table = data;
  UMT.xCoords = getXCoords(table)[0];
  UMT.yCoords = getYCoords(table)[0];
  screenWidth = Math.max(...UMT.xCoords)
  screenHeight = Math.max(...UMT.yCoords)
  canvas  = createCanvas(screenWidth, screenHeight);
  noStroke();
  rect(0, 0, screenWidth, screenHeight);
  canvas.parent("canvas")
  counter_pause = 0
  loop();
  draw();
}

function gotDataSelect(data) {
  stop();
  i = 0;
  trajectoryAnimationStart = 0;
  gotData(data)
}