// The application will create a renderer using WebGL, if possible,
// with a fallback to a canvas render.

// The application will create a canvas element for you that you
// can then insert into the DOM (Document Body).
const app = new PIXI.Container(),
    renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, {backgroundColor : 0xe53935, antialias: true }),
    loader = PIXI.loader,
    texture = PIXI.Texture,
    textureCache = PIXI.utils.TextureCache,
    rsrc = PIXI.loader.resources,
    sprite = PIXI.sprite,
    extras = PIXI.extras,
    settings = PIXI.settings,
    keyboard = PIXI.keyboardManager,
    audio = PIXI.audioManager,
    time = PIXI.timerManager;


$(window).on('resize',function(){
	//Define variables pertaining to the width and height of the window.
	var w = window.innerWidth;
	var h = window.innerHeight;

	renderer.view.style.width = w + 'px';
	renderer.view.height = h + 'px';
	
	//Call the 'resize' function on the renderer
	renderer.resize(w, h);
});

//Append the renderer to the body of the HTML DOM, make it invisible (set the CSS opacity property to zero), and give it an ID and class name.
renderer.view.style.opacity = "0";
renderer.view.setAttribute("id", "pixiRender");
renderer.view.className = "pixiRender";

//Setup the required global variables.
const REQUIRED_AUDIO = 
[	{name: "audio-background-main", url:"audio/background/game-main.mp3"},
	{name: "audio-background-hardcore", url:"audio/background/game-hardcore.mp3"},
	{name: "audio-menu-0", url:"audio/background/menu-0.mp3"},
	{name: "audio-menu-1", url:"audio/background/menu-1.mp3"},
	{name: "audio-btn-hover", url:"audio/sfx/btn_hover.wav"},
	{name: "audio-sfx-count", url:"audio/sfx/countdown.wav"},
	{name: "audio-sfx-splode", url:"audio/sfx/explode.wav"}
];
var FRAME_NO = 0;
var DELTA_TIME = 0
var LAST_TIME = 0;
var LAST_SCORE = 0;
var PLAYER_LIVES = 0;
var LAST_MODE = "n/a";
var AUDIO_CURRENT = null;
var INTRO = true;
var BOMB_SPAWN = false;
var BOMB_SPEED_MULTI = 1;
var BOMB_TIMEOUT = new Array();
var MENU_TEXT = null;
var BOMB_UIDS = new Array();
var ANIM_LERP_QUEUE = new Array();
var ANIM_DRAW_FADE_QUEUE = new Array();
var ANIM_HOVER_QUEUE = new Array();
var ANIM_ROTATE_QUEUE = new Array();
var ANIM_COUNTDOWN_QUEUE = new Array();
var ANIM_BOMB_QUEUE = new Array();
var ANIM_FADE_QUEUE = new Array();
var ANIM_LIFE_QUEUE = new Array();
var ANIM_SHAKE_QUEUE = new Array();
var AUDIO_FADE_QUEUE = new Array();

function loop(TIME)
{
    //Increment the frame variable to get the number of frames the render has rendered
    FRAME_NO++;
    
    //Run the various functions for logic, animation, etc.
    anim();
    logic();

    //Calculate the delta time.
    if (LAST_TIME) {
        DELTA_TIME = TIME - LAST_TIME;
    }
    LAST_TIME = TIME;
    
    //Render the stage to see the animation.
    renderer.render(app);

    //Update the keyboard manager
    keyboard.update();

    //Update the timer manager
    time.update();

    //Loop this function at a rate of 60 frames per second
    requestAnimationFrame(loop);
}

