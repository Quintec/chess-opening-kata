
let game = new Chess();
let model_game = new Chess();
let board = null;

let opening = null;
let moves = [];
let openingDict = {};

let reset = false;
let win = false;

let tries = 0;
let wins = 0;
let whiteMove = true;

function resetState(q_eco) {
    reset = false;
    win = false;
    whiteMove = true;
    game.reset();
    model_game.reset();
    board.start();
    let eco = q_eco || null;
    if (eco === null) {
        let ecos = Object.keys(openingDict);
        eco = ecos[Math.floor(Math.random() * ecos.length)];
    }

    let url = new URL(window.location.href);
    url.searchParams.set("eco", eco);
    document.getElementById("share").href = url.href;

    opening = openingDict[eco][Math.floor(Math.random() * openingDict[eco].length)];
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
    let move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });
    if (move === null) return 'snapback';
    let pass = makeCorrectMove(piece, target);
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
        wins++;
        tries++;
        updateStats();
        setTimeout(() => {
            resetState();
        }, 370);
    }
}

function onSnapbackEnd() {
    if (reset) {
        document.getElementById("status").innerHTML = "❌";
        document.getElementById("pgn").innerHTML = opening[2];
        document.getElementById("pgn").style.color = "red";
        document.getElementById("next").innerHTML = "<a>▶️</a>";
        tries++;
        updateStats();
    }
}

function updateStats() {
    document.getElementById("tries").innerHTML = tries;
    document.getElementById("wins").innerHTML = wins;
    localStorage.setItem("tries", tries);
    localStorage.setItem("wins", wins);
}

function moveDataToStr(fig, pos) {
    if (fig[1] === 'P') {
        return pos;
    } else {
        return fig[1] + pos;
    }
}

function makeCorrectMove(piece, newPos) {
    console.log(moves);
    let currLen = moves.length;
    moves = moves.filter((move) => {
        let moveData = moveDataToStr(piece, newPos);
        return !(move.notation.notation === moveData && move.turn == piece[0].toLowerCase());
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
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
        onSnapbackEnd: onSnapbackEnd
    });

    let url = new URL(window.location.href);
    let eco = url.searchParams.get("eco");
    updateStats();
    resetState(eco);
};