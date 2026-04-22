// Edita este archivo para personalizar la web para cada cliente.
// Puedes elegir una demo base y luego ajustar marca, links, textos y productos desde aca.

const ACTIVE_DEMO = "sneakers";

const DEMOS = {
  sneakers: {
    meta: {
      title: "Nova Kicks | Catalogo para tienda de zapatillas",
      description: "Catalogo online de zapatillas con modelos destacados, talles y consultas por WhatsApp."
    },
    brand: {
      name: "Nova Kicks",
      tagline: "Drop urbano 2026",
      logoText: "NK",
      logoImage: "",
      whatsapp: "5491123456789",
      instagram: "https://instagram.com/novakicks"
    },
    hero: {
      eyebrow: "Tienda lista para vender mas",
      title: "Zapatillas que entran por los ojos y se consultan en dos toques.",
      text:
        "Modelos seleccionados para uso diario, entrenamiento y salidas. Mira los destacados, consulta talles y pedi tu par por WhatsApp sin vueltas.",
      secondaryCta: "Hablar con ventas",
      points: [
        "Envios a todo el pais",
        "Pagos por transferencia y efectivo",
        "Cambios faciles dentro de 10 dias"
      ]
    },
    featured: {
      pill: "Nuevo drop",
      name: "Urban Sprint 04",
      description: "Diseno retro-running para uso diario con base liviana y suela de alto agarre.",
      price: "$89.900",
      note: "6 cuotas sin interes",
      statsLabel: "Mas buscadas",
      stats: [
        { value: "+320", label: "consultas del ultimo mes" },
        { value: "24 h", label: "promedio de despacho" }
      ]
    },
    trust: {
      copy: "Elegidas por tiendas multimarca, revendedores y clientes que compran por redes.",
      items: ["Atencion humana", "Catalogo simple", "Mobile first", "Lista para anuncios"]
    },
    catalog: {
      eyebrow: "Catalogo destacado",
      title: "Pares pensados para convertir vistas en consultas.",
      text:
        "Elegimos modelos con buena presencia, talles consultables y atencion directa para que comprar sea simple desde el primer mensaje.",
      filters: [
        { label: "Todos", value: "all" },
        { label: "Urbanas", value: "urbano" },
        { label: "Running", value: "running" },
        { label: "Premium", value: "premium" }
      ],
      products: [
        {
          category: "urbano",
          tag: "Urbano",
          stock: "Stock limitado",
          name: "Street Flow Beige",
          description: "Perfil limpio, tonos neutros y comodidad para uso diario.",
          price: "$74.900",
          artClass: "product-art-sunset"
        },
        {
          category: "running",
          tag: "Running",
          stock: "Talles 39 al 45",
          name: "Velocity Mint Pro",
          description: "Respuesta elastica y capellada respirable para entrenar liviano.",
          price: "$92.500",
          artClass: "product-art-mint"
        },
        {
          category: "premium",
          tag: "Premium",
          stock: "Edicion especial",
          name: "Noir Pulse Leather",
          description: "Terminacion premium con presencia fuerte para outfits mas sobrios.",
          price: "$109.900",
          artClass: "product-art-night"
        },
        {
          category: "urbano",
          tag: "Urbano",
          stock: "Favorita del mes",
          name: "Cloud District 77",
          description: "Silueta chunky con look moderno y base acolchada.",
          price: "$81.400",
          artClass: "product-art-sky"
        }
      ]
    },
    benefits: {
      eyebrow: "Por que funciona",
      title: "Una web simple vende mejor que una tienda confusa.",
      items: [
        {
          title: "Entra bien en celular",
          text: "La mayoria llega desde Instagram o anuncios. La experiencia esta pensada primero para mobile."
        },
        {
          title: "Invita a escribir",
          text: "Todo empuja al contacto rapido por WhatsApp, que es donde cierran muchas tiendas chicas."
        },
        {
          title: "Se adapta a otros rubros",
          text: "Actualizamos destacados, precios y disponibilidad para que siempre encuentres opciones vigentes."
        }
      ]
    },
    reviews: {
      eyebrow: "Confianza",
      title: "Textos cortos, reales y faciles de escanear.",
      items: [
        {
          text: "Subimos los modelos nuevos y empezamos a recibir consultas el mismo fin de semana. La gente entendia rapido precios, talles y como comprar.",
          author: "Lucia, tienda multimarca"
        },
        {
          text: "Nos sirvio porque no queriamos un ecommerce complejo. Con el catalogo mostramos modelos y cerramos por WhatsApp.",
          author: "Marcos, local de sneakers"
        },
        {
          text: "Se siente mas profesional que vender solo por Instagram. Da confianza y ordena mejor las consultas.",
          author: "Camila, showroom de indumentaria"
        }
      ]
    },
    cta: {
      eyebrow: "Compra sin vueltas",
      title: "Encontrar tu proximo par puede ser mucho mas simple.",
      button: "Consultar disponibilidad"
    },
    contact: {
      eyebrow: "Contacto",
      title: "Ideal para cerrar desde anuncios, Instagram o referencia directa.",
      cardTitle: "Datos del local",
      details: [
        "Showroom en Palermo, Buenos Aires",
        "Lunes a sabados de 10 a 19 hs",
        "Envios a Argentina y retiro en punto"
      ],
      actionsTitle: "Canales rapidos",
      note: "Respondemos consultas de talles, disponibilidad y formas de envio."
    }
  },
  lifestyle: {
    meta: {
      title: "Casa Brava | Catalogo para moda y accesorios",
      description: "Catalogo online de moda, accesorios y productos seleccionados con consultas por WhatsApp."
    },
    brand: {
      name: "Casa Brava",
      tagline: "Moda, accesorios y objetos con onda",
      logoText: "CB",
      logoImage: "",
      whatsapp: "5491165432109",
      instagram: "https://instagram.com/casabrava.store"
    },
    hero: {
      eyebrow: "Catalogo listo para campañas",
      title: "Una vidriera online simple para ropa, accesorios y productos con estilo.",
      text:
        "Pensada para marcas chicas que quieren verse mas prolijas, mostrar destacados y cerrar pedidos por WhatsApp sin montar un ecommerce complejo.",
      secondaryCta: "Consultar productos",
      points: [
        "Ideal para Instagram Ads",
        "Se adapta a ropa, regalos o deco",
        "Cambio rapido de productos y precios"
      ]
    },
    featured: {
      pill: "Coleccion destacada",
      name: "Canvas Weekend Bag",
      description: "Bolso amplio de lona con terminaciones premium para escapadas, uso diario o regalo.",
      price: "$58.900",
      note: "Hasta 3 cuotas sin interes",
      statsLabel: "Lo mas visto",
      stats: [
        { value: "+180", label: "clics desde Instagram" },
        { value: "48 h", label: "tiempo promedio de entrega" }
      ]
    },
    trust: {
      copy: "Una seleccion pensada para quienes buscan productos lindos, utiles y faciles de regalar.",
      items: ["Curado semanal", "Atencion rapida", "Envios disponibles", "Compra por WhatsApp"]
    },
    catalog: {
      eyebrow: "Destacados de la semana",
      title: "Una seleccion curada para comprar facil y regalar mejor.",
      text:
        "Productos elegidos por estilo, utilidad y buena presentacion. Consulta disponibilidad, colores y envios por WhatsApp.",
      filters: [
        { label: "Todos", value: "all" },
        { label: "Bolsos", value: "bags" },
        { label: "Accesorios", value: "accessories" },
        { label: "Home", value: "home" }
      ],
      products: [
        {
          category: "bags",
          tag: "Bolsos",
          stock: "Nueva temporada",
          name: "Canvas Weekend Bag",
          description: "Bolso amplio con correa regulable y detalles en cuero ecologico.",
          price: "$58.900",
          artClass: "product-art-sunset"
        },
        {
          category: "accessories",
          tag: "Accesorios",
          stock: "Best seller",
          name: "Aura Clip Set",
          description: "Set de clips metalicos para pelo en tonos suaves y acabados brillantes.",
          price: "$18.500",
          artClass: "product-art-mint"
        },
        {
          category: "home",
          tag: "Home",
          stock: "Edicion limitada",
          name: "Vela Atelier 02",
          description: "Vela aromatica en vaso de vidrio con notas amaderadas y packaging de regalo.",
          price: "$21.900",
          artClass: "product-art-night"
        },
        {
          category: "accessories",
          tag: "Accesorios",
          stock: "Reposicion reciente",
          name: "Soft Leather Wallet",
          description: "Billetera compacta con interior organizado y textura suave al tacto.",
          price: "$27.400",
          artClass: "product-art-sky"
        }
      ]
    },
    benefits: {
      eyebrow: "Compra simple",
      title: "Productos lindos, informacion clara y atencion sin vueltas.",
      items: [
        {
          title: "Seleccion curada",
          text: "Destacamos productos con buena salida, presentacion cuidada y opciones faciles de combinar."
        },
        {
          title: "No depende de ecommerce complejo",
          text: "Sirve perfecto para negocios que venden por mensajes, reserva o pago coordinado."
        },
        {
          title: "Catalogo actualizado",
          text: "Renovamos destacados por temporada, stock y productos que mas consultan nuestros clientes."
        }
      ]
    },
    reviews: {
      eyebrow: "Percepcion de marca",
      title: "Una experiencia simple para descubrir productos y consultar rapido.",
      items: [
        {
          text: "Pasamos de vender solo por historias a tener una vidriera ordenada para mandar en campañas y responder mas rapido.",
          author: "Sofi, tienda de accesorios"
        },
        {
          text: "La usamos para mostrar colecciones por temporada sin depender de una tienda enorme ni de subir todo a un sistema.",
          author: "Agus, marca de ropa"
        },
        {
          text: "Quedo lo suficientemente flexible como para cambiar productos toda la semana sin tocar el diseño.",
          author: "Mel, showroom lifestyle"
        }
      ]
    },
    cta: {
      eyebrow: "Novedades listas",
      title: "Descubri productos con estilo para tu dia a dia o para regalar.",
      button: "Ver disponibilidad"
    },
    contact: {
      eyebrow: "Canales",
      title: "Perfecta para mandar desde bio, pauta o respuesta rapida por mensaje.",
      cardTitle: "Datos del showroom",
      details: [
        "Atencion online y retiro por zona norte",
        "Pedidos por WhatsApp e Instagram",
        "Envios a todo el pais"
      ],
      actionsTitle: "Links clave",
      note: "Escribinos para consultar colores, stock, envios y opciones de regalo."
    }
  }
};

const demoFromUrl = new URLSearchParams(window.location.search).get("demo");
const currentDemoKey = DEMOS[demoFromUrl] ? demoFromUrl : ACTIVE_DEMO;

window.DEMOS = DEMOS;
window.currentDemoKey = currentDemoKey;
window.siteContent = DEMOS[currentDemoKey];
