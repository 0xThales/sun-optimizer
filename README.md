# ☀️ SunOptimizer

**Encuentra el mejor momento para tomar el sol** - Una aplicación web mobile-first que te ayuda a optimizar tu exposición solar basándose en tu ubicación actual.

![SunOptimizer Screenshot](./screenshot.png)

## ✨ Características

- 🌍 **Geolocalización automática** - Detecta tu ubicación al cargar
- 🔍 **Búsqueda de ubicaciones** - Busca cualquier ciudad del mundo
- 📊 **Índice UV en tiempo real** - Con código de colores según nivel de riesgo
- ⏰ **Hora óptima de exposición** - Calcula el mejor momento para vitamina D
- 🌅 **Horarios solares** - Amanecer, atardecer y Golden Hour
- 📈 **Gráfico UV por horas** - Visualiza la radiación a lo largo del día
- 🛡️ **Recomendaciones de protección** - SPF sugerido y precauciones

## 🎨 Diseño

- **Glass UI (Glassmorphism)** - Interfaz moderna con efecto de cristal
- **Mobile-first** - Diseño responsivo optimizado para móviles
- **Lucide Icons** - Iconografía consistente y elegante
- **Tailwind CSS** - Estilos utilitarios y personalizables

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Iconos**: Lucide React
- **Gráficos**: Recharts
- **APIs**: Open-Meteo (gratuita, sin API key)

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/sun-optimizer.git
cd sun-optimizer

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📦 Estructura del Proyecto

```
sun_project/
├── app/
│   ├── api/weather/route.ts   # API Route para datos meteorológicos
│   ├── globals.css            # Estilos globales + Glass UI
│   ├── layout.tsx             # Layout con fondo fijo
│   └── page.tsx               # Página principal
├── components/
│   ├── ui/                    # Componentes Glass UI base
│   ├── LocationSearch.tsx     # Buscador de ubicaciones
│   ├── UVIndexDisplay.tsx     # Display de índice UV
│   ├── OptimalTimeCard.tsx    # Card de hora óptima
│   ├── UVChart.tsx            # Gráfico de UV por horas
│   └── SunTimes.tsx           # Horarios solares
├── lib/
│   ├── weather/               # Clientes de APIs meteorológicas
│   ├── utils/                 # Utilidades (cálculos, geolocalización)
│   └── constants.ts           # Constantes (umbrales UV, colores)
├── types/                     # Tipos TypeScript
└── public/
    └── weather.avif           # Imagen de fondo
```

## 🌡️ Niveles de UV

| UV Index | Nivel    | Color       | SPF Recomendado |
| -------- | -------- | ----------- | --------------- |
| 0-2      | Bajo     | 🟢 Verde    | 15              |
| 3-5      | Moderado | 🟡 Amarillo | 30              |
| 6-7      | Alto     | 🟠 Naranja  | 30+             |
| 8-10     | Muy Alto | 🔴 Rojo     | 50              |
| 11+      | Extremo  | 🟣 Púrpura  | 50+             |

## 📡 APIs Utilizadas

### Open-Meteo (Predeterminada)

- Gratuita, sin necesidad de API key
- Datos de UV, temperaturas y horarios solares
- [Documentación](https://open-meteo.com/en/docs)

### OpenWeatherMap (Opcional)

Para usar OpenWeatherMap como API primaria, crea un archivo `.env.local`:

```env
NEXT_PUBLIC_OPENWEATHER_API_KEY=tu_api_key_aqui
```

Obtén tu API key gratuita en [OpenWeatherMap](https://openweathermap.org/api).

## 🔮 Roadmap Futuro

- [ ] Perfil de usuario (fototipo de piel)
- [ ] Historial de exposición solar
- [ ] Notificaciones push
- [ ] Integración con wearables
- [ ] Cálculo preciso de vitamina D
- [ ] PWA (Progressive Web App)

## 📄 Licencia

MIT License - Siéntete libre de usar y modificar este proyecto.

---

Hecho con ☀️ por SunOptimizer
