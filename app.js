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
let currentPet=pets[0],timer,latestEarned=0,lastArchiveMinute=-1,reportMode='month';
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
  quiz.classList.add('hidden');dashboard.classList.remove('hidden');restoreSettings();renderFortune(profile);startCounter();window.scrollTo({top:0,behavior:'smooth'});
}
const fortuneElements=[
  {name:'木旺 · 适合开新坑',color:'生长绿',bg:'#dff0c4',accent:'#79a94b',good:['整理待办','温柔拒绝','先做自己的事'],bad:['临时接活','替人收尾','在群里立 flag']},
  {name:'火旺 · 班味偏热',color:'降温蓝',bg:'#ffd4c9',accent:'#f06e56',good:['冷处理需求','晚点再回复','喝冰咖啡'],bad:['激情输出','当场争论','秒回“在吗”']},
  {name:'土旺 · 稳住别动',color:'工位米',bg:'#eadfc3',accent:'#a88b53',good:['按部就班','清理旧任务','准点吃饭'],bad:['主动创新','改变流程','替老板操心']},
  {name:'金旺 · 适合拒绝',color:'边界银',bg:'#e4e7e5',accent:'#7b8580',good:['明确边界','删减需求','用数据说话'],bad:['提供情绪价值','接受模糊需求','免费加急']},
  {name:'水旺 · 宜顺势摸鱼',color:'摸鱼蓝',bg:'#cfe8f5',accent:'#4d93b5',good:['带薪思考','静音群聊','让需求流走'],bad:['强行推进','主动开会','解释太多']}
];
const fortuneVerdicts=['今天适合冷处理，不适合热情配合。','天意让你上班，工资让你忍耐。','今日最大的吉兆，是会议取消。','不必燃烧自己，公司没有付燃料费。','先观察，很多需求会自行消失。','宜把复杂问题留给明天更有工资的自己。'];
let todayFortune=null;
function seeded(seed,max){return Math.abs(hash(seed))%max}
function renderFortune(profile){const seed=`${todayKey()}-${profile.mbti}-${profile.zodiac}-${currentPet.id}`,element=fortuneElements[seeded(seed,fortuneElements.length)],start=14+seeded(seed+'time',3),minute=[10,20,30,40][seeded(seed+'minute',4)],score=Math.min(96,48+seeded(seed+'score',44)+Math.min(8,daily?.frustration||0));todayFortune={score,element,good:element.good[seeded(seed+'good',element.good.length)],bad:element.bad[seeded(seed+'bad',element.bad.length)],time:`${start}:${String(minute).padStart(2,'0')}–${start+1}:${String((minute+40)%60).padStart(2,'0')}`,verdict:fortuneVerdicts[seeded(seed+'verdict',fortuneVerdicts.length)],identity:`${profile.zodiac==='random'?'神秘星座':profile.zodiac} × ${profile.mbti==='random'?'自由人格':profile.mbti}`};$('#workAvoidScore').textContent=todayFortune.score;$('#elementWeather').textContent=element.name;$('#fortuneIdentity').textContent=todayFortune.identity;$('#fortuneGood').textContent=todayFortune.good;$('#fortuneBad').textContent=todayFortune.bad;$('#luckyColor').textContent=element.color;$('#luckyTime').textContent=todayFortune.time;$('#fortuneVerdict').textContent=`“${todayFortune.verdict}”`;$('#fortuneCard').style.setProperty('--fortune-bg',element.bg);$('#fortuneCard').style.setProperty('--fortune-accent',element.accent)}
function minutes(v){const [h,m]=v.split(':').map(Number);return h*60+m}
function startCounter(){clearInterval(timer);updateCounter();timer=setInterval(updateCounter,1000)}
function updateCounter(){
  const salary=Number($('#salary').value)||0,days=Number($('#workDays').value)||21.75,start=minutes($('#startTime').value),end=minutes($('#endTime').value),total=Math.max(1,end-start),money=currencies[$('#currency').value]||currencies.USD;
  const now=new Date(),nowMin=now.getHours()*60+now.getMinutes()+now.getSeconds()/60,worked=Math.min(total,Math.max(0,nowMin-start)),earned=salary/days*(worked/total),remaining=Math.max(0,(end-nowMin)*60);latestEarned=earned;
  $('#earned').textContent=earned.toLocaleString(money.locale,{minimumFractionDigits:2,maximumFractionDigits:2});$('#earnedSymbol').textContent=money.symbol;$('#salarySymbol').textContent=money.symbol;document.querySelectorAll('.coin').forEach(c=>c.textContent=money.symbol);
  const h=Math.floor(remaining/3600),m=Math.floor(remaining%3600/60),s=Math.floor(remaining%60);$('#countdown').textContent=[h,m,s].map(n=>String(n).padStart(2,'0')).join(':');
  $('#progressBar').style.width=`${worked/total*100}%`;
  document.title=`${money.symbol}${earned.toLocaleString(money.locale,{maximumFractionDigits:2})} · 班宠`;
  if(nowMin>=end)$('#speech').textContent='到点了。钱拿好，我们走。'; else if(nowMin<start)$('#speech').textContent='还没上班，先活一会儿。';
  updateDailyTools();
  if(now.getMinutes()!==lastArchiveMinute){lastArchiveMinute=now.getMinutes();archiveToday()}
}
function restoreSettings(){const s=JSON.parse(localStorage.getItem('banpetSalary')||'null');if(s){if(!s.currency)s.currency='CNY';Object.entries(s).forEach(([k,v])=>{const el=$(`#${k}`);if(el)el.value=v})}}
form.addEventListener('submit',e=>{e.preventDefault();choosePet(false)});$('#randomButton').addEventListener('click',()=>choosePet(true));
$('#salaryForm').addEventListener('submit',e=>{e.preventDefault();const data={currency:$('#currency').value,salary:$('#salary').value,startTime:$('#startTime').value,endTime:$('#endTime').value,workDays:$('#workDays').value};localStorage.setItem('banpetSalary',JSON.stringify(data));$('#speech').textContent='计时开始。今天的每一分钟都有价。';startCounter()});
$('#currency').addEventListener('change',updateCounter);
$('#pokeButton').addEventListener('click',()=>{const p=$('#petEmoji');p.classList.remove('bounce');void p.offsetWidth;p.classList.add('bounce');$('#speech').textContent=currentPet.lines[Math.floor(Math.random()*currentPet.lines.length)]});
$('#petEmoji').addEventListener('click',()=>$('#pokeButton').click());
$('#resetButton').addEventListener('click',()=>{dashboard.classList.add('hidden');quiz.classList.remove('hidden');window.scrollTo({top:0,behavior:'smooth'})});
$('#shareButton').addEventListener('click',async()=>{const text=`我的命定班宠是 ${currentPet.emoji} ${currentPet.name}｜${currentPet.role}\n“${currentPet.quote}”\n来领养一只陪你上班的东西。`;try{if(navigator.share)await navigator.share({title:'我的命定班宠',text,url:location.href});else{await navigator.clipboard.writeText(`${text}\n${location.href}`);$('#speech').textContent='结果已复制，去吓同事一跳。'}}catch{}});
$('#fortuneShare').addEventListener('click',async()=>{if(!todayFortune)return;const text=`${currentPet.emoji} 班宠今日黄历\n${todayFortune.identity}\n今日 ${todayFortune.score}% 不宜上班\n${todayFortune.element.name}\n宜：${todayFortune.good}\n忌：${todayFortune.bad}\n幸运色：${todayFortune.element.color}\n摸鱼吉时：${todayFortune.time}\n“${todayFortune.verdict}”\n娱乐型班运 · ${location.href}`;await navigator.clipboard.writeText(text);$('#fortuneShare').textContent='今日班运已复制 ✓'});

