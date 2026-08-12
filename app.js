const pets=[
  {id:'fish',emoji:'🐟',name:'薪水鱼',role:'带薪潜水员',quote:'又从公司叼回一点，别客气。',traits:['擅长摸鱼','快乐计费','拒绝内耗'],types:['ENTP','ESTP','ENFP'],lines:['水温不错，工资也在涨。','你不是在发呆，你在带薪蓄能。','再忍一下，我快吃到下一枚了。']},
  {id:'cat',emoji:'🐈',name:'工位猫',role:'需求拒绝师',quote:'这个需求配不上你的时薪。',traits:['冷脸上班','屏蔽在吗','准点下班'],types:['INTJ','INTP','ISTP'],lines:['收到，但不代表认同。','这场会议本可以是一封邮件。','先别急着回复，让工资再跑一会。']},
  {id:'capy',emoji:'🦫',name:'电子水豚',role:'情绪稳定专员',quote:'没关系，反正时间正在计费。',traits:['稳定回血','拒绝焦虑','到点就走'],types:['ISFJ','ISFP','ESFJ'],lines:['慢一点也没关系，钱没停。','喝口水，我替你守着进度。','工作是暂时的，下班是确定的。']},
  {id:'ghost',emoji:'👻',name:'离职幽灵',role:'灵魂外派员工',quote:'肉体参会，灵魂按时下班。',traits:['灵魂出走','会议隐身','心已下班'],types:['INFP','INFJ','ENFJ'],lines:['我先替你的灵魂下班五分钟。','检测到班味，正在净化。','别怕，今天也会结束。']},
  {id:'dragon',emoji:'🐲',name:'吞金兽',role:'公司资产回收员',quote:'老板投喂中，请勿打扰。',traits:['吞金很快','胃口很好','越忙越饿'],types:['ENTJ','ESTJ','ESFP'],lines:['这点工资只够塞牙缝。','需求再来一点，我还吃得下。','正在把你的烦躁换成金币。']},
  {id:'octo',emoji:'🐙',name:'多线程章鱼',role:'八爪项目经理',quote:'一边崩溃，一边推进八件事。',traits:['多线开工','精准已读','表面镇定'],types:['ISTJ','ESTJ','ENTJ'],lines:['第九件事？请先支付加急费。','八只手都忙，脑子选择下班。','任务很多，但你只有一个。']}
];
const $=s=>document.querySelector(s);
const quiz=$('#quizView'),dashboard=$('#dashboardView'),form=$('#petForm');
let currentPet=pets[0],timer;
const currencies={USD:{symbol:'$',locale:'en-US'},CNY:{symbol:'¥',locale:'zh-CN'},EUR:{symbol:'€',locale:'de-DE'},GBP:{symbol:'£',locale:'en-GB'},JPY:{symbol:'¥',locale:'ja-JP'},CAD:{symbol:'C$',locale:'en-CA'},AUD:{symbol:'A$',locale:'en-AU'}};
function hash(text){return [...text].reduce((a,c)=>((a<<5)-a+c.charCodeAt(0))|0,7)}
function choosePet(random=false){
  const mbti=random?'random':$('#mbti').value,zodiac=random?'random':$('#zodiac').value,mood=random?'命运随机':document.querySelector('[name=mood]:checked').value;
  let pool=mbti==='random'?pets:pets.filter(p=>p.types.includes(mbti));
  if(!pool.length)pool=pets;
  currentPet=pool[Math.abs(hash(mbti+zodiac+mood+Date.now().toString().slice(0,-4)))%pool.length];
  localStorage.setItem('banpetProfile',JSON.stringify({pet:currentPet.id,mbti,zodiac,mood}));
  showDashboard({mbti,zodiac,mood});
}
function showDashboard(profile){
  $('#petEmoji').textContent=currentPet.emoji;$('#petEmoji').setAttribute('aria-label',currentPet.name);
  $('#petTitle').textContent=currentPet.name;$('#petRole').textContent=currentPet.role;$('#petQuote').textContent=`“${currentPet.quote}”`;
  $('#resultTag').textContent=`${profile.mbti==='random'?'神秘人格':profile.mbti} × ${profile.zodiac==='random'?'宇宙随机':profile.zodiac} × ${profile.mood}`;
  $('#traits').innerHTML=currentPet.traits.map(t=>`<span>${t}</span>`).join('');$('#speech').textContent=currentPet.lines[0];
  quiz.classList.add('hidden');dashboard.classList.remove('hidden');restoreSettings();startCounter();window.scrollTo({top:0,behavior:'smooth'});
}
function minutes(v){const [h,m]=v.split(':').map(Number);return h*60+m}
function startCounter(){clearInterval(timer);updateCounter();timer=setInterval(updateCounter,1000)}
function updateCounter(){
  const salary=Number($('#salary').value)||0,days=Number($('#workDays').value)||21.75,start=minutes($('#startTime').value),end=minutes($('#endTime').value),total=Math.max(1,end-start),money=currencies[$('#currency').value]||currencies.USD;
  const now=new Date(),nowMin=now.getHours()*60+now.getMinutes()+now.getSeconds()/60,worked=Math.min(total,Math.max(0,nowMin-start)),earned=salary/days*(worked/total),remaining=Math.max(0,(end-nowMin)*60);
  $('#earned').textContent=earned.toLocaleString(money.locale,{minimumFractionDigits:2,maximumFractionDigits:2});$('#earnedSymbol').textContent=money.symbol;$('#salarySymbol').textContent=money.symbol;document.querySelectorAll('.coin').forEach(c=>c.textContent=money.symbol);
  const h=Math.floor(remaining/3600),m=Math.floor(remaining%3600/60),s=Math.floor(remaining%60);$('#countdown').textContent=[h,m,s].map(n=>String(n).padStart(2,'0')).join(':');
  $('#progressBar').style.width=`${worked/total*100}%`;
  if(nowMin>=end)$('#speech').textContent='到点了。钱拿好，我们走。'; else if(nowMin<start)$('#speech').textContent='还没上班，先活一会儿。';
}
function restoreSettings(){const s=JSON.parse(localStorage.getItem('banpetSalary')||'null');if(s){if(!s.currency)s.currency='CNY';Object.entries(s).forEach(([k,v])=>{const el=$(`#${k}`);if(el)el.value=v})}}
form.addEventListener('submit',e=>{e.preventDefault();choosePet(false)});$('#randomButton').addEventListener('click',()=>choosePet(true));
$('#salaryForm').addEventListener('submit',e=>{e.preventDefault();const data={currency:$('#currency').value,salary:$('#salary').value,startTime:$('#startTime').value,endTime:$('#endTime').value,workDays:$('#workDays').value};localStorage.setItem('banpetSalary',JSON.stringify(data));$('#speech').textContent='计时开始。今天的每一分钟都有价。';startCounter()});
$('#currency').addEventListener('change',updateCounter);
$('#pokeButton').addEventListener('click',()=>{const p=$('#petEmoji');p.classList.remove('bounce');void p.offsetWidth;p.classList.add('bounce');$('#speech').textContent=currentPet.lines[Math.floor(Math.random()*currentPet.lines.length)]});
$('#petEmoji').addEventListener('click',()=>$('#pokeButton').click());
$('#resetButton').addEventListener('click',()=>{dashboard.classList.add('hidden');quiz.classList.remove('hidden');window.scrollTo({top:0,behavior:'smooth'})});
$('#shareButton').addEventListener('click',async()=>{const text=`我的命定班宠是 ${currentPet.emoji} ${currentPet.name}｜${currentPet.role}\n“${currentPet.quote}”\n来领养一只陪你上班的东西。`;try{if(navigator.share)await navigator.share({title:'我的命定班宠',text,url:location.href});else{await navigator.clipboard.writeText(`${text}\n${location.href}`);$('#speech').textContent='结果已复制，去吓同事一跳。'}}catch{}});
const saved=JSON.parse(localStorage.getItem('banpetProfile')||'null');if(saved){currentPet=pets.find(p=>p.id===saved.pet)||pets[0];showDashboard(saved)}
