import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

// Las cifras esperadas salen del mismo artefacto que genera `python -m ml.train`.
const COMPARISON = JSON.parse(readFileSync(new URL('../backend/artifacts/comparison.json', import.meta.url)));
const PRIMARY = COMPARISON.models.find((m) => m.id === COMPARISON.primary_model);
const pct = (v) => `${(v * 100).toFixed(1)}%`;

const API = 'http://127.0.0.1:8000';

// Recoge errores de consola y de página para comprobar que no haya ninguno.
function trackErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

async function runDiagnosis(page) {
  const responsePromise = page.waitForResponse((r) => r.url().endsWith('/api/predict'));
  await page.getByRole('button', { name: 'Ejecutar Diagnóstico' }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  await expect(page.getByText('Consenso de Modelos')).toBeVisible();
  return response.json();
}

const resultBadge = (page) =>
  page.locator('h2:has-text("Resultado del Análisis") + span');

// ---------------------------------------------------------------------------
// Estilo global
// ---------------------------------------------------------------------------

test.describe('Estilo global', () => {
  test('el fondo es el rosa sutil y los títulos usan Fraunces', async ({ page }) => {
    await page.goto('/#landing');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe('rgb(253, 247, 248)');
    const h1Font = await page.locator('h1').first().evaluate((el) => getComputedStyle(el).fontFamily);
    expect(h1Font).toContain('Fraunces');
    const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(bodyFont).toContain('Manrope');
  });

  test('las fuentes web se cargan', async ({ page }) => {
    await page.goto('/#landing');
    await page.evaluate(() => document.fonts.ready);
    const loaded = await page.evaluate(() =>
      ['Fraunces', 'Manrope'].map((f) => document.fonts.check(`16px "${f}"`)));
    expect(loaded).toEqual([true, true]);
  });

  test('no quedan cápsulas en la landing', async ({ page }) => {
    await page.goto('/#landing');
    await expect(page.getByText('Soporte a la Decisión Médica')).toHaveCount(0);
    const pills = await page.locator('main .rounded-full').count();
    expect(pills).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Landing y navegación
// ---------------------------------------------------------------------------

test.describe('Landing y navegación', () => {
  test('la landing muestra el contenido clave', async ({ page }) => {
    await page.goto('/#landing');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('biopsia mamaria');
    for (const v of [pct(PRIMARY.test.recall), PRIMARY.test.roc_auc.toFixed(3), String(COMPARISON.dataset.total)]) {
      await expect(page.getByText(v, { exact: true })).toBeVisible();
    }
    await expect(page.getByRole('heading', { name: 'Cómo funciona' })).toBeVisible();
    await expect(page.getByText('No sustituye el criterio')).toBeVisible();
  });

  test('el CTA principal abre el diagnóstico', async ({ page }) => {
    await page.goto('/#landing');
    await page.getByRole('button', { name: 'Iniciar evaluación' }).click();
    await expect(page).toHaveURL(/#tool$/);
    await expect(page.getByRole('heading', { name: 'Evaluación Citopatológica' })).toBeVisible();
  });

  test('el enlace secundario abre Modelos & Dataset', async ({ page }) => {
    await page.goto('/#landing');
    await page.getByRole('button', { name: 'Cómo se validaron los modelos' }).click();
    await expect(page).toHaveURL(/#metrics$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('cómo se validaron');
  });

  test('la barra de navegación cambia de vista y marca la activa', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('header nav');
    for (const [label, hash] of [['Modelos & Dataset', 'metrics'], ['Inicio', 'landing'], ['Diagnóstico', 'tool']]) {
      await nav.getByRole('button', { name: label }).click();
      await expect(page).toHaveURL(new RegExp(`#${hash}$`));
      await expect(nav.getByRole('button', { name: label })).toHaveClass(/border-roseclinical-600/);
    }
  });

  test('el logo vuelve al inicio', async ({ page }) => {
    await page.goto('/#metrics');
    await page.getByRole('button', { name: /OncoPath/ }).first().click();
    await expect(page).toHaveURL(/#landing$/);
  });

  test('los enlaces del pie de página navegan', async ({ page }) => {
    await page.goto('/#landing');
    await page.locator('footer').getByRole('button', { name: 'Modelos & Dataset' }).click();
    await expect(page).toHaveURL(/#metrics$/);
  });

  test('las URLs con hash abren directamente cada vista', async ({ page }) => {
    await page.goto('/#metrics');
    await expect(page.getByRole('heading', { name: 'Rendimiento en el test ciego' })).toBeVisible();
    await page.goto('/#landing');
    await expect(page.getByRole('heading', { name: 'Cómo funciona' })).toBeVisible();
  });

  test('un hash desconocido cae en la herramienta de diagnóstico', async ({ page }) => {
    await page.goto('/#no-existe');
    await expect(page.getByRole('heading', { name: 'Evaluación Citopatológica' })).toBeVisible();
  });

  test('el botón atrás del navegador funciona', async ({ page }) => {
    await page.goto('/#landing');
    await page.locator('header nav').getByRole('button', { name: 'Modelos & Dataset' }).click();
    await expect(page).toHaveURL(/#metrics$/);
    await page.goBack();
    await expect(page).toHaveURL(/#landing$/);
    await expect(page.getByRole('heading', { name: 'Cómo funciona' })).toBeVisible();
  });

  test('el indicador muestra el servicio activo', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Servicio activo')).toBeVisible();
  });

  test('ninguna vista genera errores en consola', async ({ page }) => {
    const errors = trackErrors(page);
    for (const hash of ['landing', 'tool', 'metrics']) {
      await page.goto(`/#${hash}`);
      await page.waitForLoadState('networkidle');
    }
    expect(errors).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Herramienta de diagnóstico
// ---------------------------------------------------------------------------

test.describe('Herramienta de diagnóstico', () => {
  test.beforeEach(async ({ page }) => {
    // La espera se registra antes de navegar: si no, la respuesta puede llegar antes y no detectarse.
    const samplesLoaded = page.waitForResponse((r) => r.url().endsWith('/api/samples'));
    await page.goto('/#tool');
    await samplesLoaded;
  });

  test('estado inicial: valores basales y sin resultado', async ({ page }) => {
    await expect(page.getByText('Valores basales')).toBeVisible();
    await expect(page.getByText('Esperando Ejecución')).toBeVisible();
    await expect(page.locator('#radius_mean')).toHaveValue('14.12');
    await expect(page.locator('input[type="number"]')).toHaveCount(10);
    await expect(page.locator('input[type="range"]')).toHaveCount(10);
  });

  test('caso benigno real se clasifica como Benigno', async ({ page }) => {
    await page.getByRole('button', { name: 'Caso Benigno' }).click();
    await expect(page.getByText('Muestra Benigna')).toBeVisible();
    const body = await runDiagnosis(page);
    expect(body.diagnosis).toBe('Benigno');
    await expect(resultBadge(page)).toHaveText('Benigno');
    await expect(page.getByText(`${body.probability_malignant}%`, { exact: true })).toBeVisible();
    await expect(page.getByText(`se considera maligno desde ${body.threshold}%`)).toBeVisible();
  });

  test('caso sospechoso real se clasifica como Maligno con consenso unánime', async ({ page }) => {
    await page.getByRole('button', { name: 'Caso Sospechoso' }).click();
    const body = await runDiagnosis(page);
    expect(body.diagnosis).toBe('Maligno');
    expect(body.consensus.unanimous).toBe(true);
    await expect(resultBadge(page)).toHaveText('Maligno');
    await expect(page.getByText('100% concordancia')).toBeVisible();
    await expect(page.getByText('Parámetros con mayor desviación')).toBeVisible();
  });

  test('cargar una muestra rellena los campos con sus valores reales', async ({ page, request }) => {
    const samples = await (await request.get(`${API}/api/samples`)).json();
    await page.getByRole('button', { name: 'Caso Sospechoso' }).click();
    const expected = samples.malignant[0].features.radius_mean;
    await expect(page.locator('#radius_mean')).toHaveValue(String(expected));
  });

  test('caso límite carga valores intermedios y produce un resultado', async ({ page }) => {
    await page.getByRole('button', { name: 'Caso Límite' }).click();
    await expect(page.getByText('Muestra Indeterminada')).toBeVisible();
    const body = await runDiagnosis(page);
    expect(['Benigno', 'Maligno']).toContain(body.diagnosis);
  });

  test('el consenso muestra los tres modelos', async ({ page }) => {
    await runDiagnosis(page);
    for (const name of ['Reg. Logística', 'SVM (RBF)', 'Reg. Polinomial']) {
      await expect(page.getByText(name, { exact: true })).toBeVisible();
    }
  });

  test('editar un valor marca la muestra como personalizada y se envía', async ({ page }) => {
    await page.locator('#radius_mean').fill('25');
    await expect(page.getByText('Personalizado')).toBeVisible();
    const requestPromise = page.waitForRequest((r) => r.url().endsWith('/api/predict'));
    await page.getByRole('button', { name: 'Ejecutar Diagnóstico' }).click();
    const sent = JSON.parse((await requestPromise).postData());
    expect(sent.features.radius_mean).toBe(25);
    expect(Object.keys(sent.features)).toHaveLength(30);
  });

  test('el slider actualiza el campo numérico', async ({ page }) => {
    const slider = page.getByLabel('Radio nuclear (control deslizante)');
    await slider.fill('20');
    await expect(page.locator('#radius_mean')).toHaveValue('20');
  });

  test('el modo Mediciones Extremas edita las variables _worst', async ({ page }) => {
    await page.getByRole('button', { name: 'Mediciones Extremas' }).click();
    await expect(page.locator('#radius_worst')).toBeVisible();
    await expect(page.locator('#radius_mean')).toHaveCount(0);
    await page.locator('#radius_worst').fill('30');
    const requestPromise = page.waitForRequest((r) => r.url().endsWith('/api/predict'));
    await page.getByRole('button', { name: 'Ejecutar Diagnóstico' }).click();
    const sent = JSON.parse((await requestPromise).postData());
    expect(sent.features.radius_worst).toBe(30);
    expect(sent.features.radius_mean).toBe(14.12);
  });

  for (const [value, id] of [['reg_bin', 'reg_bin'], ['svm', 'svm'], ['log_pol', 'log_pol'], ['all', 'all']]) {
    test(`el selector de algoritmo envía model_id=${value}`, async ({ page }) => {
      await page.getByLabel('Algoritmo:').selectOption(value);
      const requestPromise = page.waitForRequest((r) => r.url().endsWith('/api/predict'));
      await page.getByRole('button', { name: 'Ejecutar Diagnóstico' }).click();
      expect(JSON.parse((await requestPromise).postData()).model_id).toBe(id);
      await expect(page.getByText('Consenso de Modelos')).toBeVisible();
    });
  }

  test('restablecer limpia el resultado y los valores', async ({ page }) => {
    await page.getByRole('button', { name: 'Caso Sospechoso' }).click();
    await runDiagnosis(page);
    await page.getByRole('button', { name: 'Restablecer mediciones' }).click();
    await expect(page.getByText('Esperando Ejecución')).toBeVisible();
    await expect(page.getByText('Valores basales')).toBeVisible();
    await expect(page.locator('#radius_mean')).toHaveValue('14.12');
  });

  test('cambiar de muestra borra el resultado anterior', async ({ page }) => {
    await page.getByRole('button', { name: 'Caso Sospechoso' }).click();
    await runDiagnosis(page);
    await page.getByRole('button', { name: 'Caso Benigno' }).click();
    await expect(page.getByText('Esperando Ejecución')).toBeVisible();
  });

  test('un error del servidor se muestra al usuario', async ({ page }) => {
    await page.route('**/api/predict', (route) =>
      route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ detail: 'No hay modelos disponibles en el servidor.' }) }));
    await page.getByRole('button', { name: 'Ejecutar Diagnóstico' }).click();
    await expect(page.getByText('No hay modelos disponibles en el servidor.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ejecutar Diagnóstico' })).toBeEnabled();
  });

  test('el botón se deshabilita mientras calcula', async ({ page }) => {
    await page.route('**/api/predict', async (route) => {
      await new Promise((r) => setTimeout(r, 600));
      await route.continue();
    });
    await page.getByRole('button', { name: 'Ejecutar Diagnóstico' }).click();
    await expect(page.getByRole('button', { name: 'Calculando diagnóstico...' })).toBeDisabled();
    await expect(page.getByText('Consenso de Modelos')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Modelos & Dataset
// ---------------------------------------------------------------------------

test.describe('Modelos & Dataset', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#metrics');
  });

  test('muestra la composición del dataset', async ({ page }) => {
    await expect(page.getByText('569', { exact: true })).toBeVisible();
    await expect(page.getByText('benignas · 62.7%')).toBeVisible();
    await expect(page.getByText('malignas · 37.3%')).toBeVisible();
    await expect(page.getByText('Los 10 rasgos del núcleo')).toBeVisible();
    await expect(page.getByText('Puntos cóncavos', { exact: true })).toBeVisible();
  });

  test('la tabla refleja los datos de la API', async ({ page, request }) => {
    const api = await (await request.get(`${API}/api/models/comparison`)).json();
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(3);
    for (const [i, m] of api.models.entries()) {
      const row = rows.nth(i);
      await expect(row).toContainText(m.name);
      await expect(row).toContainText(pct(m.test.recall));
      await expect(row).toContainText(pct(m.test.specificity));
      await expect(row).toContainText(m.threshold.toFixed(2));
      await expect(row).toContainText(`${m.test.confusion_matrix.false_negative} / ${api.dataset.test_malignant}`);
      await expect(row).toContainText(m.is_recommended ? 'Modelo principal' : 'Complementario');
    }
  });

  test('el modelo principal está seleccionado por defecto', async ({ page }) => {
    await expect(page.getByRole('button', { name: PRIMARY.name, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('heading', { level: 3, name: PRIMARY.name })).toBeVisible();
  });

  for (const { name, test: { confusion_matrix: m } } of COMPARISON.models) {
    const cm = { fn: String(m.false_negative), fp: String(m.false_positive),
      tp: String(m.true_positive), tn: String(m.true_negative) };
    test(`seleccionar "${name}" actualiza el detalle y la matriz`, async ({ page }) => {
      await page.getByRole('button', { name, exact: true }).click();
      await expect(page.getByRole('heading', { level: 3, name })).toBeVisible();
      const cell = (label) => page.locator(`div:has(> span:text-is("${label}")) > span`).first();
      await expect(cell('Falsos negativos')).toHaveText(cm.fn);
      await expect(cell('Falsos positivos')).toHaveText(cm.fp);
      await expect(cell('Verdaderos positivos')).toHaveText(cm.tp);
      await expect(cell('Verdaderos negativos')).toHaveText(cm.tn);
    });
  }

  test('la matriz suma el tamaño del test', async ({ page }) => {
    const cell = (label) => page.locator(`div:has(> span:text-is("${label}")) > span`).first();
    await expect(cell('Verdaderos negativos')).toHaveText(String(PRIMARY.test.confusion_matrix.true_negative));
    const labels = ['Verdaderos negativos', 'Falsos positivos', 'Falsos negativos', 'Verdaderos positivos'];
    const values = await Promise.all(labels.map((l) => cell(l).textContent()));
    expect(values.map(Number).reduce((a, b) => a + b, 0)).toBe(COMPARISON.dataset.test);
  });

  test('hacer clic en cualquier parte de la fila selecciona el modelo', async ({ page }) => {
    const other = COMPARISON.models.findIndex((m) => !m.is_recommended);
    await page.locator('tbody tr').nth(other).locator('td').nth(3).click();
    await expect(page.getByRole('button', { name: COMPARISON.models[other].name, exact: true }))
      .toHaveAttribute('aria-pressed', 'true');
  });

  test('el diagrama de calibración se dibuja para el modelo seleccionado', async ({ page }) => {
    const diagram = page.getByRole('img', { name: 'Diagrama de fiabilidad de las probabilidades del modelo' });
    await expect(diagram).toBeVisible();
    await expect(diagram.locator('circle')).toHaveCount(PRIMARY.calibration_curve.length);
  });
});

// ---------------------------------------------------------------------------
// Sin backend (modo local)
// ---------------------------------------------------------------------------

test.describe('Sin backend', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`${API}/**`, (route) => route.abort('connectionrefused'));
  });

  test('el indicador pasa a modo local', async ({ page }) => {
    await page.goto('/#landing');
    await expect(page.getByText('Modo local')).toBeVisible();
  });

  test('Modelos & Dataset usa los datos precomputados', async ({ page }) => {
    await page.goto('/#metrics');
    await expect(page.locator('tbody tr')).toHaveCount(3);
    await expect(page.locator('tbody tr').first()).toContainText(pct(COMPARISON.models[0].test.recall));
  });

  test('los casos de ejemplo se deshabilitan sin API', async ({ page }) => {
    await page.goto('/#tool');
    await expect(page.getByRole('button', { name: 'Caso Benigno' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Caso Sospechoso' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Caso Límite' })).toBeEnabled();
  });

  test('el diagnóstico informa del error de conexión', async ({ page }) => {
    await page.goto('/#tool');
    await page.getByRole('button', { name: 'Ejecutar Diagnóstico' }).click();
    await expect(page.getByText('No se pudo conectar con el servicio de inferencia')).toBeVisible();
    await expect(page.getByText('Consenso de Modelos')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// Móvil
// ---------------------------------------------------------------------------

test.describe('Móvil @mobile', () => {
  test('el menú móvil abre y navega @mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'solo móvil');
    await page.goto('/#landing');
    await page.getByRole('button', { name: 'Abrir menú' }).click();
    await page.locator('header').getByRole('button', { name: 'Modelos & Dataset' }).last().click();
    await expect(page).toHaveURL(/#metrics$/);
    await expect(page.getByRole('button', { name: 'Abrir menú' })).toBeVisible();
  });

  for (const hash of ['landing', 'tool', 'metrics']) {
    test(`sin scroll horizontal en #${hash} @mobile`, async ({ page }) => {
      await page.goto(`/#${hash}`);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test('un diagnóstico completo funciona en móvil @mobile', async ({ page }) => {
    // La espera se registra antes de navegar: si no, la respuesta puede llegar antes y no detectarse.
    const samplesLoaded = page.waitForResponse((r) => r.url().endsWith('/api/samples'));
    await page.goto('/#tool');
    await samplesLoaded;
    await page.getByRole('button', { name: 'Caso Benigno' }).click();
    const body = await runDiagnosis(page);
    expect(body.diagnosis).toBe('Benigno');
  });
});
