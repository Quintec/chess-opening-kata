
let game = new Chess();
let model_game = new Chess();
let opening = null;
let moves = [];
let openingDict = {};
let reset = false;
let win = false;

window.onload = async() => {
    async function parseOpeningTsv(fileName) {
        let tsv = await fetch("./data/" + fileName)
            .then(response => response.text());

        let openingData = tsv.trim().split('\n').map(function(line) {
            return line.split('\t');
        });

        for (let i = 0; i < openingData.length; i++) {
            let opening = openingData[i];
            openingDict[opening[0]] = opening;
        }
    }

    for (let name of ["a.tsv", "b.tsv", "c.tsv", "d.tsv", "e.tsv"]) {
        await parseOpeningTsv(name);
    }

    function resetState() {
        reset = false;
        win = false;
        game.reset();
        model_game.reset();
        board.start();
        let ecos = Object.keys(openingDict);
        let eco = ecos[Math.floor(Math.random() * ecos.length)];
        opening = openingDict[eco];
        moves = PgnParser.parse(opening[2])[0].moves;
        document.getElementById("name").innerHTML = opening[0] + ": " + opening[1];
    }

    function onDrop(source, target, piece, newPos, oldPos, orientation) {
        let move = game.move({
            from: source,
            to: target,
            promotion: 'q'
        });
        if (move === null) return 'snapback';
        let pass = makeCorrectMove();
        if (!pass) {
            game.undo();
            reset = true;
            return 'snapback';
        }
    }
    
    function onSnapEnd() {
        board.position(game.fen());
        if (win) {
            alert("You win!");
            resetState();
        }
    }

    function onSnapbackEnd() {
        if (reset) {
            resetState();
        }
    }
    
    function makeCorrectMove() {
        let move = moves.shift();
        let move_obj = model_game.move(move.notation.notation);
        if (move_obj === null) {
            console.log("Invalid correct move: " + move.notation.notation);
            return;
        }
        if (model_game.fen() !== game.fen()) {
            model_game.undo();
            moves.unshift(move);
            return false;
        }

        if (moves.length === 0) {
            win = true;
        }

        return true;
    }
    
    let board = Chessboard("board", {
        draggable: true,
        position: "start",
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
        onSnapbackEnd: onSnapbackEnd
    });

    resetState();
};