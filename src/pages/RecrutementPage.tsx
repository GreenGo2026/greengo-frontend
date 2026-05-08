// src/pages/RecrutementPage.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";

interface JobOffer { id:string; title:string; department:string; location:string; type:string; emoji:string; description:string; skills:string[]; }
interface Benefit { emoji:string; title:string; desc:string; }

const JOBS: JobOffer[] = [
  { id:"livreur", title:"Livreur Express", department:"Logistique", location:"Sale / Rabat", type:"Temps plein", emoji:"🛵", description:"Rejoignez notre equipe de livraison. Vous assurez la livraison rapide et soignee de nos produits frais dans les meilleurs delais.", skills:["Permis de conduire","Sens du service","Ponctualite","Connaissance de Sale/Rabat"] },
  { id:"stock", title:"Responsable Stock & Qualite", department:"Operations", location:"Sale", type:"Temps plein", emoji:"📦", description:"Gerez notre entrepot : reception des marchandises, controle qualite des produits frais, gestion des stocks et coordination fournisseurs.", skills:["Organisation","Rigueur","Gestion de stock","Produits frais"] },
  { id:"support", title:"Agent Service Client", department:"Support", location:"Teletravail / Sale", type:"Mi-temps ou temps plein", emoji:"💬", description:"Traitez les demandes clients via WhatsApp avec professionnalisme et rapidite. Vous garantissez une experience premium.", skills:["Francais et darija","WhatsApp Business","Empathie","Reactivite"] },
  { id:"dev", title:"Developpeur Full-Stack", department:"Tech", location:"Teletravail", type:"Stage ou CDI", emoji:"💻", description:"Developpez notre plateforme e-commerce (React, FastAPI, MongoDB). Des fonctionnalites a fort impact pour nos clients.", skills:["React / TypeScript","Python / FastAPI","MongoDB","Git"] },
];

const BENEFITS: Benefit[] = [
  { emoji:"🌿", title:"Mission avec du sens", desc:"Contribuez a rendre l alimentation saine accessible a tous les Marocains." },
  { emoji:"🚀", title:"Startup en croissance", desc:"Evoluez dans une entreprise agile ou chaque idee peut devenir realite rapidement." },
  { emoji:"💚", title:"Produits frais offerts", desc:"Beneficiez d une selection hebdomadaire de fruits et legumes frais." },
  { emoji:"📈", title:"Evolution rapide", desc:"Des responsabilites reelles des le premier jour et un plan de carriere clair." },
  { emoji:"🤝", title:"Equipe soudee", desc:"Une ambiance familiale, bienveillante et un management de proximite." },
  { emoji:"🎯", title:"Impact direct", desc:"Vos actions ont un effet immediat sur la satisfaction de nos clients." },
];

function Tag({ label, color }: { label:string; color:"emerald"|"gold"|"neutral" }) {
  const styles = { emerald:{bg:"rgba(46,139,87,0.18)",border:"rgba(46,139,87,0.35)",text:"#4ade80"}, gold:{bg:"rgba(201,169,110,0.15)",border:"rgba(201,169,110,0.3)",text:"#e8c98a"}, neutral:{bg:"rgba(255,255,255,0.08)",border:"rgba(255,255,255,0.15)",text:"rgba(255,255,255,0.6)"} };
  const s = styles[color];
  return <span style={{background:s.bg,border:"1px solid "+s.border,borderRadius:6,padding:"2px 10px",fontSize:11,fontWeight:600,color:s.text}}>{label}</span>;
}

