const routes = ["/", "/gyms", "/gyms/cultivate-climbing", "/gyms/cultivate-climbing/walls/cave-wall", "/gyms/cultivate-climbing/add-problem", "/gyms/cultivate-climbing/problems/p1", "/gyms/cultivate-climbing/leaderboard", "/profile/sarah"];
const gradePoints = { V0:10,V1:20,V2:30,V3:45,V4:65,V5:90,V6:125,V7:165,V8:210,V9:260,V10:325,V11:400,V12:500 };

const state = {
  current: "/",
  gyms: [
    { slug:"cultivate-climbing", name:"Cultivate Climbing", city:"Asheville", state:"NC", verified:true },
    { slug:"granite-lab", name:"Granite Lab", city:"Boulder", state:"CO", verified:false },
    { slug:"beta-block", name:"Beta Block", city:"Austin", state:"TX", verified:false }
  ],
  walls: ["Cave Wall","Slab Wall","Comp Wall","Topout Boulder"],
  problems: [],
  logs: {},
  leaderboard: [{name:"Sarah",points:1420},{name:"Alex",points:1230},{name:"Eric",points:980},{name:"You",points:0}],
  projects: new Set(),
  currentUser: "You"
};

function seedProblems(){
  if(state.problems.length) return;
  const colors=["Yellow","Purple","Blue","Pink","Green","Orange","Black","White"];
  const grades=["V1","V2","V3","V4","V5","V6","V7","V4"];
  for(let i=0;i<20;i++){
    state.problems.push({
      id:`p${i+1}`,
      gymSlug:"cultivate-climbing",
      wall: state.walls[i%4],
      grade: grades[i%8],
      color: colors[i%8],
      name: `${colors[i%8]} ${grades[i%8]} #${i+1}`,
      description:"Mock route with varied style.",
      photo:"https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=500&q=60",
      status: i%5===0?"needs confirmation": i%7===0?"likely removed":"community confirmed",
      sends: Math.floor(Math.random()*18),
      daysRemaining: Math.max(-1,8-(i%10))
    });
  }
}

function badge(problem){
  if(problem.daysRemaining<=0) return '<span class="badge bad">Reset today</span>';
  if(problem.daysRemaining<=5) return '<span class="badge warn">Leaving soon</span>';
  const map={"needs confirmation":"warn","community confirmed":"good","gym verified":"good","likely removed":"bad","archived":"bad"};
  return `<span class="badge ${map[problem.status]||''}">${problem.status}</span>`;
}

function calcYouPoints(){
  return Object.values(state.logs).reduce((sum,log)=>sum+log.points,0);
}
function updateLeaderboard(){ state.leaderboard = state.leaderboard.map((r)=>r.name===state.currentUser?{...r,points:calcYouPoints()}:r).sort((a,b)=>b.points-a.points); }

function log(problemId,type){
  const p=state.problems.find(x=>x.id===problemId); if(!p) return;
  const prev=state.logs[problemId]||{attempts:0,send:false,flash:false,points:0};
  if(type==="attempt"){ prev.attempts +=1; }
  if(type==="send" && !prev.send && !prev.flash){ prev.send=true; prev.points=gradePoints[p.grade]||0; }
  if(type==="flash" && prev.attempts===0 && !prev.send && !prev.flash){ prev.flash=true; prev.send=true; prev.points=Math.round((gradePoints[p.grade]||0)*1.25); }
  state.logs[problemId]=prev; updateLeaderboard(); render();
}

function toggleProject(id){ state.projects.has(id)?state.projects.delete(id):state.projects.add(id); render(); }
function navigate(path){ state.current=path; render(); }

function renderProblemCard(p){
  return `<article class="problem"><img src="${p.photo}" alt="${p.name}"/><div class="meta"><h3>${p.color} ${p.grade}</h3><p class="muted">${p.wall} · ${p.sends} sends · ${p.daysRemaining} days left</p><div class="badges">${badge(p)}</div><div class="actions"><button onclick="log('${p.id}','attempt')">Attempt</button><button onclick="log('${p.id}','send')">Send</button><button onclick="log('${p.id}','flash')">Flash</button><button onclick="toggleProject('${p.id}')">${state.projects.has(p.id)?'Unsave':'Project'}</button></div></div></article>`;
}

