import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { WebSocketService } from '../services/websocket.service';
import { StorageService } from '../services/storage.service';
import { GameState, CardResult } from '../models/user.model';

@Component({
  selector: 'app-game',
  template: `
    <div class="game-container" *ngIf="gameState">
      <!-- Header -->
      <div class="game-header">
        <div class="room-info">
          <h2>Sala: {{ gameState.room?.code }}</h2>
          <span class="user-count">{{ gameState.room?.users?.length || 0 }} usuarios</span>
        </div>
        <button class="btn-leave" (click)="leaveRoom()">Salir de la sala</button>
      </div>

      <!-- Área principal del juego -->
      <div class="game-area">
        <!-- Cartas de otros usuarios en el centro -->
        <div class="users-cards">
          <div 
            class="user-card-container" 
            *ngFor="let user of gameState.room?.users"
            [class.current-user]="user.id === (gameState.currentUser?.id || '')">
            
            <div class="user-info">
              <span class="user-name">{{ user.name }}</span>
              <span class="selection-indicator" *ngIf="user.hasSelected">✓</span>
            </div>

            <div class="card-placeholder">
              <div 
                class="playing-card"                [class.card-hidden]="!(gameState.room?.isRevealed || false)"
                [class.card-revealed]="gameState.room?.isRevealed || false">
                
                <div class="card-back" *ngIf="!gameState.room?.isRevealed">
                  <div class="card-pattern"></div>
                </div>
                
                <div class="card-front" *ngIf="gameState.room?.isRevealed">
                  {{ user.selectedCard ?? '?' }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Botón de revelar/nueva ronda -->
        <div class="center-action">
          <button 
            *ngIf="!gameState.room?.isRevealed"
            class="btn-reveal"
            (click)="revealCards()"
            [disabled]="!allUsersSelected()">
            Revelar Cartas
          </button>

          <button 
            *ngIf="gameState.room?.isRevealed"
            class="btn-new-round"
            (click)="startNewRound()">
            Nueva Ronda
          </button>
        </div>
      </div>

      <!-- Área inferior -->
      <div class="bottom-area">
        <!-- Cartas para seleccionar (modo votación) -->
        <div class="cards-selection" *ngIf="gamePhase === 'voting'">
          <h3>Selecciona tu estimación:</h3>
          <div class="fibonacci-cards">
            <button 
              *ngFor="let card of fibonacciCards"
              class="fibonacci-card"
              [class.selected]="(gameState.currentUser?.selectedCard || null) === card"
              (click)="selectCard(card)">
              {{ card }}
            </button>
          </div>
        </div>

        <!-- Tabla de resultados (modo revelado) -->
        <div class="results-table" *ngIf="gamePhase === 'revealed'">
          <h3>Resultados de la votación:</h3>
          <div class="results-grid">
            <div 
              *ngFor="let result of getCardResults()"
              class="result-item"
              [class.winner]="result.count === getMaxCount()">
              
              <div class="result-card">{{ result.value }}</div>
              <div class="result-info">
                <span class="result-count">{{ result.count }} voto{{ result.count !== 1 ? 's' : '' }}</span>
                <div class="result-users">{{ result.users.join(', ') }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="loading" *ngIf="!gameState">
      Cargando...
    </div>
  `,
  styles: [`
    .game-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      display: flex;
      flex-direction: column;
    }

    .game-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.1);
      padding: 1rem 2rem;
      border-radius: 10px;
      margin-bottom: 2rem;
      backdrop-filter: blur(10px);
      color: white;
    }

    .room-info h2 {
      margin: 0;
      font-size: 1.5rem;
    }

    .user-count {
      font-size: 0.875rem;
      opacity: 0.8;
    }

    .btn-leave {
      background: #e74c3c;
      color: white;
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .btn-leave:hover {
      background: #c0392b;
    }

    .game-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
    }

    .users-cards {
      display: flex;
      flex-wrap: wrap;
      gap: 2rem;
      justify-content: center;
      margin-bottom: 3rem;
    }

    .user-card-container {
      text-align: center;
    }

    .user-card-container.current-user .user-name {
      color: #4ade80;
      font-weight: bold;
    }

    .user-info {
      margin-bottom: 1rem;
      color: white;
    }

    .user-name {
      display: block;
      font-size: 1rem;
    }

    .selection-indicator {
      color: #4ade80;
      font-size: 1.2rem;
      margin-left: 0.5rem;
    }

    .card-placeholder {
      perspective: 1000px;
    }

    .playing-card {
      width: 80px;
      height: 120px;
      border-radius: 8px;
      position: relative;
      transform-style: preserve-3d;
      transition: transform 0.6s ease;
      cursor: pointer;
    }

    .card-hidden {
      transform: rotateY(0deg);
    }

    .card-revealed {
      transform: rotateY(180deg);
    }

    .card-back, .card-front {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 8px;
      backface-visibility: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: bold;
    }

    .card-back {
      background: linear-gradient(135deg, #2c3e50, #34495e);
      transform: rotateY(0deg);
    }

    .card-pattern {
      width: 40px;
      height: 40px;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle cx="10" cy="10" r="2" fill="%23667eea"/></svg>') repeat;
      opacity: 0.3;
    }

    .card-front {
      background: white;
      color: #333;
      transform: rotateY(180deg);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .center-action {
      margin: 2rem 0;
    }

    .btn-reveal, .btn-new-round {
      background: linear-gradient(135deg, #4ade80, #10b981);
      color: white;
      padding: 15px 30px;
      border: none;
      border-radius: 8px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }

    .btn-reveal:hover:not(:disabled), .btn-new-round:hover {
      transform: translateY(-2px);
    }

    .btn-reveal:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .bottom-area {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      padding: 2rem;
      backdrop-filter: blur(10px);
    }

    .cards-selection h3, .results-table h3 {
      color: white;
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .fibonacci-cards {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .fibonacci-card {
      width: 60px;
      height: 90px;
      background: white;
      border: 3px solid transparent;
      border-radius: 8px;
      font-size: 1.2rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .fibonacci-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.2);
    }

    .fibonacci-card.selected {
      border-color: #4ade80;
      background: #f0fdf4;
      transform: translateY(-5px);
    }

    .results-grid {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .result-item {
      background: rgba(255, 255, 255, 0.1);
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
      color: white;
      min-width: 120px;
    }

    .result-item.winner {
      background: rgba(74, 222, 128, 0.3);
      border: 2px solid #4ade80;
    }

    .result-card {
      width: 40px;
      height: 60px;
      background: white;
      color: #333;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      margin: 0 auto 0.5rem;
    }

    .result-count {
      font-weight: bold;
      display: block;
      margin-bottom: 0.5rem;
    }

    .result-users {
      font-size: 0.875rem;
      opacity: 0.8;
    }

    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 1.5rem;
    }
  `]
})
export class GameComponent implements OnInit, OnDestroy {
  gameState: GameState | null = null;
  gamePhase: 'voting' | 'revealed' = 'voting';
  fibonacciCards = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
  results: CardResult | null = null;
  
