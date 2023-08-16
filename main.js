const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1030;
canvas.height = 650;

const player1Name = "player 1";
const player2Name = "Player 2";

const player1 = createPlayer(50, 0, "char.png", true, "efek.png");
const player2 = createPlayer(canvas.width - 50 - 40, 0, "s.png", false, "efek.png");

const gravity = 1;
const groundHeight = canvas.height - 64;

const platforms = [
  { x: 150, y: groundHeight - 100, width: 100, height: 10 },
  { x: 400, y: groundHeight - 150, width: 120, height: 10 },
  { x: 600, y: groundHeight - 200, width: 150, height: 10 },
];

const backgroundImage = new Image();
backgroundImage.src = "pix.jpg";

const groundImage = new Image();
groundImage.src = "batu.jpg";

const keys = {};

document.addEventListener("keydown", (event) => {
  keys[event.key] = true;
});

document.addEventListener("keyup", (event) => {
  keys[event.key] = false;
});

function checkCollision(rect1, rect2) {
  return rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y;
}

function createPlayer(x, y, imageSrc, isPlayer1, attackEffectImageSrc) {
  const player = {
    x: x,
    y: y,
    width: 40,
    height: 60,
    xSpeed: 5,
    ySpeed: 0,
    jumping: false,
    image: new Image(),
    attackEffect: new Image(),
    isPlayer1: isPlayer1,
    health: 100,
    isAttacking: false,
    attackCooldown: 0,
    isAttackEffectActive: false,
    isHit: false,
    hitCooldown: 0,
    facingRight: isPlayer1,
  };

  player.image.src = imageSrc;
  player.attackEffect.src = attackEffectImageSrc;

  return player;
}

function drawBackground() {
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
}

function drawGround() {
  for (let x = 0; x < canvas.width; x += groundImage.width) {
    ctx.drawImage(groundImage, x, groundHeight);
  }
}

function drawHealthBar(player, x, y, width, height) {
  const healthPercentage = player.health < 0 ? 0 : player.health;
  const healthWidth = (healthPercentage / 100) * width;

  ctx.fillStyle = "red";
  ctx.fillRect(x, y, healthWidth, height);
  ctx.strokeStyle = "white";
  ctx.strokeRect(x, y, width, height);
}

function drawGameTime(gameTime) {
  if (gameTime < 0) {
    gameTime = 0;
  }

  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.textAlign = "center";
  ctx.fillText(formatTime(gameTime), canvas.width / 2, 30);
}

