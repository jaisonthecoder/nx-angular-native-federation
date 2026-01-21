import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { ButtonComponent } from '@angola-workspace/shared/ui-components';

@Component({
  standalone: true,
  imports: [RouterModule, LayoutComponent, ButtonComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'jul-portal';

  onTestButtonClick() {
    console.log('Shell App - Button clicked!');
    alert('Shell App - Shared button is working!');
  }
}

export { App as AppComponent };

export default App;
