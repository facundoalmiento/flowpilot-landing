const ACTIVE_DEMO = "morga";

const DEMOS = {
  morga: {
    meta: {
      title: "Morga | Seleccion curada",
      description: "Morga es una tienda con seleccion curada de accesorios, objetos y esenciales de estilo contemporaneo."
    },
    brand: {
      name: "Morga",
      tagline: "seleccion curada",
      logoText: "M",
      logoImage: "",
      whatsapp: "5491165432109",
      instagram: "https://instagram.com/morga.store"
    },
    hero: {
      eyebrow: "Morga seleccion",
      title: "Objetos, accesorios y piezas que se eligen por presencia.",
      text:
        "Curamos una coleccion simple y visual para quienes buscan regalar, renovar o encontrar algo con estilo sin perder tiempo.",
      secondaryCta: "Consultar stock",
      points: [
        "Envios a todo el pais",
        "Atencion por WhatsApp",
        "Opciones para regalo"
      ]
    },
    featured: {
      pill: "edicion destacada",
      name: "Canvas Weekend Bag",
      description: "Bolso de lona amplia con presencia sobria y detalles cuidados para escapadas, ciudad o regalo.",
      price: "$58.900",
      note: "envios a todo el pais",
      statsLabel: "Lo que mas consultan",
      stats: [
        { value: "+180", label: "consultas desde Instagram" },
        { value: "48 h", label: "promedio de entrega" }
      ]
    },
    trust: {
      copy: "Una tienda pensada para mirar rapido, elegir con claridad y resolver por WhatsApp.",
      items: ["seleccion curada", "envios disponibles", "regalos", "compra simple"]
    },
    catalog: {
      eyebrow: "Coleccion actual",
      title: "Piezas faciles de combinar, regalar o sumar al dia a dia.",
      text:
        "Texturas limpias, tonos nobles y productos elegidos para verse bien en foto y funcionar mejor en la vida real.",
      filters: [
        { label: "Todo", value: "all" },
        { label: "Bolsos", value: "bags" },
        { label: "Accesorios", value: "accessories" },
        { label: "Hogar", value: "home" }
      ],
      products: [
        {
          category: "bags",
          tag: "Bolsos",
          stock: "Nueva entrada",
          name: "Canvas Weekend Bag",
          description: "Bolso amplio con correa regulable y detalles de terminacion sobria.",
          price: "$58.900",
          artClass: "product-art-sand"
        },
        {
          category: "accessories",
          tag: "Accesorios",
          stock: "Muy elegido",
          name: "Aura Clip Set",
          description: "Set de clips metalicos con tonos suaves y brillo delicado para todos los dias.",
          price: "$18.500",
          artClass: "product-art-blush"
        },
        {
          category: "home",
          tag: "Hogar",
          stock: "Serie corta",
          name: "Vela Atelier 02",
          description: "Vela aromatica en vaso de vidrio con notas amaderadas y empaque listo para regalar.",
          price: "$21.900",
          artClass: "product-art-olive"
        },
        {
          category: "accessories",
          tag: "Accesorios",
          stock: "Reposicion reciente",
          name: "Soft Leather Wallet",
          description: "Billetera compacta con interior ordenado y textura suave al tacto.",
          price: "$27.400",
          artClass: "product-art-ink"
        }
      ]
    },
    benefits: {
      eyebrow: "El criterio",
      title: "Menos ruido, mejores elecciones.",
      items: [
        {
          title: "Seleccion con sentido",
          text: "Priorizamos piezas faciles de usar, regalar y combinar con una estetica cuidada."
        },
        {
          title: "Compra clara",
          text: "Precios visibles, categorias simples y contacto directo para resolver dudas rapido."
        },
        {
          title: "Ritmo actual",
          text: "La coleccion se mueve con entradas nuevas, reposiciones y productos que realmente interesan."
        }
      ]
    },
    reviews: {
      eyebrow: "Lo que dicen",
      title: "Una experiencia mas clara, visual y agradable para comprar.",
      items: [
        {
          text: "Me gusta porque se entiende rapido que hay, cuanto cuesta y como consultar sin perder tiempo.",
          author: "Sofia, clienta frecuente"
        },
        {
          text: "Los productos se ven prolijos, las fotos lucen bien y WhatsApp hace que la compra sea mucho mas directa.",
          author: "Agustin, compras para regalos"
        },
        {
          text: "Tiene esa sensacion de tienda cuidada, sin verse cargada ni complicada.",
          author: "Martina, showroom lifestyle"
        }
      ]
    },
    cta: {
      eyebrow: "Morga online",
      title: "Consultanos por colores, stock, envios y opciones para regalo.",
      button: "Hablar ahora"
    },
    contact: {
      eyebrow: "Contacto",
      title: "Atencion directa para resolver rapido y comprar sin vueltas.",
      cardTitle: "Info util",
      details: [
        "Atencion online y retiro coordinado",
        "Pedidos por WhatsApp e Instagram",
        "Envios a todo el pais"
      ],
      actionsTitle: "Escribinos",
      note: "Respondemos consultas de stock, medios de pago, envios y regalos."
    }
  }
};

const demoFromUrl = new URLSearchParams(window.location.search).get("demo");
const currentDemoKey = DEMOS[demoFromUrl] ? demoFromUrl : ACTIVE_DEMO;

window.DEMOS = DEMOS;
window.currentDemoKey = currentDemoKey;
window.siteContent = DEMOS[currentDemoKey];