function state(newState)
{
	switch(newState){
		case "menu":
			console.log("menu state yoyoyo");

			//Check whether the user is coming to the menu screen from the intro.
			if(!INTRO){
				//Get a random background song from the PIXI audio manager and
				AUDIO_CURRENT = audio.getAudio('audio-menu-' + Math.floor(Math.random() * 2));
				//decrease the volume so it doesn't blast the user when they start the game.
				AUDIO_CURRENT.volume = 0.05;
				AUDIO_CURRENT.loop = true;
				AUDIO_CURRENT.play();
			}else{
				//Set intro to false so that the next time the user views the menu screen, they will hear music.
				INTRO = false;
			}

			//Create a new instance of the PIXI.Graphics() renderer.
			var backGraph = new PIXI.Graphics();
			backGraph.beginFill(0xC62828, 0);
			backGraph.lineStyle(0);

			//Move the line in the slanted rectangle shape.
			backGraph.moveTo(0,0);
			backGraph.lineTo(0, renderer.height);
			backGraph.lineTo(425, renderer.height);
			backGraph.lineTo(350, 0);
			backGraph.lineTo(0, 0);
			backGraph.endFill();

			//Add the Graph renderer to the page.
			app.addChild(backGraph);

			//Define constant variables for the button scale when hovered and not hovered.
			const btnScale = 0.45;
			const btnHoverScale = 0.55;

			//Create a new instance of a PIXI sprite using the title logo texture and assign it to a variable.
			var titleSpr = new PIXI.Sprite(rsrc.spr_title_old.texture);

			//Set the anchor to the middle of the sprite, set its position to be offscreen, and scale it down.
			titleSpr.anchor.set(0.5, 0.5);
			titleSpr.position.set(-titleSpr.width/2, 0);
			titleSpr.scale.set(0.75);

			//Add the title sprite to the stage.
			backGraph.addChild(titleSpr);

			//Create the clipboard sprite for the menu text.
			var clipboardBack = new PIXI.Sprite(rsrc.spr_clipboard.texture);

			//Set the anchor to the middle of the sprite, set its position to be offscreen, and scale it down.
			clipboardBack.anchor.set(0.5, 0.5);
			clipboardBack.position.set(renderer.width / 2 + 150, -clipboardBack.height);
			clipboardBack.scale.set(1.6);

			//Add the clipboard the the stage.
			app.addChild(clipboardBack);

			//Create a style for the text so it uses the correct font, and is the correct colour and size.
			var clipboardTextStyle = new PIXI.TextStyle({
			    fontFamily: 'widepixel',
			    fontSize: 22,
			    fill: '#232323',
			    wordWrap: true,
    			wordWrapWidth: 460
			});

			//Create a new instace of PIXI.Text() object for the mode descriptions.
			var clipboardText = new PIXI.Text(MENU_TEXT.default, clipboardTextStyle);
			clipboardText.anchor.set(0.5, 0.5);
			clipboardText.x = renderer.width / 2 + 150;
			clipboardText.y = -clipboardBack.height / 2;
			clipboardText.alpha = 1;

			//Add the menu text to the stage.
			app.addChild(clipboardText);

			//Create an array with all the necessary textures needed to intialize the menu button.
			const btnTex = [
				rsrc.spr_btn_classic.texture,
				rsrc.spr_btn_survival.texture,
				rsrc.spr_btn_hardcore.texture,
				rsrc.spr_btn_credits.texture
			]
			const btnVol = 0.4;

			//Define a function to make a sprite able to be interacted with
			var enableInteract = function(item){
				item.interactive = true;
				item.buttonMode = true;
			};

			//Create an array of all the menu sprites so they are able to be added as children of the PIXI.Graphics() programatically.
			var menuItems = new Array();

			//Create an array containing all of the menu button states (hovered = true) to be used for the clipboard text.
			var menuStates = [false, false, false, false];

			//Define a function to check whether the mouse is hovering over any buttons; used for setting the clipboard text.
			var checkButtonHover = function(){
				if(!menuStates[0] && !menuStates[1] && !menuStates[2] && !menuStates[3]) { clipboardText.text = MENU_TEXT.default; }
			}

			//Create a new instance of a PIXI sprite using the 'classic' button texture and assign it to a variable.
			var classicBtn = new PIXI.Sprite(rsrc.spr_btn_classic.texture);
			menuItems[0] = classicBtn;

			//Set the anchor to the middle of the sprite, set its position to be offscreen, and scale it down.
			classicBtn.anchor.set(0, 0.5);
			classicBtn.position.set(-classicBtn.width, 0);
			classicBtn.scale.set(btnScale);
			classicBtn.on('mouseover', function(){
				//Update the menu screen clipboard text.
				clipboardText.text = MENU_TEXT.classic;

				//Set the button hover target so it animates.
				ANIM_HOVER_QUEUE[0].tar = btnHoverScale;

				//Update the menu button state
				menuStates[0] = true;

				//Define the click sound to be played (this has to be done in every mouseover event so the hover sounds can overlap).
				var btnClick = audio.getAudio("audio-btn-hover");
				btnClick.volume = btnVol;
				btnClick.play();
			}).on('mouseout', function(){
				ANIM_HOVER_QUEUE[0].tar = btnScale;

				//Update the menu button state
				menuStates[0] = false;

				//Check the button state to see if the clipboard should revert to the default text
				checkButtonHover();
			}).on('click', function(){ switchState("classic"); });

			//Create a new instance of a PIXI sprite using the 'survival' button texture and assign it to a variable.
			var survivalBtn = new PIXI.Sprite(rsrc.spr_btn_survival.texture);
			menuItems[1] = survivalBtn;

			//Set the anchor to the middle of the sprite, set its position to be offscreen, and scale it down.
			survivalBtn.anchor.set(0, 0.5);
			survivalBtn.position.set(-survivalBtn.width, 0);
			survivalBtn.scale.set(btnScale);
			survivalBtn.on('mouseover', function(){
				//Update the menu screen clipboard text.
				clipboardText.text = MENU_TEXT.survival;

				//Set the button hover target so it animates.
				ANIM_HOVER_QUEUE[1].tar = btnHoverScale;

				//Update the menu button state
				menuStates[1] = true;

				//Define the click sound to be played (this has to be done in every mouseover event so the click sounds can overlap).
				var btnClick = audio.getAudio("audio-btn-hover");
				btnClick.volume = btnVol;
				btnClick.play();
			}).on('mouseout', function(){
				ANIM_HOVER_QUEUE[1].tar = btnScale;

				//Update the menu button state
				menuStates[1] = false;

				//Check the button state to see if the clipboard should revert to the default text
				checkButtonHover();
			}).on('click', function(){ switchState("survival"); });

			//Create a new instance of a PIXI sprite using the 'hardcore' button texture and assign it to a variable.
			var hardcoreBtn = new PIXI.Sprite(rsrc.spr_btn_hardcore.texture);
			menuItems[2] = hardcoreBtn;

			//Set the anchor to the middle of the sprite, set its position to be offscreen, and scale it down.
			hardcoreBtn.anchor.set(0, 0.5);
			hardcoreBtn.position.set(-hardcoreBtn.width, 0);
			hardcoreBtn.scale.set(btnScale);
			hardcoreBtn.on('mouseover', function(){
				//Update the menu screen clipboard text.
				clipboardText.text = MENU_TEXT.hardcore;

				//Set the button hover target so it animates.
				ANIM_HOVER_QUEUE[2].tar = btnHoverScale;

				//Update the menu button state
				menuStates[2] = true;

				//Define the click sound to be played (this has to be done in every mouseover event so the click sounds can overlap).
				var btnClick = audio.getAudio("audio-btn-hover");
				btnClick.volume = btnVol;
				btnClick.play();
			}).on('mouseout', function(){
				ANIM_HOVER_QUEUE[2].tar = btnScale;

				//Update the menu button state
				menuStates[2] = false;

				//Check the button state to see if the clipboard should revert to the default text
				checkButtonHover();
			}).on('click', function(){ switchState("hardcore"); });

			//Create a new instance of a PIXI sprite using the 'credits' button texture and assign it to a variable.
			var creditsBtn = new PIXI.Sprite(rsrc.spr_btn_credits.texture);
			menuItems[3] = creditsBtn;

			//Set the anchor to the middle of the sprite, set its position to be offscreen, and scale it down.
			creditsBtn.anchor.set(0, 0.5);
			creditsBtn.position.set(-creditsBtn.width, 0);
			creditsBtn.scale.set(btnScale);
			creditsBtn.on('mouseover', function(){
				//Update the menu screen clipboard text.
				clipboardText.text = MENU_TEXT.credits;

				//Set the button hover target so it animates.
				ANIM_HOVER_QUEUE[3].tar = btnHoverScale;

				//Update the menu button state
				menuStates[3] = true;

				//Define the click sound to be played (this has to be done in every mouseover event so the click sounds can overlap).
				var btnClick = audio.getAudio("audio-btn-hover");
				btnClick.volume = btnVol;
				btnClick.play();
			}).on('mouseout', function(){
				ANIM_HOVER_QUEUE[3].tar = btnScale;

				//Update the menu button state
				menuStates[3] = false;

				//Check the button state to see if the clipboard should revert to the default text
				checkButtonHover();
			});//.on('click', function(){ switchState("credits"); });
			//I'm getting rid of the credits screen and just putting the credits on the clipboard

			var m = 0;
			var menuBtn = function(timeout){
				//Wait until the timeout has finished.
				setTimeout(function(){
					//Add the button as a child of the 'backGraph' PIXI.Graphics() object.
					backGraph.addChild(menuItems[m]); 
					ANIM_HOVER_QUEUE.push({sprite: menuItems[m], tar: btnScale, alpha: 0.1});
					ANIM_LERP_QUEUE.push({
						sprite: menuItems[m], 
						alpha: {x: 0.1, y: 1, r: 0.07, o: 1}, 
						tar: {x: 50, y: 430 + (m * 60), r: 0.05, o: 1}, 
						threshold: 0.5,
						onComplete: enableInteract(menuItems[m])
					});
					m++;

					//Make sure we don't try to add buttons that don't exist.
					if(m < menuItems.length) { menuBtn(150) };
				}, timeout);
			}

			//Start the button delayed transition loop.
			menuBtn(250);

			//Add the title sprite to the linear interpolation animation (lerp) queue.
			ANIM_LERP_QUEUE.push({
				sprite: titleSpr, 
				alpha: {x: 0.1, y: 1, r: 0.07, o: 1}, 
				tar: {x: 250, y: 225, r: 0.1, o: 1}, 
				threshold: 0.5,
				onComplete: function(){
					ANIM_ROTATE_QUEUE.push({
						sprite: titleSpr, 
						initial: titleSpr.rotation, 
						frame: FRAME_NO,
						factor: 0.008,
						frame_factor: 0.05
					});
				}
			});

			//Add the clipboard text to the linear interpolation animation (lerp) queue.
			ANIM_LERP_QUEUE.push({
				sprite: clipboardText, 
				alpha: {x: 1, y: 0.1, r: 0.07, o: 1}, 
				tar: {x: renderer.width / 2 + 200, y: renderer.height / 1.95, r: -0.1, o: 1}, 
				threshold: 0.5,
				onComplete: null
			});

			//Add the clipboard sprite to the linear interpolation animation (lerp) queue.
			ANIM_LERP_QUEUE.push({
				sprite: clipboardBack, 
				alpha: {x: 1, y: 0.1, r: 0.07, o: 1}, 
				tar: {x: renderer.width / 2 + 150, y: renderer.height / 2, r: -0.1, o: 1}, 
				threshold: 0.5,
				onComplete: null
			});

			//Fade in the background title after a quarter of a second (add it to the draw lerp queue).
			setTimeout(function(){
				ANIM_DRAW_FADE_QUEUE.push({
					graphics: backGraph,
					start: {x: 0, y: 0},
					points: [{x: 0, y:0}, {x: 0, y: renderer.width}, {x: 425, y: renderer.height}, {x: 350, y: 0}, {x: 0, y: 0}],
					alpha: 0.05,
					opacity: 0,
					tar: 1, 
					threshold: 0.01,
					onComplete: function(){
					}
				});
			}, 250);

		break;
		case "classic":
		game({
			lives: 5,
			spawnTimeDecrease: 55,
			spawnRange: 1,
			speedMulti: 1.2,
			hard: false,
			mode: newState
		});
		break;

		case "survival":
		game({
			lives: 3,
			spawnTimeDecrease: 25,
			spawnRange: 3,
			speedMulti: 1,
			hard: false,
			mode: newState
		});
		break;

		case "hardcore":
		game({
			lives: 1,
			spawnTimeDecrease: 65,
			spawnRange: 3,
			speedMulti: 1.7,
			hard: true,
			mode: newState
		});
		break;

		case "insane":
		game({
			lives: 1,
			spawnTimeDecrease: 125,
			spawnRange: 3,
			speedMulti: 3,
			hard: true,
			mode: newState
		});
		break;

		case "dead":
			//Define a function to make a sprite able to be interacted with
			var enableInteract = function(item){
				item.interactive = true;
				item.buttonMode = true;
			};

			//Create a new instance of the PIXI.Graphics() renderer.
			var backGraph = new PIXI.Graphics();
			backGraph.beginFill(0xC62828, 0);
			backGraph.lineStyle(0);

			//Move the line in the slanted rectangle shape.
			backGraph.moveTo(0, (renderer.height * 6/8));
			backGraph.lineTo(renderer.width, (renderer.height * 6/8));
			backGraph.lineTo(renderer.width, (renderer.height * 2/8));
			backGraph.lineTo(0,(renderer.height * 2/8));
			backGraph.lineTo(0, (renderer.height * 6/8));
			backGraph.endFill();

			//Add the background graph to the stage.
			app.addChild(backGraph);

			//Create a new 'you blew it' dead screen sprite.
			var deadSpr = new PIXI.Sprite(rsrc.spr_dead.texture);
			deadSpr.anchor.set(0.5);
			deadSpr.position.set(-deadSpr.width, (renderer.height * 2/8) + 75);
			deadSpr.alpha = 0;

			//Add the sprite as a child of the back graph so it shows in front.
			backGraph.addChild(deadSpr);

			//Push the dead screen title sprite into the animation queue to slide in from the left.
			ANIM_LERP_QUEUE.push({
				sprite: deadSpr, 
				alpha: {x: 0.1, y: 1, r: 0.07, o: 0.1}, 
				tar: {x: renderer.width / 2, y: (renderer.height * 2/8) + 75, r: -0.02, o: 1}, 
				threshold: 0.5,
				onComplete: null
			});

			//Style the 'you survived for <time>' text object accordingly.
			var deadTextStyle = new PIXI.TextStyle({
			    fontFamily: 'widepixel',
			    fontSize: 25,
			    fill: '#ffffff',
			});

			//Create a new instace of PIXI.Text() object for the 'you survived <time> long' text.
			var deadText = new PIXI.Text("You survived for " + LAST_SCORE + "s in:", deadTextStyle);
			deadText.anchor.set(0.5, 0.5);
			deadText.position.set(-deadText.width, (renderer.height * 2/8) + 125);

			//Add the menu text as a child of the PIXI.Graphics() background object.
			backGraph.addChild(deadText);

			setTimeout(function(){
				//Push the user's score into the animation queue to slide in from the left after 125ms.
				ANIM_LERP_QUEUE.push({
					sprite: deadText, 
					alpha: {x: 0.1, y: 1, r: 1, o: 0.1}, 
					tar: {x: renderer.width / 2, y: (renderer.height * 2/8) + 150, r: 0, o: 1}, 
					threshold: 0.5,
					onComplete: null
				});
			}, 125);

			//Style the '<mode>' text object accordingly.
			var modeTextStyle = new PIXI.TextStyle({
			    fontFamily: 'widepixel',
			    fontSize: 48,
			    fill: '#ffffff',
			});

			//Create a new instace of PIXI.Text() object for the '<mode> text.
			var modeText = new PIXI.Text(LAST_MODE, modeTextStyle);
			modeText.anchor.set(0.5, 0.5);
			modeText.position.set(-modeText.width, renderer.height / 2);
			modeText.alpha = 0;

			//Add the '<mode>' text object to the stage.
			app.addChild(modeText);

			setTimeout(function(){
				//Push the user's score into the animation queue to slide in from the left after 125ms.
				ANIM_LERP_QUEUE.push({
					sprite: modeText, 
					alpha: {x: 0.1, y: 1, r: 1, o: 0.1}, 
					tar: {x: renderer.width / 2, y: renderer.height / 2, r: 0, o: 1}, 
					threshold: 0.5,
					onComplete: null
				});
			}, 200);

			//Define variables to determine the scale of the buttons when hovered and not hovered.
			const deadBtnScale = 0.5;
			const deadBtnHoverScale = 0.6;
			const deadBtnVol = 0.4;

			//Create a new 'again' button sprite
			var againBtn = new PIXI.Sprite(rsrc.spr_btn_again.texture).on('mouseover', function(){
				//Set the button hover target so it animates.
				ANIM_HOVER_QUEUE[0].tar = deadBtnHoverScale;

				//Define the click sound to be played (this has to be done in every mouseover event so the click sounds can overlap).
				var btnClick = audio.getAudio("audio-btn-hover");
				btnClick.volume = deadBtnVol;
				btnClick.play();
			}).on('mouseout', function(){
				ANIM_HOVER_QUEUE[0].tar = deadBtnScale;
			}).on('click', function(){ switchState(LAST_MODE); });

			againBtn.anchor.set(0.5);
			againBtn.scale.set(deadBtnScale);
			againBtn.position.set(-againBtn.width, (renderer.height * 6/8) - 115);

			//Add the 'again' button as a child of the PIXI.Graphics() background object.
			backGraph.addChild(againBtn);

			setTimeout(function(){
				//Push the user's score into the animation queue to slide in from the left after 200ms.
				ANIM_LERP_QUEUE.push({
					sprite: againBtn, 
					alpha: {x: 0.1, y: 1, r: 1, o: 0.1}, 
					tar: {x: renderer.width / 2, y: (renderer.height * 6/8) - 115, r: 0, o: 1}, 
					threshold: 0.5,
					onComplete: enableInteract(againBtn)
				});

				//Also push the button to the hover animation queue.
				ANIM_HOVER_QUEUE.push({sprite: againBtn, tar: deadBtnScale, alpha: 0.1});
			}, 275);

			//Create a new 'return' button sprite
			var returnBtn = new PIXI.Sprite(rsrc.spr_btn_return.texture).on('mouseover', function(){
				//Set the button hover target so it animates.
				ANIM_HOVER_QUEUE[1].tar = deadBtnHoverScale;

				//Define the click sound to be played (this has to be done in every mouseover event so the click sounds can overlap).
				var btnClick = audio.getAudio("audio-btn-hover");
				btnClick.volume = deadBtnVol;
				btnClick.play();
			}).on('mouseout', function(){
				ANIM_HOVER_QUEUE[1].tar = deadBtnScale;
			}).on('click', function(){ switchState("menu"); });

			returnBtn.anchor.set(0.5);
			returnBtn.scale.set(deadBtnScale);
			returnBtn.position.set(-returnBtn.width, (renderer.height * 6/8) - 60);

			//Add the 'return' button as a child of the PIXI.Graphics() background object.
			backGraph.addChild(returnBtn);

			setTimeout(function(){
				//Push the user's score into the animation queue to slide in from the left after 275ms.
				ANIM_LERP_QUEUE.push({
					sprite: returnBtn, 
					alpha: {x: 0.1, y: 1, r: 1, o: 0.1}, 
					tar: {x: renderer.width / 2, y: (renderer.height * 6/8) - 60, r: 0, o: 1}, 
					threshold: 0.5,
					onComplete: enableInteract(returnBtn)
				});

				ANIM_HOVER_QUEUE.push({sprite: returnBtn, tar: deadBtnScale, alpha: 0.1});
			}, 350);

			//Push the background graph into the animation queue.
			setTimeout(function(){
				ANIM_DRAW_FADE_QUEUE.push({
					graphics: backGraph,
					start: {x: 0, y: (renderer.height * 6/8)},
					points: [{x: renderer.width, y:(renderer.height * 6/8)}, {x: renderer.width, y: (renderer.height * 2/8)}, {x: 0, y: (renderer.height * 2/8)}, {x: 0, y: (renderer.height * 6/8)}],
					alpha: 0.08,
					opacity: 0,
					tar: 1, 
					threshold: 0.01,
					onComplete: null
				});
			}, 100);
		break;
	}
}