  private gameStateSubscription?: Subscription;
  private resultsSubscription?: Subscription;

  constructor(
    private router: Router,
    private webSocketService: WebSocketService,
    private storageService: StorageService
  ) {}
  ngOnInit(): void {
    const userName = this.storageService.getUserName();
    if (!userName) {
      this.router.navigate(['/']);
      return;
    }

    // Subscribe to game state changes
    this.gameStateSubscription = this.webSocketService.gameState$.subscribe(
      state => {
        this.gameState = state;
        this.gamePhase = state.gamePhase;
      }
    );

    // Subscribe to results
    this.resultsSubscription = this.webSocketService.results$.subscribe(
      results => {
        this.results = results;
      }
    );

    // Auto-reconnect logic for existing rooms
    this.attemptReconnection(userName);
  }

  private attemptReconnection(userName: string): void {
    const roomData = this.storageService.getRoomData();
    const currentState = this.webSocketService.getCurrentGameState();

    // If we have room data but no current room state, attempt to reconnect
    if (roomData && !currentState.room) {
      console.log('Attempting to reconnect to room:', roomData.roomCode);
      this.webSocketService.simulateJoinRoom(roomData.roomCode, userName);
    } else if (!currentState.room && !roomData) {
      // No room data, redirect to lobby
      this.router.navigate(['/lobby']);
    }
    
    // If we have a room but not connected to WebSocket, ensure connection
    if (!this.webSocketService.isConnected() && userName) {
      console.log('Ensuring WebSocket connection for user:', userName);
      this.webSocketService.connect(userName);
    }
  }

  ngOnDestroy(): void {
    this.gameStateSubscription?.unsubscribe();
    this.resultsSubscription?.unsubscribe();
  }

  selectCard(cardValue: number): void {
    this.webSocketService.simulateSelectCard(cardValue);
  }

  revealCards(): void {
    this.webSocketService.simulateRevealCards();
  }

  startNewRound(): void {
    this.webSocketService.simulateResetGame();
  }

  allUsersSelected(): boolean {
    return this.gameState?.room?.users.every(user => user.hasSelected) ?? false;
  }
  leaveRoom(): void {
    // First leave the WebSocket room
    this.webSocketService.leaveRoom();
    
    // Clear local storage
    this.storageService.clearRoomData();
    
    // Small delay to ensure WebSocket event is processed
    setTimeout(() => {
      this.router.navigate(['/lobby']);
    }, 100);
  }

  getCardResults(): { value: number; count: number; users: string[] }[] {
    if (!this.results) return [];

    // Convert the new CardResult format to the format expected by the template
    const resultMap: { [key: number]: { value: number; count: number; users: string[] } } = {};
    
    this.results.userSelections.forEach(selection => {
      if (!resultMap[selection.card]) {
        resultMap[selection.card] = {
          value: selection.card,
          count: 0,
          users: []
        };
      }
      resultMap[selection.card].count++;
      resultMap[selection.card].users.push(selection.user);
    });

    return Object.values(resultMap).sort((a, b) => b.count - a.count);
  }

  getMaxCount(): number {
    const results = this.getCardResults();
    return results.length > 0 ? results[0].count : 0;
  }
}
