import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { Room, User, GameState, CardResult } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket;
  private gameStateSubject = new BehaviorSubject<GameState>({
    room: null,
    currentUser: null,
    gamePhase: 'voting'
  });

  private errorSubject = new BehaviorSubject<string | null>(null);
  private resultsSubject = new BehaviorSubject<CardResult | null>(null);

  public gameState$ = this.gameStateSubject.asObservable();
  public error$ = this.errorSubject.asObservable();
  public results$ = this.resultsSubject.asObservable();
  constructor() {
    this.socket = io('https://pocket-scrum-bk.onrender.com', {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000
    });

    this.setupSocketListeners();
    
    // Auto-connect if we have a stored username
    this.initializeConnection();
  }
  private initializeConnection(): void {
    // Check if we have stored user data and should auto-connect
    setTimeout(() => {
      const savedUsername = localStorage.getItem('pocket-scrum-username');
      const roomData = localStorage.getItem('pocket-scrum-room-data');
      
      if (savedUsername && !this.socket.connected) {
        console.log('Auto-connecting with saved username:', savedUsername);
        this.connect(savedUsername);
        
        // If we have room data, attempt to rejoin the room
        if (roomData) {
          try {
            const parsedRoomData = JSON.parse(roomData);
            const timeDiff = Date.now() - parsedRoomData.timestamp;
            const maxReconnectTime = 30 * 60 * 1000; // 30 minutes
            
            if (timeDiff < maxReconnectTime) {
              console.log('Auto-reconnecting to room:', parsedRoomData.roomCode);
              setTimeout(() => {
                this.joinRoom(parsedRoomData.roomCode);
              }, 1000); // Wait for connection to be established
            }
          } catch (error) {
            console.error('Error parsing room data:', error);
          }
        }
      }
    }, 100); // Small delay to ensure localStorage is available
  }
  private setupSocketListeners(): void {
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.errorSubject.next(null);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('joined', (data: { user: User }) => {
      this.updateGameState({ currentUser: data.user });
    });

    this.socket.on('roomCreated', (data: { room: any, user: User }) => {
      const room = this.mapServerRoomToRoom(data.room);
      this.updateGameState({ 
        room, 
        currentUser: data.user,
        gamePhase: data.room.phase === 'revealed' ? 'revealed' : 'voting'
      });
    });

    this.socket.on('roomJoined', (data: { room: any, user: User }) => {
      const room = this.mapServerRoomToRoom(data.room);
      this.updateGameState({ 
        room, 
        currentUser: data.user,
        gamePhase: data.room.phase === 'revealed' ? 'revealed' : 'voting'
      });
    });    this.socket.on('userJoined', (data: { user: User, room: any }) => {
      const room = this.mapServerRoomToRoom(data.room);
      this.updateGameState({ room });
    });

    this.socket.on('userLeft', (data: { userId: string, room: any }) => {
      const room = this.mapServerRoomToRoom(data.room);
      this.updateGameState({ room });
    });

    this.socket.on('userDisconnected', (data: { userId: string, room: any }) => {
      const room = this.mapServerRoomToRoom(data.room);
      this.updateGameState({ room });
    });

    this.socket.on('leftRoom', (data: { success: boolean }) => {
      if (data.success) {
        // Clear local state when successfully left room
        this.updateGameState({ 
          room: null, 
          currentUser: null, 
          gamePhase: 'voting' 
        });
        this.resultsSubject.next(null);
      }
    });

    this.socket.on('cardSelected', (data: { userId: string, room: any }) => {
      const room = this.mapServerRoomToRoom(data.room);
      this.updateGameState({ room });
    });

    this.socket.on('cardsRevealed', (data: { room: any, results: any }) => {
      const room = this.mapServerRoomToRoom(data.room);
      this.updateGameState({ 
        room, 
        gamePhase: 'revealed' 
      });
      
      if (data.results) {
        const cardResult: CardResult = {
          userSelections: data.results.userSelections,
          mostSelected: data.results.mostSelected,
          totalVotes: data.results.totalVotes
        };
        this.resultsSubject.next(cardResult);
      }
    });

    this.socket.on('gameReset', (data: { room: any }) => {
      const room = this.mapServerRoomToRoom(data.room);
      this.updateGameState({ 
        room, 
        gamePhase: 'voting' 
      });
      this.resultsSubject.next(null);
    });

    this.socket.on('error', (error: { message: string }) => {
      console.error('WebSocket error:', error);
      this.errorSubject.next(error.message);
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('Connection error:', error);
      this.errorSubject.next('Failed to connect to server. Please try again.');
    });
  }
  private mapServerRoomToRoom(serverRoom: any): Room {
    return {
      id: serverRoom.code, // Use code as ID for simplicity
      code: serverRoom.code,
      users: serverRoom.users.map((user: any) => ({
        id: user.id,
        name: user.name,
        hasSelected: serverRoom.selections && serverRoom.selections[user.id] !== undefined,
        selectedCard: serverRoom.phase === 'revealed' && serverRoom.selections ? 
          serverRoom.selections[user.id] : null
      })),
      isRevealed: serverRoom.phase === 'revealed',
      createdAt: new Date()
    };
  }

  private updateGameState(updates: Partial<GameState>): void {
    const currentState = this.gameStateSubject.value;
    this.gameStateSubject.next({
      ...currentState,
      ...updates
    });
  }
  connect(username: string): void {
    if (!this.socket.connected) {
      this.socket.connect();
      this.socket.emit('join', { username });
    }
  }

  disconnect(): void {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  isConnected(): boolean {
    return this.socket.connected;
  }

  createRoom(): void {
    this.socket.emit('createRoom', {});
  }
  joinRoom(roomCode: string): void {
    this.socket.emit('joinRoom', { roomCode: roomCode.toUpperCase() });
  }

  leaveRoom(): void {
    const currentState = this.gameStateSubject.value;
    if (currentState.room) {
      this.socket.emit('leaveRoom', { 
        roomCode: currentState.room.code 
      });
    }
  }

  selectCard(card: number): void {
    const currentState = this.gameStateSubject.value;
    if (currentState.room) {
      this.socket.emit('selectCard', { 
        roomCode: currentState.room.code, 
        card 
      });
    }
  }

  revealCards(): void {
    const currentState = this.gameStateSubject.value;
    if (currentState.room) {
      this.socket.emit('revealCards', { 
        roomCode: currentState.room.code 
      });
    }
  }

  resetGame(): void {
    const currentState = this.gameStateSubject.value;
    if (currentState.room) {
      this.socket.emit('resetGame', { 
        roomCode: currentState.room.code 
      });
    }
  }

  setCurrentUser(user: User): void {
    this.updateGameState({ currentUser: user });
  }

  getCurrentGameState(): GameState {
    return this.gameStateSubject.value;
  }
  clearError(): void {
    this.errorSubject.next(null);
  }

  forceLeaveRoom(): void {
    // Force clear all state without waiting for server response
    this.updateGameState({ 
      room: null, 
      currentUser: null, 
      gamePhase: 'voting' 
    });
    this.resultsSubject.next(null);
  }// Legacy methods for backward compatibility with existing components
  // These will be updated to use the real WebSocket methods
  simulateCreateRoom(userName: string): Room {
    this.connect(userName);
    this.createRoom();
    // Return a temporary room - real room will be received via socket
    return {
      id: 'temp',
      code: 'TEMP',
      users: [],
      isRevealed: false,
      createdAt: new Date()
    };
  }

  simulateJoinRoom(roomCode: string, userName: string): Room | null {
    this.connect(userName);
    this.joinRoom(roomCode);
    // Return a temporary room - real room will be received via socket
    return {
      id: 'temp',
      code: roomCode.toUpperCase(),
      users: [],
      isRevealed: false,
      createdAt: new Date()
    };
  }

  simulateSelectCard(cardValue: number): void {
    this.selectCard(cardValue);
  }

  simulateRevealCards(): void {
    this.revealCards();
  }

  simulateResetGame(): void {
    this.resetGame();
  }
}