function game(config){
	//Check whether the game mode is specified as 'hard'
	if(config.hard){
		//Set the audio to play accordingly
		AUDIO_CURRENT = audio.getAudio('audio-background-hardcore');
	}else{
		AUDIO_CURRENT = audio.getAudio('audio-background-main');
	}

	//Make the audio loop and be a little more quiet
	AUDIO_CURRENT.loop = true;
	AUDIO_CURRENT.volume = 0.05;

	//Set the amount of lives the player is giver.
	PLAYER_LIVES = config.lives;

	//Update the game mode the player is playing.
	LAST_MODE = config.mode;

	//Update the bomb speed multiplier.
	BOMB_SPEED_MULTI = config.speedMulti;

	//Set BOMB_SPAWN to true so we are able to start spawning bombs
	BOMB_SPAWN = true;

	//Debugging yoyoyo
	console.log(config.mode + ' state yo');

	//Call on the 'gameInfoBack' function to create a new PIXI.Graphics() object for the 'back' of the game information.
	var infoBack = gameInfoBack();

	//Add the countdown sprite to the stage using the function.
	countdownStart(function(){
		var timerVal = 0;	
		//Create an interval for the game timer, and assign it to a variable so it can be cleared later.
		var timerInt = setInterval(function(){
			//Increment the value of the timer by 1
			timerVal++;
			infoBack.textBack.text = timerVal / 100 + 's';
		}, 10);

		//Play the game audio.
		AUDIO_CURRENT.play();

		//Create the looping timeout function for creating bombs and assign it to a variable.
		var newTimeout = 1500;
		var newBomb = function(timeout){
			//Wait until the timeout has finished.
			setTimeout(function(){
				//Check whether we want to continue spawning bombs
				if(BOMB_SPAWN){
					//Add a bomb to the stage
					var bomb = addBomb(rand(config.spawnRange)).on('splode', function(damage){
						//Decrement the player's lives.
						PLAYER_LIVES -= damage;

						//Check whether the player has more than one life remaining and change the text accordingly.
						var lifeType = " life left";
						if(PLAYER_LIVES > 1) { lifeType =  " lives left"; }

						//Update the text.
						infoBack.textLives.text = PLAYER_LIVES + lifeType;
						infoBack.textLives.scale.set(1.3);
						infoBack.textLives.alpha = 0.4;

						console.log("player lives [" + PLAYER_LIVES + "]");

						//Check whether the player is dead (has less than 1 life).
						if(PLAYER_LIVES < 1){
							//Disable bomb spawning
							BOMB_SPAWN = false;

							//Update the player's score
							LAST_SCORE = timerVal / 100;

							//Clear the timer interval
							clearInterval(timerInt);

							//Switch the state to the death screen
							switchState('dead', true);

							return;
						}
					});

					if(newTimeout > 700){
						//Decrement the new timeout so the next bomb will spawn a little faster.
						newTimeout -= config.spawnTimeDecrease;
						console.log("new bomb timeout [" + newTimeout + "]");
					}

					//Loop the function.
					newBomb(newTimeout);
				}
			}, timeout);
		}

		//Start the bomb spawning loop.
		newBomb(newTimeout);
	});
}

