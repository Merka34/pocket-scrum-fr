import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { StorageService } from '../services/storage.service';
import { WebSocketService } from '../services/websocket.service';

@Component({
  selector: 'app-lobby',
  template: `
    <div class="lobby-container">
      <div class="header">
        <h1>Pocket Scrum</h1>
        <div class="user-info">
          <span>¡Hola, {{ userName }}!</span>
          <button class="btn-secondary" (click)="changeName()">Cambiar nombre</button>
        </div>
      </div>

      <div class="lobby-content">        <div class="action-cards">
          <div class="action-card">
            <h2>Crear Sala</h2>
            <p>Crea una nueva sala de poker para tu equipo</p>
            <button 
              class="btn-primary" 
              (click)="createRoom()"
              [disabled]="isLoading">
              {{ isLoading && isCreating ? 'Creando...' : 'Crear Nueva Sala' }}
            </button>
          </div>

          <div class="action-card">
            <h2>Unirse a Sala</h2>
            <p>Únete a una sala existente con el código</p>
            <form (ngSubmit)="joinRoom()" #joinForm="ngForm">
              <input 
                type="text" 
                [(ngModel)]="roomCode" 
                name="roomCode"
                placeholder="Código de sala (5 caracteres)"
                maxlength="5"
                required
                class="form-control"
                [disabled]="isLoading">
              <button 
                type="submit" 
                class="btn-primary"
                [disabled]="joinForm.invalid || isLoading">
                {{ isLoading && !isCreating ? 'Uniéndose...' : 'Unirse a Sala' }}
              </button>
            </form>
          </div>
        </div>

        <div *ngIf="errorMessage" class="error-message">
          {{ errorMessage }}
          <button class="btn-link" (click)="clearError()">×</button>
        </div>

        <div class="info-section">
          <h3>¿Cómo funciona?</h3>
          <ul>
            <li>Crea una sala o únete a una existente</li>
            <li>Selecciona una carta con los puntos fibonacci</li>
            <li>Espera a que todos seleccionen</li>
            <li>Revela las cartas y ve los resultados</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .lobby-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.1);
      padding: 1rem 2rem;
      border-radius: 10px;
      margin-bottom: 2rem;
      backdrop-filter: blur(10px);
    }

    .header h1 {
      color: white;
      margin: 0;
      font-size: 2rem;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      color: white;
    }

    .lobby-content {
      max-width: 1200px;
      margin: 0 auto;
    }

    .action-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .action-card {
      background: white;
      padding: 2rem;
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      text-align: center;
    }

    .action-card h2 {
      color: #333;
      margin-bottom: 1rem;
    }

    .action-card p {
      color: #666;
      margin-bottom: 1.5rem;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 2px solid #e1e5e9;
      border-radius: 6px;
      font-size: 1rem;
      margin-bottom: 1rem;
      box-sizing: border-box;
      text-transform: uppercase;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 30px;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: transform 0.2s ease;
      width: 100%;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: transparent;
      color: white;
      padding: 8px 16px;
      border: 2px solid white;
      border-radius: 6px;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-secondary:hover {
      background: white;
      color: #667eea;
    }

    .info-section {
      background: rgba(255, 255, 255, 0.1);
      padding: 2rem;
      border-radius: 10px;
      backdrop-filter: blur(10px);
      color: white;
    }

    .info-section h3 {
      margin-bottom: 1rem;
    }

    .info-section ul {
      list-style: none;
      padding: 0;
    }

    .info-section li {
      padding: 0.5rem 0;
      padding-left: 1.5rem;
      position: relative;
    }    .info-section li:before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #4ade80;
      font-weight: bold;
    }

    .error-message {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #ef4444;
      padding: 1rem;
      border-radius: 8px;
      margin-top: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .btn-link {
      background: none;
      border: none;
      color: #ef4444;
      cursor: pointer;
      font-size: 1.2rem;
      padding: 0;
      margin-left: 1rem;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class LobbyComponent implements OnInit, OnDestroy {
  userName: string = '';
  roomCode: string = '';
  isLoading: boolean = false;
  isCreating: boolean = false;
  errorMessage: string | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private storageService: StorageService,
    private webSocketService: WebSocketService
  ) {}

  ngOnInit(): void {
    const savedName = this.storageService.getUserName();
    if (!savedName) {
      this.router.navigate(['/']);
      return;
    }
    
    this.userName = savedName;

    // Subscribe to game state changes
    this.subscriptions.push(
      this.webSocketService.gameState$.subscribe(gameState => {
        if (gameState.room && gameState.currentUser) {
          this.isLoading = false;
          this.storageService.saveRoomData(gameState.room.code, gameState.currentUser.id);
          this.router.navigate(['/game']);
        }
      })
    );

    // Subscribe to errors
    this.subscriptions.push(
      this.webSocketService.error$.subscribe(error => {
        if (error) {
          this.errorMessage = error;
          this.isLoading = false;
          this.isCreating = false;
        }
      })
    );

    // Check for reconnection
    this.checkForReconnection();
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    // Don't disconnect here if we're navigating to game
  }
  private checkForReconnection(): void {
    const roomData = this.storageService.getRoomData();
    if (roomData) {
      const timeDiff = Date.now() - roomData.timestamp;
      const maxReconnectTime = 30 * 60 * 1000; // 30 minutes

      if (timeDiff < maxReconnectTime) {
        console.log('Attempting reconnection to room:', roomData.roomCode);
        this.isLoading = true;
        
        // Ensure WebSocket connection before attempting to join room
        if (!this.webSocketService.isConnected()) {
          this.webSocketService.connect(this.userName);
        }
        
        // Small delay to ensure connection is established
        setTimeout(() => {
          this.webSocketService.simulateJoinRoom(roomData.roomCode, this.userName);
        }, 500);
      } else {
        this.storageService.clearRoomData();
      }
    }
  }
  createRoom(): void {
    this.isLoading = true;
    this.isCreating = true;
    this.clearError();
    
    // Ensure connection before creating room
    if (!this.webSocketService.isConnected()) {
      this.webSocketService.connect(this.userName);
    }
    
    // Small delay to ensure connection is established
    setTimeout(() => {
      this.webSocketService.simulateCreateRoom(this.userName);
    }, 300);
  }

  joinRoom(): void {
    if (this.roomCode.trim().length === 5) {
      this.isLoading = true;
      this.isCreating = false;
      this.clearError();
      
      // Ensure connection before joining room
      if (!this.webSocketService.isConnected()) {
        this.webSocketService.connect(this.userName);
      }
      
      // Small delay to ensure connection is established
      setTimeout(() => {
        this.webSocketService.simulateJoinRoom(this.roomCode.trim().toUpperCase(), this.userName);
      }, 300);
    }
  }
  changeName(): void {
    // First leave any current room
    this.webSocketService.leaveRoom();
    this.webSocketService.forceLeaveRoom();
    
    // Clear all storage
    this.storageService.clearUserName();
    this.storageService.clearRoomData();
    
    // Disconnect and navigate
    this.webSocketService.disconnect();
    this.router.navigate(['/']);
  }

  clearError(): void {
    this.errorMessage = null;
    this.webSocketService.clearError();
  }
}
