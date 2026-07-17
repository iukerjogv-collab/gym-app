// =============================================================================
// Recruitment Questions Database
// Contains questions and answer keys for Coordinador, Entrenador, Recepción, Limpieza.
// =============================================================================

export type PositionType = "COORDINADOR" | "ENTRENADOR" | "RECEPCION" | "LIMPIEZA";

export interface QuestionOption {
  key: string;
  text: string;
}

export interface Question {
  id: string;
  label: string;
  text: string;
  options: QuestionOption[];
}

export interface AnswerKeyEntry {
  correct: string;
  label: string;
}

// ─── COORDINADOR QUESTIONS (10 Multiple Choice) ──────────────────────────────
export const COORDINADOR_QUESTIONS: Question[] = [
  {
    id: "q1",
    label: "Pregunta 1 — Honestidad",
    text: "En toda carrera profesional surgen imprevistos. ¿Cómo describe su experiencia con los errores?",
    options: [
      { key: "A", text: "Jamás he cometido un error operativo ni he llegado tarde." },
      { key: "B", text: "He cometido errores menores de organización, pero siempre los he asumido, corregido y reportado." },
      { key: "C", text: "Prefiero solucionar los errores rápido por mi cuenta antes de que los jefes se enteren." },
    ],
  },
  {
    id: "q2",
    label: "Pregunta 2 — Supervisión de Estándares",
    text: "¿Cuál es la forma más eficiente de supervisar que el staff de limpieza mantenga los estándares en los baños?",
    options: [
      { key: "A", text: "Programar una junta semanal en mi oficina para revisar sus reportes escritos." },
      { key: "B", text: "Monitorear constantemente las cámaras de seguridad desde mi celular." },
      { key: "C", text: "Realizar de 3 a 5 recorridos físicos aleatorios al día por la sucursal, inspeccionando esquinas y poleas." },
    ],
  },
  {
    id: "q3",
    label: "Pregunta 3 — Sustitución de Personal",
    text: "La recepcionista pide permiso para salir 2 horas antes y propone que el entrenador cubra la caja con el usuario de ella. Ella ya checó entrada.",
    options: [
      { key: "A", text: "Autorizo el apoyo para mantener un buen clima laboral y trabajo en equipo." },
      { key: "B", text: "Le permito irse pero le pido al entrenador que use el usuario de ella para no alterar el sistema." },
      { key: "C", text: "Niego la sustitución informal. Si se retira, debe checar salida y yo cubro la posición o solicito relevo." },
    ],
  },
  {
    id: "q4",
    label: "Pregunta 4 — Faltante de Caja",
    text: "Detectas un faltante de $150 en el corte de caja. La recepcionista promete ponerlo de su bolsa mañana.",
    options: [
      { key: "A", text: "Acepto que lo traiga mañana y no lo reporto para no afectarla por una cantidad tan baja." },
      { key: "B", text: "Pongo los $150 de mi dinero para que la caja cuadre perfectamente en el sistema hoy." },
      { key: "C", text: "Registro el faltante exacto en el sistema, levanto la incidencia firmada y aplico el protocolo de caja." },
    ],
  },
  {
    id: "q5",
    label: "Pregunta 5 — Conflicto con Usuario",
    text: "Un usuario VIP insulta agresivamente a una recepcionista en público porque se le cobró una penalización de reglamento.",
    options: [
      { key: "A", text: "Intervengo y le pido una disculpa al cliente quitándole el cargo para calmar la situación." },
      { key: "B", text: "Dejo que la recepcionista resuelva sola el problema para evaluar su tolerancia a la frustración." },
      { key: "C", text: "Intervengo firmemente, respaldo a mi personal, exijo respeto al cliente y mantengo el cobro bajo reglamento." },
    ],
  },
  {
    id: "q6",
    label: "Pregunta 6 — Mantenimiento Preventivo",
    text: "Una caminadora importante empieza a hacer un ruido extraño de fricción a mediodía en hora pico.",
    options: [
      { key: "A", text: "Espero al corte del fin de semana para anotar el reporte en la bitácora de mantenimiento." },
      { key: "B", text: "Apago y apuesto el letrero de 'Fuera de Servicio' inmediatamente para evitar que se queme el motor, y reporto al técnico." },
      { key: "C", text: "Dejo que siga operando el resto del día para no molestar a los clientes que la están usando." },
    ],
  },
  {
    id: "q7",
    label: "Pregunta 7 — Auditoría de Accesos",
    text: "Descubres que un entrenador metió a entrenar a un amigo suyo 'por la libre' (sin pagar inscripción ni visita).",
    options: [
      { key: "A", text: "Le llamo la atención de manera amistosa y le pido que para la próxima me avise antes." },
      { key: "B", text: "Dejo pasar la situación por ser la primera vez y para evitar enemistades con el staff de instructores." },
      { key: "C", text: "Registro la incidencia, notifico a la subgerencia/dirección y obligo al pago inmediato de la visita o descuento vía nómina." },
    ],
  },
  {
    id: "q8",
    label: "Pregunta 8 — Cierre de Metas",
    text: "La sucursal está a un 10% de cerrar la meta mensual de inscripciones y quedan solo 2 días para acabar el mes.",
    options: [
      { key: "A", text: "Envío un mensaje al grupo de WhatsApp pidiendo que 'le echen ganas' y espero los resultados." },
      { key: "B", text: "Armo un plan relámpago de llamadas de seguimiento con la recepción para rescatar cotizaciones e interesados de la semana." },
      { key: "C", text: "Le comento al dueño que la meta era muy alta y que el mercado ha estado bajo este mes." },
    ],
  },
  {
    id: "q9",
    label: "Pregunta 9 — Liderazgo y Normas",
    text: "El personal de entrenadores está desmotivado porque se implementaron nuevas reglas de orden y guardias en el piso de pesas.",
    options: [
      { key: "A", text: "Flexibilizo las reglas y omito reportar los incumplimientos para ganarme su confianza de nuevo." },
      { key: "B", text: "Les digo que son órdenes del dueño y que si no les gusta, pueden presentar su renuncia." },
      { key: "C", text: "Me reúno con ellos, explico el impacto operativo de mantener el orden y predico con el ejemplo estando en piso." },
    ],
  },
  {
    id: "q10",
    label: "Pregunta 10 — Control de Inventarios",
    text: "Al recibir el turno, notas que el stock físico de bebidas energéticas tiene 3 piezas de más en comparación con el sistema de inventario.",
    options: [
      { key: "A", text: "Me tomo una o permito que el staff se las tome, ya que al estar de más no afectan el dinero de la caja." },
      { key: "B", text: "Modifico el inventario en el sistema agregándolas sin investigar para que todo coincida rápido." },
      { key: "C", text: "Reporto la anomalía, audito los tickets de venta del turno anterior para buscar omisiones de registro y ajusto bajo autorización." },
    ],
  },
];

export const COORDINADOR_KEY: Record<string, AnswerKeyEntry> = {
  q1: { correct: "B", label: "Honestidad" },
  q2: { correct: "C", label: "Supervisión de Estándares" },
  q3: { correct: "C", label: "Sustitución de Personal" },
  q4: { correct: "C", label: "Faltante de Caja" },
  q5: { correct: "C", label: "Conflicto con Usuario" },
  q6: { correct: "B", label: "Mantenimiento Preventivo" },
  q7: { correct: "C", label: "Auditoría de Accesos" },
  q8: { correct: "B", label: "Cierre de Metas" },
  q9: { correct: "C", label: "Liderazgo y Normas" },
  q10: { correct: "C", label: "Control de Inventarios" },
};

