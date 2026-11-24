const ROLES_VALIDOS = [
  'Administrador del Sistema / Coordinador de Mantenimiento',
  'Técnico de Mantenimiento / Personal Operativo',
  'Cliente Interno'
];

const FECHA_MINIMA = '2026-11-24';

function leerDatos(formulario) {
  const datos = Object.fromEntries(new FormData(formulario));
  return {
    codigoEquipo: String(datos.codigoEquipo || '').trim().toUpperCase(),
    frecuenciaDias: Number(datos.frecuenciaDias),
    fechaProgramada: String(datos.fechaProgramada || '').trim(),
    horasEstimadas: Number(datos.horasEstimadas),
    rolSolicitante: String(datos.rolSolicitante || '').trim(),
    ubicacionArea: String(datos.ubicacionArea || '').trim()
  };
}

function validar(datos) {
  const errores = {};

  if (!/^EQ-\d{4}$/.test(datos.codigoEquipo)) {
    errores.codigoEquipo = 'Escribe un código de equipo válido con formato EQ-0000 (por ejemplo, EQ-0104).';
  }

  if (!Number.isInteger(datos.frecuenciaDias) || datos.frecuenciaDias < 7 || datos.frecuenciaDias > 180) {
    errores.frecuenciaDias = 'Escribe un número entero de días entre 7 y 180 para la frecuencia preventiva.';
  }

  if (!datos.fechaProgramada || datos.fechaProgramada < FECHA_MINIMA) {
    errores.fechaProgramada = `Selecciona una fecha programada igual o posterior a ${FECHA_MINIMA}.`;
  }

  if (Number.isNaN(datos.horasEstimadas) || datos.horasEstimadas < 1 || datos.horasEstimadas > 8) {
    errores.horasEstimadas = 'Escribe un número de horas estimadas entre 1 y 8.';
  }

  if (!ROLES_VALIDOS.includes(datos.rolSolicitante)) {
    errores.rolSolicitante = 'Selecciona un rol válido del proyecto (Administrador, Técnico o Cliente Interno).';
  }

  if (datos.ubicacionArea.length < 3) {
    errores.ubicacionArea = 'Indica o selecciona el área o ubicación del equipo (mínimo 3 caracteres).';
  }

  return errores;
}

function limpiarMarcaCampo(elemento) {
  if (!elemento || !elemento.name) return;
  elemento.removeAttribute('aria-invalid');
  const errorSpan = document.getElementById(`error-${elemento.name}`);
  if (errorSpan) {
    errorSpan.textContent = '';
  }
}

function mostrarResultado(datos, errores, ui) {
  const { formulario, estadoGeneral, resumenJson } = ui;
  const campos = ['codigoEquipo', 'frecuenciaDias', 'fechaProgramada', 'horasEstimadas', 'rolSolicitante', 'ubicacionArea'];

  campos.forEach((campo) => {
    const input = formulario.elements.namedItem(campo);
    const errorSpan = document.getElementById(`error-${campo}`);
    if (input) input.removeAttribute('aria-invalid');
    if (errorSpan) errorSpan.textContent = '';
  });

  const keysError = Object.keys(errores);
  if (keysError.length > 0) {
    keysError.forEach((campo) => {
      const input = formulario.elements.namedItem(campo);
      const errorSpan = document.getElementById(`error-${campo}`);
      if (input) input.setAttribute('aria-invalid', 'true');
      if (errorSpan) errorSpan.textContent = errores[campo];
    });

    estadoGeneral.textContent = `Se encontraron ${keysError.length} campo(s) por revisar. Corrige los mensajes indicados junto a cada campo.`;
    resumenJson.textContent = JSON.stringify({ valido: false, errores }, null, 2);
    return;
  }

  const solicitudPreparada = {
    operacion: 'programar_servicio_preventivo',
    trazabilidad: { entregables: ['E2', 'E3'], edt: ['2.1', '3.1'], actividades: ['A3', 'A4', 'A5'] },
    datos,
    exclusiones: ['refacciones', 'mantenimiento_correctivo']
  };

  estadoGeneral.textContent = 'Validación correcta en el cliente. JSON listo para envío en Web U4.2 (aún sin enviar al servidor).';
  resumenJson.textContent = JSON.stringify(solicitudPreparada, null, 2);
}

function iniciarValidacion() {
  const formulario = document.getElementById('form-programacion');
  const estadoGeneral = document.getElementById('estado-operacion');
  const resumenJson = document.getElementById('resumen-json');

  if (!formulario || !estadoGeneral || !resumenJson) return;
  if (formulario.dataset.listenerAttached === 'true') return;
  formulario.dataset.listenerAttached = 'true';

  const ui = { formulario, estadoGeneral, resumenJson };

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const datos = leerDatos(formulario);
    const errores = validar(datos);
    mostrarResultado(datos, errores, ui);
  });

  formulario.addEventListener('input', (evento) => limpiarMarcaCampo(evento.target));
  formulario.addEventListener('change', (evento) => limpiarMarcaCampo(evento.target));
}

document.addEventListener('DOMContentLoaded', iniciarValidacion);