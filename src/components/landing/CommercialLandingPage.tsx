
import React from 'react';
import { ArrowRight, Cpu } from 'lucide-react';

interface CommercialLandingPageProps {
  onNavigate: (view: string) => void;
  onOpenLeadModal: () => void;
}

export const CommercialLandingPage: React.FC<
  CommercialLandingPageProps
> = ({ onNavigate, onOpenLeadModal }) => {
  return (
        <div className="min-h-screen bg-[#080D17] text-[#F5F8FF]">
      <main>

      {/* HERO COMERCIAL TOKVANT */}
      <section className="relative overflow-hidden border-b border-[#2B3E5D] bg-[#0A1220] py-20 md:py-28">

        {/* Iluminación decorativa */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 top-0 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">

          <div className="max-w-4xl">

            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#6CE1E8]">
              Consultoría + infraestructura de tokenización
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-7xl">
              Del activo real a una{' '}
              <span className="text-[#B2D4FF]">
                estructura digital clara.
              </span>
            </h1>

            <p className="mt-7 max-w-3xl text-base leading-relaxed text-[#CBDAEF] sm:text-xl">
              Definimos el activo, los derechos y la tecnología.
              También trabajamos a quién va dirigido, por qué lo
              elegiría y cómo llegar a ese público. Acompañamos
              el proyecto desde la estructuración hasta su
              lanzamiento y seguimiento comercial.
            </p>

            {/* Acciones comerciales */}
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">

              <button
                type="button"
                onClick={onOpenLeadModal}
                className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#567EFF] px-6 py-4 font-semibold text-white transition-colors hover:bg-[#4169E1]"
              >
                Evaluar mi proyecto
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('simulator')}
                className="inline-flex items-center justify-center gap-3 rounded-xl border border-[#5073A6] bg-[#17253B] px-6 py-4 font-semibold text-white transition-colors hover:bg-[#203653]"
              >
                <Cpu size={18} />
                Explorar simulador
              </button>

            </div>

            {/* Indicadores */}
            <div className="mt-10 flex flex-wrap gap-3">
              {[
                'Estructuración + estrategia comercial',
                'Estándares EVM',
                'Pruebas en Sepolia',
                'Controles por rol',
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[#45628B] bg-[#17253B] px-4 py-2 text-xs text-[#D1E2FC]"
                >
                  {item}
                </span>
              ))}
            </div>

            <p className="mt-6 text-xs text-[#AABBD4]">
              La demostración no ejecuta transacciones ni implica
              habilitación regulatoria.
            </p>

          </div>
        </div>
      </section>

{/* 2. SOLUCIÓN INTEGRAL */}
<section
  id="solucion"
  className="border-b border-[#21324D] bg-[#0D1625] py-20 md:py-24"
>
  <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">

    <div className="mb-12 max-w-3xl">
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#6CE1E8]">
        Una solución integral
      </span>

      <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
        Tokenizar bien empieza mucho antes del contrato inteligente.
      </h2>

      <p className="mt-5 text-base leading-relaxed text-[#AABBD4] sm:text-lg">
        TOKVANT combina estructura de negocio, definición de derechos,
        tecnología y estrategia de distribución para que cada proyecto
        tenga una lógica verificable y un público al que dirigirse.
      </p>
    </div>

    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

      {[
        {
          icon: '◈',
          title: 'Estructuración',
          description:
            'Definimos activo, participantes, utilidad o derechos, reglas económicas, responsabilidades y operación.',
        },
        {
          icon: '◇',
          title: 'Implementación EVM',
          description:
            'Seleccionamos red, estándar y parámetros contractuales. Probamos escenarios antes de habilitar una emisión.',
        },
        {
          icon: '◎',
          title: 'Distribución y seguimiento',
          description:
            'Definimos público, propuesta de valor, canales y métricas para llevar el proyecto al mercado y aprender de su respuesta.',
        },
      ].map((item) => (
        <article
          key={item.title}
          className="rounded-2xl border border-[#2B3E5D] bg-[#101A2A] p-7 transition-colors hover:border-[#5372A5]"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#203A69] text-2xl text-[#9FEAFF]">
            {item.icon}
          </div>

          <h3 className="mt-5 text-xl font-bold text-white">
            {item.title}
          </h3>

          <p className="mt-3 text-sm leading-relaxed text-[#AABBD4]">
            {item.description}
          </p>
        </article>
      ))}

    </div>
  </div>
</section>

{/* 3. CASOS DE USO */}
<section
  id="casos"
  className="border-b border-[#2B3E5D] bg-[#080D17] py-20 md:py-24"
>
  <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">

    <div className="mb-12 max-w-3xl">
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#6CE1E8]">
        Aplicaciones posibles
      </span>

      <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
        Una arquitectura diferente para cada activo y objetivo.
      </h2>

      <p className="mt-5 text-base leading-relaxed text-[#AABBD4] sm:text-lg">
        El caso de uso define el derecho; el estándar técnico viene después.
      </p>
    </div>

    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

      {[
        {
          number: '01 / Inmobiliario',
          title: 'Derechos sobre proyectos',
          description:
            'Modelos de participación, acceso o servicios ligados a desarrollos, sujetos a estructura contractual y revisión local.',
        },
        {
          number: '02 / Agro',
          title: 'Producción y trazabilidad',
          description:
            'Registro de unidades, derechos o eventos verificables de una cadena productiva.',
        },
        {
          number: '03 / Empresa',
          title: 'Créditos y contratos',
          description:
            'Representación de derechos contractuales con reglas de emisión, tenencia y transferencia.',
        },
        {
          number: '04 / Marca',
          title: 'Beneficios y membresías',
          description:
            'Acceso a experiencias, descuentos o servicios con condiciones transparentes para sus titulares.',
        },
      ].map((item) => (
        <article
          key={item.number}
          className="rounded-2xl border border-[#2B3E5D] bg-[#101A2A] p-6 transition-colors hover:border-[#5372A5]"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-[#6CE1E8]">
            {item.number}
          </span>

          <h3 className="mt-5 text-xl font-bold leading-snug text-white">
            {item.title}
          </h3>

          <p className="mt-4 text-sm leading-relaxed text-[#AABBD4]">
            {item.description}
          </p>
        </article>
      ))}

    </div>

    <p className="mt-6 text-xs leading-relaxed text-[#AABBD4]">
      Los ejemplos muestran posibilidades de diseño. La factibilidad
      depende del activo, el contrato y la jurisdicción.
    </p>

  </div>
</section>

{/* 4. DISTRIBUCIÓN COMERCIAL */}
<section
  id="distribucion"
  className="border-b border-[#21324D] bg-[#0D1625] py-20 md:py-24"
>
  <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 sm:px-6 lg:grid-cols-2 lg:px-8">

    {/* Columna izquierda */}
    <div>
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#6CE1E8]">
        Del token al mercado
      </span>

      <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
        Emitir es un hito. Llegar al cliente es el trabajo comercial.
      </h2>

      <p className="mt-6 text-base leading-relaxed text-[#AABBD4]">
        Una empresa necesita saber quién podría adquirir el token,
        qué valor encuentra en él y qué canales son adecuados
        para presentárselo. Diseñamos esa estrategia junto
        con el emisor y sus equipos comercial, financiero y técnico.
      </p>

      <button
        type="button"
        onClick={onOpenLeadModal}
        className="mt-8 inline-flex items-center justify-center gap-3 rounded-xl bg-[#567EFF] px-6 py-4 font-semibold text-white transition-colors hover:bg-[#4169E1]"
      >
        Diseñar mi estrategia de lanzamiento
        <ArrowRight size={18} />
      </button>
    </div>

    {/* Columna derecha */}
    <div className="rounded-2xl border border-[#39547C] bg-gradient-to-br from-[#14233D] to-[#0D1829] p-6 shadow-2xl sm:p-8">

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#2B3E5D] pb-5">
        <h3 className="text-lg font-bold text-white">
          Plan de distribución
        </h3>

        <span className="rounded-full border border-[#45628B] bg-[#17253B] px-3 py-1.5 text-xs text-[#D1E2FC]">
          Servicio consultivo
        </span>
      </div>

      {[
        ['Comprador o usuario objetivo', 'Perfil y necesidad'],
        ['Propuesta de valor', 'Derechos claros'],
        ['Canales y aliados', 'Plan de acceso'],
        ['Materiales comerciales', 'Mensajes y evidencia'],
        ['Seguimiento', 'Embudo y métricas'],
      ].map(([label, value]) => (
        <div
          key={label}
          className="flex flex-col gap-1 border-b border-[#2B3E5D] py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        >
          <span className="text-sm text-[#C8D8EC]">
            {label}
          </span>
          <strong className="text-sm font-semibold text-white sm:text-right">
            {value}
          </strong>
        </div>
      ))}

      <p className="mt-6 text-xs leading-relaxed text-[#AABBD4]">
        La estrategia comercial requiere un alcance y responsables
        acordados. No garantiza compradores, liquidez ni colocación
        de inversión.
      </p>

    </div>
  </div>
</section>

{/* 5. CÓMO TRABAJAMOS */}
<section
  id="proceso"
  className="border-b border-[#2B3E5D] bg-[#080D17] py-20 md:py-24"
>
  <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 sm:px-6 lg:grid-cols-2 lg:px-8">

    {/* Columna izquierda */}
    <div>
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#6CE1E8]">
        Cómo trabajamos
      </span>

      <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
        De la idea a una emisión con etapas y responsables.
      </h2>

      <p className="mt-6 text-base leading-relaxed text-[#AABBD4]">
        La tecnología ejecuta reglas definidas. El proceso también
        prepara el lanzamiento: público, propuesta, canales y
        seguimiento antes de comunicar la emisión.
      </p>

      <button
        type="button"
        onClick={onOpenLeadModal}
        className="mt-8 inline-flex items-center justify-center gap-3 rounded-xl border border-[#5073A6] bg-[#17253B] px-6 py-4 font-semibold text-white transition-colors hover:bg-[#203653]"
      >
        Empezar con un diagnóstico
        <ArrowRight size={18} />
      </button>
    </div>

    {/* Columna derecha */}
    <div className="rounded-2xl border border-[#39547C] bg-gradient-to-br from-[#14233D] to-[#0D1829] p-6 shadow-2xl sm:p-8">

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#2B3E5D] pb-5">
        <h3 className="text-lg font-bold text-white">
          Ruta de implementación
        </h3>

        <span className="rounded-full border border-[#45628B] bg-[#17253B] px-3 py-1.5 text-xs text-[#D1E2FC]">
          Proceso guiado
        </span>
      </div>

      {[
        {
          number: '1',
          title: 'Diagnóstico',
          description: 'Activo, objetivo, jurisdicción y derechos.',
        },
        {
          number: '2',
          title: 'Diseño',
          description: 'Economía del token, estándares y operación.',
        },
        {
          number: '3',
          title: 'Pruebas',
          description: 'Configuración, simulación y testnet.',
        },
        {
          number: '4',
          title: 'Revisión y emisión',
          description:
            'Aprobaciones humanas y despliegue cuando corresponda.',
        },
        {
          number: '5',
          title: 'Lanzamiento y seguimiento',
          description:
            'Distribución según plan, medición y ajustes comerciales.',
        },
      ].map((step) => (
        <div
          key={step.number}
          className="flex items-start gap-4 border-b border-[#2B3E5D] py-4 last:border-b-0"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#4B73BB] bg-[#1A335D] text-sm font-bold text-[#A5CBFF]">
            {step.number}
          </span>

          <div>
            <h4 className="font-semibold text-white">
              {step.title}
            </h4>
            <p className="mt-1 text-sm leading-relaxed text-[#AABBD4]">
              {step.description}
            </p>
          </div>
        </div>
      ))}

    </div>
  </div>
</section>

{/* 6. TECNOLOGÍA EVM */}
<section
  id="tecnologia"
  className="border-b border-[#21324D] bg-[#0D1625] py-20 md:py-24"
>
  <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">

    <div className="mb-10 max-w-3xl">
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#6CE1E8]">
        Tecnología que responde al proyecto
      </span>

      <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
        Estándares y redes EVM, explicados sin promesas vacías.
      </h2>

      <p className="mt-5 text-base leading-relaxed text-[#AABBD4] sm:text-lg">
        La elección depende de la función del token y de los
        controles necesarios.
      </p>
    </div>

    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {[
        {
          code: 'ERC-20',
          title: 'Unidades fungibles',
          description:
            'Adecuado cuando cada unidad representa lo mismo. Se definen suministro, decimales, permisos, emisión adicional, quema y circulación según el modelo.',
          status: 'Factory documentado en Sepolia',
        },
        {
          code: 'ERC-721',
          title: 'Unidades únicas',
          description:
            'Cada identificador es distinto. Puede servir para certificados o derechos singulares, con metadatos y reglas de emisión específicas.',
          status: 'Flujo de prueba con wallet',
        },
        {
          code: 'ERC-1155',
          title: 'Múltiples tipos de activos',
          description:
            'Permite definir múltiples identificadores, cada uno con su propia cantidad y metadatos. Útil para series o clases diferentes.',
          status: 'Flujo de prueba con wallet',
        },
        {
          code: 'ERC-3643',
          title: 'Transferencias condicionadas',
          description:
            'Combina token, registro de identidad y reglas de elegibilidad. Su configuración no equivale a cumplimiento legal automático.',
          status: 'Laboratorio educativo de pruebas',
        },
      ].map((standard) => (
        <article
          key={standard.code}
          className="rounded-2xl border border-[#2B3E5D] bg-[#101A2A] p-6 transition-colors hover:border-[#5372A5]"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-bold text-white">
              {standard.code}
            </h3>

            <span className="rounded-full border border-[#45628B] bg-[#17253B] px-3 py-1.5 text-xs text-[#D1E2FC]">
              {standard.status}
            </span>
          </div>

          <h4 className="text-lg font-semibold text-[#B2D4FF]">
            {standard.title}
          </h4>

          <p className="mt-3 text-sm leading-relaxed text-[#AABBD4]">
            {standard.description}
          </p>

          <button
            type="button"
            onClick={() => onNavigate('simulator')}
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#8FBAFF] transition-colors hover:text-white"
          >
            Explorar en el simulador
            <ArrowRight size={16} />
          </button>
        </article>
      ))}
    </div>

    <div className="mt-8 rounded-xl border-l-4 border-[#6CE1E8] bg-[#142B3D] p-5">
      <p className="text-sm leading-relaxed text-[#CBE7F3]">
        <strong>Redes contempladas:</strong> Ethereum, Polygon PoS
        y Arbitrum. Sepolia se utiliza para pruebas. La
        disponibilidad de producción y los contratos habilitados
        deben verificarse para cada estándar.
      </p>
    </div>

  </div>
</section>

{/* 7. SIMULADOR EVM */}
<section
  id="demo"
  className="border-b border-[#2B3E5D] bg-[#080D17] py-20 md:py-24"
>
  <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 sm:px-6 lg:grid-cols-2 lg:px-8">

    {/* Información comercial */}
    <div>
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#6CE1E8]">
        Exploración sin transacciones
      </span>

      <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
        Probá un escenario antes de hablar de emisión.
      </h2>

      <p className="mt-6 text-base leading-relaxed text-[#AABBD4]">
        Explorá distintas configuraciones de activos digitales,
        compará estándares EVM y analizá parámetros preliminares
        antes de avanzar con un proyecto de tokenización.
      </p>

      <p className="mt-4 text-sm leading-relaxed text-[#AABBD4]">
        Los resultados son orientativos. No representan una
        cotización definitiva, aprobación regulatoria ni una
        operación real sobre blockchain.
      </p>

      <button
        type="button"
        onClick={() => onNavigate('simulator')}
        className="mt-8 inline-flex items-center justify-center gap-3 rounded-xl bg-[#567EFF] px-6 py-4 font-semibold text-white transition-colors hover:bg-[#4169E1]"
      >
        Explorar simulador EVM
        <ArrowRight size={18} />
      </button>
    </div>

    {/* Vista ilustrativa */}
    <div className="rounded-2xl border border-[#39547C] bg-gradient-to-br from-[#14233D] to-[#0D1829] p-6 shadow-2xl sm:p-8">

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2B3E5D] pb-5">
        <h3 className="text-lg font-bold text-white">
          Exploración de escenarios
        </h3>

        <span className="rounded-full border border-[#45628B] bg-[#17253B] px-3 py-1.5 text-xs text-[#D1E2FC]">
          DEMO
        </span>
      </div>

      {[
        ['Activo y derechos', 'Por definir'],
        ['Estándar EVM', 'Por seleccionar'],
        ['Red blockchain', 'Por comparar'],
        ['Parámetros económicos', 'Por evaluar'],
        ['Revisión humana', 'Pendiente'],
      ].map(([label, value]) => (
        <div
          key={label}
          className="flex flex-col gap-1 border-b border-[#2B3E5D] py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        >
          <span className="text-sm text-[#C8D8EC]">
            {label}
          </span>

          <strong className="text-sm font-semibold text-white sm:text-right">
            {value}
          </strong>
        </div>
      ))}

      <p className="mt-6 text-xs leading-relaxed text-[#AABBD4]">
        Vista ilustrativa. Los datos reales de cada proyecto
        deberán consultarse desde su expediente autorizado.
      </p>
    </div>

  </div>
</section>

{/* 8. ASISTENTES TOKVANT AI */}
<section
  id="asistentes"
  className="border-b border-[#21324D] bg-[#0D1625] py-20 md:py-24"
>
  <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">

    <div className="mb-12 max-w-3xl">
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#6CE1E8]">
        TOKVANT AI · Dos funciones diferentes
      </span>

      <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
        Un asistente enseña. El otro acompaña el proyecto.
      </h2>

      <p className="mt-5 text-base leading-relaxed text-[#AABBD4] sm:text-lg">
        TOKVANT contempla dos asistentes con responsabilidades
        claramente diferenciadas: educación general y apoyo
        contextual para la configuración de activos digitales.
      </p>
    </div>

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

      {/* BOT EDUCATIVO */}
      <article className="rounded-2xl border border-[#2B3E5D] bg-[#101A2A] p-6 sm:p-8">

        <span className="inline-flex rounded-full border border-[#45628B] bg-[#17253B] px-3 py-1.5 text-xs text-[#D1E2FC]">
          Bot Educativo · Público
        </span>

        <h3 className="mt-6 text-2xl font-bold text-white">
          Entender antes de decidir.
        </h3>

        <p className="mt-4 text-sm leading-relaxed text-[#AABBD4]">
          Explicará conceptos de tokenización, estándares,
          wallets, gas, derechos y riesgos mediante una base
          de conocimiento revisada y aprobada por TOKVANT.
        </p>

        <div className="mt-6 rounded-xl border border-[#3B547A] bg-[#091321] p-5">
          <p className="text-xs font-semibold text-[#6CE1E8]">
            Ejemplo de consulta
          </p>

          <p className="mt-3 text-sm text-white">
            ¿Qué significa tokenizar un activo real?
          </p>

          <div className="mt-4 rounded-lg bg-[#20314E] p-4">
            <p className="text-sm leading-relaxed text-[#E5EEFC]">
              Tokenizar consiste en representar digitalmente
              un derecho, utilidad o atributo mediante reglas
              definidas. El token no crea por sí solo propiedad
              legal sobre el activo.
            </p>
          </div>
        </div>

        <p className="mt-5 text-xs text-[#AABBD4]">
          Vista ilustrativa. La conexión con la base educativa
          y el modelo de IA requiere desarrollo adicional.
        </p>
      </article>

      {/* ADVISOR */}
      <article className="rounded-2xl border border-[#2B3E5D] bg-[#101A2A] p-6 sm:p-8">

        <span className="inline-flex rounded-full border border-[#45628B] bg-[#17253B] px-3 py-1.5 text-xs text-[#D1E2FC]">
          Advisor · Empresa autenticada
        </span>

        <h3 className="mt-6 text-2xl font-bold text-white">
          Un copiloto para cada proyecto.
        </h3>

        <p className="mt-4 text-sm leading-relaxed text-[#AABBD4]">
          En su implementación productiva, el Advisor
          analizará únicamente los expedientes autorizados,
          detectará inconsistencias y sugerirá revisiones
          de configuración antes de solicitar aprobaciones.
        </p>

        <div className="mt-6 rounded-xl border border-[#3B547A] bg-[#091321] p-5">
          <p className="text-xs font-semibold text-[#6CE1E8]">
            Ejemplo de revisión
          </p>

          <p className="mt-3 text-sm text-white">
            ¿Qué falta para preparar esta emisión?
          </p>

          <div className="mt-4 rounded-lg bg-[#20314E] p-4">
            <p className="text-sm leading-relaxed text-[#E5EEFC]">
              El suministro inicial supera el máximo
              configurado. Es necesario revisar ambos
              parámetros antes de continuar.
            </p>
          </div>
        </div>

        <p className="mt-5 text-xs leading-relaxed text-[#AABBD4]">
          Ejemplo ilustrativo. El Advisor no tiene facultades
          para aprobar, firmar ni desplegar contratos.
          Su integración con expedientes requiere controles
          de acceso desde el backend.
        </p>
      </article>

    </div>
  </div>
</section>


{/* 9. EQUIPO TOKVANT */}
<section
  id="equipo"
  className="border-b border-[#2B3E5D] bg-[#080D17] py-20 md:py-24"
>
  <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">

    <div className="mb-12 max-w-3xl">
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#6CE1E8]">
        El equipo
      </span>

      <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
        Personas y criterio detrás de cada proyecto.
      </h2>

      <p className="mt-5 text-base leading-relaxed text-[#AABBD4] sm:text-lg">
        Un equipo multidisciplinario que acompaña decisiones
        estratégicas, comerciales y técnicas en proyectos
        de tokenización.
      </p>
    </div>

    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">

      {[
        {
          name: 'Martín Irigoyen',
          role: 'CEO & Founder',
        },
        {
          name: 'Franco Emmanuel Pierucci',
          role: 'CTO & Founder',
        },
        {
          name: 'Mateo Ribodino',
          role: 'CCO & Founder',
        },
        {
          name: 'Pablo Amodio',
          role: 'Blockchain Developer',
        },
      ].map((member, index) => (
        <article
          key={member.name}
          className="overflow-hidden rounded-2xl border border-[#2B3E5D] bg-[#101A2A] p-4 transition-colors hover:border-[#5372A5]"
        >

          {/* Espacio reservado para fotografía real */}
          <div
            className="flex aspect-[4/5] items-center justify-center rounded-xl border border-dashed border-[#7394C5] bg-gradient-to-br from-[#203554] to-[#101D30]"
            role="img"
            aria-label={`Fotografía pendiente de ${member.name}`}
          >
            <div className="text-center">
              <span className="block text-4xl font-bold text-[#A5C3FF]">
                {String(index + 1).padStart(2, '0')}
              </span>

              <span className="mt-3 block text-xs font-semibold uppercase tracking-[0.16em] text-[#C2D6EF]">
                Fotografía pendiente
              </span>
            </div>
          </div>

          <div className="px-2 pb-2 pt-5">
            <h3 className="text-lg font-bold text-white">
              {member.name}
            </h3>

            <p className="mt-2 text-sm text-[#AABBD4]">
              {member.role}
            </p>
          </div>

        </article>
      ))}
    </div>

    <p className="mt-7 text-xs leading-relaxed text-[#AABBD4]">
      Fotografías, cargos y perfiles sujetos a confirmación
      y aprobación por TOKVANT antes de su publicación.
    </p>

  </div>
</section>

{/* 10. PREGUNTAS FRECUENTES */}
<section
  id="preguntas"
  className="border-b border-[#21324D] bg-[#0D1625] py-20 md:py-24"
>
  <div className="mx-auto max-w-5xl px-5 sm:px-6 lg:px-8">

    <div className="mb-12">
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#6CE1E8]">
        Respuestas claras
      </span>

      <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
        Preguntas frecuentes
      </h2>

      <p className="mt-5 text-base leading-relaxed text-[#AABBD4] sm:text-lg">
        Información esencial para comprender las posibilidades
        y los límites de la tokenización.
      </p>
    </div>

    <div className="space-y-3">

      {[
        {
          question:
            '¿TOKVANT consigue automáticamente compradores o inversores?',
          answer:
            'No. Podemos diseñar junto con la empresa una estrategia de distribución, materiales, canales, aliados y métricas, según el alcance contratado. La adquisición depende de la demanda y de las condiciones de cada proyecto. No garantizamos colocación, liquidez ni rentabilidad.',
        },
        {
          question:
            '¿Tokenizar significa que el token es dueño del activo?',
          answer:
            'No necesariamente. Es necesario definir en documentos y procesos qué derecho tiene el titular, cómo lo ejerce y quién responde. La posesión del token no crea por sí misma un derecho legal sobre un inmueble u otro activo.',
        },
        {
          question:
            '¿La tokenización asegura liquidez o rentabilidad?',
          answer:
            'No. La posibilidad de vender depende del diseño, la demanda, las restricciones y las condiciones del mercado. No existe promesa de recompra ni de ganancia por el mero hecho de emitir un token.',
        },
        {
          question:
            '¿Qué cambia entre un simulador y una emisión real?',
          answer:
            'La simulación orienta decisiones sin enviar transacciones. Una emisión real requiere contratos, redes, permisos, aprobaciones, recursos y verificaciones adicionales.',
        },
        {
          question:
            '¿Puedo elegir cualquier estándar?',
          answer:
            'La elección depende del derecho y de su operación. ERC-20, ERC-721, ERC-1155 y ERC-3643 resuelven necesidades técnicas distintas. Ninguno determina por sí solo la clasificación jurídica del proyecto.',
        },
      ].map((item) => (
        <details
          key={item.question}
          className="group rounded-xl border border-[#304669] bg-[#111D30] px-5 py-4 transition-colors open:border-[#5372A5]"
        >
          <summary className="cursor-pointer text-base font-semibold text-white">
            {item.question}
          </summary>

          <p className="mt-4 border-t border-[#304669] pt-4 text-sm leading-relaxed text-[#AABBD4]">
            {item.answer}
          </p>
        </details>
      ))}

    </div>
  </div>
</section>

{/* 11. CONTACTO COMERCIAL */}
<section
  id="contacto"
  className="bg-[#080D17] py-20 md:py-24"
>
  <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">

    <div className="grid grid-cols-1 items-center gap-10 rounded-3xl border border-[#5479BB] bg-gradient-to-r from-[#1B3B80] to-[#182847] p-8 sm:p-12 lg:grid-cols-2">

      {/* Mensaje comercial */}
      <div>
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#6CE1E8]">
          Primer paso
        </span>

        <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
          Contanos qué querés estructurar.
        </h2>

        <p className="mt-5 text-base leading-relaxed text-[#D1E2FC]">
          Identificamos las decisiones de negocio, tecnología
          y distribución: qué representar, para quién y cómo
          llevarlo al mercado.
        </p>
      </div>

      {/* Acción */}
      <div className="flex flex-col items-start gap-4 lg:items-center">

        <button
          type="button"
          onClick={onOpenLeadModal}
          className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#567EFF] px-7 py-4 font-semibold text-white transition-colors hover:bg-[#4169E1]"
        >
          Solicitar diagnóstico inicial
          <ArrowRight size={18} />
        </button>

        <p className="max-w-sm text-xs leading-relaxed text-[#D1E2FC] lg:text-center">
          La solicitud inicia una consulta comercial.
          No constituye una aprobación de proyecto,
          compromiso de emisión ni asesoramiento de inversión.
        </p>
      </div>

    </div>

  </div>
</section>


      </main>

      {/* 12. FOOTER COMERCIAL */}
      <footer className="border-t border-[#2B3E5D] bg-[#080D17] py-12">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">

          <div className="flex flex-col justify-between gap-8 md:flex-row">

            <div className="max-w-md">
              <h2 className="text-2xl font-extrabold tracking-wider text-white">
                TOKVANT  
              </h2>

              <p className="mt-4 text-sm leading-relaxed text-[#AABBD4]">
                Consultoría, tecnología y estrategia de distribución
                para proyectos de tokenización sobre redes EVM.
              </p>
            </div>

            <div className="flex flex-col gap-3 text-sm">
              <span className="font-semibold text-white">
                Información institucional
              </span>

              <span className="text-[#AABBD4]">
                Términos y condiciones · Pendiente de aprobación
              </span>

              <span className="text-[#AABBD4]">
                Privacidad y datos · Pendiente de aprobación
              </span>

              <button
                type="button"
                onClick={onOpenLeadModal}
                className="self-start text-left font-semibold text-[#8FBAFF] hover:text-white"
              >
                Contactar a TOKVANT
              </button>
            </div>
          </div>

          <div className="mt-10 border-t border-[#2B3E5D] pt-6">
            <p className="text-xs leading-relaxed text-[#AABBD4]">
              © {new Date().getFullYear()} TOKVANT  .
              Contenido comercial sujeto a revisión.
              Las simulaciones no implican autorización
              regulatoria, rentabilidad ni disponibilidad
              automática de emisión en producción.
            </p>
          </div>

        </div>
      </footer>
    </div>
  );
};
