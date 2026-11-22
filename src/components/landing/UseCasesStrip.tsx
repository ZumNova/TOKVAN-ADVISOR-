import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

type UseCase = {
  id: string;
  icon: string;
  category: string;
  title: string;
  idea: string;
  question: string;
  possibleStandard: string;
};

const cases: UseCase[] = [
  { id: 'facturas', icon: '🧾', category: 'Finanzas pyme', title: 'Facturas y cobros', idea: 'Explorar derechos de cobro vinculados con facturas comerciales.', question: '¿Quién debe pagar, cuándo y qué documento respalda ese cobro?', possibleStandard: 'ERC-3643' },
  { id: 'cosecha', icon: '🌾', category: 'Agro', title: 'Productos por lotes', idea: 'Representar distintos lotes de granos, miel o café y sus cantidades.', question: '¿Cómo se identifica y verifica cada lote almacenado?', possibleStandard: 'ERC-1155' },
  { id: 'inmueble', icon: '🏢', category: 'Inmobiliario', title: 'Proyecto inmobiliario', idea: 'Explorar un derecho económico ligado a una obra o a su renta.', question: '¿Qué derecho recibiría el titular y quién respondería por él?', possibleStandard: 'ERC-3643' },
  { id: 'deuda', icon: '📄', category: 'Deuda empresarial', title: 'Financiamiento privado', idea: 'Estudiar una emisión vinculada con obligaciones de pago documentadas.', question: '¿Cuáles serían los pagos, plazos y responsables?', possibleStandard: 'ERC-3643' },
  { id: 'energia', icon: '☀️', category: 'Energía y minería', title: 'Producción y derechos', idea: 'Definir unidades o derechos asociados a una actividad productiva.', question: '¿Qué dato de producción se verifica y qué derecho nace de él?', possibleStandard: 'Por definir' },
  { id: 'ambiental', icon: '🌳', category: 'Ambiental', title: 'Proyectos ambientales', idea: 'Distinguir proyectos o períodos mediante tipos de token.', question: '¿Qué registro verifica el resultado y cómo se evita el doble conteo?', possibleStandard: 'ERC-1155' },
  { id: 'ganaderia', icon: '🐄', category: 'Ganadería', title: 'Lotes de hacienda', idea: 'Seguir lotes durante un ciclo de cría o engorde.', question: '¿Quién controla los animales y qué recibe quien tenga el token?', possibleStandard: 'ERC-1155' },
  { id: 'logistica', icon: '🚚', category: 'Logística', title: 'Vehículos y maquinaria', idea: 'Identificar cada camión o máquina como una unidad singular.', question: '¿Quién es titular del bien y cómo se documenta su uso?', possibleStandard: 'ERC-721' },
  { id: 'creadores', icon: '🎵', category: 'Creadores', title: 'Obras y licencias', idea: 'Explorar una obra, licencia o derecho económico documentado.', question: '¿Qué se licencia y quién administra los cobros?', possibleStandard: 'Por definir' },
  { id: 'tesoreria', icon: '🏛️', category: 'Tesorería', title: 'Instrumentos financieros', idea: 'Estudiar una estructura vinculada con instrumentos de corto plazo.', question: '¿Quién custodia el respaldo y cuáles son las condiciones de salida?', possibleStandard: 'ERC-3643' },
];

export function UseCasesStrip({ onOpenLeadModal, compact = false }: { onOpenLeadModal?: () => void; compact?: boolean }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = cases.find(item => item.id === selectedId);

  return (
    <section id={compact ? 'casos-simulador' : 'casos-de-uso'} aria-labelledby={compact ? 'simulator-use-cases-title' : 'use-cases-title'} className={compact ? 'min-w-0' : 'border-b border-[#2B3E5D] bg-[#0B1423] py-16 sm:py-20'}>
      <div className={compact ? 'min-w-0' : 'mx-auto max-w-7xl px-5 sm:px-6 lg:px-8'}>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6CE1E8]">Ideas para explorar</p>
        <h2 id={compact ? 'simulator-use-cases-title' : 'use-cases-title'} className={compact ? 'mt-2 text-xl font-bold text-white sm:text-2xl' : 'mt-3 max-w-3xl text-3xl font-bold text-white sm:text-4xl'}>¿Y si tu proyecto pudiera empezar por aquí?</h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#B9CCE6] sm:text-base">Tocá una idea para descubrir qué tendrías que definir. Son ejemplos ficticios y orientativos; tu proyecto puede ser diferente.</p>

        <div aria-label="Explorar ejemplos de tokenización" className={`flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 ${compact ? 'mt-5' : 'mt-8'}`}>
          {cases.map(item => (
            <button
              key={item.id}
              type="button"
              aria-pressed={selectedId === item.id}
              onClick={() => setSelectedId(selectedId === item.id ? null : item.id)}
              className={`group flex min-w-32 shrink-0 snap-start flex-col items-center gap-2 rounded-2xl border px-4 py-5 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9AB8FF] sm:min-w-36 ${selectedId === item.id ? 'border-[#D7AD55] bg-[#263044]' : 'border-[#385474] bg-[#14243B] hover:border-[#D7AD55] hover:bg-[#1A2D48]'}`}
            >
              <span aria-hidden="true" className="text-4xl transition-transform group-hover:scale-110">{item.icon}</span>
              <span className="text-xs font-semibold text-white">{item.category}</span>
            </button>
          ))}
        </div>

        {selected && (
          <div role="region" aria-live="polite" aria-label={`Ejemplo: ${selected.title}`} className="mt-4 rounded-2xl border border-[#C79F52] bg-gradient-to-br from-[#172B43] to-[#101A2B] p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-3">
              <span aria-hidden="true" className="text-3xl">{selected.icon}</span>
              <h3 className="text-xl font-bold text-white">{selected.title}</h3>
              <span className="rounded-full border border-[#6884A8] px-3 py-1 text-xs text-[#CADCF3]">Estándar posible: {selected.possibleStandard}</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#D9E6F6]">{selected.idea}</p>
            <p className="mt-3 text-sm text-[#E8C879]"><strong>Para empezar:</strong> {selected.question}</p>
            <p className="mt-3 text-xs text-[#AFC2DC]">El estándar y los derechos se definen al revisar el expediente. Podés contar tu idea aunque todavía no tengas todas las respuestas.</p>
            {!compact && onOpenLeadModal && (
              <button type="button" onClick={onOpenLeadModal} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#567EFF] px-5 py-3 text-sm font-semibold text-white hover:bg-[#4169E1]">
                Contar mi idea <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
