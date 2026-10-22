const C=CONFIG,$=s=>document.querySelector(s);
const MAP="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(C.plusCode);
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
function reach(text){if(C.whatsapp)return`https://wa.me/${C.whatsapp}?text=${encodeURIComponent(text)}`; if(C.email)return`mailto:${C.email}?subject=${encodeURIComponent("Enquiry: "+C.name)}&body=${encodeURIComponent(text)}`;return C.facebook}

$("#tDir").href=MAP;$("#fb").href=C.facebook;$("#aboutTxt").textContent=C.about;$("#yr").textContent=new Date().getFullYear();
if(C.phone)$("#tPhone").innerHTML=`<a href="tel:${C.phone.replace(/\s/g,"")}">📞 ${C.phone}</a>`;
$("#feat").innerHTML=C.features.map(f=>`<li>${f}</li>`).join("");
$("#bR").innerHTML=`<option>Any room</option>`+C.rooms.map(r=>`<option>${r.name}</option>`).join("");
const pics=["building","cottages","fountain"];
$("#roomGrid").innerHTML=C.rooms.map((r,i)=>`<article class="room rv"><div class="pic ph ${pics[i%3]}" role="img" aria-label="${r.name}"></div><div class="b"><h3>${r.name}</h3><p>${r.desc}</p><div class="tags"><i>Sleeps ${r.sleeps}</i></div><div class="row"><span class="price">Rates on request</span><button class="link" onclick="Agent.ask('Book ${r.name}')">Enquire →</button></div></div></article>`).join("");
$("#dineList").innerHTML=C.dining.map(d=>`<div class="dine"><h3>${d.name}</h3><p>${d.desc}</p></div>`).join("");
$("#evGrid").innerHTML=C.events.map((e,i)=>`<div class="ev rv"><span>${["💍","🏛️","🌿"][i%3]}</span><h3>${e.name}</h3><p>${e.desc}</p></div>`).join("");
$("#leisure").innerHTML=C.leisure.map(l=>`<span>${l}</span>`).join("");
const L=(t,h)=>`<a href="${h}" target="_blank" rel="noopener">${t}</a>`;
$("#cInfo").innerHTML=`<p>📍 ${C.location}</p><p>🧭 Plus code: <b>${C.plusCode}</b> · ${L("Get directions",MAP)}</p>`+
 (C.phone?`<p>📞 ${L(C.phone,"tel:"+C.phone.replace(/\s/g,""))}</p>`:"")+(C.whatsapp?`<p>💬 ${L("Chat on WhatsApp",reach("Hello "+C.name))}</p>`:"")+(C.email?`<p>✉ ${L(C.email,"mailto:"+C.email)}</p>`:"")+`<p>👍 ${L("Follow us on Facebook",C.facebook)}</p>`;
const io=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&(e.target.classList.add("in"),io.unobserve(e.target))),{threshold:.12});
document.querySelectorAll(".rv").forEach(e=>io.observe(e));
const today=new Date().toISOString().slice(0,10);$("#bIn").min=$("#bOut").min=today;
function bookNow(e){e.preventDefault();const i=$("#bIn").value,o=$("#bOut").value;if(o<=i){alert("Check-out must be after check-in.");return false}
 open(reach(`Hello ${C.name}, I'd like to book.\nCheck-in: ${i}\nCheck-out: ${o}\nGuests: ${$("#bG").value}\nRoom: ${$("#bR").value}`),"_blank");return false}
function sendEnq(e){e.preventDefault();open(reach(`Enquiry from ${$("#eN").value} (${$("#eP").value}):\n${$("#eM").value}`),"_blank");return false}

