class GameField extends Phaser.Scene {
    constructor() {
        super('GameField');
    }

    init () {
        this.playerMove = true;
        this.boardSize = 580;
        this.gameOver = false;
        this.field = [];
        this.updateField(5);

        this.crosses = this.add.group({ key: 'cross' });
        this.crosses.children.entries[0].destroy();
        this.circles = this.add.group({ key: 'cross' });
        this.circles.children.entries[0].destroy();
    }

    preload () {
        this.load.image('circle', 'circle.png');
        this.load.image('cross', 'cross.png');
    }

    create () {
        this.cameras.main.setBackgroundColor('#ffffff');
        this.board = this.add.grid(400, 300, this.boardSize, this.boardSize, this.cellSize, this.cellSize, 0x2b69ba);
        this.board.setInteractive();
        this.board.on('pointerdown', this.listener.bind(this));
    }

    get cellSize () {
        return this.boardSize / this.field.length;
    }

    updateField(size) {
        this.field.forEach(element => {
           while (element.length < size) element.push(''); 
        });
        while (this.field.length < size) this.field.push(new Array(size).fill(''));
    }

    listener(e, x, y) {
        if (!this.playerMove) return;

        let column = (x / (this.boardSize / this.field.length) ^ 0);
        let row = (y / (this.boardSize / this.field.length) ^ 0);
        if (this.field[row][column]) return;
    
        this.makeMove(row, column);
        if (this.gameOver) return;

        setTimeout(() => {
            this.makeAImove();
        }, Math.random() * 100);
    }

    makeAImove () {
        let {row, column} = this.getBestMove();
        this.makeMove(row, column);
    }

    makeMove (row, column) {
        let cellSize = this.cellSize;
        this.field[row][column] = this.playerMove ? 'X' : 'O';
        let sprite = this.add.sprite((column + 0.5) * cellSize + 110, (row + 0.5) * cellSize + 10, this.playerMove ? 'cross' : 'circle');

        sprite.row = row;
        sprite.column = column;
        sprite.setScale(cellSize / sprite.displayHeight * 0.6, cellSize / sprite.displayHeight * 0.6);

        this.playerMove ? this.crosses.add(sprite) : this.circles.add(sprite);

        if (this.isWon()) {
            this.gameOver = true;
            this.scene.start('GameOver', { playerMove: this.playerMove });
            return;
        }
        this.playerMove = !this.playerMove;
        this.resizeFieldIfNeeded();
    }

