const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
var quads = new Set();
const fixedDeltaTime = 0.02;

const leftBorder = -50;
const rightBorder = 850;
const downBorder = 650;
const upBorder = -50;

var repeatLevel = false;
var nextLevel = false;

var finishBlock;

var currentKeys = new Set();
function setKey(event){
    currentKeys.add(event.code);
}
function updateKey(event){
    currentKeys.delete(event.code);
}
document.onkeydown = setKey;
document.onkeyup = updateKey;
const colors = {
    black : 'rgb(0,0,0)',
    white : 'rgb(255,255,255)',
    red : 'rgb(255,0,0)',
    green : 'rgb(0,255,0)',
    blue : 'rgb(0,0,255)',
    purple : 'rgb(127,0,255)',
    gold : 'rgb(255,215,0)',
    grey : 'rgb(128,128,128)'
}

const cells = {
    "c" : colors.black,
    "w" : colors.white,
    "r" : colors.red,
    "g" : colors.green,
    "b" : colors.blue,
    "p" : colors.purple,
    "1" : colors.gold,
    "q" : colors.grey
}
var fillScreen = colors.white;
class Vector2{
    constructor(x, y){
        this.x = x;
        this.y = y;
    }
}
class Quad{
    constructor(size, position, color){
        this.size = size;
        this.position = position;
        this.center = new Vector2(
            this.position.x + this.size.x / 2,
            this.position.y + this.size.y / 2
        );
        this.color = color;
        quads.add(this);
    }

    draw(){
        ctx.fillStyle = this.color;
        ctx.fillRect(this.position.x, this.position.y, this.size.x, this.size.y);
    }

    destroy(){
        quads.delete(this);
    }
}

class Collision{
    constructor(){
        this.up = false;
        this.down = false;
        this.right = false;
        this.left = false;
    }
    reset(){
        this.up = false;
        this.down = false;
        this.right = false;
        this.left = false;
    }
}


class Player extends Quad{
    speedX = 300;
    jumpForce = 300;
    velocity = new Vector2(0,0);
    collision = new Collision();
    minusInnertion = new Vector2(500, 300);
    draw(){
        super.draw();
        this.checkBorders();
        this.checkCollision();
        this.move();
        this.updateVelocity();
    }
    checkCollision(){
        this.collision.reset();
        quads.forEach(elem => this.checkElem(elem));
    }

    checkElem(elem){
        if(this === elem)return;
        var l1 = this.position;
        var r1 = new Vector2(
            this.position.x + this.size.x, 
            this.position.y + this.size.y
        );
        var l2 = elem.position;
        var r2 = new Vector2(
            elem.position.x + elem.size.x,
            elem.position.y + elem.size.y
        );
        if(r1.y < l2.y || l1.y > r2.y){
            return;
        }
        if(l1.x > r2.x || r1.x < l2.x){
            return;
        }
        //else collides

        if(elem == finishBlock){
            nextLevel = true;
        }

        var fDistX = (this.size.x + elem.size.x)/2;
        var fDistY = (this.size.y + elem.size.y)/2;
        var distX = Math.abs(this.position.x - elem.position.x);
        var distY = Math.abs(this.position.y - elem.position.y);
        if(fDistX - distX > fDistY - distY){ // below or above
            if(this.position.y > elem.position.y) {this.collision.up = true;}
            else this.collision.down = true;
        }else{ //right or left
            if(this.position.x > elem.position.x){this.collision.left = true;}
            else this.collision.right= true;
        }
    }

    updateVelocity(){
        //fix velocity 
        if(this.velocity.y < 0 && this.collision.down) this.velocity.y = 12;
        if(this.velocity.y > 0 && this.collision.up) this.velocity.y = -12;
        if(this.velocity.x < 0 && this.collision.left) this.velocity.x = 10;
        if(this.velocity.x > 0 && this.collision.right) this.velocity.x = -10;
        this.position.x += this.velocity.x * fixedDeltaTime;
        this.position.y -= this.velocity.y * fixedDeltaTime;
        if(this.velocity.x > 0)this.velocity.x -= this.minusInnertion.x * fixedDeltaTime;
        if(this.velocity.x < 0)this.velocity.x += this.minusInnertion.x * fixedDeltaTime;
        this.velocity.y -= this.minusInnertion.y * fixedDeltaTime;
    }