/* ===== Roki Concierge: AI Agent with Tool Calling ===== */
const Agent=(()=>{
  let opened=false;
  const box=$("#agentBox"),msgs=$("#msgs");
  const MENU=["Book a room","Rooms","Dining","Events","Things to do","Location","Contact us"];
  const history=[]; // short conversation memory
  const say=(h,who="b")=>{const d=document.createElement("div");d.className="m "+who;d.innerHTML=h;msgs.append(d);msgs.scrollTop=1e9;return d};
  const chips=a=>{$("#chips").innerHTML=a.map(c=>`<button onclick="Agent.ask(this.textContent)">${c}</button>`).join("")};

  const tools=[{
    type:"function",
    function:{
      name:"book_room",
      description:"Initiates a room booking request. Returns a WhatsApp/Email link for the user.",
      parameters:{
        type:"object",
        properties:{
          check_in:{type:"string",description:"Check-in date (e.g., 12 Dec)"},
          check_out:{type:"string",description:"Check-out date"},
          guests:{type:"integer",description:"Number of guests"},
          room_type:{type:"string",description:"Standard, Deluxe, or Family Suite"}
        },
        required:["check_in","check_out","guests"]
      }
    }
  }];

  // Returns safe HTML
  async function callAI(userMessage){
    if(!C.AI_API_KEY||C.AI_API_KEY==="YOUR_API_KEY_HERE"){
      return esc("Please configure your AI API key in config.js to enable intelligent responses. Meanwhile, here is the menu: "+MENU.join(", "));
    }
    const systemPrompt=`You are Roki, the virtual concierge for ROKI Resort in Kaewa, Masinga, Kenya.
You are helpful, polite, and concise.
Here is the resort information:
Rooms: ${JSON.stringify(C.rooms)}
Dining: ${JSON.stringify(C.dining)}
Events: ${JSON.stringify(C.events)}
Location: ${C.location} (Plus Code: ${C.plusCode})
FAQs: ${JSON.stringify(C.faqs)}

If the user wants to book, use the 'book_room' tool.
If you don't know the answer, tell them to contact the team.`;
    history.push({role:"user",content:userMessage});
    try{
      const response=await fetch(C.AI_BASE_URL,{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${C.AI_API_KEY}`},
        body:JSON.stringify({
          model:C.AI_MODEL,
          messages:[{role:"system",content:systemPrompt},...history.slice(-10)],
          tools:tools,
          tool_choice:"auto"
        })
      });
      const data=await response.json();
      if(!data.choices)throw new Error(data.error?.message||"No response");
      const msg=data.choices[0].message;

      if(msg.tool_calls&&msg.tool_calls.length){
        const tc=msg.tool_calls[0];
        if(tc.function.name==="book_room"){
          const a=JSON.parse(tc.function.arguments);
          const bookingMsg=`Hello ${C.name}, I'd like to book.\nCheck-in: ${a.check_in}\nCheck-out: ${a.check_out}\nGuests: ${a.guests}\nRoom: ${a.room_type||"Any"}`;
          const out=`I can help with that! Please click here to confirm your booking: ${L("Send booking request →",reach(bookingMsg))}`;
          history.push({role:"assistant",content:"I prepared a booking request link for the guest."});
          return out;
        }
      }
      history.push({role:"assistant",content:msg.content||""});
      return esc(msg.content||"Sorry, I didn't catch that. Could you rephrase?");
    }catch(error){
      console.error("AI Error:",error);
      history.pop();
      return "I'm having trouble connecting right now. Please try again or contact us directly.";
    }
  }

  return{
    toggle(){box.hidden=!box.hidden;if(!box.hidden&&!opened){opened=true;say(`Karibu to <b>${C.name}</b> 🌿 I'm Roki. Ask me anything or choose below.`);chips(MENU)}if(!box.hidden)$("#ain").focus()},
    send(e){e.preventDefault();const v=$("#ain").value.trim();if(v){$("#ain").value="";say(esc(v),"u");this.handle(v)}return false},
    ask(q){if(box.hidden)this.toggle();say(esc(q),"u");this.handle(q)},
    async handle(q){
      const typing=say("<i>Typing...</i>");
      const reply=await callAI(q);
      typing.innerHTML=reply;
      msgs.scrollTop=1e9;
      chips(MENU);
    }
  }
})();

/* Light / dark switch */
(function(){const r=document.documentElement,b=$("#theme"),m=document.querySelector('meta[name="theme-color"]');
 const paint=()=>{const d=r.dataset.theme!=="light";b.textContent=d?"☀️":"🌙";b.setAttribute("aria-label",d?"Switch to light mode":"Switch to dark mode");if(m)m.content=d?"#0b1616":"#faf6ef"};
 b.onclick=()=>{r.dataset.theme=r.dataset.theme==="light"?"dark":"light";try{localStorage.setItem("roki-theme",r.dataset.theme)}catch(e){}paint()};paint()})();
