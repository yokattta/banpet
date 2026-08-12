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
let currentPet=pets[0],timer,latestEarned=0;
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
  const now=new Date(),nowMin=now.getHours()*60+now.getMinutes()+now.getSeconds()/60,worked=Math.min(total,Math.max(0,nowMin-start)),earned=salary/days*(worked/total),remaining=Math.max(0,(end-nowMin)*60);latestEarned=earned;
  $('#earned').textContent=earned.toLocaleString(money.locale,{minimumFractionDigits:2,maximumFractionDigits:2});$('#earnedSymbol').textContent=money.symbol;$('#salarySymbol').textContent=money.symbol;document.querySelectorAll('.coin').forEach(c=>c.textContent=money.symbol);
  const h=Math.floor(remaining/3600),m=Math.floor(remaining%3600/60),s=Math.floor(remaining%60);$('#countdown').textContent=[h,m,s].map(n=>String(n).padStart(2,'0')).join(':');
  $('#progressBar').style.width=`${worked/total*100}%`;
  if(nowMin>=end)$('#speech').textContent='到点了。钱拿好，我们走。'; else if(nowMin<start)$('#speech').textContent='还没上班，先活一会儿。';
  updateDailyTools();
}
function restoreSettings(){const s=JSON.parse(localStorage.getItem('banpetSalary')||'null');if(s){if(!s.currency)s.currency='CNY';Object.entries(s).forEach(([k,v])=>{const el=$(`#${k}`);if(el)el.value=v})}}
form.addEventListener('submit',e=>{e.preventDefault();choosePet(false)});$('#randomButton').addEventListener('click',()=>choosePet(true));
$('#salaryForm').addEventListener('submit',e=>{e.preventDefault();const data={currency:$('#currency').value,salary:$('#salary').value,startTime:$('#startTime').value,endTime:$('#endTime').value,workDays:$('#workDays').value};localStorage.setItem('banpetSalary',JSON.stringify(data));$('#speech').textContent='计时开始。今天的每一分钟都有价。';startCounter()});
$('#currency').addEventListener('change',updateCounter);
$('#pokeButton').addEventListener('click',()=>{const p=$('#petEmoji');p.classList.remove('bounce');void p.offsetWidth;p.classList.add('bounce');$('#speech').textContent=currentPet.lines[Math.floor(Math.random()*currentPet.lines.length)]});
$('#petEmoji').addEventListener('click',()=>$('#pokeButton').click());
$('#resetButton').addEventListener('click',()=>{dashboard.classList.add('hidden');quiz.classList.remove('hidden');window.scrollTo({top:0,behavior:'smooth'})});
$('#shareButton').addEventListener('click',async()=>{const text=`我的命定班宠是 ${currentPet.emoji} ${currentPet.name}｜${currentPet.role}\n“${currentPet.quote}”\n来领养一只陪你上班的东西。`;try{if(navigator.share)await navigator.share({title:'我的命定班宠',text,url:location.href});else{await navigator.clipboard.writeText(`${text}\n${location.href}`);$('#speech').textContent='结果已复制，去吓同事一跳。'}}catch{}});

const todayKey=()=>new Date().toLocaleDateString('en-CA');
function loadDaily(){const saved=JSON.parse(localStorage.getItem('banpetDaily')||'null');return saved?.date===todayKey()?saved:{date:todayKey(),frustration:0,meetingSeconds:0,meetingStartedAt:null}}
let daily=loadDaily();
function saveDaily(){localStorage.setItem('banpetDaily',JSON.stringify(daily))}
function meetingSeconds(){return daily.meetingSeconds+(daily.meetingStartedAt?Math.max(0,(Date.now()-daily.meetingStartedAt)/1000):0)}
function clock(seconds){const h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),s=Math.floor(seconds%60);return[h,m,s].map(n=>String(n).padStart(2,'0')).join(':')}
function moneyValue(value){const config=currencies[$('#currency').value]||currencies.USD;return `${config.symbol}${value.toLocaleString(config.locale,{minimumFractionDigits:2,maximumFractionDigits:2})}`}
function hourlyPay(){const salary=Number($('#salary').value)||0,days=Number($('#workDays').value)||21.75,total=Math.max(1,minutes($('#endTime').value)-minutes($('#startTime').value));return salary/days/(total/60)}
function updateDailyTools(){if(daily.date!==todayKey())daily=loadDaily();const seconds=meetingSeconds(),meetingEarned=hourlyPay()*seconds/3600;$('#meetingTime').textContent=clock(seconds);$('#meetingMoney').textContent=moneyValue(meetingEarned);$('#frustrationCount').textContent=daily.frustration;$('#frustrationCaption').textContent=daily.frustration===0?'目前情绪尚可，继续观察。':daily.frustration<3?'班味上升，宠物已经注意到了。':daily.frustration<6?'精神损伤明确，公司继续计费。':'建议立即下班，至少心理上。';$('#meetingButton').textContent=daily.meetingStartedAt?'结束这场会':'开始无效会议';$('#meetingButton').classList.toggle('active',Boolean(daily.meetingStartedAt))}
$('#meetingButton').addEventListener('click',()=>{if(daily.meetingStartedAt){daily.meetingSeconds=meetingSeconds();daily.meetingStartedAt=null;$('#speech').textContent='会议结束。结论没有，收入有。'}else{daily.meetingStartedAt=Date.now();$('#speech').textContent='计时开始。这场会的每一分钟都有价格。'}saveDaily();updateDailyTools()});
$('#frustrationButton').addEventListener('click',()=>{daily.frustration+=1;saveDaily();updateDailyTools();const lines=['记下了，这次算精神损伤。','又一次。公司欠你一口气。','烦躁已入账，别免费生气。','收到。今天的班味浓度超标。'];$('#speech').textContent=lines[(daily.frustration-1)%lines.length];$('#pokeButton').click()});
function fillSummary(){const seconds=meetingSeconds(),meetingEarned=hourlyPay()*seconds/3600;$('#summaryDate').textContent=new Date().toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'short'});$('#summaryPet').textContent=currentPet.emoji;$('#summaryEarned').textContent=moneyValue(latestEarned);$('#summaryMeeting').textContent=moneyValue(meetingEarned);$('#summaryMeetingTime').textContent=clock(seconds);$('#summaryFrustration').textContent=`${daily.frustration} 次`;const verdicts=daily.frustration>=6?'“今日工伤主要发生在精神层面。”':seconds>=3600?'“会开得很长，好在工资没有停。”':'“活干完多少不确定，钱确实拿到了一些。”';$('#summaryVerdict').textContent=verdicts}
$('#summaryButton').addEventListener('click',()=>{fillSummary();$('#summaryDialog').showModal()});$('#summaryClose').addEventListener('click',()=>$('#summaryDialog').close());
$('#summaryShare').addEventListener('click',async()=>{fillSummary();const text=`${currentPet.emoji} 今日忍耐结算单\n公司支付忍耐费：${moneyValue(latestEarned)}\n无效会议：${clock(meetingSeconds())} / ${moneyValue(hourlyPay()*meetingSeconds()/3600)}\n被工作气到：${daily.frustration} 次\n${$('#summaryVerdict').textContent}\n${location.href}`;await navigator.clipboard.writeText(text);$('#summaryShare').innerHTML='已复制，发给同事 <span>✓</span>'});
const saved=JSON.parse(localStorage.getItem('banpetProfile')||'null');if(saved){currentPet=pets.find(p=>p.id===saved.pet)||pets[0];showDashboard(saved)}