function anim()
{
	//Loop through all the items within the animation queue.
	for(var i = 0; i < ANIM_LERP_QUEUE.length; i++){
		//Grab the individual variables from the object.
		var ANIM_ITEM = ANIM_LERP_QUEUE[i];

		//Grab the individual variables from the object.
		var ANIM_ITEM = ANIM_LERP_QUEUE[i];
		var ANIM_SPR = ANIM_ITEM.sprite;

		//Move the sprite smoothly by stepping half the target distance each frame draw.
		//Uses this formula: x += (target - x) * alpha
		ANIM_SPR.x += (ANIM_ITEM.tar.x - ANIM_SPR.x) * ANIM_ITEM.alpha.x;
		ANIM_SPR.y += (ANIM_ITEM.tar.y - ANIM_SPR.y) * ANIM_ITEM.alpha.y;
		ANIM_SPR.rotation += (ANIM_ITEM.tar.r - ANIM_SPR.rotation) * ANIM_ITEM.alpha.r;
		ANIM_SPR.alpha += (ANIM_ITEM.tar.o - ANIM_SPR.alpha) * ANIM_ITEM.alpha.o;

		//Check whether the sprite has reached its target position within the animation (i.e. finished the animation) with a threshold of specified in ANIM_ITEM.threshold.
		if((ANIM_SPR.x > ANIM_ITEM.tar.x - ANIM_ITEM.threshold) && (ANIM_SPR.y > ANIM_ITEM.tar.y - ANIM_ITEM.threshold) && (ANIM_SPR.rotation > ANIM_ITEM.tar.r - ANIM_ITEM.threshold)){
			//Remove the animation from the queue.
			ANIM_LERP_QUEUE.splice(i, 1);

			//Check whether the 'onComplete' object variable is a valid function, and if so, call the function.
			if(isFunction(ANIM_ITEM.onComplete)){
				ANIM_ITEM.onComplete();
			}
		}
	}

	//Loop through all the items within the animation queue.
	for(var i = 0; i < ANIM_DRAW_FADE_QUEUE.length; i++){
		//Grab the individual variables from the object.
		var ANIM_ITEM = ANIM_DRAW_FADE_QUEUE[i];
		var ANIM_DRAW = ANIM_ITEM.graphics;

		//Interpolate the opacity.
		ANIM_ITEM.opacity += (ANIM_ITEM.tar - ANIM_ITEM.opacity) * ANIM_ITEM.alpha;

		//Clear the drawing canvas and change the pen opacity.
		ANIM_DRAW.clear();
		ANIM_DRAW.beginFill(0xC62828, ANIM_ITEM.opacity);
		ANIM_DRAW.lineStyle(0);
		ANIM_DRAW.moveTo(ANIM_ITEM.start.x, ANIM_ITEM.start.y);

		//Loop through the points specified within the object.
		for(var p = 0; p < ANIM_ITEM.points.length; p++){
			//Draw a line to the point.
			ANIM_DRAW.lineTo(ANIM_ITEM.points[p].x, ANIM_ITEM.points[p].y)
		}
		ANIM_DRAW.endFill();

		//Check whether the graphics object has reached its target opacity.
		if(ANIM_ITEM.opacity > ANIM_ITEM.tar - ANIM_ITEM.threshold){
			ANIM_DRAW_FADE_QUEUE.splice(i, 1);

			//Check whether the 'onComplete' object variable is a valid function, and if so, call the function.
			if(isFunction(ANIM_ITEM.onComplete)){
				ANIM_ITEM.onComplete();
			}
		}
	}

	//Loop through all the items within the animation queue.
	for(var i = 0; i < ANIM_ROTATE_QUEUE.length; i++){
		//Grab the individual variables from the object.
		var ANIM_ITEM = ANIM_ROTATE_QUEUE[i];

		//Rotate the sprite along a sin wave,
		ANIM_ITEM.sprite.rotation = ANIM_ITEM.initial + Math.sin((ANIM_ITEM.frame - FRAME_NO) * ANIM_ITEM.frame_factor) * ANIM_ITEM.factor;
	}

	//Loop through all the items within the animation queue.
	for(var i = 0; i < ANIM_ROTATE_QUEUE.length; i++){
		//Grab the individual variables from the object.
		var ANIM_ITEM = ANIM_ROTATE_QUEUE[i];

		//Rotate the sprite along a sin wave, to.
		ANIM_ITEM.sprite.rotation = ANIM_ITEM.initial + Math.sin((ANIM_ITEM.frame - FRAME_NO) * ANIM_ITEM.frame_factor) * ANIM_ITEM.factor;
	}

	//Loop through all the items within the animation queue.
	for(var i = 0; i < ANIM_HOVER_QUEUE.length; i++){
		//Grab the individual variables from the object.
		var ANIM_ITEM = ANIM_HOVER_QUEUE[i];
		var ANIM_SPR = ANIM_ITEM.sprite;

		if(ANIM_ITEM.tar == 0.55 || ANIM_ITEM.tar == 0.6){
		ANIM_SPR.alpha += (0.5 - ANIM_SPR.alpha) * ANIM_ITEM.alpha;
		}else{
			ANIM_SPR.alpha += (1 - ANIM_SPR.alpha) * ANIM_ITEM.alpha;
		}

		//console.log(i + " | " + ANIM_ITEM.tar + " | " + ANIM_SPRITE.opacity);

		ANIM_SPR.scale.x += (ANIM_ITEM.tar - ANIM_SPR.scale.x) * ANIM_ITEM.alpha;
		ANIM_SPR.scale.y += (ANIM_ITEM.tar - ANIM_SPR.scale.y) * ANIM_ITEM.alpha;

		//Turns out the sprite scale is an object
		//console.log(ANIM_SPR.scale.x);
	}

	//Loop through all the items within the animation queue.
	for(var i = 0; i < ANIM_COUNTDOWN_QUEUE.length; i++){
		//Grab the individual variables from the object.
		var ANIM_ITEM = ANIM_COUNTDOWN_QUEUE[i];
		var ANIM_SPR = ANIM_ITEM.sprite;

		//Smoothly change the alpha of the sprite to the target alpha using linear interpolation.
		//That's right
		//SMOOOOOOOOOOOOOOOOOOOOOTHHHHHHHH
		ANIM_SPR.alpha += (ANIM_ITEM.tar - ANIM_SPR.alpha) * ANIM_ITEM.alpha;
		ANIM_SPR.alpha += (ANIM_ITEM.tar - ANIM_SPR.alpha) * ANIM_ITEM.alpha;
	}

	//var mousePosition = renderer.plugins.interaction.mouse.global;
	//Loop through all the items within the animation queue. (If you hadn't guessed already)
	for(var i = 0; i < ANIM_BOMB_QUEUE.length; i++){
		//Grab the individual variables from the object.
		var ANIM_ITEM = ANIM_BOMB_QUEUE[i];
		var ANIM_SPR = ANIM_ITEM.sprite;

		//Get the mouse position on the screen.
		var mouse = renderer.plugins.interaction.mouse.global

		//Define the speed that the bomb will travel at
		var speed = 100;
		var step = 10;

		//Define the variables used to calculate where the bomb needs to move to follow the mouse.
		var arg = (mouse.y-ANIM_SPR.y) / (mouse.x-ANIM_SPR.x);
		var alpha = Math.atan(arg);

		//Make sure the bomb is able to travel in both directions.
		var mult = 1;
		if(mouse.x - ANIM_SPR.x < 0){ mult = -1; }

		//Calculate the direction the mouse needs to travel both vertically and horizontally to follow the bomb.
		var dx = mult * step * Math.cos(alpha) * BOMB_SPEED_MULTI;
		var dy = mult * step * Math.sin(alpha) * BOMB_SPEED_MULTI;

		//Switch through all of the types of bombs.
		switch(ANIM_ITEM.bombType){
			//Defualt bomb (follows the mouse for 3 seconds, explodes on impact or after time).
			case 0:

				//Step the bomb closer to the mouse cursor.
				ANIM_SPR.x += dx;
				ANIM_SPR.y += dy;

				//Make the bomb have a cool lil' wobble effect.
				ANIM_SPR.rotation = Math.sin(FRAME_NO /10) /10;
			break;

			case 1:

				//Step the bomb closer to the mouse cursor, however, a little faster).
				ANIM_SPR.x += (dx *1.4);
				ANIM_SPR.y += (dy *1.4);

				//Make the bomb have a cool lil' wobble effect.
				ANIM_SPR.rotation = Math.sin(FRAME_NO /10) /10;
			break;

			case 2:

				//Step the bomb closer to the mouse cursor.
				ANIM_SPR.x += dx;
				ANIM_SPR.y += dy;

				//Make the bomb have a cool lil' wobble effect.
				ANIM_SPR.rotation = Math.sin(FRAME_NO /10) /10;
			break;
		}
	}

	//Loop through all the items within the audio queue.
	for(var i = 0; i < AUDIO_FADE_QUEUE.length; i++){
		//Grab the individual variables from the object.
		var AUDIO = AUDIO_FADE_QUEUE[i];

		//Rotate the sprite along a sin wave, to.
		AUDIO.audio.volume += (0 - AUDIO.audio.volume) * AUDIO.alpha;
		if(AUDIO.audio.volume - 0.05 < 0){ AUDIO.audio.stop(); AUDIO.audio.volume = 0.05; AUDIO_FADE_QUEUE.splice(i, 1); }
	}

	//Loop through all the items within the fade animation queue.
	for(var i = 0; i < ANIM_FADE_QUEUE.length; i++){
		//Grab the individual variables from the object.
		var ANIM_ITEM = ANIM_FADE_QUEUE[i];

		//Fade out the bomb
		ANIM_ITEM.alpha += (0 - ANIM_ITEM.alpha) * 0.3;
		if(ANIM_ITEM.alpha - 0.05 < 0){ app.removeChild(ANIM_ITEM); ANIM_FADE_QUEUE.splice(i, 1); }
	}

	//Loop through all the items within the fade queue.
	for(var i = 0; i < ANIM_LIFE_QUEUE.length; i++){
		//Grab the individual variables from the object.
		var ANIM_ITEM = ANIM_LIFE_QUEUE[i];

		var speed = 0.1;
		ANIM_ITEM.alpha += (1 - ANIM_ITEM.alpha) * speed;
		ANIM_ITEM.scale.x += (1 - ANIM_ITEM.scale.x) * speed;
		ANIM_ITEM.scale.y += (1 - ANIM_ITEM.scale.y) * speed;
	}

	//Loop through all the items within the fade queue.
	for(var i = 0; i < ANIM_SHAKE_QUEUE.length; i++){
		//Grab the individual variables from the object.
		var ANIM_ITEM = ANIM_SHAKE_QUEUE[i];

		var randRange = function(min, max) {
		    return Math.random() * (max - min) + min;
		}

		//Set the how far we want the items to be offsetted.
		var offsetScale = 5;

		//Offset the sprite.
		if(PLAYER_LIVES < 2){
			ANIM_ITEM.sprite.x = ANIM_ITEM.init.x + randRange(-offsetScale, offsetScale);
			ANIM_ITEM.sprite.y = ANIM_ITEM.init.y + randRange(-offsetScale, offsetScale);
		}
	}
}

