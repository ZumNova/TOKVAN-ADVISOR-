import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

const ideas = [
  { id: 'granos', icon: '🌾', color: 'from-amber-500/25 to-yellow-300/5', label: 'Granos en acopio', summary: 'Una pyme tiene mercadería almacenada y busca financiar su próxima campaña.', start: 'Contá qué producto tenés, dónde está y qué documentos respaldan el stock.' },
  { id: 'insumos', icon: '🧺', color: 'from-orange-500/25 to-amber-300/5', label: 'Insumos productivos', summary: 'Una cooperativa quiere explorar financiamiento sobre insumos identificados.', start: 'Describí el inventario, quién lo custodia y cómo se comprueban las cantidades.' },
  { id: 'facturas', icon: '💵', color: 'from-emerald-500/25 to-green-300/5', label: 'Facturas por cobrar', summary: 'Una proveedora quiere adelantar cobros documentados para sostener su actividad.', start: 'Indicá quién debe pagar, cuándo y qué comprobantes respaldan el derecho.' },
  { id: 'camiones', icon: '🚛', color: 'from-sky-500/25 to-cyan-300/5', label: 'Flota de transporte', summary: 'Varias pymes estudian cómo financiar la renovación de sus vehículos.', start: 'Explicá qué vehículos participan, quién los administra y cómo se generan ingresos.' },
  { id: 'puerto', icon: '⚓', color: 'from-blue-500/25 to-indigo-300/5', label: 'Infraestructura portuaria', summary: 'Un operador evalúa una obra vinculada con la actividad logística regional.', start: 'Describí la obra, quién la ejecutaría y qué ingresos podrían respaldarla.' },
  { id: 'capital', icon: '🪙', color: 'from-yellow-500/25 to-amber-300/5', label: 'Proyecto compartido', summary: 'Varias empresas quieren estudiar juntas una estructura de financiamiento productivo.', start: 'Contá quiénes participarían, qué aportaría cada parte y para qué necesitan fondos.' },
] as const;

export function ParanaIdeasStrip({ onOpenLeadModal }: { onOpenLeadModal: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = ideas.find(idea => idea.id === selectedId);

  return (
    <section aria-labelledby="parana-ideas-title" className="border-b border-[#2B3E5D] bg-[#0D1827] py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E9BF69]">Una idea puede empezar en tu empresa</p>
        <h2 id="parana-ideas-title" className="mt-3 text-2xl font-bold text-white sm:text-3xl">Del campo al corredor productivo</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#B9CCE6]">Inspirado en un estudio sobre el corredor del Paraná. Tocá un icono y explorá una posibilidad para tu pyme. Son escenarios ficticios, abiertos a revisión.</p>

        <div aria-label="Ideas para pymes del corredor productivo" className="mt-7 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4">
          {ideas.map(idea => (
            <button key={idea.id} type="button" aria-pressed={selectedId === idea.id} onClick={() => setSelectedId(selectedId === idea.id ? null : idea.id)}
              className={`group flex min-w-36 shrink-0 snap-start flex-col items-center gap-2 rounded-2xl border bg-gradient-to-br px-4 py-5 text-center transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:min-w-40 ${idea.color} ${selectedId === idea.id ? 'border-[#E9BF69] shadow-[0_0_20px_rgba(233,191,105,0.18)]' : 'border-[#385474] hover:border-[#E9BF69]'}`}>
              <span aria-hidden="true" className="text-4xl transition-transform group-hover:scale-110">{idea.icon}</span>
              <span className="text-xs font-semibold text-white">{idea.label}</span>
            </button>
          ))}
        </div>

        {selected && (
          <div role="region" aria-live="polite" aria-label={`Idea: ${selected.label}`} className="mt-4 rounded-2xl border border-[#B8924D] bg-[#17263A] p-5 sm:p-6">
            <div className="flex items-center gap-3"><span aria-hidden="true" className="text-3xl">{selected.icon}</span><h3 className="text-lg font-bold text-white">{selected.label}</h3></div>
            <p className="mt-3 text-sm leading-relaxed text-[#D9E6F6]">{selected.summary}</p>
            <p className="mt-2 text-sm leading-relaxed text-[#E8C879]"><strong>Para explorarla:</strong> {selected.start}</p>
            <button type="button" onClick={onOpenLeadModal} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#567EFF] px-5 py-3 text-sm font-semibold text-white hover:bg-[#4169E1]">Contar mi idea <ArrowRight size={16}/></button>
          </div>
        )}
      </div>
    </section>
  );
}