    move(){
        if(currentKeys.has("ArrowUp") && this.collision.down)
            this.velocity.y = this.jumpForce;
        if(currentKeys.has("ArrowLeft"))
            this.velocity.x = -this.speedX;
        if(currentKeys.has("ArrowRight"))
            this.velocity.x = this.speedX;
        
    }

    checkBorders(){
        var x = this.position.x;
        var y = this.position.y;
        if(x > rightBorder ||
            x < leftBorder ||
            y < upBorder ||
            y > downBorder){
                repeatLevel = true;
            }
    }
}

class Tilemap{
    constructor(screenColor,cellSize, tilemapInfo){
        this.screenColor = screenColor;
        this.cellSize = cellSize;
        this.tilemapInfo = tilemapInfo;
        
    }
    activate(){
        var currentPosition = new Vector2(0,0);
        for(var i=0; i<this.tilemapInfo.length; i++){
            for(var j=0; j<this.tilemapInfo[i].length; j++){
                var char = this.tilemapInfo[i][j];
                if(char == " "){
                    currentPosition = new Vector2(currentPosition.x + this.cellSize.x, currentPosition.y);
                    continue;
                } 
                else if(char == "1"){
                    finishBlock = new Quad(
                        this.cellSize,
                        currentPosition,
                        cells[char]
                        );
                }
                else if(char == char.toUpperCase()){
                    new Player(
                        this.cellSize,
                        currentPosition,
                        cells[char.toLowerCase()]
                    );
                }
                else{
                    new Quad(
                    this.cellSize,
                    currentPosition,
                    cells[char]
                    );
                }
                currentPosition = new Vector2(currentPosition.x + this.cellSize.x, currentPosition.y);
            }
            currentPosition = new Vector2(0,currentPosition.y + this.cellSize.y);
        }
        fillScreen = this.screenColor;
    }
}

class Game{
    lastTime = -1;
    current = 0;
    constructor(tilemaps){
        this.levels = tilemaps;
        this.levels[0].activate();
    }

    repeat(){
        quads.clear();
        this.levels[this.current].activate();
    }

    next(){
        quads.clear();
        this.current++;
        if(this.current >= this.levels.length)
            this.current = 0;
        this.levels[this.current].activate();
    }
}

//just levels, nothing interesting
const game = new Game([
    new Tilemap(
        colors.white,
        new Vector2(50, 50),
        [
            "G",
            "             1",
            "            bb",
            "",
            "",
            "     bb",
            "",
            "",
            "bb",
            "",
            "",
            "bbbbbbbbbbbbbbbb"
        ]
    ),
    new Tilemap(
        colors.white,
        new Vector2(50, 50),
        [
            "R",
            "ggg",
            "   ggg",
            "      ggg",
            "",
            "           ggg",
            "        ggg",
            "  1  ggg",
            "  ggg",
            "",
            "",
            "",
            ""
        ]
    ),
    new Tilemap(
        colors.grey,
        new Vector2(25, 25),
        [
            'W',
            'ccccccccccccccccc',
            '',
            '     ccccccccccccccccccc',
            '',
            'cccccc                 cccccc',
            '',
            '     ccccccccccccccccccc',
            '',
            'cccccccccc       cccccccccccc',
            '',
            '         ccccccccc',
            '',
            'cccccccccccccccccccccc',
            '',
            '     ccccccccccccccccccccccccccc',
            '',
            'ccccccccccccccccccccc',
            '',
            '   cccccccccccccccccccccccccccccc',
            '',
            '',
            '                   1',
            'cccccccccccccccccccccccccccccccccccccc'
        ]
    ),
    new Tilemap(
        colors.purple,
        new Vector2(50, 50),
        [
            '         1',
            '        wwww',
            '',
            'wwww',
            '',
            '         wwwww',
            '',
            'wwwww',
            '',
            '           wwwww',
            'C',
            'wwwwwwwww    ',
        ]
    ),
    new Tilemap(
        colors.red,
        new Vector2(40, 40),
        [
            'G',
            'bbbbbb',
            '',
            '       bbbbbbbb',
            '',
            'bbbb',
            '',
            '           bbb',
            '',
            '',
            '',
            '            bb',
            '',
            '',
            '            1'
        ]
    )

]);
//end levels

function Update(){
    if(repeatLevel){
        repeatLevel = false;
        game.repeat();
    }
    else if(nextLevel){
        nextLevel = false;
        game.next();
    }
    ctx.fillStyle = fillScreen;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    quads.forEach((elem) => elem.draw());
    requestAnimationFrame(Update);
}Update();