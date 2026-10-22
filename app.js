(() => {
const roles = ["Admin","Registrar","Dean","Instructor","Student"];
const pages = [
 ["dashboard","Dashboard","⌂"],["course","Course","▤"],["term","Term","▦"],
 ["instructors","Instructors","♙"],["subjects","Subjects","▣"],["yearlevel","Year Level","▤"],
 ["section","Section","♧"],["schoolyear","School Year","▦"],["users","Users","♙"],
 ["usertype","User Type","⚙"],["picture","Profile","◉"]
];
const access = {
 Admin:["dashboard","course","term","instructors","subjects","yearlevel","section","schoolyear","users","usertype","picture"],
 Registrar:["dashboard","term","instructors","subjects","schoolyear","users","usertype","picture"],
 Dean:["dashboard","subjects","section","instructors","yearlevel","users","usertype","picture"],
 Instructor:["dashboard","subjects","section","picture"],
 Student:["dashboard","subjects","picture"]
};
const defaults = {
 course:[{id:1,name:"BSIS",description:"Bachelor of Science in Information Systems"}],
 term:[{id:1,name:"1ST SEMESTER",description:"First semester"},{id:2,name:"2ND SEMESTER",description:"Second semester"}],
 yearlevel:[{id:1,name:"1ST YEAR",description:"First year"},{id:2,name:"2ND YEAR",description:"Second year"},{id:3,name:"3RD YEAR",description:"Third year"},{id:4,name:"4TH YEAR",description:"Fourth year"}],
 section:[{id:1,name:"A",description:"Section A"},{id:2,name:"B",description:"Section B"}],
 schoolyear:[{id:1,name:"2026-2027",description:"Academic year 2026-2027"}],
 subjects:[{id:1,name:"Introduction to Information Systems",code:"IS101",course:"BSIS",year:"1ST YEAR",term:"1ST SEMESTER",lecture:3,laboratory:0,credit:3}],
 instructors:[{id:1,name:"Sample Instructor",salutation:"Mr.",middlename:"",photo:""}],
 users:[], usertype:roles.map((name,i)=>({id:i+1,name}))
};
const demos = [
 {username:"admin",password:"admin12345",role:"Admin"},
 {username:"registrar",password:"reg12345",role:"Registrar"},
 {username:"dean",password:"dean12345",role:"Dean"},
 {username:"instructor",password:"teach12345",role:"Instructor"},
 {username:"student",password:"stud12345",role:"Student"}
];
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem("sis_"+key)) ?? fallback}catch{return fallback}};
const save=(key,val)=>localStorage.setItem("sis_"+key,JSON.stringify(val));
Object.keys(defaults).forEach(k=>{if(localStorage.getItem("sis_"+k)===null)save(k,defaults[k])});
if(!localStorage.getItem("sis_users"))save("users",demos.map((u,i)=>({id:i+1,username:u.username,password:u.password,role:u.role,photo:""})));
let current=JSON.parse(sessionStorage.getItem("sis_session")||"null");
let active="dashboard", editing=null, notice="";
const app=document.getElementById("app");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const records=k=>read(k,defaults[k]||[]);
const label=k=>pages.find(p=>p[0]===k)?.[1]||k;
function login(){
 app.innerHTML=`<main class="login-wrap"><section class="login-card"><div class="login-brand">4BSAMONTE</div><p class="muted">Student Information System</p><h2>Sign in</h2><form id="loginForm"><label>Username</label><input name="username" required autocomplete="username"><label>Password</label><input name="password" type="password" required autocomplete="current-password"><label>User type</label><select name="role">${roles.map(r=>`<option>${r}</option>`).join("")}</select><p id="loginError" class="error"></p><button class="primary wide">Login</button></form><details><summary>Demo accounts</summary><p>Admin: admin / admin12345</p><p>Registrar: registrar / reg12345</p><p>Dean: dean / dean12345</p><p>Instructor: instructor / teach12345</p><p>Student: student / stud12345</p></details><p class="small muted">GitHub Pages demo: data is stored only in this browser.</p></section></main>`;
 document.getElementById("loginForm").onsubmit=e=>{e.preventDefault();let f=new FormData(e.target),u=String(f.get("username")).trim(),p=f.get("password"),r=f.get("role");let found=records("users").find(x=>x.username===u&&x.password===p&&x.role===r);if(!found){document.getElementById("loginError").textContent="Invalid username, password, or user type.";return}current={username:u,role:r,photo:found.photo||""};sessionStorage.setItem("sis_session",JSON.stringify(current));active="dashboard";render()};
}
function render(){
 if(!current){login();return}
 const allowed=access[current.role]||[];
 if(!allowed.includes(active))active="dashboard";
 app.innerHTML=`<aside class="sidebar"><div class="logo"><h2>4BSAMONTE</h2><p>Student Information System</p></div><nav class="menu">${pages.filter(p=>allowed.includes(p[0])).map(p=>`<a href="#${p[0]}" data-page="${p[0]}" class="${active===p[0]?"active":""}"><span class="menu-icon">${p[2]}</span>${p[1]}</a>`).join("")}<a href="#logout" id="logout" class="logout-link"><span class="menu-icon">↪</span>Logout</a></nav><div class="sidebar-user">${current.photo?`<img src="${current.photo}" alt="">`:""}<div><strong>${esc(current.username)}</strong><small>${esc(current.role)}</small></div></div></aside><main class="main-content"><header class="topbar"><div><span class="eyebrow">STUDENT INFORMATION SYSTEM</span><h1>${label(active)}</h1></div><div class="user-pill">${current.photo?`<img src="${current.photo}" alt="">`:""}<span>${esc(current.username)}<small>${esc(current.role)}</small></span></div></header><section class="page-content">${notice?`<div class="notice">${esc(notice)}</div>`:""}${pageContent()}</section></main>`;
 app.querySelectorAll("[data-page]").forEach(a=>a.onclick=e=>{e.preventDefault();active=a.dataset.page;editing=null;notice="";render()});
 document.getElementById("logout").onclick=e=>{e.preventDefault();current=null;sessionStorage.removeItem("sis_session");render()};
 const form=document.getElementById("recordForm");if(form)form.onsubmit=saveRecord;
 const cancel=document.getElementById("cancelEdit");if(cancel)cancel.onclick=()=>{editing=null;render()};
 const search=document.getElementById("searchBox");if(search)search.oninput=()=>filterRows(search.value);
 const photo=document.getElementById("photoInput");if(photo)photo.onchange=()=>{const file=photo.files[0];if(!file)return;if(file.size>3*1024*1024){alert("Image must be 3 MB or smaller.");photo.value="";return}const reader=new FileReader();reader.onload=()=>{current.photo=reader.result;sessionStorage.setItem("sis_session",JSON.stringify(current));if(active==="picture"){let users=records("users");let u=users.find(x=>x.username===current.username);if(u){u.photo=reader.result;save("users",users)}render()}};reader.readAsDataURL(file)};
 app.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>{editing=Number(b.dataset.edit);render()});
 app.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>{if(!confirm("Delete this record?"))return;let k=active,rows=records(k).filter(x=>x.id!==Number(b.dataset.delete));save(k,rows);notice="Record deleted.";render()});
}
function pageContent(){
 if(active==="dashboard"){const stats=["course","subjects","instructors","users"].map(k=>`<article class="stat-card"><span>${label(k)}</span><strong>${records(k).length}</strong></article>`).join("");return `<div class="welcome-panel"><div><p class="eyebrow">WELCOME BACK</p><h2>Hello, ${esc(current.username)}!</h2><p>Manage academic information from your dashboard.</p></div><div class="welcome-symbol">✦</div></div><div class="stats-grid">${stats}</div><article class="panel"><h3>Quick access</h3><div class="quick-links">${(access[current.role]||[]).filter(k=>k!=="dashboard").map(k=>`<button class="quick-link" data-page="${k}">${label(k)} <span>→</span></button>`).join("")}</div></article>`}
 if(active==="picture")return `<article class="panel form-panel"><h2>Profile picture</h2><p class="muted">Choose a JPG, PNG, or WEBP image up to 3 MB.</p><div class="profile-preview">${current.photo?`<img src="${current.photo}" alt="Profile photo">`:"<span>◉</span>"}</div><label>Upload image</label><input type="file" id="photoInput" accept="image/jpeg,image/png,image/webp"><p class="small muted">The selected image is stored in this browser for this demo.</p></article>`;
 if(active==="users"&&current.role!=="Admin")return `<article class="panel"><h2>User accounts</h2><p class="muted">User account management is available to Admin only.</p></article>`;
 const k=active, rows=records(k), isSubjects=k==="subjects", isUsers=k==="users", isInstructors=k==="instructors", isTypes=k==="usertype";
 const canEdit= current.role==="Admin" || (k==="term"&&current.role==="Registrar") || (k==="subjects"&&["Registrar","Dean","Instructor"].includes(current.role)) || (k==="section"&&["Dean","Instructor"].includes(current.role)) || (k==="yearlevel"&&current.role==="Dean") || (k==="schoolyear"&&current.role==="Registrar");
 const fields=isUsers?[["username","Username"],["password","Password"],["role","User type"]]:isSubjects?[["code","Subject code"],["name","Subject title"],["course","Course"],["year","Year level"],["term","Term"],["lecture","Lecture units"],["laboratory","Laboratory units"],["credit","Credit"]]:isInstructors?[["salutation","Salutation"],["name","First name / Full name"],["middlename","Middle name"]]:isTypes?[["name","User type"]]:[["name",({course:"Course",term:"Term",yearlevel:"Year level",section:"Section",schoolyear:"School year"})[k]||"Name"],["description","Description"]];
 let edit=editing===null?null:rows.find(r=>r.id===editing);
 return `<div class="content-grid"><article class="panel table-panel"><div class="panel-heading"><div><h2>${label(k)} list</h2><p class="muted">${rows.length} record${rows.length===1?"":"s"} available</p></div><input id="searchBox" class="search-box" placeholder="Search records..."></div><div class="table-wrap"><table id="recordsTable"><thead><tr>${(isUsers?["ID","Username","User type"]:isSubjects?["ID","Code","Subject title","Course","Year","Term","Credit"]:isInstructors?["ID","Name","Salutation","Middle name"]:isTypes?["ID","User type"]:["ID","Name","Description"]).map(x=>`<th>${x}</th>`).join("")}${canEdit?"<th>Actions</th>":""}</tr></thead><tbody>${rows.map(r=>`<tr data-search="${esc(Object.values(r).join(" ").toLowerCase())}">${isUsers?`<td>${r.id}</td><td>${esc(r.username)}</td><td>${esc(r.role)}</td>`:isSubjects?`<td>${r.id}</td><td>${esc(r.code)}</td><td>${esc(r.name)}</td><td>${esc(r.course)}</td><td>${esc(r.year)}</td><td>${esc(r.term)}</td><td>${esc(r.credit)}</td>`:isInstructors?`<td>${r.id}</td><td>${r.photo?`<img class="table-avatar" src="${r.photo}" alt="">`:""}${esc(r.name)}</td><td>${esc(r.salutation)}</td><td>${esc(r.middlename)}</td>`:isTypes?`<td>${r.id}</td><td>${esc(r.name)}</td>`:`<td>${r.id}</td><td>${esc(r.name)}</td><td>${esc(r.description)}</td>`}${canEdit?`<td class="actions"><button class="small-button" data-edit="${r.id}">Edit</button><button class="small-button danger" data-delete="${r.id}">Delete</button></td>`:""}</tr>`).join("")||`<tr><td colspan="8" class="empty">No records yet.</td></tr>`}</tbody></table></div></article>${canEdit?`<article class="panel form-panel"><h2>${edit?"Edit":"Add"} ${label(k).replace(/s$/,"")}</h2><form id="recordForm" data-key="${k}" data-id="${edit?edit.id:""}">${fields.map(([name,title])=>`<label>${title}</label>${name==="role"?`<select name="${name}" required>${roles.map(r=>`<option ${edit?.[name]===r?"selected":""}>${r}</option>`).join("")}</select>`:name==="course"?`<select name="${name}">${records("course").map(x=>`<option ${edit?.[name]===x.name?"selected":""}>${esc(x.name)}</option>`).join("")}</select>`:name==="year"?`<select name="${name}">${records("yearlevel").map(x=>`<option ${edit?.[name]===x.name?"selected":""}>${esc(x.name)}</option>`).join("")}</select>`:name==="term"?`<select name="${name}">${records("term").map(x=>`<option ${edit?.[name]===x.name?"selected":""}>${esc(x.name)}</option>`).join("")}</select>`:`<input name="${name}" ${["lecture","laboratory","credit"].includes(name)?'type="number" min="0"':'type="text"'} value="${esc(edit?.[name]||"")}" ${name!=="description"?"required":""}>`).join("")}<div class="form-actions"><button class="primary">${edit?"Save changes":"Add record"}</button>${edit?'<button type="button" id="cancelEdit" class="secondary">Cancel</button>':""}</div><p class="small muted">Changes are saved in browser local storage, not a shared database.</p></form></article>`:""}</div>`;
}
function saveRecord(e){
 e.preventDefault();const form=e.target,k=form.dataset.key,id=Number(form.dataset.id)||null,data=Object.fromEntries(new FormData(form).entries());["lecture","laboratory","credit"].forEach(n=>{if(data[n]!==undefined)data[n]=Number(data[n])||0});
 let rows=records(k);
 if(k==="users"){if(!data.username||!data.password)return;if(rows.some(r=>r.username===data.username&&r.id!==id)){alert("Username already exists.");return}}
 if(id){rows=rows.map(r=>r.id===id?{...r,...data,id}:r);notice="Record updated."}
 else{data.id=Math.max(0,...rows.map(r=>Number(r.id)||0))+1;if(k==="instructors")data.photo="";rows.push(data);notice="Record added."}
 save(k,rows);editing=null;render();
}
function filterRows(q){document.querySelectorAll("#recordsTable tbody tr[data-search]").forEach(r=>r.hidden=!r.dataset.search.includes(q.toLowerCase()))}
function boot(){render()}
boot();
})();