function logic()
{
	//lol probs not even gonna use this
}

function rand(range){
	return Math.floor(Math.random() * range);
}

function getBombAnimIndex(uid){
	//Loop through all of the items within the bomb animation queue.
	var bIndex = -1;
	ANIM_BOMB_QUEUE.forEach(function(item, index){
		//If the UID matches, return the index of the bomb within the array.
		if(String(item.id) == String(uid)){
			console.log("BOMB UID MATCH YAY [" + item.id + " | " + uid + "]");

			//Set the index to be returned from the function.
			bIndex = index;

			//Remove the correlating one from the UID array so there is
			//less stress when collision checking the UIDs.
			BOMB_UIDS.splice(BOMB_UIDS.indexOf(uid), 1);
		}
	});

	//Return the index of the item within the array
	return bIndex;

	//PRO TIP FOR NEXT TIME I DO ARRAYS: Use .forEach(), it looks cleaner.

	//ANOTHER PRO TIP: DON'T FORGET TO NOT USE UID(); WHEN PUSHING THE SPRITE ANIMATION OBJECT TO THE ARRAY 
	//AFTER YOU'VE ALREADY GENERATED ONE FOR THE SPRITE CAUSE YOU'LL GET TWO DIFFERENT UIDS
	//AND THEN IT WON'T WORK
	//UGH
}