function formatTime(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${padZero(minutes)}:${padZero(seconds)}`;
}

function padZero(number) {
  return number.toString().padStart(2, "0");
}

let startTime = performance.now();
let isGameOver = false;

function gameLoop(timestamp) {
  if (isGameOver) return;

  const elapsedTime = timestamp - startTime;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawGround();
  updatePlayer(player1, keys["ArrowLeft"], keys["ArrowRight"], keys["ArrowUp"], keys["ArrowDown"]);
  updatePlayer(player2, keys["a"], keys["d"], keys["w"], keys["s"]);
  drawPlayer(player1);
  drawPlayer(player2);

  drawHealthBar(player1, 10, 10, 200, 20);
  drawHealthBar(player2, canvas.width - 210, 10, 200, 20);
  drawGameTime(180000 - elapsedTime);

  ctx.fillStyle = "brown";
  for (const platform of platforms) {
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

    if (checkCollision(player1, platform) && player1.ySpeed > 0) {
      player1.y = platform.y - player1.height;
      player1.ySpeed = 0;
      player1.jumping = false;
    }
    if (checkCollision(player2, platform) && player2.ySpeed > 0) {
      player2.y = platform.y - player2.height;
      player2.ySpeed = 0;
      player2.jumping = false;
    }
  }

  if (checkCollision(player1, player2)) {
    if (player1.isAttacking) {
      player2.health -= 10;
      player2.isAttackEffectActive = true;
    } else if (player2.isAttacking) {
      player1.health -= 10;
      player1.isAttackEffectActive = true;
    } else {
      player1.isAttackEffectActive = false;
      player2.isAttackEffectActive = false;
    }
  }

  if (player1.isHit && player1.hitCooldown === 0) {
    player1.image.src = "char_hit.png";
    player1.hitCooldown = 30;
  } else if (player1.hitCooldown > 0) {
    player1.hitCooldown -= 1;
  } else {
    player1.image.src = "char.png";
    player1.isHit = false;
  }

  if (player2.isHit && player2.hitCooldown === 0) {
    player2.image.src = "char_hit.png";
    player2.hitCooldown = 30;
  } else if (player2.hitCooldown > 0) {
    player2.hitCooldown -= 1;
  } else {
    player2.image.src = "s.png";
    player2.isHit = false;
  }

  checkWinner(elapsedTime);
  requestAnimationFrame(gameLoop);
}

function updatePlayer(player, moveLeft, moveRight, jump, attack) {
  player.ySpeed += gravity;
  player.y += player.ySpeed;

  if (moveLeft) {
    player.x -= player.xSpeed;
    player.facingRight = false;
  }

  if (moveRight) {
    player.x += player.xSpeed;
    player.facingRight = true;
  }

  if (player.x < 0) {
    player.x = 0;
  } else if (player.x > canvas.width - player.width) {
    player.x = canvas.width - player.width;
  }

  if (player.y > groundHeight - player.height) {
    player.y = groundHeight - player.height;
    player.ySpeed = 0;
    player.jumping = false;
  }

  if (jump && !player.jumping) {
    player.ySpeed = -25;
    player.jumping = true;
  }

  if (player.attackCooldown > 0) {
    player.attackCooldown -= 1;
  }

  if (attack && player.attackCooldown === 0) {
    player.isAttacking = true;
    player.attackCooldown = 30;
  } else {
    player.isAttacking = false;
  }
}

function drawPlayer(player) {
  if (player.isAttacking) {
    if (player.facingRight) {
      ctx.globalAlpha = 0.7;
      ctx.drawImage(player.attackEffect, player.x, player.y, player.width, player.height);
      ctx.globalAlpha = 1.0;
    } else {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.globalAlpha = 0.7;
      ctx.drawImage(player.attackEffect, -player.x - player.width, player.y, player.width, player.height);
      ctx.restore();
      ctx.globalAlpha = 1.0;
    }
  } else {
    if (player.isHit) {
      ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
    } else {
      if (player.facingRight) {
        ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
      } else {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(player.image, -player.x - player.width, player.y, player.width, player.height);
        ctx.restore();
      }
    }
  }

  ctx.fillStyle = "white";
  ctx.font = "18px Arial";
  const playerName = player.isPlayer1 ? player1Name : player2Name;
  ctx.fillText(playerName, player.x, player.y - 10);
}

function checkWinner(elapsedTime) {
  if (player1.health <= 0 || player2.health <= 0) {
    isGameOver = true;
    let winner = null;

    if (player1.health > player2.health) {
      winner = player1Name;
    } else if (player2.health > player1.health) {
      winner = player2Name;
    }

    if (winner) {
      alert(`Game Over!\nWinner: ${winner}`);
    } else {
      alert("Game Over!\nIt's a draw!");
    }

    // Delay for a few seconds before redirecting
    setTimeout(() => {
      // Replace 'your_new_page_url_here' with the actual URL of the next page
      const nextPageURL = "go.html";
      window.location.href = nextPageURL;
    }, 0); // Redirect after 3 seconds (adjust as needed)

    // Reset game state
    isGameOver = false;
    player1.health = 100;
    player2.health = 100;
    startTime = performance.now();

    requestAnimationFrame(gameLoop);
  }
}

backgroundImage.onload = function () {
  player1.spawnStartTime = performance.now();
  player2.spawnStartTime = performance.now();
  startTime = performance.now();

  requestAnimationFrame(gameLoop);
};