function JobCard({ job }: { job:JobOffer }) {
  const [open, setOpen] = useState(false);
  return (
    <article style={{background:open?"linear-gradient(135deg,rgba(46,139,87,0.12),rgba(255,255,255,0.06))":"rgba(255,255,255,0.04)",border:"1px solid "+(open?"rgba(46,139,87,0.4)":"rgba(201,169,110,0.15)"),borderRadius:16,overflow:"hidden",transition:"all 0.3s ease"}}>
      <button onClick={()=>setOpen(!open)} style={{width:"100%",padding:"20px 24px",display:"flex",alignItems:"center",gap:16,background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
        <span style={{fontSize:36,flexShrink:0}}>{job.emoji}</span>
        <div style={{flex:1}}>
          <h3 style={{fontSize:17,fontWeight:700,color:"#fff",margin:"0 0 6px"}}>{job.title}</h3>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}><Tag label={job.department} color="emerald"/><Tag label={job.location} color="gold"/><Tag label={job.type} color="neutral"/></div>
        </div>
        <span style={{color:open?"#4ade80":"rgba(255,255,255,0.4)",fontSize:18,transform:open?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.3s",flexShrink:0}}>v</span>
      </button>
      {open && (
        <div style={{padding:"0 24px 24px",borderTop:"1px solid rgba(255,255,255,0.08)"}}>
          <p style={{color:"rgba(255,255,255,0.65)",lineHeight:1.7,margin:"16px 0",fontSize:14}}>{job.description}</p>
          <p style={{fontSize:11,fontWeight:700,color:"#C9A96E",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Competences requises</p>
          <ul style={{margin:0,padding:0,listStyle:"none",display:"flex",flexWrap:"wrap",gap:8}}>{job.skills.map(s=><li key={s} style={{background:"rgba(46,139,87,0.15)",border:"1px solid rgba(46,139,87,0.3)",borderRadius:8,padding:"4px 12px",fontSize:12,fontWeight:600,color:"#4ade80"}}>+ {s}</li>)}</ul>
          <a href={"mailto:team@mygreengoo.com?subject=Candidature - "+job.title} style={{display:"inline-flex",alignItems:"center",gap:8,marginTop:20,padding:"10px 24px",background:"linear-gradient(135deg,#2E8B57,#1a5c38)",border:"1px solid rgba(46,139,87,0.5)",borderRadius:10,color:"#fff",fontWeight:700,fontSize:14,textDecoration:"none"}}>Postuler maintenant</a>
        </div>
      )}
    </article>
  );
}

export default function RecrutementPage() {
  const { language } = useLanguage();
  const font = language === "ar" ? "font-arabic" : "font-latin";
  return (
    <div className={font} style={{minHeight:"100vh",background:"linear-gradient(160deg,#031409 0%,#061a12 40%,#0a2318 100%)",fontFamily:"DM Sans,Poppins,sans-serif"}}>
      <main>
        <section aria-label="Rejoindre GreenGo" style={{position:"relative",padding:"80px 24px 64px",textAlign:"center"}}>
          <div style={{position:"relative",maxWidth:720,margin:"0 auto"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(201,169,110,0.12)",border:"1px solid rgba(201,169,110,0.28)",borderRadius:9999,padding:"6px 18px",marginBottom:24}}>
              <span>🇲🇦</span><span style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#e8c98a"}}>Carrieres - GreenGo Market - Sale, Maroc</span>
            </div>
            <h1 style={{fontSize:"clamp(2.2rem,6vw,3.8rem)",fontWeight:900,color:"#fff",lineHeight:1.1,letterSpacing:"-0.03em",margin:"0 0 16px"}}>
              Construisons l avenir<br/>
              <span style={{background:"linear-gradient(90deg,#4ade80,#2E8B57)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>de l epicerie marocaine</span>
            </h1>
            <div style={{height:2,width:120,margin:"20px auto",background:"linear-gradient(90deg,#C9A96E,#2E8B57)"}}/>
            <p style={{fontSize:"clamp(1rem,2vw,1.1rem)",color:"rgba(255,255,255,0.55)",lineHeight:1.75,maxWidth:560,margin:"0 auto",fontWeight:300}}>GreenGo Market est une startup marocaine qui revolutionne la livraison de produits frais. Rejoignez une equipe passionnee et ayez un impact reel des le premier jour.</p>
          </div>
        </section>

        <section aria-label="Avantages" style={{padding:"48px 24px",maxWidth:1100,margin:"0 auto"}}>
          <h2 style={{fontSize:"clamp(1.4rem,3vw,2rem)",fontWeight:800,color:"#C9A96E",textAlign:"center",marginBottom:8}}>Pourquoi rejoindre GreenGo ?</h2>
          <p style={{textAlign:"center",color:"rgba(255,255,255,0.4)",marginBottom:40,fontSize:14}}>Ce que nous offrons a chaque membre de l equipe</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16}}>
            {BENEFITS.map(b=>(
              <div key={b.title} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(201,169,110,0.12)",borderRadius:16,padding:24}}>
                <span style={{fontSize:32,display:"block",marginBottom:12}}>{b.emoji}</span>
                <h3 style={{fontSize:15,fontWeight:700,color:"#fff",margin:"0 0 8px"}}>{b.title}</h3>
                <p style={{fontSize:13,color:"rgba(255,255,255,0.5)",lineHeight:1.6,margin:0}}>{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-label="Offres emploi" style={{padding:"48px 24px",maxWidth:860,margin:"0 auto"}}>
          <h2 style={{fontSize:"clamp(1.4rem,3vw,2rem)",fontWeight:800,color:"#fff",textAlign:"center",marginBottom:8}}>Nos offres d emploi</h2>
          <p style={{textAlign:"center",color:"rgba(255,255,255,0.4)",marginBottom:32,fontSize:14}}>Cliquez sur une offre pour voir les details et postuler</p>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>{JOBS.map(job=><JobCard key={job.id} job={job}/>)}</div>
        </section>

        <section aria-label="Candidature spontanee" style={{padding:"48px 24px 100px",maxWidth:700,margin:"0 auto",textAlign:"center"}}>
          <div style={{background:"linear-gradient(135deg,rgba(255,255,255,0.06),rgba(46,139,87,0.08))",backdropFilter:"blur(20px)",border:"1px solid rgba(201,169,110,0.2)",borderRadius:24,padding:"48px 36px"}}>
            <span style={{fontSize:48,display:"block",marginBottom:16}}>📩</span>
            <h2 style={{fontSize:"1.5rem",fontWeight:800,color:"#fff",margin:"0 0 12px"}}>Vous ne trouvez pas votre poste ?</h2>
            <p style={{color:"rgba(255,255,255,0.5)",lineHeight:1.7,marginBottom:24,fontSize:14}}>Envoyez une candidature spontanee. Nous vous contacterons des qu une opportunite se presente.</p>
            <a href="mailto:team@mygreengoo.com?subject=Candidature spontanee - GreenGo Market" style={{display:"inline-flex",alignItems:"center",gap:8,padding:"14px 32px",background:"linear-gradient(135deg,#2E8B57,#1a5c38)",border:"1px solid rgba(46,139,87,0.5)",borderRadius:12,color:"#fff",fontWeight:700,fontSize:15,textDecoration:"none"}}>team@mygreengoo.com</a>
          </div>
        </section>
      </main>
      <nav aria-label="Fil d ariane" style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",background:"rgba(6,26,18,0.85)",backdropFilter:"blur(12px)",border:"1px solid rgba(201,169,110,0.2)",borderRadius:9999,padding:"8px 20px",display:"flex",alignItems:"center",gap:8,fontSize:12,color:"rgba(255,255,255,0.45)",zIndex:40}}>
        <Link to="/" style={{color:"#4ade80",textDecoration:"none",fontWeight:600}}>GreenGo</Link>
        <span>/</span>
        <span style={{color:"#C9A96E",fontWeight:600}}>Recrutement</span>
      </nav>
    </div>
  );
}