const todayKey=()=>new Date().toLocaleDateString('en-CA');
function loadDaily(){const base={focusSeconds:0,focusStartedAt:null,flow:0,workSkill:0,lifeSkill:0,mask:0,joy:0},saved=JSON.parse(localStorage.getItem('banpetDaily')||'null');return saved?.date===todayKey()?{...saved,events:{...base,...saved.events}}:{date:todayKey(),frustration:0,meetingSeconds:0,meetingStartedAt:null,events:base}}
let daily=loadDaily();
function saveDaily(){localStorage.setItem('banpetDaily',JSON.stringify(daily))}
function meetingSeconds(){return daily.meetingSeconds+(daily.meetingStartedAt?Math.max(0,(Date.now()-daily.meetingStartedAt)/1000):0)}
function clock(seconds){const h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),s=Math.floor(seconds%60);return[h,m,s].map(n=>String(n).padStart(2,'0')).join(':')}
function moneyValue(value){const config=currencies[$('#currency').value]||currencies.USD;return `${config.symbol}${value.toLocaleString(config.locale,{minimumFractionDigits:2,maximumFractionDigits:2})}`}
function hourlyPay(){const salary=Number($('#salary').value)||0,days=Number($('#workDays').value)||21.75,total=Math.max(1,minutes($('#endTime').value)-minutes($('#startTime').value));return salary/days/(total/60)}
function focusSeconds(){return daily.events.focusSeconds+(daily.events.focusStartedAt?Math.max(0,(Date.now()-daily.events.focusStartedAt)/1000):0)}
function updateDailyTools(){if(daily.date!==todayKey())daily=loadDaily();const seconds=meetingSeconds(),meetingEarned=hourlyPay()*seconds/3600;$('#meetingTime').textContent=clock(seconds);$('#meetingMoney').textContent=moneyValue(meetingEarned);$('#frustrationCount').textContent=daily.frustration;$('#frustrationCaption').textContent=daily.frustration===0?'目前情绪尚可，继续观察。':daily.frustration<3?'班味上升，宠物已经注意到了。':daily.frustration<6?'精神损伤明确，公司继续计费。':'建议立即下班，至少心理上。';$('#meetingButton').textContent=daily.meetingStartedAt?'结束这场会':'开始无效会议';$('#meetingButton').classList.toggle('active',Boolean(daily.meetingStartedAt));$('#focusValue').textContent=daily.events.focusStartedAt?`${clock(focusSeconds())} · 结束`:(daily.events.focusSeconds?clock(daily.events.focusSeconds):'开始计时');['flow','workSkill','lifeSkill','mask','joy'].forEach(k=>$(`#${k}Value`).textContent=`${daily.events[k]} 次`)}
function archiveToday(){const archive=JSON.parse(localStorage.getItem('banpetArchive')||'{}');archive[todayKey()]={earned:latestEarned,meetingSeconds:meetingSeconds(),frustration:daily.frustration,currency:$('#currency').value,pet:currentPet.id,events:{...daily.events,focusSeconds:focusSeconds(),focusStartedAt:null}};localStorage.setItem('banpetArchive',JSON.stringify(archive))}
$('#meetingButton').addEventListener('click',()=>{if(daily.meetingStartedAt){daily.meetingSeconds=meetingSeconds();daily.meetingStartedAt=null;$('#speech').textContent='会议结束。结论没有，收入有。'}else{daily.meetingStartedAt=Date.now();$('#speech').textContent='计时开始。这场会的每一分钟都有价格。'}saveDaily();updateDailyTools()});
$('#frustrationButton').addEventListener('click',()=>{daily.frustration+=1;saveDaily();updateDailyTools();const lines=['记下了，这次算精神损伤。','又一次。公司欠你一口气。','烦躁已入账，别免费生气。','收到。今天的班味浓度超标。'];$('#speech').textContent=lines[(daily.frustration-1)%lines.length];$('#pokeButton').click()});
document.querySelectorAll('[data-event]').forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.event;if(key==='focus'){if(daily.events.focusStartedAt){daily.events.focusSeconds=focusSeconds();daily.events.focusStartedAt=null;$('#speech').textContent='专注结束。你真的做成了一点东西。'}else{daily.events.focusStartedAt=Date.now();$('#speech').textContent='进入专注。班宠替你挡住一点噪音。'}}else{daily.events[key]+=1;const lines={flow:'心流捕获成功。今天不只是熬过去。',workSkill:'工作技能 +1，至少这班没有白上。',lifeSkill:'兴趣技能 +1，下班后的你也在长大。',mask:'假面营业已记录。表面配合，内心清醒。',joy:'开心时刻已入账。这个比工资珍贵。'};$('#speech').textContent=lines[key]}saveDaily();updateDailyTools()}));

