"""Run with the server active. Uses an isolated browser; no user data is changed."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get('WBA_TEST_URL', 'http://127.0.0.1:8000')

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
    context = browser.new_context(viewport={'width': 1440, 'height': 1000})
    page = context.new_page()
    page.set_default_timeout(10000)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(BASE)

    def login(email):
        page.set_viewport_size({'width': 1440, 'height': 1000})
        if page.locator('#logout-btn').count():
            page.locator('#logout-btn').click()
        page.locator('#login-form input[name=email]').fill(email)
        page.locator('#login-form input[name=password]').fill('welcome2026')
        page.locator('#login-form button[type=submit]').click()
        expect(page.locator('#route-title')).to_be_visible()

    def route(name):
        page.locator(f'.nav-item[data-route="{name}"]').click()

    def data():
        return page.evaluate('JSON.parse(localStorage.getItem("welcomeBA.app.v1"))')

    login('admin@welcome.com')
    route('puntos')
    editor = page.frame_locator('#point-editor')
    expect(editor.locator('#metricTotal')).to_have_text('5')
    editor.locator('#pointsTableBody .edit-record[data-id=p1]').click()
    editor.locator('#pointName').fill('Mirador Obelisco · Integrado')
    # Advanced operational options survive save and are enforced in scheduling.
    editor.locator('[data-section=operation]').click()
    if not editor.locator('#allowMultiplePhotographers').is_checked():
        editor.locator('label:has(#allowMultiplePhotographers)').click()
    editor.locator('#saveTopBtn').click()
    assert data()['points'][0]['advanced']['values']['allowMultiplePhotographers']
    assert next(p for p in data()['points'] if p['id'] == 'p2')['schedule'] == '09:00 - 19:00'
    assert not next(p for p in data()['points'] if p['id'] == 'p2').get('advanced')
    page.reload()
    route('puntos')
    expect(page.frame_locator('#point-editor').locator('#pointsTableBody')).to_contain_text('Mirador Obelisco · Integrado')
    print('PASS Advanced point editor shares persistence with the full application', flush=True)

    page.locator('#point-operational').click()
    page.locator('#f-pointId').select_option('p1')
    page.locator('#save-select-point').click()
    page.locator('#f-commission').fill('17')
    page.locator('#save-point-operation-form').click()
    assert next(p for p in data()['points'] if p['id'] == 'p1')['commission'] == 17

    route('usuarios')
    def add_user(name, email, role, point=None):
        page.locator('#new-user').click()
        page.locator('#f-name').fill(name)
        page.locator('#f-email').fill(email)
        page.locator('#f-password').fill('welcome2026')
        page.locator('#f-role').select_option(role)
        if point:
            page.locator(f'#user-form input[name=points][value={point}]').check()
        page.locator('#save-user-form').click()
        expect(page.locator('#user-form')).to_have_count(0)
        return next(u for u in data()['users'] if u['email'] == email)['id']

    photographer_id = add_user('Fotógrafo integración', 'integracion@example.com', 'photographer', 'p1')
    add_user('Administración integración', 'administracion@example.com', 'admin')
    add_user('Encargado de punto', 'punto@example.com', 'pointManager', 'p2')
    route('dispositivos')
    page.locator('#new-device').click()
    page.locator('#device-form input[name=code]').fill('CAM-INTEGRACION')
    page.locator('#device-form input[name=model]').fill('Cámara de prueba')
    page.locator('#save-device').click()
    device_id = next(d for d in data()['devices'] if d['code'] == 'CAM-INTEGRACION')['id']

    route('jornadas')
    page.locator('#new-shift').click()
    page.locator('#f-photographerId').select_option(photographer_id)
    page.locator('#f-pointId').select_option('p1')
    page.locator(f'#shift-form input[name=deviceIds][value="{device_id}"]').check()
    page.locator('#save-shift-form').click()
    if page.locator('#shift-form').count():
        raise AssertionError(page.locator('.toast').all_inner_texts())
    expect(page.locator('#shift-form')).to_have_count(0)
    shift_id = next(s for s in data()['shifts'] if s['photographerId'] == photographer_id)['id']
    print('PASS Schedule inherits point settings, reserves materials and assigns equipment', flush=True)

    login('integracion@example.com')
    page.set_viewport_size({'width': 390, 'height': 844})
    expect(page.locator('#photo-new-sale')).to_be_disabled()
    page.locator('#photo-start-shift').click()
    page.locator('#f-locationReason').fill('Prueba del flujo sin geolocalización disponible')
    page.locator('#start-form input[name=stockAck]').check()
    page.locator('#start-form input[name=instructionAck]').check()
    page.locator('#save-start-form').click()
    page.locator('#photo-prepare').click()
    page.locator(f'#f-tool-{device_id}').select_option('received')
    page.locator('#f-cashOpeningARS').fill('10000')
    page.locator('#save-prepare-form').click()
    expect(page.locator('#photo-new-sale')).to_be_enabled()
    print('PASS Photographer mobile start, location exception, equipment gate and cash opening', flush=True)

    def sale(currency='ARS', received='18000'):
        page.locator('#photo-new-sale').click()
        page.locator('#sale-form select[name=currency]').select_option(currency)
        page.locator('#sale-lines select[data-key=productId]').select_option('pr2')
        page.locator('#f-received').fill(received)
        page.locator('#save-sale-form').click()
        expect(page.locator('#sale-form')).to_have_count(0)
        return data()['sales'][0]

    first_sale = sale()
    assert first_sale['commission'] == 3060
    assert first_sale['items'][0]['costARS'] == 1800
    login('jonatan@welcome.com')
    route('ventas')
    page.locator(f'.annul-sale[data-id="{first_sale["id"]}"]').click()
    page.locator('#f-reason').fill('Venta duplicada detectada en la prueba')
    page.locator('#save-annul-form').click()
    assert next(s for s in data()['sales'] if s['id'] == first_sale['id'])['status'] == 'Cobrada'
    assert data()['adjustments'][0]['status'] == 'Solicitada'
    login('administracion@example.com')
    route('ajustes')
    page.locator('.review-adjustment').first.click()
    page.locator('#f-reason').fill('Verificado el duplicado; se aprueba la reversión')
    page.locator('#save-adjustment-form').click()
    assert next(s for s in data()['sales'] if s['id'] == first_sale['id'])['status'] == 'Anulada'
    print('PASS Manager cannot annul directly; admin resolves request and reverses stock', flush=True)

    login('integracion@example.com')
    ars_sale = sale()
    usd_sale = sale('USD', '20')
    assert usd_sale['total'] == 12 and usd_sale['totalARS'] == 18000 and usd_sale['changeARS'] == 12000
    page.reload()
    expect(page.locator('#photo-new-sale')).to_be_enabled()
    assert data()['sales'][0]['id'] == usd_sale['id']
    page.set_viewport_size({'width': 390, 'height': 844})
    page.screenshot(path='/tmp/wba-fotografo-integrado.png', full_page=True)
    page.locator('#photo-close-shift').click()
    for key, value in {'frame': 28, 'sticker': 38, 'paper': 46, 'glue': 2}.items():
        page.locator(f'#f-returned-{key}').fill(str(value))
    page.locator('#f-glueUsed').fill('0')
    page.locator('#f-declared-ARS').fill('6000')
    page.locator('#f-declared-USD').fill('20')
    page.locator('#f-materialStatus').select_option('ok')
    page.locator('#f-pointStatus').select_option('ok')
    page.locator('#save-closure-form').click()
    expect(page.locator('#photo-new-sale')).to_be_disabled()
    rendition = next(r for r in data()['renditions'] if r['shiftId'] == shift_id)
    assert rendition['status'] == 'Presentada'
    assert rendition['commission'] == 6120
    assert rendition['currencyDifferences'] == {'ARS': 0, 'USD': 0}
    assert next(d for d in data()['devices'] if d['id'] == device_id)['status'] == 'Disponible'
    print('PASS Two currencies, ARS change, persistent sales, material return and settlement', flush=True)

    login('jonatan@welcome.com')
    route('rendiciones')
    page.locator(f'.review-rendition[data-id="{rendition["id"]}"]').click()
    page.locator('#f-notes').fill('Cantidades de stock y monedas verificadas')
    page.locator('#save-review').click()
    login('administracion@example.com')
    route('rendiciones')
    page.locator(f'.review-rendition[data-id="{rendition["id"]}"]').click()
    page.locator('#f-notes').fill('Aprobación administrativa de la prueba')
    page.locator('#save-review').click()
    route('comisiones')
    page.locator('.pay-settlement').click()
    page.locator('#f-reference').fill('Comprobante de prueba integral')
    page.locator('#save-payment-form').click()
    assert next(l for l in data()['settlements'] if l['shiftId'] == shift_id)['status'] == 'Pagada'
    route('ventas')
    with page.expect_download() as download:
        page.locator('#export-sales').click()
    export_path = Path('/tmp/wba-integrated-sales.csv')
    download.value.save_as(export_path)
    csv = export_path.read_text()
    assert 'USD' in csv and usd_sale['id'] in csv and 'totalARS' in csv
    print('PASS Manager validation, admin approval, commission payment and currency-aware CSV', flush=True)

    login('punto@example.com')
    route('ventas')
    assert not page.locator(f'.sale-detail[data-id="{usd_sale["id"]}"]').count()
    assert not page.locator('.nav-item[data-route=finanzas]').count()
    assert not page.locator('.nav-item[data-route=comisiones]').count()
    assert not page.locator('#switch-role').count()
    print('PASS Point-manager scope excludes other points, net result and demonstration impersonation', flush=True)

    login('admin@welcome.com')
    route('aliados')
    page.locator('.settle-ally[data-id=a2]').click()
    page.locator('#f-value').fill('7500')
    page.locator('#f-reference').fill('Acuerdo combinado revisado: cálculo documentado para esta prueba')
    page.locator('#save-ally-settlement-form').click()
    assert data()['allySettlements'][0]['totalARS'] == 7500
    route('finanzas')
    expect(page.locator('#view')).to_contain_text('7.500')
    page.locator('#monthly-close').click()
    page.locator('#save-period-form').click()
    expect(page.locator('.toast').last).to_contain_text('jornadas sin aprobación')
    page.locator('#cancel-modal').click()
    print('PASS Reviewed commercial agreement enters finance; incomplete period close is blocked', flush=True)
    page.set_viewport_size({'width': 1440, 'height': 1000})
    route('dashboard')
    page.locator('.toast').evaluate_all('(nodes)=>nodes.forEach(n=>n.remove())')
    page.screenshot(path='/tmp/wba-dashboard-integrado.png', full_page=True)
    assert not errors, errors
    print('PASS No browser JavaScript errors during the entire workflow', flush=True)
    browser.close()