// ─── ENTRENADOR QUESTIONS (20 Multiple Choice) ───────────────────────────────
export const ENTRENADOR_QUESTIONS: Question[] = [
  {
    id: "q1",
    label: "Pregunta 1 — Honestidad / Ética",
    text: "Un usuario frecuente (o un amigo cercano) te ofrece un pago mensual en efectivo \"por fuera\" para que lo entrenes de manera exclusiva y personalizada durante tu turno de piso. Te propone que disimulen frente al coordinador, simulando que es un cliente común haciéndote dudas rutinarias para que no llame la atención.",
    options: [
      { key: "A", text: "Acepto el dinero y el trato, pero acordamos tomar distancia o disimular cuando el coordinador ande cerca. Mientras no descuide mis deberes generales con el resto de usuarios en el piso, es un ingreso extra justo y válido." },
      { key: "B", text: "Rechazo el dinero y la propuesta de forma tajante. Le aclaro que durante mi turno de nómina el piso completo es mi absoluta prioridad y que dar asesorías privadas o simular que son usuarios comunes es una falta grave. Le explico que solo podemos hacer entrenamientos personalizados fuera de mi horario laboral, una vez que haya registrado mi salida del gimnasio." },
      { key: "C", text: "Le digo que no puedo aceptar efectivo en el gym, pero acepto entrenarlo con prioridad si me deposita por fuera de manera discreta y acordamos que solo me haga preguntas rápidas para que parezca una asesoría casual permitida." },
    ],
  },
  {
    id: "q2",
    label: "Pregunta 2 — Conflicto y Autoridad",
    text: "Un usuario con 8 años de experiencia te corrige frente a otros clientes diciéndote que tu técnica de peso muerto rumano está mal y que él sabe más porque compite en powerlifting.",
    options: [
      { key: "A", text: "Le doy la razón parcialmente para no generar conflicto público, le digo \"tienes buen punto\" y después ajusto mi indicación cuando no haya gente viendo." },
      { key: "B", text: "Le agradezco su experiencia, pero le explico con fundamento biomecánico por qué mi indicación es correcta para el nivel y objetivo del usuario que estoy atendiendo. Si persiste en interrumpir, le pido amablemente que me permita trabajar y le ofrezco discutirlo en privado después." },
      { key: "C", text: "Lo ignoro completamente y sigo con mi cliente, porque darle atención reforzaría su comportamiento y perdería autoridad." },
    ],
  },
  {
    id: "q3",
    label: "Pregunta 3 — Ética Profesional",
    text: "Una clienta de 25 años te dice que quiere \"verse como las influencers\" en 4 semanas porque tiene un evento. Te pide que le des una dieta estricta y doble sesión diaria.",
    options: [
      { key: "A", text: "Le diseño un plan realista de 8-12 semanas con metas progresivas, le explico con honestidad que 4 semanas no es suficiente para una transformación segura, la refiero con nutriólogo certificado para la parte alimenticia y establezco expectativas reales aunque no sea lo que quiere escuchar." },
      { key: "B", text: "Le doy un plan intensivo de 4 semanas porque si le digo que no se puede, se va a ir a otro gym donde sí se lo prometan. Mejor que entrene conmigo donde al menos la cuido." },
      { key: "C", text: "Le digo que puedo ayudarla pero necesita complementar con suplementos de la tienda del gym para potenciar resultados en ese tiempo." },
    ],
  },
  {
    id: "q4",
    label: "Pregunta 4 — Operación y Flexibilidad",
    text: "La recepcionista tuvo una emergencia y salió. El coordinador te pide cubrir caja 30 minutos. Tienes 3 clientes en piso que pagaron asesoría personalizada esa hora.",
    options: [
      { key: "A", text: "Cubro la caja porque el coordinador me lo pidió y la operación del gym es prioridad. Mis clientes pueden hacer cardio mientras regreso." },
      { key: "B", text: "Le explico al coordinador que tengo clientes con servicio pagado comprometido y no puedo abandonarlos. Le propongo alternativas: que él cubra caja, que otro empleado apoye, o que cierre temporalmente con letrero. Si no hay opción, redistribuyo mis clientes, les aviso y cubro caja el mínimo tiempo posible." },
      { key: "C", text: "Cubro la caja pero le mando mensaje a mis clientes para que hagan ejercicios por su cuenta con el video que les voy a mandar al WhatsApp mientras estoy en recepción." },
    ],
  },
  {
    id: "q5",
    label: "Pregunta 5 — Presión Social e Integridad",
    text: "Un sábado llega el \"sobrino del dueño\" (un joven que dice conocer al propietario) y te pide que lo dejes entrenar sin pagar visita porque \"ya habló con el tío\". No hay coordinador ni recepcionista — solo estás tú en piso.",
    options: [
      { key: "A", text: "Lo dejo pasar para no crear un conflicto con alguien que podría ser familiar del dueño. Si miento, la consecuencia para mí sería peor que dejarlo entrar." },
      { key: "B", text: "Le pido amablemente que espere, contacto al coordinador o al dueño para confirmar la autorización. Mientras tanto, no le permito acceso al área de entrenamiento. Si no logro confirmar, le ofrezco regresar cuando el coordinador esté presente." },
      { key: "C", text: "Le digo que no puedo dejarlo entrar y punto. Si es verdad que es sobrino del dueño, él entenderá que yo estaba siguiendo las reglas." },
    ],
  },
  {
    id: "q6",
    label: "Pregunta 6 — Foco y Atención",
    text: "Estás entre clientes y aprovechas para revisar tu celular 2 minutos. Un usuario principiante intenta hacer press militar con mala técnica y peso excesivo. No lo ves porque estás en el teléfono. Otro usuario te avisa.",
    options: [
      { key: "A", text: "Guardo el celular inmediatamente, acudo al principiante, corrijo la técnica y le agradezco al usuario que me avisó. A partir de hoy dejo mi celular en el locker durante mi turno de piso porque no debió haber pasado." },
      { key: "B", text: "Voy a ayudar al principiante, le agradezco al otro usuario y pongo más atención, pero conservo mi celular en la bolsa del pantalón porque a veces los clientes me escriben para confirmar horarios." },
      { key: "C", text: "Le agradezco al usuario que me avisó, atiendo al principiante y le pido a mi compañero entrenador que me ayude a monitorear cuando yo esté ocupado para que no se repita." },
    ],
  },
  {
    id: "q7",
    label: "Pregunta 7 — Control y Complicidad",
    text: "Ves que otro entrenador le regala un shake de proteína de la barra de ventas a un cliente \"estrella\" sin registrar la venta. Te dice \"es mi mejor cliente, le invito yo, relájate\".",
    options: [
      { key: "A", text: "No digo nada porque no me consta al 100% y no quiero problemas con mi compañero. Además, él dijo que lo va a pagar después." },
      { key: "B", text: "Le digo a mi compañero que eso es merma no registrada y que si quiere invitar algo a un cliente, debe pagarlo él en caja antes. Si no lo hace, reporto la incidencia al coordinador aunque sea incómodo, porque el inventario descuadrado nos afecta a todos." },
      { key: "C", text: "Le pido a mi compañero que al menos anote el producto en una libreta para que después se descuente, y así quede un registro informal." },
    ],
  },
  {
    id: "q8",
    label: "Pregunta 8 — Seguridad y Progresión",
    text: "Un cliente de 3 meses quiere subir su sentadilla de 70 a 120 kg porque vio un video de TikTok donde un influencer lo hizo. Insiste agresivamente y dice que si no lo dejas, entrena solo.",
    options: [
      { key: "A", text: "Le pongo los 120 kg pero me quedo spotteándolo de cerca. Si algo sale mal, estoy ahí para actuar. Es mejor que lo haga conmigo que solo." },
      { key: "B", text: "Le niego el aumento extremo con explicación biomecánica concreta, le propongo un test progresivo (80→90→100 en semanas) con técnica verificada en video antes de cada aumento. Le documento mi plan por escrito. Si amenaza con hacerlo solo, le advierto que eso viola el reglamento de seguridad y notifico al coordinador." },
      { key: "C", text: "Le digo que no puedo impedirle usar los pesos que quiera porque es su cuerpo y su membresía, pero que yo no me hago responsable y que firme una carta de deslinde." },
    ],
  },
  {
    id: "q9",
    label: "Pregunta 9 — Manejo de Lesiones",
    text: "Un usuario siente un \"tronido\" en el hombro durante press de banca. Dice que no le duele mucho y quiere seguir entrenando tren superior.",
    options: [
      { key: "A", text: "Lo dejo seguir con peso ligero y ejercicios que no involucren el hombro directamente, porque él dice que no le duele y no soy doctor para diagnosticar." },
      { key: "B", text: "Detengo toda actividad de tren superior inmediatamente, registro el incidente con hora y descripción del sonido/sensación, le aplico hielo si hay inflamación, le recomiendo valoración médica antes de retomar cualquier ejercicio de hombro, y le diseño una sesión alternativa de tren inferior solo si se siente cómodo." },
      { key: "C", text: "Le digo que pare todo el entrenamiento del día y se vaya a urgencias porque un tronido podría ser un tendón roto. Es mejor prevenir." },
    ],
  },
  {
    id: "q10",
    label: "Pregunta 10 — Toma de Decisiones y Jerarquía",
    text: "El coordinador te pide que a todos los clientes nuevos del mes les pongas una rutina que incluya la \"zona funcional nueva\" del gym porque quieren justificar la inversión en equipamiento. Pero varios de tus clientes nuevos son adultos mayores con limitaciones de movilidad.",
    options: [
      { key: "A", text: "Incluyo la zona funcional para todos porque es una instrucción del coordinador y él es mi jefe. A los adultos mayores les pongo ejercicios más fáciles ahí." },
      { key: "B", text: "Atiendo la solicitud del coordinador incorporando la zona funcional donde sea técnicamente apropiado, pero para los clientes con limitaciones de movilidad diseño rutinas seguras primero y explico al coordinador por escrito por qué ciertos usuarios no deben usar esa zona todavía. Propongo alternativas para demostrar el uso del equipamiento sin comprometer la seguridad." },
      { key: "C", text: "Le digo al coordinador que no voy a arriesgar la salud de mis clientes solo para justificar un gasto del gym, y mantengo mis rutinas como estaban." },
    ],
  },
  {
    id: "q11",
    label: "Pregunta 11 — Seguridad en Instalaciones",
    text: "En tu recorrido matutino, notas que el cable de la polea baja tiene un desgaste visible pero no está roto. Lo jalaste y aún soporta. Hay 3 usuarios esperando usar esa máquina y es hora pico.",
    options: [
      { key: "A", text: "Lo dejo operando porque todavía aguanta y avisar significaría quitar la máquina de servicio en hora pico, afectando a los usuarios. Lo reporto al final del turno." },
      { key: "B", text: "Desactivo la máquina inmediatamente con señalización de \"Fuera de Servicio\", explico a los 3 usuarios la razón y les ofrezco ejercicios alternativos equivalentes, reporto al coordinador con foto y descripción del desgaste, y lo registro en bitácora con hora y fecha." },
      { key: "C", text: "Les advierto a los 3 usuarios que el cable tiene desgaste y que lo usen con cuidado y con peso ligero mientras llega mantenimiento. Así no pierden su entrenamiento." },
    ],
  },
  {
    id: "q12",
    label: "Pregunta 12 — Límites de Competencia",
    text: "Un cliente te pide que le hagas su plan de alimentación completo con gramaje, macros y suplementación porque \"confía más en ti que en un nutriólogo\". Sabes bastante de nutrición deportiva por tu experiencia.",
    options: [
      { key: "A", text: "Le hago lineamientos generales de alimentación saludable basándome en mi experiencia, porque orientar al cliente es parte de mi servicio y él me lo está pidiendo." },
      { key: "B", text: "Le agradezco la confianza, le explico que la prescripción dietética con gramaje y macros es competencia exclusiva de un nutriólogo certificado y que hacerlo yo sería ejercer fuera de mi campo. Lo refiero con un profesional, pero sí le comparto principios generales de hidratación, frecuencia de comidas y tipos de alimentos compatibles con su entrenamiento." },
      { key: "C", text: "Le digo que no puedo ayudarle con nutrición y que busque un nutriólogo por su cuenta. Yo solo me encargo del ejercicio." },
    ],
  },
  {
    id: "q13",
    label: "Pregunta 13 — Control de Grupos y Seguridad",
    text: "Un lunes faltaron 2 de 3 entrenadores. Hay 20 usuarios en piso y solo estás tú. Decides improvisar una clase grupal para atender a todos.",
    options: [
      { key: "A", text: "Es la mejor decisión: así atiendo a los 20 al mismo tiempo y nadie se queda sin servicio. Les pongo un circuito funcional general." },
      { key: "B", text: "Antes de improvisar, notifico al coordinador la situación. Segmento a los usuarios: a los autónomos (avanzados) les entrego su rutina escrita y los ubico en zona donde pueda supervisarlos visualmente. A los principiantes y usuarios con condiciones especiales les doy atención directa prioritaria. Solo armo un grupo si tengo usuarios de nivel similar y con consentimiento de ellos. Registro las faltas de mis compañeros." },
      { key: "C", text: "Le pido a los usuarios avanzados que ayuden a los principiantes mientras yo superviso desde el centro del gimnasio, así cubrimos más terreno." },
    ],
  },
  {
    id: "q14",
    label: "Pregunta 14 — Honestidad en Reportes",
    text: "El coordinador te pide un reporte semanal de cuántos usuarios atendiste personalmente. Tú sabes que realmente atendiste a 12, pero si pones 18 se ve mejor tu productividad y te pueden dar un bono.",
    options: [
      { key: "A", text: "Reporto 12 atendidos con el desglose real por día y horario. Si mi número es bajo, le propongo al coordinador una estrategia para aumentar mi captación la próxima semana — no inflo cifras." },
      { key: "B", text: "Pongo 15 como un punto intermedio, porque 12 es bajo y 18 es exagerado. Nadie va a revisar el detalle y no quiero verme mal." },
      { key: "C", text: "Pongo 18 porque todos los entrenadores inflan un poco sus números y es una práctica normal. Si yo no lo hago, me veo peor que mis compañeros siendo honesto." },
    ],
  },
  {
    id: "q15",
    label: "Pregunta 15 — Primer Respondiente",
    text: "Un usuario de 50 años se desploma en la zona de cardio, pierde el conocimiento y se pone morado. Hay 15 usuarios alrededor en pánico. Tú tienes certificación de primeros auxilios vencida.",
    options: [
      { key: "A", text: "Activo protocolo de emergencia aunque mi certificación esté vencida: verifico vías aéreas, pido a alguien específico que llame al 911, inicio RCP si no hay pulso, localizo el DEA, despejo el área, mantengo la calma y dirijo al personal hasta que llegue la ambulancia. Informo al coordinador en paralelo." },
      { key: "B", text: "Grito pidiendo ayuda y busco si hay algún usuario que sea médico o tenga capacitación vigente, porque mi certificación ya venció y no quiero hacer algo mal." },
      { key: "C", text: "Llamo al 911 inmediatamente y mantengo al usuario cómodo sin moverlo hasta que llegue la ambulancia, porque intervenir sin certificación vigente podría hacerme legalmente responsable si algo sale mal." },
    ],
  },
  {
    id: "q16",
    label: "Pregunta 16 — Manejo de Acusaciones",
    text: "Una clienta te acusa con el coordinador de haberla tocado inapropiadamente durante una corrección postural. Tú sabes que fue un ajuste técnico legítimo pero no había testigos.",
    options: [
      { key: "A", text: "Me defiendo explicándole al coordinador exactamente lo que pasó y le digo que la clienta está exagerando. Pido que le pregunten a otros clientes que estaban cerca." },
      { key: "B", text: "Acepto la gravedad de la acusación sin minimizarla, le pido al coordinador que se siga el protocolo formal de la empresa (declaración escrita, revisión de cámaras si las hay). A partir de ahora, siempre aviso verbalmente antes de hacer un ajuste postural y pido consentimiento explícito al cliente antes de tocar cualquier parte del cuerpo." },
      { key: "C", text: "Le pido a la clienta que hablemos directamente para aclarar el malentendido, le explico mi intención y le ofrezco una disculpa para que no se sienta incómoda." },
    ],
  },
  {
    id: "q17",
    label: "Pregunta 17 — Presión Externa",
    text: "Tres usuarios que son amigos del dueño te exigen que les reserves el rack de sentadillas de 7 a 8 PM todos los días, y que nadie más lo use en ese horario. \"Habla con el dueño si tienes dudas\", te dicen.",
    options: [
      { key: "A", text: "Consulto con el dueño directamente para confirmar si autorizó esa reservación exclusiva, y si no, les niego la solicitud con respeto y fundamento." },
      { key: "B", text: "Les explico que el espacio es de uso compartido según reglamento, que no tengo autoridad para reservar equipos en exclusiva, y que si desean un horario privado deben gestionarlo con la administración. Reporto la solicitud al coordinador por escrito para que quede documentado." },
      { key: "C", text: "Les doy prioridad discreta sin reservar formalmente — cuando los veo llegar, les aviso a los otros usuarios que en 5 minutos necesitan el rack. Así no rompo reglas por escrito pero mantengo contentos a los amigos del dueño." },
    ],
  },
  {
    id: "q18",
    label: "Pregunta 18 — Compromiso de Servicio",
    text: "Es viernes 8:55 PM, tu turno termina a las 9 PM. Un cliente nuevo llega y te pide que le hagas su evaluación inicial (toma 20 minutos). No hay otro entrenador disponible.",
    options: [
      { key: "A", text: "Le digo amablemente que mi turno termina en 5 minutos pero lo agendo para mañana a primera hora y le dejo mi nombre para que pregunte por mí. Le doy la bienvenida y le aseguro que mañana lo atiendo personalmente." },
      { key: "B", text: "Le hago la evaluación completa aunque me tome 20 minutos extra, porque la primera impresión es la que cuenta y si lo rechazo hoy, mañana no regresa. Reporto mi hora extendida al coordinador después." },
      { key: "C", text: "Le hago una evaluación rápida de 10 minutos cubriendo lo básico y le digo que completamos el resto mañana. Así no lo dejo ir con las manos vacías ni me quedo tanto tiempo extra." },
    ],
  },
  {
    id: "q19",
    label: "Pregunta 19 — Relaciones con el Staff",
    text: "Tu compañero entrenador llega 15-20 minutos tarde casi todos los días. Tú tienes que cubrir su zona y la tuya hasta que aparece. El coordinador no parece notarlo.",
    options: [
      { key: "A", text: "Hablo directamente con mi compañero primero para darle oportunidad de corregirse. Si no cambia en una semana, lo reporto al coordinador con fechas y horarios específicos de sus retrasos." },
      { key: "B", text: "Lo reporto inmediatamente al coordinador con fechas específicas, porque los problemas de puntualidad afectan mi carga de trabajo y la atención de los usuarios. No es mi rol corregir a un par — es rol del coordinador." },
      { key: "C", text: "Sigo cubriéndolo sin decir nada porque no quiero ser el \"chismoso\" del equipo. Eventualmente el coordinador se dará cuenta solo." },
    ],
  },
  {
    id: "q20",
    label: "Pregunta 20 — Motivación y Actitud",
    text: "Llevas 6 meses en el gym, sientes que no creces profesionalmente, el salario es bajo y estás considerando irte. Mientras tanto, tu actitud en piso ha bajado visiblemente.",
    options: [
      { key: "A", text: "Mantengo mi nivel de servicio idéntico al día 1 porque mi compromiso profesional no depende de mi estado emocional. En paralelo, solicito una reunión con el coordinador para hablar de crecimiento, capacitaciones o ajuste salarial. Si no hay respuesta, busco opciones afuera pero sin sabotear mi trabajo actual." },
      { key: "B", text: "Es natural que baje mi energía si no me siento valorado. Los usuarios no tienen la culpa, pero es responsabilidad de la empresa motivarme y si no lo hace, la calidad baja inevitablemente." },
      { key: "C", text: "Le bajo un poco la intensidad al servicio para equilibrar lo que me pagan con lo que doy. No voy a dar el 100% por un salario del 60%." },
    ],
  },
];

