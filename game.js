//These keep track of the number of inactive mines and robot ships
let inactiveMineCount = 0, robotShipCount = 0
//This keeps track of whether the game is in setup, gameplay, or end mode.
let gameState = 0
//These keep track of if the user ship has been placed and if it has been destroyed
let shipPlaced = false, shipDestroyed = false
//This keeps track of the player position
let playerPosition = [0, 0]
//This keeps track of what round the game is on
let round = 1;
//These define the size of the grid.
const columnSize = 10, rowSize = 10;
//Array representation of the board, so we can interact with the elements
const boardArray = new Array(rowSize);
for (let i = 0; i < 10; i++) {
    boardArray[i] = new Array(columnSize);
}
//Defines the directions that the user and robot can move in
const userDirections = ["up", "down", "left", "right"], robotDirections = ["up", "down", "left", "right", "downleft", "downright", "upleft", "upright"];
//An array of all the Robot ships, so we can interact with them
const robotShips = [];


/*For sake of clarity, here's a list of all the cell.objectTypes and what they mean:
    "n": Nothing in the cell
    "r": Robot Ship
    "m" Mine
    "am" Activated Mine
    "a": Asteroid

    Image references are the same with 2 differences:
        There is no "n" as we don't need an image for nothing in the cell
        There is also "u", which refers to the user ship. This wasn't needed for the object types as there
        is only one User Ship, so we just keep track of its coordinates.

    It was easier to use just letters rather than full names as I can then just assign the value of the users keypress.
 */

