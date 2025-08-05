import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly USER_NAME_KEY = 'pocket_scrum_username';
  private readonly ROOM_DATA_KEY = 'pocket_scrum_room_data';



  // Métodos para el nombre de usuario
  saveUserName(name: string): void {
    localStorage.setItem(this.USER_NAME_KEY, name);
  }

  getUserName(): string | null {
    return localStorage.getItem(this.USER_NAME_KEY);
  }

  clearUserName(): void {
    localStorage.removeItem(this.USER_NAME_KEY);
  }

  // Métodos para datos de la sala
  saveRoomData(roomCode: string, userId: string): void {
    const roomData = {
      roomCode,
      userId,
      timestamp: Date.now()
    };
    localStorage.setItem(this.ROOM_DATA_KEY, JSON.stringify(roomData));
  }

  getRoomData(): { roomCode: string; userId: string; timestamp: number } | null {
    const data = localStorage.getItem(this.ROOM_DATA_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (error) {
        console.error('Error parsing room data:', error);
        this.clearRoomData();
      }
    }
    return null;
  }

  clearRoomData(): void {
    localStorage.removeItem(this.ROOM_DATA_KEY);
  }
}