export const ENTRENADOR_KEY: Record<string, AnswerKeyEntry> = {
  q1: { correct: "B", label: "Honestidad / Ética" },
  q2: { correct: "B", label: "Conflicto y Autoridad" },
  q3: { correct: "A", label: "Ética Profesional" },
  q4: { correct: "B", label: "Operación y Flexibilidad" },
  q5: { correct: "B", label: "Presión Social e Integridad" },
  q6: { correct: "A", label: "Foco y Atención" },
  q7: { correct: "B", label: "Control y Complicidad" },
  q8: { correct: "B", label: "Seguridad y Progresión" },
  q9: { correct: "B", label: "Manejo de Lesiones" },
  q10: { correct: "B", label: "Toma de Decisiones y Jerarquía" },
  q11: { correct: "B", label: "Seguridad en Instalaciones" },
  q12: { correct: "B", label: "Límites de Competencia" },
  q13: { correct: "B", label: "Control de Grupos y Seguridad" },
  q14: { correct: "A", label: "Honestidad en Reportes" },
  q15: { correct: "A", label: "Primer Respondiente" },
  q16: { correct: "B", label: "Manejo de Acusaciones" },
  q17: { correct: "B", label: "Presión Externa" },
  q18: { correct: "B", label: "Compromiso de Servicio" },
  q19: { correct: "A", label: "Relaciones con el Staff" },
  q20: { correct: "A", label: "Motivación y Actitud" },
};