    getBestMove () {
        let field = this.field;
        let bestCell = { enemiesInLine: 0, row: null, column: null };
        let winMove = this.getWinMove();

        if (winMove) return { row: winMove[0], column: winMove[1] };

        for (let rowIndex = 0; rowIndex < field.length; rowIndex++) {
            let row = field[rowIndex];

            for (let columnIndex = 0; columnIndex <= row.length - 5; columnIndex++) {
                let columnCount = 0;
                let rowCount = 0;
                let badRow = false;
                let badColumn = false;

                for (let i = columnIndex; i < columnIndex + 5; i++) {

                    if (row[i] === 'O') {
                        badRow = true;
                    }
                    if (!badRow && row[i] === 'X') rowCount++;

                    if (this.field[i][rowIndex] === 'O') {
                        badColumn = true;
                    }
                    if (!badColumn && this.field[i][rowIndex] === 'X') columnCount++;
                }

                if (!badRow && bestCell.enemiesInLine < rowCount) {
                    bestCell.enemiesInLine = rowCount;
                    bestCell.row = rowIndex;
                    let tmp = row.slice(columnIndex, columnIndex + 5);
                    let idx = tmp.indexOf('');
                    if (!row[idx - 1] && !row[idx + 1]) idx = tmp.lastIndexOf('');
                    bestCell.column = idx + columnIndex;
                }
                if (!badColumn && bestCell.enemiesInLine < columnCount) {
                    bestCell.enemiesInLine = columnCount;
                    let tmp = [0, 1, 2, 3, 4].map(i => this.field[columnIndex + i][rowIndex]);
                    let idx = tmp.indexOf('');
                    if (!row[idx - 1] && !row[idx + 1]) idx = tmp.lastIndexOf('');
                    bestCell.row = idx + columnIndex;
                    bestCell.column = rowIndex;
                }
            }
        }

        let x = 0;
        let y = field.length - 5;

        while (field[x] && field[x].length > y) {
            checkDiagon(x, y);

            if (x === 0 && y !== 0) y = y - 1; 
            else if (y === 0 && x + 1 !== field.length) x += 1;
            else break;
        }

        function checkDiagon (x, y) {            
            for (let i = 0; i <= field.length - Math.max(x, y) - 5; i++) {
                let diag1Count = 0;
                let diag2Count = 0;
                let badDiag1 = false;
                let badDiag2 = false;

                for (let k = 0; k < 5; k++) {
                    if (field[x + k + i][y + k + i] === 'O') badDiag1 = true;
                    if (!badDiag1 && field[x + k + i][y + k + i] === 'X') diag1Count++;

                    if (field[field.length - (x + k + i) - 1][y + k + i] === 'O') badDiag2 = true;
                    if (!badDiag2 && field[field.length - (x + k + i) - 1][y + k + i] === 'X') diag2Count++;
                }

                if (!badDiag1 && bestCell.enemiesInLine < diag1Count) {
                    bestCell.enemiesInLine = diag1Count;
                    let tmp = [0, 1, 2, 3, 4].map(item => ({ row: (x + i + item), column: y + i + item }));
                    tmp = tmp.find(item => !field[item.row][item.column]);
                    bestCell = { ...tmp, enemiesInLine: diag1Count };
                }

                if (!badDiag2 && bestCell.enemiesInLine < diag2Count) {
                    bestCell.enemiesInLine = diag2Count;
                    let tmp = [0, 1, 2, 3, 4].map(item => ({ row: field.length - 1 - (x + i + item), column: y + i + item }));
                    tmp = tmp.find(item => !field[item.row][item.column]);
                    bestCell = { ...tmp, enemiesInLine: diag2Count };
                }
            }
        }
        if (bestCell.enemiesInLine < 2 || bestCell.row === null) {
            let avail = field.flat().map((item, i) => item ? null : i).filter(i => i !== null);
            let random = avail[Math.random() * avail.length ^ 0];
            bestCell.row = random / field.length ^ 0;
            bestCell.column = random % field.length;
        }
        return bestCell;
    }

    getWinMove () {
        let field = this.field;

        for (let rowIndex = 0; rowIndex < field.length; rowIndex++) {

            for (let columnIndex = 0; columnIndex <= field.length - 5; columnIndex++) {
                let tmp = field[rowIndex].slice(columnIndex, columnIndex + 5);
                if (tmp.join('') === 'OOOO') return [rowIndex, columnIndex + tmp.indexOf('')];
                
                tmp = [0, 1, 2, 3, 4].map(i => field[columnIndex + i][rowIndex]);
                if (tmp.join('') === 'OOOO') return [columnIndex + tmp.indexOf(''), rowIndex];
            }

            let x = 0;
            let y = field.length - 5;

            while (field[x] && field[x].length > y) {
                let res = checkDiagon(x, y);
                if (res) return res;

                if (x === 0 && y !== 0) y = y - 1; 
                else if (y === 0 && x + 1 !== field.length) x += 1;
                else break;
            }

            function checkDiagon (x, y) {
                while (field[x + 4] && field[x + 4].length > y + 4) {
                    let tmp = [0, 1, 2, 3, 4].map(item => field[x + item][y + item]);
                    if (tmp.join('') === 'OOOO') return [x + tmp.indexOf(''), y + tmp.indexOf('')];

                    tmp = [0, 1, 2, 3, 4].map(item => field[field.length - x - item - 1][y + item]);
                    if (tmp.join('') === 'OOOO') return [field.length - x - tmp.indexOf('') - 1, y + tmp.indexOf('')];

                    x++;
                    y++;
                }
            }
        }
    }

