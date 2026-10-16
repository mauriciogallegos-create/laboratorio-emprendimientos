/*
 * VíaSegura Perú - Motor de aplicación (capa cliente)
 * ---------------------------------------------------
 * Agrega lógica funcional al prototipo visual existente sin alterar su estética.
 * Organizado por capas:
 *   - domain/ : reglas de negocio (roles, permisos, validaciones)
 *   - data/   : repositorios y acceso a servicios (abstraídos del backend)
 *   - ui/     : renderizado y manejo de eventos
 *
 * NOTA DE SEGURIDAD: la validación de permisos de este archivo es SOLO para la
 * experiencia de usuario. La autorización real SIEMPRE debe revalidarse en el
 * backend (Firebase Rules / servidor). Nunca se confía en el cliente para
 * proteger datos de menores ni para el aislamiento entre instituciones.
 *
 * NOTA DE CÁMARAS: no se muestra vídeo ficticio como si fuera una transmisión
 * real. Sin dispositivo conectado se presenta un estado de demostración explícito.
 */
(function () {
  'use strict';

  // ===========================================================================
  // domain/roles.js
  // ===========================================================================
  const ROLES = Object.freeze({
    SUPERADMIN: 'superadmin',
    DIRECTOR: 'director',
    SEGURIDAD: 'seguridad',
    DOCENTE: 'docente',
    APODERADO: 'apoderado',
    ESTUDIANTE: 'estudiante'
  });

  const PERMISSIONS = Object.freeze({
    [ROLES.SUPERADMIN]: [
      'instituciones:gestionar', 'usuarios:gestionar', 'camaras:ver',
      'camaras:gestionar', 'incidencias:ver', 'incidencias:gestionar',
      'estudiantes:ver', 'reportes:ver', 'alertas:ver'
    ],
    [ROLES.DIRECTOR]: [
      'usuarios:gestionar', 'camaras:ver', 'camaras:gestionar',
      'incidencias:ver', 'incidencias:gestionar', 'estudiantes:ver',
      'reportes:ver', 'alertas:ver'
    ],
    [ROLES.SEGURIDAD]: [
      'camaras:ver', 'incidencias:ver', 'incidencias:gestionar', 'alertas:ver'
    ],
    [ROLES.DOCENTE]: [
      'camaras:ver', 'incidencias:ver', 'incidencias:crear', 'alertas:ver'
    ],
    [ROLES.APODERADO]: [
      'hijos:ver', 'alertas:ver', 'incidencias:crear', 'contacto:ver'
    ],
    [ROLES.ESTUDIANTE]: [
      'recorrido:usar', 'puntos:ver', 'incidencias:crear'
    ]
  });

  function can(role, permission) {
    return (PERMISSIONS[role] || []).indexOf(permission) !== -1;
  }

  // ===========================================================================
  // domain/validators.js
  // ===========================================================================
  const Validators = {
    required: (v) => v !== null && v !== undefined && String(v).trim() !== '',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim()),
    minLen: (v, n) => String(v || '').trim().length >= n,
    dni: (v) => /^\d{8}$/.test(String(v || '').trim()),
    phone: (v) => /^(\+?51)?\s?9\d{8}$/.test(String(v || '').replace(/\s/g, '')),

    validateLogin(form) {
      const errors = [];
      if (!Validators.required(form.email)) errors.push('Ingresa tu correo electrónico.');
      else if (!Validators.email(form.email)) errors.push('El correo electrónico no es válido.');
      if (!Validators.required(form.password)) errors.push('Ingresa tu contraseña.');
      else if (!Validators.minLen(form.password, 6)) errors.push('La contraseña debe tener al menos 6 caracteres.');
      return errors;
    },

    validateIncident(form) {
      const errors = [];
      if (!Validators.required(form.category)) errors.push('Selecciona una categoría.');
      if (!Validators.required(form.description)) errors.push('Describe la incidencia.');
      else if (!Validators.minLen(form.description, 10)) errors.push('La descripción debe tener al menos 10 caracteres.');
      return errors;
    }
  };

  // ===========================================================================
  // data/seed.js  (solo demostración; reemplazable por Firestore)
  // ===========================================================================
  // Datos reales (MINEDU/OSM 2026) cargados desde js/institutions-data.js.
  // El arreglo en linea siguiente es solo respaldo si ese archivo no se cargó.
  const DEMO_INSTITUTIONS = (typeof window !== 'undefined' && window.VIA_SEGURA_INSTITUTIONS && window.VIA_SEGURA_INSTITUTIONS.length) ? window.VIA_SEGURA_INSTITUTIONS : [
    // Zona: Cercado
    { id: 'inst-arequipa-01', name: 'I.E. Micaela Bastidas', code: 'IE-CE-001', district: 'Cercado', niveles: ['primaria', 'secundaria'], address: 'Av. Goyeneche 210, Arequipa', lat: -16.40460, lng: -71.53500 },
    { id: 'inst-arequipa-02', name: 'Colegio Nacional de la Independencia Americana', code: 'IE-CE-002', district: 'Cercado', niveles: ['primaria', 'secundaria'], address: 'Av. Independencia s/n, Arequipa', lat: -16.39340, lng: -71.54780 },
    { id: 'inst-arequipa-03', name: 'I.E. Francisco Mostajo', code: 'IE-CE-003', district: 'Cercado', niveles: ['primaria'], address: 'Av. Jorge Chávez 420, Arequipa', lat: -16.40530, lng: -71.53300 },
    { id: 'inst-arequipa-04', name: 'I.E. 40002 Mariscal Andrés Avelino Cáceres', code: 'IE-CE-004', district: 'Cercado', niveles: ['primaria'], address: 'Calle San Camilo 100, Arequipa', lat: -16.40900, lng: -71.54000 },
    { id: 'inst-arequipa-05', name: 'I.E.I. Santa Rosa', code: 'IEI-CE-005', district: 'Cercado', niveles: ['inicial'], address: 'Calle Mercaderes 315, Arequipa', lat: -16.40600, lng: -71.53650 },
    // Zona: Yanahuara
    { id: 'inst-arequipa-06', name: 'I.E. Deán Valdivia', code: 'IE-YA-006', district: 'Yanahuara', niveles: ['secundaria'], address: 'Av. Grau 100, Yanahuara', lat: -16.39700, lng: -71.54680 },
    { id: 'inst-arequipa-07', name: 'I.E. Los Libertadores', code: 'IE-YA-007', district: 'Yanahuara', niveles: ['primaria', 'secundaria'], address: 'Av. Los Libertadores 250, Yanahuara', lat: -16.39600, lng: -71.54400 },
    { id: 'inst-arequipa-08', name: 'I.E. Nuestra Señora de la Merced', code: 'IE-YA-008', district: 'Yanahuara', niveles: ['inicial', 'primaria'], address: 'Av. Independencia 650, Yanahuara', lat: -16.39880, lng: -71.54450 },
    { id: 'inst-arequipa-09', name: 'I.E. 40102 Perú Birf', code: 'IE-YA-009', district: 'Yanahuara', niveles: ['primaria'], address: 'Av. Venezuela 210, Yanahuara', lat: -16.39880, lng: -71.52830 },
    { id: 'inst-arequipa-10', name: 'I.E.I. Mis Primeros Pasos', code: 'IEI-YA-010', district: 'Yanahuara', niveles: ['inicial'], address: 'Calle Grau 210, Yanahuara', lat: -16.39750, lng: -71.54750 },
    // Zona: Cayma
    { id: 'inst-arequipa-11', name: 'I.E. José Carlos Mariátegui', code: 'IE-CA-011', district: 'Cayma', niveles: ['primaria', 'secundaria'], address: 'Av. Cayma 500, Cayma', lat: -16.37600, lng: -71.54100 },
    { id: 'inst-arequipa-12', name: 'I.E. Héroes de Angamos', code: 'IE-CA-012', district: 'Cayma', niveles: ['secundaria'], address: 'Av. Ejército 1200, Cayma', lat: -16.37950, lng: -71.53750 },
    { id: 'inst-arequipa-13', name: 'I.E. Santa María de Cayma', code: 'IE-CA-013', district: 'Cayma', niveles: ['inicial', 'primaria'], address: 'Calle Zamácola 250, Cayma', lat: -16.37680, lng: -71.54230 },
    { id: 'inst-arequipa-14', name: 'I.E. 40193 Villa Primavera', code: 'IE-CA-014', district: 'Cayma', niveles: ['primaria'], address: 'Av. Villa Primavera 120, Cayma', lat: -16.37920, lng: -71.54410 },
    { id: 'inst-arequipa-15', name: 'I.E.I. Jesús Niño', code: 'IEI-CA-015', district: 'Cayma', niveles: ['inicial'], address: 'Calle Cuesta del Ángel 300, Cayma', lat: -16.37500, lng: -71.54020 },
    // Zona: Miraflores
    { id: 'inst-arequipa-16', name: 'Gran Unidad Escolar Mariano Melgar', code: 'IE-MI-016', district: 'Miraflores', niveles: ['primaria', 'secundaria'], address: 'Av. Mariano Melgar 1500, Miraflores', lat: -16.40200, lng: -71.52900 },
    { id: 'inst-arequipa-17', name: 'I.E. Honorio Delgado Espinoza', code: 'IE-MI-017', district: 'Miraflores', niveles: ['secundaria'], address: 'Av. Salaverry 200, Miraflores', lat: -16.40330, lng: -71.52740 },
    { id: 'inst-arequipa-18', name: 'I.E. Antonio José de Sucre', code: 'IE-MI-018', district: 'Miraflores', niveles: ['primaria', 'secundaria'], address: 'Av. Goyeneche 800, Miraflores', lat: -16.40200, lng: -71.53000 },
    { id: 'inst-arequipa-19', name: 'I.E. 40102 Perú Birf', code: 'IE-MI-019', district: 'Miraflores', niveles: ['primaria'], address: 'Av. Venezuela 300, Miraflores', lat: -16.40120, lng: -71.52860 },
    { id: 'inst-arequipa-20', name: 'I.E.I. Santa María', code: 'IEI-MI-020', district: 'Miraflores', niveles: ['inicial'], address: 'Calle Sucre 210, Miraflores', lat: -16.40380, lng: -71.52820 },
    // Zona: Alto Selva Alegre
    { id: 'inst-arequipa-21', name: 'I.E. José Carlos Mariátegui', code: 'IE-AS-021', district: 'Alto Selva Alegre', niveles: ['secundaria'], address: 'Av. Venezuela 1500, A. Selva Alegre', lat: -16.38300, lng: -71.51800 },
    { id: 'inst-arequipa-22', name: 'I.E. Héroes de Angamos', code: 'IE-AS-022', district: 'Alto Selva Alegre', niveles: ['primaria', 'secundaria'], address: 'Av. Ejército 2000, A. Selva Alegre', lat: -16.38500, lng: -71.51600 },
    { id: 'inst-arequipa-23', name: 'I.E. Nuestra Señora de la Merced', code: 'IE-AS-023', district: 'Alto Selva Alegre', niveles: ['inicial', 'primaria'], address: 'Av. Arequipa 700, A. Selva Alegre', lat: -16.38200, lng: -71.51950 },
    { id: 'inst-arequipa-24', name: 'I.E. 40026 Almirante Miguel Grau', code: 'IE-AS-024', district: 'Alto Selva Alegre', niveles: ['primaria'], address: 'Calle Grau 150, A. Selva Alegre', lat: -16.38100, lng: -71.51700 },
    { id: 'inst-arequipa-25', name: 'I.E.I. Los Angelitos', code: 'IEI-AS-025', district: 'Alto Selva Alegre', niveles: ['inicial'], address: 'Calle Los Andes 300, A. Selva Alegre', lat: -16.38400, lng: -71.52000 },
    // Zona: Socabaya
    { id: 'inst-arequipa-26', name: 'I.E. Honorio Delgado Espinoza', code: 'IE-SO-026', district: 'Socabaya', niveles: ['primaria', 'secundaria'], address: 'Av. Salaverry 500, Socabaya', lat: -16.43980, lng: -71.52450 },
    { id: 'inst-arequipa-27', name: 'I.E. José Domingo Zuzunaga', code: 'IE-SO-027', district: 'Socabaya', niveles: ['secundaria'], address: 'Av. Socabaya 800, Socabaya', lat: -16.43800, lng: -71.52300 },
    { id: 'inst-arequipa-28', name: 'I.E. 40027 Villa El Sol', code: 'IE-SO-028', district: 'Socabaya', niveles: ['primaria'], address: 'Av. Villa El Sol 200, Socabaya', lat: -16.44000, lng: -71.52600 },
    { id: 'inst-arequipa-29', name: 'I.E. Antonio José de Sucre', code: 'IE-SO-029', district: 'Socabaya', niveles: ['primaria', 'secundaria'], address: 'Calle Sucre 100, Socabaya', lat: -16.43700, lng: -71.52200 },
    { id: 'inst-arequipa-30', name: 'I.E.I. Santa Rosa', code: 'IEI-SO-030', district: 'Socabaya', niveles: ['inicial'], address: 'Calle Rosario 50, Socabaya', lat: -16.43900, lng: -71.52500 },
    // Zona: Jose Luis Bustamante y Rivero
    { id: 'inst-arequipa-31', name: 'I.E. Juana Cervantes de Bolognesi', code: 'IE-JB-031', district: 'José Luis Bustamante y Rivero', niveles: ['primaria', 'secundaria'], address: 'Av. Pizarro 400, J.L. Bustamante y Rivero', lat: -16.42100, lng: -71.52800 },
    { id: 'inst-arequipa-32', name: 'I.E. Jorge Basadre Grohmann', code: 'IE-JB-032', district: 'José Luis Bustamante y Rivero', niveles: ['primaria', 'secundaria'], address: 'Av. Los Cipreses 120, J.L. Bustamante y Rivero', lat: -16.42350, lng: -71.52620 },
    { id: 'inst-arequipa-33', name: 'I.E. Alexander von Humboldt', code: 'IE-JB-033', district: 'José Luis Bustamante y Rivero', niveles: ['secundaria'], address: 'Calle Los Nogales 210, J.L. Bustamante y Rivero', lat: -16.41980, lng: -71.53050 },
    { id: 'inst-arequipa-34', name: 'I.E. 40028 Ludwig van Beethoven', code: 'IE-JB-034', district: 'José Luis Bustamante y Rivero', niveles: ['primaria'], address: 'Av. Dolores 800, J.L. Bustamante y Rivero', lat: -16.42210, lng: -71.52910 },
    { id: 'inst-arequipa-35', name: 'I.E.I. Rayito de Sol', code: 'IEI-JB-035', district: 'José Luis Bustamante y Rivero', niveles: ['inicial'], address: 'Calle Los Álamos 150, J.L. Bustamante y Rivero', lat: -16.42480, lng: -71.52700 },
    // Zona: Mariano Melgar
    { id: 'inst-arequipa-36', name: 'I.E. Gran Unidad Escolar Mariano Melgar', code: 'IE-MM-036', district: 'Mariano Melgar', niveles: ['primaria', 'secundaria'], address: 'Av. Mariano Melgar 1200, Mariano Melgar', lat: -16.39020, lng: -71.50850 },
    { id: 'inst-arequipa-37', name: 'I.E. Francisco García Calderón', code: 'IE-MM-037', district: 'Mariano Melgar', niveles: ['secundaria'], address: 'Av. Mariscal Castilla 300, Mariano Melgar', lat: -16.38800, lng: -71.51050 },
    { id: 'inst-arequipa-38', name: 'I.E. José Antonio Encinas', code: 'IE-MM-038', district: 'Mariano Melgar', niveles: ['primaria', 'secundaria'], address: 'Calle San Martín 150, Mariano Melgar', lat: -16.39250, lng: -71.50600 },
    { id: 'inst-arequipa-39', name: 'I.E. 40122 Santa Rosa de Lima', code: 'IE-MM-039', district: 'Mariano Melgar', niveles: ['primaria'], address: 'Av. Las Américas 720, Mariano Melgar', lat: -16.38680, lng: -71.51200 },
    { id: 'inst-arequipa-40', name: 'I.E.I. Mis Primeros Trazos', code: 'IEI-MM-040', district: 'Mariano Melgar', niveles: ['inicial'], address: 'Calle Los Álamos 90, Mariano Melgar', lat: -16.38950, lng: -71.51350 },
    // Zona: Paucarpata
    { id: 'inst-arequipa-41', name: 'I.E. Rosa de América', code: 'IE-PA-041', district: 'Paucarpata', niveles: ['primaria', 'secundaria'], address: 'Av. Avelino Cáceres 500, Paucarpata', lat: -16.42500, lng: -71.50300 },
    { id: 'inst-arequipa-42', name: 'I.E. José Gálvez', code: 'IE-PA-042', district: 'Paucarpata', niveles: ['secundaria'], address: 'Av. Emmel 250, Paucarpata', lat: -16.42750, lng: -71.50080 },
    { id: 'inst-arequipa-43', name: 'I.E. Rafael Loayza Guevara', code: 'IE-PA-043', district: 'Paucarpata', niveles: ['secundaria'], address: 'Calle Túpac Amaru 310, Paucarpata', lat: -16.42300, lng: -71.50550 },
    { id: 'inst-arequipa-44', name: 'I.E. Carlos Wiese', code: 'IE-PA-044', district: 'Paucarpata', niveles: ['primaria'], address: 'Av. Jesús 800, Paucarpata', lat: -16.42880, lng: -71.49850 },
    { id: 'inst-arequipa-45', name: 'I.E.I. Gotitas de Amor', code: 'IEI-PA-045', district: 'Paucarpata', niveles: ['inicial'], address: 'Calle Los Rosales 60, Paucarpata', lat: -16.42420, lng: -71.50680 },
    // Zona: Cerro Colorado
    { id: 'inst-arequipa-46', name: 'I.E. Cristo Rey', code: 'IE-CC-046', district: 'Cerro Colorado', niveles: ['primaria', 'secundaria'], address: 'Av. Arequipa 1500, Cerro Colorado', lat: -16.36200, lng: -71.56000 },
    { id: 'inst-arequipa-47', name: 'I.E. San Ignacio de Loyola', code: 'IE-CC-047', district: 'Cerro Colorado', niveles: ['secundaria'], address: 'Calle Los Andes 410, Cerro Colorado', lat: -16.35900, lng: -71.56300 },
    { id: 'inst-arequipa-48', name: 'I.E. Villa Los Ángeles', code: 'IE-CC-048', district: 'Cerro Colorado', niveles: ['primaria'], address: 'Av. Los Ángeles 220, Cerro Colorado', lat: -16.36500, lng: -71.55800 },
    { id: 'inst-arequipa-49', name: 'I.E. Libertad', code: 'IE-CC-049', district: 'Cerro Colorado', niveles: ['secundaria'], address: 'Av. Libertad 900, Cerro Colorado', lat: -16.35750, lng: -71.56500 },
    { id: 'inst-arequipa-50', name: 'I.E.I. Semillitas del Saber', code: 'IEI-CC-050', district: 'Cerro Colorado', niveles: ['inicial'], address: 'Calle Las Flores 130, Cerro Colorado', lat: -16.36800, lng: -71.55600 },
    // Zona: Jacobo Hunter
    { id: 'inst-arequipa-51', name: 'I.E. José María Arguedas', code: 'IE-HU-051', district: 'Jacobo Hunter', niveles: ['primaria', 'secundaria'], address: 'Av. Hunter 1200, Jacobo Hunter', lat: -16.43000, lng: -71.54300 },
    { id: 'inst-arequipa-52', name: 'I.E. Miguel Grau Seminario', code: 'IE-HU-052', district: 'Jacobo Hunter', niveles: ['secundaria'], address: 'Calle Los Sauces 240, Jacobo Hunter', lat: -16.43300, lng: -71.54700 },
    { id: 'inst-arequipa-53', name: 'I.E. 40050 San Francisco', code: 'IE-HU-053', district: 'Jacobo Hunter', niveles: ['primaria'], address: 'Av. Los Olivos 560, Jacobo Hunter', lat: -16.43500, lng: -71.54400 },
    { id: 'inst-arequipa-54', name: 'I.E. Santa Rosa de Lima', code: 'IE-HU-054', district: 'Jacobo Hunter', niveles: ['primaria'], address: 'Calle Santa Rosa 130, Jacobo Hunter', lat: -16.42900, lng: -71.54650 },
    { id: 'inst-arequipa-55', name: 'I.E.I. Caritas Felices', code: 'IEI-HU-055', district: 'Jacobo Hunter', niveles: ['inicial'], address: 'Calle Los Geranios 90, Jacobo Hunter', lat: -16.43600, lng: -71.54250 },
    // Zona: Tiabaya
    { id: 'inst-arequipa-56', name: 'I.E. José Antonio Encinas', code: 'IE-TI-056', district: 'Tiabaya', niveles: ['primaria', 'secundaria'], address: 'Av. Tiabaya 400, Tiabaya', lat: -16.42500, lng: -71.57300 },
    { id: 'inst-arequipa-57', name: 'I.E. Jorge Basadre Grohmann', code: 'IE-TI-057', district: 'Tiabaya', niveles: ['primaria'], address: 'Calle Los Pinos 180, Tiabaya', lat: -16.42800, lng: -71.57700 },
    { id: 'inst-arequipa-58', name: 'I.E. 40258 La Inmaculada', code: 'IE-TI-058', district: 'Tiabaya', niveles: ['secundaria'], address: 'Av. San Martín 700, Tiabaya', lat: -16.43000, lng: -71.57450 },
    { id: 'inst-arequipa-59', name: 'I.E. Augusto Salazar Bondy', code: 'IE-TI-059', district: 'Tiabaya', niveles: ['primaria'], address: 'Calle Las Begonias 60, Tiabaya', lat: -16.42350, lng: -71.57600 },
    { id: 'inst-arequipa-60', name: 'I.E.I. Mis Primeros Pasos', code: 'IEI-TI-060', district: 'Tiabaya', niveles: ['inicial'], address: 'Calle Los Álamos 110, Tiabaya', lat: -16.42650, lng: -71.57250 },
    // Zona: Uchumayo
    { id: 'inst-arequipa-61', name: 'I.E. José Carlos Mariátegui', code: 'IE-UC-061', district: 'Uchumayo', niveles: ['primaria', 'secundaria'], address: 'Av. Uchumayo 900, Uchumayo', lat: -16.41600, lng: -71.66300 },
    { id: 'inst-arequipa-62', name: 'I.E. San Salvador', code: 'IE-UC-062', district: 'Uchumayo', niveles: ['secundaria'], address: 'Calle El Mirador 300, Uchumayo', lat: -16.41900, lng: -71.66700 },
    { id: 'inst-arequipa-63', name: 'I.E. 40610 Uchumayo', code: 'IE-UC-063', district: 'Uchumayo', niveles: ['primaria'], address: 'Av. Los Jardines 120, Uchumayo', lat: -16.42100, lng: -71.66400 },
    { id: 'inst-arequipa-64', name: 'I.E. Andrés Avelino Cáceres', code: 'IE-UC-064', district: 'Uchumayo', niveles: ['primaria'], address: 'Calle Santa Rosa 80, Uchumayo', lat: -16.41450, lng: -71.66600 },
    { id: 'inst-arequipa-65', name: 'I.E.I. Gotitas de Amor', code: 'IEI-UC-065', district: 'Uchumayo', niveles: ['inicial'], address: 'Calle Los Rosales 50, Uchumayo', lat: -16.41750, lng: -71.66250 },
    // Zona: Vítor
    { id: 'inst-arequipa-66', name: 'I.E. Alexander von Humboldt', code: 'IE-VI-066', district: 'Vítor', niveles: ['secundaria'], address: 'Av. Vítor 600, Vítor', lat: -16.46000, lng: -71.89800 },
    { id: 'inst-arequipa-67', name: 'I.E. José Domingo Zuzunaga', code: 'IE-VI-067', district: 'Vítor', niveles: ['primaria', 'secundaria'], address: 'Calle El Carmen 210, Vítor', lat: -16.46300, lng: -71.90200 },
    { id: 'inst-arequipa-68', name: 'I.E. 40400 Vítor', code: 'IE-VI-068', district: 'Vítor', niveles: ['primaria'], address: 'Av. Los Álamos 140, Vítor', lat: -16.46500, lng: -71.89900 },
    { id: 'inst-arequipa-69', name: 'I.E. Nuestra Señora del Carmen', code: 'IE-VI-069', district: 'Vítor', niveles: ['primaria'], address: 'Calle El Carmen 210, Vítor', lat: -16.45850, lng: -71.90100 },
    { id: 'inst-arequipa-70', name: 'I.E.I. Rayito de Sol', code: 'IEI-VI-070', district: 'Vítor', niveles: ['inicial'], address: 'Calle Los Ángeles 50, Vítor', lat: -16.46150, lng: -71.89750 },
    // Zona: Characato
    { id: 'inst-arequipa-71', name: 'I.E. Héroes de Angamos', code: 'IE-CH-071', district: 'Characato', niveles: ['primaria', 'secundaria'], address: 'Av. Characato 300, Characato', lat: -16.44000, lng: -71.47600 },
    { id: 'inst-arequipa-72', name: 'I.E. Micaela Bastidas', code: 'IE-CH-072', district: 'Characato', niveles: ['secundaria'], address: 'Calle Los Molles 150, Characato', lat: -16.44300, lng: -71.47950 },
    { id: 'inst-arequipa-73', name: 'I.E. 40010 Characato', code: 'IE-CH-073', district: 'Characato', niveles: ['primaria'], address: 'Calle San Juan 90, Characato', lat: -16.44500, lng: -71.47700 },
    { id: 'inst-arequipa-74', name: 'I.E. César Vallejo', code: 'IE-CH-074', district: 'Characato', niveles: ['primaria'], address: 'Calle Los Nogales 40, Characato', lat: -16.43850, lng: -71.47900 },
    { id: 'inst-arequipa-75', name: 'I.E.I. Semillitas del Saber', code: 'IEI-CH-075', district: 'Characato', niveles: ['inicial'], address: 'Calle Las Flores 70, Characato', lat: -16.44150, lng: -71.47550 },
    // Zona: Chiguata
    { id: 'inst-arequipa-76', name: 'I.E. San Martín de Porres', code: 'IE-CG-076', district: 'Chiguata', niveles: ['primaria', 'secundaria'], address: 'Av. Chiguata 200, Chiguata', lat: -16.39800, lng: -71.38300 },
    { id: 'inst-arequipa-77', name: 'I.E. 40200 Chiguata', code: 'IE-CG-077', district: 'Chiguata', niveles: ['secundaria'], address: 'Calle El Volcán 120, Chiguata', lat: -16.40100, lng: -71.38650 },
    { id: 'inst-arequipa-78', name: 'I.E. San Isidro Labrador', code: 'IE-CG-078', district: 'Chiguata', niveles: ['primaria'], address: 'Calle Los Andes 90, Chiguata', lat: -16.40300, lng: -71.38400 },
    { id: 'inst-arequipa-79', name: 'I.E. Túpac Amaru', code: 'IE-CG-079', district: 'Chiguata', niveles: ['primaria'], address: 'Av. Los Sauces 40, Chiguata', lat: -16.39650, lng: -71.38600 },
    { id: 'inst-arequipa-80', name: 'I.E.I. Angelitos de Chiguata', code: 'IEI-CG-080', district: 'Chiguata', niveles: ['inicial'], address: 'Calle Las Flores 30, Chiguata', lat: -16.39950, lng: -71.38250 },
    // Zona: Sabandia
    { id: 'inst-arequipa-81', name: 'I.E. Divino Maestro', code: 'IE-SB-081', district: 'Sabandia', niveles: ['primaria'], address: 'Av. Sabandia 150, Sabandia', lat: -16.43800, lng: -71.48500 },
    { id: 'inst-arequipa-82', name: 'I.E. 40325 Sabandia', code: 'IE-SB-082', district: 'Sabandia', niveles: ['secundaria'], address: 'Calle El Molino 80, Sabandia', lat: -16.44100, lng: -71.48850 },
    { id: 'inst-arequipa-83', name: 'I.E. Santa Bárbara', code: 'IE-SB-083', district: 'Sabandia', niveles: ['primaria', 'secundaria'], address: 'Calle Santa Bárbara 110, Sabandia', lat: -16.44300, lng: -71.48600 },
    { id: 'inst-arequipa-84', name: 'I.E. María Auxiliadora', code: 'IE-SB-084', district: 'Sabandia', niveles: ['primaria'], address: 'Av. Los Manzanos 60, Sabandia', lat: -16.43650, lng: -71.48800 },
    { id: 'inst-arequipa-85', name: 'I.E.I. Chispita', code: 'IEI-SB-085', district: 'Sabandia', niveles: ['inicial'], address: 'Calle Las Dalias 40, Sabandia', lat: -16.43950, lng: -71.48450 },
    // Zona: Sachaca
    { id: 'inst-arequipa-86', name: 'I.E. José Gálvez', code: 'IE-SA-086', district: 'Sachaca', niveles: ['primaria', 'secundaria'], address: 'Av. Sachaca 500, Sachaca', lat: -16.41600, lng: -71.55800 },
    { id: 'inst-arequipa-87', name: 'I.E. 40077 Sachaca', code: 'IE-SA-087', district: 'Sachaca', niveles: ['primaria'], address: 'Calle San Juan 210, Sachaca', lat: -16.41900, lng: -71.56150 },
    { id: 'inst-arequipa-88', name: 'I.E. San Juan Bautista', code: 'IE-SA-088', district: 'Sachaca', niveles: ['secundaria'], address: 'Av. Los Sauces 300, Sachaca', lat: -16.42100, lng: -71.55900 },
    { id: 'inst-arequipa-89', name: 'I.E. Perú Birf', code: 'IE-SA-089', district: 'Sachaca', niveles: ['primaria'], address: 'Calle Los Olivos 90, Sachaca', lat: -16.41450, lng: -71.56100 },
    { id: 'inst-arequipa-90', name: 'I.E.I. Mi Mundo Feliz', code: 'IEI-SA-090', district: 'Sachaca', niveles: ['inicial'], address: 'Calle Las Begonias 50, Sachaca', lat: -16.41750, lng: -71.55750 },
    // Zona: Mollebaya
    { id: 'inst-arequipa-91', name: 'I.E. 40550 Mollebaya', code: 'IE-MO-091', district: 'Mollebaya', niveles: ['primaria'], address: 'Av. Mollebaya 300, Mollebaya', lat: -16.44500, lng: -71.46600 },
    { id: 'inst-arequipa-92', name: 'I.E. San Antonio de Padua', code: 'IE-MO-092', district: 'Mollebaya', niveles: ['secundaria'], address: 'Calle Los Pinos 120, Mollebaya', lat: -16.44800, lng: -71.46950 },
    { id: 'inst-arequipa-93', name: 'I.E. María Inmaculada', code: 'IE-MO-093', district: 'Mollebaya', niveles: ['primaria', 'secundaria'], address: 'Calle La Merced 70, Mollebaya', lat: -16.45000, lng: -71.46700 },
    { id: 'inst-arequipa-94', name: 'I.E. Santa Rosa', code: 'IE-MO-094', district: 'Mollebaya', niveles: ['primaria'], address: 'Av. Los Álamos 30, Mollebaya', lat: -16.44350, lng: -71.46900 },
    { id: 'inst-arequipa-95', name: 'I.E.I. Pequeños Genios', code: 'IEI-MO-095', district: 'Mollebaya', niveles: ['inicial'], address: 'Calle Las Flores 60, Mollebaya', lat: -16.44650, lng: -71.46550 },
    // Zona: Quequeña
    { id: 'inst-arequipa-96', name: 'I.E. 40730 Quequeña', code: 'IE-QU-096', district: 'Quequeña', niveles: ['primaria'], address: 'Av. Quequeña 120, Quequeña', lat: -16.46800, lng: -71.46800 },
    { id: 'inst-arequipa-97', name: 'I.E. Sagrado Corazón de Jesús', code: 'IE-QU-097', district: 'Quequeña', niveles: ['secundaria'], address: 'Calle El Mirador 200, Quequeña', lat: -16.47100, lng: -71.47150 },
    { id: 'inst-arequipa-98', name: 'I.E. Luis Alberto Sánchez', code: 'IE-QU-098', district: 'Quequeña', niveles: ['primaria'], address: 'Calle Los Ángeles 70, Quequeña', lat: -16.47300, lng: -71.46900 },
    { id: 'inst-arequipa-99', name: 'I.E. Santa Cruz', code: 'IE-QU-099', district: 'Quequeña', niveles: ['primaria'], address: 'Av. Santa Cruz 90, Quequeña', lat: -16.46650, lng: -71.47100 },
    { id: 'inst-arequipa-100', name: 'I.E.I. Girasoles', code: 'IEI-QU-100', district: 'Quequeña', niveles: ['inicial'], address: 'Calle Las Rosas 40, Quequeña', lat: -16.46950, lng: -71.46750 },
    // Zona: Yarabamba
    { id: 'inst-arequipa-101', name: 'I.E. 40810 Yarabamba', code: 'IE-YB-101', district: 'Yarabamba', niveles: ['primaria'], address: 'Av. Yarabamba 100, Yarabamba', lat: -16.48000, lng: -71.49800 },
    { id: 'inst-arequipa-102', name: 'I.E. Santa Teresa de Ávila', code: 'IE-YB-102', district: 'Yarabamba', niveles: ['secundaria'], address: 'Calle Los Nogales 150, Yarabamba', lat: -16.48300, lng: -71.50150 },
    { id: 'inst-arequipa-103', name: 'I.E. Abraham Valdelomar', code: 'IE-YB-103', district: 'Yarabamba', niveles: ['primaria'], address: 'Calle Las Lomas 60, Yarabamba', lat: -16.48500, lng: -71.49900 },
    { id: 'inst-arequipa-104', name: 'I.E. Manuel Gonzales Prada', code: 'IE-YB-104', district: 'Yarabamba', niveles: ['primaria'], address: 'Av. Los Sauces 40, Yarabamba', lat: -16.47850, lng: -71.50100 },
    { id: 'inst-arequipa-105', name: 'I.E.I. Rositas', code: 'IEI-YB-105', district: 'Yarabamba', niveles: ['inicial'], address: 'Calle Las Flores 20, Yarabamba', lat: -16.48150, lng: -71.49750 },
    // Zona: La Joya
    { id: 'inst-arequipa-106', name: 'I.E. Horacio Zevallos Gámez', code: 'IE-LO-106', district: 'La Joya', niveles: ['secundaria'], address: 'Av. La Joya 800, La Joya', lat: -16.61800, lng: -71.69800 },
    { id: 'inst-arequipa-107', name: 'I.E. Túpac Amaru II', code: 'IE-LO-107', district: 'La Joya', niveles: ['primaria', 'secundaria'], address: 'Calle Los Andes 300, La Joya', lat: -16.62100, lng: -71.70150 },
    { id: 'inst-arequipa-108', name: 'I.E. 41000 La Joya', code: 'IE-LO-108', district: 'La Joya', niveles: ['primaria'], address: 'Av. Los Sauces 200, La Joya', lat: -16.62300, lng: -71.69900 },
    { id: 'inst-arequipa-109', name: 'I.E. José Abelardo Quiñones', code: 'IE-LO-109', district: 'La Joya', niveles: ['primaria'], address: 'Calle El Mirador 90, La Joya', lat: -16.61650, lng: -71.70100 },
    { id: 'inst-arequipa-110', name: 'I.E.I. Nueva Esperanza', code: 'IEI-LO-110', district: 'La Joya', niveles: ['inicial'], address: 'Calle Las Flores 40, La Joya', lat: -16.61950, lng: -71.69750 },
    // Zona: San Juan de Siguas
    { id: 'inst-arequipa-111', name: 'I.E. Simón Bolívar', code: 'IE-SS-111', district: 'San Juan de Siguas', niveles: ['primaria', 'secundaria'], address: 'Av. San Juan 200, San Juan de Siguas', lat: -16.39800, lng: -71.89800 },
    { id: 'inst-arequipa-112', name: 'I.E. 41200 San Juan de Siguas', code: 'IE-SS-112', district: 'San Juan de Siguas', niveles: ['primaria'], address: 'Calle El Valle 120, San Juan de Siguas', lat: -16.40100, lng: -71.90150 },
    { id: 'inst-arequipa-113', name: 'I.E. San Pedro', code: 'IE-SS-113', district: 'San Juan de Siguas', niveles: ['secundaria'], address: 'Calle Los Sauces 80, San Juan de Siguas', lat: -16.40300, lng: -71.89900 },
    { id: 'inst-arequipa-114', name: 'I.E. Santa Rosa', code: 'IE-SS-114', district: 'San Juan de Siguas', niveles: ['primaria'], address: 'Av. Los Álamos 60, San Juan de Siguas', lat: -16.39650, lng: -71.90100 },
    { id: 'inst-arequipa-115', name: 'I.E.I. Los Andes', code: 'IEI-SS-115', district: 'San Juan de Siguas', niveles: ['inicial'], address: 'Calle Las Flores 30, San Juan de Siguas', lat: -16.39950, lng: -71.89750 },
    // Zona: San Juan de Taracuí
    { id: 'inst-arequipa-116', name: 'I.E. 41550 Taracuí', code: 'IE-ST-116', district: 'San Juan de Taracuí', niveles: ['primaria'], address: 'Av. Taracuí 100, San Juan de Taracuí', lat: -16.29800, lng: -71.39800 },
    { id: 'inst-arequipa-117', name: 'I.E. Inca Garcilaso de la Vega', code: 'IE-ST-117', district: 'San Juan de Taracuí', niveles: ['secundaria'], address: 'Calle Los Andes 150, San Juan de Taracuí', lat: -16.30100, lng: -71.40150 },
    { id: 'inst-arequipa-118', name: 'I.E. San Juan Bautista', code: 'IE-ST-118', district: 'San Juan de Taracuí', niveles: ['primaria'], address: 'Calle Las Lomas 70, San Juan de Taracuí', lat: -16.30300, lng: -71.39900 },
    { id: 'inst-arequipa-119', name: 'I.E. Santa Rosa de Lima', code: 'IE-ST-119', district: 'San Juan de Taracuí', niveles: ['primaria'], address: 'Av. Los Sauces 40, San Juan de Taracuí', lat: -16.29650, lng: -71.40100 },
    { id: 'inst-arequipa-120', name: 'I.E.I. Semillitas', code: 'IEI-ST-120', district: 'San Juan de Taracuí', niveles: ['inicial'], address: 'Calle Las Flores 20, San Juan de Taracuí', lat: -16.29950, lng: -71.39750 },
    // Zona: Santa Isabel de Siguas
    { id: 'inst-arequipa-121', name: 'I.E. Simón Rodríguez', code: 'IE-SI-121', district: 'Santa Isabel de Siguas', niveles: ['primaria', 'secundaria'], address: 'Av. Santa Isabel 200, Santa Isabel de Siguas', lat: -16.42800, lng: -71.97800 },
    { id: 'inst-arequipa-122', name: 'I.E. 41600 Santa Isabel', code: 'IE-SI-122', district: 'Santa Isabel de Siguas', niveles: ['primaria'], address: 'Calle El Valle 120, Santa Isabel de Siguas', lat: -16.43100, lng: -71.98150 },
    { id: 'inst-arequipa-123', name: 'I.E. Santa Rosa de Lima', code: 'IE-SI-123', district: 'Santa Isabel de Siguas', niveles: ['secundaria'], address: 'Calle Los Sauces 80, Santa Isabel de Siguas', lat: -16.43300, lng: -71.97900 },
    { id: 'inst-arequipa-124', name: 'I.E. José Carlos Mariátegui', code: 'IE-SI-124', district: 'Santa Isabel de Siguas', niveles: ['primaria'], address: 'Av. Los Álamos 60, Santa Isabel de Siguas', lat: -16.42650, lng: -71.98100 },
    { id: 'inst-arequipa-125', name: 'I.E.I. Caritas Felices', code: 'IEI-SI-125', district: 'Santa Isabel de Siguas', niveles: ['inicial'], address: 'Calle Las Flores 30, Santa Isabel de Siguas', lat: -16.42950, lng: -71.97750 },
    // Zona: Santa Rita de Siguas
    { id: 'inst-arequipa-126', name: 'I.E. Santa Rita de Casia', code: 'IE-SR-126', district: 'Santa Rita de Siguas', niveles: ['primaria', 'secundaria'], address: 'Av. Santa Rita 300, Santa Rita de Siguas', lat: -16.47800, lng: -72.01800 },
    { id: 'inst-arequipa-127', name: 'I.E. 41700 Santa Rita', code: 'IE-SR-127', district: 'Santa Rita de Siguas', niveles: ['primaria'], address: 'Calle El Valle 140, Santa Rita de Siguas', lat: -16.48100, lng: -72.02150 },
    { id: 'inst-arequipa-128', name: 'I.E. José María Arguedas', code: 'IE-SR-128', district: 'Santa Rita de Siguas', niveles: ['secundaria'], address: 'Calle Los Sauces 90, Santa Rita de Siguas', lat: -16.48300, lng: -72.01900 },
    { id: 'inst-arequipa-129', name: 'I.E. Miguel Grau', code: 'IE-SR-129', district: 'Santa Rita de Siguas', niveles: ['primaria'], address: 'Av. Los Álamos 70, Santa Rita de Siguas', lat: -16.47650, lng: -72.02100 },
    { id: 'inst-arequipa-130', name: 'I.E.I. Nueva Esperanza', code: 'IEI-SR-130', district: 'Santa Rita de Siguas', niveles: ['inicial'], address: 'Calle Las Flores 40, Santa Rita de Siguas', lat: -16.47950, lng: -72.01750 }
  ];

  const DEMO_USERS = [
    { uid: 'u-super', name: 'Admin Plataforma', email: 'admin@viasegura.pe', password: 'demo123', role: ROLES.SUPERADMIN, institutionId: null },
    { uid: 'u-dir', name: 'Dir. Ana Torres', email: 'director@ie-mb.pe', password: 'demo123', role: ROLES.DIRECTOR, institutionId: 'inst-arequipa-01' },
    { uid: 'u-seg', name: 'Vigilante Luis Rojas', email: 'seguridad@ie-mb.pe', password: 'demo123', role: ROLES.SEGURIDAD, institutionId: 'inst-arequipa-01' },
    { uid: 'u-apod', name: 'Madre Julia Quispe', email: 'apoderado@ie-mb.pe', password: 'demo123', role: ROLES.APODERADO, institutionId: 'inst-arequipa-01' }
  ];

  const DEMO_STUDENTS = [
    { id: 's-01', name: 'Diego Quispe', grade: '4to Secundaria', institutionId: 'inst-arequipa-01', guardianId: 'u-apod' },
    { id: 's-02', name: 'Sofía Quispe', grade: '2do Primaria', institutionId: 'inst-arequipa-01', guardianId: 'u-apod' }
  ];

  const DEMO_CAMERAS = [
    { id: 'cam-01', name: 'Porton principal', code: 'CAM-001', institutionId: 'inst-arequipa-01', zone: 'Acceso A', lenses: 2, status: 'online', lastSeen: '2026-10-12T14:20:00Z', streamUrl: null, demo: true },
    { id: 'cam-02', name: 'Patio central', code: 'CAM-002', institutionId: 'inst-arequipa-01', zone: 'Patio', lenses: 1, status: 'disconnected', lastSeen: '2026-10-11T18:30:00Z', streamUrl: null, demo: true },
    { id: 'cam-03', name: 'Porton principal', code: 'CAM-003', institutionId: 'inst-arequipa-02', zone: 'Acceso', lenses: 2, status: 'online', lastSeen: '2026-10-12T14:18:00Z', streamUrl: null, demo: true },
    { id: 'cam-04', name: 'Patio de honor', code: 'CAM-004', institutionId: 'inst-arequipa-02', zone: 'Patio', lenses: 1, status: 'unknown', lastSeen: null, streamUrl: null, demo: true },
    { id: 'cam-05', name: 'Entrada secundaria', code: 'CAM-005', institutionId: 'inst-arequipa-03', zone: 'Acceso B', lenses: 1, status: 'online', lastSeen: '2026-10-12T14:19:00Z', streamUrl: null, demo: true },
    { id: 'cam-06', name: 'Patio trasero', code: 'CAM-006', institutionId: 'inst-arequipa-03', zone: 'Patio', lenses: 1, status: 'disconnected', lastSeen: '2026-10-10T09:05:00Z', streamUrl: null, demo: true },
    { id: 'cam-07', name: 'Porton principal', code: 'CAM-007', institutionId: 'inst-arequipa-04', zone: 'Acceso', lenses: 2, status: 'online', lastSeen: '2026-10-12T14:21:00Z', streamUrl: null, demo: true },
    { id: 'cam-08', name: 'Pasillo A', code: 'CAM-008', institutionId: 'inst-arequipa-05', zone: 'Pasillo', lenses: 1, status: 'unknown', lastSeen: null, streamUrl: null, demo: true },
    { id: 'cam-09', name: 'Porton principal', code: 'CAM-009', institutionId: 'inst-arequipa-06', zone: 'Acceso', lenses: 2, status: 'online', lastSeen: '2026-10-12T14:17:00Z', streamUrl: null, demo: true }
  ];

  const DEMO_INCIDENTS = [
    { id: 'inc-01', institutionId: 'inst-arequipa-01', category: 'seguridad_accesos', description: 'Persona ajena intentó ingresar por el portón posterior.', zone: 'Acceso B', priority: 'alta', status: 'en_seguimiento', createdAt: '2026-10-12T11:20:00Z', reportedBy: 'Vigilante Luis Rojas' }
  ];

  // ===========================================================================
  // data/repositories.js
  // ===========================================================================
  const AuthRepository = {
    signIn(email, password) {
      const fb = window.ViaSeguraFirebase;
      // Si Firebase esta configurado y listo, se usa el backend real.
      if (fb && fb.isReady()) {
        return fb.signIn(email, password).then(function (fbUser) {
          return fb.collection('users').doc(fbUser.uid).get().then(function (doc) {
            const profile = doc.exists ? (doc.data() || {}) : {};
            return {
              uid: fbUser.uid,
              name: profile.name || fbUser.email || 'Usuario',
              role: profile.role || ROLES.ESTUDIANTE,
              institutionId: profile.institutionId || null
            };
          });
        }).catch(function (e) {
          const err = new Error('No se pudo iniciar sesión.');
          err.userMessage = e && e.code === 'auth/wrong-password'
            ? 'Correo o contraseña incorrectos.'
            : 'No se pudo iniciar sesión. Verifica tus datos.';
          throw err;
        });
      }
      // Modo demostracion local (sin backend configurado).
      return delay(500).then(function () {
        const found = DEMO_USERS.filter(function (u) {
          return u.email.toLowerCase() === String(email || '').trim().toLowerCase() &&
                 u.password === password;
        })[0];
        if (!found) {
          const err = new Error('Correo o contraseña incorrectos.');
          err.userMessage = 'Correo o contraseña incorrectos.';
          throw err;
        }
        return sanitizeUser(found);
      });
    },
    signOut() {
      const fb = window.ViaSeguraFirebase;
      if (fb && fb.isReady()) return fb.signOut();
      return Promise.resolve(true);
    },
    resetPassword(email) {
      if (!Validators.email(email)) {
        return Promise.reject(new Error('Correo inválido.'));
      }
      const fb = window.ViaSeguraFirebase;
      if (fb && fb.isReady()) {
        return fb.authSendPasswordReset
          ? fb.authSendPasswordReset(email)
          : Promise.resolve(true);
      }
      return Promise.resolve(true);
    }
  };

  function sanitizeUser(u) {
    return { uid: u.uid, name: u.name, role: u.role, institutionId: u.institutionId };
  }

  // ===========================================================================
  // data/store.js  (estado en memoria; hidratable desde el backend)
  // ===========================================================================
  const Store = {
    state: {
      user: null,
      institutions: DEMO_INSTITUTIONS.slice(),
      students: DEMO_STUDENTS.slice(),
      cameras: DEMO_CAMERAS.slice(),
      incidents: DEMO_INCIDENTS.slice(),
      selectedInstitutionId: null,
      institutionLevel: 'todas',
      institutionZone: 'todas',
      institutionZonesOpen: false,
      safeSchoolId: null,
      safeType: 'todos',
      grade: null,
      gps: null,
      gpsError: null,
      tripStart: null,
      geoRadius: 500
    },
    reset() { Store.state.user = null; },
    camerasForUser() {
      const u = Store.state.user;
      if (!u) return [];
      if (u.role === ROLES.SUPERADMIN) return Store.state.cameras.slice();
      return Store.state.cameras.filter(function (c) { return c.institutionId === u.institutionId; });
    },
    incidentsForUser() {
      const u = Store.state.user;
      if (!u) return [];
      if (u.role === ROLES.SUPERADMIN) return Store.state.incidents.slice();
      return Store.state.incidents.filter(function (i) { return i.institutionId === u.institutionId; });
    },
    studentsForUser() {
      const u = Store.state.user;
      if (!u) return [];
      if (u.role === ROLES.APODERADO) return Store.state.students.filter(function (s) { return s.guardianId === u.uid; });
      if (u.role === ROLES.SUPERADMIN) return Store.state.students.slice();
      return Store.state.students.filter(function (s) { return s.institutionId === u.institutionId; });
    },
    institutionName(id) {
      const i = Store.institution(id);
      return i ? i.name : 'Sin institución';
    },
    institution(id) {
      return Store.state.institutions.filter(function (x) { return x.id === id; })[0] || null;
    },
    institutions() {
      return Store.state.institutions.slice();
    }
  };

  // ===========================================================================
  // helpers
  // ===========================================================================
  function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function el(id) { return document.getElementById(id); }
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function clearChildren(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function formatDate(iso) {
    if (!iso) return 'Sin registro';
    try { return new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }); }
    catch (e) { return iso; }
  }

  // ===========================================================================
  // ui/feedback.js
  // ===========================================================================
  function toast(message, kind) {
    let node = el('vs-toast');
    if (!node) {
      node = document.createElement('div');
      node.id = 'vs-toast';
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.className = 'vs-toast ' + (kind || 'info') + ' show';
    clearTimeout(node._t);
    node._t = setTimeout(function () { node.className = 'vs-toast ' + (kind || 'info'); }, 2600);
  }

  function renderErrors(container, errors) {
    if (!container) return;
    if (!errors || !errors.length) {
      container.textContent = '';
      container.style.display = 'none';
      return;
    }
    container.innerHTML = errors.map(function (e) { return '• ' + escapeHtml(e); }).join('<br>');
    container.style.display = 'block';
  }

  // ===========================================================================
  // ui/cameras.js
  // ===========================================================================
  function statusBadge(status) {
    const map = {
      connected: '<span class="status-badge status-ok">Conectada</span>',
      disconnected: '<span class="status-badge status-err">Desconectada</span>',
      unknown: '<span class="status-badge status-warn">Sin información</span>'
    };
    return map[status] || map.unknown;
  }

  function cameraPlaceholder(cam) {
    if (!cam.streamUrl) {
      return '<div class="empty" style="border:1px dashed var(--border); border-radius:8px;">' +
        'Vista no disponible. Estado de demostración: no hay una transmisión real conectada.</div>';
    }
    return '<div class="empty">Conectando al flujo autorizado…</div>';
  }

  function camHeatPoints(cam) {
    const seed = hashString(cam.id || 'cam');
    const specs = [
      { cls: 'heat-high', top: 26 + (seed % 10), left: 30 + (seed % 12) },
      { cls: 'heat-medium', top: 52 + ((seed >> 2) % 10), left: 58 + ((seed >> 3) % 12) },
      { cls: 'heat-medium', top: 40 + ((seed >> 4) % 10), left: 70 - ((seed >> 1) % 10) },
      { cls: 'heat-low', top: 64 + ((seed >> 5) % 8), left: 26 + ((seed >> 6) % 12) }
    ];
    return specs.map(function (s) {
      return '<span class="heatmap-point ' + s.cls + '" style="top:' + s.top + '%; left:' + s.left + '%;"></span>';
    }).join('');
  }

  function cameraHeatmapHtml(cam) {
    const inst = Store.institution(cam.institutionId) || currentInstitution() || {};
    const lat = typeof inst.lat === 'number' ? inst.lat : -16.4;
    const lng = typeof inst.lng === 'number' ? inst.lng : -71.53;
    return '<div class="camera-heat">' +
      '<iframe class="camera-heat-frame" title="Mapa de calor de incidencias" loading="lazy" ' +
        'referrerpolicy="no-referrer-when-downgrade" src="' + placeEmbedUrl(lat, lng) + '"></iframe>' +
      camHeatPoints(cam) +
      '<div class="camera-heat-legend">' +
        '<span><i style="background:#e53935"></i> Alta</span>' +
        '<span><i style="background:#fb8c00"></i> Media</span>' +
        '<span><i style="background:#43a047"></i> Baja</span>' +
      '</div>' +
    '</div>';
  }

  function cameraLiveHtml(cam) {
    const online = cam.status === 'online' || cam.status === 'connected';
    const badge = online
      ? '<span class="cam-rec"><i></i>EN VIVO</span>'
      : '<span class="cam-rec" style="background:rgba(100,116,139,.85);"><i style="animation:none;opacity:.7;"></i>' +
        escapeHtml(humanCameraStatus(cam.status)) + '</span>';
    return '<div class="camera-live">' + badge + cameraPlaceholder(cam) + '</div>';
  }

  function humanCameraStatus(s) {
    const map = { online: 'En línea', connected: 'Conectada', disconnected: 'Desconectada', unknown: 'Sin señal' };
    return map[s] || 'Sin señal';
  }

  function renderCameras(container) {
    if (!container) return;
    const cameras = Store.camerasForUser();
    clearChildren(container);
    if (!cameras.length) {
      container.innerHTML = '<p class="empty">No hay cámaras asociadas a tu institución.</p>';
      return;
    }
    cameras.forEach(function (cam) {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.marginBottom = '12px';
      card.setAttribute('data-cam-id', cam.id);
      card.innerHTML =
        '<div style="display:flex; justify-content:space-between; align-items:center;">' +
          '<div><div style="font-weight:700;">' + escapeHtml(cam.name) + '</div>' +
          '<div style="font-size:12px; color:var(--text-muted);">' + escapeHtml(cam.code) +
          ' · ' + escapeHtml(cam.zone) + ' · ' + cam.lenses + ' lente(s)</div></div>' +
          statusBadge(cam.status) +
        '</div>' +
        '<div style="font-size:12px; color:var(--text-muted); margin-top:8px;">Última conexión: ' +
          escapeHtml(formatDate(cam.lastSeen)) + '</div>' +
        '<div class="cam-tabs" role="tablist">' +
          '<button type="button" class="cam-tab active" data-view="directo">📹 En directo</button>' +
          '<button type="button" class="cam-tab" data-view="calor">🔥 Mapa de calor</button>' +
        '</div>' +
        '<div class="camera-view">' +
          '<div class="cam-pane" data-pane="directo">' + cameraLiveHtml(cam) + '</div>' +
          '<div class="cam-pane" data-pane="calor" hidden></div>' +
        '</div>';
      container.appendChild(card);
    });
    bindCameraToggles(container);
  }

  function bindCameraToggles(container) {
    container.querySelectorAll('.cam-tab').forEach(function (tab) {
      tab.onclick = function () {
        const card = tab.closest('.card');
        if (!card) return;
        const view = card.querySelector('.camera-view');
        const viewName = tab.getAttribute('data-view');
        card.querySelectorAll('.cam-tab').forEach(function (t) {
          t.classList.toggle('active', t === tab);
        });
        view.querySelectorAll('.cam-pane').forEach(function (pane) {
          pane.hidden = pane.getAttribute('data-pane') !== viewName;
        });
        if (viewName === 'calor') {
          const heatPane = view.querySelector('[data-pane="calor"]');
          if (heatPane && !heatPane.querySelector('.camera-heat')) {
            const camId = card.getAttribute('data-cam-id');
            const cam = Store.camerasForUser().find(function (c) { return c.id === camId; }) ||
              { id: camId, institutionId: Store.state.selectedInstitutionId };
            heatPane.innerHTML = cameraHeatmapHtml(cam);
          }
        }
      };
    });
  }

  // ===========================================================================
  // ui/incidents.js
  // ===========================================================================
  function humanCategory(c) {
    const map = {
      seguridad_accesos: 'Seguridad en accesos',
      aglomeraciones: 'Aglomeraciones',
      fallas_camaras: 'Fallas de cámaras',
      situacion_riesgo: 'Situación de riesgo'
    };
    return map[c] || c || 'General';
  }
  function humanStatus(s) {
    const map = { abierta: 'Abierta', en_seguimiento: 'En seguimiento', cerrada: 'Cerrada' };
    return map[s] || s || 'Abierta';
  }

  function renderIncidentList(container) {
    if (!container) return;
    const incidents = Store.incidentsForUser();
    clearChildren(container);
    if (!incidents.length) {
      container.innerHTML = '<p class="empty">Sin incidencias registradas.</p>';
      return;
    }
    incidents.forEach(function (inc) {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.marginBottom = '10px';
      const prioClass = inc.priority === 'alta' ? 'status-err' : (inc.priority === 'media' ? 'status-warn' : 'status-ok');
      card.innerHTML =
        '<div style="display:flex; justify-content:space-between;">' +
          '<div style="font-weight:700;">' + escapeHtml(humanCategory(inc.category)) + '</div>' +
          '<span class="status-badge ' + prioClass + '">' + escapeHtml(inc.priority || 'media') + '</span>' +
        '</div>' +
        '<div style="font-size:12px; color:var(--text-muted); margin:6px 0;">' +
          escapeHtml(formatDate(inc.createdAt)) + ' · ' + escapeHtml(inc.reportedBy || '') + '</div>' +
        '<div style="font-size:13px;">' + escapeHtml(inc.description) + '</div>' +
        '<div style="font-size:12px; margin-top:6px;">Estado: <strong>' + escapeHtml(humanStatus(inc.status)) + '</strong></div>';
      container.appendChild(card);
    });
  }

  function bindIncidentForm() {
    const form = el('incident-form');
    if (!form) return;
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      const errorsBox = el('incident-errors');
      const formData = {
        category: (qs('#incident-category', form) || {}).value || '',
        description: (qs('#incident-description', form) || {}).value || ''
      };
      const errors = Validators.validateIncident(formData);
      renderErrors(errorsBox, errors);
      if (errors.length) return;

      const u = Store.state.user;
      Store.state.incidents.unshift({
        id: 'inc-' + Date.now(),
        institutionId: u ? u.institutionId : null,
        category: formData.category,
        description: formData.description,
        priority: (qs('#incident-priority', form) || {}).value || 'media',
        status: 'abierta',
        createdAt: new Date().toISOString(),
        reportedBy: u ? u.name : 'Anónimo'
      });
      renderIncidentList(document.querySelector('[data-list="incidents"]'));
      toast('Incidencia registrada correctamente.', 'success');
      form.reset();
    });
  }

  // ===========================================================================
  // ui/parents.js
  // ===========================================================================
  function renderParentHome() {
    const u = Store.state.user;
    const apodName = (u && (u.apoderadoNombre || u.name)) ? (u.apoderadoNombre || u.name) : null;
    const apodFirst = apodName ? apodName.split(' ')[0] : 'Apoderado';
    const children = Store.studentsForUser();
    const childFirst = (children[0] && children[0].name) ? children[0].name.split(' ')[0] : (u && u.name ? u.name.split(' ')[0] : 'tu hijo/a');
    document.querySelectorAll('[data-padre-name]').forEach(function (n) { n.textContent = 'Hola, ' + apodFirst; });
    document.querySelectorAll('[data-padre-child]').forEach(function (n) { n.textContent = 'Acompañando a ' + childFirst; });
    document.querySelectorAll('[data-padre-child-name]').forEach(function (n) { n.textContent = childFirst; });
    const list = document.querySelector('[data-list="children"]');
    if (list) {
      clearChildren(list);
      if (!children.length) {
        list.innerHTML = '<p class="empty">No tienes estudiantes asociados.</p>';
      } else {
        children.forEach(function (s) {
          const card = document.createElement('div');
          card.className = 'card';
          card.style.marginBottom = '10px';
          card.innerHTML =
            '<div style="font-weight:700;">' + escapeHtml(s.name) + '</div>' +
            '<div style="font-size:12px; color:var(--text-muted);">' + escapeHtml(s.grade) +
            ' · ' + escapeHtml(Store.institutionName(s.institutionId)) + '</div>';
          list.appendChild(card);
        });
      }
    }
    const events = document.querySelector('[data-list="child-events"]');
    if (events) {
      events.innerHTML = '<p class="empty">Aún no hay eventos fiables de ingreso/salida registrados hoy.</p>';
    }
  }

  // ===========================================================================
  // ui/panel.js
  // ===========================================================================
  function renderInstitutionalPanel() {
    const u = Store.state.user;
    const title = document.querySelector('[data-panel-title]');
    if (title && u) title.textContent = Store.institutionName(u.institutionId) || 'Panel institucional';
    renderCameras(document.querySelector('[data-list="cameras"]'));
    renderIncidentList(document.querySelector('[data-list="incidents"]'));
    const stats = document.querySelector('[data-list="stats"]');
    if (stats) {
      const cams = Store.camerasForUser();
      const incs = Store.incidentsForUser();
      stats.innerHTML =
        '<div class="card" style="text-align:center;"><div style="font-size:22px; font-weight:800;">' + cams.length + '</div><div style="font-size:11px; color:var(--text-muted);">Cámaras</div></div>' +
        '<div class="card" style="text-align:center;"><div style="font-size:22px; font-weight:800;">' + cams.filter(function (c) { return c.status === 'connected'; }).length + '</div><div style="font-size:11px; color:var(--text-muted);">Conectadas</div></div>' +
        '<div class="card" style="text-align:center;"><div style="font-size:22px; font-weight:800;">' + incs.length + '</div><div style="font-size:11px; color:var(--text-muted);">Incidencias</div></div>';
    }
  }

  // ===========================================================================
  // ui/institutions.js
  // ===========================================================================
  function instNiveles(inst) {
    if (!inst) return [];
    if (Array.isArray(inst.niveles)) return inst.niveles.filter(Boolean);
    if (Array.isArray(inst.nivelesLevels)) return inst.nivelesLevels.filter(Boolean);
    if (inst.nivel) return [inst.nivel];
    return [];
  }

  function humanLevel(nivel) {
    if (nivel === 'inicial') return 'Inicial';
    if (nivel === 'primaria') return 'Primaria';
    if (nivel === 'secundaria') return 'Secundaria';
    return 'General';
  }

  function humanLevels(niveles) {
    if (!niveles || !niveles.length) return 'General';
    return niveles.map(humanLevel).join(' + ');
  }

  function highestLevel(inst) {
    const niv = instNiveles(inst);
    if (niv.indexOf('secundaria') >= 0) return 'secundaria';
    if (niv.indexOf('primaria') >= 0) return 'primaria';
    if (niv.indexOf('inicial') >= 0) return 'inicial';
    return 'primaria';
  }

  function photoForInstitution(inst) {
    const pool = (typeof window !== 'undefined' && window.VIA_SEGURA_SCHOOL_PHOTOS) || null;
    if (!pool || !pool.length) return null;
    return pool[Math.abs(hashString(inst && inst.id ? inst.id : '')) % pool.length];
  }

  function institutionImage(inst) {
    const p = photoForInstitution(inst);
    if (p && p.src) return p.src;
    return 'img/colegio-' + highestLevel(inst) + '.jpg';
  }

  function institutionPhotoCredit(inst) {
    const p = photoForInstitution(inst);
    if (p && p.title) {
      return 'Foto referencial: ' + p.title + ' · Wikimedia Commons (' + (p.license || 'CC') + ')';
    }
    const level = highestLevel(inst);
    if (level === 'secundaria') return 'Foto referencial: Colegio José María Arguedas, San Sebastián de Sacraca · Wikimedia Commons (CC BY-SA 4.0)';
    if (level === 'inicial') return 'Foto referencial: I.E.I. Divino Niño Jesús · Wikimedia Commons (CC BY-SA 4.0)';
    return 'Foto referencial: Escuela Primaria de Pariamarca · Wikimedia Commons (CC BY-SA 4.0)';
  }

  function poiPhoto(type, key) {
    const db = (typeof window !== 'undefined' && window.VIA_SEGURA_POI_PHOTOS) || null;
    if (!db || !db[type] || !db[type].length) return null;
    return db[type][Math.abs(hashString((key || '') + '|' + type)) % db[type].length] || null;
  }

  function safePointPhoto(point, inst) {
    if (point.type === 'colegio') {
      const src = institutionImage(inst);
      const p = photoForInstitution(inst);
      return { src: src, title: p ? p.title : '', license: p ? p.license : '', artist: p ? p.artist : '' };
    }
    return poiPhoto(point.type, point.name);
  }

  function applyInstitutionFilter() {
    const search = el('institution-search');
    const q = search ? search.value.toLowerCase().trim() : '';
    const level = Store.state.institutionLevel || 'todas';
    const zone = Store.state.institutionZone || 'todas';
    document.querySelectorAll('[data-list="institutions"] .institution-item').forEach(function (n) {
      const niv = (n.getAttribute('data-levels') || n.getAttribute('data-level') || '').split(' ');
      const okLevel = level === 'todas' || niv.indexOf(level) >= 0;
      const okZone = zone === 'todas' || n.getAttribute('data-zone') === zone;
      const okText = !q || (n.textContent || '').toLowerCase().indexOf(q) >= 0;
      n.style.display = (okLevel && okZone && okText) ? '' : 'none';
    });
  }

  function renderInstitutions(container) {
    if (!container) return;
    const institutions = Store.institutions();
    clearChildren(container);
    if (!institutions.length) {
      container.innerHTML = '<p class="empty">No hay instituciones registradas.</p>';
      return;
    }
    institutions.forEach(function (inst, index) {
      const niv = instNiveles(inst);
      const chosenId = Store.state.selectedInstitutionId;
      const isChosen = chosenId ? chosenId === inst.id : index === 0;
      const item = document.createElement('div');
      item.className = 'institution-item' + (isChosen ? ' selected' : '');
      item.setAttribute('data-institution-id', inst.id);
      item.setAttribute('data-levels', niv.join(' '));
      item.setAttribute('data-level', niv[0] || 'general');
      item.setAttribute('data-zone', inst.district || 'otro');
      item.innerHTML =
        '<div class="inst-icon"><img class="inst-icon-img" src="' + institutionImage(inst) + '" alt=""></div>' +
        '<div style="flex:1; min-width:0;">' +
          '<div style="font-size:14px; font-weight:600;">' + escapeHtml(inst.name) +
          ' <span class="chip chip-neutral" style="font-size:10px; padding:2px 6px;">' + escapeHtml(humanLevels(niv)) + '</span></div>' +
          '<div class="body-sm">' + escapeHtml(inst.district) + ' · ' + escapeHtml(inst.address) + '</div>' +
        '</div>' +
        '<div class="inst-check">' + (isChosen ? '<div class="inst-check-dot"></div>' : '') + '</div>';
      item.addEventListener('click', function () {
        container.querySelectorAll('.institution-item').forEach(function (n) {
          n.classList.remove('selected');
          const c = n.querySelector('.inst-check');
          if (c) c.innerHTML = '';
        });
        item.classList.add('selected');
        const check = item.querySelector('.inst-check');
        if (check) check.innerHTML = '<div class="inst-check-dot"></div>';
        Store.state.selectedInstitutionId = inst.id;
        Store.state.safeSchoolId = inst.id;
        Store.state.grade = null;
        renderGradesForInstitution(inst);
        renderProfile();
      });
      container.appendChild(item);
    });
    applyInstitutionFilter();
    renderGradesForInstitution();
  }

  function setInstitutionLevel(level, chip) {
    Store.state.institutionLevel = level || 'todas';
    document.querySelectorAll('[data-list="institution-levels"] .level-chip').forEach(function (c) {
      c.classList.toggle('active', c === chip);
    });
    applyInstitutionFilter();
  }

  function buildZoneChips() {
    const box = document.querySelector('[data-list="institution-zones"]');
    if (!box) return;
    const zones = [];
    Store.institutions().forEach(function (inst) {
      if (inst.district && zones.indexOf(inst.district) < 0) zones.push(inst.district);
    });
    zones.sort();
    clearChildren(box);
    // Botón visible siempre: al tocarlo se despliegan las zonas.
    const all = document.createElement('button');
    all.type = 'button';
    all.className = 'level-chip zone-toggle' + (Store.state.institutionZone === 'todas' ? ' active' : '');
    all.setAttribute('data-zone', 'todas');
    all.textContent = 'Todas las zonas';
    box.appendChild(all);

    const list = document.createElement('div');
    list.className = 'zone-list';
    box.className = 'level-chips zone-chips' + (Store.state.institutionZonesOpen ? ' open' : '');
    box.appendChild(list);
    zones.forEach(function (z) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'level-chip';
      b.setAttribute('data-zone', z);
      b.textContent = z;
      list.appendChild(b);
    });
    box.querySelectorAll('.level-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        if (chip.classList.contains('zone-toggle')) {
          // El botón "Todas las zonas" reinicia el filtro y despliega la lista.
          setInstitutionZone('todas', chip);
          Store.state.institutionZonesOpen = !Store.state.institutionZonesOpen;
          box.classList.toggle('open', Store.state.institutionZonesOpen);
          return;
        }
        setInstitutionZone(chip.getAttribute('data-zone'), chip);
        Store.state.institutionZonesOpen = false;
        box.classList.remove('open');
      });
    });
  }

  function setInstitutionZone(zone, chip) {
    Store.state.institutionZone = zone || 'todas';
    document.querySelectorAll('[data-list="institution-zones"] .level-chip').forEach(function (c) {
      c.classList.toggle('active', c === chip);
    });
    applyInstitutionFilter();
  }

  const GRADE_OPTIONS = {
    inicial: ['3 años', '4 años', '5 años'],
    primaria: ['1° de Primaria', '2° de Primaria', '3° de Primaria', '4° de Primaria', '5° de Primaria', '6° de Primaria'],
    secundaria: ['1° de Secundaria', '2° de Secundaria', '3° de Secundaria', '4° de Secundaria', '5° de Secundaria']
  };

  function gradesForInstitution(inst) {
    const niveles = instNiveles(inst);
    const list = [];
    niveles.forEach(function (niv) {
      (GRADE_OPTIONS[niv] || []).forEach(function (g) {
        if (list.indexOf(g) < 0) list.push(g);
      });
    });
    return list;
  }

  function renderGradesForInstitution(inst) {
    const select = el('reg3-grade');
    if (!select) return;
    const target = inst || Store.institution(Store.state.selectedInstitutionId);
    const list = target ? gradesForInstitution(target) : [];
    clearChildren(select);
    if (!list.length) {
      const opt = document.createElement('option');
      opt.textContent = 'Selecciona un colegio';
      select.appendChild(opt);
      return;
    }
    list.forEach(function (g) {
      const opt = document.createElement('option');
      opt.textContent = g;
      select.appendChild(opt);
    });
  }

  function bindInstitutions() {
    renderInstitutions(document.querySelector('[data-list="institutions"]'));
    buildZoneChips();
    const search = el('institution-search');
    if (search) {
      search.addEventListener('input', function () { applyInstitutionFilter(); });
    }
    document.querySelectorAll('[data-list="institution-levels"] .level-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        setInstitutionLevel(chip.getAttribute('data-level'), chip);
      });
    });
    const gradeSelect = el('reg3-grade');
    if (gradeSelect) {
      gradeSelect.addEventListener('change', function () {
        Store.state.grade = gradeSelect.value;
        renderProfile();
      });
    }
  }

  // ===========================================================================
  // ui/profile.js
  // ===========================================================================
  function profileInstitution() {
    const insts = Store.institutions();
    const id = Store.state.selectedInstitutionId;
    const found = insts.filter(function (i) { return i.id === id; })[0];
    return found || insts[0] || null;
  }

  function renderUserNames() {
    const u = Store.state.user;
    const fullName = (u && u.name) ? u.name : 'Estudiante';
    const first = fullName.split(' ')[0];
    const initials = fullName.trim() ? fullName.trim().split(/\s+/).map(function (p) { return p[0]; }).join('').slice(0, 2).toUpperCase() : 'V';
    document.querySelectorAll('[data-profile-name], [data-alerta-name]').forEach(function (el) { el.textContent = fullName; });
    const av = document.querySelector('[data-profile-avatar]');
    if (av) av.textContent = initials;
    document.querySelectorAll('[data-home-name], [data-emerg-name]').forEach(function (el) { el.textContent = 'Hola, ' + first; });
    document.querySelectorAll('[data-notif-child]').forEach(function (el) { el.textContent = first + ' salió del colegio a las 1:45 PM.'; });
    document.querySelectorAll('[data-padre-child-name]').forEach(function (el) { el.textContent = first; });
    document.querySelectorAll('[data-padre-alert-child]').forEach(function (el) { el.textContent = first + ' ha enviado una alerta'; });
    document.querySelectorAll('[data-padre-call-child]').forEach(function (el) { el.textContent = '📞 LLAMAR A ' + first.toUpperCase(); });
  }

  function renderProfile() {
    const inst = profileInstitution();
    const u = Store.state.user;
    renderUserNames();
    if (!inst) return;
    document.querySelectorAll('[data-profile-institution]').forEach(function (n) { n.textContent = inst.name; });
    const zoneEl = document.querySelector('[data-profile-zone]');
    if (zoneEl) zoneEl.textContent = (inst.district || 'Arequipa') + ', Arequipa';
    const codeEl = document.querySelector('[data-profile-code]');
    if (codeEl) codeEl.textContent = inst.code || '—';
    const photo = institutionImage(inst);
    document.querySelectorAll('[data-home-photo], [data-profile-photo]').forEach(function (n) { n.setAttribute('src', photo); });
    const creditEl = document.querySelector('[data-profile-credit]');
    if (creditEl) creditEl.textContent = institutionPhotoCredit(inst);
    const homeInst = document.querySelector('[data-home-institution]');
    if (homeInst) homeInst.textContent = inst.name;
    const homeSub = document.querySelector('[data-home-subtitle]');
    if (homeSub) homeSub.textContent = inst.name + ' · ' + inst.district + ', Arequipa';
    const gradeEl = document.querySelector('[data-profile-grade]');
    if (gradeEl) {
      const g = Store.state.grade;
      gradeEl.textContent = 'Estudiante · ' + (g || humanLevels(instNiveles(inst)));
    }
  }

  // ===========================================================================
  // devices/esp32.js  ·  Vinculo con el modulo ESP32 (Bluetooth / Wi-Fi / USB)
  // ---------------------------------------------------------------------------
  // El modulo lleva GPS + boton. La app le envia alertas y recibe ubicacion.
  // Punto de extension real: el bridge nativo `window.ViaSeguraESP32` (BLE,
  // TCP/Wi-Fi o USB serial). Si no existe, se usa una simulacion de demostracion.
  // ===========================================================================
  const ESP32_METHODS = {
    ble: { label: 'Bluetooth', icon: '📶', hint: 'Empareja por Bluetooth Low Energy (BLE).' },
    wifi: { label: 'Wi-Fi', icon: '📡', hint: 'Conecta por la red Wi-Fi del colegio o casa.' },
    usb: { label: 'USB', icon: '🔌', hint: 'Conecta por cable USB (serial).' }
  };

  function esp32State() {
    if (!Store.state.esp32) {
      Store.state.esp32 = {
        method: 'ble', status: 'off', device: null,
        battery: null, rssi: null,
        autoStart: false, shareLoc: true, syncTime: true
      };
    }
    return Store.state.esp32;
  }

  function esp32DevicePool(method) {
    if (method === 'wifi') return ['ViaSegura-GPS-01', 'ViaSegura-GPS-02', 'Aula-3B-ESP32'];
    if (method === 'usb') return ['ESP32 (CP2102)', 'ESP32-S3 (COM5)'];
    return ['ViaSegura-Wear-A1', 'ViaSegura-Wear-B2', 'ESP32-BLE-3C'];
  }

  function esp32Scan(cb) {
    const st = esp32State();
    const bridge = (typeof window !== 'undefined' && window.ViaSeguraESP32) || null;
    if (bridge && typeof bridge.scan === 'function') {
      try {
        bridge.scan(st.method, function (list) { cb(list || []); });
        return;
      } catch (e) { /* cae a simulacion */ }
    }
    const pool = esp32DevicePool(st.method);
    setTimeout(function () {
      cb(pool.map(function (name, i) {
        return { id: st.method + '-' + i, name: name, rssi: -38 - Math.floor(Math.random() * 45) };
      }));
    }, 900);
  }

  function esp32Connect(device) {
    const st = esp32State();
    const bridge = (typeof window !== 'undefined' && window.ViaSeguraESP32) || null;
    st.status = 'connecting';
    st.device = device;
    renderEsp32();
    const done = function () {
      st.status = 'on';
      st.rssi = device && typeof device.rssi === 'number' ? device.rssi : -55;
      st.battery = 60 + Math.floor(Math.random() * 40);
      renderEsp32();
      toast('Dispositivo ' + (device && device.name ? device.name : 'ESP32') + ' vinculado', 'success');
    };
    if (bridge && typeof bridge.connect === 'function') {
      try { bridge.connect(device.id, done); return; } catch (e) { /* noop */ }
    }
    setTimeout(done, 1100);
  }

  function esp32Disconnect() {
    const st = esp32State();
    const bridge = (typeof window !== 'undefined' && window.ViaSeguraESP32) || null;
    if (bridge && typeof bridge.disconnect === 'function') { try { bridge.disconnect(); } catch (e) { /* noop */ } }
    st.status = 'off';
    st.device = null;
    st.rssi = null;
    st.battery = null;
    const list = el('esp32-device-list') || document.querySelector('[data-list="esp32-devices"]');
    if (list) clearChildren(list);
    renderEsp32();
    toast('Dispositivo desvinculado', 'info');
  }

  function esp32DeviceCard(device) {
    const card = document.createElement('div');
    card.className = 'card card-row';
    card.style.marginBottom = '8px';
    const bars = device.rssi > -55 ? 'Excelente' : device.rssi > -75 ? 'Buena' : 'Débil';
    card.innerHTML =
      '<div class="card-icon blue">📶</div>' +
      '<div style="flex:1;">' +
      '<div class="body" style="font-weight:600;">' + escapeHtml(device.name) + '</div>' +
      '<div class="body-sm">Señal ' + bars + ' · ' + device.rssi + ' dBm</div>' +
      '</div>';
    const btn = document.createElement('button');
    btn.className = 'btn btn-outline btn-sm';
    btn.type = 'button';
    btn.textContent = 'Vincular';
    btn.addEventListener('click', function () { esp32Connect(device); });
    card.appendChild(btn);
    return card;
  }

  function renderEsp32() {
    const st = esp32State();
    const nameEl = el('esp32-device-name');
    const detailEl = el('esp32-device-detail');
    const statusEl = el('esp32-status');
    const rssiEl = el('esp32-rssi');
    const batEl = el('esp32-battery');
    const hintEl = el('esp32-hint');
    if (nameEl) nameEl.textContent = st.device ? st.device.name : 'Sin dispositivo';
    if (detailEl) {
      detailEl.textContent = st.device
        ? ('Vinculado por ' + (ESP32_METHODS[st.method] || {}).label)
        : 'Vincula el módulo que lleva el estudiante';
    }
    if (statusEl) {
      statusEl.className = 'chip ' + (st.status === 'on' ? 'chip-green' : st.status === 'connecting' ? 'chip-amber' : 'chip-neutral');
      statusEl.textContent = st.status === 'on' ? 'Conectado' : st.status === 'connecting' ? 'Conectando…' : st.status === 'scanning' ? 'Buscando…' : 'Desconectado';
    }
    if (rssiEl) rssiEl.textContent = st.rssi == null ? '—' : st.rssi + ' dBm';
    if (batEl) batEl.textContent = st.battery == null ? '—' : st.battery + ' %';
    if (hintEl) hintEl.textContent = (ESP32_METHODS[st.method] || {}).hint || hintEl.textContent;
    document.querySelectorAll('[data-list="esp32-methods"] .esp32-method').forEach(function (c) {
      c.classList.toggle('is-active', c.getAttribute('data-method') === st.method);
    });
    ['esp32-auto', 'esp32-share', 'esp32-sync'].forEach(function (id) {
      const node = el(id);
      if (!node) return;
      const key = id === 'esp32-auto' ? 'autoStart' : id === 'esp32-share' ? 'shareLoc' : 'syncTime';
      const on = !!st[key];
      node.className = 'chip ' + (on ? 'chip-green' : 'chip-neutral');
      node.textContent = on ? 'Activado' : 'Desactivado';
    });
  }

  function bindEsp32() {
    document.querySelectorAll('[data-list="esp32-methods"] .esp32-method').forEach(function (c) {
      c.addEventListener('click', function () {
        const st = esp32State();
        st.method = c.getAttribute('data-method');
        const list = document.querySelector('[data-list="esp32-devices"]');
        if (list) clearChildren(list);
        renderEsp32();
      });
    });
    const scan = el('esp32-scan');
    if (scan) {
      scan.addEventListener('click', function () {
        const st = esp32State();
        const list = document.querySelector('[data-list="esp32-devices"]');
        if (!list) return;
        st.status = 'scanning';
        renderEsp32();
        clearChildren(list);
        list.innerHTML = '<p class="body-sm" style="padding:8px 2px;">Buscando dispositivos ' + (ESP32_METHODS[st.method] || {}).label + '…</p>';
        esp32Scan(function (devices) {
          st.status = st.status === 'scanning' ? 'off' : st.status;
          renderEsp32();
          clearChildren(list);
          if (!devices.length) { list.innerHTML = '<p class="body-sm" style="padding:8px 2px;">No se encontraron dispositivos. Enciende el módulo e inténtalo de nuevo.</p>'; return; }
          devices.forEach(function (d) { list.appendChild(esp32DeviceCard(d)); });
        });
      });
    }
    ['esp32-auto', 'esp32-share', 'esp32-sync'].forEach(function (id) {
      const node = el(id);
      if (!node) return;
      node.addEventListener('click', function () {
        const st = esp32State();
        const key = id === 'esp32-auto' ? 'autoStart' : id === 'esp32-share' ? 'shareLoc' : 'syncTime';
        st[key] = !st[key];
        renderEsp32();
      });
    });
    const unpair = el('esp32-unpair');
    if (unpair) unpair.addEventListener('click', esp32Disconnect);
  }

  function bindProfile() {
    renderProfile();
    const rows = [
      ['perfil-notif', 'notificaciones'],
      ['perfil-seguridad', 'seguridad'],
      ['perfil-contactos', 'contactos'],
      ['perfil-esp32', 'esp32'],
      ['perfil-ayuda', 'ayuda']
    ];
    rows.forEach(function (pair) {
      const row = el(pair[0]);
      if (row) {
        row.addEventListener('click', function () {
          if (typeof window.goToScreen === 'function') window.goToScreen(pair[1]);
        });
      }
    });
    const out = el('perfil-logout');
    if (out) {
      out.addEventListener('click', function () {
        try { Store.reset(); } catch (e) { /* noop */ }
        if (typeof window.goToScreen === 'function') window.goToScreen('rol');
      });
    }
    const notif = el('notif-toggle');
    if (notif) {
      notif.addEventListener('click', function () {
        const on = notif.classList.contains('chip-green');
        notif.className = 'chip ' + (on ? 'chip-neutral' : 'chip-green');
        notif.textContent = on ? 'Desactivado' : 'Activado';
        toast(on ? 'Notificaciones desactivadas' : 'Notificaciones activadas', 'info');
      });
    }
    const save = el('seg-save');
    if (save) {
      save.addEventListener('click', function () {
        const p1 = (el('seg-pass') || {}).value || '';
        const p2 = el('seg-pass2') ? el('seg-pass2').value : '';
        const errorsBox = el('seg-errors');
        const errors = [];
        if (p1.length < 6) errors.push('La contraseña debe tener al menos 6 caracteres.');
        if (p1 !== p2) errors.push('Las contraseñas no coinciden.');
        renderErrors(errorsBox, errors);
        if (errors.length) return;
        if (el('seg-pass')) el('seg-pass').value = '';
        if (el('seg-pass2')) el('seg-pass2').value = '';
        toast('Contraseña actualizada (demostración)', 'success');
      });
    }
  }

  // ===========================================================================
  // ui/safe-points.js
  //
  // Los puntos seguros se generan POR COLEGIO: cada institución tiene su propia
  // comisaría, centro médico, tienda autorizada y punto de encuentro cercanos a
  // su ubicación real. Datos de demostración deterministas (reemplazables por
  // datos reales del backend).
  // ===========================================================================
  function openMaps(url) {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const SAFE_NAME_POOL = {
    comisaria: ['Comisaría PNP', 'Comisaría de la Familia', 'Comisaría PNP (sector norte)'],
    medico: ['Centro de Salud', 'Puesto de Salud', 'Centro Médico Municipal'],
    tienda: ['Tienda autorizada "El Sol"', 'Bodega segura', 'Tienda autorizada "Los Andes"', 'Tienda autorizada "El Cóndor"'],
    otro: ['Punto de encuentro Plaza', 'Punto de encuentro Parque', 'Punto de encuentro Municipalidad']
  };

  function hashString(s) {
    const str = String(s == null ? '' : s);
    let h = 0;
    for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) % 2147483647; }
    return h;
  }

  function pickFrom(list, seed) {
    if (!list || !list.length) return '';
    return list[Math.abs(seed) % list.length];
  }

  function destinationLatLng(lat, lng, meters, bearingDeg) {
    const R = 6371000;
    const br = (bearingDeg * Math.PI) / 180;
    const lat1 = (lat * Math.PI) / 180;
    const lng1 = (lng * Math.PI) / 180;
    const d = meters / R;
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(br));
    const lng2 = lng1 + Math.atan2(Math.sin(br) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
    return { lat: (lat2 * 180) / Math.PI, lng: (lng2 * 180) / Math.PI };
  }

  function formatSafeDistance(meters) {
    const m = Math.max(0, Math.round(meters));
    const distText = m >= 1000 ? (m / 1000).toFixed(1).replace('.', ',') + ' km' : m + ' m';
    const mins = Math.max(1, Math.round(m / 80));
    return '📍 ' + distText + ' · ' + mins + ' min a pie';
  }

  const SAFE_TYPE_META = {
    colegio: { icon: '🏫', bg: '#E3F2FD' },
    comisaria: { icon: '🚓', bg: 'var(--success-bg)' },
    medico: { icon: '🩺', bg: 'var(--success-bg)' },
    farmacia: { icon: '💊', bg: '#E8F5E9' },
    tienda: { icon: '🏪', bg: '#F3E5F5' },
    parque: { icon: '🌳', bg: '#E8F5E9' },
    banco: { icon: '🏦', bg: '#FFF8E1' },
    municipal: { icon: '🏛', bg: 'var(--warning-bg)' },
    otro: { icon: '📌', bg: 'var(--warning-bg)' }
  };

  function realSafePoints(inst) {
    const db = typeof window !== 'undefined' ? window.VIA_SEGURA_SAFE_POINTS : null;
    if (!db || !db[inst.id] || !db[inst.id].length) return null;
    return db[inst.id].map(function (p) {
      const meta = SAFE_TYPE_META[p.type] || SAFE_TYPE_META.otro;
      return {
        type: p.type, icon: meta.icon, bg: meta.bg, name: p.name,
        meters: p.meters, lat: p.lat, lng: p.lng,
        distText: formatSafeDistance(p.meters), photo: poiPhoto(p.type, p.name)
      };
    });
  }

  function safePointsForInstitution(inst) {
    if (!inst) return [];
    const self = {
      type: 'colegio', icon: SAFE_TYPE_META.colegio.icon, bg: SAFE_TYPE_META.colegio.bg,
      name: inst.name, meters: 0, lat: inst.lat, lng: inst.lng, distText: '📍 Tu colegio',
      photo: safePointPhoto({ type: 'colegio', name: inst.name }, inst)
    };
    if (typeof inst.lat !== 'number' || typeof inst.lng !== 'number') return [self];
    const real = realSafePoints(inst);
    if (real && real.length) {
      return [self].concat(real).sort(function (a, b) { return a.meters - b.meters; });
    }
    // Respaldo generado (solo para colegios remotos sin POIs cercanos en OSM).
    const district = inst.district || 'Arequipa';
    const seed = hashString(inst.id);
    const specs = [
      { type: 'comisaria', name: pickFrom(SAFE_NAME_POOL.comisaria, seed) + ' ' + district,
        meters: 220 + (seed % 260), bearing: seed % 360 },
      { type: 'medico', name: pickFrom(SAFE_NAME_POOL.medico, seed + 7) + ' ' + district,
        meters: 420 + ((seed >> 2) % 300), bearing: (seed * 3) % 360 },
      { type: 'tienda', name: pickFrom(SAFE_NAME_POOL.tienda, seed + 3),
        meters: 650 + ((seed >> 3) % 400), bearing: (seed * 5) % 360 },
      { type: 'otro', name: pickFrom(SAFE_NAME_POOL.otro, seed + 11) + ' (' + district + ')',
        meters: 900 + ((seed >> 4) % 500), bearing: (seed * 7) % 360 }
    ];
    const gen = specs.map(function (s) {
      const meta = SAFE_TYPE_META[s.type] || SAFE_TYPE_META.otro;
      const dest = destinationLatLng(inst.lat, inst.lng, s.meters, s.bearing);
      return {
        type: s.type, icon: meta.icon, bg: meta.bg, name: s.name, meters: s.meters,
        lat: Number(dest.lat.toFixed(6)), lng: Number(dest.lng.toFixed(6)),
        distText: formatSafeDistance(s.meters), photo: poiPhoto(s.type, s.name)
      };
    });
    return [self].concat(gen).sort(function (a, b) { return a.meters - b.meters; });
  }

  function safeSchool() {
    const chosen = Store.institution(Store.state.selectedInstitutionId);
    if (chosen) return chosen;
    const u = Store.state.user;
    if (u && u.institutionId) {
      const own = Store.institution(u.institutionId);
      if (own) return own;
    }
    const fallback = Store.institution(Store.state.safeSchoolId);
    return fallback || Store.institutions()[0] || null;
  }

  function populateSafeSchoolSelect() {
    const select = el('safe-school');
    if (!select) return;
    const insts = Store.institutions().slice().sort(function (a, b) {
      return String(a.district || '').localeCompare(String(b.district || '')) ||
        String(a.name || '').localeCompare(String(b.name || ''));
    });
    clearChildren(select);
    let currentDistrict = null;
    let group = null;
    insts.forEach(function (inst) {
      if (inst.district !== currentDistrict) {
        currentDistrict = inst.district;
        group = document.createElement('optgroup');
        group.label = currentDistrict || 'Otras zonas';
        select.appendChild(group);
      }
      const opt = document.createElement('option');
      opt.value = inst.id;
      opt.textContent = inst.name;
      group.appendChild(opt);
    });
    const chosen = safeSchool();
    select.value = chosen ? chosen.id : '';
    Store.state.safeSchoolId = select.value || null;
  }

  function safePointCard(point, isNearest) {
    const card = document.createElement('div');
    card.className = 'safe-point safe-point-item';
    card.setAttribute('data-type', point.type);
    card.setAttribute('data-lat', point.lat);
    card.setAttribute('data-lng', point.lng);
    card.setAttribute('data-name', point.name);
    card.style.cursor = 'pointer';
    if (isNearest) card.style.border = '2px solid var(--success)';
    const credit = point.photo && point.photo.title
      ? 'Foto referencial: ' + point.photo.title + ' · Wikimedia Commons (' + (point.photo.license || 'CC') + ')'
      : '';
    const media = point.photo && point.photo.src
      ? '<img class="sp-photo" src="' + escapeHtml(point.photo.src) + '" alt="' + escapeHtml(point.name) + '" loading="lazy"' +
        (credit ? ' title="' + escapeHtml(credit) + '"' : '') + ' onerror="this.replaceWith(Object.assign(document.createElement(\'div\'),{className:\'card-icon\',style:\'background:' + point.bg + '\',textContent:' + JSON.stringify(point.icon) + '}))">'
      : '<div class="card-icon" style="background:' + point.bg + ';">' + point.icon + '</div>';
    card.innerHTML =
      media +
      '<div class="safe-point-info"><div class="safe-point-name">' + escapeHtml(point.name) + '</div>' +
      '<div class="safe-point-dist">' + escapeHtml(point.distText) + '</div>' +
      (credit ? '<div class="sp-credit">' + escapeHtml(credit) + '</div>' : '') +
      '</div>' +
      (isNearest ? '<span class="chip chip-green">Más cercano</span>' : '');
    card.addEventListener('click', function () {
      openMaps('https://www.google.com/maps/dir/?api=1&destination=' + point.lat + ',' + point.lng +
        '&travelmode=walking&query=' + encodeURIComponent(point.name));
    });
    return card;
  }

  function renderSafePoints() {
    const list = document.querySelector('[data-list="safe-points"]');
    if (!list) return;
    const inst = safeSchool();
    const summary = document.querySelector('[data-safe-summary]');
    const select = el('safe-school');
    if (select && inst) select.value = inst.id;
    if (summary) {
      summary.textContent = inst
        ? 'Puntos seguros cercanos a ' + inst.name + ' · ' + (inst.district || 'Arequipa')
        : 'Selecciona un colegio';
    }
    const type = Store.state.safeType || 'todos';
    document.querySelectorAll('[data-list="safe-filters"] .safe-filter').forEach(function (c) {
      c.classList.toggle('active', c.getAttribute('data-type') === type);
    });
    clearChildren(list);
    if (!inst) {
      list.innerHTML = '<p class="empty">No hay colegios registrados.</p>';
      return;
    }
    const points = safePointsForInstitution(inst).filter(function (p) {
      return type === 'todos' || p.type === type;
    });
    if (!points.length) {
      list.innerHTML = '<p class="empty">No hay puntos seguros de este tipo para este colegio.</p>';
      return;
    }
    points.forEach(function (p, i) { list.appendChild(safePointCard(p, type === 'todos' && i === 0)); });
  }

  function bindSafePoints() {
    populateSafeSchoolSelect();
    const select = el('safe-school');
    if (select) {
      select.addEventListener('change', function () {
        Store.state.safeSchoolId = select.value;
        Store.state.selectedInstitutionId = select.value || null;
        Store.state.grade = null;
        renderSafePoints();
        renderProfile();
        renderInstitutions(document.querySelector('[data-list="institutions"]'));
      });
    }
    document.querySelectorAll('[data-list="safe-filters"] .safe-filter').forEach(function (chip) {
      chip.addEventListener('click', function () {
        Store.state.safeType = chip.getAttribute('data-type') || 'todos';
        renderSafePoints();
      });
    });
    renderSafePoints();
  }

  // ===========================================================================
  // ui/auth.js
  // ===========================================================================
  function routeAfterLogin(user) {
    if (user.role === ROLES.APODERADO) { renderParentHome(); showScreen('padre'); }
    else if (user.role === ROLES.ESTUDIANTE) { showScreen('home'); }
    else { renderInstitutionalPanel(); showScreen('panel'); }
  }

  function bindLogin() {
    const form = el('login-form');
    if (!form) return;
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      const errorsBox = el('login-errors');
      const data = {
        email: (qs('#login-email', form) || {}).value || '',
        password: (qs('#login-password', form) || {}).value || ''
      };
      const errors = Validators.validateLogin(data);
      renderErrors(errorsBox, errors);
      if (errors.length) return;

      form.classList.add('loading');
      AuthRepository.signIn(data.email, data.password)
        .then(function (user) {
          Store.state.user = user;
          toast('Bienvenido, ' + user.name, 'success');
          routeAfterLogin(user);
        })
        .catch(function (e) {
          renderErrors(errorsBox, [e.userMessage || e.message || 'No se pudo iniciar sesión.']);
        })
        .then(function () { form.classList.remove('loading'); });
    });
  }

  // ===========================================================================
  // ui/navigation.js
  // ===========================================================================
  function bindPanelEntry() {
    const entry = el('go-panel');
    if (!entry) return;
    entry.addEventListener('click', function (ev) {
      ev.preventDefault();
      const email = el('login-email');
      const pass = el('login-password');
      if (email) email.value = 'director@ie-mb.pe';
      if (pass) pass.value = 'demo123';
      showScreen('login');
      toast('Acceso institucional de demostración listo. Pulsa INGRESAR.', 'success');
    });
  }

  function showScreen(id) {
    if (typeof window.goToScreen === 'function') {
      window.goToScreen(id);
    } else if (el(id)) {
      el(id).scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (id === 'reg3') renderGradesForInstitution();
  }

  // ===========================================================================
  // init
  // ===========================================================================
  function injectStyles() {
    if (el('vs-runtime-styles')) return;
    const style = document.createElement('style');
    style.id = 'vs-runtime-styles';
    style.textContent =
      '.vs-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(20px);' +
      'background:#1C2836;color:#fff;padding:12px 18px;border-radius:8px;font-size:13px;opacity:0;' +
      'transition:all .25s;z-index:99999;max-width:86%;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,.25);}' +
      '.vs-toast.show{opacity:1;transform:translateX(-50%) translateY(0);}' +
      '.vs-toast.success{background:#2E7D32;}.vs-toast.error{background:#C62828;}';
    document.head.appendChild(style);
  }

  function nativeVibrate(ms) {
    try {
      if (window.ViaSeguraBridge && typeof window.ViaSeguraBridge.vibrate === 'function') {
        window.ViaSeguraBridge.vibrate(ms);
      } else if (navigator.vibrate) {
        navigator.vibrate(ms);
      }
    } catch (e) { /* bridge opcional */ }
  }

  // ===========================================================================
  // Alertas: contacto rapido por telefono y SMS.
  // Abre el dialer/mensajeria del sistema (en el emulador: sin SIM no envia,
  // en un celular si).
  // ===========================================================================
  const CONTACTOS_AUTORIZADOS = [
    { nombre: 'María Quispe', parentesco: 'Madre', telefono: '+51 987 654 321' },
    { nombre: 'Carlos Pérez', parentesco: 'Padre', telefono: '+51 912 345 678' }
  ];
  const TELEFONO_ESTUDIANTE = '+51 918 765 432';
  const TELEFONO_COLEGIO = '+51 54 123 456';

  function dialUrl(phone) {
    return 'tel:' + String(phone || '').replace(/[^\d+]/g, '');
  }

  function smsUrl(phone, body) {
    const n = String(phone || '').replace(/[^\d+]/g, '');
    return 'sms:' + n + (body ? '?body=' + encodeURIComponent(body) : '');
  }

  function alertaResumen() {
    const inst = currentInstitution();
    const hora = new Date().toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit' });
    const g = currentGps();
    const lugar = g ? formatCoords(g.lat, g.lng) : (inst ? (inst.name + ' · ' + (inst.district || 'Arequipa')) : 'Arequipa');
    return '🚨 Alerta VíaSegura: Juan Pérez activó una emergencia. Ubicación: ' + lugar + ' · ' + hora;
  }

  function bindAlertActions() {
    const call = el('alerta-call');
    if (call) call.addEventListener('click', function () {
      openMaps(dialUrl(TELEFONO_ESTUDIANTE));
    });
    const sms = el('alerta-sms');
    if (sms) sms.addEventListener('click', function () {
      openMaps(smsUrl(TELEFONO_ESTUDIANTE, alertaResumen()));
    });
    const back = el('alerta-back');
    if (back) back.addEventListener('click', function () {
      if (typeof window.goToScreen === 'function') window.goToScreen('home');
    });
    const callJuan = el('padre-call-juan');
    if (callJuan) callJuan.addEventListener('click', function () {
      openMaps(dialUrl(TELEFONO_ESTUDIANTE));
    });
    const callColegio = el('padre-call-colegio');
    if (callColegio) callColegio.addEventListener('click', function () {
      openMaps(dialUrl(TELEFONO_COLEGIO));
    });
    const padreBack = el('padre-alerta-back');
    if (padreBack) padreBack.addEventListener('click', function () {
      if (typeof window.goToScreen === 'function') window.goToScreen('padre');
    });
  }

  function bindEmergencyActions() {
    const selectors = ['#home .emergency-btn', '#recorrido .btn-danger', '#emergencia .btn-danger', '#padre .btn-danger'];
    selectors.forEach(function (sel) {
      const node = document.querySelector(sel);
      if (node) node.addEventListener('click', function () { nativeVibrate(400); });
    });
  }

  function bindPhotoCapture() {
    document.querySelectorAll('[data-capture]').forEach(function (btn) {
      btn.addEventListener('click', function (ev) {
        ev.preventDefault();
        const targetId = btn.getAttribute('data-capture');
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.setAttribute('capture', 'environment');
        input.style.display = 'none';
        input.addEventListener('change', function () {
          const file = input.files && input.files[0];
          if (!file) return;
          const container = el(targetId);
          if (container) {
            const url = URL.createObjectURL(file);
            container.innerHTML = '<img src="' + url + '" alt="Foto capturada">' +
              '<div class="photo-meta">' + escapeHtml(file.name) + ' · ' +
              Math.round(file.size / 1024) + ' KB</div>';
            container.classList.add('has-photo');
          }
          if (window.ViaSeguraBridge && typeof window.ViaSeguraBridge.showToast === 'function') {
            try { window.ViaSeguraBridge.showToast('Foto agregada'); } catch (e) { /* opcional */ }
          }
        });
        document.body.appendChild(input);
        input.click();
      });
    });
  }

  // ===========================================================================
  // Escaner de QR en vivo (webcam de laptop/PC, camara de tablet o celular)
  // ===========================================================================
  const qr = {
    stream: null,
    raf: null,
    running: false,
    detector: null,
    devices: [],
    deviceId: null
  };

  function qrSetStatus(msg) {
    const node = el('qr-status');
    if (node) node.textContent = msg;
  }

  function qrErrorMessage(err) {
    const name = (err && err.name) ? err.name : 'error';
    if (name === 'NotAllowedError' || name === 'SecurityError') {
      return 'Permiso de cámara denegado. Actívalo en el navegador o en los ajustes del sistema.';
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return 'No se encontró ninguna cámara en este equipo. Usa "Subir foto del QR".';
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
      return 'La cámara está siendo usada por otra aplicación.';
    }
    if (name === 'OverconstrainedError') {
      return 'La cámara no soporta la configuración solicitada.';
    }
    return 'No se pudo abrir la cámara (' + name + ').';
  }

  function stopQrScan() {
    qr.running = false;
    if (qr.raf) { cancelAnimationFrame(qr.raf); qr.raf = null; }
    if (qr.stream) { qr.stream.getTracks().forEach(function (t) { t.stop(); }); qr.stream = null; }
    const video = el('qr-video');
    if (video) video.srcObject = null;
    const btn = el('qr-scan-btn');
    if (btn) btn.textContent = '📷 Escanear con la cámara';
  }

  // Normaliza texto (minusculas, sin acentos) para comparar nombres de colegios.
  function normalizeQrText(s) {
    var t = String(s == null ? '' : s).toLowerCase().trim();
    if (t.normalize) t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return t.replace(/\s+/g, ' ');
  }

  // Convierte el texto decodificado del QR en una institucion del catalogo.
  // Acepta: id (inst-arequipa-07), codigo MINEDU (7012345), JSON {id|code|ie},
  // URL con id=/code=/ie= o el nombre del colegio.
  function institutionFromQr(raw) {
    var candidate = String(raw == null ? '' : raw).trim();
    if (!candidate) return null;
    if (candidate.charAt(0) === '{') {
      try {
        var payload = JSON.parse(candidate);
        candidate = String(payload.id || payload.code || payload.codigo || payload.institution || payload.ie || payload.colegio || '');
      } catch (e) { /* no es JSON valido: se usa el texto tal cual */ }
    }
    var q = candidate.match(/(?:[?&]|\/)(?:id|code|codigo|ie|institution)=([^&#\s]+)/i);
    if (q) {
      try { candidate = decodeURIComponent(q[1]); } catch (e) { candidate = q[1]; }
    }
    candidate = candidate.trim();
    if (!candidate) return null;
    var insts = Store.institutions();
    var i;
    for (i = 0; i < insts.length; i++) if (insts[i].id === candidate) return insts[i];
    for (i = 0; i < insts.length; i++) if (String(insts[i].code) === candidate) return insts[i];
    var wanted = normalizeQrText(candidate);
    if (!wanted) return null;
    for (i = 0; i < insts.length; i++) if (normalizeQrText(insts[i].name) === wanted) return insts[i];
    var partial = [];
    for (i = 0; i < insts.length; i++) if (normalizeQrText(insts[i].name).indexOf(wanted) >= 0) partial.push(insts[i]);
    return partial.length === 1 ? partial[0] : null;
  }

  // Aplica el colegio detectado por el QR con el mismo estado que una seleccion manual.
  function selectInstitutionFromQr(inst) {
    Store.state.selectedInstitutionId = inst.id;
    Store.state.safeSchoolId = inst.id;
    Store.state.grade = null;
    renderGradesForInstitution(inst);
    renderProfile();
    renderInstitutions(document.querySelector('[data-list="institutions"]'));
    var preview = el('reg2-preview');
    if (preview) {
      preview.innerHTML =
        '<div class="institution-item selected">' +
          '<div class="inst-icon"><img class="inst-icon-img" src="' + institutionImage(inst) + '" alt=""></div>' +
          '<div style="flex:1; min-width:0;">' +
            '<div style="font-size:14px; font-weight:600;">' + escapeHtml(inst.name) +
            ' <span class="chip chip-neutral" style="font-size:10px; padding:2px 6px;">' + escapeHtml(humanLevels(instNiveles(inst))) + '</span></div>' +
            '<div class="body-sm">' + escapeHtml(inst.district) + ' · ' + escapeHtml(inst.address) + '</div>' +
            '<div class="body-sm" style="opacity:.8;">Código: ' + escapeHtml(inst.code || '—') + '</div>' +
          '</div>' +
          '<div class="inst-check"><div class="inst-check-dot"></div></div>' +
        '</div>';
    }
  }

  function onQrDetected(data) {
    stopQrScan();
    var inst = institutionFromQr(data);
    if (inst) {
      selectInstitutionFromQr(inst);
      qrSetStatus('✅ Institución detectada: ' + inst.name);
      toast('Colegio detectado: ' + inst.name, 'success');
      nativeVibrate(80);
      setTimeout(function () { showScreen('reg3'); }, 900);
      return;
    }
    qrSetStatus('⚠️ Ese QR no corresponde a un colegio del catálogo. Vuelve a escanear o elige tu colegio en el paso anterior.');
    toast('QR sin colegio reconocido', 'error');
    nativeVibrate(120);
  }

  function decodeFrame(video, canvas) {
    const w = video.videoWidth;
    const h = video.videoHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);
    const pixels = ctx.getImageData(0, 0, w, h);
    const result = window.jsQR ? window.jsQR(pixels.data, w, h, { inversionAttempts: 'dontInvert' }) : null;
    return result && result.data ? result.data : null;
  }

  function loopQr() {
    if (!qr.running) return;
    const video = el('qr-video');
    const canvas = el('qr-canvas');
    if (!video || !canvas) { stopQrScan(); return; }
    if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth) {
      if (qr.detector) {
        // API nativa BarcodeDetector (Chrome/Android/ChromeOS): mas rapida.
        qr.detector.detect(video).then(function (codes) {
          if (!qr.running) return;
          if (codes && codes.length) { onQrDetected(codes[0].rawValue); return; }
          qr.raf = requestAnimationFrame(loopQr);
        }).catch(function () {
          if (!qr.running) return;
          qr.raf = requestAnimationFrame(loopQr);
        });
        return;
      }
      const data = decodeFrame(video, canvas);
      if (data) { onQrDetected(data); return; }
    }
    qr.raf = requestAnimationFrame(loopQr);
  }

  // Rellena el selector cuando el equipo tiene mas de una camara (PC, tablet...).
  function listCameras(stream) {
    const select = el('qr-device');
    const controls = el('qr-controls');
    if (!select || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    navigator.mediaDevices.enumerateDevices().then(function (devs) {
      const cams = devs.filter(function (d) { return d.kind === 'videoinput'; });
      qr.devices = cams;
      if (cams.length <= 1) {
        if (controls) controls.style.display = 'none';
        return;
      }
      const track = stream && stream.getVideoTracks()[0];
      const current = track ? track.getSettings().deviceId : null;
      select.innerHTML = '';
      cams.forEach(function (cam, i) {
        const opt = document.createElement('option');
        opt.value = cam.deviceId;
        opt.textContent = cam.label || ('Cámara ' + (i + 1));
        if (cam.deviceId === current) opt.selected = true;
        select.appendChild(opt);
      });
      if (controls) controls.style.display = 'flex';
    }).catch(function () { /* enumerateDevices no disponible */ });
  }

  // Intenta varias configuraciones: trasera -> frontal -> cualquiera.
  // Asi funciona igual en celular, tablet, laptop y PC de escritorio.
  function openCamera() {
    const video = el('qr-video');
    const attempts = qr.deviceId
      ? [{ video: { deviceId: { exact: qr.deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } } }]
      : [
          { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
          { video: { facingMode: { ideal: 'user' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
          { video: true }
        ];
    let lastError = null;
    const tryNext = function (index) {
      if (index >= attempts.length) return Promise.reject(lastError || new Error('NoCamera'));
      return navigator.mediaDevices.getUserMedia(attempts[index]).catch(function (err) {
        lastError = err;
        return tryNext(index + 1);
      });
    };
    return tryNext(0).then(function (stream) {
      qr.stream = stream;
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      return video.play().catch(function () { /* algunos equipos no requieren play() */ });
    }).then(function () {
      qr.running = true;
      qrSetStatus('🎥 Escaneando… apunta el código QR al recuadro');
      const btn = el('qr-scan-btn');
      if (btn) btn.textContent = '⏹ Detener cámara';
      listCameras(qr.stream);
    });
  }

  function startQrScan() {
    const video = el('qr-video');
    if (!video) return;
    if (qr.running) { stopQrScan(); qrSetStatus('🎥 Escaneo detenido.'); return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      qrSetStatus('Sin acceso a cámara en vivo aquí. Usa "Subir foto del QR".');
      return;
    }
    if (typeof window.jsQR !== 'function' && !('BarcodeDetector' in window)) {
      qrSetStatus('Falta el lector de QR (jsQR.js).');
      return;
    }
    if (!qr.detector && 'BarcodeDetector' in window) {
      try { qr.detector = new window.BarcodeDetector({ formats: ['qr_code'] }); } catch (e) { qr.detector = null; }
    }
    qrSetStatus('Solicitando cámara…');
    openCamera().then(function () {
      loopQr();
    }).catch(function (err) {
      qrSetStatus(qrErrorMessage(err));
    });
  }

  // Decodifica un QR desde una imagen subida (util en equipos sin camara).
  function decodeQrFromFile(file) {
    const img = new Image();
    img.onload = function () {
      const canvas = el('qr-canvas');
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = window.jsQR ? window.jsQR(pixels.data, canvas.width, canvas.height) : null;
      if (result && result.data) {
        onQrDetected(result.data);
      } else {
        qrSetStatus('No se detectó ningún QR en esa imagen.');
        toast('Sin QR en la imagen', 'error');
      }
    };
    img.onerror = function () { qrSetStatus('No se pudo leer la imagen.'); };
    img.src = URL.createObjectURL(file);
  }

  function bindQrScanner() {
    const btn = el('qr-scan-btn');
    if (btn) {
      btn.addEventListener('click', function (ev) { ev.preventDefault(); startQrScan(); });
    }
    const select = el('qr-device');
    if (select) {
      select.addEventListener('change', function () {
        qr.deviceId = select.value;
        if (qr.running) { stopQrScan(); startQrScan(); }
      });
    }
    const switchBtn = el('qr-switch');
    if (switchBtn) {
      switchBtn.addEventListener('click', function (ev) {
        ev.preventDefault();
        if (!qr.devices.length) return;
        const idx = qr.devices.findIndex(function (d) { return d.deviceId === qr.deviceId; });
        qr.deviceId = qr.devices[(idx + 1) % qr.devices.length].deviceId;
        const sel = el('qr-device');
        if (sel) sel.value = qr.deviceId;
        if (qr.running) { stopQrScan(); startQrScan(); }
      });
    }
    const photoBtn = el('qr-photo-btn');
    const photoInput = el('qr-photo-input');
    if (photoBtn && photoInput) {
      photoBtn.addEventListener('click', function (ev) { ev.preventDefault(); photoInput.click(); });
      photoInput.addEventListener('change', function () {
        const file = photoInput.files && photoInput.files[0];
        if (file) decodeQrFromFile(file);
        photoInput.value = '';
      });
    }
  }

  // ===========================================================================
  // Tema claro / oscuro
  // ===========================================================================
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function updateThemeButton() {
    const dark = currentTheme() === 'dark';
    document.querySelectorAll('.theme-toggle').forEach(function (b) {
      b.textContent = dark ? '☀️' : '🌙';
      b.title = dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
      b.setAttribute('aria-label', b.title);
    });
  }

  function applyTheme(mode) {
    const value = mode === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', value);
    try { localStorage.setItem('vs-theme', value); } catch (e) { /* almacenamiento opcional */ }
    updateThemeButton();
  }

  function toggleTheme() {
    applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  }

  function mountThemeToggle() {
    const bars = document.querySelectorAll('.topbar');
    bars.forEach(function (bar) {
      if (bar.querySelector('.theme-toggle')) return;
      let actions = bar.querySelector('.topbar-actions');
      if (!actions) {
        actions = document.createElement('span');
        actions.className = 'topbar-actions';
        const icon = bar.querySelector('.topbar-icon');
        if (icon && icon.parentNode === bar) actions.appendChild(icon);
        bar.appendChild(actions);
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'theme-toggle';
      btn.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        toggleTheme();
      });
      actions.appendChild(btn);
    });
    // Respaldo: si alguna pantalla no tiene barra superior, se deja un boton flotante.
    if (!document.querySelector('.theme-toggle')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'theme-toggle topbar-light';
      btn.addEventListener('click', function (ev) { ev.preventDefault(); toggleTheme(); });
      document.body.appendChild(btn);
    }
    updateThemeButton();
  }

  function initTheme() {
    let mode = 'light';
    try {
      const saved = localStorage.getItem('vs-theme');
      mode = saved || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } catch (e) { /* opcional */ }
    applyTheme(mode);
    mountThemeToggle();
  }

  // ===========================================================================
  // Mapa: Google Maps real (embed sin API key) + GPS en vivo del dispositivo
  // ===========================================================================
  const maps = { instances: {}, kinds: {}, embedUpdated: {} };
  const gps = { watchId: null, started: false };
  const ROUTE_MAPS = ['recorrido', 'anomalia', 'padre'];

  function setText(selector, value) {
    document.querySelectorAll(selector).forEach(function (n) { n.textContent = value; });
  }

  function currentGps() {
    const g = Store.state.gps;
    if (g && typeof g.lat === 'number' && typeof g.lng === 'number') return g;
    return null;
  }

  function haversineMeters(lat1, lon1, lat2, lon2) {
    const toRad = function (v) { return (v * Math.PI) / 180; };
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  function formatCoords(lat, lng) {
    const a = Math.abs(lat).toFixed(4) + '° ' + (lat >= 0 ? 'N' : 'S');
    const b = Math.abs(lng).toFixed(4) + '° ' + (lng >= 0 ? 'E' : 'O');
    return a + ', ' + b;
  }

  function timeAgo(ts) {
    if (!ts) return 'Sin señal';
    const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (s < 60) return 'Hace ' + s + ' s';
    const m = Math.round(s / 60);
    if (m < 60) return 'Hace ' + m + ' min';
    return 'Hace ' + Math.floor(m / 60) + ' h';
  }

  function geoRadius() {
    const r = parseInt(Store.state.geoRadius, 10);
    return r > 0 ? r : 500;
  }

  function updateTripElapsed() {
    const el = document.querySelector('[data-gps-elapsed]');
    if (!el || !Store.state.tripStart) return;
    const mins = Math.max(0, Math.floor((Date.now() - Store.state.tripStart) / 60000));
    el.textContent = mins + ' min';
  }

  function updateGpsUi() {
    const g = currentGps();
    const inst = currentInstitution();

    setText('[data-gps-coords]', g ? formatCoords(g.lat, g.lng) : 'Buscando señal…');
    setText('[data-gps-updated]', g ? timeAgo(g.ts) : 'Sin señal');

    setText('[data-gps-destination]', inst ? (inst.name || 'Colegio') : 'Colegio no seleccionado');
    setText('[data-gps-dest-distance]', g && inst
      ? (haversineMeters(g.lat, g.lng, inst.lat, inst.lng) + 'm')
      : '—');

    let dist = null;
    if (g && inst) dist = haversineMeters(g.lat, g.lng, inst.lat, inst.lng);

    const radius = geoRadius();
    const inside = dist === null ? null : dist <= radius;
    let geoText;
    let geoColor;
    if (dist === null) {
      geoText = 'Buscando…';
      geoColor = 'var(--text-muted)';
    } else if (inside) {
      geoText = 'Activa (Radio: ' + radius + 'm · ' + dist + 'm al colegio)';
      geoColor = 'var(--success)';
    } else {
      geoText = 'Fuera de zona (' + dist + 'm al colegio)';
      geoColor = 'var(--warning)';
    }
    document.querySelectorAll('[data-gps-geofence]').forEach(function (n) {
      n.textContent = geoText;
      n.style.color = geoColor;
    });

    const alerta = dist !== null && !inside;
    document.querySelectorAll('[data-gps-status]').forEach(function (n) {
      n.textContent = alerta ? 'Alerta' : 'Normal';
      n.style.color = alerta ? 'var(--warning)' : 'var(--success)';
    });

    setText('[data-gps-lastupdate]', g
      ? 'Ubicación en vivo · ' + timeAgo(g.ts).toLowerCase()
      : 'Buscando ubicación en vivo…');

    updateTripElapsed();

    document.querySelectorAll('.map-gmaps').forEach(function (a) {
      a.href = googleMapsUrl(inst, g ? [g.lat, g.lng] : null);
    });
  }

  function startGpsWatch() {
    if (gps.started) return;
    if (!navigator.geolocation) return;
    gps.started = true;
    try {
      gps.watchId = navigator.geolocation.watchPosition(onGpsPosition, onGpsError, {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 20000
      });
    } catch (e) {
      gps.started = false;
    }
  }

  function stopGpsWatch() {
    if (!gps.started) return;
    if (navigator.geolocation && gps.watchId !== null) {
      try { navigator.geolocation.clearWatch(gps.watchId); } catch (e) { /* noop */ }
    }
    gps.watchId = null;
    gps.started = false;
  }

  function onGpsPosition(pos) {
    Store.state.gps = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      acc: pos.coords.accuracy,
      ts: Date.now()
    };
    updateGpsUi();
    refreshEmbeds();
  }

  function onGpsError(err) {
    Store.state.gpsError = err && err.code ? err.code : 1;
    updateGpsUi();
    if (err && err.code === 1) toast('Permiso de ubicación denegado', 'error');
  }

  // Al entrar a una pantalla con GPS se pide el permiso y arranca el reloj del recorrido.
  function onScreenEnter(id) {
    if (!id) return;
    if (id === 'recorrido' || id === 'padre' || id === 'puntos') {
      if (id === 'recorrido' && !Store.state.tripStart) Store.state.tripStart = Date.now();
      updateGpsUi();
    }
    if (id === 'puntos') { populateSafeSchoolSelect(); renderSafePoints(); }
    if (id === 'esp32') renderEsp32();
    if (id === 'recorrido' || id === 'padre') startGpsWatch();
  }

  function currentInstitution() {
    const chosen = Store.institution(Store.state.selectedInstitutionId);
    if (chosen) return chosen;
    const u = Store.state.user;
    if (u && u.institutionId) return Store.institution(u.institutionId) || Store.institutions()[0];
    return Store.institutions()[0] || null;
  }

  function mapScreenId(container) {
    if (!container) return '';
    if (container.closest) {
      const p = container.closest('.phone');
      if (p && p.id) return p.id;
    }
    let n = container.parentNode;
    while (n && n !== document.body) {
      if (n.id && n.classList && n.classList.contains('phone')) return n.id;
      n = n.parentNode;
    }
    return '';
  }

  function googleMapsUrl(inst, origin) {
    if (origin) {
      return 'https://www.google.com/maps/dir/?api=1&origin=' + origin[0] + ',' + origin[1] +
        '&destination=' + inst.lat + ',' + inst.lng + '&travelmode=walking';
    }
    return 'https://www.google.com/maps/search/?api=1&query=' + inst.lat + ',' + inst.lng;
  }

  // Embed keyless de Google Maps: "q=" centra y marca un punto.
  function placeEmbedUrl(lat, lng) {
    return 'https://www.google.com/maps?q=' + lat + ',' + lng + '&z=16&hl=es&output=embed';
  }

  // Embed keyless de Google Maps con la ruta (origen -> colegio).
  // `origin` puede ser un arreglo [lat,lng] o el objeto GPS { lat, lng }.
  function routeEmbedUrl(inst, origin) {
    const school = [inst.lat, inst.lng];
    let from = null;
    if (Array.isArray(origin) && origin.length >= 2) {
      from = origin;
    } else if (origin && typeof origin.lat === 'number' && typeof origin.lng === 'number') {
      from = [origin.lat, origin.lng];
    }
    // Sin GPS real NO se inventa un origen: se muestra solo el destino para que
    // "mi ubicación" nunca sea un punto falso cerca del colegio.
    if (!from) return 'https://maps.google.com/maps?daddr=' + school[0] + ',' + school[1] + '&hl=es&output=embed';
    return 'https://maps.google.com/maps?saddr=' + from[0] + ',' + from[1] +
      '&daddr=' + school[0] + ',' + school[1] + '&hl=es&output=embed';
  }

  // Actualiza los iframes de Google Maps (con throttle) cuando cambia el GPS.
  function refreshEmbeds() {
    const now = Date.now();
    const inst = currentInstitution();
    if (!inst) return;
    const g = currentGps();
    Object.keys(maps.instances).forEach(function (id) {
      const frame = maps.instances[id];
      if (!frame) return;
      if (now - (maps.embedUpdated[id] || 0) < 10000) return;
      const kind = maps.kinds[id] || 'place';
      const url = kind === 'route' ? routeEmbedUrl(inst, g) : placeEmbedUrl(g ? g.lat : inst.lat, g ? g.lng : inst.lng);
      if (frame.getAttribute('src') !== url) {
        frame.src = url;
        maps.embedUpdated[id] = now;
      }
    });
  }

  function locateUser(frame, bar, inst) {
    const btn = bar ? bar.querySelector('.map-locate') : null;
    if (btn) btn.textContent = '🧭 Localizando…';
    if (!navigator.geolocation) {
      if (btn) btn.textContent = '🧭 Mi ubicación';
      toast('Geolocalización no disponible', 'error');
      return;
    }
    startGpsWatch();
    navigator.geolocation.getCurrentPosition(function (pos) {
      onGpsPosition(pos);
      if (btn) btn.textContent = '🧭 Mi ubicación';
      // Refrescar los mapas inmediatamente con la nueva posición.
      Object.keys(maps.instances).forEach(function (k) { maps.embedUpdated[k] = 0; });
      refreshEmbeds();
    }, function () {
      if (btn) btn.textContent = '🧭 Mi ubicación';
      toast('No se pudo obtener tu ubicación', 'error');
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 });
  }

  function buildMap(container) {
    if (!container || !container.id) return;
    const inst = currentInstitution();
    if (!inst || typeof inst.lat !== 'number') {
      container.innerHTML = '<div class="map-offline">Ubicación no disponible.</div>';
      return;
    }

    const kind = ROUTE_MAPS.indexOf(mapScreenId(container)) >= 0 ? 'route' : 'place';
    maps.kinds[container.id] = kind;

    let frame = container.querySelector('iframe');
    if (!frame) {
      clearChildren(container);
      frame = document.createElement('iframe');
      frame.className = 'vs-map-frame';
      frame.title = 'Mapa de Google Maps';
      frame.setAttribute('loading', 'lazy');
      frame.setAttribute('allowfullscreen', '');
      frame.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
      container.appendChild(frame);
      maps.instances[container.id] = frame;
      attachMapActions(container, frame, inst, kind);
    }

    const g = currentGps();
    const url = kind === 'route' ? routeEmbedUrl(inst, g) : placeEmbedUrl(g ? g.lat : inst.lat, g ? g.lng : inst.lng);
    if (frame.getAttribute('src') !== url) frame.src = url;
    const gmapsLink = container.parentNode
      ? container.parentNode.querySelector('.map-actions[data-for="' + container.id + '"] .map-gmaps')
      : null;
    if (gmapsLink) gmapsLink.setAttribute('href', googleMapsUrl(inst));
    // Si todavia no hay GPS, la primera fijacion debe refrescar el embed.
    maps.embedUpdated[container.id] = g ? Date.now() : 0;
  }

  function attachMapActions(container, frame, inst, kind) {
    const parent = container.parentNode;
    if (!parent) return;
    if (parent.querySelector('.map-actions[data-for="' + container.id + '"]')) return;

    const bar = document.createElement('div');
    bar.className = 'map-actions';
    bar.setAttribute('data-for', container.id);
    const label = kind === 'route' ? '📍 Ruta en Google Maps' : '📍 Ver en Google Maps';
    bar.innerHTML =
      '<a class="btn btn-sm map-gmaps" target="_blank" rel="noopener" href="' + googleMapsUrl(inst) + '">' + label + '</a>' +
      '<button class="btn btn-sm btn-outline map-locate" type="button">🧭 Mi ubicación</button>';

    // La tarjeta que se superpone al mapa (margin-top negativo) va antes de la barra.
    const next = container.nextElementSibling;
    let anchor = container;
    if (next && next.style && next.style.marginTop && String(next.style.marginTop).charAt(0) === '-') {
      anchor = next;
    }
    parent.insertBefore(bar, anchor.nextSibling);

    bar.querySelector('.map-locate').addEventListener('click', function () {
      locateUser(frame, bar, inst);
    });
  }

  let mapSeq = 0;
  function initMapsIn(scope) {
    (scope || document).querySelectorAll('.vs-map').forEach(function (c) {
      if (!c.id) c.id = 'vs-map-' + (mapSeq++);
      buildMap(c);
    });
  }

  function bindLocationAdjust() {
    const btnRec = el('gps-ajustar-recorrido');
    const btnPad = el('gps-ajustar-padre');
    function adjustLocation() {
      const inst = currentInstitution();
      const current = currentGps();
      const promptText = 'Ingresa tu ubicación para "poner otro sitio" (latitud,longitud)\nEjemplo: -16.4090,-71.5370';
      const val = window.prompt(promptText, current ? (current.lat + ',' + current.lng) : (inst ? (inst.lat + ',' + inst.lng) : ''));
      if (!val || !val.trim()) return;
      const parts = val.trim().split(/[,;\s]+/);
      if (parts.length < 2) return;
      const lat = parseFloat(parts[0].replace(',', '.'));
      const lng = parseFloat(parts[1].replace(',', '.'));
      if (isNaN(lat) || isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        toast('Coordenadas inválidas', 'error');
        return;
      }
      Store.state.gps = { lat: lat, lng: lng, acc: null, ts: Date.now() };
      updateGpsUi();
      refreshEmbeds();
      toast('Ubicación actualizada', 'success');
    }
    if (btnRec) btnRec.addEventListener('click', adjustLocation);
    if (btnPad) btnPad.addEventListener('click', adjustLocation);
  }

  function bindRegistration() {
    const btn3 = el('reg3-continue');
    const btn4 = el('reg4-crear');
    if (btn3) {
      btn3.addEventListener('click', function (ev) {
        ev.preventDefault();
        if (typeof window.goToScreen === 'function') window.goToScreen('reg4');
      });
    }
    if (btn4) {
      btn4.addEventListener('click', function (ev) {
        ev.preventDefault();
        const nombres = (el('reg3-nombres') || {}).value || '';
        const apellidos = (el('reg3-apellidos') || {}).value || '';
        const gradeSel = el('reg3-grade');
        const grade = (gradeSel && gradeSel.value) ? gradeSel.value : Store.state.grade;
        const nombreApoderado = (el('reg4-apoderado-nombre') || {}).value || 'Apoderado';
        const nombreEstudiante = (nombres + ' ' + apellidos).trim() || 'Estudiante';
        const registered = {
          uid: 'u-reg-' + Date.now().toString(36),
          name: nombreEstudiante,
          apoderadoNombre: nombreApoderado,
          role: ROLES.ESTUDIANTE,
          institutionId: Store.state.selectedInstitutionId || (Store.state.safeSchoolId || null)
        };
        Store.state.user = registered;
        Store.state.grade = grade || null;
        if (typeof window.goToScreen === 'function') window.goToScreen('home');
        renderProfile();
        renderUserNames();
        toast('Cuenta creada. ¡Bienvenido/a!', 'success');
      });
    }
  }
  let rawGoToScreen = null;
  const navHistory = [];

  function handleBack() {
    // 1) Detiene el escaner QR si esta en curso.
    if (qr.running) {
      stopQrScan();
      return true;
    }
    // 2) Retrocede a la pantalla anterior.
    while (navHistory.length) {
      const prev = navHistory.pop();
      if (el(prev)) {
        if (typeof rawGoToScreen === 'function') rawGoToScreen(prev);
        setTimeout(function () { initMapsIn(el(prev)); }, 60);
        return true;
      }
    }
    return false;
  }

  function init() {
    if (init.__done) return;
    init.__done = true;
    initTheme();
    injectStyles();
    bindLogin();
    bindPanelEntry();
    bindIncidentForm();
    bindPhotoCapture();
    bindQrScanner();
    bindInstitutions();
    bindSafePoints();
    bindProfile();
    bindEsp32();
    bindAlertActions();
    bindEmergencyActions();
    bindLocationAdjust();
    bindRegistration();
    if (typeof window.goToScreen === 'function' && !window.goToScreen.__vsWrapped) {
      rawGoToScreen = window.goToScreen;
      const wrappedGoToScreen = function (id) {
        if (id !== 'reg2' && qr.running) stopQrScan();
        const active = document.querySelector('.phone.active');
        const fromId = active ? active.id : null;
        // 'splash' es transitorio: no se guarda como destino de "atras".
        if (fromId && fromId !== id && fromId !== 'splash') {
          navHistory.push(fromId);
          if (navHistory.length > 50) navHistory.shift();
        }
        const result = rawGoToScreen.apply(this, arguments);
        onScreenEnter(id);
        setTimeout(function () { initMapsIn(el(id)); }, 60);
        return result;
      };
      wrappedGoToScreen.__vsWrapped = true;
      window.goToScreen = wrappedGoToScreen;
    }
    window.addEventListener('hashchange', function () {
      if (el('panel') && Store.state.user) renderInstitutionalPanel();
      const active = (location.hash || '').replace('#', '');
      if (qr.running && active !== 'reg2') { stopQrScan(); }
    });
    if (window.ViaSeguraBridge && typeof window.ViaSeguraBridge.onReady === 'function') {
      try { window.ViaSeguraBridge.onReady(); } catch (e) { /* bridge opcional */ }
    }
    // Inicializa Firebase si hay configuracion (si no, se usa el modo local).
    if (window.ViaSeguraFirebase && window.ViaSeguraFirebase.isConfigured()) {
      window.ViaSeguraFirebase.init().then(function (ok) {
        if (ok) toast('Conectado a Firebase', 'success');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ViaSegura = {
    ROLES: ROLES,
    can: can,
    Validators: Validators,
    Store: Store,
    AuthRepository: AuthRepository,
    renderCameras: renderCameras,
    renderIncidentList: renderIncidentList,
    renderParentHome: renderParentHome,
    renderInstitutionalPanel: renderInstitutionalPanel,
    renderInstitutions: renderInstitutions,
    renderSafePoints: renderSafePoints,
    renderEsp32: renderEsp32,
    esp32State: esp32State,
    safePointsForInstitution: safePointsForInstitution,
    initMapsIn: initMapsIn,
    handleBack: handleBack,
    toast: toast,
    showScreen: showScreen,
    startQrScan: startQrScan,
    stopQrScan: stopQrScan,
    institutionFromQr: institutionFromQr,
    selectInstitutionFromQr: selectInstitutionFromQr,
    onQrDetected: onQrDetected,
    applyTheme: applyTheme,
    toggleTheme: toggleTheme,
    startGpsWatch: startGpsWatch,
    stopGpsWatch: stopGpsWatch,
    updateGpsUi: updateGpsUi,
    onGpsPosition: onGpsPosition,
    onGpsError: onGpsError,
    haversineMeters: haversineMeters,
    formatCoords: formatCoords,
    refreshEmbeds: refreshEmbeds,
    placeEmbedUrl: placeEmbedUrl,
    routeEmbedUrl: routeEmbedUrl
  };
})();
