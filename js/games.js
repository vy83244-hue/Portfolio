
(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const grid = $("ws-game-grid");
  const modal = $("ws-game-modal");
  const content = $("ws-game-content");
  const title = $("ws-modal-title");
  const subtitle = $("ws-modal-subtitle");
  if (!grid || !modal || !content) return;

  const games = [
    ["ttt", "Tic-Tac-Toe", "⭕", "classic", "Play a classic X and O match."],
    ["snake", "Snake", "🐍", "classic", "Collect food and avoid crashing."],
    ["2048", "2048 Puzzle", "🔢", "puzzle", "Merge number tiles to reach 2048."],
    ["memory", "Memory Match", "🧠", "puzzle", "Find matching pairs of cards."],
    ["brick", "Brick Breaker", "🧱", "classic", "Bounce the ball and break bricks."],
    ["space", "Space Invaders", "👾", "classic", "Defend against enemy waves."],
    ["pong", "Pong", "🏓", "classic", "Play paddle tennis against the CPU."],
    ["mines", "Minesweeper", "💣", "puzzle", "Find safe cells and avoid mines."],
    ["rps", "Rock Paper Scissors", "✊", "classic", "Challenge the computer."],
    ["mole", "Whack-a-Mole", "🐹", "challenge", "Hit targets before time runs out."],
    ["sudoku", "Sudoku", "🔢", "puzzle", "Solve a number-grid puzzle."],
    ["simon", "Simon Says", "🎨", "challenge", "Repeat the growing color sequence."],
    ["reaction", "Reaction Test", "⚡", "challenge", "Test your reaction speed."],
    ["typing", "Typing Challenge", "⌨️", "challenge", "Test your typing speed and accuracy."],
    ["cyber", "Cyber Security Defender", "🛡️", "cyber", "Defend your server from digital attacks."]
  ];

  let cleanups = [];
  let best = {};
  try { best = JSON.parse(localStorage.getItem("wsArcadeBest") || "{}"); } catch (_) {}

  function saveBest(id, score) {
    if (score > (best[id] || 0)) {
      best[id] = score;
      try { localStorage.setItem("wsArcadeBest", JSON.stringify(best)); } catch (_) {}
    }
  }

  function addCleanup(fn) { cleanups.push(fn); }
  function listen(el, event, fn, opts) {
    el.addEventListener(event, fn, opts);
    addCleanup(() => el.removeEventListener(event, fn, opts));
  }
  function interval(fn, ms) {
    const id = setInterval(fn, ms);
    addCleanup(() => clearInterval(id));
    return id;
  }
  function timeout(fn, ms) {
    const id = setTimeout(fn, ms);
    addCleanup(() => clearTimeout(id));
    return id;
  }
  function rafLoop(fn) {
    let id = 0, stopped = false;
    const step = t => {
      if (stopped) return;
      fn(t);
      id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    addCleanup(() => { stopped = true; cancelAnimationFrame(id); });
  }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function button(text, fn, cls = "ws-control") {
    const b = el("button", cls, text);
    b.type = "button";
    b.addEventListener("click", fn);
    return b;
  }

  function status(text) {
    let n = content.querySelector(".ws-game-status");
    if (!n) {
      n = el("div", "ws-game-status");
      content.prepend(n);
    }
    n.textContent = text;
  }

  function actions() {
    const n = el("div", "ws-game-actions");
    content.append(n);
    return n;
  }

  function resetContent() {
    content.replaceChildren();
  }

  function drawCards(filter = "all", search = "") {
    grid.replaceChildren();
    const term = search.toLowerCase().trim();
    const filtered = games.filter(g =>
      (filter === "all" || g[3] === filter) &&
      (g[1] + " " + g[4]).toLowerCase().includes(term)
    );

    filtered.forEach(g => {
      const card = el("article", "ws-game-card");
      card.append(el("div", "ws-game-icon", g[2]));
      card.append(el("h3", "", g[1]));
      card.append(el("p", "", g[4]));
      if (best[g[0]]) card.append(el("p", "", "Personal best: " + best[g[0]]));
      card.append(button("▶ Play Game", () => openGame(g[0]), "ws-game-btn"));
      grid.append(card);
    });

    if (!filtered.length) grid.append(el("p", "", "No games found. Try another search."));
  }

  const search = $("ws-game-search");
  const category = $("ws-game-category");
  if (search) search.addEventListener("input", () => drawCards(category?.value, search.value));
  if (category) category.addEventListener("change", () => drawCards(category.value, search?.value));

  function closeGame() {
    cleanups.splice(0).forEach(fn => { try { fn(); } catch (_) {} });
    modal.hidden = true;
    content.replaceChildren();
  }

  const closeButton = $("ws-game-close");
  if (closeButton) closeButton.addEventListener("click", closeGame);
  modal.addEventListener("click", e => { if (e.target === modal) closeGame(); });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !modal.hidden) closeGame();
  });

  function openGame(id) {
    closeGame();
    const g = games.find(x => x[0] === id);
    if (!g) return;
    title.textContent = g[2] + " " + g[1];
    subtitle.textContent = g[4];
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    addCleanup(() => { document.body.style.overflow = ""; });

    const start = {
      ttt: gameTTT, snake: gameSnake, "2048": game2048,
      memory: gameMemory, brick: gameBrick, space: gameSpace,
      pong: gamePong, mines: gameMines, rps: gameRPS,
      mole: gameMole, sudoku: gameSudoku, simon: gameSimon,
      reaction: gameReaction, typing: gameTyping, cyber: gameCyber
    }[id];
    if (start) start(id);
  }

  // 1. Tic-Tac-Toe
  function gameTTT() {
    resetContent();
    const board = Array(9).fill("");
    let turn = "X", done = false;
    const b = el("div", "ws-game-board");
    b.style.gridTemplateColumns = "repeat(3, minmax(65px, 100px))";
    const cells = board.map((_, i) => {
      const c = button("", () => play(i), "ws-game-cell");
      c.style.height = "76px";
      b.append(c);
      return c;
    });
    content.append(b);
    const s = el("div", "ws-game-status", "Your turn: X");
    content.prepend(s);
    actions().append(button("Restart", gameTTT));

    function play(i) {
      if (done || board[i]) return;
      board[i] = turn;
      cells[i].textContent = turn;
      cells[i].disabled = true;
      if (winner()) return;
      turn = turn === "X" ? "O" : "X";
      s.textContent = "Turn: " + turn;
      if (!board.includes("")) {
        done = true;
        s.textContent = "It's a draw!";
      }
    }
    function winner() {
      const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      const line = lines.find(a => board[a[0]] && board[a[0]] === board[a[1]] && board[a[1]] === board[a[2]]);
      if (!line) return false;
      done = true;
      s.textContent = turn + " wins!";
      line.forEach(i => cells[i].style.background = "#16655f");
      saveBest("ttt", 1);
      return true;
    }
  }

  // 2. Snake
  function gameSnake(id) {
    resetContent();
    let score = 0, running = true, dir = [1, 0], next = [1, 0];
    let snake, food;
    const canvas = el("canvas", "ws-game-canvas");
    canvas.width = 400; canvas.height = 400;
    content.append(canvas);
    const ctx = canvas.getContext("2d");
    const s = el("div", "ws-game-status");
    content.prepend(s);
    const controls = el("div", "ws-game-controls");
    content.append(controls);

    function reset() {
      score = 0; dir = [1, 0]; next = [1, 0];
      snake = [{x:8,y:10},{x:7,y:10},{x:6,y:10}];
      food = {x:15,y:10}; running = true;
      s.textContent = "Score: 0";
      draw();
    }
    function draw() {
      ctx.fillStyle = "#04101e"; ctx.fillRect(0,0,400,400);
      ctx.fillStyle = "#55e6d0";
      snake.forEach(p => ctx.fillRect(p.x*20+2,p.y*20+2,16,16));
      ctx.fillStyle = "#fb7185";
      ctx.fillRect(food.x*20+3,food.y*20+3,14,14);
    }
    function step() {
      if (!running) return;
      dir = next;
      const head = {x:snake[0].x+dir[0], y:snake[0].y+dir[1]};
      if (head.x<0 || head.x>=20 || head.y<0 || head.y>=20 ||
          snake.some((p,i)=>i>0 && p.x===head.x && p.y===head.y)) {
        running = false; s.textContent = "Game over! Score: " + score;
        saveBest(id, score); return;
      }
      snake.unshift(head);
      if (head.x===food.x && head.y===food.y) {
        score++; s.textContent = "Score: " + score;
        food = {x:Math.floor(Math.random()*20),y:Math.floor(Math.random()*20)};
      } else snake.pop();
      draw();
    }
    function move(x,y) {
      if (x !== -dir[0] || y !== -dir[1]) next = [x,y];
    }
    const key = e => {
      const map = {ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],
        ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]};
      if (map[e.key]) { e.preventDefault(); move(...map[e.key]); }
    };
    listen(document,"keydown",key);
    [["↑",0,-1],["←",-1,0],["↓",0,1],["→",1,0]].forEach(([t,x,y]) =>
      controls.append(button(t,()=>move(x,y))));
    actions().append(button("Restart", reset));
    reset();
    interval(step, 115);
  }

  // 3. 2048
  function game2048() {
    resetContent();
    let board, score = 0;
    const b = el("div", "ws-game-board");
    b.style.gridTemplateColumns = "repeat(4, minmax(0, 75px))";
    const tiles = Array.from({length:16}, () => {
      const t = el("div","ws-game-tile",""); b.append(t); return t;
    });
    content.append(b);
    const s = el("div","ws-game-status");
    content.prepend(s);
    actions().append(button("New Game", game2048));
    function add() {
      const empty = board.map((v,i)=>v===0?i:-1).filter(i=>i>=0);
      if (empty.length) board[empty[Math.floor(Math.random()*empty.length)]] = Math.random()<.9?2:4;
    }
    function draw() {
      board.forEach((v,i) => {
        tiles[i].textContent = v || "";
        tiles[i].style.background = v ? ["","#20384a","#245e62","#397f70","#4c7fbb","#8a65bd","#bf7958"][Math.min(6,Math.log2(v)-1)] || "#286a77" : "#102033";
        tiles[i].style.color = "#fff";
      });
      s.textContent = "Score: " + score + " · Best: " + (best["2048"]||0);
    }
    function move(dir) {
      let changed = false;
      for (let n=0;n<4;n++) {
        let idx = Array.from({length:4},(_,i)=>dir==="left"?n*4+i:dir==="right"?n*4+3-i:dir==="up"?i*4+n:(3-i)*4+n);
        let vals = idx.map(i=>board[i]).filter(v=>v);
        const merged=[];
        for(let i=0;i<vals.length;i++){
          if(vals[i]===vals[i+1]) {merged.push(vals[i]*2);score+=vals[i]*2;i++;}
          else merged.push(vals[i]);
        }
        while(merged.length<4) merged.push(0);
        idx.forEach((cell,j)=>{if(board[cell]!==merged[j])changed=true;board[cell]=merged[j];});
      }
      if(changed){add();draw();saveBest("2048",score);}
    }
    const key=e=>{const m={ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down"};if(m[e.key]){e.preventDefault();move(m[e.key]);}};
    listen(document,"keydown",key);
    [["←","left"],["↑","up"],["↓","down"],["→","right"]].forEach(([t,d])=>content.append(button(t,()=>move(d))));
    function reset(){board=Array(16).fill(0);score=0;add();add();draw();}
    reset();
  }

  // 4. Memory Match
  function gameMemory() {
    resetContent();
    const icons = ["🍎","🍋","🍇","🍒","🐶","🐱","⭐","🚀"];
    const deck = [...icons,...icons].sort(()=>Math.random()-.5);
    let opened=[], matched=new Set(), moves=0;
    const b=el("div","ws-game-board");
    b.style.gridTemplateColumns="repeat(4,minmax(0,75px))";
    const s=el("div","ws-game-status","Find all pairs");
    content.append(s,b);
    deck.forEach((v,i)=>{
      const c=button("?",()=>flip(i),"ws-game-cell");
      c.style.height="70px";b.append(c);
    });
    const cells=[...b.children];
    actions().append(button("Restart",gameMemory));
    function flip(i){
      if(opened.includes(i)||matched.has(i)||opened.length===2)return;
      cells[i].textContent=deck[i];opened.push(i);
      if(opened.length===2){
        moves++;
        if(deck[opened[0]]===deck[opened[1]]){
          opened.forEach(j=>matched.add(j));opened=[];
          if(matched.size===deck.length){s.textContent="You won in "+moves+" moves!";saveBest("memory",Math.max(1,20-moves));}
        } else {
          const pair=[...opened];timeout(()=>{pair.forEach(j=>{if(!matched.has(j))cells[j].textContent="?";});opened=[];},650);
        }
      }
      if(matched.size<deck.length)s.textContent="Moves: "+moves+" · Pairs: "+matched.size/2;
    }
  }

  // 5. Brick Breaker
  function gameBrick() {
    resetContent();
    const c=el("canvas","ws-game-canvas");c.width=480;c.height=340;content.append(c);
    const ctx=c.getContext("2d");
    let x=240,y=280,dx=3,dy=-3,paddle=65,px=207,score=0,playing=true;
    const bricks=Array.from({length:30},(_,i)=>({x:8+(i%10)*47,y:20+Math.floor(i/10)*24,on:true}));
    const s=el("div","ws-game-status","Move the paddle with mouse, touch or arrow keys");
    content.prepend(s);
    function move(e){const r=c.getBoundingClientRect();px=(e.clientX-r.left)*c.width/r.width-paddle/2;}
    listen(c,"pointermove",move);
    listen(document,"keydown",e=>{if(e.key==="ArrowLeft")px-=20;if(e.key==="ArrowRight")px+=20;});
    actions().append(button("Restart",gameBrick));
    rafLoop(()=>{
      if(!playing)return;
      ctx.fillStyle="#04101e";ctx.fillRect(0,0,c.width,c.height);
      bricks.forEach(b=>{if(b.on){ctx.fillStyle="#55e6d0";ctx.fillRect(b.x,b.y,41,15);}});
      ctx.fillStyle="#60a5fa";ctx.fillRect(Math.max(0,Math.min(c.width-paddle,px)),315,paddle,9);
      ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fillStyle="#fff";ctx.fill();
      x+=dx;y+=dy;
      if(x<6||x>c.width-6)dx*=-1;
      if(y<6)dy*=-1;
      if(y>306&&y<325&&x>px&&x<px+paddle)dy=-Math.abs(dy);
      bricks.forEach(b=>{if(b.on&&x>b.x&&x<b.x+41&&y>b.y&&y<b.y+15){b.on=false;dy*=-1;score++;s.textContent="Bricks: "+score+"/30";}});
      if(y>c.height){playing=false;s.textContent="Game over · Bricks broken: "+score;saveBest("brick",score);}
      if(bricks.every(b=>!b.on)){playing=false;s.textContent="You cleared the board!";saveBest("brick",score);}
    });
  }

  // 6. Space Invaders
  function gameSpace() {
    resetContent();
    const c=el("canvas","ws-game-canvas");c.width=480;c.height=360;content.append(c);
    const ctx=c.getContext("2d");
    let px=240,shots=[],enemies=[],score=0,dead=false,fire=false;
    function reset(){px=240;shots=[];score=0;dead=false;enemies=Array.from({length:20},(_,i)=>({x:25+(i%10)*43,y:30+Math.floor(i/10)*35,on:true}));}
    const s=el("div","ws-game-status","← → to move · Space to fire");
    content.prepend(s);
    listen(document,"keydown",e=>{if(["ArrowLeft","ArrowRight"," "].includes(e.key))e.preventDefault();if(e.key==="ArrowLeft")px-=16;if(e.key==="ArrowRight")px+=16;if(e.code==="Space")fire=true;});
    listen(document,"keyup",e=>{if(e.code==="Space")fire=false;});
    const ctr=el("div","ws-game-controls");content.append(ctr);
    ctr.append(button("◀",()=>px-=20),button("FIRE",()=>shots.push({x:px,y:315})),button("▶",()=>px+=20));
    actions().append(button("Restart",reset));
    reset();
    interval(()=>{
      if(dead)return;
      if(fire)shots.push({x:px,y:315});
      shots.forEach(b=>b.y-=6);shots=shots.filter(b=>b.y>0);
      enemies.forEach(e=>{if(e.on)e.y+=.12;});
      shots.forEach(b=>enemies.forEach(e=>{if(e.on&&Math.abs(b.x-e.x)<13&&Math.abs(b.y-e.y)<12){e.on=false;b.y=-10;score++;}}));
      if(enemies.some(e=>e.on&&e.y>315)){dead=true;s.textContent="Server overrun! Score: "+score;saveBest("space",score);}
      if(enemies.every(e=>!e.on)){dead=true;s.textContent="Wave cleared! Score: "+score;saveBest("space",score);}
      ctx.fillStyle="#04101e";ctx.fillRect(0,0,c.width,c.height);
      ctx.fillStyle="#55e6d0";ctx.fillRect(px-16,330,32,10);
      ctx.fillStyle="#facc15";shots.forEach(b=>ctx.fillRect(b.x-2,b.y,4,9));
      ctx.fillStyle="#fb7185";enemies.forEach(e=>{if(e.on)ctx.fillText("👾",e.x-10,e.y+10);});
      s.textContent="Score: "+score+" · Enemies: "+enemies.filter(e=>e.on).length;
    },40);
  }

  // 7. Pong
  function gamePong() {
    resetContent();
    const c=el("canvas","ws-game-canvas");c.width=480;c.height=300;content.append(c);
    const ctx=c.getContext("2d");
    let x=240,y=150,dx=3,dy=2,py=120,score=0,player=120;
    const s=el("div","ws-game-status","Move your paddle; the CPU plays opposite.");
    content.prepend(s);
    listen(c,"pointermove",e=>{const r=c.getBoundingClientRect();player=(e.clientY-r.top)*c.height/r.height-35;});
    listen(document,"keydown",e=>{if(e.key==="ArrowUp")player-=18;if(e.key==="ArrowDown")player+=18;});
    actions().append(button("Restart",gamePong));
    rafLoop(()=>{
      ctx.fillStyle="#04101e";ctx.fillRect(0,0,c.width,c.height);
      ctx.setLineDash([5,8]);ctx.strokeStyle="#426078";ctx.beginPath();ctx.moveTo(240,0);ctx.lineTo(240,300);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle="#55e6d0";ctx.fillRect(12,player,8,70);
      ctx.fillStyle="#60a5fa";ctx.fillRect(460,py,8,70);
      ctx.beginPath();ctx.arc(x,y,6,0,7);ctx.fillStyle="#fff";ctx.fill();
      x+=dx;y+=dy;if(y<6||y>294)dy*=-1;
      py+=(y-35-py)*.045;
      if(x<25&&y>player&&y<player+70)dx=Math.abs(dx);
      if(x>455&&y>py&&y<py+70)dx=-Math.abs(dx);
      if(x<0||x>480){score++;x=240;y=150;dx=score%2?3:-3;}
      s.textContent="Points: "+score;
      saveBest("pong",score);
    });
  }

  // 8. Minesweeper
  function gameMines() {
    resetContent();
    const N=8,M=10;
    let mines=new Set(),revealed=new Set(),flags=new Set(),done=false;
    const b=el("div","ws-game-board");
    b.style.gridTemplateColumns="repeat(8,minmax(0,40px))";
    const cells=[];
    for(let i=0;i<N*N;i++){const c=button("?",()=>reveal(i),"ws-game-cell");c.style.height="38px";c.addEventListener("contextmenu",e=>{e.preventDefault();flag(i);});b.append(c);cells.push(c);}
    content.append(b);
    const s=el("div","ws-game-status","Tap to reveal · Right-click or long press to flag");
    content.prepend(s);
    actions().append(button("New Board",gameMines));
    function init(){mines=new Set();while(mines.size<M)mines.add(Math.floor(Math.random()*N*N));revealed=new Set();flags=new Set();done=false;cells.forEach(c=>{c.textContent="?";c.disabled=false;c.style.background="";});s.textContent="Mines: "+M;}
    function around(i){const r=Math.floor(i/N),col=i%N;let a=[];for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++){let yy=r+y,xx=col+x;if(yy>=0&&yy<N&&xx>=0&&xx<N)a.push(yy*N+xx);}return a;}
    function reveal(i){
      if(done||revealed.has(i)||flags.has(i))return;
      if(mines.has(i)){done=true;cells.forEach((c,j)=>{if(mines.has(j))c.textContent="💣";});s.textContent="Boom! Try another board.";return;}
      revealed.add(i);
      const count=around(i).filter(j=>mines.has(j)).length;
      cells[i].textContent=count||"·";cells[i].disabled=true;cells[i].style.background="#1c3b50";
      if(count===0)around(i).forEach(j=>{if(!revealed.has(j))reveal(j);});
      if(revealed.size===N*N-M){done=true;s.textContent="You cleared the minefield!";saveBest("mines",1);}
      else s.textContent="Safe cells: "+revealed.size+" / "+(N*N-M);
    }
    function flag(i){if(done||revealed.has(i))return;if(flags.has(i)){flags.delete(i);cells[i].textContent="?";}else{flags.add(i);cells[i].textContent="🚩";}}
    init();
  }

  // 9. Rock Paper Scissors
  function gameRPS() {
    resetContent();
    let score=0;
    const s=el("div","ws-game-status","Choose your move");
    content.append(s);
    const b=el("div","ws-game-actions");content.append(b);
    [["✊","Rock"],["✋","Paper"],["✌️","Scissors"]].forEach(([icon,name])=>{
      b.append(button(icon+" "+name,()=>{
        const choices=["Rock","Paper","Scissors"],cpu=choices[Math.floor(Math.random()*3)];
        let result=name===cpu?"Draw":({Rock:"Scissors",Paper:"Rock",Scissors:"Paper"}[name]===cpu?"You win!":"Computer wins");
        if(result==="You win!")score++;
        s.textContent="You: "+name+" · CPU: "+cpu+" — "+result+" · Score: "+score;
        saveBest("rps",score);
      }));
    });
  }

  // 10. Whack-a-Mole
  function gameMole() {
    resetContent();
    let score=0,time=30,active=-1;
    const s=el("div","ws-game-status","Score: 0 · Time: 30");
    content.append(s);
    const b=el("div","ws-game-board");b.style.gridTemplateColumns="repeat(3,minmax(65px,100px))";content.append(b);
    const cells=Array.from({length:9},(_,i)=>{const c=button("🕳️",()=>{if(i===active&&time>0){score++;active=-1;draw();}},"ws-game-cell");c.style.height="76px";b.append(c);return c;});
    function draw(){cells.forEach((c,i)=>c.textContent=i===active?"🐹":"🕳️");s.textContent="Score: "+score+" · Time: "+time;}
    function tick(){if(time<=0)return;time--;active=Math.floor(Math.random()*9);draw();if(time===0){active=-1;draw();s.textContent="Time up! Final score: "+score;saveBest("mole",score);}}
    actions().append(button("Restart",gameMole));
    draw();interval(tick,1000);
  }

  // 11. Sudoku - generated valid completed grid with blanks
  function gameSudoku() {
    resetContent();
    const solution=Array.from({length:9},(_,r)=>Array.from({length:9},(_,c)=>(r*3+Math.floor(r/3)+c)%9+1));
    // Shuffle digit mapping so each new puzzle has a different appearance.
    const digits=[1,2,3,4,5,6,7,8,9].sort(()=>Math.random()-.5);
    const puzzle=solution.map(row=>row.map(v=>Math.random()<.48?0:digits[v-1]));
    const answer=solution.map(row=>row.map(v=>digits[v-1]));
    const b=el("div","ws-game-board");b.style.gridTemplateColumns="repeat(9,minmax(0,34px))";
    const inputs=[];
    puzzle.forEach((row,r)=>row.forEach((v,c)=>{
      const inp=el("input","ws-game-cell");inp.value=v||"";inp.inputMode="numeric";inp.maxLength=1;inp.style.width="100%";inp.style.height="34px";inp.style.padding="0";inp.style.fontSize="16px";
      if(v){inp.disabled=true;inp.style.background="#214158";}
      inp.dataset.r=r;inp.dataset.c=c;
      b.append(inp);inputs.push(inp);
    }));
    content.append(b);
    const s=el("div","ws-game-status","Fill each row, column and 3×3 box with digits 1–9.");
    content.prepend(s);
    actions().append(button("Check Answers",()=>{
      let correct=true,filled=true;
      inputs.forEach(inp=>{
        const v=Number(inp.value),r=+inp.dataset.r,c=+inp.dataset.c;
        if(!v)filled=false;
        if(v!==answer[r][c]){correct=false;if(inp.disabled===false)inp.style.borderColor="#fb7185";}
        else inp.style.borderColor="#55e6d0";
      });
      s.textContent=correct&&filled?"Puzzle solved!":"Not solved yet. Check the highlighted cells.";
      if(correct&&filled)saveBest("sudoku",1);
    }),button("New Puzzle",gameSudoku));
  }

  // 12. Simon Says
  function gameSimon() {
    resetContent();
    const colors=["#ef4444","#22c55e","#3b82f6","#eab308"];
    const labels=["Red","Green","Blue","Yellow"];
    let sequence=[],user=[],playing=false,level=0;
    const s=el("div","ws-game-status","Press Start and repeat the sequence.");
    content.append(s);
    const pad=el("div","ws-game-pad");content.append(pad);
    const cells=colors.map((color,i)=>{const b=button(labels[i],()=>tap(i));b.style.background=color;b.style.color="#fff";pad.append(b);return b;});
    function flash(i){cells[i].style.filter="brightness(1.8)";timeout(()=>cells[i].style.filter="",350);}
    function next(){
      user=[];sequence.push(Math.floor(Math.random()*4));level=sequence.length;s.textContent="Level "+level+" — watch the sequence";
      let i=0;
      const id=setInterval(()=>{flash(sequence[i++]);if(i>=sequence.length)clearInterval(id);},550);
      addCleanup(()=>clearInterval(id));
      timeout(()=>{playing=true;s.textContent="Your turn";},sequence.length*550+100);
    }
    function tap(i){
      if(!playing)return;flash(i);
      if(sequence[user.length]!==i){playing=false;s.textContent="Game over! Level reached: "+level;saveBest("simon",level);return;}
      user.push(i);
      if(user.length===sequence.length){playing=false;timeout(next,500);}
    }
    actions().append(button("Start / Restart",()=>{sequence=[];level=0;playing=false;next();}));
  }

  // 13. Reaction Test
  function gameReaction() {
    resetContent();
    let start=0,waiting=false,ready=false,timer;
    const b=button("Start test","#","ws-game-btn");
    b.style.minHeight="130px";b.style.fontSize="22px";content.append(b);
    const s=el("div","ws-game-status","Press Start, wait for green, then tap quickly.");
    content.prepend(s);
    b.textContent="Start test";
    listen(b,"click",()=>{
      if(!waiting&&!ready){
        waiting=true;b.textContent="Wait for green…";b.style.background="#b45309";
        timer=setTimeout(()=>{waiting=false;ready=true;start=performance.now();b.textContent="TAP NOW!";b.style.background="#15803d";},1200+Math.random()*3000);
        addCleanup(()=>clearTimeout(timer));
      } else if(ready){
        const ms=Math.round(performance.now()-start);ready=false;b.textContent="Try again";b.style.background="#173247";
        s.textContent="Reaction time: "+ms+" ms";saveBest("reaction",Math.max(0,1000-ms));
      } else {
        clearTimeout(timer);waiting=false;b.textContent="Too soon! Start again";b.style.background="#173247";s.textContent="You tapped too early.";
      }
    });
  }

  // 14. Typing Challenge
  function gameTyping() {
    resetContent();
    const words=["secure","network","firewall","computer","keyboard","internet","browser","system","digital","puzzle","security","monitor","server","software","defender"];
    const target=Array.from({length:8},()=>words[Math.floor(Math.random()*words.length)]).join(" ");
    const prompt=el("p","","Type the following text as accurately as possible:");
    const sample=el("p","ws-game-status",target);
    const input=el("textarea","ws-game-input");input.rows=3;input.placeholder="Start typing here…";
    const s=el("div","ws-game-status","Timer starts when you type.");
    content.append(prompt,sample,input,s);
    let start=null,finished=false;
    listen(input,"input",()=>{
      if(finished)return;
      if(start===null)start=Date.now();
      if(input.value===target || input.value.length>=target.length){
        finished=true;
        const sec=Math.max(1,(Date.now()-start)/1000);
        const correct=input.value.split("").filter((ch,i)=>ch===target[i]).length;
        const accuracy=Math.round(correct/target.length*100);
        const wpm=Math.round(input.value.trim().split(/\s+/).length/(sec/60));
        s.textContent="Speed: "+wpm+" WPM · Accuracy: "+accuracy+"%";
        saveBest("typing",wpm);
      } else {
        s.textContent="Characters: "+input.value.length+" / "+target.length;
      }
    });
    actions().append(button("New Text",gameTyping));
    timeout(()=>input.focus(),50);
  }

  // 15. Cyber Security Defender
  function gameCyber() {
    resetContent();
    let x=240,score=0,health=3,fire=false,left=false,right=false,over=false,shots=[],enemies=[];
    const c=el("canvas","ws-game-canvas");c.width=480;c.height=360;content.append(c);
    const ctx=c.getContext("2d");
    const s=el("div","ws-game-status","Move: ← → or A/D · Fire: Space");
    content.prepend(s);
    const controls=el("div","ws-game-controls");content.append(controls);
    function hold(label,prop){
      const b=button(label,()=>{});
      controls.append(b);
      const set=v=>{if(prop==="left")left=v;if(prop==="right")right=v;if(prop==="fire")fire=v;b.style.background=v?"#167a70":"";};
      const down=e=>{e.preventDefault();try{b.setPointerCapture(e.pointerId);}catch(_){}set(true);};
      const up=e=>{if(e)e.preventDefault();set(false);};
      b.addEventListener("pointerdown",down);b.addEventListener("pointerup",up);
      b.addEventListener("pointercancel",up);b.addEventListener("lostpointercapture",up);
      addCleanup(()=>{set(false);b.removeEventListener("pointerdown",down);b.removeEventListener("pointerup",up);b.removeEventListener("pointercancel",up);b.removeEventListener("lostpointercapture",up);});
    }
    hold("◀ MOVE","left");hold("FIRE","fire");hold("MOVE ▶","right");
    const keyMap={ArrowLeft:"left",KeyA:"left",ArrowRight:"right",KeyD:"right",Space:"fire"};
    listen(document,"keydown",e=>{const k=keyMap[e.code];if(k){e.preventDefault();if(k==="left")left=true;if(k==="right")right=true;if(k==="fire")fire=true;}});
    const release=e=>{const k=keyMap[e.code];if(k==="left")left=false;if(k==="right")right=false;if(k==="fire")fire=false;};
    listen(document,"keyup",release);
    listen(window,"blur",()=>{left=right=fire=false;});
    function reset(){x=240;score=0;health=3;over=false;shots=[];enemies=[];s.textContent="Score: 0 · Server health: 3";}
    actions().append(button("Restart",reset));
    reset();
    let lastSpawn=0,lastFire=0;
    rafLoop(t=>{
      ctx.fillStyle="#04101e";ctx.fillRect(0,0,c.width,c.height);
      ctx.fillStyle="#0b2338";
      for(let i=0;i<30;i++)ctx.fillRect((i*73)%480,(i*47)%360,2,2);
      if(!over){
        if(left)x-=4;if(right)x+=4;x=Math.max(18,Math.min(462,x));
        if(fire&&t-lastFire>210){shots.push({x,y:315});lastFire=t;}
        if(t-lastSpawn>800){enemies.push({x:15+Math.random()*450,y:0,speed:1+Math.random()*1.1});lastSpawn=t;}
        shots.forEach(b=>b.y-=6);
        enemies.forEach(e=>e.y+=e.speed);
        shots.forEach(b=>enemies.forEach(e=>{if(!e.dead&&Math.abs(b.x-e.x)<17&&Math.abs(b.y-e.y)<16){e.dead=true;b.y=-20;score++;}}));
        enemies.forEach(e=>{if(!e.dead&&e.y>320){e.dead=true;health--;}});
        shots=shots.filter(b=>b.y>0);enemies=enemies.filter(e=>!e.dead&&e.y<380);
        if(health<=0){over=true;s.textContent="Server compromised! Score: "+score;saveBest("cyber",score);}
        else s.textContent="Score: "+score+" · Server health: "+health;
      }
      ctx.fillStyle="#55e6d0";ctx.fillRect(x-17,326,34,14);
      ctx.fillStyle="#facc15";shots.forEach(b=>ctx.fillRect(b.x-2,b.y,4,10));
      enemies.forEach(e=>{ctx.fillStyle="#fb7185";ctx.fillRect(e.x-11,e.y-10,22,18);ctx.fillStyle="#04101e";ctx.fillRect(e.x-6,e.y-4,4,4);ctx.fillRect(e.x+3,e.y-4,4,4);});
    });
  }

  drawCards("all", "");
})();
