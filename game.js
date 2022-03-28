//This contains the letters that the user can use in the setup stage
//It's defined here for use later
let allowedLetters = ["a", "m", "r", "u"];

//This boolean keeps track of if there is a player ship places
let shipPlaced = false;

/*Creates the initial table. This technically doesn't need to be done in JS
  but it seemed easier than doing it in HTML*/
function setupTable() {
    let table = document.createElement('table');
    let tbody = document.createElement('tbody');
    table.appendChild(tbody);

    for (let i = 0; i < 10; i++) {
        let tr = document.createElement('tr');

        for (let j = 0; j < 10; j++) {
            let th = document.createElement('th');

            //adds the event listener so that we can interact with the cell
            th.vAlign = "middle";
            th.align = "center";
            th.addEventListener("click", () => cellClick(th));
            tr.appendChild(th);
        }
        tbody.appendChild(tr);
    }


    //Runs when you click on a cell
    function cellClick(cell) {
        //Checks if the cell already contains an object.
        //If it doesn't, we set up the event listener.
            /*Sets a tab index. This needs to be done before
            you can call cell.focus(). The number is irrelevant*/
            cell.setAttribute('tabIndex', 9999);
            //Calls the selected cell into focus so it can listen for keyboard input
            cell.focus()


            //Adds the keyboard input listener
            cell.addEventListener("keydown", function (e) {


                /*Checks the length of the input text.
                  It's a quick and easy way to filter out control keys*/
                if (e.key.length === 1) {
                    //Checks the allowed letters array to see if they've pressed a valid key
                    if (allowedLetters.includes(e.key)) {
                        //checks if they're trying to place a user ship
                        if (e.key === "u") {
                            //If they are it makes sure they haven't already placed one
                            if (shipPlaced) {
                                //If a ship is placed it will alert the user and then the return stops the rest of the code
                                //from running.
                                alert("You can only place 1 user ship!");
                                return;
                            } else {
                                shipPlaced = true;
                            }
                        }
                        //Adds the corresponding image to the cell
                        if(!hasObject(cell)) {
                            addImage(cell, e.key);
                        }
                    } else {
                        alert("Please press a valid letter!")
                    }
                }
            }, true);

    }

    //Creates a new image and adds it into the specified cell.
    function addImage(cell, name) {
        let img = document.createElement('img');
        img.style.width = "45%";
        img.src = "images/" + name + ".png";
        cell.appendChild(img);
    }

    //Checks if a cell already contains an object
    function hasObject(cell) {
        console.log(cell.innerHTML);
        //This checks if the cell has an image tag inside it.
        //If it does, we can assume there is an object in it.
        return (cell.innerHTML.includes("<img src"));
    }

    function beginGame(){
        if(!shipPlaced){
            alert("You must place a User Ship before beginning the game!")
        }
    }

    function getCellType(cell){
        let data = cell.innerHTML;

        if(data.includes("a.png")){
            return "Asteroid"
        }else if (data.includes("m.png")){
            return "Mine"
        }else if(data.includes("u.png")){
            return "userShip"
        }else if(data.includes("r.png")){
            return "robotShip";
        }else{
            return null;
        }
    }

    document.getElementById('game').appendChild(table);
}


