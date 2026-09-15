(() => {
  'use strict';

  // Troque por seu link real da Hotmart antes de publicar.
  const CHECKOUT_URL = 'https://pay.hotmart.com/U106884729U?checkoutMode=10';
  const LEAD_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyeBojFqad-9tpwAdFW8UlkCEjA8VHcm9ZpTSLgWzNn0zCQAt7lLSfvvusi7SvY2-J9/exec';
  const LAUNCH_PRICE = 67;
  const REFERENCE_PRICE = 197;
  const COUPON = 'LANÇAMENTO';
  const COUPON_DISCOUNT = 30;
  const COUPON_PRICE = LAUNCH_PRICE * (1 - COUPON_DISCOUNT / 100);

  const app = document.getElementById('app');
  const state = { phase:'intro', step:0, answers:{}, sliderTouched:{}, lead:{name:'',email:'',phone:''}, offerEnteredAt:0, tracked:{} };

  const steps = [
    {id:'q1', type:'choice', q:'Quando você acorda, como sua cabeça costuma estar?', choices:[['A','Tranquila, sei o que preciso fazer'],['B','Já pensando em algumas tarefas'],['C','Cheia de coisas ao mesmo tempo'],['D','Parece que o dia começa antes de eu levantar']]},
    {id:'q2', type:'choice', q:'Quando aparecem várias coisas para resolver, você sabe o que fazer primeiro?', choices:[['A','Quase sempre'],['B','Na maioria das vezes'],['C','Fico em dúvida'],['D','Travada, começo uma coisa e pulo para outra']]},
    {id:'q3', type:'choice', q:'Quantas vezes você termina o dia pensando: “fiz tanta coisa, mas parece que não fiz nada”?', choices:[['A','Quase nunca'],['B','Algumas vezes'],['C','Muitas vezes'],['D','Praticamente todos os dias']]},
    {id:'q4', type:'slider', q:'Quanto você sente que precisa lembrar de tudo sozinha?', min:'Quase nada', max:'O tempo todo'},
    {id:'i1', type:'interlude'},
    {id:'q5', type:'choice', q:'Quando você precisa organizar sua semana, o que acontece?', choices:[['A','Tenho um sistema que funciona'],['B','Anoto algumas coisas e vou ajustando'],['C','Faço listas, mas nem sempre consigo seguir'],['D','Só penso em tudo e vou apagando incêndios']]},
    {id:'q6', type:'choice', q:'Quanto tempo do seu dia sobra realmente para você?', choices:[['A','Tenho tempo quase todos os dias'],['B','Tenho alguns momentos'],['C','Muito pouco'],['D','Quase nenhum']]},
    {id:'q7', type:'choice', q:'Quando você pensa em usar tecnologia para facilitar sua rotina, como se sente?', choices:[['A','Curiosa e aberta'],['B','Interessada, mas insegura'],['C','Acho complicado'],['D','Tenho medo de não saber usar']]},
    {id:'q8', type:'choice', q:'O que mais pesa hoje?', choices:[['A','Não saber por onde começar'],['B','Ter tarefas demais'],['C','Esquecer compromissos e coisas importantes'],['D','Sentir que nunca consigo terminar tudo']]},
    {id:'q9', type:'slider', q:'De 0 a 10, quanto você sente que precisa dar conta de tudo?', min:'Não sinto isso', max:'O tempo todo'},
    {id:'q10', type:'choice', q:'Se você pudesse mudar UMA coisa na sua rotina agora, qual seria?', choices:[['A','Ter mais clareza do que fazer primeiro'],['B','Organizar melhor minhas tarefas'],['C','Ter mais tempo para mim'],['D','Parar de carregar tudo na cabeça']]}
  ];

  const questionSteps = steps.filter(s => s.type !== 'interlude');
  const escapeHtml = s => String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const fmt = n => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
  const clamp = n => Math.max(0,Math.min(100,Math.round(n)));

  function trackingParams(){ return new URLSearchParams(location.search); }
  function checkoutUrl(){
    try{ const u = new URL(CHECKOUT_URL); trackingParams().forEach((v,k)=>u.searchParams.set(k,v)); return u.toString(); }
    catch{ return CHECKOUT_URL; }
  }
  function track(name, extra={}){
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({event:name,...extra});

    if(window.fbq){
      const metaEvents = {
        quiz_start: {type:'custom', event:'StartQuiz'},
        quiz_50: {type:'custom', event:'Quiz50'},
        quiz_complete: {type:'custom', event:'QuizComplete'},
        capture_view: {type:'custom', event:'CaptureView'},
        analysis_start: {type:'custom', event:'AnalysisStart'},
        lead_submit: {type:'standard', event:'Lead', params:{content_name:'Quiz Recomeço Inteligente'}},
        result_view: {type:'standard', event:'ViewContent', params:{content_name:'Resultado do Quiz Recomeço Inteligente'}},
        vsl_open: {type:'custom', event:'VSLStart'},
        vsl_complete: {type:'custom', event:'VSLComplete'},
        offer_view: {type:'standard', event:'ViewContent', params:{content_name:'Oferta Recomeço Inteligente',content_type:'product',value:LAUNCH_PRICE,currency:'BRL'}},
        checkout_click: {type:'standard', event:'InitiateCheckout', params:{content_name:'Recomeço Inteligente',content_type:'product',value:LAUNCH_PRICE,currency:'BRL'}},
        exit_coupon_view: {type:'custom', event:'ExitCouponView'},
        exit_coupon_accept: {type:'custom', event:'ExitCouponAccept'},
        exit_coupon_decline: {type:'custom', event:'ExitCouponDecline'}
      };
      const cfg=metaEvents[name];
      if(cfg){
        const params={...(cfg.params||{}),...extra};
        if(cfg.type==='standard') window.fbq('track',cfg.event,params);
        else window.fbq('trackCustom',cfg.event,params);
      } else {
        window.fbq('trackCustom',name,extra);
      }
    }

    if(window.gtag) window.gtag('event',name,extra);
  }

  function trackOnce(key,name,extra={}){
    if(state.tracked[key]) return;
    state.tracked[key]=true;
    track(name,extra);
  }

  function trackQuizMilestones(questionId){
    const questionNumber=questionSteps.findIndex(q=>q.id===questionId)+1;
    if(questionNumber>=5){
      trackOnce('quiz_50','quiz_50',{progress:50,question_number:questionNumber});
    }
    if(questionNumber>=questionSteps.length){
      const sc=scores();
      const profile=getProfile(sc);
      trackOnce('quiz_complete','quiz_complete',{questions_answered:questionSteps.length,profile:profile.title});
    }
  }

  function shell(content, {progress=null, back=false, offer=false}={}){
    app.className = offer ? 'app offer-shell' : 'app';
    return `
      ${progress!==null?`<div class="progress-wrap"><div class="progress" style="width:${progress}%"></div></div>`:''}
      <div class="topline">${back?'<button class="back" id="backBtn">← Voltar</button>':'<span></span>'}<div class="brand">RECOMEÇO INTELIGENTE</div><span></span></div>
      ${content}`;
  }

  function render(){
    window.scrollTo({top:0,behavior:'instant'});
    if(state.phase==='intro') return renderIntro();
    if(state.phase==='quiz') return renderQuiz();
    if(state.phase==='ready') return renderReady();
    if(state.phase==='analysis') return renderAnalysis();
    if(state.phase==='lead') return renderLead();
    if(state.phase==='result') return renderResult();
    if(state.phase==='vsl') return renderVsl();
    if(state.phase==='offer') return renderOffer();
  }

  function renderIntro(){
    app.innerHTML = shell(`<section class="card hero fade-in">
      <div class="eyebrow">UMA PAUSA PARA OLHAR PARA VOCÊ</div>
      <h1>Como sua cabeça está administrando sua rotina hoje?</h1>
      <p>Responda algumas perguntas rápidas e veja onde sua energia está sendo mais consumida. Não existe resposta certa ou errada. É só sobre como você tem se sentido de verdade.</p>
      <button class="btn" id="startBtn">COMEÇAR MINHA ANÁLISE</button>
    </section>`);
    document.getElementById('startBtn').onclick=()=>{
      // Sempre começa zerado: nada preselecionado.
      state.answers={}; state.sliderTouched={}; state.lead={name:'',email:'',phone:''}; state.step=0; state.phase='quiz'; state.tracked={};
      sessionStorage.removeItem('ri-exit-seen');
      trackOnce('quiz_start','quiz_start'); render();
    };
  }

  function currentProgress(){
    const current = steps[state.step];
    const answeredBefore = steps.slice(0,state.step+1).filter(s=>s.type!=='interlude').length;
    return Math.round((Math.max(0,answeredBefore-1)/questionSteps.length)*100);
  }

  function bindBack(){ const b=document.getElementById('backBtn'); if(b) b.onclick=()=>{ if(state.step>0){state.step--;render();} else {state.phase='intro';render();} }; }

  function renderQuiz(){
    const s=steps[state.step];
    if(!s){state.phase='ready';return render();}
    if(s.type==='interlude') return renderInterlude();
    if(s.type==='choice'){
      const selected = state.answers[s.id];
      const options = s.choices.map(([id,label])=>`<button class="option ${selected===id?'selected':''}" data-id="${id}">${escapeHtml(label)}</button>`).join('');
      app.innerHTML = shell(`<section class="card quiz-card fade-in"><div class="question">${escapeHtml(s.q)}</div><div class="options">${options}</div></section>`,{progress:currentProgress(),back:true});
      bindBack();
      document.querySelectorAll('.option').forEach(el=>el.onclick=()=>{
        state.answers[s.id]=el.dataset.id;
        trackQuizMilestones(s.id);
        document.querySelectorAll('.option').forEach(o=>o.classList.remove('selected'));
        el.classList.add('selected');
        setTimeout(()=>{state.step++;render();},220);
      });
    } else {
      const val = Number(state.answers[s.id] ?? 5);
      const touched = !!state.sliderTouched[s.id];
      app.innerHTML = shell(`<section class="card quiz-card fade-in"><div class="question">${escapeHtml(s.q)}</div>
        <div class="slider-box"><div class="slider-value" id="sliderValue">${val}</div><input id="range" type="range" min="0" max="10" step="1" value="${val}" aria-label="${escapeHtml(s.q)}"><div class="slider-labels"><span>${escapeHtml(s.min)}</span><span>${escapeHtml(s.max)}</span></div></div>
        <button class="btn" id="sliderNext" ${touched?'':'disabled'}>CONTINUAR</button><div class="notice">${touched?'':'Mova a escala para registrar sua resposta.'}</div></section>`,{progress:currentProgress(),back:true});
      bindBack();
      const range=document.getElementById('range'), value=document.getElementById('sliderValue'), next=document.getElementById('sliderNext');
      range.oninput=()=>{ value.textContent=range.value; state.answers[s.id]=Number(range.value); state.sliderTouched[s.id]=true; next.disabled=false; document.querySelector('.notice').textContent=''; };
      next.onclick=()=>{ if(!state.sliderTouched[s.id]) return; trackQuizMilestones(s.id); state.step++; render(); };
    }
  }

  function renderInterlude(){
    app.innerHTML = shell(`<section class="card interlude fade-in">
      <img src="sobrecarga-quiz.jpg" alt="Mulher sobrecarregada com tarefas e rotina familiar" />
      <div class="interlude-copy"><p>Suas respostas mostram que o seu <em>cansaço</em> não vem só das tarefas. Vem também de tentar lembrar, decidir e dar conta de tudo ao mesmo tempo.</p><button class="btn" id="continueBtn">CONTINUAR</button></div>
    </section>`,{progress:40,back:true});
    bindBack(); document.getElementById('continueBtn').onclick=()=>{state.step++;render();};
  }

  function renderReady(){
    app.innerHTML = shell(`<section class="card ready fade-in"><div class="eyebrow">SUAS RESPOSTAS ESTÃO PRONTAS</div><h2>Pronto. Já tenho o que preciso.</h2><p>Agora vou cruzar suas respostas para entender onde sua rotina está pesando mais.</p><button class="btn" id="analyzeBtn">ANALISAR MINHAS RESPOSTAS</button></section>`,{progress:100,back:true});
    const b=document.getElementById('backBtn'); if(b)b.onclick=()=>{state.step=steps.length-1;state.phase='quiz';render();};
    document.getElementById('analyzeBtn').onclick=()=>{state.phase='analysis';track('analysis_start');render();};
  }

  function renderAnalysis(){
    const lines=['Entendendo onde sua rotina pesa mais','Avaliando sua carga mental','Analisando sua clareza de prioridades','Identificando seu padrão de organização','Preparando seu resultado'];
    app.innerHTML = shell(`<section class="card analysis fade-in"><div class="eyebrow">ANALISANDO SUAS RESPOSTAS</div><div class="analysis-ring" id="ring"><div class="analysis-number" id="num">0%</div></div><div class="checks">${lines.map((t,i)=>`<div class="checkline" id="ck${i}"><span class="checkicon">✓</span><span>${t}</span></div>`).join('')}</div></section>`);
    const start=performance.now(), duration=6200;
    const tick=(now)=>{
      const p=Math.min(100,Math.round(((now-start)/duration)*100));
      document.getElementById('ring').style.setProperty('--p',p); document.getElementById('num').textContent=p+'%';
      lines.forEach((_,i)=>document.getElementById('ck'+i).classList.toggle('done',p>=(i+1)*18));
      if(p<100) requestAnimationFrame(tick); else setTimeout(()=>{state.phase='lead';track('analysis_complete');render();},650);
    }; requestAnimationFrame(tick);
  }

  // Pontuação recalibrada: cada indicador é analisado separadamente.
  // Isso evita que respostas diferentes caiam sempre no mesmo resultado.
  const LOAD_SCORE={A:0,B:30,C:70,D:100};
  const POS_SCORE={A:100,B:75,C:35,D:10};
  const TIME_SCORE={A:100,B:72,C:35,D:8};

  function scores(){
    const a=state.answers;
    const choice=(id,map,fallback)=>map[String(a[id]??fallback)] ?? map[fallback];
    const slider=id=>Math.max(0,Math.min(10,Number(a[id]??5)))*10;

    const q4=slider('q4');
    const q9=slider('q9');

    // Carga mental: sensação ao acordar + fim do dia + memória + pressão para dar conta.
    const carga=clamp((
      choice('q1',LOAD_SCORE,'B') +
      choice('q3',LOAD_SCORE,'B') +
      q4 + q9
    )/4);

    // Clareza: capacidade de priorizar + forma de organizar a semana.
    const clareza=clamp((
      choice('q2',POS_SCORE,'B') +
      choice('q5',POS_SCORE,'B')
    )/2);

    // Tempo para si vem diretamente da resposta da usuária, sem ser artificialmente derrubado pela carga.
    const tempo=clamp(choice('q6',TIME_SCORE,'B'));

    // Controle combina clareza com quanto a rotina depende da memória e da pressão pessoal.
    const controle=clamp(
      clareza*.50 +
      (100-q9)*.25 +
      (100-q4)*.25
    );

    return {carga,clareza,tempo,controle};
  }

  function getProfile(sc){
    // Sobrecarga alta só aparece quando a carga realmente está muito elevada.
    if(sc.carga>=72){
      return {
        key:'overload',
        title:'Sua rotina está em estado de sobrecarga silenciosa'
      };
    }

    // Abaixo disso, o resultado procura o ponto que mais precisa de atenção.
    const weak=[
      ['clarity',sc.clareza],
      ['time',sc.tempo],
      ['control',sc.controle]
    ].sort((a,b)=>a[1]-b[1]);

    if(weak[0][0]==='time' && sc.tempo<=38){
      return {
        key:'time',
        title:'Você está cuidando de tudo — e ficando por último'
      };
    }
    if(weak[0][0]==='clarity' && sc.clareza<=42){
      return {
        key:'clarity',
        title:'Sua rotina está pedindo mais clareza e direção'
      };
    }
    if(weak[0][0]==='control' && sc.controle<=45){
      return {
        key:'control',
        title:'Você está vivendo mais no modo reação do que no controle'
      };
    }
    if(sc.carga>=48){
      return {
        key:'limit',
        title:'Você está funcionando, mas carregando peso demais'
      };
    }
    return {
      key:'balanced',
      title:'Você já tem uma base — agora pode ganhar mais leveza'
    };
  }

  const peso={A:'a sensação de não saber por onde começar',B:'o volume de tarefas acumuladas',C:'o medo de esquecer compromissos importantes',D:'a sensação de nunca conseguir terminar tudo'};
  const desejo={A:'ter clareza do que fazer primeiro',B:'organizar melhor suas tarefas',C:'ter mais tempo para você',D:'parar de carregar tudo na cabeça'};

  function paragraph(sc,profile){
    const p=peso[state.answers.q8]||peso.A;
    const d=desejo[state.answers.q10]||desejo.A;

    const intro={
      overload:'Suas respostas mostram que o problema não é falta de esforço. Sua cabeça está tentando administrar coisas demais ao mesmo tempo.',
      time:'Sua rotina continua andando, mas quase todo o espaço do dia está sendo ocupado por responsabilidades e necessidades dos outros.',
      clarity:'Você faz muita coisa, mas parte do seu desgaste vem de precisar decidir o tempo todo o que fazer primeiro e por onde começar.',
      control:'Você consegue resolver as coisas, mas muitos dias parecem ser conduzidos pelo que aparece, e não pelo que você planejou.',
      limit:'Você está conseguindo manter a rotina funcionando, mas isso está exigindo mais energia mental do que deveria.',
      balanced:'Você já construiu alguma organização e não está no nível mais alto de sobrecarga. Ainda assim, existem pontos que podem ficar mais simples.'
    }[profile.key];

    const middle=` Hoje, o que mais pesa é ${p}.`;
    const ending=sc.tempo<40
      ? ` E ${d} pode ser um passo importante para devolver um pouco de espaço para você.`
      : ` Criar apoios mais simples pode ajudar você a ${d} sem precisar reinventar sua rotina.`;
    return intro+middle+ending;
  }

  function resultReading(sc,profile){
    const blocks={
      overload:{
        lead:'Seu resultado mostra uma sobrecarga mental alta. Isso costuma acontecer quando você tenta lembrar de tudo, resolver várias coisas ao mesmo tempo e sente que precisa dar conta de tudo sozinha.',
        help:'tirar tarefas da cabeça, organizar prioridades e criar formas de receber apoio nas pequenas decisões do dia a dia.',
        quote:'Você não precisa fazer mais. Precisa carregar menos sozinha.'
      },
      time:{
        lead:'O ponto que mais pede atenção é o espaço que sobra para você. Quando quase todo o dia é ocupado por obrigações, até pequenas decisões começam a pesar mais.',
        help:'proteger um pouco do seu tempo, simplificar tarefas repetidas e criar apoios que reduzam o número de coisas que dependem só de você.',
        quote:'Organizar a rotina também é voltar a caber dentro dela.'
      },
      clarity:{
        lead:'O que mais aparece nas suas respostas é a dificuldade de transformar tudo o que precisa ser feito em prioridades claras. Quando tudo parece importante, decidir também cansa.',
        help:'definir o que vem primeiro, separar urgência de importância e tirar decisões repetidas da sua cabeça.',
        quote:'Clareza não é fazer tudo. É saber o que merece sua atenção agora.'
      },
      control:{
        lead:'Suas respostas mostram que você dá conta de muita coisa, mas frequentemente no improviso. Quando o dia é conduzido pelos imprevistos, a sensação de controle diminui.',
        help:'criar uma rotina mais previsível, organizar pendências e ter apoio para lidar com as pequenas decisões do dia.',
        quote:'Você não precisa controlar tudo. Precisa sentir que a sua rotina não controla você.'
      },
      limit:{
        lead:'Você está conseguindo manter as coisas funcionando, mas com um esforço mental maior do que deveria. É aquele ponto em que você ainda dá conta — só que quase sempre cansada.',
        help:'simplificar prioridades, tirar pendências da memória e criar atalhos para tarefas que hoje consomem tempo e energia.',
        quote:'Você não precisa esperar chegar ao limite para organizar a vida de outro jeito.'
      },
      balanced:{
        lead:'Você já tem alguma organização e isso aparece nas suas respostas. O próximo ganho não é fazer mais, e sim tornar o que já funciona mais simples e leve.',
        help:'automatizar pequenas decisões, reunir tarefas em um sistema claro e usar apoio para economizar tempo no dia a dia.',
        quote:'Organização não é perfeição. É fazer a rotina trabalhar mais a seu favor.'
      }
    };
    const b=blocks[profile.key];
    return `<div class="reading-card"><div class="reading-label">O QUE SUAS RESPOSTAS REVELAM</div><p><strong>${b.lead.split('. ')[0]}.</strong>${b.lead.includes('. ')?' '+b.lead.split('. ').slice(1).join('. '):''}</p><p><strong>O que pode ajudar agora:</strong> ${b.help}</p><div class="reading-quote">${b.quote}</div></div>`;
  }


  function leadPayload(name,email,phone){
    const sc=scores();
    const profile=getProfile(sc);
    const p=trackingParams();
    return new URLSearchParams({
      nome:name,
      email:email,
      telefone:phone,
      perfil:profile.title,
      cargaMental:String(sc.carga),
      clareza:String(sc.clareza),
      tempo:String(sc.tempo),
      controle:String(sc.controle),
      origem:p.get('utm_source') || p.get('source') || (p.get('fbclid') ? 'Meta/Facebook' : 'Direto'),
      campanha:p.get('utm_campaign') || '',
      anuncio:p.get('utm_content') || p.get('ad_id') || p.get('utm_term') || ''
    });
  }

  function submitLeadFallback(params){
    try{
      const frameName='riLeadFrame_'+Date.now();
      const iframe=document.createElement('iframe');
      iframe.name=frameName;
      iframe.style.display='none';
      document.body.appendChild(iframe);

      const form=document.createElement('form');
      form.method='POST';
      form.action=LEAD_ENDPOINT;
      form.target=frameName;
      form.style.display='none';
      for(const [key,value] of params.entries()){
        const input=document.createElement('input');
        input.type='hidden'; input.name=key; input.value=value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
      setTimeout(()=>{form.remove();iframe.remove();},10000);
    }catch{}
  }

  async function saveLead(name,email,phone){
    const params=leadPayload(name,email,phone);
    try{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),3500);
      await fetch(LEAD_ENDPOINT,{
        method:'POST',
        mode:'no-cors',
        headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
        body:params.toString(),
        keepalive:true,
        signal:controller.signal
      });
      clearTimeout(timer);
      return true;
    }catch{
      submitLeadFallback(params);
      return false;
    }
  }


  function renderLead(){
    trackOnce('capture_view','capture_view');
    const saved = state.lead || {name:'',email:'',phone:''};
    app.innerHTML = shell(`<section class="card lead-card fade-in">
      <div class="eyebrow">SUA ANÁLISE ESTÁ PRONTA</div>
      <h2>Antes de mostrar seu resultado…</h2>
      <p class="lead-intro">Preencha seus dados para liberar sua análise personalizada.</p>
      <form id="leadForm" class="lead-form" novalidate>
        <label>Seu nome
          <input id="leadName" name="name" type="text" autocomplete="name" placeholder="Como você gosta de ser chamada?" value="${escapeHtml(saved.name||'')}" required />
        </label>
        <label>Seu melhor e-mail
          <input id="leadEmail" name="email" type="email" autocomplete="email" placeholder="voce@email.com" value="${escapeHtml(saved.email||'')}" required />
        </label>
        <label>Seu telefone / WhatsApp
          <input id="leadPhone" name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="(00) 00000-0000" value="${escapeHtml(saved.phone||'')}" required />
        </label>
        <div class="lead-error" id="leadError" role="alert"></div>
        <button class="btn" type="submit">VER MEU RESULTADO</button>
      </form>
      <p class="privacy-note">Seus dados são usados para liberar seu resultado e continuar seu atendimento relacionado ao Recomeço Inteligente.</p>
    </section>`,{back:false});

    const form=document.getElementById('leadForm');
    form.onsubmit=(e)=>{
      e.preventDefault();
      const name=document.getElementById('leadName').value.trim();
      const email=document.getElementById('leadEmail').value.trim();
      const phone=document.getElementById('leadPhone').value.trim();
      const err=document.getElementById('leadError');
      const btn=form.querySelector('button[type="submit"]');
      const validEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if(name.length<2){err.textContent='Digite seu nome para continuar.';return;}
      if(!validEmail){err.textContent='Digite um e-mail válido para continuar.';return;}
      if(phone.replace(/\D/g,'').length<8){err.textContent='Digite um telefone/WhatsApp válido para continuar.';return;}
      err.textContent='';
      btn.disabled=true;
      btn.textContent='LIBERANDO SEU RESULTADO...';
      state.lead={name,email,phone};
      try{sessionStorage.setItem('ri-lead',JSON.stringify(state.lead));}catch{}

      // Libera o resultado imediatamente.
      // O envio para Apps Script (Planilha + Manycontent + Brevo) continua em segundo plano.
      state.phase='result';
      render();
      void saveLead(name,email,phone).then(()=>trackOnce('lead_submit','lead_submit'));
    };
  }

  function metric(label,value){return `<div class="metric"><div class="metric-head"><span>${label}</span><strong>${value}%</strong></div><div class="track"><div class="fill" data-width="${value}%"></div></div></div>`;}
  function renderResult(){
    const sc=scores();
    const profile=getProfile(sc);
    track('result_view',{profile:profile.title});
    app.innerHTML=shell(`<section class="card result fade-in"><div class="eyebrow">SEU RESULTADO</div><h2>${profile.title}</h2><p class="result-lead">${paragraph(sc,profile)}</p>${metric('Carga mental',sc.carga)}${metric('Clareza de prioridades',sc.clareza)}${metric('Tempo para você',sc.tempo)}${metric('Sensação de controle',sc.controle)}${resultReading(sc,profile)}<h3>Eu quero te mostrar uma coisa antes de você sair daqui.</h3><p class="result-lead">Preparei um vídeo curto para mostrar como começar de um jeito mais simples — mesmo sem dominar tecnologia.</p><button class="btn" id="watchBtn">ASSISTIR AGORA</button><div class="disclaimer">Esta é uma leitura orientativa baseada nas suas respostas e não substitui avaliação médica ou psicológica.</div></section>`,{back:false});
    requestAnimationFrame(()=>document.querySelectorAll('.fill').forEach(el=>el.style.width=el.dataset.width));
    document.getElementById('watchBtn').onclick=()=>{state.phase='vsl';track('vsl_open');render();};
  }

  function renderVsl(){
    app.innerHTML=shell(`<section class="card vsl-card fade-in"><div class="video-wrap"><video id="vsl" src="vsl.mp4" poster="vsl-poster.jpg" playsinline preload="auto" controlsList="nodownload noplaybackrate nofullscreen"></video><div class="video-overlay" id="videoOverlay">Preparando seu vídeo...</div></div><div class="vsl-copy"><h2>Assista até o final.</h2><p>Quando o vídeo terminar, eu vou te mostrar como o Recomeço Inteligente pode ajudar você a sair desse caos, parar de viver apagando incêndios, organizar sua rotina e voltar a sentir que sua vida está nas suas mãos.</p><button class="btn hidden" id="offerBtn">VER TUDO O QUE EU VOU RECEBER</button></div></section>`);
    const v=document.getElementById('vsl');
    const overlay=document.getElementById('videoOverlay');
    const offerBtn=document.getElementById('offerBtn');
    let maxTime=0;
    let finished=false;

    const openOffer=()=>{state.phase='offer';history.pushState({offer:true},'',location.href);track('offer_view');render();};
    const startPlayback=()=>{
      const playAttempt=v.play();
      if(playAttempt && typeof playAttempt.then==='function'){
        playAttempt.then(()=>{overlay.classList.add('hidden');}).catch(()=>{
          overlay.textContent='Toque aqui para iniciar o vídeo';
          overlay.style.pointerEvents='auto';
          overlay.classList.remove('hidden');
          overlay.onclick=()=>{
            v.play().then(()=>{overlay.classList.add('hidden');overlay.style.pointerEvents='none';}).catch(()=>{});
          };
        });
      } else {
        overlay.classList.add('hidden');
      }
    };

    v.controls=false;
    v.disablePictureInPicture=true;
    v.setAttribute('controlsList','nodownload noplaybackrate nofullscreen');
    v.addEventListener('contextmenu',e=>e.preventDefault());
    v.addEventListener('timeupdate',()=>{ if(v.currentTime>maxTime) maxTime=v.currentTime; });
    v.addEventListener('seeking',()=>{
      if(!finished && v.currentTime>maxTime+0.35){
        v.currentTime=maxTime;
      }
    });
    v.addEventListener('pause',()=>{
      if(!finished && v.currentTime < (v.duration || Infinity)-0.3){
        setTimeout(()=>{ if(v.paused && !finished) v.play().catch(()=>{}); },120);
      }
    });
    v.addEventListener('ended',()=>{
      finished=true;
      track('vsl_complete');
      overlay.classList.add('hidden');
      offerBtn.classList.remove('hidden');
      offerBtn.scrollIntoView({behavior:'smooth',block:'center'});
    });

    offerBtn.onclick=openOffer;
    startPlayback();
  }

  const bonuses=[
    ['50 Prompts Essenciais para o Dia a Dia','Ajuda pronta para situações reais da rotina.',27],
    ['50 Prompts para Criar Novas Fontes de Renda com IA','Ideias e comandos para explorar novas possibilidades.',37],
    ['30 Prompts para Organizar a Casa','Planeje e simplifique a rotina doméstica.',27],
    ['20 Prompts para Planejar Refeições','Menos tempo pensando no que cozinhar.',19],
    ['101 Ideias de Conteúdo que Atraem Clientes com IA','Pare de travar na hora de criar conteúdo.',47],
    ['100 Projetos para Criar no Canva com Inteligência Artificial','Transforme ideias em projetos visuais.',37],
    ['Planner da Mulher Empreendedora','Prioridades e projetos organizados em um só lugar.',27],
    ['Dicionário do Recomeço Inteligente','Entenda termos novos sem se sentir perdida.',17],
    ['Desafio Guiado — 7 Dias de Recomeço com IA','Uma aplicação simples por dia para transformar entendimento em pequenas vitórias.',47]
  ];
  function renderOffer(){
    app.innerHTML=shell(`<div class="offer-head fade-in"><div class="eyebrow">SEU RECOMEÇO COMEÇA AQUI</div><h1>Você não precisa dar conta de tudo sozinha.</h1><p>O Recomeço Inteligente foi criado para te ajudar a sair do caos, ganhar clareza e reorganizar sua rotina com mais leveza, direção e apoio prático.</p></div>
      <section class="card product-card"><h2>Recomeço Inteligente</h2><p><strong>Um treinamento prático para mulheres que ainda não sabem usar a Inteligência Artificial e nem imaginam o quanto ela pode ajudar a organizar a vida, economizar tempo e aliviar o peso da rotina — mesmo começando do zero e sabendo pouco ou quase nada sobre tecnologia.</strong></p><p>Você aprende, de forma simples e guiada, como usar a IA no dia a dia com <strong>prompts prontos</strong> que mostram exatamente o que pedir para receber ajuda em situações reais da sua rotina.</p><p>Em vez de ficar olhando para uma tela sem saber o que escrever, você terá comandos prontos para adaptar e usar para organizar sua semana, colocar tarefas em ordem, planejar refeições, cuidar da casa, organizar o financeiro, criar projetos, escrever, planejar e resolver pequenas coisas que hoje consomem seu tempo e sua energia.</p><p>Além do treinamento, você recebe <strong>planners, checklists, guias, modelos e bibliotecas de prompts</strong> para não precisar começar do zero sempre que surgir uma nova necessidade.</p><div class="product-impact">Você não precisa saber tudo sobre Inteligência Artificial. Precisa apenas aprender como pedir a ajuda certa.</div><span class="pill">Acesso por 12 meses</span></section>
      <section class="bonus-list-wrap"><h2 style="text-align:center;margin-bottom:22px">Seus 9 bônus</h2><div class="bonus-list">${bonuses.map((b,i)=>`<article class="card bonus-row"><div class="bonus-left"><div class="bonus-num">${i+1}</div><div class="bonus-copy"><h3>${b[0]}</h3><p>${b[1]}</p></div></div><div class="bonus-value">R$ ${b[2]}</div></article>`).join('')}</div></section>
      <div class="bonus-total"><span class="eyebrow">SÓ EM BÔNUS</span><strong>R$285 em bônus</strong><span>E você recebe todos eles junto com o Recomeço Inteligente.</span></div>
      <section class="card price-card"><div class="eyebrow">OFERTA DE LANÇAMENTO</div><h2>Comece seu Recomeço hoje</h2><div class="was">De ${fmt(REFERENCE_PRICE)}</div><div class="price">${fmt(LAUNCH_PRICE)}</div><div class="daily">pagamento único • cerca de R$2,23 por dia ao longo de 30 dias</div><div class="pizza"><strong>Menos do que muita gente gasta em uma pizza.</strong><span>A pizza acaba naquela noite. As ferramentas do Recomeço continuam com você para usar de novo sempre que a rotina apertar.</span></div><p><strong>Você leva o Recomeço Inteligente + R$285 em bônus por apenas R$67.</strong></p><button class="btn" id="checkoutBtn">QUERO COMEÇAR MEU RECOMEÇO</button><div class="guarantee"><div class="guarantee-icon">✓</div><div><strong>7 dias de garantia</strong><p>Entre, conheça os materiais e veja se fazem sentido para você. Dentro do prazo da garantia, você pode solicitar reembolso conforme as condições da plataforma.</p></div></div></section>`,{offer:true});
    document.getElementById('checkoutBtn').onclick=()=>{track('checkout_click');location.href=checkoutUrl();};
    state.offerEnteredAt=Date.now();
    setupExitIntent();
  }

  function setupExitIntent(){
    if(sessionStorage.getItem('ri-exit-seen')) return;

    const MIN_OFFER_TIME=25000;
    let lastY=window.innerHeight;
    let fired=false;

    const eligible=()=>{
      if(fired || state.phase!=='offer' || sessionStorage.getItem('ri-exit-seen')) return false;
      return Date.now() - state.offerEnteredAt >= MIN_OFFER_TIME;
    };

    const cleanup=()=>{
      document.removeEventListener('mousemove',onMove,true);
      document.removeEventListener('mouseout',onOut,true);
      document.removeEventListener('mouseleave',onLeave,true);
    };

    const show=()=>{
      if(!eligible()) return;
      fired=true;
      sessionStorage.setItem('ri-exit-seen','1');
      cleanup();
      showCoupon();
    };

    // Gatilho principal: detecta o cursor subindo em direção às abas / botão de fechar
    // antes mesmo de ele sair totalmente da página. Isso é mais confiável no Chrome/Safari.
    const onMove=e=>{
      const y=e.clientY;
      const movingUp=y<lastY;
      if(eligible() && movingUp && y>=0 && y<=14) show();
      lastY=y;
    };

    // Fallback: quando o cursor realmente deixa a área do documento pelo topo.
    const onOut=e=>{
      if(!eligible()) return;
      const leftDocument=!e.relatedTarget && !e.toElement;
      if(leftDocument && e.clientY<=30) show();
    };

    const onLeave=e=>{
      if(eligible() && e.clientY<=30) show();
    };

    document.addEventListener('mousemove',onMove,true);
    document.addEventListener('mouseout',onOut,true);
    document.addEventListener('mouseleave',onLeave,true);

    // Mantém um gatilho manual apenas para diagnóstico, sem aparecer para a visitante.
    window.__exitPop=show;
  }
  window.addEventListener('popstate',()=>{
    const elapsed=Date.now()-(state.offerEnteredAt||Date.now());
    if(state.phase==='offer' && !sessionStorage.getItem('ri-exit-seen') && elapsed>=25000){
      sessionStorage.setItem('ri-exit-seen','1');
      history.pushState({offer:true},'',location.href);
      showCoupon(true);
    }
  });
  function showCoupon(fromBack=false){
    track('exit_coupon_view');
    const d=document.createElement('div');d.className='modal-backdrop';d.innerHTML=`<section class="modal"><button class="modal-close" aria-label="Fechar">×</button><div class="eyebrow">ANTES DE IR…</div><h2>Quero deixar seu primeiro passo ainda mais leve.</h2><p>Use o cupom de lançamento e receba ${COUPON_DISCOUNT}% de desconto no checkout.</p><span class="discount">${COUPON_DISCOUNT}% OFF</span><div class="coupon">${COUPON}</div><p><strong>De ${fmt(LAUNCH_PRICE)} por ${fmt(COUPON_PRICE)} com o cupom.</strong></p><button class="btn" id="copyCoupon">COPIAR CUPOM E IR PARA O CHECKOUT</button><button class="leave">Não, obrigada. Quero sair.</button></section>`;
    document.body.appendChild(d);
    const close=()=>{track('exit_coupon_decline');d.remove();if(fromBack)history.back();};
    d.querySelector('.modal-close').onclick=close;d.querySelector('.leave').onclick=close;
    d.querySelector('#copyCoupon').onclick=async()=>{try{await navigator.clipboard.writeText(COUPON);}catch{}track('exit_coupon_accept');d.querySelector('#copyCoupon').textContent='CUPOM COPIADO ✓';setTimeout(()=>location.href=checkoutUrl(),600);};
  }

  render();
})();
