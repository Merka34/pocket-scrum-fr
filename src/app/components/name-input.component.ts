import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-name-input',
  template: `
    <div class="name-input-container">
      <div class="card">
        <h1>Pocket Scrum</h1>
        <p>Bienvenido al poker de estimación para SCRUM</p>
        
        <form (ngSubmit)="onSubmit()" #nameForm="ngForm">
          <div class="form-group">
            <label for="userName">Ingresa tu nombre:</label>
            <input 
              type="text" 
              id="userName"
              name="userName"
              [(ngModel)]="userName" 
              required
              minlength="2"
              maxlength="20"
              placeholder="Tu nombre..."
              class="form-control"
              #nameInput="ngModel">
            
            <div class="error-message" *ngIf="nameInput.invalid && nameInput.touched">
              <small *ngIf="nameInput.errors?.['required']">El nombre es requerido</small>
              <small *ngIf="nameInput.errors?.['minlength']">El nombre debe tener al menos 2 caracteres</small>
              <small *ngIf="nameInput.errors?.['maxlength']">El nombre no puede tener más de 20 caracteres</small>
            </div>
          </div>
          
          <button 
            type="submit" 
            class="btn-primary"
            [disabled]="nameForm.invalid">
            Continuar
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .name-input-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .card {
      background: white;
      padding: 2rem;
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      text-align: center;
      min-width: 400px;
      max-width: 500px;
    }

    h1 {
      color: #333;
      margin-bottom: 0.5rem;
      font-size: 2.5rem;
      font-weight: bold;
    }

    p {
      color: #666;
      margin-bottom: 2rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
      text-align: left;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 2px solid #e1e5e9;
      border-radius: 6px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
      box-sizing: border-box;
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

    .error-message {
      margin-top: 0.5rem;
    }

    .error-message small {
      color: #e74c3c;
      font-size: 0.875rem;
    }
  `]
})
export class NameInputComponent implements OnInit {
  userName: string = '';

  constructor(
    private router: Router,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    // Verificar si ya existe un nombre guardado
    const savedName = this.storageService.getUserName();
    if (savedName) {
      this.router.navigate(['/lobby']);
    }
  }

  onSubmit(): void {
    if (this.userName.trim()) {
      this.storageService.saveUserName(this.userName.trim());
      this.router.navigate(['/lobby']);
    }
  }
}
