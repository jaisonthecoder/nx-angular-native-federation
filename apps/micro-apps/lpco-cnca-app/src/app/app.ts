import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NxWelcome } from './nx-welcome';
import { ButtonComponent } from '@angola-workspace/shared/ui-components';

@Component({
  standalone: true,
  imports: [NxWelcome, RouterModule, ButtonComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'lpco-cnca-app';

  onTestButtonClick() {
    console.log('Micro App - Button clicked!');
    alert('Micro App - Shared button is working!');
  }
}

export { App as AppComponent };

export default App;
