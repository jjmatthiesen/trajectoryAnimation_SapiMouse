let table;
let i = 0;
const pauses = {};

function getXCoords(table) {
    let xCoords = [];
    table.rows.forEach(element => {
      let coordX = element.obj['x'];
      xCoords.push(coordX * scale);
    });
    return [xCoords];
  }

function getYCoords() {
    let yCoords = [];
    table.rows.forEach(element => {
        let coordY = element.obj['y'];
        yCoords.push(coordY * scale);
    });
    return [yCoords];
}