    isWon() {
        let checkFor = this.playerMove ? 'X' : 'O';
        let field = this.field;

        for (let rowIndex = 0; rowIndex < field.length; rowIndex++) {
            
            let columnCount = 0;
            let rowCount = 0;
            for (let columnIndex = 0; columnIndex < field[rowIndex].length; columnIndex++) {
                if (field[rowIndex][columnIndex] !== checkFor) rowCount = 0;
                else rowCount++;

                if (rowCount === 5) return true;
                if (columnIndex === field.length - 1) rowCount = 0;

                if (field[columnIndex][rowIndex] !== checkFor) columnCount = 0;
                else columnCount++;

                if (columnCount === 5) return true;
                if (rowIndex === field.length - 1) columnCount = 0;
            }

            let x = 0;
            let y = field.length - 5;

            while (field[x] && field[x].length > y) {
                let res = checkDiagon(x, y);
                if (res) return true;

                if (x === 0 && y !== 0) y = y - 1; 
                else if (y === 0 && x + 1 !== field.length) x += 1;
                else break;
            }

            function checkDiagon (x, y) {
                let diag1Count = 0;
                let diag2Count = 0;

                while (field[x] && field[x].length > y) {
                    if (field[x][y] !== checkFor) diag1Count = 0;
                    else diag1Count++;

                    if (field[field.length - x - 1][y] !== checkFor) diag2Count = 0;
                    else diag2Count++;

                    if (diag1Count === 5 || diag2Count === 5) return true;
                    x++;
                    y++;
                }
            }
        }
    }

    resizeFieldIfNeeded () {
        let avail = this.field.flat().map((item, i) => item ? null : i).filter(i => i !== null);
        if (this.playerMove || avail.length >= this.field.flat().length * 0.4) return;
    
        this.updateField(this.field.length + 3);

        let cellSize = this.cellSize;
        this.board.cellHeight = cellSize;
        this.board.cellWidth = cellSize;
    
        this.crosses.getChildren().concat(this.circles.getChildren()).forEach(item => {
            item.setScale(item.scale * (this.field.length - 3) / this.field.length, item.scale * (this.field.length - 3) / this.field.length)
    
            item.x = (item.column + 0.5) * cellSize + 110;
            item.y = (item.row + 0.5) * cellSize + 10;
        });
    }
}

class GameOver extends Phaser.Scene {
    constructor () {
        super('GameOver');
    }

    init (data) {
        this.resultText = data.playerMove ? 'ПОБЕДА' : 'ВЫ ПРОИГРАЛИ';
    }

    create () {
        this.cameras.main.setBackgroundColor('#2b69ba');
        const graphics = this.add.graphics();
        graphics.fillStyle(0xf7af4a, 1);

        const text = this.add.text(400, 300, this.resultText, {font: '40px Arial', fill: '#ffffff', boundsAlignH: "center", boundsAlignV: "middle"})
        text.setShadow(3, 3, 'rgba(0,0,0,0.5)', 2);
        text.setPosition(400 - text.width / 2, 230 - text.height / 2);

        const clickButton = this.add.text(400, 200, 'СЫГРАТЬ ЕЩЕ', {font: '30px Arial', fill: '#ffffff' })
            .setInteractive({ useHandCursor: true })
            .setPadding(10, 10, 10, 10)
            .setShadow(3, 3, 'rgba(0,0,0,0.5)', 2)
            .on('pointerup', () => this.scene.start('GameField'));

        clickButton.setPosition(400 - clickButton.width / 2, 320 - clickButton.height / 2);
        graphics.fillRoundedRect(400 - clickButton.width / 2, 320 - clickButton.height / 2, clickButton.width, clickButton.height, 20);
    }
}

let config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: [new GameField(), new GameOver()]
};
const game = new Phaser.Game(config);
