//NOTE: the region and endregion tags are specific to the IDE I use and are just there to make navigation easier whilst programming

//region Variable Declarations
//These keep track of the number of inactive mines and robot ships
let inactiveMineCount = 0
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
let boardArray = new Array(rowSize);
createBoardArray();
//Defines the directions that the user and robot can move in
const userDirections = ["up", "down", "left", "right"],
    robotDirections = ["up", "down", "left", "right", "downleft", "downright", "upleft", "upright"];
//An array of all the Robot ships, so we can interact with them
let robotShips = [];
//Keeps track of what page in help the player is on
let helpPage = 1;
//endregion

//region General Helper Functions

//This displays alerts to the user in a nicer way than standard js alerts
function alertUser(content) {
    let alert = document.getElementById("alert");
    alert.innerHTML = "<p>" + content + "</p>";
    alert.classList.add("active");
    setTimeout(function () {
        alert.classList.remove("active");
    }, 2500);
}

/*This function was taken from https://www.w3schools.com/js/js_random.asp because javascript doesn't natively support bounds,
and I didn't want to figure out the maths for it myself.*/
function random(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

//Creates a new image and adds it into the specified cell.
function addImage(cell, name) {
    let img = document.createElement('img');
    img.style.width = "45%";
    img.src = "images/" + name + ".png";
    cell.appendChild(img);
}

//Removes the specified image from the specified cell
function removeImage(cell, name) {
    let imageString = '<img src="images/' + name + '.png" style="width: 45%;">'
    //IE11 forms the HTML differently, so we do for both
    let altString = '<img style="width: 45%;" src="images/' + name + '.png">'
    cell.innerHTML = cell.innerHTML.replace(imageString, "");
    cell.innerHTML = cell.innerHTML.replace(altString, "");

}

//Returns whether there is already an object present in the cell. Used to prevent the player from adding multiple objects to one cell during setup stage
function hasObject(cell) {
    return (cell.objectType !== "n");
}

//Updates the stats display on the page
function updateStats() {
    const statText = document.getElementById("statText");
    statText.innerHTML = "Round: " + round + "<br>Inactive Mines: " + inactiveMineCount + "<br>Robot Ships: " + robotShips.length;
}

//Checks if the game is deadlocked
function isDeadlocked() {

    if (canMove(getCell(playerPosition), false)) {
        return false;
    }

    for (let i = 0; i < robotShips.length; i++) {
        const item = robotShips[i];
        if (canMove(item, true)) {
            return false;
        }
    }

    return true;
}


//endregion

//region Movement Helper Functions

//Moves the specified image from one specified cell to another
function moveImage(oldCell, newCell, name) {
    removeImage(oldCell, name);
    addImage(newCell, name);
}

//moves a specified object from specified one cell to another
function moveObject(oldCell, newCell, name) {
    oldCell.objectType = "n";
    newCell.objectType = name;
}

//checks if the item in the cell can move, it takes True to mean robot and false to mean user.
function canMove(cell, robotOrUser) {
    const surroundingCells = getSurroundingCells(cell, robotOrUser);

    for (let i = 0; i < surroundingCells.length; i++) {
        const item = surroundingCells[i];
        if (item.objectType !== "a" && item.objectType !== "r") {

            return true;
        }
    }

    return false;
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

//endregion

//region Cell Grab Functions

//Retrieves a cell from the board array from the given coordinates
function getCell(coord1, coord2) {
    /*The function can either accept a coordinate array or individual coordinates, so we check if a second value has
     been passed in. If it has we assume individual coordinates, else we assume an array*/
    return coord2 === undefined ? boardArray[coord1[0]][coord1[1]] : boardArray[coord1][coord2];
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

//Robot or User defines whether to use the robot directions array or user directions array.
//It takes true to mean robot directions, false to mean user directions.
function getSurroundingCells(cell, robotOrUser) {
    const surroundingCells = [];
    let directions = robotOrUser ? robotDirections : userDirections;
    //For each direction, it checks if the cell exists (if it's out of bounds it returns null) and adds to list if it does.
    for (let i = 0; i < directions.length; i++) {
        let newCell = getCellInDirection(cell, directions[i]);
        if (newCell !== null) {
            surroundingCells.push(newCell);
        }
    }

    return surroundingCells;
}

//endregion

//region Game State Functions

//Puts the game into play mode
function beginGame() {
    //Updates the game state to reflect that the game is now in the play stage
    gameState = 1;
    //Checks that user ship is placed and alert the user if not
    if (!shipPlaced) {
        //Puts the game back into setup mode
        gameState = 0;
        alertUser("You must place a User Ship before beginning the game!");
        //Checks if the game should be immediately ended. If not, finishes setup
    } else if (!isGameOver()) {
        updateStats();
        document.getElementById("beginButton").style.display = "none";
        document.getElementById("statText").style.display = "inline";
        document.getElementById("endButton").style.display = "inline";
        document.addEventListener('keydown', move);
    }
}

//Puts the game into game end mode
function endGame(reason) {
    //Checks that we're in play state. It deals with a bug where in certain situations it would count as 2 wins.
    if (gameState === 1) {
        gameState = 3;
        //Defines the text for the game outcome, and the text for whether the ship survived, to be displayed on the end screen.
        let result, shipSurvivedText;

        //Checks the number of robot ships on the board and whether the player ship survived to determine the outcome.
        if (!shipDestroyed) {
            shipSurvivedText = "Your ship survived."
            if (robotShips.length === 0) {
                result = "You Win"
                //If browser supports local storage we update the lifetime stats
                if (typeof (Storage) !== undefined) {
                    /*Grabs the total wins, increments it by one, and adds the new value back into local storage
                    We take advantage of type coercion here by allowing javascript to treat null as 0
                    Local Storage only sends an accepts strings, so we have to convert to a number to do the addition
                    and then convert back into a string before it can be placed back into storage*/
                    localStorage.setItem("totalWins", String(Number(localStorage.getItem("totalWins")) + 1));
                }
            } else {
                result = "Draw"
            }
        } else {
            shipSurvivedText = "Your ship was destroyed."
            if (robotShips.length === 0) {
                result = "Draw"
            } else {
                result = "You lose"
                if (typeof (Storage) !== undefined) {
                    localStorage.setItem("totalLosses", String(Number(localStorage.getItem("totalLosses")) + 1));
                }
            }
        }


        let winLoseText = document.getElementById("winLoseText");
        winLoseText.innerHTML = "<p id='loseOrWinText'>" + result + "! </p>" + "<p id='gameEndReason'>" + reason + "</p>";
        let endStats = document.getElementById("endStats");
        endStats.innerHTML = "<p>" + shipSurvivedText + "</p>" + "<p>Remaining Robot Ships: " + robotShips.length + "</p>" + "<p>Remaining Inactive Mines: " + inactiveMineCount + "</p>" + "<p>You went for " + round + " rounds.</p> "

        //If the browser supports local storage, the game will keep track of their lifetime wins and losses.
        if (typeof (Storage) !== undefined) {
            let totalStats = document.getElementById("totalStats");
            /* <p style="float: left">Total Wins: 3</p>
            <p style="float:right">Total Losses: 5</p>*/

            /*Gets the total wins and losses from LocalStorage. We have to do that here even though we already grabbed them above
              as only certain numbers get grabbed depending on the game outcome. We cast to number to convert null to 0*/
            let totalWins = Number(localStorage.getItem("totalWins")),
                totalLosses = Number(localStorage.getItem("totalLosses"));
            totalStats.innerHTML = "<p style='float:left'>Total Wins: " + totalWins + "</p>" + "<p style='float:right'>Total Losses: " + totalLosses + "</p>";
            /*If the browser doesn't support local storage, the div never has any text inserted and remains invisible to the user
              So we don't need to do anything to handle it.*/
        }


        let elements = document.getElementsByClassName("changeDisplayAtEnd");
        //0 - game, 1- endscreen, 2 - controls
        elements[0].style.display = "none";
        elements[2].style.display = "none";
        elements[1].style.display = "block";
        winLoseText.style.display = "block";
    }

}

//Checks if the game should end
function isGameOver() {
    if (shipDestroyed && robotShips.length === 0) {
        endGame("There are no ships left on the board!");
        return true;
    } else if (shipDestroyed) {
        endGame("Your ship was destroyed!");
        return true;
    } else if (inactiveMineCount === 0 && robotShips.length === 0) {
        endGame("Only your ship remains!");
        return true;
    } else if (inactiveMineCount === 0) {
        endGame("There are no more inactive mines!");
        return true;
    } else if (robotShips.length === 0) {
        endGame("You destroyed all the robot ships!");
        return true;
    } else if (isDeadlocked()) {
        endGame("Nobody can move!");
        return true;
    }
    return false;
}

//begins the next round
function nextRound() {
    //checks if game should end
    isGameOver();
    //If not update the round and update the stats
    round += 1;
    updateStats();
}

//Puts the board back to the default state and takes the user to the setup stage
function restart() {
    document.getElementById("game").innerHTML = "";
    inactiveMineCount = 0;
    gameState = 0;
    shipPlaced = false;
    shipDestroyed = false;
    round = 1;
    boardArray = new Array(rowSize);
    robotShips = [];
    createBoardArray();
    setupTable();

    document.getElementById("endScreen").style.display = "none";
    document.getElementById("game").style.display = "block";
    document.getElementById("beginButton").style.display = "inline";
    document.getElementById("statText").style.display = "none";
    document.getElementById("endButton").style.display = "none";
    document.getElementById("controls").style.display = "block";
    document.removeEventListener('keydown', move);

}

//endregion

//region Setup Stage Functions

//Creates the 2d array as javascript doesn't support the x[][] initializer
function createBoardArray() {
    for (let i = 0; i < 10; i++) {
        boardArray[i] = new Array(columnSize);
    }
}

//Creates the table that's displayed to the user according to the size variables, and appends it to the game div
function setupTable() {
    //Create table elements
    let table = document.createElement('table');
    let tbody = document.createElement('tbody');
    table.appendChild(tbody);

    //Create the number of rows defined in rowSize
    for (let i = 0; i < rowSize; i++) {
        let tr = document.createElement('tr');
        //In each row, create the number of columns defined in column size
        for (let j = 0; j < columnSize; j++) {
            let td = document.createElement('td');
            //Stores the location of the cell, so we can easily reference it in our boardArray
            td.placement = [i, j];
            //Cell Styling
            td.style.verticalAlign = "middle";
            td.style.textAlign = "center";
            //Adds the event listener so that we can interact with the cell
            td.addEventListener("click", function () {
                cellClick(td);
            });
            //Sets the object type to no object by default
            td.objectType = "n";
            //Adds the cell to the board array, so it can easily be referenced in code
            boardArray[i][j] = td;
            //Appends the cell to the table row
            tr.appendChild(td);
        }
        //Appends the row to the table
        tbody.appendChild(tr);
    }
    //Appends the table to the game div
    document.getElementById('game').appendChild(table);
}

//All the code for adding objects to cells in the setup stage, called when a cell is clicked
function cellClick(cell) {
    //Checks that we're in setup mode, else we don't want the user to modify the board
    if (gameState === 0) {
        /*Sets a tab index. This needs to be done before
        you can call cell.focus(). The number is arbitrary irrelevant*/
        cell.setAttribute('tabIndex', 9999);
        //Calls the selected cell into focus, so it can listen for keyboard input.
        cell.focus()

        //Adds the keyboard input listener
        cell.addEventListener("keydown", function (e) {
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

                It was easier to use just letters rather than full names as I can then just assign the value of the users keypress.*/


            /*Checks the length of the input text is equal to 1
              It's a quick and easy way to filter out control keys*/
            if (e.key.length === 1) {
                let validKey = true;
                switch (e.key.toLowerCase()) {
                    //Responds according to which key the user pressed
                    case "u":
                        //If they are it makes sure they haven't already placed one
                        if (shipPlaced) {
                            //If a ship is placed it will alert the user and then the return stops the rest of the code
                            //from running.
                            alertUser("You can only place 1 user ship!");
                            return;
                            //checks if the cell already contains an object, as they may only contain one during the setup stage
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

                            robotShips.push(cell);
                        }
                        break;
                    case "a":
                        break;
                    default:
                        validKey = false;
                        alertUser("Please press a valid key!")

                }

                //Adds the corresponding image to the cell
                if (!hasObject(cell) && validKey) {
                    addImage(cell, e.key);
                    cell.objectType = e.key;
                }

            }
        }, true);
    }
}


//endregion

//region Play Stage Functions

//When player tries to move their character, this is called.
function move(e) {
    if (e.key.length === 1) {
        let validKey = true;
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
                validKey = false;
                alert("Please move in a valid direction!")
                break;
        }

        if (validKey) {
            //checks if the player would go off the board
            if (!validLocation(newLocation)) {
                alertUser("This would hit the laser!<br>Miss your turn!");
                moveRobotShips();
                return;
            }

            //grabs the cell the player wants to move to, so we can check what's in it and react accordingly
            let newCell = getCell(newLocation);
            if (newCell.objectType === "a") {
                alertUser("This would hit an asteroid!<br>Miss your turn!");
                moveRobotShips();
                return;
            } else if (newCell.objectType === "m") {
                if (newCell.isActive === false) {
                    newCell.isActive = true;
                    activateMine(newCell);
                }
            } else if (newCell.objectType === 'r') {
                shipDestroyed = true;
                endGame("Your ship was destroyed!");
                return;
            }

            let playerCell = getCell(playerPosition);
            moveImage(playerCell, newCell, "u");
            playerPosition = newLocation;
            moveRobotShips();
        }

    }


}


//Moves a specified robot ship, should only be called by moveRobotShips
function moveRobotShip(cell) {
    //Create an array of all the surrounding cells
    const surroundingCells = getSurroundingCells(cell, true);
    //Removes cells with asteroids and other robot ships from the array, as we can't move there.
    const playerCell = getCell(playerPosition);
    //Stores a list of cells that the ship can actually move to (removed asteroid cells and other robot ship cells)
    const validCells = [];
    for (let i = 0; i < surroundingCells.length; i++) {
        if (surroundingCells[i].objectType !== "a" && surroundingCells[i].objectType !== "r") {
            if (surroundingCells[i] === playerCell) {
                //Now checks if there's a player ship we can move on to
                shipDestroyed = true;
                removeImage(playerCell, "u");
                if (playerCell.isDeadly) {
                    removeImage(cell, "r");
                    cell.objectType = "n";
                    robotShips.splice(robotShips.indexOf(cell), 1);

                }
                //We know the game is definitely over but this allows us to check if any other endstate conditions are met
                isGameOver();
                return;
            }
            validCells.push(surroundingCells[i]);
        }


    }

    //Now we check if there are any inactive mines we can disable
    /*We'll create a list of cells with mines that we can pick at random. If we just go for the first one we find
      the behaviour will be too predictable*/

    const mineArray = [];
    for (let i = 0; i < validCells.length; i++) {
        const item = validCells[i];
        if (item.objectType === "m") {
            mineArray.push(item);
        }
    }
    if (mineArray.length > 0) {
        let index = random(0, mineArray.length);
        let chosenMine = mineArray[index];
        moveObject(cell, chosenMine, "r");
        inactiveMineCount--;
        removeImage(chosenMine, "m");
        moveImage(cell, chosenMine, "r");
        return chosenMine;
    }

    /*If there are no mines, we go through the list of cells that we can move to and see which one will
      get us closest to the player*/
    let coordArray = [];
    for (let i = 0; i < validCells.length; i++) {
        const item = validCells[i];
        coordArray.push(item.placement);
    }

    //If the ship can't move we just stop here.
    if (coordArray.length === 0) {
        return null;
    }

    //We get the coordinates of the cell that are the closest distance to the player and isn't adjacent to an activated mine
    let newCellCoords = getClosestCoords(coordArray, playerPosition);

    /*If it returns an empty array, it means all adjacent cells are next to an activated mine, so it doesn't matter where
     we move as it'll be destroyed either way, so we just go for the first one in the list*/
    if (newCellCoords.length === 0) {
        newCellCoords = coordArray[0];
    }

    let newCell = getCell(newCellCoords);
    if (newCell.isDeadly) {
        removeImage(cell, "r");
        cell.objectType = "n";
        return -1;
    } else {
        moveObject(cell, newCell, "r");
        moveImage(cell, newCell, "r");
    }

    return newCell;
}

//Moves all robot ships on the board
function moveRobotShips() {
    for (let i = 0; i < robotShips.length; i++) {
        //Runs the moveRobotShip method and if the ship can move it updates the location in the robot ship array
        let result = moveRobotShip(robotShips[i]);
        if (result !== null) {
            robotShips[i] = result;
        }
    }

    /*Removes the destroyed ships from the array. Destroyed ships are set as -1 in the move RobotShip function.
      I've done it like this because changing the length of an array while you're looping through it is a nightmare*/
    robotShips = robotShips.filter(function (x) {
        return x !== -1;
    })

    nextRound();
}

//This is to calculate which cell we can move to that will get us closest to the player
//The allowMineAdjacent variable defines whether it will return coordinates that are adjacent to activated mines
function getClosestCoords(coordArray, targetCoords) {
    //Just set to an arbitrary high number, so it always gets overwritten.
    let minDistance = 10000;
    //Stores the chosen coords
    let chosenCoords = [];
    for (let i = 0; i < coordArray.length; i++) {
        //checks if its next to an activated mine. If it is, we don't want to move there, so it isn't counted.
        if (!(getCell(coordArray[i]).isDeadly)) {
            let distance = getDistance(coordArray[i], targetCoords);
            if (distance < minDistance) {
                minDistance = distance;
                chosenCoords = coordArray[i];
            }
        }
    }

    return chosenCoords;
}

//Calculate the distance between 2 points, used in the getClosestCoords Function
function getDistance(c1, c2) {
    //Basic equation for finding distance between points: D^2 = Difference between Xs ^2 + Difference between Ys ^2
    let difx = Math.abs(c1[0] - c2[0]);
    let dify = Math.abs(c1[1] - c2[1]);
    return Math.sqrt(Math.pow(difx, 2) + Math.pow(dify, 2));
}

//This is called when the user activates a mine
function activateMine(cell) {
    inactiveMineCount--;
    //Changes the image to the active mine
    removeImage(cell, "m");
    addImage(cell, "am");
    cell.objectType = "am";

    //Grabs a list of the surrounding cells, so we can tag them as deadly
    let surroundingCells = getSurroundingCells(cell, true);

    for (let i = 0; i < surroundingCells.length; i++) {
        surroundingCells[i].isDeadly = true;
    }
    mineExplosion(cell);
}

/*Destroys Robot Ships and Asteroids in cells surrounding the given cell. Called when a mine is first activated, after
 which we just check the isDeadly tag on a cell when trying to move onto it.*/
function mineExplosion(cell) {
    //Grab surrounding cells
    /*NOTE: Assignment requirements were somewhat unclear, but I interpreted surrounding cells to
      mean including diagonals*/
    const cellDirections = getSurroundingCells(cell, true);

    //Loops through the list of surrounding cells and destroys all mines and robot ships.
    for (let i = 0; i < cellDirections.length; i++) {
        const adjacentCell = cellDirections[i];
        if (adjacentCell.objectType === "r") {
            robotShips.splice(robotShips.indexOf(adjacentCell), 1);
            removeImage(adjacentCell, 'r');
            if (robotShips.length === 0) {
                endGame("You destroyed all the robot ships!");
                return;
            }
        } else if (adjacentCell.objectType === 'a') {
            removeImage(adjacentCell, 'a');
        }
    }
    updateStats();

}

//endregion

//region Help Modal Functions

//This needed to be defined outside any individual function else I ran into issues of it being undefined
let helpModal;


//Open the help modal
function openHelp() {
    helpModal = document.getElementById("helpModal");
    helpModal.style.visibility = "visible";
    helpModal.style.opacity = "1";
}

//close the modal
function closeHelp() {
    helpModal.style.opacity = "0";
    helpModal.style.visibility = "hidden";
}

//This changes the page in the help modal
function helpChangePage(page) {
    //Grabs a list of all the help pages
    let pages = document.getElementsByClassName("helpPage");
    //Grabs a list of all the pagination buttons
    let buttons = document.getElementsByClassName("helpPageBtn");

    //Remove the active tag from all the buttons
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove("active");
    }

    //Hides all the help pages
    for (let i = 0; i < pages.length; i++) {
        pages[i].style.display = "none";
    }
    switch (page) {
        //Previous page
        case -1:
            //Calls the function again with the new page number
            helpPage--;
            helpChangePage(helpPage);
            break;
        //Next Page
        case -2:
            helpPage++;
            helpChangePage(helpPage);
            break;
        //Page 1
        case 1:
            helpPage = 1;
            //Shows then next page button
            //Uses the visibility attribute rather than display so that the remaining buttons have consistent placement
            buttons[4].style.visibility = "visible";
            //Hides the previous page button
            buttons[0].style.visibility = "hidden";
            //Sets page 1 to the active button
            buttons[1].classList.add("active");
            //Display page 1
            pages[0].style.display = "block";
            break;
        case 2:
            helpPage = 2;
            //Shows the next page button
            buttons[4].style.visibility = "visible";
            //Shows the previous page button
            buttons[0].style.visibility = "visible";
            //Sets page 2 to active button
            buttons[2].classList.add("active");
            //Display page 2
            pages[1].style.display = "block";
            break;
        case 3:
            helpPage = 3;
            //Hides the next page button
            buttons[4].style.visibility = "hidden";
            //Shows the previous page button
            buttons[0].style.visibility = "visible";
            //Sets page 3 to active button
            buttons[3].classList.add("active");
            //Display page 3
            pages[2].style.display = "block";
    }


}

//endregion