// ─── RECEPCION QUESTIONS (20 Multiple Choice) ────────────────────────────────
export const RECEPCION_QUESTIONS: Question[] = [
  {
    id: "q1",
    label: "Pregunta 1 — Servicio al Cliente bajo Presión",
    text: "Un cliente furioso llega a recepción porque le cobraron doble su mensualidad. Revisas y efectivamente fue un error del sistema. Grita frente a 4 clientes en fila.",
    options: [
      { key: "A", text: "Le ofrezco una disculpa inmediata, le pido que por favor baje la voz porque hay otros clientes, le muestro en pantalla el error y le digo que la devolución se procesa en 48 horas según política." },
      { key: "B", text: "Valido su enojo sin pedirle que se calme (\"Entiendo su molestia, tiene razón\"), le muestro el error en pantalla, ejecuto la solución más rápida que esté en mis facultades (nota de crédito, reversión inmediata, o compensación), le doy un plazo máximo preciso y mi nombre como responsable del seguimiento. Si la devolución no depende de mí, escalo al coordinador en ese momento — no \"en 48 horas\"." },
      { key: "C", text: "Le digo que comprendo su frustración y lo paso de inmediato con el coordinador porque un error de cobro doble es un problema que está fuera de mis funciones resolver." },
    ],
  },
  {
    id: "q2",
    label: "Pregunta 2 — Honestidad y Límites",
    text: "Una amiga tuya llega a inscribirse y te pide que le apliques un descuento o promoción que ya venció hace una semana. \"Nadie se va a enterar\", te dice.",
    options: [
      { key: "A", text: "Le explico que no puedo aplicar promociones vencidas porque el sistema registra todo y me pone en riesgo. Le ofrezco las promociones vigentes actuales y si no hay ninguna, le sugiero esperar a la próxima campaña." },
      { key: "B", text: "Le aplico el descuento vencido porque la diferencia es mínima y ganar una inscripción beneficia a la sucursal. Le pido que no le diga a nadie." },
      { key: "C", text: "Le digo que voy a consultar con el coordinador si puede autorizar una excepción para ella, porque a veces se hacen excepciones especiales." },
    ],
  },
  {
    id: "q3",
    label: "Pregunta 3 — Prioridades en Servicio",
    text: "Un visitante llega a las 6 PM (hora pico máxima) a preguntar por membresías. Hay 8 personas esperando checar entrada. No tiene cita.",
    options: [
      { key: "A", text: "Le digo amablemente que estamos en hora pico y que sería mejor que regresara mañana en horario tranquilo para darle la atención que merece." },
      { key: "B", text: "Le doy prioridad total al visitante porque un prospecto nuevo vale más que registrar entradas de clientes que ya pagan." },
      { key: "C", text: "Lo saludo de inmediato con contacto visual, le entrego un folleto o ficha de precios mientras atiendo la fila (no lo ignoro), le doy un tiempo estimado de espera (\"5 minutos\"), y cuando despeje la fila lo atiendo sin prisa. Si la fila no baja, le pido sus datos para llamarle al día siguiente en horario específico." },
    ],
  },
  {
    id: "q4",
    label: "Pregunta 4 — Fuga de Información y Cartera",
    text: "Un ex-entrenador del gym (que fue despedido) te llama y te pide los teléfonos de los clientes que él atendía porque \"quiere invitarlos a su nuevo gym\".",
    options: [
      { key: "A", text: "Le digo que no puedo darle esa información y le cuelgo rápidamente para no meterme en problemas." },
      { key: "B", text: "Le niego la información de forma firme y cortés explicando que es data confidencial de la empresa. Inmediatamente reporto el intento al coordinador por escrito con fecha, hora y nombre del ex-empleado, porque esto podría ser un patrón de captación ilegal de cartera." },
      { key: "C", text: "Le doy solo los nombres sin teléfono, porque los nombres son información pública y así no le doy datos \"sensibles\"." },
    ],
  },
  {
    id: "q5",
    label: "Pregunta 5 — Integridad en Caja",
    text: "Al hacer tu corte de caja descubres que accidentalmente cobraste $200 de más a un usuario por una visita. El corte te cuadra perfecto con ese excedente. Nadie se ha quejado.",
    options: [
      { key: "A", text: "Dejo el corte como está porque me cuadra y el usuario no reclamó. Si él se da cuenta después, lo corregimos en su próxima visita." },
      { key: "B", text: "Registro el sobrante, identifico al usuario en el historial del sistema, lo contacto para informarle del error y le ofrezco la devolución o crédito. Documento la incidencia en el reporte de corte aunque signifique que mi caja no \"cuadre bonito\" hoy." },
      { key: "C", text: "Le aviso al coordinador que hay $200 de más en caja y que creo que fue un cobro erróneo, y dejo que él decida qué hacer porque no quiero mover dinero sin autorización." },
    ],
  },
  {
    id: "q6",
    label: "Pregunta 6 — Clientes Difíciles",
    text: "Hay un usuario regular que siempre es grosero contigo — nunca saluda, te habla con desprecio y se queja de todo. Hoy viene a renovar su membresía.",
    options: [
      { key: "A", text: "Lo atiendo de forma correcta pero sin hacerle plática ni ofrecer información extra. Cumplimiento mínimo profesional — no tengo por qué aguantar a alguien que me trata mal." },
      { key: "B", text: "Lo atiendo con la misma calidad, amabilidad y oferta de información que a cualquier otro usuario, independientemente de su actitud conmigo. Mi estándar de servicio no depende de cómo me traten. Si su conducta es reiteradamente irrespetuosa, lo documento y lo reporto por la vía correcta." },
      { key: "C", text: "Aprovecho la renovación para comentarle amablemente que apreciaría un trato más respetuoso, porque trabajo mejor cuando el ambiente es cordial." },
    ],
  },
  {
    id: "q7",
    label: "Pregunta 7 — Proactividad e Inquietudes",
    text: "Un usuario educado te dice: \"Oye, debería haber agua en el cooler siempre, ayer estuve 2 horas y nunca hubo. En otros gyms eso no pasa.\" Es una crítica directa a la operación.",
    options: [
      { key: "A", text: "Le agradezco, le doy la razón y le digo que lo voy a comentar. Después se me olvida porque no es mi área y tengo muchas cosas que hacer en caja." },
      { key: "B", text: "Le agradezco la retroalimentación, le aseguro que lo voy a reportar, y efectivamente lo documento por escrito al coordinador ese mismo día con la queja específica, el horario del problema y la sugerencia. Hago seguimiento en la próxima semana para verificar si se resolvió." },
      { key: "C", text: "Le explico que el water cooler es responsabilidad de limpieza y mantenimiento, y le sugiero que lo reporte directamente al coordinador cuando lo vea vacío para que sea más rápido." },
    ],
  },
  {
    id: "q8",
    label: "Pregunta 8 — Control Financiero",
    text: "Al hacer tu corte encuentras $350 de faltante. Revisas los tickets y no encuentras el error. Tu turno termina en 10 minutos y el siguiente recepcionista ya llegó.",
    options: [
      { key: "A", text: "Pongo los $350 de mi bolsa para cuadrar la caja y mañana investigo con calma. No quiero dejar un faltante registrado a mi nombre." },
      { key: "B", text: "Registro el faltante exacto en el reporte de corte, notifico al coordinador antes de irme, reviso las transacciones de efectivo una vez más y si no encuentro el error, firmo el corte con la observación del descuadre. No tapo huecos con dinero propio." },
      { key: "C", text: "Le dejo el faltante al siguiente turno para que entre los dos lo investiguen mañana con más tiempo. Anoto en la libreta que hay un descuadre." },
    ],
  },
  {
    id: "q9",
    label: "Pregunta 9 — Plan de Contingencia",
    text: "El sistema POS se congela completamente. Hay 10 personas en fila esperando. No sabes cuándo regresará.",
    options: [
      { key: "A", text: "Les pido a todos que esperen y llamo a soporte técnico inmediatamente. Es mejor esperar que cobrar mal." },
      { key: "B", text: "Activo protocolo de contingencia: registro entradas en bitácora manual con nombre y hora, para cobros uso recibos manuales numerados con detalle completo (monto, concepto, nombre), informo a cada persona que estamos en modo manual y que su operación quedará registrada. Notifico al coordinador y a soporte técnico en paralelo." },
      { key: "C", text: "Le digo a los usuarios que vuelvan más tarde cuando se arregle el sistema y les prometo que su acceso del día no se les cobrará como compensación." },
    ],
  },
  {
    id: "q10",
    label: "Pregunta 10 — Ética y Ventas",
    text: "Un usuario pregunta si la membresía incluye asesoría personalizada con entrenador. Tú sabes que NO la incluye, pero si le dices que sí, es probable que se inscriba hoy y cumplas tu meta del mes.",
    options: [
      { key: "A", text: "Le digo la verdad: la membresía no incluye asesoría personalizada, pero le explico los paquetes disponibles que sí la incluyen, le doy el comparativo de precio y beneficio, y le muestro el valor agregado del paquete superior. Le doy una recomendación honesta basada en su objetivo." },
      { key: "B", text: "Le digo que incluye \"orientación general\" con el entrenador de piso, lo cual es técnicamente cierto, sin aclararle que no es una asesoría personalizada formal. Si después reclama, fue un malentendido." },
      { key: "C", text: "Le digo que sí incluye asesoría para asegurar la venta y ya después le explico que es limitada. Una vez adentro, el cliente se queda." },
    ],
  },
  {
    id: "q11",
    label: "Pregunta 11 — Normas y Protección Legal",
    text: "Un joven de 16 años llega solo a inscribirse con dinero en efectivo. Dice que su mamá \"lo mandó\" pero no trae ninguna carta ni identificación del tutor.",
    options: [
      { key: "A", text: "Lo inscribo porque trae el dinero y la mamá lo mandó. Si la mamá tiene problema, que venga a hablar conmigo directamente." },
      { key: "B", text: "Le explico amablemente que por política y protección de menores necesitamos la presencia o autorización firmada de su tutor con identificación oficial. Le tomo sus datos de contacto y los de su mamá para llamarla y facilitar el trámite, pero no proceso la inscripción sin el requisito completo." },
      { key: "C", text: "Lo dejo entrar solo por hoy como \"visita de cortesía\" mientras consigue la autorización, porque si lo rechazo se va a ir a la competencia." },
    ],
  },
  {
    id: "q12",
    label: "Pregunta 12 — Estrategia de Venta",
    text: "Último día del mes. Te faltan 2 inscripciones para la meta. El coordinador te presiona. Un prospecto indeciso está en recepción y dice \"lo voy a pensar\".",
    options: [
      { key: "A", text: "Le digo \"claro, tómate tu tiempo\" y lo dejo ir. Si regresa, bien, y si no, la meta no se cumple pero no voy a presionar a nadie." },
      { key: "B", text: "Sin presionar, le pregunto qué factor específico lo tiene dudoso, le respondo con información concreta, le ofrezco agendar una visita guiada o clase de prueba para que experimente el gym antes de decidir, y le dejo mis datos para seguimiento. No lo dejo ir sin al menos un próximo paso definido." },
      { key: "C", text: "Le ofrezco un descuento extra \"solo por hoy\" que no estoy autorizada a dar, porque es el último día y necesito cerrar la meta. Después le explico al coordinador que fue necesario." },
    ],
  },
  {
    id: "q13",
    label: "Pregunta 13 — Control e Instrucciones",
    text: "El coordinador te dice verbalmente que a partir de hoy la visita sube de $50 a $80, pero tú no has recibido ningún comunicado oficial, ni el sistema refleja el cambio de precio.",
    options: [
      { key: "A", text: "Cobro $80 porque es la instrucción de mi jefe directo. Si un cliente se queja, lo refiero con el coordinador." },
      { key: "B", text: "Le pido al coordinador que me confirme el cambio por escrito (correo, memo o actualización en sistema) antes de aplicararlo. Mientras tanto, sigo cobrando $50 que es lo que el sistema refleja. Si llega un cliente antes de tener la confirmación, no aplico un precio que no puedo respaldar documentalmente." },
      { key: "C", text: "Cobro $80 a los nuevos y $50 a los regulares como transición, para no generar conflicto con nadie." },
    ],
  },
  {
    id: "q14",
    label: "Pregunta 14 — Privacidad de Datos",
    text: "Mientras atiendes a un cliente, el usuario anterior dejó su sesión abierta en el sistema y puedes ver su historial de pagos, datos personales y adeudos. El cliente que estás atendiendo alcanza a ver la pantalla.",
    options: [
      { key: "A", text: "Cierro la sesión anterior discretamente y sigo atendiendo a mi cliente sin hacer comentario al respecto." },
      { key: "B", text: "Cierro la sesión anterior de inmediato, verifico que el cliente actual no haya visto información sensible, y si la vio, le pido discreción. Reporto el incidente al coordinador como falla de protocolo de cierre de sesión y propongo que se implemente un auto-lock o recordatorio de cierre entre atenciones." },
      { key: "C", text: "Cambio de pantalla rápidamente y sigo atendiendo. No reporto nada porque fue un descuido menor y no pasó a mayores." },
    ],
  },
  {
    id: "q15",
    label: "Pregunta 15 — Control del Estrés",
    text: "Martes de quincena, 7 PM. Hay 15 personas en fila, 3 quejas simultáneas por cobros incorrectos, el teléfono suena sin parar y el coordinador no está. Empiezas a sentir que no puedes con todo.",
    options: [
      { key: "A", text: "Cierro los ojos 5 segundos, respiro, priorizo: atiendo fila presencial por orden, el teléfono va a buzón, las quejas de cobro las anoto para resolverlas cuando baje la presión. Proceso cada operación completa sin errores aunque tome más tiempo por persona. No entro en pánico ni cometo errores por velocidad." },
      { key: "B", text: "Atiendo todo al mismo tiempo para demostrar que soy capaz: contesto el teléfono con una mano mientras proceso un pago con la otra. Soy multitask." },
      { key: "C", text: "Le pido a un usuario amable de la fila que conteste el teléfono y tome recados mientras yo atiendo la fila, así dividimos la carga." },
    ],
  },
  {
    id: "q16",
    label: "Pregunta 16 — Manejo de Situaciones Incómodas",
    text: "Un usuario regular te invita a salir cada vez que viene al gym. Siempre con \"buen humor\" y \"sin mala intención\". Te incomoda pero no sabes si reportarlo porque \"no ha hecho nada grave\".",
    options: [
      { key: "A", text: "Le sigo el juego con risas nerviosas para no generar incomodidad ni perder un cliente para el gym." },
      { key: "B", text: "Le digo claramente la primera vez que su invitación me incomoda y que prefiero mantener nuestra relación como usuario-recepción. Si persiste después de mi negativa clara, lo reporto al coordinador por escrito como acoso reiterativo, porque la frecuencia y persistencia lo convierte en conducta de hostigamiento." },
      { key: "C", text: "Le digo a una compañera que lo atienda a él siempre para evitar la situación sin tener que confrontarlo." },
    ],
  },
  {
    id: "q17",
    label: "Pregunta 17 — Presión del Jefe",
    text: "El coordinador te pide que registres 3 visitas de cortesía como \"inscripciones de prueba gratuita\" en el sistema porque así se ven mejor los números del mes para el reporte del dueño.",
    options: [
      { key: "A", text: "Lo hago porque el coordinador es mi jefe y si él dice que así se clasifican, confío en su criterio." },
      { key: "B", text: "Le expreso respetuosamente que registrar cortesías como inscripciones de prueba es una clasificación incorrecta que distorsiona los reportes. Le pido que me lo confirme por escrito si insiste. Si no me da respaldo por escrito, registro las cortesías como lo que son: cortesías." },
      { key: "C", text: "Lo hago pero guardo evidencia (screenshot, nota personal) por si algún día me preguntan, para cubrirme." },
    ],
  },
  {
    id: "q18",
    label: "Pregunta 18 — Manejo de Errores",
    text: "Procesaste una cancelación de membresía y accidentalmente eliminaste el historial de pagos del cliente en vez de solo desactivar su cuenta. Nadie se ha dado cuenta.",
    options: [
      { key: "A", text: "Intento reparar el error yo misma buscando los pagos en los cortes de caja anteriores y reconstruyendo el historial manualmente antes de que alguien lo note." },
      { key: "B", text: "Reporto el error al coordinador de inmediato y al soporte del sistema si aplica, explico exactamente lo que hice, solicito que se restaure la información desde el último respaldo de base de datos. Asumo el error y documento lo sucedido para que se implemente una confirmación de seguridad antes de eliminar registros." },
      { key: "C", text: "No digo nada porque el cliente ya canceló y probablemente nunca va a regresar, así que su historial ya no importa." },
    ],
  },
  {
    id: "q19",
    label: "Pregunta 19 — Seguridad en Recepción",
    text: "Es el último turno. Estás sola en recepción. Un hombre que no es usuario entra y te dice que busca a su esposa pero no sabe cómo se llama su membresía. Quiere entrar al área de vestidores.",
    options: [
      { key: "A", text: "Le doy acceso al lobby y le pido que la espere aquí. No puede entrar a vestidores pero al menos no lo dejo afuera." },
      { key: "B", text: "Le niego el acceso a cualquier área restringida con firmeza y cortesía. Le ofrezco llamar por altavoz o enviar mensaje a su esposa si me da el nombre. No le proporciono datos de ningún usuario. Si su actitud cambia o insiste, llamo a seguridad o al coordinador inmediatamente. Nunca un no-usuario entra sin registro." },
      { key: "C", text: "Le pido su identificación, la registro como \"visitante\" y lo dejo pasar al área general para que busque a su esposa él mismo." },
    ],
  },
  {
    id: "q20",
    label: "Pregunta 20 — Ética Profesional al Salir",
    text: "Ya diste tu renuncia y te quedan 5 días de trabajo. El servicio y la operación siguen igual de demandantes.",
    options: [
      { key: "A", text: "Hago mi trabajo normal pero sin el mismo entusiasmo, porque total ya me voy y no tengo nada que demostrar. No le hago mal a nadie pero tampoco me esfuerzo extra." },
      { key: "B", text: "Mantengo mi nivel de servicio intacto hasta el último minuto. Dejo mi estación ordenada, mis pendientes documentados, un resumen de procesos para quien me sustituya, y me despido profesionalmente de usuarios y equipo. Mi reputación se construye hasta el último día." },
      { key: "C", text: "Le dedico mis últimos días a entrenar a mi reemplazo y relajo la atención directa a usuarios, porque la transición es más importante que la operación diaria." },
    ],
  },
];

