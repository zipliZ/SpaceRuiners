let canvas = document.getElementById('game');
let context = canvas.getContext ( '2d');
let fonimg = new Image ();
fonimg.src = '/static/images/fon.png';
let playerimg = new Image ();
playerimg.src = '/static/images/player.png';
let asterimg = new Image ();
asterimg.src = '/static/images/aster.png';
let explimg 	= new Image();
explimg.src = '/static/images/boom.png';

let name
let sec
async function GetBestScore(name){
	console.log(name)
	const res = await fetch("/api/getscore/", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json"
		},
		body: JSON.stringify({Name: name})
	})

	if (res.ok){
		let Json = await res.json()
		return Json.BestScore
	}
	else {
		console.log(res)
	}

}
async function PostBestScore(name,score){

	const res = await fetch("/api/updatescore/", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({Name: name,
									Score: score})
	})

}




let IsAlive = false

let asteroid = [];
let timer=0;
let player = {x:300,y:300,animx:0,animy:0};
let expl=[];
	
	
canvas.addEventListener("mousemove", function(event){
	player.x=event.offsetX-38;
	player.y=event.offsetY-45;
});




fonimg.onload=function () {
	game();
}

async function game () {
		await update ();
		render();
		requestAnimationFrame (game);
}

async function update () {
	timer++;
	if (timer%80===0) {asteroid.push ({
		x: Math.random ()*700,
		y: -100,
		dx: Math.random ()*15-4,
		dy: Math.random ()*15-4, 
		rip:0,
		});}

for (i in expl) {
	expl[i].animx=expl[i].animx+0.3;
	if (expl[i].animx>7) {expl[i].animy++; expl[i].animx=0}
	if (expl[i].animy>7) 
	expl.splice(i,1);
	console.debug("asd")

}
// Physics
for (i in asteroid) {
	
asteroid[i].x = asteroid[i].x + asteroid[i].dx;
asteroid[i].y = asteroid[i].y + asteroid[i].dy;
//border
if (asteroid[i].x>=720 || asteroid[i].x<-10 ) asteroid[i].dx=-asteroid[i].dx;
if (asteroid[i].y>=800  ) asteroid.splice(i,1);

	if (IsAlive &&Math.abs(asteroid[i].x+34-player.x-34)<40 && Math.abs(asteroid[i].y-player.y)<25){

		IsAlive=0;
		expl.push({x:player.x-100,y:player.y-100,animx:0,animy:0});
		asteroid.splice(i,1);
		document.querySelector('.popup-deathOverlay').style.display = 'flex';
		const nameInput = document.getElementById("newName-input")
		nameInput.value = name
		await PostBestScore(name,sec)

	}
	}
}


function render () {
	context.drawImage (fonimg , 0, 0, 800, 800); 
	if (IsAlive) {context.drawImage (playerimg ,player.x, player.y, 75, 100); }
	for (i in asteroid) {
	context.drawImage (asterimg , asteroid[i].x,asteroid[i].y,75, 75); };
	for (i in expl)
	context.drawImage(explimg, 128*Math.floor(expl[i].animx),128*Math.floor(expl[i].animy),128,128, expl[i].x, expl[i].y, 300, 300);

}


var requestAnimFrame = (function (){
return window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function (callback){
			window.setTimeout (callback, 1000/20);
		};
})();
// Сохранение имени
async function saveName() {
	console.log("da")
	name = document.getElementById('name-input').value;
	const divName = document.getElementById("name")
	divName.innerText = name
	BestScore = await GetBestScore(name)
	const divScore = document.getElementById("BestScore")
	divScore.innerText = BestScore
	document.querySelector('.popup-overlay').style.display = 'none';
	init()
	IsAlive = true

}

// timer
function init()
{
	sec = 0;
	setInterval(tick, 1000);
}

function tick()
{
	if (IsAlive){
		sec++;
	}
	document.getElementById("timer").
		childNodes[0].nodeValue = sec;
}

// Изменение имени
async function ChangeName() {
	name = document.getElementById('newName-input').value;
	const divName = document.getElementById("name")
	divName.innerText = name
	let BestScore = await GetBestScore(name)
	const divScore = document.getElementById("BestScore")
	divScore.innerText = BestScore
	document.querySelector('.popup-deathOverlay').style.display = 'none';
	sec = 0
	IsAlive = true
}

