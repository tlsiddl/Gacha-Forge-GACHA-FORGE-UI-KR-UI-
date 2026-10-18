(() => {
  'use strict';
  const TAG='marinara-capability-gacha-forge';
  const ID='__gfKoHomeFix_v1';
  if (typeof window[ID]==='function') window[ID]();
  let stopped=false;
  const mounted=new Map();
  // Whitelist-only translations. Never translate arbitrary AI-generated text.
  // UI-only text. Exact matches avoid touching narrative and generated names.
  const exact=new Map(Object.entries({
    'Battle':'전투','Farm Insight':'통찰 파밍','Insight Shard':'통찰 조각','Insight Prism':'통찰 프리즘','Insight Core':'통찰 코어',
    'Chapter One':'1챕터','Chapter Two':'2챕터','Chapter Three':'3챕터','Next step':'다음 단계',
    'Rank':'랭크','Continue':'계속','Story':'스토리','Event':'이벤트','Achievements':'업적',
    'Formation':'편성','Summon':'소환','Shop':'상점','Inventory':'가방',
    'Character':'캐릭터','Characters':'캐릭터','Message':'메시지','Messages':'메시지',
    'Battle Pass':'배틀 패스','Prologue':'프롤로그','Claim':'받기','Cleared':'완료',
    'Start':'시작','Enter':'입장','Rewards':'보상','Challenge':'도전',
    'Relics':'유물','Materials':'재료','Key Items':'중요 아이템',
    'Vigor':'활력','Vigor Draught':'활력 물약','Vigor Flask':'활력 병','Vigor Decanter':'활력 대형병',
    'Sold in the Shop':'상점에서 판매',
    'Bulwark':'방패','Blade':'검','Focus':'마력 매개체','Tome':'마도서',
    'Mandate':'명령서',
    'Permanent':'상시','Permanent pool':'상시 소환','Featured Banner':'픽업 배너','Featured Weapons':'픽업 무기',
    'Assassin':'암살자','Light':'빛','No rate-up':'확률 증가 없음',
    'Ember Sigil':'불꽃 문장','Tide Sigil':'파도 문장','Gale Sigil':'질풍 문장',
    'Stone Sigil':'대지 문장','Dawn Sigil':'여명 문장','Umbra Sigil':'그림자 문장',
    'Stats':'능력치','The green part of a number is what their gear add on top.':'숫자의 초록색 부분은 장비로 추가된 능력치입니다.',
    'Guaranteed 5★ in 80 · soft pity from 74 · 5★ from the standard pool':'80회 이내 5★ 확정 · 74회부터 확률 증가 · 일반 소환 목록에서 5★ 등장',
    'Gu aranteed':'확정'
  }));
  // 1.0.3: split inventory names and static system copy.
  const inventoryNameParts = new Map(Object.entries({
    Ember:'불꽃',Tide:'파도',Gale:'질풍',Stone:'대지',Dawn:'여명',Umbra:'그림자',Sigil:'문장'
  }));
  const inventoryItemNames = new Set(['Ember Sigil','Tide Sigil','Gale Sigil','Stone Sigil','Dawn Sigil','Umbra Sigil']);
  const shortPhrases = new Map(Object.entries({
    'Sold in the Shop':'상점에서 판매',
    'Bulwark':'방패','Blade':'검','Focus':'마력 매개체','Tome':'마도서',
    'Mandate':'명령서',
    'You hold no relics yet — they drop from the Relic Vault stage in Materials, one piece per run.':'아직 보유한 유물이 없습니다. 재료 모드의 유물 보관소 스테이지에서 한 번에 유물 1개를 획득할 수 있습니다.',
    'character':'캐릭터','weapon':'무기','Edge':'칼날','signature':'전용',
    'one 4★+ guaranteed':'4★ 이상 1개 확정',
    'Guaranteed 5★ in 80 · soft pity from 74 · 5★ from the standard pool':'80회 이내 5★ 확정 · 74회부터 확률 증가 · 상시 소환 목록에서 5★ 획득',
  }));
  const inventoryArea='[data-screen="inventory"],.inv,.inventory,.bag,.tile.item';
  const bannerArea='[data-screen="banner"],.banner,.banners,.bnr,.bn-side,.banner-side';
  const vigorArea='.gf-vm,.gf-vm-panel,[data-vigor-menu-panel]';
  function isPartOfItem(el){
    const card=el.closest('.tile.item,.tile,.item,.inv-item,.bag-item');
    if(!card)return false;
    const label=card.querySelector('.lv,.mn,.nm,.name,.item-name')||card;
    const combined=label.textContent.replace(/\s+/g,' ').trim();
    return [...inventoryItemNames].some(name=>combined===name||combined.startsWith(name+' '));
  }
  const excluded='script,style,svg,input,textarea,option,[contenteditable],[data-gf-ko-controls],[data-gf-ko-content],.ob-book,.ob-personas,.cs-card,.vn-text,.vn-line,.vn-name,.vn-speaker,.ch-msg,.ch-message,.ch-line,.ch-bubble,.ch-name,.rn-name,.rn-title,.unit-name,.description';
  // Restrict to fixed, short UI labels, item catalogue, banner/summon metadata, and help text.
  // English authored by the player, AI story, character names and title art are excluded.
  const safeUI='button,label,.eyebrow,.kicker,.lab,.lbl,.role,.k,.m,.v,.lv,.mn,.st,.ttl,.name,.nm,.small,.caption,.hint,.desc,.tag,.sub,.ft,.foot,.meta,.badge,.head-id,.hm-side,.hm-tile,.hm-cta,.hm-pk,.gf-bar,.tile,.sv-modal,.sv-fight,.st-plate,.ob-help,.gr-root,.gw-root,.detail,.fbody,.fm-body,.bnr,.banner,.banners,.banner-side,.bp-card,[data-screen="inventory"],[data-screen="banner"],[data-screen="shop"],[data-screen="materials"],[data-screen="modes"]';
  const blocked='[data-gf-ko-content],.vn,.ob-book,.cs-card,.ch-card,.ch-msg,.ch-message,.ch-line,.ch-bubble,.rn-title,.rn-name,.unit-name,.p-id .name,.hero-name,.player-name,.user-name,[contenteditable]';
  function translate(s){
    if(exact.has(s))return exact.get(s);
    let m=s.match(/^(\d+)\s+of\s+(\d+)\s+cleared$/i);
    if(m)return `${m[1]} / ${m[2]} 완료`;
    m=s.match(/^(\d+)\s*[x×]\s*(Insight Shard|Insight Prism|Insight Core)$/i);
    if(m)return `${m[1]} × ${exact.get(m[2])}`;
    m=s.match(/^Rank\s+(\d+)$/i);
    if(m)return `랭크 ${m[1]}`;
    m=s.match(/^Chapter\s+(\d+)$/i);
    if(m)return `${m[1]}챕터`;
    m=s.match(/^Guaranteed 5★ in (\d+)\s*·\s*soft pity from (\d+)\s*·\s*5★ from the standard pool$/i);
    if(m)return `${m[1]}회 이내 5★ 확정 · ${m[2]}회부터 확률 증가 · 일반 소환 목록에서 5★ 등장`;
    m=s.match(/^5★\s*from the standard pool$/i);
    if(m)return '일반 소환 목록에서 5★ 등장';
    m=s.match(/^5★\s*guaranteed\s*in\s*(\d+)$/i);
    if(m)return `${m[1]}회 이내 5★ 확정`;
    m=s.match(/^(.+?)\s*·\s*(Assassin|Warrior|Tank|Mage|Support)\s*·\s*(Light|Dark|Fire|Water|Wind|Earth)$/);
    if(m)return `${m[1]} · ${({'Assassin':'암살자','Warrior':'전사','Tank':'탱커','Mage':'마법사','Support':'지원가'})[m[2]]} · ${({'Light':'빛','Dark':'어둠','Fire':'불','Water':'물','Wind':'바람','Earth':'땅'})[m[3]]}`;
    m=s.match(/^([0-9,]+)\s*\/\s*([0-9,]+)\s+Vigor$/i);
    if(m)return `${m[1]} / ${m[2]} 활력`;
    return null;
  }
  function fallback(s,el){
    // Exact inventory category names may be split across <br> and text nodes.
    if(el.closest(inventoryArea)&&isPartOfItem(el)&&inventoryNameParts.has(s))return inventoryNameParts.get(s);
    if(s==='Sold in the Shop' && el.closest(vigorArea))return '상점에서 판매';
    if(shortPhrases.has(s)){
      if(s==='character'||s==='weapon'||s==='Edge'||s==='signature'||s==='one 4★+ guaranteed'){
        if(el.closest(bannerArea))return shortPhrases.get(s);
      } else return shortPhrases.get(s);
    }
    let m=s.match(/^Guaranteed 5★ in (\d+)\s*·\s*soft pity from (\d+)\s*·\s*5★ from the standard pool$/i);
    if(m && el.closest(bannerArea))return `${m[1]}회 이내 5★ 확정 · ${m[2]}회부터 확률 증가 · 상시 소환 목록에서 5★ 획득`;
    m=s.match(/^5★\s*확정까지\s*(character|weapon)$/i);
    if(m && el.closest(bannerArea))return `5★ 확정까지 ${m[1]==='character'?'캐릭터':'무기'}`;
    return null;
  }

  // v1.0.4: targeted translations for static screens, including split text nodes.
  const roleTerms={Assassin:'암살자',Warrior:'전사',Tank:'탱커',Mage:'마법사',Support:'지원가',Water:'물',Fire:'불',Wind:'바람',Earth:'땅',Dark:'어둠',Light:'빛',Edge:'칼날',Core:'핵',Flow:'흐름',Crest:'문장'};
  const sigilTerms={Ember:'불꽃',Tide:'파도',Gale:'질풍',Stone:'대지',Dawn:'여명',Umbra:'그림자'};
  const inventoryNames=new Set(Object.keys(sigilTerms).map(x=>x+' Sigil'));
  const relicEmpty=/You\s+hold\s+no\s+relics\s+yet\s*[—–-]\s*they\s+drop\s+from\s+the\s+Relic\s+Vault\s+stage\s+in\s+Materials\s*,?\s*one\s+piece\s+per\s+run\.?/i;
  const bannerPity=/Guaranteed\s+5[★⭐*]\s+in\s+(\d+)\s*[·•.\-]\s*soft\s+pity\s+from\s+(\d+)\s*[·•.\-]\s*5[★⭐*]\s+from\s+the\s+standard\s+pool/i;
  const safeFixedScopes='[data-screen="inventory"],[data-screen="banner"],[data-screen="formation"],.gf-vm,[data-vigor-menu-panel]';
  function contextual(s,el){
    const key=s;
    const inv=el.closest('[data-screen="inventory"]');
    const banner=el.closest('[data-screen="banner"]');
    const formation=el.closest('[data-screen="formation"]');
    const vigor=el.closest('.gf-vm,[data-vigor-menu-panel]');
    if(inv){
      if(relicEmpty.test(s))return s.replace(relicEmpty,'아직 보유한 유물이 없습니다. 재료의 유물 보관소 스테이지에서 한 번에 1개씩 얻을 수 있습니다.');
      const card=el.closest('.tile.item,.tile,.item,.inv-item,.bag-item');
      if(card){
        const cardName=(card.querySelector('.lv,.mn,.nm,.item-name')?.textContent||card.textContent).replace(/\s+/g,' ').trim();
        const match=[...inventoryNames].find(name=>cardName.includes(name));
        if(match){
          if(s===match)return match.replace(/^(\w+) Sigil$/,(_,t)=>sigilTerms[t]+' 문장');
          if(s===match.split(' ')[0])return sigilTerms[s];
          if(s==='Sigil')return '문장';
          // Split DOM text often puts the full name inside a single two-line text node.
          const rx=new RegExp('\\b'+match.split(' ')[0]+'\\s+Sigil\\b','g');
          if(rx.test(s))return s.replace(rx,sigilTerms[match.split(' ')[0]]+' 문장');
        }
      }
    }
    if(banner){
      if(bannerPity.test(s))return s.replace(bannerPity,(_,n,soft)=>`${n}회 이내 5★ 확정 · ${soft}회부터 확률 증가 · 상시 소환 목록에서 5★ 등장`);
      if(/one\s+4[★⭐*]\+?\s+guaranteed/i.test(s))return s.replace(/one\s+4[★⭐*]\+?\s+guaranteed/ig,'4★ 이상 1개 확정');
      if(/5[★⭐*]\s*확정까지\s*(character|weapon)/i.test(s))return s.replace(/5[★⭐*]\s*확정까지\s*(character|weapon)/ig,(_,type)=>`5★ 확정까지 ${type.toLowerCase()==='weapon'?'무기':'캐릭터'}`);
      if(/\b(?:Edge|Core|Flow|Crest)\b\s*[·•]\s*[^·•]+?'s\s+signature/i.test(s))return s.replace(/\b(Edge|Core|Flow|Crest)\b(\s*[·•]\s*[^·•]+?)'s\s+signature/ig,(_,typ,person)=>`${roleTerms[typ]}${person} 전용 무기`);
      // Only replace role/element terms in the metadata strip, not names or banner story copy.
      if(el.closest('.bnr,.banner,.banners,.bn-side,.banner-side,[data-screen="banner"]')&&s.length<90&&s.includes('·')){
        const pieces=s.split(/(\s*[·•]\s*)/);
        let changed=false;
        const out=pieces.map(piece=>{const tr=roleTerms[piece.trim()];if(tr){changed=true;return piece.replace(piece.trim(),tr)}return piece});
        if(changed)return out.join('');
      }
    }
    if(formation){
      if(/\b(Assassin|Warrior|Tank|Mage|Support)\s*[·•]\s*(Water|Fire|Wind|Earth|Dark|Light)\b/.test(s))return s.replace(/\b(Assassin|Warrior|Tank|Mage|Support)\s*[·•]\s*(Water|Fire|Wind|Earth|Dark|Light)\b/g,(_,role,element)=>`${roleTerms[role]} · ${roleTerms[element]}`);
      if(el.closest('.role,.u-role,.tag,.slot,.unit,.card,.fct-row,.formation,.fm-body')&&roleTerms[s])return roleTerms[s];
      if(/^Team\s+(\d+)\s+([\d,]+)\s*\*?$/.test(s))return s.replace(/^Team\s+(\d+)\s+([\d,]+)(\s*\*?)$/,(_,id,power,tail)=>`팀 ${id} · 전투력 ${power}${tail}`);
    }
    if(vigor&&/Sold\s+in\s+the\s+Shop/i.test(s))return s.replace(/Sold\s+in\s+the\s+Shop/ig,'상점에서 판매');
    return null;
  }

  // v1.0.5: catalogue fragments, pop-up listings, and static copy sometimes live
  // outside data-screen ancestors. Restrict all extra translations to known
  // catalogue/card surfaces or fully verified static strings.
  const matFamilies={
    Ember:'불꽃',Tide:'파도',Gale:'질풍',Stone:'대지',Dawn:'여명',Umbra:'그림자',
    Sigil:'문장',Tenet:'원리',Doctrine:'교본',
    Bulwark:'방패',Warblade:'전투검',Arcana:'비전',Concord:'협동',Shadow:'그림자'
  };
  const itemSuffixes=['Sigil','Tenet','Doctrine'];
  const staticSentence = new Map([
    ['You hold no relics yet — they drop from the Relic Vault stage in Materials, one piece per run.', '아직 보유한 유물이 없습니다. 재료 모드의 유물 보관소에서 한 번에 유물 1개를 획득할 수 있습니다.'],
    ['Sold in the Shop','상점에서 판매'],
    ['Guaranteed 5★ in 80 · soft pity from 74 · 5★ from the standard pool','80회 이내 5★ 확정 · 74회부터 확률 증가 · 상시 소환에서 5★ 등장']
  ]);
  function scopedFix(key, el) {
    if(staticSentence.has(key)) return staticSentence.get(key);
    if(relicEmpty.test(key)) return key.replace(relicEmpty,'아직 보유한 유물이 없습니다. 재료 모드의 유물 보관소에서 한 번에 유물 1개를 획득할 수 있습니다.');
    // The items are frequently broken into separate DOM nodes (or have <br>).
    // Only apply word fragments inside catalogue labels, not user content.
    const catalogue=el.closest('.tile.item, .tile, .inv-item, .bag-item');
    if(catalogue && !el.closest('button,input,textarea,[contenteditable]')) {
      const label=el.closest('.lv,.mn,.nm,.item-name,.st,.item-label') || el;
      const combined=(catalogue.querySelector('.lv,.mn,.nm,.item-name,.item-label')?.textContent||'').replace(/\s+/g,' ').trim();
      const parts=combined.match(/^([A-Za-z]+)\s+(Sigil|Tenet|Doctrine)(?:\s|$)/);
      if(parts && matFamilies[parts[1]]) {
        if(key===parts[1])return matFamilies[parts[1]];
        if(key===parts[2])return matFamilies[parts[2]];
        if(key===parts[1]+' '+parts[2])return matFamilies[parts[1]]+' '+matFamilies[parts[2]];
        if(key.startsWith(parts[1]+' '+parts[2]+' '))return key.replace(parts[1]+' '+parts[2],matFamilies[parts[1]]+' '+matFamilies[parts[2]]);
      }
      // Catalogue rendered as separate text nodes, but the combined label is unavailable.
      // Only touch self-contained item token in the catalogue name area.
      if(el.closest('.lv,.mn,.nm,.item-name,.item-label') && matFamilies[key] && (itemSuffixes.includes(key) || ['Ember','Tide','Gale','Stone','Dawn','Umbra'].includes(key)))return matFamilies[key];
    }
    // Special banners use portals for the drop-list modal: these cards may not
    // be descendants of [data-screen=banner]. Weapon is an immutable type badge.
    if(key==='Weapon' && (el.closest('.sv-modal,.drop-list,.drop-card,.banner-item,.unit-card,.pool-card') || el.matches('.role,.type,.badge,.tag')))return '무기';
    if(el.closest('.sv-modal,.drop-list,.drop-card,.banner-item,.pool-card')) {
      if(['Bulwark','Blade','Focus','Tome','Edge'].includes(key))return ({Edge:'칼날',...matFamilies})[key]||({Blade:'검',Focus:'마력 매개체',Tome:'마도서'})[key];
      if(/^(.+?)\s*[·•]\s*(.+?)'s\s+signature$/i.test(key))return key.replace(/\b(Edge|Core|Flow|Crest|Bulwark|Blade|Focus|Tome)\b/g,v=>({Core:'핵',Flow:'흐름',Crest:'문장',Blade:'검',Focus:'마력 매개체',Tome:'마도서',Edge:'칼날',Bulwark:'방패'})[v]).replace(/([가-힣A-Za-z]+)'s\s+signature/gi,'$1의 전용 무기');
    }
    // Only translate metadata (not unit name) on an actual formation card.
    if(/^(Assassin|Warrior|Tank|Mage|Support)\s*[·•]\s*(Water|Fire|Wind|Earth|Dark|Light)$/.test(key) && el.closest('.fm-body,.formation,.unit,.card,.fct-row,.slot,.gf-root,[data-screen="formation"]')){
      return key.replace(/\b(Assassin|Warrior|Tank|Mage|Support|Water|Fire|Wind|Earth|Dark|Light)\b/g,t=>roleTerms[t]);
    }
    if(/^Team\s+\d+\s+[\d,]+\s*\*?$/.test(key) && el.closest('.fm-body,.formation,.gf-root,[data-screen="formation"]'))return key.replace(/^Team\s+(\d+)\s+([\d,]+)(\s*\*?)$/,(_,n,num,x)=>`팀 ${n} · 전투력 ${num}${x}`);
    if(/^(?:Guaranteed 5[★⭐*] in|one 4[★⭐*]\+? guaranteed)/i.test(key)){
       if(bannerPity.test(key))return key.replace(bannerPity,(_,n,soft)=>`${n}회 이내 5★ 확정 · ${soft}회부터 확률 증가 · 상시 소환에서 5★ 등장`);
       return key.replace(/one\s+4[★⭐*]\+?\s+guaranteed/gi,'4★ 이상 1개 확정');
    }
    return null;
  }
  // v1.0.6: Remaining UI labels and catalogue names observed in screenshots.
  // Translate only exact static system copy or a recognized material catalogue card.
  const remainingExact = new Map(Object.entries({
    'Weapon':'무기', 'Background':'배경',
    'Fight alongside a unit to raise their bond. At ♥2 you can talk.':'캐릭터와 함께 전투하면 친밀도가 상승합니다. ♥2부터 대화할 수 있습니다.',
    "Bond backgrounds are painted as a unit's bond reaches ♥6.":'캐릭터와의 친밀도가 ♥6에 도달하면 유대 배경이 생성됩니다.',
    'You hold no relics yet — they drop from the Relic Vault stage in Materials, one piece per run.':'아직 유물이 없습니다. 재료 모드의 유물 보관소 스테이지에서 1회당 유물 1개를 획득할 수 있습니다.',
    'Sold in the Shop':'상점에서 판매',
    'Gu aranteed':'확정',
  }));
  const materialF = {Ember:'불꽃',Tide:'파도',Gale:'질풍',Stone:'대지',Dawn:'여명',Umbra:'그림자',Bulwark:'방패',Warblade:'전투검',Arcana:'비전',Concord:'협동',Shadow:'그림자'};
  const materialS = {Sigil:'문장',Tenet:'원리',Doctrine:'교본'};
  const weaponType = {Bulwark:'방패',Blade:'검',Focus:'마력 매개체',Tome:'마도서',Edge:'칼날',Core:'핵',Flow:'흐름',Crest:'문장'};
  function finishTranslation(key,el){
    const inCatalogue=!!el.closest('.tile.item,.inv-item,.bag-item');
    const label=el.closest('.lv,.mn,.nm,.item-name,.item-label');
    if(inCatalogue && label){
      // The visual line break can be either a newline in one text node or separate nodes.
      const pattern=/\b(Ember|Tide|Gale|Stone|Dawn|Umbra|Bulwark|Warblade|Arcana|Concord|Shadow)(\s+)(Sigil|Tenet|Doctrine)\b/g;
      if(pattern.test(key))return key.replace(pattern,(_,a,space,b)=>materialF[a]+space+materialS[b]);
      const card=el.closest('.tile.item,.inv-item,.bag-item');
      const full=(card.querySelector('.lv,.mn,.nm,.item-name,.item-label')?.textContent||'').replace(/\s+/g,' ').trim();
      if(/\b(Ember|Tide|Gale|Stone|Dawn|Umbra|Bulwark|Warblade|Arcana|Concord|Shadow)\s+(Sigil|Tenet|Doctrine)\b/.test(full)) {
        if(materialF[key])return materialF[key];
        if(materialS[key])return materialS[key];
      }
    }
    if(remainingExact.has(key))return remainingExact.get(key);
    if(/^Guaranteed\s+5[★⭐*]\s+in\s+\d+\s*[·•]\s*soft\s+pity\s+from\s+\d+\s*[·•]\s*5[★⭐*]\s+from\s+the\s+standard\s+pool\.?$/i.test(key)){
      return key.replace(/^Guaranteed\s+5[★⭐*]\s+in\s+(\d+)\s*[·•]\s*soft\s+pity\s+from\s+(\d+)\s*[·•]\s*5[★⭐*]\s+from\s+the\s+standard\s+pool\.?$/i, (_,n,soft)=>`${n}회 이내 5★ 확정 · ${soft}회부터 확률 증가 · 상시 소환 목록에서 5★ 등장`);
    }
    if(/^(?:칼날|검|방패|마력 매개체|마도서|Edge|Blade|Bulwark|Focus|Tome)\s*[·•]\s*.+?'s\s+signature$/i.test(key)){
      return key.replace(/^(Edge|Blade|Bulwark|Focus|Tome)(?=\s*[·•])/,t=>weaponType[t]).replace(/([가-힣A-Za-z]+)'s\s+signature$/i,'$1의 전용 무기');
    }
    // English item categories in the drop-list cards and assorted fixed weapon labels.
    if(key==='Weapon')return '무기';
    return null;
  }

  // v1.0.7: precise fixed UI copy, guarded against game-generated prose.
  const politeSentences = [
    [/You\s+hold\s+no\s+relics\s+yet\s*[—–-]\s*they\s+drop\s+from\s+the\s+Relic\s+Vault\s+stage\s+in\s+Materials\s*,?\s*one\s+piece\s+per\s+run\.?/gi,'아직 보유한 유물이 없습니다. 재료 모드의 유물 보관소에서 전투 1회당 유물 1개를 획득할 수 있습니다.'],
    [/Guaranteed\s+5[★⭐*]\s+in\s+(\d+)\s*[·•]\s*soft\s+pity\s+from\s+(\d+)\s*[·•]\s*5[★⭐*]\s+from\s+the\s+standard\s+pool/gi,(_whole,n,soft)=>`${n}회 이내 5★ 확정 · ${soft}회부터 획득 확률이 증가합니다 · 상시 소환 목록에서 5★가 등장합니다`],
    [/Fight\s+alongside\s+a\s+unit\s+to\s+raise\s+their\s+bond\.\s*At\s*♥\s*2\s+you\s+can\s+talk\.?/gi,'캐릭터와 함께 전투하면 친밀도가 상승합니다. 친밀도 ♥2부터 대화할 수 있습니다.'],
    [/Bond\s+backgrounds\s+are\s+painted\s+as\s+a\s+unit's\s+bond\s+reaches\s*♥\s*6\.?/gi,'캐릭터의 친밀도가 ♥6에 도달하면 유대 배경이 생성됩니다.']
  ];
  const fixedMore = new Map(Object.entries({
    'Weapon':'무기','Background':'배경','Sold in the Shop':'상점에서 판매',
    'Fight alongside a unit to raise their bond. At ♥2 you can talk.':'캐릭터와 함께 전투하면 친밀도가 상승합니다. 친밀도 ♥2부터 대화할 수 있습니다.',
    'The green part of a number is what their gear add on top.':'초록색으로 표시된 수치는 장비에서 추가된 능력치입니다.'
  }));
  const staticAreas = '.sv-modal,.sv-fight,.bnr,.banner,.banners,.bn-side,.banner-side,[data-screen="banner"],[data-screen="inventory"],.gf-vm,[data-vigor-menu-panel],.ob-modal,.bond,.bg-modal,.drop-card,.drop-list,.catalogue,.tile.item';
  // Handle isolated fragments that the game renders around dynamic counters.
  // Only translate text in known, fixed UI surfaces; leave stories and names alone.
  const fragmentScope = '.pity,.banner-body,.note,.sv-modal,.bond,.bg-modal,.tile.item,.inv-item,.bag-item';
  const fixedFragments = new Map([
    ['Guaranteed 5★ in','5★ 확정까지'],
    ['soft pity from','확률 상승 시작'],
    ['5★ from the standard pool','상시 소환 목록에서 5★가 등장합니다'],
    ['Fight alongside a unit to raise their bond.','캐릭터와 함께 전투하면 친밀도가 상승합니다.'],
    ['At ♥2 you can talk.','친밀도 ♥2부터 대화할 수 있습니다.'],
    ["Bond backgrounds are painted as a unit's bond reaches ♥6.",'캐릭터의 친밀도가 ♥6에 도달하면 유대 배경이 생성됩니다.'],
    ['You hold no relics yet','아직 보유한 유물이 없습니다.'],
  ]);
  // v1.0.10: narrowly scoped fixes, including split preset labels.
  const politeUI = new Map([
    ['Fight alongside a unit to raise their bond. At ♥2 you can talk.','캐릭터와 함께 전투하면 친밀도가 상승합니다. 친밀도가 ♥2에 도달하면 대화할 수 있습니다.'],
    ['You hold no relics yet — they drop from the Relic Vault stage in Materials, one piece per run.','아직 보유한 유물이 없습니다. 재료의 유물 보관소 스테이지에서 전투 1회당 유물 1개를 획득할 수 있습니다.']
  ]);
  const fixedBodyScopes='.grid-empty,.ch-empty,.pity,.bnr,.banner-body';
  function replaceSplitCopy(root){
    // Only these static, informational phrases. Keep all existing child elements/listeners.
    const targets=[
      {selector:'.grid-empty',regex:/You\s+hold\s+no\s+relics\s+yet\s*[—–-]\s*they\s+drop\s+from\s+the\s+Relic\s+Vault\s+stage\s+in\s+Materials\s*,?\s*one\s+piece\s+per\s+run\.?/i, ko:'아직 보유한 유물이 없습니다. 재료의 유물 보관소 스테이지에서 전투 1회당 유물 1개를 획득할 수 있습니다.'},
      {selector:'.ch-empty',regex:/Fight\s+alongside\s+a\s+unit\s+to\s+raise\s+their\s+bond\.\s*At\s*♥\s*2\s+you\s+can\s+talk\.?/i,ko:'캐릭터와 함께 전투하면 친밀도가 상승합니다. 친밀도가 ♥2에 도달하면 대화할 수 있습니다.'},
      {selector:'.pity,.banner-body',regex:/Guaranteed\s+5[★⭐*]\s+in\s+(\d+)\s*[·•]\s*soft\s+pity\s+from\s+(\d+)\s*[·•]\s*5[★⭐*]\s+from\s+the\s+standard\s+pool\.?/i,ko:(m)=>`${m[1]}회 이내 5★ 확정 · ${m[2]}회부터 획득 확률이 증가합니다 · 상시 소환 목록에서 5★가 등장합니다.`}
    ];
    for(const target of targets){
      for(const host of root.querySelectorAll(target.selector)){
        const nodes=[]; const w=document.createTreeWalker(host,NodeFilter.SHOW_TEXT);
        let node;while((node=w.nextNode())){
          if(node.parentElement?.closest('script,style,svg,button,input,textarea,[contenteditable],[data-gf-ko-content]'))continue;
          nodes.push(node);
        }
        if(!nodes.length)continue;
        const combined=nodes.map(n=>n.data).join('');
        const match=combined.match(target.regex);if(!match)continue;
        const start=match.index,end=start+match[0].length;
        const replacement=typeof target.ko==='function'?target.ko(match):target.ko;
        let offset=0,inserted=false;
        for(const n of nodes){
          const from=offset,to=from+n.data.length;offset=to;
          if(to<=start||from>=end)continue;
          const pre=start>from?n.data.slice(0,start-from):'';
          const post=end<to?n.data.slice(end-from):'';
          const next=pre+(inserted?'':replacement)+post;
          inserted=true;
          if(next!==n.data){n.data=next;diagnostic.translated++;}
        }
      }
    }
  }
  function patchPreset(root){
    // This label is UI metadata, not an arbitrary user-created team name.
    // Only exact default 'Team N' inside formation preset chips is affected.
    for(const p of root.querySelectorAll('.fm-body,.formation,[data-screen="formation"],.fm-preset,.fm-presets,.fm-team,.fm-chip')){
      const w=document.createTreeWalker(p,NodeFilter.SHOW_TEXT);let n;
      while((n=w.nextNode())){
        if(!n.parentElement||n.parentElement.closest('input,textarea,[contenteditable],.ch-msg,.vn-text'))continue;
        if(!/^(\s*)Team\s+(\d+)(\s*)$/.test(n.data))continue;
        const near=n.parentElement.closest('button,.chip,.preset,.pill,[data-preset],.fm-preset,.fm-team');
        if(!near)continue;
        n.data=n.data.replace(/\bTeam\s+(\d+)\b/,'팀 $1');diagnostic.translated++;
      }
    }
  }
  function patchTextNode(node){
    const el=node.parentElement;
    if(!el||el.closest('script,style,svg,input,textarea,[contenteditable],[data-gf-ko-controls],[data-gf-ko-content],.vn-text,.vn-line,.ch-msg,.ch-message,.ch-line,.ch-bubble,.ob-book,.cs-card'))return;
    const raw=node.data; if(raw.length>800||!/[A-Za-z]/.test(raw))return;
    const key=raw.replace(/\s+/g,' ').trim();
    let next=fixedMore.get(key)||null;
    if(!next){
      for(const [rx,rep] of politeSentences){rx.lastIndex=0;if(rx.test(raw)){rx.lastIndex=0;next=raw.replace(rx,rep);break;}}
    }else next=raw.replace(raw.trim(),next);
    if(next===null&&el.closest(fragmentScope)){
      if(fixedFragments.has(key))next=raw.replace(raw.trim(),fixedFragments.get(key));
      else if(/^Guaranteed\s+5[★⭐*]\s+in\s*$/i.test(key))next=raw.replace(/Guaranteed\s+5[★⭐*]\s+in/i,'5★ 확정까지');
      else if(/^soft\s+pity\s+from\s*$/i.test(key))next=raw.replace(/soft\s+pity\s+from/i,'확률 상승 시작');
      else if(/^5[★⭐*]\s+from\s+the\s+standard\s+pool\.?$/i.test(key))next=raw.replace(/5[★⭐*]\s+from\s+the\s+standard\s+pool/i,'상시 소환 목록에서 5★가 등장합니다');
    }
    if(next!==null && next!==raw){node.data=next;diagnostic.translated++;return;}
    if(el.closest(staticAreas)&&key==='Weapon'){node.data=raw.replace('Weapon','무기');diagnostic.translated++;}
  }
  // v1.0.11: fix actual formation DOM and partially localized pity line.
  function patchObservedUI(root){
    // Observed: span.nm inside .preset-strip, not inside .fm-body.
    for(const label of root.querySelectorAll('.preset-strip .preset .nm, .preset-strip .nm, .presets .preset .nm')){
      for(const node of label.childNodes){
        if(node.nodeType!==Node.TEXT_NODE)continue;
        // Match only untouched default Team N; do not replace arbitrary names.
        const next=node.data.replace(/^(\s*)Team\s+(\d+)(\s*)$/i,'$1팀 $2$3');
        if(next!==node.data){node.data=next;diagnostic.translated++;}
      }
    }
    // The prefix is already localized by the original extension; translate the English suffix
    // independently of numerals and DOM fragmentation.
    for(const container of root.querySelectorAll('.pity')){
      const w=document.createTreeWalker(container,NodeFilter.SHOW_TEXT);let node;
      while((node=w.nextNode())){
        if(node.parentElement?.closest('style,script,svg,input,textarea,[contenteditable]'))continue;
        let next=node.data;
        next=next.replace(/soft\s+pity\s+from\s*(\d+)/gi,(_,n)=>`${n}회부터 5★ 획득 확률이 증가합니다`);
        next=next.replace(/5[★⭐*]\s+from\s+the\s+standard\s+pool/gi,'상시 소환 목록에서 5★가 등장합니다');
        if(next!==node.data){node.data=next;diagnostic.translated++;}
      }
    }
  }
  // v1.0.12: Combat UI is rendered into separate modals and tooltips; translate
  // conservative fixed system copy there, without rewriting AI-generated skills.
  const combatExact=new Map(Object.entries({
    'Attack':'공격',
    'Burn':'화상',
    'Poison':'중독',
    'Bleed':'출혈',
    'Defend':'방어',
    'Takes 50% less damage…':'다음 턴까지 받는 피해가 50% 감소하고 에너지 30을 얻습니다.',
    'Takes 50% less damage...':'다음 턴까지 받는 피해가 50% 감소하고 에너지 30을 얻습니다.',
    'Move row':'전후열 변경',
    'Swaps front and back. Costs the turn.':'전열과 후열을 변경합니다. 해당 턴을 소모합니다.',
    'Item':'아이템',
    'No combat items yet.':'아직 전투 아이템이 없습니다.',
    'Victory':'승리',
    'Chapter One':'1챕터',
    'ULT':'궁극기',
    'WEAPON':'무기',
    'Assassin · dark':'암살자 · 암속성'
  }));
  const combatScope='[data-screen="combat"],[data-screen="battle"],.combat,.battle,.sv-fight,.sv-modal,.fight,.fight-modal,.battle-modal,.combat-modal,.combat-ui,.combat-hud,.combat-tooltip,.skill-tooltip,.skill-detail,.skill-desc,.ult,.ultimate,.win,.victory,.results,.result,.reward,.battle-result,.unit-detail,.unit-card,.character-detail,.unit-panel';
  // Exact, short system labels can be safely localized anywhere inside GF's shadow root.
  const portableCombatLabels=new Set(['Attack','Defend','Move row','Item','Victory','ULT','WEAPON','No combat items yet.','Takes 50% less damage…','Takes 50% less damage...','Swaps front and back. Costs the turn.']);
  const combatAttrs=['title','aria-label','data-tooltip'];
  // v1.0.13: targeted translations for combat tooltips and enemy detail screens.
  // Keep all numerical values, multipliers and duration tokens unchanged.
  // v1.0.16: status-effect overlays and combat tooltips; v1.0.15: fix tooltips outside old combatScope and text split by formatting.
  // v1.0.14: generic, deterministic skill-mechanics parser.
  // Does not call an AI or rewrite story/narrative; unknown mechanics remain unchanged.
  // Every matched number is captured verbatim and preserved in its output.
  const skillMechanicRules=[
    [/^(?:Hits|Strikes)\s+(one|a|all)\s+(enemy|enemies)\s+for\s+([\d,.]+)%\s+of\s+ATK(?:\s+(before\s+DEF))?\.?$/i, m=>`${m[1].toLowerCase()==='all'?'모든 적':'적 1명'}에게 ${m[4]?'방어력 적용 전 ':''}공격력의 ${m[3]}%에 해당하는 피해를 줍니다.`],
    [/^Deals\s+([\d,.]+)%\s+of\s+ATK\s+(?:as\s+damage\s+)?to\s+(one\s+enemy|an?\s+enemy|all\s+enemies)\.?$/i,m=>`${/all/i.test(m[2])?'모든 적':'적 1명'}에게 공격력의 ${m[1]}%에 해당하는 피해를 줍니다.`],
    [/^Deals\s+([\d,.]+)%\s+of\s+ATK\s+damage\s+to\s+(one\s+enemy|an?\s+enemy|all\s+enemies)\.?$/i,m=>`${/all/i.test(m[2])?'모든 적':'적 1명'}에게 공격력의 ${m[1]}%에 해당하는 피해를 줍니다.`],
    [/^Heals?\s+(an?\s+ally|one\s+ally|all\s+allies|the\s+team)\s+for\s+([\d,.]+)%\s+of\s+ATK\.?$/i,m=>`${/^(?:all\s+allies|the\s+team)$/i.test(m[1])?'아군 전체':'아군 1명'}의 체력을 공격력의 ${m[2]}%만큼 회복합니다.`],
    [/^(?:Grants?|Provides?)\s+(an?\s+ally|one\s+ally|all\s+allies|the\s+team)\s+a\s+shield\s+(?:equal\s+to|for)\s+([\d,.]+)%\s+of\s+(ATK|DEF|HP)\.?$/i,m=>`${/^(?:all\s+allies|the\s+team)$/i.test(m[1])?'아군 전체':'아군 1명'}에게 ${({'ATK':'공격력','DEF':'방어력','HP':'체력'})[m[3].toUpperCase()]}의 ${m[2]}%에 해당하는 보호막을 부여합니다.`],
    [/^(?:Reduces?|Decreases?)\s+(ATK|DEF|SPD|attack|defense|speed)\s+by\s+([\d,.]+)%\s+for\s+(\d+)\s+(?:rounds?|turns?)\.?$/i,m=>`${({ATK:'공격력',DEF:'방어력',SPD:'속도',ATTACK:'공격력',DEFENSE:'방어력',SPEED:'속도'})[m[1].toUpperCase()]}을 ${m[3]}턴 동안 ${m[2]}% 감소시킵니다.`],
    [/^(?:Increases?|Boosts?)\s+(ATK|DEF|SPD|attack|defense|speed)\s+by\s+([\d,.]+)%\s+for\s+(\d+)\s+(?:rounds?|turns?)\.?$/i,m=>`${({ATK:'공격력',DEF:'방어력',SPD:'속도',ATTACK:'공격력',DEFENSE:'방어력',SPEED:'속도'})[m[1].toUpperCase()]}을 ${m[3]}턴 동안 ${m[2]}% 증가시킵니다.`],
    [/^(?:Gains?|Builds?|Restores?)\s+([\d,]+)\s+energy\.?$/i,m=>`에너지 ${m[1]}을 얻습니다.`],
    [/^(?:Costs?|Consumes?)\s+([\d,]+)\s+energy\.?$/i,m=>`에너지 ${m[1]}을 소모합니다.`],
    [/^Deals?\s+([\d,.]+)%\s+of\s+ATK\s+(?:as\s+)?(?:poison|burn|bleed)\s+damage\s+(?:each|per)\s+(?:round|turn)\s+for\s+(\d+)\s+(?:rounds?|turns?)\.?$/i,m=>`${m[2]}턴 동안 매 턴 공격력의 ${m[1]}%에 해당하는 지속 피해를 줍니다.`],
    [/^([\d,.]+)%\s+ATK\s+per\s+(?:round|turn)$/i,m=>`매 턴 공격력의 ${m[1]}%`],
    [/^([\d,.]+)%\s+ATK$/i,m=>`공격력의 ${m[1]}%`],
    [/^([\d,.]+)%\s+DEF$/i,m=>`방어력의 ${m[1]}%`],
    [/^([\d,.]+)%\s+HP$/i,m=>`체력의 ${m[1]}%`],
  ];
  function genericSkillTranslation(input,el){
    // Scope to game combat tooltips and unit ability/detail panes only.
    // This function is called ONLY inside the Gacha Forge shadow root.
    // Do not depend on CSS class names that may vary between tooltip builds.
    if(!el)return null;
    const trimmed=input.replace(/\s+/g,' ').trim();
    if(!/[A-Za-z]/.test(trimmed)||trimmed.length>650)return null;
    // Already-Korean or mixed prose should not be machine-altered.
    if(/[가-힣]/.test(trimmed))return null;
    // Protect values and avoid a partial, invented translation of unsupported effects.
    for(const [pattern,convert] of skillMechanicRules){
      const match=trimmed.match(pattern);
      if(!match)continue;
      const translated=convert(match);
      const nums=v=>[...v.replace(/(?:적|아군) 1명/g,'').matchAll(/\d[\d,.]*/g)].map(x=>x[0]);
      if(JSON.stringify(nums(trimmed))!==JSON.stringify(nums(translated)))return null;
      return translated;
    }
    // Parse multiple full sentences only when each sentence matches a known rule.
    if(!trimmed.includes('. '))return null;
    const parts=trimmed.split(/(?<=\.)\s+(?=[A-Z])/);
    if(parts.length<2||parts.length>5)return null;
    const translated=[];
    for(const part of parts){
      const match=skillMechanicRules.map(([re,convert])=>{const m=part.match(re);return m?convert(m):null}).find(Boolean);
      if(!match)return null;
      translated.push(match);
    }
    const result=translated.join(' ');
    const nums=v=>[...v.replace(/(?:적|아군) 1명/g,'').matchAll(/\d[\d,.]*/g)].map(x=>x[0]);
    return JSON.stringify(nums(trimmed))===JSON.stringify(nums(result))?result:null;
  }
  function combatTranslation(value,el){
    const key=value.replace(/\s+/g,' ').trim();
    if(!key)return null;
    const scoped=!!el.closest(combatScope);
    if(combatExact.has(key) && (scoped||portableCombatLabels.has(key)||key==='Chapter One'))return combatExact.get(key);
    let m;
    // v1.0.16: status-effect overlays and attack tooltip labels.
    // Match complete UI phrases, preserving all original numeric tokens and attribution.
    if((m=key.match(/^(\d+)\s+effects?$/i)))return `${m[1]}개 효과`;
    if((m=key.match(/^(Burn|Poison|Bleed)\s+(\d+(?:\.\d+)?)$/i))){
      const names={burn:'화상',poison:'중독',bleed:'출혈'};
      return `${names[m[1].toLowerCase()]} ${m[2]}`;
    }
    // v1.0.17: the value may be a separate <strong> child:
    // <strong>5</strong> damage per round, past shields.
    // Preserve that number node and translate just its following text.
    if(/^damage\s+per\s+(?:round|turn),?\s+past\s+shields\.?$/i.test(key))
      return '의 피해를 매 라운드 보호막을 무시하고 줍니다.';
    if((m=key.match(/^([\d,.]+)\s+damage\s+per\s+(?:round|turn),?\s+past\s+shields\.?$/i)))
      return `매 라운드 보호막을 무시하고 ${m[1]}의 피해를 줍니다.`;
    if((m=key.match(/^([\d,.]+)\s+damage\s+per\s+(?:round|turn),?\s+past\s+shields$/i)))
      return `매 라운드 보호막을 무시하고 ${m[1]}의 피해를 줍니다`;
    if((m=key.match(/^from\s+(.+?)\s*[·•]\s*(\d+)\s+rounds?\s+left$/i)))
      return `시전자: ${m[1]} · 남은 라운드 ${m[2]}`;
    if((m=key.match(/^(\d+)\s+rounds?\s+left$/i)))return `남은 라운드 ${m[1]}`;
    if((m=key.match(/^([\d,.]+)\s+damage\s+per\s+(?:round|turn),?\s+past\s+shields\s+from\s+(.+?)\s*[·•]\s*(\d+)\s+rounds?\s+left$/i)))
      return `매 라운드 보호막을 무시하고 ${m[1]}의 피해를 줍니다. 시전자: ${m[2]} · 남은 라운드 ${m[3]}`;
    if((m=key.match(/^Vigor\s*\+\s*([\d,]+)$/i)))return `활력 +${m[1]}`;
    if((m=key.match(/^to\s+Commander\s+(\d+)$/i)))return `지휘관 랭크 ${m[1]}까지`;
    if((m=key.match(/^(Assassin|Warrior|Tank|Mage|Support)\s*[·•]\s*(dark|light|fire|water|wind|earth)$/i))){
      const roles={assassin:'암살자',warrior:'전사',tank:'탱커',mage:'마법사',support:'지원가'};
      const elements={dark:'암속성',light:'광속성',fire:'화속성',water:'수속성',wind:'풍속성',earth:'지속성'};
      return `${roles[m[1].toLowerCase()]} · ${elements[m[2].toLowerCase()]}`;
    }
    if(key==='Enemy')return '적';
    if((m=key.match(/^Ultimate\s*[·•]\s*([\d,]+)\s*\/\s*([\d,]+)\s+energy$/i)))return `궁극기 · ${m[1]} / ${m[2]} 에너지`;
    if((m=key.match(/^([\d,.]+%?)\s+ATK\s+per\s+round$/i)))return `매 라운드 공격력의 ${m[1]}`;
    if((m=key.match(/^Weak to\s+(Water|Fire|Wind|Earth|Light|Dark):\s*\1 units hit it\s*[×x]\s*([\d.]+)\s+and take\s*[×x]\s*([\d.]+)\s+from it\.$/i))){
      const t={water:'물',fire:'불',wind:'바람',earth:'땅',light:'빛',dark:'어둠'}[m[1].toLowerCase()];
      return `${t} 속성에 약함: ${t} 속성 아군에게 받는 피해 ${m[2]}배, ${t} 속성 아군에게 주는 피해 ${m[3]}배.`;
    }
    if((m=key.match(/^Strong against\s+(Water|Fire|Wind|Earth|Light|Dark):\s*it hits\s+\1 units\s*[×x]\s*([\d.]+)\.$/i))){
      const t={water:'물',fire:'불',wind:'바람',earth:'땅',light:'빛',dark:'어둠'}[m[1].toLowerCase()];
      return `${t} 속성에 강함: ${t} 속성 적에게 주는 피해 ${m[2]}배.`;
    }
    if((m=key.match(/^Takes\s+([\d.]+)%\s+less\s+damage\s+until\s+this\s+unit['’]s\s+next\s+turn,?\s+and\s+builds\s+([\d,]+)\s+energy\.?$/i)))
      return `이 유닛의 다음 턴까지 받는 피해가 ${m[1]}% 감소하고 에너지 ${m[2]}을 얻습니다.`;
    if(/^Swaps\s+front\s+and\s+back\.\s+Costs\s+the\s+turn\.$/i.test(key))return '전열과 후열을 변경합니다. 해당 턴을 소모합니다.';
    // Fixed combat mechanic phrasing only. Preserve decimals and keywords as data.
    if((m=key.match(/^Hits\s+one\s+enemy\s+for\s+([\d.]+)%\s+of\s+ATK\s+before\s+DEF,?\s+up\s+to\s+([\d.]+)%\s+against\s+a\s+target\s+that\s+is\s+nearly\s+down\.\s+Needs\s+a\s+full\s+energy\s+bar:\s*([\d,]+)\s*\/\s*([\d,]+)\.?$/i)))
      return `방어력 적용 전 공격력의 ${m[1]}%에 해당하는 피해를 적 1명에게 줍니다. 체력이 거의 없는 대상에게는 최대 ${m[2]}%까지 증가합니다. 에너지 완충 필요: ${m[3]} / ${m[4]}.`;
    return genericSkillTranslation(key,el);
  }
  function patchCombatComposite(root){
    // Tooltip text often contains <strong> numerical fragments. Translate the
    // entire small, mechanics-only sentence; never modify story prose.
    const nodes=[...root.querySelectorAll('*')].reverse();
    const inlineTags=new Set(['STRONG','B','EM','I','SPAN','SMALL','MARK','SUP','SUB']);
    for(const el of nodes){
      if(!el.children.length || [...el.children].some(ch=>!inlineTags.has(ch.tagName)))continue;
      if(el.closest('script,style,svg,template,input,textarea,[contenteditable],[data-gf-ko-content],.vn-text,.vn-line,.vn-name,.vn-speaker,.ch-msg,.ch-message,.ch-line,.ch-bubble,.ob-book'))continue;
      const raw=el.textContent||'';
      if(raw.length>650||!/[A-Za-z]/.test(raw))continue;
      // Only replace a complete known mechanics sentence, not arbitrary UI.
      const ko=combatTranslation(raw,el);
      if(!ko || ko===raw.replace(/\s+/g,' ').trim())continue;
      // Preserve unrelated DOM: only inline formatting inside the sentence is replaced.
      el.textContent=ko;
      diagnostic.translated++;
    }
  }
  function patchCombatUI(root){
    patchCombatComposite(root);
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      const el=node.parentElement;
      if(!el||el.closest('script,style,svg,template,input,textarea,[contenteditable],[data-gf-ko-content],.vn-text,.vn-line,.vn-name,.vn-speaker,.ch-msg,.ch-message,.ch-line,.ch-bubble,.ob-book,.cs-card'))continue;
      const raw=node.data;
      if(raw.length>1200||!/[a-z]/i.test(raw))continue;
      const replacement=combatTranslation(raw,el);
      if(replacement&&raw.trim()!==replacement){
        node.data=raw.replace(raw.trim(),replacement);
        diagnostic.translated++;
      }
    }
    for(const el of root.querySelectorAll('[title],[aria-label],[data-tooltip]')){
      if(el.closest('input,textarea,[contenteditable],[data-gf-ko-content]'))continue;
      for(const attr of combatAttrs){
        if(!el.hasAttribute(attr))continue;
        const raw=el.getAttribute(attr);
        const ko=combatTranslation(raw,el);
        if(ko && ko!==raw){el.setAttribute(attr,ko);diagnostic.translated++;}
      }
    }
  }
  function scanRemaining(root){
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;while((node=walker.nextNode()))patchTextNode(node);
  }
  // diagnostic declaration moved below
  const diagnostic={scans:0,translated:0,errors:[],remaining:[],seen:new Map()};
  const probes=[/(?:Hits one enemy|Deals? [\d.]+% of ATK|Heals? an? ally|Grants? a shield|Gains? \d+ energy)/i,/You\s+hold\s+no\s+relics/i,/Guaranteed\s+5/i,/Fight\s+alongside/i,/\bWeapon\b/i,/\bTeam\s+\d+\b/i,/\b(?:Defend|Move row|Victory|WEAPON|ULT)\b/i,/No combat items yet/i,/\bVigor\s*\+\s*\d+/i,/\b(?:Ember|Tide|Gale|Stone|Dawn|Umbra)\s+(?:Sigil|Tenet)\b/i];
  function collectProbe(root){
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;
    while((n=walker.nextNode())){
      const el=n.parentElement;
      if(!el||el.closest('script,style,svg,template,input,textarea,[contenteditable],[data-gf-ko-content],.vn-text,.ch-msg,.ch-message,.ob-book'))continue;
      const v=n.data.replace(/\s+/g,' ').trim();if(!v||v.length>300)continue;
      const preset=/^Team\s+\d+$/.test(v)&&!!el.closest('.fm-body,.formation,[data-screen="formation"],.fm-preset,.fm-team');
      if(!probes.some(rx=>rx.test(v))&&!preset)continue;
      const path=[];for(let p=el;p&&path.length<5;p=p.parentElement)path.push(p.tagName.toLowerCase()+(p.className&&typeof p.className==='string'?'.'+p.className.trim().split(/\s+/).slice(0,3).join('.') :''));
      const item={text:v.slice(0,160),path:path.join(' > ')};
      diagnostic.seen.set(item.text+'|'+item.path,item);
    }
    diagnostic.remaining=[...diagnostic.seen.values()].slice(-100);
  }
  // v1.0.18: Event rewards and short fixed story chrome. Do not change
  // generated story prose, character/world names, or user-authored content.
  const eventFixedLabels=new Map([
    ['Aether','에테르'], ['Funds','자금'], ['Insight Core','통찰 코어'],
    ['Insight Prism','통찰 프리즘'], ['Insight Shard','통찰 조각'],
    ['Relic','유물'], ['Your first 7 days','첫 7일'],
    ['Season · 30 days','시즌 · 30일'], ['Narration','나레이션']
  ]);
  // v1.0.19: event and battle-pass reward item names use separate card markup,
  // not the inventory catalogue classes. Match only complete known item IDs.
  const rewardPrefixes={Ember:'불꽃',Tide:'파도',Gale:'질풍',Stone:'대지',Dawn:'여명',Umbra:'그림자',Bulwark:'방벽',Warblade:'전투검',Arcana:'비전',Concord:'협동',Shadow:'그림자'};
  const rewardKinds={Sigil:'문장',Tenet:'교리',Doctrine:'교본'};
  function rewardItemTranslation(key){
    const m=key.match(/^(Ember|Tide|Gale|Stone|Dawn|Umbra|Bulwark|Warblade|Arcana|Concord|Shadow)\s+(Sigil|Tenet|Doctrine)\s+([IVX]+)$/);
    return m ? `${rewardPrefixes[m[1]]} ${rewardKinds[m[2]]} ${m[3]}` : null;
  }
  function patchEventStoryUI(root){
    const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walk.nextNode())){
      const el=node.parentElement;
      if(!el||el.closest('script,style,svg,template,input,textarea,[contenteditable],[data-gf-ko-content],.vn-text,.vn-line,.vn-name,.vn-speaker,.ch-msg,.ch-message,.ch-line,.ch-bubble,.ob-book,.cs-card'))continue;
      const raw=node.data;
      if(raw.length>220||!/[A-Za-z]/.test(raw))continue;
      const key=raw.trim().replace(/\s+/g,' ');
      let tr=eventFixedLabels.get(key);
      // Exact battle-pass reward names are safe to translate without guessing.
      if(!tr)tr=rewardItemTranslation(key);
      // Known item names need a game UI context, to avoid translating fictional names.
      if(tr&&key!=='Narration'&&!el.closest('.event,.events,.ev,.ev-card,.ev-reward,.reward,.rewards,.item,.tile,.event-card,.event-screen,[data-screen="event"],[data-screen="events"]'))tr=null;
      if(!tr){
        // Countdown formats in the event header. Keep all values unchanged.
        let cd=key.match(/^(\d+)d\s+(\d+)h$/i);
        if(cd)tr=`${cd[1]}일 ${cd[2]}시간`;
        if(!tr&&(cd=key.match(/^Season\s+(\d+)$/i)))tr=`시즌 ${cd[1]}`;
        if(!tr&&(cd=key.match(/^Level\s+(\d+)$/i)))tr=`레벨 ${cd[1]}`;
        let m=key.match(/^Resets in (\d+) days?$/i);
        if(m)tr=`${m[1]}일 후 초기화`;
        m=key.match(/^(\d+)\s*★\s*Relic$/i);
        if(m&&el.closest('.event,.events,.ev,.reward,.rewards,.tile,.event-card,[data-screen="event"]'))tr=`${m[1]}★ 유물`;
        // Translate only the chapter number at the start of a fixed chapter breadcrumb.
        m=key.match(/^Chapter (One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten)(?=\s*[·:])/i);
        if(m&&raw.length<180)tr=key.replace(/^Chapter (One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten)/i,(_,w)=>`${({One:1,Two:2,Three:3,Four:4,Five:5,Six:6,Seven:7,Eight:8,Nine:9,Ten:10})[w[0].toUpperCase()+w.slice(1).toLowerCase()]}챕터`);
      }
      if(tr&&tr!==key){node.data=raw.replace(raw.trim(),tr);diagnostic.translated++;}
    }
  }
  // v1.0.20: Home-unit picker and empty rarity list. Match only static UI,
  // preserving player-defined character names and generated descriptions.
  const homeUnitExact = new Map([
    ['Home unit','홈 캐릭터'],
    ['In use','사용 중'],
    ['No 4-star characters yet. Summon on any banner to find one.','아직 4★ 캐릭터가 없습니다. 소환 배너에서 캐릭터를 획득할 수 있습니다.'],
    ['No 4-star characters yet.','아직 4★ 캐릭터가 없습니다.'],
    ['Summon on any banner to find one.','소환 배너에서 캐릭터를 획득할 수 있습니다.'],
    ['No 5-star characters yet. Summon on any banner to find one.','아직 5★ 캐릭터가 없습니다. 소환 배너에서 캐릭터를 획득할 수 있습니다.'],
    ['No 5-star characters yet.','아직 5★ 캐릭터가 없습니다.'],
  ]);
  const homeRole = {Water:'물',Fire:'불',Wind:'바람',Earth:'땅',Light:'빛',Dark:'어둠'};
  const homeJob = {Assassin:'암살자',Warrior:'전사',Tank:'탱커',Mage:'마법사',Support:'지원가'};
  function patchHomeUnit(root){
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      const el=node.parentElement;
      if(!el||el.closest('script,style,svg,template,input,textarea,[contenteditable],[data-gf-ko-content],.vn-text,.vn-line,.ch-msg,.ch-message,.ob-book,.cs-card'))continue;
      const raw=node.data;
      if(raw.length>300||!/[a-z]/i.test(raw))continue;
      const key=raw.trim().replace(/\s+/g,' ');
      let translated=homeUnitExact.get(key);
      const match=key.match(/^(Water|Fire|Wind|Earth|Light|Dark)\s+(Assassin|Warrior|Tank|Mage|Support)$/i);
      if(!translated&&match) {
        const element=Object.keys(homeRole).find(k=>k.toLowerCase()===match[1].toLowerCase());
        const job=Object.keys(homeJob).find(k=>k.toLowerCase()===match[2].toLowerCase());
        translated=`${homeRole[element]} 속성 · ${homeJob[job]}`;
      }
      if(translated&&translated!==key){node.data=raw.replace(raw.trim(),translated);diagnostic.translated++;}
    }
  }
  function scan(root){
    if(stopped)return;
    diagnostic.scans++;
    try{patchHomeUnit(root);patchCombatUI(root);patchEventStoryUI(root);scanRemaining(root);replaceSplitCopy(root);patchPreset(root);patchObservedUI(root);}catch(e){diagnostic.errors.push(String(e));}
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      const v=node.data;
      if(v.length>500||!/[a-z]/i.test(v))continue;
      const key=v.trim().replace(/\s+/g,' ');
      const el=node.parentElement;
      if(!el||el.closest(excluded)||el.closest(blocked))continue;
      let replacement;
      try{replacement=finishTranslation(key,el)||scopedFix(key,el)||contextual(key,el)||translate(key)||fallback(key,el);}
      catch(e){if(diagnostic.errors.length<12)diagnostic.errors.push({text:key.slice(0,120),error:String(e)});continue;}
      if(!replacement||replacement===key)continue;
      // Fixed strings and tightly scoped item fragments can appear outside previous safeUI.
      if(!el.matches(safeUI)&&!el.closest(safeUI)
        && !el.closest(inventoryArea)&&!el.closest(bannerArea)&&!el.closest(vigorArea)
        && !shortPhrases.has(key)&& !el.closest(safeFixedScopes) && !scopedFix(key,el) && !finishTranslation(key,el))continue;
      node.data=v.replace(v.trim(),replacement); diagnostic.translated++;
    }
  }
  // The diagnostic API is read-only: no server requests and no chat data included.
  window.__gfKoFixDiagnostics={report(){
    const hosts=[...document.querySelectorAll(TAG)];
    diagnostic.remaining=[];
    for(const host of hosts)if(host.shadowRoot)collectProbe(host.shadowRoot);
    return JSON.stringify({hosts:hosts.length,shadowRoots:hosts.filter(h=>!!h.shadowRoot).length,scans:diagnostic.scans,translated:diagnostic.translated,errors:diagnostic.errors,remaining:diagnostic.remaining,note:"remaining은 방문한 화면에서 감지한 영어 후보 목록이며 과거 항목도 유지합니다. 번역 후 남았는지 현재 화면을 확인해 주세요."},null,2);
  }};
  function mount(host){
    if(mounted.has(host)||!host.shadowRoot)return;
    const root=host.shadowRoot;
    let queued=false;
    const observer=new MutationObserver(()=>{
      if(queued||stopped)return;
      queued=true;
      queueMicrotask(()=>{queued=false;if(!stopped)scan(root);});
    });
    observer.observe(root,{subtree:true,childList:true,characterData:true});
    mounted.set(host,observer);
    scan(root);
  }
  function discover(){
    if(stopped)return;
    for(const [host,observer] of mounted)if(!host.isConnected){observer.disconnect();mounted.delete(host);}
    document.querySelectorAll(TAG).forEach(mount);
  }
  const outer=new MutationObserver(discover);
  outer.observe(document.documentElement,{childList:true,subtree:true});
  customElements.whenDefined(TAG).then(discover);
  discover();
  function cleanup(){stopped=true;outer.disconnect();for(const o of mounted.values())o.disconnect();mounted.clear();if(window[ID]===cleanup)delete window[ID];delete window.__gfKoFixDiagnostics;}
  window[ID]=cleanup;
  if(typeof marinara!=='undefined'&&marinara.onCleanup)marinara.onCleanup(cleanup);
})();