export const RECEPCION_KEY: Record<string, AnswerKeyEntry> = {
  q1: { correct: "B", label: "Servicio al Cliente bajo Presión" },
  q2: { correct: "A", label: "Honestidad y Límites" },
  q3: { correct: "C", label: "Prioridades en Servicio" },
  q4: { correct: "B", label: "Fuga de Información y Cartera" },
  q5: { correct: "B", label: "Integridad en Caja" },
  q6: { correct: "B", label: "Clientes Difíciles" },
  q7: { correct: "B", label: "Proactividad e Inquietudes" },
  q8: { correct: "B", label: "Control Financiero" },
  q9: { correct: "B", label: "Plan de Contingencia" },
  q10: { correct: "A", label: "Ética y Ventas" },
  q11: { correct: "B", label: "Normas y Protección Legal" },
  q12: { correct: "B", label: "Estrategia de Venta" },
  q13: { correct: "B", label: "Control e Instrucciones" },
  q14: { correct: "B", label: "Privacidad de Datos" },
  q15: { correct: "A", label: "Control del Estrés" },
  q16: { correct: "B", label: "Manejo de Situaciones Incómodas" },
  q17: { correct: "B", label: "Presión del Jefe" },
  q18: { correct: "B", label: "Manejo de Errores" },
  q19: { correct: "B", label: "Seguridad en Recepción" },
  q20: { correct: "B", label: "Ética Profesional al Salir" },
};