function addBomb(type){
	/*	
		STACK OVERFLOW: A 6-character alphanumeric sequence is pretty enough to randomly index a 10k collection 
		(366 = 2.2 billion and 363 = 46656). If you do collision checking, the number of digits can be reduced 3 or 4, 
		but note that the performance will reduce linearly when you generate more and more UIDs.
	*/
	var UID = function() {
	    while (true) {
	        var uid = ("0000" + ((Math.random() * Math.pow(36, 4)) | 0).toString(36)).slice(-4);
	        if (!BOMB_UIDS.hasOwnProperty(uid)) {
	            BOMB_UIDS[uid] = true;
	            return uid;
	        }
	    }
	}

	//Configure the bomb according to the various types.
	var bombConfig = {};
	switch(type){
		case 0:
			bombConfig.tex = rsrc.spr_bomb_0.texture;
			bombConfig.scale = 0.6;
			bombConfig.damage = 1;
			bombConfig.life = 5000;
		break;
		case 1:
			bombConfig.tex = rsrc.spr_bomb_1.texture;
			bombConfig.scale = 0.55;
			bombConfig.damage = 1;
			bombConfig.life = 3000;
		break;
		case 2:
			bombConfig.tex = rsrc.spr_bomb_2.texture;
			bombConfig.scale = 0.6;
			bombConfig.damage = 3;
			bombConfig.life = 7000;
		break;
	}

	//Create a new bomb sprite with the default bomb texture.
	var newBomb = new PIXI.Sprite(bombConfig.tex);
	newBomb.interactive = true;
	newBomb.scale.set(bombConfig.scale);
	newBomb.anchor.set(0.5);

	//Set the bomb's position to a random location on a random side of the screen.
	var bPos = bombPos();
	newBomb.position.set(bPos.x, bPos.y);

	//Add the new bomb sprite to the stage.
	app.addChild(newBomb);

	//Create a new uid (unique identifier) for the bomb so it can be deleted from the stage later.
	var bUID = UID();

	//Add the bomb to the animation queue.
	ANIM_BOMB_QUEUE.push({id: bUID, sprite: newBomb, bombType: type});

	//Wait the specified amount of seconds before fading out.
	var bombTimeout = setTimeout(function(){
		//Make the bomb unable to interact with the cursor.
		newBomb.interactive = false;

		//Push the bomb into the fadeout animation queue.
		ANIM_FADE_QUEUE.push(newBomb);
	}, bombConfig.life);

	//Hook into the 'mouseover' event of the bomb sprite to see when it is touching the cursor.
	newBomb.on('mouseover', function(){
		//I AM A SILLY BOY
		//VERY SILLY BOY
		//PRO TIP:
		//DO NOT TRY AND CALL .splice() ON ANIM_BOMB_QUEUE[0] BECAUSE IT'S NOT A ARRAY LOL
		//LOOOOOOOOOOOOOOOOL

		//Get the index of the bomb in the animation queue using the UID.
		var bIndex = getBombAnimIndex(bUID);

		//Get the sprite from the animation queue array so it's location can be used to spawn the bomb.
		var ANIM_SPR = ANIM_BOMB_QUEUE[bIndex].sprite;

		//Add an explosion at the location of the bomb sprite.
		addSplode(ANIM_SPR);

		//Stop animating the bomb.
		ANIM_BOMB_QUEUE.splice(bIndex, 1);

		//Remove the sprite from the stage.
		app.removeChild(ANIM_SPR);

		newBomb.emit('splode', bombConfig.damage);
	});

	return newBomb;
}

function bombPos(){
	//Get a random number between 0-2 to choose what side the bomb will start on. 0- LEFT 1- BOTTOM 2- RIGHT
	var randSide = rand(3);
	var loc = null;

	//Loop through all of the sides.
	switch(randSide){
		//Random y position on the left side of the screen.
		case 0:
			return {x: -50, y: rand(renderer.height - 125) + 125 };
		break;

		//Random x position on the bottom of the screen.
		case 1:
			return {x: rand(renderer.width), y: renderer.height + 50};
		break;

		//Random y position on the right side of the screen.
		case 2:
			return {x: renderer.width + 50, y: rand(renderer.height - 125) + 125 };
		break;
	}
}

function addSplode(point){
	//Define an array for all of the explosion textures to be put in.
	var splodeFrames = new Array();
	//Loop through all the textures defined in the spritesheet and add them to the array.
    for (var i = 0; i < 14; i++) {
        var val = i < 10 ? '0' + i : i;

        // magically works since the spritesheet was loaded with the pixi loader
        splodeFrames.push(PIXI.Texture.fromImage('splode_0' + val + '.png', true, PIXI.SCALE_MODES.NEAREST));
    }

    //Define the explosion sprite variable (unfortunately, 
    //due to the engine version and compatibility issues, we can't use PIXI.extras.animatedSprite()).
    var splodeSpr = new PIXI.Sprite(splodeFrames[0]);
    splodeSpr.position.set(point.x, point.y + 60);
    splodeSpr.anchor.set(0.5, 1);
    splodeSpr.scale.set(1.5);

    //Add the explosion sprite to the page.
    app.addChild(splodeSpr);

    //Define a variable that will be used to loop through the frames.
    var splodeFrame = 0;

    //Play the explosion sound effect.
    var splodeSfx = audio.getAudio('audio-sfx-splode');
    splodeSfx.volume = 0.3;
    splodeSfx.play();

    //Define an interval that will be used to animated the bomb explosion by changing the texture of the sprite.
    var splodeAnim = setInterval(function(){
    	splodeSpr.texture = splodeFrames[splodeFrame];
    	splodeFrame++;

    	if(splodeFrame > 8 && splodeFrame < 14){
    		splodeSpr.y -= 25;
    	}


    	//If the sprite has showed all of the frames, remove the animation interval and remove the sprite from the stage.
    	if(splodeFrame > splodeFrames.length - 1){
    		clearInterval(splodeAnim); 
    		app.removeChild(splodeSpr);
    	}
    }, 50);
}