const dataKeys=['banpetProfile','banpetSalary','banpetDaily','banpetArchive'];
$('#exportButton').addEventListener('click',()=>{archiveToday();const payload={format:'banpet-local-v1',exportedAt:new Date().toISOString(),data:Object.fromEntries(dataKeys.map(k=>[k,JSON.parse(localStorage.getItem(k)||'null')]))};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`banpet-${todayKey()}.json`;a.click();URL.revokeObjectURL(a.href);$('#speech').textContent='本地数据已打包。文件由你保管。'});
$('#importButton').addEventListener('click',()=>$('#importFile').click());
$('#importFile').addEventListener('change',async e=>{try{const payload=JSON.parse(await e.target.files[0].text());if(payload.format!=='banpet-local-v1'||!payload.data)throw new Error();dataKeys.forEach(k=>{if(payload.data[k]!=null)localStorage.setItem(k,JSON.stringify(payload.data[k]))});location.reload()}catch{$('#speech').textContent='这个文件不像班宠的数据包。'}});
function fillSummary(){const seconds=meetingSeconds(),meetingEarned=hourlyPay()*seconds/3600;$('#summaryDate').textContent=new Date().toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'short'});$('#summaryPet').textContent=currentPet.emoji;$('#summaryEarned').textContent=moneyValue(latestEarned);$('#summaryMeeting').textContent=moneyValue(meetingEarned);$('#summaryMeetingTime').textContent=clock(seconds);$('#summaryFrustration').textContent=`${daily.frustration} 次`;const verdicts=daily.frustration>=6?'“今日工伤主要发生在精神层面。”':seconds>=3600?'“会开得很长，好在工资没有停。”':'“活干完多少不确定，钱确实拿到了一些。”';$('#summaryVerdict').textContent=verdicts}
$('#summaryButton').addEventListener('click',()=>{fillSummary();$('#summaryDialog').showModal()});$('#summaryClose').addEventListener('click',()=>$('#summaryDialog').close());
$('#summaryShare').addEventListener('click',async()=>{fillSummary();const text=`${currentPet.emoji} 今日忍耐结算单\n公司支付忍耐费：${moneyValue(latestEarned)}\n无效会议：${clock(meetingSeconds())} / ${moneyValue(hourlyPay()*meetingSeconds()/3600)}\n被工作气到：${daily.frustration} 次\n${$('#summaryVerdict').textContent}\n${location.href}`;await navigator.clipboard.writeText(text);$('#summaryShare').innerHTML='已复制，发给同事 <span>✓</span>'});
function reportData(mode){archiveToday();const archive=JSON.parse(localStorage.getItem('banpetArchive')||'{}'),now=new Date(),prefix=mode==='month'?`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`:`${now.getFullYear()}`;const rows=Object.entries(archive).filter(([date,row])=>date.startsWith(prefix)&&row.currency===$('#currency').value).map(([,row])=>row);return rows.reduce((a,row)=>({days:a.days+1,earned:a.earned+(row.earned||0),meetingSeconds:a.meetingSeconds+(row.meetingSeconds||0),frustration:a.frustration+(row.frustration||0)}),{days:0,earned:0,meetingSeconds:0,frustration:0})}
function fillReport(){const r=reportData(reportMode),label=reportMode==='month'?'本月':'今年';$('#reportTitle').textContent=`${label}忍耐报告`;$('#reportEarned').textContent=moneyValue(r.earned);$('#reportDays').textContent=`${r.days} 天`;$('#reportMeetingMoney').textContent=moneyValue(hourlyPay()*r.meetingSeconds/3600);$('#reportMeetingTime').textContent=clock(r.meetingSeconds);$('#reportFrustration').textContent=`${r.frustration} 次`;$('#reportVerdict').textContent=r.days<2?'“档案刚刚建立，继续把班上成数据。”':r.frustration>r.days*3?'“这段时间的主要产出，是忍住了。”':r.meetingSeconds>r.days*3600?'“会议很多，至少每一分钟都算了钱。”':'“日子一天天过去，工资一笔笔入档。”';return r}
$('#reportButton').addEventListener('click',()=>{fillReport();$('#reportDialog').showModal()});$('#reportClose').addEventListener('click',()=>$('#reportDialog').close());
$('#monthTab').addEventListener('click',()=>{reportMode='month';$('#monthTab').classList.add('active');$('#yearTab').classList.remove('active');fillReport()});$('#yearTab').addEventListener('click',()=>{reportMode='year';$('#yearTab').classList.add('active');$('#monthTab').classList.remove('active');fillReport()});
$('#reportShare').addEventListener('click',async()=>{const r=fillReport(),label=reportMode==='month'?'本月':'今年';await navigator.clipboard.writeText(`${currentPet.emoji} ${label}忍耐报告\n累计忍耐费：${moneyValue(r.earned)}\n记录：${r.days} 天\n会议：${clock(r.meetingSeconds)}\n精神损伤：${r.frustration} 次\n${$('#reportVerdict').textContent}\n${location.href}`);$('#reportShare').innerHTML='已复制忍耐报告 <span>✓</span>'});
const saved=JSON.parse(localStorage.getItem('banpetProfile')||'null');if(saved){currentPet=pets.find(p=>p.id===saved.pet)||pets[0];showDashboard(saved)}