// ─── LIMPIEZA QUESTIONS (20 Multiple Choice) ─────────────────────────────────
export const LIMPIEZA_QUESTIONS: Question[] = [
  {
    id: "q1",
    label: "Pregunta 1 — Criterio y Proactividad",
    text: "El coordinador te dice: \"Hoy solo limpia el área de cardio, las demás áreas están bien.\" Pero cuando pasas frente a los vestidores, huelen claramente a humedad y el piso está mojado.",
    options: [
      { key: "A", text: "Solo limpio el área de cardio como me indicó el coordinador. Él inspeccionó las otras áreas y dijo que estaban bien; no me corresponde contradecirlo." },
      { key: "B", text: "Limpio el área de cardio como se me indicó, pero también atiendo los vestidores porque detecto un problema real de higiene y seguridad (piso mojado = riesgo de caída). Después le informo al coordinador lo que encontré y lo que hice, sin confrontarlo." },
      { key: "C", text: "Le mando un mensaje al coordinador diciéndole que los vestidores huelen mal y espero su respuesta para actuar." },
    ],
  },
  {
    id: "q2",
    label: "Pregunta 2 — Relaciones en Servicio",
    text: "Estás limpiando un espejo en el área de peso libre. Un usuario se para justo enfrente del espejo que estás limpiando, empieza a hacer curls y te bloquea completamente sin decirte nada.",
    options: [
      { key: "A", text: "Me retiro sin decir nada y limpio otro espejo. No vale la pena molestar al usuario y puedo regresar después." },
      { key: "B", text: "Me disculpo amablemente y le digo \"en un segundo termino este espejo\" para que sepa que estoy ahí. Si me dice que no se mueve, termino las secciones accesibles, le agradezco su paciencia y regreso cuando se desocupe. No abandono la tarea completamente ni confronto." },
      { key: "C", text: "Le toco el hombro y le pido que se mueva porque estoy trabajando y él llegó después de mí." },
    ],
  },
  {
    id: "q3",
    label: "Pregunta 3 — Prevención de Riesgos",
    text: "Mientras limpias el área de alberca o zona húmeda, ves a un niño de unos 6 años corriendo solo por el piso mojado. No hay ningún adulto cerca.",
    options: [
      { key: "A", text: "Le grito \"¡Cuidado, no corras!\" y sigo limpiando. Ya le advertí." },
      { key: "B", text: "Me acerco al niño con calma, le pido que camine despacio, me aseguro de que esté seguro y busco al adulto responsable. Si no lo encuentro, lo llevo a recepción y reporto la situación al coordinador. Un niño no supervisado en zona mojada es una emergencia de prevención." },
      { key: "C", text: "Pongo el señalamiento de \"Piso Mojado\" y si el niño se cae, la responsabilidad no es mía porque la señalización estaba." },
    ],
  },
  {
    id: "q4",
    label: "Pregunta 4 — Resolución de Conflictos Internos",
    text: "Tu compañero del turno anterior deja los vestidores sucios sistemáticamente. Tú siempre llegas y tienes que hacer doble trabajo. Ya se lo dijiste dos veces y no cambia.",
    options: [
      { key: "A", text: "Sigo haciendo el trabajo doble sin quejarme porque al final lo importante es que la sucursal esté limpia y no quiero ser conflictivo." },
      { key: "B", text: "Documento con fechas y fotos las veces que encuentro el área incompleta, lo hablo una última vez con mi compañero ofreciendo hacer un checklist conjunto de entrega de turno, y si no hay cambio lo reporto al coordinador con la evidencia. No dejo de limpiar lo necesario mientras se resuelve, pero tampoco lo normalizo." },
      { key: "C", text: "Dejo de limpiar lo que le toca a él para que el coordinador se dé cuenta solo de que mi compañero no está cumpliendo." },
    ],
  },
  {
    id: "q5",
    label: "Pregunta 5 — Honestidad y Protocolo",
    text: "Mientras limpias un casillero abierto en vestidores encuentras una bolsita con polvo blanco.",
    options: [
      { key: "A", text: "La tiro a la basura discretamente para evitar problemas. No sé de quién es y no quiero involucrarme." },
      { key: "B", text: "No la toco con las manos. Cierro el casillero, notifico de inmediato al coordinador con ubicación exacta y hora del hallazgo, espero instrucciones, y no comento nada con usuarios ni compañeros. Esto es un asunto que requiere protocolo formal de la empresa y posiblemente autoridades." },
      { key: "C", text: "Le tomo una foto, la dejo donde está y le mando la foto al coordinador por WhatsApp para que él decida." },
    ],
  },
  {
    id: "q6",
    label: "Pregunta 6 — Manejo de Contingencias Biológicas",
    text: "Un usuario vomita en el área de pesas. Hay otros usuarios entrenando muy cerca. El entrenador de piso te mira esperando que limpies inmediatamente.",
    options: [
      { key: "A", text: "Limpio inmediatamente con el trapeador que tengo a la mano para que no se expanda y los usuarios puedan seguir entrenando." },
      { key: "B", text: "Primero pido al entrenador que despeje un radio de 2 metros alrededor del área. Me pongo guantes y cubrebocas, limpio con material absorbente desechable primero (no trapeador regular), aplico desinfectante de alto nivel, desecho todo en bolsa rotulada como residuo biológico, y verifico que el usuario que vomitó reciba atención. Registro el incidente." },
      { key: "C", text: "Le pido al entrenador que eche agua encima del vómito para diluirlo mientras voy a buscar mis guantes y el desinfectante correcto." },
    ],
  },
  {
    id: "q7",
    label: "Pregunta 7 — Calidad vs Prisa",
    text: "El coordinador te dice que apures tu ronda de baños porque \"la inspección ya casi llega\". Tú sabes que si te apuras, los rincones de las regaderas van a quedar sucios y el piso va a estar resbaloso sin secar bien.",
    options: [
      { key: "A", text: "Apuro la limpieza lo más que pueda porque el coordinador sabe que la inspección es prioridad. Si los rincones no quedan perfectos, después los limpio bien cuando pase la inspección." },
      { key: "B", text: "Le informo al coordinador que necesito X minutos mínimo para una limpieza segura (especialmente el piso resbaloso), le propongo priorizar las áreas de mayor visibilidad si el tiempo es corto, pero no sacrifico el secado del piso porque un usuario puede caerse. Si hay que elegir entre impresionar a la inspección y un piso seco, elijo el piso seco." },
      { key: "C", text: "Hago todo rápido, pongo señalización de \"Piso Mojado\" en todo el baño y así me cubro mientras se seca solo." },
    ],
  },
  {
    id: "q8",
    label: "Pregunta 8 — Seguridad Química",
    text: "Se te acabó el desinfectante habitual y un compañero te dice \"mezcla el cloro con el amoniaco del limpiador morado, es lo mismo y queda más fuerte\".",
    options: [
      { key: "A", text: "Le hago caso porque mi compañero tiene más experiencia que yo y siempre lo ha hecho así." },
      { key: "B", text: "Me niego a mezclar los productos porque sé que la combinación de cloro con amoníaco genera gases tóxicos. Reporto al coordinador que el desinfectante se agotó y pido reabastecimiento. Mientras tanto, uso solo agua con el producto que sí esté aprobado. Nunca mezclo químicos sin autorización y ficha técnica." },
      { key: "C", text: "Mezclo una cantidad muy pequeña para probar si funciona y si no pasa nada, lo uso en el resto del área." },
    ],
  },
  {
    id: "q9",
    label: "Pregunta 9 — Procesos Técnicos",
    text: "Llegas al baño y empiezas a limpiar los pisos primero porque es lo que más se nota sucio.",
    options: [
      { key: "A", text: "Es correcto empezar por el piso porque es lo que los usuarios ven primero y lo que genera más quejas." },
      { key: "B", text: "Es incorrecto. La secuencia correcta es: retiro de basura → superficies altas (espejos, dispensadores) → lavabos → sanitarios/mingitorios → pisos al final. Si limpias pisos primero, al limpiar superficies altas la suciedad y salpicaduras caen al piso que ya limpiaste." },
      { key: "C", text: "El orden no importa tanto mientras todo quede limpio al final. Lo importante es la calidad, no la secuencia." },
    ],
  },
  {
    id: "q10",
    label: "Pregunta 10 — Manejo de Punzocortantes",
    text: "En el bote de basura del vestidor encuentras una jeringa con aguja usada.",
    options: [
      { key: "A", text: "La saco con doble guante y la tiro en la basura general con doble bolsa." },
      { key: "B", text: "No la toco directamente. Uso pinzas o herramienta rígida con guantes gruesos, la deposito en contenedor de punzocortantes (si hay) o en envase de plástico duro rotulado. Reporto el hallazgo al coordinador con ubicación y hora exacta. Nunca compacto ni meto la mano en basura donde podría haber más objetos cortantes." },
      { key: "C", text: "La dejo y le aviso al coordinador para que él decida qué hacer, porque manipular jeringas no es algo que me corresponda sin capacitación." },
    ],
  },
  {
    id: "q11",
    label: "Pregunta 11 — Almacenamiento Seguro",
    text: "Te pidieron organizar la bodega de limpieza. Notas que el cloro está junto a las botellas de agua embotellada del dispensador.",
    options: [
      { key: "A", text: "Los separo solo si me sobra tiempo, porque están cerrados y no hay riesgo real de que alguien se confunda." },
      { key: "B", text: "Separo inmediatamente los productos químicos de cualquier alimento o bebida. Ubico los químicos en una sección rotulada, a nivel bajo para evitar derrames por gravedad, y las bebidas en un área completamente separada. Reporto al coordinador que los encontré juntos para que se establezca una regla de almacenamiento fija." },
      { key: "C", text: "Le pongo una etiqueta al cloro para que se diferencie claramente del agua y los dejo en el mismo estante." },
    ],
  },
  {
    id: "q12",
    label: "Pregunta 12 — Control de Bacterias e Higiene",
    text: "Terminas de limpiar las 15 colchonetas del área funcional y las apilas inmediatamente para que no estorben.",
    options: [
      { key: "A", text: "Es lo correcto porque despejo el área rápido y los usuarios pueden volver a usarla." },
      { key: "B", text: "Es incorrecto. Las colchonetas deben secarse al aire antes de apilarse. Apilarlas húmedas genera hongos, bacterias y mal olor. Las dejo separadas verticalmente o sobre una superficie ventilada hasta que sequen, y las apilo solo cuando estén completamente secas." },
      { key: "C", text: "Las apilo pero dejo una hoja de papel periódico entre cada una para que absorba la humedad." },
    ],
  },
  {
    id: "q13",
    label: "Pregunta 13 — Seguridad Operacional",
    text: "Tienes que trapear un pasillo que conecta los vestidores con la zona de pesas. Es hora pico y hay tránsito constante de personas.",
    options: [
      { key: "A", text: "Espero a que baje el flujo de personas para trapear con calma, porque hacerlo en hora pico es peligroso y nadie lo va a notar." },
      { key: "B", text: "Trapeo por mitades: primero un lado del pasillo con señalización de \"Piso Mojado\" visible en el lado que limpio, dejando libre el otro lado para tránsito. Cuando el primer lado seca, repito en el segundo. Nunca dejo los dos lados mojados al mismo tiempo. Si un usuario se acerca, le advierto verbalmente." },
      { key: "C", text: "Trapeo todo el pasillo rápido y pongo 3 letreros de \"Piso Mojado\" para que la gente tenga cuidado. Si caminan con cuidado, no hay problema." },
    ],
  },
  {
    id: "q14",
    label: "Pregunta 14 — Mantenimiento de Herramientas",
    text: "Notas que tu trapeador ya no limpia bien — el repuesto está desgastado y deja marcas en el piso. No hay refacciones en bodega.",
    options: [
      { key: "A", text: "Sigo usando el trapeador actual porque no hay otro y tengo que limpiar con lo que hay." },
      { key: "B", text: "Reporto la necesidad de refacción al coordinador con urgencia, y mientras tanto busco una alternativa funcional: uso paños de microfibra con mango o cualquier herramienta limpia que logre el resultado sin dejar marcas. No uso una herramienta que deja el piso más sucio de lo que estaba." },
      { key: "C", text: "Uso un trapeador de otra área del gym sin avisar, porque el resultado es más importante que el inventario de herramientas." },
    ],
  },
  {
    id: "q15",
    label: "Pregunta 15 — Responsabilidad bajo Presión",
    text: "Te piden quedarte 2 horas extra sin aviso porque el personal del turno vespertino no llegó. Ya habías quedado con tu familia para una cena importante.",
    options: [
      { key: "A", text: "Me niego porque mi turno ya acabó y no puedo cancelar mi compromiso familiar cada vez que alguien falta." },
      { key: "B", text: "Evalúo la urgencia: si la sucursal quedaría sin personal de limpieza, me quedo y aviso a mi familia inmediatamente del cambio, registro mi hora extendida con el coordinador para que quede documentada. Pero también le digo al coordinador que necesito aviso con anticipación cuando sea posible y que este patrón de faltas del turno vespertino se debe resolver de raíz." },
      { key: "C", text: "Me quedo sin cuestionar porque soy responsable y el gym me necesita. Mi familia entenderá." },
    ],
  },
  {
    id: "q16",
    label: "Pregunta 16 — Honestidad e Integridad",
    text: "Limpiando debajo de una máquina encuentras un billete de $1,000.",
    options: [
      { key: "A", text: "Lo entrego en recepción y me sigo. Hice lo correcto." },
      { key: "B", text: "Lo entrego en recepción, pido que lo registren en el libro de objetos perdidos con mi nombre como quien lo encontró, la ubicación exacta, hora y fecha. Pido un acuse de recibo o que me confirmen el registro. Me protejo documentalmente ante cualquier acusación futura." },
      { key: "C", text: "Lo guardo temporalmente y espero a que alguien pregunte por él. Si en una semana nadie lo reclama, lo entrego a recepción." },
    ],
  },
  {
    id: "q17",
    label: "Pregunta 17 — Límites Profesionales",
    text: "Un usuario te pide que cuides su mochila 10 minutos mientras va a la regadera porque \"no confía en los lockers\".",
    options: [
      { key: "A", text: "Le digo que sí porque es un favor pequeño y no quiero ser grosero. La pongo junto a mis cosas." },
      { key: "B", text: "Le explico amablemente que por protocolo no puedo responsabilizarme de pertenencias de usuarios, le recomiendo usar los lockers con candado propio, y si no tiene candado, le sugiero preguntar en recepción si hay disponibles. No acepto la custodia de objetos personales de terceros." },
      { key: "C", text: "Le digo que la deje en la bodega de limpieza mientras se baña, porque ahí nadie entra y está segura." },
    ],
  },
  {
    id: "q18",
    label: "Pregunta 18 — Resolución de Situaciones Incómodas",
    text: "El coordinador te llama la atención frente a 3 usuarios porque los espejos del gym tienen manchas. Tú los limpiaste hace 2 horas pero los usuarios los ensuciaron de nuevo.",
    options: [
      { key: "A", text: "Me defiendo ahí mismo explicando que los limpié hace 2 horas y que los usuarios los ensucian constantemente. Que me regañe en privado." },
      { key: "B", text: "Acepto la observación en el momento sin confrontar al coordinador frente a los usuarios. Limpio los espejos de inmediato. Después, en privado, le explico al coordinador que los limpio cada X horas y le propongo aumentar la frecuencia o colocar dispensadores de limpiador para que los usuarios colaboren. Pido que las observaciones futuras sean en privado." },
      { key: "C", text: "No digo nada, limpio los espejos y me trago el coraje porque \"así es este trabajo\" y no vale la pena pelear." },
    ],
  },
  {
    id: "q19",
    label: "Pregunta 19 — Iniciativa y Colaboración",
    text: "Estás limpiando y encuentras una fuga de agua activa bajo un lavabo del vestidor. El agua se está esparciendo rápido.",
    options: [
      { key: "A", text: "Pongo un letrero de \"Fuera de Servicio\" en el lavabo y le aviso a mantenimiento. No es mi área pero ya lo reporté." },
      { key: "B", text: "Primero contengo la fuga lo que pueda (cierro la llave de paso si es accesible, pongo cubeta), coloco señalización de piso mojado, aviso a recepción para que desvíen usuarios a otro baño si es necesario, y notifico al coordinador y mantenimiento con urgencia. No abandono la situación hasta que alguien calificado tome control." },
      { key: "C", text: "Empiezo a secar el agua con mi trapeador y sigo secando hasta que llegue mantenimiento." },
    ],
  },
  {
    id: "q20",
    label: "Pregunta 20 — Cierre de Jornada y Profesionalismo",
    text: "Faltan 5 minutos para que termine tu turno. Notas que los sanitarios del baño de hombres necesitan una limpieza urgente (hay salpicaduras y papel en el piso).",
    options: [
      { key: "A", text: "Lo dejo para el siguiente turno porque faltan 5 minutos y técnicamente ya terminé mis rondas programadas." },
      { key: "B", text: "Lo limpio antes de irme aunque me tome 10-15 minutos extra. Dejo mi área en condiciones dignas para el siguiente turno y para los usuarios que están usando el gym ahora. Registro mi salida real y la razón de la extensión." },
      { key: "C", text: "Le aviso al compañero que llega que el baño de hombres necesita atención urgente para que lo haga él como primera tarea." },
    ],
  },
];

