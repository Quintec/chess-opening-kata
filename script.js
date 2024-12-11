
let game = new Chess();
let model_game = new Chess();
let board = null;

let opening = null;
let moves = [];
let openingDict = {};

let reset = false;
let win = false;
let loss = false;

let tries = 0;
let wins = 0;
let whiteMove = true;

function resetState(q_eco, q_name) {
    reset = false;
    win = false;
    loss = false;

    whiteMove = true;

    game.reset();
    model_game.reset();
    board.start();
    let eco = q_eco || null;
    if (eco === null) {
        let ecos = Object.keys(openingDict);
        eco = ecos[Math.floor(Math.random() * ecos.length)];
    }

    if (q_name !== null) {
        opening = openingDict[eco].find((o) => o[1] === q_name);
        if (opening === undefined) {
            opening = openingDict[eco][Math.floor(Math.random() * openingDict[eco].length)];
        }
    } else {
        opening = openingDict[eco][Math.floor(Math.random() * openingDict[eco].length)];
    }

    let url = new URL(window.location.href);
    url.searchParams.set("eco", eco);
    url.searchParams.set("name", opening[1]);
    document.getElementById("share").href = url.href;

    moves = PgnParser.parse(opening[2])[0].moves;

    document.getElementById("color").innerHTML = "⚪️";
    document.getElementById("name").innerHTML = opening[0] + ": " + opening[1];
    document.getElementById("status").innerHTML = "❓";
    document.getElementById("pgn").innerHTML = "";
    document.getElementById("pgn").style.color = "black";
    document.getElementById("next").innerHTML = "";
}

let triesStr = localStorage.getItem("tries");
if (triesStr !== null) {
    tries = parseInt(triesStr);
}
let winsStr = localStorage.getItem("wins");
if (winsStr !== null) {
    wins = parseInt(winsStr);
}

function onDrop(source, target, piece, newPos, oldPos, orientation) {
    //console.log(source, target, piece, newPos, oldPos, orientation);
    let move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });
    if (move === null) return 'snapback';
    let pass = makeCorrectMove(source, target, piece, oldPos);
    if (!pass) {
        game.undo();
        reset = true;
        return 'snapback';
    }
}

function onSnapEnd() {
    board.position(game.fen());
    document.getElementById("color").innerHTML = whiteMove ? "⚫️" : "⚪️";
    whiteMove = !whiteMove;

    document.getElementById("pgn").innerHTML = game.pgn();

    if (win) {
        document.getElementById("status").innerHTML = "✅";
        if (!loss) {
            wins++;
        }
        tries++;
        updateStats();
        setTimeout(() => {
            resetState();
        }, 370);
    }
}

function onSnapbackEnd() {
    if (reset && !loss) {
        document.getElementById("status").innerHTML = "❌";
        document.getElementById("pgn").innerHTML = opening[2];
        document.getElementById("pgn").style.color = "red";
        document.getElementById("next").innerHTML = "▶️";
        tries++;
        loss = true;
        updateStats();
    }
}

function onDragStart (source, piece, position, orientation) {
    if (loss || win) {
      return false;
    }
    return true;
}

function updateStats() {
    document.getElementById("tries").innerHTML = tries;
    document.getElementById("wins").innerHTML = wins;
    localStorage.setItem("tries", tries);
    localStorage.setItem("wins", wins);
}

function moveDataToStr(source, target, piece, oldPos) {
    if (piece[1] === 'K') {
        if (source === "e1" && target === "g1") {
            return "O-O";
        } else if (source === "e1" && target === "c1") {
            return "O-O-O";
        } else if (source === "e8" && target === "g8") {
            return "O-O";
        } else if (source === "e8" && target === "c8") {
            return "O-O-O";
        }
    } else if (piece[1] === 'P') {
        if ((piece[0] === 'w' && target[1] === '6' && source[0] !== target[0] && oldPos[target[0] + '5'] === 'bP') ||
            (piece[0] === 'b' && target[1] === '3' && source[0] !== target[0] && oldPos[target[0] + '4'] === 'wP')) {
            return source[0] + "x" + target;
        } else if (oldPos[target] === undefined) {
            return target;
        } else {
            return source[0] + "x" + target;
        }
    } else {
        if (oldPos[target] === undefined) {
            return piece[1] + target;
        } else {
            return piece[1] + "x" + target;
        }
    }
}

function makeCorrectMove(source, target, piece, oldPos) {
    //console.log(moves);
    let currLen = moves.length;
    moves = moves.filter((move) => {
        let moveData = moveDataToStr(source, target, piece, oldPos);
        return !((move.notation.notation === moveData || move.notation.notation === moveData + "+") && move.turn == piece[0].toLowerCase());
    });

    if (currLen === moves.length) {
        return false;
    }

    if (moves.length === 0) {
        win = true;
    }

    return true;
}

window.onload = async() => {
    async function parseOpeningTsv(fileName) {
        let tsv = await fetch("./data/" + fileName)
            .then(response => response.text());

        let openingData = tsv.trim().split('\n').map(function(line) {
            return line.split('\t');
        });

        for (let i = 0; i < openingData.length; i++) {
            let opening = openingData[i];
            if (openingDict[opening[0]] === undefined) {
                openingDict[opening[0]] = [];
            }

            if (!(openingDict[opening[0]].some((o) => o[1] === opening[1]))) {
                openingDict[opening[0]].push(opening);
            }
            
        }
    }

    for (let name of ["a.tsv", "b.tsv", "c.tsv", "d.tsv", "e.tsv"]) {
        await parseOpeningTsv(name);
    }

    board = Chessboard("board", {
        draggable: true,
        position: "start",
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
        onSnapbackEnd: onSnapbackEnd
    });

    let url = new URL(window.location.href);
    let eco = url.searchParams.get("eco");
    let name = url.searchParams.get("name");
    updateStats();
    resetState(eco, name);
};