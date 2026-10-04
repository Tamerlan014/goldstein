const products = [
  {id:"ak-neon",name:"AK-47 | Neon Rider",type:"rifle",label:"ВИНТОВКА",wear:"После полевых",price:48.90,oldPrice:62.00,badge:"-21%",rank:"01",a:"#dc694a",b:"#d4c96c",glow:"#443526",likes:248},
  {id:"awp-neo",name:"AWP | Neo-Noir",type:"rifle",label:"ВИНТОВКА",wear:"Немного понош.",price:72.50,rank:"02",a:"#bd4e80",b:"#7188a9",glow:"#392532",likes:211},
  {id:"karambit-fade",name:"Karambit | Fade",type:"knife",label:"НОЖ",wear:"Прямо с завода",price:319.00,rank:"03",a:"#f0bb63",b:"#e97376",glow:"#443625",likes:196},
  {id:"glock-water",name:"Glock-18 | Water",type:"pistol",label:"ПИСТОЛЕТ",wear:"После полевых",price:12.40,rank:"04",a:"#438a80",b:"#6fbba1",glow:"#233a32",likes:165},
  {id:"m4-print",name:"M4A1-S | Printstream",type:"rifle",label:"ВИНТОВКА",wear:"Немного понош.",price:88.00,rank:"05",a:"#ece7db",b:"#848989",glow:"#363636",likes:150},
  {id:"usp-kill",name:"USP-S | Kill Confirmed",type:"pistol",label:"ПИСТОЛЕТ",wear:"После полевых",price:31.75,rank:"06",a:"#db5137",b:"#e4bd68",glow:"#432821",likes:142},
  {id:"butterfly-tiger",name:"Butterfly | Tiger Tooth",type:"knife",label:"НОЖ",wear:"Прямо с завода",price:276.50,rank:"07",a:"#eac24c",b:"#c97934",glow:"#453b24",likes:134},
  {id:"desert-blaze",name:"Desert Eagle | Blaze",type:"pistol",label:"ПИСТОЛЕТ",wear:"Прямо с завода",price:102.00,rank:"08",a:"#ecae42",b:"#ece3c1",glow:"#423721",likes:129}
];

const key = "skinforge-data-v1";
const initialState = {users:[],currentUser:null,requests:[],listings:[],stories:[],favorites:[],cart:[]};
let state = loadState();
let activeFilter = "all";
let showAll = false;
let authMode = "login";
let toastTimer;