function page(){
  const p = state.current;
  if(p==="/") return `<section class='card'><h2>Home</h2><p>Find gyms, log sends, chase leaderboard, beat resets.</p></section>`;
  if(p==="/gyms") return `<section class='card'><h2>Gym Directory</h2>${state.gyms.map(g=>`<p><button onclick="navigate('/gyms/${g.slug}')">${g.name}</button> ${g.city}, ${g.state} · ${g.verified?'Verified':'Unverified'}</p>`).join('')}</section>`;
  if(p==="/gyms/cultivate-climbing") return `<section class='card'><h2>Cultivate Climbing</h2><p class='muted'>Asheville, NC</p><p>Cave Wall: 3 days left · Slab Wall: reset yesterday · Comp Wall: 8 days left</p><button onclick="navigate('/gyms/cultivate-climbing/add-problem')">Add Problem</button></section><section class='card'><h3>Fresh Problems</h3><div class='problems'>${state.problems.slice(0,5).map(renderProblemCard).join('')}</div></section>`;
  if(p.includes('/walls/')) return `<section class='card'><h2>Cave Wall</h2><p>Wall leaderboard + active problems + QR destination demo.</p></section><section class='card'><div class='problems'>${state.problems.filter(x=>x.wall==='Cave Wall').slice(0,6).map(renderProblemCard).join('')}</div></section>`;
  if(p.includes('/add-problem')) return `<section class='card'><h2>Add Problem</h2><p>Use quick form (required: wall, grade, color, photo).</p><button onclick="document.getElementById('addProblemDialog').showModal()">Open Form</button></section>`;
  if(p.includes('/problems/')) { const x=state.problems[0]; return `<section class='card'><h2>${x.color} ${x.grade}</h2>${renderProblemCard(x)}<p>Still up confirmations and removed reports are mocked in status badges.</p></section>`; }
  if(p.includes('/leaderboard')) return `<section class='card'><h2>Monthly Leaderboard</h2><ol class='list'>${state.leaderboard.map(r=>`<li>${r.name} — ${r.points} pts</li>`).join('')}</ol></section>`;
  if(p.includes('/profile/')) return `<section class='card'><h2>${state.currentUser} profile</h2><p>Total points: ${calcYouPoints()}</p><p>Saved projects: ${state.projects.size}</p></section>`;
  return `<section class='card'>Unknown route</section>`;
}

function render(){
  document.getElementById('tabs').innerHTML = routes.map(r=>`<button class="tab ${state.current===r?'active':''}" onclick="navigate('${r}')">${r.replace('/gyms/cultivate-climbing','Gym').replace('/gyms','Gyms').replace('/profile/sarah','Profile')}</button>`).join('');
  document.getElementById('app').innerHTML = `${page()}<section class='card'><h3>Session</h3><div class='stats'><article><strong>${Object.values(state.logs).reduce((s,l)=>s+l.attempts,0)}</strong><p class='muted'>Attempts</p></article><article><strong>${Object.values(state.logs).filter(l=>l.send).length}</strong><p class='muted'>Sends</p></article><article><strong>${Object.values(state.logs).filter(l=>l.flash).length}</strong><p class='muted'>Flashes</p></article><article><strong>${calcYouPoints()}</strong><p class='muted'>Points</p></article></div></section>`;
}

function init(){
  seedProblems();
  document.getElementById('cancelAdd').onclick=()=>document.getElementById('addProblemDialog').close();
  document.getElementById('wallSelect').innerHTML = state.walls.map(w=>`<option>${w}</option>`).join('');
  document.getElementById('gradeSelect').innerHTML = Object.keys(gradePoints).map(g=>`<option>${g}</option>`).join('');
  document.getElementById('addProblemForm').addEventListener('submit',(e)=>{e.preventDefault();const f=new FormData(e.target);const wall=String(f.get('wall'));const grade=String(f.get('grade'));const color=String(f.get('color'));
    const duplicate=state.problems.find(p=>p.wall===wall&&p.grade===grade&&p.color.toLowerCase()===color.toLowerCase());
    if(duplicate && !confirm(`Possible duplicate: ${duplicate.name}. Add anyway?`)) return;
    state.problems.unshift({id:`p${Date.now()}`,gymSlug:'cultivate-climbing',wall,grade,color,name:String(f.get('name')||`${color} ${grade}`),description:String(f.get('description')||''),photo:String(f.get('photo')),status:'needs confirmation',sends:0,daysRemaining:7});
    document.getElementById('addProblemDialog').close();e.target.reset();navigate('/gyms/cultivate-climbing');
  });
  render();
}

window.log=log; window.toggleProject=toggleProject; window.navigate=navigate;
init();
