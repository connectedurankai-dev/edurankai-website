/**
 * EduRankAI AI Assistant — RAG-Powered Chat Widget v3.0
 * Claude (Anthropic) + Supabase Vector Search (ML-Powered)
 *
 * EMBED ON ANY WEBSITE:
 * <script>
 * window.EduRankAIChatConfig = {
 *   supabaseUrl: 'https://szumqxecfvgljyblwpfn.supabase.co',
 *   supabaseKey: 'your-anon-key-here',
 * };
 * </script>
 * <script src="edurankai-chatbot-widget.js"></script>
 */
(function(window,document){
'use strict';

var cfg=Object.assign({
  position:'bottom-right',primaryColor:'#FF4F00',darkColor:'#120E09',
  companyName:'EduRankAI',botName:'EduRankAI Assistant',
  greeting:null,hideOnMobile:false,zIndex:99999,
  supabaseUrl:'',supabaseKey:''
},window.EduRankAIChatConfig||{});

if(cfg.hideOnMobile&&window.innerWidth<768)return;

var chatHistory=[],isOpen=false,isTyping=false,greeted=false,embedModel=null,modelReady=false,ratings=[];

var GREETING=cfg.greeting||"Hi! \uD83D\uDC4B I'm EduRankAI's AI Assistant — powered by **Claude + ML vector search**.\n\nI search EduRankAI's live knowledge base before every answer.\n\nAsk me anything about **roles, internships, hiring, products, or events**!";

var BASE_SYSTEM=`You are EduRankAI's official AI Assistant — warm, sharp, and always helpful. You answer questions about EduRankAI's careers, internships, hiring policy, products, events, and company culture.

You will be given RELEVANT CONTEXT chunks retrieved from EduRankAI's knowledge base. Use that context as your primary source of truth. If the context answers the question, use it directly. If not, use your general knowledge about EduRankAI — but never make up specific numbers, salaries, or commitments.

ALWAYS:
- Be warm and encouraging to candidates
- Remind people that brilliance and character matter more than credentials
- For applications: direct to hr@edurankai.in or www.edurankai.in/career-with-us
- Keep answers concise and genuinely useful

NEVER make up salary figures, equity percentages, or specific commitments not in the context.`;

async function loadEmbedModel(){
  try{
    var mod=await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js');
    embedModel=await mod.pipeline('feature-extraction','Xenova/all-MiniLM-L6-v2',{quantized:true});
    modelReady=true;
    console.log('[EduRankAI] Embedding model ready \u2705');
  }catch(e){
    console.warn('[EduRankAI] Embedding model failed, using keyword fallback');
    modelReady=false;
  }
}

async function embedQuery(text){
  if(!modelReady||!embedModel)return null;
  try{
    var out=await embedModel(text,{pooling:'mean',normalize:true});
    return Array.from(out.data);
  }catch(e){return null;}
}

async function searchKnowledge(query){
  if(!cfg.supabaseUrl||!cfg.supabaseKey)return null;
  try{
    var emb=await embedQuery(query);
    if(emb){
      var r=await fetch(cfg.supabaseUrl+'/rest/v1/rpc/match_knowledge',{
        method:'POST',
        headers:{'Content-Type':'application/json','apikey':cfg.supabaseKey,'Authorization':'Bearer '+cfg.supabaseKey},
        body:JSON.stringify({query_embedding:emb,match_count:5})
      });
      var d=await r.json();
      if(Array.isArray(d)&&d.length)return d.map(function(x){return x.content;}).join('\n\n---\n\n');
    } else {
      var q=query.replace(/[^a-zA-Z0-9 ]/g,'').slice(0,20);
      var r2=await fetch(cfg.supabaseUrl+'/rest/v1/knowledge?content=ilike.*'+encodeURIComponent(q)+'*&limit=3',{
        headers:{'apikey':cfg.supabaseKey,'Authorization':'Bearer '+cfg.supabaseKey}
      });
      var d2=await r2.json();
      if(Array.isArray(d2)&&d2.length)return d2.map(function(x){return x.content;}).join('\n\n---\n\n');
    }
  }catch(e){console.warn('[EduRankAI] Search error:',e.message);}
  return null;
}

function classifyIntent(msg){
  if(/weather|cricket|bollywood|recipe|movie|sport|bitcoin|instagram|tiktok/i.test(msg))return'off_topic';
  return'general';
}

/* CSS */
var s=document.createElement('style');
s.textContent='#era-fab{position:fixed;bottom:28px;'+(cfg.position==='bottom-left'?'left:28px;right:auto;':'right:28px;')+
'z-index:'+cfg.zIndex+';width:62px;height:62px;border-radius:50%;background:linear-gradient(135deg,'+cfg.primaryColor+','+cfg.primaryColor+'CC);border:none;cursor:pointer;box-shadow:0 4px 24px '+cfg.primaryColor+'77;display:flex;align-items:center;justify-content:center;transition:transform 0.25s,box-shadow 0.25s;animation:era-pulse 3s ease-in-out infinite;}'+
'#era-fab:hover{transform:scale(1.08);}'+
'#era-fab .era-noti{position:absolute;top:-2px;right:-2px;width:14px;height:14px;background:#1A6B35;border-radius:50%;border:2px solid white;animation:era-blink 2s ease-in-out infinite;}'+
'#era-fab .era-ml-dot{position:absolute;bottom:-2px;right:-2px;width:16px;height:16px;background:#1565C0;border-radius:50%;border:2px solid white;font-size:7px;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;}'+
'@keyframes era-blink{0%,100%{opacity:1}50%{opacity:0.3}}'+
'@keyframes era-pulse{0%,100%{box-shadow:0 4px 24px '+cfg.primaryColor+'55}50%{box-shadow:0 4px 36px '+cfg.primaryColor+'99}}'+
'@keyframes era-msgin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}'+
'@keyframes era-dot{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}'+
'#era-win{position:fixed;bottom:106px;'+(cfg.position==='bottom-left'?'left:28px;right:auto;':'right:28px;')+
'z-index:'+(cfg.zIndex-1)+';width:390px;height:580px;background:#FAF8F5;border-radius:22px;box-shadow:0 20px 64px rgba(18,14,9,.22),0 0 0 1px rgba(18,14,9,.08);display:flex;flex-direction:column;font-family:system-ui,sans-serif;transform:scale(0.92) translateY(16px);opacity:0;pointer-events:none;transition:transform 0.3s cubic-bezier(.23,1,.32,1),opacity 0.25s;overflow:hidden;}'+
'#era-win.era-open{transform:scale(1) translateY(0);opacity:1;pointer-events:all;}'+
'.era-hdr{background:'+cfg.darkColor+';padding:16px 18px;display:flex;align-items:center;gap:12px;flex-shrink:0;}'+
'.era-av{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,'+cfg.primaryColor+','+cfg.primaryColor+'CC);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;}'+
'.era-hi{flex:1;}.era-hn{font-size:.9rem;font-weight:800;color:white;letter-spacing:-.2px;}'+
'.era-hs{font-size:.65rem;color:rgba(255,255,255,.55);display:flex;align-items:center;gap:5px;margin-top:2px;}'+
'.era-sd{width:6px;height:6px;background:#4CAF50;border-radius:50%;animation:era-blink 2s ease-in-out infinite;flex-shrink:0;}'+
'.era-xbtn{background:rgba(255,255,255,.1);border:none;border-radius:8px;width:30px;height:30px;cursor:pointer;color:rgba(255,255,255,.7);font-size:.85rem;display:flex;align-items:center;justify-content:center;transition:background .2s;flex-shrink:0;}'+
'.era-xbtn:hover{background:rgba(255,255,255,.2);color:white;}'+
'.era-ml-bar{background:rgba(255,255,255,.05);border-bottom:1px solid rgba(255,255,255,.06);padding:6px 18px;display:flex;align-items:center;gap:8px;flex-shrink:0;}'+
'.era-ml-badge{font-size:.58rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:2px 8px;background:rgba(21,101,192,.3);color:#7EB8F7;border:1px solid rgba(21,101,192,.4);border-radius:100px;}'+
'.era-ml-status{font-size:.6rem;color:rgba(255,255,255,.4);font-weight:600;}'+
'.era-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;scroll-behavior:smooth;}'+
'.era-msgs::-webkit-scrollbar{width:3px;}.era-msgs::-webkit-scrollbar-thumb{background:#E2DDD6;border-radius:2px;}'+
'.era-m{display:flex;gap:8px;align-items:flex-start;animation:era-msgin .25s ease;}'+
'.era-m.u{flex-direction:row-reverse;}'+
'.era-ma{width:30px;height:30px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:.75rem;margin-top:2px;}'+
'.era-m.b .era-ma{background:linear-gradient(135deg,'+cfg.primaryColor+','+cfg.primaryColor+'CC);color:white;}'+
'.era-m.u .era-ma{background:'+cfg.darkColor+';color:white;}'+
'.era-bl{max-width:82%;padding:10px 14px;border-radius:14px;font-size:.83rem;line-height:1.65;}'+
'.era-m.b .era-bl{background:white;color:#120E09;border:1px solid #E2DDD6;border-bottom-left-radius:4px;}'+
'.era-m.u .era-bl{background:'+cfg.primaryColor+';color:white;border-bottom-right-radius:4px;}'+
'.era-bl strong{font-weight:800;}.era-bl a{color:'+cfg.primaryColor+';text-decoration:underline;}'+
'.era-m.u .era-bl a{color:rgba(255,255,255,.85);}'+
'.era-rag-tag{display:inline-block;font-size:.58rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:2px 7px;background:rgba(21,101,192,.1);color:#1565C0;border:1px solid rgba(21,101,192,.2);border-radius:100px;margin-bottom:6px;}'+
'.era-searching{display:flex;align-items:center;gap:8px;padding:10px 14px;background:white;border:1px solid #E2DDD6;border-radius:14px;border-bottom-left-radius:4px;font-size:.78rem;color:#8A7D72;}'+
'.era-sdots{display:flex;gap:3px;}.era-sdots span{width:5px;height:5px;background:'+cfg.primaryColor+';border-radius:50%;animation:era-dot 1.2s ease-in-out infinite;}'+
'.era-sdots span:nth-child(2){animation-delay:.2s;}.era-sdots span:nth-child(3){animation-delay:.4s;}'+
'.era-typ{display:flex;gap:4px;padding:12px 14px;}.era-typ span{width:6px;height:6px;background:#8A7D72;border-radius:50%;animation:era-dot 1.2s ease-in-out infinite;}'+
'.era-typ span:nth-child(2){animation-delay:.2s;}.era-typ span:nth-child(3){animation-delay:.4s;}'+
'.era-qbtns{padding:0 14px 10px;display:flex;gap:6px;flex-wrap:wrap;flex-shrink:0;}'+
'.era-qb{background:white;border:1.5px solid #E2DDD6;border-radius:100px;padding:5px 12px;font-size:.71rem;font-weight:700;color:#3D3329;cursor:pointer;transition:all .15s;font-family:inherit;white-space:nowrap;}'+
'.era-qb:hover{border-color:'+cfg.primaryColor+';color:'+cfg.primaryColor+';background:#FFF2EC;}'+
'.era-rating{display:flex;align-items:center;gap:6px;margin-top:4px;padding-left:38px;}'+
'.era-rating button{background:none;border:none;cursor:pointer;font-size:13px;opacity:.4;transition:opacity .2s;padding:0;}'+
'.era-rating button:hover{opacity:1;}.era-rating button.era-rated{opacity:1;}'+
'.era-rlbl{font-size:.6rem;color:#BDB4AA;font-weight:600;}'+
'.era-ir{padding:12px 14px;border-top:1px solid #E2DDD6;display:flex;gap:8px;align-items:flex-end;flex-shrink:0;background:white;}'+
'.era-inp{flex:1;border:1.5px solid #E2DDD6;border-radius:12px;padding:9px 13px;font-size:.83rem;font-family:inherit;color:#120E09;outline:none;resize:none;max-height:100px;line-height:1.5;transition:border-color .2s;background:#FAF8F5;}'+
'.era-inp:focus{border-color:'+cfg.primaryColor+';}'+
'.era-inp::placeholder{color:#BDB4AA;}'+
'.era-sb{width:40px;height:40px;border-radius:10px;background:'+cfg.primaryColor+';border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0;}'+
'.era-sb:hover{background:'+cfg.darkColor+';}'+
'.era-sb:disabled{background:#E2DDD6;cursor:not-allowed;}'+
'.era-ft{padding:7px 14px;text-align:center;flex-shrink:0;border-top:1px solid #F0EDE8;}'+
'.era-ft span{font-size:.58rem;color:#BDB4AA;font-weight:600;letter-spacing:.06em;text-transform:uppercase;}'+
'@media(max-width:480px){#era-win{width:calc(100vw - 24px);left:12px!important;right:12px!important;bottom:88px;height:74vh;}'+
'#era-fab{'+(cfg.position==='bottom-left'?'left:16px;':'right:16px;')+'bottom:16px;}}';
document.head.appendChild(s);

/* FAB */
var fab=document.createElement('button');
fab.id='era-fab';
fab.setAttribute('aria-label','Chat with '+cfg.companyName);
fab.innerHTML='<span class="era-noti"></span><span class="era-ml-dot">ML</span>'+
'<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="white" fill-opacity=".95"/><circle cx="8" cy="12" r="1.2" fill="'+cfg.primaryColor+'"/><circle cx="12" cy="12" r="1.2" fill="'+cfg.primaryColor+'"/><circle cx="16" cy="12" r="1.2" fill="'+cfg.primaryColor+'"/></svg>';
document.body.appendChild(fab);

/* WINDOW */
var win=document.createElement('div');
win.id='era-win';
win.innerHTML='<div class="era-hdr"><div class="era-av">\uD83E\uDD16</div>'+
'<div class="era-hi"><div class="era-hn">'+cfg.botName+'</div>'+
'<div class="era-hs"><span class="era-sd"></span>Online \xB7 ML vector search \xB7 24/7</div></div>'+
'<button class="era-xbtn" id="era-close">\u2715</button></div>'+
'<div class="era-ml-bar"><span class="era-ml-badge">RAG</span>'+
'<span class="era-ml-status" id="era-ml-status">Loading embedding model\u2026</span></div>'+
'<div class="era-msgs" id="era-msgs"></div>'+
'<div class="era-qbtns" id="era-qbtns">'+
'<button class="era-qb" onclick="EduRankAIChat.send(\'What internships are open?\')">Internships</button>'+
'<button class="era-qb" onclick="EduRankAIChat.send(\'How do I apply?\')">How to apply</button>'+
'<button class="era-qb" onclick="EduRankAIChat.send(\'Tell me about the hiring policy\')">Hiring policy</button>'+
'<button class="era-qb" onclick="EduRankAIChat.send(\'What products is EduRankAI building?\')">Products</button>'+
'<button class="era-qb" onclick="EduRankAIChat.send(\'What events are coming up?\')">Events</button>'+
'</div>'+
'<div class="era-ir"><textarea class="era-inp" id="era-inp" rows="1" placeholder="Ask me anything\u2026" maxlength="1000"></textarea>'+
'<button class="era-sb" id="era-send"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button></div>'+
'<div class="era-ft"><span>'+cfg.companyName+' AI \xB7 RAG + Claude \xB7 ML-Powered \xB7 24/7</span></div>';
document.body.appendChild(win);

function md(t){
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\n/g,'<br>');
}

function addMsg(role,text,ragUsed){
  var msgs=document.getElementById('era-msgs');
  var w=document.createElement('div');
  w.className='era-m '+(role==='bot'?'b':'u');
  var tag=(role==='bot'&&ragUsed)?'<div class="era-rag-tag">\uD83D\uDD0D searched knowledge base</div>':'';
  var ratingId='r'+Date.now();
  w.innerHTML='<div class="era-ma">'+(role==='bot'?'\uD83E\uDD16':'\uD83D\uDC64')+'</div>'+
    '<div><div class="era-bl">'+tag+md(text)+'</div>'+
    (role==='bot'?'<div class="era-rating" id="'+ratingId+'">'+
      '<span class="era-rlbl">Helpful?</span>'+
      '<button onclick="EduRankAIChat._rate(this,1)" title="Yes">\uD83D\uDC4D</button>'+
      '<button onclick="EduRankAIChat._rate(this,-1)" title="No">\uD83D\uDC4E</button>'+
      '</div>':'')+
    '</div>';
  msgs.appendChild(w);
  msgs.scrollTop=msgs.scrollHeight;
}

function showSearching(){
  var msgs=document.getElementById('era-msgs');
  var t=document.createElement('div');
  t.className='era-m b';t.id='era-searching';
  t.innerHTML='<div class="era-ma">\uD83E\uDD16</div><div class="era-searching"><div class="era-sdots"><span></span><span></span><span></span></div>Searching knowledge base\u2026</div>';
  msgs.appendChild(t);msgs.scrollTop=msgs.scrollHeight;
}
function showTyping(){
  hideId('era-searching');
  var msgs=document.getElementById('era-msgs');
  var t=document.createElement('div');
  t.className='era-m b';t.id='era-typing';
  t.innerHTML='<div class="era-ma">\uD83E\uDD16</div><div class="era-bl era-typ"><span></span><span></span><span></span></div>';
  msgs.appendChild(t);msgs.scrollTop=msgs.scrollHeight;
}
function hideId(id){var e=document.getElementById(id);if(e)e.remove();}

async function send(text){
  if(isTyping)return;
  var inp=document.getElementById('era-inp');
  var msg=(text||inp.value||'').trim();
  if(!msg)return;
  var qb=document.getElementById('era-qbtns');
  if(qb)qb.style.display='none';
  inp.value='';inp.style.height='auto';
  addMsg('user',msg,false);
  chatHistory.push({role:'user',content:msg});
  isTyping=true;
  document.getElementById('era-send').disabled=true;

  if(classifyIntent(msg)==='off_topic'){
    var off="I'm EduRankAI's career assistant \u2014 I can help with roles, internships, hiring, and everything about EduRankAI. What would you like to know? \uD83D\uDE0A";
    chatHistory.push({role:'assistant',content:off});
    addMsg('bot',off,false);
    isTyping=false;document.getElementById('era-send').disabled=false;return;
  }

  showSearching();
  var ctx=await searchKnowledge(msg);
  hideId('era-searching');showTyping();

  var sys=BASE_SYSTEM;
  if(ctx)sys+='\n\n=== RELEVANT CONTEXT FROM KNOWLEDGE BASE ===\n'+ctx+'\n=== END CONTEXT ===\n\nUse the above context to answer accurately.';

  try{
    var r=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,system:sys,messages:chatHistory})
    });
    var d=await r.json();
    var reply=(d.content||[]).map(function(b){return b.type==='text'?b.text:'';}).join('')||
      "I'm having a moment \u2014 please try again or email **hr@edurankai.in**.";
    chatHistory.push({role:'assistant',content:reply});
    hideId('era-typing');
    addMsg('bot',reply,!!ctx);
  }catch(e){
    hideId('era-typing');
    addMsg('bot',"Connection hiccup! Try again or email **[hr@edurankai.in](mailto:hr@edurankai.in)**.",false);
  }
  isTyping=false;document.getElementById('era-send').disabled=false;
  document.getElementById('era-inp').focus();
}

