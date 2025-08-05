# Pocket Scrum - Poker de Estimación

Una aplicación Angular para realizar estimaciones de SCRUM utilizando la técnica de Planning Poker.

## Características

- **Gestión de usuarios**: Guarda el nombre del usuario en localStorage para sesiones futuras
- **Salas de poker**: Crear y unirse a salas usando códigos de 5 caracteres
- **Cartas Fibonacci**: Utiliza la secuencia de Fibonacci para las estimaciones (1, 2, 3, 5, 8, 13, 21, 34, 55, 89)
- **Tiempo real**: Simulación de actualizaciones en tiempo real (preparado para WebSockets)
- **Revelación de cartas**: Sistema de votación secreta con revelación simultánea
- **Resultados**: Análisis automático de las estimaciones con identificación de la carta más votada
- **Reconexión**: Capacidad de reconectarse a salas existentes después de recargar la página

## Tecnologías Utilizadas

- Angular 12
- TypeScript
- RxJS para programación reactiva
- Socket.io-client (preparado para WebSockets)
- CSS3 con animaciones y gradientes

## Instalación

1. Clona el repositorio:
```bash
git clone <url-del-repositorio>
cd pocket-scrum
```

2. Instala las dependencias:
```bash
npm install
```

3. Ejecuta la aplicación:
```bash
npm start
```

4. Abre tu navegador en `http://localhost:4200`

## Estructura del Proyecto

```
src/
├── app/
│   ├── components/           # Componentes de la aplicación
│   │   ├── name-input.component.ts    # Pantalla de entrada de nombre
│   │   ├── lobby.component.ts         # Lobby principal
│   │   └── game.component.ts          # Sala de juego
│   ├── models/              # Interfaces y modelos
│   │   └── user.model.ts    # Modelos de User, Room, GameState
│   ├── services/            # Servicios
│   │   ├── storage.service.ts         # Gestión de localStorage
│   │   └── websocket.service.ts       # Comunicación WebSocket (simulada)
│   ├── app.component.ts     # Componente principal
│   └── app.module.ts        # Módulo principal
└── styles.css               # Estilos globales
```

## Flujo de la Aplicación

1. **Entrada**: El usuario ingresa su nombre (se guarda en localStorage)
2. **Lobby**: Puede crear una sala nueva o unirse a una existente
3. **Sala de juego**: 
   - Visualiza cartas de otros usuarios (ocultas hasta la revelación)
   - Selecciona su estimación usando cartas Fibonacci
   - Ve indicadores cuando otros usuarios han seleccionado
   - Puede revelar todas las cartas cuando todos hayan votado
   - Ve resultados con análisis de estimaciones
   - Puede iniciar una nueva ronda

## Funcionalidades Implementadas

### ✅ Gestión de Usuario
- Formulario de entrada de nombre con validación
- Persistencia en localStorage
- Reconexión automática

### ✅ Sistema de Salas
- Generación de códigos aleatorios de 5 caracteres
- Creación de salas nuevas
- Unión a salas existentes por código

### ✅ Juego de Poker
- Cartas con valores Fibonacci
- Votación secreta
- Indicadores de selección
- Revelación simultánea
- Análisis de resultados
- Rondas múltiples

### ✅ Interfaz de Usuario
- Diseño responsive y moderno
- Animaciones CSS
- Efectos visuales para cartas
- Gradientes y sombras
- Feedback visual inmediato

## Próximas Mejoras

### Backend Real con WebSockets
Para implementar funcionalidad real de tiempo real, se necesitará:

1. **Servidor Node.js con Socket.io**:
```javascript
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"]
  }
});

// Lógica de salas y usuarios
// Eventos: createRoom, joinRoom, selectCard, revealCards, resetGame
```

2. **Persistencia de datos**:
   - Base de datos para salas y usuarios
   - Historial de estimaciones
   - Estadísticas de equipos

3. **Funcionalidades adicionales**:
   - Autenticación de usuarios
   - Roles (Scrum Master, Desarrollador)
   - Historias de usuario
   - Exportación de resultados
   - Métricas y analytics

## Configuración para Desarrollo

La aplicación actualmente funciona en modo simulación. Para habilitar WebSockets reales:

1. Configura el servidor backend
2. Actualiza la URL en `websocket.service.ts`:
```typescript
this.socket = io('http://localhost:3001');
```
3. Reemplaza los métodos `simulate*` con llamadas reales al socket

## Comandos Útiles

```bash
# Desarrollo
npm start                 # Inicia servidor de desarrollo
npm run build            # Construye para producción
npm run test             # Ejecuta pruebas unitarias
npm run e2e              # Ejecuta pruebas end-to-end

# Linting
npm run lint             # Verifica código con ESLint
```

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.