function countdownStart(onComplete){
	//Define the frames needed for the countdown sprite animation.
	var countdownFrames = [
		rsrc.spr_count_3.texture,
		rsrc.spr_count_2.texture,
		rsrc.spr_count_1.texture,
		rsrc.spr_count_0.texture
	]

	//Create the 'countdown text' sprite.
	var countdownSpr = new PIXI.Sprite(countdownFrames[0]);
    countdownSpr.position.set(renderer.width / 2, renderer.height / 2);
    countdownSpr.anchor.set(0.5, 0.5);

	//Create a timer that ticks every 1 second, and make sure the timer repeats itself three times for the countdown.
	var countdownTimer = time.createTimer(1000);
	countdownTimer.repeat = 3;

	//Wait 1 second and then start the countdown timer, whilst adding the countdown timer sprite to the stage.
	setTimeout(function(){
		ANIM_COUNTDOWN_QUEUE.push({
			sprite: countdownSpr,
			tar: 0,
			alpha: 0.04
		});
		app.addChild(countdownSpr);
		countdownTimer.start();
	}, 1000);

	//Define the audio sound to play when counting down.
	var countSfx = audio.getAudio('audio-sfx-count');
	countSfx.volume = 0.9;

	//Hook into the 'start', 'repeat' and 'end' timer events.
	countdownTimer.on('start', function(elapsed){console.log('start'); countSfx.play();});
	countdownTimer.on('repeat', function(elapsed, repeat){ 
		countdownSpr.texture = countdownFrames[repeat];
		countdownSpr.alpha = 1;
		countSfx.play();
		//Run the 'onComplete' function and cleanup the countdown sprite and animations here, 
		//since the 'end' event on the timer is weird and is called one second after the countdown finished.
		if(repeat == 3){
			onComplete();
		}
	});
	countdownTimer.on('end', function(elapsed){
		//Remove the countdown sprite from the stage, and remove the animation from the queue.
		app.removeChild(countdownSpr);
		ANIM_COUNTDOWN_QUEUE = new Array();
	});
}

function gameInfoBack(){
	//Create a new instance of the PIXI.Graphics() renderer.
	var graph = new PIXI.Graphics();
	graph.zOrder = 1;
	graph.beginFill(0xC62828, 0);
	graph.lineStyle(0);

	//Move the line in the slanted rectangle shape.
	graph.moveTo(0,0);
	graph.lineTo(0, 125);
	graph.lineTo(renderer.width, 100);
	graph.lineTo(renderer.width, 0);
	graph.lineTo(0, 0);
	graph.endFill();

	//Animate the Graphics object and make it fade in.
	ANIM_DRAW_FADE_QUEUE.push({
		graphics: graph,
		start: {x: 0, y: 0},
		points: [{x: 0, y:0}, {x: 0, y: 125}, {x: renderer.width, y: 100}, {x: renderer.width, y: 0}, {x: 0, y: 0}],
		alpha: 0.08,
		opacity: 0,
		tar: 1, 
		threshold: 0.01,
		onComplete: null
	});

	//Create a style for the text so it uses the correct font, and is the correct colour and size.
	var counterStyle = new PIXI.TextStyle({
	    fontFamily: 'widepixel',
	    fontSize: 50,
	    fill: '#ffffff'
	});


	//Create a new PIXI.Text object to act as the timer counter.
	var counterText = new PIXI.Text('0.00s', counterStyle);
	counterText.x = -counterText.width;
	counterText.y = 35;
	counterText.alpha = 1;

	//Add the text object to the stage.
	graph.addChild(counterText);

	//Animate the text to fly in from the right.
	ANIM_LERP_QUEUE.push({
		sprite: counterText, 
		alpha: {x: 0.1, y: 1, r: 1, o: 1}, 
		tar: {x: 175, y: 35, r: 0, o: 1}, 
		threshold: 0.5,
		onComplete: function(){
			ANIM_SHAKE_QUEUE.push({ sprite: counterText, init: { x: counterText.x, y: counterText.y}});
		}
	});

	//Determine whether the text should say 'life left' or 'lives left' depending on the amount of lives the player has left.
	var lifeType = " life left"
	if(PLAYER_LIVES > 1) { lifeType =  " lives left"; }

	//Create a new PIXI.Text object to act as the lives counter
	var lifeText = new PIXI.Text(PLAYER_LIVES + lifeType, counterStyle);
	lifeText.anchor.set(1, 0.5);
	lifeText.position.set(renderer.width - 50, - 15);
	lifeText.alpha = 0;

	//Add the text object to the stage.
	graph.addChild(lifeText);

	//Push the text into the animation queue.
	ANIM_LIFE_QUEUE.push(lifeText);

	//Animate the text to fly in from the top.
	ANIM_LERP_QUEUE.push({
		sprite: lifeText, 
		alpha: {x: 1, y: 0.1, r: 1, o: 0.1}, 
		tar: {x: renderer.width - 75, y: 48, r: 0, o: 1}, 
		threshold: 0.01,
		onComplete: function(){
			ANIM_SHAKE_QUEUE.push({ sprite: lifeText, init: { x: lifeText.x, y: lifeText.y}});
		}
	});

	//Create a new sprite for the timer icon the game uses.
	var timerSpr = new PIXI.Sprite(rsrc.spr_timer.texture);
	timerSpr.position.set(-timerSpr.width, 35);
	timerSpr.anchor.set(0.5, 0.5);
	timerSpr.alpha = 0.7;

	//Scale the sprite down since the raw image is quite big.
	timerSpr.scale.set(0.17);

	//Add the timer sprite to the stage.
	graph.addChild(timerSpr);

	//Animate the timer icon to fly in from the right.
	ANIM_LERP_QUEUE.push({
		sprite: timerSpr, 
		alpha: {x: 0.1, y: 1, r: 0.05, o: 0.03}, 
		tar: {x: 90, y: 60, r: -0.2, o: 0.8}, 
		threshold: 0.5,
		onComplete: function(){
			ANIM_SHAKE_QUEUE.push({ sprite: timerSpr, init: { x: timerSpr.x, y: timerSpr.y}});
		}
	});

	//Add the PIXI.Graphics() object to the stage.
	app.addChild(graph);

	//Return the elements created so they can be used within the various game states.
	return {graphBack: graph, textBack: counterText, textLives: lifeText, iconBack: timerSpr}; 
}

function clearQueue(){
	ANIM_LERP_QUEUE = new Array();
	ANIM_DRAW_FADE_QUEUE = new Array();
	ANIM_HOVER_QUEUE = new Array();
	ANIM_ROTATE_QUEUE = new Array();
	ANIM_COUNTDOWN_QUEUE = new Array();
	ANIM_BOMB_QUEUE = new Array();
	ANIM_FADE_QUEUE = new Array();
	ANIM_LIFE_QUEUE = new Array();
	ANIM_SHAKE_QUEUE = new Array();
	//DO NOT QUEUE THE AUDIO QUEUE - IT IS USED IN STATE TRANSITIONS.
}