function toggle(){
  isOpen=!isOpen;
  win.classList.toggle('era-open',isOpen);
  if(isOpen&&!greeted){greeted=true;setTimeout(function(){addMsg('bot',GREETING,false);},250);}
  if(isOpen)document.getElementById('era-inp').focus();
}

fab.addEventListener('click',toggle);
document.getElementById('era-close').addEventListener('click',toggle);
document.getElementById('era-send').addEventListener('click',function(){send();});
var inp2=document.getElementById('era-inp');
inp2.addEventListener('input',function(){this.style.height='auto';this.style.height=Math.min(this.scrollHeight,100)+'px';});
inp2.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}});

var stEl=document.getElementById('era-ml-status');
loadEmbedModel().then(function(){
  if(stEl)stEl.textContent=modelReady?'\u2705 Vector search ready \xB7 Claude \xB7 Supabase':'Keyword mode \xB7 Claude \xB7 Supabase';
});

window.EduRankAIChat={
  open:function(){if(!isOpen)toggle();},
  close:function(){if(isOpen)toggle();},
  send:send,
  clearHistory:function(){chatHistory=[];var m=document.getElementById('era-msgs');if(m)m.innerHTML='';greeted=false;var q=document.getElementById('era-qbtns');if(q)q.style.display='flex';},
  getRatings:function(){return ratings.slice();},
  getHistory:function(){return chatHistory.slice();},
  appendKnowledge:function(t){BASE_SYSTEM+='\n\nADDITIONAL INFO:\n'+t;},
  _rate:function(btn,val){
    var row=btn.parentElement;
    row.querySelectorAll('button').forEach(function(b){b.classList.remove('era-rated');b.style.opacity='.3';});
    btn.classList.add('era-rated');btn.style.opacity='1';
    ratings.push({rating:val,time:new Date().toISOString()});
  },
  version:'3.0.0-RAG',company:cfg.companyName
};

console.log('%c EduRankAI Chat v3.0 \u2014 RAG+ML ','background:#FF4F00;color:white;font-weight:bold;border-radius:4px;padding:2px 8px;');
console.log('Supabase:',cfg.supabaseUrl?'\u2705 configured':'\u26A0\uFE0F not set');

})(window,document);
