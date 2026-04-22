# Landing Catalogo Reutilizable

Landing/catalogo estatica orientada a tiendas de zapatillas, moda, accesorios u otros negocios chicos que venden por WhatsApp e Instagram.

## Stack

- HTML semantico
- CSS custom responsive
- JavaScript para renderizar contenido y filtros

## Objetivo

Usarla como base comercial reutilizable para vender a:

- tiendas de zapatillas
- indumentaria
- accesorios
- negocios locales con catalogo simple

## Archivos

- `index.html`: estructura base
- `content.js`: contenido editable del cliente
- `styles.css`: estilos y responsive
- `script.js`: render del contenido y filtros

## Demos incluidas

Dentro de `content.js` ya tienes dos bases:

- `sneakers`: tienda de zapatillas
- `lifestyle`: moda, accesorios, regalos o deco

Para cambiar la demo principal, modifica:

- `const ACTIVE_DEMO = "sneakers";`

## Como personalizar rapido

Edita solo `content.js` para cambiar:

- demo base activa
- nombre de marca y logo (`brand`)
- WhatsApp e Instagram
- textos del hero
- producto destacado
- filtros
- productos del catalogo
- testimonios
- datos de contacto

## Logo

- Si quieres logo de texto, usa `logoText`
- Si quieres logo de imagen, pega la URL o ruta en `logoImage`

## Productos

Cada producto acepta:

- `category`
- `tag`
- `stock`
- `name`
- `description`
- `price`
- `artClass` para usar fondos visuales ya creados
- `image` si quieres reemplazar el fondo por una foto real

## Flujo recomendado para venderla

1. Elige la demo mas parecida al cliente.
2. Cambia `brand`, `hero`, `catalog.products` y `contact`.
3. Si el cliente tiene fotos, usa `image` en los productos.
4. Si no tiene fotos, deja los fondos abstractos y cambia solo textos y precios.

## Como visualizarla

Abre este archivo en el navegador:

- `C:\Users\Facun\Desktop\flowpilot-landing\flowpilot-landing\index.html`

Si usas Visual Studio Code, tambien puedes abrir esa carpeta y usar Live Server sobre `index.html`.
