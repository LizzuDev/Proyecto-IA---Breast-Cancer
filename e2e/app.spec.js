import { test, expect } from '@playwright/test';

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
    for (const v of ['95.2%', '0.998', '569']) {
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
    await page.goto('/#tool');
    await page.waitForResponse((r) => r.url().endsWith('/api/samples'));
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
    await expect(page.getByText(`${body.probability_benign}%`).first()).toBeVisible();
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
    await expect(page.locator('dl dt')).toHaveCount(2 + 10 + 3);
  });

  test('la tabla refleja los datos de la API', async ({ page, request }) => {
    const api = await (await request.get(`${API}/api/models/comparison`)).json();
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(3);
    for (const [i, m] of api.models.entries()) {
      const row = rows.nth(i);
      await expect(row).toContainText(m.name);
      await expect(row).toContainText(`${m.test_recall}%`);
      await expect(row).toContainText(`${m.test_accuracy}%`);
      await expect(row).toContainText(`${m.confusion_matrix.false_negative} / 42`);
    }
    await expect(rows.first()).toContainText('Modelo principal');
  });

  test('el modelo principal está seleccionado por defecto', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Regresión Logística Binaria' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('heading', { level: 3, name: 'Regresión Logística Binaria' })).toBeVisible();
  });

  const cases = [
    ['Support Vector Machine (RBF)', { fn: '3', fp: '0', tp: '39', tn: '72' }],
    ['Regresión Logística Polinomial (Grado 2)', { fn: '4', fp: '3', tp: '38', tn: '69' }],
    ['Regresión Logística Binaria', { fn: '2', fp: '0', tp: '40', tn: '72' }],
  ];
  for (const [name, cm] of cases) {
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
    await expect(cell('Verdaderos negativos')).toHaveText('72');
    const labels = ['Verdaderos negativos', 'Falsos positivos', 'Falsos negativos', 'Verdaderos positivos'];
    const values = await Promise.all(labels.map((l) => cell(l).textContent()));
    expect(values.map(Number).reduce((a, b) => a + b, 0)).toBe(114);
  });

  test('hacer clic en cualquier parte de la fila selecciona el modelo', async ({ page }) => {
    await page.locator('tbody tr').nth(1).locator('td').nth(3).click();
    await expect(page.getByRole('button', { name: 'Support Vector Machine (RBF)' })).toHaveAttribute('aria-pressed', 'true');
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
    await expect(page.locator('tbody tr').first()).toContainText('95.24%');
  });

  test('el diagnóstico informa del error de conexión', async ({ page }) => {
    await page.goto('/#tool');
    await page.getByRole('button', { name: 'Ejecutar Diagnóstico' }).click();
    await expect(page.locator('.border-roseclinical-500.text-roseclinical-800')).toBeVisible();
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
    await page.goto('/#tool');
    await page.waitForResponse((r) => r.url().endsWith('/api/samples'));
    await page.getByRole('button', { name: 'Caso Benigno' }).click();
    const body = await runDiagnosis(page);
    expect(body.diagnosis).toBe('Benigno');
  });
});