//Creates the initial table according to the size values defined above
function setupTable() {
    let table = document.createElement('table');
    let tbody = document.createElement('tbody');
    table.appendChild(tbody);

    for (let i = 0; i < rowSize; i++) {
        let tr = document.createElement('tr');
        for (let j = 0; j < columnSize; j++) {
            let td = document.createElement('td');
            //Stores the location of the cell
            td.placement = [i, j];
            //adds the event listener so that we can interact with the cell
            td.style.verticalAlign = "middle";
            td.style.textAlign = "center";
            td.addEventListener("click", function () {
                cellClick(td);
            });
            td.objectType = "n";
            boardArray[i][j] = td;
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
    document.getElementById('game').appendChild(table);
}

//Runs when you click on a cell
function cellClick(cell) {
    console.log(cell.placement);
    if (gameState === 0) {
        //Checks if the cell already contains an object.
        //If it doesn't, we set up the event listener.
        /*Sets a tab index. This needs to be done before
        you can call cell.focus(). The number is irrelevant*/
        cell.setAttribute('tabIndex', 9999);
        //Calls the selected cell into focus, so it can listen for keyboard input
        cell.focus()

        //Adds the keyboard input listener
        cell.addEventListener("keydown", function (e) {


            /*Checks the length of the input text.
              It's a quick and easy way to filter out control keys*/
            if (e.key.length === 1) {
                //checks if its a valid letter
                const allowedLetters = ["u","m","r","a"];
                if (allowedLetters.indexOf(e.key) > -1) {

                    switch (e.key) {
                        case "u":
                            //If they are it makes sure they haven't already placed one
                            if (shipPlaced) {
                                //If a ship is placed it will alert the user and then the return stops the rest of the code
                                //from running.
                                alert("You can only place 1 user ship!");
                                return;
                            } else if (!hasObject(cell)) {
                                shipPlaced = true;
                                playerPosition = cell.placement;
                            }
                            break;
                        case "m":
                            if (!hasObject(cell)) {
                                inactiveMineCount++;
                                cell.isActive = false;
                            }
                            break;
                        case "r":
                            if (!hasObject(cell)) {
                                robotShipCount++;
                                robotShips.push(cell);
                            }
                    }

                    //Adds the corresponding image to the cell
                    if (!hasObject(cell)) {
                        addImage(cell, e.key);
                        cell.objectType = e.key;
                    }
                } else {
                    alert("Please press a valid letter!")
                }
            }
        }, true);
    }
}

//Creates a new image and adds it into the specified cell.
function addImage(cell, name) {
    let img = document.createElement('img');
    img.style.width = "45%";
    img.src = "images/" + name + ".png";
    cell.appendChild(img);
}

//moves an object from one cell to another
function moveObject(oldCell, newCell, name) {
    oldCell.objectType = "n";
    newCell.objectType = name;
}

//Removes a specified image from a specified cell
function removeImage(cell, name) {
    let imageString = '<img src="images/' + name + '.png" style="width: 45%;">'
    //IE11 forms the HTML differently, so we do for both
    let altString = '<img style="width: 45%;" src="images/' + name + '.png">'
    cell.innerHTML = cell.innerHTML.replace(imageString, "");
    cell.innerHTML = cell.innerHTML.replace(altString, "");
}

//Checks if a cell already contains an object
function hasObject(cell) {
    return (cell.objectType !== "n");
}

//Moves an image from one cell to another
function moveImage(oldCell, newCell, name) {
    removeImage(oldCell, name);
    addImage(newCell, name);
}

//checks if the item in the cell can move, it takes True to mean robot and false to mean user.
function canMove(cell, robotOrUser) {
    const surroundingCells = getSurroundingCells(cell, robotOrUser);

    for (let i = 0; i < surroundingCells.length; i++){
        const item = surroundingCells[i];
        if (item.objectType !== "a" && item.objectType !== "r") {
            console.log("true");
            return true;
        }
    }

    return false;
}

//Checks if the game is deadlocked
function isDeadlocked() {

    if (canMove(getCell(playerPosition), false)) {
        return false;
    }

    for (let i = 0; i < robotShips.length; i++){
        const item = robotShips[i];
        if (canMove(item, true)) {
           return false;
        }
    }

    return true;
}

function moveRobotShip(cell, caller) {
    console.log(caller + " called moveRobotShip");
    //Create an array of all the surrounding cells
    const surroundingCells = getSurroundingCells(cell, true);
    console.log(surroundingCells);
    //Removes cells with asteroids and other robot ships from the array, as we can't move there.
    const playerCell = getCell(playerPosition);
    for (let i = 0; i < surroundingCells.length; i++) {
        if (surroundingCells[i].objectType === "a" || surroundingCells[i].objectType === "r") {
            surroundingCells.splice(i, 1);
        } else if (surroundingCells[i] === playerCell) {
            //Now checks if there's a player ship we can move on to
            shipDestroyed = true;
            removeImage(playerCell, "u");
            moveImage(cell, playerCell, "r");
            moveObject(cell, playerCell, "r");
            endGame("Robot destroyed ship");
            return;
        }
    }

    //Now we check if there are any inactive mines we can disable
    /*We'll create a list of cells with mines that we can pick at random. If we just go for the first one we find
      the behaviour will be too predictable*/

    const mineArray = [];
    surroundingCells.forEach(item => {
        if (item.objectType === "m") {
            mineArray.push(item);
        }
    });
    if (mineArray.length > 0) {
        let index = random(0, mineArray.length);
        let chosenMine = mineArray[index];
        moveObject(cell, chosenMine, "r");
        inactiveMineCount--;
        removeImage(chosenMine, "m");
        moveImage(cell, chosenMine, "r");
        nextRound();
        return chosenMine;
    }

    //Now we go through the list of cells that we can move to and see which one will get us closest to the player
    let coordArray = [];
    surroundingCells.forEach(item => {
        coordArray.push(item.placement);
    });

    //If the ship can't move we just stop here.
    if (coordArray.length === 0) {
        return;
    }

    //We get the coordinates of the cell that are the closest distance to the player and isn't adjacent to an activated mine
    let newCellCoords = getClosestCoords(coordArray, playerPosition);

    /*If it returns an empty array, it means all adjacent cells are next to an activated mine, so it doesn't matter where
     we move as it'll be destroyed either way, so we just go for the first one in the list*/
    if (newCellCoords.length === 0) {
        newCellCoords = coordArray[0];
    }

    let newCell = getCell(newCellCoords);
    moveObject(cell, newCell, "r");
    moveImage(cell, newCell, "r");
    return newCell;
}

function moveRobotShips() {
    for (let i = 0; i < robotShips.length; i++) {
        //Moves the robot ship, and adds the new location to the robot ship array.
        robotShips.push(moveRobotShip(robotShips[i]));
        //Removes old location from the array.
        robotShips.splice(i, 1);
    }

    nextRound();
}

/*This checks if a cell is adjacent to an activated mine. The instructions were somewhat unclear, but I took them to mean
  that this should not include diagonals.*/
function isByActivatedMine(cell) {
    let cellArray = getSurroundingCells(cell, false);
    for (let i = 0; i < cellArray.length; i++) {
        if (cellArray[i].objectType === "am") {
            return true;
        }
    }

    return false;
}

//This is to calculate which cell we can move to that will get us closest to the player
//The allowMineAdjacent variable defines whether it will return coordinates that are adjacent to activated mines
function getClosestCoords(coordArray, targetCoords) {
    //Just set to an arbitrary high number, so it always gets overwritten.
    let minDistance = 10000;
    //Stores the chosen coords
    let chosenCoords = [];
    for (let i = 0; i < coordArray.length; i++) {
        let current = coordArray[i];
        let distance = getDistance(current, targetCoords);
        if (distance < minDistance) {
            //checks if its next to an activated mine. If it is, we don't want to move there, so it isn't counted.
            if (!isByActivatedMine(getCell(current))) {
                minDistance = distance;
                chosenCoords = coordArray[i];
            }
        }
    }

    return chosenCoords;
}

//Calculate the distance between 2 points
function getDistance(c1, c2) {
    let difx = Math.abs(c1[0] - c2[0]);
    let dify = Math.abs(c1[1] - c2[1]);
    let dsquared = Math.pow(difx, 2) + Math.pow(dify, 2);
    return Math.sqrt(dsquared);
}

//This function was taken from https://www.w3schools.com/js/js_random.asp because javascript random doesn't natively support bounds
function random(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

//Robot or User defines whether to use the robot directions array or user directions array.
//It takes true to mean robot directions, false to mean user directions.
function getSurroundingCells(cell, robotOrUser) {
    const surroundingCells = [];
    let directions = robotOrUser ? robotDirections : userDirections;
    //For each direction, it checks if the cell exists (if it's out of bounds it returns null) and adds to list if it does.
    directions.forEach(item => {
        let newCell = getCellInDirection(cell, item);
        if (newCell !== null) {
            surroundingCells.push(newCell);
        }
    });

    return surroundingCells;
}

function beginGame() {
    if (!shipPlaced) {
        alert("You must place a User Ship before beginning the game!");
    } else if (inactiveMineCount === 0) {
        endGame("No more mines");
    } else if (robotShipCount === 0) {
        endGame("No more robot ships")
    } else {
        gameState = 1;
        let startButton = document.getElementById("beginButton");
        startButton.style.display = "none";

        let statText = document.getElementById("statText");
        updateStats(statText);
        statText.style.display = "inline";

        let endButton = document.getElementById("endButton");
        endButton.style.display = "inline";

        document.addEventListener('keydown', move);
    }
}

function endGame(reason) {
    document.removeEventListener('keydown', move);
    console.log("Game over: " + reason);
}

//grabs a cell from a set of coordinates
function getCell(coord1, coord2) {
    /*The function can either accept a coordinate array or individual coordinates, so we check if a second value has
     been passed in. If it has we assume individual coordinates, else we assume an array*/
    return coord2 === undefined ? boardArray[coord1[0]][coord1[1]] : boardArray[coord1][coord2];
}

//When player tries to move their character, this is called.
function move(e) {
    if (e.key.length === 1) {
        //Uses .slice else it just makes a shallow copy
        let newLocation = playerPosition.slice();
        switch (e.key) {
            case "a":
                newLocation[1] = newLocation[1] - 1;
                break;
            case "d":
                newLocation[1] = newLocation[1] + 1;
                break;
            case "w":
                newLocation[0] = newLocation[0] - 1;
                break;
            case "s":
                newLocation[0] = newLocation[0] + 1;
                break
            default:
                alert("Please choose a valid direction!");
                break;
        }

        //checks if the player would go off the board
        if (!validLocation(newLocation)) {
            alert("This would hit the laser! Miss your turn!");
            moveRobotShips("375");
            return;
        }

        //grabs the cell the player wants to move to, so we can check what's in it and react accordingly
        let newCell = getCell(newLocation);
        if (newCell.objectType === "a") {
            alert("This would hit an asteroid! Miss your turn!");
            moveRobotShips("383");
            return;
        } else if (newCell.objectType === "m") {
            if (newCell.isActive === false) {
                newCell.isActive = true;
                activateMine(newCell);
            }
        } else if (newCell.objectType === 'r') {
            shipDestroyed = true;
            endGame("Robot Destroyed Ship");
            return;
        }

        let playerCell = getCell(playerPosition);
        moveImage(playerCell, newCell, "u");
        playerPosition = newLocation;
    }

    moveRobotShips("401");
}

//Returns whether the coordinates are on the board
function validLocation(coord1, coord2) {
    let x, y;
    if (coord2 === undefined) {
        x = coord1[0];
        y = coord1[1];
    } else {
        x = coord1;
        y = coord2;
    }

    return ((x >= 0 && x < columnSize) && (y >= 0 && y < rowSize));
}

//This is called when the user activates a mine
function activateMine(cell) {
    inactiveMineCount--;
    //Changes the image to the active mine
    moveImage(cell, cell, "am");
    //Grab surrounding cells
    /*NOTE: Assignment requirements were somewhat unclear, but I interpreted surrounding cells to
      mean not including diagonals*/
    const cellDirections = getSurroundingCells(cell, false);

    //Loops through the list of surrounding cells and destroys all mines and robot ships.
    cellDirections.forEach(adjacentCell => {
        if (adjacentCell.objectType === "r") {
            robotShipCount--;
            if (robotShipCount === 0) {
                endGame("No more robot ships");
            }
            removeImage(adjacentCell, 'r');
        } else if (adjacentCell.objectType === 'a') {
            removeImage(adjacentCell, 'a');
        }
    });
    updateStats();
}

//Grabs the cell in the specified direction
function getCellInDirection(currentCell, direction) {
    direction = direction.toLowerCase();
    const cellLocation = currentCell.placement;
    let x = cellLocation[0];
    let y = cellLocation[1];
    let newX = x;
    let newY = y;
    switch (direction) {
        case "left":
            newY--;
            break;
        case "right":
            newY++;
            break;
        case "up":
            newX--;
            break;
        case "down":
            newX++;
            break;
        case "downleft":
            newX++;
            newY--;
            break;
        case "downright":
            newX++;
            newY++;
            break;
        case "upleft":
            newX--;
            newY--;
            break;
        case "upright":
            newX--;
            newY++;
            break;
    }


    //Checks that the new value is within the bounds of the grid. If it isn't, null is returned.
    return validLocation(newX, newY) ? getCell(newX, newY) : null;

}

//begins the next round
function nextRound() {
    if (robotShipCount === 0) {
        endGame("No more robot ships");
    } else if (inactiveMineCount === 0) {
        endGame("No more mines");
    } else if (isDeadlocked()) {
        endGame("Board is deadlocked.")
    }
    round += 1;
    updateStats();
}

function updateStats() {
    const statText = document.getElementById("statText");
    statText.innerHTML = "Round: " + round + "<br>Inactive Mines: " + inactiveMineCount + "<br>Robot Ships: " + robotShipCount;
}

//Code for the help modal
let helpModal;


//Open the help modal
function openHelp() {
    helpModal = document.getElementById("helpModal");
    helpModal.style.display = "block";
}

//close the modal
function closeHelp() {
    helpModal.style.display = "none";
}