export const LIMPIEZA_KEY: Record<string, AnswerKeyEntry> = {
  q1: { correct: "B", label: "Criterio y Proactividad" },
  q2: { correct: "B", label: "Relaciones en Servicio" },
  q3: { correct: "B", label: "Prevención de Riesgos" },
  q4: { correct: "B", label: "Resolución de Conflictos Internos" },
  q5: { correct: "B", label: "Honestidad y Protocolo" },
  q6: { correct: "B", label: "Manejo de Contingencias Biológicas" },
  q7: { correct: "B", label: "Calidad vs Prisa" },
  q8: { correct: "B", label: "Seguridad Química" },
  q9: { correct: "B", label: "Procesos Técnicos" },
  q10: { correct: "B", label: "Manejo de Punzocortantes" },
  q11: { correct: "B", label: "Almacenamiento Seguro" },
  q12: { correct: "B", label: "Control de Bacterias e Higiene" },
  q13: { correct: "B", label: "Seguridad Operacional" },
  q14: { correct: "B", label: "Mantenimiento de Herramientas" },
  q15: { correct: "B", label: "Responsabilidad bajo Presión" },
  q16: { correct: "B", label: "Honestidad e Integridad" },
  q17: { correct: "B", label: "Límites Profesionales" },
  q18: { correct: "B", label: "Resolución de Situaciones Incómodas" },
  q19: { correct: "B", label: "Iniciativa y Colaboración" },
  q20: { correct: "B", label: "Cierre de Jornada y Profesionalismo" },
};

// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────
export function getQuestionsForPosition(position: PositionType): {
  questions: Question[];
  answerKey: Record<string, AnswerKeyEntry>;
} {
  switch (position) {
    case "ENTRENADOR":
      return { questions: ENTRENADOR_QUESTIONS, answerKey: ENTRENADOR_KEY };
    case "RECEPCION":
      return { questions: RECEPCION_QUESTIONS, answerKey: RECEPCION_KEY };
    case "LIMPIEZA":
      return { questions: LIMPIEZA_QUESTIONS, answerKey: LIMPIEZA_KEY };
    case "COORDINADOR":
    default:
      return { questions: COORDINADOR_QUESTIONS, answerKey: COORDINADOR_KEY };
  }
}
