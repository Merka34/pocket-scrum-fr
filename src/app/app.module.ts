import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { NameInputComponent } from './components/name-input.component';
import { LobbyComponent } from './components/lobby.component';
import { GameComponent } from './components/game.component';

const routes: Routes = [
  { path: '', component: NameInputComponent },
  { path: 'lobby', component: LobbyComponent },
  { path: 'game', component: GameComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  declarations: [
    AppComponent,
    NameInputComponent,
    LobbyComponent,
    GameComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    RouterModule.forRoot(routes)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