function switchState(newState, dead){
	//Define a function to make a sprite unable to be interacted with
	var disableInteract = function(item){
		item.interactive = false;
		item.buttonMode = false;
	};

	//Remove all of the bomb timeouts.
	BOMB_TIMEOUT.forEach(function(item, index){
		clearTimout(item);
	});

	//Clear the bomb timeout array so it can be used again.
	BOMB_TIMEOUT = new Array();

	//Define a variable to determine how slow the audio will fade out.
	var AUDIO_ALPHA = 0.08;

	//If the player has died, instantly cut out the music.
	if(dead != null){ AUDIO_ALPHA = 1; }

	//Add the audio to the fade queue
	AUDIO_FADE_QUEUE.push({audio: AUDIO_CURRENT, alpha: AUDIO_ALPHA});

	//Disable interactions for all of the sprites on the stage.
	for (var i = app.children.length - 1; i >= 0; i--) { disableInteract(app.children[i]); }

	//If 'dead' is false, play the normal transition.
	if(dead == null){
		//Add and fade in the scene change div to cover all elements on the stage.
		$("body").append("<div class='scene' id='sceneChange' style='opacity: 0'></div>");
		$("#sceneChange").animate( { opacity: 1 }, 'fast', 'swing', function(){
			//Remove all animations from queue
			clearQueue();
			//Remove all the children from the stage after the div faded in.
			for (var i = app.children.length - 1; i >= 0; i--) { app.removeChild(app.children[i]);}
			setTimeout(function(){

				//ALSO THIS IS A DISGUSTING YUCK FIX SINCE PIXI.GRAPHICS() IS BEING WEIRD ASOPDKASOPDKAPSDKPAOSKDPAOSKD
				//BUT IT WORKS SO YAY
				//Remove the scene change div from the screen and change the state.
				$("#sceneChange").remove();
				state(newState);
			}, 200);
		});
	}
	else{
		//Add and fade out the scene change div to give a 'white flash' effect.
		$("body").append("<div class='scene dead' id='sceneChange' style='opacity: 1'></div>");
		//Remove all animations from queue
		clearQueue();
		//Remove all the children from the stage after the div faded in.
		for (var i = app.children.length - 1; i >= 0; i--) { app.removeChild(app.children[i]);}
		$("#sceneChange").animate( { opacity: 0 }, 'slow', 'swing', function(){
			setTimeout(function(){
				//Remove the scene change div from the screen and change the state.
				$("#sceneChange").remove();
				state(newState);
			}, 200);
		});
	}
}

//I'm cool
var url = getAllUrlParams();
if(url.debug != null){ $(document.body).append("<div class='debug'>DEBUG MENU: <button onclick='BOMB_SPAWN = false; switchState(\"menu\")'>menu state</button><button onclick='BOMB_SPAWN = false; switchState(\"dead\", true)'>dead state</button><button onclick='switchState(\"classic\")'>classic state</button></div>"); }

//Load the json required for the menu text, and set it to the MENU_TEXT variable.
$.getJSON("js/menu.json",{}, function(json) {
    MENU_TEXT = json;
    console.log(json);
});

//Execute the script when the page loads (shorthand version of $( document ).ready()).
$(function() {
	//Listen for the init button to be clicked.
	$("#initbtn").on('click', (()=>{
		//Hide the init button and add the renderer.
		document.body.appendChild(renderer.view);
		$("#initbtn").fadeOut('fast', ()=>{
			// Load the textures the game needs.
			loader
			.add("spr_dev", "sprites/debug/dev.png")
			.add("spr_ship_0", "sprites/ship/ship_0.png")
			.add("spr_ship_1", "sprites/ship/ship_1.png")
			.add("spr_ship_mask", "sprites/ship/ship_mask.png")
			.add("spr_title_old", "sprites/misc/title_light.png")
			.add("spr_title", "sprites/misc/title-new_revise.png")
			.add("spr_btn_play", "sprites/button/button_play.png")
			.add("spr_btn_classic", "sprites/button/button_classic.png")
			.add("spr_btn_survival", "sprites/button/button_survival.png")
			.add("spr_btn_hardcore", "sprites/button/button_hardcore.png")
			.add("spr_btn_credits", "sprites/button/button_credits.png")
			.add("spr_count_3", "sprites/misc/countdown_3.png")
			.add("spr_count_2", "sprites/misc/countdown_2.png")
			.add("spr_count_1", "sprites/misc/countdown_1.png")
			.add("spr_count_0", "sprites/misc/countdown_0.png")
			.add("spr_timer", "sprites/misc/timer.png")
			.add("spr_splosion", "sprites/misc/splosion.json")
			.add("spr_bomb_0", "sprites/misc/bomb_0.png")
			.add("spr_bomb_1", "sprites/misc/bomb_1.png")
			.add("spr_bomb_2", "sprites/misc/bomb_2.png")
			.add("spr_dead", "sprites/misc/dead.png")
			.add("spr_btn_again", "sprites/button/button_again.png")
			.add("spr_btn_return", "sprites/button/button_return.png")
			.add("spr_clipboard", "sprites/misc/clipboard.png")
			.add(REQUIRED_AUDIO)
			.load(function(loader, resources) {
				//Check whether the user has opted to skip to a specific state by passing '?state=<state>' into the URL.
				//(USED FOR DEBUGGING)
				var urlParams = getAllUrlParams();
				if(urlParams.state != null){
					//Make the renderer visible again.
					renderer.view.style.opacity = "1";

					//Set 'INTRO' bool to false so music can be played at the menu
					INTRO = false;

					//Goto the specified state.
					state(urlParams.state);
				}
				else{
					//Fade out the 'load percentage' text.
					$('#loadmain').animate( { opacity: 0 }, 'slow', 'swing', function(){
						//Change the text to the headphone recommendation and and fade in the text.
						$("#loadtext").html("HEADPHONES & 1080p DISPLAY RECOMMENDED");
						$('#loadmain').animate( { opacity: 1 }, 'slow', 'swing', function(){

							//Define the audio outside the menu state function so it can be played before the menu screen.
							//Get a random background song from the PIXI audio manager and
							AUDIO_CURRENT = audio.getAudio('audio-menu-' + Math.floor(Math.random() * 2));
							//decrease the volume so it doesn't blast the user when they start the game.
							AUDIO_CURRENT.loop = true;
							AUDIO_CURRENT.volume = 0.05;
							AUDIO_CURRENT.play();

							//Wait three seconds and then fade in the canvas and remove the 'headphones recommended' text.
							setTimeout(function(){
								$('#pixiRender').animate( { opacity: 1 }, 'slow', 'swing', function(){
									//When the fading animation completes, remove the div element containing the loading text from the page.
									$("#loadmain").remove();

									//Set the game state to the menu screen.
									state("menu");
								});
							}, 3000);
						});
					});
				}

				//Call the 'loop' function to start rendering to the canvas.
				loop();

			}).on("progress", function(loader)
			{
				//Update the loading text element on the page.
				$("#loadtext").html("LOADING BOMBCORP... (" + Math.floor(loader.progress) + "%).");

				//Also log the loading proccess to the console.
				console.log("LOADING BOMBCORP (" + Math.floor(loader.progress) + "%)."); 
			});
		})	
	}));
});