function loadState(){
  try{
    const saved=JSON.parse(localStorage.getItem(key));
    return saved&&typeof saved==="object"?{...initialState,...saved}:structuredClone(initialState);
  }catch(error){console.error("Could not load saved marketplace data.",error);return structuredClone(initialState);}
}
function saveState(){localStorage.setItem(key,JSON.stringify(state));}
function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));}
function money(value){return Number(value).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});}
function toast(message){const el=document.querySelector("#toast");el.textContent=message;el.classList.add("visible");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("visible"),2600);}
function isAdmin(){return state.currentUser?.role==="admin";}
function currentUser(){return state.users.find(user=>user.id===state.currentUser?.id);}
function getListings(){return state.listings.filter(item=>item.status==="approved").map(item=>({...item,custom:true}));}
function renderProducts(){
  const query=document.querySelector("#searchInput").value.trim().toLowerCase();
  let items=[...products,...getListings().filter(item=>item.itemType==="skin").map(item=>({...item,id:`user-${item.id}`,name:item.title,type:item.category||"rifle",label:item.categoryLabel||"СКИН",wear:item.condition||"Вариант продавца",price:Number(item.price),rank:"NEW",a:"#d0fa62",b:"#8c944f",glow:"#3b4129",likes:0}))];
  items=items.filter(item=>(activeFilter==="all"||item.type===activeFilter)&&(!query||item.name.toLowerCase().includes(query)||item.label.toLowerCase().includes(query)));
  const sort=document.querySelector("#sortSelect").value;
  if(sort==="low")items.sort((a,b)=>a.price-b.price);
  else if(sort==="high")items.sort((a,b)=>b.price-a.price);
  else items.sort((a,b)=>(b.likes||0)-(a.likes||0));
  const total=items.length;
  if(!showAll)items=items.slice(0,8);
  document.querySelector("#itemCount").textContent=String(items.length).padStart(2,"0");
  document.querySelector("#totalCount").textContent=String(total).padStart(2,"0");
  document.querySelector("#productGrid").innerHTML=items.length?items.map(product=>`
    <article class="product-card">
      <div class="product-image" style="--skin-a:${product.a};--skin-b:${product.b};--glow:${product.glow}">
        <span class="product-rank">SF / ${escapeHtml(product.rank)}</span>${product.badge?`<span class="product-badge">${escapeHtml(product.badge)}</span>`:""}
        <span class="product-art ${escapeHtml(product.type)}" aria-hidden="true"></span>
        <button class="product-heart ${state.favorites.includes(product.id)?"favorited":""}" data-favorite="${escapeHtml(product.id)}" aria-label="Добавить ${escapeHtml(product.name)} в избранное">${state.favorites.includes(product.id)?"♥":"♡"}</button>
      </div>
      <div class="product-info"><span class="product-type">${escapeHtml(product.label)}</span><div class="product-name-row"><span class="product-name">${escapeHtml(product.name)}</span><span class="product-wear">${escapeHtml(product.wear)}</span></div>
        <div class="product-bottom"><span class="product-price">$${money(product.price)} ${product.oldPrice?`<small><s>$${money(product.oldPrice)}</s></small>`:""}</span><button class="buy-button" data-buy="${escapeHtml(product.id)}">В корзину +</button></div>
      </div>
    </article>`).join(""):`<div class="empty-products">Предметов не найдено. Попробуйте изменить запрос.</div>`;
}
function renderStories(){
  document.querySelectorAll(".ugc-story-card").forEach(card=>card.remove());
  const stories=state.stories.filter(item=>item.status==="approved");
  if(!stories.length)return;
  document.querySelector("#storyGrid").insertAdjacentHTML("beforeend",stories.map((story,index)=>`<article class="story-card ugc-story-card"><div class="story-image story-image-${index%3+1}">${story.media?story.mediaType?.startsWith("video/")?`<video src="${story.media}" controls playsinline aria-label="${escapeHtml(story.title)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>`:`<img src="${story.media}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`:""}<span class="story-image-label">COMMUNITY <b>№ ${String(index+1).padStart(3,"0")}</b></span><span class="story-image-title">${escapeHtml(story.title).slice(0,34)}</span></div><div class="story-meta"><span>ИСТОРИЯ КОМЬЮНИТИ</span><span>НОВОЕ</span></div><h3>${escapeHtml(story.description)}</h3><a class="story-link" href="#stories">Читать историю <span>↗</span></a></article>`).join(""));
}
function renderUserCases(){
  const cases=getListings().filter(item=>item.itemType==="case");
  const section=document.querySelector("#userCasesSection");
  section.hidden=cases.length===0;
  document.querySelector("#userCaseGrid").innerHTML=cases.map((item,index)=>`<article class="user-case-card"><div class="user-case-art"><span>SF / ${String(index+1).padStart(2,"0")}</span><strong>${escapeHtml(item.title)}</strong>${item.media?item.mediaType?.startsWith("video/")?`<video src="${item.media}" controls playsinline aria-label="${escapeHtml(item.title)}"></video>`:`<img src="${item.media}" alt="">`:""}</div><div class="user-case-copy"><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p></div><strong>$${money(item.price)}</strong></div></article>`).join("");
}
function updateHeader(){
  const user=currentUser();
  document.querySelector("#profileButtonText").textContent=user?user.name.split(" ")[0]:"Войти";
  document.querySelector(".avatar-mini").textContent=user?user.name.charAt(0).toUpperCase():"↗";
  document.querySelector(".cart-count").textContent=state.cart.reduce((sum,item)=>sum+item.quantity,0);
}
function updatePage(){renderProducts();updateHeader();}
function showModal(content){document.querySelector("#modalContent").innerHTML=content;const backdrop=document.querySelector("#modalBackdrop");backdrop.classList.add("open");backdrop.setAttribute("aria-hidden","false");document.querySelector("#modalClose").focus();}
function closeModal(){const backdrop=document.querySelector("#modalBackdrop");backdrop.classList.remove("open");backdrop.setAttribute("aria-hidden","true");}
function authModal(mode="login"){
  authMode=mode;
  showModal(`<div class="eyebrow"><span class="eyebrow-line"></span> ТВОЙ АККАУНТ SKINFORGE</div><h2 id="modalTitle">${mode==="login"?"С возвращением.":"Создай аккаунт."}</h2><p class="modal-intro">Сохраняй любимые предметы, управляй заказами и открывай новые возможности.</p>
    <div class="modal-tabs"><button class="modal-tab ${mode==="login"?"selected":""}" data-auth-tab="login">Войти</button><button class="modal-tab ${mode==="register"?"selected":""}" data-auth-tab="register">Регистрация</button></div>
    ${mode==="login"?`<div class="demo-note">Демо администратора: <b>admin@skinforge.ru</b> / <b>admin123</b>. Аккаунт для проверки очереди модерации.</div>`:""}
    <form id="authForm">${mode==="register"?`<label class="form-field"><span>Имя</span><input name="name" autocomplete="name" required maxlength="40" placeholder="Как тебя зовут?"></label>`:""}
      <label class="form-field"><span>Email</span><input name="email" type="email" autocomplete="email" required placeholder="name@example.com"></label>
      <label class="form-field"><span>Пароль</span><input name="password" type="password" autocomplete="${mode==="login"?"current-password":"new-password"}" minlength="6" required placeholder="Не менее 6 символов"></label>
      <button class="button button-primary form-submit" type="submit">${mode==="login"?"Войти в аккаунт":"Создать аккаунт"} <span>↗</span></button></form>
    <p class="form-note">Продолжая, ты соглашаешься с правилами и политикой конфиденциальности.</p>`);
}
function openProfile(){
  if(!currentUser()){authModal();return;}
  const user=currentUser();
  if(user.role==="admin"){adminDashboard();return;}
  const userListings=state.listings.filter(item=>item.ownerId===user.id);
  const userStories=state.stories.filter(item=>item.ownerId===user.id);
  const pending=[...userListings,...userStories].filter(item=>item.status==="pending").length;
  showModal(`<div class="eyebrow"><span class="eyebrow-line"></span> ЛИЧНЫЙ КАБИНЕТ</div><div class="profile-head"><span class="profile-avatar">${escapeHtml(user.name.charAt(0).toUpperCase())}</span><div><h2 id="modalTitle">${escapeHtml(user.name)}</h2><small>${escapeHtml(user.email)} · Покупатель</small></div></div>
    <div class="profile-stats"><div class="profile-stat"><strong>${state.cart.reduce((sum,item)=>sum+item.quantity,0)}</strong><span>В корзине</span></div><div class="profile-stat"><strong>${state.favorites.length}</strong><span>Избранное</span></div><div class="profile-stat"><strong>${pending}</strong><span>На проверке</span></div></div>
    ${user.canPublish?`<div class="modal-message">Доступ автора активен. Все материалы проходят предварительную модерацию.</div><div class="author-actions"><button class="button button-outline" id="createPostButton">Новая история +</button><button class="button button-outline" id="createSkinButton">Добавить скин +</button><button class="button button-outline" id="createCaseButton">Добавить кейс +</button></div>`:`<p class="modal-intro">Хочешь публиковать истории и добавлять скины или кейсы? Запроси доступ автора — администратор рассмотрит заявку.</p><button class="button button-primary form-submit" id="requestAuthorButton">${state.requests.some(item=>item.userId===user.id&&item.type==="author"&&item.status==="pending")?"Заявка отправлена на проверку":"Запросить доступ автора"} <span>↗</span></button>`}
    <h3 style="font:500 13px var(--display);margin:20px 0 8px">Мои публикации</h3>
    ${userListings.length+userStories.length?[...userListings,...userStories].map(item=>`<div class="list-row"><span>${escapeHtml(item.title)}<small>${item.itemType==="skin"?"Скин":item.itemType==="case"?"Кейс":"Статья"}</small></span><span class="status-pill status-${item.status}">${statusLabel(item.status)}</span></div>`).join(""):`<p class="form-note">Пока здесь пусто. Одобренные объявления появятся в каталоге.</p>`}
    <button class="button button-outline form-submit" id="logoutButton">Выйти из аккаунта</button>`);
}
function statusLabel(status){return status==="approved"?"Одобрено":status==="rejected"?"Отклонено":"На проверке";}
function adminDashboard(){
  const waitingAuthor=state.requests.filter(item=>item.type==="author"&&item.status==="pending");
  const pending=[...state.listings,...state.stories].filter(item=>item.status==="pending");
  showModal(`<div class="eyebrow"><span class="eyebrow-line"></span> ПАНЕЛЬ МОДЕРАЦИИ</div><h2 id="modalTitle">Привет, администратор.</h2><p class="modal-intro">Управляй доступом авторов и проверяй новые публикации.</p>
    <h3 style="font:500 13px var(--display);margin:20px 0 8px">Заявки авторов <span style="color:var(--lime)">(${waitingAuthor.length})</span></h3>
    ${waitingAuthor.length?waitingAuthor.map(item=>{const author=state.users.find(user=>user.id===item.userId);return `<div class="admin-item"><h3>${escapeHtml(author?.name||"Пользователь")}</h3><p>${escapeHtml(author?.email||"")}</p><div class="admin-actions"><button data-author-approve="${item.id}">Разрешить публикации</button><button data-author-reject="${item.id}">Отклонить</button></div></div>`}).join(""):`<p class="form-note">Новых заявок нет.</p>`}
    <h3 style="font:500 13px var(--display);margin:22px 0 8px">Материалы на проверке <span style="color:var(--lime)">(${pending.length})</span></h3>
    ${pending.length?pending.map(item=>`<div class="admin-item"><h3>${escapeHtml(item.title)} <span class="status-pill status-pending">${item.kind==="story"?"Статья":item.itemType==="case"?"Кейс":"Скин"}</span></h3><p>${escapeHtml(item.description)}</p>${item.media?item.mediaType?.startsWith("video/")?`<video class="admin-image" src="${item.media}" controls playsinline aria-label="Предпросмотр видео"></video>`:`<img class="admin-image" src="${item.media}" alt="Предпросмотр материала">`:""}<div class="admin-actions"><button data-content-approve="${item.id}" data-kind="${item.kind||"listing"}">Одобрить и опубликовать</button><button data-content-reject="${item.id}" data-kind="${item.kind||"listing"}">Отклонить</button></div></div>`).join(""):`<p class="form-note">Материалов для модерации пока нет.</p>`}
    <button class="button button-outline form-submit" id="logoutButton">Выйти из аккаунта</button>`);
}
function addToCart(id){
  const found=state.cart.find(item=>item.id===id);if(found)found.quantity+=1;else state.cart.push({id,quantity:1});saveState();updateHeader();toast("Предмет добавлен в корзину.");
}
function cartModal(){
  const catalog=[...products,...getListings().map(item=>({...item,id:`user-${item.id}`,name:item.title,price:Number(item.price)}))];
  const rows=state.cart.map(cartItem=>{const item=catalog.find(product=>product.id===cartItem.id);return item?{...item,quantity:cartItem.quantity}:null;}).filter(Boolean);
  const total=rows.reduce((sum,item)=>sum+item.price*item.quantity,0);
  showModal(`<div class="eyebrow"><span class="eyebrow-line"></span> ТВОЙ ВЫБОР</div><h2 id="modalTitle">Корзина</h2><p class="modal-intro">Демо-магазин: оплата отключена, покупки не списывают реальные средства.</p>
    ${rows.length?rows.map(item=>`<div class="cart-row"><span>${escapeHtml(item.name)} <small>× ${item.quantity}</small></span><span>$${money(item.price*item.quantity)}</span></div>`).join(""):`<p class="form-note">В корзине пока ничего нет. Выбери предмет из каталога.</p>`}
    <div class="cart-total"><span>Итого</span><span>$${money(total)}</span></div>
    ${rows.length?`<button class="button button-primary form-submit" id="checkoutButton">${currentUser()?"Оформить демо-заказ":"Войти для оформления"} <span>↗</span></button><button class="button button-outline form-submit" id="clearCartButton">Очистить корзину</button>`:""}`);
}
function authorRequest(){
  if(!currentUser()){authModal("register");return;}
  if(currentUser().canPublish){composerModal();return;}
  if(state.requests.some(item=>item.userId===currentUser().id&&item.type==="author"&&item.status==="pending")){toast("Заявка уже ожидает решения администратора.");return;}
  state.requests.push({id:crypto.randomUUID(),userId:currentUser().id,type:"author",status:"pending"});saveState();openProfile();toast("Запрос отправлен администратору.");
}
function composerModal(type="story"){
  if(!currentUser()){authModal("register");return;}
  if(!currentUser().canPublish){toast("Для публикации сначала получи разрешение администратора.");return;}
  showComposer(type);
}
function showComposer(type){
  const labels={story:"Новая история",skin:"Добавить скин",case:"Добавить кейс"};
  showModal(`<div class="eyebrow"><span class="eyebrow-line"></span> АВТОРСКАЯ ПАНЕЛЬ</div><h2 id="modalTitle">${labels[type]}</h2><p class="modal-intro">Материал появится на сайте после проверки администратором.</p>
    <form id="publishForm" data-type="${type}">
      ${type==="story"?"":`<label class="form-field"><span>Категория</span><select name="category"><option value="rifle">Винтовка</option><option value="pistol">Пистолет</option><option value="knife">Нож</option></select></label>`}
      <label class="form-field"><span>${type==="story"?"Заголовок истории":"Название"}</span><input name="title" required maxlength="70" placeholder="${type==="story"?"О чём хочешь рассказать?":"Например, AK-47 | Neon Rider"}"></label>
      <label class="form-field"><span>Описание</span><textarea name="description" required maxlength="500" placeholder="Добавь детали и опиши, чем материал интересен..."></textarea></label>
      ${type==="story"?"":`<label class="form-field"><span>Цена, USD</span><input name="price" type="number" min="0.01" max="100000" step="0.01" required placeholder="25.00"></label>`}
      <label class="form-field"><span>Обложка или видеофайл (необязательно, до 2 МБ)</span><input id="uploadInput" name="upload" type="file" accept="image/*,video/mp4,video/webm"></label>
      <p class="form-note">Поддерживаются изображения и видео MP4/WebM. Файл будет виден модераторам; видео хранится как локальный файл браузера только в этом демо.</p>
      <button class="button button-primary form-submit" type="submit">Отправить на модерацию <span>↗</span></button></form>`);
}
async function fileAsDataUrl(file){
  if(!file)return "";
  if(file.size>2*1024*1024)throw new Error("Максимальный размер файла — 2 МБ.");
  if(!file.type.startsWith("image/")&&!["video/mp4","video/webm"].includes(file.type))throw new Error("Выберите изображение или видео MP4/WebM.");
  return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error("Не удалось прочитать файл."));reader.readAsDataURL(file);});
}
async function submitContent(form){
  const type=form.dataset.type;
  const data=new FormData(form);
  const file=form.querySelector('[name="upload"]').files[0];
  let image="";
  try{image=await fileAsDataUrl(file);}catch(error){toast(error.message);return;}
  const id=crypto.randomUUID();
  if(type==="story"){
    state.stories.push({id,kind:"story",title:data.get("title").trim(),description:data.get("description").trim(),media:image,mediaType:file?.type||"",ownerId:currentUser().id,status:"pending"});
  }else{
    state.listings.push({id,kind:"listing",itemType:type,title:data.get("title").trim(),description:data.get("description").trim(),category:data.get("category"),categoryLabel:{rifle:"ВИНТОВКА",pistol:"ПИСТОЛЕТ",knife:"НОЖ"}[data.get("category")],condition:"Вариант продавца",price:Number(data.get("price")),media:image,mediaType:file?.type||"",ownerId:currentUser().id,status:"pending"});
  }
  try{saveState();closeModal();toast("Отправлено. Публикация появится после одобрения.");}
  catch(error){console.error("Could not save publication.",error);toast("Не удалось сохранить материал. Возможно, хранилище браузера заполнено.");}
}
function handleAuth(form){
  const data=new FormData(form),email=String(data.get("email")).trim().toLowerCase(),password=String(data.get("password"));
  if(authMode==="register"){
    if(state.users.some(user=>user.email===email)){toast("Аккаунт с таким email уже существует.");return;}
    const user={id:crypto.randomUUID(),name:String(data.get("name")).trim(),email,password,role:"user",canPublish:false};
    state.users.push(user);state.currentUser={id:user.id};saveState();updatePage();closeModal();toast("Аккаунт создан. Добро пожаловать!");return;
  }
  let user=state.users.find(item=>item.email===email&&item.password===password);
  if(email==="admin@skinforge.ru"&&password==="admin123"){
    user=state.users.find(item=>item.email===email);
    if(!user){user={id:"skinforge-demo-admin",name:"Администратор",email, password,role:"admin",canPublish:true};state.users.push(user);}
    user.role="admin";
  }
  if(!user){toast("Неверный email или пароль.");return;}
  state.currentUser={id:user.id};saveState();updatePage();closeModal();toast("Вы вошли в аккаунт.");
}
function moderateAuthor(id,approve){
  const request=state.requests.find(item=>item.id===id);if(!request)return;
  request.status=approve?"approved":"rejected";
  const user=state.users.find(item=>item.id===request.userId);if(user&&approve)user.canPublish=true;
  saveState();adminDashboard();toast(approve?"Доступ автора предоставлен.":"Заявка отклонена.");
}
function moderateContent(id,kind,approve){
  const items=kind==="story"?state.stories:state.listings;const item=items.find(entry=>entry.id===id);if(!item)return;
  item.status=approve?"approved":"rejected";saveState();updatePage();renderStories();renderUserCases();adminDashboard();toast(approve?"Материал опубликован.":"Материал отклонён.");
}
document.addEventListener("click",event=>{
  const target=event.target.closest("button,a");if(!target)return;
  if(target.id==="profileButton"){openProfile();return;}
  if(target.id==="modalClose"||target===document.querySelector("#modalBackdrop")){closeModal();return;}
  if(target.dataset.authTab){authModal(target.dataset.authTab);return;}
  if(target.dataset.favorite){const id=target.dataset.favorite;state.favorites=state.favorites.includes(id)?state.favorites.filter(value=>value!==id):[...state.favorites,id];saveState();renderProducts();return;}
  if(target.dataset.buy){addToCart(target.dataset.buy);return;}
  if(target.classList.contains("cart-button")){cartModal();return;}
  if(target.dataset.filter){activeFilter=target.dataset.filter;document.querySelectorAll(".filter-tab").forEach(tab=>tab.classList.toggle("selected",tab===target));renderProducts();return;}
  if(target.id==="showAllButton"){showAll=!showAll;target.innerHTML=showAll?'Показать меньше <span>↑</span>':'Показать больше <span>↓</span>';renderProducts();return;}
  if(target.id==="shareStoryButton"||target.id==="requestAuthorButton"){authorRequest();return;}
  if(target.id==="createPostButton"){showComposer("story");return;}
  if(target.id==="createSkinButton"){showComposer("skin");return;}
  if(target.id==="createCaseButton"){showComposer("case");return;}
  if(target.id==="logoutButton"){state.currentUser=null;saveState();updatePage();closeModal();toast("Вы вышли из аккаунта.");return;}
  if(target.id==="clearCartButton"){state.cart=[];saveState();updateHeader();cartModal();return;}
  if(target.id==="checkoutButton"){if(!currentUser()){authModal();return;}state.cart=[];saveState();updateHeader();closeModal();toast("Демо-заказ оформлен. Оплата не производилась.");return;}
  if(target.id==="openCaseButton"){toast("Открытие кейсов скоро появится. Это демонстрационный сайт.");return;}
  if(target.dataset.authorApprove||target.dataset.authorReject){moderateAuthor(target.dataset.authorApprove||target.dataset.authorReject,Boolean(target.dataset.authorApprove));return;}
  if(target.dataset.contentApprove||target.dataset.contentReject){moderateContent(target.dataset.contentApprove||target.dataset.contentReject,target.dataset.kind,Boolean(target.dataset.contentApprove));return;}
});
document.addEventListener("submit",event=>{
  if(event.target.id==="authForm"){event.preventDefault();handleAuth(event.target);}
  if(event.target.id==="publishForm"){event.preventDefault();submitContent(event.target);}
});
document.querySelector("#searchInput").addEventListener("input",renderProducts);
document.querySelector("#sortSelect").addEventListener("change",renderProducts);
document.querySelector(".search-toggle").addEventListener("click",()=>{document.querySelector("#searchInput").focus();document.querySelector("#catalog").scrollIntoView({behavior:"smooth"});});
document.querySelector(".menu-button").addEventListener("click",()=>document.querySelector(".main-nav").classList.toggle("open"));
document.addEventListener("keydown",event=>{if(event.key==="Escape")closeModal();});
renderProducts();renderStories();renderUserCases();updateHeader();
